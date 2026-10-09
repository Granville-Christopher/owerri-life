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

function plastic(color: THREE.ColorRepresentation) {
  return new THREE.MeshPhongMaterial({
    color,
    shininess: 48,
    specular: 0x666666,
    flatShading: false,
  });
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, shade = true) {
  const next = new THREE.Mesh(geo, mat);
  next.castShadow = shade;
  next.receiveShadow = shade;
  return next;
}

function robloxFaceTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const pen = canvas.getContext("2d");
  if (!pen) return null;
  pen.fillStyle = "#000000";
  pen.beginPath();
  pen.arc(40, 48, 10, 0, Math.PI * 2);
  pen.arc(88, 48, 10, 0, Math.PI * 2);
  pen.fill();
  pen.strokeStyle = "#000000";
  pen.lineWidth = 6;
  pen.lineCap = "round";
  pen.beginPath();
  pen.arc(64, 78, 28, 0.15 * Math.PI, 0.85 * Math.PI);
  pen.stroke();
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;
  return map;
}

function hairAccessory(hairMat: THREE.Material, female: boolean, lookId: LookId) {
  const hair = new THREE.Group();
  const top = mesh(new THREE.BoxGeometry(female ? 0.46 : 0.44, 0.12, 0.44), hairMat);
  top.position.set(0, 0.24, 0);
  hair.add(top);
  const front = mesh(new THREE.BoxGeometry(female ? 0.48 : 0.46, 0.08, 0.1), hairMat);
  front.position.set(0, 0.18, 0.2);
  hair.add(front);
  if (lookId === "zara" && female) {
    const tail = mesh(new THREE.BoxGeometry(0.14, 0.38, 0.14), hairMat);
    tail.position.set(0, -0.08, -0.22);
    hair.add(tail);
  } else if ((lookId === "ada" || lookId === "ngozi") && female) {
    for (const side of [-1, 1]) {
      const braid = mesh(new THREE.BoxGeometry(0.08, 0.32, 0.08), hairMat);
      braid.position.set(side * 0.22, 0, -0.12);
      hair.add(braid);
    }
  } else if (female) {
    const bun = mesh(new THREE.BoxGeometry(0.18, 0.14, 0.18), hairMat);
    bun.position.set(0, 0.32, -0.06);
    hair.add(bun);
  }
  return hair;
}

/** Classic blocky Roblox-style avatar (R6 proportions). */
export function createRealisticHuman(options: HumanOptions = {}): THREE.Group {
  const {
    lookId = "chidi",
    seated = false,
    cheering = false,
    scale = 1,
    customShirt,
    customPants,
  } = options;

  const pal = LOOKS.find((l) => l.id === lookId) ?? LOOKS[1];
  const person = new THREE.Group();
  const isFemale = pal.gender === "female";

  const skinMat = plastic(pal.skin);
  const shirtMat = plastic(customShirt != null ? customShirt : pal.shirt);
  const pantsMat = plastic(customPants != null ? customPants : isFemale ? 0x1f2937 : 0x151c2e);
  const hairMat = plastic(pal.hair);

  const headSize = 0.44;
  const torsoH = 0.64;
  const torsoW = 0.54;
  const torsoD = 0.28;
  const limbW = 0.22;
  const armLen = 0.58;
  const legLen = 0.72;

  const hipY = seated ? 0.78 : 0.96;
  const torsoY = seated ? 1.28 : 1.46;
  const headY = seated ? 1.72 : 1.9;
  const shoulderW = torsoW / 2 + limbW / 2 + 0.02;

  const head = new THREE.Group();
  const headBlock = mesh(new THREE.BoxGeometry(headSize, headSize, headSize), skinMat);
  head.add(headBlock);
  const faceMap = typeof document !== "undefined" ? robloxFaceTexture() : null;
  if (faceMap) {
    const face = mesh(
      new THREE.PlaneGeometry(headSize * 0.82, headSize * 0.82),
      new THREE.MeshBasicMaterial({ map: faceMap, transparent: true }),
      false,
    );
    face.position.set(0, 0, headSize / 2 + 0.002);
    head.add(face);
  }
  head.add(hairAccessory(hairMat, isFemale, lookId));
  head.position.set(0, headY, seated ? 0.02 : 0);
  person.add(head);

  const torso = new THREE.Group();
  const body = mesh(new THREE.BoxGeometry(torsoW, torsoH, torsoD), shirtMat);
  torso.add(body);
  torso.rotation.x = seated ? 0.12 : 0;
  torso.position.set(0, torsoY, seated ? -0.04 : 0);
  person.add(torso);

  const hips = new THREE.Group();
  hips.position.set(0, hipY, seated ? -0.05 : 0);
  person.add(hips);

  const limbs: { legs: THREE.Group[]; arms: THREE.Group[] } = { legs: [], arms: [] };

  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    const upper = mesh(new THREE.BoxGeometry(limbW, armLen, limbW), shirtMat);
    upper.position.y = -armLen / 2;
    arm.add(upper);
    const hand = mesh(new THREE.BoxGeometry(limbW * 0.92, limbW * 0.92, limbW * 0.92), skinMat);
    hand.position.y = -armLen - limbW * 0.4;
    arm.add(hand);
    if (cheering) {
      arm.rotation.z = side * -1.35;
      arm.rotation.x = -0.35;
    } else if (seated) {
      arm.rotation.x = 0.85;
      arm.rotation.z = side * 0.12;
    } else {
      arm.rotation.z = side * 0.08;
    }
    arm.position.set(side * shoulderW, torsoY + torsoH / 2 - 0.06, 0);
    person.add(arm);
    limbs.arms.push(arm);
  }

  if (seated) {
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      const thigh = mesh(new THREE.BoxGeometry(limbW + 0.02, legLen * 0.52, limbW + 0.02), pantsMat);
      thigh.position.set(0, -legLen * 0.26, legLen * 0.22);
      thigh.rotation.x = Math.PI / 2;
      const shin = mesh(new THREE.BoxGeometry(limbW, legLen * 0.48, limbW), pantsMat);
      shin.position.set(0, -legLen * 0.38, legLen * 0.48);
      const foot = mesh(new THREE.BoxGeometry(limbW + 0.04, 0.12, limbW + 0.14), plastic(0x111827));
      foot.position.set(0, -legLen * 0.58, legLen * 0.52);
      leg.add(thigh, shin, foot);
      leg.position.set(side * 0.11, hipY, 0);
      person.add(leg);
      limbs.legs.push(leg);
    }
  } else {
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      const upper = mesh(new THREE.BoxGeometry(limbW + 0.02, legLen, limbW + 0.02), pantsMat);
      upper.position.y = -legLen / 2;
      const foot = mesh(new THREE.BoxGeometry(limbW + 0.06, 0.14, limbW + 0.18), plastic(0x111827));
      foot.position.set(0, -legLen - 0.04, 0.04);
      leg.add(upper, foot);
      leg.position.set(side * 0.11, hipY, 0);
      person.add(leg);
      limbs.legs.push(leg);
    }
  }

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.3, 16),
    new THREE.MeshBasicMaterial({ color: 0x05070a, transparent: true, opacity: 0.3, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.02, seated ? 0.22 : 0);
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
