import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const FILE = "/models/planes/a320.glb";
export const AIRLINER_LENGTH = 24;

let template: THREE.Group | null = null;
let pending: Promise<THREE.Group | null> | null = null;

function longestOnZ(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  if (size.x > size.z && size.x > size.y) root.rotation.y += Math.PI / 2;
  else if (size.y > size.z && size.y > size.x) root.rotation.x += Math.PI / 2;
  root.updateMatrixWorld(true);
}

function noseToPlusZ(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const centre = box.getCenter(new THREE.Vector3());
  const span = box.max.x - box.min.x;
  let wingZ = 0;
  let count = 0;
  const sample = new THREE.Vector3();
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || !obj.geometry?.attributes.position) return;
    const pos = obj.geometry.attributes.position;
    const step = Math.max(1, Math.floor(pos.count / 900));
    for (let i = 0; i < pos.count; i += step) {
      sample.fromBufferAttribute(pos, i);
      obj.localToWorld(sample);
      if (Math.abs(sample.x - centre.x) > span * 0.36) {
        wingZ += sample.z;
        count += 1;
      }
    }
  });
  if (count && wingZ / count > centre.z) root.rotation.y += Math.PI;
  root.updateMatrixWorld(true);
}

function finish(scene: THREE.Group) {
  const inner = new THREE.Group();
  inner.add(scene);
  longestOnZ(inner);
  noseToPlusZ(inner);

  inner.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(inner);
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  inner.position.set(-centre.x, -box.min.y, -centre.z);
  const holder = new THREE.Group();
  holder.add(inner);
  const length = Math.max(size.z, 1);
  holder.scale.setScalar(AIRLINER_LENGTH / length);
  holder.updateMatrixWorld(true);
  const fit = new THREE.Box3().setFromObject(holder);
  const mid = fit.getCenter(new THREE.Vector3());
  holder.position.set(-mid.x, -fit.min.y * 0.15, -mid.z);
  return holder;
}

export function loadRealAirliner(): Promise<THREE.Group | null> {
  if (template) return Promise.resolve(template.clone(true));
  if (pending) return pending.then((hit) => (hit ? hit.clone(true) : null));
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  pending = new Promise((resolve) => {
    loader.load(
      FILE,
      (gltf) => {
        template = finish(gltf.scene);
        resolve(template);
      },
      undefined,
      () => resolve(null),
    );
  });
  return pending.then((hit) => (hit ? hit.clone(true) : null));
}

if (typeof window !== "undefined") void loadRealAirliner();
