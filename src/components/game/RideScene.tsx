"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type RideVehicle = "car" | "bus";

const CORNERS = [
  new THREE.Vector3(0, 0, 8),
  new THREE.Vector3(0, 0, -36),
  new THREE.Vector3(34, 0, -36),
  new THREE.Vector3(34, 0, -78),
  new THREE.Vector3(78, 0, -78),
  new THREE.Vector3(78, 0, -118),
];

export function RideScene({ vehicle, onArrive }: { vehicle: RideVehicle; onArrive: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<"inside" | "above">("inside");
  const [seat, setSeat] = useState<"inside" | "above">("inside");
  const finished = useRef(false);

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
    root.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#9ec4ea");
    scene.fog = new THREE.Fog("#9ec4ea", 28, 90);
    scene.add(new THREE.HemisphereLight(0xfff6e8, 0x6d8a52, 1.05));
    const sun = new THREE.DirectionalLight(0xfff3dd, 1.15);
    sun.position.set(20, 28, 10);
    scene.add(sun);

    const lengths: number[] = [];
    let total = 0;
    for (let i = 0; i < CORNERS.length - 1; i += 1) {
      const len = CORNERS[i].distanceTo(CORNERS[i + 1]);
      lengths.push(len);
      total += len;
    }
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.MeshLambertMaterial({ color: 0xc5d6a8 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(40, -0.02, -55);
    scene.add(ground);

    function roadBox(from: THREE.Vector3, to: THREE.Vector3) {
      const dir = to.clone().sub(from);
      const len = dir.length();
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.08, len + 7.2), new THREE.MeshLambertMaterial({ color: 0x4a514c }));
      mesh.position.copy(from).add(to).multiplyScalar(0.5);
      mesh.position.y = 0.04;
      mesh.rotation.y = Math.atan2(dir.x, dir.z);
      scene.add(mesh);
      const dashCount = Math.floor(len / 4);
      for (let i = 1; i < dashCount; i += 1) {
        const dash = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 1.4), new THREE.MeshBasicMaterial({ color: 0xf4efe4 }));
        dash.position.copy(from).lerp(to, i / dashCount);
        dash.position.y = 0.09;
        dash.rotation.y = mesh.rotation.y;
        scene.add(dash);
      }
    }
    for (let i = 0; i < CORNERS.length - 1; i += 1) roadBox(CORNERS[i], CORNERS[i + 1]);

    function wheel(x: number, y: number, z: number) {
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.22, 12), new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
      tire.rotation.z = Math.PI / 2;
      tire.position.set(x, y, z);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.24, 8), new THREE.MeshLambertMaterial({ color: 0xd5d8de }));
      rim.rotation.z = Math.PI / 2;
      rim.position.set(x, y, z);
      return [tire, rim];
    }

    const rig = new THREE.Group();
    scene.add(rig);
    if (vehicle === "bus") {
      rig.add(new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.35, 7.2), new THREE.MeshLambertMaterial({ color: 0x1f6b45 })));
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.7, 6.6), new THREE.MeshLambertMaterial({ color: 0xf4efe4 }));
      body.position.y = 1.15;
      rig.add(body);
      const glass = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.7, 5.4), new THREE.MeshLambertMaterial({ color: 0x8ec4ea }));
      glass.position.set(0, 1.45, 0.1);
      rig.add(glass);
      const wind = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.7, 0.08), new THREE.MeshLambertMaterial({ color: 0xd7eef8 }));
      wind.position.set(0, 1.4, 3.28);
      rig.add(wind);
      rig.add(new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 0.2), new THREE.MeshBasicMaterial({ color: 0xfff6d8 })).translateY(0.7).translateZ(3.35));
      [-2.2, 2.1].forEach((z) => {
        wheel(-1.15, 0.34, z).forEach((part) => rig.add(part));
        wheel(1.15, 0.34, z).forEach((part) => rig.add(part));
      });
    } else {
      const paint = new THREE.MeshLambertMaterial({ color: 0x17241e });
      const lower = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.48, 4.15), paint);
      lower.position.y = 0.52;
      rig.add(lower);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.62, 1.9), new THREE.MeshLambertMaterial({ color: 0xb7d4ea }));
      cabin.position.set(0, 1.02, -0.15);
      rig.add(cabin);
      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.22, 1.35), paint);
      hood.position.set(0, 0.78, 1.35);
      rig.add(hood);
      const wind = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.55, 0.06), new THREE.MeshLambertMaterial({ color: 0xe7f4fb }));
      wind.position.set(0, 1.05, 0.78);
      wind.rotation.x = -0.35;
      rig.add(wind);
      const dash = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 0.45), new THREE.MeshLambertMaterial({ color: 0x2a241c }));
      dash.position.set(0, 0.78, 0.55);
      rig.add(dash);
      [-1.25, 1.25].forEach((z) => {
        wheel(-0.92, 0.34, z).forEach((part) => rig.add(part));
        wheel(0.92, 0.34, z).forEach((part) => rig.add(part));
      });
      const lampL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.06), new THREE.MeshBasicMaterial({ color: 0xfff6d0 }));
      lampL.position.set(-0.55, 0.62, 2.08);
      const lampR = lampL.clone();
      lampR.position.x = 0.55;
      rig.add(lampL, lampR);
    }

    const paints = [0xc4552a, 0x245c78, 0xf2c14e, 0xf7fbfc, 0x8c2438, 0x1f6b45];
    const others = paints.map((color, index) => {
      const car = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 3.6), new THREE.MeshLambertMaterial({ color }));
      body.position.y = 0.55;
      const glass = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 1.5), new THREE.MeshLambertMaterial({ color: 0x9ec8e0 }));
      glass.position.set(0, 0.95, -0.1);
      car.add(body, glass);
      scene.add(car);
      return { car, lane: index % 2 === 0 ? 2.15 : -2.15, shift: (index + 1) / (paints.length + 1), speed: 0.72 + (index % 3) * 0.18 };
    });

    function pose(distance: number) {
      let walked = 0;
      for (let i = 0; i < lengths.length; i += 1) {
        const len = lengths[i];
        if (walked + len >= distance || i === lengths.length - 1) {
          const along = Math.min(1, Math.max(0, (distance - walked) / len));
          const from = CORNERS[i];
          const to = CORNERS[i + 1];
          const dir = to.clone().sub(from).normalize();
          const point = from.clone().lerp(to, along);
          let heading = Math.atan2(dir.x, dir.z);
          const into = distance - walked;
          const left = walked + len - distance;
          if (into < 5 && i > 0) {
            const prev = CORNERS[i].clone().sub(CORNERS[i - 1]).normalize();
            const blend = into / 5;
            heading = Math.atan2(
              prev.x * (1 - blend) + dir.x * blend,
              prev.z * (1 - blend) + dir.z * blend,
            );
          } else if (left < 5 && i < lengths.length - 1) {
            const next = CORNERS[i + 2].clone().sub(CORNERS[i + 1]).normalize();
            const blend = left / 5;
            heading = Math.atan2(
              dir.x * blend + next.x * (1 - blend),
              dir.z * blend + next.z * (1 - blend),
            );
          }
          return { point, heading, dir };
        }
        walked += len;
      }
      const last = CORNERS[CORNERS.length - 1];
      return { point: last.clone(), heading: 0, dir: new THREE.Vector3(0, 0, -1) };
    }

    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 180);
    const fit = () => {
      renderer.setSize(root.clientWidth || 1, root.clientHeight || 1);
      camera.aspect = (root.clientWidth || 1) / Math.max(1, root.clientHeight);
      camera.updateProjectionMatrix();
    };
    fit();
    let frame = 0;
    let alive = true;
    const started = performance.now();
    const loop = () => {
      if (!alive) return;
      const t = Math.min(1, (performance.now() - started) / 11000);
      const here = pose(t * total);
      rig.position.copy(here.point);
      rig.position.y = 0;
      rig.rotation.y = here.heading;
      const side = new THREE.Vector3(Math.cos(here.heading), 0, -Math.sin(here.heading));
      others.forEach((item) => {
        const at = pose(((t * item.speed + item.shift) % 1) * total);
        item.car.position.copy(at.point).add(side.clone().multiplyScalar(item.lane));
        item.car.position.y = 0;
        item.car.rotation.y = at.heading;
      });
      if (view.current === "inside") {
        const eye = here.point.clone();
        eye.y = vehicle === "bus" ? 1.55 : 1.05;
        eye.add(here.dir.clone().multiplyScalar(vehicle === "bus" ? 1.4 : 0.35));
        eye.add(side.clone().multiplyScalar(vehicle === "bus" ? 0.45 : 0.32));
        camera.position.copy(eye);
        camera.lookAt(eye.clone().add(here.dir));
      } else {
        camera.position.set(
          here.point.x - Math.sin(here.heading) * 16,
          14,
          here.point.z - Math.cos(here.heading) * 16,
        );
        camera.lookAt(here.point.x, 1, here.point.z);
      }
      renderer.render(scene, camera);
      if (t >= 1) arrive();
      frame = window.requestAnimationFrame(loop);
    };
    loop();
    const onResize = () => fit();
    window.addEventListener("resize", onResize);
    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (root.contains(renderer.domElement)) root.removeChild(renderer.domElement);
    };
  }, [vehicle]);

  return (
    <div className="absolute inset-0 z-[80] bg-[#10211a]">
      <div ref={host} className="absolute inset-0 touch-none" />
      <div className="pointer-events-none absolute left-3 top-16 z-10 max-w-[12rem] rounded-2xl bg-[#0e1c16]/80 px-3 py-2 text-[#f6f1e6]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e0b15a]">{vehicle === "bus" ? "Bus" : "Car"}</p>
        <p className="text-sm font-semibold">{seat === "inside" ? "From your seat" : "From above"}</p>
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
          Inside
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
    </div>
  );
}
