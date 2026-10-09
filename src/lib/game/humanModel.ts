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
  return new THREE.MeshLambertMaterial({ color });
}

function clothPaint(color: THREE.ColorRepresentation) {
  return new THREE.MeshLambertMaterial({ color });
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, shade = false) {
  const next = new THREE.Mesh(geo, mat);
  next.castShadow = shade;
  next.receiveShadow = shade;
  return next;
}

function hand(skin: THREE.Material, seated: boolean, lite: boolean) {
  const group = new THREE.Group();
  const palm = mesh(new THREE.SphereGeometry(0.038, lite ? 8 : 12, lite ? 6 : 10), skin);
  palm.scale.set(0.95, 1.05, 1.35);
  group.add(palm);
  if (lite) return group;
  const thumb = mesh(new THREE.CapsuleGeometry(0.01, 0.028, 3, 6), skin);
  thumb.position.set(0.028, 0.004, 0.01);
  thumb.rotation.z = -0.85;
  thumb.rotation.x = 0.4;
  group.add(thumb);
  for (let i = 0; i < 4; i += 1) {
    const finger = mesh(new THREE.CapsuleGeometry(0.007, 0.032, 3, 6), skin);
    finger.position.set(-0.018 + i * 0.012, seated ? -0.002 : -0.028, 0.028);
    finger.rotation.x = seated ? 0.9 : 0.25;
    group.add(finger);
  }
  return group;
}

function shoePair(upper: THREE.Material, sole: THREE.Material) {
  const shoe = new THREE.Group();
  const body = mesh(new THREE.SphereGeometry(0.068, 12, 10), upper);
  body.scale.set(0.88, 0.58, 1.42);
  body.position.set(0, 0.032, 0.04);
  const toe = mesh(new THREE.SphereGeometry(0.048, 10, 8), upper);
  toe.scale.set(0.92, 0.5, 1.15);
  toe.position.set(0, 0.022, 0.11);
  const rubber = mesh(new THREE.BoxGeometry(0.118, 0.028, 0.25), sole);
  rubber.position.set(0, -0.018, 0.045);
  const stripe = mesh(new THREE.BoxGeometry(0.02, 0.018, 0.16), sole);
  stripe.position.set(0.05, 0.02, 0.04);
  shoe.add(body, toe, rubber, stripe);
  return shoe;
}

