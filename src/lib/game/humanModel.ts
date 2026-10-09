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
    shininess: 28,
    specular: 0x3a2e24,
    emissive: color.clone().multiplyScalar(0.04),
  });
}

function clothPaint(color: THREE.ColorRepresentation) {
  return new THREE.MeshPhongMaterial({
    color,
    shininess: 14,
    specular: 0x1a1a1a,
  });
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, shade = true) {
  const next = new THREE.Mesh(geo, mat);
  next.castShadow = shade;
  next.receiveShadow = shade;
  return next;
}

function cap(r: number, h: number, segs: number, mat: THREE.Material) {
  return mesh(new THREE.CapsuleGeometry(r, h, Math.max(4, segs - 4), segs), mat);
}

function faceTexture(skin: THREE.Color, hair: THREE.ColorRepresentation, female: boolean, rich: boolean) {
  const size = rich ? 512 : 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const raw = canvas.getContext("2d");
  if (!raw) return null;
  const pen: CanvasRenderingContext2D = raw;
  const s = size / 512;
  pen.scale(s, s);
  const skinHex = hexOf(skin);
  const deep = hexOf(skin.clone().multiplyScalar(0.68));
  const mid = hexOf(skin.clone().multiplyScalar(0.88));
  const blush = hexOf(skin.clone().lerp(new THREE.Color(0xb04a4a), female ? 0.22 : 0.1));
  const lip = hexOf(skin.clone().lerp(new THREE.Color(female ? 0x9a2838 : 0x7a2828), female ? 0.5 : 0.28));
  const hairHex = hexOf(hair);

  pen.fillStyle = mid;
  pen.fillRect(0, 0, 512, 512);
  const oval = pen.createRadialGradient(256, 268, 40, 256, 280, 200);
  oval.addColorStop(0, skinHex);
  oval.addColorStop(0.65, skinHex);
  oval.addColorStop(1, deep);
  pen.fillStyle = oval;
  pen.beginPath();
  pen.ellipse(256, 268, 118, 148, 0, 0, Math.PI * 2);
  pen.fill();

  pen.fillStyle = blush;
  pen.globalAlpha = 0.35;
  pen.beginPath();
  pen.ellipse(196, 292, 28, 18, 0, 0, Math.PI * 2);
  pen.ellipse(316, 292, 28, 18, 0, 0, Math.PI * 2);
  pen.fill();
  pen.globalAlpha = 1;

  pen.fillStyle = hairHex;
  pen.beginPath();
  pen.ellipse(256, 108, 132, 52, 0, 0, Math.PI * 2);
  pen.fill();
  pen.fillRect(72, 88, 368, 36);
  if (rich) {
    pen.globalAlpha = 0.45;
    for (let i = 0; i < 12; i += 1) {
      pen.beginPath();
      pen.moveTo(140 + i * 22, 118);
      pen.quadraticCurveTo(150 + i * 22, 148, 138 + i * 22, 168);
      pen.strokeStyle = hairHex;
      pen.lineWidth = 3;
      pen.stroke();
    }
    pen.globalAlpha = 1;
  }

  function eye(cx: number) {
    pen.fillStyle = "#f8f5ef";
    pen.beginPath();
    pen.ellipse(cx, 238, female ? 16 : 14, female ? 10 : 9, 0, 0, Math.PI * 2);
    pen.fill();
    pen.fillStyle = "#3d2818";
    pen.beginPath();
    pen.ellipse(cx, 239, 7.2, 7.2, 0, 0, Math.PI * 2);
    pen.fill();
    pen.fillStyle = "#0a0806";
    pen.beginPath();
    pen.ellipse(cx, 239, 3.2, 3.2, 0, 0, Math.PI * 2);
    pen.fill();
    pen.fillStyle = "#ffffff";
    pen.beginPath();
    pen.ellipse(cx - 2.4, 236, 2, 2, 0, 0, Math.PI * 2);
    pen.fill();
    pen.strokeStyle = deep;
    pen.lineWidth = 1.8;
    pen.stroke();
    pen.strokeStyle = hairHex;
    pen.lineWidth = 3.2;
    pen.lineCap = "round";
    pen.beginPath();
    pen.moveTo(cx - 18, 218);
    pen.quadraticCurveTo(cx, female ? 208 : 212, cx + 18, 218);
    pen.stroke();
    if (rich) {
      pen.strokeStyle = "#1a1008";
      pen.lineWidth = 1.2;
      for (let lash = -2; lash <= 2; lash += 1) {
        pen.beginPath();
        pen.moveTo(cx + lash * 4, 228);
        pen.lineTo(cx + lash * 4 - 1, 222);
        pen.stroke();
      }
    }
  }
  eye(210);
  eye(302);

  pen.fillStyle = deep;
  pen.globalAlpha = 0.35;
  pen.beginPath();
  pen.moveTo(256, 248);
  pen.lineTo(242, 278);
  pen.lineTo(270, 278);
  pen.closePath();
  pen.fill();
  pen.globalAlpha = 1;
  pen.fillStyle = skinHex;
  pen.beginPath();
  pen.ellipse(256, 272, 10, 12, 0, 0, Math.PI * 2);
  pen.fill();
  pen.fillStyle = deep;
  pen.globalAlpha = 0.5;
  pen.beginPath();
  pen.ellipse(250, 276, 2.4, 1.8, 0, 0, Math.PI * 2);
  pen.ellipse(262, 276, 2.4, 1.8, 0, 0, Math.PI * 2);
  pen.fill();
  pen.globalAlpha = 1;

  pen.fillStyle = lip;
  pen.beginPath();
  pen.ellipse(256, 318, 22, female ? 10 : 8, 0, 0, Math.PI);
  pen.fill();
  pen.fillStyle = lip;
  pen.globalAlpha = 0.85;
  pen.beginPath();
  pen.ellipse(256, 322, 18, female ? 8 : 6, 0, 0, Math.PI);
  pen.fill();
  pen.globalAlpha = 1;
  pen.strokeStyle = deep;
  pen.lineWidth = 1.2;
  pen.beginPath();
  pen.moveTo(232, 316);
  pen.quadraticCurveTo(256, 312, 280, 316);
  pen.stroke();

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 12;
  map.needsUpdate = true;
  return map;
}

