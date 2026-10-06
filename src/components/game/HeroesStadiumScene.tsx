"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { LOOKS } from "@/lib/game/content";
import type { LookId } from "@/lib/game/types";

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

  // Team names & score
  // Heartland FC
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

  // Enyimba FC
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
  // North 6-yard box
  ctx.strokeRect(382, 60, 260, 90);
  // North penalty spot
  ctx.beginPath();
  ctx.arc(512, 200, 10, 0, Math.PI * 2);
  ctx.fill();
  // North penalty arc
  ctx.beginPath();
  ctx.arc(512, 200, 110, 0.65, Math.PI - 0.65);
  ctx.stroke();

  // South penalty box (bottom)
  ctx.strokeRect(262, 744, 500, 220);
  // South 6-yard box
  ctx.strokeRect(382, 874, 260, 90);
  // South penalty spot
  ctx.beginPath();
  ctx.arc(512, 824, 10, 0, Math.PI * 2);
  ctx.fill();
  // South penalty arc
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
  look,
  username = "You",
}: {
  look: LookId;
  username?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const rig = useRef({ yaw: 0.45, pitch: 0.48, zoom: 1 });
  const [cameraView, setCameraView] = useState<"pitch" | "vip" | "goal" | "aerial">("pitch");
  const [chantMessage, setChantMessage] = useState<string | null>(null);
  const [ballKicked, setBallKicked] = useState(false);
  const ballMeshRef = useRef<THREE.Mesh | null>(null);

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
    scene.background = new THREE.Color("#7db4d8"); // Bright open sky
    scene.fog = new THREE.FogExp2("#7db4d8", 0.007);

    // Sun & Sky lights
    const hemi = new THREE.HemisphereLight(0xfff8e8, 0x3d7040, 1.15);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff2dc, 1.35);
    sun.position.set(24, 45, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 120;
    sun.shadow.camera.left = -35;
    sun.shadow.camera.right = 35;
    sun.shadow.camera.top = 35;
    sun.shadow.camera.bottom = -35;
    scene.add(sun);

    const arena = new THREE.Group();
    scene.add(arena);

    // Helpers
    const box = (w: number, h: number, d: number, color: number, x: number, y: number, z: number, cast = true) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
      mesh.position.set(x, y, z);
      mesh.castShadow = cast;
      mesh.receiveShadow = true;
      arena.add(mesh);
      return mesh;
    };

    // Ground platform around stadium
    box(80, 0.2, 80, 0xd2cbbe, 0, -0.1, 0, false);

    // ATHLETIC RUNNING TRACK (Terracotta / Brick Red)
    const track = box(44, 0.14, 58, 0xa83b24, 0, 0.07, 0, false);
    // Track white lane lines
    for (let lane = 1; lane <= 4; lane++) {
      const insetX = lane * 1.4;
      const insetZ = lane * 1.6;
      const lw = 44 - insetX * 2;
      const ld = 58 - insetZ * 2;
      // North & South lane lines
      box(lw, 0.02, 0.08, 0xffffff, 0, 0.16, -ld / 2, false);
      box(lw, 0.02, 0.08, 0xffffff, 0, 0.16, ld / 2, false);
      // East & West lane lines
      box(0.08, 0.02, ld, 0xffffff, -lw / 2, 0.16, 0, false);
      box(0.08, 0.02, ld, 0xffffff, lw / 2, 0.16, 0, false);
    }

    // FOOTBALL PITCH (Center field)
    const pitchMat = new THREE.MeshLambertMaterial({ map: createPitchTexture() });
    const pitchPlane = new THREE.Mesh(new THREE.PlaneGeometry(28, 42), pitchMat);
    pitchPlane.rotation.x = -Math.PI / 2;
    pitchPlane.position.set(0, 0.18, 0);
    pitchPlane.receiveShadow = true;
    arena.add(pitchPlane);

    // 3D GOALPOSTS (North and South)
    const makeGoal = (zPos: number, rotY: number) => {
      const goal = new THREE.Group();
      const white = new THREE.MeshLambertMaterial({ color: 0xffffff });
      const netMat = new THREE.MeshBasicMaterial({ color: 0xe0e7ff, transparent: true, opacity: 0.5, wireframe: true });

      // Left & Right posts
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.2, 8), white);
      p1.position.set(-3.2, 1.1, 0);
      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.2, 8), white);
      p2.position.set(3.2, 1.1, 0);

      // Crossbar
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 6.4, 8), white);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0, 2.2, 0);

      // Back support stanchions
      const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 6), white);
      s1.position.set(-3.2, 1.0, -1.2);
      const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 6), white);
      s2.position.set(3.2, 1.0, -1.2);

      // Net box
      const netBox = new THREE.Mesh(new THREE.BoxGeometry(6.4, 2.2, 1.2), netMat);
      netBox.position.set(0, 1.1, -0.6);

      goal.add(p1, p2, bar, s1, s2, netBox);
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

    // OFFICIAL SOCCER BALL (Center Spot)
    const ballGeo = new THREE.SphereGeometry(0.24, 16, 12);
    const ballMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.set(0, 0.36, 0);
    ball.castShadow = true;
    arena.add(ball);
    ballMeshRef.current = ball;

    // Ball pentagon spots
    for (let i = 0; i < 6; i++) {
      const spot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), new THREE.MeshBasicMaterial({ color: 0x111827 }));
      const theta = (i * Math.PI) / 3;
      spot.position.set(Math.cos(theta) * 0.22, 0.12 * (i % 2 === 0 ? 1 : -1), Math.sin(theta) * 0.22);
      ball.add(spot);
    }

    // PITCH-SIDE LED ADVERTISING BOARDS
    const adMat = new THREE.MeshBasicMaterial({ map: createAdBannerTexture() });
    const makeAdBoards = () => {
      // East touchline boards
      const bE = new THREE.Mesh(new THREE.PlaneGeometry(38, 1.1), adMat);
      bE.position.set(16.5, 0.65, 0);
      bE.rotation.y = -Math.PI / 2;
      arena.add(bE);

      // West touchline boards
      const bW = new THREE.Mesh(new THREE.PlaneGeometry(38, 1.1), adMat);
      bW.position.set(-16.5, 0.65, 0);
      bW.rotation.y = Math.PI / 2;
      arena.add(bW);

      // North goal boards
      const bN = new THREE.Mesh(new THREE.PlaneGeometry(24, 1.1), adMat);
      bN.position.set(0, 0.65, -23.5);
      arena.add(bN);

      // South goal boards
      const bS = new THREE.Mesh(new THREE.PlaneGeometry(24, 1.1), adMat);
      bS.position.set(0, 0.65, 23.5);
      bS.rotation.y = Math.PI;
      arena.add(bS);
    };
    makeAdBoards();

    // PLAYER DUGOUTS / TECHNICAL BENCHES (Touchline)
    const makeDugout = (zPos: number, teamColor: number, teamName: string) => {
      const dGroup = new THREE.Group();
      // Floor & frame
      dGroup.add(new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.14, 1.8), new THREE.MeshLambertMaterial({ color: 0x334155 })));
      // Arched canopy roof
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 5.4, 16, 1, false, 0, Math.PI), new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65, side: THREE.DoubleSide }));
      roof.rotation.z = Math.PI / 2;
      roof.position.set(0, 1.2, 0);
      dGroup.add(roof);
      // Bench seating (6 seats)
      for (let s = 0; s < 5; s++) {
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 0.5), new THREE.MeshLambertMaterial({ color: teamColor }));
        seat.position.set(-1.8 + s * 0.9, 0.35, -0.2);
        dGroup.add(seat);
      }
      dGroup.position.set(-18.5, 0.1, zPos);
      dGroup.rotation.y = Math.PI / 2;
      arena.add(dGroup);
      void teamName;
    };
    makeDugout(-5.5, 0x1d4a66, "Heartland FC");
    makeDugout(5.5, 0x1f6b45, "Visitors");

    // SPECTATOR GRANDSTANDS (Stepped Seating Bowl)
    const SEAT_COLORS = [0x1d4a66, 0x1f6b45, 0xffffff, 0xf2c14e, 0x1d4a66, 0x1f6b45];

    // North & South Stands
    const makeTieredStand = (zSign: number) => {
      const tiers = 6;
      for (let t = 0; t < tiers; t++) {
        const z = zSign * (25 + t * 2.2);
        const y = 0.5 + t * 0.95;
        const color = SEAT_COLORS[t % SEAT_COLORS.length];

        // Concrete tier step
        box(46 + t * 2.5, 0.95, 2.2, 0xd4cdc3, 0, y, z, true);

        // Rows of individual seats
        const seatCount = 20 + t * 2;
        const spacing = (44 + t * 2.5) / seatCount;
        for (let s = 0; s < seatCount; s++) {
          // Yellow gangway gaps every 7 seats
          if (s % 7 === 0) continue;
          const sx = -((44 + t * 2.5) / 2) + s * spacing;
          box(0.7, 0.45, 0.7, color, sx, y + 0.65, z, false);

          // Dot some cheering fans
          if ((s + t) % 3 === 0) {
            const fanColor = [0x1d4a66, 0x1f6b45, 0xe0b15a, 0xffffff, 0xc42032][(s * 3) % 5];
            const fan = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), new THREE.MeshLambertMaterial({ color: fanColor }));
            fan.position.set(sx, y + 1.15, z);
            arena.add(fan);
          }
        }
      }
    };
    makeTieredStand(-1); // North Stand
    makeTieredStand(1); // South Stand

    // East Stand
    const makeSideStand = (xSign: number, isVip: boolean) => {
      const tiers = 6;
      for (let t = 0; t < tiers; t++) {
        const x = xSign * (20 + t * 2.2);
        const y = 0.5 + t * 0.95;
        const color = isVip ? 0x1d4a66 : SEAT_COLORS[t % SEAT_COLORS.length];

        // Concrete tier step
        box(2.2, 0.95, 48 + t * 2.5, 0xd4cdc3, x, y, 0, true);

        // Rows of seats
        const seatCount = 22 + t * 2;
        const spacing = (46 + t * 2.5) / seatCount;
        for (let s = 0; s < seatCount; s++) {
          if (s % 8 === 0) continue;
          const sz = -((46 + t * 2.5) / 2) + s * spacing;
          box(0.7, 0.45, 0.7, color, x, y + 0.65, sz, false);

          // Spectators
          if ((s + t) % 3 === 1) {
            const fanColor = [0x1d4a66, 0x1f6b45, 0xe0b15a, 0xffffff][(s * 2) % 4];
            const fan = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), new THREE.MeshLambertMaterial({ color: fanColor }));
            fan.position.set(x, y + 1.15, sz);
            arena.add(fan);
          }
        }
      }
    };
    makeSideStand(1, false); // East Stand (Popular side)
    makeSideStand(-1, true); // West Stand (Main VIP stand)

    // MAIN VIP GRANDSTAND ROOF & EXECUTIVE PAVILION (West Stand)
    const makeVipCanopy = () => {
      // Cantilever structural steel truss columns
      for (let cz = -20; cz <= 20; cz += 10) {
        box(0.6, 12, 0.6, 0x334155, -34, 6, cz);
        // Cantilever arm projecting over seats
        const arm = box(14, 0.5, 0.5, 0x475569, -27, 11.8, cz);
        arm.rotation.z = 0.12;
      }
      // Curved aerodynamic grandstand canopy roof
      const roof = box(16, 0.4, 52, 0xf8fafc, -26, 12.2, 0);
      roof.rotation.z = 0.12;

      // Executive State Box / Commentary Gantry
      box(6, 2.8, 14, 0x0f172a, -31, 7.8, 0);
      // Panoramic glass viewing windows
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(13.8, 2.2), new THREE.MeshLambertMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.5 }));
      glass.position.set(-27.9, 7.8, 0);
      glass.rotation.y = Math.PI / 2;
      arena.add(glass);

      // VIP broadcast cameras on tripod
      const cam = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 1.1), new THREE.MeshLambertMaterial({ color: 0x111827 }));
      cam.position.set(-27.2, 8.2, 2.5);
      const camLens = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.6, 8), new THREE.MeshLambertMaterial({ color: 0x38bdf8 }));
      camLens.rotation.x = Math.PI / 2;
      camLens.position.set(-27.2, 8.2, 1.8);
      arena.add(cam, camLens);
    };
    makeVipCanopy();

    // GIANT SCOREBOARD TOWER (North End)
    const makeScoreboard = () => {
      // Scoreboard support pylons
      box(0.8, 14, 0.8, 0x334155, -8, 7, -38);
      box(0.8, 14, 0.8, 0x334155, 8, 7, -38);

      // Scoreboard screen housing
      box(22, 11, 1.4, 0x0f172a, 0, 14.5, -38);

      // High-res digital display screen
      const screenMat = new THREE.MeshBasicMaterial({ map: createScoreboardTexture() });
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(21.4, 10.4), screenMat);
      screen.position.set(0, 14.5, -37.2);
      arena.add(screen);
    };
    makeScoreboard();

    // 4 TOWERING CORNER FLOODLIGHT PYLONS
    const floodlightSpots: THREE.PointLight[] = [];
    const corners4 = [
      [-26, -34],
      [26, -34],
      [-26, 34],
      [26, 34],
    ] as const;

    corners4.forEach(([lx, lz]) => {
      // Heavy base
      box(2.2, 1.2, 2.2, 0x334155, lx, 0.6, lz);
      // Steel lattice pylon
      box(0.9, 20, 0.9, 0x475569, lx, 10.6, lz);

      // Angled floodlight head rack
      const head = new THREE.Group();
      head.add(new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.6, 0.8), new THREE.MeshLambertMaterial({ color: 0x1e293b })));

      // Grid of 12 glowing halogen lamps
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfffde8 }));
          bulb.position.set(-1.8 + c * 1.2, -0.8 + r * 0.8, 0.45);
          head.add(bulb);
        }
      }
      head.position.set(lx, 21.2, lz);
      head.lookAt(0, 2, 0); // Aimed at pitch center
      arena.add(head);

      // Real point light from floodlight
      const pLight = new THREE.PointLight(0xfff5e0, 25, 60);
      pLight.position.set(lx * 0.9, 20, lz * 0.9);
      arena.add(pLight);
      floodlightSpots.push(pLight);
    });

    // PLAYER AVATAR ON THE PITCH
    const playerGroup = new THREE.Group();
    const pal = LOOKS.find((l) => l.id === look) ?? LOOKS[0];
    const skinMat = new THREE.MeshLambertMaterial({ color: pal.skin });
    const jerseyMat = new THREE.MeshLambertMaterial({ color: 0xc42032 }); // Heartland Red Jersey
    const shortsMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

    // Legs
    const lLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8), shortsMat);
    lLeg.position.set(-0.16, 0.4, 0);
    const rLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8), shortsMat);
    rLeg.position.set(0.16, 0.4, 0);
    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.8, 8), jerseyMat);
    torso.position.set(0, 1.15, 0);
    // Head
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), skinMat);
    headMesh.position.set(0, 1.75, 0);
    // Hair
    const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.23, 10, 8), new THREE.MeshLambertMaterial({ color: pal.hair }));
    hairMesh.position.set(0, 1.84, -0.02);
    hairMesh.scale.set(1.02, 0.55, 0.98);

    playerGroup.add(lLeg, rLeg, torso, headMesh, hairMesh);
    playerGroup.position.set(0, 0.18, 1.4);
    playerGroup.castShadow = true;
    arena.add(playerGroup);

    // EMEKA SQUARE (Regular NPC hanging out on the low wall)
    const emekaGroup = new THREE.Group();
    const emekaTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.75, 8), new THREE.MeshLambertMaterial({ color: 0x1f6b45 }));
    emekaTorso.position.set(0, 1.1, 0);
    const emekaHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshLambertMaterial({ color: 0x4a2a18 }));
    emekaHead.position.set(0, 1.65, 0);
    emekaGroup.add(emekaTorso, emekaHead);
    emekaGroup.position.set(-17, 0.18, -12);
    arena.add(emekaGroup);

    // CAMERA SETUP
    const camera = new THREE.PerspectiveCamera(38, 1, 0.2, 200);

    const fit = () => {
      renderer.setSize(root.clientWidth || 1, root.clientHeight || 1);
      camera.aspect = (root.clientWidth || 1) / (root.clientHeight || 1);
      camera.updateProjectionMatrix();
    };
    fit();

    // Wheel zoom
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
      rig.current.zoom = Math.min(2.8, Math.max(0.45, rig.current.zoom * factor));
    };
    root.addEventListener("wheel", onWheel, { passive: false });

    // Animation Loop
    let frame = 0;
    let alive = true;
    let ballTimer = 0;

    const loop = () => {
      if (!alive) return;

      // Ball kick animation
      if (ballKicked && ballMeshRef.current) {
        ballTimer += 0.05;
        if (ballTimer < 2.2) {
          const t = ballTimer;
          // Arching shot towards south goal (Z = 20.8)
          ballMeshRef.current.position.z = Math.min(20.4, t * 9.5);
          ballMeshRef.current.position.y = 0.36 + Math.sin(t * 1.6) * 2.1;
          ballMeshRef.current.rotation.x += 0.3;
        } else {
          // Ball in the net
          ballMeshRef.current.position.set(0, 0.36, 20.6);
        }
      }

      // Camera coordinates based on preset & rig
      arena.rotation.y = rig.current.yaw;

      let targetDist = 32;
      let targetHeight = 14;
      let lookAtY = 1.6;

      if (cameraView === "pitch") {
        targetDist = 18;
        targetHeight = 6.5;
        lookAtY = 1.2;
      } else if (cameraView === "vip") {
        targetDist = 42;
        targetHeight = 22;
        lookAtY = 2.0;
      } else if (cameraView === "goal") {
        targetDist = 24;
        targetHeight = 8;
        lookAtY = 1.5;
      } else if (cameraView === "aerial") {
        targetDist = 58;
        targetHeight = 38;
        lookAtY = 0;
      }

      const dist = (targetDist / rig.current.zoom);
      const rad = rig.current.pitch;
      camera.position.set(
        Math.sin(rad) * dist * 0.45,
        targetHeight / rig.current.zoom,
        Math.cos(rad) * dist
      );
      camera.lookAt(0, lookAtY, 0);

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
  }, [look, cameraView, ballKicked]);

  function turn(dir: number) {
    rig.current.yaw += dir * 0.45;
  }
  function dolly(factor: number) {
    rig.current.zoom = Math.min(2.8, Math.max(0.45, rig.current.zoom * factor));
  }

  function handleKickBall() {
    setBallKicked(true);
    setChantMessage("⚽ GOOOAL! Heartland FC scores! The whole stadium erupts in celebration!");
    window.setTimeout(() => {
      setBallKicked(false);
      if (ballMeshRef.current) ballMeshRef.current.position.set(0, 0.36, 0);
    }, 4500);
  }

  function handleChant() {
    const chants = [
      "📣 'Nzogbu Nzogbu, Enyimba Enyi! Heartland Odeshi!'",
      "📣 'Owerri Boys! No shaking on the pitch today!'",
      "📣 'Dan Anyiam is roaring! Stand up for the Naze Millionaires!'",
      "📣 'Owerri Life matchday! Victory for the home side!'",
    ];
    const picked = chants[Math.floor(Math.random() * chants.length)];
    setChantMessage(picked);
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
          rig.current.pitch = Math.max(0.15, Math.min(1.4, rig.current.pitch + (event.clientY - lastY) * 0.004));
          event.currentTarget.dataset.x = String(event.clientX);
          event.currentTarget.dataset.y = String(event.clientY);
        }}
      />

      {/* Stadium Header Badge */}
      <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-[19rem] rounded-2xl bg-[#091e2b]/90 p-3 shadow-2xl backdrop-blur-md border border-[#38bdf8]/30">
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 animate-ping rounded-full bg-[#22c55e]" />
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#e0b15a]">Matchday Live · Arena</p>
        </div>
        <h2 className="mt-1 font-bold text-base text-white">Imo Heroes Square Stadium</h2>
        <p className="text-xs text-[#94a3b8] mt-0.5">Dan Anyiam Stadium Complex, Wetheral Road</p>
        <div className="mt-2 flex items-center justify-between rounded-lg bg-[#06121c] px-2.5 py-1 text-xs">
          <span className="font-semibold text-[#38bdf8]">Heartland FC 2</span>
          <span className="text-[10px] text-[#e0b15a] font-bold">VS</span>
          <span className="font-semibold text-[#a3e635]">1 Enyimba FC</span>
          <span className="rounded bg-[#16a34a]/30 px-1.5 py-0.5 text-[9px] font-semibold text-[#4ade80]">78&apos;</span>
        </div>
      </div>

      {/* Camera View Switcher */}
      <div className="absolute left-3 bottom-24 z-30 flex flex-wrap gap-1.5 max-w-[18rem]">
        {(
          [
            ["pitch", "🏟 Pitch"],
            ["vip", "🏆 VIP Stand"],
            ["goal", "⚽ Goal End"],
            ["aerial", "🦅 Aerial"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setCameraView(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold shadow transition-all ${
              cameraView === key
                ? "bg-[#e0b15a] text-[#0f172a] shadow-lg scale-105"
                : "bg-[#0f1e29]/80 text-[#d1d5db] border border-white/10 hover:bg-[#1a2d3c]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Interactive Matchday Actions */}
      <div className="absolute right-3 bottom-24 z-30 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleKickBall}
          className="flex items-center gap-1.5 rounded-full bg-[#16a34a] px-3.5 py-2 text-xs font-bold text-white shadow-xl hover:bg-[#15803d] active:scale-95 transition-all border border-[#4ade80]/40"
        >
          <span>⚽</span>
          <span>Kick Ball!</span>
        </button>
        <button
          type="button"
          onClick={handleChant}
          className="flex items-center gap-1.5 rounded-full bg-[#0284c7] px-3.5 py-2 text-xs font-bold text-white shadow-xl hover:bg-[#0369a1] active:scale-95 transition-all border border-[#38bdf8]/40"
        >
          <span>📣</span>
          <span>Stadium Chant</span>
        </button>
      </div>

      {/* Chant / Goal Celebration Toast */}
      {chantMessage ? (
        <div className="pointer-events-none absolute inset-x-4 top-24 z-40 mx-auto max-w-md animate-bounce rounded-2xl bg-[#061826]/95 border-2 border-[#e0b15a] p-3 text-center shadow-2xl backdrop-blur-md">
          <p className="text-sm font-bold text-[#e0b15a]">{chantMessage}</p>
        </div>
      ) : null}

      {/* Zoom and Orbit Controls */}
      <div className="absolute right-3 top-16 z-30 flex flex-col gap-1">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => dolly(1.18)}
          className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-bold text-[#0f172a] shadow-lg active:scale-90 transition-transform"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => dolly(1 / 1.18)}
          className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-bold text-[#0f172a] shadow-lg active:scale-90 transition-transform"
        >
          −
        </button>
        <button
          type="button"
          aria-label="Rotate left"
          onClick={() => turn(1)}
          className="mt-2 grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-bold text-[#0f172a] shadow-lg active:scale-90 transition-transform"
        >
          ↺
        </button>
        <button
          type="button"
          aria-label="Rotate right"
          onClick={() => turn(-1)}
          className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-bold text-[#0f172a] shadow-lg active:scale-90 transition-transform"
        >
          ↻
        </button>
      </div>
    </div>
  );
}
