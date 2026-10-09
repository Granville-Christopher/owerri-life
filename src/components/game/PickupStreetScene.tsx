"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { makeRenderer } from "@/lib/game/renderQuality";
import type { LookId } from "@/lib/game/types";
import { addPlayerGuests, createRealisticHuman, type CrowdPerson } from "@/lib/game/humanModel";
import { naira } from "@/lib/game/format";
import { attachSceneCameraControls } from "./sceneCameraControls";

const FEMALE: LookId[] = ["ada", "ngozi", "zara"];
const SHIRTS = [0xc4552a, 0x7a3e6d, 0x1f6b45, 0xf2c14e, 0x8c2438, 0x245c78];

function signTexture(title: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 192;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  ctx.fillStyle = "#1a140c";
  ctx.fillRect(0, 0, 768, 192);
  ctx.fillStyle = "#e0b15a";
  ctx.fillRect(0, 0, 768, 10);
  ctx.fillStyle = "#f6f1e6";
  ctx.textAlign = "center";
  ctx.font = "700 48px sans-serif";
  ctx.fillText(title.slice(0, 22).toUpperCase(), 384, 90);
  ctx.fillStyle = "#e0b15a";
  ctx.font = "600 26px sans-serif";
  ctx.fillText("NIGHT STREET · LISTED", 384, 148);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function PickupStreetScene({
  look,
  title,
  people,
  guests = [],
  selfId,
  spendable,
  pending,
  onTake,
}: {
  look: LookId;
  title: string;
  people: Array<{ id: string; name: string; asking: number }>;
  guests?: CrowdPerson[];
  selfId?: string;
  spendable: number;
  pending: boolean;
  onTake: (npcId: string) => Promise<{ ok: boolean }>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const rig = useRef({ yaw: 0.18, zoom: 1 });
  const [miss, setMiss] = useState<string | null>(null);

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const renderer = makeRenderer();
    renderer.setSize(root.clientWidth, root.clientHeight);
    root.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#2a3548");
    scene.add(new THREE.HemisphereLight(0xffe0c0, 0x3a4458, 1.05));
    const moon = new THREE.DirectionalLight(0xfff3dd, 0.95);
    moon.position.set(8, 16, 10);
    scene.add(moon);
    const amber = new THREE.PointLight(0xffc07a, 28, 28);
    amber.position.set(0, 3.6, -1);
    scene.add(amber);
    const amber2 = new THREE.PointLight(0xff9a4a, 16, 18);
    amber2.position.set(-6, 2.8, 3);
    scene.add(amber2);

    const street = new THREE.Group();
    scene.add(street);
    const add = (mesh: THREE.Object3D) => street.add(mesh);
    const box = (color: number, w: number, h: number, d: number, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
      mesh.position.set(x, y, z);
      add(mesh);
      return mesh;
    };

    box(0x3a3f46, 28, 0.1, 8.4, 0, 0.05, 1.2);
    for (let dash = -12; dash <= 12; dash += 2.4) box(0xf2c14e, 1.4, 0.02, 0.12, dash, 0.12, 1.2);
    box(0xcfcac0, 28, 0.16, 2.2, 0, 0.12, -4.2);
    box(0xcfcac0, 28, 0.16, 1.8, 0, 0.12, 6.2);
    box(0x4a514c, 28, 0.08, 0.16, 0, 0.2, -3.1);
    box(0x4a514c, 28, 0.08, 0.16, 0, 0.2, 5.3);

    const shops = [
      [-10, 0xc4552a],
      [-5, 0x1f6b45],
      [0, 0x245c78],
      [5, 0x8c2438],
      [10, 0xe0b15a],
    ] as const;
    shops.forEach(([x, color], i) => {
      box(0xf4efe4, 4.2, 3.6, 3.4, x, 1.9, -6.4);
      box(color, 4.4, 0.28, 3.6, x, 3.8, -6.4);
      box(0x9fd0ea, 2.4, 1.4, 0.08, x, 2.2, -4.68);
      box(0x1a140c, 1.1, 2.1, 0.08, x - 1.2, 1.15, -4.68);
      box(color, 1.8, 0.7, 0.06, x + 0.6, 3.15, -4.66);
      const lamp = box(0x2a2a31, 0.1, 3.2, 0.1, x, 1.7, -3.4);
      void lamp;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffe0a0 }));
      bulb.position.set(x, 3.35, -3.4);
      add(bulb);
      void i;
    });

    const board = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 1.5), new THREE.MeshBasicMaterial({ map: signTexture(title) }));
    board.position.set(0, 4.6, -4.7);
    add(board);

    const paints = [0xc4552a, 0x17241e, 0xf2c14e, 0x245c78, 0xf7fbfc];
    paints.forEach((color, i) => {
      const car = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 0.95), new THREE.MeshLambertMaterial({ color }));
      body.position.y = 0.45;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.42, 0.9), new THREE.MeshLambertMaterial({ color: 0x1e293b }));
      cabin.position.set(-0.1, 0.9, 0);
      car.add(body, cabin);
      car.position.set(-10 + i * 5, 0, 3.6);
      car.rotation.y = Math.PI / 2;
      add(car);
    });

    people.forEach((person, index) => {
      const body = createRealisticHuman({
        lookId: FEMALE[index % FEMALE.length],
        scale: 0.95,
        customShirt: SHIRTS[index % SHIRTS.length],
        customPants: 0x1a140c,
      });
      const x = -8 + (index % 5) * 4;
      const z = -2.4 + Math.floor(index / 5) * 1.6;
      body.position.set(x, 0, z);
      body.rotation.y = 0.15 + (index % 3) * 0.2;
      add(body);
    });

    const me = createRealisticHuman({ lookId: look, scale: 0.95, customShirt: 0x1f6b45 });
    me.position.set(0.4, 0, 4.6);
    me.rotation.y = Math.PI;
    add(me);
    addPlayerGuests(street, guests, selfId, { x: 0.4, z: 3.4, rot: Math.PI });

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
    const aim = new THREE.Vector3(10, 7.5, 16).normalize();
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
      street.rotation.y = rig.current.yaw;
      camera.position.copy(aim).multiplyScalar((18 * Math.max(1, 0.72 / camera.aspect)) / rig.current.zoom);
      camera.lookAt(0, 1.05, -0.8);
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
      street.traverse((obj) => {
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
  }, [look, title, people.map((person) => person.id).join(","), guests.map((person) => person.id).join("|"), selfId]);

  function dolly(factor: number) {
    rig.current.zoom = Math.min(2.2, Math.max(0.7, rig.current.zoom * factor));
  }

  return (
    <div className="absolute inset-0 bg-[#1a2230]">
      <div ref={host} className="absolute inset-0 touch-none" />
      <div className="absolute right-2.5 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-1">
        <button type="button" aria-label="Zoom in" onClick={() => dolly(1.18)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-base font-semibold text-[#17241e] shadow">+</button>
        <button type="button" aria-label="Zoom out" onClick={() => dolly(1 / 1.18)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-base font-semibold text-[#17241e] shadow">−</button>
      </div>
      <div className="absolute inset-x-2 top-16 z-20 flex gap-1.5 overflow-x-auto pb-1">
        {people.map((person) => {
          const meets = spendable >= person.asking;
          return (
            <button
              key={person.id}
              type="button"
              disabled={pending}
              onClick={() => {
                if (!meets) {
                  setMiss(`${person.name} asks ${naira(person.asking)}. Check someone whose price you can meet.`);
                  return;
                }
                setMiss(null);
                void onTake(person.id);
              }}
              className={`shrink-0 rounded-full px-3 py-2 text-left text-xs font-semibold shadow ${meets ? "bg-white text-[#17241e]" : "bg-white/50 text-[#5d6b62]"}`}
            >
              <span className="block">{person.name}</span>
              <span className={meets ? "text-[#1f6b45]" : "text-[#b5523a]"}>{naira(person.asking)}</span>
            </button>
          );
        })}
      </div>
      {miss ? <p className="absolute inset-x-3 bottom-28 z-20 rounded-2xl bg-[#fffaf2] px-3 py-2 text-xs text-[#17241e]">{miss}</p> : null}
    </div>
  );
}
