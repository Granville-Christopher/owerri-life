"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { CAR_CATALOG, carById } from "@/lib/game/content";
import { buildCabMesh, buildDetailedCarMesh } from "./carModels";
import { loadAllRealCars, makeEnvironment, makeRealCar, realKindFor } from "./realCars";

type RideVehicle = "car" | "bus" | "cab" | "okada";

// The route has a long straight tail at each end so traffic and buildings already exist when the ride starts.
const POINTS: Array<[number, number]> = [
  [0, 78],
  [0, 8],
  [0, -36],
  [34, -36],
  [34, -78],
  [78, -78],
  [78, -118],
  [78, -188],
];
const CORNERS = POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z));
const ROAD = 10.8;
const OWN_LANE = 1.5;
const OUTER_LANE = 4.0;
const RIDE_MS = 20000;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lambert = (color: number) => new THREE.MeshLambertMaterial({ color });
function block(w: number, h: number, d: number, color: number, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lambert(color));
  mesh.position.set(x, y, z);
  return mesh;
}

function windowTexture(wall: number, cols: number, rows: number, cache: Map<string, THREE.CanvasTexture>) {
  const key = `${wall}:${cols}:${rows}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = `#${wall.toString(16).padStart(6, "0")}`;
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "#e9e3d6";
    ctx.fillRect(12, 12, 40, 36);
    ctx.fillStyle = "#35546e";
    ctx.fillRect(15, 15, 34, 30);
    ctx.fillStyle = "#8fb8d6";
    ctx.fillRect(15, 15, 17, 14);
    ctx.fillRect(32, 30, 17, 15);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(cols, rows);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

function labelTexture(text: string, bg: string, fg: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 96);
    ctx.strokeStyle = fg;
    ctx.lineWidth = 6;
    ctx.strokeRect(5, 5, 246, 86);
    ctx.fillStyle = fg;
    ctx.font = "bold 34px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 50);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function wheelRing(radius: number) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.15, 10, 28), lambert(0x15151a));
  return ring;
}

function carCockpit(): { group: THREE.Group; steer: THREE.Group } {
  const group = new THREE.Group();
  group.add(block(3.2, 0.5, 0.9, 0x1c1c22, 0, -0.8, -1.4));
  group.add(block(3.2, 0.05, 0.5, 0x2a2a31, 0, -0.54, -1.3));
  const screen = block(0.5, 0.26, 0.04, 0x0b1d2a, 0.62, -0.4, -1.4);
  group.add(screen);
  group.add(new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.2, 0.02), new THREE.MeshBasicMaterial({ color: 0x2a7da0 })).translateX(0.62).translateY(-0.4).translateZ(-1.38));
  group.add(block(0.8, 0.16, 0.3, 0x0f0f12, 0, -0.5, -1.05));
  group.add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.02), new THREE.MeshBasicMaterial({ color: 0xe0b15a })).translateY(-0.42).translateZ(-1.0));
  const left = block(0.14, 1.5, 0.16, 0x17171b, -1.15, 0.2, -1.5);
  left.rotation.z = 0.32;
  const right = block(0.14, 1.5, 0.16, 0x17171b, 1.15, 0.2, -1.5);
  right.rotation.z = -0.32;
  group.add(left, right);
  group.add(block(3.6, 0.14, 0.5, 0x24242a, 0, 0.82, -1.2));
  group.add(block(0.26, 0.07, 0.04, 0x3a3a40, 0, 0.58, -1.2));
  group.add(block(0.03, 0.1, 0.03, 0x3a3a40, 0, 0.67, -1.2));

  const root = new THREE.Group();
  root.position.set(0, -0.5, -0.8);
  root.rotation.x = -0.95;
  const steer = new THREE.Group();
  steer.add(wheelRing(0.19));
  steer.add(block(0.34, 0.035, 0.03, 0x15151a));
  steer.add(block(0.035, 0.18, 0.03, 0x15151a, 0, -0.09, 0));
  steer.add(block(0.08, 0.08, 0.05, 0xe0b15a, 0, 0, 0.01));
  const skin = 0x8a5a3c;
  [-0.19, 0.19].forEach((x) => {
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), lambert(skin));
    hand.position.set(x, 0.02, 0.02);
    steer.add(hand);
  });
  root.add(steer);
  group.add(root);
  return { group, steer };
}

