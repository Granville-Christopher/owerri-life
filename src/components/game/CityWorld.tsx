"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { PLACES, type Place } from "@/lib/game/content";

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
    function layRiver(pts: RiverPoint[], half: number, flare?: RiverPoint) {
      riverLines.push({ pts, half: half + (flare ? 8 : 0) });
      const positions: number[] = [];
      const normals: number[] = [];
      const indices: number[] = [];
      for (let i = 0; i < pts.length; i += 1) {
        const prev = pts[Math.max(0, i - 1)];
        const next = pts[Math.min(pts.length - 1, i + 1)];
        let tx = next.x - prev.x;
        let tz = next.z - prev.z;
        const len = Math.hypot(tx, tz) || 1;
        tx /= len;
        tz /= len;
        let wide = half * (0.9 + 0.1 * Math.sin(i * 0.45));
        if (flare) {
          const dist = Math.hypot(pts[i].x - flare.x, pts[i].z - flare.z);
          if (dist < 60) {
            const blend = 1 - dist / 60;
            wide += blend * blend * 14;
          }
        }
        positions.push(pts[i].x - tz * wide, 0.06, pts[i].z + tx * wide, pts[i].x + tz * wide, 0.06, pts[i].z - tx * wide);
        normals.push(0, 1, 0, 0, 1, 0);
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
    nworiePts.splice(-14);
    const tail = nworiePts[nworiePts.length - 1];
    let mouth = otamiriPts[0];
    for (const point of otamiriPts) {
      if (Math.hypot(point.x - tail.x, point.z - tail.z) < Math.hypot(mouth.x - tail.x, mouth.z - tail.z)) mouth = point;
    }
    const joinPrev = nworiePts[nworiePts.length - 2];
    let sx = tail.x - joinPrev.x;
    let sz = tail.z - joinPrev.z;
    const sl = Math.hypot(sx, sz) || 1;
    sx = (sx / sl) * 90;
    sz = (sz / sl) * 90;
    const mouthIndex = Math.max(0, otamiriPts.indexOf(mouth));
    const upstream = otamiriPts[Math.max(0, mouthIndex - 3)];
    const downstream = otamiriPts[Math.min(otamiriPts.length - 1, mouthIndex + 3)];
    let ex = downstream.x - upstream.x;
    let ez = downstream.z - upstream.z;
    const flow = Math.hypot(ex, ez) || 1;
    ex = (ex / flow) * 70;
    ez = (ez / flow) * 70;
    for (let i = 1; i <= 28; i += 1) {
      const t = i / 28;
      const t2 = t * t;
      const t3 = t2 * t;
      nworiePts.push({
        x: (2 * t3 - 3 * t2 + 1) * tail.x + (t3 - 2 * t2 + t) * sx + (-2 * t3 + 3 * t2) * mouth.x + (t3 - t2) * ex,
        z: (2 * t3 - 3 * t2 + 1) * tail.z + (t3 - 2 * t2 + t) * sz + (-2 * t3 + 3 * t2) * mouth.z + (t3 - t2) * ez,
      });
    }
    layRiver(nworiePts, 10, mouth);
    layRiver(otamiriPts, 10, mouth);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(28, 40), water);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(mouth.x, 0.055, mouth.z);
    scene.add(pool);
    const poolRing: RiverPoint[] = [];
    for (let i = 0; i < 10; i += 1) {
      const angle = (i / 10) * Math.PI * 2;
      poolRing.push({ x: mouth.x + Math.cos(angle) * 12, z: mouth.z + Math.sin(angle) * 12 });
    }
    poolRing.push(poolRing[0]);
    riverLines.push({ pts: poolRing, half: 10 });
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
      group.add(body, top);
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function tower(x: number, z: number, tint: number) {
      const group = new THREE.Group();
      const height = 9.2;
      const body = new THREE.Mesh(new THREE.BoxGeometry(4.6, height, 3.4), new THREE.MeshLambertMaterial({ color: tint }));
      body.position.y = height / 2;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.32, 3.6), new THREE.MeshLambertMaterial({ color: 0xe0b15a }));
      cap.position.y = height + 0.16;
      const glass = new THREE.Mesh(new THREE.BoxGeometry(4.1, height * 0.72, 0.1), new THREE.MeshLambertMaterial({ color: 0x9fd0ea }));
      glass.position.set(0, height * 0.48, 1.72);
      group.add(body, cap, glass);
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function carMesh(color: number) {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.42, 0.85), new THREE.MeshLambertMaterial({ color }));
      body.position.y = 0.42;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.34, 0.72), new THREE.MeshLambertMaterial({ color: 0xd7e7f5 }));
      cabin.position.y = 0.78;
      group.add(body, cabin);
      return group;
    }

    const traffic: Array<{ mesh: THREE.Group; along: number; axis: "x" | "z"; fixed: number; speed: number; min: number; max: number }> = [];
    function addTraffic(axis: "x" | "z", fixed: number, min: number, max: number, count: number, color: number, direction: 1 | -1) {
      const span = max - min;
      for (let i = 0; i < count; i += 1) {
        const mesh = carMesh(color);
        const along = min + ((i + 0.5) / count) * span;
        mesh.position.set(axis === "x" ? along : fixed, 0, axis === "z" ? along : fixed);
        mesh.rotation.y = axis === "x" ? (direction > 0 ? 0 : Math.PI) : direction > 0 ? Math.PI / 2 : -Math.PI / 2;
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
        if (axis === "z") mesh.rotation.y = Math.PI / 2;
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
    const restaurants = new Set(["donalds", "kilimanjaro", "november-5", "mangrove-grill"]);
    const landmark = new Set(["sam-mbakwe", "state-cid", "imsu", "futo", "fedpoly-nekede", "eke-ukwu", "relief-market", "ikenegbu-market", "owerri-mall", "heroes-square", "cartel-beach", "heartland-resort", "nworie-park", "amusement-park", "city-bank", "teaching-hospital", "general-hospital", "umezuruike-hospital", "st-davids", "shelly-hospital", "imo-specialist"]);
    const roadside = new Set(["mama-nkechi", "josephs-pot", "feedwell", "crunchies"]);
    for (let pass = 0; pass < 36; pass += 1) {
      for (let i = 0; i < laidSpots.length; i += 1) {
        for (let j = i + 1; j < laidSpots.length; j += 1) {
          const pair = new Set([laidSpots[i].id, laidSpots[j].id]);
          const shellyMangrove = pair.has("shelly-hospital") && pair.has("mangrove-grill");
          const bankKitchen = pair.has("city-bank") && pair.has("november-5");
          const cartelPair = laidSpots[i].id === "cartel-lounge" || laidSpots[j].id === "cartel-lounge";
          const clubPair = clubs.has(laidSpots[i].id) || clubs.has(laidSpots[j].id);
          const airportPair = laidSpots[i].id === "sam-mbakwe" || laidSpots[j].id === "sam-mbakwe";
          const schoolPair = (schools.has(laidSpots[i].id) || schools.has(laidSpots[j].id)) && !pair.has("campus-gate");
          const marketPair = markets.has(laidSpots[i].id) || markets.has(laidSpots[j].id);
          const bigPair = landmark.has(laidSpots[i].id) || landmark.has(laidSpots[j].id) || restaurants.has(laidSpots[i].id) || restaurants.has(laidSpots[j].id);
          const gap = airportPair ? 130 : bankKitchen ? 160 : schoolPair ? 120 : cartelPair ? 78 : shellyMangrove ? 78 : clubPair ? 44 : marketPair ? 64 : bigPair ? 56 : 24;
          let dx = laidSpots[j].x - laidSpots[i].x;
          let dz = laidSpots[j].z - laidSpots[i].z;
          const dist = Math.hypot(dx, dz) || 0.01;
          if (dist >= gap) continue;
          const push = (gap - dist) / 2;
          dx /= dist;
          dz /= dist;
          laidSpots[i].x = Math.min(LIMIT, Math.max(-LIMIT, laidSpots[i].x - dx * push));
          laidSpots[i].z = Math.min(LIMIT, Math.max(-LIMIT, laidSpots[i].z - dz * push));
          laidSpots[j].x = Math.min(LIMIT, Math.max(-LIMIT, laidSpots[j].x + dx * push));
          laidSpots[j].z = Math.min(LIMIT, Math.max(-LIMIT, laidSpots[j].z + dz * push));
        }
      }
      for (const spot of laidSpots) {
        const pad = spot.id === "sam-mbakwe" ? 100 : spot.id === "cartel-lounge" ? 40 : schools.has(spot.id) ? 56 : clubs.has(spot.id) ? 16 : markets.has(spot.id) ? 30 : restaurants.has(spot.id) ? 16 : landmark.has(spot.id) ? 16 : roadside.has(spot.id) ? 6 : 4;
        shoveOut(spot, pad);
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
      const run = Math.max(12, joinX - gx);
      road(gx + run / 2, gz, run, true);
      zones.push({ minX: gx - 4, maxX: joinX + 4, minZ: gz - halfRoad, maxZ: gz + halfRoad });
      if (Math.abs(bestZ - gz) > 4) {
        road(joinX, (gz + bestZ) / 2, Math.abs(bestZ - gz), false);
        zones.push({
          minX: joinX - halfRoad,
          maxX: joinX + halfRoad,
          minZ: Math.min(gz, bestZ) - 4,
          maxZ: Math.max(gz, bestZ) + 4,
        });
      }
    }
    for (const id of schools) {
      const at = laid.get(id);
      if (at) schoolApproach(at.x, at.z);
    }
    const airportAt = laid.get("sam-mbakwe");
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
            if (spot.id === "cartel-lounge") return dist < 36;
            if (clubs.has(spot.id)) return dist < 16;
            if (schools.has(spot.id)) return Math.abs(x - spot.x) < 54 && Math.abs(z - spot.z) < 42;
            if (markets.has(spot.id)) return dist < 34;
            if (restaurants.has(spot.id)) return dist < 18;
            if (roadside.has(spot.id)) return dist < 8;
            if (landmark.has(spot.id)) return dist < 18;
            return false;
          });
          if (onStrip(x, z, 2) || crowded) continue;
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
    billboard(-36, 16, 0.4, "Wetheral night", "Clubs open till dawn", "#7a2e1e");
    billboard(28, -78, 0.2, "Bus to campus", "IMSU, FUTO, Nekede", "#143d2c");
    billboard(62, 22, -0.5, "Mama Nkechi", "Rice, stew, and gist", "#8a5a2a");
    billboard(-62, 48, 0.8, "New Owerri", "Flats and duplexes", "#1f6b45");
    billboard(110, 78, -0.3, "Sam Mbakwe", "Flights out of Imo", "#245c78");
    billboard(-110, -40, 0.6, "Ad board", "Buy this slot", "#a9782a");
    billboard(140, -30, -0.4, "Port Harcourt Rd", "Your brand here", "#7a2e1e");
    billboard(40, 120, 0.15, "Airport road", "Seen by every flight", "#143d2c");
    billboard(-40, -120, 1.1, "State CID", "A big compound", "#1d4a66");
    billboard(70, -130, -0.8, "Campus life", "IMSU · FUTO · Nekede", "#1f6b45");
    billboard(-160, 16, 0.2, "Egbu farms", "Cassava every Saturday", "#3d6b4f");
    billboard(190, 16, -0.3, "Ikenegbu rooms", "The cheap side of town", "#8a5a2a");
    billboard(-200, -76, 0.5, "Ad board", "This face is for sale", "#a9782a");
    billboard(210, 104, -0.2, "Heroes Square", "Open ground, every day", "#1d4a66");
    billboard(-120, 104, 0.7, "Heartland", "Beach, games, and grill", "#7a2e1e");
    billboard(30, 214, 0.1, "Nekede rice", "Opens with your level", "#143d2c");
    billboard(-170, -104, 1, "City bank", "Shifts on the centre road", "#245c78");
    billboard(160, -104, -0.6, "Aladinma", "Flats on this side", "#1f6b45");
    billboard(-230, 40, 0.9, "Bus stop", "Campus and the markets", "#143d2c");
    billboard(230, -50, -0.4, "Otamiri", "Cross on the bridge", "#245c78");

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
        car.position.set(-14 + index * 3.4, 0, 21);
        group.add(car);
      });
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function field(x: number, z: number, label: string) {
      const group = new THREE.Group();
      group.add(block(28, 0.08, 18, 0x8a6a32, 0, 0.06, 0));
      for (let row = -6; row <= 6; row += 2) group.add(block(26, 0.4, 0.8, 0x3d8a4a, 0, 0.28, row));
      group.position.set(x, 0, z);
      scene.add(group);
      pill(label, new THREE.Vector3(x, 2.2, z));
    }
    field(-220, 210, "Egbu farmland · level 3");
    field(210, 200, "Nekede rice · level 4");

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
      group.add(block(30, 0.12, 24, 0xe7e2d6, 0, 0.1, 0));
      fence(group, 30, 24, 1.8, 0xd9cfc0);
      group.add(block(2.2, 7.2, 2.2, 0xf7f1e6, 0, 3.7, 0));
      group.add(block(3.4, 0.4, 3.4, 0xe0b15a, 0, 7.4, 0));
      group.add(block(8, 0.08, 6, 0x3d8a4a, -8, 0.2, -6));
      group.add(block(8, 0.08, 6, 0x3d8a4a, 8, 0.2, -6));
      group.add(block(8, 0.08, 6, 0x3d8a4a, -8, 0.2, 6));
      group.add(block(8, 0.08, 6, 0x3d8a4a, 8, 0.2, 6));
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

    const beachWalkers: Array<{ mesh: THREE.Group; base: number; span: number; speed: number; phase: number }> = [];
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
      [0x1d4a30, 0xc4552a, 0x17241e, 0x3d7ea6, 0xf2c14e].forEach((color, index) => {
        const walker = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.7, 4, 6), new THREE.MeshLambertMaterial({ color }));
        body.position.y = 0.9;
        walker.add(body);
        walker.position.set(-16 + index * 7, 0, 6);
        group.add(walker);
        beachWalkers.push({ mesh: walker, base: -18, span: 36, speed: 0.35 + index * 0.08, phase: index * 1.4 });
      });
      const dx = x - mouth.x;
      const dz = z - mouth.z;
      group.rotation.y = Math.atan2(dx, dz);
      group.position.set(x, 0, z);
      scene.add(group);
      pill("River bank", new THREE.Vector3(x, 3.2, z));
    }
    confluenceBank(bankSpot.x, bankSpot.z);

    function shopfront(x: number, z: number) {
      const group = new THREE.Group();
      group.add(block(3.6, 1.7, 2.8, 0xf3d27a, 0, 0.95, 0));
      group.add(block(4, 0.14, 1.6, 0xc4552a, 0, 1.9, 1.5));
      group.add(block(2.4, 0.55, 0.1, 0x1f6b45, 0, 2.3, 1.45));
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
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
      } else if (place.kind === "market") {
        group = marketYard(at.x, at.z);
        labelY = 6.4;
      } else if (place.id === "heroes-square") {
        group = heroesYard(at.x, at.z);
        labelY = 8.2;
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
      } else if (restaurants.has(place.id)) {
        group = restaurantHall(at.x, at.z);
        labelY = 11.2;
      } else if (place.kind === "nightlife") {
        const scale = place.id === "cartel-lounge" ? 4 : 2;
        group = clubYard(at.x, at.z, scale);
        labelY = 7.4 * scale;
      } else if (roadside.has(place.id)) {
        group = shopfront(at.x, at.z);
        labelY = 3.2;
      } else if (place.id === "cartel-beach" || place.id === "heartland-resort" || place.id === "nworie-park" || place.id === "amusement-park") {
        group = parkYard(at.x, at.z, place.id === "cartel-beach" || place.id === "heartland-resort");
        labelY = 5.4;
      } else if (hotel) {
        group = tower(at.x, at.z, mine ? 0xfffaf2 : 0xf3efe4);
        labelY = 10.4;
      } else {
        const height = mine ? 2.8 : 1.7;
        const roof = mine ? 0xc4552a : 0x245c3a;
        group = house(at.x, at.z, mine ? 0xfffaf2 : 0xf7f1e8, height, roof);
        labelY = height + 1.4;
      }
      group.userData.placeId = place.id;
      buildings.push(group);
      if (mine) homes.push(group);
      pill(`${mark(place.kind)} ${mine ? "Home" : place.name}`, new THREE.Vector3(at.x, labelY, at.z), place.id);
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
      if (ndcCut > -0.98) {
        const visible = Math.min(0.98, Math.max(0.4, (1 - ndcCut) / 2));
        camera.setViewOffset(width, height / visible, 0, 0, width, height);
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
        if (!surface.hasPointerCapture(event.pointerId)) surface.setPointerCapture(event.pointerId);
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
        const swing = Math.sin(elapsed * walker.speed + walker.phase);
        walker.mesh.position.x = walker.base + ((swing + 1) / 2) * walker.span;
        walker.mesh.rotation.y = Math.cos(elapsed * walker.speed + walker.phase) >= 0 ? Math.PI / 2 : -Math.PI / 2;
      }
      for (const home of homes) home.scale.setScalar(pulse);
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
