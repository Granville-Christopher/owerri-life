"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import * as THREE from "three";
import { CAR_PRICE, DORIME_AMOUNTS, FURNITURE, LOOKS, TREATMENT_FEE, npcsAt, placeActs, placeById, sprayFloor } from "@/lib/game/content";
import type { Place } from "@/lib/game/content";
import { naira } from "@/lib/game/format";
import type { LookId } from "@/lib/game/types";

export function PersonFigure({
  look,
  className = "",
}: {
  look: LookId;
  className?: string;
}) {
  const palette = LOOKS.find((item) => item.id === look) ?? LOOKS[0];
  return (
    <svg viewBox="0 0 48 86" className={className} aria-hidden>
      <ellipse cx="24" cy="14" rx="9" ry="10" fill={palette.skin} />
      <path d="M12 16c2-14 24-14 26 2-8-8-18-8-26-2z" fill={palette.hair} />
      <path d="M16 28h16l4 22H12z" fill={palette.shirt} />
      <path d="M8 32c6 2 8 10 6 16" stroke={palette.skin} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M40 32c-6 2-8 10-6 16" stroke={palette.skin} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M18 50v24" stroke="#1c1916" strokeWidth="4" strokeLinecap="round" />
      <path d="M30 50v24" stroke="#1c1916" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function TableSet({ style, seats }: { style: CSSProperties; seats: [LookId, LookId] }) {
  return (
    <div className="absolute" style={style}>
      <div className="ol-table">
        <span className="ol-glass" />
      </div>
      <div className="ol-patron absolute" style={{ left: -4, top: 18 }}>
        <Human look={seats[0]} className="h-7 w-3.5" />
      </div>
      <div className="ol-patron absolute" style={{ left: 34, top: 16 }}>
        <Human look={seats[1]} className="h-7 w-3.5" />
      </div>
    </div>
  );
}

function DorimeBottle({ kind }: { kind: "champagne" | "cognac" }) {
  const glass = kind === "champagne" ? "#1c4d34" : "#6a2a12";
  const glassDark = kind === "champagne" ? "#0e2e1e" : "#3d140c";
  const foil = kind === "champagne" ? "#e7c56a" : "#c9a15b";
  return (
    <svg viewBox="0 0 36 78" className="ol-bottle" aria-hidden>
      <path d="M14 1h8l1.2 7H12.8z" fill={foil} />
      <path d="M13 7h10v2.4H13z" fill="#8d6420" />
      <path d="M14.2 9.2h7.6l.6 2.2h-8.8z" fill={foil} />
      <path d="M15.4 11c.2 5 .4 8 1.2 11h2.8c.8-3 1-6 1.2-11" fill={glass} />
      <path d="M14 22c-8 4-9 10-8 18l1.2 24c.4 5 3 8 8 8h5.6c5 0 7.6-3 8-8l1.2-24c1-8 0-14-8-18z" fill={glass} />
      <path d="M14 22c-8 4-9 10-8 18l.4 8h2.2C8.2 38 9 30 14.6 26z" fill={glassDark} opacity="0.55" />
      <path d="M18.2 26c-1.2 4-1.6 12-1 28" stroke="rgba(255,255,255,.55)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <rect x="11.5" y="38" width="13" height="16" rx="1.2" fill="#f7f1e4" />
      <rect x="13.2" y="41" width="9.6" height="2" rx="0.4" fill={kind === "champagne" ? "#1c4d34" : "#8a1e1e"} />
      <path d="M15 46.2h6" stroke="#1a1a1a" strokeWidth="0.7" />
      <path d="M15.6 48.4h4.8" stroke="#1a1a1a" strokeWidth="0.7" />
      <ellipse cx="18" cy="71.2" rx="7.2" ry="1.6" fill="rgba(0,0,0,.28)" />
    </svg>
  );
}

function Human({ look, className = "h-8 w-4" }: { look: LookId; className?: string }) {
  const palette = LOOKS.find((item) => item.id === look) ?? LOOKS[0];
  return (
    <svg viewBox="0 0 24 52" className={className} aria-hidden>
      <path d="M4 9c1-8 15-8 16 1-5-5-11-5-16-1z" fill={palette.hair} />
      <ellipse cx="12" cy="11" rx="5.2" ry="6" fill={palette.skin} />
      <circle cx="10" cy="10.5" r="0.55" fill="#241810" />
      <circle cx="14" cy="10.5" r="0.55" fill="#241810" />
      <path d="M10 13.4c1.1.7 2.9.7 4 0" stroke="#8d5a48" strokeWidth="0.45" fill="none" />
      <rect x="10.4" y="16" width="3.2" height="2.2" rx="1" fill={palette.skin} />
      <path d="M6.5 19h11l1.6 13h-14.2z" fill={palette.shirt} />
      <path d="M6 21c-3 1.2-3.6 7-2.2 11" stroke={palette.skin} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M18 21c3 1.2 3.6 7 2.2 11" stroke={palette.skin} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M9 32v15" stroke="#221910" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M15 32v15" stroke="#221910" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

function ZoomStage({ children }: { children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const view = useRef({ zoom: 1, x: 0, y: 0 });
  const [spot, setSpot] = useState({ zoom: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ x: number; y: number; panX: number; panY: number; moved: boolean } | null>(null);
  const pinchDist = useRef<number | null>(null);
  const skipClick = useRef(false);
  const focusRef = useRef<(nextZoom: number, clientX: number, clientY: number) => void>(() => {});

  function focus(nextZoom: number, clientX: number, clientY: number) {
    const el = frame.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const { zoom, x, y } = view.current;
    const z = Math.min(4, Math.max(1, nextZoom));
    const ox = clientX - rect.left - rect.width / 2;
    const oy = clientY - rect.top - rect.height / 2;
    let nx = ox - ((ox - x) / zoom) * z;
    let ny = oy - ((oy - y) / zoom) * z;
    if (z <= 1.01) {
      nx = 0;
      ny = 0;
    } else {
      const limitX = (rect.width * (z - 1)) / 2;
      const limitY = (rect.height * (z - 1)) / 2;
      nx = Math.min(limitX, Math.max(-limitX, nx));
      ny = Math.min(limitY, Math.max(-limitY, ny));
    }
    const next = { zoom: z, x: nx, y: ny };
    view.current = next;
    setSpot(next);
  }

  useEffect(() => {
    focusRef.current = focus;
  });

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.16 : 1 / 1.16;
      focusRef.current(view.current.zoom * factor, event.clientX, event.clientY);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div ref={frame} className="absolute inset-0 touch-none">
      <div
        className="absolute inset-0"
        style={{ transform: `translate(${spot.x}px, ${spot.y}px) scale(${spot.zoom})` }}
        onPointerDown={(event) => {
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (pointers.current.size >= 2) {
            const [a, b] = [...pointers.current.values()];
            pinchDist.current = Math.max(12, Math.hypot(a.x - b.x, a.y - b.y));
            drag.current = null;
            return;
          }
          drag.current = { x: event.clientX, y: event.clientY, panX: view.current.x, panY: view.current.y, moved: false };
        }}
        onPointerMove={(event) => {
          if (!pointers.current.has(event.pointerId)) return;
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (pointers.current.size >= 2 && pinchDist.current) {
            const [a, b] = [...pointers.current.values()];
            const dist = Math.max(12, Math.hypot(a.x - b.x, a.y - b.y));
            const ratio = dist / pinchDist.current;
            pinchDist.current = dist;
            skipClick.current = true;
            focus(view.current.zoom * ratio, (a.x + b.x) / 2, (a.y + b.y) / 2);
            return;
          }
          if (!drag.current || view.current.zoom <= 1) return;
          const dx = event.clientX - drag.current.x;
          const dy = event.clientY - drag.current.y;
          if (Math.hypot(dx, dy) > 5) drag.current.moved = true;
          const el = frame.current;
          if (!el || !drag.current.moved) return;
          const rect = el.getBoundingClientRect();
          const limitX = (rect.width * (view.current.zoom - 1)) / 2;
          const limitY = (rect.height * (view.current.zoom - 1)) / 2;
          const next = {
            zoom: view.current.zoom,
            x: Math.min(limitX, Math.max(-limitX, drag.current.panX + dx)),
            y: Math.min(limitY, Math.max(-limitY, drag.current.panY + dy)),
          };
          view.current = next;
          setSpot(next);
        }}
        onPointerUp={(event) => {
          if (drag.current?.moved) skipClick.current = true;
          pointers.current.delete(event.pointerId);
          if (pointers.current.size < 2) pinchDist.current = null;
          drag.current = null;
        }}
        onPointerCancel={(event) => {
          pointers.current.delete(event.pointerId);
          pinchDist.current = null;
          drag.current = null;
        }}
        onClickCapture={(event) => {
          if (!skipClick.current) return;
          event.preventDefault();
          event.stopPropagation();
          skipClick.current = false;
        }}
      >
        {children}
      </div>
      <div className="absolute bottom-3 right-2 z-30 flex flex-col gap-1">
        <button
          type="button"
          aria-label="Zoom in"
          className="grid h-8 w-8 place-items-center rounded-full bg-[#fffaf2] text-lg font-semibold text-[#143d2c] shadow"
          onClick={() => {
            const el = frame.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            focus(view.current.zoom * 1.35, rect.left + rect.width / 2, rect.top + rect.height / 2);
          }}
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          className="grid h-8 w-8 place-items-center rounded-full bg-[#fffaf2] text-lg font-semibold text-[#143d2c] shadow"
          onClick={() => {
            const el = frame.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            focus(view.current.zoom / 1.35, rect.left + rect.width / 2, rect.top + rect.height / 2);
          }}
        >
          −
        </button>
      </div>
    </div>
  );
}

function NameTag({ name }: { name: string }) {
  return (
    <span className="pointer-events-none absolute top-full left-1/2 w-14 -translate-x-1/2 text-center text-[7px] font-semibold leading-[8px] text-white" style={{ textShadow: "0 0 3px #000" }}>
      {name}
    </span>
  );
}

function PersonPin({
  name,
  look,
  style,
  dim,
  price,
  dance,
  onClick,
}: {
  name: string;
  look: LookId;
  style: CSSProperties;
  dim?: boolean;
  price?: string;
  dance?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`pointer-events-auto absolute z-10 border-0 bg-transparent p-0 ${dim ? "opacity-50" : ""}`}
      style={style}
      onClick={onClick}
      aria-label={name}
    >
      {price ? <span className="ol-price">{price}</span> : null}
      <span className={dance ? "ol-pose-dance inline-block" : "inline-block"}>
        <Human look={look} className="h-7 w-3.5" />
      </span>
      <NameTag name={name} />
    </button>
  );
}

function spotFor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return { left: `${8 + (hash % 74)}%`, top: `${24 + ((hash >> 5) % 52)}%` };
}

function lookFrom(id: string, look: LookId | null) {
  if (look) return look;
  let hash = 0;
  for (const char of id) hash += char.charCodeAt(0);
  return LOOKS[hash % LOOKS.length].id;
}

const CLUB_TABLES = [
  { x: 22, y: 70 },
  { x: 50, y: 76 },
  { x: 78, y: 68 },
  { x: 28, y: 48 },
  { x: 70, y: 46 },
];
const TABLE_SEATS = [
  { dx: -9, dy: 8 },
  { dx: 9, dy: 8 },
  { dx: 0, dy: 12 },
  { dx: -8, dy: -2 },
];
const STANDING = [
  { x: 10, y: 36 },
  { x: 40, y: 32 },
  { x: 58, y: 30 },
  { x: 88, y: 36 },
  { x: 8, y: 58 },
  { x: 92, y: 56 },
  { x: 46, y: 58 },
  { x: 62, y: 60 },
];

function hashId(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return hash;
}

function arrangeClub(
  people: Array<{ id: string }>,
  selfId: string,
  besideId: string | null,
) {
  const seats = CLUB_TABLES.flatMap((table) =>
    TABLE_SEATS.map((seat) => ({ left: table.x + seat.dx, top: table.y + seat.dy })),
  );
  const placed = new Map<string, { left: string; top: string }>();
  let seat = 0;
  let stand = 0;
  for (const person of [...people].sort((a, b) => a.id.localeCompare(b.id))) {
    const standHere = hashId(person.id) % 4 === 0 && stand < STANDING.length;
    if (standHere) {
      const spot = STANDING[stand];
      stand += 1;
      placed.set(person.id, { left: `${spot.x}%`, top: `${spot.y}%` });
    } else if (seat < seats.length) {
      const spot = seats[seat];
      seat += 1;
      placed.set(person.id, { left: `${spot.left}%`, top: `${spot.top}%` });
    } else if (stand < STANDING.length) {
      const spot = STANDING[stand];
      stand += 1;
      placed.set(person.id, { left: `${spot.x}%`, top: `${spot.y}%` });
    } else {
      const spot = seats[placed.size % seats.length];
      placed.set(person.id, { left: `${spot.left + 2}%`, top: `${spot.top}%` });
    }
  }
  if (besideId && placed.has(besideId) && placed.has(selfId)) {
    const host = placed.get(besideId)!;
    placed.set(selfId, { left: `${parseFloat(host.left) + 7}%`, top: host.top });
  }
  return placed;
}

function clubSign(title: string, color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 280;
  const pen = canvas.getContext("2d");
  if (!pen) return new THREE.Mesh();
  pen.fillStyle = "#120c18";
  pen.fillRect(0, 0, 640, 280);
  pen.fillStyle = color;
  pen.font = "700 68px sans-serif";
  pen.textAlign = "center";
  pen.fillText(title.slice(0, 16).toUpperCase(), 320, 125);
  pen.fillStyle = "#f4efe6";
  pen.font = "600 32px sans-serif";
  pen.fillText("OPEN TILL 5", 320, 190);
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 1.9),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) }),
  );
  board.position.set(3.1, 2.15, -5.05);
  return board;
}

