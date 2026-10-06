"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { LOOKS } from "@/lib/game/content";
import type { LookId } from "@/lib/game/types";
import { naira } from "@/lib/game/format";

// Canvas texture for phone screens
function createPhoneScreenTexture(kind: "lock" | "apps" | "samsung"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  if (kind === "lock") {
    // Gradient wallpaper
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, "#1e1b4b");
    grad.addColorStop(0.5, "#4338ca");
    grad.addColorStop(1, "#f43f5e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 512);

    // Dynamic Island / notch
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.roundRect(96, 12, 64, 20, 10);
    ctx.fill();

    // Time
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 58px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("09:41", 128, 120);

    // Date
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("Monday, 5 Oct", 128, 150);

    // Notification widget
    ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
    ctx.beginPath();
    ctx.roundRect(18, 220, 220, 80, 16);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("💬 Owerri Life", 34, 250);
    ctx.font = "13px sans-serif";
    ctx.fillStyle = "#f1f5f9";
    ctx.fillText("New message from Tetlow Plug!", 34, 276);

    // Bottom home bar
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(84, 496, 88, 5, 3);
    ctx.fill();
  } else if (kind === "apps") {
    // App launcher screen
    const grad = ctx.createLinearGradient(0, 0, 256, 512);
    grad.addColorStop(0, "#090d16");
    grad.addColorStop(1, "#1e293b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 512);

    // Dynamic island
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.roundRect(96, 12, 64, 20, 10);
    ctx.fill();

    // App icons grid (4x5)
    const iconColors = [
      "#22c55e", "#3b82f6", "#ef4444", "#f59e0b",
      "#8b5cf6", "#ec4899", "#06b6d4", "#10b981",
      "#6366f1", "#f97316", "#e11d48", "#14b8a6",
      "#a855f7", "#3b82f6", "#84cc16", "#eab308"
    ];
    let idx = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const x = 24 + c * 56;
        const y = 80 + r * 70;
        ctx.fillStyle = iconColors[idx % iconColors.length];
        ctx.beginPath();
        ctx.roundRect(x, y, 42, 42, 10);
        ctx.fill();
        idx++;
      }
    }

    // Dock
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.beginPath();
    ctx.roundRect(14, 420, 228, 64, 20);
    ctx.fill();
    for (let d = 0; d < 4; d++) {
      ctx.fillStyle = ["#22c55e", "#3b82f6", "#f59e0b", "#6366f1"][d];
      ctx.beginPath();
      ctx.roundRect(26 + d * 54, 432, 40, 40, 10);
      ctx.fill();
    }
  } else {
    // Samsung AMOLED dark mode
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, "#020617");
    grad.addColorStop(0.6, "#0f172a");
    grad.addColorStop(1, "#1e3a8a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 512);

    // Punch hole camera
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(128, 22, 7, 0, Math.PI * 2);
    ctx.fill();

    // Clock
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 64px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("12:30", 128, 140);

    ctx.fillStyle = "#ffffff";
    ctx.font = "20px sans-serif";
    ctx.fillText("Galaxy AI is ready", 128, 180);

    // Search bar
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.roundRect(22, 230, 212, 42, 21);
    ctx.fill();
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("🔍 Search apps & web...", 42, 256);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Canvas texture for brand header sign
function createStoreSignTexture(title: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Background dark metallic
  ctx.fillStyle = "#090d16";
  ctx.fillRect(0, 0, 1024, 256);

  // Outer neon border
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 1016, 248);

  // Store title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 62px sans-serif";
  ctx.textAlign = "center";
  const label = title.toUpperCase();
  ctx.fillText(label, 512, 108);

  // Subtitle
  ctx.fillStyle = "#f2c14e";
  ctx.font = "bold 26px sans-serif";
  ctx.fillText("SMARTPHONES · CASES · ACCESSORIES · TETLOW ROAD, OWERRI", 512, 172);

  // Badges
  ctx.fillStyle = "#22c55e";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("✔ 100% ORIGINAL  ✔ SWAP & BUY  ✔ INSTANT REPAIR", 512, 215);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Canvas texture for hanging blister-pack card header
function createHangerCardTexture(title: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Card background
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, 256, 384);

  // Top header banner
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 256, 84);

  // Euro-slot hanger hole outline
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.roundRect(96, 16, 64, 18, 9);
  ctx.fill();

  // Brand title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, 128, 64);

  // Inner blister clear window frame
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(16, 100, 224, 220);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 100, 224, 220);

  // Bottom spec strip
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 332, 256, 52);
  ctx.fillStyle = "#f2c14e";
  ctx.font = "bold 15px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("DROP TESTED · MAGSAFE", 128, 364);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

