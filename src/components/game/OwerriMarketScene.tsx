"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { LookId } from "@/lib/game/types";
import { createRealisticHuman } from "@/lib/game/humanModel";
import { naira } from "@/lib/game/format";

export interface MarketItem {
  id: string;
  name: string;
  stall: string;
  category: "Foodstuff" | "Fish & Meat" | "Fabric" | "Provisions";
  price: number;
  desc: string;
  emoji: string;
}

// Market Sign Canvas Texture
function createMarketSignTexture(marketName: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Background banner
  ctx.fillStyle = "#14532d"; // Forest green
  ctx.fillRect(0, 0, 1024, 256);

  // Gold border
  ctx.strokeStyle = "#e0b15a";
  ctx.lineWidth = 10;
  ctx.strokeRect(12, 12, 1000, 232);

  // Subtitle
  ctx.fillStyle = "#fef08a";
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("OWERRI CENTRAL TRADERS & COMMERCE ASSOCIATION", 512, 54);

  // Main Market Name
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 64px sans-serif";
  ctx.fillText(marketName.toUpperCase(), 512, 130);

  // Tagline
  ctx.fillStyle = "#86efac";
  ctx.font = "italic 26px sans-serif";
  ctx.fillText("Fresh Foodstuffs · Ankara & Wax Prints · Provisions · Daily Market", 512, 185);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

export function OwerriMarketScene({
  look = "chidi",
  title = "Relief Market",
  placeId = "relief-market",
  username = "Shopper",
}: {
  look?: LookId;
  title?: string;
  placeId?: string;
  username?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  // High-angle isometric view looking down into the market stalls like the clubs
  const rig = useRef({ yaw: 0.42, zoom: 1.15 });

  const [toast, setToast] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false); // default collapsed on mobile for clean 3D view
  const [activeCategory, setActiveCategory] = useState<"all" | "Foodstuff" | "Fish & Meat" | "Fabric" | "Provisions">("all");
  const [basketCount, setBasketCount] = useState(0);

  const marketItems: MarketItem[] = [
    { id: "m-yam", name: "Tubers of Benue Yam (5 pcs)", stall: "Mama Nkechi Foodstuffs", category: "Foodstuff", price: 6500, desc: "Dry starchy big tubers, perfect for pounded yam.", emoji: "🍠" },
    { id: "m-pepper", name: "Basket of Fresh Scotch Bonnet", stall: "Mama Nkechi Foodstuffs", category: "Foodstuff", price: 2000, desc: "Ata rodo & fresh red tomatoes straight from the farm.", emoji: "🌶️" },
    { id: "m-garri", name: "Paint Bucket of Yellow Garri", stall: "Mama Nkechi Foodstuffs", category: "Foodstuff", price: 2800, desc: "Crispy fried yellow garri with palm oil fragrance.", emoji: "🌾" },
    { id: "m-plantain", name: "Bunch of Ripe Plantains", stall: "Mama Nkechi Foodstuffs", category: "Foodstuff", price: 2200, desc: "Sweet dodo grade, golden yellow skin.", emoji: "🍌" },
    { id: "m-fish", name: "Smoked Catfish & Mangala Pack", stall: "Alhaji Smoked Fish", category: "Fish & Meat", price: 3500, desc: "Kiln-dried river catfish, rich smoky aroma for Ofe Owerri.", emoji: "🐟" },
    { id: "m-stockfish", name: "Original Okporoko Cod Head", stall: "Alhaji Smoked Fish", category: "Fish & Meat", price: 4800, desc: "Norwegian imported stockfish head, thick flesh.", emoji: "🍲" },
    { id: "m-ankara", name: "High-Target Dutch Wax Ankara (6 yds)", stall: "Madam Blessing Fabrics", category: "Fabric", price: 8500, desc: "100% Cotton vibrant African geometric print.", emoji: "👗" },
    { id: "m-lace", name: "Dry Lace Material (5 yards)", stall: "Madam Blessing Fabrics", category: "Fabric", price: 14000, desc: "Sparkling silver & emerald lace for Owambe parties.", emoji: "✨" },
    { id: "m-drinks", name: "Chilled Maltina & Eva Water Pack", stall: "Brother Jude Provisions", category: "Provisions", price: 1200, desc: "Ice-cold drinks straight out of the cooler.", emoji: "🥤" },
  ];

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
  };

  const handleBuyItem = (item: MarketItem) => {
    setBasketCount((c) => c + 1);
    showToast(`🛒 Purchased ${item.name} for ${naira(item.price)}! Added to market bag.`);
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
    scene.background = new THREE.Color("#18212d");

    // Lighting: Warm Nigerian tropical open-air daylight
    scene.add(new THREE.HemisphereLight(0xfffbeb, 0x5b4636, 1.15));

    const sun = new THREE.DirectionalLight(0xffedd5, 1.45);
    sun.position.set(12, 18, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);

    const market = new THREE.Group();
    scene.add(market);

    const box = (w: number, h: number, d: number, color: number, x: number, y: number, z: number, cast = true) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
      mesh.position.set(x, y, z);
      mesh.castShadow = cast;
      mesh.receiveShadow = true;
      market.add(mesh);
      return mesh;
    };

    // ─────────────────────────────────────────────────────────────
    // MARKET GROUND & PAVING (13.5m wide x 11.5m deep)
    // ─────────────────────────────────────────────────────────────
    // Earthy laterite market ground
    box(14, 0.14, 12, 0x854d32, 0, -0.07, 0, false);

    // Central concrete walkway aisle
    box(3.2, 0.16, 12, 0xa8a29e, 0, -0.06, 0, false);
    box(14, 0.16, 2.4, 0xa8a29e, 0, -0.06, 0, false); // Cross aisle

    // Surrounding brick stall perimeter walls
    box(14, 3.8, 0.3, 0x78350f, 0, 1.9, -5.8); // Back wall
    box(0.3, 3.8, 12, 0x78350f, -6.8, 1.9, 0); // Left wall
    box(0.3, 3.8, 12, 0x78350f, 6.8, 1.9, 0); // Right wall

    // Market Signboard across the back wall
    const signTex = createMarketSignTexture(title);
    const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 2.05), new THREE.MeshBasicMaterial({ map: signTex }));
    signBoard.position.set(0, 3.6, -5.6);
    market.add(signBoard);

    // ─────────────────────────────────────────────────────────────
    // 4 VIBRANT MARKET STALLS WITH CANOPY AWNINGS
    // ─────────────────────────────────────────────────────────────

    // Helper to build a wooden market stall with cloth canopy
    const buildStall = (
      sx: number,
      sz: number,
      sw: number,
      sd: number,
      canopyColor: number,
      hasStripes = false
    ) => {
      // Wooden counter table
      box(sw, 0.9, sd, 0x9a3412, sx, 0.45, sz);
      // Table tabletop edge
      box(sw + 0.1, 0.08, sd + 0.1, 0xc2410c, sx, 0.92, sz);

      // 4 Wooden corner canopy poles
      const poleH = 2.4;
      const hw = sw / 2 - 0.1;
      const hd = sd / 2 - 0.1;
      box(0.08, poleH, 0.08, 0x78350f, sx - hw, poleH / 2, sz - hd);
      box(0.08, poleH, 0.08, 0x78350f, sx + hw, poleH / 2, sz - hd);
      box(0.08, poleH, 0.08, 0x78350f, sx - hw, poleH / 2, sz + hd);
      box(0.08, poleH, 0.08, 0x78350f, sx + hw, poleH / 2, sz + hd);

      // Angled cloth tarpaulin canopy roof
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(sw + 0.4, 0.06, sd + 0.4),
        new THREE.MeshLambertMaterial({ color: canopyColor })
      );
      roof.position.set(sx, poleH + 0.1, sz);
      roof.rotation.x = 0.08; // Slight forward slant
      market.add(roof);

      if (hasStripes) {
        const stripe = new THREE.Mesh(
          new THREE.BoxGeometry(sw + 0.42, 0.08, (sd + 0.4) * 0.35),
          new THREE.MeshLambertMaterial({ color: 0xfef08a })
        );
        stripe.position.set(sx, poleH + 0.11, sz);
        stripe.rotation.x = 0.08;
        market.add(stripe);
      }
    };

    // Stall 1: Foodstuff & Yams (Front-Left)
    buildStall(-3.6, 2.4, 3.4, 2.2, 0x15803d, true); // Green & yellow canopy
    // Stall 2: Fish & Stockfish (Back-Left)
    buildStall(-3.6, -2.6, 3.4, 2.2, 0x1d4ed8, false); // Royal blue canopy
    // Stall 3: Ankara & Wax Fabrics (Front-Right)
    buildStall(3.6, 2.4, 3.4, 2.2, 0x9333ea, true); // Purple & yellow canopy
    // Stall 4: Provisions & Cold Drinks (Back-Right)
    buildStall(3.6, -2.6, 3.4, 2.2, 0xdc2626, false); // Bright red canopy

    // ─────────────────────────────────────────────────────────────
    // STALL MERCHANDISE (Foodstuffs, Yams, Peppers, Fabrics)
    // ─────────────────────────────────────────────────────────────

    // Foodstuff Stall Items (-3.6, 2.4)
    // Yam tubers stacked horizontally on table
    for (let y = 0; y < 4; y++) {
      const yam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.65, 8),
        new THREE.MeshLambertMaterial({ color: 0x5a3516 })
      );
      yam.rotation.z = Math.PI / 2;
      yam.position.set(-4.2 + y * 0.22, 1.05, 2.2);
      market.add(yam);
    }
    // Red Scotch bonnet pepper baskets
    box(0.55, 0.25, 0.55, 0xd97706, -3.2, 1.05, 2.5); // Woven basket
    box(0.5, 0.15, 0.5, 0xdc2626, -3.2, 1.2, 2.5); // Red peppers pile
    // Yellow garri basin
    box(0.55, 0.25, 0.55, 0x0284c7, -2.5, 1.05, 2.3); // Blue plastic basin
    box(0.5, 0.12, 0.5, 0xfef08a, -2.5, 1.2, 2.3); // Yellow garri
    // Red palm oil gallon
    box(0.28, 0.42, 0.28, 0xb91c1c, -4.8, 1.15, 2.5);

    // Fish Stall Items (-3.6, -2.6)
    // Stainless steel fish basins
    box(0.65, 0.22, 0.65, 0xd1d5db, -4.0, 1.05, -2.4);
    box(0.6, 0.12, 0.6, 0x334155, -4.0, 1.18, -2.4); // Smoked catfish
    box(0.65, 0.22, 0.65, 0xd1d5db, -3.0, 1.05, -2.5);
    box(0.6, 0.12, 0.6, 0x9ca3af, -3.0, 1.18, -2.5); // Stockfish

    // Fabric Stall Items (3.6, 2.4)
    // Stacks of folded Ankara & lace fabrics
    box(0.65, 0.35, 0.45, 0xdb2777, 2.8, 1.12, 2.3); // Pink/gold wax
    box(0.65, 0.35, 0.45, 0x2563eb, 3.6, 1.12, 2.4); // Blue royal print
    box(0.65, 0.35, 0.45, 0x16a34a, 4.4, 1.12, 2.3); // Emerald green print

    // Provisions Stall Items (3.6, -2.6)
    // Red ice cooler for cold drinks
    box(0.85, 0.55, 0.55, 0xdc2626, 3.0, 1.2, -2.4);
    box(0.88, 0.08, 0.58, 0xffffff, 3.0, 1.5, -2.4); // Cooler lid
    // Cartons of biscuits & soft drinks
    box(0.6, 0.4, 0.5, 0xca8a04, 4.2, 1.15, -2.5);

    // ─────────────────────────────────────────────────────────────
    // MARKET CHARACTERS (VENDORS & SHOPPERS)
    // ─────────────────────────────────────────────────────────────

    // Vendor 1: Mama Nkechi (Foodstuffs Trader)
    const mamaNkechi = createRealisticHuman({
      lookId: "ngozi",
      customShirt: 0xdc2626,
      customPants: 0x1e293b,
      hairStyle: "bun",
      seated: true,
      scale: 0.96,
    });
    mamaNkechi.position.set(-3.6, 0, 3.2); // Behind foodstuff counter
    mamaNkechi.rotation.y = Math.PI; // Facing customer
    market.add(mamaNkechi);

    // Vendor 2: Alhaji Musa (Smoked Fish Vendor)
    const alhaji = createRealisticHuman({
      lookId: "ibe",
      customShirt: 0x0284c7,
      customPants: 0x334155,
      hairStyle: "fade",
      seated: false,
      scale: 1.02,
    });
    alhaji.position.set(-3.6, 0, -3.4); // Behind fish stall
    alhaji.rotation.y = 0; // Facing aisle
    market.add(alhaji);

    // Vendor 3: Madam Blessing (Fabrics Trader)
    const blessing = createRealisticHuman({
      lookId: "ada",
      customShirt: 0x9333ea,
      customPants: 0x0f172a,
      hairStyle: "braids",
      seated: false,
      scale: 0.98,
    });
    blessing.position.set(3.6, 0, 3.2); // Behind fabrics counter
    blessing.rotation.y = Math.PI;
    market.add(blessing);

    // Shopper NPC 1: Emeka (Walking down central aisle)
    const shopper = createRealisticHuman({
      lookId: "emeka",
      customShirt: 0xeab308,
      customPants: 0x1e293b,
      hairStyle: "fade",
      seated: false,
      scale: 0.98,
    });
    shopper.position.set(0.6, 0, -1.5);
    shopper.rotation.y = -0.4;
    market.add(shopper);

    // ─────────────────────────────────────────────────────────────
    // PLAYER CHARACTER SHOPPING IN CENTRAL AISLE
    // ────────────────────────────────────────────────────────────
    const playerAvatar = createRealisticHuman({
      lookId: look,
      seated: false,
      scale: 0.98,
    });
    playerAvatar.position.set(-0.5, 0, 1.2); // Right in front of foodstuff stall
    playerAvatar.rotation.y = -Math.PI / 4; // Looking toward Mama Nkechi
    market.add(playerAvatar);

    // Market wheelbarrow with goods
    box(1.1, 0.35, 0.65, 0x475569, 0.4, 0.35, 3.5);
    box(0.12, 0.35, 0.12, 0x0f172a, 0.4, 0.18, 4.0); // Wheel

    // ─────────────────────────────────────────────────────────────
    // CAMERA & RENDER LOOP (Isometric top-down perspective)
    // ─────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(34, root.clientWidth / root.clientHeight, 0.1, 100);
    const target = new THREE.Vector3(0, 1.1, 0);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);

      // Orbit camera calculation
      const r = 14.8 / rig.current.zoom;
      const phi = 0.66; // High angle tilt like in clubs
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

  const setViewPreset = (preset: "player" | "food" | "overview" | "topdown") => {
    if (preset === "player") {
      rig.current.zoom = 2.6;
      rig.current.yaw = -0.2;
    } else if (preset === "food") {
      rig.current.zoom = 2.2;
      rig.current.yaw = 0.55;
    } else if (preset === "overview") {
      rig.current.zoom = 1.15;
      rig.current.yaw = 0.42;
    } else if (preset === "topdown") {
      rig.current.zoom = 0.85;
      rig.current.yaw = 0.0;
    }
  };

  const displayedItems = marketItems.filter((item) => {
    if (activeCategory === "all") return true;
    return item.category === activeCategory;
  });

  return (
    <div className="relative h-full min-h-[72vh] w-full overflow-hidden bg-[#0f172a] select-none">
      {/* 3D Canvas Host */}
      <div
        ref={host}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        onPointerDown={(event) => {
          const surface = event.currentTarget;
          surface.setPointerCapture(event.pointerId);
          surface.dataset.x = String(event.clientX);
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          const last = Number(event.currentTarget.dataset.x ?? event.clientX);
          rig.current.yaw += (event.clientX - last) * 0.008;
          event.currentTarget.dataset.x = String(event.clientX);
        }}
      />

      {/* Mobile-Optimized Market Header Badge */}
      <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-[calc(100%-4.5rem)] sm:max-w-xs rounded-2xl bg-[#09111c]/90 p-2.5 sm:p-3 shadow-2xl backdrop-blur-md border border-[#e0b15a]/35">
        <div className="flex items-center gap-1.5">
          <span className="flex h-2 w-2 rounded-full bg-[#22c55e] animate-pulse" />
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.14em] text-[#e0b15a]">Open Daily Market</p>
        </div>
        <h2 className="mt-0.5 font-bold text-sm sm:text-base text-white truncate">{title}</h2>
        <p className="text-[10px] sm:text-xs text-[#94a3b8] truncate">Wetheral / MCC Axis · Owerri</p>
        <p className="hidden sm:block mt-1 text-[11px] text-[#cbd5e1] leading-relaxed">
          Mama Nkechi sells fresh yams and peppers. Alhaji has smoked catfish, and Madam Blessing displays luxury Ankara.
        </p>
      </div>

      {/* Toast Alert */}
      {toast ? (
        <div className="pointer-events-none absolute inset-x-3 top-16 sm:top-20 z-40 mx-auto max-w-sm animate-bounce rounded-2xl bg-[#061826]/95 border-2 border-[#22c55e] p-2.5 sm:p-3 text-center shadow-2xl backdrop-blur-md">
          <p className="text-xs sm:text-sm font-bold text-[#4ade80]">{toast}</p>
        </div>
      ) : null}

      {/* Mobile-First Collapsible Market Stalls & Shopping Panel */}
      <div className="absolute left-3 top-24 sm:top-28 z-30 w-[calc(100%-1.5rem)] sm:w-80 max-h-[50vh] sm:max-h-[calc(100%-8rem)] flex flex-col rounded-2xl bg-[#09111c]/95 border border-[#e0b15a]/35 shadow-2xl backdrop-blur-xl transition-all">
        {/* Toggle Bar */}
        <div className="flex items-center justify-between p-2.5 sm:p-3 border-b border-white/10">
          <div className="min-w-0 pr-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#e0b15a]">Market Stalls &amp; Goods</p>
            <p className="text-[11px] text-[#cbd5e1] truncate">
              {panelOpen ? "Tap item to purchase" : `Bag: ${basketCount} items · Tap to open`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPanelOpen(!panelOpen)}
            className="shrink-0 rounded-lg bg-[#e0b15a]/20 border border-[#e0b15a]/40 px-2.5 py-1 text-[11px] font-bold text-[#e0b15a] hover:bg-[#e0b15a]/30 transition-colors"
          >
            {panelOpen ? "Hide ▴" : "Browse ▾"}
          </button>
        </div>

        {panelOpen ? (
          <>
            {/* Quick Actions: Bargain & Cold Drinks */}
            <div className="p-2 border-b border-white/10 flex gap-1.5">
              <button
                type="button"
                onClick={() => showToast("🗣️ Mama Nkechi laughs: 'Ah fine boy, original Benue yam be this! I dash you one pepper!'")}
                className="flex-1 rounded-xl bg-white/10 py-1.5 px-2 text-[10px] sm:text-xs font-bold text-white hover:bg-white/20 transition-all active:scale-95 text-center"
              >
                🗣️ Bargain Price
              </button>
              <button
                type="button"
                onClick={() => showToast("🥤 Chilled Maltina & Pure Water enjoyed! Market heat quenched · −₦200")}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#0284c7]/20 to-[#0ea5e9]/10 border border-[#38bdf8]/40 py-1.5 px-2 text-[10px] sm:text-xs font-bold text-[#38bdf8] hover:bg-[#0284c7]/30 transition-all active:scale-95 text-center"
              >
                🥤 Cold Water · ₦200
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="p-2 pb-1 flex gap-1 overflow-x-auto no-scrollbar">
              {(["all", "Foodstuff", "Fish & Meat", "Fabric", "Provisions"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold transition-all ${
                    activeCategory === cat
                      ? "bg-[#e0b15a] text-[#09111c] shadow"
                      : "bg-white/5 text-[#cbd5e1] hover:bg-white/10"
                  }`}
                >
                  {cat === "all" ? "All" : cat}
                </button>
              ))}
            </div>

            {/* Scrollable Item List */}
            <div className="p-2 overflow-y-auto space-y-1.5 max-h-[34vh] sm:max-h-[46vh]">
              {displayedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl bg-white/5 p-2 hover:bg-white/10 transition-colors border border-white/5 gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{item.emoji}</span>
                      <span className="truncate text-xs font-bold text-white">{item.name}</span>
                    </div>
                    <p className="text-[10px] text-[#94a3b8] truncate">{item.stall}</p>
                    <p className="text-xs font-extrabold text-[#e0b15a] mt-0.5">{naira(item.price)}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleBuyItem(item)}
                    className="shrink-0 rounded-lg bg-[#e0b15a] px-2.5 py-1 text-[11px] font-bold text-[#09111c] hover:bg-[#f2c14e] active:scale-95 shadow transition-all"
                  >
                    Buy 🛒
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {/* Mobile-Friendly Camera Presets (Bottom Center) */}
      <div className="absolute inset-x-2 sm:inset-x-3 bottom-3 z-30 mx-auto flex max-w-sm sm:max-w-md items-center justify-center gap-1 rounded-2xl bg-[#09111c]/90 border border-white/10 p-1 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setViewPreset("player")}
          className="flex-1 rounded-xl py-1 text-[10px] sm:text-[11px] font-bold text-[#cbd5e1] hover:bg-white/10 transition-all active:scale-95 text-center"
        >
          🛒 My Cart
        </button>
        <button
          type="button"
          onClick={() => setViewPreset("food")}
          className="flex-1 rounded-xl py-1 text-[10px] sm:text-[11px] font-bold text-[#cbd5e1] hover:bg-white/10 transition-all active:scale-95 text-center"
        >
          🍠 Yams &amp; Fish
        </button>
        <button
          type="button"
          onClick={() => setViewPreset("overview")}
          className="flex-1 rounded-xl py-1 text-[10px] sm:text-[11px] font-bold text-[#e0b15a] bg-white/10 transition-all active:scale-95 text-center"
        >
          🏪 Stalls
        </button>
        <button
          type="button"
          onClick={() => setViewPreset("topdown")}
          className="flex-1 rounded-xl py-1 text-[10px] sm:text-[11px] font-bold text-[#cbd5e1] hover:bg-white/10 transition-all active:scale-95 text-center"
        >
          🦅 Top-Down
        </button>
      </div>

      {/* Compact Zoom & Orbit Controls (Top-Right) */}
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
