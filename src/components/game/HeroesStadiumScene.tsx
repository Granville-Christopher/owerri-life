"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { LookId } from "@/lib/game/types";
import { createRealisticHuman } from "@/lib/game/humanModel";

// Canvas texture helper for scoreboard
function createScoreboardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, "#08141f");
  grad.addColorStop(1, "#03080e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Outer border & frame
  ctx.strokeStyle = "#e0b15a";
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, 1012, 500);

  // Header banner
  ctx.fillStyle = "#1d4a66";
  ctx.fillRect(14, 14, 996, 76);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("IMO HEROES SQUARE STADIUM · DAN ANYIAM ARENA", 512, 64);

  // Match info
  ctx.fillStyle = "#e0b15a";
  ctx.font = "bold 26px sans-serif";
  ctx.fillText("NPFL MATCHDAY · OWERRI DERBY", 512, 130);

  // Heartland FC (Home)
  ctx.fillStyle = "#f6f1e6";
  ctx.font = "bold 48px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("HEARTLAND FC", 60, 220);
  ctx.font = "24px sans-serif";
  ctx.fillStyle = "#38bdf8";
  ctx.fillText("Owerri (Home)", 60, 260);

  // Score box
  ctx.fillStyle = "#142838";
  ctx.fillRect(412, 160, 200, 120);
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 4;
  ctx.strokeRect(412, 160, 200, 120);
  ctx.fillStyle = "#f2c14e";
  ctx.font = "bold 78px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("2 - 1", 512, 252);

  // Enyimba FC (Away)
  ctx.fillStyle = "#f6f1e6";
  ctx.font = "bold 48px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("ENYIMBA FC", 964, 220);
  ctx.font = "24px sans-serif";
  ctx.fillStyle = "#a3e635";
  ctx.fillText("Aba (Away)", 964, 260);

  // Match Clock
  ctx.fillStyle = "#22c55e";
  ctx.font = "bold 36px monospace";
  ctx.textAlign = "center";
  ctx.fillText("⏱ 78:42 · 2nd HALF", 512, 335);

  // Goal scorers
  ctx.fillStyle = "#d1d5db";
  ctx.font = "22px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("⚽ Chukwuemeka 24', Nnamdi 61'", 60, 390);
  ctx.textAlign = "right";
  ctx.fillText("⚽ Jude 51' (Pen)", 964, 390);

  // Bottom ticker
  ctx.fillStyle = "#111827";
  ctx.fillRect(14, 430, 996, 68);
  ctx.fillStyle = "#e0b15a";
  ctx.font = "bold 26px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("★ WELCOME TO HEROES SQUARE · HEARTLAND PRIDE · OWERRI LIFE ★", 512, 474);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Canvas texture for pitch-side LED perimeter boards
function createAdBannerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "#0c1e28";
  ctx.fillRect(0, 0, 1024, 128);

  ctx.strokeStyle = "#e0b15a";
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 1016, 120);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("★ OWERRI LIFE  |  HERO LAGER · CELEBRATE THE BRAVE  |  DAN ANYIAM ARENA  |  TETLOW GADGETS ★", 512, 74);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Canvas texture for pitch field markings
function createPitchTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Alternating grass stripes
  const stripes = 12;
  const stripeH = 1024 / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#2d7a3e" : "#368c4a";
    ctx.fillRect(0, i * stripeH, 1024, stripeH);
  }

  // Field line markings
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 10;

  // Outer boundary
  ctx.strokeRect(60, 60, 904, 904);

  // Halfway line
  ctx.beginPath();
  ctx.moveTo(60, 512);
  ctx.lineTo(964, 512);
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(512, 512, 140, 0, Math.PI * 2);
  ctx.stroke();

  // Center spot
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(512, 512, 14, 0, Math.PI * 2);
  ctx.fill();

  // North penalty box (top)
  ctx.strokeRect(262, 60, 500, 220);
  ctx.strokeRect(382, 60, 260, 90);
  ctx.beginPath();
  ctx.arc(512, 200, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(512, 200, 110, 0.65, Math.PI - 0.65);
  ctx.stroke();

  // South penalty box (bottom)
  ctx.strokeRect(262, 744, 500, 220);
  ctx.strokeRect(382, 874, 260, 90);
  ctx.beginPath();
  ctx.arc(512, 824, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(512, 824, 110, Math.PI + 0.65, -0.65);
  ctx.stroke();

  // Corner arcs
  const corners = [
    [60, 60, 0, Math.PI / 2],
    [964, 60, Math.PI / 2, Math.PI],
    [964, 964, Math.PI, (Math.PI * 3) / 2],
    [60, 964, (Math.PI * 3) / 2, Math.PI * 2],
  ] as const;
  for (const [cx, cy, sa, ea] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, 32, sa, ea);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function HeroesStadiumScene({
  look = "chidi",
  username = "You",
  people = [],
}: {
  look?: LookId;
  username?: string;
  people?: Array<{ id: string; name: string; look: LookId | null }>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const rig = useRef({ yaw: -0.85, pitch: 0.38, zoom: 1.6 });
  const [cameraView, setCameraView] = useState<"seat" | "stadium" | "match" | "aerial">("seat");
  const [chantMessage, setChantMessage] = useState<string | null>(null);

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
    scene.background = new THREE.Color("#7db4d8");
    scene.fog = new THREE.FogExp2("#7db4d8", 0.005);

    // Sun & Sky lights
    scene.add(new THREE.HemisphereLight(0xfff8e8, 0x3d7040, 1.2));

    const sun = new THREE.DirectionalLight(0xfff2dc, 1.4);
    sun.position.set(24, 45, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 140;
    sun.shadow.camera.left = -40;
    sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    scene.add(sun);

    const arena = new THREE.Group();
    scene.add(arena);

    // Helper
    const box = (w: number, h: number, d: number, color: number, x: number, y: number, z: number, cast = true) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
      mesh.position.set(x, y, z);
      mesh.castShadow = cast;
      mesh.receiveShadow = true;
      arena.add(mesh);
      return mesh;
    };

    // Ground platform around stadium
    box(90, 0.2, 90, 0xd2cbbe, 0, -0.1, 0, false);

    // ATHLETIC RUNNING TRACK (Terracotta / Brick Red)
    box(46, 0.14, 60, 0xa83b24, 0, 0.07, 0, false);
    for (let lane = 1; lane <= 4; lane++) {
      const insetX = lane * 1.4;
      const insetZ = lane * 1.6;
      const lw = 46 - insetX * 2;
      const ld = 60 - insetZ * 2;
      box(lw, 0.02, 0.08, 0xffffff, 0, 0.16, -ld / 2, false);
      box(lw, 0.02, 0.08, 0xffffff, 0, 0.16, ld / 2, false);
      box(0.08, 0.02, ld, 0xffffff, -lw / 2, 0.16, 0, false);
      box(0.08, 0.02, ld, 0xffffff, lw / 2, 0.16, 0, false);
    }

    // FOOTBALL PITCH (Field)
    const pitchMat = new THREE.MeshLambertMaterial({ map: createPitchTexture() });
    const pitchPlane = new THREE.Mesh(new THREE.PlaneGeometry(28, 42), pitchMat);
    pitchPlane.rotation.x = -Math.PI / 2;
    pitchPlane.position.set(0, 0.18, 0);
    pitchPlane.receiveShadow = true;
    arena.add(pitchPlane);

    // 3D GOALPOSTS
    const makeGoal = (zPos: number, rotY: number) => {
      const goal = new THREE.Group();
      const white = new THREE.MeshLambertMaterial({ color: 0xffffff });
      const netMat = new THREE.MeshBasicMaterial({ color: 0xe0e7ff, transparent: true, opacity: 0.5, wireframe: true });

      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.2, 8), white);
      p1.position.set(-3.2, 1.1, 0);
      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.2, 8), white);
      p2.position.set(3.2, 1.1, 0);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 6.4, 8), white);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0, 2.2, 0);
      const netBox = new THREE.Mesh(new THREE.BoxGeometry(6.4, 2.2, 1.2), netMat);
      netBox.position.set(0, 1.1, -0.6);

      goal.add(p1, p2, bar, netBox);
      goal.position.set(0, 0, zPos);
      goal.rotation.y = rotY;
      arena.add(goal);
    };
    makeGoal(-20.8, 0);
    makeGoal(20.8, Math.PI);

    // CORNER FLAGS
    const cornerPos = [
      [-13.8, -20.8],
      [13.8, -20.8],
      [-13.8, 20.8],
      [13.8, 20.8],
    ] as const;
    cornerPos.forEach(([cx, cz]) => {
      box(0.06, 1.4, 0.06, 0xffffff, cx, 0.7, cz, false);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.28), new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide }));
      flag.position.set(cx + 0.2, 1.25, cz);
      arena.add(flag);
    });

    // PITCH-SIDE LED ADVERTISING BOARDS
    const adMat = new THREE.MeshBasicMaterial({ map: createAdBannerTexture() });
    const bE = new THREE.Mesh(new THREE.PlaneGeometry(40, 1.1), adMat);
    bE.position.set(17, 0.65, 0);
    bE.rotation.y = -Math.PI / 2;
    const bW = new THREE.Mesh(new THREE.PlaneGeometry(40, 1.1), adMat);
    bW.position.set(-17, 0.65, 0);
    bW.rotation.y = Math.PI / 2;
    const bN = new THREE.Mesh(new THREE.PlaneGeometry(26, 1.1), adMat);
    bN.position.set(0, 0.65, -24);
    const bS = new THREE.Mesh(new THREE.PlaneGeometry(26, 1.1), adMat);
    bS.position.set(0, 0.65, 24);
    bS.rotation.y = Math.PI;
    arena.add(bE, bW, bN, bS);

    // SOCCER BALL ON PITCH
    const ballGeo = new THREE.SphereGeometry(0.24, 16, 12);
    const ballMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.set(2.4, 0.36, -3.2); // In play between players
    ball.castShadow = true;
    arena.add(ball);

    // ─────────────────────────────────────────────────────────────
    // TWO FULL TEAMS PLAYING SOCCER ON THE PITCH!
    // (Heartland FC Red vs Enyimba FC Blue + Referee)
    // ─────────────────────────────────────────────────────────────
    const makePitchPlayer = (x: number, z: number, jerseyColor: number, rotY = 0) => {
      const p = createRealisticHuman({
        seated: false,
        scale: 0.65,
        customShirt: jerseyColor,
        customPants: 0xffffff, // White shorts
      });
      p.position.set(x, 0.18, z);
      p.rotation.y = rotY;
      arena.add(p);
      return p;
    };

    // Heartland FC (Home team - Red jerseys #c42032)
    const heartlandPositions = [
      [0, -19.5, 0], // Goalkeeper
      [-8, -13, 0], [-2.5, -14, 0], [2.5, -14, 0], [8, -13, 0], // Defenders
      [-6, -6, 0], [-1.5, -5, 0], [2, -6, 0], [6.5, -5.5, 0], // Midfielders
      [-2, 1.2, 0], [3, -1.8, 0], // Forwards near ball
    ] as const;
    heartlandPositions.forEach(([px, pz, rot]) => {
      makePitchPlayer(px, pz, 0xc42032, rot);
    });

    // Enyimba FC (Away team - Blue jerseys #1d4ed8)
    const enyimbaPositions = [
      [0, 19.5, Math.PI], // Goalkeeper
      [-8, 13, Math.PI], [-2.5, 14, Math.PI], [2.5, 14, Math.PI], [8, 13, Math.PI], // Defenders
      [-6, 6, Math.PI], [-1.5, 5, Math.PI], [2, 6, Math.PI], [6.5, 5.5, Math.PI], // Midfielders
      [-1, -0.8, Math.PI], [4, 2.5, Math.PI], // Forwards contesting ball
    ] as const;
    enyimbaPositions.forEach(([px, pz, rot]) => {
      makePitchPlayer(px, pz, 0x1d4ed8, rot);
    });

    // Referee (Neon Yellow jersey #eab308)
    makePitchPlayer(4.5, -0.5, 0xfacc15, -0.6);

    // ─────────────────────────────────────────────────────────────
    // SPECTATOR GRANDSTANDS & THE USER SEATED IN THE STANDS!
    // ─────────────────────────────────────────────────────────────
    const SEAT_COLORS = [0x1d4a66, 0x1f6b45, 0xffffff, 0xf2c14e, 0x1d4a66, 0x1f6b45];

    // North & South Stands
    const makeTieredStand = (zSign: number) => {
      for (let t = 0; t < 6; t++) {
        const z = zSign * (26 + t * 2.2);
        const y = 0.5 + t * 0.95;
        const color = SEAT_COLORS[t % SEAT_COLORS.length];

        box(48 + t * 2.5, 0.95, 2.2, 0xd4cdc3, 0, y, z, true);

        const seatCount = 18 + t * 2;
        const spacing = (46 + t * 2.5) / seatCount;
        for (let s = 0; s < seatCount; s++) {
          if (s % 6 === 0) continue;
          const sx = -((46 + t * 2.5) / 2) + s * spacing;
          box(0.7, 0.45, 0.7, color, sx, y + 0.65, z, false);

          // Real seated spectator people in stands
          if ((s + t) % 3 === 0) {
            const spectatorLook: LookId = ["ada", "chidi", "ngozi", "emeka", "zara", "ibe"][(s + t) % 6] as LookId;
            const fan = createRealisticHuman({
              lookId: spectatorLook,
              seated: true,
              scale: 0.55,
              customShirt: [0x1d4a66, 0x1f6b45, 0xc42032, 0xf2c14e][(s * 2) % 4],
            });
            fan.position.set(sx, y + 0.65, z);
            fan.rotation.y = zSign > 0 ? Math.PI : 0;
            arena.add(fan);
          }
        }
      }
    };
    makeTieredStand(-1); // North Stand
    makeTieredStand(1); // South Stand

    // East Stand (Popular Terraces)
    for (let t = 0; t < 6; t++) {
      const x = 21 + t * 2.2;
      const y = 0.5 + t * 0.95;
      box(2.2, 0.95, 50 + t * 2.5, 0xd4cdc3, x, y, 0, true);

      const seatCount = 20 + t * 2;
      const spacing = (48 + t * 2.5) / seatCount;
      for (let s = 0; s < seatCount; s++) {
        if (s % 7 === 0) continue;
        const sz = -((48 + t * 2.5) / 2) + s * spacing;
        box(0.7, 0.45, 0.7, 0x1f6b45, x, y + 0.65, sz, false);

        if ((s + t) % 3 === 1) {
          const spec = createRealisticHuman({
            lookId: ["chidi", "emeka", "ibe", "ada"][(s + t) % 4] as LookId,
            seated: true,
            scale: 0.55,
          });
          spec.position.set(x, y + 0.65, sz);
          spec.rotation.y = -Math.PI / 2; // Facing the pitch
          arena.add(spec);
        }
      }
    }

    // WEST STAND: MAIN VIP COVERED GRANDSTAND
    // Where the USER and friends sit in prime VIP seats!
    for (let t = 0; t < 6; t++) {
      const x = -(21 + t * 2.2);
      const y = 0.5 + t * 0.95;
      box(2.2, 0.95, 50 + t * 2.5, 0xd4cdc3, x, y, 0, true);

      const seatCount = 18 + t * 2;
      const spacing = (48 + t * 2.5) / seatCount;
      for (let s = 0; s < seatCount; s++) {
        if (s % 7 === 0) continue;
        const sz = -((48 + t * 2.5) / 2) + s * spacing;
        // Padded red VIP armchairs in front tiers
        box(0.7, 0.5, 0.7, t <= 2 ? 0x991b1b : 0x1d4a66, x, y + 0.65, sz, false);
      }
    }

    // 👑 THE USER'S SEAT IN THE VIP GRANDSTAND!
    // Front row VIP armchair with prime view overlooking the pitch:
    const userSeatX = -21.8;
    const userSeatY = 0.85;
    const userSeatZ = 0;

    // User's VIP armchair with gold armrests
    box(0.85, 0.6, 0.85, 0xb91c1c, userSeatX, userSeatY + 0.35, userSeatZ);
    box(0.1, 0.4, 0.85, 0xe0b15a, userSeatX + 0.38, userSeatY + 0.65, userSeatZ);
    box(0.1, 0.4, 0.85, 0xe0b15a, userSeatX - 0.38, userSeatY + 0.65, userSeatZ);

    // Realistic User Avatar seated in VIP armchair
    const userAvatar = createRealisticHuman({
      lookId: look,
      seated: true,
      scale: 0.62,
    });
    userAvatar.position.set(userSeatX, userSeatY + 0.35, userSeatZ);
    userAvatar.rotation.y = Math.PI / 2; // Facing pitch
    arena.add(userAvatar);

    // Other users / friends seated next to the user in VIP stands!
    const companionList = people.filter((p) => p.name !== username).slice(0, 5);
    const defaultCompanions: LookId[] = ["ada", "zara", "emeka", "ngozi", "ibe"];

    for (let c = 1; c <= 4; c++) {
      // Seats to the left and right of user
      const sideZ = c % 2 === 1 ? Math.ceil(c / 2) * 1.3 : -Math.ceil(c / 2) * 1.3;
      const compLook = companionList[c - 1]?.look ?? defaultCompanions[c - 1] ?? "ada";

      const compAvatar = createRealisticHuman({
        lookId: compLook,
        seated: true,
        scale: 0.62,
      });
      compAvatar.position.set(userSeatX, userSeatY + 0.35, sideZ);
      compAvatar.rotation.y = Math.PI / 2; // Facing pitch
      arena.add(compAvatar);
    }

    // VIP CANOPY ROOF & BROADCAST BOOTH
    for (let cz = -22; cz <= 22; cz += 11) {
      box(0.6, 13, 0.6, 0x334155, -35, 6.5, cz);
      const arm = box(15, 0.5, 0.5, 0x475569, -27.5, 12.8, cz);
      arm.rotation.z = 0.12;
    }
    const roof = box(17, 0.4, 54, 0xf8fafc, -26.5, 13.2, 0);
    roof.rotation.z = 0.12;

    // GIANT SCOREBOARD (North End)
    box(0.8, 14, 0.8, 0x334155, -8, 7, -39);
    box(0.8, 14, 0.8, 0x334155, 8, 7, -39);
    box(23, 11.5, 1.4, 0x0f172a, 0, 14.8, -39);
    const screenMat = new THREE.MeshBasicMaterial({ map: createScoreboardTexture() });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(22.2, 10.8), screenMat);
    screen.position.set(0, 14.8, -38.2);
    arena.add(screen);

    // 4 FLOODLIGHT TOWERS
    const corners4 = [
      [-28, -35],
      [28, -35],
      [-28, 35],
      [28, 35],
    ] as const;

    corners4.forEach(([lx, lz]) => {
      box(2.2, 1.2, 2.2, 0x334155, lx, 0.6, lz);
      box(0.9, 21, 0.9, 0x475569, lx, 11, lz);

      const head = new THREE.Group();
      head.add(new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.6, 0.8), new THREE.MeshLambertMaterial({ color: 0x1e293b })));
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfffde8 }));
          bulb.position.set(-1.8 + c * 1.2, -0.8 + r * 0.8, 0.45);
          head.add(bulb);
        }
      }
      head.position.set(lx, 21.8, lz);
      head.lookAt(0, 2, 0);
      arena.add(head);

      const pLight = new THREE.PointLight(0xfff5e0, 28, 70);
      pLight.position.set(lx * 0.9, 21, lz * 0.9);
      arena.add(pLight);
    });

    // CAMERA SETUP
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 250);

    const fit = () => {
      renderer.setSize(root.clientWidth || 1, root.clientHeight || 1);
      camera.aspect = (root.clientWidth || 1) / (root.clientHeight || 1);
      camera.updateProjectionMatrix();
    };
    fit();

    // Zoom wheel with expanded range (up to 8.0x closer!)
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
      rig.current.zoom = Math.min(8.0, Math.max(0.35, rig.current.zoom * factor));
    };
    root.addEventListener("wheel", onWheel, { passive: false });

    let frame = 0;
    let alive = true;

    const loop = () => {
      if (!alive) return;

      arena.rotation.y = rig.current.yaw;

      let targetDist = 28;
      let targetHeight = 12;
      let lookAtX = 0;
      let lookAtY = 1.4;
      let lookAtZ = 0;

      if (cameraView === "seat") {
        // Close-up on the user seated in VIP Grandstand!
        targetDist = 7.5;
        targetHeight = 2.4;
        lookAtX = -18;
        lookAtY = 1.6;
        lookAtZ = 0;
      } else if (cameraView === "match") {
        // Focused view of football match action on pitch
        targetDist = 18;
        targetHeight = 7.5;
        lookAtX = 0;
        lookAtY = 1.2;
        lookAtZ = 0;
      } else if (cameraView === "stadium") {
        // Elevated wide view of entire stadium bowl and stands
        targetDist = 34;
        targetHeight = 16;
        lookAtX = 0;
        lookAtY = 2.0;
        lookAtZ = 0;
      } else if (cameraView === "aerial") {
        // Bird's eye view
        targetDist = 55;
        targetHeight = 36;
        lookAtX = 0;
        lookAtY = 0;
        lookAtZ = 0;
      }

      // Smooth camera position with super close zoom capability
      const dist = targetDist / rig.current.zoom;
      const pitch = rig.current.pitch;
      camera.position.set(
        lookAtX + Math.sin(pitch) * dist * 0.48,
        targetHeight / rig.current.zoom + 0.4,
        lookAtZ + Math.cos(pitch) * dist
      );
      camera.lookAt(lookAtX, lookAtY, lookAtZ);

      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(loop);
    };
    loop();

    const onResize = () => fit();
    window.addEventListener("resize", onResize);

    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      root.removeEventListener("wheel", onWheel);
      renderer.dispose();
      root.removeChild(renderer.domElement);
    };
  }, [look, cameraView, username, people]);

  function turn(dir: number) {
    rig.current.yaw += dir * 0.45;
  }
  function dolly(factor: number) {
    rig.current.zoom = Math.min(8.0, Math.max(0.35, rig.current.zoom * factor));
  }

  function handleChant() {
    const chants = [
      "📣 'Nzogbu Nzogbu, Enyimba Enyi! Heartland Odeshi!'",
      "📣 'Up Heartland! Owerri Millionaires are taking the 3 points!'",
      "📣 'Dan Anyiam is rocking! The whole stand is on their feet!'",
      "📣 'Goal scorer Nnamdi! What a strike from outside the box!'",
    ];
    const picked = chants[Math.floor(Math.random() * chants.length)];
    setChantMessage(picked);
    window.setTimeout(() => setChantMessage(null), 3800);
  }

  function handleRefreshment() {
    setChantMessage("🥤 Stadium vendor served you a cold Malt drink & hot meat pie in your VIP seat!");
    window.setTimeout(() => setChantMessage(null), 3800);
  }

  return (
    <div className="absolute inset-0 bg-[#08131d] text-[#f6f1e6]">
      {/* 3D WebGL Canvas */}
      <div
        ref={host}
        className="absolute inset-0 touch-none"
        onPointerDown={(event) => {
          const surface = event.currentTarget;
          surface.setPointerCapture(event.pointerId);
          surface.dataset.x = String(event.clientX);
          surface.dataset.y = String(event.clientY);
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          const lastX = Number(event.currentTarget.dataset.x ?? event.clientX);
          const lastY = Number(event.currentTarget.dataset.y ?? event.clientY);
          rig.current.yaw += (event.clientX - lastX) * 0.007;
          rig.current.pitch = Math.max(0.12, Math.min(1.4, rig.current.pitch + (event.clientY - lastY) * 0.004));
          event.currentTarget.dataset.x = String(event.clientX);
          event.currentTarget.dataset.y = String(event.clientY);
        }}
      />

      {/* Mobile-Optimized Stadium & VIP Seat Badge */}
      <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-[calc(100%-4.5rem)] sm:max-w-xs rounded-2xl bg-[#091e2b]/90 p-2.5 sm:p-3 shadow-2xl backdrop-blur-md border border-[#38bdf8]/30">
        <div className="flex items-center gap-1.5">
          <span className="flex h-2.5 w-2.5 animate-ping rounded-full bg-[#22c55e]" />
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.16em] text-[#e0b15a]">VIP Grandstand · Seated</p>
        </div>
        <h2 className="mt-0.5 font-bold text-sm sm:text-base text-white truncate">Imo Heroes Square Stadium</h2>
        <p className="text-[10px] sm:text-xs text-[#94a3b8] truncate">VIP Covered Stand · Front Row</p>
        <div className="mt-1.5 flex items-center justify-between rounded-lg bg-[#06121c] px-2 py-0.5 text-[10px] sm:text-xs">
          <span className="font-semibold text-[#38bdf8]">Heartland 2</span>
          <span className="text-[9px] text-[#e0b15a] font-bold">VS</span>
          <span className="font-semibold text-[#a3e635]">1 Enyimba</span>
          <span className="rounded bg-[#16a34a]/30 px-1 py-0.2 text-[8px] sm:text-[9px] font-semibold text-[#4ade80]">78&apos;</span>
        </div>
      </div>

      {/* Floating Stand Actions (Positioned above camera bar) */}
      <div className="absolute right-2.5 sm:right-3 bottom-14 z-30 flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleChant}
          className="flex items-center gap-1 rounded-full bg-[#0284c7] px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-white shadow-xl hover:bg-[#0369a1] active:scale-95 transition-all border border-[#38bdf8]/40"
        >
          <span>📣</span>
          <span className="hidden sm:inline">Chant in Stands</span>
          <span className="sm:hidden">Chant</span>
        </button>
        <button
          type="button"
          onClick={handleRefreshment}
          className="flex items-center gap-1 rounded-full bg-[#16a34a] px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-white shadow-xl hover:bg-[#15803d] active:scale-95 transition-all border border-[#4ade80]/40"
        >
          <span>🥤</span>
          <span className="hidden sm:inline">Order Snack · ₦1,500</span>
          <span className="sm:hidden">Snack · ₦1.5k</span>
        </button>
      </div>

      {/* Responsive Camera Presets (Bottom Center) */}
      <div className="absolute inset-x-2 sm:inset-x-3 bottom-3 z-30 mx-auto flex max-w-sm sm:max-w-md items-center justify-center gap-1 rounded-2xl bg-[#091e2b]/90 border border-white/10 p-1 backdrop-blur-md">
        {(
          [
            ["seat", "👑 VIP", "👑 My VIP Seat"],
            ["match", "⚽ Match", "⚽ Match Action"],
            ["stadium", "🏟 Stadium", "🏟 Full Stadium"],
            ["aerial", "🦅 Sky", "🦅 Aerial"],
          ] as const
        ).map(([key, mobileLabel, deskLabel]) => (
          <button
            key={key}
            type="button"
            onClick={() => setCameraView(key)}
            className={`flex-1 rounded-xl py-1 text-[10px] sm:text-[11px] font-semibold transition-all active:scale-95 text-center ${
              cameraView === key
                ? "bg-[#e0b15a] text-[#0f172a] font-bold shadow"
                : "text-[#d1d5db] hover:bg-white/10"
            }`}
          >
            <span className="sm:hidden">{mobileLabel}</span>
            <span className="hidden sm:inline">{deskLabel}</span>
          </button>
        ))}
      </div>

      {/* Chant / Snack Toast */}
      {chantMessage ? (
        <div className="pointer-events-none absolute inset-x-3 top-20 z-40 mx-auto max-w-sm rounded-2xl bg-[#061826]/95 border-2 border-[#e0b15a] p-2.5 sm:p-3 text-center shadow-2xl backdrop-blur-md">
          <p className="text-xs sm:text-sm font-bold text-[#e0b15a]">{chantMessage}</p>
        </div>
      ) : null}

      {/* Compact Zoom and Orbit Controls (Top-Right) */}
      <div className="absolute right-2.5 top-3 z-30 flex flex-col gap-1">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => dolly(1.25)}
          className="grid h-8 w-8 place-items-center rounded-full bg-white text-base font-bold text-[#0f172a] shadow-lg active:scale-90 transition-transform"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => dolly(1 / 1.25)}
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
