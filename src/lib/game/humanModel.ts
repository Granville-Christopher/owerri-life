import * as THREE from "three";
import { LOOKS, lookForGender, matchLook } from "@/lib/game/content";
import type { Gender, LookId, Pose } from "@/lib/game/types";

export type CrowdPerson = {
  id: string;
  name: string;
  look?: LookId | null;
  gender?: Gender | null;
  pose?: Pose;
};

function crowdLook(person: CrowdPerson): LookId {
  if (person.look) return matchLook(person.look, person.gender, person.id);
  if (person.gender) return lookForGender(person.gender, person.id);
  return lookForGender(null, person.id);
}

export function addPlayerGuests(
  parent: THREE.Object3D,
  people: CrowdPerson[],
  selfId?: string,
  origin: { x: number; z: number; rot?: number } = { x: 0, z: 2.6, rot: Math.PI },
) {
  people
    .filter((person) => person.id !== selfId)
    .slice(0, 6)
    .forEach((person, index) => {
      const seated = person.pose === "sit";
      const body = createRealisticHuman({ lookId: crowdLook(person), seated, scale: 0.9 });
      const col = index % 3;
      const row = Math.floor(index / 3);
      body.position.set(origin.x + (col - 1) * 1.2, 0, origin.z - row * 1.15);
      body.rotation.y = origin.rot ?? Math.PI;
      parent.add(body);
    });
}

export interface HumanOptions {
  lookId?: LookId;
  seated?: boolean;
  cheering?: boolean;
  scale?: number;
  customShirt?: number | string;
  customPants?: number | string;
  hairStyle?: "fade" | "braids" | "afro" | "parted" | "bun";
  lite?: boolean;
}

