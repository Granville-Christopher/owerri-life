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
}

function paint(color: THREE.ColorRepresentation, skin = false) {
  return new THREE.MeshLambertMaterial({
    color,
    emissive: skin ? new THREE.Color(color).multiplyScalar(0.12) : 0x000000,
  });
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material) {
  const next = new THREE.Mesh(geo, mat);
  next.castShadow = true;
  next.receiveShadow = true;
  return next;
}

/**
 * Rounded, anatomically proportioned person: oval head, face, hair, tapered body, capsule limbs.
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

  const pal = LOOKS.find((l) => l.id === lookId) ?? LOOKS[1];
  const person = new THREE.Group();
  const isFemale = pal.gender === "female";

  const skin = new THREE.Color(pal.skin);
  const skinMat = paint(skin, true);
  const deepSkin = paint(skin.clone().multiplyScalar(0.82), true);
  const shirtMat = paint(customShirt != null ? customShirt : pal.shirt);
  const pantsMat = paint(customPants != null ? customPants : isFemale ? 0x1f2937 : 0x172033);
  const hairMat = paint(pal.hair);
  const beltMat = paint(0x1c1917);
  const buckleMat = paint(0xd6c38a);
  const shoeMat = paint(0x111827);
  const soleMat = paint(0xf8fafc);
  const whiteMat = new THREE.MeshLambertMaterial({ color: 0xf6f3ee, emissive: 0x222018 });
  const irisMat = paint(0x2a1c14);
  const pupilMat = paint(0x0b0908);
  const lipMat = paint(skin.clone().multiplyScalar(0.62), true);

  const hipY = seated ? 0.84 : 1.02;
  const torsoY = seated ? 1.32 : 1.5;
  const headY = seated ? 1.72 : 1.9;
  const shoulderW = isFemale ? 0.22 : 0.255;

  const head = new THREE.Group();

  const skull = mesh(new THREE.SphereGeometry(0.168, 22, 18), skinMat);
  skull.scale.set(0.92, 1.16, 1.04);
  head.add(skull);

  const cheeks = mesh(new THREE.SphereGeometry(0.12, 14, 12), skinMat);
  cheeks.scale.set(1.15, 0.72, 0.9);
  cheeks.position.set(0, -0.06, 0.04);
  head.add(cheeks);

  const chin = mesh(new THREE.SphereGeometry(0.055, 12, 10), skinMat);
  chin.scale.set(isFemale ? 0.9 : 1.05, 0.8, 1.1);
  chin.position.set(0, -0.175, 0.07);
  head.add(chin);

  for (const side of [-1, 1]) {
    const ear = mesh(new THREE.SphereGeometry(0.032, 10, 8), deepSkin);
    ear.scale.set(0.55, 1.15, 0.8);
    ear.position.set(side * 0.168, -0.01, -0.01);
    ear.rotation.z = side * -0.18;
    head.add(ear);
  }

  for (const side of [-1, 1]) {
    const white = mesh(new THREE.SphereGeometry(0.028, 12, 10), whiteMat);
    white.scale.set(1.15, 0.78, 0.7);
    white.position.set(side * 0.055, 0.018, 0.152);
    const iris = mesh(new THREE.SphereGeometry(0.014, 10, 8), irisMat);
    iris.position.set(side * 0.055, 0.016, 0.168);
    const pupil = mesh(new THREE.SphereGeometry(0.007, 8, 8), pupilMat);
    pupil.position.set(side * 0.055, 0.016, 0.178);
    const glint = mesh(new THREE.SphereGeometry(0.004, 6, 6), whiteMat);
    glint.position.set(side * 0.05, 0.024, 0.182);
    const lid = mesh(new THREE.SphereGeometry(0.03, 10, 8), skinMat);
    lid.scale.set(1.2, 0.35, 0.55);
    lid.position.set(side * 0.055, 0.038, 0.15);
    const brow = mesh(new THREE.CapsuleGeometry(0.01, 0.05, 3, 6), hairMat);
    brow.rotation.z = Math.PI / 2 + side * -0.18;
    brow.position.set(side * 0.055, 0.062, 0.148);
    head.add(white, iris, pupil, glint, lid, brow);
  }

  const bridge = mesh(new THREE.CapsuleGeometry(0.014, 0.055, 4, 8), skinMat);
  bridge.rotation.x = -0.35;
  bridge.position.set(0, 0.0, 0.168);
  const tip = mesh(new THREE.SphereGeometry(0.022, 10, 8), skinMat);
  tip.position.set(0, -0.035, 0.188);
  for (const side of [-1, 1]) {
    const nostril = mesh(new THREE.SphereGeometry(0.01, 8, 6), deepSkin);
    nostril.position.set(side * 0.016, -0.042, 0.178);
    head.add(nostril);
  }
  head.add(bridge, tip);

  const upperLip = mesh(new THREE.CapsuleGeometry(0.011, 0.038, 3, 6), lipMat);
  upperLip.rotation.z = Math.PI / 2;
  upperLip.position.set(0, -0.092, 0.162);
  const lowerLip = mesh(new THREE.CapsuleGeometry(0.013, 0.032, 3, 6), lipMat);
  lowerLip.rotation.z = Math.PI / 2;
  lowerLip.position.set(0, -0.118, 0.158);
  head.add(upperLip, lowerLip);

  if (isFemale) {
    const crown = mesh(new THREE.SphereGeometry(0.185, 18, 14), hairMat);
    crown.scale.set(1.02, 0.78, 1.08);
    crown.position.set(0, 0.055, -0.02);
    const back = mesh(new THREE.SphereGeometry(0.14, 14, 12), hairMat);
    back.position.set(0, 0.02, -0.12);
    const fall = mesh(new THREE.CapsuleGeometry(0.07, 0.22, 4, 10), hairMat);
    fall.position.set(0, -0.08, -0.14);
    const bun = mesh(new THREE.SphereGeometry(lookId === "zara" ? 0.09 : 0.12, 12, 10), hairMat);
    bun.position.set(0, lookId === "zara" ? 0.08 : 0.2, lookId === "zara" ? -0.16 : -0.05);
    head.add(crown, back, fall, bun);
    if (lookId === "ada" || lookId === "ngozi") {
      for (const side of [-1, 1]) {
        const braid = mesh(new THREE.CapsuleGeometry(0.028, 0.16, 4, 8), hairMat);
        braid.position.set(side * 0.12, -0.02, -0.08);
        braid.rotation.z = side * 0.25;
        head.add(braid);
      }
    }
  } else {
    const fade = mesh(new THREE.SphereGeometry(0.176, 18, 14), hairMat);
    fade.scale.set(0.98, 0.62, 1.02);
    fade.position.set(0, 0.07, -0.02);
    const crop = mesh(new THREE.SphereGeometry(0.16, 14, 10), hairMat);
    crop.scale.set(1, 0.35, 1.05);
    crop.position.set(0, 0.12, 0.01);
    const nape = mesh(new THREE.SphereGeometry(0.08, 10, 8), hairMat);
    nape.position.set(0, -0.02, -0.12);
    head.add(fade, crop, nape);
  }

  const neck = mesh(new THREE.CylinderGeometry(isFemale ? 0.055 : 0.062, 0.07, 0.14, 12), skinMat);
  neck.position.set(0, -0.24, 0.01);
  head.add(neck);
  head.position.set(0, headY, seated ? 0.05 : 0);
  person.add(head);

  const torso = new THREE.Group();
  const chest = mesh(new THREE.SphereGeometry(0.2, 16, 14), shirtMat);
  chest.scale.set(isFemale ? 1.05 : 1.18, 0.95, 0.72);
  chest.position.set(0, 0.08, 0.02);
  const belly = mesh(new THREE.SphereGeometry(0.16, 14, 12), shirtMat);
  belly.scale.set(isFemale ? 0.95 : 1.05, 1.05, 0.78);
  belly.position.set(0, -0.14, 0.01);
  torso.add(chest, belly);
  if (isFemale) {
    for (const side of [-1, 1]) {
      const bust = mesh(new THREE.SphereGeometry(0.075, 12, 10), shirtMat);
      bust.position.set(side * 0.075, 0.1, 0.1);
      torso.add(bust);
    }
  }
  const collar = mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.05, 12), skinMat);
  collar.position.set(0, 0.22, 0.02);
  const belt = mesh(new THREE.TorusGeometry(0.145, 0.018, 8, 18), beltMat);
  belt.rotation.x = Math.PI / 2;
  belt.position.set(0, -0.28, 0);
  const buckle = mesh(new THREE.BoxGeometry(0.07, 0.045, 0.03), buckleMat);
  buckle.position.set(0, -0.28, 0.15);
  torso.add(collar, belt, buckle);
  torso.position.set(0, torsoY, 0);
  person.add(torso);

  const hips = mesh(new THREE.SphereGeometry(0.16, 14, 12), pantsMat);
  hips.scale.set(isFemale ? 1.2 : 1.1, 0.7, 0.85);
  hips.position.set(0, hipY, 0);
  person.add(hips);

  const limbs: { legs: THREE.Group[]; arms: THREE.Group[] } = { legs: [], arms: [] };

  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    const deltoid = mesh(new THREE.SphereGeometry(0.08, 12, 10), shirtMat);
    arm.add(deltoid);
    if (cheering) {
      const upper = mesh(new THREE.CapsuleGeometry(0.052, 0.26, 4, 10), shirtMat);
      upper.position.set(0, 0.2, 0);
      const lower = mesh(new THREE.CapsuleGeometry(0.042, 0.24, 4, 10), skinMat);
      lower.position.set(0, 0.48, 0);
      const hand = mesh(new THREE.SphereGeometry(0.048, 10, 8), skinMat);
      hand.position.set(0, 0.66, 0);
      arm.add(upper, lower, hand);
      arm.rotation.z = side * -0.45;
    } else if (seated) {
      const upper = mesh(new THREE.CapsuleGeometry(0.052, 0.24, 4, 10), shirtMat);
      upper.rotation.x = 0.55;
      upper.position.set(0, -0.12, 0.08);
      const lower = mesh(new THREE.CapsuleGeometry(0.042, 0.22, 4, 10), skinMat);
      lower.rotation.x = 1.15;
      lower.position.set(0, -0.22, 0.28);
      const hand = mesh(new THREE.SphereGeometry(0.045, 10, 8), skinMat);
      hand.scale.set(1, 0.7, 1.25);
      hand.position.set(0, -0.22, 0.46);
      arm.add(upper, lower, hand);
      arm.rotation.z = side * 0.1;
    } else {
      const upper = mesh(new THREE.CapsuleGeometry(0.052, 0.26, 4, 10), shirtMat);
      upper.position.set(0, -0.16, 0.01);
      const elbow = mesh(new THREE.SphereGeometry(0.045, 10, 8), skinMat);
      elbow.position.set(0, -0.32, 0.02);
      const lower = mesh(new THREE.CapsuleGeometry(0.042, 0.24, 4, 10), skinMat);
      lower.position.set(0, -0.48, 0.03);
      const hand = mesh(new THREE.SphereGeometry(0.045, 10, 8), skinMat);
      hand.scale.set(0.9, 1.05, 1.2);
      hand.position.set(0, -0.66, 0.03);
      arm.add(upper, elbow, lower, hand);
      arm.rotation.z = side * 0.1;
    }
    arm.position.set(side * shoulderW, torsoY + 0.12, 0);
    person.add(arm);
    limbs.arms.push(arm);
  }

  if (seated) {
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      const thigh = mesh(new THREE.CapsuleGeometry(0.07, 0.34, 4, 10), pantsMat);
      thigh.rotation.x = Math.PI / 2;
      thigh.position.set(0, 0, 0.22);
      const knee = mesh(new THREE.SphereGeometry(0.068, 10, 8), pantsMat);
      knee.position.set(0, 0, 0.44);
      const calf = mesh(new THREE.CapsuleGeometry(0.058, 0.34, 4, 10), pantsMat);
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
      const thigh = mesh(new THREE.CapsuleGeometry(0.07, 0.36, 4, 10), pantsMat);
      thigh.position.set(0, -0.22, 0);
      const knee = mesh(new THREE.SphereGeometry(0.065, 10, 8), pantsMat);
      knee.position.set(0, -0.44, 0.01);
      const calf = mesh(new THREE.CapsuleGeometry(0.055, 0.34, 4, 10), pantsMat);
      calf.position.set(0, -0.66, 0);
      const shoe = shoePair(shoeMat, soleMat);
      shoe.position.set(0, -1.0, 0.05);
      leg.add(thigh, knee, calf, shoe);
      leg.position.set(side * 0.11, hipY, 0);
      person.add(leg);
      limbs.legs.push(leg);
    }
  }

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.34, 18),
    new THREE.MeshBasicMaterial({ color: 0x05070a, transparent: true, opacity: 0.4, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.02, seated ? 0.28 : 0);
  person.add(shadow);

  person.userData.limbs = limbs;
  person.scale.setScalar(scale);
  return person;
}

function shoePair(upper: THREE.Material, sole: THREE.Material) {
  const shoe = new THREE.Group();
  const body = mesh(new THREE.SphereGeometry(0.07, 10, 8), upper);
  body.scale.set(0.85, 0.62, 1.35);
  body.position.set(0, 0.03, 0.04);
  const toe = mesh(new THREE.SphereGeometry(0.05, 8, 8), upper);
  toe.scale.set(0.9, 0.55, 1.1);
  toe.position.set(0, 0.02, 0.1);
  const rubber = mesh(new THREE.BoxGeometry(0.12, 0.03, 0.24), sole);
  rubber.position.set(0, -0.02, 0.04);
  shoe.add(body, toe, rubber);
  return shoe;
}
