import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { CarDeal } from "@/lib/game/content";
import { buildDetailedCarMesh } from "./carModels";

// Two real, detailed car models in public/models/cars:
//   supercar.glb — Ferrari 488 GTB by Karol Miklas (CC-BY 4.0), via three.js
//   sedan.glb    — Khronos CarConcept (CC-BY 4.0)
// Everything is normalised on load so the car faces +Z, sits on y = 0 and is CAR_LENGTH long.
export type RealKind = "supercar" | "sedan";

const FILES: Record<RealKind, string> = {
  supercar: "/models/cars/supercar.glb",
  sedan: "/models/cars/sedan.glb",
};
export const CAR_LENGTH = 4.6;

interface Loaded {
  template: THREE.Group;
  driver: THREE.Vector3;
  rear: THREE.Vector3;
}

const cache = new Map<RealKind, Loaded>();
const pending = new Map<RealKind, Promise<Loaded | null>>();

export function realKindFor(car: Pick<CarDeal, "category">): RealKind {
  if (car.category === "Supercar" || car.category === "Sports Coupe") return "supercar";
  return "sedan";
}

export function makeEnvironment(renderer: THREE.WebGLRenderer, scene: THREE.Scene, intensity = 0.9) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = target.texture;
  scene.environmentIntensity = intensity;
  pmrem.dispose();
  return target;
}

function normalise(root: THREE.Group, kind: RealKind): Loaded {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  const alongX = size.x > size.z;

  // front = the side the headlights are on
  const lights = new THREE.Box3();
  let found = false;
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    const name = `${obj.name} ${mats.map((m) => m.name).join(" ")}`;
    if (/headlight|projector|^lights$/i.test(name)) {
      lights.expandByObject(obj);
      found = true;
    }
  });
  const lc = found ? lights.getCenter(new THREE.Vector3()) : centre;
  const frontSign = (alongX ? lc.x - centre.x : lc.z - centre.z) >= 0 ? 1 : -1;

  const pivot = new THREE.Group();
  const inner = new THREE.Group();
  inner.add(root);
  root.position.set(-centre.x, -box.min.y, -centre.z);
  pivot.add(inner);
  // rotate so the front points down +Z
  inner.rotation.y = alongX ? (frontSign > 0 ? -Math.PI / 2 : Math.PI / 2) : frontSign > 0 ? 0 : Math.PI;
  const length = alongX ? size.x : size.z;
  pivot.scale.setScalar(CAR_LENGTH / length);
  pivot.updateMatrixWorld(true);

  // steering wheel / dash gives the driver's seat
  const wheel = new THREE.Box3();
  let wheelFound = false;
  pivot.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    if (/steering(_wheel|_leather|Dash)?$/i.test(obj.name) || /InteriorSteeringDash/i.test(obj.name)) {
      wheel.expandByObject(obj);
      wheelFound = true;
    }
  });
  const fit = new THREE.Box3().setFromObject(pivot);
  const width = fit.max.x - fit.min.x;
  const wc = wheelFound ? wheel.getCenter(new THREE.Vector3()) : new THREE.Vector3(width * 0.2, 0.95, kind === "supercar" ? 0.2 : 0.7);
  const driver = new THREE.Vector3(wc.x, Math.max(0.95, wc.y + 0.14), wc.z - 0.72);
  const rear = new THREE.Vector3(-driver.x * 0.35, driver.y - 0.04, driver.z - 1.15);

  const holder = new THREE.Group();
  holder.add(pivot);
  return { template: holder, driver, rear };
}

export function loadRealCar(kind: RealKind): Promise<Loaded | null> {
  const hit = cache.get(kind);
  if (hit) return Promise.resolve(hit);
  const wait = pending.get(kind);
  if (wait) return wait;
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const job = new Promise<Loaded | null>((resolve) => {
    loader.load(
      FILES[kind],
      (gltf) => {
        const done = normalise(gltf.scene, kind);
        cache.set(kind, done);
        resolve(done);
      },
      undefined,
      () => resolve(null),
    );
  });
  pending.set(kind, job);
  return job;
}

