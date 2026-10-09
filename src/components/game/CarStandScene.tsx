"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { LookId } from "@/lib/game/types";
import { addPlayerGuests, createRealisticHuman, type CrowdPerson } from "@/lib/game/humanModel";
import { naira } from "@/lib/game/format";
import { attachSceneCameraControls } from "./sceneCameraControls";
import { CAR_CATALOG, type CarDeal } from "@/lib/game/content";
import { loadRealCar, makeEnvironment, makeRealCar, realKindFor } from "./realCars";
import { buildDetailedCarMesh } from "./carModels";
import { photoForVehicle } from "./photoVehicles";

export type { CarDeal };
export { CAR_CATALOG };

// Showroom Dealership Banner Canvas Texture
function createDealershipBannerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "#090d16";
  ctx.fillRect(0, 0, 1024, 256);

  ctx.strokeStyle = "#e0b15a";
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 1004, 236);

  ctx.fillStyle = "#e0b15a";
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("⭐ OBI MOTORS & LUXURY AUTOMOBILES ⭐", 512, 58);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 56px sans-serif";
  ctx.fillText("OWERRI VIP CAR STAND & SHOWROOM", 512, 132);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "italic 24px sans-serif";
  ctx.fillText("Mercedes · Lexus · Toyota · Sports GT · Direct Tokunbo & Brand New", 512, 192);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