function cabCockpit(): { group: THREE.Group; steer: THREE.Group } {
  const group = new THREE.Group();
  group.add(block(0.6, 0.62, 0.22, 0x3a3a42, -0.5, -0.62, -1.15));
  group.add(block(0.26, 0.18, 0.16, 0x3a3a42, -0.5, -0.22, -1.15));
  group.add(block(0.6, 0.62, 0.22, 0x3a3a42, 0.5, -0.62, -1.15));
  group.add(block(0.26, 0.18, 0.16, 0x3a3a42, 0.5, -0.22, -1.15));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), lambert(0x6b4429));
  head.position.set(-0.5, 0.0, -1.22);
  group.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.125, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), lambert(0x111111));
  hair.position.set(-0.5, 0.02, -1.22);
  group.add(hair);
  group.add(block(0.4, 0.3, 0.18, 0xf2c14e, -0.5, -0.3, -1.26));
  group.add(block(3.2, 0.55, 0.8, 0x1c1c22, 0, -0.75, -2.7));
  const root = new THREE.Group();
  root.position.set(-0.5, -0.12, -2.35);
  root.rotation.x = -0.9;
  const steer = new THREE.Group();
  steer.add(wheelRing(0.17));
  steer.add(block(0.3, 0.03, 0.03, 0x15151a));
  root.add(steer);
  group.add(root);
  group.add(block(0.34, 0.1, 0.05, 0x3a3a40, 0, 0.42, -2.1));
  group.add(block(3.6, 0.14, 0.7, 0x4a4a52, 0, 0.8, -1.4));
  const left = block(0.14, 1.5, 0.16, 0x17171b, -1.25, 0.2, -1.4);
  left.rotation.z = 0.15;
  const right = block(0.14, 1.5, 0.16, 0x17171b, 1.25, 0.2, -1.4);
  right.rotation.z = -0.15;
  group.add(left, right);
  return { group, steer };
}

function busCockpit(): { group: THREE.Group; steer: THREE.Group } {
  const group = new THREE.Group();
  const seat = 0x2a4a6a;
  group.add(block(0.85, 0.62, 0.24, seat, -1.05, -0.75, -1.6));
  group.add(block(0.85, 0.62, 0.24, seat, 0.25, -0.75, -1.6));
  [[-1.05, 0x6b4429], [0.25, 0x8a5a3c]].forEach(([x, color]) => {
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), lambert(color));
    head.position.set(x, -0.28, -1.66);
    group.add(head);
  });
  group.add(block(3.4, 0.7, 0.5, 0x23303a, 0, -0.95, -3.3));
  group.add(block(0.62, 0.7, 0.24, seat, -0.75, -0.7, -2.7));
  const driver = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), lambert(0x5a3a22));
  driver.position.set(-0.75, -0.1, -2.78);
  group.add(driver);
  const root = new THREE.Group();
  root.position.set(-0.75, -0.25, -3.0);
  root.rotation.x = -0.75;
  const steer = new THREE.Group();
  steer.add(wheelRing(0.26));
  steer.add(block(0.5, 0.04, 0.03, 0x15151a));
  root.add(steer);
  group.add(root);
  group.add(block(3.8, 0.14, 0.9, 0x6b7a85, 0, 0.9, -1.3));
  const left = block(0.12, 1.7, 0.2, 0x1c2a33, -1.45, 0.1, -1.0);
  const right = block(0.12, 1.7, 0.2, 0x1c2a33, 1.45, 0.1, -1.0);
  group.add(left, right);
  return { group, steer };
}

function okadaCockpit(): { group: THREE.Group; steer: THREE.Group } {
  const group = new THREE.Group();
  const skin = 0x8a5a3c;
  group.add(block(0.48, 0.22, 0.72, 0x1f6b45, 0, -0.58, -1.05));
  group.add(block(0.3, 0.08, 0.22, 0xe0b15a, 0, -0.44, -1.05));
  group.add(block(0.14, 0.08, 0.03, 0x8fb8d6, -0.58, 0.16, -1.28));
  group.add(block(0.14, 0.08, 0.03, 0x8fb8d6, 0.58, 0.16, -1.28));
  const visor = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.38, 0.04), new THREE.MeshBasicMaterial({ color: 0x1a3040, transparent: true, opacity: 0.32 }));
  visor.position.set(0, 0.78, -1.05);
  group.add(visor);
  const root = new THREE.Group();
  root.position.set(0, -0.22, -0.78);
  const steer = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.98, 8), lambert(0x15151a));
  bar.rotation.z = Math.PI / 2;
  steer.add(bar);
  [-0.44, 0.44].forEach((x) => {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.16, 8), lambert(0x2a1a12));
    grip.rotation.z = Math.PI / 2;
    grip.position.set(x, 0, 0);
    steer.add(grip);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), lambert(skin));
    hand.position.set(x, -0.02, 0.03);
    steer.add(hand);
  });
  steer.add(block(0.18, 0.08, 0.1, 0x0b1d2a, 0, 0.05, 0.02));
  root.add(steer);
  group.add(root);
  return { group, steer };
}

