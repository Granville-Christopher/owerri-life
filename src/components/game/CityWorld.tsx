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

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(640, 640), new THREE.MeshLambertMaterial({ color: 0xcfe0c2 }));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const nworie = new THREE.Mesh(new THREE.PlaneGeometry(22, 520), new THREE.MeshLambertMaterial({ color: 0x7eb6cc }));
    nworie.rotation.x = -Math.PI / 2;
    nworie.position.y = 0.05;
    scene.add(nworie);
    const otamiri = new THREE.Mesh(new THREE.PlaneGeometry(520, 16), new THREE.MeshLambertMaterial({ color: 0x5f9bb8 }));
    otamiri.rotation.x = -Math.PI / 2;
    otamiri.position.set(20, 0.06, 150);
    scene.add(otamiri);

    function road(x: number, z: number, length: number, across: boolean) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(across ? length : 3.2, 0.08, across ? 3.2 : length),
        new THREE.MeshLambertMaterial({ color: 0xd9c7a2 }),
      );
      mesh.position.set(x, 0.08, z);
      scene.add(mesh);
    }
    road(0, 0, 420, true);
    road(0, -80, 360, true);
    road(40, 80, 300, true);
    road(-40, 0, 360, false);
    road(70, 20, 280, false);

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
    for (let i = 0; i < 70; i += 1) tree((rnd() - 0.5) * 420, (rnd() - 0.5) * 420);

    function house(x: number, z: number, tint: number, tall = 1.1, roof = 0x3d6b4f) {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.15, tall, 1.15), new THREE.MeshLambertMaterial({ color: tint }));
      body.position.y = tall / 2;
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.55, 4), new THREE.MeshLambertMaterial({ color: roof }));
      top.position.y = tall + 0.22;
      top.rotation.y = Math.PI / 4;
      group.add(body, top);
      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    function tower(x: number, z: number, tint: number) {
      const group = new THREE.Group();
      const height = 6.4;
      const body = new THREE.Mesh(new THREE.BoxGeometry(3.6, height, 2.8), new THREE.MeshLambertMaterial({ color: tint }));
      body.position.y = height / 2;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.28, 3), new THREE.MeshLambertMaterial({ color: 0xe0b15a }));
      cap.position.y = height + 0.14;
      const glass = new THREE.Mesh(new THREE.BoxGeometry(3.2, height * 0.7, 0.08), new THREE.MeshLambertMaterial({ color: 0x9fd0ea }));
      glass.position.set(0, height * 0.5, 1.42);
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
    function addTraffic(axis: "x" | "z", fixed: number, min: number, max: number, count: number, color: number) {
      for (let i = 0; i < count; i += 1) {
        const mesh = carMesh(color);
        const along = min + ((i + 0.3) / count) * (max - min);
        mesh.position.set(axis === "x" ? along : fixed, 0, axis === "z" ? along : fixed);
        if (axis === "z") mesh.rotation.y = Math.PI / 2;
        scene.add(mesh);
        traffic.push({ mesh, along, axis, fixed, speed: 0.12 + (i % 3) * 0.04, min, max });
      }
    }
    addTraffic("x", 1.6, -190, 190, 6, 0xc4552a);
    addTraffic("x", -78.4, -160, 160, 5, 0xf2c14e);
    addTraffic("x", 81.6, -120, 140, 4, 0x1f6b45);
    addTraffic("z", -38.4, -150, 150, 5, 0x245c78);
    addTraffic("z", 71.6, -110, 130, 4, 0x17241e);

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
      const face = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.6), new THREE.MeshLambertMaterial({ map: texture, side: THREE.DoubleSide }));
      face.position.y = 3.4;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 6), new THREE.MeshLambertMaterial({ color: 0x6a4630 }));
      pole.position.y = 1.6;
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
    const gap = 18;
    for (let pass = 0; pass < 28; pass += 1) {
      for (let i = 0; i < laidSpots.length; i += 1) {
        for (let j = i + 1; j < laidSpots.length; j += 1) {
          let dx = laidSpots[j].x - laidSpots[i].x;
          let dz = laidSpots[j].z - laidSpots[i].z;
          const dist = Math.hypot(dx, dz) || 0.01;
          if (dist >= gap) continue;
          const push = (gap - dist) / 2;
          dx /= dist;
          dz /= dist;
          laidSpots[i].x = Math.min(210, Math.max(-210, laidSpots[i].x - dx * push));
          laidSpots[i].z = Math.min(210, Math.max(-210, laidSpots[i].z - dz * push));
          laidSpots[j].x = Math.min(210, Math.max(-210, laidSpots[j].x + dx * push));
          laidSpots[j].z = Math.min(210, Math.max(-210, laidSpots[j].z + dz * push));
        }
      }
    }
    const laid = new Map(laidSpots.map((item) => [item.id, item]));

    function estate(cx: number, cz: number, rows: number, cols: number) {
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          if (row === Math.floor(rows / 2) && col === Math.floor(cols / 2)) continue;
          house(cx + (col - cols / 2) * 2.35, cz + (row - rows / 2) * 2.35, 0xf4efe4, 0.85, 0x2f6b45);
        }
      }
    }
    const newOwerri = laid.get("new-owerri");
    const wetheral = laid.get("wetheral-strip");
    const ikenegbu = laid.get("ikenegbu");
    const worldBank = laid.get("world-bank");
    const aladinma = laid.get("aladinma");
    if (newOwerri) estate(newOwerri.x + 24, newOwerri.z, 6, 8);
    if (wetheral) estate(wetheral.x - 22, wetheral.z + 6, 5, 7);
    if (ikenegbu) estate(ikenegbu.x + 16, ikenegbu.z, 4, 6);
    if (worldBank) estate(worldBank.x - 16, worldBank.z, 4, 5);
    if (aladinma) estate(aladinma.x + 16, aladinma.z, 4, 5);
    billboard(-30, 12, 0.4, "Wetheral night", "Clubs open till dawn", "#7a2e1e");
    billboard(24, -70, 0.2, "Bus to campus", "IMSU, FUTO, Nekede", "#143d2c");
    billboard(55, 18, -0.5, "Mama Nkechi", "Rice, stew, and gist", "#8a5a2a");
    billboard(-55, 40, 0.8, "New Owerri", "Flats and duplexes", "#1f6b45");
    billboard(90, 70, -0.3, "Sam Mbakwe", "Flights out of Imo", "#245c78");

    for (const place of PLACES) {
      const at = laid.get(place.id) ?? spot(place.x, place.y);
      const mine = place.id === homeAreaId;
      const hotel = place.kind === "hotel";
      const height = mine ? 2.6 : hotel ? 6.4 : place.kind === "nightlife" ? 2.4 : 1.5;
      const roof = mine ? 0xc4552a : place.kind === "nightlife" ? 0x7a2e1e : place.kind === "health" ? 0x3d7ea6 : place.kind === "school" ? 0x3d6b4f : 0x245c3a;
      const group = hotel ? tower(at.x, at.z, mine ? 0xfffaf2 : 0xf3efe4) : house(at.x, at.z, mine ? 0xfffaf2 : 0xf7f1e8, height, roof);
      group.userData.placeId = place.id;
      buildings.push(group);
      if (mine) homes.push(group);
      pill(`${mark(place.kind)} ${mine ? "Home" : place.name}`, new THREE.Vector3(at.x, height + 1.2, at.z), place.id);
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

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 900);
    const target = new THREE.Vector3(start.x, 0, start.z);
    let zoom = 36;

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
        zoom = Math.min(90, Math.max(10, zoom * (pinch / Math.max(8, next))));
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
      target.x = Math.min(230, Math.max(-230, target.x - (dx + dy) * scale * 0.55));
      target.z = Math.min(230, Math.max(-230, target.z - (dy - dx) * scale * 0.55));
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
      zoom = Math.min(90, Math.max(10, zoom * (event.deltaY > 0 ? 1.12 : 0.88)));
      frameCamera();
    }
    function zoomBy(factor: number) {
      zoom = Math.min(90, Math.max(10, zoom * factor));
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
        if (car.axis === "x") car.mesh.position.x = car.along;
        else car.mesh.position.z = car.along;
      }
      const width = root.clientWidth;
      const height = root.clientHeight;
      for (const label of labelNodes) {
        const projected = label.point.clone().project(camera);
        const onScreen = projected.z < 1 && projected.x > -1.05 && projected.x < 1.05 && projected.y > -1.05 && projected.y < 1.05;
        label.node.style.display = onScreen ? "block" : "none";
        label.node.style.left = `${(projected.x * 0.5 + 0.5) * width}px`;
        label.node.style.top = `${(-projected.y * 0.5 + 0.5) * height}px`;
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
