"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { createRealisticHuman } from "@/lib/game/humanModel";
import type { LookId } from "@/lib/game/types";

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

function paintLivery(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#f7fbfc";
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = "#1f6b45";
    ctx.fillRect(0, 0, 1024, 38);
    ctx.fillStyle = "#e0b15a";
    ctx.fillRect(0, 38, 1024, 10);
    ctx.fillStyle = "#1f6b45";
    ctx.fillRect(0, 218, 1024, 38);
    ctx.fillStyle = "#e0b15a";
    ctx.fillRect(0, 208, 1024, 10);
    ctx.fillStyle = "#17241e";
    ctx.font = "bold 72px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("OWERRI LIFE", 512, 128);
    ctx.font = "bold 22px sans-serif";
    ctx.fillStyle = "#1f6b45";
    ctx.fillText("QOW  ·  SAM MBAKWE", 512, 178);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.center.set(0.5, 0.5);
  tex.rotation = Math.PI / 2;
  return tex;
}

function block(w: number, h: number, d: number, color: number, x = 0, y = 0, z = 0, mat?: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat ?? new THREE.MeshLambertMaterial({ color }));
  mesh.position.set(x, y, z);
  return mesh;
}

function buildAirliner(livery: THREE.Texture) {
  const plane = new THREE.Group();
  const skin = new THREE.MeshLambertMaterial({ map: livery, color: 0xffffff });
  const white = new THREE.MeshLambertMaterial({ color: 0xf4efe4 });
  const green = new THREE.MeshLambertMaterial({ color: 0x1f6b45 });
  const dark = new THREE.MeshLambertMaterial({ color: 0x243038 });
  const fuse = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 16.4, 18, 1, true), skin);
  fuse.rotation.x = Math.PI / 2;
  fuse.position.y = 1.15;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(1.15, 3.2, 14), white);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 1.15, 9.6);
  const tailcone = new THREE.Mesh(new THREE.ConeGeometry(1.15, 2.4, 12), white);
  tailcone.rotation.x = -Math.PI / 2;
  tailcone.position.set(0, 1.15, -9.2);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.14, 3.4), white);
  wing.position.set(0, 0.85, -0.4);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.1, 2.2), green);
  fin.position.set(0, 3.1, -8.2);
  const stab = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.12, 1.3), white);
  stab.position.set(0, 2.2, -8.4);
  plane.add(fuse, nose, tailcone, wing, fin, stab);
  for (const side of [-3.6, 3.6]) {
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 2.2, 12), dark);
    engine.rotation.x = Math.PI / 2;
    engine.position.set(side, 0.42, 0.2);
    plane.add(engine);
  }
  const glow = new THREE.PointLight(0xfff1c8, 1.4, 18);
  glow.position.set(0, 0.4, 8.8);
  plane.add(glow);
  return plane;
}

