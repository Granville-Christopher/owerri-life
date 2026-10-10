import * as THREE from "three";

const FUSE_R = 1.22;
const FUSE_L = 16.5;

/**
 * Cylinder UV: u wraps the tube, v runs the length.
 * After rotation.x = +90°, uv.y = 1 is the nose (+Z) and uv.y = 0 is the tail.
 * u = 0.25 is the +X side, u = 0.75 is the -X side, u = 0.5 is the roof.
 * CanvasTexture flipY puts the top of this image at the nose.
 */
function paintFuselage(): THREE.CanvasTexture {
  const around = 4096;
  const along = 3072;
  const canvas = document.createElement("canvas");
  canvas.width = around;
  canvas.height = along;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  ctx.fillStyle = "#f4f7fb";
  ctx.fillRect(0, 0, around, along);

  const plate = document.createElement("canvas");
  plate.width = 1600;
  plate.height = 420;
  const pen = plate.getContext("2d");
  if (pen) {
    pen.fillStyle = "#1f6b45";
    pen.fillRect(0, 0, plate.width, plate.height);
    pen.fillStyle = "#e0b15a";
    pen.fillRect(0, 0, plate.width, 28);
    pen.fillRect(0, plate.height - 28, plate.width, 28);
    pen.font = "900 250px Arial, Helvetica, sans-serif";
    pen.textAlign = "center";
    pen.textBaseline = "middle";
    pen.lineJoin = "round";
    pen.lineWidth = 28;
    pen.strokeStyle = "#06281a";
    pen.strokeText("OWERRI LIFE", plate.width / 2, plate.height * 0.54);
    pen.fillStyle = "#e0b15a";
    pen.fillText("OWERRI LIFE", plate.width / 2, plate.height * 0.54);
  }

  const wordH = 700;
  const wordW = wordH * (plate.width / plate.height);
  const mid = along * 0.5;
  // +X side, upper shoulder the outside camera looks at. Letters stand up, word reads left to right.
  ctx.save();
  ctx.translate(0.3 * around, mid);
  ctx.rotate(Math.PI / 2);
  ctx.scale(-1, 1);
  ctx.drawImage(plate, -wordW / 2, -wordH / 2, wordW, wordH);
  ctx.restore();
  // -X side, mirrored so it also reads correctly from that side.
  ctx.save();
  ctx.translate(0.7 * around, mid);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(-1, 1);
  ctx.drawImage(plate, -wordW / 2, -wordH / 2, wordW, wordH);
  ctx.restore();

  ctx.fillStyle = "#12344c";
  for (const u of [0.4, 0.6]) {
    for (let i = 0; i < 14; i += 1) {
      const y = along * (0.22 + i * 0.04);
      ctx.beginPath();
      ctx.ellipse(u * around, y, 26, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = "#d8dee6";
  ctx.strokeStyle = "#1a2430";
  ctx.lineWidth = 8;
  for (const u of [0.25, 0.75]) {
    for (const y of [along * 0.22, along * 0.78]) {
      ctx.fillRect(u * around - 36, y - 70, 72, 140);
      ctx.strokeRect(u * around - 36, y - 70, 72, 140);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function paintTail(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1280;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#15803d";
    ctx.fillRect(0, 0, 1024, 1280);
    ctx.strokeStyle = "#e0b15a";
    ctx.lineWidth = 36;
    ctx.strokeRect(48, 48, 928, 1184);
    ctx.font = "900 210px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = 26;
    ctx.strokeStyle = "#06281a";
    ctx.strokeText("OWERRI", 512, 460);
    ctx.strokeText("LIFE", 512, 820);
    ctx.fillStyle = "#e0b15a";
    ctx.fillText("OWERRI", 512, 460);
    ctx.fillText("LIFE", 512, 820);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** The Owerri Life airliner. Belly is at y = -radius, nose points +Z. Same mesh in the air and on the ground. */
export function buildOwerriAirliner() {
  const plane = new THREE.Group();
  const white = new THREE.MeshLambertMaterial({ color: 0xf4f7fb });
  const dark = new THREE.MeshLambertMaterial({ color: 0x334155 });
  const glass = new THREE.MeshLambertMaterial({ color: 0x0f172a });
  const skin = new THREE.MeshLambertMaterial({ map: paintFuselage(), color: 0xffffff });
  const fuse = new THREE.Mesh(new THREE.CylinderGeometry(FUSE_R, FUSE_R, FUSE_L, 48, 1, true), skin);
  fuse.rotation.x = Math.PI / 2;
  plane.add(fuse);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(FUSE_R, 3.2, 40), white);
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = 9.85;
  plane.add(nose);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(FUSE_R, 2.8, 32), white);
  tail.rotation.x = Math.PI / 2;
  tail.position.z = -9.65;
  plane.add(tail);
  const cock = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.42, 1.3), glass);
  cock.position.set(0, 0.72, 8.2);
  plane.add(cock);
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.14, 2.6), white);
    wing.position.set(side * 5.1, -0.15, 0.2);
    wing.rotation.y = side * 0.22;
    wing.rotation.z = side * -0.05;
    plane.add(wing);
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.58, 2.4, 16), dark);
    eng.rotation.x = Math.PI / 2;
    eng.position.set(side * 3.4, -0.95, 0.4);
    plane.add(eng);
  }
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.2, 2.6), new THREE.MeshLambertMaterial({ map: paintTail(), color: 0xffffff }));
  fin.position.set(0, 2.2, -7.4);
  fin.rotation.x = -0.38;
  plane.add(fin);
  const stab = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.1, 1.5), white);
  stab.position.set(0, 0.55, -8.1);
  plane.add(stab);
  return plane;
}

export const OWERRI_AIRLINER_RADIUS = FUSE_R;