function buildOkadaMesh() {
  const bike = new THREE.Group();
  const skin = 0x6b4429;
  const tire = (z: number) => {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.08, 10, 18), lambert(0x15151a));
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(0, 0.34, z);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.22, 12), lambert(0xb7bcc4));
    disc.rotation.y = Math.PI / 2;
    disc.position.set(0, 0.34, z);
    return [wheel, disc];
  };
  tire(0.95).forEach((part) => bike.add(part));
  tire(-0.82).forEach((part) => bike.add(part));
  bike.add(block(0.09, 0.1, 1.55, 0x2b2f36, 0, 0.48, 0.06));
  bike.add(block(0.36, 0.2, 0.62, 0x1f6b45, 0, 0.78, 0.28));
  bike.add(block(0.22, 0.08, 0.28, 0xe0b15a, 0, 0.9, 0.28));
  bike.add(block(0.3, 0.1, 0.78, 0x1a140c, 0, 0.74, -0.42));
  const fork = block(0.08, 0.55, 0.08, 0x15151a, 0, 0.62, 0.88);
  bike.add(fork);
  const bars = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), lambert(0xc5c8ce));
  bars.rotation.z = Math.PI / 2;
  bars.position.set(0, 1.08, 0.78);
  bike.add(bars);
  [-0.4, 0.4].forEach((x) => {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 8), lambert(0x2a1a12));
    grip.rotation.z = Math.PI / 2;
    grip.position.set(x, 1.08, 0.78);
    bike.add(grip);
    const mirror = block(0.12, 0.08, 0.04, 0x8fb8d6, x * 1.05, 1.2, 0.78);
    bike.add(mirror);
  });
  bike.add(block(0.16, 0.12, 0.1, 0xfff6d8, 0, 0.78, 1.12));
  const rider = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.52, 8), lambert(0xc4552a));
  rider.position.set(0, 1.12, -0.18);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), lambert(0x111111));
  helmet.position.set(0, 1.52, -0.18);
  const passenger = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.46, 8), lambert(0x245c78));
  passenger.position.set(0, 1.08, -0.58);
  const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), lambert(0x8a5a3c));
  pHead.position.set(0, 1.4, -0.58);
  bike.add(rider, helmet, passenger, pHead);
  return bike;
}

