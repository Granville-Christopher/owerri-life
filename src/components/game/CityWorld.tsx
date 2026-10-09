"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { PLACES, type Place } from "@/lib/game/content";
import { buildDetailedCarMesh } from "./carModels";
import { makeRealCar } from "./realCars";

const SPAN = 5.6;
const LIMIT = 480;

function spot(x: number, y: number) {
  return { x: (x - 50) * SPAN, z: (y - 50) * SPAN };
}

function mark(kind: Place["kind"]) {
  if (kind === "home") return "⌂";
  if (kind === "nightlife") return "♪";
  if (kind === "food") return "•";
  if (kind === "health") return "+";
  if (kind === "school") return "▣";
  if (kind === "market") return "▦";
  if (kind === "hotel") return "⌂";
  if (kind === "airport") return "✈";
  if (kind === "pickup") return "◇";
  return "·";
}

export function CityWorld({
  homeAreaId,
  locationId,
  onSelect,
}: {
  homeAreaId: string;
  locationId: string;
  onSelect: (placeId: string) => void;
}) {
  const shell = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const wrap = shell.current;
    const el = host.current;
    const labelRoot = labels.current;
    if (!wrap || !el || !labelRoot) return;
    const root = el;
    const surface = wrap;
    const board = labelRoot;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(root.clientWidth, root.clientHeight);
    root.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#cfe0c2");
    scene.add(new THREE.HemisphereLight(0xfff6e8, 0x8fbf98, 1.2));
    const sun = new THREE.DirectionalLight(0xfff3dd, 1.45);
    sun.position.set(40, 70, 18);
    scene.add(sun);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(8000, 8000), new THREE.MeshLambertMaterial({ color: 0xcfe0c2 }));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const water = new THREE.MeshLambertMaterial({ color: 0x2f86a6, side: THREE.DoubleSide });
    type RiverPoint = { x: number; z: number };
    const riverLines: { pts: RiverPoint[]; half: number }[] = [];
    function riverPoint(x: number, z: number, pad: number) {
      let best: { d: number; x: number; z: number; limit: number } | null = null;
      for (const line of riverLines) {
        const limit = line.half + pad;
        for (let i = 0; i < line.pts.length - 1; i += 1) {
          const a = line.pts[i];
          const b = line.pts[i + 1];
          const abx = b.x - a.x;
          const abz = b.z - a.z;
          const len2 = abx * abx + abz * abz || 1;
          let t = ((x - a.x) * abx + (z - a.z) * abz) / len2;
          t = Math.max(0, Math.min(1, t));
          const cx = a.x + abx * t;
          const cz = a.z + abz * t;
          const d = Math.hypot(x - cx, z - cz);
          if (d < limit && (!best || d < best.d)) best = { d, x: cx, z: cz, limit };
        }
      }
      return best;
    }
    function layRiver(pts: RiverPoint[], half: number, swell?: { index: number; extra: number }, y = 0.06) {
      riverLines.push({ pts, half });
      const positions: number[] = [];
      const normals: number[] = [];
      const indices: number[] = [];
      const left: RiverPoint[] = [];
      const right: RiverPoint[] = [];
      for (let i = 0; i < pts.length; i += 1) {
        const back = pts[Math.max(0, i - 1)];
        const curr = pts[i];
        const fore = pts[Math.min(pts.length - 1, i + 1)];
        let ax = curr.x - back.x;
        let az = curr.z - back.z;
        let bx = fore.x - curr.x;
        let bz = fore.z - curr.z;
        const al = Math.hypot(ax, az) || 1;
        const bl = Math.hypot(bx, bz) || 1;
        ax /= al;
        az /= al;
        bx /= bl;
        bz /= bl;
        let nx = -az - bz;
        let nz = ax + bx;
        const nl = Math.hypot(nx, nz) || 1;
        nx /= nl;
        nz /= nl;
        const denom = Math.max(0.55, nx * -az + nz * ax);
        const miter = Math.min(1.25, 1 / denom);
        let wide = half * (0.96 + 0.04 * Math.sin(i * 0.35)) * miter;
        if (swell) {
          const along = Math.abs(i - swell.index);
          if (along < 12) wide += swell.extra * (1 - along / 12) ** 2;
        }
        positions.push(curr.x - nx * wide, y, curr.z - nz * wide, curr.x + nx * wide, y, curr.z + nz * wide);
        normals.push(0, 1, 0, 0, 1, 0);
        left.push({ x: curr.x - nx * wide, z: curr.z - nz * wide });
        right.push({ x: curr.x + nx * wide, z: curr.z + nz * wide });
      }
      for (let i = 0; i < pts.length - 1; i += 1) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
      geo.setIndex(indices);
      scene.add(new THREE.Mesh(geo, water));
      return { left, right, position: geo.getAttribute("position") as THREE.BufferAttribute };
    }
    function distToPoly(pts: RiverPoint[], x: number, z: number) {
      let best = Infinity;
      for (let i = 0; i < pts.length - 1; i += 1) {
        const a = pts[i];
        const b = pts[i + 1];
        const abx = b.x - a.x;
        const abz = b.z - a.z;
        const len2 = abx * abx + abz * abz || 1;
        let t = ((x - a.x) * abx + (z - a.z) * abz) / len2;
        t = Math.max(0, Math.min(1, t));
        best = Math.min(best, Math.hypot(x - (a.x + abx * t), z - (a.z + abz * t)));
      }
      return best;
    }
    const otamiriPts: RiverPoint[] = [];
    for (let i = 0; i <= 78; i += 1) {
      const t = i / 78;
      otamiriPts.push({
        x: -400 + t * 820,
        z: 164 + Math.sin(t * Math.PI * 3) * 14 + Math.sin(t * Math.PI * 6.4 + 0.8) * 6,
      });
    }
    const nworiePts: RiverPoint[] = [];
    for (let i = 0; i <= 68; i += 1) {
      const t = i / 68;
      nworiePts.push({
        x: Math.sin(t * Math.PI * 3.6) * 20 + Math.sin(t * Math.PI * 8 + 0.4) * 8,
        z: -400 + t * 530,
      });
    }
    let mouth = otamiriPts[0];
    const roughEnd = nworiePts[nworiePts.length - 1];
    for (const point of otamiriPts) {
      if (Math.hypot(point.x - roughEnd.x, point.z - roughEnd.z) < Math.hypot(mouth.x - roughEnd.x, mouth.z - roughEnd.z)) mouth = point;
    }
    while (nworiePts.length > 16 && Math.hypot(nworiePts[nworiePts.length - 1].x - mouth.x, nworiePts[nworiePts.length - 1].z - mouth.z) < 170) {
      nworiePts.pop();
    }
    const tail = nworiePts[nworiePts.length - 1];
    for (const point of otamiriPts) {
      if (Math.hypot(point.x - tail.x, point.z - tail.z) < Math.hypot(mouth.x - tail.x, mouth.z - tail.z)) mouth = point;
    }
    const mouthIndex = Math.max(0, otamiriPts.indexOf(mouth));
    const joinPrev = nworiePts[nworiePts.length - 2];
    const upstream = otamiriPts[Math.max(0, mouthIndex - 6)];
    const downstream = otamiriPts[Math.min(otamiriPts.length - 1, mouthIndex + 6)];
    let tx = downstream.x - upstream.x;
    let tz = downstream.z - upstream.z;
    const flow = Math.hypot(tx, tz) || 1;
    tx /= flow;
    tz /= flow;
    const arrive = { x: mouth.x, z: mouth.z };
    const gap = Math.hypot(arrive.x - tail.x, arrive.z - tail.z) || 1;
    let sx = tail.x - joinPrev.x;
    let sz = tail.z - joinPrev.z;
    const sl = Math.hypot(sx, sz) || 1;
    sx = (sx / sl) * gap * 0.55;
    sz = (sz / sl) * gap * 0.55;
    const ex = tx * gap * 0.55;
    const ez = tz * gap * 0.55;
    const steps = Math.max(36, Math.round(gap / 3));
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      nworiePts.push({
        x: (2 * t3 - 3 * t2 + 1) * tail.x + (t3 - 2 * t2 + t) * sx + (-2 * t3 + 3 * t2) * arrive.x + (t3 - t2) * ex,
        z: (2 * t3 - 3 * t2 + 1) * tail.z + (t3 - 2 * t2 + t) * sz + (-2 * t3 + 3 * t2) * arrive.z + (t3 - t2) * ez,
      });
    }
    layRiver(nworiePts, 11, undefined, 0.065);
    layRiver(otamiriPts, 11, { index: mouthIndex, extra: 6 });
    const before = otamiriPts[Math.max(0, mouthIndex - 1)];
    const after = otamiriPts[Math.min(otamiriPts.length - 1, mouthIndex + 1)];
    let bankTx = after.x - before.x;
    let bankTz = after.z - before.z;
    const bankLen = Math.hypot(bankTx, bankTz) || 1;
    bankTx /= bankLen;
    bankTz /= bankLen;
    const bankNormals = [
      { x: -bankTz, z: bankTx },
      { x: bankTz, z: -bankTx },
    ];
    function bankWet(origin: { x: number; z: number }, normal: { x: number; z: number }) {
      let wet = 0;
      for (let i = -3; i <= 3; i += 1) {
        const edgeX = origin.x + bankTx * i * 11 - normal.x * 14;
        const edgeZ = origin.z + bankTz * i * 11 - normal.z * 14;
        if (riverPoint(edgeX, edgeZ, 1)) wet += 1;
      }
      return wet;
    }
    const bankSpot = bankNormals
      .map((normal) => {
        let reach = 28;
        let origin = { x: mouth.x + normal.x * reach, z: mouth.z + normal.z * reach };
        while (reach < 70 && bankWet(origin, normal) > 0) {
          reach += 8;
          origin = { x: mouth.x + normal.x * reach, z: mouth.z + normal.z * reach };
        }
        return { origin, wet: bankWet(origin, normal), land: Math.hypot(origin.x - tail.x, origin.z - tail.z) };
      })
      .sort((a, b) => a.wet - b.wet || b.land - a.land)[0].origin;

    function road(x: number, z: number, length: number, across: boolean) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(across ? length : 5.2, 0.08, across ? 5.2 : length),
        new THREE.MeshLambertMaterial({ color: 0xd9c7a2 }),
      );
      mesh.position.set(x, 0.08, z);
      scene.add(mesh);
    }
    const arterials: { axis: "x" | "z"; fixed: number; min: number; max: number }[] = [
      { axis: "x", fixed: 0, min: -430, max: 430 },
      { axis: "x", fixed: -90, min: -380, max: 380 },
      { axis: "x", fixed: 90, min: -320, max: 400 },
      { axis: "x", fixed: 200, min: -320, max: 320 },
      { axis: "z", fixed: -50, min: -380, max: 380 },
      { axis: "z", fixed: 80, min: -340, max: 380 },
      { axis: "z", fixed: 150, min: -300, max: 280 },
      { axis: "z", fixed: 270, min: -280, max: 300 },
    ];
    for (const item of arterials) {
      const span = item.max - item.min;
      const mid = (item.min + item.max) / 2;
      if (item.axis === "x") road(mid, item.fixed, span, true);
      else road(item.fixed, mid, span, false);
    }

    const halfRoad = 2.6;
    const zones = [
      { minX: bankSpot.x - 40, maxX: bankSpot.x + 40, minZ: bankSpot.z - 40, maxZ: bankSpot.z + 40 },
      ...arterials.map((item) =>
        item.axis === "x"
          ? { minX: item.min, maxX: item.max, minZ: item.fixed - halfRoad, maxZ: item.fixed + halfRoad }
          : { minX: item.fixed - halfRoad, maxX: item.fixed + halfRoad, minZ: item.min, maxZ: item.max },
      ),
    ];
    function onStrip(x: number, z: number, pad: number) {
      return zones.some((zone) => x > zone.minX - pad && x < zone.maxX + pad && z > zone.minZ - pad && z < zone.maxZ + pad) || riverPoint(x, z, pad) !== null;
    }
    function shoveOut(spot: { x: number; z: number }, pad: number) {
      for (let step = 0; step < 4; step += 1) {
        for (const zone of zones) {
          const minX = zone.minX - pad;
          const maxX = zone.maxX + pad;
          const minZ = zone.minZ - pad;
          const maxZ = zone.maxZ + pad;
          if (spot.x <= minX || spot.x >= maxX || spot.z <= minZ || spot.z >= maxZ) continue;
          const left = spot.x - minX;
          const right = maxX - spot.x;
          const down = spot.z - minZ;
          const up = maxZ - spot.z;
          const nearest = Math.min(left, right, down, up);
          if (nearest === left) spot.x = minX;
          else if (nearest === right) spot.x = maxX;
          else if (nearest === down) spot.z = minZ;
          else spot.z = maxZ;
          spot.x = Math.min(LIMIT, Math.max(-LIMIT, spot.x));
          spot.z = Math.min(LIMIT, Math.max(-LIMIT, spot.z));
        }
        const wet = riverPoint(spot.x, spot.z, pad);
        if (wet) {
          let nx = spot.x - wet.x;
          let nz = spot.z - wet.z;
          const len = Math.hypot(nx, nz) || 1;
          nx /= len;
          nz /= len;
          spot.x = Math.min(LIMIT, Math.max(-LIMIT, wet.x + nx * (wet.limit + 1)));
          spot.z = Math.min(LIMIT, Math.max(-LIMIT, wet.z + nz * (wet.limit + 1)));
        }
      }
    }

    function tree(x: number, z: number) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.7, 5), new THREE.MeshLambertMaterial({ color: 0x6a4630 }));
      trunk.position.set(x, 0.4, z);
      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.3, 6), new THREE.MeshLambertMaterial({ color: 0x2f6b45 }));
      crown.position.set(x, 1.3, z);
      scene.add(trunk, crown);
    }
    let seed = 19;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 160; i += 1) {
      const x = (rnd() - 0.5) * 900;
      const z = (rnd() - 0.5) * 900;
      if (onStrip(x, z, 1)) continue;
      tree(x, z);
    }

    function house(x: number, z: number, tint: number, tall = 1.35, roof = 0x3d6b4f) {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, tall, 1.7), new THREE.MeshLambertMaterial({ color: tint }));
      body.position.y = tall / 2;
      const top = new THREE.Mesh(new THREE.ConeGeometry(1.25, 0.7, 4), new THREE.MeshLambertMaterial({ color: roof }));
      top.position.y = tall + 0.28;
      top.rotation.y = Math.PI / 4;
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.4, Math.min(0.8, tall * 0.55), 0.06), new THREE.MeshLambertMaterial({ color: 0x6a4630 }));
      door.position.set(0, Math.min(0.8, tall * 0.55) / 2, 0.86);
      const glassMat = new THREE.MeshLambertMaterial({ color: 0x9fd0ea });
      const winL = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.05), glassMat);
      winL.position.set(-0.55, tall * 0.62, 0.86);
      const winR = winL.clone();
      winR.position.x = 0.55;
      group.add(body, top, door, winL, winR);
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function tower(x: number, z: number, tint: number) {
      const group = new THREE.Group();
      const height = 7.4;
      const width = 7.6;
      const depth = 4.2;
      const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), new THREE.MeshLambertMaterial({ color: tint }));
      body.position.y = height / 2;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(width + 0.3, 0.32, depth + 0.2), new THREE.MeshLambertMaterial({ color: 0xe0b15a }));
      cap.position.y = height + 0.16;
      const glass = new THREE.Mesh(new THREE.BoxGeometry(width - 0.7, height * 0.72, 0.1), new THREE.MeshLambertMaterial({ color: 0x9fd0ea }));
      glass.position.set(0, height * 0.48, depth / 2 + 0.02);
      const drive = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 3.2), new THREE.MeshLambertMaterial({ color: 0x9aa3ad }));
      drive.position.set(0, 0.05, depth / 2 + 2.2);
      group.add(body, cap, glass, drive);
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function palmFarm(x: number, z: number) {
      const group = new THREE.Group();
      group.add(block(22, 0.1, 18, 0xc8d7b0, 0, 0.08, 0));
      for (let row = -2; row <= 2; row += 1) {
        for (let col = -2; col <= 2; col += 1) {
          if (row === 0 && col === 0) continue;
          const px = col * 3.6;
          const pz = row * 3.2;
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 2.4, 6), new THREE.MeshLambertMaterial({ color: 0x6a4630 }));
          trunk.position.set(px, 1.2, pz);
          const crown = new THREE.Mesh(new THREE.SphereGeometry(1.05, 8, 6), new THREE.MeshLambertMaterial({ color: 0x2f7a3e }));
          crown.position.set(px, 2.6, pz);
          group.add(trunk, crown);
        }
      }
      group.add(block(4.4, 2.2, 3.2, 0xf4efe4, 0, 1.2, 0));
      group.add(block(5, 0.2, 3.6, 0x8a6a32, 0, 2.4, 0));
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    let cityCar = 0;
    const CITY_CATS = ["Sedan", "SUV", "Sports Coupe", "Pickup", "Electric"] as const;
    function carMesh(color: number) {
      const cat = CITY_CATS[cityCar % CITY_CATS.length];
      const made = makeRealCar(cat === "Sports Coupe" ? "supercar" : "sedan", { color, plain: true });
      cityCar += 1;
      const mesh = made ? made.group : buildDetailedCarMesh({ category: cat, defaultColor: color }, color, true);
      mesh.scale.setScalar(0.72);
      return mesh;
    }

    const traffic: Array<{ mesh: THREE.Group; along: number; axis: "x" | "z"; fixed: number; speed: number; min: number; max: number }> = [];
    function addTraffic(axis: "x" | "z", fixed: number, min: number, max: number, count: number, color: number, direction: 1 | -1) {
      const span = max - min;
      for (let i = 0; i < count; i += 1) {
        const mesh = carMesh(color);
        const along = min + ((i + 0.5) / count) * span;
        mesh.position.set(axis === "x" ? along : fixed, 0, axis === "z" ? along : fixed);
        mesh.rotation.y = axis === "x" ? (direction > 0 ? Math.PI / 2 : -Math.PI / 2) : direction > 0 ? 0 : Math.PI;
        scene.add(mesh);
        traffic.push({ mesh, along, axis, fixed, speed: 0.16 * direction, min, max });
      }
    }
    addTraffic("x", 1.35, -400, 400, 9, 0xc4552a, 1);
    addTraffic("x", -1.35, -400, 400, 9, 0x245c78, -1);
    addTraffic("x", -88.65, -360, 360, 7, 0xf2c14e, 1);
    addTraffic("x", -91.35, -360, 360, 7, 0x1f6b45, -1);
    addTraffic("x", 91.35, -300, 380, 7, 0xc4552a, 1);
    addTraffic("x", 88.65, -300, 380, 7, 0x17241e, -1);
    addTraffic("x", 201.35, -300, 300, 6, 0xf2c14e, 1);
    addTraffic("x", 198.65, -300, 300, 6, 0x245c78, -1);
    addTraffic("z", -48.65, -360, 360, 7, 0x245c78, 1);
    addTraffic("z", -51.35, -360, 360, 7, 0xc4552a, -1);
    addTraffic("z", 81.35, -320, 360, 7, 0x17241e, 1);
    addTraffic("z", 78.65, -320, 360, 7, 0xf2c14e, -1);
    addTraffic("z", 151.35, -280, 260, 6, 0x1f6b45, 1);
    addTraffic("z", 148.65, -280, 260, 6, 0x6a4630, -1);
    addTraffic("z", 271.35, -260, 280, 5, 0xc4552a, 1);
    addTraffic("z", 268.65, -260, 280, 5, 0x245c78, -1);

    function parkAlong(axis: "x" | "z", fixed: number, from: number, to: number, step: number, color: number) {
      for (let along = from; along <= to; along += step) {
        const x = axis === "x" ? along : fixed;
        const z = axis === "z" ? along : fixed;
        if (onStrip(x, z, 0)) continue;
        const mesh = carMesh(color);
        mesh.position.set(x, 0, z);
        if (axis === "x") mesh.rotation.y = Math.PI / 2;
        scene.add(mesh);
      }
    }
    parkAlong("x", 5.6, -240, 240, 22, 0x6a4630);
    parkAlong("x", -5.6, -220, 220, 26, 0x245c78);
    parkAlong("x", -95.6, -180, 180, 24, 0xf2c14e);
    parkAlong("x", -84.4, -160, 160, 28, 0x17241e);
    parkAlong("z", -55.6, -180, 180, 24, 0xc4552a);
    parkAlong("z", -44.4, -160, 160, 28, 0x1f6b45);

    const posters: THREE.Texture[] = [];
    function billboard(x: number, z: number, turn: number, title: string, line: string, paint: string) {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = paint;
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = "#e0b15a";
      ctx.fillRect(0, 0, 512, 10);
      ctx.font = "700 54px sans-serif";
      ctx.fillStyle = "#fffaf2";
      ctx.fillText(title, 28, 110);
      ctx.font = "32px sans-serif";
      ctx.fillStyle = "#f3e2b8";
      ctx.fillText(line, 28, 170);
      const texture = new THREE.CanvasTexture(canvas);
      posters.push(texture);
      const group = new THREE.Group();
      const face = new THREE.Mesh(new THREE.PlaneGeometry(11, 5.2), new THREE.MeshLambertMaterial({ map: texture, side: THREE.DoubleSide }));
      face.position.y = 4.6;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 4.2, 6), new THREE.MeshLambertMaterial({ color: 0x6a4630 }));
      pole.position.y = 2.1;
      group.add(face, pole);
      group.position.set(x, 0, z);
      group.rotation.y = turn;
      scene.add(group);
    }

    const buildings: THREE.Object3D[] = [];
    const homes: THREE.Object3D[] = [];
    const labelNodes: Array<{ node: HTMLButtonElement; point: THREE.Vector3 }> = [];
    const dragged = { current: false };

    function pill(text: string, point: THREE.Vector3, placeId?: string) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = text;
      button.className = "pointer-events-auto absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full bg-white/95 px-1 py-px text-[8px] font-semibold leading-none text-[#17241e] shadow";
      if (placeId) {
        button.dataset.place = placeId;
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          if (dragged.current) return;
          onSelectRef.current(placeId);
        });
      } else {
        button.className += " bg-[#f3d27a] text-[#5a3d12]";
      }
      board.appendChild(button);
      labelNodes.push({ node: button, point });
    }

    const laidSpots = PLACES.map((place) => {
      const at = spot(place.x, place.y);
      return { id: place.id, x: at.x, z: at.z };
    });
    const clubs = new Set(["wetheral-strip", "cartel-lounge", "orange-room", "channel-garden", "zuma-grill", "ibari-village"]);
    const schools = new Set(["imsu", "futo", "fedpoly-nekede"]);
    const markets = new Set(["eke-ukwu", "relief-market", "ikenegbu-market", "owerri-mall"]);
    const restaurants = new Set(["donalds", "dominos", "cold-stone", "kilimanjaro", "november-5", "mangrove-grill", "josephs-pot", "the-warehouse"]);
    const landmark = new Set(["sam-mbakwe", "state-cid", "imsu", "futo", "fedpoly-nekede", "eke-ukwu", "relief-market", "ikenegbu-market", "owerri-mall", "heroes-square", "stadium", "owerri-west-palms", "cartel-beach", "heartland-resort", "nworie-park", "amusement-park", "city-bank", "teaching-hospital", "general-hospital", "umezuruike-hospital", "st-davids", "shelly-hospital", "imo-specialist"]);
    const roadside = new Set(["mama-nkechi", "feedwell"]);
    const phoneShops = new Set(["anonymous-gadgets", "sugar-gadgets", "buc-phones", "elion-phones", "ocha-gadgets", "maxii-gadgets", "easy-life", "gadgets-plug"]);
    const pinned = new Set(["car-stand", "assumpta-cathedral", "sam-mbakwe", "wetheral-strip", ...phoneShops]);
    const hotels = new Set(PLACES.filter((place) => place.kind === "hotel").map((place) => place.id));
    const pickups = new Set(PLACES.filter((place) => place.kind === "pickup").map((place) => place.id));
    const kindOf = new Map(PLACES.map((place) => [place.id, place.kind]));
    function footOf(id: string) {
      const kind = kindOf.get(id) ?? "public";
      if (id === "sam-mbakwe") return { hx: 100, hz: 72 };
      if (id === "everyday") return { hx: 12, hz: 10 };
      if (id === "assumpta-cathedral") return { hx: 26, hz: 20 };
      if (schools.has(id)) return { hx: 48, hz: 36 };
      if (id === "stadium" || id === "heroes-square") return { hx: 22, hz: 18 };
      if (id === "owerri-west-palms") return { hx: 16, hz: 14 };
      if (id === "city-bank") return { hx: 14, hz: 12 };
      if (id === "wetheral-strip") return { hx: 18, hz: 14 };
      if (id === "owerri-mall") return { hx: 20, hz: 16 };
      if (id === "relief-market" || id === "eke-ukwu") return { hx: 26, hz: 20 };
      if (kind === "health") return { hx: 14, hz: 11 };
      if (kind === "market") return { hx: 14, hz: 11 };
      if (kind === "hotel") return { hx: 7, hz: 7 };
      if (kind === "nightlife") return { hx: 13, hz: 11 };
      if (kind === "pickup") return { hx: 24, hz: 16 };
      if (kind === "home") return { hx: 8, hz: 8 };
      if (restaurants.has(id) || id === "crunchies" || id === "mbari" || id === "the-warehouse") return { hx: 10, hz: 8 };
      if (phoneShops.has(id) || roadside.has(id)) return { hx: 3.2, hz: 3.2 };
      if (id === "car-stand") return { hx: 10, hz: 8 };
      return { hx: 8, hz: 7 };
    }
    function boxesClash(ax: number, az: number, ahx: number, ahz: number, bx: number, bz: number, bhx: number, bhz: number, gap: number) {
      return Math.abs(ax - bx) < ahx + bhx + gap && Math.abs(az - bz) < ahz + bhz + gap;
    }
    for (let pass = 0; pass < 36; pass += 1) {
      for (let i = 0; i < laidSpots.length; i += 1) {
        for (let j = i + 1; j < laidSpots.length; j += 1) {
          if (pinned.has(laidSpots[i].id) || pinned.has(laidSpots[j].id)) continue;
          const fa = footOf(laidSpots[i].id);
          const fb = footOf(laidSpots[j].id);
          const gap = 10;
          if (!boxesClash(laidSpots[i].x, laidSpots[i].z, fa.hx, fa.hz, laidSpots[j].x, laidSpots[j].z, fb.hx, fb.hz, gap)) continue;
          let dx = laidSpots[j].x - laidSpots[i].x;
          let dz = laidSpots[j].z - laidSpots[i].z;
          const dist = Math.hypot(dx, dz) || 0.01;
          const need = Math.max(fa.hx + fb.hx, fa.hz + fb.hz) + gap;
          const push = (need - dist) / 2;
          dx /= dist;
          dz /= dist;
          laidSpots[i].x = Math.min(LIMIT, Math.max(-LIMIT, laidSpots[i].x - dx * push));
          laidSpots[i].z = Math.min(LIMIT, Math.max(-LIMIT, laidSpots[i].z - dz * push));
          laidSpots[j].x = Math.min(LIMIT, Math.max(-LIMIT, laidSpots[j].x + dx * push));
          laidSpots[j].z = Math.min(LIMIT, Math.max(-LIMIT, laidSpots[j].z + dz * push));
        }
      }
      for (const item of laidSpots) {
        if (pinned.has(item.id)) continue;
        const foot = footOf(item.id);
        shoveOut(item, Math.max(foot.hx, foot.hz) + 4);
      }
    }
    const shoulders = arterials;
    for (const spot of laidSpots) {
      if (!roadside.has(spot.id)) continue;
      let bestX = spot.x;
      let bestZ = spot.z;
      let best = Infinity;
      for (const road of shoulders) {
        if (road.axis === "x") {
          const along = Math.min(road.max, Math.max(road.min, spot.x));
          const dist = Math.abs(spot.z - road.fixed);
          if (dist < best) {
            best = dist;
            const side = spot.z >= road.fixed ? 1 : -1;
            bestX = along;
            bestZ = road.fixed + side * 8;
          }
        } else {
          const along = Math.min(road.max, Math.max(road.min, spot.z));
          const dist = Math.abs(spot.x - road.fixed);
          if (dist < best) {
            best = dist;
            const side = spot.x >= road.fixed ? 1 : -1;
            bestX = road.fixed + side * 8;
            bestZ = along;
          }
        }
      }
      for (let step = 0; step < 14 && onStrip(bestX, bestZ, 2); step += 1) {
        if (Math.abs(bestZ) % 90 < 20) bestX += 8;
        else bestZ += 8;
      }
      spot.x = Math.min(LIMIT, Math.max(-LIMIT, bestX));
      spot.z = Math.min(LIMIT, Math.max(-LIMIT, bestZ));
    }
    const shops = laidSpots.filter((spot) => roadside.has(spot.id));
    for (let pass = 0; pass < 8; pass += 1) {
      for (let i = 0; i < shops.length; i += 1) {
        for (let j = i + 1; j < shops.length; j += 1) {
          let dx = shops[j].x - shops[i].x;
          let dz = shops[j].z - shops[i].z;
          const dist = Math.hypot(dx, dz) || 0.01;
          if (dist >= 14) continue;
          const push = (14 - dist) / 2;
          dx /= dist;
          dz /= dist;
          shops[i].x -= dx * push;
          shops[i].z -= dz * push;
          shops[j].x += dx * push;
          shops[j].z += dz * push;
        }
      }
    }
    const futoSpot = laidSpots.find((item) => item.id === "futo");
    const gateSpot = laidSpots.find((item) => item.id === "campus-gate");
    if (futoSpot && gateSpot) {
      gateSpot.x = futoSpot.x + 56;
      gateSpot.z = futoSpot.z;
    }
    const laid = new Map(laidSpots.map((item) => [item.id, item]));
    const keepClear: Array<{ x: number; z: number; hx: number; hz: number }> = [];
    function hitsRoad(x: number, z: number, hx: number, hz: number) {
      const pad = 2.4;
      const minX = x - hx - pad;
      const maxX = x + hx + pad;
      const minZ = z - hz - pad;
      const maxZ = z + hz + pad;
      if (zones.some((zone) => minX < zone.maxX && maxX > zone.minX && minZ < zone.maxZ && maxZ > zone.minZ)) return true;
      return riverPoint(x, z, Math.max(hx, hz) + pad) !== null;
    }
    function parkOffRoad(spot: { x: number; z: number }, hx: number, hz: number) {
      if (!hitsRoad(spot.x, spot.z, hx, hz)) return;
      const baseX = spot.x;
      const baseZ = spot.z;
      for (let ring = 1; ring <= 14; ring += 1) {
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]] as Array<[number, number]>) {
          const x = Math.min(LIMIT, Math.max(-LIMIT, baseX + dx * 12 * ring));
          const z = Math.min(LIMIT, Math.max(-LIMIT, baseZ + dz * 12 * ring));
          if (hitsRoad(x, z, hx, hz)) continue;
          spot.x = x;
          spot.z = z;
          return;
        }
      }
    }
    const church = laid.get("assumpta-cathedral");
    const mart = laid.get("everyday");
    const ibis = laid.get("ibis-royale");
    function onIbisLand(x: number, z: number, hx: number, hz: number, self: string) {
      if (hitsRoad(x, z, hx, hz)) return false;
      return !laidSpots.some((other) => {
        if (other.id === self || other.id === "assumpta-cathedral" || other.id === "everyday") return false;
        const gap = other.id === "ibis-royale" ? 36 : other.id === "world-bank" ? 16 : 20;
        return Math.hypot(other.x - x, other.z - z) < gap;
      });
    }
    if (church && ibis) {
      let best: { x: number; z: number; score: number } | null = null;
      for (let dx = -72; dx <= 72; dx += 12) {
        for (let dz = -72; dz <= 72; dz += 12) {
          const x = ibis.x + dx;
          const z = ibis.z + dz;
          if (!onIbisLand(x, z, 26, 20, "assumpta-cathedral")) continue;
          const score = Math.hypot(dx, dz);
          if (score < 32 || score > 78) continue;
          if (!best || score < best.score) best = { x, z, score };
        }
      }
      if (best) {
        church.x = best.x;
        church.z = best.z;
      } else {
        church.x = ibis.x;
        church.z = ibis.z - 52;
        parkOffRoad(church, 26, 20);
      }
      keepClear.push({ x: church.x, z: church.z, hx: 26, hz: 20 });
    } else if (church) {
      parkOffRoad(church, 26, 20);
      keepClear.push({ x: church.x, z: church.z, hx: 26, hz: 20 });
    }
    if (church && mart && ibis) {
      let best: { x: number; z: number; score: number } | null = null;
      for (let dx = -56; dx <= 56; dx += 10) {
        for (let dz = -56; dz <= 56; dz += 10) {
          const x = church.x + dx;
          const z = church.z + dz;
          if (Math.hypot(dx, dz) < 40) continue;
          if (!onIbisLand(x, z, 12, 10, "everyday")) continue;
          const score = Math.hypot(x - ibis.x, z - ibis.z);
          if (score > 90) continue;
          if (!best || score < best.score) best = { x, z, score };
        }
      }
      if (best) {
        mart.x = best.x;
        mart.z = best.z;
      } else {
        mart.x = church.x + 44;
        mart.z = church.z;
      }
      parkOffRoad(mart, 12, 10);
      keepClear.push({ x: mart.x, z: mart.z, hx: 12, hz: 10 });
    } else if (mart) {
      parkOffRoad(mart, 12, 10);
      keepClear.push({ x: mart.x, z: mart.z, hx: 12, hz: 10 });
    }
    function roadSpan(axis: "x" | "z", fixed: number, from: number, to: number) {
      let cuts: Array<[number, number]> = [[Math.min(from, to), Math.max(from, to)]];
      for (const box of keepClear) {
        const next: Array<[number, number]> = [];
        for (const [start, end] of cuts) {
          const crosses = axis === "x" ? Math.abs(fixed - box.z) <= box.hz : Math.abs(fixed - box.x) <= box.hx;
          if (!crosses) {
            next.push([start, end]);
            continue;
          }
          const cutL = axis === "x" ? box.x - box.hx : box.z - box.hz;
          const cutR = axis === "x" ? box.x + box.hx : box.z + box.hz;
          if (start < cutL) next.push([start, Math.min(end, cutL)]);
          if (end > cutR) next.push([Math.max(start, cutR), end]);
        }
        cuts = next.filter(([start, end]) => end - start > 6);
      }
      for (const [start, end] of cuts) {
        const mid = (start + end) / 2;
        const len = end - start;
        if (axis === "x") road(mid, fixed, len, true);
        else road(fixed, mid, len, false);
        if (axis === "x") zones.push({ minX: start, maxX: end, minZ: fixed - halfRoad, maxZ: fixed + halfRoad });
        else zones.push({ minX: fixed - halfRoad, maxX: fixed + halfRoad, minZ: start, maxZ: end });
      }
    }
    function schoolApproach(cx: number, cz: number) {
      const gx = cx + 50;
      const gz = cz;
      let bestX = gx + 40;
      let bestZ = gz;
      let best = Infinity;
      for (const item of arterials) {
        if (item.axis === "z" && item.fixed < gx - 2) continue;
        const x = item.axis === "z" ? item.fixed : Math.min(item.max, Math.max(gx, item.min));
        const z = item.axis === "x" ? item.fixed : Math.min(item.max, Math.max(item.min, gz));
        const dist = Math.abs(x - gx) + Math.abs(z - gz);
        if (dist < best) {
          best = dist;
          bestX = x;
          bestZ = z;
        }
      }
      const joinX = Math.max(gx, bestX);
      roadSpan("x", gz, gx, joinX);
      if (Math.abs(bestZ - gz) > 4) roadSpan("z", joinX, gz, bestZ);
    }
    for (const id of schools) {
      const at = laid.get(id);
      if (at) schoolApproach(at.x, at.z);
    }
    const strip = laid.get("wetheral-strip");
    const mall = laid.get("owerri-mall");
    if (strip && mall) {
      let best: { x: number; z: number; score: number } | null = null;
      for (let x = 294; x <= 340; x += 6) {
        for (let z = mall.z - 16; z <= mall.z + 36; z += 6) {
          if (hitsRoad(x, z, 20, 16)) continue;
          if (Math.abs(x - mall.x) < 46 && Math.abs(z - mall.z) < 36) continue;
          const crowded = laidSpots.some((other) => other.id !== "wetheral-strip" && Math.hypot(other.x - x, other.z - z) < 28);
          if (crowded) continue;
          const score = x - 294 + Math.abs(z - (mall.z + 10)) * 0.35;
          if (!best || score < best.score) best = { x, z, score };
        }
      }
      if (best) {
        strip.x = best.x;
        strip.z = best.z;
      } else {
        strip.x = 306;
        strip.z = mall.z + 10;
        parkOffRoad(strip, 20, 16);
      }
    }
    const crunch = laid.get("crunchies");
    const gallery = laid.get("mbari");
    if (crunch) parkOffRoad(crunch, 10, 8);
    if (gallery) parkOffRoad(gallery, 12, 9);
    const hospitalAt = laid.get("general-hospital");
    const palmsAt = laid.get("owerri-west-palms");
    const stadiumAt = laid.get("stadium");
    if (hospitalAt && palmsAt && stadiumAt) {
      palmsAt.x = hospitalAt.x - 46;
      palmsAt.z = hospitalAt.z - 28;
      parkOffRoad(palmsAt, 16, 14);
      stadiumAt.x = palmsAt.x + 38;
      stadiumAt.z = palmsAt.z - 6;
      parkOffRoad(stadiumAt, 22, 18);
      keepClear.push({ x: palmsAt.x, z: palmsAt.z, hx: 16, hz: 14 });
      keepClear.push({ x: stadiumAt.x, z: stadiumAt.z, hx: 22, hz: 18 });
    } else if (stadiumAt) {
      parkOffRoad(stadiumAt, 22, 18);
      keepClear.push({ x: stadiumAt.x, z: stadiumAt.z, hx: 22, hz: 18 });
    }
    for (const item of laidSpots) {
      if (!hotels.has(item.id)) continue;
      const foot = footOf(item.id);
      parkOffRoad(item, foot.hx, foot.hz);
      keepClear.push({ x: item.x, z: item.z, hx: foot.hx, hz: foot.hz });
    }
    const polyAt = laid.get("fedpoly-nekede");
    const polyX = polyAt?.x ?? spot(26, 88).x;
    const polyZ = polyAt?.z ?? spot(26, 88).z;
    const RICE_SCALE = 2.8;
    const riceHx = 12 * RICE_SCALE + 2;
    const riceHz = 9 * RICE_SCALE + 2;
    const riceAt = { x: polyX - 48 - riceHx - 6, z: polyZ + 8 };
    for (let step = 0; step < 14; step += 1) {
      const wet = riverPoint(riceAt.x, riceAt.z, Math.max(riceHx, riceHz) + 4) !== null;
      const road = hitsRoad(riceAt.x, riceAt.z, riceHx, riceHz);
      if (!wet && !road) break;
      if (step % 2 === 0) riceAt.z += 8;
      else riceAt.x -= 8;
    }
    const farmBoxes = [
      { x: -320, z: 260, hx: 50, hz: 38 },
      { x: riceAt.x, z: riceAt.z, hx: riceHx, hz: riceHz },
    ];
    function hitsPeer(self: string, x: number, z: number, hx: number, hz: number) {
      if (farmBoxes.some((farm) => boxesClash(x, z, hx, hz, farm.x, farm.z, farm.hx, farm.hz, 10))) return true;
      return laidSpots.some((other) => {
        if (other.id === self) return false;
        const o = footOf(other.id);
        return boxesClash(x, z, hx, hz, other.x, other.z, o.hx, o.hz, 8);
      });
    }
    function settleBox(item: { id: string; x: number; z: number }) {
      const { hx, hz } = footOf(item.id);
      if (!hitsRoad(item.x, item.z, hx, hz) && !hitsPeer(item.id, item.x, item.z, hx, hz)) return;
      const ox = item.x;
      const oz = item.z;
      const dirs: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
      for (let ring = 1; ring <= 20; ring += 1) {
        const step = 10 * ring;
        for (const [dx, dz] of dirs) {
          const x = Math.min(LIMIT, Math.max(-LIMIT, ox + dx * step));
          const z = Math.min(LIMIT, Math.max(-LIMIT, oz + dz * step));
          if (hitsRoad(x, z, hx, hz) || hitsPeer(item.id, x, z, hx, hz)) continue;
          item.x = x;
          item.z = z;
          return;
        }
      }
    }
    for (let pass = 0; pass < 12; pass += 1) {
      for (const item of laidSpots) {
        if (pinned.has(item.id)) continue;
        settleBox(item);
      }
      for (let i = 0; i < laidSpots.length; i += 1) {
        for (let j = i + 1; j < laidSpots.length; j += 1) {
          if (pinned.has(laidSpots[i].id) || pinned.has(laidSpots[j].id)) continue;
          const a = laidSpots[i];
          const b = laidSpots[j];
          const fa = footOf(a.id);
          const fb = footOf(b.id);
          if (!boxesClash(a.x, a.z, fa.hx, fa.hz, b.x, b.z, fb.hx, fb.hz, 8)) continue;
          let dx = b.x - a.x;
          let dz = b.z - a.z;
          const dist = Math.hypot(dx, dz) || 0.01;
          const need = Math.max(fa.hx + fb.hx, fa.hz + fb.hz) + 8;
          const push = (need - dist) / 2 + 0.5;
          dx /= dist;
          dz /= dist;
          a.x = Math.min(LIMIT, Math.max(-LIMIT, a.x - dx * push));
          a.z = Math.min(LIMIT, Math.max(-LIMIT, a.z - dz * push));
          b.x = Math.min(LIMIT, Math.max(-LIMIT, b.x + dx * push));
          b.z = Math.min(LIMIT, Math.max(-LIMIT, b.z + dz * push));
        }
      }
      for (const item of laidSpots) {
        if (pinned.has(item.id)) continue;
        const foot = footOf(item.id);
        shoveOut(item, Math.max(foot.hx, foot.hz) + 4);
      }
    }
    const martAfter = laid.get("everyday");
    if (martAfter) parkOffRoad(martAfter, 12, 10);
    for (const id of ["relief-market", "owerri-mall", "eke-ukwu"]) {
      const at = laid.get(id);
      if (!at) continue;
      const foot = footOf(id);
      parkOffRoad(at, foot.hx, foot.hz);
    }
    for (const item of laidSpots) {
      if (pickups.has(item.id) || hotels.has(item.id) || item.id === "channel-garden") {
        const foot = footOf(item.id);
        keepClear.push({ x: item.x, z: item.z, hx: foot.hx, hz: foot.hz });
      }
    }
    const airportAt = laid.get("sam-mbakwe");
    if (airportAt) keepClear.push({ x: airportAt.x, z: airportAt.z, hx: 100, hz: 72 });
    for (const id of ["relief-market", "owerri-mall", "eke-ukwu"]) {
      const at = laid.get(id);
      if (!at) continue;
      const foot = footOf(id);
      keepClear.push({ x: at.x, z: at.z, hx: foot.hx, hz: foot.hz });
    }
    keepClear.push({ x: riceAt.x, z: riceAt.z, hx: riceHx, hz: riceHz });
    function nearAirport(x: number, z: number) {
      if (!airportAt) return false;
      return Math.abs(x - airportAt.x) < 100 && Math.abs(z - airportAt.z) < 72;
    }
    function avenue(axis: "x" | "z", fixed: number, from: number, to: number, step: number, side: number) {
      for (let along = from; along <= to; along += step) {
        const x = axis === "x" ? along : fixed + side;
        const z = axis === "z" ? along : fixed + side;
        if (onStrip(x, z, 0.2) || nearAirport(x, z)) continue;
        tree(x, z);
      }
    }
    for (const side of [9, -9]) {
      for (const item of arterials) avenue(item.axis, item.fixed, item.min, item.max, 12, side);
    }
    function banks(pts: { x: number; z: number }[], half: number) {
      for (let i = 1; i < pts.length - 1; i += 2) {
        const prev = pts[i - 1];
        const next = pts[i + 1];
        let tx = next.x - prev.x;
        let tz = next.z - prev.z;
        const len = Math.hypot(tx, tz) || 1;
        tx /= len;
        tz /= len;
        const off = half + 8;
        for (const side of [1, -1]) {
          const x = pts[i].x - tz * off * side;
          const z = pts[i].z + tx * off * side;
          if (onStrip(x, z, 0.4)) continue;
          tree(x, z);
        }
      }
    }
    banks(nworiePts, 10);
    banks(otamiriPts, 10);

    function estate(cx: number, cz: number, rows: number, cols: number, gap = 3.15) {
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          if (row === Math.floor(rows / 2) && col === Math.floor(cols / 2)) continue;
          const x = cx + (col - cols / 2) * gap;
          const z = cz + (row - rows / 2) * gap;
          const crowded = laidSpots.some((spot) => {
            const dist = Math.hypot(x - spot.x, z - spot.z);
            if (spot.id === "sam-mbakwe") return Math.abs(x - spot.x) < 100 && Math.abs(z - spot.z) < 72;
            if (clubs.has(spot.id)) return dist < 16;
            if (schools.has(spot.id)) return Math.abs(x - spot.x) < 54 && Math.abs(z - spot.z) < 42;
            if (markets.has(spot.id)) return dist < 34;
            if (restaurants.has(spot.id)) return dist < 18;
            if (roadside.has(spot.id)) return dist < 8;
            if (spot.id === "assumpta-cathedral") return dist < 32;
            if (spot.id === "everyday" || phoneShops.has(spot.id)) return dist < 12;
            if (landmark.has(spot.id)) return dist < 18;
            if (hotels.has(spot.id)) return Math.abs(x - spot.x) < 10 && Math.abs(z - spot.z) < 6;
            return false;
          });
          if (onStrip(x, z, 2) || crowded || Math.abs(x - riceAt.x) < riceHx && Math.abs(z - riceAt.z) < riceHz) continue;
          house(x, z, 0xf4efe4, 1.15, 0x2f6b45);
        }
      }
    }
    const newOwerri = laid.get("new-owerri");
    const wetheral = laid.get("wetheral-strip");
    const ikenegbu = laid.get("ikenegbu");
    const worldBank = laid.get("world-bank");
    const aladinma = laid.get("aladinma");
    if (newOwerri) {
      estate(newOwerri.x + 34, newOwerri.z, 8, 10);
      estate(newOwerri.x + 34, newOwerri.z + 32, 5, 7);
    }
    if (wetheral) {
      estate(wetheral.x - 32, wetheral.z + 8, 7, 9);
      estate(wetheral.x - 8, wetheral.z - 28, 5, 6);
    }
    if (ikenegbu) {
      estate(ikenegbu.x + 34, ikenegbu.z, 10, 12, 2.7);
      estate(ikenegbu.x + 34, ikenegbu.z + 32, 7, 9, 2.7);
      estate(ikenegbu.x - 6, ikenegbu.z + 26, 6, 7, 2.7);
    }
    if (worldBank) estate(worldBank.x - 28, worldBank.z, 5, 7);
    if (aladinma) {
      estate(aladinma.x + 34, aladinma.z, 10, 12, 2.7);
      estate(aladinma.x + 6, aladinma.z + 32, 7, 8, 2.7);
      estate(aladinma.x + 38, aladinma.z - 28, 6, 7, 2.7);
    }
    function placeSign(x: number, z: number, turn: number, title: string, line: string, paint: string) {
      let px = x;
      let pz = z;
      const step = 8;
      const options = [
        [step, 0],
        [-step, 0],
        [0, step],
        [0, -step],
        [step, step],
        [-step, step],
        [step, -step],
        [-step, -step],
      ];
      for (let n = 1; n <= 5 && onStrip(px, pz, 2); n += 1) {
        for (const [dx, dz] of options) {
          const qx = x + dx * n;
          const qz = z + dz * n;
          if (!onStrip(qx, qz, 2)) {
            px = qx;
            pz = qz;
            break;
          }
        }
      }
      billboard(px, pz, turn, title, line, paint);
    }
    function byPlace(id: string, dx: number, dz: number, turn: number, title: string, line: string, paint: string) {
      const at = laid.get(id);
      if (!at) return;
      placeSign(at.x + dx, at.z + dz, turn, title, line, paint);
    }
    byPlace("wetheral-strip", 36, -18, 0.4, "Wetheral night", "Clubs open till dawn", "#7a2e1e");
    byPlace("wetheral-strip", -36, 22, 0.8, "Ad board", "Buy this slot", "#a9782a");
    byPlace("futo", 78, 16, 0.2, "Busimo to campus", "IMSU, FUTO, Nekede", "#143d2c");
    byPlace("campus-gate", 14, 16, 0.5, "Busimo stop", "Campus and the markets", "#143d2c");
    byPlace("mama-nkechi", 14, 10, -0.4, "Mama Nkechi", "Rice, stew, and gist", "#8a5a2a");
    byPlace("new-owerri", 18, -16, 0.6, "New Owerri", "Flats and duplexes", "#1f6b45");
    byPlace("sam-mbakwe", 130, 24, -0.3, "Sam Mbakwe", "Flights out of Imo", "#245c78");
    byPlace("sam-mbakwe", 130, -36, 0.2, "Airport road", "Seen by every flight", "#143d2c");
    byPlace("state-cid", 28, 8, 0.7, "State CID", "A big compound", "#1d4a66");
    byPlace("state-cid", -28, 18, -0.5, "Port Harcourt Rd", "Your brand here", "#7a2e1e");
    byPlace("imsu", 72, -20, -0.6, "Campus life", "IMSU · FUTO · Nekede", "#1f6b45");
    byPlace("heroes-square", 26, 18, 0.3, "Heroes Square", "Open ground, every day", "#1d4a66");
    byPlace("heartland-resort", 26, 12, 0.6, "Heartland", "Beach, games, and grill", "#7a2e1e");
    byPlace("city-bank", 28, 18, 0.4, "City bank", "Shifts on the centre road", "#245c78");
    byPlace("aladinma", 16, 14, -0.4, "Aladinma", "Flats on this side", "#1f6b45");
    byPlace("ikenegbu", 18, -16, -0.2, "Ikenegbu rooms", "The cheap side of town", "#8a5a2a");
    byPlace("eke-ukwu", 40, 22, 0.5, "Ad board", "This face is for sale", "#a9782a");
    placeSign(-320, 312, 0.2, "Egbu farms", "Cassava every Saturday", "#3d6b4f");
    placeSign(riceAt.x, riceAt.z + riceHz + 6, 0.1, "Nekede rice", "Behind Federal Polytechnic Nekede", "#143d2c");
    const otamiriSign = otamiriPts[52];
    const otamiriBack = otamiriPts[49];
    const otamiriFore = otamiriPts[55];
    let otx = otamiriFore.x - otamiriBack.x;
    let otz = otamiriFore.z - otamiriBack.z;
    const otLen = Math.hypot(otx, otz) || 1;
    otx /= otLen;
    otz /= otLen;
    placeSign(otamiriSign.x - otz * 28, otamiriSign.z + otx * 28, Math.atan2(otx, otz), "Otamiri", "Cross on the bridge", "#245c78");

    function block(w: number, h: number, d: number, color: number, x: number, y: number, z: number) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
      mesh.position.set(x, y, z);
      return mesh;
    }

    function schoolYard(x: number, z: number) {
      const group = new THREE.Group();
      group.add(block(24, 0.12, 18, 0xc8d7b0, 0, 0.1, 0));
      group.add(block(24, 2.2, 0.45, 0xe7dcc8, 0, 1.2, -9));
      group.add(block(24, 2.2, 0.45, 0xe7dcc8, 0, 1.2, 9));
      group.add(block(0.45, 2.2, 18, 0xe7dcc8, -12, 1.2, 0));
      group.add(block(0.45, 2.2, 6.2, 0xe7dcc8, 12, 1.2, -5.8));
      group.add(block(0.45, 2.2, 6.2, 0xe7dcc8, 12, 1.2, 5.8));
      group.add(block(0.5, 3.1, 0.5, 0xe0b15a, 12, 1.6, -1.7));
      group.add(block(0.5, 3.1, 0.5, 0xe0b15a, 12, 1.6, 1.7));
      group.add(block(8.2, 0.06, 1.5, 0xd9c7a2, 7.2, 0.16, 0));
      const halls: [number, number, number, number, number, number, number][] = [
        [-7.2, -5.2, 3.4, 2.6, 2.0, 0xf7f1e6, 0xc4552a],
        [-2.4, -5.2, 3.2, 3.4, 2.0, 0xe7efe4, 0x245c3a],
        [2.6, -5.2, 3.2, 2.4, 2.0, 0xf3d27a, 0xe0b15a],
        [6.8, -4.8, 2.6, 4.2, 1.8, 0xd7c4a2, 0xc4552a],
        [-7.2, 0, 3.2, 2.4, 1.7, 0xf7f1e6, 0x1f6b45],
        [-7.2, 4.8, 3.4, 2.2, 2.0, 0xf7f1e6, 0x8a5a2a],
        [-2.4, 4.8, 3.2, 2.8, 2.0, 0xe7efe4, 0x245c78],
        [2.6, 4.8, 3.2, 2.0, 2.0, 0xf7f1e6, 0xc4552a],
        [6.6, 4.4, 2.8, 3.0, 1.8, 0xf3efe4, 0xe0b15a],
      ];
      for (const [sx, sz, w, h, d, color, roof] of halls) {
        group.add(block(w, h, d, color, sx, h / 2, sz));
        group.add(block(w + 0.3, 0.16, d + 0.3, roof, sx, h + 0.08, sz));
      }
      group.add(block(6, 0.08, 4, 0x3d8a4a, -2.2, 0.2, 0));
      const staff = carMesh(0x245c78);
      staff.position.set(8.4, 0, 2.4);
      const shuttle = carMesh(0xf2c14e);
      shuttle.position.set(8.4, 0, -2.4);
      group.add(staff, shuttle);
      group.scale.setScalar(4);
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function policeYard(x: number, z: number) {
      const group = new THREE.Group();
      group.add(block(22, 0.12, 16, 0xd9d3c4, 0, 0.1, 0));
      group.add(block(22, 1.5, 0.45, 0x245c78, 0, 0.85, -8));
      group.add(block(22, 1.5, 0.45, 0x245c78, 0, 0.85, 8));
      group.add(block(0.45, 1.5, 16, 0x245c78, -11, 0.85, 0));
      group.add(block(0.45, 1.5, 5.5, 0x245c78, 11, 0.85, -5));
      group.add(block(0.45, 1.5, 5.5, 0x245c78, 11, 0.85, 5));
      group.add(block(0.5, 2.6, 0.5, 0xe0b15a, 11, 1.4, -1.5));
      group.add(block(0.5, 2.6, 0.5, 0xe0b15a, 11, 1.4, 1.5));
      group.add(block(9, 4.2, 5, 0x1d4a66, -2, 2.2, -1.4));
      group.add(block(3.4, 2.4, 3.2, 0x17384c, 4.5, 1.3, -2.2));
      const one = carMesh(0x17241e);
      one.position.set(-1, 0, 4);
      one.rotation.y = Math.PI / 2;
      const two = carMesh(0x245c78);
      two.position.set(2.2, 0, 4);
      two.rotation.y = Math.PI / 2;
      const three = carMesh(0x17241e);
      three.position.set(5.4, 0, 3.4);
      group.add(one, two, three);
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function pickupYard(x: number, z: number) {
      const group = new THREE.Group();
      group.add(block(36, 0.1, 14, 0x4a514c, 0, 0.06, 0));
      group.add(block(36, 0.16, 2.4, 0xcfcac0, 0, 0.12, -5.6));
      group.add(block(36, 0.16, 2.2, 0xcfcac0, 0, 0.12, 5.4));
      group.add(block(0.18, 0.04, 13, 0xf2c14e, 0, 0.14, 0));
      for (let d = -15; d <= 15; d += 3.2) group.add(block(1.6, 0.03, 0.14, 0xf4efe4, d, 0.14, 0));
      const shopColors = [0xc4552a, 0x1f6b45, 0x245c78, 0x8c2438, 0xe0b15a, 0x7a3e6d];
      for (let i = 0; i < 6; i += 1) {
        const sx = -14 + i * 5.6;
        group.add(block(4.6, 3.4, 3.2, 0xf4efe4, sx, 1.8, -7.4));
        group.add(block(4.8, 0.22, 3.4, shopColors[i], sx, 3.6, -7.4));
        group.add(block(2.2, 1.2, 0.08, 0x9fd0ea, sx, 2.1, -5.76));
        group.add(block(0.9, 1.8, 0.08, 0x1a140c, sx - 1.4, 1.0, -5.76));
        group.add(block(0.12, 3.4, 0.12, 0x2a2a31, sx, 1.8, -4.2));
        group.add(block(0.5, 0.12, 0.5, 0xffe0a0, sx, 3.55, -4.2));
      }
      const paints = [0xc4552a, 0x17241e, 0xf2c14e, 0x245c78];
      paints.forEach((color, i) => {
        const car = carMesh(color);
        car.position.set(-12 + i * 7.4, 0, 3.4);
        car.rotation.y = Math.PI / 2;
        group.add(car);
      });
      const shirts = [0xc4552a, 0x7a3e6d, 0xf2c14e, 0x8c2438, 0x1f6b45, 0x245c78];
      shirts.forEach((shirt, i) => {
        const girl = beachPerson(shirt, [0xf0c7a4, 0xe0b08a, 0xf3d0b5][i % 3], 0x1a140c, 0x1a1a1a);
        girl.person.position.set(-13 + i * 5.2, 0, -3.6);
        girl.person.rotation.y = 0.2;
        group.add(girl.person);
      });
      group.scale.setScalar(1.15);
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function airportYard(x: number, z: number) {
      const group = new THREE.Group();
      group.add(block(48, 0.1, 34, 0xd5d8dc, 0, 0.08, 0));
      group.add(block(5.2, 0.16, 30, 0x3a3f46, 14, 0.16, 1));
      for (let dash = -13; dash <= 13; dash += 2.4) group.add(block(0.35, 0.2, 1.1, 0xf4efe4, 14, 0.22, dash + 1));
      group.add(block(16, 3.2, 5, 0xf7f1e6, -12, 1.7, -10));
      group.add(block(10, 1.2, 3.4, 0xe7e2d6, -12, 0.7, -6));
      group.add(block(2, 8, 2, 0x245c78, -2, 4.1, -10));
      group.add(block(2.8, 1.2, 2.8, 0x9fd0ea, -2, 8.2, -10));
      group.add(block(18, 0.12, 12, 0xc5ccd4, -8, 0.14, 8));
      group.add(block(18, 3.6, 0.35, 0xe7eef2, -8, 1.9, 13.8));
      group.add(block(0.35, 3.6, 12, 0xe7eef2, -16.8, 1.9, 8));
      group.add(block(0.35, 3.6, 12, 0xe7eef2, 0.8, 1.9, 8));
      group.add(block(18, 0.28, 12.4, 0x8aa0b5, -8, 3.7, 8));
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.08, 16), new THREE.MeshLambertMaterial({ color: 0x245c78 }));
      pad.position.set(16, 0.16, -12);
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.1, 16), new THREE.MeshLambertMaterial({ color: 0xf4f7fb }));
      ring.position.set(16, 0.2, -12);
      group.add(pad, ring, block(0.28, 0.12, 1.6, 0x245c78, 16, 0.28, -12), block(1.2, 0.12, 0.28, 0x245c78, 16, 0.28, -12));

      function craft(px: number, pz: number, rot: number, scale: number, color: number, jet: boolean) {
        const plane = new THREE.Group();
        const skin = new THREE.MeshLambertMaterial({ color });
        const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.38 * scale, 0.42 * scale, 6.4 * scale, 10), skin);
        fuse.rotation.z = Math.PI / 2;
        fuse.position.y = 0.85 * scale;
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.38 * scale, 1.5 * scale, 10), skin);
        nose.rotation.z = -Math.PI / 2;
        nose.position.set(3.9 * scale, 0.85 * scale, 0);
        const wing = new THREE.Mesh(new THREE.BoxGeometry(2.1 * scale, 0.08 * scale, 7.2 * scale), new THREE.MeshLambertMaterial({ color: 0xd5dee8 }));
        wing.position.set(0.2 * scale, 0.78 * scale, 0);
        const fin = new THREE.Mesh(new THREE.BoxGeometry(1.15 * scale, 1.45 * scale, 0.08 * scale), new THREE.MeshLambertMaterial({ color: 0x1f6b45 }));
        fin.position.set(-2.7 * scale, 1.55 * scale, 0);
        const stab = new THREE.Mesh(new THREE.BoxGeometry(0.7 * scale, 0.06 * scale, 2.6 * scale), new THREE.MeshLambertMaterial({ color: 0xd5dee8 }));
        stab.position.set(-3 * scale, 0.95 * scale, 0);
        plane.add(fuse, nose, wing, fin, stab);
        if (jet) {
          for (const side of [-1.5, 1.5]) {
            const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * scale, 0.22 * scale, 1.3 * scale, 8), new THREE.MeshLambertMaterial({ color: 0x7d8b99 }));
            engine.rotation.z = Math.PI / 2;
            engine.position.set(0.5 * scale, 0.48 * scale, side * scale);
            plane.add(engine);
          }
        } else {
          const prop = new THREE.Mesh(new THREE.BoxGeometry(0.06 * scale, 0.08 * scale, 1.5 * scale), new THREE.MeshLambertMaterial({ color: 0x17241e }));
          prop.position.set(4.7 * scale, 0.85 * scale, 0);
          plane.add(prop);
        }
        plane.position.set(px, 0, pz);
        plane.rotation.y = rot;
        group.add(plane);
      }

      function helicopter(px: number, pz: number) {
        const heli = new THREE.Group();
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), new THREE.MeshLambertMaterial({ color: 0xf4f7fb }));
        body.scale.set(1.7, 0.75, 0.85);
        body.position.y = 0.7;
        const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 1.7, 6), new THREE.MeshLambertMaterial({ color: 0xe7eef2 }));
        boom.rotation.z = Math.PI / 2;
        boom.position.set(-1.35, 0.72, 0);
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.45, 6), new THREE.MeshLambertMaterial({ color: 0x17241e }));
        mast.position.y = 1.15;
        const rotorA = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.04, 0.14), new THREE.MeshLambertMaterial({ color: 0x243038 }));
        rotorA.position.y = 1.38;
        const rotorB = rotorA.clone();
        rotorB.rotation.y = Math.PI / 2;
        heli.add(body, boom, mast, rotorA, rotorB);
        heli.position.set(px, 0.25, pz);
        group.add(heli);
      }

      craft(14, 2, Math.PI / 2, 1, 0xf7fbfc, true);
      craft(-10, 6.5, 0.15, 0.85, 0xe7eef2, true);
      craft(-6, 9.2, -0.2, 0.48, 0xf2c14e, false);
      craft(-12, 10, 0.35, 0.42, 0xf4f7fb, false);
      helicopter(16, -12);
      group.scale.setScalar(4);
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function marketYard(x: number, z: number) {
      const group = new THREE.Group();
      group.add(block(48, 0.14, 34, 0xe7d7b8, 0, 0.1, 0));
      group.add(block(48, 0.9, 0.35, 0xc4a574, 0, 0.55, -17));
      group.add(block(48, 0.9, 0.35, 0xc4a574, 0, 0.55, 17));
      group.add(block(0.35, 0.9, 34, 0xc4a574, -24, 0.55, 0));
      group.add(block(0.35, 0.9, 12, 0xc4a574, 24, 0.55, -11));
      group.add(block(0.35, 0.9, 12, 0xc4a574, 24, 0.55, 11));
      const canopies = [0xc4552a, 0xf2c14e, 0x1f6b45, 0x245c78];
      for (let row = 0; row < 5; row += 1) {
        for (let col = 0; col < 7; col += 1) {
          const sx = -16 + col * 4.2;
          const sz = -10 + row * 3.6;
          group.add(block(3.6, 0.16, 2.4, canopies[(row + col) % canopies.length], sx, 1.7, sz));
          group.add(block(0.14, 1.5, 0.14, 0x6a4630, sx - 1.6, 0.85, sz - 1));
          group.add(block(0.14, 1.5, 0.14, 0x6a4630, sx + 1.6, 0.85, sz + 1));
        }
      }
      group.add(block(12, 5.2, 6, 0xf7f1e6, 8, 2.7, -11));
      group.add(block(12.4, 0.35, 6.4, 0xc4552a, 8, 5.4, -11));
      const park = [0xf2c14e, 0xc4552a, 0x17241e, 0x245c78, 0x1f6b45, 0xf4efe4];
      park.forEach((color, index) => {
        const car = carMesh(color);
        car.position.set(-14 + index * 3.4, 0, 12);
        group.add(car);
      });
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function mallYard(cx: number, cz: number) {
      const group = new THREE.Group();
      group.add(block(36, 0.12, 28, 0xd5d8dc, 0, 0.08, 0));
      group.add(block(36, 0.7, 0.3, 0x9aa3ad, 0, 0.45, -14));
      group.add(block(36, 0.7, 0.3, 0x9aa3ad, 0, 0.45, 14));
      group.add(block(0.3, 0.7, 28, 0x9aa3ad, -18, 0.45, 0));
      group.add(block(0.3, 0.7, 10, 0x9aa3ad, 18, 0.45, -9));
      group.add(block(0.3, 0.7, 10, 0x9aa3ad, 18, 0.45, 9));
      group.add(block(20, 8.2, 12, 0xf7fbfc, 0, 4.2, -2));
      group.add(block(20.4, 0.4, 12.4, 0x1f6b45, 0, 8.4, -2));
      group.add(block(9, 4.2, 0.12, 0x9fd0ea, 0, 3.4, 4.08));
      group.add(block(2.2, 3.2, 0.14, 0x143d2c, 0, 1.7, 4.14));
      const bays = [
        { ox: 0, oz: 9.2, rot: 0 },
        { ox: 0, oz: -11.2, rot: Math.PI },
        { ox: 13.4, oz: 1, rot: Math.PI / 2 },
        { ox: -13.4, oz: 1, rot: -Math.PI / 2 },
      ];
      const bay = bays.find((option) => !hitsRoad(cx + option.ox, cz + option.oz, 11, 5)) ?? bays[2];
      const paints = [0xf2c14e, 0xc4552a, 0x17241e, 0x245c78, 0x1f6b45, 0xf4efe4];
      const alongBay = bay.rot === 0 || Math.abs(bay.rot) === Math.PI;
      paints.forEach((color, index) => {
        const car = carMesh(color);
        const along = (index - 2.5) * 3.2;
        car.position.set(alongBay ? bay.ox + along : bay.ox, 0, alongBay ? bay.oz : bay.oz + along);
        car.rotation.y = bay.rot;
        group.add(car);
      });
      group.position.set(cx, 0, cz);
      scene.add(group);
      return group;
    }

    function field(x: number, z: number, label: string, scale = 4) {
      const group = new THREE.Group();
      group.add(block(24, 0.08, 18, 0x8a6a32, 0, 0.06, 0));
      group.add(block(24, 0.35, 0.28, 0xc4a574, 0, 0.2, -9));
      group.add(block(24, 0.35, 0.28, 0xc4a574, 0, 0.2, 9));
      group.add(block(0.28, 0.35, 18, 0xc4a574, -12, 0.2, 0));
      group.add(block(0.28, 0.35, 18, 0xc4a574, 12, 0.2, 0));
      for (let row = -7; row <= 7; row += 2) group.add(block(22, 0.32, 0.7, 0x3d8a4a, 0, 0.24, row));
      group.scale.setScalar(scale);
      group.position.set(x, 0, z);
      scene.add(group);
      pill(label, new THREE.Vector3(x, Math.max(3.2, scale), z));
    }
    field(-320, 260, "Egbu farmland · level 3");
    field(riceAt.x, riceAt.z, "Nekede rice · level 4", RICE_SCALE);

    function palmEstate(x: number, z: number) {
      const group = new THREE.Group();
      const width = 120;
      const depth = 88;
      group.add(block(width, 0.12, depth, 0x8a6a32, 0, 0.08, 0));
      group.add(block(width - 6, 0.08, depth - 6, 0x6d8a3e, 0, 0.14, 0));
      group.add(block(width, 1.3, 0.4, 0xe7dcc8, 0, 0.75, -depth / 2));
      group.add(block(width, 1.3, 0.4, 0xe7dcc8, 0, 0.75, depth / 2));
      group.add(block(0.4, 1.3, depth, 0xe7dcc8, -width / 2, 0.75, 0));
      group.add(block(0.4, 1.3, 28, 0xe7dcc8, width / 2, 0.75, -26));
      group.add(block(0.4, 1.3, 28, 0xe7dcc8, width / 2, 0.75, 26));
      group.add(block(0.5, 2.2, 0.5, 0xe0b15a, width / 2, 1.2, -6));
      group.add(block(0.5, 2.2, 0.5, 0xe0b15a, width / 2, 1.2, 6));
      const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6a4630 });
      const crownMat = new THREE.MeshLambertMaterial({ color: 0x2a6b38 });
      for (let row = -5; row <= 5; row += 1) {
        for (let col = -6; col <= 5; col += 1) {
          const px = col * 8;
          const pz = row * 7;
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 3.2, 5), trunkMat);
          trunk.position.set(px, 1.7, pz);
          const crown = new THREE.Mesh(new THREE.SphereGeometry(1.45, 6, 5), crownMat);
          crown.scale.y = 0.5;
          crown.position.set(px, 3.4, pz);
          group.add(trunk, crown);
        }
      }
      group.add(block(8, 2.6, 5, 0xf7f1e6, 44, 1.4, 28));
      group.add(block(8.6, 0.35, 5.6, 0xc4552a, 44, 2.85, 28));
      group.position.set(x, 0, z);
      scene.add(group);
      pill("Owerri West palms · level 5", new THREE.Vector3(x, 5, z));
    }
    palmEstate(airportAt && Math.abs(airportAt.x + 320) < 140 && Math.abs(airportAt.z + 280) < 110 ? 300 : -320, -280);

    function plotPad(x: number, z: number, label: string) {
      const group = new THREE.Group();
      group.add(block(10, 0.08, 7, 0xc4a574, 0, 0.08, 0));
      group.add(block(10, 0.55, 0.25, 0xf4efe4, 0, 0.35, -3.4));
      group.add(block(10, 0.55, 0.25, 0xf4efe4, 0, 0.35, 3.4));
      group.add(block(0.25, 0.55, 7, 0xf4efe4, -5, 0.35, 0));
      group.add(block(0.25, 0.55, 7, 0xf4efe4, 5, 0.35, 0));
      group.position.set(x, 0, z);
      scene.add(group);
      pill(label, new THREE.Vector3(x, 1.6, z));
    }
    plotPad(250, -150, "Land for sale");
    plotPad(-170, 60, "Ad board site");

    function fence(group: THREE.Group, width: number, depth: number, height: number, color: number) {
      const gate = 3.4;
      const side = (depth - gate) / 2;
      group.add(block(width, height, 0.4, color, 0, height / 2, -depth / 2));
      group.add(block(width, height, 0.4, color, 0, height / 2, depth / 2));
      group.add(block(0.4, height, depth, color, -width / 2, height / 2, 0));
      group.add(block(0.4, height, side, color, width / 2, height / 2, -(gate / 2 + side / 2)));
      group.add(block(0.4, height, side, color, width / 2, height / 2, gate / 2 + side / 2));
      group.add(block(0.45, height + 0.9, 0.45, 0xe0b15a, width / 2, (height + 0.9) / 2, -gate / 2));
      group.add(block(0.45, height + 0.9, 0.45, 0xe0b15a, width / 2, (height + 0.9) / 2, gate / 2));
    }

    function heroesYard(x: number, z: number) {
      const group = new THREE.Group();
      // Ground base
      group.add(block(36, 0.12, 28, 0xd8d4cb, 0, 0.08, 0));
      // Red running track oval
      group.add(block(26, 0.14, 18, 0xa83b24, 0, 0.12, 0));
      // Green football pitch in center
      group.add(block(18, 0.16, 12, 0x2e7d32, 0, 0.14, 0));
      // Pitch markings (white strips)
      group.add(block(0.18, 0.18, 12, 0xffffff, 0, 0.15, 0)); // Halfway line
      group.add(block(18, 0.18, 0.18, 0xffffff, 0, 0.15, -6)); // Touchline N
      group.add(block(18, 0.18, 0.18, 0xffffff, 0, 0.15, 6)); // Touchline S
      group.add(block(0.18, 0.18, 12, 0xffffff, -9, 0.15, 0)); // Goal line W
      group.add(block(0.18, 0.18, 12, 0xffffff, 9, 0.15, 0)); // Goal line E

      // Stepped stadium grandstands surrounding the pitch:
      // North & South stands (along X axis):
      for (let step = 0; step < 4; step++) {
        const h = 0.7 + step * 0.65;
        const col = step % 2 === 0 ? 0x1d4a66 : 0x1f6b45;
        group.add(block(24 + step * 1.5, 0.55, 1.3, col, 0, h, -(9.5 + step * 1.3)));
        group.add(block(24 + step * 1.5, 0.55, 1.3, col, 0, h, 9.5 + step * 1.3));
      }
      // East & West stands (along Z axis):
      for (let step = 0; step < 4; step++) {
        const h = 0.7 + step * 0.65;
        const col = step % 2 === 0 ? 0x1d4a66 : 0xf2c14e;
        group.add(block(1.3, 0.55, 18 + step * 1.5, col, 13.5 + step * 1.3, h, 0));
        group.add(block(1.3, 0.55, 18 + step * 1.5, col, -(13.5 + step * 1.3), h, 0));
      }

      // VIP grandstand roof canopy arching over the West stand
      group.add(block(5, 0.35, 24, 0xf8fafc, -15.5, 4.2, 0));
      group.add(block(0.35, 4.2, 0.35, 0x64748b, -17.5, 2.1, -9));
      group.add(block(0.35, 4.2, 0.35, 0x64748b, -17.5, 2.1, 9));

      // 4 Corner floodlight towers
      for (const [lx, lz] of [[-16, -13], [16, -13], [-16, 13], [16, 13]]) {
        group.add(block(0.65, 8.5, 0.65, 0x475569, lx, 4.25, lz));
        group.add(block(2.2, 1.1, 0.45, 0x1e293b, lx, 8.8, lz));
        const head = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 0.25), new THREE.MeshBasicMaterial({ color: 0xfffde8 }));
        head.position.set(lx, 8.8, lz + (lz > 0 ? -0.25 : 0.25));
        group.add(head);
      }

      // Stadium entry portal and sign
      group.add(block(7, 2.8, 1.6, 0x1d4a66, 0, 1.4, 14.8));
      group.add(block(8, 0.45, 2.0, 0xe0b15a, 0, 3.0, 14.8));

      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function beachHouseYard(x: number, z: number) {
      const group = new THREE.Group();
      group.add(block(26, 0.1, 20, 0xe4d2a8, 0, 0.08, 2));
      group.add(block(26, 0.08, 8, 0x3d8ec4, 0, 0.06, -8));
      group.add(block(12, 0.16, 8, 0xc4a574, 0, 0.2, 1));
      group.add(block(8, 2.8, 6, 0xf7f1e6, 0, 1.6, -0.4));
      group.add(block(9.2, 0.28, 7.2, 0x8a6a32, 0, 3.15, -0.4));
      group.add(block(1.4, 2.2, 0.1, 0x6a4630, 0, 1.2, 2.66));
      group.add(block(3.2, 0.12, 1.4, 0xf7fbfc, -2.2, 0.55, 2.2));
      group.add(block(3.2, 0.12, 1.4, 0x7ec8c3, 2.2, 0.55, 2.2));
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 2.4, 6), new THREE.MeshLambertMaterial({ color: 0x6a4630 }));
      trunk.position.set(-8, 1.3, 3);
      const crown = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 6), new THREE.MeshLambertMaterial({ color: 0x2f7a3e }));
      crown.position.set(-8, 2.8, 3);
      group.add(trunk, crown);
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function parkYard(x: number, z: number, beach: boolean) {
      const group = new THREE.Group();
      group.add(block(28, 0.12, 20, beach ? 0xd7c4a2 : 0xc8d7b0, 0, 0.1, 0));
      fence(group, 28, 20, 2, 0xe7dcc8);
      group.add(block(10, 0.08, 14, 0x3d8a4a, -4, 0.18, 0));
      group.add(block(beach ? 8 : 5, beach ? 3.2 : 2.2, beach ? 5 : 3.4, 0xf7f1e6, 6, beach ? 1.7 : 1.2, -3));
      group.add(block(6, 0.2, 4, 0xc4552a, 6, beach ? 3.4 : 2.4, -3));
      if (beach) group.add(block(7, 0.08, 5, 0xf2c14e, -6, 0.22, 4));
      const shade = carMesh(beach ? 0xf2c14e : 0x1f6b45);
      shade.position.set(8, 0, 4);
      group.add(shade);
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function bankYard(x: number, z: number) {
      const group = new THREE.Group();
      group.add(block(30, 0.12, 22, 0xd5dbe4, 0, 0.1, 0));
      fence(group, 30, 22, 2.2, 0x8aa0b5);
      group.add(block(16, 10, 7, 0xf7f4ee, -2, 5.1, -2));
      group.add(block(16.6, 0.45, 7.4, 0xe0b15a, -2, 10.3, -2));
      group.add(block(14, 6.4, 0.14, 0x7eb6e8, -2, 5, 1.52));
      group.add(block(0.55, 9, 0.55, 0xe0b15a, -9.2, 4.6, 1.4));
      group.add(block(0.55, 9, 0.55, 0xe0b15a, 5.2, 4.6, 1.4));
      const one = carMesh(0x17241e);
      one.position.set(8.4, 0, 5);
      const two = carMesh(0x245c78);
      two.position.set(11, 0, 4.2);
      two.rotation.y = 0.4;
      group.add(one, two);
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function hospitalYard(x: number, z: number) {
      const group = new THREE.Group();
      group.add(block(28, 0.12, 20, 0xe7eef2, 0, 0.1, 0));
      fence(group, 28, 20, 2.1, 0xd5e4ea);
      group.add(block(12, 4.4, 6.2, 0xf7fbfc, -3, 2.3, -2));
      group.add(block(7, 2.8, 4.2, 0xe7f0f4, 6.5, 1.5, 2));
      group.add(block(1.4, 0.28, 0.12, 0xc4552a, -3, 4.2, 1.16));
      group.add(block(0.28, 1.4, 0.12, 0xc4552a, -3, 4.2, 1.16));
      const ambulance = carMesh(0xf7fbfc);
      ambulance.position.set(8.2, 0, 5.2);
      group.add(ambulance);
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function pizzaShop(x: number, z: number) {
      const group = new THREE.Group();
      group.add(block(16, 0.12, 14, 0xe7dcc8, 0, 0.1, 0));
      group.add(block(10, 4.2, 6, 0xc4552a, 0, 2.2, -1));
      group.add(block(10.4, 0.28, 6.4, 0x1d4a8a, 0, 4.4, -1));
      group.add(block(6, 1.6, 0.1, 0xf7f1e6, 0, 2.4, 2.06));
      group.add(block(3.2, 0.12, 2, 0xc4552a, -4.2, 1.1, 3.4));
      group.add(block(3.2, 0.12, 2, 0x1d4a8a, 4.2, 1.1, 3.4));
      const one = carMesh(0xc4552a);
      one.position.set(-5, 0, 5.4);
      const two = carMesh(0x1d4a8a);
      two.position.set(5, 0, 5.4);
      group.add(one, two);
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function cathedralYard(x: number, z: number) {
      const group = new THREE.Group();
      group.add(block(24, 0.12, 18, 0xc5d6a4, 0, 0.08, 0));
      group.add(block(14, 5.2, 9, 0xf7f1e6, 0, 2.7, -1));
      group.add(block(14.6, 0.32, 9.4, 0xc4552a, 0, 5.45, -1));
      const dome = new THREE.Mesh(new THREE.SphereGeometry(2.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xe0b15a }));
      dome.position.set(0, 5.7, -1);
      group.add(dome);
      group.add(block(0.18, 1.5, 0.18, 0xf2c14e, 0, 8.5, -1));
      group.add(block(0.8, 0.16, 0.16, 0xf2c14e, 0, 8.85, -1));
      group.add(block(2.4, 6.6, 2.4, 0xf4efe4, -6.4, 3.3, -1));
      group.add(block(2.4, 6.6, 2.4, 0xf4efe4, 6.4, 3.3, -1));
      group.add(block(2.8, 0.28, 2.8, 0x1f6b45, -6.4, 6.7, -1));
      group.add(block(2.8, 0.28, 2.8, 0x1f6b45, 6.4, 6.7, -1));
      group.add(block(4, 0.22, 2.6, 0xe7dcc8, 0, 0.2, 4.6));
      group.add(block(1.8, 2.4, 0.12, 0x143d2c, 0, 1.35, 3.55));
      group.add(block(0.16, 2.4, 1.2, 0x3d7ea6, -7.05, 3.2, -1));
      group.add(block(0.16, 2.4, 1.2, 0xc4552a, 7.05, 3.2, -1));
      group.scale.setScalar(2);
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function groceryYard(x: number, z: number) {
      const group = new THREE.Group();
      group.add(block(20, 0.1, 16, 0xd7d3cc, 0, 0.06, 0));
      group.add(block(16, 4.4, 8, 0xf7fbfc, 0, 2.3, -2));
      group.add(block(16.4, 0.8, 0.45, 0x1f6b45, 0, 4.8, 2.1));
      group.add(block(12, 2.2, 0.08, 0x9fd0ea, 0, 2.3, 2.08));
      group.add(block(2.4, 2.6, 0.12, 0x143d2c, 0, 1.4, 2.14));
      for (let i = 0; i < 4; i += 1) {
        const car = carMesh(i % 2 === 0 ? 0xf7fbfc : 0x245c78);
        car.position.set(-6 + i * 4, 0, 5);
        group.add(car);
      }
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function creamShop(x: number, z: number) {
      const group = new THREE.Group();
      group.add(block(14, 0.12, 12, 0xf4efe4, 0, 0.1, 0));
      group.add(block(8, 3.6, 5, 0xf7fbfc, 0, 1.9, -1));
      group.add(block(8.4, 0.24, 5.4, 0x3d7ea6, 0, 3.8, -1));
      group.add(block(4.2, 1.2, 0.1, 0xe07a9a, 0, 2.2, 1.56));
      const scoop = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), new THREE.MeshLambertMaterial({ color: 0xf2c14e }));
      scoop.position.set(0, 4.5, -1);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 8), new THREE.MeshLambertMaterial({ color: 0xc4a574 }));
      cone.position.set(0, 3.7, -1);
      cone.rotation.x = Math.PI;
      group.add(scoop, cone);
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function warehouseHall(x: number, z: number) {
      const group = new THREE.Group();
      group.add(block(22, 0.12, 16, 0xd9d3c4, 0, 0.1, 0));
      group.add(block(16, 5.2, 8, 0x3a342c, 0, 2.7, -1));
      group.add(block(16.4, 0.3, 8.4, 0xc4552a, 0, 5.4, -1));
      for (let lane = 0; lane < 3; lane += 1) {
        group.add(block(7, 0.06, 0.7, 0xf4efe4, 2, 0.16, 1.2 + lane * 1.1));
      }
      const park = [0x17241e, 0xf2c14e, 0x245c78, 0xf7fbfc];
      park.forEach((color, index) => {
        const car = carMesh(color);
        car.position.set(-7 + index * 3.4, 0, 6);
        group.add(car);
      });
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function carLot(x: number, z: number) {
      const group = new THREE.Group();
      group.add(block(40, 0.1, 30, 0xd7d3cc, 0, 0.08, 0));
      group.add(block(12, 3.4, 5, 0xf7f1e6, 0, 1.8, -11));
      group.add(block(12.4, 0.28, 5.4, 0x1f6b45, 0, 3.6, -11));
      group.add(block(2.2, 2.4, 0.12, 0xe0b15a, 0, 1.3, -8.4));
      const paints = [0x111111, 0xf7fbfc, 0xc4552a, 0x245c78, 0xf2c14e, 0x1f6b45, 0x8c2438, 0x3a3f46, 0xe7eef2, 0x6a3d2f];
      let parked = 0;
      for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 8; col += 1) {
          const car = carMesh(paints[parked % paints.length]);
          car.position.set(-14 + col * 4, 0, -4 + row * 3.4);
          car.rotation.y = row % 2 === 0 ? Math.PI / 2 : -Math.PI / 2;
          group.add(car);
          parked += 1;
        }
      }
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function restaurantHall(x: number, z: number) {
      const group = new THREE.Group();
      group.add(block(28, 0.12, 22, 0xe7dcc8, 0, 0.1, 0));
      group.add(block(16, 10, 8, 0xf7f1e6, -1, 5.1, -2));
      group.add(block(16.6, 0.45, 8.4, 0xc4552a, -1, 10.3, -2));
      group.add(block(14, 6.4, 0.14, 0x9fd0ea, -1, 5.2, 2.08));
      group.add(block(0.55, 9.2, 0.55, 0xe0b15a, -8.2, 4.7, 1.6));
      group.add(block(0.55, 9.2, 0.55, 0xe0b15a, 6.2, 4.7, 1.6));
      group.add(block(6, 0.16, 3, 0xc4552a, -1, 2.4, 5.4));
      const park = [0x17241e, 0xf2c14e, 0x245c78, 0xc4552a, 0x1f6b45, 0xf7fbfc];
      park.forEach((color, index) => {
        const car = carMesh(color);
        car.position.set(-9 + index * 3.3, 0, 8.4);
        car.rotation.y = Math.PI;
        group.add(car);
      });
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function clubYard(x: number, z: number, scale: number) {
      const group = new THREE.Group();
      group.add(block(18, 0.12, 14, 0x2a221c, 0, 0.1, 0));
      group.add(block(11, 6.4, 7, 0x1a1412, 0, 3.3, -1));
      group.add(block(11.6, 0.4, 7.4, 0xc4552a, 0, 6.6, -1));
      group.add(block(7, 1.2, 0.12, 0xf2c14e, 0, 4.6, 2.56));
      group.add(block(1.8, 2.4, 0.14, 0xe0b15a, 0, 1.3, 2.52));
      const park = [0x17241e, 0xf2c14e, 0xc4552a, 0x245c78];
      park.forEach((color, index) => {
        const car = carMesh(color);
        car.position.set(-6 + index * 3.6, 0, 5.2);
        car.rotation.y = Math.PI;
        group.add(car);
      });
      group.scale.setScalar(scale);
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function crunchiesYard(x: number, z: number) {
      const group = new THREE.Group();
      group.add(block(18, 0.12, 14, 0xe7dcc8, 0, 0.08, 0));
      group.add(block(11, 5.4, 7, 0xc4552a, 0, 2.8, -1));
      group.add(block(11.6, 0.4, 7.4, 0xf2c14e, 0, 5.6, -1));
      group.add(block(8, 2.2, 0.1, 0xfff6d8, 0, 2.6, 2.55));
      group.add(block(6.2, 0.7, 0.12, 0x17241e, 0, 4.3, 2.58));
      group.add(block(4.2, 0.16, 3.2, 0xc4552a, 0, 2.2, 4.2));
      const park = [0x17241e, 0xf7fbfc, 0x245c78, 0xf2c14e];
      park.forEach((color, index) => {
        const car = carMesh(color);
        car.position.set(-6 + index * 3.6, 0, 5.6);
        car.rotation.y = Math.PI;
        group.add(car);
      });
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function mbariYard(x: number, z: number) {
      const group = new THREE.Group();
      group.add(block(24, 0.12, 18, 0xd7e0c8, 0, 0.08, 0));
      group.add(block(16, 6.4, 9, 0xf7f1e6, 0, 3.3, -1.5));
      group.add(block(16.6, 0.4, 9.4, 0x1f6b45, 0, 6.7, -1.5));
      group.add(block(0.7, 6.8, 0.7, 0xe0b15a, -6.4, 3.4, 3.1));
      group.add(block(0.7, 6.8, 0.7, 0xe0b15a, 6.4, 3.4, 3.1));
      group.add(block(10, 2.4, 0.1, 0x8ec4de, 0, 3.2, 3.15));
      group.add(block(7, 0.9, 0.12, 0x143d2c, 0, 5.2, 3.2));
      group.add(block(5, 0.12, 4, 0xc4552a, -6, 0.2, 6));
      group.add(block(5, 0.12, 4, 0x245c78, 6, 0.2, 6));
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    const beachWalkers: Array<{
      mesh: THREE.Group;
      leftLeg: THREE.Group;
      rightLeg: THREE.Group;
      leftArm: THREE.Group;
      rightArm: THREE.Group;
      base: number;
      span: number;
      stepRate: number;
      stride: number;
      phase: number;
    }> = [];
    function beachPerson(shirt: number, skin: number, trousers: number, hair: number) {
      const person = new THREE.Group();
      const skinMat = new THREE.MeshLambertMaterial({ color: skin });
      const shirtMat = new THREE.MeshLambertMaterial({ color: shirt });
      const trouserMat = new THREE.MeshLambertMaterial({ color: trousers });
      const hairMat = new THREE.MeshLambertMaterial({ color: hair });
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.52, 0.24), shirtMat);
      torso.position.y = 1.05;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), skinMat);
      head.position.y = 1.48;
      const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 6), hairMat);
      hairMesh.scale.set(1, 0.65, 1);
      hairMesh.position.y = 1.58;
      function limb(color: THREE.MeshLambertMaterial, w: number, h: number) {
        const pivot = new THREE.Group();
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), color);
        mesh.position.y = -h / 2;
        pivot.add(mesh);
        return pivot;
      }
      const leftLeg = limb(trouserMat, 0.12, 0.58);
      leftLeg.position.set(-0.12, 0.78, 0);
      const rightLeg = limb(trouserMat, 0.12, 0.58);
      rightLeg.position.set(0.12, 0.78, 0);
      const leftArm = limb(skinMat, 0.09, 0.46);
      leftArm.position.set(-0.3, 1.22, 0);
      const rightArm = limb(skinMat, 0.09, 0.46);
      rightArm.position.set(0.3, 1.22, 0);
      person.add(torso, head, hairMesh, leftLeg, rightLeg, leftArm, rightArm);
      person.scale.setScalar(1.45);
      return { person, leftLeg, rightLeg, leftArm, rightArm };
    }
    function confluenceBank(x: number, z: number) {
      const group = new THREE.Group();
      group.add(block(72, 0.1, 36, 0xb7a37a, 0, 0.03, 6));
      group.add(block(48, 0.08, 18, 0xe4d2a8, 0, 0.08, 12));
      group.add(block(30, 0.06, 10, 0xf2e2b8, 0, 0.12, 16));
      const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6a4630 });
      const crownMat = new THREE.MeshLambertMaterial({ color: 0x2a6b38 });
      for (let i = 0; i < 8; i += 1) {
        const px = -24 + (i % 4) * 12;
        const pz = 4 + Math.floor(i / 4) * 10;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 2.4, 5), trunkMat);
        trunk.position.set(px, 1.3, pz);
        const crown = new THREE.Mesh(new THREE.SphereGeometry(1.1, 6, 4), crownMat);
        crown.scale.y = 0.45;
        crown.position.set(px, 2.6, pz);
        group.add(trunk, crown);
      }
      for (let i = 0; i < 4; i += 1) {
        group.add(block(2.4, 0.08, 2.4, 0xf2c14e, -12 + i * 8, 1.4, 16));
        group.add(block(0.08, 1.3, 0.08, 0x6a4630, -12 + i * 8, 0.75, 16));
      }
      for (let i = 0; i < 6; i += 1) {
        const sx = -18 + i * 7;
        group.add(block(1.8, 0.14, 0.75, 0xf7f1e6, sx, 0.38, 11));
        group.add(block(1.8, 0.55, 0.12, 0xe7dcc8, sx, 0.62, 10.6));
        group.add(block(0.08, 0.28, 0.08, 0x6a4630, sx - 0.7, 0.22, 11.3));
        group.add(block(0.08, 0.28, 0.08, 0x6a4630, sx + 0.7, 0.22, 11.3));
      }
      [
        [0x1f6b45, 0xc98862, 0x243028, 0x1a1a1a],
        [0xc4552a, 0xf0c7a4, 0x17241e, 0x2a211c],
        [0x245c78, 0xe0b08a, 0x1d4a30, 0x3a2418],
        [0xf2c14e, 0x8d552f, 0x143d2c, 0x111111],
        [0x7a3e6d, 0xf3d0b5, 0x245c3a, 0x4a2c22],
      ].forEach((colors, index) => {
        const [shirt, skin, trousers, hair] = colors;
        const made = beachPerson(shirt, skin, trousers, hair);
        made.person.position.set(-16 + index * 8, 0, index % 2 === 0 ? 8 : 14);
        group.add(made.person);
        beachWalkers.push({
          mesh: made.person,
          leftLeg: made.leftLeg,
          rightLeg: made.rightLeg,
          leftArm: made.leftArm,
          rightArm: made.rightArm,
          base: -20,
          span: 40,
          stepRate: 0.82 + index * 0.07,
          stride: 0.75,
          phase: index * 1.7,
        });
      });
      const dx = x - mouth.x;
      const dz = z - mouth.z;
      group.rotation.y = Math.atan2(dx, dz);
      group.position.set(x, 0, z);
      scene.add(group);
      pill("River bank", new THREE.Vector3(x, 3.2, z));
    }
    confluenceBank(bankSpot.x, bankSpot.z);

    const carSpot = laid.get("car-stand");
    if (carSpot) {
      const awayX = bankSpot.x - mouth.x;
      const awayZ = bankSpot.z - mouth.z;
      const away = Math.hypot(awayX, awayZ) || 1;
      const ux = awayX / away;
      const uz = awayZ / away;
      let reach = 96;
      for (let guard = 0; guard < 10; guard += 1) {
        carSpot.x = Math.min(LIMIT, Math.max(-LIMIT, bankSpot.x + ux * reach));
        carSpot.z = Math.min(LIMIT, Math.max(-LIMIT, bankSpot.z + uz * reach));
        const blocked = riverPoint(carSpot.x, carSpot.z, 24) !== null || onStrip(carSpot.x, carSpot.z, 22);
        const crowded = laidSpots.some((other) => other.id !== "car-stand" && Math.hypot(other.x - carSpot.x, other.z - carSpot.z) < 52);
        if (!blocked && !crowded) break;
        reach += 18;
      }
    }

    function shopfront(x: number, z: number) {
      const group = new THREE.Group();
      group.add(block(3.6, 1.7, 2.8, 0xf3d27a, 0, 0.95, 0));
      group.add(block(4, 0.14, 1.6, 0xc4552a, 0, 1.9, 1.5));
      group.add(block(2.4, 0.55, 0.1, 0x1f6b45, 0, 2.3, 1.45));
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function phoneShopfront(x: number, z: number) {
      const group = new THREE.Group();
      // Tech facade building
      group.add(block(4.2, 2.4, 3.0, 0x0f172a, 0, 1.2, 0));
      // Modern roof parapet with neon line
      group.add(block(4.4, 0.16, 3.2, 0x38bdf8, 0, 2.48, 0));
      // Illuminated glass display window in front
      group.add(block(3.4, 1.4, 0.1, 0x38bdf8, 0, 1.1, 1.55));
      // Display showcase inside the window
      group.add(block(3.0, 0.65, 0.4, 0x1e293b, 0, 0.65, 1.3));
      // Phones & cases visible in showcase
      for (let i = 0; i < 3; i++) {
        group.add(block(0.2, 0.35, 0.05, 0xffffff, -1.0 + i * 0.5, 1.15, 1.3));
        group.add(block(0.2, 0.35, 0.05, [0xef4444, 0xfacc15, 0xa855f7][i], 0.2 + i * 0.5, 1.15, 1.3));
      }
      // Marquee tech sign above window
      group.add(block(3.6, 0.5, 0.14, 0x1d4ed8, 0, 2.05, 1.56));
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function footHits(x: number, z: number, hx: number, hz: number) {
      return hitsRoad(x, z, hx, hz);
    }
    function settle(spot: { x: number; z: number } | undefined, hx: number, hz: number) {
      if (!spot || !footHits(spot.x, spot.z, hx, hz)) return;
      const originX = spot.x;
      const originZ = spot.z;
      const hops: Array<[number, number]> = [[12, 0], [-12, 0], [0, 12], [0, -12], [16, 10], [16, -10], [-16, 10], [-16, -10], [0, 20], [0, -20], [22, 0], [-22, 0]];
      for (let ring = 1; ring <= 5; ring += 1) {
        for (const [dx, dz] of hops) {
          const x = Math.min(LIMIT, Math.max(-LIMIT, originX + dx * ring));
          const z = Math.min(LIMIT, Math.max(-LIMIT, originZ + dz * ring));
          if (footHits(x, z, hx, hz)) continue;
          spot.x = x;
          spot.z = z;
          return;
        }
      }
    }
    function beside(from: { x: number; z: number }, hx: number, hz: number, gap: number) {
      const dirs: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
      for (const ring of [gap, gap + 14, gap + 28, gap + 42]) {
        for (const [dx, dz] of dirs) {
          const len = Math.hypot(dx, dz) || 1;
          const x = Math.min(LIMIT, Math.max(-LIMIT, from.x + (dx / len) * ring));
          const z = Math.min(LIMIT, Math.max(-LIMIT, from.z + (dz / len) * ring));
          if (footHits(x, z, hx, hz)) continue;
          const busy = laidSpots.some((other) => Math.hypot(other.x - x, other.z - z) < 22 && other !== from);
          if (busy) continue;
          return { x, z };
        }
      }
      return null;
    }
    const donaldAt = laid.get("donalds");
    const dominosAt = laid.get("dominos");
    const coldAt = laid.get("cold-stone");
    if (donaldAt && dominosAt && coldAt) {
      const pizza = beside(donaldAt, 9, 8, 26);
      if (pizza) {
        dominosAt.x = pizza.x;
        dominosAt.z = pizza.z;
      }
      settle(dominosAt, 9, 8);
      const cream = beside(dominosAt, 8, 7, 24);
      if (cream) {
        coldAt.x = cream.x;
        coldAt.z = cream.z;
      }
      settle(coldAt, 8, 7);
    }
    let tetlowAxis: "x" | "z" = "z";
    let tetlowFixed = 80;
    const hotelAt = laid.get("business-hotel");
    const campusAt = laid.get("imsu");
    if (hotelAt && campusAt) {
      const northSouth = arterials.filter((item) => item.axis === "z");
      const eastWest = arterials.filter((item) => item.axis === "x");
      const nsRoad = northSouth.reduce((best, road) => (Math.abs(road.fixed - hotelAt.x) < Math.abs(best.fixed - hotelAt.x) ? road : best));
      const ewRoad = eastWest.reduce((best, road) => (Math.abs(road.fixed - hotelAt.z) < Math.abs(best.fixed - hotelAt.z) ? road : best));
      const alongZ = Math.abs(nsRoad.fixed - hotelAt.x) <= Math.abs(ewRoad.fixed - hotelAt.z);
      tetlowAxis = alongZ ? "z" : "x";
      tetlowFixed = alongZ ? nsRoad.fixed : ewRoad.fixed;
      const from = alongZ ? Math.min(hotelAt.z, campusAt.z) : Math.min(hotelAt.x, campusAt.x);
      const to = alongZ ? Math.max(hotelAt.z, campusAt.z) : Math.max(hotelAt.x, campusAt.x);
      const span = Math.max(88, to - from);
      const mid = (from + to) / 2;
      const start = mid - span / 2;
      const names = ["anonymous-gadgets", "sugar-gadgets", "buc-phones", "elion-phones", "ocha-gadgets", "maxii-gadgets", "easy-life", "gadgets-plug"];
      const fillers = ["Tecno Plaza", "Sirvic Mobiles", "Dialogue Phones", "Screen Doctor", "Charger Hub", "Cases & Glass", "Phone Hub", "Accessory Lane"];
      function shopBlocked(x: number, z: number) {
        if (footHits(x, z, 4, 3)) return true;
        const yards: Array<[string, number, number]> = [
          ["relief-market", 32, 24],
          ["owerri-mall", 24, 20],
          ["eke-ukwu", 32, 24],
          ["heroes-square", 26, 22],
          ["ikenegbu-market", 22, 16],
          ["everyday", 16, 12],
        ];
        return yards.some(([id, hx, hz]) => {
          const at = laid.get(id);
          return Boolean(at && Math.abs(x - at.x) < hx && Math.abs(z - at.z) < hz);
        });
      }
      let named = 0;
      let filler = 0;
      for (let along = start + 8; along <= start + span - 8; along += 12) {
        for (const side of [-1, 1]) {
          const x = alongZ ? tetlowFixed + side * 18 : along;
          const z = alongZ ? along : tetlowFixed + side * 18;
          const onHotel = Math.hypot(x - hotelAt.x, z - hotelAt.z) < 18;
          const onCampus = Math.abs(x - campusAt.x) < 54 && Math.abs(z - campusAt.z) < 40;
          const stripAt = laid.get("wetheral-strip");
          const onStripClub = stripAt ? Math.hypot(x - stripAt.x, z - stripAt.z) < 24 : false;
          if (onHotel || onCampus || onStripClub || shopBlocked(x, z)) continue;
          if (named < names.length) {
            const shop = laid.get(names[named]);
            if (shop) {
              shop.x = x;
              shop.z = z;
            }
            named += 1;
          } else if (filler < fillers.length) {
            const stall = shopfront(x, z);
            stall.rotation.y = alongZ ? (side > 0 ? -Math.PI / 2 : Math.PI / 2) : side > 0 ? Math.PI : 0;
            pill(fillers[filler], new THREE.Vector3(x, 3.2, z));
            filler += 1;
          }
        }
      }
      if (named < names.length) {
        for (let along = start - 80; along <= start + span + 80 && named < names.length; along += 10) {
          for (const side of [-1, 1]) {
            if (named >= names.length) break;
            const x = alongZ ? tetlowFixed + side * 18 : along;
            const z = alongZ ? along : tetlowFixed + side * 18;
            if (shopBlocked(x, z)) continue;
            const taken = names.slice(0, named).some((id) => {
              const other = laid.get(id);
              return other ? Math.hypot(other.x - x, other.z - z) < 10 : false;
            });
            if (taken) continue;
            const shop = laid.get(names[named]);
            if (shop) {
              shop.x = x;
              shop.z = z;
            }
            named += 1;
          }
        }
      }
      const labelAt = alongZ ? new THREE.Vector3(tetlowFixed, 1.2, mid) : new THREE.Vector3(mid, 1.2, tetlowFixed);
      pill("Tetlow Road", labelAt);
    }

    for (const place of PLACES) {
      const at = laid.get(place.id) ?? spot(place.x, place.y);
      const mine = place.id === homeAreaId;
      const hotel = place.kind === "hotel";
      let group: THREE.Object3D;
      let labelY = 2.6;
      if (place.id === "sam-mbakwe") {
        group = airportYard(at.x, at.z);
        labelY = 36;
      } else if (place.id === "state-cid") {
        group = policeYard(at.x, at.z);
        labelY = 6.4;
      } else if (place.id === "campus-gate") {
        group = new THREE.Group();
        group.add(block(0.7, 3.4, 0.7, 0xe0b15a, -2.4, 1.7, 0));
        group.add(block(0.7, 3.4, 0.7, 0xe0b15a, 2.4, 1.7, 0));
        group.add(block(5.6, 0.4, 0.7, 0x1f6b45, 0, 3.5, 0));
        group.position.set(at.x, 0, at.z);
        scene.add(group);
        labelY = 5;
      } else if (place.kind === "school") {
        group = schoolYard(at.x, at.z);
        labelY = 26;
      } else if (place.id === "owerri-mall") {
        group = mallYard(at.x, at.z);
        labelY = 9.2;
      } else if (place.kind === "market") {
        group = marketYard(at.x, at.z);
        labelY = 6.4;
      } else if (place.id === "heroes-square" || place.id === "stadium") {
        group = heroesYard(at.x, at.z);
        labelY = 8.2;
      } else if (place.id === "owerri-west-palms") {
        group = palmFarm(at.x, at.z);
        labelY = 4.8;
      } else if (place.id === "city-bank") {
        group = bankYard(at.x, at.z);
        labelY = 8.6;
      } else if (place.kind === "health") {
        group = hospitalYard(at.x, at.z);
        if (place.id === "shelly-hospital") {
          const grill = laid.get("mangrove-grill");
          if (grill) {
            const dx = grill.x - at.x;
            const dz = grill.z - at.z;
            group.rotation.y = Math.atan2(dz, -dx);
          }
        }
        labelY = 6.4;
      } else if (place.id === "car-stand") {
        group = carLot(at.x, at.z);
        labelY = 6.2;
      } else if (place.id === "dominos") {
        group = pizzaShop(at.x, at.z);
        labelY = 6.2;
      } else if (place.id === "cold-stone") {
        group = creamShop(at.x, at.z);
        labelY = 6.4;
      } else if (place.id === "assumpta-cathedral") {
        group = cathedralYard(at.x, at.z);
        labelY = 20;
      } else if (phoneShops.has(place.id)) {
        group = phoneShopfront(at.x, at.z);
        group.rotation.y = tetlowAxis === "z" ? (at.x >= tetlowFixed ? -Math.PI / 2 : Math.PI / 2) : at.z >= tetlowFixed ? Math.PI : 0;
        labelY = 3.6;
      } else if (place.id === "everyday") {
        group = groceryYard(at.x, at.z);
        labelY = 6.4;
      } else if (place.id === "the-warehouse") {
        group = warehouseHall(at.x, at.z);
        labelY = 7.2;
      } else if (restaurants.has(place.id)) {
        group = restaurantHall(at.x, at.z);
        labelY = 11.2;
      } else if (place.kind === "nightlife") {
        const scale = 1.2;
        group = clubYard(at.x, at.z, scale);
        labelY = 7.4 * scale;
      } else if (place.id === "crunchies") {
        group = crunchiesYard(at.x, at.z);
        labelY = 7.2;
      } else if (place.id === "mbari") {
        group = mbariYard(at.x, at.z);
        labelY = 8.4;
      } else if (roadside.has(place.id)) {
        group = shopfront(at.x, at.z);
        labelY = 3.2;
      } else if (place.id === "cartel-beach") {
        group = beachHouseYard(at.x, at.z);
        labelY = 5.2;
      } else if (place.id === "heartland-resort" || place.id === "nworie-park" || place.id === "amusement-park") {
        group = parkYard(at.x, at.z, place.id === "heartland-resort");
        labelY = 5.4;
      } else if (place.kind === "pickup") {
        group = pickupYard(at.x, at.z);
        labelY = 14;
      } else if (hotel) {
        group = tower(at.x, at.z, mine ? 0xfffaf2 : 0xf3efe4);
        labelY = 10.4;
      } else {
        const height = mine ? 2.8 : 1.7;
        const roof = mine ? 0xc4552a : 0x245c3a;
        const grow = mine ? 4.5 : 2.4;
        group = house(at.x, at.z, mine ? 0xfffaf2 : 0xf7f1e8, height, roof);
        group.scale.setScalar(grow);
        group.userData.baseScale = grow;
        labelY = (height + 0.7) * grow + 0.8;
      }
      group.userData.placeId = place.id;
      buildings.push(group);
      if (mine) homes.push(group);
      const glyph = place.id === "assumpta-cathedral" ? "✝" : phoneShops.has(place.id) ? "☎" : mark(place.kind);
      pill(`${glyph} ${mine ? "Home" : place.name}`, new THREE.Vector3(at.x, labelY, at.z), place.id);
    }

    const later = spot(8, 96);
    house(later.x, later.z, 0xf3d27a, 1.4, 0xc48a2a);
    pill("Ring road · later", new THREE.Vector3(later.x, 2.8, later.z));
    pill("Nworie", new THREE.Vector3(nworiePts[24].x, 1, nworiePts[24].z));
    pill("Otamiri", new THREE.Vector3(otamiriPts[40].x, 1, otamiriPts[40].z));
    pill("Old Owerri", new THREE.Vector3(spot(54, 58).x, 1, spot(54, 58).z));
    pill("New Owerri", new THREE.Vector3(spot(68, 80).x, 1, spot(68, 80).z));
    pill("Wetheral", new THREE.Vector3(spot(48, 30).x, 1, spot(48, 30).z));
    pill("MCC", new THREE.Vector3(spot(62, 34).x, 1, spot(62, 34).z));
    pill("Egbu Road", new THREE.Vector3(spot(92, 22).x, 1, spot(92, 22).z));
    pill("Campus", new THREE.Vector3(spot(76, 18).x, 1, spot(76, 18).z));

    const here = PLACES.find((place) => place.id === locationId);
    const start = here ? (laid.get(here.id) ?? spot(here.x, here.y)) : { x: 0, z: 0 };
    const person = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.9, 4, 8), new THREE.MeshLambertMaterial({ color: 0x1d4a30 }));
    if (here) person.position.set(start.x + 1.4, 1.05, start.z + 0.6);
    scene.add(person);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1400);
    const target = new THREE.Vector3(start.x, 0, start.z);
    let zoom = 54;

    function frameCamera() {
      const width = Math.max(1, root.clientWidth);
      const height = Math.max(1, root.clientHeight);
      if (root.clientWidth < 2 || root.clientHeight < 2) return;
      const aspect = width / height;
      camera.left = -zoom * aspect;
      camera.right = zoom * aspect;
      camera.top = zoom;
      camera.bottom = -zoom;
      camera.position.set(target.x + 58, 52, target.z + 58);
      camera.lookAt(target);
      camera.updateMatrixWorld();
      const upY = camera.matrixWorld.elements[5];
      const ndcCut = -camera.position.y / Math.max(0.2, upY * zoom);
      camera.clearViewOffset();
      if (Number.isFinite(ndcCut) && ndcCut > -0.98) {
        const visible = Math.min(0.98, Math.max(0.4, (1 - ndcCut) / 2));
        const fullHeight = height / visible;
        if (Number.isFinite(fullHeight) && fullHeight > 0) camera.setViewOffset(width, fullHeight, 0, 0, width, height);
      }
      camera.updateProjectionMatrix();
    }
    frameCamera();

    const pointers = new Map<number, { x: number; y: number }>();
    let pinch: number | null = null;
    let moved = false;
    let lastX = 0;
    let lastY = 0;

    let originX = 0;
    let originY = 0;
    function onDown(event: PointerEvent) {
      if ((event.target as HTMLElement).closest("[data-city-ui]")) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      moved = false;
      lastX = event.clientX;
      lastY = event.clientY;
      originX = event.clientX;
      originY = event.clientY;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = Math.hypot(a.x - b.x, a.y - b.y);
      }
      if (pointers.size === 1) {
        try {
          surface.setPointerCapture(event.pointerId);
        } catch {
          /* A second finger on a phone is not always capturable. */
        }
      }
    }
    function onMove(event: PointerEvent) {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size >= 2 && pinch) {
        const [a, b] = [...pointers.values()];
        const next = Math.hypot(a.x - b.x, a.y - b.y);
        zoom = Math.min(130, Math.max(10, zoom * (pinch / Math.max(8, next))));
        pinch = next;
        moved = true;
        dragged.current = true;
        frameCamera();
        return;
      }
      if (Math.hypot(event.clientX - originX, event.clientY - originY) < 6) return;
      if (!moved) {
        moved = true;
        dragged.current = true;
        lastX = event.clientX;
        lastY = event.clientY;
        return;
      }
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      const scale = (zoom * 2) / Math.max(1, root.clientHeight);
      target.x = Math.min(LIMIT, Math.max(-LIMIT, target.x - (dx + dy) * scale * 0.55));
      target.z = Math.min(LIMIT, Math.max(-LIMIT, target.z - (dy - dx) * scale * 0.55));
      frameCamera();
    }
    function onUp(event: PointerEvent) {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinch = null;
      if (!moved) {
        const rect = renderer.domElement.getBoundingClientRect();
        const pointer = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(buildings, true)[0];
        let object: THREE.Object3D | null = hit?.object ?? null;
        while (object && !object.userData.placeId) object = object.parent;
        const id = object?.userData.placeId as string | undefined;
        if (id) onSelectRef.current(id);
      }
      window.setTimeout(() => {
        dragged.current = false;
      }, 0);
    }
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      zoom = Math.min(130, Math.max(10, zoom * (event.deltaY > 0 ? 1.12 : 0.88)));
      frameCamera();
    }
    function zoomBy(factor: number) {
      zoom = Math.min(130, Math.max(10, zoom * factor));
      frameCamera();
    }
    wrap.addEventListener("pointerdown", onDown);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerup", onUp);
    wrap.addEventListener("pointercancel", onUp);
    wrap.addEventListener("wheel", onWheel, { passive: false });
    const zoomIn = wrap.querySelector("[data-zoom='in']");
    const zoomOut = wrap.querySelector("[data-zoom='out']");
    const inHandler = () => zoomBy(0.82);
    const outHandler = () => zoomBy(1.18);
    zoomIn?.addEventListener("click", inHandler);
    zoomOut?.addEventListener("click", outHandler);

    let frame = 0;
    const clock = new THREE.Clock();
    const loop = () => {
      const elapsed = clock.getElapsedTime();
      const pulse = 1 + Math.sin(elapsed * 3) * 0.16;
      for (const walker of beachWalkers) {
        const steps = elapsed * walker.stepRate + walker.phase;
        const travelled = steps * walker.stride;
        const loop = walker.span * 2;
        const wrapped = ((travelled % loop) + loop) % loop;
        const forward = wrapped <= walker.span;
        walker.mesh.position.x = walker.base + (forward ? wrapped : loop - wrapped);
        walker.mesh.position.y = Math.abs(Math.sin(steps * Math.PI)) * 0.04;
        walker.mesh.rotation.y = forward ? Math.PI / 2 : -Math.PI / 2;
        const swing = Math.sin(steps * Math.PI);
        walker.leftLeg.rotation.x = swing * 0.75;
        walker.rightLeg.rotation.x = -swing * 0.75;
        walker.leftArm.rotation.x = -swing * 0.5;
        walker.rightArm.rotation.x = swing * 0.5;
      }
      for (const home of homes) home.scale.setScalar(pulse * (home.userData.baseScale ?? 1));
      for (const car of traffic) {
        car.along += car.speed;
        if (car.along > car.max) car.along = car.min;
        if (car.along < car.min) car.along = car.max;
        if (car.axis === "x") car.mesh.position.x = car.along;
        else car.mesh.position.z = car.along;
      }
      const width = root.clientWidth;
      const height = root.clientHeight;
      const shown: Array<{ x: number; y: number; w: number; h: number }> = [];
      const ordered = [...labelNodes].sort((a, b) => Number(Boolean(b.node.dataset.place)) - Number(Boolean(a.node.dataset.place)));
      for (const label of ordered) {
        const projected = label.point.clone().project(camera);
        const onScreen = projected.z < 1 && projected.x > -1.05 && projected.x < 1.05 && projected.y > -1.05 && projected.y < 1.05;
        if (!onScreen) {
          label.node.style.display = "none";
          continue;
        }
        label.node.style.display = "block";
        const w = label.node.offsetWidth || 72;
        const h = label.node.offsetHeight || 18;
        const anchorX = (projected.x * 0.5 + 0.5) * width;
        let x = anchorX;
        let y = (-projected.y * 0.5 + 0.5) * height;
        for (let step = 0; step < 7; step += 1) {
          const left = x - w / 2;
          const top = y - h;
          const clash = shown.some((item) => left < item.x + item.w + 4 && left + w + 4 > item.x && top < item.y + item.h + 3 && top + h + 3 > item.y);
          if (!clash) break;
          y -= h + 4;
          x = anchorX + (step % 2 === 0 ? 1 : -1) * Math.min(36, (step + 1) * 10);
        }
        label.node.style.left = `${x}px`;
        label.node.style.top = `${y}px`;
        shown.push({ x: x - w / 2, y: y - h, w, h });
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(loop);
    };
    loop();

    const resize = new ResizeObserver(() => {
      if (root.clientWidth < 2 || root.clientHeight < 2) return;
      renderer.setSize(root.clientWidth, root.clientHeight);
      frameCamera();
    });
    resize.observe(root);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      wrap.removeEventListener("pointerdown", onDown);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerup", onUp);
      wrap.removeEventListener("pointercancel", onUp);
      wrap.removeEventListener("wheel", onWheel);
      zoomIn?.removeEventListener("click", inHandler);
      zoomOut?.removeEventListener("click", outHandler);
      for (const texture of posters) texture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      labelRoot.replaceChildren();
    };
  }, [homeAreaId, locationId]);

  return (
    <div ref={shell} className="absolute inset-0 touch-none">
      <div ref={host} className="absolute inset-0" />
      <div ref={labels} className="pointer-events-none absolute inset-0" />
      <div className="absolute bottom-28 right-3 z-10 flex flex-col gap-2">
        <button type="button" data-city-ui="zoom" data-zoom="in" aria-label="Zoom in" className="grid h-10 w-10 place-items-center rounded-full bg-white text-lg font-semibold shadow">+</button>
        <button type="button" data-city-ui="zoom" data-zoom="out" aria-label="Zoom out" className="grid h-10 w-10 place-items-center rounded-full bg-white text-lg font-semibold shadow">−</button>
      </div>
    </div>
  );
}
