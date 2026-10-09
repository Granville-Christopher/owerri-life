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

function hexOf(color: THREE.ColorRepresentation) {
  return `#${new THREE.Color(color).getHexString()}`;
}

function skinPaint(color: THREE.Color) {
  return new THREE.MeshPhongMaterial({
    color,
    shininess: 24,
    specular: 0x2a2218,
    emissive: color.clone().multiplyScalar(0.05),
  });
}

function clothPaint(color: THREE.ColorRepresentation) {
  return new THREE.MeshPhongMaterial({
    color,
    shininess: 12,
    specular: 0x151515,
  });
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, shade = true) {
  const next = new THREE.Mesh(geo, mat);
  next.castShadow = shade;
  next.receiveShadow = shade;
  return next;
}

function faceTexture(skin: THREE.Color, hair: THREE.ColorRepresentation, female: boolean, lite: boolean) {
  const size = lite ? 160 : 320;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const raw = canvas.getContext("2d");
  if (!raw) return null;
  const pen: CanvasRenderingContext2D = raw;
  const s = size / 320;
  pen.scale(s, s);
  const skinHex = hexOf(skin);
  const deep = hexOf(skin.clone().multiplyScalar(0.72));
  const lip = hexOf(skin.clone().lerp(new THREE.Color(female ? 0x8a3038 : 0x6a3030), female ? 0.45 : 0.25));
  const hairHex = hexOf(hair);

  pen.fillStyle = skinHex;
  pen.fillRect(0, 0, 320, 320);

  pen.fillStyle = hairHex;
  pen.beginPath();
  pen.ellipse(160, 72, 98, 42, 0, 0, Math.PI * 2);
  pen.fill();
  pen.fillRect(52, 52, 216, 28);

  function eye(cx: number) {
    pen.fillStyle = "#f7f4ee";
    pen.beginPath();
    pen.ellipse(cx, 152, female ? 13 : 12, female ? 8 : 7, 0, 0, Math.PI * 2);
    pen.fill();
    pen.fillStyle = "#3a2418";
    pen.beginPath();
    pen.ellipse(cx, 153, 6, 6, 0, 0, Math.PI * 2);
    pen.fill();
    pen.fillStyle = "#080706";
    pen.beginPath();
    pen.ellipse(cx, 153, 2.8, 2.8, 0, 0, Math.PI * 2);
    pen.fill();
    pen.fillStyle = "#ffffff";
    pen.beginPath();
    pen.ellipse(cx - 2, 151, 1.6, 1.6, 0, 0, Math.PI * 2);
    pen.fill();
    pen.strokeStyle = deep;
    pen.lineWidth = 1.6;
    pen.stroke();
    pen.strokeStyle = hairHex;
    pen.lineWidth = 3;
    pen.lineCap = "round";
    pen.beginPath();
    pen.moveTo(cx - 14, 138);
    pen.quadraticCurveTo(cx, female ? 130 : 133, cx + 14, 138);
    pen.stroke();
  }
  eye(132);
  eye(188);

  pen.fillStyle = deep;
  pen.globalAlpha = 0.3;
  pen.beginPath();
  pen.moveTo(160, 158);
  pen.lineTo(148, 182);
  pen.lineTo(172, 182);
  pen.closePath();
  pen.fill();
  pen.globalAlpha = 1;
  pen.fillStyle = skinHex;
  pen.beginPath();
  pen.ellipse(160, 178, 9, 11, 0, 0, Math.PI * 2);
  pen.fill();

  pen.strokeStyle = lip;
  pen.lineWidth = female ? 4 : 3;
  pen.lineCap = "round";
  pen.beginPath();
  pen.moveTo(144, 208);
  pen.quadraticCurveTo(160, female ? 216 : 212, 176, 208);
  pen.stroke();

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  map.needsUpdate = true;
  return map;
}

