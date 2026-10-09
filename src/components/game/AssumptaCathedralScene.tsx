"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { makeRenderer } from "@/lib/game/renderQuality";
import type { LookId } from "@/lib/game/types";
import { addPlayerGuests, createRealisticHuman, type CrowdPerson } from "@/lib/game/humanModel";
import { attachSceneCameraControls } from "./sceneCameraControls";

// Stained glass canvas texture generator
function createStainedGlassTexture(theme: "virgin_mary" | "cross" | "chalice"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Deep gothic backdrop
  ctx.fillStyle = "#0c1829";
  ctx.fillRect(0, 0, 256, 512);

  // Gothic arch frame
  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(20, 500);
  ctx.lineTo(20, 160);
  ctx.arc(128, 160, 108, Math.PI, 0, false);
  ctx.lineTo(236, 500);
  ctx.closePath();
  ctx.stroke();

  // Vibrant stained glass mosaic panes
  const colors = theme === "virgin_mary"
    ? ["#2563eb", "#38bdf8", "#fbbf24", "#f43f5e", "#10b981", "#818cf8"]
    : theme === "cross"
    ? ["#dc2626", "#f59e0b", "#e0b15a", "#3b82f6", "#9333ea", "#14b8a6"]
    : ["#eab308", "#f97316", "#ef4444", "#06b6d4", "#6366f1", "#10b981"];

  // Segment grid
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 4; c++) {
      const x = 32 + c * 48;
      const y = 80 + r * 50;
      ctx.fillStyle = colors[(r * 4 + c) % colors.length];
      ctx.globalAlpha = 0.85;
      ctx.fillRect(x + 2, y + 2, 44, 46);
    }
  }

  // Sacred Symbol Center
  ctx.globalAlpha = 1.0;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#fde047";
  ctx.shadowBlur = 18;

  if (theme === "cross") {
    // Cross
    ctx.fillStyle = "#fde047";
    ctx.fillRect(116, 140, 24, 200);
    ctx.fillRect(72, 190, 112, 24);
  } else if (theme === "virgin_mary") {
    // Holy Mother halo & silhouette
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.arc(128, 190, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.moveTo(128, 220);
    ctx.lineTo(80, 360);
    ctx.lineTo(176, 360);
    ctx.closePath();
    ctx.fill();
  } else {
    // Sacred Chalice
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(128, 240, 42, 0, Math.PI, false);
    ctx.fill();
    ctx.fillRect(122, 280, 12, 60);
    ctx.fillRect(96, 340, 64, 16);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

export function AssumptaCathedralScene({
  look = "chidi",
  username = "Worshipper",
  people = [],
  selfId,
}: {
  look?: LookId;
  username?: string;
  people?: CrowdPerson[];
  selfId?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const rig = useRef({ yaw: 0.05, zoom: 1.15 });

  const [isSitting, setIsSitting] = useState(false);
  const [candlesLit, setCandlesLit] = useState(3);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const root = host.current;
    if (!root) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a101d);

    const renderer = makeRenderer({ alpha: false });
    renderer.setSize(root.clientWidth, root.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    root.appendChild(renderer.domElement);

    // Cathedral Sanctuary Group
    const cathedral = new THREE.Group();
    scene.add(cathedral);

    // ─────────────────────────────────────────────────────────────
    // LIGHTING: Warm Sacred Candlelight & Sunbeams through Glass
    // ─────────────────────────────────────────────────────────────
    const hemiLight = new THREE.HemisphereLight(0xfff7ed, 0x1e293b, 0.7);
    scene.add(hemiLight);

    const sunBeam = new THREE.DirectionalLight(0xfef08a, 1.4);
    sunBeam.position.set(8, 14, 6);
    sunBeam.castShadow = true;
    sunBeam.shadow.mapSize.width = 1024;
    sunBeam.shadow.mapSize.height = 1024;
    sunBeam.shadow.camera.near = 0.5;
    sunBeam.shadow.camera.far = 35;
    sunBeam.shadow.camera.left = -10;
    sunBeam.shadow.camera.right = 10;
    sunBeam.shadow.camera.top = 10;
    sunBeam.shadow.camera.bottom = -10;
    scene.add(sunBeam);

    // Warm sanctuary focal light over altar
    const altarLight = new THREE.PointLight(0xffedd5, 1.6, 14);
    altarLight.position.set(0, 3.8, -5.5);
    scene.add(altarLight);

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
      cathedral.add(mesh);
      return mesh;
    };

    // ─────────────────────────────────────────────────────────────
    // FLOOR & CUTAWAY WALLS (Open top, NO ROOF - clearly viewable)
    // ─────────────────────────────────────────────────────────────
    // Polished Cream Marble Cathedral Floor (14m wide x 20m long)
    box(14, 0.15, 20, 0xf4efe4, 0, -0.075, 0, false);

    // Burgundy / Gold Velvet Center Aisle Runner Carpet
    box(2.4, 0.02, 16.5, 0x831843, 0, 0.01, 1.8, false);
    box(2.6, 0.015, 16.5, 0xd4af37, 0, 0.008, 1.8, false);

    // Low Cutaway Perimeter Walls (height 3.2m with NO ceiling for open visibility)
    box(14, 3.2, 0.35, 0x1e293b, 0, 1.6, -9.8); // Back Sanctuary Wall
    box(0.35, 3.2, 20, 0x1e293b, -6.8, 1.6, 0); // Left Wall
    box(0.35, 3.2, 20, 0x1e293b, 6.8, 1.6, 0);  // Right Wall
    box(5.0, 1.8, 0.35, 0x1e293b, -4.3, 0.9, 9.8); // Front entrance stub left
    box(5.0, 1.8, 0.35, 0x1e293b, 4.3, 0.9, 9.8);  // Front entrance stub right

    // ─────────────────────────────────────────────────────────────
    // STAINED GLASS WINDOW PANELS ON SIDE WALLS
    // ─────────────────────────────────────────────────────────────
    const makeWindow = (x: number, z: number, rotY: number, theme: "virgin_mary" | "cross" | "chalice") => {
      const tex = createStainedGlassTexture(theme);
      const glassMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
      const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.4), glassMat);
      win.position.set(x, 2.6, z);
      win.rotation.y = rotY;
      cathedral.add(win);

      // Stone window frame trim
      box(0.15, 4.6, 2.4, 0xd4af37, x < 0 ? x - 0.05 : x + 0.05, 2.6, z);
    };

    // Left wall stained glass windows
    makeWindow(-6.6, -4.5, Math.PI / 2, "virgin_mary");
    makeWindow(-6.6, 0, Math.PI / 2, "cross");
    makeWindow(-6.6, 4.5, Math.PI / 2, "chalice");

    // Right wall stained glass windows
    makeWindow(6.6, -4.5, -Math.PI / 2, "chalice");
    makeWindow(6.6, 0, -Math.PI / 2, "cross");
    makeWindow(6.6, 4.5, -Math.PI / 2, "virgin_mary");

    // ─────────────────────────────────────────────────────────────
    // SANCTUARY PLATFORM & HIGH ALTAR
    // ─────────────────────────────────────────────────────────────
    // Raised 3-Tier Marble Altar Steps
    box(10, 0.2, 5.0, 0xe2e8f0, 0, 0.1, -6.8);
    box(8.5, 0.2, 4.0, 0xf1f5f9, 0, 0.3, -7.1);
    box(7.0, 0.2, 3.2, 0xffffff, 0, 0.5, -7.4);

    // High Altar Table
    box(3.8, 1.0, 1.4, 0xf8fafc, 0, 1.1, -7.2);
    // Gold Altar Trim
    box(3.9, 0.08, 1.5, 0xd4af37, 0, 1.62, -7.2);

    // Altar Cloth (Burgundy with gold cross)
    box(1.8, 0.8, 1.44, 0x831843, 0, 1.1, -7.2);

    // Tabernacle in Center
    box(0.65, 0.85, 0.55, 0xd4af37, 0, 2.05, -7.4);

    // Large Golden Crucifix mounted above high altar on back wall
    const crossVert = box(0.24, 3.2, 0.12, 0xd4af37, 0, 4.6, -9.6);
    const crossHoriz = box(1.8, 0.24, 0.12, 0xd4af37, 0, 5.2, -9.6);
    crossVert.castShadow = false;
    crossHoriz.castShadow = false;

    // Corpus / Christ silhouette on cross
    box(0.28, 1.4, 0.18, 0xfef08a, 0, 4.7, -9.5);
    box(1.2, 0.22, 0.18, 0xfef08a, 0, 5.1, -9.5);

    // Tall Altar Candles
    for (const sx of [-1.5, -0.9, 0.9, 1.5]) {
      // Golden candlestick holder
      box(0.12, 0.45, 0.12, 0xd4af37, sx, 1.85, -7.2);
      // White candle body
      box(0.06, 0.5, 0.06, 0xffffff, sx, 2.25, -7.2);
      // Flickering yellow flame
      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xfde047 })
      );
      flame.scale.set(0.7, 1.8, 0.7);
      flame.position.set(sx, 2.55, -7.2);
      cathedral.add(flame);
    }

    // ─────────────────────────────────────────────────────────────
    // AMBO / PULPIT WITH PRIEST FATHER UGO
    // ─────────────────────────────────────────────────────────────
    // Wooden Ambo
    box(0.9, 1.25, 0.8, 0x78350f, -2.5, 1.1, -5.6);
    box(0.96, 0.08, 0.86, 0xd4af37, -2.5, 1.74, -5.6);

    // Lectionary / Holy Bible on ambo
    box(0.42, 0.06, 0.32, 0xffffff, -2.5, 1.8, -5.6);
    box(0.44, 0.07, 0.04, 0x831843, -2.5, 1.8, -5.6); // Ribbon

    // Priest: Father Ugo standing at pulpit with white cassock & green liturgical stole
    const priest = createRealisticHuman({
      lookId: "ibe",
      customShirt: 0xffffff, // White chasuble
      customPants: 0x1e293b,
      seated: false,
      scale: 1.0,
    });
    priest.position.set(-2.5, 0.6, -6.3);
    priest.rotation.y = 0.25; // Facing out toward congregation
    cathedral.add(priest);

    // Green liturgical stole on priest
    const stoleL = box(0.08, 0.75, 0.03, 0x15803d, -2.58, 1.45, -6.18);
    const stoleR = box(0.08, 0.75, 0.03, 0x15803d, -2.42, 1.45, -6.18);
    stoleL.castShadow = false;
    stoleR.castShadow = false;

    // ─────────────────────────────────────────────────────────────
    // VOTIVE CANDLE OFFERING STAND (Left Side)
    // ─────────────────────────────────────────────────────────────
    // Stand table
    box(1.6, 0.9, 0.8, 0x475569, -4.8, 0.45, -1.8);
    // Votive candles in red glass cups
    for (let cr = 0; cr < 3; cr++) {
      for (let cc = 0; cc < 5; cc++) {
        const cx = -5.3 + cc * 0.25;
        const cz = -2.1 + cr * 0.25;
        box(0.1, 0.12, 0.1, 0xdc2626, cx, 0.96, cz);
        const candleFlame = new THREE.Mesh(
          new THREE.SphereGeometry(0.03, 6, 6),
          new THREE.MeshBasicMaterial({ color: 0xfde047 })
        );
        candleFlame.position.set(cx, 1.05, cz);
        cathedral.add(candleFlame);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // WOODEN CATHEDRAL PEWS (4 Rows Left & Right)
    // ─────────────────────────────────────────────────────────────
    const makePew = (px: number, pz: number) => {
      const pewW = 3.6;
      // Bench seat
      box(pewW, 0.08, 0.48, 0x5c2b14, px, 0.48, pz);
      // Backrest
      box(pewW, 0.62, 0.07, 0x5c2b14, px, 0.78, pz - 0.22);
      // Left & Right end panels
      box(0.09, 0.85, 0.64, 0x3d1a0a, px - pewW / 2, 0.46, pz - 0.05);
      box(0.09, 0.85, 0.64, 0x3d1a0a, px + pewW / 2, 0.46, pz - 0.05);
      // Kneeler on front
      box(pewW - 0.2, 0.06, 0.18, 0x78350f, px, 0.16, pz + 0.32);
    };

    for (let r = 0; r < 4; r++) {
      const pz = -1.2 + r * 2.2;
      makePew(-3.4, pz); // Left pew row
      makePew(3.4, pz);  // Right pew row
    }

    // ─────────────────────────────────────────────────────────────
    // WORSHIPPER NPCS SEATED IN PEWS
    // ─────────────────────────────────────────────────────────────
    // Worshipper 1: Ada in Left Row 2
    const w1 = createRealisticHuman({
      lookId: "ada",
      customShirt: 0xf59e0b,
      customPants: 0x1e293b,
      seated: true,
      scale: 0.95,
    });
    w1.position.set(-3.6, 0.05, 1.0);
    w1.rotation.y = 0; // Facing altar
    cathedral.add(w1);

    // Worshipper 2: Emeka in Right Row 1
    const w2 = createRealisticHuman({
      lookId: "emeka",
      customShirt: 0x0284c7,
      customPants: 0x334155,
      seated: true,
      scale: 0.95,
    });
    w2.position.set(2.8, 0.05, -1.2);
    w2.rotation.y = 0; // Facing altar
    cathedral.add(w2);

    // Worshipper 3: Ngozi in Right Row 3
    const w3 = createRealisticHuman({
      lookId: "ngozi",
      customShirt: 0xec4899,
      customPants: 0x1e293b,
      seated: true,
      scale: 0.95,
    });
    w3.position.set(3.8, 0.05, 3.2);
    w3.rotation.y = 0; // Facing altar
    cathedral.add(w3);

    // ─────────────────────────────────────────────────────────────
    // PLAYER CHARACTER: DYNAMICALLY STANDING IN AISLE OR SEATED IN PEW
    // ─────────────────────────────────────────────────────────────
    const playerGroup = new THREE.Group();
    cathedral.add(playerGroup);

    const updatePlayerMesh = () => {
      while (playerGroup.children.length > 0) {
        playerGroup.remove(playerGroup.children[0]);
      }

      const playerAvatar = createRealisticHuman({
        lookId: look,
        seated: isSitting,
        scale: 0.98,
      });

      if (isSitting) {
        // Seated comfortably in Left Front Pew
        playerAvatar.position.set(-2.8, 0.05, -1.2);
        playerAvatar.rotation.y = 0; // Facing the altar
      } else {
        // Standing respectfully in the central aisle
        playerAvatar.position.set(0, 0, 1.8);
        playerAvatar.rotation.y = 0; // Facing altar
      }

      playerGroup.add(playerAvatar);
      addPlayerGuests(playerGroup, people, selfId, { x: isSitting ? -1.4 : 1.2, z: isSitting ? -1.2 : 1.8, rot: 0 });
    };
    updatePlayerMesh();

    // ─────────────────────────────────────────────────────────────
    // ELEVATED ISOMETRIC CAMERA & RENDER LOOP
    // ─────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(35, root.clientWidth / root.clientHeight, 0.1, 100);
    const target = new THREE.Vector3(0, 1.6, -1.5);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);

      const r = 16.5 / rig.current.zoom;
      const phi = 0.65; // Elevated high angle tilt (viewed from above)
      const theta = rig.current.yaw;

      camera.position.set(
        target.x + r * Math.sin(phi) * Math.sin(theta),
        target.y + r * Math.cos(phi) + 2.5,
        target.z + r * Math.sin(phi) * Math.cos(theta) + (isSitting ? -2.0 : 0)
      );
      camera.lookAt(target);

      renderer.render(scene, camera);
    };
    animate();

    // Attach touch pinch-and-zoom / shrink, mouse wheel zoom, and drag rotation
    const detachControls = attachSceneCameraControls(root, rig, {
      minZoom: 0.2,
      maxZoom: 10,
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
  }, [look, isSitting, people.map((person) => person.id).join("|"), selfId]);

  const dolly = (factor: number) => {
    rig.current.zoom = Math.max(0.4, Math.min(7.5, rig.current.zoom * factor));
  };

  const turn = (direction: number) => {
    rig.current.yaw += direction * 0.35;
  };

  const handleLightCandle = () => {
    setCandlesLit((c) => c + 1);
    showToast("🕯️ You lit a sacred prayer candle at the altar. You feel peace and clarity.");
  };

  const handlePriestBlessing = () => {
    showToast('✝️ Father Ugo prays: "May God bless your hustle and guide your steps in Owerri, my child."');
  };

  const toggleSitStand = () => {
    setIsSitting((prev) => {
      const next = !prev;
      showToast(next ? "🧎 You sat down in the cathedral pew to pray and meditate." : "🧍 You stood up in the cathedral aisle.");
      return next;
    });
  };

  return (
    <div className="absolute inset-0 bg-[#070b13] text-[#f8fafc] overflow-hidden">
      {/* 3D WebGL Canvas */}
      <div
        ref={host}
        className="absolute inset-0 touch-none"
      />

      {/* Cathedral Title Header */}
      <div className="absolute left-3 top-14 z-20 flex items-center gap-2 rounded-2xl bg-[#09111e]/90 px-3.5 py-2 border border-[#d4af37]/40 shadow-xl backdrop-blur-md">
        <span className="text-xl">⛪</span>
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#fde047]">
            Maria Assumpta Cathedral
          </h2>
          <p className="text-[10px] text-[#94a3b8]">
            Sanctuary &amp; Nave · Father Ugo · {username} ({isSitting ? "Seated in Pew" : "Standing"})
          </p>
        </div>
      </div>

      {/* Floating Action Buttons (Middle-Left & Bottom) */}
      <div className="absolute left-3 top-32 z-20 flex flex-col gap-2">
        {/* Sit in Pew / Stand Button */}
        <button
          type="button"
          onClick={toggleSitStand}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold shadow-2xl backdrop-blur-md border transition-all active:scale-95 ${
            isSitting
              ? "bg-[#d4af37] text-[#0f172a] border-[#fde047]"
              : "bg-[#0f172a]/90 text-white border-[#d4af37]/50 hover:bg-[#1e293b]"
          }`}
        >
          <span className="text-base">{isSitting ? "🧍" : "🧎"}</span>
          <span>{isSitting ? "Stand Up" : "Sit in Pew"}</span>
        </button>

        {/* Light Candle Button */}
        <button
          type="button"
          onClick={handleLightCandle}
          className="flex items-center gap-2 rounded-2xl bg-[#0f172a]/90 px-4 py-2.5 text-xs font-bold text-white shadow-2xl backdrop-blur-md border border-[#d4af37]/50 hover:bg-[#1e293b] active:scale-95 transition-all"
        >
          <span className="text-base">🕯️</span>
          <span>Light Candle ({candlesLit})</span>
        </button>

        {/* Father Ugo's Blessing Button */}
        <button
          type="button"
          onClick={handlePriestBlessing}
          className="flex items-center gap-2 rounded-2xl bg-[#0f172a]/90 px-4 py-2.5 text-xs font-bold text-white shadow-2xl backdrop-blur-md border border-[#d4af37]/50 hover:bg-[#1e293b] active:scale-95 transition-all"
        >
          <span className="text-base">✝️</span>
          <span>Father Ugo Blessing</span>
        </button>
      </div>

      {/* Interactive Toast Notification */}
      {toast ? (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 max-w-md rounded-2xl bg-[#0b1324]/98 border border-[#d4af37] px-4 py-2.5 text-xs font-semibold text-[#fef08a] shadow-2xl backdrop-blur-lg animate-bounce">
          {toast}
        </div>
      ) : null}

      {/* Compact Zoom & Rotate Controls (Top-Right) */}
      <div className="absolute right-2.5 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-1">
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