function ClubHall({ name }: { name: string }) {
  const host = useRef<HTMLDivElement>(null);
  const rig = useRef({ yaw: 0.4, zoom: 1 });
  const lower = name.toLowerCase();
  const neon = lower.includes("orange") ? "#ff8a2a" : lower.includes("channel") ? "#7dffb2" : "#f2c14e";

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(root.clientWidth, root.clientHeight);
    root.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#07060c");
    scene.add(new THREE.HemisphereLight(0x3a2a4a, 0x0c0a10, 0.7));
    const spot = new THREE.DirectionalLight(0xfff1d0, 0.85);
    spot.position.set(2, 12, 6);
    scene.add(spot);
    const wash = new THREE.PointLight(lower.includes("orange") ? 0xff7a2a : 0xc4558a, 8, 16);
    wash.position.set(0, 3.2, 0);
    scene.add(wash);

    const hall = new THREE.Group();
    scene.add(hall);
    const add = (mesh: THREE.Object3D) => hall.add(mesh);
    add(piece(0x241c2e, 16, 0.12, 11, 0, 0.06, 0));
    add(piece(0x16121c, 16.2, 3.2, 0.18, 0, 1.6, -5.4));
    add(piece(0x16121c, 0.18, 3.2, 11, -8, 1.6, 0));
    add(piece(0x16121c, 0.18, 3.2, 11, 8, 1.6, 0));
    add(piece(0x2a2034, 4.2, 0.04, 4.2, 0.4, 0.14, 0.2));
    add(piece(0x3a2848, 3.6, 0.02, 3.6, 0.4, 0.16, 0.2));

    add(piece(0x1a1422, 1.3, 1.05, 7.2, -6.5, 0.55, 0.2));
    add(piece(0xf4efe6, 1.15, 0.08, 7, -6.35, 1.1, 0.2));
    add(piece(0x2a1c18, 0.16, 1.6, 6.4, -7.7, 1.7, -0.4));
    for (let i = 0; i < 9; i += 1) {
      const bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.07, 0.32, 8),
        new THREE.MeshLambertMaterial({ color: [0xf2c14e, 0x1f6b45, 0xc4552a, 0xf6f1e6, 0x7a3e6d][i % 5] }),
      );
      bottle.position.set(-7.55, 2.15, -2.6 + i * 0.7);
      add(bottle);
    }
    for (let i = 0; i < 4; i += 1) {
      add(piece(0x2c241c, 0.38, 0.7, 0.38, -5.7, 0.4, -2.2 + i * 1.6));
      add(piece(0xc4552a, 0.42, 0.08, 0.42, -5.7, 0.78, -2.2 + i * 1.6));
    }

    add(piece(0x120e16, 3.2, 0.45, 1.3, 0.2, 0.35, -4.15));
    add(piece(0x2a241c, 1.1, 0.12, 0.55, -0.35, 0.62, -4.05));
    add(piece(0x2a241c, 1.1, 0.12, 0.55, 0.85, 0.62, -4.05));
    add(piece(0x101014, 0.55, 1.5, 0.45, -1.7, 0.85, -4.3));
    add(piece(0x101014, 0.55, 1.5, 0.45, 2.15, 0.85, -4.3));
    add(clubSign(name, neon));

    const chair = (x: number, z: number, turn: number) => {
      const group = new THREE.Group();
      group.add(piece(0x8c2438, 0.42, 0.1, 0.42, 0, 0.48, 0));
      group.add(piece(0x8c2438, 0.42, 0.45, 0.08, 0, 0.72, -0.18));
      group.position.set(x, 0, z);
      group.rotation.y = turn;
      add(group);
    };
    const table = (x: number, z: number) => {
      add(piece(0xe8e2d8, 1.35, 0.08, 1.35, x, 0.72, z));
      add(piece(0x3a3040, 0.12, 0.6, 0.12, x, 0.38, z));
      const candle = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe08a }));
      candle.position.set(x, 0.84, z);
      add(candle);
      add(blob(x, z, 1.7, 1.35, 0.55));
    };
    table(-2.3, -1.3);
    chair(-3.15, -1.3, Math.PI / 2);
    chair(-1.45, -1.3, -Math.PI / 2);
    chair(-2.3, -2.15, 0);
    table(3.4, -0.6);
    chair(3.4, -1.5, 0);
    chair(4.25, -0.6, -Math.PI / 2);
    chair(2.55, -0.6, Math.PI / 2);
    table(3.2, 2.4);
    chair(3.2, 1.55, Math.PI);
    chair(4.05, 2.4, -Math.PI / 2);

    const plant = (x: number, z: number) => {
      add(piece(0x3a2a22, 0.28, 0.32, 0.28, x, 0.22, z));
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 6), new THREE.MeshLambertMaterial({ color: 0x1f6b45 }));
      leaf.position.set(x, 0.7, z);
      add(leaf);
    };
    plant(-7.2, -4.4);
    plant(7.2, 3.6);
    add(piece(0xe8e2d8, 0.08, 1.5, 0.08, 5.6, 0.85, -3.4));
    add(piece(0xf4efe6, 0.35, 0.28, 0.35, 5.6, 1.7, -3.4));
    add(blob(-6.4, 0.2, 1.6, 6.2, 0.45));
    add(blob(0.2, -4.15, 3.4, 1.5, 0.4));

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
    const aim = new THREE.Vector3(8, 11, 12).normalize();
    const fit = () => {
      renderer.setSize(root.clientWidth || 1, root.clientHeight || 1);
      camera.aspect = (root.clientWidth || 1) / (root.clientHeight || 1);
      camera.updateProjectionMatrix();
    };
    fit();
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
      rig.current.zoom = Math.min(2.3, Math.max(0.7, rig.current.zoom * factor));
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    let frame = 0;
    let alive = true;
    const loop = () => {
      if (!alive) return;
      hall.rotation.y = rig.current.yaw;
      camera.position.copy(aim).multiplyScalar(20 / rig.current.zoom);
      camera.lookAt(0, 0.6, 0);
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(loop);
    };
    loop();
    const onResize = () => fit();
    window.addEventListener("resize", onResize);
    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      root.removeEventListener("wheel", onWheel);
      renderer.dispose();
      root.removeChild(renderer.domElement);
    };
  }, [name, neon, lower]);

  function turn(dir: number) {
    rig.current.yaw += dir * 0.55;
  }
  function dolly(factor: number) {
    rig.current.zoom = Math.min(2.3, Math.max(0.7, rig.current.zoom * factor));
  }

  return (
    <div className="absolute inset-0">
      <div
        ref={host}
        className="absolute inset-0 touch-none"
        onPointerDown={(event) => {
          const surface = event.currentTarget;
          surface.setPointerCapture(event.pointerId);
          surface.dataset.x = String(event.clientX);
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          const last = Number(event.currentTarget.dataset.x ?? event.clientX);
          rig.current.yaw += (event.clientX - last) * 0.008;
          event.currentTarget.dataset.x = String(event.clientX);
        }}
      />
      <div className="absolute right-3 top-24 z-30 flex flex-col gap-1">
        <button type="button" aria-label="Zoom in" onClick={() => dolly(1.18)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-semibold text-[#17241e] shadow">+</button>
        <button type="button" aria-label="Zoom out" onClick={() => dolly(1 / 1.18)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-semibold text-[#17241e] shadow">−</button>
        <button type="button" aria-label="Rotate left" onClick={() => turn(1)} className="mt-2 grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-semibold text-[#17241e] shadow">↺</button>
        <button type="button" aria-label="Rotate right" onClick={() => turn(-1)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-semibold text-[#17241e] shadow">↻</button>
      </div>
    </div>
  );
}

function ClubFloor({
  name,
  username,
  people,
  shout,
  service,
  besideId,
  selfId,
  dancing,
  onPick,
}: {
  name: string;
  username: string;
  people: Array<{ id: string; name: string; look: LookId | null }>;
  shout: string;
  service: number;
  besideId: string | null;
  selfId: string;
  dancing: boolean;
  onPick: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const listed = people.slice(0, 50);
  const spots = arrangeClub(people, selfId, besideId);
  const buyer = spots.get(people.find((person) => person.name === (shout || username))?.id ?? "") ?? spotFor(shout || username);

  return (
    <div className="relative h-full min-h-[70vh] overflow-hidden bg-[#07060c]">
      <ClubHall name={name} />
      <div className="absolute inset-x-3 top-3 z-20">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center justify-between rounded-2xl bg-[#0e1c16]/90 px-3 py-2 text-left text-sm"
        >
          <span>
            <span className="block text-[10px] uppercase tracking-[0.14em] text-[#e0b15a]">In the club</span>
            <span className="font-semibold">{people.length} {people.length === 1 ? "person" : "people"} here</span>
          </span>
          <span aria-hidden>{open ? "▴" : "▾"}</span>
        </button>
        {open ? (
          <ul className="mt-1 max-h-52 overflow-y-auto rounded-2xl bg-[#0e1c16]/95 p-1 text-sm">
            {listed.map((person) => (
              <li key={person.id}>
                <button type="button" className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-white/10" onClick={() => onPick(person.id)}>
                  <Human look={lookFrom(person.id, person.look)} className="h-6 w-3 shrink-0" />
                  <span className="truncate">{person.name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="pointer-events-none absolute left-1/2 top-16 z-10 -translate-x-1/2 text-center text-[10px] font-semibold text-white">
        <span className={`ol-tip ${service ? "ol-tip-on" : ""}`}>Make some noise for {shout}</span>
      </div>
      <div className="pointer-events-none absolute inset-0 z-10">
        {service ? (
          <>
            <div key={`${service}-a`} className="ol-carry" style={{ "--to-x": buyer.left, "--to-y": buyer.top } as CSSProperties}>
              <div className="ol-pose-dance relative">
                <Human look="ngozi" className="h-7 w-3.5" />
                <DorimeBottle kind="champagne" />
              </div>
            </div>
            <div key={`${service}-b`} className="ol-carry ol-carry-b" style={{ "--to-x": `calc(${buyer.left} + 8%)`, "--to-y": buyer.top } as CSSProperties}>
              <div className="ol-pose-dance relative">
                <Human look="zara" className="h-7 w-3.5" />
                <DorimeBottle kind="cognac" />
              </div>
            </div>
            <div key={`${service}-party`} className="ol-party" style={{ left: buyer.left, top: buyer.top }}>
              {Array.from({ length: 14 }, (_, index) => (
                <span
                  key={index}
                  className={index % 3 === 0 ? "ol-bit ol-bit-round" : "ol-bit"}
                  style={{
                    background: ["#ffe08a", "#ff4d6a", "#f6f1e8", "#7dffb2", "#7eb6ff"][index % 5],
                    ["--dx" as string]: `${(index % 2 === 0 ? -1 : 1) * (10 + (index % 5) * 12)}px`,
                    animationDelay: index < 8 ? `${index * 0.08}s` : `${7.2 + (index - 8) * 0.12}s`,
                  }}
                />
              ))}
            </div>
          </>
        ) : null}
        {people.map((person) => (
          <PersonPin
            key={person.id}
            name={person.name}
            look={lookFrom(person.id, person.look)}
            style={spots.get(person.id) ?? spotFor(person.name)}
            dance={dancing && person.id === selfId}
            onClick={() => onPick(person.id)}
          />
        ))}
      </div>
    </div>
  );
}

function Roamer({ className, look, name }: { className: string; look: LookId; name: string }) {
  return (
    <div className={className}>
      <span className="ol-stride inline-block">
        <Human look={look} className="h-16 w-8" />
      </span>
      <span className="mt-0.5 block max-w-16 truncate text-center text-[10px] font-semibold text-white" style={{ textShadow: "0 1px 2px #000" }}>{name}</span>
    </div>
  );
}

function looseSpot(index: number, self: boolean) {
  if (self) return { left: "46%", top: "46%" };
  const col = index % 3;
  const row = Math.floor(index / 3);
  return { left: `${10 + col * 28}%`, top: `${22 + row * 24}%` };
}

function RoomScene({
  look,
  kind,
  people,
  besideId,
  selfId,
  onPick,
  walkers,
}: {
  look: LookId;
  kind: Place["kind"];
  people: Array<{ id: string; name: string; look: LookId | null }>;
  besideId: string | null;
  selfId: string;
  onPick: (id: string) => void;
  walkers: Array<{ name: string; look: LookId }>;
}) {
  const scene = sceneFor(kind);
  const guests = people.filter((person) => person.id !== selfId).slice(0, 3);
  const self = people.find((person) => person.id === selfId);
  return (
    <div className={`ol-stage relative h-full min-h-[70vh] overflow-hidden ${scene.sky}`}>
      <div className="ol-world">
        {kind === "airport" ? <AirportApron /> : scene.set}
        <div className={`ol-floor ${scene.floor} ${kind === "airport" ? "!h-[58%] !bg-transparent !shadow-none" : ""}`} />
      </div>
      <Roamer className="ol-roam-1" look={walkers[0]?.look ?? "ibe"} name={walkers[0]?.name ?? "Passer"} />
      <Roamer className="ol-roam-2" look={walkers[1]?.look ?? "zara"} name={walkers[1]?.name ?? "Guest"} />
      <div className="absolute inset-0">
        {guests.map((person, index) => (
          <PersonPin
            key={person.id}
            name={person.name}
            look={lookFrom(person.id, person.look ?? look)}
            style={looseSpot(index, false)}
            onClick={() => onPick(person.id)}
          />
        ))}
        {self ? (
          <div className="ol-roam-self">
            <PersonPin
              name={self.name}
              look={lookFrom(self.id, self.look ?? look)}
              style={{ left: besideId ? "8%" : "0%", top: "0%", position: "relative" }}
              onClick={() => onPick(self.id)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AirportApron() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#9fd4ef] via-[#d7ebf6] to-[#c5d5c4]">
      <div className="absolute left-[8%] top-[18%] h-24 w-40 rounded-t-xl bg-[#f4efe4] shadow-lg">
        <p className="px-2 pt-2 text-[10px] font-semibold tracking-[0.14em] text-[#a9782a]">DEPARTURES</p>
        <p className="px-2 text-[10px] text-[#245c78]">PHC · 14:00</p>
        <p className="px-2 text-[10px] text-[#245c78]">LOS · 16:20</p>
      </div>
      <div className="absolute bottom-[18%] left-0 right-0 h-16 bg-[#4b5563]">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 border-t-4 border-dashed border-white/80" />
      </div>
      <div className="ol-taxi absolute bottom-[22%] left-[18%]">
        <Plane body="#f7fafc" tail="#1f6b45" />
      </div>
      <div className="absolute bottom-[30%] right-[8%]">
        <Plane body="#e7eef4" tail="#245c78" />
      </div>
    </div>
  );
}

function Plane({ body, tail }: { body: string; tail: string }) {
  return (
    <div className="relative h-16 w-44" aria-hidden>
      <div className="absolute left-10 top-7 h-3 w-28 rounded-full shadow" style={{ background: body }} />
      <div className="absolute left-16 top-4 h-4 w-14 -rotate-6 rounded-full" style={{ background: body }} />
      <div className="absolute left-[4.5rem] top-6 h-1.5 w-20 bg-[#d5dee6]" />
      <div className="absolute right-3 top-3 h-8 w-3 rounded-sm" style={{ background: tail }} />
      <div className="absolute bottom-2 left-14 h-3 w-1.5 bg-[#243044]" />
      <div className="absolute bottom-2 left-28 h-3 w-1.5 bg-[#243044]" />
    </div>
  );
}

function sceneFor(kind: Place["kind"]) {
  if (kind === "school") {
    return {
      sky: "bg-[radial-gradient(circle_at_50%_0%,#d7ebdd,#245c3a_70%)]",
      floor: "school",
      crowd: 6,
      set: (
        <div className="absolute left-1/2 top-3 w-48 -translate-x-1/2">
          <div className="rounded-md bg-[#1d4a30] p-2 shadow-lg ring-4 ring-[#c4a574]">
            <div className="h-1 w-2/3 bg-[#d7ebdd]/80" />
            <div className="mt-1.5 h-1 w-1/2 bg-[#d7ebdd]/50" />
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="h-2 rounded-sm bg-[#e7d3b0] shadow" />
            ))}
          </div>
        </div>
      ),
    };
  }
  if (kind === "market") {
    return {
      sky: "bg-[radial-gradient(circle_at_50%_0%,#f4e2b0,#8c6230_68%)]",
      floor: "market",
      crowd: 10,
      set: (
        <div className="absolute inset-x-3 top-3 flex justify-between">
          {[
            ["#c4552a", "Tomatoes"],
            ["#1f6b45", "Vegetables"],
            ["#a9782a", "Provisions"],
          ].map(([color, label]) => (
            <div key={label} className="w-[30%]">
              <div className="h-5 rounded-t-md" style={{ background: color }} />
              <div className="bg-[#fffaf2] px-1 py-1 text-center text-[8px] font-semibold text-[#17241e]">{label}</div>
            </div>
          ))}
        </div>
      ),
    };
  }
  if (kind === "food") {
    return {
      sky: "bg-[radial-gradient(circle_at_50%_8%,#8a5a32,#1a140e_62%)]",
      floor: "dining",
      crowd: 8,
      set: (
        <>
          <div className="absolute left-[8%] top-6 w-24">
            <div className="ol-bar" />
          </div>
          <div className="absolute left-[8%] top-[22%]">
            <TableSet style={{}} seats={["ada", "ngozi"]} />
          </div>
          <div className="absolute right-[8%] top-[18%]">
            <TableSet style={{}} seats={["emeka", "ibe"]} />
          </div>
        </>
      ),
    };
  }
  if (kind === "hotel") {
    return {
      sky: "bg-[radial-gradient(circle_at_50%_0%,#6a5344,#141018_64%)]",
      floor: "hotel",
      crowd: 4,
      set: (
        <div className="absolute left-1/2 top-4 w-44 -translate-x-1/2 text-center">
          <div className="mx-auto h-3 w-10 rounded-full bg-[#e0b15a]/80" />
          <div className="mt-2 rounded-md bg-[#3a2434] py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f4efe4]">Reception</div>
          <div className="mt-2 flex justify-between">
            <div className="h-6 w-14 rounded-t-xl bg-[#6a3d55]" />
            <div className="h-6 w-14 rounded-t-xl bg-[#6a3d55]" />
          </div>
        </div>
      ),
    };
  }
  if (kind === "airport") {
    return {
      sky: "bg-[radial-gradient(circle_at_50%_0%,#d5e8f4,#245c78_70%)]",
      floor: "airport",
      crowd: 8,
      set: (
        <div className="absolute left-1/2 top-3 w-52 -translate-x-1/2">
          <div className="rounded-md bg-[#10211a] px-2 py-1.5 text-[9px] leading-tight text-[#9fd0ea]">
            <p className="font-semibold tracking-[0.14em] text-[#e0b15a]">DEPARTURES</p>
            <p className="mt-1">PHC · 14:00</p>
            <p>LOS · 16:20</p>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="h-6 rounded-sm bg-[#f4efe4]" />
            <div className="h-6 rounded-sm bg-[#f4efe4]" />
          </div>
        </div>
      ),
    };
  }
  if (kind === "home") {
    return {
      sky: "bg-[radial-gradient(circle_at_50%_0%,#f4efe4,#6a4630_70%)]",
      floor: "home",
      crowd: 2,
      set: (
        <div className="absolute left-1/2 top-4 flex w-48 -translate-x-1/2 items-end justify-between">
          <div className="h-12 w-14 rounded-t-md bg-[#9fd0ea]/70 ring-4 ring-[#f4efe4]" />
          <div className="h-8 w-24 rounded-t-2xl bg-[#6a3d2f]" />
        </div>
      ),
    };
  }
  if (kind === "health") {
    return {
      sky: "bg-[radial-gradient(circle_at_50%_0%,#f4f8fb,#7aa0b8_70%)]",
      floor: "health",
      crowd: 4,
      set: (
        <div className="absolute inset-x-6 top-6 flex justify-between">
          <div className="h-10 w-20 rounded-md bg-[#f4efe4] shadow ring-2 ring-[#7aa0b8]" />
          <div className="h-10 w-20 rounded-md bg-[#f4efe4] shadow ring-2 ring-[#7aa0b8]" />
        </div>
      ),
    };
  }
  if (kind === "work") {
    return {
      sky: "bg-[radial-gradient(circle_at_50%_0%,#e7eef3,#5d6b78_70%)]",
      floor: "work",
      crowd: 6,
      set: (
        <div className="absolute left-1/2 top-5 w-40 -translate-x-1/2">
          <div className="h-8 rounded-md bg-[#245c78]" />
          <div className="mt-2 grid grid-cols-3 gap-1">
            <div className="h-6 rounded-sm bg-[#f4efe4]" />
            <div className="h-6 rounded-sm bg-[#f4efe4]" />
            <div className="h-6 rounded-sm bg-[#f4efe4]" />
          </div>
        </div>
      ),
    };
  }
  return {
    sky: "bg-[radial-gradient(circle_at_50%_0%,#b7d7c4,#1f4d32_68%)]",
    floor: "public",
    crowd: 8,
    set: (
      <div className="absolute inset-x-8 top-4 flex items-end justify-between">
        <div className="h-14 w-4 rounded-full bg-[#3d6b4f]" />
        <div className="h-3 w-16 rounded-full bg-[#6a4630]" />
        <div className="h-16 w-4 rounded-full bg-[#245c3a]" />
      </div>
    ),
  };
}

function PickupStreet({
  people,
  spendable,
  pending,
  onTake,
}: {
  people: Array<{ id: string; name: string; asking: number }>;
  spendable: number;
  pending: boolean;
  onTake: (npcId: string) => Promise<{ ok: boolean }>;
}) {
  const [miss, setMiss] = useState<string | null>(null);

  return (
    <div className="ol-stage relative h-80 overflow-hidden bg-[radial-gradient(circle_at_50%_10%,#3a2a28,#120c10_60%)]">
      <ZoomStage>
      <div className="ol-floor" />
      <div className="absolute inset-0">
        {people.map((person, index) => {
          const meets = spendable >= person.asking;
          return (
            <PersonPin
              key={person.id}
              name={person.name}
              look={lookFrom(person.id, null)}
              dim={!meets}
              price={naira(person.asking)}
              style={{ left: `${10 + (index % 3) * 28}%`, top: `${34 + Math.floor(index / 3) * 22}%` }}
              onClick={() => {
                if (pending) return;
                if (!meets) {
                  setMiss(`${person.name} asks ${naira(person.asking)}. Check someone whose price you can meet.`);
                  return;
                }
                setMiss(null);
                void onTake(person.id);
              }}
            />
          );
        })}
      </div>
      </ZoomStage>
      {miss ? <p className="absolute inset-x-3 bottom-3 rounded-2xl bg-[#fffaf2] px-3 py-2 text-xs text-[#17241e]">{miss}</p> : null}
    </div>
  );
}

function frontBoard(title: string, line: string, fill: string, ink: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 240;
  const pen = canvas.getContext("2d");
  const map = new THREE.CanvasTexture(canvas);
  if (!pen) return map;
  pen.fillStyle = fill;
  pen.fillRect(0, 0, 640, 240);
  pen.fillStyle = ink;
  pen.textAlign = "center";
  const label = title.toUpperCase();
  let size = 58;
  pen.font = `700 ${size}px sans-serif`;
  while (pen.measureText(label).width > 580 && size > 24) {
    size -= 2;
    pen.font = `700 ${size}px sans-serif`;
  }
  pen.fillText(label, 320, 110);
  pen.font = "600 30px sans-serif";
  pen.fillText(line, 320, 175);
  map.needsUpdate = true;
  return map;
}

function parkedCar(color: number, x: number, z: number, rot = Math.PI) {
  const car = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.48, 0.95), new THREE.MeshLambertMaterial({ color }));
  body.position.y = 0.48;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.38, 0.78), new THREE.MeshLambertMaterial({ color: 0xd7e7f5 }));
  cabin.position.set(-0.05, 0.86, 0);
  car.add(body, cabin);
  car.position.set(x, 0, z);
  car.rotation.y = rot;
  return car;
}

function BuildingFront({ placeId, look }: { placeId: string; look: LookId }) {
  const host = useRef<HTMLDivElement>(null);
  const rig = useRef({ yaw: 0.42, zoom: 1 });
  const place = placeById(placeId);
  const night = place.kind === "nightlife" || place.kind === "pickup";

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(root.clientWidth, root.clientHeight);
    root.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(night ? "#10141c" : "#c5dff0");
    scene.add(new THREE.HemisphereLight(night ? 0x33405c : 0xfff6e4, night ? 0x12100e : 0x7d8f68, night ? 0.55 : 1.05));
    const sun = new THREE.DirectionalLight(night ? 0xc9d4ea : 0xfff3dd, night ? 0.45 : 1.2);
    sun.position.set(10, 18, 12);
    scene.add(sun);

    const yard = new THREE.Group();
    scene.add(yard);
    const add = (mesh: THREE.Object3D) => {
      yard.add(mesh);
      return mesh;
    };
    const sign = (title: string, line: string, x: number, y: number, z: number, w: number, h: number, fill: string, ink: string) => {
      const board = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: frontBoard(title, line, fill, ink) }));
      board.position.set(x, y, z);
      add(board);
    };
    const tree = (x: number, z: number) => {
      add(piece(0x6a4630, 0.32, 2.1, 0.32, x, 1.05, z));
      const crown = new THREE.Mesh(new THREE.SphereGeometry(1.05, 8, 6), new THREE.MeshLambertMaterial({ color: 0x2f7a3e }));
      crown.position.set(x, 2.5, z);
      add(crown);
    };
    const me = citizen(look);
    me.rotation.y = Math.PI;

    if (place.id === "car-stand") {
      add(piece(0xd7d3cc, 28, 0.12, 20, 0, 0.06, 0));
      add(piece(0xf7f1e6, 8, 3.2, 4, 0, 1.7, -6));
      add(piece(0x1f6b45, 8.4, 0.24, 4.4, 0, 3.4, -6));
      sign(place.name, "CARS", 0, 2.6, -3.9, 4.4, 1.2, "#143d2c", "#f6f1e6");
      const paints = [0x111111, 0xf7fbfc, 0xc4552a, 0x245c78, 0xf2c14e, 0x1f6b45, 0x8c2438, 0xe7eef2];
      paints.forEach((color, index) => {
        const col = index % 4;
        const row = Math.floor(index / 4);
        add(parkedCar(color, -6 + col * 4, -1 + row * 3.2, row % 2 === 0 ? 0 : Math.PI));
      });
      me.position.set(0.4, 0, 4.2);
    } else if (place.kind === "school") {
      add(piece(0xc5d6a4, 32, 0.12, 26, 0, 0.06, -1));
      add(piece(0x3a3f46, 32, 0.08, 5, 0, 0.1, 10));
      add(piece(0xe7dcc8, 32, 0.08, 2.4, 0, 0.16, 6.6));
      add(piece(0xe7dcc8, 28, 1.5, 0.35, 0, 0.85, -10));
      add(piece(0xe7dcc8, 0.35, 1.5, 18, -14, 0.85, -1));
      add(piece(0xe7dcc8, 0.35, 1.5, 18, 14, 0.85, -1));
      add(piece(0xe0b15a, 0.5, 3.1, 0.5, -1.8, 1.6, 5.4));
      add(piece(0xe0b15a, 0.5, 3.1, 0.5, 1.8, 1.6, 5.4));
      add(piece(0xd9c7a2, 2.4, 0.06, 12, 0, 0.18, 0));
      const hall = (x: number, z: number, w: number, h: number, d: number, wall: number, roof: number) => {
        add(piece(wall, w, h, d, x, h / 2, z));
        add(piece(roof, w + 0.35, 0.22, d + 0.35, x, h + 0.12, z));
        add(piece(0x8ec4de, w * 0.62, h * 0.28, 0.08, x, h * 0.62, z + d / 2 + 0.05));
      };
      hall(-8, -3.2, 5.4, 4.4, 3.4, 0xf7f1e6, 0xc4552a);
      hall(8, -3.2, 5.4, 4.4, 3.4, 0xf7f1e6, 0x1f6b45);
      hall(0, -4.4, 7.2, 6.2, 4.2, 0xf4efe4, 0xe0b15a);
      add(piece(0x1a140c, 1.4, 2.4, 0.1, 0, 1.25, -2.2));
      sign(place.name, "CAMPUS", 0, 5.1, -2.25, 4.6, 1.5, "#143d2c", "#f6f1e6");
      tree(-11, 1.5);
      tree(11, 1.5);
      tree(-11, -7);
      tree(11, -7);
      add(parkedCar(0x245c78, -6, 9.2));
      add(parkedCar(0xf2c14e, 6, 9.2));
      me.position.set(0.7, 0, 3.2);
    } else if (place.kind === "hotel") {
      const tall = place.id === "budget-lodge" ? 8 : place.id === "concord-hotel" || place.id === "rockview-hotel" ? 16 : 12;
      add(piece(0xd5d3c8, 28, 0.12, 24, 0, 0.06, 0));
      add(piece(0x3a3f46, 28, 0.08, 5, 0, 0.1, 9.2));
      add(piece(0xf7f4ee, 9, tall, 7, 0, tall / 2, -2));
      add(piece(0xe0b15a, 9.4, 0.35, 7.4, 0, tall + 0.15, -2));
      add(piece(0x7eb6e8, 7.2, tall * 0.72, 0.1, 0, tall * 0.48, 1.55));
      add(piece(0xe0b15a, 6.4, 0.18, 3.2, 0, 2.7, 3.2));
      add(piece(0xe0b15a, 0.16, 2.6, 0.16, -3, 1.35, 3.2));
      add(piece(0xe0b15a, 0.16, 2.6, 0.16, 3, 1.35, 3.2));
      add(piece(0x1a140c, 1.6, 2.5, 0.1, 0, 1.3, 1.58));
      sign(place.name, "HOTEL", 0, 4.3, 1.62, 5.2, 1.4, "#143d2c", "#f6f1e6");
      add(piece(0x3d6b4f, 1.1, 0.7, 1.1, -5.2, 0.4, 2));
      add(piece(0x3d6b4f, 1.1, 0.7, 1.1, 5.2, 0.4, 2));
      add(parkedCar(0x17241e, -7, 8.4));
      add(parkedCar(0xf7fbfc, -4.2, 8.4));
      add(parkedCar(0x245c78, 6.5, 8.4));
      me.position.set(0.8, 0, 4.4);
    } else if (place.kind === "nightlife") {
      add(piece(0x161412, 28, 0.12, 22, 0, 0.06, 0));
      add(piece(0x2c2926, 28, 0.08, 5, 0, 0.1, 8.2));
      add(piece(0x14110f, 16, 7.2, 8, 0, 3.6, -2));
      add(piece(0xc4552a, 16.5, 0.28, 8.4, 0, 7.3, -2));
      add(piece(0xe0b15a, 2.4, 3.1, 0.12, 0, 1.6, 2.08));
      add(piece(0x0c0a0e, 1.7, 2.6, 0.1, 0, 1.35, 2.16));
      const neon = place.name.toLowerCase().includes("orange") ? "#ff8a2a" : place.name.toLowerCase().includes("channel") ? "#7dffb2" : "#f2c14e";
      sign(place.name, "OPEN TILL 5", 0, 5.4, 2.08, 6.2, 1.8, "#120c18", neon);
      const glow = new THREE.PointLight(neon === "#ff8a2a" ? 0xff7a2a : 0xf2c14e, 8, 16);
      glow.position.set(0, 5, 3.2);
      add(glow);
      add(piece(0xe0b15a, 0.14, 1.15, 0.14, -1.8, 0.6, 3.6));
      add(piece(0xe0b15a, 0.14, 1.15, 0.14, 1.8, 0.6, 3.6));
      add(piece(0x8c2438, 3.4, 0.06, 0.06, 0, 1.05, 3.6));
      for (const x of [-10, 10]) {
        add(piece(0x111111, 0.14, 3.4, 0.14, x, 1.7, 5.4));
        add(piece(0xf2c14e, 0.8, 0.12, 0.4, x, 3.4, 5.4));
      }
      [0x17241e, 0xf2c14e, 0xc4552a, 0x245c78].forEach((color, index) => add(parkedCar(color, -8 + index * 4.2, 7.6)));
      me.position.set(0.7, 0, 4.6);
    } else if (place.kind === "market") {
      add(piece(0xe7d7b8, 30, 0.12, 24, 0, 0.06, -1));
      add(piece(0xc4a574, 30, 0.7, 0.28, 0, 0.45, -10));
      add(piece(0xc4a574, 0.28, 0.7, 16, -15, 0.45, -2));
      add(piece(0xc4a574, 0.28, 0.7, 16, 15, 0.45, -2));
      const canopies = [0xc4552a, 0xf2c14e, 0x1f6b45, 0x245c78];
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 5; col += 1) {
          const x = -8 + col * 4;
          const z = -6 + row * 3.2;
          add(piece(canopies[(row + col) % canopies.length], 3.2, 0.14, 2.2, x, 2.15, z));
          add(piece(0x6a4630, 0.12, 2, 0.12, x - 1.4, 1.05, z - 0.9));
          add(piece(0x6a4630, 0.12, 2, 0.12, x + 1.4, 1.05, z + 0.9));
        }
      }
      add(piece(0xf7f1e6, 8, 4.6, 4, 0, 2.3, -8.2));
      add(piece(0xc4552a, 8.4, 0.28, 4.4, 0, 4.75, -8.2));
      sign(place.name, "MARKET", 0, 3.6, -6.1, 4.4, 1.2, "#143d2c", "#f6f1e6");
      [0xf2c14e, 0x17241e, 0x1f6b45, 0xf7f1e6].forEach((color, index) => add(parkedCar(color, -7.5 + index * 4.2, 8.6, 0)));
      me.position.set(0.4, 0, 4.2);
    } else if (place.kind === "health") {
      add(piece(0xe7eef2, 28, 0.12, 22, 0, 0.06, 0));
      add(piece(0xd5e4ea, 24, 1.3, 0.28, 0, 0.75, -8));
      add(piece(0xd5e4ea, 0.28, 1.3, 14, -12, 0.75, -1));
      add(piece(0xd5e4ea, 0.28, 1.3, 14, 12, 0.75, -1));
      add(piece(0xf7fbfc, 12, 5.2, 6, -1, 2.6, -2));
      add(piece(0xe7f0f4, 6, 3.2, 4, 7, 1.6, 1));
      add(piece(0xc4552a, 1.5, 0.22, 0.08, -1, 4.4, 1.08));
      add(piece(0xc4552a, 0.22, 1.5, 0.08, -1, 4.4, 1.08));
      add(piece(0x1a140c, 1.4, 2.3, 0.08, -1, 1.2, 1.08));
      sign(place.name, "HOSPITAL", -1, 3.3, 1.12, 4.8, 1.2, "#f7fbfc", "#c4552a");
      add(parkedCar(0xf7fbfc, 6, 6.4, 0.4));
      me.position.set(0.6, 0, 4);
    } else if (place.kind === "food") {
      add(piece(0xe7dcc8, 26, 0.12, 20, 0, 0.06, 0));
      add(piece(0xf7f1e6, 12, 5.4, 6, 0, 2.7, -2));
      add(piece(0xc4552a, 12.6, 0.3, 6.4, 0, 5.55, -2));
      add(piece(0x9fd0ea, 8, 2.4, 0.08, 0, 3.1, 1.08));
      add(piece(0xc4552a, 7, 0.12, 2.2, 0, 2.3, 2.6));
      add(piece(0x1a140c, 1.5, 2.4, 0.08, 0, 1.25, 1.08));
      sign(place.name, "OPEN", 0, 4.4, 1.12, 5, 1.3, "#143d2c", "#f6f1e6");
      add(piece(0xe8e2d8, 1.2, 0.08, 1.2, -3.2, 0.85, 3.4));
      add(piece(0x6a4630, 0.1, 0.7, 0.1, -3.2, 0.45, 3.4));
      [0x17241e, 0xf2c14e, 0x245c78].forEach((color, index) => add(parkedCar(color, -6 + index * 4, 7.4)));
      me.position.set(1.2, 0, 4.2);
    } else if (place.kind === "airport") {
      add(piece(0xd5d8dc, 34, 0.12, 24, 0, 0.06, 0));
      add(piece(0x3a3f46, 6, 0.1, 18, 8, 0.12, 2));
      add(piece(0xf7f1e6, 14, 4.2, 5, -6, 2.1, -4));
      add(piece(0xe7e2d6, 8, 1.1, 3, -6, 0.6, -0.6));
      add(piece(0x245c78, 1.4, 8, 1.4, 2, 4, -4));
      add(piece(0x9fd0ea, 2, 1.2, 2, 2, 8.6, -4));
      sign(place.name, "TERMINAL", -6, 3.6, -1.4, 6, 1.4, "#245c78", "#f7fbfc");
      const plane = new THREE.Group();
      const skin = new THREE.MeshLambertMaterial({ color: 0xf7fbfc });
      const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 7, 10), skin);
      fuse.rotation.z = Math.PI / 2;
      fuse.position.y = 1.1;
      const wing = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 8), new THREE.MeshLambertMaterial({ color: 0xd5dee8 }));
      wing.position.set(0.2, 1, 0);
      plane.add(fuse, wing);
      plane.position.set(8, 0, 2);
      plane.rotation.y = Math.PI / 2;
      add(plane);
      me.position.set(-2, 0, 4);
    } else if (place.kind === "home") {
      add(piece(0xc8d7b0, 24, 0.12, 20, 0, 0.06, 0));
      add(piece(0xe7dcc8, 16, 1.6, 0.3, 0, 0.9, -6));
      add(piece(0xe7dcc8, 0.3, 1.6, 12, -8, 0.9, 0));
      add(piece(0xe7dcc8, 0.3, 1.6, 12, 8, 0.9, 0));
      add(piece(0xe0b15a, 0.4, 2.4, 0.4, -1.4, 1.3, 5.2));
      add(piece(0xe0b15a, 0.4, 2.4, 0.4, 1.4, 1.3, 5.2));
      add(piece(0xf7f1e6, 7, 3.4, 5, 0, 1.7, -1.5));
      add(piece(0x3d6b4f, 7.6, 0.28, 5.6, 0, 3.55, -1.5));
      add(piece(0x6a4630, 1.2, 2.1, 0.1, 0, 1.1, 1.05));
      sign(place.name, "COMPOUND", 0, 2.8, 1.08, 4.2, 1.1, "#143d2c", "#f6f1e6");
      tree(-5.5, 2);
      tree(5.5, -3);
      me.position.set(0.5, 0, 3.6);
    } else if (night) {
      add(piece(0x1c1a18, 30, 0.12, 18, 0, 0.06, 0));
      add(piece(0x2a2622, 30, 0.08, 6, 0, 0.1, 4));
      for (let i = 0; i < 4; i += 1) {
        const x = -9 + i * 6;
        add(piece(0x2a221c, 4.4, 3.6, 3, x, 1.8, -3));
        add(piece(i % 2 ? 0xc4552a : 0xf2c14e, 4.2, 0.16, 1.2, x, 2.5, -1.3));
      }
      sign(place.name, "STREET", 0, 3.4, -1.4, 5, 1.2, "#120c18", "#f2c14e");
      for (const x of [-12, 12]) {
        add(piece(0x111111, 0.14, 3.6, 0.14, x, 1.8, 2));
        add(piece(0xf2c14e, 0.7, 0.1, 0.35, x, 3.6, 2));
      }
      me.position.set(0.4, 0, 2.4);
    } else {
      add(piece(0xe7e2d6, 28, 0.12, 22, 0, 0.06, 0));
      add(piece(0xf7f1e6, 14, 6, 6, 0, 3, -2));
      add(piece(0xe0b15a, 14.4, 0.3, 6.4, 0, 6.2, -2));
      for (const x of [-4, 0, 4]) add(piece(0xe7dcc8, 0.45, 4.2, 0.45, x, 2.1, 1.2));
      add(piece(0xd9c7a2, 8, 0.35, 3, 0, 0.25, 2.4));
      sign(place.name, place.area.toUpperCase(), 0, 5, 1.15, 5.4, 1.3, "#143d2c", "#f6f1e6");
      tree(-9, 1);
      tree(9, 1);
      me.position.set(1.4, 0, 4);
    }
    add(me);
    add(blob(me.position.x, me.position.z, 0.7, 0.45, night ? 0.55 : 0.35));

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 140);
    const aim = new THREE.Vector3(14, 10, 22).normalize();
    const fit = () => {
      renderer.setSize(root.clientWidth || 1, root.clientHeight || 1);
      camera.aspect = (root.clientWidth || 1) / (root.clientHeight || 1);
      camera.updateProjectionMatrix();
    };
    fit();
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
      rig.current.zoom = Math.min(2.1, Math.max(0.65, rig.current.zoom * factor));
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    let frame = 0;
    let alive = true;
    const loop = () => {
      if (!alive) return;
      yard.rotation.y = rig.current.yaw;
      camera.position.copy(aim).multiplyScalar(34 / rig.current.zoom);
      camera.lookAt(0, 2.6, -1);
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(loop);
    };
    loop();
    const onResize = () => fit();
    window.addEventListener("resize", onResize);
    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      root.removeEventListener("wheel", onWheel);
      renderer.dispose();
      root.removeChild(renderer.domElement);
    };
  }, [placeId, look, night, place.kind, place.id, place.name, place.area]);

  function turn(dir: number) {
    rig.current.yaw += dir * 0.55;
  }
  function dolly(factor: number) {
    rig.current.zoom = Math.min(2.1, Math.max(0.65, rig.current.zoom * factor));
  }

  return (
    <div className="absolute inset-0">
      <div
        ref={host}
        className="absolute inset-0 touch-none"
        onPointerDown={(event) => {
          const surface = event.currentTarget;
          surface.setPointerCapture(event.pointerId);
          surface.dataset.x = String(event.clientX);
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          const last = Number(event.currentTarget.dataset.x ?? event.clientX);
          rig.current.yaw += (event.clientX - last) * 0.008;
          event.currentTarget.dataset.x = String(event.clientX);
        }}
      />
      <div className="absolute right-3 top-16 z-30 flex flex-col gap-1">
        <button type="button" aria-label="Zoom in" onClick={() => dolly(1.18)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-semibold text-[#17241e] shadow">+</button>
        <button type="button" aria-label="Zoom out" onClick={() => dolly(1 / 1.18)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-semibold text-[#17241e] shadow">−</button>
        <button type="button" aria-label="Rotate left" onClick={() => turn(1)} className="mt-2 grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-semibold text-[#17241e] shadow">↺</button>
        <button type="button" aria-label="Rotate right" onClick={() => turn(-1)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-semibold text-[#17241e] shadow">↻</button>
      </div>
    </div>
  );
}

export function ArrivalScene({
  placeId,
  look,
  pending,
  onEnter,
  onLeave,
}: {
  placeId: string;
  look: LookId;
  pending: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const place = placeById(placeId);
  return (
    <section className="relative h-full overflow-hidden">
      <BuildingFront placeId={placeId} look={look} />
      <div className="pointer-events-none absolute left-3 top-16 z-20 max-w-[14rem] rounded-2xl bg-[#0e1c16]/80 px-3 py-2 text-[#f6f1e6]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e0b15a]">Outside</p>
        <p className="truncate font-semibold">{place.name}</p>
      </div>
      <div className="absolute inset-x-3 bottom-24 z-30 flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={onEnter}
          className="flex-1 rounded-full bg-[#e0b15a] py-3 text-sm font-semibold text-[#1a140c] disabled:opacity-40"
        >
          Go inside
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onLeave}
          className="flex-1 rounded-full bg-[#0e1c16]/80 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          Leave
        </button>
      </div>
    </section>
  );
}

function HotelSuite({ look, pose, onLieDone }: { look: LookId; pose: "stand" | "sit" | "lie"; onLieDone?: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const rig = useRef({ yaw: 0.35, zoom: 1.05 });
  const done = useRef(onLieDone);
  done.current = onLieDone;

  useEffect(() => {
    if (pose !== "lie") return;
    const id = window.setTimeout(() => done.current?.(), 900);
    return () => window.clearTimeout(id);
  }, [pose]);

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(root.clientWidth, root.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    root.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#efe4d4");
    scene.add(new THREE.HemisphereLight(0xfff6ea, 0xc4a574, 0.85));
    const sun = new THREE.DirectionalLight(0xfff1d8, 1.05);
    sun.position.set(4, 8, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);
    const lamp = new THREE.PointLight(0xffe0a0, 4, 8);
    lamp.position.set(-2.6, 1.6, -1.8);
    scene.add(lamp);

    const room = new THREE.Group();
    scene.add(room);
    const add = (mesh: THREE.Object3D) => room.add(mesh);
    add(piece(0xc4a574, 9.2, 0.12, 7.2, 0, 0.06, 0));
    add(piece(0x8c3d4a, 4.2, 0.02, 2.6, 1.4, 0.14, 0.8));
    add(piece(0xf6f1e6, 9.4, 2.7, 0.16, 0, 1.4, -3.5));
    add(piece(0xf3e6d4, 0.16, 2.7, 7.2, -4.6, 1.4, 0));
    add(piece(0xf3e6d4, 0.16, 2.7, 7.2, 4.6, 1.4, 0));
    add(piece(0x9fd0ea, 1.8, 1.15, 0.06, -1.6, 1.7, -3.4));
    add(piece(0xe7d3c4, 0.18, 1.5, 0.08, -2.6, 1.55, -3.38));
    add(piece(0xe7d3c4, 0.18, 1.5, 0.08, -0.6, 1.55, -3.38));
    add(piece(0xe0b15a, 1.3, 0.9, 0.06, 2.2, 1.7, -3.4));
    add(piece(0x6a4630, 1.5, 0.08, 1.1, 2.2, 1.22, -3.36));

    add(piece(0x4a3428, 2.5, 0.9, 0.12, -1.2, 0.7, -2.85));
    add(piece(0xf7f4ee, 2.35, 0.28, 1.45, -1.2, 0.42, -2.05));
    add(piece(0xf4efe6, 2.2, 0.12, 1.15, -1.2, 0.58, -1.95));
    add(piece(0xf6f1e6, 0.55, 0.16, 0.32, -1.7, 0.7, -2.45));
    add(piece(0xf6f1e6, 0.55, 0.16, 0.32, -0.7, 0.7, -2.45));
    add(blob(-1.2, -2.1, 2.6, 1.6, 0.35));

    const stand = (x: number) => {
      add(piece(0x4a3428, 0.42, 0.48, 0.38, x, 0.32, -2.55));
      add(piece(0xf2c14e, 0.16, 0.28, 0.16, x, 0.68, -2.55));
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.18, 8), new THREE.MeshLambertMaterial({ color: 0xf6e7b8 }));
      shade.position.set(x, 0.92, -2.55);
      add(shade);
    };
    stand(-2.7);
    stand(0.35);

    add(piece(0x3d4a66, 2.1, 0.38, 0.78, 1.5, 0.4, 1.15));
    add(piece(0x2c3850, 2.1, 0.42, 0.12, 1.5, 0.72, 1.5));
    add(piece(0x2c3850, 0.12, 0.42, 0.78, 0.48, 0.55, 1.15));
    add(piece(0x2c3850, 0.12, 0.42, 0.78, 2.52, 0.55, 1.15));
    add(blob(1.5, 1.25, 2.3, 1, 0.32));
    add(piece(0x6a4630, 1.15, 0.08, 0.6, 1.5, 0.42, 0.15));
    add(piece(0x6a4630, 0.08, 0.32, 0.08, 1.1, 0.24, -0.05));
    add(piece(0x6a4630, 0.08, 0.32, 0.08, 1.9, 0.24, 0.35));

    add(piece(0x8c3d4a, 0.7, 0.36, 0.7, 2.9, 0.4, -0.4));
    add(piece(0x6d2e3a, 0.7, 0.4, 0.1, 2.9, 0.7, -0.05));
    add(piece(0x17241e, 1.35, 0.78, 0.08, 4.35, 1.15, 0.2));
    add(piece(0x1a3350, 1.15, 0.58, 0.04, 4.35, 1.18, 0.26));
    add(piece(0x4a3428, 0.7, 0.4, 0.4, 4.2, 0.28, 0.2));

    add(piece(0x5a4030, 1.15, 1.7, 0.45, -4.15, 0.95, -2.2));
    add(piece(0xc4a574, 0.9, 0.04, 0.04, -3.9, 1.15, -1.95));
    add(piece(0xf7f4ee, 0.9, 0.7, 0.5, -2.4, 0.45, 1.6));
    add(piece(0x6a4630, 0.08, 0.4, 0.08, -2.75, 0.25, 1.4));
    add(piece(0x6a4630, 0.08, 0.4, 0.08, -2.05, 0.25, 1.8));
    const plant = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 7), new THREE.MeshLambertMaterial({ color: 0x1f6b45 }));
    plant.position.set(3.6, 0.7, -2.6);
    add(piece(0x6a4630, 0.28, 0.35, 0.28, 3.6, 0.22, -2.6));
    add(plant);

    const guest = citizen(look);
    if (pose === "lie") {
      guest.rotation.z = -Math.PI / 2;
      guest.position.set(-2.15, 0.62, -1.9);
    } else if (pose === "sit") {
      guest.rotation.y = Math.PI;
      guest.position.set(1.5, -0.42, 1.18);
    } else {
      guest.rotation.y = Math.PI;
      guest.position.set(0.15, 0, 1.35);
    }
    add(guest);
    add(blob(guest.position.x, guest.position.z, 0.7, 0.45, 0.4));

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
    const aim = new THREE.Vector3(8, 10, 12).normalize();
    const fit = () => {
      renderer.setSize(root.clientWidth || 1, root.clientHeight || 1);
      camera.aspect = (root.clientWidth || 1) / (root.clientHeight || 1);
      camera.updateProjectionMatrix();
    };
    fit();
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
      rig.current.zoom = Math.min(2.2, Math.max(0.7, rig.current.zoom * factor));
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    let frame = 0;
    let alive = true;
    const loop = () => {
      if (!alive) return;
      room.rotation.y = rig.current.yaw;
      camera.position.copy(aim).multiplyScalar(16 / rig.current.zoom);
      camera.lookAt(0, 0.8, 0);
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(loop);
    };
    loop();
    const onResize = () => fit();
    window.addEventListener("resize", onResize);
    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      root.removeEventListener("wheel", onWheel);
      renderer.dispose();
      root.removeChild(renderer.domElement);
    };
  }, [look, pose]);

  function turn(dir: number) {
    rig.current.yaw += dir * 0.55;
  }
  function dolly(factor: number) {
    rig.current.zoom = Math.min(2.2, Math.max(0.7, rig.current.zoom * factor));
  }

  return (
    <div className="absolute inset-0 bg-[#efe4d4]">
      <div
        ref={host}
        className="absolute inset-0 touch-none"
        onPointerDown={(event) => {
          const surface = event.currentTarget;
          surface.setPointerCapture(event.pointerId);
          surface.dataset.x = String(event.clientX);
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          const last = Number(event.currentTarget.dataset.x ?? event.clientX);
          rig.current.yaw += (event.clientX - last) * 0.008;
          event.currentTarget.dataset.x = String(event.clientX);
        }}
      />
      <div className="absolute right-3 top-24 z-30 flex flex-col gap-1">
        <button type="button" aria-label="Zoom in" onClick={() => dolly(1.18)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-semibold text-[#17241e] shadow">+</button>
        <button type="button" aria-label="Zoom out" onClick={() => dolly(1 / 1.18)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-semibold text-[#17241e] shadow">−</button>
        <button type="button" aria-label="Rotate left" onClick={() => turn(1)} className="mt-2 grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-semibold text-[#17241e] shadow">↺</button>
        <button type="button" aria-label="Rotate right" onClick={() => turn(-1)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-semibold text-[#17241e] shadow">↻</button>
      </div>
    </div>
  );
}

function ClubChat({
  lines,
  pending,
  onSend,
}: {
  lines: Array<{ id: string; fromName: string; text: string }>;
  pending: boolean;
  onSend: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const recent = lines.slice(-5);
  function send(event: FormEvent) {
    event.preventDefault();
    const next = text.trim();
    if (!next) return;
    setText("");
    onSend(next);
  }
  const bubbles = recent.map((line) => (
    <p key={line.id} className="w-fit max-w-[14rem] rounded-2xl bg-white px-2.5 py-1 text-xs text-[#17241e] shadow">
      <span className="font-semibold">{line.fromName}</span> {line.text}
    </p>
  ));
  const field = (
    <form className="flex gap-1" onSubmit={send}>
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Message the club"
        className="min-w-0 flex-1 rounded-full border border-white/50 bg-transparent px-3 py-1.5 text-sm text-white placeholder:text-white/70"
      />
      <button disabled={pending} className="rounded-full bg-white px-3 text-xs font-semibold text-[#17241e] disabled:opacity-40">Send</button>
    </form>
  );
  return (
    <>
      <div className="absolute bottom-40 left-3 z-30 hidden w-64 md:block">
        <div className="mb-1 flex max-h-36 flex-col justify-end gap-1 overflow-y-auto bg-transparent">{bubbles}</div>
        {field}
      </div>
      <div className="absolute bottom-40 left-3 z-30 flex flex-col items-start gap-1 md:hidden">
        <div className="flex flex-col gap-1">{bubbles}</div>
        {open ? <div className="w-56">{field}</div> : null}
        <button type="button" aria-label="Club chat" onClick={() => setOpen((value) => !value)} className="grid h-11 w-11 place-items-center rounded-full bg-white text-lg shadow">💬</button>
      </div>
    </>
  );
}

export function VenueInterior({
  place,
  look,
  pending,
  username,
  people,
  besideId,
  selfId,
  onPickPerson,
  onDorime,
  onDrink,
  onSpray,
  onDance,
  onFood,
  onBook,
  onOffer,
  onOutside,
  spendable,
  room,
  onSleep,
  onLeaveRoom,
  onTreat,
  sick,
  house = null,
  onBuyFurniture,
  fill = false,
  extra = null,
  onApply,
  chat = [],
  onSay,
  hasCar = false,
  onBuyCar,
}: {
  place: Place;
  look: LookId;
  pending: boolean;
  username: string;
  people: Array<{ id: string; name: string; look: LookId | null }>;
  besideId: string | null;
  selfId: string;
  onPickPerson: (id: string) => void;
  onDorime: (amount: number) => Promise<{ ok: boolean }>;
  onDrink: () => void;
  onSpray: (amount: number) => Promise<{ ok: boolean }>;
  onDance: () => Promise<{ ok: boolean }>;
  onFood: () => void;
  onBook: (stay: "night" | "hour") => void;
  onOffer: (npcId: string) => Promise<{ ok: boolean }>;
  onOutside: () => void;
  spendable: number;
  room: "hour" | "night" | null;
  onSleep: () => void;
  onLeaveRoom: () => void;
  onTreat: () => void;
  sick: "none" | "mild" | "severe";
  house?: { name: string; owned: string[] } | null;
  onBuyFurniture?: (itemId: string) => void;
  fill?: boolean;
  extra?: ReactNode;
  onApply?: () => void;
  chat?: Array<{ id: string; fromName: string; text: string }>;
  onSay?: (text: string) => void;
  hasCar?: boolean;
  onBuyCar?: () => void;
}) {
  const acts = placeActs(place);
  const [notes, setNotes] = useState<Array<{ id: number; count: number }>>([]);
  const [sprayText, setSprayText] = useState("");
  const [dark, setDark] = useState(false);
  const [shout, setShout] = useState(username);
  const [service, setService] = useState(0);
  const [dancing, setDancing] = useState(false);
  const [lying, setLying] = useState(false);
  const [sitting, setSitting] = useState(false);
  const slept = useRef(false);
  const club = acts.dance;
  const inRoom = Boolean(room);
  const suite = inRoom || (place.kind === "hotel" && !club);
  const listed = npcsAt(place.id).filter((npc) => npc.asking);
  const ward = npcsAt(place.id);
  const clinician = ward.find((npc) => npc.role === "Doctor") ?? ward.find((npc) => npc.role === "Nurse" || npc.role === "Chemist");
  const clinic = place.kind === "health" || place.id === "eke-ukwu";
  const treatPrice = TREATMENT_FEE[place.id] ?? null;

  const walkers = npcsAt(place.id).slice(0, 2).map((npc, index) => ({
    name: npc.name,
    look: LOOKS[index % LOOKS.length].id,
  }));
  return (
    <section className={`relative overflow-hidden bg-[#10140f] text-[#f6f1e6] ${fill ? "h-full" : "rounded-[1.6rem]"}`}>
      {clinic && treatPrice != null && !fill ? (
        <div className="m-3 rounded-2xl bg-white p-3 text-[#17241e]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a9782a]">{place.kind === "health" ? "Doctor" : "Chemist"}</p>
          <p className="mt-1 font-semibold">{clinician?.name ?? "The ward"}</p>
          <p className="mt-1 text-sm text-[#5d6b62]">{clinician?.bio ?? "They can clear a sickness."}</p>
          <button
            type="button"
            disabled={pending || sick === "none"}
            onClick={onTreat}
            className="mt-3 w-full rounded-full bg-[#143d2c] py-3 text-sm font-semibold text-[#f6f1e6] disabled:opacity-40"
          >
            {sick === "none" ? "You are not sick" : `Get treatment · ${naira(treatPrice)}`}
          </button>
          <p className="mt-2 text-xs text-[#5d6b62]">
            {sick === "severe" ? "Severe sickness. This ward can clear it." : sick === "mild" ? "Mild sickness. This clears it." : "Come back if you feel sick."} Takes 2 hours.
          </p>
        </div>
      ) : null}
      <div className="relative h-full min-h-[70vh]">
        {suite ? (
          <HotelSuite
            look={look}
            pose={lying ? "lie" : sitting ? "sit" : "stand"}
            onLieDone={() => {
              if (slept.current) return;
              slept.current = true;
              onSleep();
            }}
          />
        ) : club ? (
          <ClubFloor name={place.name} username={username} people={people} shout={shout} service={service} besideId={besideId} selfId={selfId} dancing={dancing} onPick={onPickPerson} />
        ) : acts.pickup ? (
          <PickupStreet
            people={listed.map((npc) => ({ id: npc.id, name: npc.name, asking: npc.asking ?? 0 }))}
            spendable={spendable}
            pending={pending}
            onTake={async (npcId) => {
              const result = await onOffer(npcId);
              if (result.ok) {
                setDark(true);
                window.setTimeout(() => setDark(false), 2600);
              }
              return result;
            }}
          />
        ) : place.kind === "home" && house ? (
          <HouseRoom name={house.name} owned={house.owned} pending={pending} onBuy={onBuyFurniture ?? (() => undefined)} />
        ) : (
          <>
            <RoomScene look={look} kind={place.kind} people={people} besideId={besideId} selfId={selfId} onPick={onPickPerson} walkers={walkers} />
          </>
        )}
        {notes.map((burst) => (
          <span key={burst.id} className="pointer-events-none absolute inset-x-4 bottom-6 top-4">
            {Array.from({ length: burst.count }, (_, index) => (
              <span
                key={index}
                className="ol-cash"
                style={{
                  left: `${(index * 37) % 92}%`,
                  animationDelay: `${(index % 12) * 0.06}s`,
                  animationDuration: `${1.8 + (index % 5) * 0.28}s`,
                }}
                onAnimationEnd={index === burst.count - 1 ? () => setNotes((current) => current.filter((item) => item.id !== burst.id)) : undefined}
              />
            ))}
          </span>
        ))}
      </div>
      <div className={`grid gap-1 ${fill ? `absolute bottom-24 left-1/2 z-30 max-h-[28%] -translate-x-1/2 overflow-y-auto rounded-2xl bg-white/95 text-[#17241e] shadow-2xl ${club || suite ? "w-[min(16rem,calc(100%-5rem))] p-2" : "w-[min(28rem,calc(100%-1.5rem))] gap-2 p-3"}` : "p-3"}`}>
        {!inRoom && club ? (
          <div className="grid grid-cols-4 gap-1">
            {DORIME_AMOUNTS.map((amount) => (
              <button
                key={amount}
                disabled={pending}
                onClick={async () => {
                  const result = await onDorime(amount);
                  if (!result.ok) return;
                  setShout(username);
                  setService(Date.now());
                }}
                className="rounded-full bg-[#e0b15a] px-1 py-1 text-[10px] font-semibold leading-tight text-[#1a140c] disabled:opacity-40"
              >
                {naira(amount)}
              </button>
            ))}
          </div>
        ) : !inRoom && acts.drink ? (
          <button disabled={pending} onClick={onDrink} className="rounded-full bg-[#e0b15a] py-2 text-sm font-semibold text-[#1a140c] disabled:opacity-40">
            Buy a drink · {naira(acts.drink)}
          </button>
        ) : null}
        {!inRoom && acts.plate ? (
          <button disabled={pending} onClick={onFood} className="rounded-full bg-[#f4efe4] py-2 text-sm font-semibold text-[#17241e] disabled:opacity-40">
            {acts.plate.name} · {naira(acts.plate.cost)}
          </button>
        ) : null}
        {!inRoom && acts.dance ? (
          <button
            disabled={pending}
            onClick={async () => {
              const result = await onDance();
              if (result.ok) setDancing(true);
            }}
            className="rounded-full border border-[#e4d8c4] py-1 text-xs font-semibold disabled:opacity-40"
          >
            {dancing ? "Still dancing" : "Dance"}
          </button>
        ) : null}
        {!inRoom && acts.spray ? (
          <form
            className="grid grid-cols-[1fr_auto] gap-1"
            onSubmit={async (event) => {
              event.preventDefault();
              const amount = Math.round(Number(sprayText.replace(/[^\d]/g, "")));
              const result = await onSpray(amount);
              if (!result.ok) return;
              const id = Date.now();
              const count = Math.min(72, Math.max(8, Math.round(Math.sqrt(amount / 1000) * 4)));
              setNotes((current) => [...current, { id, count }]);
              window.setTimeout(() => setNotes((current) => current.filter((item) => item.id !== id)), 3200 + count * 40);
            }}
          >
            <input
              inputMode="numeric"
              value={sprayText}
              onChange={(event) => setSprayText(event.target.value.replace(/[^\d]/g, ""))}
              placeholder={`From ${naira(sprayFloor(place.id))}`}
              className="min-w-0 rounded-full border border-[#e4d8c4] bg-white px-2 py-1 text-xs text-[#17241e] placeholder:text-[#8a8175]"
            />
            <button disabled={pending} className="rounded-full border border-[#e0b15a]/50 px-2 text-[10px] font-semibold text-[#e0b15a] disabled:opacity-40">
              Spray
            </button>
          </form>
        ) : null}
        {suite ? (
          <div className="grid gap-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                disabled={pending || lying}
                onClick={() => setSitting((value) => !value)}
                className="rounded-full border border-[#e4d8c4] py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                {sitting && !lying ? "Stand" : "Sit"}
              </button>
              <button
                type="button"
                disabled={pending || lying || !inRoom}
                onClick={() => {
                  setSitting(false);
                  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                    if (slept.current) return;
                    slept.current = true;
                    onSleep();
                    return;
                  }
                  setLying(true);
                }}
                className="rounded-full bg-[#e0b15a] py-1.5 text-xs font-semibold text-[#1a140c] disabled:opacity-40"
              >
                {lying ? "Sleeping" : "Sleep"}
              </button>
            </div>
            {!inRoom && acts.hotel ? (
              <div className="grid grid-cols-2 gap-1">
                <button disabled={pending} onClick={() => onBook("hour")} className="rounded-full border border-[#e4d8c4] py-1 text-[10px] font-semibold disabled:opacity-40">
                  Hour · {naira(acts.hotel.hour)}
                </button>
                <button disabled={pending} onClick={() => onBook("night")} className="rounded-full border border-[#e4d8c4] py-1 text-[10px] font-semibold disabled:opacity-40">
                  Night · {naira(acts.hotel.night)}
                </button>
              </div>
            ) : null}
            {inRoom ? (
              <button type="button" disabled={pending} onClick={onLeaveRoom} className="text-[10px] text-[#5d6b62]">
                Leave the room
              </button>
            ) : null}
          </div>
        ) : acts.hotel ? (
          <div className="grid grid-cols-2 gap-2">
            <button disabled={pending} onClick={() => onBook("hour")} className="rounded-full border border-[#e4d8c4] py-2 text-xs font-semibold disabled:opacity-40">
              Hour · {naira(acts.hotel.hour)}
            </button>
            <button disabled={pending} onClick={() => onBook("night")} className="rounded-full border border-[#e4d8c4] py-2 text-xs font-semibold disabled:opacity-40">
              Night · {naira(acts.hotel.night)}
            </button>
          </div>
        ) : null}
        {acts.pickup ? <p className="text-xs text-[#d5e4d8]">Tap her. You pay the price on her head, the scene fades to black, and that naira is added to her. Then message her, or open her profile.</p> : null}
        {fill && clinic && treatPrice != null ? (
          <button type="button" disabled={pending || sick === "none"} onClick={onTreat} className="rounded-full bg-[#143d2c] py-2 text-sm font-semibold text-white disabled:opacity-40">
            {sick === "none" ? "You are not sick" : `Get treatment · ${naira(treatPrice)}`}
          </button>
        ) : null}
        {place.id === "car-stand" ? (
          <button type="button" disabled={pending || hasCar || !onBuyCar} onClick={onBuyCar} className="rounded-full bg-[#143d2c] py-2 text-xs font-semibold text-white disabled:opacity-40">
            {hasCar ? "You have a car" : `Buy a car · ${naira(CAR_PRICE)}`}
          </button>
        ) : null}
        {extra}
        {onApply ? (
          <button type="button" disabled={pending} onClick={onApply} className="rounded-full bg-[#143d2c] py-2 text-sm font-semibold text-white disabled:opacity-40">
            Apply for admission
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setDancing(false);
            onOutside();
          }}
          className={`text-xs ${fill ? "text-[#5d6b62]" : "text-[#d5e4d8]"}`}
        >
          Step outside
        </button>
      </div>
      {dark ? (
        <div className="ol-fade absolute inset-0 grid place-items-center bg-black text-center">
          <p className="font-display text-3xl">Two hours later…</p>
        </div>
      ) : null}
      {club && onSay ? <ClubChat lines={chat} pending={pending} onSend={onSay} /> : null}
    </section>
  );
}

function piece(color: number, w: number, h: number, d: number, x: number, y: number, z: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function blob(x: number, z: number, wide: number, deep: number, dark = 0.5) {
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 28),
    new THREE.MeshBasicMaterial({ color: 0x140e0a, transparent: true, opacity: dark, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(x, 0.135, z);
  shadow.scale.set(wide, deep, 1);
  return shadow;
}

function citizen(lookId: LookId) {
  const palette = LOOKS.find((item) => item.id === lookId) ?? LOOKS[0];
  const person = new THREE.Group();
  const skin = new THREE.MeshLambertMaterial({ color: palette.skin });
  const cloth = new THREE.MeshLambertMaterial({ color: palette.shirt });
  const hairM = new THREE.MeshLambertMaterial({ color: palette.hair });
  const pants = new THREE.MeshLambertMaterial({ color: 0x1c2430 });
  const shoe = new THREE.MeshLambertMaterial({ color: 0x16120f });
  const eye = new THREE.MeshBasicMaterial({ color: 0x1a1410 });
  const mouth = new THREE.MeshBasicMaterial({ color: 0x8d4d48 });
  const put = (mesh: THREE.Mesh, x: number, y: number, z: number) => {
    mesh.castShadow = true;
    mesh.position.set(x, y, z);
    person.add(mesh);
    return mesh;
  };
  const limb = (radius: number, length: number, material: THREE.Material) =>
    new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 6, 10), material);
  put(limb(0.075, 0.58, pants), -0.1, 0.46, 0);
  put(limb(0.075, 0.58, pants), 0.1, 0.46, 0);
  const leftShoe = put(limb(0.08, 0.06, shoe), -0.1, 0.1, 0.05);
  const rightShoe = put(limb(0.08, 0.06, shoe), 0.1, 0.1, 0.05);
  leftShoe.rotation.x = Math.PI / 2;
  rightShoe.rotation.x = Math.PI / 2;
  leftShoe.scale.z = 1.35;
  rightShoe.scale.z = 1.35;
  put(limb(0.16, 0.38, cloth), 0, 1.12, 0);
  const shoulders = put(limb(0.07, 0.32, cloth), 0, 1.32, 0);
  shoulders.rotation.z = Math.PI / 2;
  const leftArm = put(limb(0.05, 0.42, cloth), -0.28, 1.02, 0);
  const rightArm = put(limb(0.05, 0.42, cloth), 0.28, 1.02, 0);
  leftArm.rotation.z = 0.12;
  rightArm.rotation.z = -0.12;
  put(new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), skin), -0.3, 0.74, 0.02);
  put(new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), skin), 0.3, 0.74, 0.02);
  put(limb(0.05, 0.06, skin), 0, 1.42, 0);
  put(new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 18), skin), 0, 1.64, 0);
  const hair = put(new THREE.Mesh(new THREE.SphereGeometry(0.175, 20, 14), hairM), 0, 1.74, -0.03);
  hair.scale.set(1.04, 0.55, 0.92);
  put(new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), eye), -0.05, 1.66, 0.162);
  put(new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), eye), 0.05, 1.66, 0.162);
  const lips = put(new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 6), mouth), 0, 1.55, 0.162);
  lips.scale.set(1.5, 0.4, 0.35);
  person.position.set(0, 0.12, 0.15);
  return person;
}

