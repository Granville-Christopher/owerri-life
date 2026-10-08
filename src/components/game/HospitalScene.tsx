"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { LookId } from "@/lib/game/types";
import { createRealisticHuman } from "@/lib/game/humanModel";
import { attachSceneCameraControls } from "./sceneCameraControls";

function boardTexture(title: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 200;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  ctx.fillStyle = "#f7fbfc";
  ctx.fillRect(0, 0, 640, 200);
  ctx.fillStyle = "#c4552a";
  ctx.fillRect(0, 0, 640, 12);
  ctx.fillStyle = "#17241e";
  ctx.textAlign = "center";
  ctx.font = "700 44px sans-serif";
  ctx.fillText(title.slice(0, 24), 320, 96);
  ctx.fillStyle = "#c4552a";
  ctx.font = "600 30px sans-serif";
  ctx.fillText("RECEPTION · WARD · EMERGENCY", 320, 150);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function HospitalScene({ look, title, placeId }: { look: LookId; title: string; placeId: string }) {
  const host = useRef<HTMLDivElement>(null);
  const rig = useRef({ yaw: 0.12, zoom: 1 });

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(root.clientWidth, root.clientHeight);
    root.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#dbe8ee");
    scene.add(new THREE.HemisphereLight(0xf4fbff, 0xb9c9cf, 1));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(6, 12, 8);
    scene.add(sun);
    const lamp = new THREE.PointLight(0xe8f6ff, 6, 22);
    lamp.position.set(0, 3.2, -1);
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

    // shell: floor, back wall, left wall, half right wall
    box(0xe9eff2, 17, 0.12, 14, 0, 0.06, 0);
    for (let i = -8; i <= 8; i += 2) box(0xdbe5ea, 0.04, 0.02, 14, i, 0.13, 0);
    box(0xf4f8fa, 17, 3.6, 0.2, 0, 1.8, -7);
    box(0xf4f8fa, 0.2, 3.6, 14, -8.5, 1.8, 0);
    box(0xf4f8fa, 0.2, 3.6, 6, 8.5, 1.8, -4);
    box(0x2f8f83, 17, 0.18, 0.24, 0, 3.5, -6.92);
    box(0x2f8f83, 17, 0.5, 0.22, 0, 0.3, -6.92);
    box(0x2f8f83, 0.22, 0.5, 14, -8.4, 0.3, 0);
    // guide line on floor toward the ward
    box(0x2f8f83, 0.3, 0.02, 12, 0, 0.14, 0);
    box(0xc4552a, 0.3, 0.02, 7, 4.2, 0.145, -2.5);

    const boardMesh = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.45), new THREE.MeshBasicMaterial({ map: boardTexture(title) }));
    boardMesh.position.set(0, 2.55, -6.8);
    add(boardMesh);
    // red cross
    box(0xc4552a, 1.1, 0.34, 0.06, -6.4, 2.6, -6.88);
    box(0xc4552a, 0.34, 1.1, 0.06, -6.4, 2.6, -6.88);
    // clock
    cyl(0xf7fbfc, 0.42, 0.06, 6.4, 2.6, -6.86).rotation.x = Math.PI / 2;
    box(0x17241e, 0.04, 0.3, 0.02, 6.4, 2.68, -6.82);
    box(0x17241e, 0.22, 0.04, 0.02, 6.5, 2.6, -6.82);

    // reception desk with computer and receptionist
    box(0x2f8f83, 5.2, 1.05, 1.2, -3.6, 0.6, -4.6);
    box(0xf7fbfc, 5.4, 0.1, 1.3, -3.6, 1.18, -4.6);
    box(0x17241e, 0.8, 0.5, 0.06, -4.6, 1.55, -4.8);
    box(0x17241e, 0.3, 0.1, 0.3, -4.6, 1.28, -4.8);
    box(0xf2c14e, 0.5, 0.06, 0.4, -2.4, 1.24, -4.4);
    person("ngozi", -3.6, -5.7, 0, 0x2f8f83);

    // waiting area: rows of chairs with patients
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const x = -7 + col * 1.5;
        const z = 0.4 + row * 2.2;
        box(0x245c78, 0.9, 0.12, 0.8, x, 0.55, z);
        box(0x245c78, 0.9, 0.7, 0.12, x, 0.92, z - 0.4);
        box(0xb7c2c8, 0.08, 0.5, 0.08, x - 0.38, 0.28, z + 0.3);
        box(0xb7c2c8, 0.08, 0.5, 0.08, x + 0.38, 0.28, z + 0.3);
      }
    }
    person("ibe", -7, 0.55, 0, 0xd6a642, true);
    person("zara", -4, 2.75, 0, 0x9b4f7a, true);
    box(0xb08a5a, 0.9, 0.5, 0.6, -5.5, 0.35, -1.4);
    // wheelchair
    box(0x17241e, 0.7, 0.1, 0.7, -1.6, 0.55, 3.8);
    box(0x17241e, 0.7, 0.8, 0.1, -1.6, 0.95, 3.45);
    cyl(0x17241e, 0.36, 0.08, -1.98, 0.38, 3.8).rotation.z = Math.PI / 2;
    cyl(0x17241e, 0.36, 0.08, -1.22, 0.38, 3.8).rotation.z = Math.PI / 2;

    // ward on the right: three beds with curtains, IV stands, doctor and nurse
    const bed = (z: number) => {
      box(0xb7c2c8, 1.3, 0.5, 2.5, 5.6, 0.4, z);
      box(0xf7fbfc, 1.2, 0.2, 2.4, 5.6, 0.75, z);
      box(0xf7fbfc, 1, 0.14, 0.6, 5.6, 0.92, z - 0.85);
      box(0x7ec8e3, 1.22, 0.1, 1.4, 5.6, 0.88, z + 0.45);
      box(0xb7c2c8, 1.3, 0.9, 0.1, 5.6, 0.85, z - 1.25);
      // curtain rail
      box(0xb7c2c8, 0.06, 0.06, 2.8, 6.9, 3.1, z);
      box(0x9fd0ea, 0.05, 2.2, 1.3, 6.9, 2, z - 0.7);
      box(0x9fd0ea, 0.05, 2.2, 1.3, 6.9, 2, z + 0.7);
    };
    bed(-4);
    bed(-0.9);
    bed(2.2);
    for (const z of [-4, -0.9, 2.2]) {
      cyl(0xb7c2c8, 0.04, 2.1, 4.5, 1.05, z - 0.6);
      box(0xf7fbfc, 0.18, 0.3, 0.1, 4.5, 2.05, z - 0.6);
      box(0x17241e, 0.5, 0.05, 0.05, 4.5, 0.08, z - 0.6);
    }
    // patient lying (just a head on the pillow and a covered body)
    box(0xe0c9a8, 0.3, 0.3, 0.3, 5.6, 1.12, -4.85);
    box(0xf7fbfc, 1.05, 0.22, 1.4, 5.6, 1.0, -3.8);
    person("emeka", 4.3, -3.2, Math.PI / 2, 0xf7fbfc, false, 0x2f8f83);
    person("ada", 4.4, 1.3, Math.PI / 2, 0x2f8f83);
    // trolley with supplies
    box(0xb7c2c8, 1, 0.1, 0.6, 2.2, 0.95, -5.6);
    box(0xb7c2c8, 0.06, 0.9, 0.06, 1.75, 0.5, -5.6);
    box(0xb7c2c8, 0.06, 0.9, 0.06, 2.65, 0.5, -5.6);
    box(0xc4552a, 0.3, 0.14, 0.3, 2.0, 1.05, -5.6);
    box(0xf7fbfc, 0.3, 0.14, 0.3, 2.45, 1.05, -5.6);
    // plant and sanitiser
    cyl(0x6a4630, 0.28, 0.5, 7.7, 0.25, 4.4);
    const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), new THREE.MeshLambertMaterial({ color: 0x2f7a4b }));
    leaves.position.set(7.7, 0.95, 4.4);
    add(leaves);
    box(0xf7fbfc, 0.2, 0.7, 0.2, -8.2, 1.05, 4.6);
    // the player, waiting in the corridor
    person(look, 0, 3.2, Math.PI);

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
    const detachControls = attachSceneCameraControls(root, rig, { minZoom: 0.7, maxZoom: 2.2, zoomSpeed: 0.08 });
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
  }, [look, placeId, title]);

  function dolly(factor: number) {
    rig.current.zoom = Math.min(2.2, Math.max(0.7, rig.current.zoom * factor));
  }

  return (
    <div className="absolute inset-0 bg-[#dbe8ee]">
      <div ref={host} className="absolute inset-0 touch-none" />
      <div className="absolute left-2 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-1">
        <button type="button" aria-label="Zoom in" onClick={() => dolly(1.18)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-base font-semibold text-[#17241e] shadow">+</button>
        <button type="button" aria-label="Zoom out" onClick={() => dolly(1 / 1.18)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-base font-semibold text-[#17241e] shadow">−</button>
      </div>
    </div>
  );
}
