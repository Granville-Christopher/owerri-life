"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { LookId } from "@/lib/game/types";
import { addPlayerGuests, createRealisticHuman, type CrowdPerson } from "@/lib/game/humanModel";
import { attachSceneCameraControls } from "./sceneCameraControls";

function themeFor(placeId: string) {
  if (placeId === "dominos") return { wall: 0x123a86, trim: 0xc8102e, counter: 0x1c1c1c, top: 0xf4efe4, food: 0xe6b15a, accent: 0xc8102e, shirt: 0xc8102e, line: "PIZZA" };
  if (placeId === "cold-stone") return { wall: 0x16324a, trim: 0x8fd0ea, counter: 0xd7e8f2, top: 0xf7fbfc, food: 0xf3b6c8, accent: 0x7ec8e3, shirt: 0x1f4e79, line: "ICE CREAM" };
  if (placeId === "donalds") return { wall: 0x8c1d1d, trim: 0xf2c14e, counter: 0x3a2418, top: 0xf7f1e6, food: 0xc4552a, accent: 0xf2c14e, shirt: 0xc8102e, line: "BURGERS" };
  if (placeId === "crunchies") return { wall: 0xc4552a, trim: 0xf2c14e, counter: 0x3a2418, top: 0xfff6d8, food: 0xe0893a, accent: 0xf2c14e, shirt: 0xc4552a, line: "CHICKEN" };
  if (placeId === "mama-nkechi") return { wall: 0x6a4630, trim: 0x1f6b45, counter: 0x4a3020, top: 0xe7d3b0, food: 0xc4552a, accent: 0x1f6b45, shirt: 0x1f6b45, line: "BUKA" };
  return { wall: 0xf4efe4, trim: 0x1f6b45, counter: 0x6a4630, top: 0xf7f1e6, food: 0xc88848, accent: 0x1f6b45, shirt: 0x1f6b45, line: "OPEN" };
}

