"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { makeRenderer } from "@/lib/game/renderQuality";
import { createRealisticHuman, weakGpu } from "@/lib/game/humanModel";
import type { LookId } from "@/lib/game/types";
import { paintCabinDoor } from "@/components/game/airlinerLivery";
import { buildOwerriAirliner } from "@/components/game/owerriAirliner";
import { attachSceneCameraControls } from "@/components/game/sceneCameraControls";

const FLIGHT_MS = 22000;

function paintCity(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#05080f";
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.fillStyle = "#0a1220";
    for (let y = 0; y < 1024; y += 48) ctx.fillRect(0, y, 1024, 2);
    for (let x = 0; x < 1024; x += 56) ctx.fillRect(x, 0, 2, 1024);
    for (let i = 0; i < 2800; i += 1) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const warm = Math.random();
      ctx.fillStyle = warm > 0.82 ? "#f2c14e" : warm > 0.55 ? "#ffe9b8" : warm > 0.22 ? "#9fd0ea" : "#c4552a";
      const s = warm > 0.9 ? 3 : 1.4;
      ctx.fillRect(x, y, s, s);
    }
    for (let b = 0; b < 40; b += 1) {
      const bx = 40 + Math.random() * 940;
      const by = 40 + Math.random() * 940;
      ctx.fillStyle = "#141c2a";
      ctx.fillRect(bx, by, 18 + Math.random() * 28, 22 + Math.random() * 40);
      ctx.fillStyle = "#e0b15a";
      for (let wy = 0; wy < 5; wy += 1) {
        for (let wx = 0; wx < 4; wx += 1) {
          if (Math.random() > 0.35) ctx.fillRect(bx + 3 + wx * 6, by + 4 + wy * 8, 3, 4);
        }
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function paintCloud(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, 512, 256);
    for (let i = 0; i < 18; i += 1) {
      const x = 40 + Math.random() * 430;
      const y = 40 + Math.random() * 170;
      const r = 28 + Math.random() * 70;
      const g = ctx.createRadialGradient(x, y, 4, x, y, r);
      g.addColorStop(0, "rgba(255,255,255,0.55)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function cloth(color: number) {
  return new THREE.MeshLambertMaterial({ color });
}

function block(w: number, h: number, d: number, color: number, x = 0, y = 0, z = 0, mat?: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat ?? cloth(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

function seatMesh() {
  const seat = new THREE.Group();
  const leather = cloth(0x1a3d52);
  const dark = cloth(0x101820);
  const metal = new THREE.MeshLambertMaterial({ color: 0x8a93a0 });
  seat.add(block(0.5, 0.1, 0.52, 0x1a3d52, 0, 0.5, 0.02, leather));
  seat.add(block(0.5, 0.58, 0.1, 0x245c78, 0, 0.84, -0.22, leather));
  seat.add(block(0.42, 0.16, 0.08, 0x17394c, 0, 1.16, -0.23, leather));
  seat.add(block(0.05, 0.28, 0.42, 0x101820, -0.24, 0.62, 0, dark));
  seat.add(block(0.05, 0.28, 0.42, 0x101820, 0.24, 0.62, 0, dark));
  seat.add(block(0.46, 0.02, 0.08, 0x0b1220, 0, 0.78, 0.18, dark));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.14), new THREE.MeshBasicMaterial({ color: 0x0e1c28 }));
  screen.position.set(0, 0.92, -0.165);
  seat.add(screen);
  for (const x of [-0.16, 0.16]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.46, 8), metal);
    leg.position.set(x, 0.23, -0.08);
    seat.add(leg);
  }
  return seat;
}

function buildCabin(lite: boolean, doorTex: THREE.Texture) {
  const cabin = new THREE.Group();
  const carpet = cloth(0x3a2a22);
  const aisle = cloth(0x5a4638);
  const wall = cloth(0xd8dee6);
  const cream = cloth(0xe8edf2);
  const binMat = cloth(0xc5ccd6);
  const gold = cloth(0xc4a15a);

  cabin.add(block(3.35, 0.06, 14.4, 0x3a2a22, 0, 0.03, 0, carpet));
  cabin.add(block(0.62, 0.02, 14.2, 0x5a4638, 0, 0.065, 0, aisle));
  cabin.add(block(0.08, 0.01, 14.2, 0xc4a15a, 0, 0.07, 0, gold));
  cabin.add(block(3.35, 0.05, 14.4, 0xe8edf2, 0, 2.22, 0, cream));
  cabin.add(block(0.1, 2.16, 14.4, 0xd8dee6, -1.66, 1.1, 0, wall));
  cabin.add(block(0.1, 2.16, 14.4, 0xd8dee6, 1.66, 1.1, 0, wall));

  cabin.add(block(0.78, 0.28, 13.2, 0xc5ccd6, -1.12, 2.02, 0.1, binMat));
  cabin.add(block(0.78, 0.28, 13.2, 0xc5ccd6, 1.12, 2.02, 0.1, binMat));
  cabin.add(block(0.72, 0.04, 13.1, 0xb7bfc9, -1.12, 1.86, 0.1, binMat));
  cabin.add(block(0.72, 0.04, 13.1, 0xb7bfc9, 1.12, 1.86, 0.1, binMat));

  const glass = new THREE.MeshLambertMaterial({
    color: 0x7eb4d8,
    emissive: 0x3a6280,
    emissiveIntensity: 0.55,
    transparent: true,
    opacity: 0.78,
  });
  const rimMat = cloth(0x9aa4b0);
  for (let i = 0; i < 10; i += 1) {
    const z = 5.6 - i * 1.22;
    for (const side of [-1, 1]) {
      const rim = new THREE.Mesh(new THREE.CircleGeometry(0.2, 16), rimMat);
      rim.scale.set(1, 1.28, 1);
      rim.position.set(side * 1.605, 1.32, z);
      rim.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      cabin.add(rim);
      const pane = new THREE.Mesh(new THREE.CircleGeometry(0.155, 16), glass);
      pane.scale.set(1, 1.28, 1);
      pane.position.set(side * 1.58, 1.32, z);
      pane.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      cabin.add(pane);
      const reading = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 8), cloth(0xf4e4b8));
      reading.position.set(side * 0.95, 1.84, z);
      cabin.add(reading);
    }
    const vent = block(1.8, 0.03, 0.18, 0xb0b8c2, 0, 2.12, z, cream);
    cabin.add(vent);
  }

  const bulk = cloth(0x1f6b45);
  cabin.add(block(3.2, 2.05, 0.12, 0x1f6b45, 0, 1.05, 6.95, bulk));
  cabin.add(block(0.62, 1.48, 0.05, 0x2a3340, 0, 0.92, 6.88, cloth(0x2a3340)));
  const crew = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.12), new THREE.MeshBasicMaterial({ color: 0xe0b15a }));
  crew.position.set(0, 1.52, 6.85);
  cabin.add(crew);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.18), new THREE.MeshBasicMaterial({ color: 0xe0b15a }));
  sign.position.set(0, 1.85, 6.88);
  cabin.add(sign);
  cabin.add(block(1.1, 0.7, 0.45, 0xcfd6de, -1.05, 0.4, 6.55, cloth(0xcfd6de)));
  cabin.add(block(1.1, 0.7, 0.45, 0xcfd6de, 1.05, 0.4, 6.55, cloth(0xcfd6de)));

  cabin.add(block(3.2, 2.05, 0.1, 0x2a3340, 0, 1.05, -6.95, cloth(0x2a3340)));

  for (const [x, z, yaw] of [
    [-1.62, 6.05, Math.PI / 2],
    [1.62, 6.05, -Math.PI / 2],
    [-1.62, -6.05, Math.PI / 2],
    [1.62, -6.05, -Math.PI / 2],
  ] as const) {
    const frame = block(0.06, 1.78, 0.92, 0x1a2430, x, 0.98, z);
    cabin.add(frame);
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 1.62), new THREE.MeshBasicMaterial({ map: doorTex }));
    leaf.position.set(x + (x > 0 ? -0.04 : 0.04), 0.98, z);
    leaf.rotation.y = yaw;
    cabin.add(leaf);
  }

  const looks: LookId[] = ["ada", "chidi", "ngozi", "emeka", "zara", "ibe"];
  const shirts = [0xc4552a, 0x245c78, 0x1f6b45, 0x7a3e6d, 0xd4a017, 0x1e3a5f];
  for (let row = 0; row < 8; row += 1) {
    const z = 4.7 - row * 1.28;
    for (const x of [-1.14, -0.58, 0.58, 1.14]) {
      const chair = seatMesh();
      chair.position.set(x, 0, z);
      cabin.add(chair);
      const playerSeat = row === 2 && x === -1.14;
      if (playerSeat) continue;
      if (lite && (row > 4 || (row + Math.abs(x)) % 2 === 0)) continue;
      if (!lite && (row + Math.abs(x * 10)) % 4 === 0) continue;
      const person = createRealisticHuman({
        lookId: looks[(row * 3 + Math.abs(x * 10)) % looks.length],
        seated: true,
        scale: 0.78,
        lite,
        customShirt: shirts[(row + Math.round(x + 2)) % shirts.length],
      });
      person.position.set(x, 0.12, z + 0.04);
      person.rotation.y = 0;
      cabin.add(person);
    }
  }

  const cabinLight = new THREE.PointLight(0xffe4c4, 1.15, 14);
  cabinLight.position.set(0, 1.75, 1.2);
  cabin.add(cabinLight);
  if (!lite) {
    const cabinFill = new THREE.PointLight(0xd7e6f5, 0.45, 16);
    cabinFill.position.set(0, 1.6, -3);
    cabin.add(cabinFill);
  }
  return cabin;
}