interface InspectableItem {
  name: string;
  category: "Phone" | "Case";
  price: number;
  specs: string;
  colorName: string;
}

export function PhoneStoreScene({
  look,
  title = "Anonymous Gadgets",
  placeId = "anonymous-gadgets",
}: {
  look: LookId;
  title?: string;
  placeId?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const rig = useRef({ yaw: 0.35, pitch: 0.42, zoom: 1 });
  const [cameraView, setCameraView] = useState<"showcase" | "wall" | "overview">("showcase");
  const [inspectedItem, setInspectedItem] = useState<InspectableItem | null>(null);
  const [testedCase, setTestedCase] = useState<string | null>(null);

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
    scene.background = new THREE.Color("#0c121e"); // Sleek modern dark tech boutique

    // Lighting: Hemisphere ambient + Ceiling track spotlights
    scene.add(new THREE.HemisphereLight(0xfff7ed, 0x1e293b, 0.95));

    // Main warm ceiling light
    const mainLight = new THREE.DirectionalLight(0xffedd5, 1.25);
    mainLight.position.set(4, 12, 6);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.set(1024, 1024);
    scene.add(mainLight);

    // Showcase accent spotlight (Ice Blue)
    const showcaseSpot = new THREE.SpotLight(0x38bdf8, 28, 14, Math.PI / 4, 0.35, 1);
    showcaseSpot.position.set(0, 5.5, 1.2);
    showcaseSpot.target.position.set(0, 1.0, 1.2);
    scene.add(showcaseSpot, showcaseSpot.target);

    // Wall cases accent spotlight (Warm Gold)
    const wallSpot = new THREE.SpotLight(0xfde047, 24, 16, Math.PI / 3, 0.4, 1);
    wallSpot.position.set(0, 6.2, -1.2);
    wallSpot.target.position.set(0, 2.5, -4.5);
    scene.add(wallSpot, wallSpot.target);

    const room = new THREE.Group();
    scene.add(room);

    // Helpers
    const box = (w: number, h: number, d: number, color: number, x: number, y: number, z: number, cast = true) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
      mesh.position.set(x, y, z);
      mesh.castShadow = cast;
      mesh.receiveShadow = true;
      room.add(mesh);
      return mesh;
    };

    // FLOOR: Polished showroom tiles with grid lines
    box(18, 0.14, 16, 0x172033, 0, -0.07, 0, false);
    // Subtle floor border trim
    box(18.2, 0.16, 0.2, 0xe0b15a, 0, 0.01, 7.9, false);

    // BACK WALL: Dark slate with slatwall retail channels
    box(18, 7.5, 0.35, 0x0f172a, 0, 3.75, -5.8);

    // SIDE WALLS
    box(0.35, 7.5, 16, 0x111827, -8.8, 3.75, 2); // Left Wall
    box(0.35, 7.5, 16, 0x111827, 8.8, 3.75, 2); // Right Wall

    // ILLUMINATED STORE SIGN ON BACK WALL
    const signMat = new THREE.MeshBasicMaterial({ map: createStoreSignTexture(title) });
    const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 2.4), signMat);
    signBoard.position.set(0, 6.0, -5.6);
    room.add(signBoard);

    // Neon accent bar under the sign
    const neonBar = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    neonBar.position.set(0, 4.75, -5.58);
    room.add(neonBar);

    // ═════════════════════════════════════════════════════════════════
    // 1. THE GLASS SHOWCASE (DISPLAY COUNTER)
    // ═════════════════════════════════════════════════════════════════
    const makeShowcase = () => {
      const sc = new THREE.Group();

      // Lower plinth base (brushed dark metal)
      const base = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.75, 2.2), new THREE.MeshLambertMaterial({ color: 0x0f172a }));
      base.position.set(0, 0.375, 1.2);
      base.castShadow = true;
      base.receiveShadow = true;

      // Recessed LED underglow strip (Ice Blue)
      const underglow = new THREE.Mesh(new THREE.BoxGeometry(7.7, 0.06, 2.25), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      underglow.position.set(0, 0.08, 1.2);

      // Velvet / dark felt display deck inside the showcase
      const deck = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.08, 1.9), new THREE.MeshLambertMaterial({ color: 0x1e293b }));
      deck.position.set(0, 0.79, 1.2);

      // Tempered glass cabinet (Front, Top, Sides)
      const glassMat = new THREE.MeshLambertMaterial({
        color: 0x93c5fd,
        transparent: true,
        opacity: 0.32,
      });

      // Glass front panel
      const glassFront = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.62, 0.06), glassMat);
      glassFront.position.set(0, 1.14, 2.22);

      // Glass top panel
      const glassTop = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.06, 2.02), glassMat);
      glassTop.position.set(0, 1.48, 1.2);

      // Glass left & right ends
      const glassLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.62, 2.02), glassMat);
      glassLeft.position.set(-3.68, 1.14, 1.2);
      const glassRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.62, 2.02), glassMat);
      glassRight.position.set(3.68, 1.14, 1.2);

      // Polished chrome corner mounting brackets
      for (const cx of [-3.7, 3.7]) {
        for (const cz of [0.2, 2.2]) {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.68, 8), new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }));
          post.position.set(cx, 1.14, cz);
          sc.add(post);
        }
      }

      // Internal LED downlighting strip inside showcase
      const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.04, 0.08), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      ledStrip.position.set(0, 1.44, 2.15);
      sc.add(ledStrip);

      sc.add(base, underglow, deck, glassFront, glassTop, glassLeft, glassRight);
      room.add(sc);

      // ─────────────────────────────────────────────────────────────
      // PHONES INSIDE THE SHOWCASE (On Angled Acrylic Stands)
      // ─────────────────────────────────────────────────────────────
      const phoneModels = [
        { name: "iPhone 16 Pro Max", color: 0x334155, screen: "lock", x: -2.7, price: 2250000, tag: "₦2.25M" },
        { name: "iPhone 15 Pro", color: 0x1e293b, screen: "apps", x: -1.6, price: 1450000, tag: "₦1.45M" },
        { name: "Samsung Galaxy S24 Ultra", color: 0x475569, screen: "samsung", x: -0.5, price: 1750000, tag: "₦1.75M" },
        { name: "Galaxy Z Flip 6", color: 0x6ee7b7, screen: "lock", x: 0.6, price: 1350000, tag: "₦1.35M" },
        { name: "Tecno Camon 30 Pro", color: 0x047857, screen: "apps", x: 1.7, price: 385000, tag: "₦385k" },
        { name: "Redmi Note 13 Pro+", color: 0x0f172a, screen: "samsung", x: 2.8, price: 310000, tag: "₦310k" },
      ] as const;

      phoneModels.forEach((phone) => {
        const pGroup = new THREE.Group();

        // Clear acrylic angled stand
        const standMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 });
        const stand = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.22, 0.42), standMat);
        stand.position.set(0, 0.11, 0);

        // Phone body (thin curved rectangular bar)
        const phoneBody = new THREE.Mesh(
          new THREE.BoxGeometry(0.44, 0.88, 0.05),
          new THREE.MeshLambertMaterial({ color: phone.color })
        );
        phoneBody.rotation.x = -0.32; // Angled backward on display stand
        phoneBody.position.set(0, 0.45, 0.04);
        phoneBody.castShadow = true;

        // Glowing Screen Face
        const scrTex = createPhoneScreenTexture(phone.screen);
        const screenMat = new THREE.MeshBasicMaterial({ map: scrTex });
        const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.41, 0.84), screenMat);
        screenMesh.position.set(0, 0, 0.028);
        phoneBody.add(screenMesh);

        // Camera bump on back
        const camBump = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.03), new THREE.MeshLambertMaterial({ color: 0x0f172a }));
        camBump.position.set(-0.09, 0.28, -0.032);
        phoneBody.add(camBump);

        // Little acrylic price tag badge in front of phone
        const tagBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.14), new THREE.MeshLambertMaterial({ color: 0x0f172a }));
        tagBox.position.set(0, 0.05, 0.32);
        pGroup.add(stand, phoneBody, tagBox);

        pGroup.position.set(phone.x, 0.83, 1.48);
        room.add(pGroup);
      });

      // ─────────────────────────────────────────────────────────────
      // CASES INSIDE THE SHOWCASE (On Velvet Display Risers)
      // ─────────────────────────────────────────────────────────────
      const showcaseCases = [
        { name: "MagSafe Diamond Clear Case", color: 0xe2e8f0, magRing: true, x: -2.5, price: 18000 },
        { name: "Italian Saddle Brown Leather", color: 0x854d0e, magRing: false, x: -1.5, price: 32000 },
        { name: "British Racing Green Leather", color: 0x14532d, magRing: false, x: -0.5, price: 32000 },
        { name: "Forged Carbon Fiber Armor", color: 0x111827, magRing: true, x: 0.5, price: 45000 },
        { name: "Pastel Lavender Silicone", color: 0xc084fc, magRing: true, x: 1.5, price: 15000 },
        { name: "Matte Midnight Navy Silicone", color: 0x1e3a8a, magRing: true, x: 2.5, price: 15000 },
      ];

      showcaseCases.forEach((cs) => {
        const cGroup = new THREE.Group();

        // Velvet tray cushion
        const tray = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.06, 0.72), new THREE.MeshLambertMaterial({ color: 0x020617 }));
        tray.position.set(0, 0.03, 0);

        // Phone case shell
        const caseMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.46, 0.9, 0.07),
          new THREE.MeshLambertMaterial({ color: cs.color })
        );
        caseMesh.rotation.x = -0.22;
        caseMesh.position.set(0, 0.22, 0);

        // Camera cutout window
        const cutout = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.075), new THREE.MeshBasicMaterial({ color: 0x0f172a }));
        cutout.position.set(-0.1, 0.3, 0);
        caseMesh.add(cutout);

        // MagSafe ring if featured
        if (cs.magRing) {
          const ring = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.14, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
          ring.position.set(0, -0.05, 0.038);
          caseMesh.add(ring);
        }

        cGroup.add(tray, caseMesh);
        cGroup.position.set(cs.x, 0.83, 0.75);
        room.add(cGroup);
      });
    };
    makeShowcase();

    // ═════════════════════════════════════════════════════════════════
    // 2. PHONE CASES HANGING ON THE WALLS (Slatwall & Pegs)
    // ═════════════════════════════════════════════════════════════════
    const makeWallHangingCases = () => {
      // Horizontal metal slatwall rails on back wall
      const railYs = [1.8, 2.7, 3.6, 4.4];
      railYs.forEach((y) => {
        box(16.5, 0.06, 0.08, 0x94a3b8, 0, y, -5.58, false);
      });

      // Categories and colors of hanging cases
      const caseTypes = [
        // Row 1 (Top): Rugged Armor Cases
        [
          { name: "Camo Tactical Drop Armor", color: 0x365314, cardTitle: "ARMOR-X", headerColor: "#15803d", price: 25000 },
          { name: "Carbon Fiber Hybrid Guard", color: 0x09090b, cardTitle: "CARBON PRO", headerColor: "#0284c7", price: 28000 },
          { name: "Desert Tan Military Impact", color: 0x92400e, cardTitle: "MIL-SPEC", headerColor: "#b45309", price: 26000 },
          { name: "Gunmetal Titanium Bumper", color: 0x475569, cardTitle: "TITAN GUARD", headerColor: "#475569", price: 24000 },
          { name: "Arctic White Shockproof", color: 0xf8fafc, cardTitle: "DEFENDER", headerColor: "#64748b", price: 22000 },
          { name: "Stealth Black Kickstand", color: 0x18181b, cardTitle: "KICKSTAND", headerColor: "#1e293b", price: 27000 },
          { name: "Ruby Red Heavy Duty", color: 0x991b1b, cardTitle: "ARMOR-X", headerColor: "#dc2626", price: 24000 },
        ],
        // Row 2: Designer Marble & Holographic Trends
        [
          { name: "Carrera White & Gold Marble", color: 0xfef08a, cardTitle: "MARBLE ART", headerColor: "#d97706", price: 18000 },
          { name: "Cyberpunk Neon Gradient", color: 0x06b6d4, cardTitle: "CYBER GLOW", headerColor: "#0891b2", price: 19000 },
          { name: "Holographic Prism Case", color: 0xd946ef, cardTitle: "PRISM GLAM", headerColor: "#c026d3", price: 21000 },
          { name: "Midnight Gold Leaf Floral", color: 0x0f172a, cardTitle: "ROYAL GOLD", headerColor: "#eab308", price: 22000 },
          { name: "Liquid Chrome Mirror Case", color: 0xe2e8f0, cardTitle: "MIRROR LUX", headerColor: "#94a3b8", price: 20000 },
          { name: "Sunset Orange Waves", color: 0xf97316, cardTitle: "VIBE SERIES", headerColor: "#ea580c", price: 18000 },
          { name: "Emerald Agate Pattern", color: 0x059669, cardTitle: "STONE ART", headerColor: "#059669", price: 20000 },
        ],
        // Row 3: Soft Silicone Gel Rainbow
        [
          { name: "Flame Red Silicone Gel", color: 0xef4444, cardTitle: "SILICONE GEL", headerColor: "#ef4444", price: 12000 },
          { name: "Electric Cyan Silicone", color: 0x38bdf8, cardTitle: "SILICONE GEL", headerColor: "#0284c7", price: 12000 },
          { name: "Neon Lime Silicone", color: 0x84cc16, cardTitle: "SILICONE GEL", headerColor: "#65a30d", price: 12000 },
          { name: "Sunshine Yellow Silicone", color: 0xfacc15, cardTitle: "SILICONE GEL", headerColor: "#ca8a04", price: 12000 },
          { name: "Lavender Purple Silicone", color: 0xa855f7, cardTitle: "SILICONE GEL", headerColor: "#9333ea", price: 12000 },
          { name: "Bubblegum Pink Silicone", color: 0xf472b6, cardTitle: "SILICONE GEL", headerColor: "#db2777", price: 12000 },
          { name: "Royal Navy Matte Silicone", color: 0x1e3a8a, cardTitle: "SILICONE GEL", headerColor: "#1d4ed8", price: 12000 },
        ],
        // Row 4: Crystal Clear Anti-Yellowing & MagSafe
        [
          { name: "Diamond Clear 100% Anti-Yellow", color: 0xf1f5f9, cardTitle: "CLEAR FLEX", headerColor: "#38bdf8", price: 15000 },
          { name: "MagSafe Ring Smoke Tint", color: 0x334155, cardTitle: "MAG-SHIELD", headerColor: "#0284c7", price: 20000 },
          { name: "Iridescent Aurora Clear", color: 0xe0e7ff, cardTitle: "AURORA", headerColor: "#818cf8", price: 17000 },
          { name: "Matte Frost Anti-Fingerprint", color: 0x94a3b8, cardTitle: "FROST SHIELD", headerColor: "#64748b", price: 16000 },
          { name: "Clear Bumper Air-Cushion", color: 0xf8fafc, cardTitle: "AIR-DROP", headerColor: "#0ea5e9", price: 15000 },
          { name: "MagSafe Coral Pink Clear", color: 0xfda4af, cardTitle: "MAG-CLEAR", headerColor: "#f43f5e", price: 20000 },
          { name: "MagSafe Deep Mint Clear", color: 0x6ee7b7, cardTitle: "MAG-CLEAR", headerColor: "#10b981", price: 20000 },
        ],
      ];

      caseTypes.forEach((rowItems, rowIndex) => {
        const y = railYs[rowIndex];
        const count = rowItems.length;
        const totalW = 14;
        const spacing = totalW / (count - 1);

        rowItems.forEach((item, colIndex) => {
          const x = -totalW / 2 + colIndex * spacing;

          const hanger = new THREE.Group();

          // Metal Display Peg / Hook protruding from wall
          const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.52, 6), new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }));
          peg.rotation.x = Math.PI / 2;
          peg.position.set(0, 0, 0.25);
          hanger.add(peg);

          // Upward peg stopper at tip
          const stopper = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.08, 6), new THREE.MeshLambertMaterial({ color: 0xe0b15a }));
          stopper.position.set(0, 0.03, 0.5);
          hanger.add(stopper);

          // Retail hanging packaging card
          const cardTex = createHangerCardTexture(item.cardTitle, item.headerColor);
          const cardMat = new THREE.MeshBasicMaterial({ map: cardTex });
          const card = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 1.02), cardMat);
          card.position.set(0, -0.32, 0.38);
          hanger.add(card);

          // 3D Phone Case visible in the blister pack
          const case3d = new THREE.Mesh(
            new THREE.BoxGeometry(0.44, 0.76, 0.06),
            new THREE.MeshLambertMaterial({ color: item.color })
          );
          case3d.position.set(0, -0.36, 0.42);

          // Camera cutout
          const camHole = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.07), new THREE.MeshBasicMaterial({ color: 0x0f172a }));
          camHole.position.set(-0.1, 0.24, 0);
          case3d.add(camHole);

          hanger.add(case3d);

          hanger.position.set(x, y, -5.55);
          room.add(hanger);
        });
      });

      // Side Wall Display Pegs (Left Wall: Leather Wallet Cases)
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const pegL = new THREE.Group();
          const p = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 6), new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }));
          p.rotation.z = Math.PI / 2;
          pegL.add(p);

          // Hanging leather flip case
          const walletCase = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.82, 0.48), new THREE.MeshLambertMaterial({ color: [0x78350f, 0x1e293b, 0x831843][c % 3] }));
          walletCase.position.set(0.24, -0.28, 0);
          pegL.add(walletCase);

          pegL.position.set(-8.55, 2.2 + r * 1.1, -1.5 + c * 1.4);
          room.add(pegL);
        }
      }
    };
    makeWallHangingCases();

    // ═════════════════════════════════════════════════════════════════
    // 3. SERVICE COUNTER & VENDOR NPC
    // ═════════════════════════════════════════════════════════════════
    const makeServiceCounter = () => {
      // Counter desk behind the showcase
      box(5.4, 1.05, 1.2, 0x0f172a, 0, 0.525, -2.6);
      box(5.5, 0.08, 1.3, 0x1e293b, 0, 1.08, -2.6);

      // Laptop terminal on counter
      const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.03, 0.45), new THREE.MeshLambertMaterial({ color: 0x94a3b8 }));
      laptopBase.position.set(-1.2, 1.14, -2.5);
      const laptopScreen = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.03), new THREE.MeshLambertMaterial({ color: 0x0f172a }));
      laptopScreen.position.set(-1.2, 1.35, -2.7);
      laptopScreen.rotation.x = -0.2;
      const glowingDisplay = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      glowingDisplay.position.set(0, 0, 0.02);
      laptopScreen.add(glowingDisplay);
      room.add(laptopBase, laptopScreen);

      // POS Card Terminal (Moniepoint / OPay terminal)
      const posDevice = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.42), new THREE.MeshLambertMaterial({ color: 0x1d4ed8 }));
      posDevice.position.set(1.4, 1.14, -2.4);
      posDevice.rotation.y = -0.3;
      const posScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.16), new THREE.MeshBasicMaterial({ color: 0x60a5fa }));
      posScreen.rotation.x = -Math.PI / 2;
      posScreen.position.set(0, 0.045, -0.06);
      posDevice.add(posScreen);
      room.add(posDevice);

      // Phone repair testing mat with tweezers
      box(0.9, 0.02, 0.6, 0x0284c7, 0.1, 1.13, -2.5, false);

      // Floating shelves with retail phone boxes on back wall
      for (const y of [1.6, 2.6]) {
        box(3.8, 0.06, 0.6, 0x1e293b, -6.0, y, -5.2);
        // Stacks of white iPhone boxes & black Galaxy boxes
        for (let b = 0; b < 6; b++) {
          const isApple = b % 2 === 0;
          box(0.38, 0.18, 0.48, isApple ? 0xf8fafc : 0x0f172a, -7.2 + b * 0.5, y + 0.12, -5.2);
        }
      }

      // Power bank boxes on right shelf
      for (const y of [1.6, 2.6]) {
        box(3.8, 0.06, 0.6, 0x1e293b, 6.0, y, -5.2);
        for (let b = 0; b < 5; b++) {
          box(0.42, 0.22, 0.44, 0x16a34a, 4.8 + b * 0.6, y + 0.14, -5.2);
        }
      }

      // VENDOR NPC standing behind counter (Nonso Plug / Sugar)
      const vendor = new THREE.Group();
      const vendorSkin = new THREE.MeshLambertMaterial({ color: 0x3d2314 });
      const vendorShirt = new THREE.MeshLambertMaterial({ color: 0x0284c7 }); // Branded blue polo
      // Body
      const vBody = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.85, 8), vendorShirt);
      vBody.position.set(0, 1.45, 0);
      // Head
      const vHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), vendorSkin);
      vHead.position.set(0, 2.05, 0);
      // Cap
      const vCap = new THREE.Mesh(new THREE.SphereGeometry(0.23, 10, 8), new THREE.MeshLambertMaterial({ color: 0x0f172a }));
      vCap.position.set(0, 2.14, -0.02);
      vCap.scale.set(1.02, 0.55, 0.98);
      vendor.add(vBody, vHead, vCap);
      vendor.position.set(0, 0, -3.5);
      room.add(vendor);
    };
    makeServiceCounter();

    // CUSTOMER / PLAYER AVATAR IN FRONT OF SHOWCASE
    const playerGroup = new THREE.Group();
    const pal = LOOKS.find((l) => l.id === look) ?? LOOKS[0];
    const pBody = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.85, 8), new THREE.MeshLambertMaterial({ color: pal.shirt }));
    pBody.position.set(0, 1.35, 0);
    const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), new THREE.MeshLambertMaterial({ color: pal.skin }));
    pHead.position.set(0, 1.95, 0);
    playerGroup.add(pBody, pHead);
    playerGroup.position.set(0.6, 0, 3.8);
    playerGroup.rotation.y = Math.PI; // Facing the showcase counter
    room.add(playerGroup);

    // CAMERA SETUP
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);

    const fit = () => {
      renderer.setSize(root.clientWidth || 1, root.clientHeight || 1);
      camera.aspect = (root.clientWidth || 1) / (root.clientHeight || 1);
      camera.updateProjectionMatrix();
    };
    fit();

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
      rig.current.zoom = Math.min(2.8, Math.max(0.6, rig.current.zoom * factor));
    };
    root.addEventListener("wheel", onWheel, { passive: false });

    let frame = 0;
    let alive = true;

    const loop = () => {
      if (!alive) return;

      room.rotation.y = rig.current.yaw;

      let targetDist = 12;
      let targetHeight = 4.2;
      let lookAtY = 1.3;
      let lookAtZ = 0.5;

      if (cameraView === "showcase") {
        targetDist = 7.5;
        targetHeight = 2.8;
        lookAtY = 1.25;
        lookAtZ = 1.2;
      } else if (cameraView === "wall") {
        targetDist = 9.8;
        targetHeight = 4.0;
        lookAtY = 3.2;
        lookAtZ = -3.5;
      } else if (cameraView === "overview") {
        targetDist = 15.5;
        targetHeight = 7.2;
        lookAtY = 1.6;
        lookAtZ = 0;
      }

      const dist = targetDist / rig.current.zoom;
      const pitch = rig.current.pitch;
      camera.position.set(
        Math.sin(pitch) * dist * 0.45,
        targetHeight / rig.current.zoom,
        Math.cos(pitch) * dist + lookAtZ
      );
      camera.lookAt(0, lookAtY, lookAtZ);

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
  }, [look, title, cameraView]);

  function turn(dir: number) {
    rig.current.yaw += dir * 0.45;
  }
  function dolly(factor: number) {
    rig.current.zoom = Math.min(2.8, Math.max(0.6, rig.current.zoom * factor));
  }

  // Showcase inventory list for quick inspection
  const showcaseCatalog: InspectableItem[] = [
    { name: "iPhone 16 Pro Max", category: "Phone", price: 2250000, specs: "1TB · Desert Titanium · Triple 48MP Camera · A18 Pro", colorName: "Desert Titanium" },
    { name: "iPhone 15 Pro", category: "Phone", price: 1450000, specs: "256GB · Space Black · Dynamic Island · A17 Pro", colorName: "Space Black" },
    { name: "Samsung Galaxy S24 Ultra", category: "Phone", price: 1750000, specs: "512GB · Titanium Gray · 200MP Zoom · S-Pen", colorName: "Titanium Gray" },
    { name: "MagSafe Diamond Clear Case", category: "Case", price: 18000, specs: "Military Drop Tested · 100% Anti-Yellowing · Strong MagSafe Ring", colorName: "Diamond Clear" },
    { name: "Italian Saddle Leather Case", category: "Case", price: 32000, specs: "Genuine Top-Grain Cowhide · Microfiber Velvet Lining · Metal Buttons", colorName: "Saddle Tan" },
    { name: "Forged Carbon Fiber Armor Case", category: "Case", price: 45000, specs: "Aerospace Grade Carbon Fiber · Gloss Twill Finish · Slim 0.8mm", colorName: "Gloss Carbon" },
    { name: "Camo Tactical Drop Armor", category: "Case", price: 25000, specs: "Double Layer TPU + PC · Kickstand · 12ft Drop Protection", colorName: "Military Olive" },
    { name: "Carrera White & Gold Marble Case", category: "Case", price: 18000, specs: "Glossy IMD Marble Graphic · Electroplated Gold Veins · Raised Lip", colorName: "White / Gold" },
  ];

  return (
    <div className="absolute inset-0 bg-[#070b12] text-[#f6f1e6]">
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
          rig.current.pitch = Math.max(0.18, Math.min(1.3, rig.current.pitch + (event.clientY - lastY) * 0.004));
          event.currentTarget.dataset.x = String(event.clientX);
          event.currentTarget.dataset.y = String(event.clientY);
        }}
      />

      {/* Store Header Badge */}
      <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-[19rem] rounded-2xl bg-[#09111c]/90 p-3 shadow-2xl backdrop-blur-md border border-[#38bdf8]/30">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#e0b15a]">Verified Gadget Store</p>
        </div>
        <h2 className="mt-1 font-bold text-base text-white">{title}</h2>
        <p className="text-xs text-[#94a3b8]">Tetlow Road Phone Market, Owerri</p>
        <p className="mt-1.5 text-[11px] text-[#cbd5e1] leading-relaxed">
          Showcases with iPhones &amp; flagship smartphones, plus wall racks loaded with hanging cases for all models.
        </p>
      </div>

      {/* Camera View Switcher */}
      <div className="absolute left-3 bottom-24 z-30 flex flex-wrap gap-1.5 max-w-[18rem]">
        {(
          [
            ["showcase", "🔍 Showcase"],
            ["wall", "📱 Wall Cases"],
            ["overview", "🏪 Store View"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setCameraView(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold shadow transition-all ${
              cameraView === key
                ? "bg-[#38bdf8] text-[#0f172a] shadow-lg scale-105 font-bold"
                : "bg-[#0f1e29]/80 text-[#d1d5db] border border-white/10 hover:bg-[#1a2d3c]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Quick Showcase & Wall Catalog Drawer Button */}
      <div className="absolute right-3 bottom-24 z-30 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setInspectedItem(showcaseCatalog[0])}
          className="flex items-center gap-1.5 rounded-full bg-[#e0b15a] px-3.5 py-2 text-xs font-bold text-[#0f172a] shadow-xl hover:bg-[#f2c14e] active:scale-95 transition-all border border-[#fef08a]/40"
        >
          <span>📱</span>
          <span>Inspect Showcase Items</span>
        </button>
      </div>

      {/* Interactive Item Inspector Modal / Drawer */}
      {inspectedItem ? (
        <div className="absolute inset-x-3 bottom-4 z-40 mx-auto max-w-lg rounded-3xl bg-[#09111c]/95 border border-[#38bdf8]/40 p-4 shadow-2xl backdrop-blur-xl text-white">
          <div className="flex items-start justify-between">
            <div>
              <span className="rounded-md bg-[#38bdf8]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#38bdf8]">
                {inspectedItem.category === "Phone" ? "In Glass Showcase" : "Hanging on Slatwall"}
              </span>
              <h3 className="mt-1 text-lg font-bold">{inspectedItem.name}</h3>
              <p className="text-xs text-[#94a3b8]">{inspectedItem.colorName}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setInspectedItem(null);
                setTestedCase(null);
              }}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-sm font-bold text-white hover:bg-white/20"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-[#030712] px-3 py-2">
            <div>
              <p className="text-[10px] text-[#94a3b8] uppercase font-semibold">Store Price</p>
              <p className="text-lg font-extrabold text-[#e0b15a]">{naira(inspectedItem.price)}</p>
            </div>
            <span className="rounded-full bg-[#16a34a]/30 px-2.5 py-1 text-xs font-bold text-[#4ade80]">In Stock</span>
          </div>

          <p className="mt-2 text-xs text-[#cbd5e1] leading-relaxed">{inspectedItem.specs}</p>

          {/* Quick item switcher */}
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {showcaseCatalog.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  setInspectedItem(item);
                  setTestedCase(null);
                }}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                  inspectedItem.name === item.name
                    ? "bg-[#38bdf8] text-[#0f172a] font-bold"
                    : "bg-white/5 text-[#94a3b8] hover:bg-white/10"
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setTestedCase(inspectedItem.name);
              }}
              className="flex-1 rounded-xl bg-[#38bdf8] py-2.5 text-xs font-bold text-[#0f172a] hover:bg-[#0284c7] transition-all shadow-lg"
            >
              {inspectedItem.category === "Phone" ? "Test Device Screen 📱" : "Try Case on Phone ✨"}
            </button>
            <button
              type="button"
              onClick={() => {
                alert(`Vendor says: "That's ${naira(inspectedItem.price)} last! 100% original, tested and boxed. Tetlow guarantee!"`);
              }}
              className="flex-1 rounded-xl bg-[#e0b15a] py-2.5 text-xs font-bold text-[#0f172a] hover:bg-[#f2c14e] transition-all shadow-lg"
            >
              Ask Vendor Price 💬
            </button>
          </div>

          {testedCase ? (
            <p className="mt-2 text-center text-xs font-semibold text-[#4ade80] animate-pulse">
              ✔ {testedCase} fitted successfully! Looks sleek and protected.
            </p>
          ) : null}
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
