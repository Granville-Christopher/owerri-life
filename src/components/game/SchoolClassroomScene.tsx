"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { LookId } from "@/lib/game/types";
import { createRealisticHuman } from "@/lib/game/humanModel";
import { attachSceneCameraControls } from "./sceneCameraControls";
import { naira } from "@/lib/game/format";

// Chalkboard canvas texture with formulas, diagrams, and lecture notes
function createClassroomBoardTexture(schoolName: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1536;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Deep chalkboard dark-slate green
  ctx.fillStyle = "#14281d";
  ctx.fillRect(0, 0, 1536, 768);

  // Subtle chalkboard eraser smudges & chalk dust
  ctx.fillStyle = "rgba(235, 245, 238, 0.035)";
  for (let i = 0; i < 40; i++) {
    ctx.fillRect(
      Math.random() * 1536,
      Math.random() * 768,
      120 + Math.random() * 200,
      20 + Math.random() * 60
    );
  }

  // Top header banner
  ctx.fillStyle = "#fef08a"; // Soft chalk yellow
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(`🏛 ${schoolName.toUpperCase()} · FACULTY OF ENGINEERING & PHYSICAL SCIENCES`, 60, 68);

  ctx.strokeStyle = "rgba(254, 240, 138, 0.4)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(60, 88);
  ctx.lineTo(1476, 88);
  ctx.stroke();

  // Lecture Topic
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 44px sans-serif";
  ctx.fillText("ENG 204: FLUID MECHANICS & THERMODYNAMICS", 60, 152);

  // Chalk formulas & equations
  ctx.font = "28px monospace";
  ctx.fillStyle = "#e2e8f0";

  ctx.fillText("1. Conservation of Mass:   ∂ρ/∂t + ∇ · (ρv) = 0", 70, 224);
  ctx.fillText("2. Navier-Stokes Equation: ρ(∂v/∂t + v·∇v) = -∇p + μ∇²v + ρg", 70, 274);
  ctx.fillText("3. 1st Law Thermodynamics:  dU = δQ - δW   (Closed System)", 70, 324);
  ctx.fillText("4. Ideal Gas Equation:      P · V = n · R · T", 70, 374);
  ctx.fillText("5. Carnot Efficiency:       η = 1 - (T_cold / T_hot)", 70, 424);

  // Stress-Strain / Mohr Circle Chalk Diagram on right side
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 3;

  // Diagram Box
  ctx.strokeRect(1020, 130, 450, 340);
  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("MOHR'S STRESS CIRCLE", 1090, 170);

  // Circle & Axes
  ctx.strokeStyle = "#38bdf8";
  ctx.beginPath();
  ctx.arc(1245, 310, 95, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  ctx.beginPath();
  ctx.moveTo(1050, 310);
  ctx.lineTo(1440, 310); // horizontal σ axis
  ctx.moveTo(1245, 190);
  ctx.lineTo(1245, 430); // vertical τ axis
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "20px monospace";
  ctx.fillText("σ_1", 1360, 335);
  ctx.fillText("σ_2", 1120, 335);
  ctx.fillText("τ_max", 1255, 215);

  // Bottom Notice
  ctx.fillStyle = "#f87171"; // Chalk red / alert
  ctx.font = "bold 30px sans-serif";
  ctx.fillText("📌 MID-SEMESTER CONTINUOUS ASSESSMENT TEST: FRIDAY 08:00 AM SHARP!", 70, 520);

  ctx.fillStyle = "#a7f3d0";
  ctx.font = "italic 26px sans-serif";
  ctx.fillText("• Submit Assignment 2 (Derivations) before 4:00 PM at H.O.D's Office.", 70, 570);
  ctx.fillText("• Attendance is 10% of total exam score. No sorting of grades tolerated.", 70, 615);
  ctx.fillText("Lecturer: Engr. Dr. Osuji (MNSE, COREN Registered)", 70, 680);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

// Noticeboard canvas texture
function createNoticeBoardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "#b45309"; // Cork board
  ctx.fillRect(0, 0, 512, 512);

  // Memos pinned to board
  ctx.fillStyle = "#fef08a";
  ctx.fillRect(30, 40, 200, 180);
  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("EXAM TIMETABLE", 45, 75);
  ctx.font = "12px sans-serif";
  ctx.fillText("Faculty of Eng.", 45, 95);
  ctx.fillText("Venue: ETF Hall 2", 45, 115);
  ctx.fillText("All departments", 45, 135);

  ctx.fillStyle = "#e0f2fe";
  ctx.fillRect(260, 60, 210, 190);
  ctx.fillStyle = "#0369a1";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("SUG ANNOUNCEMENT", 275, 95);
  ctx.font = "12px sans-serif";
  ctx.fillText("Campus Bus Welfare", 275, 115);
  ctx.fillText("Senate Building 10AM", 275, 135);

  ctx.fillStyle = "#fce7f3";
  ctx.fillRect(60, 260, 380, 200);
  ctx.fillStyle = "#831843";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("DEAN'S DISCIPLINARY NOTICE", 80, 295);
  ctx.font = "13px sans-serif";
  ctx.fillText("Students must display student ID cards during lectures.", 80, 325);
  ctx.fillText("No unauthorized sales or handouts inside lecture halls.", 80, 350);

  return new THREE.CanvasTexture(canvas);
}

export function SchoolClassroomScene({
  look = "chidi",
  title = "Imo State University (IMSU)",
  placeId = "imsu",
  username = "Student",
}: {
  look?: LookId;
  title?: string;
  placeId?: string;
  username?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  // High-angle top-down / isometric camera view into the classroom like in clubs
  const rig = useRef({ yaw: 0.38, zoom: 1.15 });
  const [toast, setToast] = useState<string | null>(null);
  const [notesCount, setNotesCount] = useState(0);
  const [actionsOpen, setActionsOpen] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const root = host.current;
    if (!root) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(root.clientWidth, root.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    root.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#182232");

    // Lighting: Bright airy university daylight through left windows
    scene.add(new THREE.HemisphereLight(0xfffbeb, 0x334155, 1.1));

    const sun = new THREE.DirectionalLight(0xfff7ed, 1.4);
    sun.position.set(-10, 16, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);

    // Blackboard spotlight
    const boardSpot = new THREE.SpotLight(0xffedd5, 18, 16, Math.PI / 3, 0.4);
    boardSpot.position.set(0, 4.8, -1.8);
    boardSpot.target.position.set(0, 2.5, -4.9);
    scene.add(boardSpot, boardSpot.target);

    const room = new THREE.Group();
    scene.add(room);

    const box = (w: number, h: number, d: number, color: number, x: number, y: number, z: number, cast = true) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
      mesh.position.set(x, y, z);
      mesh.castShadow = cast;
      mesh.receiveShadow = true;
      room.add(mesh);
      return mesh;
    };

    // ─────────────────────────────────────────────────────────────
    // CLASSROOM ROOM ARCHITECTURE (13.5m wide x 11.0m deep x 5.2m high)
    // ─────────────────────────────────────────────────────────────

    // FLOOR: Polished university wooden parquet planks
    box(14, 0.14, 11.5, 0x855428, 0, -0.07, 0, false);

    // Tiered seating riser steps for back rows
    box(13.6, 0.28, 3.2, 0x6d421d, 0, 0.14, 3.2, false);
    box(13.6, 0.56, 2.6, 0x5a3516, 0, 0.28, 4.6, false);

    // Front stage platform for lecturer (0.2m high)
    box(13.6, 0.22, 2.6, 0x7c4921, 0, 0.11, -3.8, false);

    // CUTAWAY WALLS (Open roof dollhouse view so inside is clearly visible from above)
    box(14, 3.8, 0.3, 0xf1ede2, 0, 1.9, -5.2); // Front blackboard wall
    box(0.3, 3.4, 11.5, 0xdfd9cb, 6.9, 1.7, 0); // Right side cutaway wall
    box(0.3, 3.4, 11.5, 0xdfd9cb, -6.9, 1.7, 0); // Left side cutaway wall

    // FRONT BLACKBOARD / CHALKBOARD
    // Wooden frame
    box(9.2, 3.1, 0.12, 0x5c3317, 0, 2.3, -4.96);
    // Board surface
    const boardTex = createClassroomBoardTexture(title);
    const boardMat = new THREE.MeshBasicMaterial({ map: boardTex });
    const boardPlane = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 2.7), boardMat);
    boardPlane.position.set(0, 2.3, -4.89);
    room.add(boardPlane);

    // Chalk tray below board
    box(8.9, 0.08, 0.22, 0x855428, 0, 0.9, -4.85);

    // Pieces of chalk & chalkboard eraser in the tray
    box(0.12, 0.04, 0.04, 0xffffff, -0.8, 0.95, -4.85);
    box(0.12, 0.04, 0.04, 0xfef08a, -0.5, 0.95, -4.85);
    box(0.25, 0.06, 0.12, 0x1f2937, 0.6, 0.96, -4.85); // Eraser

    // NOTICE BOARD ON RIGHT WALL
    const noticeTex = createNoticeBoardTexture();
    const noticePlane = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.2), new THREE.MeshBasicMaterial({ map: noticeTex }));
    noticePlane.rotation.y = -Math.PI / 2;
    noticePlane.position.set(6.72, 2.3, -1.0);
    room.add(noticePlane);
    box(0.1, 2.4, 2.4, 0x78350f, 6.78, 2.3, -1.0); // Cork frame

    // WINDOWS ON LEFT WALL (Bright Nigerian daylight)
    for (let w = -1; w <= 1; w++) {
      const wz = w * 3.2;
      // Window frame
      box(0.2, 2.4, 2.0, 0x1e293b, -6.75, 2.2, wz);
      // Sky/outdoor sunlight glass
      const winGlass = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 2.2),
        new THREE.MeshBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.85 })
      );
      winGlass.rotation.y = Math.PI / 2;
      winGlass.position.set(-6.7, 2.2, wz);
      room.add(winGlass);

      // Green tropical foliage visible outside window
      const bush = new THREE.Mesh(
        new THREE.SphereGeometry(0.85, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0x15803d })
      );
      bush.position.set(-7.6, 1.8, wz);
      room.add(bush);
    }

    // ─────────────────────────────────────────────────────────────
    // LECTURER'S PODIUM & FRONT STAGE
    // ─────────────────────────────────────────────────────────────

    // Raised Lecturer Podium / Rostrum
    box(1.1, 1.2, 0.85, 0x5c3317, 2.2, 0.75, -3.6);
    // Rostrum sloped top
    box(1.15, 0.08, 0.9, 0x78350f, 2.2, 1.38, -3.6);
    // Microphone gooseneck
    const micRod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35), new THREE.MeshLambertMaterial({ color: 0x0f172a }));
    micRod.position.set(2.0, 1.55, -3.5);
    micRod.rotation.z = -0.3;
    room.add(micRod);
    const micHead = new THREE.Mesh(new THREE.SphereGeometry(0.04), new THREE.MeshLambertMaterial({ color: 0x475569 }));
    micHead.position.set(2.08, 1.7, -3.5);
    room.add(micHead);

    // Lecturer's desk & laptop on stage
    box(2.2, 0.9, 1.0, 0x855428, -2.4, 0.58, -3.6);
    // Laptop base & open screen
    box(0.42, 0.02, 0.3, 0x1e293b, -2.4, 1.04, -3.6);
    const laptopScreen = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.02), new THREE.MeshLambertMaterial({ color: 0x0ea5e9 }));
    laptopScreen.position.set(-2.4, 1.18, -3.72);
    laptopScreen.rotation.x = -0.15;
    room.add(laptopScreen);

    // Stack of engineering textbooks & marking red pen
    box(0.32, 0.08, 0.24, 0xb91c1c, -1.8, 1.07, -3.5);
    box(0.3, 0.07, 0.22, 0x1d4ed8, -1.8, 1.14, -3.5);
    box(0.18, 0.015, 0.015, 0xdc2626, -1.5, 1.05, -3.45); // Red marking pen

    // ─────────────────────────────────────────────────────────────
    // REALISTIC 3D LECTURER (Dr. Osuji / Dr. Nwosu)
    // ─────────────────────────────────────────────────────────────
    const lecturer = createRealisticHuman({
      lookId: "ibe",
      customShirt: 0x1d4e4a,
      customPants: 0x1e293b,
      hairStyle: "fade",
      seated: false,
      scale: 1.05,
    });
    lecturer.position.set(0.6, 0.22, -3.8); // On stage near blackboard
    lecturer.rotation.y = 0.2; // Facing the class
    room.add(lecturer);

    // ─────────────────────────────────────────────────────────────
    // STUDENT LECTURE DESKS & TIERS
    // ─────────────────────────────────────────────────────────────
    const deskRows = [
      { z: -1.2, yRiser: 0, length: 11.2 },
      { z: 1.4, yRiser: 0, length: 11.2 },
      { z: 3.8, yRiser: 0.28, length: 11.2 },
    ];

    deskRows.forEach((row, rIndex) => {
      // Long continuous classroom desk bench
      // Desk surface
      box(row.length, 0.07, 0.65, 0xd97706, 0, row.yRiser + 0.88, row.z);
      // Metal tubular desk legs
      for (let legX = -4.8; legX <= 4.8; legX += 2.4) {
        box(0.06, 0.88, 0.55, 0x1e293b, legX, row.yRiser + 0.44, row.z);
      }

      // Seat bench behind the desk
      box(row.length, 0.06, 0.38, 0xb45309, 0, row.yRiser + 0.52, row.z + 0.65);
      // Seat backrest
      box(row.length, 0.22, 0.04, 0xb45309, 0, row.yRiser + 0.75, row.z + 0.84);

      // Student accessories on desks (Notebooks & blue biro pens)
      for (let sX = -4.0; sX <= 4.0; sX += 2.0) {
        // Spiral notebook
        const noteColor = (rIndex + sX) % 2 === 0 ? 0x38bdf8 : 0xec4899;
        box(0.3, 0.02, 0.22, noteColor, sX, row.yRiser + 0.92, row.z);
        // Blue biro ballpoint pen
        box(0.14, 0.015, 0.015, 0x1d4ed8, sX + 0.2, row.yRiser + 0.925, row.z);
      }
    });

    // ─────────────────────────────────────────────────────────────
    // REALISTIC 3D STUDENTS SEATED IN ROWS
    // ─────────────────────────────────────────────────────────────

    // Student 1: Ada (Row 1 Left) - Facing front towards blackboard
    const st1 = createRealisticHuman({
      lookId: "ada",
      customShirt: 0x15803d,
      customPants: 0x1e293b,
      hairStyle: "braids",
      seated: true,
      scale: 0.95,
    });
    st1.position.set(-2.0, 0, -0.6);
    st1.rotation.y = Math.PI - 0.04; // Facing front towards blackboard & lecturer
    room.add(st1);

    // Student 2: Ngozi (Row 1 Right) - Facing front towards blackboard
    const st2 = createRealisticHuman({
      lookId: "ngozi",
      customShirt: 0x9333ea,
      customPants: 0x1f2937,
      hairStyle: "afro",
      seated: true,
      scale: 0.95,
    });
    st2.position.set(2.0, 0, -0.6);
    st2.rotation.y = Math.PI + 0.05; // Facing front towards blackboard & lecturer
    room.add(st2);

    // Student 3: Emeka (Row 2 Center-Left) - Facing front towards blackboard
    const st3 = createRealisticHuman({
      lookId: "emeka",
      customShirt: 0x3b82f6,
      customPants: 0x0f172a,
      hairStyle: "fade",
      seated: true,
      scale: 0.98,
    });
    st3.position.set(-1.0, 0, 2.0);
    st3.rotation.y = Math.PI - 0.06; // Facing front towards blackboard & lecturer
    room.add(st3);

    // Student 4: Zara (Row 2 Right) - Facing front towards blackboard
    const st4 = createRealisticHuman({
      lookId: "zara",
      customShirt: 0xc2410c,
      customPants: 0x1e293b,
      hairStyle: "bun",
      seated: true,
      scale: 0.95,
    });
    st4.position.set(3.0, 0, 2.0);
    st4.rotation.y = Math.PI + 0.06; // Facing front towards blackboard & lecturer
    room.add(st4);

    // ─────────────────────────────────────────────────────────────
    // PLAYER CHARACTER SEATED AT FRONT-CENTER DESK (Facing the front!)
    // ─────────────────────────────────────────────────────────────
    const playerAvatar = createRealisticHuman({
      lookId: look,
      seated: true,
      scale: 0.98,
    });
    playerAvatar.position.set(0, 0, -0.6); // Front row, center seat!
    playerAvatar.rotation.y = Math.PI; // Facing front towards blackboard & lecturer
    room.add(playerAvatar);

    // Open laptop in front of player
    box(0.38, 0.02, 0.26, 0x334155, 0, 0.92, -1.15);
    const playerLaptopScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.24, 0.015),
      new THREE.MeshLambertMaterial({ color: 0x38bdf8 })
    );
    playerLaptopScreen.position.set(0, 1.05, -1.02);
    playerLaptopScreen.rotation.x = 0.15;
    room.add(playerLaptopScreen);

    // Student Desk Nameplate
    const deskTag = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.06, 0.06),
      new THREE.MeshLambertMaterial({ color: 0xfef08a })
    );
    deskTag.position.set(0, 0.92, -1.35);
    room.add(deskTag);

    // ─────────────────────────────────────────────────────────────
    // CAMERA PERSPECTIVE & RENDER LOOP (Open top cutaway view)
    // ─────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(34, root.clientWidth / root.clientHeight, 0.1, 100);
    const target = new THREE.Vector3(0, 1.2, 0);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);

      // Slight natural breathing movement for lecturer
      lecturer.position.y = 0.22 + Math.sin(Date.now() * 0.002) * 0.012;

      // Orbit camera calculation
      const r = 14.5 / Math.max(0.25, rig.current.zoom);
      const phi = 0.65; // High-angle top-down tilt like the club view
      const theta = rig.current.yaw;

      camera.position.set(
        target.x + r * Math.sin(phi) * Math.sin(theta),
        target.y + r * Math.cos(phi) + 2.0,
        target.z + r * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(target);

      renderer.render(scene, camera);
    };
    animate();

    // Attach touch pinch-and-zoom / shrink, mouse wheel zoom, and drag rotation
    const detachControls = attachSceneCameraControls(root, rig, {
      minZoom: 0.35,
      maxZoom: 6.0,
      zoomSpeed: 0.12,
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
      detachControls();
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (root.contains(renderer.domElement)) {
        root.removeChild(renderer.domElement);
      }
    };
  }, [look, title]);

  const dolly = (factor: number) => {
    rig.current.zoom = Math.max(0.35, Math.min(8.0, rig.current.zoom * factor));
  };

  const turn = (direction: number) => {
    rig.current.yaw += direction * 0.35;
  };

  const setViewPreset = (preset: "desk" | "lecturer" | "overview" | "topdown") => {
    if (preset === "desk") {
      rig.current.zoom = 2.8;
      rig.current.yaw = 0.05;
    } else if (preset === "lecturer") {
      rig.current.zoom = 2.4;
      rig.current.yaw = 0.45;
    } else if (preset === "overview") {
      rig.current.zoom = 1.15;
      rig.current.yaw = 0.38;
    } else if (preset === "topdown") {
      rig.current.zoom = 0.85;
      rig.current.yaw = 0.0;
    }
  };

  return (
    <div className="relative h-full min-h-[72vh] w-full overflow-hidden bg-[#0f172a] select-none">
      {/* 3D Canvas Host */}
      <div
        ref={host}
        className="absolute inset-0 touch-none"
      />

      {/* Mobile-Optimized University Header Badge */}
      <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-[calc(100%-4.5rem)] sm:max-w-xs rounded-2xl bg-[#09111c]/90 p-2.5 sm:p-3 shadow-2xl backdrop-blur-md border border-[#e0b15a]/30">
        <div className="flex items-center gap-1.5">
          <span className="flex h-2 w-2 rounded-full bg-[#22c55e] animate-pulse" />
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.16em] text-[#e0b15a]">Live Lecture in Session</p>
        </div>
        <h2 className="mt-0.5 font-bold text-sm sm:text-base text-white truncate">{title}</h2>
        <p className="text-[10px] sm:text-xs text-[#94a3b8] truncate">ETF Lecture Theatre · Faculty of Eng.</p>
        <p className="hidden sm:block mt-1 text-[11px] text-[#cbd5e1] leading-relaxed">
          Dr. Osuji is lecturing on Thermodynamics at the blackboard. You are seated in the front row desk taking notes.
        </p>
      </div>

      {/* Toast Alert */}
      {toast ? (
        <div className="pointer-events-none absolute inset-x-3 top-16 sm:top-20 z-40 mx-auto max-w-sm sm:max-w-md animate-bounce rounded-2xl bg-[#061826]/95 border-2 border-[#22c55e] p-2.5 sm:p-3 text-center shadow-2xl backdrop-blur-md">
          <p className="text-xs sm:text-sm font-bold text-[#4ade80]">{toast}</p>
        </div>
      ) : null}

      {/* Mobile-Optimized Collapsible Student Actions Panel */}
      <div className="absolute left-3 top-24 sm:top-28 z-30 w-[calc(100%-1.5rem)] sm:w-72 max-h-[50vh] sm:max-h-[calc(100%-8rem)] flex flex-col rounded-2xl bg-[#09111c]/95 border border-[#e0b15a]/35 shadow-2xl backdrop-blur-xl transition-all">
        {/* Toggle Bar */}
        <div className="flex items-center justify-between p-2.5 sm:p-3 border-b border-white/10">
          <div className="min-w-0 pr-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#e0b15a]">Classroom Actions</p>
            <p className="text-[11px] text-[#cbd5e1] truncate">
              {actionsOpen ? "Tap an action to study" : `Notes: ${notesCount} pgs · Tap to open`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActionsOpen(!actionsOpen)}
            className="shrink-0 rounded-lg bg-[#e0b15a]/20 border border-[#e0b15a]/40 px-2.5 py-1 text-[11px] font-bold text-[#e0b15a] hover:bg-[#e0b15a]/30 transition-colors"
          >
            {actionsOpen ? "Hide ▴" : "Actions ▾"}
          </button>
        </div>

        {actionsOpen ? (
          <div className="p-2 space-y-1.5 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setNotesCount((c) => c + 1);
                showToast("✍️ Copied Navier-Stokes & Carnot cycle formulas into lecture notebook!");
              }}
              className="w-full flex items-center justify-between rounded-xl bg-white/5 p-2 text-left hover:bg-white/10 border border-white/5 transition-all active:scale-95"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">✍️</span>
                <div>
                  <p className="text-xs font-bold text-white">Take Lecture Notes</p>
                  <p className="text-[10px] text-[#94a3b8]">Record key formulas &amp; diagrams</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#4ade80]">+Study</span>
            </button>

            <button
              type="button"
              onClick={() => {
                showToast("🙋‍♂️ You asked about Boundary Layer separation. Dr. Osuji explains: 'Good question! Observe the pressure gradient.'");
              }}
              className="w-full flex items-center justify-between rounded-xl bg-white/5 p-2 text-left hover:bg-white/10 border border-white/5 transition-all active:scale-95"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🙋‍♂️</span>
                <div>
                  <p className="text-xs font-bold text-white">Ask Question</p>
                  <p className="text-[10px] text-[#94a3b8]">Clarify lecture problem with lecturer</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#38bdf8]">Raise Hand</span>
            </button>

            <button
              type="button"
              onClick={() => {
                showToast("📚 Studied past exam questions for ENG 204. Ready for Friday's test!");
              }}
              className="w-full flex items-center justify-between rounded-xl bg-white/5 p-2 text-left hover:bg-white/10 border border-white/5 transition-all active:scale-95"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">📚</span>
                <div>
                  <p className="text-xs font-bold text-white">Study for Exams</p>
                  <p className="text-[10px] text-[#94a3b8]">Review course handouts &amp; past papers</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#e0b15a]">Prepare</span>
            </button>

            <button
              type="button"
              onClick={() => {
                showToast("💧 Chilled Pure Water enjoyed! Energy restored · −₦100");
              }}
              className="w-full flex items-center justify-between rounded-xl bg-gradient-to-r from-[#0284c7]/20 to-[#0ea5e9]/10 border border-[#38bdf8]/40 px-3 py-1.5 text-xs font-bold text-[#38bdf8] hover:bg-[#0284c7]/30 transition-all active:scale-95 shadow"
            >
              <span>🥤 Cold Pure Water</span>
              <span className="text-[11px] text-[#e0b15a]">₦100</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* Mobile-Friendly Camera Presets (Bottom Center) */}
      <div className="absolute inset-x-2 sm:inset-x-3 bottom-3 z-30 mx-auto flex max-w-sm sm:max-w-md items-center justify-center gap-1 rounded-2xl bg-[#09111c]/90 border border-white/10 p-1 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setViewPreset("desk")}
          className="flex-1 rounded-xl py-1 text-[10px] sm:text-[11px] font-bold text-[#cbd5e1] hover:bg-white/10 transition-all active:scale-95 text-center"
        >
          🎓 Desk
        </button>
        <button
          type="button"
          onClick={() => setViewPreset("lecturer")}
          className="flex-1 rounded-xl py-1 text-[10px] sm:text-[11px] font-bold text-[#cbd5e1] hover:bg-white/10 transition-all active:scale-95 text-center"
        >
          👨‍🏫 Board
        </button>
        <button
          type="button"
          onClick={() => setViewPreset("overview")}
          className="flex-1 rounded-xl py-1 text-[10px] sm:text-[11px] font-bold text-[#e0b15a] bg-white/10 transition-all active:scale-95 text-center"
        >
          🏛 Theatre
        </button>
        <button
          type="button"
          onClick={() => setViewPreset("topdown")}
          className="flex-1 rounded-xl py-1 text-[10px] sm:text-[11px] font-bold text-[#cbd5e1] hover:bg-white/10 transition-all active:scale-95 text-center"
        >
          🦅 Top-Down
        </button>
      </div>

      {/* Compact Zoom and Orbit Controls (Top-Right) */}
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