export function FlightScene({
  city,
  look,
  onArrive,
}: {
  city: string;
  look: LookId;
  onArrive: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const lookRig = useRef({ yaw: 0, pitch: 0, zoom: 1 });
  const view = useRef<"inside" | "outside">("inside");
  const [seat, setSeat] = useState<"inside" | "outside">("inside");
  const finished = useRef(false);

  function arrive() {
    if (finished.current) return;
    finished.current = true;
    onArrive();
  }

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const lite = weakGpu();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = makeRenderer({ alpha: false });
      renderer.setSize(root.clientWidth || 1, root.clientHeight || 1);
      if (!lite) {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.18;
      }
      root.appendChild(renderer.domElement);
    } catch {
      arrive();
      return;
    }
    const onLost = (event: Event) => {
      event.preventDefault();
      arrive();
    };
    renderer.domElement.addEventListener("webglcontextlost", onLost);
    try {

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#050814");
    scene.fog = new THREE.Fog("#070b16", 50, 260);
    scene.add(new THREE.HemisphereLight(0xb7ccec, 0x1a140c, 0.72));
    const moon = new THREE.DirectionalLight(0xe8f1ff, 1.35);
    moon.position.set(-24, 38, 16);
    scene.add(moon);
    const cityGlow = new THREE.DirectionalLight(0xe0b15a, 0.38);
    cityGlow.position.set(6, -18, 8);
    scene.add(cityGlow);
    let envMap: THREE.Texture | null = null;
    if (!lite) {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envScene = new THREE.Scene();
      envScene.add(new THREE.HemisphereLight(0xc5d8f0, 0x2a2018, 2.2));
      envMap = pmrem.fromScene(envScene, 0.05).texture;
      scene.environment = envMap;
      scene.environmentIntensity = 0.85;
      pmrem.dispose();
    }

    const cityMap = paintCity();
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshBasicMaterial({ map: cityMap }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -28;
    scene.add(ground);

    for (let i = 0; i < (lite ? 18 : 70); i += 1) {
      const h = 1.2 + Math.random() * 6;
      const tower = new THREE.Mesh(
        new THREE.BoxGeometry(1.4 + Math.random() * 2.2, h, 1.4 + Math.random() * 2.2),
        new THREE.MeshLambertMaterial({ color: 0x121826, emissive: 0x3a2a10, emissiveIntensity: 0.18 }),
      );
      tower.position.set((Math.random() - 0.5) * 220, -28 + h / 2, (Math.random() - 0.5) * 220 - 40);
      scene.add(tower);
    }

    const cloudTex = paintCloud();
    const clouds: THREE.Mesh[] = [];
    for (let i = 0; i < (lite ? 6 : 16); i += 1) {
      const cloud = new THREE.Mesh(
        new THREE.PlaneGeometry(28 + (i % 5) * 8, 12 + (i % 3) * 4),
        new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide }),
      );
      cloud.position.set((i % 4) * 38 - 60, -6 + (i % 3) * 5, -20 - i * 14);
      cloud.rotation.x = -0.55;
      scene.add(cloud);
      clouds.push(cloud);
    }

    const stars = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(Array.from({ length: lite ? 80 : 240 }, () => new THREE.Vector3((Math.random() - 0.5) * 400, 20 + Math.random() * 80, (Math.random() - 0.5) * 400))),
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.35 }),
    );
    scene.add(stars);

    const doorTex = paintCabinDoor();
    let alive = true;
    const flight = new THREE.Group();
    scene.add(flight);
    const exterior = new THREE.Group();
    flight.add(exterior);
    exterior.add(buildOwerriAirliner());

    lookRig.current = { yaw: 0.2, pitch: 0, zoom: 0.62 };
    const cabin = buildCabin(lite, doorTex);
    const you = createRealisticHuman({ lookId: look, seated: true, scale: 0.8, lite });
    you.position.set(-1.14, 0.12, 4.7 - 2 * 1.28);
    you.rotation.y = 0;
    cabin.add(you);

    const attendant = createRealisticHuman({
      lookId: "ngozi",
      seated: false,
      scale: 0.86,
      lite,
      customShirt: 0x1f6b45,
      customPants: 0x17241e,
    });
    attendant.position.set(0, 0.02, 3.2);
    cabin.add(attendant);
    flight.add(cabin);
    cabin.position.set(0, 0.35, 0.4);

    const camera = new THREE.PerspectiveCamera(62, 1, 0.08, 400);
    scene.add(camera);
    const fit = () => {
      renderer.setSize(root.clientWidth || 1, root.clientHeight || 1);
      camera.aspect = (root.clientWidth || 1) / Math.max(1, root.clientHeight);
      camera.updateProjectionMatrix();
    };
    fit();
    const detachControls = attachSceneCameraControls(root, lookRig, {
      minZoom: 0.28,
      maxZoom: 3.2,
      minPitch: -0.5,
      maxPitch: 0.55,
      zoomSpeed: 0.28,
    });

    let frame = 0;
    const started = performance.now();
    const camPos = new THREE.Vector3();
    let camReady = false;
    const loop = () => {
      if (!alive) return;
      try {
      const now = performance.now();
      const t = Math.min(1, (now - started) / FLIGHT_MS);
      const z = t * 140;
      flight.position.set(Math.sin(t * 6) * 1.4, 8 + Math.sin(t * 10) * 0.35, z);
      flight.rotation.z = Math.sin(t * 6) * 0.04;
      flight.rotation.x = -0.04;
      cityMap.offset.y = t * 1.8;
      const strobe = exterior.children[0]?.userData.strobe as THREE.PointLight | undefined;
      if (strobe) strobe.intensity = Math.sin(now / 90) > 0.55 ? 3.2 : 0;
      clouds.forEach((cloud, i) => {
        cloud.position.z = ((-20 - i * 14 + t * 90) % 180) - 90;
        cloud.position.x += Math.sin(now / 1800 + i) * 0.01;
      });
      const lap = 6.4;
      const cycle = ((now / 1000) % (lap * 2)) / lap;
      const goingAft = cycle < 1;
      const u = goingAft ? cycle : cycle - 1;
      attendant.position.z = goingAft ? 5.1 - u * 10.4 : -5.3 + u * 10.4;
      attendant.rotation.y = goingAft ? Math.PI : 0;
      attendant.position.y = Math.abs(Math.sin(now / 180)) * 0.03;

      if (view.current === "inside") {
        cabin.visible = true;
        exterior.visible = false;
        flight.updateMatrixWorld(true);
        const yaw = lookRig.current.yaw;
        const pitch = lookRig.current.pitch ?? 0;
        const zoom = Math.min(3.2, Math.max(0.28, lookRig.current.zoom));
        const seatZ = 4.7 - 2 * 1.28;
        const dist = Math.min(6.4, 2.2 / zoom);
        const eye = new THREE.Vector3(-0.35 + Math.sin(yaw) * 0.7, 1.25 + Math.max(0, 1 - zoom) * 0.55, seatZ - dist);
        cabin.localToWorld(eye);
        camera.position.copy(eye);
        const gaze = new THREE.Vector3(-1.05, 0.92 + pitch * 0.9, seatZ + 0.15);
        cabin.localToWorld(gaze);
        camera.lookAt(gaze);
        camera.fov = 46;
        camera.updateProjectionMatrix();
        camReady = false;
      } else {
        cabin.visible = false;
        exterior.visible = true;
        const aspect = Math.max(0.35, camera.aspect || 0.6);
        const fov = aspect < 0.9 ? 54 : 40;
        const tanV = Math.tan((fov * Math.PI) / 360);
        const tanH = tanV * aspect;
        const dist = (13.5 / Math.min(tanV, tanH)) * 1.22;
        const yaw = 0.85 + Math.sin(now / 4200) * 0.12;
        const goal = flight.position.clone().add(new THREE.Vector3(Math.sin(yaw) * dist, dist * 0.22, -Math.cos(yaw) * dist * 0.42));
        if (!camReady) {
          camPos.copy(goal);
          camReady = true;
        } else {
          camPos.lerp(goal, 0.07);
        }
        camera.position.copy(camPos);
        camera.lookAt(flight.position.clone().add(new THREE.Vector3(0, 1.35, 0)));
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
      if (barRef.current) barRef.current.style.width = `${Math.round(t * 100)}%`;
      renderer.render(scene, camera);
      if (t >= 1) arrive();
      frame = window.requestAnimationFrame(loop);
      } catch {
        arrive();
      }
    };
    loop();
    const onResize = () => fit();
    window.addEventListener("resize", onResize);
    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      detachControls();
      renderer.domElement.removeEventListener("webglcontextlost", onLost);
      cityMap.dispose();
      cloudTex.dispose();
      doorTex.dispose();
      envMap?.dispose();
      renderer.dispose();
      if (root.contains(renderer.domElement)) root.removeChild(renderer.domElement);
    };
    } catch {
      renderer.domElement.removeEventListener("webglcontextlost", onLost);
      renderer.dispose();
      if (root.contains(renderer.domElement)) root.removeChild(renderer.domElement);
      arrive();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, look]);

  return createPortal(
    <div data-flight-scene className="fixed inset-0 z-[300] bg-[#050814]">
      <div ref={host} className="absolute inset-0 touch-none" />
      <div className="pointer-events-none absolute left-3 top-16 z-10 max-w-[14rem] rounded-2xl bg-[#0e1c16]/80 px-3 py-2 text-[#f6f1e6]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e0b15a]">Owerri Life Air · {city}</p>
        <p className="text-sm font-semibold">{seat === "inside" ? "You are in your seat" : "OWERRI LIFE on the fuselage"}</p>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/20">
          <div ref={barRef} className="h-full rounded-full bg-[#e0b15a]" style={{ width: "0%" }} />
        </div>
      </div>
      <div className="absolute left-2 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1">
        <button
          type="button"
          onClick={() => {
            view.current = "inside";
            setSeat("inside");
          }}
          className={`rounded-lg px-2 py-1 text-[10px] font-semibold sm:text-xs ${seat === "inside" ? "bg-[#e0b15a] text-[#1a140c]" : "bg-[#0e1c16]/80 text-white"}`}
        >
          Seat
        </button>
        <button
          type="button"
          onClick={() => {
            view.current = "outside";
            setSeat("outside");
          }}
          className={`rounded-lg px-2 py-1 text-[10px] font-semibold sm:text-xs ${seat === "outside" ? "bg-[#e0b15a] text-[#1a140c]" : "bg-[#0e1c16]/80 text-white"}`}
        >
          Outside
        </button>
        <button type="button" onClick={arrive} className="mt-1 rounded-lg bg-white px-2 py-1 text-[10px] font-semibold text-[#17241e] sm:text-xs">
          Skip
        </button>
      </div>
      {seat === "inside" ? (
        <div className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => {
              lookRig.current.zoom = Math.min(3.2, Math.max(0.28, lookRig.current.zoom * 1.22));
            }}
            className="grid h-8 w-8 place-items-center rounded-full bg-white text-base font-bold text-[#17241e] shadow-lg"
          >
            +
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => {
              lookRig.current.zoom = Math.min(3.2, Math.max(0.28, lookRig.current.zoom / 1.22));
            }}
            className="grid h-8 w-8 place-items-center rounded-full bg-white text-base font-bold text-[#17241e] shadow-lg"
          >
            −
          </button>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