export function CarStandScene({
  look = "chidi",
  username = "Buyer",
  owned = [],
  pending = false,
  onBuy,
  people = [],
  selfId,
}: {
  look?: LookId;
  username?: string;
  owned?: string[];
  pending?: boolean;
  onBuy?: (carId: string) => void;
  people?: CrowdPerson[];
  selfId?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const rig = useRef({ yaw: 0.95, zoom: 1 });
  const turntableRef = useRef<THREE.Group | null>(null);

  const [selectedCar, setSelectedCar] = useState<CarDeal>(CAR_CATALOG[0]);
  const garage = owned;
  const [toast, setToast] = useState<string | null>(null);
  const [isTestDriving, setIsTestDriving] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const root = host.current;
    if (!root) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060911);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(root.clientWidth, root.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    root.appendChild(renderer.domElement);

    const showroom = new THREE.Group();
    scene.add(showroom);
    const envTarget = makeEnvironment(renderer, scene, 0.85);
    let alive = true;

    // ─────────────────────────────────────────────────────────────
    // LIGHTING: Showroom Spotlights & Reflections
    // ─────────────────────────────────────────────────────────────
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.7);
    scene.add(hemiLight);

    const mainSpot = new THREE.DirectionalLight(0xffffff, 1.6);
    mainSpot.position.set(6, 12, 8);
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.width = 1024;
    mainSpot.shadow.mapSize.height = 1024;
    scene.add(mainSpot);

    // Turntable center spotlight
    const stageSpot = new THREE.SpotLight(0x38bdf8, 2.2, 18, Math.PI / 4, 0.4);
    stageSpot.position.set(0, 8, 0);
    stageSpot.target.position.set(0, 0, 0);
    scene.add(stageSpot);
    scene.add(stageSpot.target);

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
      showroom.add(mesh);
      return mesh;
    };

    // ─────────────────────────────────────────────────────────────
    // SHOWROOM FLOOR & CUTAWAY WALLS (Open Top, NO ROOF)
    // ─────────────────────────────────────────────────────────────
    // Glossy showroom floor (18m wide x 16m deep)
    box(18, 0.12, 16, 0x0f172a, 0, -0.06, 0, false);
    box(18.2, 0.14, 0.14, 0xe0b15a, 0, 0.01, 7.9, false); // Front gold trim

    // Cutaway low walls (height 3.2m with NO roof for dollhouse overhead view)
    box(18, 3.2, 0.3, 0x1e293b, 0, 1.6, -7.85); // Back Wall
    box(0.3, 3.2, 16, 0x1e293b, -8.85, 1.6, 0);  // Left Wall
    box(0.3, 3.2, 16, 0x1e293b, 8.85, 1.6, 0);   // Right Wall

    // Dealership Billboard Banner on Back Wall
    const bannerTex = createDealershipBannerTexture();
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 2.6),
      new THREE.MeshBasicMaterial({ map: bannerTex })
    );
    banner.position.set(0, 3.2, -7.65);
    showroom.add(banner);

    // Blue neon line under banner
    const neonBar = new THREE.Mesh(
      new THREE.BoxGeometry(12.2, 0.08, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    neonBar.position.set(0, 1.85, -7.64);
    showroom.add(neonBar);

    // ─────────────────────────────────────────────────────────────
    // 1. REVOLVING SHOWROOM TURNTABLE (Center Feature Stage)
    // ─────────────────────────────────────────────────────────────
    const turntablePodium = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 3.8, 0.22, 32),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.3 })
    );
    turntablePodium.position.set(0, 0.11, 0);
    turntablePodium.receiveShadow = true;
    showroom.add(turntablePodium);

    // Outer neon glow ring around turntable
    const ringGeom = new THREE.RingGeometry(3.62, 3.75, 32);
    ringGeom.rotateX(-Math.PI / 2);
    const ring = new THREE.Mesh(ringGeom, new THREE.MeshBasicMaterial({ color: 0xe0b15a, side: THREE.DoubleSide }));
    ring.position.set(0, 0.23, 0);
    showroom.add(ring);

    // Revolving group for currently selected featured car
    const turntable = new THREE.Group();
    turntable.position.set(0, 0.22, 0);
    showroom.add(turntable);
    turntableRef.current = turntable;

    const featuredHolder = new THREE.Group();
    turntable.add(featuredHolder);
    const putCar = (into: THREE.Group, car: CarDeal) => {
      into.clear();
      const made = makeRealCar(realKindFor(car), { color: car.defaultColor });
      into.add(made ? made.group : buildDetailedCarMesh(car));
    };
    putCar(featuredHolder, selectedCar);
    void loadRealCar(realKindFor(selectedCar)).then(() => {
      if (alive) putCar(featuredHolder, selectedCar);
    });

    // ─────────────────────────────────────────────────────────────
    // 2. SHOWROOM DISPLAY LOT CARS (Surrounding Rows)
    // ─────────────────────────────────────────────────────────────
    const lotSpots: Array<[number, number, number]> = [
      [-5.2, -2.5, 0.35],
      [5.2, -2.5, -0.35],
      [-5.4, 3.2, 0.15],
      [5.4, 3.2, -0.15],
    ];
    const lotCars = CAR_CATALOG.filter((car) => car.id !== selectedCar.id && car.price <= 6500000).slice(-8);
    lotSpots.forEach(([lx, lz, ry], index) => {
      const pick = lotCars[(index * 2 + (selectedCar.id.length % 2)) % lotCars.length];
      if (!pick) return;
      const lot = new THREE.Group();
      lot.position.set(lx, 0, lz);
      lot.rotation.y = ry;
      putCar(lot, pick);
      showroom.add(lot);
      void loadRealCar(realKindFor(pick)).then(() => {
        if (alive) putCar(lot, pick);
      });
    });

    // ─────────────────────────────────────────────────────────────
    // 3. DEALER OBI'S OFFICE & SALES COUNTER (Back-Left)
    // ─────────────────────────────────────────────────────────────
    // Glass executive desk
    box(2.4, 0.85, 1.2, 0x334155, -5.6, 0.42, -5.8);
    box(2.5, 0.06, 1.3, 0x0284c7, -5.6, 0.88, -5.8); // Glass top

    // Laptop & Car brochures on desk
    box(0.45, 0.02, 0.32, 0xd4d4d8, -5.3, 0.92, -5.8);
    box(0.45, 0.28, 0.02, 0x1e293b, -5.3, 1.06, -5.95); // Laptop screen
    box(0.35, 0.02, 0.24, 0xe0b15a, -5.9, 0.92, -5.8); // Brochure

    // Dealer Obi NPC standing by desk
    const dealerObi = createRealisticHuman({
      lookId: "ibe",
      customShirt: 0x0284c7, // Branded suit jacket
      customPants: 0x0f172a,
      seated: false,
      scale: 0.98,
    });
    dealerObi.position.set(-5.6, 0, -6.6);
    dealerObi.rotation.y = 0.2; // Facing showroom
    showroom.add(dealerObi);

    // Customer NPC: Ada admiring the showroom
    const customerAda = createRealisticHuman({
      lookId: "ada",
      customShirt: 0xec4899,
      customPants: 0x1e293b,
      seated: false,
      scale: 0.95,
    });
    customerAda.position.set(3.4, 0, 1.8);
    customerAda.rotation.y = -0.8;
    showroom.add(customerAda);

    // ─────────────────────────────────────────────────────────────
    // 4. REALISTIC PLAYER AVATAR IN FRONT OF TURNTABLE
    // ─────────────────────────────────────────────────────────────
    const playerAvatar = createRealisticHuman({
      lookId: look,
      seated: false,
      scale: 0.98,
    });
    playerAvatar.position.set(0, 0, 4.4);
    playerAvatar.rotation.y = Math.PI; // Facing into the turntable car
    showroom.add(playerAvatar);
    addPlayerGuests(showroom, people, selfId, { x: 0, z: 3.4, rot: Math.PI });

    // ─────────────────────────────────────────────────────────────
    // ELEVATED ISOMETRIC CAMERA & RENDER LOOP
    // ─────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(32, root.clientWidth / root.clientHeight, 0.1, 100);
    const target = new THREE.Vector3(0, -1.15, 0);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);

      // Auto-spin turntable slightly
      if (turntableRef.current) {
        turntableRef.current.rotation.y += isTestDriving ? 0.04 : 0.005;
      }

      const r = 12.4 / rig.current.zoom;
      const phi = 1.04;
      const theta = rig.current.yaw;

      camera.position.set(
        target.x + r * Math.sin(phi) * Math.sin(theta),
        2.35 + r * Math.cos(phi),
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
      alive = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      detachControls();
      envTarget.dispose();
      renderer.dispose();
      if (root.contains(renderer.domElement)) {
        root.removeChild(renderer.domElement);
      }
    };
  }, [look, selectedCar, isTestDriving, people.map((person) => person.id).join("|"), selfId]);

  const dolly = (factor: number) => {
    rig.current.zoom = Math.max(0.4, Math.min(7.5, rig.current.zoom * factor));
  };

  const turn = (direction: number) => {
    rig.current.yaw += direction * 0.35;
  };

  const handleTestDrive = () => {
    setIsTestDriving(true);
    showToast(`🏎️ VROOOM! You revved the engine of the ${selectedCar.name}! Sounding powerful.`);
    window.setTimeout(() => setIsTestDriving(false), 3000);
  };

  const handleBuyCurrentCar = () => {
    onBuy?.(selectedCar.id);
  };

  const isOwned = garage.includes(selectedCar.id);

  return (
    <div className="absolute inset-0 bg-[#060911] text-[#f8fafc] overflow-hidden">
      {/* 3D WebGL Canvas */}
      <div
        ref={host}
        className="absolute inset-0 touch-none"
      />

      {/* Showroom Title Header */}
      <div className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-2xl bg-[#09111e]/90 px-3.5 py-2 border border-[#e0b15a]/40 shadow-xl backdrop-blur-md">
        <span className="text-xl">🚘</span>
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#e0b15a]">
            Obi Motors VIP Car Stand
          </h2>
          <p className="text-[10px] text-[#94a3b8]">
            Nworie River Bank · Dealer Obi · Owned Cars: {garage.length}
          </p>
        </div>
      </div>

      {/* Car Selection Tabs (Middle-Left) */}
      <div className="absolute left-2 right-14 top-[4.6rem] z-20 flex gap-1.5 overflow-x-auto pb-1">
        {CAR_CATALOG.map((car) => {
          const active = selectedCar.id === car.id;
          const ownedThis = garage.includes(car.id);
          return (
            <button
              key={car.id}
              type="button"
              onClick={() => setSelectedCar(car)}
              className={`flex w-[10.5rem] shrink-0 items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-bold border transition-all active:scale-95 shadow-lg backdrop-blur-md ${
                active
                  ? "bg-[#e0b15a] text-[#0f172a] border-[#fde047] scale-[1.02]"
                  : "bg-[#0f172a]/90 text-white border-white/10 hover:bg-[#1e293b]"
              }`}
            >
              <div className="truncate pr-1">
                <div className="flex items-center gap-1.5">
                  <img src={photoForVehicle(car.id)} alt="" className="h-7 w-10 rounded object-cover" />
                  <span className="truncate">{car.name.split(" ").slice(0, 3).join(" ")}</span>
                </div>
                <span className={`text-[10px] block ${active ? "text-[#0f172a]" : "text-[#e0b15a]"}`}>
                  {naira(car.price)}
                </span>
              </div>
              {ownedThis ? <span className="text-[10px] shrink-0 font-extrabold text-green-500">✔</span> : null}
            </button>
          );
        })}
      </div>

      {/* Selected Car Info & Purchase Panel (Bottom Floating Card) */}
      <div className="absolute inset-x-3 bottom-44 z-30 mx-auto max-w-lg rounded-3xl bg-[#09111c]/95 border-2 border-[#e0b15a]/40 p-3.5 shadow-2xl backdrop-blur-2xl text-white">
        <div className="flex items-start justify-between gap-3">
          <img src={photoForVehicle(selectedCar.id)} alt="" className="h-16 w-24 shrink-0 rounded-xl object-cover border border-white/10" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="rounded-md bg-[#e0b15a]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#e0b15a]">
                {selectedCar.category}
              </span>
              <span className="text-xs text-[#94a3b8]">{selectedCar.speed}</span>
            </div>
            <h3 className="mt-1 text-sm font-bold text-white">{selectedCar.name}</h3>
            <p className="text-[10px] text-[#e0b15a] font-semibold">{selectedCar.flexFactor}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-semibold text-[#94a3b8]">Dealership Price</p>
            <p className="text-base font-extrabold text-[#e0b15a]">{naira(selectedCar.price)}</p>
          </div>
        </div>

        <p className="mt-1.5 text-[11px] text-[#cbd5e1] leading-snug line-clamp-2">
          {selectedCar.desc}
        </p>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={pending || !onBuy}
            onClick={handleBuyCurrentCar}
            className="flex-1 rounded-xl bg-[#e0b15a] py-2.5 text-xs font-extrabold text-[#0f172a] hover:bg-[#f2c14e] transition-all shadow-lg active:scale-95 disabled:opacity-40"
          >
            {isOwned ? `Buy Another One · ${naira(selectedCar.price)}` : `Purchase Vehicle · ${naira(selectedCar.price)} 💳`}
          </button>
          <button
            type="button"
            onClick={handleTestDrive}
            className="rounded-xl bg-white/10 px-3 py-2.5 text-xs font-semibold text-white hover:bg-white/20 active:scale-95 transition-all flex items-center gap-1"
          >
            <span>🏎️</span>
            <span>Rev &amp; Test</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast ? (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 max-w-md rounded-2xl bg-[#0b1324]/98 border border-[#e0b15a] px-4 py-2.5 text-xs font-semibold text-[#fef08a] shadow-2xl backdrop-blur-lg animate-bounce">
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
