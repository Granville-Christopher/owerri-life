import * as THREE from "three";
import type { CarDeal } from "@/lib/game/content";

// Detailed car meshes shared by the car stand and the ride scene. Front of the car is +z.
// `plain` swaps shiny materials for matte ones so the car reads well without an environment map.
export function buildDetailedCarMesh(car: Pick<CarDeal, "category" | "defaultColor">, bodyColor?: number, plain = false): THREE.Group {
  const group = new THREE.Group();
  const color = bodyColor ?? car.defaultColor;

  const bodyMat: THREE.Material = plain
    ? new THREE.MeshLambertMaterial({ color })
    : new THREE.MeshStandardMaterial({ color, roughness: 0.18, metalness: 0.82 });
  const glassMat: THREE.Material = plain
    ? new THREE.MeshLambertMaterial({ color: 0x24364a })
    : new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.05, metalness: 0.95 });
  const blackTrimMat = new THREE.MeshLambertMaterial({ color: 0x111827 });
  const chromeMat: THREE.Material = plain
    ? new THREE.MeshLambertMaterial({ color: 0xd8dee6 })
    : new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
  const wheelRubberMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
  const rimMat: THREE.Material = plain
    ? new THREE.MeshLambertMaterial({ color: 0xc9ced6 })
    : new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 });
  const headLightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  const box = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = !plain;
    mesh.receiveShadow = !plain;
    group.add(mesh);
    return mesh;
  };

  let wheelRadius = 0.36;
  let wheelX = 0.94;
  let wheelZFront = 1.35;
  let wheelZRear = -1.35;

  if (car.category === "SUV") {
    box(1.9, 0.72, 4.2, bodyMat, 0, 0.76, 0);
    box(1.82, 0.78, 2.7, bodyMat, 0, 1.45, -0.35);
    box(1.78, 0.08, 2.76, blackTrimMat, 0, 1.88, -0.35);
    box(1.84, 0.52, 0.06, glassMat, 0, 1.42, 1.01);
    box(1.84, 0.52, 0.06, glassMat, 0, 1.42, -1.71);
    box(0.06, 0.48, 2.4, glassMat, -0.92, 1.42, -0.35);
    box(0.06, 0.48, 2.4, glassMat, 0.92, 1.42, -0.35);
    box(1.5, 0.45, 0.1, blackTrimMat, 0, 0.72, 2.12);
    box(0.3, 0.3, 0.12, chromeMat, 0, 0.72, 2.13);
    box(1.7, 0.35, 0.15, blackTrimMat, 0, 0.48, 2.2);
    const hlGeom = new THREE.CylinderGeometry(0.16, 0.16, 0.08, 16);
    hlGeom.rotateX(Math.PI / 2);
    const hlL = new THREE.Mesh(hlGeom, headLightMat);
    hlL.position.set(-0.68, 0.76, 2.12);
    const hlR = new THREE.Mesh(hlGeom, headLightMat);
    hlR.position.set(0.68, 0.76, 2.12);
    group.add(hlL, hlR);
    const spareGeom = new THREE.CylinderGeometry(0.44, 0.44, 0.28, 18);
    spareGeom.rotateX(Math.PI / 2);
    const spare = new THREE.Mesh(spareGeom, chromeMat);
    spare.position.set(0, 0.95, -2.2);
    group.add(spare);
    box(0.32, 0.14, 0.05, tailLightMat, -0.72, 0.65, -2.12);
    box(0.32, 0.14, 0.05, tailLightMat, 0.72, 0.65, -2.12);
    wheelRadius = 0.42;
  } else if (car.category === "Supercar") {
    // Lamborghini / Ferrari / Bugatti style: very low wedge, tiny cabin, big rear intake and wing
    box(2.05, 0.34, 4.5, bodyMat, 0, 0.36, 0);
    box(1.9, 0.18, 1.5, bodyMat, 0, 0.6, 1.55);
    box(1.55, 0.36, 1.9, bodyMat, 0, 0.78, -0.25);
    const ws = box(1.5, 0.36, 0.06, glassMat, 0, 0.78, 0.82);
    ws.rotation.x = -0.62;
    box(0.05, 0.28, 1.5, glassMat, -0.79, 0.8, -0.25);
    box(0.05, 0.28, 1.5, glassMat, 0.79, 0.8, -0.25);
    box(1.4, 0.22, 0.9, blackTrimMat, 0, 0.78, -1.4);
    box(2.0, 0.1, 0.5, blackTrimMat, 0, 0.18, 2.2);
    box(1.9, 0.05, 0.36, blackTrimMat, 0, 0.95, -2.2);
    box(0.06, 0.3, 0.06, blackTrimMat, -0.8, 0.8, -2.15);
    box(0.06, 0.3, 0.06, blackTrimMat, 0.8, 0.8, -2.15);
    box(0.6, 0.06, 0.07, headLightMat, -0.68, 0.45, 2.24);
    box(0.6, 0.06, 0.07, headLightMat, 0.68, 0.45, 2.24);
    box(0.7, 0.07, 0.05, tailLightMat, -0.62, 0.5, -2.26);
    box(0.7, 0.07, 0.05, tailLightMat, 0.62, 0.5, -2.26);
    box(0.14, 0.14, 0.2, chromeMat, -0.35, 0.28, -2.3);
    box(0.14, 0.14, 0.2, chromeMat, 0.35, 0.28, -2.3);
    wheelRadius = 0.37;
    wheelX = 1.0;
    wheelZFront = 1.5;
    wheelZRear = -1.45;
  } else if (car.category === "Sports Coupe") {
    box(1.95, 0.45, 4.3, bodyMat, 0, 0.42, 0);
    box(1.65, 0.46, 2.1, bodyMat, 0, 0.82, -0.2);
    box(1.98, 0.12, 0.45, blackTrimMat, 0, 0.22, 2.15);
    box(1.8, 0.06, 0.35, blackTrimMat, 0, 0.95, -2.05);
    box(0.08, 0.32, 0.08, blackTrimMat, -0.65, 0.75, -2.05);
    box(0.08, 0.32, 0.08, blackTrimMat, 0.65, 0.75, -2.05);
    const wsMesh = box(1.68, 0.48, 0.06, glassMat, 0, 0.78, 0.88);
    wsMesh.rotation.x = -0.38;
    const rgMesh = box(1.68, 0.48, 0.06, glassMat, 0, 0.76, -1.25);
    rgMesh.rotation.x = 0.45;
    box(0.42, 0.1, 0.08, headLightMat, -0.72, 0.48, 2.14);
    box(0.42, 0.1, 0.08, headLightMat, 0.72, 0.48, 2.14);
    box(0.12, 0.12, 0.25, chromeMat, -0.55, 0.26, -2.2);
    box(0.12, 0.12, 0.25, chromeMat, 0.55, 0.26, -2.2);
    box(0.35, 0.08, 0.05, tailLightMat, -0.7, 0.55, -2.16);
    box(0.35, 0.08, 0.05, tailLightMat, 0.7, 0.55, -2.16);
  } else if (car.category === "Electric") {
    // Tesla style: smooth body, long glass roof, closed nose with a thin light bar
    box(1.9, 0.5, 4.5, bodyMat, 0, 0.5, 0);
    box(1.7, 0.2, 1.2, bodyMat, 0, 0.82, 1.5);
    box(1.66, 0.5, 2.6, glassMat, 0, 1.0, -0.2);
    box(1.6, 0.06, 2.4, bodyMat, 0, 1.28, -0.2);
    const ws = box(1.66, 0.5, 0.06, glassMat, 0, 0.98, 1.2);
    ws.rotation.x = -0.6;
    const rg = box(1.66, 0.5, 0.06, glassMat, 0, 0.98, -1.6);
    rg.rotation.x = 0.55;
    box(1.3, 0.12, 0.05, blackTrimMat, 0, 0.5, 2.26);
    box(1.5, 0.04, 0.05, headLightMat, 0, 0.62, 2.26);
    box(1.6, 0.05, 0.05, tailLightMat, 0, 0.7, -2.26);
    wheelRadius = 0.37;
    wheelZFront = 1.45;
    wheelZRear = -1.4;
  } else if (car.category === "Pickup") {
    box(1.95, 0.6, 4.7, bodyMat, 0, 0.7, 0);
    box(1.8, 0.7, 1.9, bodyMat, 0, 1.3, 0.7);
    box(1.82, 0.4, 0.06, glassMat, 0, 1.3, 1.68);
    box(0.06, 0.4, 1.5, glassMat, -0.91, 1.3, 0.7);
    box(0.06, 0.4, 1.5, glassMat, 0.91, 1.3, 0.7);
    box(1.8, 0.4, 0.06, glassMat, 0, 1.3, -0.26);
    box(1.9, 0.22, 2.0, blackTrimMat, 0, 1.12, -1.4);
    box(1.9, 0.06, 0.1, bodyMat, 0, 1.28, -2.35);
    box(1.6, 0.4, 0.1, blackTrimMat, 0, 0.7, 2.37);
    box(1.9, 0.2, 0.15, blackTrimMat, 0, 0.45, 2.42);
    box(0.4, 0.14, 0.06, headLightMat, -0.7, 0.8, 2.37);
    box(0.4, 0.14, 0.06, headLightMat, 0.7, 0.8, 2.37);
    box(0.3, 0.14, 0.05, tailLightMat, -0.78, 0.8, -2.36);
    box(0.3, 0.14, 0.05, tailLightMat, 0.78, 0.8, -2.36);
    wheelRadius = 0.42;
    wheelZFront = 1.55;
    wheelZRear = -1.55;
  } else {
    const isCrossover = car.category === "Luxury Crossover";
    const baseH = isCrossover ? 0.62 : 0.5;
    const baseY = isCrossover ? 0.6 : 0.5;
    box(1.85, baseH, 4.2, bodyMat, 0, baseY, 0);
    box(1.62, 0.58, 2.4, bodyMat, 0, baseY + 0.54, -0.15);
    const ws = box(1.64, 0.52, 0.06, glassMat, 0, baseY + 0.5, 1.05);
    ws.rotation.x = -0.32;
    const rg = box(1.64, 0.52, 0.06, glassMat, 0, baseY + 0.5, -1.35);
    rg.rotation.x = 0.32;
    box(0.06, 0.44, 2.1, glassMat, -0.82, baseY + 0.52, -0.15);
    box(0.06, 0.44, 2.1, glassMat, 0.82, baseY + 0.52, -0.15);
    box(1.2, 0.32, 0.08, chromeMat, 0, baseY + 0.05, 2.12);
    box(0.38, 0.14, 0.06, headLightMat, -0.68, baseY + 0.12, 2.12);
    box(0.38, 0.14, 0.06, headLightMat, 0.68, baseY + 0.12, 2.12);
    box(0.42, 0.12, 0.06, tailLightMat, -0.68, baseY + 0.15, -2.12);
    box(0.42, 0.12, 0.06, tailLightMat, 0.68, baseY + 0.15, -2.12);
  }

  const wheelWidth = 0.28;
  const makeWheel = (wx: number, wz: number) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(wx, wheelRadius, wz);
    const tireGeom = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
    tireGeom.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeom, wheelRubberMat);
    wheelGroup.add(tire);
    const rimGeom = new THREE.CylinderGeometry(wheelRadius * 0.68, wheelRadius * 0.68, wheelWidth + 0.02, 12);
    rimGeom.rotateZ(Math.PI / 2);
    wheelGroup.add(new THREE.Mesh(rimGeom, rimMat));
    group.add(wheelGroup);
  };
  makeWheel(-wheelX, wheelZFront);
  makeWheel(wheelX, wheelZFront);
  makeWheel(-wheelX, wheelZRear);
  makeWheel(wheelX, wheelZRear);

  return group;
}

// Yellow-and-black cab used for the paid cab ride.
export function buildCabMesh(): THREE.Group {
  const group = buildDetailedCarMesh({ category: "Sedan", defaultColor: 0xf2c14e }, 0xf2c14e, true);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.1, 4.24), new THREE.MeshLambertMaterial({ color: 0x17241e }));
  stripe.position.set(0, 0.52, 0);
  group.add(stripe);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.16, 0.26), new THREE.MeshBasicMaterial({ color: 0xfff6c0 }));
  sign.position.set(0, 1.62, -0.15);
  group.add(sign);
  return group;
}
