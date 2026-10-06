"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { LookId } from "@/lib/game/types";
import { createRealisticHuman } from "@/lib/game/humanModel";
import { naira } from "@/lib/game/format";
import { attachSceneCameraControls } from "./sceneCameraControls";

export interface CarDeal {
  id: string;
  name: string;
  category: "SUV" | "Sedan" | "Luxury Crossover" | "Sports Coupe";
  price: number;
  speed: string;
  flexFactor: string;
  defaultColor: number;
  desc: string;
  emoji: string;
}

export const CAR_CATALOG: CarDeal[] = [
  {
    id: "g-wagon",
    name: "Mercedes-Benz G63 AMG (G-Wagon)",
    category: "SUV",
    price: 3200000,
    speed: "240 km/h · Twin Turbo V8",
    flexFactor: "⭐⭐⭐⭐⭐ Top Big Man of Imo",
    defaultColor: 0x18181b, // Obsidian Black
    desc: "The ultimate status symbol on Wetheral Road and Port Harcourt Road. Commanding presence with roaring dual side exhausts.",
    emoji: "🚙",
  },
  {
    id: "lexus-rx",
    name: "Lexus RX350 Luxury Crossover",
    category: "Luxury Crossover",
    price: 1650000,
    speed: "210 km/h · V6 AWD",
    flexFactor: "⭐⭐⭐⭐ Clean Owerri Big Boy",
    defaultColor: 0xf8fafc, // Pearl White
    desc: "Smooth luxury ride, premium sound system, perfect for navigating New Owerri estates and airport runs.",
    emoji: "🚗",
  },
  {
    id: "camry-v6",
    name: "Toyota Camry XSE Sports Edition",
    category: "Sedan",
    price: 950000,
    speed: "200 km/h · 3.5L V6",
    flexFactor: "⭐⭐⭐ Reliable Daily Hustle",
    defaultColor: 0x94a3b8, // Metallic Silver
    desc: "Unbreakable engine, cheap parts, fast acceleration, and cold AC. Owerri daily commuter favourite.",
    emoji: "🚘",
  },
  {
    id: "sports-coupe",
    name: "Velocity GT Sports Coupe",
    category: "Sports Coupe",
    price: 2400000,
    speed: "290 km/h · 4.0L Turbo",
    flexFactor: "⭐⭐⭐⭐⭐ Nightlife Club King",
    defaultColor: 0xdc2626, // Crimson Red
    desc: "Low-slung race engineered body, aggressive front splitter, pops and bangs outside Cartel Lifestyle club.",
    emoji: "🏎️",
  },
];