function hand(skin: THREE.Material, seated: boolean, capSegs: number) {
  const group = new THREE.Group();
  const palm = mesh(new THREE.SphereGeometry(0.036, capSegs + 4, capSegs), skin);
  palm.scale.set(0.95, 0.88, 1.22);
  group.add(palm);
  const thumb = mesh(new THREE.CapsuleGeometry(0.009, 0.028, 4, capSegs), skin);
  thumb.position.set(0.028, 0.002, 0.012);
  thumb.rotation.z = -0.82;
  thumb.rotation.x = 0.35;
  group.add(thumb);
  for (let i = 0; i < 4; i += 1) {
    const finger = mesh(new THREE.CapsuleGeometry(0.0075, 0.032, 4, capSegs), skin);
    finger.position.set(-0.017 + i * 0.011, seated ? 0 : -0.026, 0.024);
    finger.rotation.x = seated ? 0.88 : 0.2;
    group.add(finger);
  }
  return group;
}

function shoePair(upper: THREE.Material, sole: THREE.Material, capSegs: number) {
  const shoe = new THREE.Group();
  const body = mesh(new THREE.CapsuleGeometry(0.048, 0.1, 6, capSegs), upper);
  body.rotation.x = Math.PI / 2;
  body.scale.set(0.95, 0.75, 1.05);
  body.position.set(0, 0.034, 0.05);
  const toe = mesh(new THREE.SphereGeometry(0.042, capSegs, capSegs - 2), upper);
  toe.scale.set(0.95, 0.55, 1.2);
  toe.position.set(0, 0.022, 0.12);
  const rubber = mesh(new THREE.BoxGeometry(0.112, 0.024, 0.26), sole);
  rubber.position.set(0, -0.012, 0.045);
  shoe.add(body, toe, rubber);
  return shoe;
}

