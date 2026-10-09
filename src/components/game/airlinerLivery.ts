import * as THREE from "three";

const TITLE_FONT: Record<string, string[]> = {
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  W: ["10001", "10001", "10001", "10101", "10101", "01010", "01010"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
};

export function paintOwerriTitle(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#0e1c16";
    ctx.fillRect(0, 0, 2048, 512);
    ctx.fillStyle = "#143d2c";
    ctx.fillRect(28, 28, 1992, 456);
    ctx.strokeStyle = "#e0b15a";
    ctx.lineWidth = 18;
    ctx.strokeRect(48, 48, 1952, 416);
    const word = "OWERRI LIFE";
    const cellW = 34;
    const cellH = 52;
    const letterW = 5 * cellW;
    const gap = 14;
    let total = 0;
    for (const ch of word) total += ch === " " ? letterW * 0.42 : letterW + gap;
    let x = (2048 - total) / 2;
    const y = (512 - 7 * cellH) / 2;
    ctx.fillStyle = "#e0b15a";
    for (const ch of word) {
      if (ch === " ") {
        x += letterW * 0.42;
        continue;
      }
      const rows = TITLE_FONT[ch];
      for (let r = 0; r < 7; r += 1) {
        for (let c = 0; c < 5; c += 1) {
          if (rows[r][c] === "1") ctx.fillRect(x + c * cellW + 3, y + r * cellH + 3, cellW - 6, cellH - 6);
        }
      }
      x += letterW + gap;
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

export function paintCabinDoor(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#d8dee6";
    ctx.fillRect(0, 0, 256, 512);
    ctx.strokeStyle = "#1a2430";
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, 240, 496);
    ctx.strokeStyle = "#8a93a0";
    ctx.lineWidth = 6;
    ctx.strokeRect(22, 22, 212, 468);
    ctx.fillStyle = "#16344c";
    ctx.beginPath();
    ctx.ellipse(128, 148, 46, 56, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#c5ccd6";
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.fillStyle = "#143d2c";
    ctx.fillRect(40, 236, 176, 64);
    ctx.fillStyle = "#e0b15a";
    ctx.font = "bold 42px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("EXIT", 128, 268);
    ctx.fillStyle = "#c4a15a";
    ctx.fillRect(168, 340, 52, 16);
    ctx.fillStyle = "#1a2430";
    ctx.fillRect(172, 344, 44, 8);
    ctx.fillStyle = "#c4552a";
    ctx.fillRect(28, 452, 200, 18);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

type Axis = "z" | "x";

function place(mesh: THREE.Object3D, axis: Axis, along: number, y: number, out: number, yaw?: number) {
  if (axis === "z") mesh.position.set(out, y, along);
  else mesh.position.set(along, y, out);
  if (yaw != null) mesh.rotation.y = yaw;
}

/**
 * Windows, cabin doors, and OWERRI LIFE on the side of the fuselage — sitting on the skin, not floating.
 */
export function addAirlinerLivery(
  parent: THREE.Object3D,
  opts: {
    radius: number;
    height: number;
    length: number;
    axis?: Axis;
    title?: THREE.Texture;
    door?: THREE.Texture;
  },
) {
  const axis = opts.axis ?? "z";
  const R = opts.radius;
  const y0 = opts.height;
  const L = opts.length;
  const s = Math.max(0.35, R / 1.22);
  const title = opts.title ?? paintOwerriTitle();
  const doorTex = opts.door ?? paintCabinDoor();

  const phi = 0.42;
  const skin = R * 1.035;
  const winY = y0 + Math.sin(phi) * skin;
  const winOut = Math.cos(phi) * skin;
  const titlePhi = -0.22;
  const titleY = y0 + Math.sin(titlePhi) * skin;
  const titleOut = Math.cos(titlePhi) * skin;

  const glass = new THREE.MeshLambertMaterial({ color: 0x12344c, emissive: 0x5ec4f0, emissiveIntensity: 0.9 });
  const rimMat = new THREE.MeshLambertMaterial({ color: 0x1a2430 });
  const stripeMat = new THREE.MeshLambertMaterial({ color: 0x1f6b45 });
  const doorMat = new THREE.MeshBasicMaterial({ map: doorTex, side: THREE.DoubleSide });
  const frameMat = new THREE.MeshLambertMaterial({ color: 0x1a2430 });
  const titleMat = new THREE.MeshBasicMaterial({
    map: title,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const winH = 0.28 * s;
  const winW = 0.2 * s;
  const winT = 0.05 * s;
  const count = Math.max(7, Math.round(L * 0.95));
  const z0 = -L * 0.3;
  const z1 = L * 0.3;
  const frontDoor = L * 0.34;
  const rearDoor = -L * 0.32;
  const skip = (along: number) => Math.abs(along - frontDoor) < L * 0.055 || Math.abs(along - rearDoor) < L * 0.05;

  for (const side of [-1, 1]) {
    const yaw = axis === "z" ? (side > 0 ? Math.PI / 2 : -Math.PI / 2) : side > 0 ? 0 : Math.PI;
    const stripe =
      axis === "z"
        ? new THREE.Mesh(new THREE.BoxGeometry(0.04 * s, 0.1 * s, L * 0.78), stripeMat)
        : new THREE.Mesh(new THREE.BoxGeometry(L * 0.78, 0.1 * s, 0.04 * s), stripeMat);
    place(stripe, axis, 0, winY - 0.12 * s, side * (R * 1.02));
    parent.add(stripe);

    for (let i = 0; i < count; i += 1) {
      const along = z0 + (i / Math.max(1, count - 1)) * (z1 - z0);
      if (skip(along)) continue;
      const frame =
        axis === "z"
          ? new THREE.Mesh(new THREE.BoxGeometry(winT, winH * 1.28, winW * 1.28), rimMat)
          : new THREE.Mesh(new THREE.BoxGeometry(winW * 1.28, winH * 1.28, winT), rimMat);
      place(frame, axis, along, winY, side * winOut);
      const pane =
        axis === "z"
          ? new THREE.Mesh(new THREE.BoxGeometry(winT * 1.2, winH, winW), glass)
          : new THREE.Mesh(new THREE.BoxGeometry(winW, winH, winT * 1.2), glass);
      place(pane, axis, along, winY, side * (winOut + 0.012 * s));
      parent.add(frame, pane);
    }

    const doorH = 1.05 * s;
    const doorW = 0.62 * s;
    for (const along of [frontDoor, rearDoor]) {
      const frame =
        axis === "z"
          ? new THREE.Mesh(new THREE.BoxGeometry(0.05 * s, doorH + 0.1 * s, doorW + 0.1 * s), frameMat)
          : new THREE.Mesh(new THREE.BoxGeometry(doorW + 0.1 * s, doorH + 0.1 * s, 0.05 * s), frameMat);
      place(frame, axis, along, y0 + 0.08 * s, side * (R * 1.03));
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(doorW, doorH), doorMat);
      place(leaf, axis, along, y0 + 0.08 * s, side * (R * 1.06), yaw);
      parent.add(frame, leaf);
    }

    const decalW = Math.min(L * 0.72, 12 * s);
    const decalH = Math.max(0.55 * s, R * 0.72);
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(decalW, decalH), titleMat);
    place(decal, axis, L * 0.02, titleY, side * (titleOut + 0.1 * s), yaw);
    parent.add(decal);
  }

  const crown = new THREE.Mesh(
    axis === "z" ? new THREE.PlaneGeometry(decalBandH(), decalBandW()) : new THREE.PlaneGeometry(decalBandW(), decalBandH()),
    titleMat,
  );
  crown.rotation.x = -Math.PI / 2;
  if (axis === "z") crown.position.set(0, y0 + R * 1.14, L * 0.02);
  else crown.position.set(L * 0.02, y0 + R * 1.14, 0);
  parent.add(crown);

  function decalBandW() {
    return Math.min(L * 0.72, 12 * s);
  }
  function decalBandH() {
    return Math.max(0.55 * s, R * 0.72);
  }
}