// Helper to build realistic 3D detailed car models with wheels, rims, lights, glass
function buildDetailedCarMesh(car: CarDeal, bodyColor?: number): THREE.Group {
  const group = new THREE.Group();
  const color = bodyColor ?? car.defaultColor;

  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.18,
    metalness: 0.82,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.05,
    metalness: 0.95,
  });
  const blackTrimMat = new THREE.MeshLambertMaterial({ color: 0x111827 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
  const wheelRubberMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 });
  const headLightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  const box = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  if (car.category === "SUV") {
    // ── G-WAGON BOX CHASSIS ──
    box(1.9, 0.72, 4.2, bodyMat, 0, 0.76, 0); // Lower body
    box(1.82, 0.78, 2.7, bodyMat, 0, 1.45, -0.35); // Cabin / Roof box
    box(1.78, 0.08, 2.76, blackTrimMat, 0, 1.88, -0.35); // Roof rails

    // Windows
    box(1.84, 0.52, 0.06, glassMat, 0, 1.42, 1.01); // Windshield
    box(1.84, 0.52, 0.06, glassMat, 0, 1.42, -1.71); // Rear window
    box(0.06, 0.48, 2.4, glassMat, -0.92, 1.42, -0.35); // Left windows
    box(0.06, 0.48, 2.4, glassMat, 0.92, 1.42, -0.35);  // Right windows

    // Front Grille & Bullbar
    box(1.5, 0.45, 0.1, blackTrimMat, 0, 0.72, 2.12);
    box(0.3, 0.3, 0.12, chromeMat, 0, 0.72, 2.13); // Mercedes star
    box(1.7, 0.35, 0.15, blackTrimMat, 0, 0.48, 2.2); // Front bumper

    // Headlights (Round G-Wagon style)
    const hlGeom = new THREE.CylinderGeometry(0.16, 0.16, 0.08, 16);
    hlGeom.rotateX(Math.PI / 2);
    const hlL = new THREE.Mesh(hlGeom, headLightMat);
    hlL.position.set(-0.68, 0.76, 2.12);
    const hlR = new THREE.Mesh(hlGeom, headLightMat);
    hlR.position.set(0.68, 0.76, 2.12);
    group.add(hlL, hlR);

    // Rear Spare Tire Cover
    const spareGeom = new THREE.CylinderGeometry(0.44, 0.44, 0.28, 18);
    spareGeom.rotateX(Math.PI / 2);
    const spare = new THREE.Mesh(spareGeom, chromeMat);
    spare.position.set(0, 0.95, -2.2);
    group.add(spare);
    box(0.8, 0.12, 0.3, chromeMat, 0, 0.95, -2.22);

    // Tail lights
    box(0.32, 0.14, 0.05, tailLightMat, -0.72, 0.65, -2.12);
    box(0.32, 0.14, 0.05, tailLightMat, 0.72, 0.65, -2.12);
  } else if (car.category === "Sports Coupe") {
    // ── VELOCITY GT SPORTS COUPE ──
    box(1.95, 0.45, 4.3, bodyMat, 0, 0.42, 0); // Low sleek chassis
    box(1.65, 0.46, 2.1, bodyMat, 0, 0.82, -0.2); // Fastback cabin
    box(1.98, 0.12, 0.45, blackTrimMat, 0, 0.22, 2.15); // Carbon front splitter

    // Aerodynamic Rear Wing / Spoiler
    box(1.8, 0.06, 0.35, blackTrimMat, 0, 0.95, -2.05);
    box(0.08, 0.32, 0.08, blackTrimMat, -0.65, 0.75, -2.05);
    box(0.08, 0.32, 0.08, blackTrimMat, 0.65, 0.75, -2.05);

    // Slanted aerodynamic windshield
    const wsMesh = box(1.68, 0.48, 0.06, glassMat, 0, 0.78, 0.88);
    wsMesh.rotation.x = -0.38;

    // Slanted fastback rear glass
    const rgMesh = box(1.68, 0.48, 0.06, glassMat, 0, 0.76, -1.25);
    rgMesh.rotation.x = 0.45;

    // Aggressive LED headlights
    box(0.42, 0.1, 0.08, headLightMat, -0.72, 0.48, 2.14);
    box(0.42, 0.1, 0.08, headLightMat, 0.72, 0.48, 2.14);

    // Dual exhaust tips
    box(0.12, 0.12, 0.25, chromeMat, -0.55, 0.26, -2.2);
    box(0.12, 0.12, 0.25, chromeMat, 0.55, 0.26, -2.2);
    box(0.35, 0.08, 0.05, tailLightMat, -0.7, 0.55, -2.16);
    box(0.35, 0.08, 0.05, tailLightMat, 0.7, 0.55, -2.16);
  } else {
    // ── SEDAN & LUXURY CROSSOVER ──
    const isCrossover = car.category === "Luxury Crossover";
    const baseH = isCrossover ? 0.62 : 0.5;
    const baseY = isCrossover ? 0.6 : 0.5;

    box(1.85, baseH, 4.2, bodyMat, 0, baseY, 0); // Main body
    box(1.62, 0.58, 2.4, bodyMat, 0, baseY + 0.54, -0.15); // Cabin

    // Windshield & Rear glass
    const ws = box(1.64, 0.52, 0.06, glassMat, 0, baseY + 0.5, 1.05);
    ws.rotation.x = -0.32;
    const rg = box(1.64, 0.52, 0.06, glassMat, 0, baseY + 0.5, -1.35);
    rg.rotation.x = 0.32;

    // Side windows
    box(0.06, 0.44, 2.1, glassMat, -0.82, baseY + 0.52, -0.15);
    box(0.06, 0.44, 2.1, glassMat, 0.82, baseY + 0.52, -0.15);

    // Chrome Grille & Headlights
    box(1.2, 0.32, 0.08, chromeMat, 0, baseY + 0.05, 2.12);
    box(0.38, 0.14, 0.06, headLightMat, -0.68, baseY + 0.12, 2.12);
    box(0.38, 0.14, 0.06, headLightMat, 0.68, baseY + 0.12, 2.12);

    // Tail lights
    box(0.42, 0.12, 0.06, tailLightMat, -0.68, baseY + 0.15, -2.12);
    box(0.42, 0.12, 0.06, tailLightMat, 0.68, baseY + 0.15, -2.12);
  }

  // ── 4 DETAILED WHEELS WITH ALLOY RIMS ──
  const wheelRadius = car.category === "SUV" ? 0.42 : 0.36;
  const wheelWidth = 0.28;
  const wheelY = wheelRadius;
  const wheelZFront = 1.35;
  const wheelZRear = -1.35;
  const wheelX = 0.94;

  const makeWheel = (wx: number, wz: number) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(wx, wheelY, wz);

    // Tire rubber
    const tireGeom = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 20);
    tireGeom.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeom, wheelRubberMat);
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Chrome / Alloy Rim
    const rimGeom = new THREE.CylinderGeometry(wheelRadius * 0.68, wheelRadius * 0.68, wheelWidth + 0.02, 16);
    rimGeom.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeom, rimMat);
    wheelGroup.add(rim);

    // Brake disc inside rim
    const discGeom = new THREE.CylinderGeometry(wheelRadius * 0.5, wheelRadius * 0.5, 0.04, 12);
    discGeom.rotateZ(Math.PI / 2);
    const disc = new THREE.Mesh(discGeom, chromeMat);
    wheelGroup.add(disc);

    group.add(wheelGroup);
  };

  makeWheel(-wheelX, wheelZFront);
  makeWheel(wheelX, wheelZFront);
  makeWheel(-wheelX, wheelZRear);
  makeWheel(wheelX, wheelZRear);

  return group;
}

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
  onBuyCarSuccess,
}: {
  look?: LookId;
  username?: string;
  onBuyCarSuccess?: (carName: string, price: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const rig = useRef({ yaw: 0.35, zoom: 1.1 });
  const turntableRef = useRef<THREE.Group | null>(null);

  const [selectedCar, setSelectedCar] = useState<CarDeal>(CAR_CATALOG[0]);
  const [garage, setGarage] = useState<string[]>([]);
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
    root.appendChild(renderer.domElement);

    const showroom = new THREE.Group();
    scene.add(showroom);

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

    const featuredCarMesh = buildDetailedCarMesh(selectedCar);
    turntable.add(featuredCarMesh);

    // ─────────────────────────────────────────────────────────────
    // 2. SHOWROOM DISPLAY LOT CARS (Surrounding Rows)
    // ─────────────────────────────────────────────────────────────
    // Display Car Left: G-Wagon (Obsidian Black)
    if (selectedCar.id !== "g-wagon") {
      const gWagonLot = buildDetailedCarMesh(CAR_CATALOG[0]);
      gWagonLot.position.set(-5.2, 0, -2.5);
      gWagonLot.rotation.y = 0.35;
      showroom.add(gWagonLot);
    }

    // Display Car Right: Velocity GT Sports Coupe (Red)
    if (selectedCar.id !== "sports-coupe") {
      const gtLot = buildDetailedCarMesh(CAR_CATALOG[3]);
      gtLot.position.set(5.2, 0, -2.5);
      gtLot.rotation.y = -0.35;
      showroom.add(gtLot);
    }

    // Display Car Front-Left: Lexus RX (White)
    if (selectedCar.id !== "lexus-rx") {
      const lexusLot = buildDetailedCarMesh(CAR_CATALOG[1]);
      lexusLot.position.set(-5.4, 0, 3.2);
      lexusLot.rotation.y = 0.15;
      showroom.add(lexusLot);
    }

    // Display Car Front-Right: Camry (Silver)
    if (selectedCar.id !== "camry-v6") {
      const camryLot = buildDetailedCarMesh(CAR_CATALOG[2]);
      camryLot.position.set(5.4, 0, 3.2);
      camryLot.rotation.y = -0.15;
      showroom.add(camryLot);
    }

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

    // ─────────────────────────────────────────────────────────────
    // ELEVATED ISOMETRIC CAMERA & RENDER LOOP
    // ─────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(35, root.clientWidth / root.clientHeight, 0.1, 100);
    const target = new THREE.Vector3(0, 0.9, 0);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);

      // Auto-spin turntable slightly
      if (turntableRef.current) {
        turntableRef.current.rotation.y += isTestDriving ? 0.04 : 0.005;
      }

      const r = 16.0 / rig.current.zoom;
      const phi = 0.64; // High angle elevated view
      const theta = rig.current.yaw;

      camera.position.set(
        target.x + r * Math.sin(phi) * Math.sin(theta),
        target.y + r * Math.cos(phi) + 2.2,
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
  }, [look, selectedCar, isTestDriving]);

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
    setGarage((prev) => [...prev, selectedCar.id]);
    showToast(`🎉 Congratulations! You purchased the ${selectedCar.name} for ${naira(selectedCar.price)}! Keys handed over.`);
    if (onBuyCarSuccess) {
      onBuyCarSuccess(selectedCar.name, selectedCar.price);
    }
  };

  const isOwned = garage.includes(selectedCar.id);

  return (
    <div className="absolute inset-0 bg-[#060911] text-[#f8fafc] overflow-hidden">
      {/* 3D WebGL Canvas */}
      <div
        ref={host}
        className="absolute inset-0 touch-none"
        onPointerDown={(event) => {
          const surface = event.currentTarget;
          surface.setPointerCapture(event.pointerId);
          surface.dataset.x = String(event.clientX);
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          const last = Number(event.currentTarget.dataset.x ?? event.clientX);
          rig.current.yaw += (event.clientX - last) * 0.007;
          event.currentTarget.dataset.x = String(event.clientX);
        }}
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
      <div className="absolute left-3 top-20 z-20 flex flex-col gap-1.5 max-w-[190px]">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] px-1">
          Select Vehicle:
        </span>
        {CAR_CATALOG.map((car) => {
          const active = selectedCar.id === car.id;
          const ownedThis = garage.includes(car.id);
          return (
            <button
              key={car.id}
              type="button"
              onClick={() => setSelectedCar(car)}
              className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-bold border transition-all active:scale-95 shadow-lg backdrop-blur-md ${
                active
                  ? "bg-[#e0b15a] text-[#0f172a] border-[#fde047] scale-[1.02]"
                  : "bg-[#0f172a]/90 text-white border-white/10 hover:bg-[#1e293b]"
              }`}
            >
              <div className="truncate pr-1">
                <div className="flex items-center gap-1">
                  <span>{car.emoji}</span>
                  <span className="truncate">{car.name.split(" ")[0]} {car.name.split(" ")[1]}</span>
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
      <div className="absolute inset-x-3 bottom-4 z-30 mx-auto max-w-lg rounded-3xl bg-[#09111c]/95 border-2 border-[#e0b15a]/40 p-3.5 shadow-2xl backdrop-blur-2xl text-white">
        <div className="flex items-start justify-between">
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
            onClick={handleBuyCurrentCar}
            className="flex-1 rounded-xl bg-[#e0b15a] py-2.5 text-xs font-extrabold text-[#0f172a] hover:bg-[#f2c14e] transition-all shadow-lg active:scale-95"
          >
            {isOwned ? "Buy Another One 💳" : `Purchase Vehicle · ${naira(selectedCar.price)} 💳`}
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