function RoomView({ owned, look }: { owned: string[]; look: LookId }) {
  const host = useRef<HTMLDivElement>(null);
  const rig = useRef({ yaw: 0.55, zoom: 1.15 });
  const ownedKey = owned.join(",");

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(root.clientWidth, root.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    root.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#cfe0c2");
    scene.add(new THREE.HemisphereLight(0xfff6e8, 0x8fbf98, 0.72));
    const sun = new THREE.DirectionalLight(0xfff3dd, 1.35);
    sun.position.set(4, 12, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 32;
    sun.shadow.camera.left = -8;
    sun.shadow.camera.right = 8;
    sun.shadow.camera.top = 8;
    sun.shadow.camera.bottom = -8;
    sun.shadow.bias = -0.0012;
    scene.add(sun);
    scene.add(sun.target);

    const spin = new THREE.Group();
    scene.add(spin);
    const yard = new THREE.Mesh(new THREE.PlaneGeometry(18, 16), new THREE.MeshLambertMaterial({ color: 0xcfe0c2 }));
    yard.rotation.x = -Math.PI / 2;
    spin.add(yard);

    const wall = 0xf4efe4;
    const roof = 0x2f6b45;
    const gold = 0xe0b15a;
    const add = (mesh: THREE.Object3D) => spin.add(mesh);
    add(piece(0xc88848, 8.4, 0.12, 6.6, 0, 0.06, 0));
    add(piece(wall, 8.6, 2.35, 0.16, 0, 1.18, -3.3));
    add(piece(wall, 0.16, 2.35, 6.6, -4.2, 1.18, 0));
    add(piece(wall, 0.16, 2.35, 6.6, 4.2, 1.18, 0));
    add(piece(wall, 2.2, 0.42, 0.16, -3.1, 0.22, 3.3));
    add(piece(wall, 2.2, 0.42, 0.16, 3.1, 0.22, 3.3));
    add(piece(0x6b442c, 1.5, 1.7, 0.08, 0, 0.9, 3.22));
    add(piece(gold, 1.7, 0.1, 0.18, 0, 1.78, 3.22));
    add(piece(0x9fd0ea, 1.5, 0.85, 0.06, 2.2, 1.45, -3.2));
    add(piece(roof, 9, 0.16, 0.5, 0, 2.4, -3.35));
    add(piece(roof, 0.5, 0.16, 7, -4.25, 2.4, 0));
    add(piece(roof, 0.5, 0.16, 7, 4.25, 2.4, 0));
    add(piece(gold, 8.6, 0.05, 0.08, 0, 2.22, -3.2));

    const has = (id: string) => ownedKey.split(",").includes(id);
    if (has("bed")) {
      add(piece(0x8c3d2f, 2.4, 0.7, 0.12, -2.1, 0.5, -2.15));
      add(piece(0xf6f1e6, 2.2, 0.28, 1.35, -2.1, 0.32, -1.45));
      add(piece(0xe7d3c4, 0.7, 0.16, 0.35, -2.5, 0.52, -1.7));
    }
    if (has("table")) {
      add(piece(0x6a4630, 1.5, 0.08, 0.9, 0.2, 0.62, 0.2));
      add(piece(0x6a4630, 0.08, 0.5, 0.08, -0.45, 0.32, -0.15));
      add(piece(0x6a4630, 0.08, 0.5, 0.08, 0.85, 0.32, -0.15));
      add(piece(0x6a4630, 0.08, 0.5, 0.08, -0.45, 0.32, 0.55));
      add(piece(0x6a4630, 0.08, 0.5, 0.08, 0.85, 0.32, 0.55));
    }
    if (has("sofa")) {
      add(piece(0x1f6b45, 2.3, 0.38, 0.85, 1.5, 0.32, 1.55));
      add(piece(0x174f34, 2.3, 0.45, 0.16, 1.5, 0.62, 1.95));
    }
    if (has("fridge")) {
      add(piece(0x3d7ea6, 0.7, 1.45, 0.7, 3.35, 0.8, -2.4));
      add(piece(0xd7e7f5, 0.5, 0.04, 0.02, 3.35, 0.85, -2.04));
    }
    if (has("television")) {
      add(piece(0x6a4630, 0.9, 0.55, 0.4, -3.35, 0.35, 1.7));
      add(piece(0x17241e, 1.15, 0.7, 0.08, -3.35, 0.95, 1.7));
      add(piece(0x9fd0ea, 0.95, 0.5, 0.02, -3.35, 0.98, 1.75));
    }
    if (has("bed")) add(blob(-2.1, -1.7, 2.5, 1.6, 0.38));
    if (has("table")) add(blob(0.2, 0.2, 1.7, 1.1, 0.34));
    if (has("sofa")) add(blob(1.5, 1.7, 2.4, 1.15, 0.38));
    if (has("fridge")) add(blob(3.35, -2.4, 0.9, 0.8, 0.4));
    if (has("television")) add(blob(-3.35, 1.7, 1.3, 0.7, 0.36));

    add(blob(0, 0.15, 0.95, 0.62, 0.62));
    spin.add(citizen(look));

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);
    const aim = new THREE.Vector3(9, 11, 12).normalize();
    const fit = () => {
      const width = root.clientWidth || 1;
      const height = root.clientHeight || 1;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    fit();
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
      rig.current.zoom = Math.min(2.3, Math.max(0.7, rig.current.zoom * factor));
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    let frame = 0;
    let alive = true;
    const loop = () => {
      if (!alive) return;
      spin.rotation.y = rig.current.yaw;
      camera.position.copy(aim).multiplyScalar(18 / rig.current.zoom);
      camera.lookAt(0, 0.85, 0);
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(loop);
    };
    loop();
    const onResize = () => fit();
    window.addEventListener("resize", onResize);
    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      root.removeEventListener("wheel", onWheel);
      renderer.dispose();
      root.removeChild(renderer.domElement);
    };
  }, [ownedKey, look]);

  function turn(dir: number) {
    rig.current.yaw += dir * 0.55;
  }
  function dolly(factor: number) {
    rig.current.zoom = Math.min(2.3, Math.max(0.7, rig.current.zoom * factor));
  }

  return (
    <div className="absolute inset-0">
      <div
        ref={host}
        className="absolute inset-0 touch-none"
        onPointerDown={(event) => {
          const surface = event.currentTarget;
          surface.setPointerCapture(event.pointerId);
          surface.dataset.x = String(event.clientX);
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          const last = Number(event.currentTarget.dataset.x ?? event.clientX);
          rig.current.yaw += (event.clientX - last) * 0.008;
          event.currentTarget.dataset.x = String(event.clientX);
        }}
      />
      <div className="absolute right-3 top-32 z-10 flex flex-col gap-1">
        <button type="button" aria-label="Zoom in" onClick={() => dolly(1.18)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-semibold shadow">+</button>
        <button type="button" aria-label="Zoom out" onClick={() => dolly(1 / 1.18)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-semibold shadow">−</button>
        <button type="button" aria-label="Rotate left" onClick={() => turn(1)} className="mt-2 grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-semibold shadow">↺</button>
        <button type="button" aria-label="Rotate right" onClick={() => turn(-1)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-semibold shadow">↻</button>
      </div>
    </div>
  );
}

export function HouseRoom({
  name,
  owned,
  pending,
  onBuy,
  look,
  entry = "look",
  shopNonce = 0,
}: {
  name: string;
  owned: string[];
  pending: boolean;
  onBuy: (itemId: string) => void;
  look?: LookId;
  entry?: "look" | "shop";
  shopNonce?: number;
}) {
  const has = (id: string) => owned.includes(id);
  const [shop, setShop] = useState(entry === "shop");
  const [group, setGroup] = useState<(typeof FURNITURE)[number]["group"]>("Sleep");
  const entrySeen = useRef(entry);
  const nonceSeen = useRef(shopNonce);
  if (entry !== entrySeen.current) {
    entrySeen.current = entry;
    setShop(entry === "shop");
  }
  if (shopNonce !== nonceSeen.current) {
    nonceSeen.current = shopNonce;
    if (shopNonce > 0) setShop(true);
  }
  const stock = FURNITURE.filter((item) => item.group === group);
  return (
    <section className="relative h-full min-h-[28rem] overflow-hidden bg-[#cfe0c2] text-[#17241e]">
      <RoomView owned={owned} look={look ?? "chidi"} />
      <p className="pointer-events-none absolute left-3 top-20 z-10 rounded-full bg-white px-3 py-2 text-xs font-semibold shadow">{name}</p>
      {owned.length === 0 ? <p className="pointer-events-none absolute left-1/2 top-20 z-10 -translate-x-1/2 rounded-full bg-white px-3 py-2 text-xs font-semibold shadow">The room is empty.</p> : null}
      <button
        type="button"
        onClick={() => setShop(true)}
        className="absolute bottom-28 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#17241e] px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
      >
        Shop
      </button>
      {shop && typeof document !== "undefined" ? createPortal(
      <div className="ol-modal ol-sheet fixed inset-x-0 bottom-0 max-h-[46%] overflow-y-auto rounded-t-[1.8rem] pb-24 text-[#17241e]" style={{ zIndex: 200 }}>
        <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-[#e0b15a]" />
        <div className="flex items-center justify-between px-4 pt-2">
          <p className="font-display text-xl leading-none">Shop · {name}</p>
          <button type="button" aria-label="Close shop" onClick={() => setShop(false)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-lg leading-none shadow-sm">×</button>
        </div>
        <div className="flex gap-2 overflow-x-auto px-4 py-2">
          {(["Sleep", "Comfort", "Kitchen", "Fun"] as const).map((item) => (
            <button key={item} type="button" onClick={() => setGroup(item)} className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${group === item ? "bg-[#17241e] text-white" : "bg-[#f4efe4]"}`}>
              {item}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 overflow-y-auto px-4 pb-4 sm:grid-cols-3">
          {stock.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={pending || has(item.id)}
              onClick={() => onBuy(item.id)}
              className="rounded-2xl bg-white p-3 text-left shadow-sm disabled:opacity-50"
            >
              <span className="block text-sm font-semibold">{item.name}</span>
              <span className="mt-1 block text-sm font-semibold text-[#1f6b45]">{has(item.id) ? "In the room" : naira(item.cost)}</span>
            </button>
          ))}
        </div>
      </div>,
      document.body,
      ) : null}
    </section>
  );
}