export function RideScene({ vehicle, carId, onArrive }: { vehicle: RideVehicle; carId?: string; onArrive: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<"inside" | "above">("inside");
  const barRef = useRef<HTMLDivElement>(null);
  const [seat, setSeat] = useState<"inside" | "above">("inside");
  const finished = useRef(false);
  const deal = carById(carId) ?? CAR_CATALOG[1];
  const label = vehicle === "bus" ? "Busimo" : vehicle === "cab" ? "Cab" : vehicle === "okada" ? "Okada" : deal.name;
  const seatLabel =
    vehicle === "car"
      ? seat === "inside"
        ? "You are driving"
        : "From above"
      : vehicle === "okada"
        ? seat === "inside"
          ? "You are on the okada"
          : "From above"
        : seat === "inside"
          ? "From your seat"
          : "From above";

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
    renderer.toneMappingExposure = 1.15;
    root.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#a9cdea");
    scene.fog = new THREE.Fog("#a9cdea", 26, 120);
    scene.add(new THREE.HemisphereLight(0xfff6e8, 0x6d8a52, 1.15));
    const sun = new THREE.DirectionalLight(0xfff3dd, 1.1);
    sun.position.set(30, 40, 10);
    scene.add(sun);
    const envTarget = makeEnvironment(renderer, scene, 0.75);

    const lengths: number[] = [];
    let total = 0;
    for (let i = 0; i < CORNERS.length - 1; i += 1) {
      const len = CORNERS[i].distanceTo(CORNERS[i + 1]);
      lengths.push(len);
      total += len;
    }
    const startAt = lengths[0];
    const span = total - lengths[0] - lengths[lengths.length - 1];

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), lambert(0xb9d19a));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(40, -0.02, -55);
    scene.add(ground);

    const segs = CORNERS.slice(0, -1).map((from, i) => {
      const to = CORNERS[i + 1];
      const dir = to.clone().sub(from).normalize();
      const heading = Math.atan2(dir.x, dir.z);
      return { from, to, dir, heading, len: lengths[i], side: new THREE.Vector3(Math.cos(heading), 0, -Math.sin(heading)) };
    });

    function segDist(x: number, z: number) {
      let best = Infinity;
      for (const seg of segs) {
        const dx = x - seg.from.x;
        const dz = z - seg.from.z;
        const along = Math.min(seg.len, Math.max(0, dx * seg.dir.x + dz * seg.dir.z));
        best = Math.min(best, Math.hypot(dx - seg.dir.x * along, dz - seg.dir.z * along));
      }
      return best;
    }

    // ── Road, kerbs and markings ─────────────────────────────────────
    segs.forEach((seg, i) => {
      const mid = seg.from.clone().add(seg.to).multiplyScalar(0.5);
      const road = block(ROAD, 0.08, seg.len + ROAD, 0x4a514c, mid.x, 0.04, mid.z);
      road.rotation.y = seg.heading;
      scene.add(road);
      const trimA = i === 0 ? 0 : ROAD / 2 + 1;
      const trimB = i === segs.length - 1 ? 0 : ROAD / 2 + 1;
      const run = seg.len - trimA - trimB;
      const runMid = seg.from.clone().addScaledVector(seg.dir, trimA + run / 2);
      [-1, 1].forEach((sign) => {
        const walk = block(1.9, 0.18, run, 0xcfcac0, 0, 0.09, 0);
        walk.position.copy(runMid).addScaledVector(seg.side, sign * (ROAD / 2 + 0.95));
        walk.position.y = 0.09;
        walk.rotation.y = seg.heading;
        scene.add(walk);
        const edge = block(0.14, 0.02, run, 0xf4efe4, 0, 0.09, 0);
        edge.position.copy(runMid).addScaledVector(seg.side, sign * (ROAD / 2 - 0.35));
        edge.position.y = 0.09;
        edge.rotation.y = seg.heading;
        scene.add(edge);
        const yellow = block(0.1, 0.02, run, 0xf2c14e, 0, 0.09, 0);
        yellow.position.copy(runMid).addScaledVector(seg.side, sign * 0.12);
        yellow.position.y = 0.09;
        yellow.rotation.y = seg.heading;
        scene.add(yellow);
      });
      const dashes = Math.floor(run / 5);
      for (let d = 0; d < dashes; d += 1) {
        [-1, 1].forEach((sign) => {
          const dash = block(0.14, 0.02, 2.2, 0xf4efe4, 0, 0.09, 0);
          dash.position.copy(seg.from).addScaledVector(seg.dir, trimA + (d + 0.5) * (run / dashes)).addScaledVector(seg.side, sign * ((OWN_LANE + OUTER_LANE) / 2));
          dash.position.y = 0.09;
          dash.rotation.y = seg.heading;
          scene.add(dash);
        });
      }
    });

    // ── Buildings, shops, trees, lamp posts and billboards ───────────
    const rand = mulberry32(2026);
    const texCache = new Map<string, THREE.CanvasTexture>();
    const walls = [0xf4efe4, 0xe7d3c4, 0xd9e4ec, 0xf2d9a0, 0xc8d8c0, 0xe0b8b0, 0xb8c4d0, 0xefe2c8];
    const signs = [0x1f6b45, 0xc4552a, 0x245c78, 0x8c2438, 0xe0b15a, 0x5b3a7a];
    type Plot = { x: number; z: number; w: number; d: number; h: number };
    const plots: Plot[] = [];
    const inRect = (px: number, pz: number, b: Plot, pad: number) => {
      const dx = px - b.x;
      const dz = pz - b.z;
      const lx = dx * Math.cos(b.h) - dz * Math.sin(b.h);
      const lz = dx * Math.sin(b.h) + dz * Math.cos(b.h);
      return Math.abs(lx) < b.d / 2 + pad && Math.abs(lz) < b.w / 2 + pad;
    };
    const cornersOf = (b: Plot) =>
      [[-1, -1], [-1, 1], [1, -1], [1, 1], [0, 0]].map(([a, c]) => {
        const lx = (a * b.d) / 2;
        const lz = (c * b.w) / 2;
        return [b.x + lx * Math.cos(b.h) + lz * Math.sin(b.h), b.z - lx * Math.sin(b.h) + lz * Math.cos(b.h)] as const;
      });
    const labels = ["OWERRI LIFE", "Mama Put", "Busimo", "Imo State", "Fresh Fish", "Cold Drinks"];
    const labelMats = labels.map((text, i) => new THREE.MeshBasicMaterial({ map: labelTexture(text, ["#143d2c", "#8c2438", "#245c78", "#5b3a7a", "#c4552a", "#1f6b45"][i], "#f6f1e6") }));

    segs.forEach((seg) => {
      [-1, 1].forEach((sign) => {
        let s = 2 + rand() * 4;
        while (s < seg.len - 2) {
          const w = 6 + rand() * 5;
          const d = 6 + rand() * 5;
          const tall = rand() < 0.2;
          const height = 4 + rand() * rand() * 14 + (tall ? 8 : 0);
          const off = ROAD / 2 + 3.4 + d / 2 + rand() * 1.5;
          const plot: Plot = {
            x: seg.from.x + seg.dir.x * (s + w / 2) + seg.side.x * sign * off,
            z: seg.from.z + seg.dir.z * (s + w / 2) + seg.side.z * sign * off,
            w,
            d,
            h: seg.heading,
          };
          const clear = cornersOf(plot).every(([cx, cz]) => segDist(cx, cz) > ROAD / 2 + 2.6) && plots.every((other) => !cornersOf(plot).some(([cx, cz]) => inRect(cx, cz, other, 1.2)) && !cornersOf(other).some(([cx, cz]) => inRect(cx, cz, plot, 1.2)));
          if (clear) {
            plots.push(plot);
            const wall = walls[Math.floor(rand() * walls.length)];
            const rows = Math.max(1, Math.round(height / 3.1));
            const sideMat = (cols: number) => new THREE.MeshLambertMaterial({ map: windowTexture(wall, cols, rows, texCache) });
            const alongMat = sideMat(Math.max(1, Math.round(w / 2.6)));
            const depthMat = sideMat(Math.max(1, Math.round(d / 2.6)));
            const roof = lambert(0x8f8a80);
            const body = new THREE.Mesh(new THREE.BoxGeometry(d, height, w), [alongMat, alongMat, roof, roof, depthMat, depthMat]);
            const group = new THREE.Group();
            body.position.y = height / 2;
            group.add(body);
            const shop = block(0.25, 0.9, w * 0.8, signs[Math.floor(rand() * signs.length)], -sign * (d / 2 + 0.12), 3.0, 0);
            group.add(shop);
            const door = block(0.12, 2.2, 1.3, 0x3b2a1e, -sign * (d / 2 + 0.05), 1.1, w * 0.2);
            group.add(door);
            if (rand() < 0.35) {
              const board = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.6), labelMats[Math.floor(rand() * labelMats.length)]);
              board.position.set(-sign * (d / 2 + 0.2), height + 1.6, 0);
              board.rotation.y = -sign * (Math.PI / 2);
              group.add(board);
              group.add(block(0.2, 1.6, 0.2, 0x4a4a4a, -sign * (d / 2 + 0.15), height + 0.8, 0));
            }
            group.position.set(plot.x, 0, plot.z);
            group.rotation.y = seg.heading;
            scene.add(group);
          }
          s += w + 0.8 + rand() * 3;
        }
      });
      // trees, lamp posts
      [-1, 1].forEach((sign) => {
        for (let s = 3 + rand() * 3; s < seg.len - 2; s += 7 + rand() * 4) {
          const x = seg.from.x + seg.dir.x * s + seg.side.x * sign * (ROAD / 2 + 2.9);
          const z = seg.from.z + seg.dir.z * s + seg.side.z * sign * (ROAD / 2 + 2.9);
          if (segDist(x, z) < ROAD / 2 + 1.6 || plots.some((b) => inRect(x, z, b, 0.5))) continue;
          const tree = new THREE.Group();
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 1.8, 6), lambert(0x6a4630));
          trunk.position.y = 0.9;
          const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2 + rand() * 0.5, 0), lambert(rand() < 0.5 ? 0x2f7d4a : 0x3f9158));
          crown.position.y = 2.6;
          tree.add(trunk, crown);
          tree.position.set(x, 0, z);
          scene.add(tree);
        }
        for (let s = 6; s < seg.len - 4; s += 18) {
          const x = seg.from.x + seg.dir.x * s + seg.side.x * sign * (ROAD / 2 + 1.0);
          const z = seg.from.z + seg.dir.z * s + seg.side.z * sign * (ROAD / 2 + 1.0);
          if (segDist(x, z) < ROAD / 2 + 0.4) continue;
          const lamp = new THREE.Group();
          lamp.add(block(0.12, 5.6, 0.12, 0x4a4f52, 0, 2.8, 0));
          lamp.add(block(1.5, 0.12, 0.12, 0x4a4f52, -sign * 0.7, 5.6, 0));
          const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.3), new THREE.MeshBasicMaterial({ color: 0xfff3c4 }));
          bulb.position.set(-sign * 1.4, 5.5, 0);
          lamp.add(bulb);
          lamp.position.set(x, 0, z);
          lamp.rotation.y = seg.heading;
          scene.add(lamp);
        }
      });
    });

    // clouds
    for (let i = 0; i < 14; i += 1) {
      const cloud = new THREE.Mesh(new THREE.SphereGeometry(8 + rand() * 8, 10, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false }));
      cloud.scale.set(2.2, 0.35, 1.2);
      cloud.position.set(-100 + rand() * 280, 70 + rand() * 25, -230 + rand() * 340);
      scene.add(cloud);
    }

    // Corners are rounded with a curve so every car, including traffic, sweeps through a turn instead of snapping round.
    const CORNER_R = 11;
    const cornerAt: number[] = [];
    {
      let acc = 0;
      for (let k = 1; k < CORNERS.length - 1; k += 1) {
        acc += lengths[k - 1];
        cornerAt.push(acc);
      }
    }
    function pose(distance: number) {
      const clamped = Math.min(total - 0.001, Math.max(0.001, distance));
      for (let k = 1; k < CORNERS.length - 1; k += 1) {
        const d = clamped - cornerAt[k - 1];
        if (Math.abs(d) > CORNER_R) continue;
        const prev = CORNERS[k].clone().sub(CORNERS[k - 1]).normalize();
        const next = CORNERS[k + 1].clone().sub(CORNERS[k]).normalize();
        const u = (d + CORNER_R) / (2 * CORNER_R);
        const p0 = CORNERS[k].clone().addScaledVector(prev, -CORNER_R);
        const p2 = CORNERS[k].clone().addScaledVector(next, CORNER_R);
        const point = new THREE.Vector3()
          .addScaledVector(p0, (1 - u) * (1 - u))
          .addScaledVector(CORNERS[k], 2 * u * (1 - u))
          .addScaledVector(p2, u * u);
        const tangent = new THREE.Vector3().addScaledVector(prev, 1 - u).addScaledVector(next, u).normalize();
        return { point, heading: Math.atan2(tangent.x, tangent.z), dir: tangent };
      }
      let walked = 0;
      for (let i = 0; i < lengths.length; i += 1) {
        const len = lengths[i];
        if (walked + len >= clamped || i === lengths.length - 1) {
          const along = Math.min(1, Math.max(0, (clamped - walked) / len));
          const dir = CORNERS[i + 1].clone().sub(CORNERS[i]).normalize();
          const point = CORNERS[i].clone().lerp(CORNERS[i + 1], along);
          return { point, heading: Math.atan2(dir.x, dir.z), dir };
        }
        walked += len;
      }
      return { point: CORNERS[CORNERS.length - 1].clone(), heading: 0, dir: new THREE.Vector3(0, 0, -1) };
    }

    function wheel(x: number, y: number, z: number) {
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.22, 12), lambert(0x1a1a1a));
      tire.rotation.z = Math.PI / 2;
      tire.position.set(x, y, z);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.24, 8), lambert(0xd5d8de));
      rim.rotation.z = Math.PI / 2;
      rim.position.set(x, y, z);
      return [tire, rim];
    }

    // ── Your vehicle ─────────────────────────────────────────────────
    const rig = new THREE.Group();
    scene.add(rig);
    let alive = true;
    if (vehicle === "bus") {
      rig.add(block(2.35, 0.35, 7.2, 0x1f6b45));
      rig.add(block(2.2, 1.7, 6.6, 0xf4efe4, 0, 1.15, 0));
      rig.add(block(2.25, 0.7, 5.4, 0x8ec4ea, 0, 1.45, 0.1));
      rig.add(block(2.05, 0.7, 0.08, 0xd7eef8, 0, 1.4, 3.32));
      rig.add(block(2.1, 0.16, 0.2, 0xfff6d8, 0, 0.7, 3.4));
      [-2.2, 2.1].forEach((z) => {
        wheel(-1.15, 0.34, z).forEach((part) => rig.add(part));
        wheel(1.15, 0.34, z).forEach((part) => rig.add(part));
      });
    } else if (vehicle === "cab") {
      rig.add(buildCabMesh());
    } else if (vehicle === "okada") {
      rig.add(buildOkadaMesh());
    } else {
      rig.add(buildDetailedCarMesh(deal, undefined, true));
    }
    const placeholder = rig.children[rig.children.length - 1];
    const real: { eye: THREE.Vector3 | null; steer: THREE.Object3D | null } = {
      eye: vehicle === "okada" ? new THREE.Vector3(0, 1.32, 0.42) : null,
      steer: null,
    };
    const cabin = new THREE.PointLight(0xffe4c4, 2.6, 6);
    cabin.position.set(0.2, 1.15, 0.15);
    rig.add(cabin);

    // ── Other traffic ────────────────────────────────────────────────
    const trafficDeals = CAR_CATALOG.filter((c) => c.id !== "bugatti");
    const paints = [0xf2c14e, 0xc4552a, 0x17241e, 0x245c78, 0x1f6b45, 0xf4efe4, 0x8c2438, 0x3d4f6f];
    type Flow = { mesh: THREE.Object3D; s0: number; speed: number; lane: number; dir: 1 | -1 };
    const flow: Flow[] = [];
    const sameStarts = [startAt + 22, startAt + 45, startAt + 60, startAt + 85, startAt + 105, startAt + 130, startAt + 150, startAt - 28, startAt + 170, startAt + 190];
    const oppStarts = [startAt + 35, startAt + 50, startAt + 70, startAt + 95, startAt + 120, startAt + 145, startAt + 170, startAt + 12, startAt + 195, startAt + 215, startAt + 235, startAt + 80];
    const pick = () => trafficDeals[Math.floor(rand() * trafficDeals.length)];
    sameStarts.forEach((s0) => {
      const model = buildDetailedCarMesh(pick(), paints[Math.floor(rand() * paints.length)], true);
      scene.add(model);
      flow.push({ mesh: model, s0, speed: 0.55 + rand() * 0.95, lane: OUTER_LANE, dir: 1 });
    });
    oppStarts.forEach((s0, i) => {
      const model = buildDetailedCarMesh(pick(), paints[Math.floor(rand() * paints.length)], true);
      scene.add(model);
      flow.push({ mesh: model, s0, speed: 0.8 + rand() * 0.6, lane: i % 2 === 0 ? OWN_LANE : OUTER_LANE, dir: -1 });
    });
    void loadAllRealCars().then(() => {
      if (!alive) return;
      if (vehicle === "car" || vehicle === "cab") {
        const kind = vehicle === "cab" ? "sedan" : realKindFor(deal);
        const made = makeRealCar(kind, { color: vehicle === "cab" ? 0xf2c14e : deal.defaultColor });
        if (made) {
          rig.remove(placeholder);
          rig.add(made.group);
          real.eye = vehicle === "cab" ? made.rear : made.driver;
          real.steer = made.steer;
        }
      }
      flow.forEach((item, index) => {
        const deal2 = trafficDeals[(index * 5 + 3) % trafficDeals.length];
        const made = makeRealCar(realKindFor(deal2), { color: paints[(index * 3) % paints.length], plain: true });
        if (!made) return;
        scene.remove(item.mesh);
        item.mesh = made.group;
        scene.add(made.group);
      });
    });

    // people on the pavement
    const walkers: Array<{ mesh: THREE.Object3D; s0: number; speed: number; lane: number }> = [];
    const shirts = [0xc4552a, 0x245c78, 0xf2c14e, 0xf7fbfc, 0x8c2438, 0x1f6b45, 0x5b3a7a];
    for (let i = 0; i < 16; i += 1) {
      const person = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 1.0, 8), lambert(shirts[i % shirts.length]));
      body.position.y = 0.95;
      const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 8), lambert(0x222831));
      legs.position.y = 0.25;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), lambert([0x6b4429, 0x8a5a3c, 0x4e2f1c][i % 3]));
      head.position.y = 1.65;
      person.add(body, legs, head);
      scene.add(person);
      walkers.push({ mesh: person, s0: 12 + i * 21, speed: (i % 2 === 0 ? 1 : -1) * (0.012 + rand() * 0.01), lane: (i % 2 === 0 ? 1 : -1) * (ROAD / 2 + 0.7 + rand() * 0.6) });
    }

    // ── Cockpit shown on the camera ──────────────────────────────────
    const cockpit = vehicle === "car" ? carCockpit() : vehicle === "cab" ? cabCockpit() : vehicle === "okada" ? okadaCockpit() : busCockpit();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 260);
    camera.add(cockpit.group);
    scene.add(camera);
    const fit = () => {
      renderer.setSize(root.clientWidth || 1, root.clientHeight || 1);
      camera.aspect = (root.clientWidth || 1) / Math.max(1, root.clientHeight);
      camera.updateProjectionMatrix();
    };
    fit();

    const eyeSpec =
      vehicle === "car"
        ? { x: -0.4, y: 1.12, z: 0.1 }
        : vehicle === "cab"
          ? { x: 0.1, y: 1.15, z: -0.55 }
          : vehicle === "okada"
            ? { x: 0, y: 1.28, z: 0.42 }
            : { x: 0.7, y: 1.6, z: 0.5 };
    const ownLane = vehicle === "okada" ? 2.35 : OWN_LANE;
    const camPos = new THREE.Vector3();
    let camReady = false;
    let prevHeading = 0;
    let steer = 0;
    let lastTick = performance.now();
    let frame = 0;
    const started = performance.now();
    const loop = () => {
      if (!alive) return;
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastTick) / 1000);
      lastTick = now;
      const t = Math.min(1, (now - started) / RIDE_MS);
      const here = pose(startAt + t * span);
      const side = new THREE.Vector3(Math.cos(here.heading), 0, -Math.sin(here.heading));
      const fwd = new THREE.Vector3(Math.sin(here.heading), 0, Math.cos(here.heading));
      rig.position.copy(here.point).addScaledVector(side, ownLane);
      rig.position.y = 0;
      rig.rotation.y = here.heading;

      if (!camReady) prevHeading = here.heading;
      const dh = Math.atan2(Math.sin(here.heading - prevHeading), Math.cos(here.heading - prevHeading));
      prevHeading = here.heading;
      const target = Math.max(-1, Math.min(1, (dt > 0 ? dh / dt : 0) * 0.28));
      steer += (target - steer) * Math.min(1, dt * 5);
      if (vehicle === "okada") cockpit.steer.rotation.y = steer * 0.55;
      else cockpit.steer.rotation.z = steer;

      const velocity = span / (RIDE_MS / 1000);
      flow.forEach((item) => {
        const dist = ((((item.s0 + item.dir * item.speed * velocity * t * (RIDE_MS / 1000)) % total) + total) % total);
        const at = pose(dist);
        const sd = new THREE.Vector3(Math.cos(at.heading), 0, -Math.sin(at.heading));
        item.mesh.position.copy(at.point).addScaledVector(sd, item.dir * item.lane);
        item.mesh.position.y = 0;
        item.mesh.rotation.y = at.heading + (item.dir === -1 ? Math.PI : 0);
      });
      walkers.forEach((person) => {
        const dist = ((((person.s0 + person.speed * velocity * t * (RIDE_MS / 1000)) % total) + total) % total);
        const at = pose(dist);
        const sd = new THREE.Vector3(Math.cos(at.heading), 0, -Math.sin(at.heading));
        person.mesh.position.copy(at.point).addScaledVector(sd, person.lane);
        person.mesh.position.y = Math.abs(Math.sin(now / 160 + person.s0)) * 0.05;
        person.mesh.rotation.y = at.heading + (person.speed < 0 ? Math.PI : 0);
      });

      rig.updateMatrixWorld(true);
      if (real.steer) real.steer.rotation.z = steer * 1.1;
      if (view.current === "inside" && real.eye) {
        rig.visible = true;
        cockpit.group.visible = false;
        if (camera.fov !== 70) {
          camera.fov = 70;
          camera.updateProjectionMatrix();
        }
        const bob = Math.sin(now / 55) * 0.004;
        const eye = rig.localToWorld(real.eye.clone());
        eye.y += bob;
        camera.position.copy(eye);
        const lookFar = vehicle === "okada" ? 3.2 : 12;
        const lookDown = vehicle === "okada" ? -0.45 : -0.05;
        camera.lookAt(eye.clone().addScaledVector(fwd, lookFar).add(new THREE.Vector3(0, lookDown, 0)));
        camReady = false;
      } else if (view.current === "inside") {
        rig.visible = false;
        cockpit.group.visible = true;
        const bob = Math.sin(now / 55) * (vehicle === "okada" ? 0.022 : vehicle === "bus" ? 0.014 : 0.006);
        const eye = rig.position.clone().addScaledVector(side, eyeSpec.x).addScaledVector(fwd, eyeSpec.z);
        eye.y = eyeSpec.y + bob;
        camera.position.copy(eye);
        camera.lookAt(eye.clone().addScaledVector(fwd, 10).add(new THREE.Vector3(0, -0.5, 0)));
        camReady = false;
      } else {
        rig.visible = true;
        cockpit.group.visible = false;
        const goal = rig.position.clone().addScaledVector(fwd, vehicle === "okada" ? -9 : -17).add(new THREE.Vector3(0, vehicle === "okada" ? 6.2 : 12, 0));
        if (!camReady) {
          camPos.copy(goal);
          camReady = true;
        } else {
          camPos.lerp(goal, 1 - Math.exp(-dt * 6));
        }
        camera.position.copy(camPos);
        camera.lookAt(rig.position.clone().addScaledVector(fwd, 4).add(new THREE.Vector3(0, 0.6, 0)));
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
      envTarget.dispose();
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (root.contains(renderer.domElement)) root.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle, carId]);

  return createPortal(
    <div data-ride-scene={vehicle} className="fixed inset-0 z-[300] bg-[#10211a]">
      <div ref={host} className="absolute inset-0 touch-none" />
      <div className="pointer-events-none absolute left-3 top-16 z-10 max-w-[13rem] rounded-2xl bg-[#0e1c16]/80 px-3 py-2 text-[#f6f1e6]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e0b15a]">{label}</p>
        <p className="text-sm font-semibold">{seatLabel}</p>
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
          {vehicle === "car" ? "Driver" : vehicle === "okada" ? "Rider" : "Inside"}
        </button>
        <button
          type="button"
          onClick={() => {
            view.current = "above";
            setSeat("above");
          }}
          className={`rounded-lg px-2 py-1 text-[10px] font-semibold sm:text-xs ${seat === "above" ? "bg-[#e0b15a] text-[#1a140c]" : "bg-[#0e1c16]/80 text-white"}`}
        >
          Above
        </button>
        <button type="button" onClick={arrive} className="mt-1 rounded-lg bg-white px-2 py-1 text-[10px] font-semibold text-[#17241e] sm:text-xs">
          Arrive
        </button>
      </div>
    </div>,
    document.body,
  );
}
