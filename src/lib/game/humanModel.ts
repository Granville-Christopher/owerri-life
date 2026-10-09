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
    shininess: 22,
    specular: 0x2a2218,
    emissive: color.clone().multiplyScalar(0.04),
  });
}

function clothPaint(color: THREE.ColorRepresentation) {
  return new THREE.MeshPhongMaterial({
    color,
    shininess: 10,
    specular: 0x111111,
  });
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, shade = true) {
  const next = new THREE.Mesh(geo, mat);
  next.castShadow = shade;
  next.receiveShadow = shade;
  return next;
}

function lathe(profile: Array<[number, number]>, segs: number, mat: THREE.Material) {
  const pts = profile.map(([radius, y]) => new THREE.Vector2(radius, y));
  const geo = new THREE.LatheGeometry(pts, segs);
  geo.computeVertexNormals();
  return mesh(geo, mat);
}

function faceTexture(skin: THREE.Color, hair: THREE.ColorRepresentation, female: boolean, lite: boolean) {
  const size = lite ? 128 : 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const raw = canvas.getContext("2d");
  if (!raw) return null;
  const pen: CanvasRenderingContext2D = raw;
  const s = size / 256;
  pen.scale(s, s);
  const skinHex = hexOf(skin);
  const deep = hexOf(skin.clone().multiplyScalar(0.72));
  const blush = hexOf(skin.clone().lerp(new THREE.Color(0xa24a4a), female ? 0.18 : 0.08));
  const lip = hexOf(skin.clone().lerp(new THREE.Color(female ? 0x8a3038 : 0x6a3030), female ? 0.42 : 0.22));
  const hairHex = hexOf(hair);

  pen.fillStyle = skinHex;
  pen.fillRect(0, 0, 256, 256);

  const shade = pen.createRadialGradient(128, 142, 18, 128, 148, 110);
  shade.addColorStop(0, skinHex);
  shade.addColorStop(0.55, skinHex);
  shade.addColorStop(1, deep);
  pen.fillStyle = shade;
  pen.fillRect(40, 60, 176, 160);

  pen.fillStyle = blush;
  pen.globalAlpha = 0.28;
  pen.beginPath();
  pen.ellipse(96, 148, 22, 14, 0, 0, Math.PI * 2);
  pen.ellipse(160, 148, 22, 14, 0, 0, Math.PI * 2);
  pen.fill();
  pen.globalAlpha = 1;

  pen.fillStyle = hairHex;
  pen.beginPath();
  pen.ellipse(128, 58, 78, 36, 0, 0, Math.PI * 2);
  pen.fill();
  pen.fillRect(48, 48, 160, 22);

  function eye(cx: number) {
    pen.fillStyle = "#f4f1ea";
    pen.beginPath();
    pen.ellipse(cx, 122, female ? 11 : 10, female ? 7.2 : 6.4, 0, 0, Math.PI * 2);
    pen.fill();
    pen.fillStyle = "#3a2418";
    pen.beginPath();
    pen.ellipse(cx, 123, 5.2, 5.2, 0, 0, Math.PI * 2);
    pen.fill();
    pen.fillStyle = "#0b0908";
    pen.beginPath();
    pen.ellipse(cx, 123, 2.4, 2.4, 0, 0, Math.PI * 2);
    pen.fill();
    pen.fillStyle = "#ffffff";
    pen.beginPath();
    pen.ellipse(cx - 1.6, 121, 1.4, 1.4, 0, 0, Math.PI * 2);
    pen.fill();
    pen.strokeStyle = deep;
    pen.lineWidth = 1.4;
    pen.beginPath();
    pen.ellipse(cx, 122, female ? 11 : 10, female ? 7.2 : 6.4, 0, 0, Math.PI * 2);
    pen.stroke();
    pen.strokeStyle = hairHex;
    pen.lineWidth = 2.6;
    pen.lineCap = "round";
    pen.beginPath();
    pen.moveTo(cx - 12, 110);
    pen.quadraticCurveTo(cx, female ? 104 : 107, cx + 12, 110);
    pen.stroke();
  }
  eye(108);
  eye(148);

  pen.fillStyle = deep;
  pen.beginPath();
  pen.moveTo(128, 128);
  pen.lineTo(118, 150);
  pen.lineTo(138, 150);
  pen.closePath();
  pen.globalAlpha = 0.35;
  pen.fill();
  pen.globalAlpha = 1;
  pen.fillStyle = skinHex;
  pen.beginPath();
  pen.ellipse(128, 148, 8, 10, 0, 0, Math.PI * 2);
  pen.fill();
  pen.fillStyle = deep;
  pen.globalAlpha = 0.45;
  pen.beginPath();
  pen.ellipse(124, 152, 2.2, 1.6, 0, 0, Math.PI * 2);
  pen.ellipse(132, 152, 2.2, 1.6, 0, 0, Math.PI * 2);
  pen.fill();
  pen.globalAlpha = 1;

  pen.strokeStyle = lip;
  pen.lineWidth = female ? 3.4 : 2.6;
  pen.lineCap = "round";
  pen.beginPath();
  pen.moveTo(116, 168);
  pen.quadraticCurveTo(128, female ? 174 : 171, 140, 168);
  pen.stroke();
  pen.strokeStyle = deep;
  pen.lineWidth = 1.2;
  pen.beginPath();
  pen.moveTo(118, 168);
  pen.quadraticCurveTo(128, 170, 138, 168);
  pen.stroke();

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  map.needsUpdate = true;
  return map;
}

