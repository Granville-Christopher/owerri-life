"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { makeRenderer } from "@/lib/game/renderQuality";
import type { LookId } from "@/lib/game/types";
import { naira } from "@/lib/game/format";
import { addPlayerGuests, createRealisticHuman, type CrowdPerson } from "@/lib/game/humanModel";
import { attachSceneCameraControls } from "./sceneCameraControls";

// Canvas texture for phone screens
function createPhoneScreenTexture(kind: "lock" | "apps" | "samsung"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  if (kind === "lock") {
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, "#1e1b4b");
    grad.addColorStop(0.5, "#4338ca");
    grad.addColorStop(1, "#f43f5e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 512);

    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.roundRect(96, 12, 64, 20, 10);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 58px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("09:41", 128, 120);

    ctx.font = "18px sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("Monday, 5 Oct", 128, 150);

    ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
    ctx.beginPath();
    ctx.roundRect(18, 220, 220, 80, 16);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("💬 Tetlow Gadgets", 34, 250);
    ctx.font = "13px sans-serif";
    ctx.fillStyle = "#f1f5f9";
    ctx.fillText("Your phone is in stock!", 34, 276);

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(84, 496, 88, 5, 3);
    ctx.fill();
  } else if (kind === "apps") {
    const grad = ctx.createLinearGradient(0, 0, 256, 512);
    grad.addColorStop(0, "#090d16");
    grad.addColorStop(1, "#1e293b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 512);

    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.roundRect(96, 12, 64, 20, 10);
    ctx.fill();

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
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, "#020617");
    grad.addColorStop(0.6, "#0f172a");
    grad.addColorStop(1, "#1e3a8a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 512);

    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(128, 22, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 64px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("12:30", 128, 140);

    ctx.fillStyle = "#ffffff";
    ctx.font = "20px sans-serif";
    ctx.fillText("Galaxy AI is ready", 128, 180);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Canvas texture for brand header sign
function createStoreSignTexture(title: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 200;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "#090d16";
  ctx.fillRect(0, 0, 800, 200);

  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 792, 192);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 52px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title.toUpperCase(), 400, 85);

  ctx.fillStyle = "#f2c14e";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText("SMARTPHONES · CASES · ACCESSORIES · TETLOW ROAD", 400, 140);

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

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, 256, 384);

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 256, 84);

  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.roundRect(96, 16, 64, 18, 9);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, 128, 64);

  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(16, 100, 224, 220);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 100, 224, 220);

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

export interface StoreItem {
  id: string;
  name: string;
  category: "Phone" | "Case";
  price: number;
  specs: string;
  colorName: string;
}