function hand(skin: THREE.Material, seated: boolean, lite: boolean) {
  const group = new THREE.Group();
  const palm = mesh(new THREE.BoxGeometry(0.05, 0.06, 0.04), skin);
  group.add(palm);
  if (lite) return group;
  for (let i = 0; i < 4; i += 1) {
    const finger = mesh(new THREE.BoxGeometry(0.012, 0.034, 0.012), skin);
    finger.position.set(-0.018 + i * 0.012, seated ? 0.01 : -0.03, 0.018);
    finger.rotation.x = seated ? 0.85 : 0.15;
    group.add(finger);
  }
  const thumb = mesh(new THREE.BoxGeometry(0.012, 0.028, 0.012), skin);
  thumb.position.set(0.028, 0, 0.012);
  thumb.rotation.z = -0.7;
  group.add(thumb);
  return group;
}

function shoePair(upper: THREE.Material, sole: THREE.Material) {
  const shoe = new THREE.Group();
  const body = mesh(new THREE.BoxGeometry(0.1, 0.08, 0.22), upper);
  body.position.set(0, 0.04, 0.04);
  const rubber = mesh(new THREE.BoxGeometry(0.11, 0.022, 0.24), sole);
  rubber.position.set(0, -0.01, 0.04);
  shoe.add(body, rubber);
  return shoe;
}

function hairCap(hairMat: THREE.Material, female: boolean, lookId: LookId, segs: number) {
  const hair = new THREE.Group();
  const cap = mesh(new THREE.SphereGeometry(female ? 0.168 : 0.164, segs, Math.max(12, segs - 6), 0, Math.PI * 2, 0, Math.PI * (female ? 0.58 : 0.48)), hairMat);
  cap.position.set(0, 0.04, -0.02);
  hair.add(cap);
  const fringe = mesh(new THREE.BoxGeometry(female ? 0.22 : 0.2, 0.05, 0.06), hairMat);
  fringe.position.set(0, 0.06, 0.12);
  hair.add(fringe);
  if (!female) return hair;
  if (lookId === "zara") {
    const tail = mesh(new THREE.CapsuleGeometry(0.048, 0.24, 6, 12), hairMat);
    tail.position.set(0, -0.12, -0.12);
    hair.add(tail);
  } else if (lookId === "ada" || lookId === "ngozi") {
    for (const side of [-1, 1]) {
      const braid = mesh(new THREE.CapsuleGeometry(0.022, 0.18, 6, 10), hairMat);
      braid.position.set(side * 0.1, -0.06, -0.06);
      braid.rotation.z = side * 0.2;
      hair.add(braid);
    }
  } else {
    const bun = mesh(new THREE.SphereGeometry(0.085, 14, 12), hairMat);
    bun.position.set(0, 0.12, -0.04);
    hair.add(bun);
  }
  return hair;
}

/**
 * Box-and-limb person: face plate on the front, shirt chest, pant hips, clear arms and legs.
 */
