"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { LookId } from "@/lib/game/types";
import { addPlayerGuests, createRealisticHuman, type CrowdPerson } from "@/lib/game/humanModel";
import { naira } from "@/lib/game/format";
import { attachSceneCameraControls } from "./sceneCameraControls";

// Warehouse Sign Canvas Texture
function createWarehouseSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "#1e293b";
  ctx.fillRect(0, 0, 512, 128);

  ctx.strokeStyle = "#eab308";
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 116);

  ctx.fillStyle = "#eab308";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("UZOR AVENUE LOGISTICS & DISTRIBUTION HUB", 256, 40);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 38px sans-serif";
  ctx.fillText("THE WAREHOUSE OWERRI", 256, 88);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

// Helper to build a detailed 3D yellow forklift with forks, mast, roll cage, wheels
function buildDetailedForklift(): THREE.Group {
  const group = new THREE.Group();

  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.3, metalness: 0.6 }); // Industrial safety yellow
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.2 });
  const blackMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  const box = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // Main chassis & engine compartment
  box(1.4, 0.75, 2.2, yellowMat, 0, 0.65, -0.2);
  // Heavy counterweight rear
  box(1.36, 0.68, 0.6, darkMat, 0, 0.68, -1.25);

  // Driver cabin floor & seat
  box(1.1, 0.12, 1.1, darkMat, 0, 0.72, 0.2);
  box(0.5, 0.5, 0.48, blackMat, 0, 1.0, -0.15); // Driver seat

  // Overhead Safety Roll Cage (4 Pillars + Roof Grid)
  const cagePillarGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8);
  for (const cx of [-0.55, 0.55]) {
    for (const cz of [-0.65, 0.65]) {
      const pillar = new THREE.Mesh(cagePillarGeom, darkMat);
      pillar.position.set(cx, 1.45, cz);
      group.add(pillar);
    }
  }
  box(1.2, 0.06, 1.4, darkMat, 0, 2.15, 0); // Cage roof

  // Vertical Lift Mast (Dual vertical steel beams)
  box(0.12, 2.6, 0.12, metalMat, -0.5, 1.4, 1.1);
  box(0.12, 2.6, 0.12, metalMat, 0.5, 1.4, 1.1);
  box(1.12, 0.12, 0.08, metalMat, 0, 0.6, 1.1);
  box(1.12, 0.12, 0.08, metalMat, 0, 2.4, 1.1);

  // Fork Carriage & Lifting Forks
  const forkCarriage = box(1.0, 0.45, 0.08, darkMat, 0, 0.85, 1.18);
  // Left and right forks
  box(0.1, 0.05, 1.2, metalMat, -0.32, 0.65, 1.76);
  box(0.1, 0.05, 1.2, metalMat, 0.32, 0.65, 1.76);

  // Pallet of Cargo boxes lifted on the forks
  box(1.0, 0.1, 1.0, new THREE.MeshLambertMaterial({ color: 0x92400e }), 0, 0.72, 1.76); // Wooden pallet
  box(0.42, 0.42, 0.42, new THREE.MeshLambertMaterial({ color: 0xd97706 }), -0.22, 0.98, 1.6); // Cardboard Box 1
  box(0.42, 0.42, 0.42, new THREE.MeshLambertMaterial({ color: 0xb45309 }), 0.22, 0.98, 1.6);  // Cardboard Box 2
  box(0.42, 0.42, 0.42, new THREE.MeshLambertMaterial({ color: 0xd97706 }), 0, 0.98, 1.95);    // Cardboard Box 3

  // Steering wheel & Dash
  box(0.5, 0.25, 0.2, darkMat, 0, 1.15, 0.65);
  const swGeom = new THREE.TorusGeometry(0.14, 0.025, 6, 12);
  swGeom.rotateX(Math.PI / 4);
  const sw = new THREE.Mesh(swGeom, blackMat);
  sw.position.set(0, 1.28, 0.6);
  group.add(sw);

  // Headlights
  box(0.18, 0.12, 0.06, lightMat, -0.48, 1.1, 0.88);
  box(0.18, 0.12, 0.06, lightMat, 0.48, 1.1, 0.88);

  // 4 Forklift Solid Rubber Wheels
  const wheelGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16);
  wheelGeom.rotateZ(Math.PI / 2);
  for (const wx of [-0.68, 0.68]) {
    for (const wz of [-0.75, 0.75]) {
      const wheel = new THREE.Mesh(wheelGeom, blackMat);
      wheel.position.set(wx, 0.32, wz);
      wheel.castShadow = true;
      group.add(wheel);
    }
  }

  return group;
}