export function weakGpu() {
  if (typeof window === "undefined") return true;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const coarse = window.matchMedia?.("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 900;
  return Boolean(coarse || narrow || (nav.deviceMemory != null && nav.deviceMemory <= 4) || (navigator.hardwareConcurrency ?? 8) <= 4);
}

function skinPaint(color: THREE.Color) {
  return new THREE.MeshPhongMaterial({ color, shininess: 18, specular: 0x2a2218 });
}

function clothPaint(color: THREE.ColorRepresentation) {
  return new THREE.MeshPhongMaterial({ color, shininess: 8, specular: 0x111111 });
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material) {
  const next = new THREE.Mesh(geo, mat);
  next.castShadow = true;
  next.receiveShadow = true;
  return next;
}

function limb(radius: number, length: number, mat: THREE.Material, segs: number) {
  return mesh(new THREE.CapsuleGeometry(radius, length, 4, segs), mat);
}

function faceTexture(skin: THREE.Color, hair: string, female: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const pen = canvas.getContext("2d");
  if (!pen) return null;
  const hex = (color: THREE.Color) => `#${color.getHexString()}`;
  const skinHex = hex(skin);
  const shade = hex(skin.clone().multiplyScalar(0.62));
  const blush = hex(skin.clone().offsetHSL(0.02, 0.12, 0.03));
  const lip = female ? "#a3484c" : "#7c4038";
  const lipDeep = female ? "#6d2830" : "#542824";
  pen.fillStyle = skinHex;
  pen.fillRect(0, 0, 512, 512);

  const jaw = pen.createRadialGradient(256, 360, 30, 256, 330, 170);
  jaw.addColorStop(0, shade);
  jaw.addColorStop(1, "rgba(0,0,0,0)");
  pen.fillStyle = jaw;
  pen.globalAlpha = 0.28;
  pen.fillRect(0, 0, 512, 512);
  pen.globalAlpha = 1;

  const cheek = (x: number) => {
    const glow = pen.createRadialGradient(x, 292, 6, x, 292, 42);
    glow.addColorStop(0, blush);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    pen.fillStyle = glow;
    pen.globalAlpha = 0.55;
    pen.beginPath();
    pen.arc(x, 292, 42, 0, Math.PI * 2);
    pen.fill();
    pen.globalAlpha = 1;
  };
  cheek(176);
  cheek(336);

  pen.fillStyle = hair;
  pen.beginPath();
  pen.ellipse(256, 48, 168, 78, 0, 0, Math.PI * 2);
  pen.fill();

  const brow = (x: number, lift: number) => {
    pen.strokeStyle = hair;
    pen.lineWidth = female ? 8 : 10;
    pen.lineCap = "round";
    pen.beginPath();
    pen.moveTo(x - 30, 198 + lift);
    pen.quadraticCurveTo(x, female ? 176 : 186, x + 28, 194);
    pen.stroke();
  };
  brow(208, 0);
  brow(304, female ? 0 : 2);

  const eye = (x: number) => {
    pen.fillStyle = shade;
    pen.globalAlpha = 0.22;
    pen.beginPath();
    pen.ellipse(x, 228, 36, 20, 0, 0, Math.PI * 2);
    pen.fill();
    pen.globalAlpha = 1;
    pen.fillStyle = "#f6f3ec";
    pen.beginPath();
    pen.ellipse(x, 230, female ? 24 : 21, female ? 14 : 12, 0, 0, Math.PI * 2);
    pen.fill();
    pen.fillStyle = "#5a3218";
    pen.beginPath();
    pen.arc(x, 231, female ? 9 : 8, 0, Math.PI * 2);
    pen.fill();
    pen.strokeStyle = "#2c160e";
    pen.lineWidth = 2;
    pen.stroke();
    pen.fillStyle = "#100c0a";
    pen.beginPath();
    pen.arc(x + 0.5, 231, 3.6, 0, Math.PI * 2);
    pen.fill();
    pen.fillStyle = "#ffffff";
    pen.beginPath();
    pen.arc(x - 3.5, 228, 2, 0, Math.PI * 2);
    pen.fill();
    pen.strokeStyle = "#1a120e";
    pen.lineWidth = female ? 3 : 2;
    pen.lineCap = "round";
    pen.beginPath();
    pen.moveTo(x - 22, 220);
    pen.quadraticCurveTo(x, female ? 206 : 212, x + 22, 220);
    pen.stroke();
    pen.strokeStyle = shade;
    pen.lineWidth = 2.5;
    pen.beginPath();
    pen.moveTo(x - 20, 242);
    pen.quadraticCurveTo(x, 250, x + 20, 242);
    pen.stroke();
  };
  eye(208);
  eye(304);

  pen.strokeStyle = "rgba(255,255,255,0.35)";
  pen.lineWidth = 5;
  pen.lineCap = "round";
  pen.beginPath();
  pen.moveTo(256, 236);
  pen.quadraticCurveTo(260, 268, 256, 292);
  pen.stroke();
  pen.fillStyle = shade;
  pen.globalAlpha = 0.7;
  pen.beginPath();
  pen.ellipse(240, 304, 8, 5.5, 0.5, 0, Math.PI * 2);
  pen.fill();
  pen.beginPath();
  pen.ellipse(272, 304, 8, 5.5, -0.5, 0, Math.PI * 2);
  pen.fill();
  pen.globalAlpha = 1;

  pen.fillStyle = lipDeep;
  pen.beginPath();
  pen.moveTo(224, 338);
  pen.quadraticCurveTo(240, 330, 256, 334);
  pen.quadraticCurveTo(272, 330, 288, 338);
  pen.quadraticCurveTo(256, female ? 348 : 344, 224, 338);
  pen.fill();
  pen.fillStyle = lip;
  pen.beginPath();
  pen.moveTo(222, 342);
  pen.quadraticCurveTo(256, female ? 368 : 360, 290, 342);
  pen.quadraticCurveTo(256, 350, 222, 342);
  pen.fill();
  pen.strokeStyle = lipDeep;
  pen.lineWidth = 2;
  pen.beginPath();
  pen.moveTo(230, 340);
  pen.quadraticCurveTo(256, 346, 282, 340);
  pen.stroke();

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  map.needsUpdate = true;
  return map;
}

function hand(skin: THREE.Material, segs: number) {
  const group = new THREE.Group();
  const palm = mesh(new THREE.SphereGeometry(0.034, segs, segs - 2), skin);
  palm.scale.set(0.9, 0.85, 1.15);
  group.add(palm);
  for (let i = 0; i < 4; i += 1) {
    const finger = limb(0.007, 0.028, skin, segs);
    finger.position.set(-0.016 + i * 0.011, -0.028, 0.012);
    group.add(finger);
  }
  return group;
}

function shoe(upper: THREE.Material, sole: THREE.Material, segs: number) {
  const group = new THREE.Group();
  const body = limb(0.046, 0.08, upper, segs);
  body.rotation.x = Math.PI / 2;
  body.position.set(0, 0.03, 0.04);
  const rubber = mesh(new THREE.BoxGeometry(0.1, 0.02, 0.22), sole);
  rubber.position.set(0, 0.004, 0.04);
  group.add(body, rubber);
  return group;
}

/**
 * Human figure: head, face, hair, shirt, two arms, two legs. No blocks, no rings.
 */
export function createRealisticHuman(options: HumanOptions = {}): THREE.Group {
  const {
    lookId = "chidi",
    seated = false,
    cheering = false,
    scale = 1,
    customShirt,
    customPants,
  } = options;
  const segs = 14;

  const pal = LOOKS.find((l) => l.id === lookId) ?? LOOKS[1];
  const person = new THREE.Group();
  const female = pal.gender === "female";
  const skin = new THREE.Color(pal.skin);
  const skinMat = skinPaint(skin);
  const shirtMat = clothPaint(customShirt != null ? customShirt : pal.shirt);
  const pantsMat = clothPaint(customPants != null ? customPants : female ? 0x1f2937 : 0x1a2333);
  const hairMat = clothPaint(pal.hair);
  const shoeMat = clothPaint(0x111827);
  const soleMat = clothPaint(0xf4f4f5);

  const hipY = 1.0;
  const torsoY = 1.48;
  const headY = 1.9;
  const shoulderX = female ? 0.2 : 0.23;

  const head = new THREE.Group();
  const faceMap = typeof document !== "undefined" ? faceTexture(skin, pal.hair, female) : null;
  const headMat = faceMap
    ? new THREE.MeshPhongMaterial({ color: 0xffffff, map: faceMap, shininess: 16, specular: 0x2a2218 })
    : skinMat;
  const skull = mesh(new THREE.SphereGeometry(female ? 0.15 : 0.155, segs, segs, -Math.PI / 2), headMat);
  skull.scale.set(0.94, 1.1, 1.02);
  head.add(skull);
  const earGeo = new THREE.SphereGeometry(0.032, 8, 6);
  const earInner = new THREE.MeshPhongMaterial({ color: skin.clone().multiplyScalar(0.78), shininess: 8, specular: 0x221810 });
  for (const side of [-1, 1]) {
    const ear = mesh(earGeo, skinMat);
    ear.scale.set(0.42, 0.9, 0.55);
    ear.position.set(side * 0.145, -0.01, 0);
    const bowl = mesh(new THREE.SphereGeometry(0.012, 6, 5), earInner);
    bowl.position.set(side * 0.158, -0.01, 0.004);
    head.add(ear, bowl);
  }
  const nose = mesh(new THREE.SphereGeometry(0.022, 8, 6), skinMat);
  nose.scale.set(0.7, 0.55, 0.9);
  nose.position.set(0, -0.038, female ? 0.15 : 0.156);
  head.add(nose);
  const hair = mesh(new THREE.SphereGeometry(female ? 0.162 : 0.158, segs, 10, 0, Math.PI * 2, 0, Math.PI * 0.34), hairMat);
  hair.position.set(0, 0.055, -0.02);
  head.add(hair);
  if (female && (lookId === "ada" || lookId === "ngozi")) {
    for (const side of [-1, 1]) {
      const braid = limb(0.022, 0.16, hairMat, segs);
      braid.position.set(side * 0.1, -0.06, -0.06);
      head.add(braid);
    }
  }
  const neck = mesh(new THREE.CylinderGeometry(0.05, 0.058, 0.12, segs), skinMat);
  neck.position.set(0, -0.2, 0);
  head.add(neck);
  head.position.set(0, headY, 0);
  person.add(head);

  const torso = new THREE.Group();
  const chest = limb(female ? 0.145 : 0.16, 0.28, shirtMat, segs);
  chest.scale.set(female ? 1.05 : 1.12, 1, 0.72);
  chest.position.set(0, 0.08, 0);
  const waist = limb(female ? 0.12 : 0.13, 0.16, shirtMat, segs);
  waist.scale.set(1, 1, 0.7);
  waist.position.set(0, -0.16, 0);
  torso.add(chest, waist);
  torso.position.set(0, torsoY, 0);
  person.add(torso);

  const hips = new THREE.Group();
  const pelvis = limb(female ? 0.135 : 0.125, 0.12, pantsMat, segs);
  pelvis.scale.set(female ? 1.15 : 1.05, 1, 0.75);
  hips.add(pelvis);
  hips.position.set(0, hipY, 0);
  person.add(hips);

  const limbs: { legs: THREE.Group[]; arms: THREE.Group[] } = { legs: [], arms: [] };

  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    const upper = limb(0.045, 0.22, shirtMat, segs);
    upper.position.y = -0.14;
    const elbow = new THREE.Group();
    elbow.position.y = -0.28;
    const fore = limb(0.038, 0.2, skinMat, segs);
    fore.position.y = -0.14;
    const palm = hand(skinMat, segs);
    palm.position.y = -0.28;
    elbow.add(fore, palm);
    arm.add(upper, elbow);
    if (cheering) arm.rotation.z = side * -1.2;
    else if (seated) elbow.rotation.x = 1.05;
    else arm.rotation.z = side * 0.08;
    arm.position.set(side * shoulderX, torsoY + 0.18, 0);
    person.add(arm);
    limbs.arms.push(arm);
  }

  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    const thigh = limb(0.062, 0.28, pantsMat, segs);
    thigh.position.y = -0.18;
    const knee = new THREE.Group();
    knee.position.y = -0.36;
    const calf = limb(0.048, 0.26, pantsMat, segs);
    calf.position.y = -0.16;
    const foot = shoe(shoeMat, soleMat, segs);
    foot.position.y = -0.36;
    knee.add(calf, foot);
    leg.add(thigh, knee);
    if (seated) {
      leg.rotation.x = -Math.PI / 2;
      knee.rotation.x = Math.PI / 2;
    }
    leg.position.set(side * 0.11, hipY - 0.02, 0);
    leg.userData.knee = knee;
    person.add(leg);
    limbs.legs.push(leg);
  }

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.28, 20),
    new THREE.MeshBasicMaterial({ color: 0x05070a, transparent: true, opacity: 0.32, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  person.add(shadow);

  person.userData.limbs = limbs;
  person.userData.torso = torso;
  person.userData.hips = hips;
  person.userData.head = head;
  person.userData.rest = { hipY, torsoY, headY };
  person.scale.setScalar(scale);
  return person;
}