export function loadAllRealCars() {
  return Promise.all([loadRealCar("supercar"), loadRealCar("sedan")]);
}

if (typeof window !== "undefined") {
  void loadAllRealCars();
}

const PAINT = /^(Body_Color|Paint 1)/i;
const INTERIOR_MATS = /leather|interior|carpet|steering|seat|dashboard|floormat|mechanical|carbon/i;

export interface RealCarOptions {
  color: number;
  plain?: boolean; // traffic: drop the interior to keep the scene light
}

/** Returns a fresh painted copy, or null while the model is still loading. */
export function makeRealCar(kind: RealKind, options: RealCarOptions): { group: THREE.Group; driver: THREE.Vector3; rear: THREE.Vector3; steer: THREE.Object3D | null } | null {
  const loaded = cache.get(kind);
  if (!loaded) return null;
  const group = loaded.template.clone(true);
  const swapped = new Map<THREE.Material, THREE.Material>();
  const own = (material: THREE.Material) => {
    let copy = swapped.get(material);
    if (!copy) {
      copy = material.clone();
      swapped.set(material, copy);
      const std = copy as THREE.MeshStandardMaterial;
      const phys = copy as THREE.MeshPhysicalMaterial;
      if ("iridescence" in phys) phys.iridescence = 0;
      if ("transmission" in phys && !/glass/i.test(material.name)) phys.transmission = 0;
      if ("transmission" in phys && phys.transmission > 0) {
        phys.transmission = 0;
        phys.transparent = true;
        phys.opacity = 0.22;
        phys.depthWrite = false;
      }
      if (/glass|windshield/i.test(material.name)) {
        std.transparent = true;
        std.opacity = Math.min(std.opacity || 1, 0.22);
        std.depthWrite = false;
        if ("roughness" in std) std.roughness = 0.06;
      }
      if (PAINT.test(material.name) && std.color) {
        std.color.setHex(options.color);
        if ("map" in std) std.map = null;
        if ("metalness" in std) std.metalness = 0.9;
        if ("roughness" in std) std.roughness = 0.18;
      }
    }
    return copy;
  };
  const hide: THREE.Object3D[] = [];
  group.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    obj.material = Array.isArray(obj.material) ? mats.map(own) : own(obj.material);
    obj.castShadow = true;
    if (options.plain) {
      const label = `${obj.name} ${mats.map((m) => m.name).join(" ")}`;
      if (INTERIOR_MATS.test(label) && !/glass|body/i.test(label)) hide.push(obj);
    }
  });
  for (const obj of hide) obj.visible = false;

  // gather the steering wheel parts onto one pivot so the wheel can turn with the road
  let steer: THREE.Object3D | null = null;
  if (!options.plain) {
    group.updateMatrixWorld(true);
    const parts: THREE.Object3D[] = [];
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh && (/^steering_(wheel|carbon|centre|leather|metal|red_lights|trim)/i.test(obj.name) || /^InteriorSteeringWheel/i.test(obj.name))) parts.push(obj);
    });
    if (parts.length > 0) {
      const box = new THREE.Box3();
      parts.forEach((part) => box.expandByObject(part));
      const pivot = new THREE.Group();
      pivot.position.copy(box.getCenter(new THREE.Vector3()));
      group.add(pivot);
      pivot.updateMatrixWorld(true);
      parts.forEach((part) => pivot.attach(part));
      steer = pivot;
    }
  }
  return { group, driver: loaded.driver.clone(), rear: loaded.rear.clone(), steer };
}

/** GLB when the model is ready, otherwise a solid 3D body — never a flat photo. */
export function carGroupFor(car: Pick<CarDeal, "category" | "defaultColor">, opts?: { color?: number; plain?: boolean }): THREE.Group {
  const color = opts?.color ?? car.defaultColor;
  const made = makeRealCar(realKindFor(car), { color, plain: opts?.plain });
  if (made) return made.group;
  return buildDetailedCarMesh(car, color, opts?.plain ?? false);
}