function hand(skin: THREE.Material, seated: boolean, lite: boolean) {
  const group = new THREE.Group();
  const palm = mesh(new THREE.SphereGeometry(0.036, lite ? 10 : 14, lite ? 8 : 12), skin);
  palm.scale.set(0.9, 1.02, 1.28);
  group.add(palm);
  if (lite) return group;
  const thumb = mesh(new THREE.CapsuleGeometry(0.01, 0.026, 4, 8), skin);
  thumb.position.set(0.026, 0.004, 0.01);
  thumb.rotation.z = -0.85;
  thumb.rotation.x = 0.4;
  group.add(thumb);
  for (let i = 0; i < 4; i += 1) {
    const finger = mesh(new THREE.CapsuleGeometry(0.007, 0.03, 4, 8), skin);
    finger.position.set(-0.016 + i * 0.011, seated ? -0.002 : -0.026, 0.026);
    finger.rotation.x = seated ? 0.9 : 0.22;
    group.add(finger);
  }
  return group;
}

function shoePair(upper: THREE.Material, sole: THREE.Material) {
  const shoe = new THREE.Group();
  const body = mesh(new THREE.CapsuleGeometry(0.052, 0.12, 6, 12), upper);
  body.rotation.x = Math.PI / 2;
  body.scale.set(0.92, 0.72, 0.85);
  body.position.set(0, 0.03, 0.05);
  const rubber = mesh(new THREE.BoxGeometry(0.11, 0.024, 0.24), sole);
  rubber.position.set(0, -0.012, 0.04);
  shoe.add(body, rubber);
  return shoe;
}

function hairCap(hairMat: THREE.Material, female: boolean, lookId: LookId, segs: number) {
  const hair = new THREE.Group();
  const cap = mesh(new THREE.SphereGeometry(female ? 0.172 : 0.168, segs, Math.max(12, segs - 6), 0, Math.PI * 2, 0, Math.PI * (female ? 0.62 : 0.52)), hairMat);
  cap.position.set(0, female ? 0.018 : 0.028, -0.012);
  hair.add(cap);
  if (!female) {
    const nape = mesh(new THREE.SphereGeometry(0.08, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.7), hairMat);
    nape.scale.set(1.15, 0.7, 0.9);
    nape.position.set(0, -0.02, -0.12);
    hair.add(nape);
    return hair;
  }
  const fall = mesh(new THREE.SphereGeometry(0.13, segs - 4, 12, 0, Math.PI * 2, 0, Math.PI * 0.85), hairMat);
  fall.scale.set(1.08, 1.2, 0.92);
  fall.position.set(0, -0.06, -0.11);
  hair.add(fall);
  if (lookId === "zara") {
    const tail = mesh(new THREE.CapsuleGeometry(0.05, 0.26, 6, 12), hairMat);
    tail.position.set(0, -0.16, -0.14);
    hair.add(tail);
  } else if (lookId === "ada" || lookId === "ngozi") {
    for (const side of [-1, 1]) {
      const braid = mesh(new THREE.CapsuleGeometry(0.024, 0.2, 6, 10), hairMat);
      braid.position.set(side * 0.1, -0.08, -0.08);
      braid.rotation.z = side * 0.22;
      hair.add(braid);
    }
  } else {
    const bun = mesh(new THREE.SphereGeometry(0.09, 14, 12), hairMat);
    bun.position.set(0, 0.14, -0.05);
    hair.add(bun);
  }
  return hair;
}