function seatMesh() {
  const seat = new THREE.Group();
  seat.add(block(0.48, 0.08, 0.5, 0x1d4a66, 0, 0.42, 0));
  seat.add(block(0.48, 0.62, 0.08, 0x245c78, 0, 0.72, -0.22));
  seat.add(block(0.06, 0.22, 0.4, 0x17241e, -0.24, 0.52, 0));
  seat.add(block(0.06, 0.22, 0.4, 0x17241e, 0.24, 0.52, 0));
  return seat;
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
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(root.clientWidth || 1, root.clientHeight || 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    root.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#050814");
    scene.fog = new THREE.Fog("#070b16", 40, 220);
    scene.add(new THREE.HemisphereLight(0x9fb7e8, 0x0a1020, 0.55));
    const moon = new THREE.DirectionalLight(0xcfe4ff, 0.55);
    moon.position.set(-30, 40, 10);
    scene.add(moon);

    const cityMap = paintCity();
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshBasicMaterial({ map: cityMap }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -28;
    scene.add(ground);

    for (let i = 0; i < 70; i += 1) {
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
    for (let i = 0; i < 16; i += 1) {
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
      new THREE.BufferGeometry().setFromPoints(Array.from({ length: 240 }, () => new THREE.Vector3((Math.random() - 0.5) * 400, 20 + Math.random() * 80, (Math.random() - 0.5) * 400))),
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.35 }),
    );
    scene.add(stars);

    const livery = paintLivery();
    const airliner = buildAirliner(livery);
    scene.add(airliner);

    const cabin = new THREE.Group();
    cabin.add(block(3.2, 0.08, 14, 0x2a3340, 0, 0, 0));
    cabin.add(block(3.2, 0.06, 14, 0x1a222c, 0, 2.15, 0));
    cabin.add(block(0.08, 2.1, 14, 0xcfd6de, -1.58, 1.05, 0));
    cabin.add(block(0.08, 2.1, 14, 0xcfd6de, 1.58, 1.05, 0));
    for (let i = 0; i < 9; i += 1) {
      const pane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.28, 0.22),
        new THREE.MeshBasicMaterial({ color: 0x8fb8d6, transparent: true, opacity: 0.35 }),
      );
      pane.position.set(-1.54, 1.35, 5.2 - i * 1.35);
      pane.rotation.y = Math.PI / 2;
      cabin.add(pane);
      const paneR = pane.clone();
      paneR.position.x = 1.54;
      paneR.rotation.y = -Math.PI / 2;
      cabin.add(paneR);
    }
    const bin = new THREE.MeshLambertMaterial({ color: 0xd9dee6 });
    cabin.add(block(0.7, 0.22, 13, 0xd9dee6, -1.05, 1.95, 0, bin));
    cabin.add(block(0.7, 0.22, 13, 0xd9dee6, 1.05, 1.95, 0, bin));
    const looks: LookId[] = ["ada", "chidi", "ngozi", "emeka", "zara", "ibe"];
    const shirts = [0xc4552a, 0x245c78, 0x1f6b45, 0x7a3e6d, 0xf2c14e, 0x17241e];
    for (let row = 0; row < 8; row += 1) {
      for (const x of [-1.12, -0.58, 0.58, 1.12]) {
        const chair = seatMesh();
        chair.position.set(x, 0, 4.6 - row * 1.32);
        cabin.add(chair);
        const playerSeat = row === 2 && x === -1.12;
        if (playerSeat) continue;
        if ((row + Math.abs(x)) % 3 === 0) continue;
        const person = createRealisticHuman({
          lookId: looks[(row * 3 + Math.abs(x * 10)) % looks.length],
          seated: true,
          scale: 0.78,
          customShirt: shirts[(row + Math.round(x + 2)) % shirts.length],
        });
        person.position.set(x, 0, 4.55 - row * 1.32);
        person.rotation.y = Math.PI;
        cabin.add(person);
      }
    }
    const you = createRealisticHuman({ lookId: look, seated: true, scale: 0.8 });
    you.position.set(-1.12, 0, 4.55 - 2 * 1.32);
    you.rotation.y = Math.PI;
    cabin.add(you);

    const attendant = createRealisticHuman({
      lookId: "ngozi",
      seated: false,
      scale: 0.86,
      customShirt: 0x1f6b45,
      customPants: 0x17241e,
    });
    attendant.position.set(0, 0, 3.2);
    cabin.add(attendant);

    const cabinLight = new THREE.PointLight(0xffe6c8, 1.35, 12);
    cabinLight.position.set(0, 1.8, 1);
    cabin.add(cabinLight);
    airliner.add(cabin);
    cabin.position.set(0, 0.35, 0.4);

    const camera = new THREE.PerspectiveCamera(62, 1, 0.08, 400);
    scene.add(camera);
    const fit = () => {
      renderer.setSize(root.clientWidth || 1, root.clientHeight || 1);
      camera.aspect = (root.clientWidth || 1) / Math.max(1, root.clientHeight);
      camera.updateProjectionMatrix();
    };
    fit();

    let alive = true;
    let frame = 0;
    const started = performance.now();
    const camPos = new THREE.Vector3();
    let camReady = false;
    const loop = () => {
      if (!alive) return;
      const now = performance.now();
      const t = Math.min(1, (now - started) / FLIGHT_MS);
      const z = t * 140;
      airliner.position.set(Math.sin(t * 6) * 1.4, 8 + Math.sin(t * 10) * 0.35, z);
      airliner.rotation.z = Math.sin(t * 6) * 0.04;
      airliner.rotation.x = -0.04;
      cityMap.offset.y = t * 1.8;
      clouds.forEach((cloud, i) => {
        cloud.position.z = ((-20 - i * 14 + t * 90) % 180) - 90;
        cloud.position.x += Math.sin(now / 1800 + i) * 0.01;
      });
      attendant.position.z = 4.8 - ((now / 2800) % 10);
      attendant.rotation.y = ((now / 2800) % 10) < 5 ? Math.PI : 0;
      attendant.position.y = Math.abs(Math.sin(now / 180)) * 0.03;

      if (view.current === "inside") {
        airliner.updateMatrixWorld(true);
        const eye = new THREE.Vector3(-0.72, 1.42, 1.85);
        cabin.localToWorld(eye);
        camera.position.copy(eye);
        const gaze = new THREE.Vector3(0.35, 1.22, -0.4);
        cabin.localToWorld(gaze);
        camera.lookAt(gaze);
        camera.fov = 68;
        camera.updateProjectionMatrix();
        camReady = false;
      } else {
        const goal = airliner.position.clone().add(new THREE.Vector3(11, 5.2, -16));
        if (!camReady) {
          camPos.copy(goal);
          camReady = true;
        } else {
          camPos.lerp(goal, 0.08);
        }
        camera.position.copy(camPos);
        camera.lookAt(airliner.position.clone().add(new THREE.Vector3(0, 1.2, 2)));
        camera.fov = 50;
        camera.updateProjectionMatrix();
      }
      if (barRef.current) barRef.current.style.width = `${Math.round(t * 100)}%`;
      renderer.render(scene, camera);
      if (t >= 1) arrive();
      frame = window.requestAnimationFrame(loop);
    };
    loop();
    const onResize = () => fit();
    window.addEventListener("resize", onResize);
    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      cityMap.dispose();
      cloudTex.dispose();
      livery.dispose();
      renderer.dispose();
      if (root.contains(renderer.domElement)) root.removeChild(renderer.domElement);
    };
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
    </div>,
    document.body,
  );
}