/**
 * Anatomically proportioned person with a face, hair, clothes, hands, and sneakers.
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
  const segs = lite ? 10 : 16;

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
  const whiteMat = new THREE.MeshLambertMaterial({ color: 0xf7f4ee });
  const irisMat = clothPaint(0x3a2418);
  const pupilMat = clothPaint(0x090807);
  const lipMat = skinPaint(skin.clone().lerp(new THREE.Color(0x8c3d3d), 0.35));

  const hipY = seated ? 0.84 : 1.02;
  const torsoY = seated ? 1.34 : 1.52;
  const headY = seated ? 1.74 : 1.92;
  const shoulderW = isFemale ? 0.215 : 0.25;

  const head = new THREE.Group();
  const skull = mesh(new THREE.SphereGeometry(0.162, segs, segs), skinMat);
  skull.scale.set(0.94, 1.14, 1.02);
  head.add(skull);

  const temples = mesh(new THREE.SphereGeometry(0.1, 16, 14), skinMat);
  temples.scale.set(1.28, 0.7, 0.78);
  temples.position.set(0, 0.01, 0.02);
  head.add(temples);

  const jaw = mesh(new THREE.SphereGeometry(0.1, 16, 14), skinMat);
  jaw.scale.set(isFemale ? 0.92 : 1.02, 0.78, 0.95);
  jaw.position.set(0, -0.1, 0.035);
  head.add(jaw);

  const chin = mesh(new THREE.SphereGeometry(0.048, 12, 10), skinMat);
  chin.scale.set(isFemale ? 0.88 : 1.08, 0.78, 1.12);
  chin.position.set(0, -0.168, 0.078);
  head.add(chin);

  for (const side of [-1, 1]) {
    const ear = mesh(new THREE.SphereGeometry(0.03, 12, 10), deepSkin);
    ear.scale.set(0.5, 1.2, 0.72);
    ear.position.set(side * 0.162, -0.008, -0.012);
    ear.rotation.z = side * -0.2;
    head.add(ear);
  }

  for (const side of [-1, 1]) {
    const socket = mesh(new THREE.SphereGeometry(0.032, 12, 10), deepSkin);
    socket.scale.set(1.15, 0.7, 0.45);
    socket.position.set(side * 0.052, 0.02, 0.138);
    const white = mesh(new THREE.SphereGeometry(0.024, 14, 12), whiteMat);
    white.scale.set(1.2, 0.82, 0.62);
    white.position.set(side * 0.052, 0.018, 0.155);
    const iris = mesh(new THREE.SphereGeometry(0.012, 12, 10), irisMat);
    iris.position.set(side * 0.052, 0.017, 0.17);
    const pupil = mesh(new THREE.SphereGeometry(0.006, 10, 8), pupilMat);
    pupil.position.set(side * 0.052, 0.017, 0.178);
    const brow = mesh(new THREE.CapsuleGeometry(0.008, 0.048, 4, 8), hairMat);
    brow.rotation.z = Math.PI / 2 + side * -0.22;
    brow.position.set(side * 0.05, 0.058, 0.15);
    head.add(socket, white, iris, pupil, brow);
    if (!lite) {
      const glint = mesh(new THREE.SphereGeometry(0.0035, 8, 6), whiteMat);
      glint.position.set(side * 0.048, 0.024, 0.182);
      const upperLid = mesh(new THREE.SphereGeometry(0.026, 12, 8), skinMat);
      upperLid.scale.set(1.25, 0.28, 0.5);
      upperLid.position.set(side * 0.052, 0.034, 0.152);
      const lowerLid = mesh(new THREE.SphereGeometry(0.024, 10, 8), skinMat);
      lowerLid.scale.set(1.2, 0.22, 0.42);
      lowerLid.position.set(side * 0.052, 0.004, 0.154);
      head.add(glint, upperLid, lowerLid);
    }
  }

  const bridge = mesh(new THREE.CapsuleGeometry(0.012, 0.05, 5, 8), skinMat);
  bridge.rotation.x = -0.42;
  bridge.position.set(0, 0.006, 0.168);
  const tip = mesh(new THREE.SphereGeometry(0.02, 12, 10), skinMat);
  tip.position.set(0, -0.032, 0.19);
  head.add(bridge, tip);
  for (const side of [-1, 1]) {
    const nostril = mesh(new THREE.SphereGeometry(0.009, 8, 8), deepSkin);
    nostril.position.set(side * 0.014, -0.04, 0.178);
    head.add(nostril);
  }

  const philtrum = mesh(new THREE.CapsuleGeometry(0.006, 0.018, 3, 6), deepSkin);
  philtrum.position.set(0, -0.07, 0.168);
  const upperLip = mesh(new THREE.CapsuleGeometry(0.01, 0.036, 4, 8), lipMat);
  upperLip.rotation.z = Math.PI / 2;
  upperLip.position.set(0, -0.09, 0.165);
  const lowerLip = mesh(new THREE.CapsuleGeometry(0.012, 0.03, 4, 8), lipMat);
  lowerLip.rotation.z = Math.PI / 2;
  lowerLip.position.set(0, -0.112, 0.16);
  head.add(philtrum, upperLip, lowerLip);

  if (isFemale) {
    const crown = mesh(new THREE.SphereGeometry(0.178, 22, 16), hairMat);
    crown.scale.set(1.06, 0.82, 1.1);
    crown.position.set(0, 0.05, -0.018);
    const fringe = mesh(new THREE.SphereGeometry(0.12, 14, 12), hairMat);
    fringe.scale.set(1.35, 0.35, 0.7);
    fringe.position.set(0, 0.1, 0.08);
    const back = mesh(new THREE.SphereGeometry(0.15, 16, 14), hairMat);
    back.position.set(0, 0.01, -0.12);
    const nape = mesh(new THREE.CapsuleGeometry(0.075, 0.2, 5, 12), hairMat);
    nape.position.set(0, -0.06, -0.13);
    head.add(crown, fringe, back, nape);
    if (lookId === "zara") {
      const fall = mesh(new THREE.CapsuleGeometry(0.055, 0.28, 5, 10), hairMat);
      fall.position.set(0, -0.12, -0.15);
      head.add(fall);
    } else {
      const bun = mesh(new THREE.SphereGeometry(0.11, 14, 12), hairMat);
      bun.position.set(0, 0.18, -0.06);
      head.add(bun);
    }
    if (lookId === "ada" || lookId === "ngozi") {
      for (const side of [-1, 1]) {
        const braid = mesh(new THREE.CapsuleGeometry(0.026, 0.18, 5, 8), hairMat);
        braid.position.set(side * 0.11, -0.04, -0.08);
        braid.rotation.z = side * 0.28;
        head.add(braid);
      }
    }
  } else {
    const cap = mesh(new THREE.SphereGeometry(0.17, 22, 16), hairMat);
    cap.scale.set(1.02, 0.7, 1.06);
    cap.position.set(0, 0.055, -0.012);
    const fringe = mesh(new THREE.SphereGeometry(0.1, 12, 10), hairMat);
    fringe.scale.set(1.45, 0.28, 0.55);
    fringe.position.set(0, 0.108, 0.09);
    const nape = mesh(new THREE.SphereGeometry(0.09, 12, 10), hairMat);
    nape.position.set(0, -0.01, -0.125);
    head.add(cap, fringe, nape);
    for (const side of [-1, 1]) {
      const sideburn = mesh(new THREE.CapsuleGeometry(0.016, 0.05, 4, 8), hairMat);
      sideburn.position.set(side * 0.14, -0.02, 0.02);
      head.add(sideburn);
    }
  }

  const neck = mesh(new THREE.CylinderGeometry(isFemale ? 0.05 : 0.058, 0.068, 0.15, 14), skinMat);
  neck.position.set(0, -0.25, 0.012);
  head.add(neck);
  head.position.set(0, headY, seated ? 0.04 : 0);
  person.add(head);

  const torso = new THREE.Group();
  const chest = mesh(new THREE.CapsuleGeometry(isFemale ? 0.145 : 0.165, 0.22, 6, 14), shirtMat);
  chest.scale.set(isFemale ? 1.12 : 1.22, 1, 0.78);
  chest.position.set(0, 0.06, 0.015);
  const belly = mesh(new THREE.CapsuleGeometry(isFemale ? 0.125 : 0.14, 0.16, 6, 12), shirtMat);
  belly.scale.set(isFemale ? 1.02 : 1.08, 1, 0.82);
  belly.position.set(0, -0.16, 0.01);
  torso.add(chest, belly);
  if (isFemale) {
    for (const side of [-1, 1]) {
      const bust = mesh(new THREE.SphereGeometry(0.07, 14, 12), shirtMat);
      bust.position.set(side * 0.07, 0.1, 0.095);
      torso.add(bust);
    }
  }
  const collar = mesh(new THREE.TorusGeometry(0.072, 0.016, 8, 16, Math.PI), shirtMat);
  collar.rotation.x = Math.PI / 2;
  collar.rotation.z = Math.PI;
  collar.position.set(0, 0.2, 0.03);
  const skinCollar = mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.04, 14), skinMat);
  skinCollar.position.set(0, 0.22, 0.02);
  const hem = mesh(new THREE.TorusGeometry(0.15, 0.012, 6, 16), shirtMat);
  hem.rotation.x = Math.PI / 2;
  hem.position.set(0, -0.26, 0);
  const belt = mesh(new THREE.TorusGeometry(0.148, 0.016, 8, 18), beltMat);
  belt.rotation.x = Math.PI / 2;
  belt.position.set(0, -0.29, 0);
  const buckle = mesh(new THREE.BoxGeometry(0.065, 0.04, 0.028), buckleMat);
  buckle.position.set(0, -0.29, 0.155);
  torso.add(collar, skinCollar, hem, belt, buckle);
  torso.position.set(0, torsoY, 0);
  person.add(torso);

  const hips = mesh(new THREE.SphereGeometry(0.155, 16, 14), pantsMat);
  hips.scale.set(isFemale ? 1.22 : 1.12, 0.72, 0.88);
  hips.position.set(0, hipY, 0);
  person.add(hips);

  const limbs: { legs: THREE.Group[]; arms: THREE.Group[] } = { legs: [], arms: [] };

  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    const deltoid = mesh(new THREE.SphereGeometry(0.078, 14, 12), shirtMat);
    arm.add(deltoid);
    if (cheering) {
      const upper = mesh(new THREE.CapsuleGeometry(0.05, 0.26, 5, 12), shirtMat);
      upper.position.set(0, 0.2, 0);
      const lower = mesh(new THREE.CapsuleGeometry(0.04, 0.24, 5, 12), skinMat);
      lower.position.set(0, 0.48, 0);
      const palm = hand(skinMat, false, lite);
      palm.position.set(0, 0.66, 0);
      arm.add(upper, lower, palm);
      arm.rotation.z = side * -0.45;
    } else if (seated) {
      const upper = mesh(new THREE.CapsuleGeometry(0.05, 0.24, 5, 12), shirtMat);
      upper.rotation.x = 0.55;
      upper.position.set(0, -0.12, 0.08);
      const elbow = mesh(new THREE.SphereGeometry(0.04, 12, 10), skinMat);
      elbow.position.set(0, -0.2, 0.2);
      const lower = mesh(new THREE.CapsuleGeometry(0.04, 0.22, 5, 12), skinMat);
      lower.rotation.x = 1.12;
      lower.position.set(0, -0.22, 0.3);
      const palm = hand(skinMat, true, lite);
      palm.rotation.x = 0.4;
      palm.position.set(0, -0.22, 0.48);
      arm.add(upper, elbow, lower, palm);
      arm.rotation.z = side * 0.08;
    } else {
      const upper = mesh(new THREE.CapsuleGeometry(0.05, 0.26, 5, 12), shirtMat);
      upper.position.set(0, -0.16, 0.012);
      const elbow = mesh(new THREE.SphereGeometry(0.042, 12, 10), skinMat);
      elbow.position.set(0, -0.32, 0.02);
      const lower = mesh(new THREE.CapsuleGeometry(0.04, 0.24, 5, 12), skinMat);
      lower.position.set(0, -0.48, 0.028);
      const palm = hand(skinMat, false, lite);
      palm.position.set(0, -0.66, 0.03);
      arm.add(upper, elbow, lower, palm);
      arm.rotation.z = side * 0.09;
    }
    arm.position.set(side * shoulderW, torsoY + 0.12, 0);
    person.add(arm);
    limbs.arms.push(arm);
  }

  if (seated) {
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      const thigh = mesh(new THREE.CapsuleGeometry(0.068, 0.34, 5, 12), pantsMat);
      thigh.rotation.x = Math.PI / 2;
      thigh.position.set(0, 0, 0.22);
      const knee = mesh(new THREE.SphereGeometry(0.065, 12, 10), pantsMat);
      knee.position.set(0, 0, 0.44);
      const calf = mesh(new THREE.CapsuleGeometry(0.055, 0.34, 5, 12), pantsMat);
      calf.position.set(0, -0.22, 0.44);
      const shoe = shoePair(shoeMat, soleMat);
      shoe.position.set(0, -0.58, 0.52);
      leg.add(thigh, knee, calf, shoe);
      leg.position.set(side * 0.11, hipY - 0.06, 0);
      person.add(leg);
    }
  } else {
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      const thigh = mesh(new THREE.CapsuleGeometry(0.068, 0.36, 5, 12), pantsMat);
      thigh.position.set(0, -0.22, 0);
      const knee = mesh(new THREE.SphereGeometry(0.062, 12, 10), pantsMat);
      knee.position.set(0, -0.44, 0.01);
      const calf = mesh(new THREE.CapsuleGeometry(0.052, 0.34, 5, 12), pantsMat);
      calf.position.set(0, -0.66, 0);
      const ankle = mesh(new THREE.SphereGeometry(0.04, 10, 8), pantsMat);
      ankle.position.set(0, -0.86, 0.01);
      const shoe = shoePair(shoeMat, soleMat);
      shoe.position.set(0, -1.0, 0.05);
      leg.add(thigh, knee, calf, ankle, shoe);
      leg.position.set(side * 0.11, hipY, 0);
      person.add(leg);
      limbs.legs.push(leg);
    }
  }

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.32, 20),
    new THREE.MeshBasicMaterial({ color: 0x05070a, transparent: true, opacity: 0.38, depthWrite: false }),
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
