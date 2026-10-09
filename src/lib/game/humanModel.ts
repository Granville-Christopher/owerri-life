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

function nameSprite(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "rgba(23,36,30,0.88)";
    ctx.fillRect(8, 8, 240, 48);
    ctx.fillStyle = "#e0b15a";
    ctx.fillRect(8, 8, 240, 4);
    ctx.fillStyle = "#f6f1e6";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text.slice(0, 16), 128, 36);
  }
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthTest: false, transparent: true }));
  sprite.position.set(0, 2.08, 0);
  sprite.scale.set(1.55, 0.38, 1);
  sprite.renderOrder = 12;
  return sprite;
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
      body.add(nameSprite(person.name));
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

/**
 * Creates a highly realistic, anatomically proportioned 3D human character
 * with facial features (eyes, nose, lips, ears), styled hair, realistic clothing
 * (collar, belt, denim/trousers), sneakers with white soles, and natural poses (standing or seated).
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

  // Color materials
  const skinColor = new THREE.Color(pal.skin);
  const skinMat = new THREE.MeshLambertMaterial({ color: skinColor });
  const shirtColor = customShirt != null ? new THREE.Color(customShirt) : new THREE.Color(pal.shirt);
  const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColor });
  const pantsColor = customPants != null ? new THREE.Color(customPants) : new THREE.Color(0x1e293b); // Dark indigo / charcoal
  const pantsMat = new THREE.MeshLambertMaterial({ color: pantsColor });
  const hairColor = new THREE.Color(pal.hair);
  const hairMat = new THREE.MeshLambertMaterial({ color: hairColor });
  const beltMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
  const buckleMat = new THREE.MeshLambertMaterial({ color: 0xd4d4d8 });
  const shoeMat = new THREE.MeshLambertMaterial({ color: 0x0f172a }); // Sneaker upper
  const soleMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc }); // White rubber sole
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyeIrisMat = new THREE.MeshBasicMaterial({ color: 0x181411 });
  const lipMat = new THREE.MeshLambertMaterial({ color: skinColor.clone().multiplyScalar(0.72) });

  const isFemale = pal.gender === "female";

  // 1. HEAD & NECK
  const headGroup = new THREE.Group();

  // Cranium (Head base)
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.19, 18, 16), skinMat);
  skull.scale.set(0.96, 1.12, 1.02);
  headGroup.add(skull);

  // Jaw & Chin
  const jaw = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.17, 0.14, 12), skinMat);
  jaw.position.set(0, -0.1, 0.04);
  headGroup.add(jaw);

  const chin = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), skinMat);
  chin.position.set(0, -0.17, 0.08);
  headGroup.add(chin);

  // Ears
  const leftEar = new THREE.Mesh(new THREE.CapsuleGeometry(0.024, 0.045, 4, 8), skinMat);
  leftEar.position.set(-0.19, -0.01, -0.01);
  leftEar.rotation.z = -0.12;
  const rightEar = leftEar.clone();
  rightEar.position.x = 0.19;
  rightEar.rotation.z = 0.12;
  headGroup.add(leftEar, rightEar);

  // Eyes (White Sclera + Dark Iris + Glint)
  for (const side of [-1, 1]) {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 8), eyeWhiteMat);
    eyeWhite.scale.set(1.1, 0.75, 0.85);
    eyeWhite.position.set(side * 0.068, 0.02, 0.165);

    const eyeIris = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), eyeIrisMat);
    eyeIris.position.set(side * 0.068, 0.02, 0.185);

    // Eyebrows
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.065, 4, 6), hairMat);
    brow.rotation.z = side * -0.12;
    brow.rotation.y = side * 0.15;
    brow.position.set(side * 0.07, 0.07, 0.165);

    headGroup.add(eyeWhite, eyeIris, brow);
  }

  // Nose
  const noseBridge = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.028, 0.09, 6), skinMat);
  noseBridge.rotation.x = -0.22;
  noseBridge.position.set(0, 0.01, 0.185);

  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), skinMat);
  noseTip.position.set(0, -0.03, 0.21);
  headGroup.add(noseBridge, noseTip);

  // Lips
  const upperLip = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.05, 4, 6), lipMat);
  upperLip.rotation.z = Math.PI / 2;
  upperLip.position.set(0, -0.085, 0.178);

  const lowerLip = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.045, 4, 6), lipMat);
  lowerLip.rotation.z = Math.PI / 2;
  lowerLip.position.set(0, -0.115, 0.176);
  headGroup.add(upperLip, lowerLip);

  // Hair Styling
  if (isFemale) {
    // Stylized high bun / braids
    const hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.205, 16, 12), hairMat);
    hairCrown.position.set(0, 0.06, -0.02);
    hairCrown.scale.set(1.04, 0.8, 1.08);

    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), hairMat);
    bun.position.set(0, 0.22, -0.06);
    headGroup.add(hairCrown, bun);
  } else {
    // Sharp modern fade / textured crop
    const hairTop = new THREE.Mesh(new THREE.SphereGeometry(0.202, 16, 12), hairMat);
    hairTop.position.set(0, 0.07, -0.015);
    hairTop.scale.set(1.02, 0.65, 1.05);

    const hairline = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.04), hairMat);
    hairline.position.set(0, 0.13, 0.155);
    headGroup.add(hairTop, hairline);
  }

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.095, 0.16, 10), skinMat);
  neck.position.set(0, -0.22, 0);
  headGroup.add(neck);

  headGroup.position.set(0, seated ? 1.48 : 1.74, seated ? 0.06 : 0);
  person.add(headGroup);

  // 2. TORSO & CLOTHES
  const torsoGroup = new THREE.Group();

  // Chest / upper body
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.26), shirtMat);
  chest.position.set(0, -0.02, 0);

  // Collar V-neck
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.06, 10), skinMat);
  collar.position.set(0, 0.18, 0.02);
  torsoGroup.add(collar);

  // Abdomen / waist
  const waist = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.26, 0.24), shirtMat);
  waist.position.set(0, -0.28, 0);

  // Belt
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.05, 0.25), beltMat);
  belt.position.set(0, -0.42, 0);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.03), buckleMat);
  buckle.position.set(0, -0.42, 0.13);

  torsoGroup.add(chest, waist, belt, buckle);
  torsoGroup.position.set(0, seated ? 1.28 : 1.54, 0);
  person.add(torsoGroup);

  // 3. SHOULDERS, ARMS & HANDS
  const armY = seated ? 1.28 : 1.54;
  const limbs: { legs: THREE.Group[]; arms: THREE.Group[] } = { legs: [], arms: [] };

  for (const side of [-1, 1]) {
    const armGroup = new THREE.Group();

    // Shoulder deltoid cap
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), shirtMat);
    shoulder.position.set(0, 0, 0);
    armGroup.add(shoulder);

    if (cheering) {
      // Arms raised high
      const upArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.34, 8), shirtMat);
      upArm.position.set(0, 0.22, 0);
      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.045, 0.32, 8), skinMat);
      forearm.position.set(0, 0.52, 0);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), skinMat);
      hand.position.set(0, 0.72, 0);
      armGroup.add(upArm, forearm, hand);
      armGroup.rotation.z = side * -0.4;
    } else if (seated) {
      // Natural seated arm resting forward on armrest/thigh
      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.058, 0.32, 8), shirtMat);
      upperArm.rotation.x = 0.45;
      upperArm.position.set(0, -0.15, 0.06);

      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.046, 0.32, 8), skinMat);
      forearm.rotation.x = Math.PI / 2;
      forearm.position.set(0, -0.28, 0.25);

      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.09), skinMat);
      hand.position.set(0, -0.28, 0.43);

      armGroup.add(upperArm, forearm, hand);
      armGroup.rotation.z = side * 0.08;
    } else {
      // Standing natural arm
      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.058, 0.34, 8), shirtMat);
      upperArm.position.set(0, -0.18, 0);
      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.046, 0.32, 8), skinMat);
      forearm.position.set(0, -0.48, 0.02);
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.04), skinMat);
      hand.position.set(0, -0.68, 0.02);
      armGroup.add(upperArm, forearm, hand);
      armGroup.rotation.z = side * 0.12;
    }

    armGroup.position.set(side * 0.26, armY, 0);
    person.add(armGroup);
    limbs.arms.push(armGroup);
  }

  // 4. PELVIS, LEGS & SNEAKERS
  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.2, 0.25), pantsMat);
  hips.position.set(0, seated ? 0.78 : 1.05, 0);
  person.add(hips);

  if (seated) {
    // SEATED LEGS: Thighs forward, calves down to floor, sneakers flat
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();

      // Thigh extending horizontally forward
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.46, 10), pantsMat);
      thigh.rotation.x = Math.PI / 2;
      thigh.position.set(0, 0, 0.25);

      // Knee
      const knee = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), pantsMat);
      knee.position.set(0, 0, 0.48);

      // Calf descending vertically
      const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.48, 10), pantsMat);
      calf.position.set(0, -0.26, 0.48);

      // Modern Sneaker
      const sneakerUpper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.26), shoeMat);
      sneakerUpper.position.set(0, -0.52, 0.54);

      const sneakerSole = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.04, 0.28), soleMat);
      sneakerSole.position.set(0, -0.58, 0.54);

      leg.add(thigh, knee, calf, sneakerUpper, sneakerSole);
      leg.position.set(side * 0.12, 0.72, 0);
      person.add(leg);
    }
  } else {
    // STANDING LEGS
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();

      // Thigh
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.48, 10), pantsMat);
      thigh.position.set(0, -0.26, 0);

      // Knee
      const knee = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), pantsMat);
      knee.position.set(0, -0.5, 0.01);

      // Calf
      const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.48, 10), pantsMat);
      calf.position.set(0, -0.74, 0);

      // Sneaker
      const sneakerUpper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.26), shoeMat);
      sneakerUpper.position.set(0, -0.96, 0.05);

      const sneakerSole = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.04, 0.28), soleMat);
      sneakerSole.position.set(0, -1.02, 0.05);

      leg.add(thigh, knee, calf, sneakerUpper, sneakerSole);
      leg.position.set(side * 0.12, 1.02, 0);
      person.add(leg);
      limbs.legs.push(leg);
    }
  }

  // Shadow blob under the person
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.38, 16),
    new THREE.MeshBasicMaterial({ color: 0x05070a, transparent: true, opacity: 0.45, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.02, seated ? 0.35 : 0);
  person.add(shadow);

  person.userData.limbs = limbs;
  person.scale.setScalar(scale);
  return person;
}