function boardTexture(title: string, line: string, accent: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 200;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  ctx.fillStyle = "#17241e";
  ctx.fillRect(0, 0, 640, 200);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 640, 10);
  ctx.fillStyle = "#f6f1e6";
  ctx.textAlign = "center";
  ctx.font = "700 44px sans-serif";
  ctx.fillText(title.slice(0, 22), 320, 96);
  ctx.fillStyle = accent;
  ctx.font = "600 28px sans-serif";
  ctx.fillText(line, 320, 150);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function RestaurantScene({
  look,
  title,
  placeId,
  people = [],
  selfId,
}: {
  look: LookId;
  title: string;
  placeId: string;
  people?: CrowdPerson[];
  selfId?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const rig = useRef({ yaw: 0.15, zoom: 1 });

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const theme = themeFor(placeId);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(root.clientWidth, root.clientHeight);
    root.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#d7e4cf");
    scene.add(new THREE.HemisphereLight(0xfff6e8, 0x8fbf98, 0.85));
    const sun = new THREE.DirectionalLight(0xfff3dd, 1.15);
    sun.position.set(6, 12, 8);
    scene.add(sun);
    const warm = new THREE.PointLight(0xffe0a8, 8, 18);
    warm.position.set(0, 3.2, -1);
    scene.add(warm);

    const room = new THREE.Group();
    scene.add(room);
    const add = (mesh: THREE.Object3D) => room.add(mesh);
    const box = (color: number, w: number, h: number, d: number, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
      mesh.position.set(x, y, z);
      add(mesh);
      return mesh;
    };
    const person = (lookId: LookId, x: number, z: number, facing: number, seated = false, shirt?: number) => {
      const body = createRealisticHuman({ lookId, seated, scale: 0.92, customShirt: shirt });
      body.position.set(x, 0, z);
      body.rotation.y = facing;
      add(body);
      return body;
    };

    box(0xd7c4a4, 14.4, 0.12, 12.2, 0, 0.06, 0);
    box(theme.wall, 14.4, 3.3, 0.18, 0, 1.7, -5.9);
    box(theme.wall, 0.18, 3.3, 12.2, -7.1, 1.7, 0);
    box(theme.wall, 0.18, 3.3, 5.4, 7.1, 1.7, -3.1);
    box(theme.trim, 14.4, 0.16, 0.2, 0, 3.15, -5.8);
    box(theme.trim, 0.16, 0.22, 2.2, -2.4, 0.2, 5.9);
    box(theme.trim, 0.16, 0.22, 2.2, 2.4, 0.2, 5.9);

    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(6.8, 1.35),
      new THREE.MeshBasicMaterial({ map: boardTexture(title, theme.line, `#${theme.accent.toString(16).padStart(6, "0")}`) }),
    );
    board.position.set(0, 2.35, -5.75);
    add(board);

    box(theme.counter, 9.2, 1.05, 1.15, 0, 0.58, -3.55);
    box(theme.top, 9.4, 0.08, 1.25, 0, 1.12, -3.55);
    box(0x111111, 0.55, 0.28, 0.4, -3.4, 1.32, -3.55);
    for (const x of [-1.6, 0.2, 2]) {
      box(theme.food, 0.42, 0.08, 0.42, x, 1.22, -3.35);
      box(0xf7fbfc, 0.16, 0.16, 0.16, x + 0.35, 1.24, -3.7);
    }
    if (placeId === "cold-stone") {
      box(0xf7fbfc, 2.4, 0.16, 0.7, 2.4, 1.22, -3.5);
      box(0xf3b6c8, 0.28, 0.22, 0.28, 1.7, 1.38, -3.5);
      box(0xf2c14e, 0.28, 0.22, 0.28, 2.2, 1.38, -3.5);
      box(0x8fd0ea, 0.28, 0.22, 0.28, 2.7, 1.38, -3.5);
    }
    if (placeId === "dominos") {
      for (const x of [-2.6, -1.8]) box(0xc8102e, 0.55, 0.12, 0.55, x, 1.28, -3.85);
    }

    person("ngozi", -1.5, -4.55, 0, false, theme.shirt);
    person("emeka", 1.6, -4.55, 0, false, theme.shirt);
    person(look, -1.7, -2.15, Math.PI);
    addPlayerGuests(room, people, selfId, { x: -1.7, z: -1.1, rot: Math.PI });
    person("chidi", 0.15, -2.15, Math.PI);
    person("ibe", 2.05, -2.15, Math.PI);

    const dine = (x: number, z: number, left: LookId, right: LookId) => {
      box(0x6a4630, 1.7, 0.08, 1.05, x, 0.74, z);
      for (const [lx, lz] of [[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]] as const) {
        box(0x4a3020, 0.08, 0.68, 0.08, x + lx, 0.38, z + lz);
      }
      box(theme.food, 0.32, 0.05, 0.32, x - 0.28, 0.82, z);
      box(theme.food, 0.32, 0.05, 0.32, x + 0.28, 0.82, z);
      box(0xf7fbfc, 0.12, 0.14, 0.12, x, 0.86, z + 0.28);
      const seat = (sx: number, sz: number, lookId: LookId, facing: number) => {
        box(0x8c5a32, 0.48, 0.08, 0.48, sx, 0.46, sz);
        box(0x8c5a32, 0.48, 0.42, 0.06, sx, 0.72, sz + (facing === 0 ? -0.24 : 0.24));
        person(lookId, sx, sz, facing, true);
      };
      seat(x - 0.35, z - 1.35, left, 0);
      seat(x + 0.35, z + 1.35, right, Math.PI);
    };
    dine(-3.6, 0.15, "ada", "zara");
    dine(3.5, 0.35, "ngozi", "emeka");
    dine(0.1, 2.55, "ibe", "chidi");

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
    const aim = new THREE.Vector3(9, 8, 14).normalize();
    const fit = () => {
      const width = root.clientWidth || 1;
      const height = root.clientHeight || 1;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    fit();
    const detachControls = attachSceneCameraControls(root, rig, { minZoom: 0.7, maxZoom: 2.2, zoomSpeed: 0.08 });
    let frame = 0;
    let alive = true;
    const loop = () => {
      if (!alive) return;
      room.rotation.y = rig.current.yaw;
      camera.position.copy(aim).multiplyScalar(20 / rig.current.zoom);
      camera.lookAt(0, 1.15, -0.4);
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(loop);
    };
    loop();
    const onResize = () => fit();
    window.addEventListener("resize", onResize);
    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      detachControls();
      room.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const mat of mats) {
          mat.map?.dispose();
          mat.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === root) root.removeChild(renderer.domElement);
    };
  }, [look, placeId, title, people.map((person) => person.id).join("|"), selfId]);

  function turn(dir: number) {
    rig.current.yaw += dir * 0.55;
  }
  function dolly(factor: number) {
    rig.current.zoom = Math.min(2.2, Math.max(0.7, rig.current.zoom * factor));
  }

  return (
    <div className="absolute inset-0 bg-[#d7e4cf]">
      <div ref={host} className="absolute inset-0 touch-none" />
      <div className="absolute left-2 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-1">
        <button type="button" aria-label="Zoom in" onClick={() => dolly(1.18)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-base font-semibold text-[#17241e] shadow">+</button>
        <button type="button" aria-label="Zoom out" onClick={() => dolly(1 / 1.18)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-base font-semibold text-[#17241e] shadow">−</button>
      </div>
    </div>
  );
}