export function WarehouseScene({
  look = "chidi",
  username = "Logistics Officer",
  onWorkShift,
  people = [],
  selfId,
}: {
  look?: LookId;
  username?: string;
  onWorkShift?: () => void;
  people?: CrowdPerson[];
  selfId?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const rig = useRef({ yaw: 0.38, zoom: 1.15 });

  const [toast, setToast] = useState<string | null>(null);
  const [inventoryCount, setInventoryCount] = useState(48);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const root = host.current;
    if (!root) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(root.clientWidth, root.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    root.appendChild(renderer.domElement);

    const warehouse = new THREE.Group();
    scene.add(warehouse);

    // ─────────────────────────────────────────────────────────────
    // LIGHTING: Industrial High-Bay Work Lights
    // ─────────────────────────────────────────────────────────────
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.7);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    dirLight.position.set(8, 15, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Helper for box geometry
    const box = (
      w: number,
      h: number,
      d: number,
      color: number,
      x: number,
      y: number,
      z: number,
      cast = true
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshLambertMaterial({ color })
      );
      mesh.position.set(x, y, z);
      mesh.castShadow = cast;
      mesh.receiveShadow = true;
      warehouse.add(mesh);
      return mesh;
    };

    // ─────────────────────────────────────────────────────────────
    // 1. WAREHOUSE CONCRETE FLOOR & CUTAWAY WALLS (NO ROOF)
    // ─────────────────────────────────────────────────────────────
    // Polished industrial concrete floor (18m wide x 16m deep)
    box(18, 0.12, 16, 0x334155, 0, -0.06, 0, false);

    // Yellow safety lane stripes on floor
    box(0.18, 0.02, 14, 0xeab308, -1.8, 0.01, 0, false);
    box(0.18, 0.02, 14, 0xeab308, 1.8, 0.01, 0, false);
    box(3.6, 0.02, 0.18, 0xeab308, 0, 0.01, 4.5, false);

    // Low Cutaway Perimeter Walls (height 3.2m with NO roof for elevated view)
    box(18, 3.2, 0.3, 0x1e293b, 0, 1.6, -7.85); // Back Wall
    box(0.3, 3.2, 16, 0x1e293b, -8.85, 1.6, 0);  // Left Wall
    box(0.3, 3.2, 16, 0x1e293b, 8.85, 1.6, 0);   // Right Wall

    // Warehouse Sign Header on Back Wall
    const signTex = createWarehouseSignTexture();
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 2.1), new THREE.MeshBasicMaterial({ map: signTex }));
    sign.position.set(0, 3.2, -7.68);
    warehouse.add(sign);

    // Industrial Loading Bay Roll-Up Doors on Back Wall
    for (const bx of [-5.2, 5.2]) {
      box(3.2, 3.2, 0.12, 0x475569, bx, 1.6, -7.75); // Corrugated door
      // Yellow hazard frame
      box(3.4, 0.12, 0.14, 0xeab308, bx, 3.26, -7.74);
      box(0.12, 3.2, 0.14, 0xeab308, bx - 1.65, 1.6, -7.74);
      box(0.12, 3.2, 0.14, 0xeab308, bx + 1.65, 1.6, -7.74);
    }

    // ─────────────────────────────────────────────────────────────
    // 2. HIGH-BAY INDUSTRIAL PALLET RACKING SYSTEMS (Left & Right)
    // ─────────────────────────────────────────────────────────────
    const makeRack = (rx: number, rz: number, rw: number, rd: number) => {
      const rackMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 }); // Blue industrial steel
      const beamMat = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.7, roughness: 0.3 }); // Orange crossbeams

      // 4 Vertical corner posts
      for (const px of [-rw / 2 + 0.1, rw / 2 - 0.1]) {
        for (const pz of [-rd / 2 + 0.1, rd / 2 - 0.1]) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.4, 0.1), rackMat);
          post.position.set(rx + px, 2.2, rz + pz);
          post.castShadow = true;
          warehouse.add(post);
        }
      }

      // 3 Shelving tier beam levels
      for (let tier = 0; tier < 3; tier++) {
        const ty = 0.85 + tier * 1.35;
        // Orange support beams
        const b1 = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.08, 0.08), beamMat);
        b1.position.set(rx, ty, rz - rd / 2 + 0.1);
        const b2 = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.08, 0.08), beamMat);
        b2.position.set(rx, ty, rz + rd / 2 - 0.1);
        warehouse.add(b1, b2);

        // Pallets & Cargo Boxes on this shelf tier
        for (let p = 0; p < 2; p++) {
          const px = rx - rw / 4 + p * (rw / 2);
          // Wooden pallet
          box(1.2, 0.08, rd - 0.2, 0x78350f, px, ty + 0.06, rz);

          // Cardboard cartons / drums on pallet
          if ((tier + p) % 2 === 0) {
            // Cardboard stack
            box(0.5, 0.45, 0.45, 0xd97706, px - 0.25, ty + 0.32, rz);
            box(0.5, 0.45, 0.45, 0xb45309, px + 0.25, ty + 0.32, rz);
            box(0.48, 0.4, 0.48, 0xd97706, px, ty + 0.72, rz);
          } else {
            // Industrial Steel Drums
            const drumGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.65, 12);
            const drumMat = new THREE.MeshStandardMaterial({ color: tier === 1 ? 0x15803d : 0x1d4ed8, metalness: 0.6 });
            for (const dx of [-0.26, 0.26]) {
              const drum = new THREE.Mesh(drumGeom, drumMat);
              drum.position.set(px + dx, ty + 0.4, rz);
              drum.castShadow = true;
              warehouse.add(drum);
            }
          }
        }
      }
    };

    // Left high-bay racks
    makeRack(-5.6, -2.5, 3.8, 1.6);
    makeRack(-5.6, 2.5, 3.8, 1.6);

    // Right high-bay racks
    makeRack(5.6, -2.5, 3.8, 1.6);
    makeRack(5.6, 2.5, 3.8, 1.6);

    // ─────────────────────────────────────────────────────────────
    // 3. DETAILED 3D FORKLIFT VEHICLE IN CENTRAL AISLE
    // ─────────────────────────────────────────────────────────────
    const forklift = buildDetailedForklift();
    forklift.position.set(0.2, 0, -1.2);
    forklift.rotation.y = -0.3; // Angled in central lane
    warehouse.add(forklift);

    // ─────────────────────────────────────────────────────────────
    // 4. WAREHOUSE MANAGER OFFICE & KELECHI WARE NPC (Front-Left)
    // ─────────────────────────────────────────────────────────────
    // Office table with computer and clipboard
    box(2.2, 0.85, 1.1, 0x475569, -6.2, 0.42, 5.8);
    box(0.4, 0.02, 0.3, 0xd4d4d8, -6.5, 0.88, 5.8); // Laptop
    box(0.4, 0.26, 0.02, 0x1e293b, -6.5, 1.02, 5.92); // Screen
    box(0.25, 0.02, 0.35, 0x78350f, -5.8, 0.88, 5.8); // Inventory clipboard

    // Warehouse Manager: Kelechi Ware NPC
    const manager = createRealisticHuman({
      lookId: "ibe",
      customShirt: 0xf97316, // Orange high-vis vest
      customPants: 0x1e293b,
      seated: false,
      scale: 0.98,
    });
    manager.position.set(-6.2, 0, 6.6);
    manager.rotation.y = Math.PI; // Facing into warehouse
    warehouse.add(manager);

    // Dock Worker NPC moving boxes
    const worker = createRealisticHuman({
      lookId: "emeka",
      customShirt: 0xeab308, // Yellow high-vis shirt
      customPants: 0x0f172a,
      seated: false,
      scale: 0.95,
    });
    worker.position.set(4.8, 0, 0.2);
    worker.rotation.y = -Math.PI / 2;
    warehouse.add(worker);

    // ─────────────────────────────────────────────────────────────
    // 5. REALISTIC PLAYER CHARACTER
    // ─────────────────────────────────────────────────────────────
    const playerAvatar = createRealisticHuman({
      lookId: look,
      seated: false,
      scale: 0.98,
    });
    playerAvatar.position.set(-0.6, 0, 4.2);
    playerAvatar.rotation.y = 0.2; // Facing into forklift & aisle
    warehouse.add(playerAvatar);
    addPlayerGuests(warehouse, people, selfId, { x: -0.6, z: 3.2, rot: 0.2 });

    // ─────────────────────────────────────────────────────────────
    // ELEVATED ISOMETRIC CAMERA & RENDER LOOP
    // ─────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(35, root.clientWidth / root.clientHeight, 0.1, 100);
    const target = new THREE.Vector3(0, 1.2, 0);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);

      const r = 16.5 / rig.current.zoom;
      const phi = 0.64; // High angle elevated view
      const theta = rig.current.yaw;

      camera.position.set(
        target.x + r * Math.sin(phi) * Math.sin(theta),
        target.y + r * Math.cos(phi) + 2.5,
        target.z + r * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(target);

      renderer.render(scene, camera);
    };
    animate();

    // Attach touch pinch-and-zoom / shrink, mouse wheel zoom, and drag rotation
    const detachControls = attachSceneCameraControls(root, rig, {
      minZoom: 0.4,
      maxZoom: 7.5,
      zoomSpeed: 0.1,
    });

    const onResize = () => {
      if (!root) return;
      camera.aspect = root.clientWidth / root.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(root.clientWidth, root.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      detachControls();
      renderer.dispose();
      if (root.contains(renderer.domElement)) {
        root.removeChild(renderer.domElement);
      }
    };
  }, [look, people.map((person) => person.id).join("|"), selfId]);

  const dolly = (factor: number) => {
    rig.current.zoom = Math.max(0.4, Math.min(7.5, rig.current.zoom * factor));
  };

  const turn = (direction: number) => {
    rig.current.yaw += direction * 0.35;
  };

  const handleInspectInventory = () => {
    showToast(`📦 Inventory Audit: ${inventoryCount} pallets on steel racks. Electronics, building materials, and beverages accounted for.`);
  };

  const handleForkliftOperation = () => {
    setInventoryCount((c) => c + 4);
    showToast("🚜 Beep! Beep! Forklift loaded 4 new cargo pallets onto Bay 2 racking. Well done!");
    if (onWorkShift) {
      onWorkShift();
    }
  };

  return (
    <div className="absolute inset-0 bg-[#0a0f18] text-[#f8fafc] overflow-hidden">
      {/* 3D WebGL Canvas */}
      <div
        ref={host}
        className="absolute inset-0 touch-none"
      />

      {/* Warehouse Title Header */}
      <div className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-2xl bg-[#09111e]/90 px-3.5 py-2 border border-[#eab308]/40 shadow-xl backdrop-blur-md">
        <span className="text-xl">🏭</span>
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#fde047]">
            The Warehouse Logistics Hub
          </h2>
          <p className="text-[10px] text-[#94a3b8]">
            Uzor Avenue · Kelechi Ware · {username} · In Stock: {inventoryCount} Pallets
          </p>
        </div>
      </div>

      {/* Warehouse Quick Actions (Middle-Left) */}
      <div className="absolute left-3 top-20 z-20 flex flex-col gap-2 max-w-[190px]">
        <button
          type="button"
          onClick={handleInspectInventory}
          className="flex items-center gap-2 rounded-2xl bg-[#0f172a]/90 px-3.5 py-2.5 text-xs font-bold text-white shadow-xl backdrop-blur-md border border-[#eab308]/50 hover:bg-[#1e293b] active:scale-95 transition-all"
        >
          <span>📋</span>
          <span>Inspect Inventory</span>
        </button>

        <button
          type="button"
          onClick={handleForkliftOperation}
          className="flex items-center gap-2 rounded-2xl bg-[#eab308] px-3.5 py-2.5 text-xs font-bold text-[#0f172a] shadow-xl backdrop-blur-md border border-[#fde047] hover:bg-[#ca8a04] active:scale-95 transition-all"
        >
          <span>🚜</span>
          <span>Operate Forklift</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toast ? (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 max-w-md rounded-2xl bg-[#0b1324]/98 border border-[#eab308] px-4 py-2.5 text-xs font-semibold text-[#fef08a] shadow-2xl backdrop-blur-lg animate-bounce">
          {toast}
        </div>
      ) : null}

      {/* Compact Zoom & Rotate Controls (Top-Right) */}
      <div className="absolute right-2.5 top-3 z-30 flex flex-col gap-1">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => dolly(1.2)}
          className="grid h-8 w-8 place-items-center rounded-full bg-white text-base font-bold text-[#0f172a] shadow-lg active:scale-90 transition-transform"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => dolly(1 / 1.2)}
          className="grid h-8 w-8 place-items-center rounded-full bg-white text-base font-bold text-[#0f172a] shadow-lg active:scale-90 transition-transform"
        >
          −
        </button>
        <button
          type="button"
          aria-label="Rotate left"
          onClick={() => turn(1)}
          className="mt-1 grid h-8 w-8 place-items-center rounded-full bg-white text-base font-bold text-[#0f172a] shadow-lg active:scale-90 transition-transform"
        >
          ↺
        </button>
        <button
          type="button"
          aria-label="Rotate right"
          onClick={() => turn(-1)}
          className="grid h-8 w-8 place-items-center rounded-full bg-white text-base font-bold text-[#0f172a] shadow-lg active:scale-90 transition-transform"
        >
          ↻
        </button>
      </div>
    </div>
  );
}