function hairCap(hairMat: THREE.Material, female: boolean, lookId: LookId, segs: number) {
  const hair = new THREE.Group();
  const cap = mesh(new THREE.SphereGeometry(female ? 0.17 : 0.166, segs, segs - 4, 0, Math.PI * 2, 0, Math.PI * (female ? 0.6 : 0.5)), hairMat);
  cap.position.set(0, 0.03, -0.015);
  hair.add(cap);
  const fringe = mesh(new THREE.SphereGeometry(0.1, segs - 6, 10), hairMat);
  fringe.scale.set(1.45, 0.32, 0.55);
  fringe.position.set(0, 0.08, 0.1);
  hair.add(fringe);
  if (!female) {
    const nape = mesh(new THREE.SphereGeometry(0.085, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.65), hairMat);
    nape.position.set(0, -0.02, -0.11);
    hair.add(nape);
    return hair;
  }
  const fall = mesh(new THREE.SphereGeometry(0.125, segs - 4, 12, 0, Math.PI * 2, 0, Math.PI * 0.82), hairMat);
  fall.scale.set(1.05, 1.15, 0.9);
  fall.position.set(0, -0.05, -0.1);
  hair.add(fall);
  if (lookId === "zara") {
    const tail = mesh(new THREE.CapsuleGeometry(0.05, 0.28, 6, 12), hairMat);
    tail.position.set(0, -0.14, -0.13);
    hair.add(tail);
  } else if (lookId === "ada" || lookId === "ngozi") {
    for (const side of [-1, 1]) {
      const braid = mesh(new THREE.CapsuleGeometry(0.024, 0.2, 6, 10), hairMat);
      braid.position.set(side * 0.105, -0.07, -0.07);
      braid.rotation.z = side * 0.24;
      hair.add(braid);
    }
  } else {
    const bun = mesh(new THREE.SphereGeometry(0.092, 14, 12), hairMat);
    bun.position.set(0, 0.13, -0.04);
    hair.add(bun);
  }
  return hair;
}

