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

/** Block Roblox avatar: square head, torso, two arms, two legs each split into thigh and shin. */
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
  const pantsColor = new THREE.Color(customPants != null ? customPants : isFemale ? 0x1f2937 : 0x151c2e);
  const pantsMat = plastic(pantsColor);
  const shinMat = plastic(pantsColor.clone().multiplyScalar(0.72));
  const hairMat = plastic(pal.hair);
  const shoeMat = plastic(0x111111);

  const headSize = 0.5;
  const torsoW = 0.72;
  const torsoH = 0.78;
  const torsoD = 0.36;
  const armW = 0.24;
  const upperArm = 0.36;
  const lowerArm = 0.32;
  const handS = 0.2;
  const thighH = 0.4;
  const shinH = 0.36;
  const footH = 0.12;
  const legW = 0.3;
  const legGap = 0.08;

  const hipY = thighH + shinH + footH;
  const torsoY = hipY + torsoH / 2;
  const headY = hipY + torsoH + headSize / 2 + 0.02;
  const shoulderX = torsoW / 2 + armW / 2 + 0.015;
  const legX = legW / 2 + legGap / 2;

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
  torso.position.set(0, torsoY, 0);
  person.add(torso);

  const hips = new THREE.Group();
  hips.position.set(0, hipY, 0);
  person.add(hips);

  const limbs: { legs: THREE.Group[]; arms: THREE.Group[] } = { legs: [], arms: [] };

  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    const upper = mesh(new THREE.BoxGeometry(armW, upperArm, armW), shirtMat);
    upper.position.y = -upperArm / 2;
    const elbow = new THREE.Group();
    elbow.position.y = -upperArm;
    const lower = mesh(new THREE.BoxGeometry(armW * 0.92, lowerArm, armW * 0.92), shirtMat);
    lower.position.y = -lowerArm / 2;
    const hand = mesh(new THREE.BoxGeometry(handS, handS, handS), skinMat);
    hand.position.y = -lowerArm - handS / 2;
    elbow.add(lower, hand);
    arm.add(upper, elbow);
    if (cheering) {
      arm.rotation.z = side * -1.4;
    } else if (seated) {
      elbow.rotation.x = 1.15;
      arm.rotation.z = side * 0.15;
    }
    arm.position.set(side * shoulderX, hipY + torsoH - 0.02, 0);
    person.add(arm);
    limbs.arms.push(arm);
  }

  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    const thigh = mesh(new THREE.BoxGeometry(legW, thighH, legW), pantsMat);
    thigh.position.y = -thighH / 2;
    const knee = new THREE.Group();
    knee.position.y = -thighH;
    const shin = mesh(new THREE.BoxGeometry(legW * 0.86, shinH, legW * 0.86), shinMat);
    shin.position.y = -shinH / 2;
    const foot = mesh(new THREE.BoxGeometry(legW * 0.95, footH, legW * 1.35), shoeMat);
    foot.position.set(0, -shinH - footH / 2 + 0.01, legW * 0.22);
    knee.add(shin, foot);
    leg.add(thigh, knee);
    if (seated) {
      leg.rotation.x = -Math.PI / 2;
      knee.rotation.x = Math.PI / 2;
    }
    leg.position.set(side * legX, hipY, 0);
    leg.userData.knee = knee;
    person.add(leg);
    limbs.legs.push(leg);
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
