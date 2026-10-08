import * as THREE from "three";

const GOLD = 0xe0b15a;
const WOOD = 0x6a4630;
const DARK = 0x17241e;

function box(parent: THREE.Object3D, color: number, w: number, h: number, d: number, x: number, y: number, z: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function ball(parent: THREE.Object3D, color: number, r: number, x: number, y: number, z: number) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), new THREE.MeshLambertMaterial({ color }));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function post(parent: THREE.Object3D, color: number, r: number, h: number, x: number, y: number, z: number) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 12), new THREE.MeshLambertMaterial({ color }));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function chair(parent: THREE.Object3D, x: number, z: number, face: number) {
  const g = new THREE.Group();
  box(g, 0x8c5a32, 0.7, 0.1, 0.7, 0, 0.55, 0);
  box(g, 0x8c5a32, 0.7, 0.8, 0.1, 0, 1.0, -0.3);
  for (const lx of [-0.28, 0.28]) for (const lz of [-0.28, 0.28]) box(g, WOOD, 0.08, 0.55, 0.08, lx, 0.27, lz);
  g.position.set(x, 0, z);
  g.rotation.y = face;
  parent.add(g);
}

/** Furniture at floor height 0, centred on the origin, front toward +z. */
export function buildFurniture(id: string): THREE.Group {
  const g = new THREE.Group();
  switch (id) {
    case "bed": {
      box(g, WOOD, 2.4, 0.3, 2.1, 0, 0.3, 0);
      box(g, 0xf7f1e6, 2.2, 0.32, 1.85, 0, 0.6, 0.05);
      box(g, 0x8c3d2f, 2.4, 1.15, 0.14, 0, 0.85, -1);
      box(g, 0xf7f1e6, 0.72, 0.16, 0.42, -0.48, 0.84, -0.55);
      box(g, 0xf7f1e6, 0.72, 0.16, 0.42, 0.48, 0.84, -0.55);
      box(g, 0x245c78, 2.2, 0.12, 1.0, 0, 0.8, 0.5);
      break;
    }
    case "double-bed": {
      box(g, 0x4a2f1f, 3.2, 0.3, 2.4, 0, 0.3, 0);
      box(g, 0xf7f1e6, 3.0, 0.36, 2.15, 0, 0.62, 0.05);
      box(g, 0x7a2e1e, 3.2, 1.3, 0.16, 0, 0.95, -1.15);
      for (const x of [-0.8, 0.8]) box(g, 0xf7f1e6, 1.1, 0.18, 0.45, x, 0.88, -0.7);
      box(g, 0x1f6b45, 3.0, 0.14, 1.2, 0, 0.84, 0.55);
      box(g, GOLD, 3.0, 0.05, 0.1, 0, 0.92, -0.05);
      break;
    }
    case "wardrobe": {
      box(g, WOOD, 1.9, 2.3, 0.7, 0, 1.15, 0);
      box(g, 0x7b5438, 0.9, 2.1, 0.05, -0.47, 1.15, 0.37);
      box(g, 0x7b5438, 0.9, 2.1, 0.05, 0.47, 1.15, 0.37);
      box(g, GOLD, 0.06, 0.4, 0.06, -0.08, 1.15, 0.42);
      box(g, GOLD, 0.06, 0.4, 0.06, 0.08, 1.15, 0.42);
      break;
    }
    case "bedside": {
      box(g, WOOD, 0.6, 0.55, 0.5, 0, 0.28, 0);
      box(g, 0x8c5a32, 0.5, 0.1, 0.04, 0, 0.35, 0.26);
      post(g, GOLD, 0.04, 0.3, 0, 0.7, 0);
      box(g, 0xf7e7b4, 0.3, 0.22, 0.3, 0, 0.95, 0);
      break;
    }
    case "mirror": {
      box(g, 0x8c5a32, 1.5, 0.8, 0.7, 0, 0.4, 0);
      box(g, 0x6a4630, 1.5, 0.08, 0.7, 0, 0.82, 0);
      box(g, GOLD, 1.1, 1.5, 0.08, 0, 1.6, -0.25);
      box(g, 0xcfe7f0, 0.95, 1.35, 0.06, 0, 1.6, -0.2);
      break;
    }
    case "sofa": {
      box(g, 0x1f6b45, 3.1, 0.45, 1.15, 0, 0.42, 0);
      box(g, 0x174f34, 3.1, 0.8, 0.22, 0, 0.95, -0.5);
      box(g, 0x174f34, 0.22, 0.6, 1.15, -1.45, 0.62, 0);
      box(g, 0x174f34, 0.22, 0.6, 1.15, 1.45, 0.62, 0);
      box(g, 0x2a8a58, 1.2, 0.18, 0.95, -0.6, 0.72, 0.05);
      box(g, 0x2a8a58, 1.2, 0.18, 0.95, 0.6, 0.72, 0.05);
      box(g, GOLD, 0.45, 0.4, 0.14, -1.0, 1.0, -0.3);
      for (const x of [-1.35, 1.35]) box(g, WOOD, 0.12, 0.2, 0.12, x, 0.1, 0.45);
      break;
    }
    case "armchair": {
      box(g, 0xc4552a, 1.3, 0.42, 1.15, 0, 0.4, 0);
      box(g, 0xa84520, 1.3, 0.8, 0.2, 0, 0.9, -0.5);
      box(g, 0xa84520, 0.2, 0.55, 1.15, -0.55, 0.6, 0);
      box(g, 0xa84520, 0.2, 0.55, 1.15, 0.55, 0.6, 0);
      break;
    }
    case "table": {
      box(g, 0x8c5a32, 2.8, 0.14, 1.5, 0, 0.5, 0);
      box(g, 0xcfe7f0, 2.3, 0.05, 1.05, 0, 0.6, 0);
      box(g, GOLD, 2.8, 0.05, 0.08, 0, 0.54, 0.76);
      for (const x of [-1.25, 1.25]) for (const z of [-0.6, 0.6]) box(g, WOOD, 0.14, 0.44, 0.14, x, 0.22, z);
      box(g, 0x6a4630, 2.4, 0.08, 1.1, 0, 0.16, 0);
      post(g, 0xf7f1e6, 0.18, 0.28, -0.6, 0.77, 0);
      ball(g, 0x2f7a4a, 0.17, -0.6, 1.0, 0);
      box(g, 0x8c3d2f, 0.7, 0.06, 0.5, 0.6, 0.66, 0.1);
      break;
    }
    case "shelf": {
      box(g, WOOD, 1.8, 2.1, 0.5, 0, 1.05, 0);
      const books = [0x8c3d2f, 0x245c78, 0xe0b15a, 0x1f6b45, 0x7a3e6d];
      for (let row = 0; row < 4; row += 1) {
        box(g, 0x4a2f1f, 1.7, 0.05, 0.46, 0, 0.35 + row * 0.5, 0.02);
        for (let i = 0; i < 7; i += 1) box(g, books[(i + row) % books.length], 0.16, 0.36, 0.34, -0.7 + i * 0.23, 0.55 + row * 0.5, 0.05);
      }
      break;
    }
    case "television": {
      box(g, WOOD, 1.9, 0.5, 0.6, 0, 0.27, 0);
      box(g, 0x4a2f1f, 1.8, 0.04, 0.5, 0, 0.55, 0);
      box(g, DARK, 1.7, 1.0, 0.1, 0, 1.15, 0);
      box(g, 0x7fb9dc, 1.5, 0.82, 0.04, 0, 1.15, 0.07);
      box(g, DARK, 0.4, 0.06, 0.25, 0, 0.6, 0);
      break;
    }
    case "speaker": {
      for (const x of [-0.9, 0.9]) {
        box(g, DARK, 0.5, 1.5, 0.5, x, 0.75, 0);
        post(g, 0x3a3a3a, 0.16, 0.06, x, 1.05, 0.26).rotation.x = Math.PI / 2;
        post(g, 0x3a3a3a, 0.08, 0.06, x, 1.4, 0.26).rotation.x = Math.PI / 2;
      }
      box(g, 0x3a3a3a, 1.1, 0.25, 0.45, 0, 0.14, 0);
      box(g, GOLD, 0.7, 0.05, 0.05, 0, 0.14, 0.24);
      break;
    }
    case "desk": {
      box(g, 0x8c5a32, 1.7, 0.08, 0.9, 0, 0.9, 0);
      for (const x of [-0.75, 0.75]) box(g, WOOD, 0.1, 0.88, 0.8, x, 0.44, 0);
      box(g, DARK, 0.9, 0.55, 0.06, 0, 1.3, -0.15);
      box(g, 0x7fb9dc, 0.8, 0.45, 0.03, 0, 1.3, -0.11);
      box(g, DARK, 0.1, 0.25, 0.1, 0, 1.08, -0.15);
      box(g, 0x3a3a3a, 0.8, 0.04, 0.3, 0, 0.96, 0.2);
      chair(g, 0, 0.9, Math.PI);
      break;
    }
    case "fridge": {
      box(g, 0xd7e7f5, 0.95, 2.1, 0.8, 0, 1.05, 0);
      box(g, 0xb9c8d6, 0.9, 0.03, 0.04, 0, 1.38, 0.41);
      box(g, 0x8794a0, 0.06, 0.55, 0.06, 0.34, 1.7, 0.43);
      box(g, 0x8794a0, 0.06, 0.55, 0.06, 0.34, 0.95, 0.43);
      break;
    }
    case "freezer": {
      box(g, 0xf4f7fa, 1.5, 0.95, 0.85, 0, 0.48, 0);
      box(g, 0xd7e1e8, 1.52, 0.08, 0.87, 0, 1.0, 0);
      box(g, 0x8794a0, 0.5, 0.05, 0.06, 0, 1.06, 0.38);
      break;
    }
    case "cooker": {
      box(g, 0xe7e7e7, 0.95, 1.0, 0.8, 0, 0.5, 0);
      box(g, 0x3a3a3a, 0.9, 0.06, 0.75, 0, 1.03, 0);
      for (const x of [-0.22, 0.22]) for (const z of [-0.18, 0.18]) post(g, 0x111111, 0.12, 0.05, x, 1.08, z);
      box(g, 0x2a2a2a, 0.75, 0.5, 0.04, 0, 0.45, 0.41);
      for (const x of [-0.3, 0, 0.3]) post(g, GOLD, 0.04, 0.05, x, 0.88, 0.42).rotation.x = Math.PI / 2;
      break;
    }
    case "microwave": {
      box(g, 0x8c5a32, 0.9, 1.0, 0.6, 0, 0.5, 0);
      box(g, 0xd7dde2, 0.8, 0.42, 0.5, 0, 1.2, 0);
      box(g, 0x17241e, 0.5, 0.3, 0.03, -0.1, 1.2, 0.26);
      box(g, 0x3a3a3a, 0.14, 0.3, 0.03, 0.27, 1.2, 0.26);
      break;
    }
    case "dining": {
      box(g, 0x8c5a32, 2.2, 0.1, 1.2, 0, 1.0, 0);
      for (const x of [-0.95, 0.95]) for (const z of [-0.45, 0.45]) box(g, WOOD, 0.12, 0.95, 0.12, x, 0.48, z);
      box(g, 0xf7f1e6, 0.5, 0.02, 0.5, -0.5, 1.07, 0.1);
      box(g, 0xf7f1e6, 0.5, 0.02, 0.5, 0.5, 1.07, -0.1);
      chair(g, -0.6, 0.95, Math.PI);
      chair(g, 0.6, 0.95, Math.PI);
      chair(g, -0.6, -0.95, 0);
      chair(g, 0.6, -0.95, 0);
      break;
    }
    case "rug": {
      box(g, 0x1f6b45, 5, 0.03, 3.2, 0, 0.02, 0);
      box(g, GOLD, 5, 0.02, 0.1, 0, 0.04, -1.55);
      box(g, GOLD, 5, 0.02, 0.1, 0, 0.04, 1.55);
      box(g, GOLD, 0.1, 0.02, 3.2, -2.45, 0.04, 0);
      box(g, GOLD, 0.1, 0.02, 3.2, 2.45, 0.04, 0);
      box(g, 0x174f34, 3.4, 0.02, 1.8, 0, 0.04, 0);
      break;
    }
    case "lamp": {
      post(g, 0x3a3a3a, 0.2, 0.06, 0, 0.03, 0);
      post(g, GOLD, 0.04, 1.7, 0, 0.88, 0);
      const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 0.45, 14), new THREE.MeshLambertMaterial({ color: 0xf7e7b4, emissive: 0x4a3d12 }));
      shade.position.set(0, 1.85, 0);
      shade.castShadow = true;
      g.add(shade);
      break;
    }
    case "plant": {
      post(g, 0xc4552a, 0.3, 0.5, 0, 0.25, 0);
      ball(g, 0x2f7a4a, 0.42, 0, 0.85, 0);
      ball(g, 0x3b8f58, 0.3, 0.22, 1.15, 0.1);
      ball(g, 0x256a3c, 0.28, -0.2, 1.1, -0.08);
      break;
    }
    default:
      box(g, 0x8c5a32, 1, 0.8, 1, 0, 0.4, 0);
  }
  return g;
}
