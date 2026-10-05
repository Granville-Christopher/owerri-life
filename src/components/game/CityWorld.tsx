"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { PLACES } from "@/lib/game/content";

const SPAN = 1.6;

function spot(x: number, y: number) {
  return { x: (x - 50) * SPAN, z: (y - 50) * SPAN };
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
  const host = useRef<HTMLDivElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const el = host.current;
    const labelRoot = labels.current;
    if (!el || !labelRoot) return;
    const root = el;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#cfe3c4");
    scene.add(new THREE.HemisphereLight(0xfff8ee, 0x8ec4a0, 1.15));
    const sun = new THREE.DirectionalLight(0xffffff, 1.35);
    sun.position.set(30, 50, 12);
    scene.add(sun);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.MeshLambertMaterial({ color: 0xd7ebdd }));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(14, 220), new THREE.MeshLambertMaterial({ color: 0x8ec4d4 }));
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.04;
    scene.add(water);

    const buildings: THREE.Object3D[] = [];
    const homes: THREE.Object3D[] = [];
    const labelNodes: Array<{ id: string; node: HTMLButtonElement; point: THREE.Vector3 }> = [];

    for (const place of PLACES) {
      const at = spot(place.x, place.y);
      const mine = place.id === homeAreaId;
      const height = mine ? 2.4 : place.kind === "nightlife" || place.kind === "hotel" ? 2 : 1.3;
      const group = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, height, 1.5),
        new THREE.MeshLambertMaterial({ color: mine ? 0xf4efe4 : 0xf7f1e8 }),
      );
      body.position.y = height / 2;
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(1.2, 0.85, 4),
        new THREE.MeshLambertMaterial({ color: mine ? 0xc4552a : 0x3d6b4f }),
      );
      roof.position.y = height + 0.35;
      roof.rotation.y = Math.PI / 4;
      group.add(body, roof);
      group.position.set(at.x, 0, at.z);
      group.userData.placeId = place.id;
      scene.add(group);
      buildings.push(group);
      if (mine) homes.push(group);

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = mine ? "Home" : place.name;
      button.className = "pointer-events-auto absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#17241e] shadow";
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        onSelectRef.current(place.id);
      });
      labelRoot.appendChild(button);
      labelNodes.push({ id: place.id, node: button, point: new THREE.Vector3(at.x, height + 1.1, at.z) });
    }

    const here = PLACES.find((place) => place.id === locationId);
    const person = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.7, 4, 8), new THREE.MeshLambertMaterial({ color: 0x245c3a }));
    if (here) {
      const at = spot(here.x, here.y);
      person.position.set(at.x + 1.1, 0.9, at.z + 0.4);
    }
    scene.add(person);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
    const start = here ? spot(here.x, here.y) : { x: 0, z: 0 };
    const target = new THREE.Vector3(start.x, 0, start.z);
    let zoom = 26;

    function frameCamera() {
      const aspect = Math.max(0.5, root.clientWidth / Math.max(1, root.clientHeight));
      camera.left = -zoom * aspect;
      camera.right = zoom * aspect;
      camera.top = zoom;
      camera.bottom = -zoom;
      camera.position.set(target.x + 46, 42, target.z + 46);
      camera.lookAt(target);
      camera.updateProjectionMatrix();
    }
    frameCamera();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let dragging = false;
    let moved = false;
    let lastX = 0;
    let lastY = 0;

    function onDown(event: PointerEvent) {
      dragging = true;
      moved = false;
      lastX = event.clientX;
      lastY = event.clientY;
    }
    function onMove(event: PointerEvent) {
      if (!dragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      if (Math.hypot(dx, dy) > 5) moved = true;
      lastX = event.clientX;
      lastY = event.clientY;
      const scale = (zoom * 2) / Math.max(1, root.clientHeight);
      target.x -= (dx + dy) * scale * 0.45;
      target.z -= (dy - dx) * scale * 0.45;
      frameCamera();
    }
    function onUp(event: PointerEvent) {
      dragging = false;
      if (moved) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(buildings, true)[0];
      let object: THREE.Object3D | null = hit?.object ?? null;
      while (object && !object.userData.placeId) object = object.parent;
      const id = object?.userData.placeId as string | undefined;
      if (id) onSelectRef.current(id);
    }
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      zoom = Math.min(70, Math.max(8, zoom * (event.deltaY > 0 ? 1.1 : 0.9)));
      frameCamera();
    }

    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    let frame = 0;
    const clock = new THREE.Clock();
    const loop = () => {
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.14;
      for (const home of homes) home.scale.setScalar(pulse);
      const width = root.clientWidth;
      const height = root.clientHeight;
      for (const label of labelNodes) {
        const projected = label.point.clone().project(camera);
        const visible = projected.z < 1;
        label.node.style.display = visible ? "block" : "none";
        label.node.style.left = `${(projected.x * 0.5 + 0.5) * width}px`;
        label.node.style.top = `${(-projected.y * 0.5 + 0.5) * height}px`;
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(loop);
    };
    loop();

    const resize = new ResizeObserver(() => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      frameCamera();
    });
    resize.observe(el);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.dispose();
      renderer.domElement.remove();
      labelRoot.replaceChildren();
    };
  }, [homeAreaId, locationId]);

  return (
    <div className="absolute inset-0">
      <div ref={host} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
      <div ref={labels} className="pointer-events-none absolute inset-0" />
    </div>
  );
}