export function PhoneStoreScene({
  look = "chidi",
  title = "Anonymous Gadgets",
  placeId = "anonymous-gadgets",
  spendable = 5000000,
  people = [],
  selfId,
}: {
  look?: LookId;
  title?: string;
  placeId?: string;
  spendable?: number;
  people?: CrowdPerson[];
  selfId?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  // Elevated isometric camera like in the clubs, looking down from above into the compact room
  const rig = useRef({ yaw: 0.42, zoom: 1.15 });
  const [inspectedItem, setInspectedItem] = useState<StoreItem | null>(null);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [purchaseToast, setPurchaseToast] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "phones" | "cases">("all");
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const handleQuenchThirst = () => {
    setPurchaseToast("🥤 Ice-cold Chapman & Eva Water enjoyed! Thirst satisfied · −₦300");
    window.setTimeout(() => setPurchaseToast(null), 3500);
  };

  // Store Catalog items with Purchase capability
  const allItems: StoreItem[] = [
    { id: "p-ip16", name: "iPhone 16 Pro Max", category: "Phone", price: 2250000, specs: "1TB · Desert Titanium · Triple 48MP Camera · A18 Pro Chip", colorName: "Desert Titanium" },
    { id: "p-ip15", name: "iPhone 15 Pro", category: "Phone", price: 1450000, specs: "256GB · Space Black · Dynamic Island · A17 Pro Chip", colorName: "Space Black" },
    { id: "p-s24", name: "Samsung Galaxy S24 Ultra", category: "Phone", price: 1750000, specs: "512GB · Titanium Gray · 200MP Zoom · Galaxy AI & S-Pen", colorName: "Titanium Gray" },
    { id: "p-zflip", name: "Galaxy Z Flip 6", category: "Phone", price: 1350000, specs: "256GB · Mint Green · Compact Foldable · Flex Window", colorName: "Mint Green" },
    { id: "p-camon", name: "Tecno Camon 30 Pro 5G", category: "Phone", price: 385000, specs: "256GB · Emerald Green · 50MP Sony Sensor · 70W Fast Charge", colorName: "Emerald Green" },
    { id: "p-redmi", name: "Redmi Note 13 Pro+", category: "Phone", price: 310000, specs: "256GB · Midnight Black · 200MP OIS · 120W HyperCharge", colorName: "Midnight Black" },
    { id: "c-mag-clear", name: "MagSafe Diamond Clear Case", category: "Case", price: 18000, specs: "Anti-Yellowing TPU + PC · Strong N52 MagSafe Ring · Shock Airbags", colorName: "Diamond Clear" },
    { id: "c-leather-tan", name: "Italian Saddle Leather Case", category: "Case", price: 32000, specs: "Top-Grain Genuine Leather · Microfiber Velvet Interior · Metal Buttons", colorName: "Saddle Tan" },
    { id: "c-leather-green", name: "British Racing Green Leather Case", category: "Case", price: 32000, specs: "Luxury Textured Leather · Gold Camera Ring · Slim Profile", colorName: "Racing Green" },
    { id: "c-carbon", name: "Forged Carbon Fiber Armor Case", category: "Case", price: 45000, specs: "Real Carbon Fiber Weave · High-Gloss Finish · Scratchproof & Slim", colorName: "Gloss Carbon" },
    { id: "c-camo", name: "Camo Tactical Drop Armor", category: "Case", price: 25000, specs: "Heavy-Duty Dual Layer TPU · Kickstand · 14ft Drop Test Certified", colorName: "Military Olive" },
    { id: "c-marble", name: "Carrera White & Gold Marble Case", category: "Case", price: 18000, specs: "Glossy IMD Marble Graphic · Electroplated Gold Veins · Raised Lip", colorName: "White / Gold" },
    { id: "c-silicone-red", name: "Flame Red Silicone Gel Case", category: "Case", price: 12000, specs: "Soft-Touch Liquid Silicone · Microfiber Lining · Fingerprint Resistant", colorName: "Flame Red" },
    { id: "c-silicone-cyan", name: "Electric Cyan Silicone Gel Case", category: "Case", price: 12000, specs: "Soft-Touch Liquid Silicone · Vibrant Cyan · Grip Texture", colorName: "Electric Cyan" },
  ];

  useEffect(() => {
    const root = host.current;
    if (!root) return;

    const renderer = makeRenderer();
    renderer.setSize(root.clientWidth, root.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    root.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0c121e"); // Sleek boutique dark theme

    // Lighting: Hemisphere ambient + directional spotlights
    scene.add(new THREE.HemisphereLight(0xfff7ed, 0x1e293b, 1.05));

    const mainLight = new THREE.DirectionalLight(0xffedd5, 1.35);
    mainLight.position.set(4, 12, 6);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.set(1024, 1024);
    scene.add(mainLight);

    // Accent spotlights on showcase and wall
    const showcaseSpot = new THREE.SpotLight(0x38bdf8, 32, 14, Math.PI / 4, 0.35, 1);
    showcaseSpot.position.set(0, 5.5, 0.6);
    showcaseSpot.target.position.set(0, 0.9, 0.6);
    scene.add(showcaseSpot, showcaseSpot.target);

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
    // COMPACT, WELL-PROPORTIONED 3D ROOM (Viewable from up like in the clubs!)
    // Dimensions: 12.0 wide x 8.8 deep x 4.8 high
    // ─────────────────────────────────────────────────────────────

    // FLOOR: Polished tiles
    box(12, 0.12, 8.8, 0x172033, 0, -0.06, 0, false);
    box(12.2, 0.14, 0.14, 0xe0b15a, 0, 0.01, 4.35, false);

    // CUTAWAY WALLS (Open top, no roof - dollhouse view from above)
    box(12, 3.5, 0.28, 0x0f172a, 0, 1.75, -4.3); // Back Wall (lower cutaway)

    // SIDE WALLS (lower cutaway)
    box(0.28, 3.5, 8.8, 0x111827, -5.9, 1.75, 0); // Left Wall
    box(0.28, 3.5, 8.8, 0x111827, 5.9, 1.75, 0); // Right Wall

    // ILLUMINATED STORE SIGN ON BACK WALL
    const signMat = new THREE.MeshBasicMaterial({ map: createStoreSignTexture(title) });
    const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.8), signMat);
    signBoard.position.set(0, 4.0, -4.14);
    room.add(signBoard);

    // Neon accent bar under sign
    const neonBar = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    neonBar.position.set(0, 3.05, -4.12);
    room.add(neonBar);

    // ─────────────────────────────────────────────────────────────
    // 1. THE GLASS SHOWCASE (DISPLAY COUNTER IN CENTER)
    // ─────────────────────────────────────────────────────────────
    const makeShowcase = () => {
      const sc = new THREE.Group();

      // Lower plinth base with Ice Blue LED underglow
      const base = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.65, 1.8), new THREE.MeshLambertMaterial({ color: 0x0f172a }));
      base.position.set(0, 0.325, 0.6);
      base.castShadow = true;
      base.receiveShadow = true;

      const underglow = new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.05, 1.85), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      underglow.position.set(0, 0.06, 0.6);

      // Black velvet display deck inside
      const deck = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.06, 1.5), new THREE.MeshLambertMaterial({ color: 0x1e293b }));
      deck.position.set(0, 0.68, 0.6);

      // Tempered glass cabinet (Front, Top, Ends)
      const glassMat = new THREE.MeshLambertMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.35 });
      const glassFront = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.54, 0.05), glassMat);
      glassFront.position.set(0, 0.98, 1.45);
      const glassTop = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.05, 1.6), glassMat);
      glassTop.position.set(0, 1.28, 0.6);
      const glassLeft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.54, 1.6), glassMat);
      glassLeft.position.set(-2.8, 0.98, 0.6);
      const glassRight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.54, 1.6), glassMat);
      glassRight.position.set(2.8, 0.98, 0.6);

      // Chrome corner mounting brackets
      for (const cx of [-2.82, 2.82]) {
        for (const cz of [-0.2, 1.4]) {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }));
          post.position.set(cx, 0.98, cz);
          sc.add(post);
        }
      }

      // Internal LED strip downlighting inside showcase
      const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.03, 0.06), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      ledStrip.position.set(0, 1.25, 1.38);
      sc.add(ledStrip);

      sc.add(base, underglow, deck, glassFront, glassTop, glassLeft, glassRight);
      room.add(sc);

      // ─────────────────────────────────────────────────────────────
      // PHONES INSIDE THE SHOWCASE (Angled stands, visible from up)
      // ─────────────────────────────────────────────────────────────
      const showcasePhones = [
        { color: 0x334155, screen: "lock" as const, x: -2.0 },
        { color: 0x1e293b, screen: "apps" as const, x: -1.2 },
        { color: 0x475569, screen: "samsung" as const, x: -0.4 },
        { color: 0x6ee7b7, screen: "lock" as const, x: 0.4 },
        { color: 0x047857, screen: "apps" as const, x: 1.2 },
        { color: 0x0f172a, screen: "samsung" as const, x: 2.0 },
      ];

      showcasePhones.forEach((phone) => {
        const pGroup = new THREE.Group();
        // Stand
        const stand = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.36), new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 }));
        stand.position.set(0, 0.09, 0);

        // Phone body
        const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.76, 0.045), new THREE.MeshLambertMaterial({ color: phone.color }));
        pBody.rotation.x = -0.32;
        pBody.position.set(0, 0.38, 0.04);

        // Glowing Screen
        const scrTex = createPhoneScreenTexture(phone.screen);
        const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.72), new THREE.MeshBasicMaterial({ map: scrTex }));
        screenMesh.position.set(0, 0, 0.025);
        pBody.add(screenMesh);

        pGroup.add(stand, pBody);
        pGroup.position.set(phone.x, 0.72, 0.82);
        room.add(pGroup);
      });

      // ─────────────────────────────────────────────────────────────
      // PHONE CASES INSIDE THE SHOWCASE
      // ─────────────────────────────────────────────────────────────
      const showcaseCases = [
        { color: 0xe2e8f0, magRing: true, x: -1.8 },
        { color: 0x854d0e, magRing: false, x: -1.0 },
        { color: 0x14532d, magRing: false, x: -0.2 },
        { color: 0x111827, magRing: true, x: 0.6 },
        { color: 0xc084fc, magRing: true, x: 1.4 },
      ];

      showcaseCases.forEach((cs) => {
        const cGroup = new THREE.Group();
        const tray = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.6), new THREE.MeshLambertMaterial({ color: 0x020617 }));
        tray.position.set(0, 0.025, 0);

        const caseMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.75, 0.06), new THREE.MeshLambertMaterial({ color: cs.color }));
        caseMesh.rotation.x = -0.22;
        caseMesh.position.set(0, 0.18, 0);

        if (cs.magRing) {
          const ring = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.11, 14), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
          ring.position.set(0, -0.04, 0.035);
          caseMesh.add(ring);
        }

        cGroup.add(tray, caseMesh);
        cGroup.position.set(cs.x, 0.72, 0.25);
        room.add(cGroup);
      });
    };
    makeShowcase();

    // ─────────────────────────────────────────────────────────────
    // 2. PHONE CASES HANGING ON THE WALLS (Slatwall Racks)
    // ─────────────────────────────────────────────────────────────
    const makeWallHangingCases = () => {
      const railYs = [1.5, 2.2, 2.9];
      railYs.forEach((y) => {
        box(10.5, 0.05, 0.06, 0x94a3b8, 0, y, -4.12, false);
      });

      const caseRows = [
        // Row 1: Armor & Heavy Duty
        [
          { color: 0x365314, title: "ARMOR-X", headerColor: "#15803d" },
          { color: 0x09090b, title: "CARBON PRO", headerColor: "#0284c7" },
          { color: 0x92400e, title: "MIL-SPEC", headerColor: "#b45309" },
          { color: 0x475569, title: "TITAN", headerColor: "#475569" },
          { color: 0xf8fafc, title: "DEFENDER", headerColor: "#64748b" },
          { color: 0x991b1b, title: "KICKSTAND", headerColor: "#dc2626" },
        ],
        // Row 2: Marble & Trends
        [
          { color: 0xfef08a, title: "MARBLE", headerColor: "#d97706" },
          { color: 0x06b6d4, title: "CYBER", headerColor: "#0891b2" },
          { color: 0xd946ef, title: "PRISM", headerColor: "#c026d3" },
          { color: 0x0f172a, title: "GOLD LEAF", headerColor: "#eab308" },
          { color: 0xe2e8f0, title: "MIRROR", headerColor: "#94a3b8" },
          { color: 0x059669, title: "AGATE", headerColor: "#059669" },
        ],
        // Row 3: Rainbow Silicone & Clear
        [
          { color: 0xef4444, title: "SILICONE", headerColor: "#ef4444" },
          { color: 0x38bdf8, title: "SILICONE", headerColor: "#0284c7" },
          { color: 0x84cc16, title: "SILICONE", headerColor: "#65a30d" },
          { color: 0xa855f7, title: "SILICONE", headerColor: "#9333ea" },
          { color: 0xf1f5f9, title: "CLEAR FLEX", headerColor: "#38bdf8" },
          { color: 0x334155, title: "MAG-CLEAR", headerColor: "#0284c7" },
        ],
      ];

      caseRows.forEach((row, rIdx) => {
        const y = railYs[rIdx];
        const count = row.length;
        const totalW = 9.2;
        const spacing = totalW / (count - 1);

        row.forEach((item, cIdx) => {
          const x = -totalW / 2 + cIdx * spacing;
          const hanger = new THREE.Group();

          // Metal Display Peg hook protruding from wall
          const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.44, 6), new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }));
          peg.rotation.x = Math.PI / 2;
          peg.position.set(0, 0, 0.22);
          hanger.add(peg);

          // Card header
          const cardTex = createHangerCardTexture(item.title, item.headerColor);
          const card = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.88), new THREE.MeshBasicMaterial({ map: cardTex }));
          card.position.set(0, -0.28, 0.32);
          hanger.add(card);

          // 3D Case visible in blister pack
          const case3d = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.65, 0.05), new THREE.MeshLambertMaterial({ color: item.color }));
          case3d.position.set(0, -0.32, 0.36);
          hanger.add(case3d);

          hanger.position.set(x, y, -4.12);
          room.add(hanger);
        });
      });
    };
    makeWallHangingCases();

    // ─────────────────────────────────────────────────────────────
    // 3. SERVICE COUNTER & REALISTIC VENDOR NPC
    // ─────────────────────────────────────────────────────────────
    const makeServiceCounter = () => {
      // Counter desk behind the showcase
      box(4.6, 0.95, 1.0, 0x0f172a, 0, 0.475, -2.0);
      box(4.7, 0.06, 1.1, 0x1e293b, 0, 0.98, -2.0);

      // Laptop terminal on counter
      const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.03, 0.38), new THREE.MeshLambertMaterial({ color: 0x94a3b8 }));
      laptopBase.position.set(-1.0, 1.03, -1.9);
      const laptopScreen = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.38, 0.02), new THREE.MeshLambertMaterial({ color: 0x0f172a }));
      laptopScreen.position.set(-1.0, 1.21, -2.05);
      laptopScreen.rotation.x = -0.2;
      const glowingDisplay = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.34), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      glowingDisplay.position.set(0, 0, 0.015);
      laptopScreen.add(glowingDisplay);
      room.add(laptopBase, laptopScreen);

      // POS card terminal (Moniepoint)
      const posDevice = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.07, 0.34), new THREE.MeshLambertMaterial({ color: 0x1d4ed8 }));
      posDevice.position.set(1.2, 1.03, -1.85);
      const posScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.12), new THREE.MeshBasicMaterial({ color: 0x60a5fa }));
      posScreen.rotation.x = -Math.PI / 2;
      posScreen.position.set(0, 0.04, -0.05);
      posDevice.add(posScreen);
      room.add(posDevice);

      // Shelves with retail iPhone & Samsung boxes
      for (const y of [1.4, 2.2]) {
        box(2.8, 0.05, 0.5, 0x1e293b, -4.2, y, -3.8);
        for (let b = 0; b < 5; b++) {
          box(0.32, 0.16, 0.4, b % 2 === 0 ? 0xf8fafc : 0x0f172a, -5.0 + b * 0.4, y + 0.1, -3.8);
        }
      }
      for (const y of [1.4, 2.2]) {
        box(2.8, 0.05, 0.5, 0x1e293b, 4.2, y, -3.8);
        for (let b = 0; b < 4; b++) {
          box(0.36, 0.18, 0.38, 0x16a34a, 3.4 + b * 0.5, y + 0.11, -3.8);
        }
      }

      // REALISTIC VENDOR NPC (Nonso Plug) standing behind counter
      const vendorAvatar = createRealisticHuman({
        lookId: "chidi",
        seated: false,
        scale: 0.62,
        customShirt: 0x0284c7, // Branded polo
      });
      vendorAvatar.position.set(0, 0, -2.6);
      room.add(vendorAvatar);
    };
    makeServiceCounter();

    // ─────────────────────────────────────────────────────────────
    // REALISTIC PLAYER AVATAR IN FRONT OF SHOWCASE
    // ─────────────────────────────────────────────────────────────
    const playerAvatar = createRealisticHuman({
      lookId: look,
      seated: false,
      scale: 0.62,
    });
    playerAvatar.position.set(0.6, 0, 2.6);
    playerAvatar.rotation.y = Math.PI; // Facing into the showcase
    room.add(playerAvatar);
    addPlayerGuests(room, people, selfId, { x: 0.6, z: 1.6, rot: Math.PI });

    // ─────────────────────────────────────────────────────────────
    // ELEVATED ISOMETRIC CAMERA (Looking down from up like in the clubs!)
    // ─────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    const aim = new THREE.Vector3(7, 10, 11).normalize();

    const fit = () => {
      renderer.setSize(root.clientWidth || 1, root.clientHeight || 1);
      camera.aspect = (root.clientWidth || 1) / (root.clientHeight || 1);
      camera.updateProjectionMatrix();
    };
    fit();

    // Attach touch pinch-and-zoom / shrink, mouse wheel zoom, and drag rotation
    const detachControls = attachSceneCameraControls(root, rig, {
      minZoom: 0.2,
      maxZoom: 10,
      zoomSpeed: 0.1,
    });

    let frame = 0;
    let alive = true;

    const loop = () => {
      if (!alive) return;
      room.rotation.y = rig.current.yaw;
      // High-angle elevated camera looking down from above into the compact room
      camera.position.copy(aim).multiplyScalar(13.5 / rig.current.zoom);
      camera.lookAt(0, 0.85, 0.2);

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
      detachControls();
      renderer.dispose();
      root.removeChild(renderer.domElement);
    };
  }, [look, title, people.map((person) => person.id).join("|"), selfId]);

  function turn(dir: number) {
    rig.current.yaw += dir * 0.45;
  }
  function dolly(factor: number) {
    rig.current.zoom = Math.min(6.5, Math.max(0.5, rig.current.zoom * factor));
  }

  function handlePurchase(item: StoreItem) {
    setPurchasedIds((prev) => new Set([...prev, item.id]));
    setPurchaseToast(`🎉 Purchased ${item.name} for ${naira(item.price)}! Added to your pocket.`);
    window.setTimeout(() => setPurchaseToast(null), 4500);
  }

  return (
    <div className="absolute inset-0 bg-[#070b12] text-[#f6f1e6]">
      {/* 3D WebGL Canvas */}
      <div
        ref={host}
        className="absolute inset-0 touch-none"
      />

      {/* Mobile-Optimized Store Header Badge */}
      <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-[calc(100%-4.5rem)] sm:max-w-xs rounded-2xl bg-[#09111c]/90 p-2.5 sm:p-3 shadow-2xl backdrop-blur-md border border-[#38bdf8]/30">
        <div className="flex items-center gap-1.5">
          <span className="flex h-2 w-2 rounded-full bg-[#22c55e]" />
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.16em] text-[#e0b15a]">Verified Gadget Store</p>
        </div>
        <h2 className="mt-0.5 font-bold text-sm sm:text-base text-white truncate">{title}</h2>
        <p className="text-[10px] sm:text-xs text-[#94a3b8] truncate">Tetlow Road Phone Market · Owerri</p>
        <p className="hidden sm:block mt-1 text-[11px] text-[#cbd5e1] leading-relaxed">
          Glass showcase with smartphones &amp; cases in center, with hanging phone cases on the walls.
        </p>
      </div>

      {/* Purchase Toast Banner */}
      {purchaseToast ? (
        <div className="pointer-events-none absolute inset-x-3 top-16 sm:top-20 z-40 mx-auto max-w-sm sm:max-w-md animate-bounce rounded-2xl bg-[#061826]/95 border-2 border-[#22c55e] p-2.5 sm:p-3 text-center shadow-2xl backdrop-blur-md">
          <p className="text-xs sm:text-sm font-bold text-[#4ade80]">{purchaseToast}</p>
        </div>
      ) : null}

      {/* Mobile-Optimized Showcase, Wall Cases & Quick Actions Panel */}
      <div className="absolute left-3 top-24 sm:top-28 z-30 w-[calc(100%-1.5rem)] sm:w-80 max-h-[50vh] sm:max-h-[calc(100%-8rem)] flex flex-col rounded-2xl bg-[#09111c]/95 border border-[#38bdf8]/35 shadow-2xl backdrop-blur-xl transition-all">
        {/* Panel Header */}
        <div className="flex items-center justify-between p-3 pb-2 border-b border-white/10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#e0b15a]">
              Tetlow Gadget Showcase
            </p>
            <p className="text-xs text-[#cbd5e1]">
              {categoryFilter === "all" ? "All Items" : categoryFilter === "phones" ? "Center Showcase (Phones)" : "Wall Slatwall Cases"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPanelCollapsed(!panelCollapsed)}
            className="rounded-lg bg-white/10 px-2 py-1 text-[11px] font-bold text-white hover:bg-white/20 transition-colors"
          >
            {panelCollapsed ? "Expand ▾" : "Collapse ▴"}
          </button>
        </div>

        {!panelCollapsed ? (
          <>
            {/* Quick Action: Thirst & Category Filter Tabs */}
            <div className="p-2.5 pb-1 border-b border-white/10 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleQuenchThirst}
                className="w-full flex items-center justify-between rounded-xl bg-gradient-to-r from-[#0284c7]/20 to-[#0ea5e9]/10 border border-[#38bdf8]/40 px-3 py-1.5 text-xs font-bold text-[#38bdf8] hover:bg-[#0284c7]/30 transition-all active:scale-95 shadow"
              >
                <span>🥤 Quench Thirst (Cold Drink)</span>
                <span className="text-[11px] text-[#e0b15a]">₦300</span>
              </button>

              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className={`rounded-lg py-1 text-[10px] font-bold transition-all ${
                    categoryFilter === "all"
                      ? "bg-[#38bdf8] text-[#09111c] shadow"
                      : "bg-white/5 text-[#cbd5e1] hover:bg-white/10"
                  }`}
                >
                  All ({allItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("phones")}
                  className={`rounded-lg py-1 text-[10px] font-bold transition-all ${
                    categoryFilter === "phones"
                      ? "bg-[#38bdf8] text-[#09111c] shadow"
                      : "bg-white/5 text-[#cbd5e1] hover:bg-white/10"
                  }`}
                >
                  📱 Showcase
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("cases")}
                  className={`rounded-lg py-1 text-[10px] font-bold transition-all ${
                    categoryFilter === "cases"
                      ? "bg-[#38bdf8] text-[#09111c] shadow"
                      : "bg-white/5 text-[#cbd5e1] hover:bg-white/10"
                  }`}
                >
                  🛡 Wall Cases
                </button>
              </div>
            </div>

            {/* Scrollable Item List with Purchase Buttons */}
            <div className="p-2 overflow-y-auto space-y-1.5 max-h-[50vh]">
              {allItems
                .filter((item) => {
                  if (categoryFilter === "phones") return item.category === "Phone";
                  if (categoryFilter === "cases") return item.category === "Case";
                  return true;
                })
                .map((item) => {
                  const isOwned = purchasedIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl bg-white/5 p-2 hover:bg-white/10 transition-colors border border-white/5"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{item.category === "Phone" ? "📱" : "🛡"}</span>
                          <span className="truncate text-xs font-bold text-white">{item.name}</span>
                        </div>
                        <p className="text-[10px] text-[#94a3b8] truncate">{item.colorName} · {item.specs}</p>
                        <p className="text-xs font-extrabold text-[#e0b15a] mt-0.5">{naira(item.price)}</p>
                      </div>

                      <div className="shrink-0 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setInspectedItem(item)}
                          className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-semibold text-[#cbd5e1] hover:bg-white/20"
                        >
                          Inspect
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePurchase(item)}
                          className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-all shadow ${
                            isOwned
                              ? "bg-[#16a34a] text-white"
                              : "bg-[#e0b15a] text-[#0f172a] hover:bg-[#f2c14e] active:scale-95"
                          }`}
                        >
                          {isOwned ? "✔ Owned" : "Purchase 💳"}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        ) : null}
      </div>

      {/* Item Inspection & Direct Purchase Modal */}
      {inspectedItem ? (
        <div className="absolute inset-x-3 bottom-6 z-40 mx-auto max-w-lg rounded-3xl bg-[#09111c]/98 border-2 border-[#38bdf8]/50 p-4 shadow-2xl backdrop-blur-2xl text-white">
          <div className="flex items-start justify-between">
            <div>
              <span className="rounded-md bg-[#38bdf8]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#38bdf8]">
                {inspectedItem.category === "Phone" ? "In Glass Showcase" : "Hanging on Wall Slatwall"}
              </span>
              <h3 className="mt-1 text-lg font-bold">{inspectedItem.name}</h3>
              <p className="text-xs text-[#94a3b8]">{inspectedItem.colorName}</p>
            </div>
            <button
              type="button"
              onClick={() => setInspectedItem(null)}
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
            {purchasedIds.has(inspectedItem.id) ? (
              <span className="rounded-full bg-[#16a34a] px-3 py-1 text-xs font-bold text-white">
                ✔ Already In Your Pocket
              </span>
            ) : (
              <span className="rounded-full bg-[#16a34a]/30 px-2.5 py-1 text-xs font-bold text-[#4ade80]">
                In Stock &amp; Boxed
              </span>
            )}
          </div>

          <p className="mt-2 text-xs text-[#cbd5e1] leading-relaxed">{inspectedItem.specs}</p>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                handlePurchase(inspectedItem);
                setInspectedItem(null);
              }}
              className="flex-1 rounded-xl bg-[#e0b15a] py-3 text-xs font-extrabold text-[#0f172a] hover:bg-[#f2c14e] transition-all shadow-lg active:scale-95"
            >
              {purchasedIds.has(inspectedItem.id) ? "Buy Another 💳" : `Purchase Now · ${naira(inspectedItem.price)} 💳`}
            </button>
            <button
              type="button"
              onClick={() => {
                alert(`Vendor Nonso says: "That's ${naira(inspectedItem.price)} last! Original with warranty. Tetlow guarantee!"`);
              }}
              className="rounded-xl bg-white/10 px-4 py-3 text-xs font-semibold text-white hover:bg-white/20"
            >
              Bargain 💬
            </button>
          </div>
        </div>
      ) : null}

      {/* Compact Zoom and Orbit Controls (Top-Right) */}
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