/**
 * Smooth capsule anatomy, painted face plate, no torus rings or block limbs.
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
  const lite = options.lite ?? false;
  const rich = !lite;
  const segs = rich ? 28 : 18;
  const limbSegs = rich ? 16 : 12;
  const capSegs = rich ? 8 : 6;

  const pal = LOOKS.find((l) => l.id === lookId) ?? LOOKS[1];
  const person = new THREE.Group();
  const isFemale = pal.gender === "female";

  const skin = new THREE.Color(pal.skin);
  const skinMat = skinPaint(skin);
  const deepSkin = skinPaint(skin.clone().multiplyScalar(0.78));
  const shirtMat = clothPaint(customShirt != null ? customShirt : pal.shirt);
  const pantsMat = clothPaint(customPants != null ? customPants : isFemale ? 0x1f2937 : 0x151c2e);
  const hairMat = clothPaint(pal.hair);
  const beltMat = clothPaint(0x1c1917);
  const buckleMat = clothPaint(0xd6c38a);
  const shoeMat = clothPaint(0x111827);
  const soleMat = clothPaint(0xf8fafc);

  const hipY = seated ? 0.84 : 1.02;
  const torsoY = seated ? 1.34 : 1.52;
  const headY = seated ? 1.76 : 1.94;
  const shoulderW = isFemale ? 0.21 : 0.245;

  const head = new THREE.Group();
  const skull = mesh(new THREE.SphereGeometry(isFemale ? 0.152 : 0.158, segs, segs - 4), skinMat);
  skull.scale.set(0.93, 1.1, 0.98);
  head.add(skull);

  const jaw = mesh(new THREE.SphereGeometry(0.048, 12, 10), skinMat);
  jaw.scale.set(isFemale ? 0.92 : 1.02, 0.72, 0.94);
  jaw.position.set(0, -0.12, 0.04);
  head.add(jaw);

  const faceMap = typeof document !== "undefined" ? faceTexture(skin, pal.hair, isFemale, rich) : null;
  if (faceMap) {
    const faceMat = new THREE.MeshBasicMaterial({ map: faceMap, transparent: true, depthWrite: false });
    const face = mesh(new THREE.PlaneGeometry(isFemale ? 0.22 : 0.23, 0.29), faceMat, false);
    face.position.set(0, 0.015, 0.152);
    head.add(face);
  }

  const nose = mesh(new THREE.SphereGeometry(0.016, 10, 8), deepSkin);
  nose.scale.set(0.65, 1.05, 1.2);
  nose.position.set(0, -0.015, 0.155);
  head.add(nose);

  for (const side of [-1, 1]) {
    const ear = mesh(new THREE.SphereGeometry(0.028, 10, 8), deepSkin);
    ear.scale.set(0.45, 1.15, 0.72);
    ear.position.set(side * 0.15, -0.01, -0.012);
    ear.rotation.z = side * -0.16;
    head.add(ear);
  }

  head.add(hairCap(hairMat, isFemale, lookId, segs));

  const neck = mesh(new THREE.CylinderGeometry(isFemale ? 0.048 : 0.054, 0.062, 0.14, limbSegs), skinMat);
  neck.position.set(0, -0.22, 0.01);
  head.add(neck);
  head.position.set(0, headY, seated ? 0.04 : 0);
  person.add(head);

  const torso = new THREE.Group();
  const chest = cap(isFemale ? 0.14 : 0.155, 0.26, capSegs, shirtMat);
  chest.scale.set(isFemale ? 1.12 : 1.22, 1, isFemale ? 0.72 : 0.76);
  chest.position.set(0, 0.1, 0.01);
  const belly = cap(isFemale ? 0.12 : 0.132, 0.18, capSegs, shirtMat);
  belly.scale.set(isFemale ? 1.02 : 1.08, 1, isFemale ? 0.7 : 0.74);
  belly.position.set(0, -0.14, 0);
  const collar = mesh(new THREE.CylinderGeometry(0.068, 0.078, 0.042, limbSegs), skinMat);
  collar.position.set(0, 0.24, 0.01);
  torso.add(chest, belly, collar);
  if (isFemale) {
    for (const side of [-1, 1]) {
      const bust = mesh(new THREE.SphereGeometry(0.062, 14, 12), shirtMat);
      bust.position.set(side * 0.075, 0.12, 0.1);
      torso.add(bust);
    }
  }
  for (const side of [-1, 1]) {
    const delt = mesh(new THREE.SphereGeometry(0.068, 12, 10), shirtMat);
    delt.position.set(side * (isFemale ? 0.16 : 0.18), 0.18, 0);
    torso.add(delt);
  }
  torso.rotation.x = seated ? 0.14 : 0;
  torso.position.set(0, torsoY, seated ? -0.05 : 0);
  person.add(torso);

  const hips = new THREE.Group();
  const pelvis = cap(isFemale ? 0.13 : 0.125, 0.14, capSegs, pantsMat);
  pelvis.scale.set(isFemale ? 1.22 : 1.1, 1, 0.78);
  pelvis.position.set(0, -0.02, 0);
  const belt = mesh(new THREE.BoxGeometry(isFemale ? 0.36 : 0.34, 0.026, isFemale ? 0.22 : 0.2), beltMat);
  belt.position.set(0, 0.07, 0);
  const buckle = mesh(new THREE.BoxGeometry(0.058, 0.032, 0.018), buckleMat);
  buckle.position.set(0, 0.07, 0.11);
  hips.add(pelvis, belt, buckle);
  hips.position.set(0, hipY, seated ? -0.06 : 0);
  person.add(hips);

  const limbs: { legs: THREE.Group[]; arms: THREE.Group[] } = { legs: [], arms: [] };

  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    if (cheering) {
      const upper = cap(0.048, 0.24, capSegs, shirtMat);
      upper.position.set(0, 0.18, 0);
      const lower = cap(0.038, 0.22, capSegs, skinMat);
      lower.position.set(0, 0.46, 0);
      const palm = hand(skinMat, false, capSegs);
      palm.position.set(0, 0.64, 0);
      arm.add(upper, lower, palm);
      arm.rotation.z = side * -0.45;
    } else if (seated) {
      const upper = cap(0.048, 0.22, capSegs, shirtMat);
      upper.rotation.x = 0.55;
      upper.position.set(0, -0.1, 0.07);
      const elbow = mesh(new THREE.SphereGeometry(0.04, 10, 8), skinMat);
      elbow.position.set(0, -0.18, 0.19);
      const lower = cap(0.038, 0.2, capSegs, skinMat);
      lower.rotation.x = 1.1;
      lower.position.set(0, -0.2, 0.29);
      const palm = hand(skinMat, true, capSegs);
      palm.rotation.x = 0.38;
      palm.position.set(0, -0.2, 0.45);
      arm.add(upper, elbow, lower, palm);
      arm.rotation.z = side * 0.08;
    } else {
      const upper = cap(0.048, 0.26, capSegs, shirtMat);
      upper.position.set(0, -0.14, 0.01);
      const elbow = mesh(new THREE.SphereGeometry(0.04, 10, 8), skinMat);
      elbow.position.set(0, -0.32, 0.02);
      const lower = cap(0.038, 0.24, capSegs, skinMat);
      lower.position.set(0, -0.48, 0.03);
      const palm = hand(skinMat, false, capSegs);
      palm.position.set(0, -0.64, 0.04);
      arm.add(upper, elbow, lower, palm);
      arm.rotation.z = side * 0.08;
    }
    arm.position.set(side * shoulderW, torsoY + 0.14, 0);
    person.add(arm);
    limbs.arms.push(arm);
  }

  if (seated) {
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      const thigh = cap(0.062, 0.32, capSegs, pantsMat);
      thigh.rotation.x = Math.PI / 2;
      thigh.position.set(0, 0, 0.2);
      const knee = mesh(new THREE.SphereGeometry(0.062, 10, 8), pantsMat);
      knee.position.set(0, 0, 0.42);
      const calf = cap(0.05, 0.32, capSegs, pantsMat);
      calf.position.set(0, -0.2, 0.44);
      const shoe = shoePair(shoeMat, soleMat, capSegs);
      shoe.position.set(0, -0.54, 0.5);
      leg.add(thigh, knee, calf, shoe);
      leg.position.set(side * 0.1, hipY - 0.06, 0);
      person.add(leg);
      limbs.legs.push(leg);
    }
  } else {
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      const thigh = cap(0.062, 0.36, capSegs, pantsMat);
      thigh.position.set(0, -0.2, 0);
      const knee = mesh(new THREE.SphereGeometry(0.062, 10, 8), pantsMat);
      knee.position.set(0, -0.44, 0.01);
      const calf = cap(0.05, 0.34, capSegs, pantsMat);
      calf.position.set(0, -0.66, 0);
      const shoe = shoePair(shoeMat, soleMat, capSegs);
      shoe.position.set(0, -0.98, 0.05);
      leg.add(thigh, knee, calf, shoe);
      leg.position.set(side * 0.1, hipY, 0);
      person.add(leg);
      limbs.legs.push(leg);
    }
  }

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.28, 24),
    new THREE.MeshBasicMaterial({ color: 0x05070a, transparent: true, opacity: 0.32, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.02, seated ? 0.26 : 0);
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