/**
 * One person: painted face, hair cap, lathe body. No torus rings, no stacked discs.
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
  const segs = lite ? 20 : 28;
  const limbSegs = lite ? 12 : 16;
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

  const hipY = seated ? 0.84 : 1.02;
  const torsoY = seated ? 1.34 : 1.52;
  const headY = seated ? 1.74 : 1.92;
  const shoulderW = isFemale ? 0.2 : 0.235;

  const head = new THREE.Group();
  const skullGeo = new THREE.SphereGeometry(isFemale ? 0.15 : 0.156, segs, segs - 4);
  skullGeo.rotateY(Math.PI / 2);
  const faceMap = typeof document !== "undefined" ? faceTexture(skin, pal.hair, isFemale, lite) : null;
  const headMat = new THREE.MeshPhongMaterial({
    color: faceMap ? 0xffffff : pal.skin,
    map: faceMap ?? undefined,
    shininess: 22,
    specular: 0x2a2218,
    emissive: skin.clone().multiplyScalar(0.04),
  });
  const skull = mesh(skullGeo, headMat);
  skull.scale.set(0.94, 1.12, 1.0);
  head.add(skull);

  const chin = mesh(new THREE.SphereGeometry(0.04, 12, 10), skinMat);
  chin.scale.set(isFemale ? 0.9 : 1.05, 0.7, 0.95);
  chin.position.set(0, -0.15, 0.06);
  head.add(chin);

  for (const side of [-1, 1]) {
    const ear = mesh(new THREE.SphereGeometry(0.028, 12, 10), skinMat);
    ear.scale.set(0.42, 1.15, 0.7);
    ear.position.set(side * 0.148, -0.01, -0.01);
    ear.rotation.z = side * -0.18;
    head.add(ear);
  }

  const nose = mesh(new THREE.SphereGeometry(0.018, 12, 10), skinMat);
  nose.scale.set(0.62, 1.05, 1.15);
  nose.position.set(0, -0.02, 0.148);
  head.add(nose);

  head.add(hairCap(hairMat, isFemale, lookId, segs));

  const neck = mesh(new THREE.CylinderGeometry(isFemale ? 0.048 : 0.055, 0.062, 0.14, limbSegs), skinMat);
  neck.position.set(0, -0.22, 0.01);
  head.add(neck);
  head.position.set(0, headY, seated ? 0.04 : 0);
  person.add(head);

  const torso = new THREE.Group();
  const shirt = lathe(
    isFemale
      ? [
          [0.05, 0.3],
          [0.078, 0.27],
          [0.168, 0.18],
          [0.178, 0.06],
          [0.15, -0.04],
          [0.122, -0.16],
          [0.138, -0.3],
        ]
      : [
          [0.055, 0.3],
          [0.082, 0.26],
          [0.188, 0.16],
          [0.178, 0.02],
          [0.152, -0.1],
          [0.14, -0.2],
          [0.15, -0.3],
        ],
    segs,
    shirtMat,
  );
  shirt.scale.set(1, 1, isFemale ? 0.7 : 0.74);
  torso.add(shirt);
  const collar = mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.045, limbSegs), skinMat);
  collar.position.set(0, 0.24, 0.01);
  torso.add(collar);
  for (const side of [-1, 1]) {
    const shoulder = mesh(new THREE.CapsuleGeometry(0.042, 0.08, capSegs, limbSegs), shirtMat);
    shoulder.rotation.z = side * Math.PI / 2;
    shoulder.position.set(side * (isFemale ? 0.15 : 0.17), 0.16, 0);
    torso.add(shoulder);
  }
  torso.rotation.x = seated ? 0.14 : 0;
  torso.position.set(0, torsoY, seated ? -0.04 : 0);
  person.add(torso);

  const hips = new THREE.Group();
  const pelvis = lathe(
    isFemale
      ? [
          [0.132, 0.12],
          [0.172, 0.02],
          [0.158, -0.08],
          [0.118, -0.16],
        ]
      : [
          [0.138, 0.12],
          [0.158, 0.02],
          [0.148, -0.08],
          [0.118, -0.16],
        ],
    segs,
    pantsMat,
  );
  pelvis.scale.set(1, 1, 0.78);
  const belt = mesh(new THREE.CylinderGeometry(isFemale ? 0.15 : 0.145, isFemale ? 0.148 : 0.142, 0.04, segs), beltMat);
  belt.scale.set(1, 1, 0.78);
  belt.position.set(0, 0.08, 0);
  const buckle = mesh(new THREE.BoxGeometry(0.06, 0.032, 0.02), buckleMat);
  buckle.position.set(0, 0.08, 0.12);
  hips.add(pelvis, belt, buckle);
  hips.position.set(0, hipY, seated ? -0.05 : 0);
  person.add(hips);

  const limbs: { legs: THREE.Group[]; arms: THREE.Group[] } = { legs: [], arms: [] };

  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    if (cheering) {
      const upper = mesh(new THREE.CapsuleGeometry(0.046, 0.24, capSegs, limbSegs), shirtMat);
      upper.position.set(0, 0.18, 0);
      const lower = mesh(new THREE.CapsuleGeometry(0.036, 0.22, capSegs, limbSegs), skinMat);
      lower.position.set(0, 0.46, 0);
      const palm = hand(skinMat, false, lite);
      palm.position.set(0, 0.64, 0);
      arm.add(upper, lower, palm);
      arm.rotation.z = side * -0.45;
    } else if (seated) {
      const upper = mesh(new THREE.CapsuleGeometry(0.046, 0.22, capSegs, limbSegs), shirtMat);
      upper.rotation.x = 0.55;
      upper.position.set(0, -0.1, 0.07);
      const lower = mesh(new THREE.CapsuleGeometry(0.036, 0.2, capSegs, limbSegs), skinMat);
      lower.rotation.x = 1.12;
      lower.position.set(0, -0.2, 0.28);
      const palm = hand(skinMat, true, lite);
      palm.rotation.x = 0.4;
      palm.position.set(0, -0.2, 0.46);
      arm.add(upper, lower, palm);
      arm.rotation.z = side * 0.08;
    } else {
      const upper = mesh(new THREE.CapsuleGeometry(0.046, 0.24, capSegs, limbSegs), shirtMat);
      upper.position.set(0, -0.14, 0.01);
      const lower = mesh(new THREE.CapsuleGeometry(0.036, 0.22, capSegs, limbSegs), skinMat);
      lower.position.set(0, -0.44, 0.02);
      const palm = hand(skinMat, false, lite);
      palm.position.set(0, -0.62, 0.03);
      arm.add(upper, lower, palm);
      arm.rotation.z = side * 0.08;
    }
    arm.position.set(side * shoulderW, torsoY + 0.14, 0);
    person.add(arm);
    limbs.arms.push(arm);
  }

  if (seated) {
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      const thigh = mesh(new THREE.CapsuleGeometry(0.062, 0.32, capSegs, limbSegs), pantsMat);
      thigh.rotation.x = Math.PI / 2;
      thigh.position.set(0, 0, 0.2);
      const calf = mesh(new THREE.CapsuleGeometry(0.05, 0.32, capSegs, limbSegs), pantsMat);
      calf.position.set(0, -0.2, 0.42);
      const shoe = shoePair(shoeMat, soleMat);
      shoe.position.set(0, -0.54, 0.5);
      leg.add(thigh, calf, shoe);
      leg.position.set(side * 0.1, hipY - 0.06, 0);
      person.add(leg);
      limbs.legs.push(leg);
    }
  } else {
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      const thigh = mesh(new THREE.CapsuleGeometry(0.062, 0.34, capSegs, limbSegs), pantsMat);
      thigh.position.set(0, -0.2, 0);
      const calf = mesh(new THREE.CapsuleGeometry(0.048, 0.32, capSegs, limbSegs), pantsMat);
      calf.position.set(0, -0.62, 0);
      const shoe = shoePair(shoeMat, soleMat);
      shoe.position.set(0, -0.96, 0.05);
      leg.add(thigh, calf, shoe);
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
