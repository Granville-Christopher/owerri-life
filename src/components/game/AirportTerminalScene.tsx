"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { makeRenderer } from "@/lib/game/renderQuality";
import type { LookId } from "@/lib/game/types";
import { addPlayerGuests, createRealisticHuman, type CrowdPerson } from "@/lib/game/humanModel";
import { naira } from "@/lib/game/format";
import { attachSceneCameraControls } from "./sceneCameraControls";

// Flight Information Display System Canvas Texture
function createFIDSTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Black terminal flight board
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, 512, 256);

  // Yellow header
  ctx.fillStyle = "#e0b15a";
  ctx.fillRect(0, 0, 512, 38);
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("FLIGHT DEPARTURES · SAM MBAKWE AIRPORT (QOW)", 16, 26);

  // Columns header
  ctx.fillStyle = "#64748b";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText("TIME", 16, 62);
  ctx.fillText("FLIGHT", 80, 62);
  ctx.fillText("DESTINATION", 160, 62);
  ctx.fillText("GATE", 340, 62);
  ctx.fillText("STATUS", 420, 62);

  // Flight rows
  const flights = [
    { time: "14:15", no: "W3 402", dest: "LAGOS (LOS)", gate: "01", status: "BOARDING", color: "#22c55e" },
    { time: "15:00", no: "P4 711", dest: "ABUJA (ABV)", gate: "02", status: "ON TIME", color: "#38bdf8" },
    { time: "16:30", no: "QR 590", dest: "PORT HARCOURT", gate: "03", status: "CHECK-IN", color: "#f59e0b" },
    { time: "18:45", no: "BA 075", dest: "LONDON (LHR)", gate: "04", status: "SCHEDULED", color: "#e2e8f0" },
    { time: "21:00", no: "EK 782", dest: "DUBAI (DXB)", gate: "02", status: "SCHEDULED", color: "#e2e8f0" },
  ];

  flights.forEach((f, i) => {
    const y = 92 + i * 32;
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "13px monospace";
    ctx.fillText(f.time, 16, y);
    ctx.fillText(f.no, 80, y);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(f.dest, 160, y);
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(f.gate, 350, y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.status, 420, y);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

export function AirportTerminalScene({
  look = "chidi",
  username = "Traveler",
  onBookFlight,
  people = [],
  selfId,
}: {
  look?: LookId;
  username?: string;
  onBookFlight?: (tripId: string) => void;
  people?: CrowdPerson[];
  selfId?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const rig = useRef({ yaw: 0.25, zoom: 1.1 });

  const [toast, setToast] = useState<string | null>(null);
  const [activeGate, setActiveGate] = useState("01");

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const root = host.current;
    if (!root) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080e18);

    const renderer = makeRenderer({ alpha: false });
    renderer.setSize(root.clientWidth, root.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    root.appendChild(renderer.domElement);

    const airport = new THREE.Group();
    scene.add(airport);

    // ─────────────────────────────────────────────────────────────
    // LIGHTING: Bright Modern Terminal + Sunlight on Tarmac
    // ─────────────────────────────────────────────────────────────
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.75);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(10, 16, 12);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

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
      airport.add(mesh);
      return mesh;
    };

    // ─────────────────────────────────────────────────────────────
    // 1. TERMINAL FLOOR & CUTAWAY WALLS (Open top, NO ROOF)
    // ─────────────────────────────────────────────────────────────
    // Polished light grey terminal floor (18m wide x 16m deep)
    box(18, 0.12, 16, 0xe2e8f0, 0, -0.06, 0, false);
    box(18.2, 0.14, 0.14, 0x0284c7, 0, 0.01, 7.9, false); // Blue front threshold

    // Tarmac runway outside back glass (Dark asphalt)
    box(24, 0.1, 10, 0x1e293b, 0, -0.07, -12.5, false);
    // Yellow runway markings
    box(1.2, 0.02, 8, 0xfacc15, 0, -0.01, -12.5, false);

    // Low Cutaway Perimeter Walls (Height 3.2m, NO ceiling for overhead view)
    box(18, 3.2, 0.3, 0x1e293b, 0, 1.6, -7.85); // Back Wall (with large glass viewing windows)
    box(0.3, 3.2, 16, 0x1e293b, -8.85, 1.6, 0);  // Left Wall
    box(0.3, 3.2, 16, 0x1e293b, 8.85, 1.6, 0);   // Right Wall

    // Large Panoramic Observation Windows looking out at the Airplane on Tarmac
    for (let w = 0; w < 4; w++) {
      const wx = -6 + w * 4;
      const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(3.4, 2.6),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
      );
      glass.position.set(wx, 2.0, -7.68);
      airport.add(glass);
      // Window mullion frames
      box(0.1, 2.8, 0.1, 0x475569, wx - 1.7, 2.0, -7.66);
      box(0.1, 2.8, 0.1, 0x475569, wx + 1.7, 2.0, -7.66);
    }

    // ─────────────────────────────────────────────────────────────
    // 2. DETAILED 3D AIRPLANE ON TARMAC (Visible through glass)
    // ─────────────────────────────────────────────────────────────
    const planeGroup = new THREE.Group();
    planeGroup.position.set(0, 0, -13);
    planeGroup.rotation.y = -0.15;
    airport.add(planeGroup);

    const planeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.4 });
    const planeGreenMat = new THREE.MeshStandardMaterial({ color: 0x15803d }); // Nigerian flag green
    const jetEngineMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const cockpitGlassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.05, metalness: 0.95 });

    // Fuselage / Main Body
    const fuseGeom = new THREE.CylinderGeometry(1.2, 1.2, 12.0, 24);
    fuseGeom.rotateX(Math.PI / 2);
    const fuselage = new THREE.Mesh(fuseGeom, planeWhiteMat);
    fuselage.position.set(0, 2.2, 0);
    fuselage.castShadow = true;
    planeGroup.add(fuselage);

    // Nose Cone
    const noseGeom = new THREE.ConeGeometry(1.2, 2.4, 24);
    noseGeom.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeom, planeWhiteMat);
    nose.position.set(0, 2.2, 7.2);
    nose.castShadow = true;
    planeGroup.add(nose);

    // Cockpit Windows
    const cock = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 1.2), cockpitGlassMat);
    cock.position.set(0, 2.85, 6.2);
    planeGroup.add(cock);

    // Main Wings (Swept back)
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.12, 2.4), planeWhiteMat);
    wingL.position.set(-4.2, 2.0, 0.4);
    wingL.rotation.y = -0.25;
    wingL.rotation.z = 0.06;
    wingL.castShadow = true;

    const wingR = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.12, 2.4), planeWhiteMat);
    wingR.position.set(4.2, 2.0, 0.4);
    wingR.rotation.y = 0.25;
    wingR.rotation.z = -0.06;
    wingR.castShadow = true;
    planeGroup.add(wingL, wingR);

    // Jet Engines under wings
    for (const side of [-2.8, 2.8]) {
      const engGeom = new THREE.CylinderGeometry(0.55, 0.55, 2.2, 16);
      engGeom.rotateX(Math.PI / 2);
      const engine = new THREE.Mesh(engGeom, jetEngineMat);
      engine.position.set(side, 1.1, 0.6);
      engine.castShadow = true;
      planeGroup.add(engine);

      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.65, 0.8), planeWhiteMat);
      pylon.position.set(side, 1.65, 0.6);
      planeGroup.add(pylon);
    }

    // Vertical Tail Fin with green stripe
    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.8, 2.4), planeGreenMat);
    tailFin.position.set(0, 4.4, -5.2);
    tailFin.rotation.x = -0.4;
    tailFin.castShadow = true;
    planeGroup.add(tailFin);

    // ─────────────────────────────────────────────────────────────
    // 3. FLIGHT INFORMATION DISPLAY SYSTEM (FIDS) BOARD
    // ─────────────────────────────────────────────────────────────
    const fidsTex = createFIDSTexture();
    const fidsBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(6.4, 3.2),
      new THREE.MeshBasicMaterial({ map: fidsTex })
    );
    fidsBoard.position.set(0, 3.2, -7.6);
    airport.add(fidsBoard);

    // ─────────────────────────────────────────────────────────────
    // 4. CHECK-IN DESKS & ATTENDANT IFUNANYA (Left Side)
    // ─────────────────────────────────────────────────────────────
    for (let c = 0; c < 2; c++) {
      const cz = -3.8 + c * 2.8;
      // Desk counter
      box(1.2, 1.1, 2.2, 0x0284c7, -6.2, 0.55, cz);
      box(1.3, 0.08, 2.3, 0xffffff, -6.2, 1.12, cz);
      // Computer monitor
      box(0.1, 0.35, 0.45, 0x0f172a, -6.1, 1.34, cz);
      // Baggage weigh scale
      box(1.0, 0.08, 1.0, 0x475569, -4.8, 0.04, cz);
    }

    // Attendant NPC: Ifunanya at check-in desk
    const ifunanya = createRealisticHuman({
      lookId: "ngozi",
      customShirt: 0x0284c7, // Airline blazer
      customPants: 0x0f172a,
      hairStyle: "bun",
      seated: false,
      scale: 0.98,
    });
    ifunanya.position.set(-6.8, 0, -3.8);
    ifunanya.rotation.y = Math.PI / 2; // Facing customer
    airport.add(ifunanya);

    // ─────────────────────────────────────────────────────────────
    // 5. SECURITY METAL DETECTOR ARCH & X-RAY CONVEYOR
    // ─────────────────────────────────────────────────────────────
    // Security Arch
    box(0.2, 2.4, 0.4, 0x334155, -1.8, 1.2, -3.2);
    box(0.2, 2.4, 0.4, 0x334155, -0.6, 1.2, -3.2);
    box(1.4, 0.25, 0.4, 0x334155, -1.2, 2.45, -3.2);
    // Green indicator light on top of arch
    const secLight = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    secLight.position.set(-1.2, 2.65, -3.2);
    airport.add(secLight);

    // X-Ray Baggage Tunnel & Conveyor
    box(1.8, 0.9, 0.8, 0x475569, 1.0, 0.45, -3.2);
    box(1.2, 0.8, 0.7, 0x0f172a, 1.0, 1.0, -3.2); // Tunnel housing

    // Pilot NPC in Captain Uniform standing near security
    const pilot = createRealisticHuman({
      lookId: "ibe",
      customShirt: 0xffffff, // White captain shirt with gold epaulettes
      customPants: 0x0f172a,
      seated: false,
      scale: 1.0,
    });
    pilot.position.set(2.8, 0, -3.2);
    pilot.rotation.y = -0.4;
    airport.add(pilot);

    // Pilot gold epaulettes
    const epL = box(0.12, 0.04, 0.22, 0xe0b15a, 2.68, 1.58, -3.2);
    const epR = box(0.12, 0.04, 0.22, 0xe0b15a, 2.92, 1.58, -3.2);
    epL.castShadow = false;
    epR.castShadow = false;

    // ─────────────────────────────────────────────────────────────
    // 6. DEPARTURE LOUNGE SEATING ROWS & TRAVELERS (Center / Front)
    // ─────────────────────────────────────────────────────────────
    const makeBenchRow = (bx: number, bz: number) => {
      // Chrome metal beam
      box(4.8, 0.08, 0.1, 0xd4d4d8, bx, 0.35, bz);
      // 4 Seating units
      for (let s = 0; s < 4; s++) {
        const sx = bx - 1.8 + s * 1.2;
        box(0.55, 0.06, 0.52, 0x1e293b, sx, 0.42, bz); // Seat
        box(0.55, 0.55, 0.06, 0x1e293b, sx, 0.72, bz - 0.24); // Backrest
        box(0.06, 0.42, 0.06, 0xd4d4d8, sx - 0.24, 0.21, bz); // Legs
        box(0.06, 0.42, 0.06, 0xd4d4d8, sx + 0.24, 0.21, bz);
      }
    };

    makeBenchRow(-2.8, 1.8);
    makeBenchRow(3.4, 1.8);
    makeBenchRow(-2.8, 4.4);
    makeBenchRow(3.4, 4.4);

    // Traveler NPC 1: Ada seated waiting for flight
    const trav1 = createRealisticHuman({
      lookId: "ada",
      customShirt: 0xf43f5e,
      customPants: 0x1e293b,
      seated: true,
      scale: 0.95,
    });
    trav1.position.set(-3.4, 0.05, 1.8);
    trav1.rotation.y = 0;
    airport.add(trav1);

    // Traveler NPC 2: Emeka with suitcase
    const trav2 = createRealisticHuman({
      lookId: "emeka",
      customShirt: 0x10b981,
      customPants: 0x1e293b,
      seated: true,
      scale: 0.95,
    });
    trav2.position.set(4.0, 0.05, 1.8);
    trav2.rotation.y = 0;
    airport.add(trav2);

    // Suitcases / Luggage pieces
    box(0.38, 0.58, 0.26, 0xdc2626, -2.4, 0.29, 1.8); // Red luggage
    box(0.42, 0.62, 0.28, 0x1e293b, 4.8, 0.31, 1.8); // Black luggage
    box(0.36, 0.52, 0.24, 0x3b82f6, -5.2, 0.26, -3.8); // Blue luggage at desk

    // ─────────────────────────────────────────────────────────────
    // 7. REALISTIC PLAYER CHARACTER
    // ─────────────────────────────────────────────────────────────
    const playerAvatar = createRealisticHuman({
      lookId: look,
      seated: false,
      scale: 0.98,
    });
    playerAvatar.position.set(0, 0, 5.2);
    playerAvatar.rotation.y = Math.PI; // Facing into terminal
    airport.add(playerAvatar);
    addPlayerGuests(airport, people, selfId, { x: 0, z: 4.2, rot: Math.PI });

    // Player Rolling Suitcase
    box(0.36, 0.56, 0.26, 0xe0b15a, 0.55, 0.28, 5.2); // Gold trim suitcase

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

  const handleCheckIn = () => {
    showToast(`✈️ Ifunanya printed your boarding pass for Gate ${activeGate}! Safe flight from Owerri.`);
  };

  const handleBoardFlight = (tripId: string, city: string, price: number) => {
    showToast(`🛫 Now Boarding: Flight to ${city}! Ticket confirmed (${naira(price)}). Have a great trip.`);
    onBookFlight?.(tripId);
  };

  return (
    <div className="absolute inset-0 bg-[#080e18] text-[#f8fafc] overflow-hidden">
      {/* 3D WebGL Canvas */}
      <div
        ref={host}
        className="absolute inset-0 touch-none"
      />

      {/* Airport Title Header */}
      <div className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-2xl bg-[#09111e]/90 px-3.5 py-2 border border-[#0284c7]/40 shadow-xl backdrop-blur-md">
        <span className="text-xl">✈️</span>
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#38bdf8]">
            Sam Mbakwe International Airport
          </h2>
          <p className="text-[10px] text-[#94a3b8]">
            Owerri Terminal · Check-in Ifunanya · {username}
          </p>
        </div>
      </div>

      {/* Quick Flight Actions (Middle-Left) */}
      <div className="absolute left-3 top-20 z-20 flex flex-col gap-2 max-w-[190px]">
        <button
          type="button"
          onClick={handleCheckIn}
          className="flex items-center gap-2 rounded-2xl bg-[#0284c7] px-3.5 py-2.5 text-xs font-bold text-white shadow-xl backdrop-blur-md border border-[#38bdf8] hover:bg-[#0369a1] active:scale-95 transition-all"
        >
          <span>🎟️</span>
          <span>Check-in Desk</span>
        </button>

        <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] px-1 mt-1">
          Direct Flights:
        </span>

        <button
          type="button"
          onClick={() => handleBoardFlight("lagos", "Lagos (LOS)", 95000)}
          className="flex items-center justify-between rounded-xl bg-[#0f172a]/90 px-3 py-2 text-left text-xs font-bold text-white border border-white/10 hover:bg-[#1e293b] active:scale-95 transition-all shadow-lg backdrop-blur-md"
        >
          <div>
            <span className="block">✈️ Lagos (LOS)</span>
            <span className="text-[10px] text-[#e0b15a]">{naira(95000)} · 1h 05m</span>
          </div>
          <span className="text-[10px] text-green-400 font-extrabold">Gate 01</span>
        </button>

        <button
          type="button"
          onClick={() => handleBoardFlight("abuja", "Abuja (ABV)", 160000)}
          className="flex items-center justify-between rounded-xl bg-[#0f172a]/90 px-3 py-2 text-left text-xs font-bold text-white border border-white/10 hover:bg-[#1e293b] active:scale-95 transition-all shadow-lg backdrop-blur-md"
        >
          <div>
            <span className="block">✈️ Abuja (ABV)</span>
            <span className="text-[10px] text-[#e0b15a]">{naira(160000)} · 1h 15m</span>
          </div>
          <span className="text-[10px] text-sky-400 font-extrabold">Gate 02</span>
        </button>

        <button
          type="button"
          onClick={() => handleBoardFlight("london", "London (LHR)", 1200000)}
          className="flex items-center justify-between rounded-xl bg-[#0f172a]/90 px-3 py-2 text-left text-xs font-bold text-white border border-white/10 hover:bg-[#1e293b] active:scale-95 transition-all shadow-lg backdrop-blur-md"
        >
          <div>
            <span className="block">✈️ London (LHR)</span>
            <span className="text-[10px] text-[#e0b15a]">{naira(1200000)} · 6h 30m</span>
          </div>
          <span className="text-[10px] text-amber-400 font-extrabold">Gate 04</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toast ? (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 max-w-md rounded-2xl bg-[#0b1324]/98 border border-[#38bdf8] px-4 py-2.5 text-xs font-semibold text-[#38bdf8] shadow-2xl backdrop-blur-lg animate-bounce">
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
