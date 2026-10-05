"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { PLACES, type Place } from "@/lib/game/content";

const SPAN = 4.4;

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
    scene.background = new THREE.Color("#d7e4c8");
    scene.add(new THREE.HemisphereLight(0xfff6e8, 0x8fbf98, 1.2));
    const sun = new THREE.DirectionalLight(0xfff3dd, 1.45);
    sun.position.set(40, 70, 18);
    scene.add(sun);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(980, 980), new THREE.MeshLambertMaterial({ color: 0xcfe0c2 }));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const nworie = new THREE.Mesh(new THREE.PlaneGeometry(26, 760), new THREE.MeshLambertMaterial({ color: 0x7eb6cc }));
    nworie.rotation.x = -Math.PI / 2;
    nworie.position.y = 0.05;
    scene.add(nworie);
    const otamiri = new THREE.Mesh(new THREE.PlaneGeometry(760, 18), new THREE.MeshLambertMaterial({ color: 0x5f9bb8 }));
    otamiri.rotation.x = -Math.PI / 2;
    otamiri.position.set(20, 0.06, 170);
    scene.add(otamiri);

    function road(x: number, z: number, length: number, across: boolean) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(across ? length : 5.2, 0.08, across ? 5.2 : length),
        new THREE.MeshLambertMaterial({ color: 0xd9c7a2 }),
      );
      mesh.position.set(x, 0.08, z);
      scene.add(mesh);
    }
    road(0, 0, 620, true);
    road(0, -90, 520, true);
    road(40, 90, 480, true);
    road(0, 200, 420, true);
    road(-50, 0, 520, false);
    road(80, 20, 460, false);
    road(150, -20, 360, false);

    const halfRoad = 2.6;
    const zones = [
      { minX: -16, maxX: 16, minZ: -380, maxZ: 380 },
      { minX: -380, maxX: 400, minZ: 158, maxZ: 182 },
      { minX: -310, maxX: 310, minZ: -halfRoad, maxZ: halfRoad },
      { minX: -260, maxX: 260, minZ: -90 - halfRoad, maxZ: -90 + halfRoad },
      { minX: 40 - 240, maxX: 40 + 240, minZ: 90 - halfRoad, maxZ: 90 + halfRoad },
      { minX: -210, maxX: 210, minZ: 200 - halfRoad, maxZ: 200 + halfRoad },
      { minX: -50 - halfRoad, maxX: -50 + halfRoad, minZ: -260, maxZ: 260 },
      { minX: 80 - halfRoad, maxX: 80 + halfRoad, minZ: 20 - 230, maxZ: 20 + 230 },
      { minX: 150 - halfRoad, maxX: 150 + halfRoad, minZ: -20 - 180, maxZ: -20 + 180 },
    ];
    function onStrip(x: number, z: number, pad: number) {
      return zones.some((zone) => x > zone.minX - pad && x < zone.maxX + pad && z > zone.minZ - pad && z < zone.maxZ + pad);
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
          spot.x = Math.min(280, Math.max(-280, spot.x));
          spot.z = Math.min(280, Math.max(-280, spot.z));
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
      const x = (rnd() - 0.5) * 620;
      const z = (rnd() - 0.5) * 620;
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
    addTraffic("x", 1.35, -280, 280, 7, 0xc4552a, 1);
    addTraffic("x", -1.35, -280, 280, 7, 0x245c78, -1);
    addTraffic("x", -88.65, -240, 240, 6, 0xf2c14e, 1);
    addTraffic("x", -91.35, -240, 240, 6, 0x1f6b45, -1);
    addTraffic("x", 91.35, -180, 260, 5, 0xc4552a, 1);
    addTraffic("x", 88.65, -180, 260, 5, 0x17241e, -1);
    addTraffic("x", 201.35, -180, 180, 4, 0xf2c14e, 1);
    addTraffic("x", 198.65, -180, 180, 4, 0x245c78, -1);
    addTraffic("z", -48.65, -240, 240, 6, 0x245c78, 1);
    addTraffic("z", -51.35, -240, 240, 6, 0xc4552a, -1);
    addTraffic("z", 81.35, -190, 230, 5, 0x17241e, 1);
    addTraffic("z", 78.65, -190, 230, 5, 0xf2c14e, -1);
    addTraffic("z", 151.35, -180, 150, 4, 0x1f6b45, 1);
    addTraffic("z", 148.65, -180, 150, 4, 0x6a4630, -1);

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
      button.className = "pointer-events-auto absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-[#17241e] shadow";
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
    const landmark = new Set(["sam-mbakwe", "state-cid", "imsu", "futo", "fedpoly-nekede", "eke-ukwu", "relief-market", "ikenegbu-market", "owerri-mall", "heroes-square", "cartel-beach", "heartland-resort", "nworie-park", "amusement-park", "city-bank"]);
    for (let pass = 0; pass < 36; pass += 1) {
      for (let i = 0; i < laidSpots.length; i += 1) {
        for (let j = i + 1; j < laidSpots.length; j += 1) {
          const gap = landmark.has(laidSpots[i].id) || landmark.has(laidSpots[j].id) ? 40 : 24;
          let dx = laidSpots[j].x - laidSpots[i].x;
          let dz = laidSpots[j].z - laidSpots[i].z;
          const dist = Math.hypot(dx, dz) || 0.01;
          if (dist >= gap) continue;
          const push = (gap - dist) / 2;
          dx /= dist;
          dz /= dist;
          laidSpots[i].x = Math.min(280, Math.max(-280, laidSpots[i].x - dx * push));
          laidSpots[i].z = Math.min(280, Math.max(-280, laidSpots[i].z - dz * push));
          laidSpots[j].x = Math.min(280, Math.max(-280, laidSpots[j].x + dx * push));
          laidSpots[j].z = Math.min(280, Math.max(-280, laidSpots[j].z + dz * push));
        }
      }
      for (const spot of laidSpots) {
        const pad = spot.id === "sam-mbakwe" ? 18 : landmark.has(spot.id) ? 16 : 4;
        shoveOut(spot, pad);
      }
    }
    const laid = new Map(laidSpots.map((item) => [item.id, item]));

    function estate(cx: number, cz: number, rows: number, cols: number) {
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          if (row === Math.floor(rows / 2) && col === Math.floor(cols / 2)) continue;
          const x = cx + (col - cols / 2) * 3.15;
          const z = cz + (row - rows / 2) * 3.15;
          if (onStrip(x, z, 2)) continue;
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
    if (ikenegbu) estate(ikenegbu.x + 28, ikenegbu.z, 6, 8);
    if (worldBank) estate(worldBank.x - 28, worldBank.z, 5, 7);
    if (aladinma) estate(aladinma.x + 28, aladinma.z, 5, 7);
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
      group.add(block(11, 3.6, 4.4, 0xf7f1e6, -2, 1.9, -3.2));
      group.add(block(8, 2.4, 3.4, 0xe7efe4, -3, 1.3, 3.4));
      group.add(block(3.4, 5.6, 3.4, 0xd7c4a2, 5.5, 2.9, -2));
      group.add(block(7, 0.08, 6.5, 0x3d8a4a, 4, 0.2, 4.2));
      const staff = carMesh(0x245c78);
      staff.position.set(6.2, 0, 5.4);
      const shuttle = carMesh(0xf2c14e);
      shuttle.position.set(7.8, 0, 3.2);
      shuttle.rotation.y = 0.4;
      group.add(staff, shuttle);
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
      group.add(block(32, 0.1, 20, 0xd5d8dc, 0, 0.08, 0));
      group.add(block(7, 0.16, 18, 0x3a3f46, 9, 0.16, 0));
      for (let dash = -7; dash <= 7; dash += 2) group.add(block(0.45, 0.2, 1, 0xf4efe4, 9, 0.22, dash));
      group.add(block(14, 3.4, 4.8, 0xf7f1e6, -6, 1.8, -5.5));
      group.add(block(9, 1.3, 3.2, 0xe7e2d6, -6, 0.75, -1.4));
      group.add(block(2, 8, 2, 0x245c78, 2.2, 4.1, -5.2));
      group.add(block(2.8, 1.2, 2.8, 0x9fd0ea, 2.2, 8.2, -5.2));
      function airliner(px: number, pz: number, rot: number) {
        const plane = new THREE.Group();
        plane.add(block(8, 0.75, 0.95, 0xf4f7fb, 0, 0.75, 0));
        plane.add(block(1.6, 0.12, 7, 0xd7dee8, 0.4, 0.75, 0));
        plane.add(block(1.5, 1.6, 0.14, 0x1f6b45, -3.5, 1.45, 0));
        plane.position.set(px, 0, pz);
        plane.rotation.y = rot;
        group.add(plane);
      }
      airliner(4, 2.2, 0.2);
      airliner(10, -3.2, -0.25);
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function marketYard(x: number, z: number) {
      const group = new THREE.Group();
      group.add(block(26, 0.12, 18, 0xe7d7b8, 0, 0.1, 0));
      group.add(block(26, 0.7, 0.28, 0xc4a574, 0, 0.45, -9));
      group.add(block(26, 0.7, 0.28, 0xc4a574, 0, 0.45, 9));
      group.add(block(0.28, 0.7, 18, 0xc4a574, -13, 0.45, 0));
      group.add(block(0.28, 0.7, 6, 0xc4a574, 13, 0.45, -6));
      group.add(block(0.28, 0.7, 6, 0xc4a574, 13, 0.45, 6));
      const canopies = [0xc4552a, 0xf2c14e, 0x1f6b45, 0x245c78];
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 4; col += 1) {
          const sx = -6 + col * 3.6;
          const sz = -4 + row * 3.2;
          group.add(block(3.2, 0.16, 2.2, canopies[(row + col) % canopies.length], sx, 1.55, sz));
          group.add(block(0.12, 1.4, 0.12, 0x6a4630, sx - 1.4, 0.8, sz - 0.9));
          group.add(block(0.12, 1.4, 0.12, 0x6a4630, sx + 1.4, 0.8, sz + 0.9));
        }
      }
      group.add(block(6.2, 3.4, 4.2, 0xf7f1e6, 7.2, 1.8, -4));
      const van = carMesh(0xf2c14e);
      van.position.set(8, 0, 4.2);
      const truck = carMesh(0xc4552a);
      truck.position.set(5.5, 0, 4.6);
      truck.rotation.y = 0.3;
      group.add(van, truck);
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
    field(-200, -190, "Owerri West palms · level 5");

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
    plotPad(180, -70, "Land for sale");
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

    for (const place of PLACES) {
      const at = laid.get(place.id) ?? spot(place.x, place.y);
      const mine = place.id === homeAreaId;
      const hotel = place.kind === "hotel";
      let group: THREE.Object3D;
      let labelY = 2.6;
      if (place.id === "sam-mbakwe") {
        group = airportYard(at.x, at.z);
        labelY = 9.4;
      } else if (place.id === "state-cid") {
        group = policeYard(at.x, at.z);
        labelY = 6.4;
      } else if (place.kind === "school") {
        group = schoolYard(at.x, at.z);
        labelY = 6.8;
      } else if (place.kind === "market") {
        group = marketYard(at.x, at.z);
        labelY = 4.6;
      } else if (place.id === "heroes-square") {
        group = heroesYard(at.x, at.z);
        labelY = 8.2;
      } else if (place.id === "city-bank") {
        group = bankYard(at.x, at.z);
        labelY = 8.6;
      } else if (place.id === "cartel-beach" || place.id === "heartland-resort" || place.id === "nworie-park" || place.id === "amusement-park") {
        group = parkYard(at.x, at.z, place.id === "cartel-beach" || place.id === "heartland-resort");
        labelY = 5.4;
      } else if (hotel) {
        group = tower(at.x, at.z, mine ? 0xfffaf2 : 0xf3efe4);
        labelY = 10.4;
      } else {
        const height = mine ? 2.8 : place.kind === "nightlife" ? 2.6 : 1.7;
        const roof = mine ? 0xc4552a : place.kind === "nightlife" ? 0x7a2e1e : place.kind === "health" ? 0x3d7ea6 : 0x245c3a;
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
    pill("Nworie", new THREE.Vector3(8, 1, -40));
    pill("Otamiri", new THREE.Vector3(40, 1, 150));
    pill("Old Owerri", new THREE.Vector3(spot(54, 58).x, 1, spot(54, 58).z));
    pill("New Owerri", new THREE.Vector3(spot(68, 80).x, 1, spot(68, 80).z));
    pill("Wetheral", new THREE.Vector3(spot(48, 30).x, 1, spot(48, 30).z));
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
      const aspect = Math.max(0.5, root.clientWidth / Math.max(1, root.clientHeight));
      camera.left = -zoom * aspect;
      camera.right = zoom * aspect;
      camera.top = zoom;
      camera.bottom = -zoom;
      camera.position.set(target.x + 58, 52, target.z + 58);
      camera.lookAt(target);
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
      target.x = Math.min(300, Math.max(-300, target.x - (dx + dy) * scale * 0.55));
      target.z = Math.min(300, Math.max(-300, target.z - (dy - dx) * scale * 0.55));
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
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.16;
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
