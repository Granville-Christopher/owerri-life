"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { makeRenderer } from "@/lib/game/renderQuality";
import type { LookId } from "@/lib/game/types";
import { addPlayerGuests, createRealisticHuman, type CrowdPerson } from "@/lib/game/humanModel";
import { attachSceneCameraControls, clampViewZoom, VIEW_ZOOM } from "./sceneCameraControls";

function boardTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 220;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  ctx.fillStyle = "#0f2740";
  ctx.fillRect(0, 0, 720, 220);
  ctx.fillStyle = "#e0b15a";
  ctx.fillRect(0, 0, 720, 14);
  ctx.fillStyle = "#f7fbfc";
  ctx.textAlign = "center";
  ctx.font = "700 42px sans-serif";
  ctx.fillText("IMO STATE CID", 360, 92);
  ctx.fillStyle = "#e0b15a";
  ctx.font = "600 26px sans-serif";
  ctx.fillText("ENQUIRY · CHARGE ROOM · CELLS", 360, 148);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function PoliceStationScene({ look, title, people = [], selfId }: { look: LookId; title: string; people?: CrowdPerson[]; selfId?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const rig = useRef({ yaw: 0.1, zoom: 1 });

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const renderer = makeRenderer();
    renderer.setSize(root.clientWidth, root.clientHeight);
    root.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#d7dde4");
    scene.add(new THREE.HemisphereLight(0xf4f7fb, 0x8a96a4, 1));
    const sun = new THREE.DirectionalLight(0xffffff, 0.85);
    sun.position.set(5, 11, 7);
    scene.add(sun);
    const lamp = new THREE.PointLight(0xfff2d0, 5, 20);
    lamp.position.set(0, 3.1, -1);
    scene.add(lamp);

    const room = new THREE.Group();
    scene.add(room);
    const add = (mesh: THREE.Object3D) => room.add(mesh);
    const box = (color: number, w: number, h: number, d: number, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
      mesh.position.set(x, y, z);
      add(mesh);
      return mesh;
    };
    const cyl = (color: number, r: number, h: number, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 12), new THREE.MeshLambertMaterial({ color }));
      mesh.position.set(x, y, z);
      add(mesh);
      return mesh;
    };
    const person = (lookId: LookId, x: number, z: number, facing: number, shirt?: number, seated = false, pants?: number) => {
      const body = createRealisticHuman({ lookId, seated, scale: 0.9, customShirt: shirt, customPants: pants });
      body.position.set(x, 0, z);
      body.rotation.y = facing;
      add(body);
      return body;
    };

    box(0xcfd6de, 18, 0.12, 15, 0, 0.06, 0);
    for (let i = -8; i <= 8; i += 2) box(0xb9c3ce, 0.04, 0.02, 15, i, 0.13, 0);
    box(0xe8edf2, 18, 3.7, 0.2, 0, 1.85, -7.4);
    box(0xe8edf2, 0.2, 3.7, 15, -9, 1.85, 0);
    box(0xe8edf2, 0.2, 3.7, 6.4, 9, 1.85, -4.1);
    box(0x1d4a66, 18, 0.2, 0.22, 0, 3.6, -7.32);
    box(0xe0b15a, 18, 0.12, 0.2, 0, 0.28, -7.32);

    const board = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 1.5), new THREE.MeshBasicMaterial({ map: boardTexture() }));
    board.position.set(0, 2.6, -7.28);
    add(board);
    box(0x1d4a66, 1.2, 0.7, 0.06, -7.2, 2.7, -7.28);
    box(0xe0b15a, 0.9, 0.18, 0.07, -7.2, 2.7, -7.26);

    box(0x17384c, 6.2, 1.15, 1.35, -2.8, 0.62, -4.8);
    box(0xf4efe4, 6.4, 0.1, 1.5, -2.8, 1.24, -4.8);
    box(0x9fd0ea, 5.4, 0.9, 0.04, -2.8, 1.8, -4.12);
    box(0x17241e, 0.7, 0.46, 0.06, -4.4, 1.58, -5.1);
    box(0xf2c14e, 0.45, 0.05, 0.35, -1.4, 1.3, -4.5);
    person("chidi", -2.8, -5.85, 0, 0x1d4a66, false, 0x17241e);

    for (let col = 0; col < 4; col += 1) {
      const x = -7.4 + col * 1.45;
      box(0x245c78, 0.95, 0.12, 0.8, x, 0.55, 1.1);
      box(0x245c78, 0.95, 0.72, 0.12, x, 0.94, 0.7);
      box(0x8a96a4, 0.08, 0.5, 0.08, x - 0.38, 0.28, 1.4);
      box(0x8a96a4, 0.08, 0.5, 0.08, x + 0.38, 0.28, 1.4);
    }
    person("ibe", -7.4, 1.25, 0, 0xc4552a, true);
    person("ngozi", -4.5, 1.25, 0, 0x7a3e6d, true);

    box(0x6a4630, 1.1, 2.2, 0.08, 1.8, 1.15, -7.28);
    box(0x6a4630, 0.08, 2.2, 2.4, 2.35, 1.15, -6.1);
    box(0x4a5560, 2.2, 2.15, 0.06, 3.5, 1.15, -7.28);
    for (let i = 0; i < 6; i += 1) box(0x2d3748, 0.07, 2.1, 0.07, 2.55 + i * 0.38, 1.15, -5.0);
    box(0x2d3748, 2.3, 0.1, 0.1, 3.5, 2.25, -5.0);
    box(0x2d3748, 2.3, 0.1, 0.1, 3.5, 0.2, -5.0);
    box(0x3a3230, 1.8, 0.12, 1.4, 3.5, 0.18, -6.2);
    person("emeka", 3.5, -6.15, Math.PI, 0x4a5560, true, 0x17241e);

    box(0x1d4a66, 3.4, 1.05, 1.1, 6.6, 0.58, -3.4);
    box(0xf4efe4, 3.6, 0.08, 1.2, 6.6, 1.14, -3.4);
    box(0x17241e, 0.55, 0.4, 0.05, 5.7, 1.45, -3.7);
    person("ada", 6.6, -4.3, 0, 0x1d4a66, false, 0x17241e);

    box(0xd9d3c4, 1.6, 1.8, 0.08, 7.4, 1.7, -7.28);
    box(0x7a2e1e, 1.3, 0.9, 0.04, 7.4, 1.85, -7.24);
    cyl(0xd1d5db, 0.06, 2.4, -8.4, 1.2, 5.4);
    box(0x1f6b45, 0.9, 0.55, 0.04, -7.95, 2.2, 5.4);
    box(0xe0b15a, 0.9, 0.18, 0.04, -7.95, 2.48, 5.4);

    box(0x8a96a4, 0.7, 1.1, 0.5, 0.8, 0.6, 4.6);
    box(0x245c78, 0.18, 0.7, 0.18, 0.55, 1.4, 4.6);
    person(look, 0.2, 3.4, Math.PI);
    addPlayerGuests(room, people, selfId, { x: 0.2, z: 2.4, rot: Math.PI });

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 90);
    const aim = new THREE.Vector3(9, 8, 14).normalize();
    const fit = () => {
      const width = root.clientWidth || 1;
      const height = root.clientHeight || 1;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    fit();
    const detachControls = attachSceneCameraControls(root, rig, { minZoom: VIEW_ZOOM.min, maxZoom: VIEW_ZOOM.max, zoomSpeed: VIEW_ZOOM.speed });
    let frame = 0;
    let alive = true;
    const loop = () => {
      if (!alive) return;
      room.rotation.y = rig.current.yaw;
      camera.position.copy(aim).multiplyScalar((26 * Math.max(1, 1.1 / camera.aspect)) / rig.current.zoom);
      camera.lookAt(0, 1.1, -0.4);
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
  }, [look, title, people.map((person) => person.id).join("|"), selfId]);

  function dolly(factor: number) {
    rig.current.zoom = clampViewZoom(rig.current.zoom, factor);
  }

  return (
    <div className="absolute inset-0 bg-[#d7dde4]">
      <div ref={host} className="absolute inset-0 touch-none" />
      <div className="absolute right-2.5 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-1">
        <button type="button" aria-label="Zoom in" onClick={() => dolly(1.18)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-base font-semibold text-[#17241e] shadow">+</button>
        <button type="button" aria-label="Zoom out" onClick={() => dolly(1 / 1.18)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-base font-semibold text-[#17241e] shadow">−</button>
      </div>
    </div>
  );
}