export function createRealisticHuman(options: HumanOptions = {}): THREE.Group {
  const {
    lookId = "chidi",
    seated = false,
    cheering = false,
    scale = 1,
    customShirt,
    customPants,
    lite = weakGpu(),
  } = options;
  const segs = lite ? 16 : 24;
  const limbSegs = lite ? 10 : 14;
  const capSegs = lite ? 6 : 8;

  const pal = LOOKS.find((l) => l.id === lookId) ?? LOOKS[1];
  const person = new THREE.Group();
  const isFemale = pal.gender === "female";

  const skin = new THREE.Color(pal.skin);
  const skinMat = skinPaint(skin);
  const shirtMat = clothPaint(customShirt != null ? customShirt : pal.shirt);
  const pantsMat = clothPaint(customPants != null ? customPants : isFemale ? 0x1f2937 : 0x151c2e);
  const hairMat = clothPaint(pal.hair);
  const beltMat = clothPaint(0x1c1917);
  const buckleMat = clothPaint(0xd6c38a);
  const shoeMat = clothPaint(0x111827);
  const soleMat = clothPaint(0xf8fafc);

  const hipY = seated ? 0.82 : 1.0;
  const torsoY = seated ? 1.32 : 1.48;
  const headY = seated ? 1.72 : 1.88;
  const shoulderW = isFemale ? 0.205 : 0.24;

  const head = new THREE.Group();
  const skull = mesh(new THREE.SphereGeometry(isFemale ? 0.148 : 0.154, segs, segs - 4), skinMat);
  skull.scale.set(0.92, 1.08, 0.96);
  head.add(skull);

  const faceMap = typeof document !== "undefined" ? faceTexture(skin, pal.hair, isFemale, lite) : null;
  if (faceMap) {
    const faceMat = new THREE.MeshBasicMaterial({ map: faceMap, transparent: true, depthWrite: false });
    const face = mesh(new THREE.PlaneGeometry(isFemale ? 0.2 : 0.21, 0.26), faceMat, false);
    face.position.set(0, 0.01, 0.145);
    head.add(face);
  }

  for (const side of [-1, 1]) {
    const ear = mesh(new THREE.BoxGeometry(0.018, 0.05, 0.028), skinMat);
    ear.position.set(side * 0.142, -0.008, -0.008);
    head.add(ear);
  }

  head.add(hairCap(hairMat, isFemale, lookId, segs));

  const neck = mesh(new THREE.CylinderGeometry(isFemale ? 0.046 : 0.052, 0.058, 0.12, limbSegs), skinMat);
  neck.position.set(0, -0.2, 0);
  head.add(neck);
  head.position.set(0, headY, seated ? 0.03 : 0);
  person.add(head);

  const torso = new THREE.Group();
  const chestW = isFemale ? 0.34 : 0.38;
  const chestD = isFemale ? 0.2 : 0.22;
  const chest = mesh(new THREE.BoxGeometry(chestW, 0.34, chestD), shirtMat);
  chest.position.set(0, 0.1, 0);
  const waist = mesh(new THREE.BoxGeometry(chestW * 0.9, 0.2, chestD * 0.92), shirtMat);
  waist.position.set(0, -0.12, 0);
  const collar = mesh(new THREE.BoxGeometry(chestW * 0.42, 0.05, 0.06), skinMat);
  collar.position.set(0, 0.26, chestD * 0.42);
  torso.add(chest, waist, collar);
  if (isFemale) {
    for (const side of [-1, 1]) {
      const bust = mesh(new THREE.SphereGeometry(0.055, 12, 10), shirtMat);
      bust.position.set(side * 0.08, 0.14, chestD * 0.38);
      torso.add(bust);
    }
  }
  torso.rotation.x = seated ? 0.12 : 0;
  torso.position.set(0, torsoY, seated ? -0.05 : 0);
  person.add(torso);

  const hips = new THREE.Group();
  const pelvisW = isFemale ? 0.36 : 0.34;
  const pelvis = mesh(new THREE.BoxGeometry(pelvisW, 0.2, isFemale ? 0.22 : 0.2), pantsMat);
  pelvis.position.set(0, -0.02, 0);
  const belt = mesh(new THREE.BoxGeometry(pelvisW + 0.02, 0.028, isFemale ? 0.23 : 0.21), beltMat);
  belt.position.set(0, 0.08, 0);
  const buckle = mesh(new THREE.BoxGeometry(0.055, 0.028, 0.015), buckleMat);
  buckle.position.set(0, 0.08, 0.11);
  hips.add(pelvis, belt, buckle);
  hips.position.set(0, hipY, seated ? -0.06 : 0);
  person.add(hips);

  const limbs: { legs: THREE.Group[]; arms: THREE.Group[] } = { legs: [], arms: [] };

  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    if (cheering) {
      const upper = mesh(new THREE.BoxGeometry(0.09, 0.26, 0.09), shirtMat);
      upper.position.set(0, 0.16, 0);
      const lower = mesh(new THREE.BoxGeometry(0.07, 0.24, 0.07), skinMat);
      lower.position.set(0, 0.42, 0);
      const palm = hand(skinMat, false, lite);
      palm.position.set(0, 0.58, 0);
      arm.add(upper, lower, palm);
      arm.rotation.z = side * -0.45;
    } else if (seated) {
      const upper = mesh(new THREE.BoxGeometry(0.09, 0.22, 0.09), shirtMat);
      upper.rotation.x = 0.52;
      upper.position.set(0, -0.08, 0.06);
      const elbow = mesh(new THREE.SphereGeometry(0.038, 10, 8), skinMat);
      elbow.position.set(0, -0.16, 0.18);
      const lower = mesh(new THREE.BoxGeometry(0.07, 0.2, 0.07), skinMat);
      lower.rotation.x = 1.05;
      lower.position.set(0, -0.18, 0.26);
      const palm = hand(skinMat, true, lite);
      palm.rotation.x = 0.35;
      palm.position.set(0, -0.18, 0.42);
      arm.add(upper, elbow, lower, palm);
      arm.rotation.z = side * 0.06;
    } else {
      const upper = mesh(new THREE.BoxGeometry(0.09, 0.26, 0.09), shirtMat);
      upper.position.set(0, -0.12, 0);
      const elbow = mesh(new THREE.SphereGeometry(0.038, 10, 8), skinMat);
      elbow.position.set(0, -0.28, 0.01);
      const lower = mesh(new THREE.BoxGeometry(0.07, 0.24, 0.07), skinMat);
      lower.position.set(0, -0.46, 0.02);
      const palm = hand(skinMat, false, lite);
      palm.position.set(0, -0.6, 0.03);
      arm.add(upper, elbow, lower, palm);
      arm.rotation.z = side * 0.07;
    }
    arm.position.set(side * shoulderW, torsoY + 0.12, 0);
    person.add(arm);
    limbs.arms.push(arm);
  }

  if (seated) {
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      const thigh = mesh(new THREE.BoxGeometry(0.11, 0.12, 0.32), pantsMat);
      thigh.rotation.x = Math.PI / 2;
      thigh.position.set(0, 0, 0.18);
      const knee = mesh(new THREE.SphereGeometry(0.055, 10, 8), pantsMat);
      knee.position.set(0, 0, 0.36);
      const calf = mesh(new THREE.BoxGeometry(0.09, 0.1, 0.3), pantsMat);
      calf.position.set(0, -0.18, 0.38);
      const shoe = shoePair(shoeMat, soleMat);
      shoe.position.set(0, -0.5, 0.46);
      leg.add(thigh, knee, calf, shoe);
      leg.position.set(side * 0.1, hipY - 0.05, 0);
      person.add(leg);
      limbs.legs.push(leg);
    }
  } else {
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      const thigh = mesh(new THREE.BoxGeometry(0.11, 0.32, 0.11), pantsMat);
      thigh.position.set(0, -0.18, 0);
      const knee = mesh(new THREE.SphereGeometry(0.055, 10, 8), pantsMat);
      knee.position.set(0, -0.4, 0.01);
      const calf = mesh(new THREE.BoxGeometry(0.09, 0.3, 0.09), pantsMat);
      calf.position.set(0, -0.62, 0);
      const shoe = shoePair(shoeMat, soleMat);
      shoe.position.set(0, -0.92, 0.04);
      leg.add(thigh, knee, calf, shoe);
      leg.position.set(side * 0.1, hipY, 0);
      person.add(leg);
      limbs.legs.push(leg);
    }
  }

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.26, 20),
    new THREE.MeshBasicMaterial({ color: 0x05070a, transparent: true, opacity: 0.34, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.02, seated ? 0.24 : 0);
  person.add(shadow);

  person.userData.limbs = limbs;
  person.userData.torso = torso;
  person.userData.hips = hips;
  person.userData.head = head;
  person.userData.rest = {
    hipY: hips.position.y,
    torsoY: torso.position.y,
    headY: head.position.y,
  };
  person.scale.setScalar(scale);
  return person;
}
