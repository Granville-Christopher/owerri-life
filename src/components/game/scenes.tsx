"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import * as THREE from "three";
import { DORIME_AMOUNTS, FURNITURE, FURNITURE_GROUPS, LOOKS, TREATMENT_FEE, clampPlacement, furnitureById, furnitureInstances, homeById, npcsAt, placeActs, placeById, placeIn, roomSize, sprayFloor } from "@/lib/game/content";
import type { FurnitureGroup, Home, Place } from "@/lib/game/content";
import { naira } from "@/lib/game/format";
import type { FurnitureSpot, LookId, Placement } from "@/lib/game/types";
import { buildFurniture } from "./furnitureModels";
import { HeroesStadiumScene } from "./HeroesStadiumScene";
import { PhoneStoreScene } from "./PhoneStoreScene";
import { SchoolClassroomScene } from "./SchoolClassroomScene";
import { OwerriMarketScene } from "./OwerriMarketScene";
import { AssumptaCathedralScene } from "./AssumptaCathedralScene";
import { CarStandScene } from "./CarStandScene";
import { AirportTerminalScene } from "./AirportTerminalScene";
import { WarehouseScene } from "./WarehouseScene";
import { attachSceneCameraControls } from "./sceneCameraControls";
import { RestaurantScene } from "./RestaurantScene";
import { createRealisticHuman } from "@/lib/game/humanModel";
import { HospitalScene } from "./HospitalScene";

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
    const detachControls = attachSceneCameraControls(root, rig, { minZoom: 0.7, maxZoom: 2.3, zoomSpeed: 0.08 });
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
      detachControls();
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

  // Materials
  const paintMat = new THREE.MeshLambertMaterial({ color });
  const darkChassisMat = new THREE.MeshLambertMaterial({ color: 0x111827 });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
  const chromeMat = new THREE.MeshLambertMaterial({ color: 0xf1f5f9 });
  const tireMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
  const rimMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const taillightMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });

  // 1. Lower Chassis & Underbody
  const underbody = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.16, 1.08), darkChassisMat);
  underbody.position.y = 0.22;
  car.add(underbody);

  // 2. Main Sculpted Body
  // Central cabin lower base
  const centerBody = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.42, 1.12), paintMat);
  centerBody.position.set(0, 0.44, 0);
  car.add(centerBody);

  // Front hood / bonnet (sloping down toward front)
  const hood = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.36, 1.08), paintMat);
  hood.position.set(0.82, 0.4, 0);
  car.add(hood);

  // Front bumper / splitter
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 1.1), paintMat);
  frontBumper.position.set(1.24, 0.32, 0);
  car.add(frontBumper);

  // Rear trunk
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.38, 1.08), paintMat);
  trunk.position.set(-0.84, 0.42, 0);
  car.add(trunk);

  // Rear bumper
  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 1.1), paintMat);
  rearBumper.position.set(-1.22, 0.33, 0);
  car.add(rearBumper);

  // 3. Cabin & Aerodynamic Glasshouse
  // Roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.06, 0.92), paintMat);
  roof.position.set(-0.06, 0.88, 0);
  car.add(roof);

  // Tinted cabin glasshouse
  const glasshouse = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.36, 0.94), glassMat);
  glasshouse.position.set(-0.06, 0.68, 0);
  car.add(glasshouse);

  // Raked front windshield
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.92), glassMat);
  windshield.position.set(0.5, 0.7, 0);
  windshield.rotation.z = -0.72;
  car.add(windshield);

  // Sloped rear window
  const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.38, 0.92), glassMat);
  rearWindow.position.set(-0.62, 0.7, 0);
  rearWindow.rotation.z = 0.7;
  car.add(rearWindow);

  // Window pillars (A pillars)
  const pillarA1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 0.04), paintMat);
  pillarA1.position.set(0.48, 0.7, 0.46);
  pillarA1.rotation.z = -0.72;
  const pillarA2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 0.04), paintMat);
  pillarA2.position.set(0.48, 0.7, -0.46);
  pillarA2.rotation.z = -0.72;
  car.add(pillarA1, pillarA2);

  // 4. Wheels with Realistic Rubber Tires & 5-Spoke Alloy Rims
  const wheelGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.16, 16);
  wheelGeom.rotateX(Math.PI / 2);
  const rimGeom = new THREE.CylinderGeometry(0.16, 0.16, 0.17, 12);
  rimGeom.rotateX(Math.PI / 2);
  const capGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.18, 8);
  capGeom.rotateX(Math.PI / 2);

  const wheelPositions: [number, number, number][] = [
    [0.72, 0.24, 0.54],
    [0.72, 0.24, -0.54],
    [-0.72, 0.24, 0.54],
    [-0.72, 0.24, -0.54],
  ];

  wheelPositions.forEach(([wx, wy, wz]) => {
    const tire = new THREE.Mesh(wheelGeom, tireMat);
    tire.position.set(wx, wy, wz);
    const rim = new THREE.Mesh(rimGeom, rimMat);
    rim.position.set(wx, wy, wz);
    const cap = new THREE.Mesh(capGeom, chromeMat);
    cap.position.set(wx, wy, wz);
    car.add(tire, rim, cap);
  });

  // 5. Front Headlights & Radiator Grille
  const hlRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.26), headlightMat);
  hlRight.position.set(1.34, 0.42, 0.38);
  const hlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.26), headlightMat);
  hlLeft.position.set(1.34, 0.42, -0.38);
  car.add(hlRight, hlLeft);

  // Radiator grille with chrome surround
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.48), darkChassisMat);
  grille.position.set(1.34, 0.34, 0);
  const emblem = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.06), chromeMat);
  emblem.position.set(1.37, 0.35, 0);
  car.add(grille, emblem);

  // 6. Rear Taillights & License Plate
  const tlRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.28), taillightMat);
  tlRight.position.set(-1.32, 0.44, 0.36);
  const tlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.28), taillightMat);
  tlLeft.position.set(-1.32, 0.44, -0.36);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.24), new THREE.MeshBasicMaterial({ color: 0x15803d }));
  plate.position.set(-1.33, 0.3, 0);
  car.add(tlRight, tlLeft, plate);

  // 7. Side Mirrors
  const mirrorR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.12), paintMat);
  mirrorR.position.set(0.38, 0.65, 0.58);
  const mirrorL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.12), paintMat);
  mirrorL.position.set(0.38, 0.65, -0.58);
  car.add(mirrorR, mirrorL);

  car.position.set(x, 0, z);
  car.rotation.y = rot;
  return car;
}


const PHONE_SHOPS = new Set(["anonymous-gadgets", "sugar-gadgets", "buc-phones", "elion-phones", "ocha-gadgets", "maxii-gadgets", "easy-life", "gadgets-plug"]);

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
    } else if (place.id === "assumpta-cathedral") {
      const church = new THREE.Group();
      const put = (mesh: THREE.Object3D) => church.add(mesh);
      put(piece(0xc5d6a4, 28, 0.12, 22, 0, 0.06, 0));
      put(piece(0xf7f1e6, 14, 6.2, 8, 0, 3.2, -1));
      put(piece(0xc4552a, 14.6, 0.3, 8.5, 0, 6.4, -1));
      const dome = new THREE.Mesh(new THREE.SphereGeometry(2.6, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xe0b15a }));
      dome.position.set(0, 6.6, -1);
      put(dome);
      put(piece(0xf2c14e, 0.2, 1.6, 0.2, 0, 9.4, -1));
      put(piece(0xf2c14e, 0.9, 0.16, 0.16, 0, 9.8, -1));
      put(piece(0xf4efe4, 2.4, 7.2, 2.4, -6.6, 3.6, -1));
      put(piece(0xf4efe4, 2.4, 7.2, 2.4, 6.6, 3.6, -1));
      put(piece(0x1f6b45, 2.8, 0.28, 2.8, -6.6, 7.3, -1));
      put(piece(0x1f6b45, 2.8, 0.28, 2.8, 6.6, 7.3, -1));
      put(piece(0x143d2c, 1.8, 2.6, 0.12, 0, 1.4, 3.1));
      put(piece(0x3d7ea6, 0.16, 2.6, 1.4, -7.1, 3.4, -1));
      put(piece(0xc4552a, 0.16, 2.6, 1.4, 7.1, 3.4, -1));
      const board = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.3), new THREE.MeshBasicMaterial({ map: frontBoard("Assumpta", "CATHEDRAL", "#143d2c", "#f6f1e6") }));
      board.position.set(0, 5.2, 3.2);
      put(board);
      church.scale.setScalar(1.8);
      add(church);
      tree(-16, 6);
      tree(16, 6);
      me.position.set(0.4, 0, 12);
    } else if (place.id === "heroes-square") {
      add(piece(0xc8d7b0, 36, 0.12, 28, 0, 0.06, 0));
      // Paved forecourt plaza
      add(piece(0xd5d3c8, 30, 0.14, 16, 0, 0.08, 4));
      // Curved / faceted stadium outer wall
      add(piece(0xe7e2d6, 26, 6.5, 12, 0, 3.25, -5));
      // Accent blue/green stadium band
      add(piece(0x1d4a66, 26.4, 0.8, 12.4, 0, 5.8, -5));
      // Grand cantilevered roof canopy visible from outside
      add(piece(0xf7fbfc, 28, 0.4, 14, 0, 7.2, -4));
      // Arched grand stadium entrance portal
      add(piece(0x1d4a66, 10, 4.8, 2, 0, 2.4, 1.2));
      add(piece(0x0c1e28, 8, 3.8, 2.2, 0, 1.9, 1.2));
      sign("IMO HEROES SQUARE", "DAN ANYIAM STADIUM COMPLEX", 0, 4.4, 2.25, 9.2, 1.4, "#0e2938", "#f2c14e");
      // Turnstiles / gates
      for (const gx of [-3, -1, 1, 3]) {
        add(piece(0xe0b15a, 0.1, 2.2, 0.1, gx, 1.1, 2.3));
      }
      // Towering floodlight pylons on left and right
      for (const lx of [-14, 14]) {
        add(piece(0x718096, 0.6, 14, 0.6, lx, 7, -8));
        add(piece(0x2d3748, 3.2, 1.6, 0.4, lx, 14.5, -8));
        for (let row = 0; row < 2; row++) {
          for (let col = 0; col < 4; col++) {
            const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfffde8 }));
            bulb.position.set(lx - 1.2 + col * 0.8, 14.2 + row * 0.6, -7.7);
            add(bulb);
          }
        }
      }
      // Flagpoles with Nigerian and Imo flags
      add(piece(0xd1d5db, 0.1, 7, 0.1, -6, 3.5, 4));
      add(piece(0x1f6b45, 1.4, 0.9, 0.04, -5.3, 6.2, 4));
      add(piece(0xd1d5db, 0.1, 7, 0.1, 6, 3.5, 4));
      add(piece(0x1d4a66, 1.4, 0.9, 0.04, 6.7, 6.2, 4));
      // Team bus / parked cars
      const bus = new THREE.Group();
      bus.add(piece(0xc42032, 4.4, 1.4, 1.6, 0, 0.8, 0));
      bus.add(piece(0x1a202c, 4.45, 0.35, 1.65, 0, 0.95, 0));
      bus.add(piece(0xd7e7f5, 4.2, 0.5, 1.5, 0, 1.15, 0));
      bus.position.set(-8, 0, 6.5);
      add(bus);
      add(parkedCar(0xf7fbfc, 7, 6.5, 0));
      add(parkedCar(0x245c78, 10.5, 6.5, 0));
      me.position.set(0, 0, 6.5);
    } else if (PHONE_SHOPS.has(place.id)) {
      add(piece(0xd7d3cc, 12, 0.1, 9, 0, 0.06, 0));
      // Modern storefront building
      add(piece(0x0f172a, 8, 3.8, 4.2, 0, 1.9, -0.6));
      add(piece(0x38bdf8, 8.2, 0.18, 4.4, 0, 3.85, -0.6));
      // Large illuminated glass display windows
      add(piece(0x93c5fd, 3.2, 2.2, 0.08, -1.8, 1.6, 1.52));
      add(piece(0x93c5fd, 3.2, 2.2, 0.08, 1.8, 1.6, 1.52));
      // Display showcases visible through windows inside
      add(piece(0x1e293b, 2.8, 0.8, 0.6, -1.8, 0.8, 1.1));
      add(piece(0x1e293b, 2.8, 0.8, 0.6, 1.8, 0.8, 1.1));
      // Mini phones & cases visible in window display
      for (let i = 0; i < 3; i++) {
        add(piece(0x38bdf8, 0.18, 0.32, 0.04, -2.4 + i * 0.6, 1.35, 1.1));
        add(piece([0xef4444, 0xfacc15, 0xa855f7][i], 0.18, 0.32, 0.04, 1.2 + i * 0.6, 1.35, 1.1));
      }
      sign(place.name, "PHONES · CASES · ACCESSORIES", 0, 3.2, 1.55, 6.4, 1.3, "#090d16", "#38bdf8");
      me.position.set(0.2, 0, 3.6);
    } else if (place.id === "everyday") {
      add(piece(0xd7d3cc, 22, 0.12, 16, 0, 0.06, 0));
      add(piece(0xf7fbfc, 16, 4.6, 7, 0, 2.4, -1));
      add(piece(0x1f6b45, 16.4, 0.9, 0.5, 0, 5.1, 2.6));
      add(piece(0x9fd0ea, 12, 2.2, 0.08, 0, 2.4, 2.55));
      add(piece(0x143d2c, 2.6, 2.6, 0.1, 0, 1.4, 2.6));
      sign("EVERYDAY", "SUPERMARKET", 0, 4.4, 2.7, 7.4, 1.4, "#1f6b45", "#f6f1e6");
      for (let i = 0; i < 4; i += 1) add(parkedCar(i % 2 === 0 ? 0xf7fbfc : 0x245c78, -6 + i * 4, 5.2, 0));
      me.position.set(0.2, 0, 2.2);
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
    } else if (place.id === "crunchies") {
      add(piece(0xe7dcc8, 20, 0.12, 16, 0, 0.06, 0));
      add(piece(0xc4552a, 12, 5.2, 7, 0, 2.7, -1));
      add(piece(0xf2c14e, 12.6, 0.35, 7.4, 0, 5.45, -1));
      add(piece(0xfff6d8, 8, 2.2, 0.08, 0, 2.5, 2.55));
      add(piece(0x1a140c, 1.6, 2.4, 0.08, 0, 1.3, 2.58));
      sign("CRUNCHIES", "FRIED CHICKEN", 0, 4.2, 2.62, 6.4, 1.3, "#17241e", "#f2c14e");
      add(piece(0xc4552a, 5, 0.12, 2.4, 0, 2.1, 4.4));
      [0x17241e, 0xf7fbfc, 0x245c78].forEach((color, index) => add(parkedCar(color, -5 + index * 4, 6.2)));
      me.position.set(0.4, 0, 3.4);
    } else if (place.id === "mbari") {
      add(piece(0xd7e0c8, 26, 0.12, 20, 0, 0.06, 0));
      add(piece(0xf7f1e6, 16, 6.2, 9, 0, 3.2, -1.4));
      add(piece(0x1f6b45, 16.6, 0.35, 9.4, 0, 6.45, -1.4));
      add(piece(0xe0b15a, 0.7, 6.6, 0.7, -6.6, 3.3, 3.2));
      add(piece(0xe0b15a, 0.7, 6.6, 0.7, 6.6, 3.3, 3.2));
      add(piece(0x8ec4de, 10, 2.4, 0.08, 0, 3.1, 3.2));
      add(piece(0x1a140c, 1.8, 2.5, 0.08, 0, 1.3, 3.22));
      sign("MBARI", "ART CENTRE", 0, 5.1, 3.24, 6.8, 1.4, "#143d2c", "#f6f1e6");
      add(piece(0xc4552a, 4, 0.1, 3, -7, 0.16, 6.4));
      add(piece(0x245c78, 4, 0.1, 3, 7, 0.16, 6.4));
      tree(-10, 2);
      tree(10, 2);
      me.position.set(0.3, 0, 5);
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
    } else if (place.id === "cartel-beach") {
      add(piece(0xe4d2a8, 26, 0.1, 18, 0, 0.05, 1));
      add(piece(0x3d8ec4, 26, 0.08, 8, 0, 0.04, -8));
      add(piece(0xc4a574, 12, 0.18, 8, 0, 0.18, 0));
      add(piece(0xf7f1e6, 9, 2.6, 6, 0, 1.5, -1));
      add(piece(0x8a6a32, 10.2, 0.28, 7.2, 0, 2.95, -1));
      add(piece(0x6a4630, 1.6, 2.2, 0.1, 0, 1.2, 2.08));
      sign(place.name, "BEACH HOUSE", 0, 2.3, 2.16, 4.6, 1.2, "#f7f1e6", "#1f6b45");
      add(parkedCar(0xf2c14e, -8, 4));
      tree(-9, -2);
      tree(9, 2);
      me.position.set(0.6, 0, 3.4);
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
    const detachControls = attachSceneCameraControls(root, rig, { minZoom: 0.65, maxZoom: 2.1, zoomSpeed: 0.08 });
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
      detachControls();
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
          Go home
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
    // console table under the painting, with a vase
    add(piece(0x6a4630, 1.5, 0.07, 0.5, 2.3, 0.82, -3.15));
    for (const [lx, lz] of [[1.62, -3.32], [2.98, -3.32], [1.62, -2.98], [2.98, -2.98]]) add(piece(0x4a3428, 0.07, 0.78, 0.07, lx, 0.43, lz));
    add(piece(0x1f6b45, 0.14, 0.24, 0.14, 1.95, 0.97, -3.15));

    // bed: headboard on the back wall, long side along the room
    const bx = -1.6;
    add(piece(0x4a3428, 1.9, 0.3, 2.45, bx, 0.3, -2.05));
    add(piece(0x4a3428, 1.95, 1.05, 0.14, bx, 0.92, -3.35));
    add(piece(0xf7f4ee, 1.8, 0.24, 2.3, bx, 0.57, -2.1));
    add(piece(0x9fb3c8, 1.82, 0.1, 1.45, bx, 0.72, -1.55));
    add(piece(0x8c3d4a, 1.84, 0.03, 0.35, bx, 0.78, -1.3));
    add(piece(0xf6f1e6, 0.7, 0.16, 0.4, bx - 0.45, 0.8, -2.95));
    add(piece(0xf6f1e6, 0.7, 0.16, 0.4, bx + 0.45, 0.8, -2.95));
    add(piece(0x6a4630, 1.6, 0.3, 0.4, bx, 0.4, -0.62));
    add(blob(bx, -1.9, 2.5, 3.2, 0.35));

    const stand = (x: number) => {
      add(piece(0x4a3428, 0.5, 0.55, 0.45, x, 0.35, -3.1));
      add(piece(0xf2c14e, 0.14, 0.28, 0.14, x, 0.76, -3.1));
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.2, 8), new THREE.MeshLambertMaterial({ color: 0xf6e7b8 }));
      shade.position.set(x, 1.0, -3.1);
      add(shade);
    };
    stand(bx - 1.25);
    stand(bx + 1.25);

    // wardrobe against the left wall
    add(piece(0x5a4030, 0.55, 1.9, 1.4, -4.22, 1.05, -1.5));
    add(piece(0x3a281c, 0.02, 1.8, 0.03, -3.94, 1.05, -1.5));
    add(piece(0xc4a574, 0.04, 0.35, 0.04, -3.93, 1.05, -1.58));
    add(piece(0xc4a574, 0.04, 0.35, 0.04, -3.93, 1.05, -1.42));
    add(blob(-4.1, -1.5, 1.0, 1.6, 0.3));

    // desk, laptop, chair and a mirror on the left wall
    add(piece(0x6a4630, 0.7, 0.07, 1.5, -4.15, 0.78, 1.5));
    for (const [lx, lz] of [[-3.9, 0.82], [-4.4, 0.82], [-3.9, 2.18], [-4.4, 2.18]]) add(piece(0x4a3428, 0.07, 0.74, 0.07, lx, 0.4, lz));
    add(piece(0xd4d4d8, 0.3, 0.02, 0.42, -4.0, 0.83, 1.5));
    add(piece(0x1e293b, 0.03, 0.3, 0.42, -4.16, 0.99, 1.5));
    add(piece(0x6a4630, 0.5, 0.08, 0.5, -3.3, 0.5, 1.5));
    add(piece(0x6a4630, 0.08, 0.55, 0.5, -3.06, 0.8, 1.5));
    add(piece(0x6a4630, 0.08, 0.4, 0.08, -3.3, 0.28, 1.5));
    add(piece(0xe0b15a, 0.04, 1.2, 0.8, -4.5, 1.85, 1.5));
    add(piece(0xdbe9f0, 0.04, 1.05, 0.65, -4.48, 1.85, 1.5));
    add(blob(-3.9, 1.5, 1.7, 1.8, 0.25));

    // sofa faces the television on the right wall
    add(piece(0x3d4a66, 0.85, 0.38, 2.1, 1.05, 0.4, 0.95));
    add(piece(0x2c3850, 0.14, 0.58, 2.1, 0.55, 0.72, 0.95));
    add(piece(0x2c3850, 0.85, 0.44, 0.14, 1.05, 0.56, -0.05));
    add(piece(0x2c3850, 0.85, 0.44, 0.14, 1.05, 0.56, 1.95));
    add(blob(1.0, 0.95, 1.5, 2.4, 0.32));

    // coffee table between sofa and television
    add(piece(0x6a4630, 0.6, 0.07, 1.2, 2.6, 0.46, 0.95));
    for (const [lx, lz] of [[2.4, 0.42], [2.8, 0.42], [2.4, 1.48], [2.8, 1.48]]) add(piece(0x4a3428, 0.07, 0.4, 0.07, lx, 0.25, lz));
    add(piece(0xe0b15a, 0.14, 0.14, 0.14, 2.6, 0.58, 0.95));

    // television on a low unit against the right wall
    add(piece(0x4a3428, 0.45, 0.5, 1.8, 4.25, 0.37, 0.95));
    add(piece(0x17241e, 0.07, 0.8, 1.4, 4.36, 1.1, 0.95));
    add(piece(0x1a3350, 0.03, 0.66, 1.25, 4.31, 1.1, 0.95));

    // mini fridge in the back-right corner
    add(piece(0xd9dde0, 0.6, 0.85, 0.6, 3.95, 0.55, -3.05));
    add(piece(0x6b7280, 0.04, 0.3, 0.03, 4.15, 0.75, -2.73));

    // plant in the back-left corner
    add(piece(0x6a4630, 0.3, 0.35, 0.3, -4.05, 0.22, -3.05));
    const plant = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 7), new THREE.MeshLambertMaterial({ color: 0x1f6b45 }));
    plant.position.set(-4.05, 0.8, -3.05);
    add(plant);

    const guest = citizen(look);
    if (pose === "lie") {
      guest.rotation.x = -Math.PI / 2;
      guest.position.set(-1.6, 0.8, -1.05);
    } else if (pose === "sit") {
      guest.rotation.y = Math.PI / 2;
      guest.position.set(1.0, -0.42, 0.95);
    } else {
      guest.rotation.y = Math.PI;
      guest.position.set(-1.8, 0, 0.9);
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
    const detachControls = attachSceneCameraControls(root, rig, { minZoom: 0.7, maxZoom: 2.2, zoomSpeed: 0.08 });
    let frame = 0;
    let alive = true;
    const loop = () => {
      if (!alive) return;
      room.rotation.y = rig.current.yaw;
      camera.position.copy(aim).multiplyScalar(Math.min(40, Math.max(16, 9.8 / (0.536 * Math.min(camera.aspect, 1.7)))) / rig.current.zoom);
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
      detachControls();
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

function BeachHouse({ look }: { look: LookId }) {
  const host = useRef<HTMLDivElement>(null);
  const rig = useRef({ yaw: 0.45, zoom: 1.05 });

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
    scene.background = new THREE.Color("#9fd4ef");
    scene.add(new THREE.HemisphereLight(0xfff6e4, 0xe4d2a8, 0.95));
    const sun = new THREE.DirectionalLight(0xfff3dd, 1.15);
    sun.position.set(6, 12, 8);
    sun.castShadow = true;
    scene.add(sun);

    const house = new THREE.Group();
    scene.add(house);
    const add = (mesh: THREE.Object3D) => house.add(mesh);
    add(piece(0xe4d2a8, 22, 0.1, 16, 0, 0.04, 1));
    add(piece(0x3d8ec4, 22, 0.08, 7, 0, 0.03, -7.5));
    add(piece(0xc4a574, 11, 0.16, 8, 0, 0.16, 0.2));
    add(piece(0xb08960, 11.2, 0.04, 0.18, 0, 0.26, -3.6));
    add(piece(0xb08960, 11.2, 0.04, 0.18, 0, 0.26, 4));
    for (const [x, z] of [[-5, -3.2], [5, -3.2], [-5, 3.4], [5, 3.4]] as const) {
      add(piece(0xf7f1e6, 0.22, 2.7, 0.22, x, 1.5, z));
    }
    add(piece(0x8a6a32, 11.4, 0.22, 3.4, 0, 2.72, -1.7));
    add(piece(0x6a4630, 11.8, 0.08, 3.6, 0, 2.86, -1.7));
    add(piece(0xf7f1e6, 10.4, 1.7, 0.12, 0, 1.1, -3.35));
    add(piece(0x9fd0ea, 3.2, 1.1, 0.06, -2.2, 1.35, -3.26));
    add(piece(0x9fd0ea, 3.2, 1.1, 0.06, 2.2, 1.35, -3.26));
    add(piece(0xf7f1e6, 0.12, 1.1, 7.2, -5.15, 0.7, 0.2));
    add(piece(0xf7f1e6, 0.12, 1.1, 7.2, 5.15, 0.7, 0.2));

    add(piece(0xf7fbfc, 3.4, 0.28, 1.5, -2.2, 0.42, 0.4));
    add(piece(0x7ec8c3, 3.2, 0.1, 1.3, -2.2, 0.58, 0.4));
    add(piece(0xf7fbfc, 0.7, 0.16, 0.4, -3.2, 0.72, 0.15));
    add(piece(0xf7fbfc, 0.7, 0.16, 0.4, -1.2, 0.72, 0.15));
    add(blob(-2.2, 0.4, 3.4, 1.6, 0.28));

    add(piece(0xf4efe4, 2.4, 0.32, 0.9, 2.4, 0.42, 1.6));
    add(piece(0xe7dcc8, 2.4, 0.4, 0.12, 2.4, 0.7, 2));
    add(piece(0xc4a574, 1.3, 0.08, 0.8, 0.2, 0.48, 1.2));
    add(piece(0x6a4630, 0.08, 0.28, 0.08, -0.3, 0.32, 0.95));
    add(piece(0x6a4630, 0.08, 0.28, 0.08, 0.7, 0.32, 1.45));

    add(piece(0x6a4630, 2.6, 0.9, 0.5, -4.5, 0.6, -1.6));
    add(piece(0xf7f1e6, 2.4, 0.08, 0.46, -4.35, 1.08, -1.6));
    for (let i = 0; i < 4; i += 1) {
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.28, 8), new THREE.MeshLambertMaterial({ color: [0x1f6b45, 0xf2c14e, 0xf7fbfc, 0xc4552a][i] }));
      bottle.position.set(-5.1, 1.25, -2.2 + i * 0.4);
      add(bottle);
    }
    add(piece(0x2a241c, 1.1, 0.7, 0.6, 3.8, 0.5, -1.8));
    add(piece(0x3a3f46, 0.9, 0.06, 0.5, 3.8, 0.88, -1.8));

    const palm = (x: number, z: number) => {
      add(piece(0x6a4630, 0.22, 2.2, 0.22, x, 1.15, z));
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.85, 8, 6), new THREE.MeshLambertMaterial({ color: 0x2f7a3e }));
      crown.position.set(x, 2.4, z);
      add(crown);
    };
    palm(-7.2, 3.2);
    palm(7.2, -4.2);
    for (const [x, z] of [[-3.5, 2.6], [0, 2.8], [3.5, 2.6]] as const) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe08a }));
      bulb.position.set(x, 2.55, z);
      add(bulb);
    }

    const guest = citizen(look);
    guest.rotation.y = Math.PI;
    guest.position.set(0.3, 0.12, 2.2);
    add(guest);
    add(blob(0.3, 2.2, 0.7, 0.45, 0.35));

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
    const aim = new THREE.Vector3(10, 7, 14).normalize();
    const fit = () => {
      renderer.setSize(root.clientWidth || 1, root.clientHeight || 1);
      camera.aspect = (root.clientWidth || 1) / (root.clientHeight || 1);
      camera.updateProjectionMatrix();
    };
    fit();
    const detachControls = attachSceneCameraControls(root, rig, { minZoom: 0.7, maxZoom: 2.2, zoomSpeed: 0.08 });
    let frame = 0;
    let alive = true;
    const loop = () => {
      if (!alive) return;
      house.rotation.y = rig.current.yaw;
      camera.position.copy(aim).multiplyScalar(16 / rig.current.zoom);
      camera.lookAt(0, 0.7, 0);
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
      detachControls();
      renderer.dispose();
      root.removeChild(renderer.domElement);
    };
  }, [look]);

  function turn(dir: number) {
    rig.current.yaw += dir * 0.55;
  }
  function dolly(factor: number) {
    rig.current.zoom = Math.min(2.2, Math.max(0.7, rig.current.zoom * factor));
  }

  return (
    <div className="absolute inset-0 bg-[#9fd4ef]">
      <div
        ref={host}
        className="absolute inset-0 touch-none"
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

function OrbitRoom({
  look,
  build,
}: {
  look: LookId;
  build: (add: (mesh: THREE.Object3D) => void) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const rig = useRef({ yaw: 0.4, zoom: 1 });
  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(root.clientWidth, root.clientHeight);
    root.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#efe4d4");
    scene.add(new THREE.HemisphereLight(0xfff6e4, 0x7d8f68, 1));
    const sun = new THREE.DirectionalLight(0xfff3dd, 1.1);
    sun.position.set(8, 14, 10);
    scene.add(sun);
    const yard = new THREE.Group();
    scene.add(yard);
    build((mesh) => yard.add(mesh));
    const me = citizen(look);
    me.position.set(0, 0, 3.2);
    me.rotation.y = Math.PI;
    yard.add(me);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
    const aim = new THREE.Vector3(10, 7, 14).normalize();
    const fit = () => {
      renderer.setSize(root.clientWidth || 1, root.clientHeight || 1);
      camera.aspect = (root.clientWidth || 1) / (root.clientHeight || 1);
      camera.updateProjectionMatrix();
    };
    fit();
    const detachControls = attachSceneCameraControls(root, rig, { minZoom: 0.7, maxZoom: 2.1, zoomSpeed: 0.08 });
    let frame = 0;
    let alive = true;
    const loop = () => {
      if (!alive) return;
      yard.rotation.y = rig.current.yaw;
      camera.position.copy(aim).multiplyScalar(18 / rig.current.zoom);
      camera.lookAt(0, 1.2, 0);
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
      detachControls();
      renderer.dispose();
      root.removeChild(renderer.domElement);
    };
  }, [look, build]);
  function turn(dir: number) {
    rig.current.yaw += dir * 0.55;
  }
  function dolly(factor: number) {
    rig.current.zoom = Math.min(2.1, Math.max(0.7, rig.current.zoom * factor));
  }
  return (
    <div className="absolute inset-0 bg-[#efe4d4]">
      <div
        ref={host}
        className="absolute inset-0 touch-none"
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

function CathedralNave({ look }: { look: LookId }) {
  const build = useRef((add: (mesh: THREE.Object3D) => void) => {
    add(piece(0xf4efe4, 16, 0.12, 18, 0, 0.06, -1));
    add(piece(0xf7f1e6, 0.4, 6, 16, -6, 3, -1));
    add(piece(0xf7f1e6, 0.4, 6, 16, 6, 3, -1));
    add(piece(0xe7dcc8, 12, 0.2, 16, 0, 6.1, -1));
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xe0b15a }));
    dome.position.set(0, 6.1, -4);
    add(dome);
    add(piece(0xf2c14e, 0.16, 1.2, 0.16, 0, 8.6, -4));
    add(piece(0xf2c14e, 0.7, 0.14, 0.14, 0, 8.9, -4));
    for (let row = 0; row < 5; row += 1) {
      add(piece(0x6a4630, 3.2, 0.7, 0.7, -3.2, 0.5, 2.4 - row * 1.6));
      add(piece(0x6a4630, 3.2, 0.7, 0.7, 3.2, 0.5, 2.4 - row * 1.6));
    }
    add(piece(0xf7fbfc, 3.4, 1.1, 1.2, 0, 0.7, -6.2));
    add(piece(0xe0b15a, 0.12, 1.1, 0.12, 0, 1.8, -6.2));
    add(piece(0xe0b15a, 0.5, 0.1, 0.1, 0, 2.1, -6.2));
    add(piece(0x3d7ea6, 0.08, 2.4, 1.4, -5.9, 3.2, -2));
    add(piece(0xc4552a, 0.08, 2.4, 1.4, 5.9, 3.2, 1));
  }).current;
  return <OrbitRoom look={look} build={build} />;
}

function PhoneCounter({ look, title }: { look: LookId; title: string }) {
  const build = useRef((add: (mesh: THREE.Object3D) => void) => {
    add(piece(0xf7fbfc, 12, 0.12, 10, 0, 0.06, 0));
    add(piece(0x17241e, 8, 0.28, 0.2, 0, 3.2, -4.6));
    add(piece(0xe7dcc8, 6, 1.1, 0.8, 0, 0.7, 2.6));
    for (let col = 0; col < 4; col += 1) {
      add(piece(col % 2 === 0 ? 0x245c78 : 0x1f6b45, 0.7, 1.3, 0.08, -2.2 + col * 1.5, 1.6, -3.8));
    }
    add(piece(0xf2c14e, 0.35, 0.7, 0.04, -1.2, 1.15, 2.2));
    add(piece(0x143d2c, 0.35, 0.7, 0.04, 0.4, 1.15, 2.2));
    add(piece(0xc4552a, 0.35, 0.7, 0.04, 1.6, 1.15, 2.2));
    void title;
  }).current;
  return <OrbitRoom look={look} build={build} />;
}

function EverydayAisle({ look }: { look: LookId }) {
  const build = useRef((add: (mesh: THREE.Object3D) => void) => {
    add(piece(0xf7fbfc, 16, 0.12, 14, 0, 0.06, 0));
    add(piece(0x1f6b45, 16, 0.5, 0.3, 0, 4.2, -6.6));
    for (let lane = 0; lane < 3; lane += 1) {
      const x = -4 + lane * 4;
      add(piece(0xe7dcc8, 1.4, 2.2, 6, x, 1.2, -1));
      add(piece(0xc4552a, 1.2, 0.28, 1.4, x, 1.6, -2.4));
      add(piece(0xf2c14e, 1.2, 0.28, 1.4, x, 2.1, -0.4));
      add(piece(0x1f6b45, 1.2, 0.28, 1.4, x, 1.6, 1.4));
    }
    add(piece(0x143d2c, 4.2, 1.1, 0.8, 0, 0.7, 4.2));
    add(piece(0xf2c14e, 0.8, 0.2, 0.5, 0, 1.35, 4.2));
  }).current;
  return <OrbitRoom look={look} build={build} />;
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
  onMoveFurniture,
  onSellFurniture,
  onHomeSleep,
  onHomeShower,
  onHomeToilet,
  fill = false,
  extra = null,
  onApply,
  chat = [],
  onSay,
  cars = [],
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
  house?: { name: string; homeId: string; furniture: string[]; layout: Record<string, Placement>; beds: number; upstairs: boolean; duplex: boolean } | null;
  onBuyFurniture?: (itemId: string) => void;
  onMoveFurniture?: (key: string, placement: Placement) => void;
  onSellFurniture?: (key: string) => void;
  onHomeSleep?: () => void;
  onHomeShower?: () => void;
  onHomeToilet?: () => void;
  fill?: boolean;
  extra?: ReactNode;
  onApply?: () => void;
  chat?: Array<{ id: string; fromName: string; text: string }>;
  onSay?: (text: string) => void;
  cars?: string[];
  onBuyCar?: (carId: string) => void;
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
  const beach = place.id === "cartel-beach";
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
          <HouseRoom name={house.name} homeId={house.homeId} furniture={house.furniture} layout={house.layout} beds={house.beds} upstairs={house.upstairs} duplex={house.duplex} look={look} pending={pending} onBuy={onBuyFurniture ?? (() => undefined)} onMove={onMoveFurniture ?? (() => undefined)} onSell={onSellFurniture} onSleep={onHomeSleep} onShower={onHomeShower} onToilet={onHomeToilet} />
        ) : beach ? (
          <BeachHouse look={look} />
        ) : place.id === "assumpta-cathedral" ? (
          <AssumptaCathedralScene look={look} username={username} />
        ) : place.id === "car-stand" ? (
          <CarStandScene look={look} username={username} owned={cars} pending={pending} onBuy={onBuyCar} />
        ) : place.id === "sam-mbakwe" || place.kind === "airport" ? (
          <AirportTerminalScene look={look} username={username} onBookFlight={(dest, cost) => onBook?.("night")} />
        ) : place.id === "the-warehouse" ? (
          <WarehouseScene look={look} username={username} />
        ) : place.id === "everyday" ? (
          <EverydayAisle look={look} />
        ) : place.id === "heroes-square" ? (
          <HeroesStadiumScene look={look} username={username} />
        ) : PHONE_SHOPS.has(place.id) ? (
          <PhoneStoreScene look={look} title={place.name} placeId={place.id} />
        ) : place.kind === "school" ? (
          <SchoolClassroomScene look={look} title={place.name} placeId={place.id} username={username} />
        ) : place.kind === "health" ? (
          <HospitalScene look={look} title={place.name} placeId={place.id} />
        ) : place.kind === "market" ? (
          <OwerriMarketScene look={look} title={place.name} placeId={place.id} username={username} />
        ) : place.kind === "food" ? (
          <RestaurantScene look={look} title={place.name} placeId={place.id} />
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
      <div className={`grid gap-1 ${fill ? `absolute bottom-24 left-1/2 z-30 max-h-[28%] -translate-x-1/2 overflow-y-auto rounded-2xl bg-white/95 text-[#17241e] shadow-2xl ${club || suite || beach ? "w-[min(16rem,calc(100%-5rem))] p-2" : "w-[min(28rem,calc(100%-1.5rem))] gap-2 p-3"}` : "p-3"}`}>
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
  const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D, x: number, y: number, z: number) => {
    const part = new THREE.Mesh(geometry, material);
    part.castShadow = true;
    part.position.set(x, y, z);
    parent.add(part);
    return part;
  };
  const limbGeo = (radius: number, length: number) => new THREE.CapsuleGeometry(radius, length, 6, 10);

  // legs hang from the hips so they can swing when walking
  const leg = (side: number) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.085, 0.92, 0);
    mesh(limbGeo(0.068, 0.66), pants, hip, 0, -0.41, 0);
    const foot = mesh(new THREE.BoxGeometry(0.1, 0.07, 0.24), shoe, hip, 0, -0.84, 0.05);
    foot.scale.set(1, 1, 1);
    person.add(hip);
    return hip;
  };
  const leftLeg = leg(-1);
  const rightLeg = leg(1);

  // hips, torso, shoulders
  const pelvis = mesh(new THREE.SphereGeometry(0.17, 18, 12), pants, person, 0, 0.95, 0);
  pelvis.scale.set(1, 0.7, 0.62);
  const torso = mesh(new THREE.CylinderGeometry(0.19, 0.15, 0.56, 20), cloth, person, 0, 1.22, 0);
  torso.scale.set(1, 1, 0.6);
  const chest = mesh(new THREE.SphereGeometry(0.19, 18, 12), cloth, person, 0, 1.43, 0);
  chest.scale.set(1.05, 0.55, 0.62);

  // arms hang from the shoulders
  const arm = (side: number) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.235, 1.43, 0);
    mesh(limbGeo(0.046, 0.5), cloth, shoulder, 0, -0.3, 0).scale.set(1, 1, 1);
    mesh(new THREE.SphereGeometry(0.052, 12, 10), skin, shoulder, 0, -0.63, 0);
    shoulder.rotation.z = side * 0.07;
    person.add(shoulder);
    return shoulder;
  };
  const leftArm = arm(-1);
  const rightArm = arm(1);

  // neck and head
  mesh(new THREE.CylinderGeometry(0.052, 0.058, 0.12, 12), skin, person, 0, 1.56, 0);
  const head = mesh(new THREE.SphereGeometry(0.118, 24, 18), skin, person, 0, 1.68, 0.01);
  head.scale.set(0.9, 1.12, 1);
  mesh(new THREE.SphereGeometry(0.026, 8, 6), skin, person, -0.105, 1.68, 0).scale.set(0.5, 1, 0.8);
  mesh(new THREE.SphereGeometry(0.026, 8, 6), skin, person, 0.105, 1.68, 0).scale.set(0.5, 1, 0.8);
  mesh(new THREE.SphereGeometry(0.022, 8, 6), skin, person, 0, 1.665, 0.118).scale.set(0.9, 1.1, 1);
  mesh(new THREE.SphereGeometry(0.014, 8, 6), eye, person, -0.042, 1.7, 0.106);
  mesh(new THREE.SphereGeometry(0.014, 8, 6), eye, person, 0.042, 1.7, 0.106);
  mesh(new THREE.SphereGeometry(0.02, 8, 6), mouth, person, 0, 1.628, 0.108).scale.set(1.5, 0.4, 0.4);
  const hair = mesh(new THREE.SphereGeometry(0.124, 20, 14), hairM, person, 0, 1.74, -0.015);
  hair.scale.set(0.97, 0.6, 1.02);
  const back = mesh(new THREE.SphereGeometry(0.12, 16, 12), hairM, person, 0, 1.69, -0.04);
  back.scale.set(0.95, 0.95, 0.8);

  person.userData.limbs = { leftLeg, rightLeg, leftArm, rightArm };
  person.position.set(0, 0.12, 0.15);
  return person;
}

type HomeSpot = FurnitureSpot | "bathroom" | "landing" | "house";

interface Loc {
  spot: HomeSpot | "door";
  roomNo: number;
}

interface PlacedPiece {
  key: string;
  id: string;
  spot: FurnitureSpot;
  roomNo: number;
  x: number;
  z: number;
  rot: number;
}

interface OtherPiece {
  key: string;
  id: string;
  label: string;
}

interface Draft {
  key: string;
  x: number;
  z: number;
  rot: number;
}

function labelSprite(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "rgba(23,36,30,0.9)";
    ctx.fillRect(6, 10, 372, 76);
    ctx.fillStyle = "#e0b15a";
    ctx.fillRect(6, 10, 372, 6);
    ctx.fillStyle = "#f6f1e6";
    ctx.font = "bold 44px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 192, 54);
  }
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthTest: false, transparent: true }));
  sprite.scale.set(7.2, 1.8, 1);
  sprite.renderOrder = 10;
  return sprite;
}

function RoomView({
  placed,
  others,
  look,
  beds,
  upstairs,
  duplex,
  spot,
  roomNo,
  edit,
  pending,
  onKeep,
  onBring,
  onDone,
  onSell,
  onEdit,
  at,
  walkTo,
  onWalked,
}: {
  at: Loc;
  walkTo: Loc | null;
  onWalked: () => void;
  placed: PlacedPiece[];
  others: OtherPiece[];
  look: LookId;
  beds: number;
  upstairs: boolean;
  duplex: boolean;
  spot: HomeSpot;
  roomNo: number;
  edit: boolean;
  pending: boolean;
  onKeep: (key: string, at: { x: number; z: number; rot: number }) => void;
  onBring: (key: string) => void;
  onDone: () => void;
  onSell: (key: string) => void;
  onEdit: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const rig = useRef({ yaw: 0.55, zoom: 1.15 });
  const [confirmSell, setConfirmSell] = useState(false);
  const placedKey = JSON.stringify(placed);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [seenKey, setSeenKey] = useState(placedKey);
  if (seenKey !== placedKey) {
    setSeenKey(placedKey);
    setDraft(null);
  }
  const live = useRef({ edit, selected });
  const cbs = useRef({ walked: onWalked, enter: onEdit });
  const atKey = `${at.spot}:${at.roomNo}`;
  const walkKey = walkTo ? `${walkTo.spot}:${walkTo.roomNo}` : "";
  const furnRef = useRef<Map<string, THREE.Group>>(new Map());
  const taps = useRef<{ select: (key: string) => void; drop: (x: number, z: number) => void }>({ select: () => undefined, drop: () => undefined });
  const homeStub = { id: duplex ? "duplex" : "home", beds, upstairs } as Home;

  function currentOf(key: string): Draft | null {
    if (draft && draft.key === key) return draft;
    const piece = placed.find((entry) => entry.key === key);
    return piece ? { key, x: piece.x, z: piece.z, rot: piece.rot } : null;
  }

  function push(key: string, x: number, z: number, rot: number) {
    const piece = placed.find((entry) => entry.key === key);
    const item = piece ? furnitureById(piece.id) : null;
    if (!piece || !item) return;
    const fitted = clampPlacement(item, homeStub, { homeId: "", spot: piece.spot, roomNo: piece.roomNo, x, z, rot });
    setDraft({ key, x: fitted.x, z: fitted.z, rot: fitted.rot });
  }

  useEffect(() => {
    live.current = { edit, selected };
    cbs.current = { walked: onWalked, enter: onEdit };
    taps.current = {
      select: (key) => setSelected(key),
      drop: (x, z) => {
        if (!selected) return;
        const cur = currentOf(selected);
        if (cur) push(selected, x, z, cur.rot);
      },
    };
  });

  useEffect(() => {
    setConfirmSell(false);
  }, [selected]);

  useEffect(() => {
    if (!edit) {
      setSelected(null);
      setDraft(null);
    }
  }, [edit]);

  useEffect(() => {
    setSelected(null);
    setDraft(null);
  }, [spot, roomNo]);

  useEffect(() => {
    if (!draft) return;
    const group = furnRef.current.get(draft.key);
    if (!group) return;
    group.position.x = draft.x;
    group.position.z = draft.z;
    group.rotation.y = draft.rot;
  }, [draft]);

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const items: PlacedPiece[] = JSON.parse(placedKey);
    const house = spot === "house";
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(root.clientWidth, root.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    root.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#cfe0c2");
    scene.add(new THREE.HemisphereLight(0xfff6e8, 0x8fbf98, 0.72));
    const sun = new THREE.DirectionalLight(0xfff3dd, 1.35);
    const ext = house ? 62 : 18;
    sun.position.set(house ? 14 : 4, house ? 44 : 12, house ? 24 : 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.left = -ext;
    sun.shadow.camera.right = ext;
    sun.shadow.camera.top = ext;
    sun.shadow.camera.bottom = -ext;
    sun.shadow.camera.far = house ? 160 : 48;
    sun.shadow.bias = -0.0012;
    scene.add(sun);
    scene.add(sun.target);

    const spin = new THREE.Group();
    scene.add(spin);
    const yard = new THREE.Mesh(new THREE.PlaneGeometry(house ? 300 : 42, house ? 240 : 32), new THREE.MeshLambertMaterial({ color: 0xcfe0c2 }));
    yard.rotation.x = -Math.PI / 2;
    spin.add(yard);

    const wall = 0xf4efe4;
    const gold = 0xe0b15a;
    const wood = 0xc4a574;
    let target: THREE.Object3D = spin;
    const add = (mesh: THREE.Object3D) => target.add(mesh);
    const floors: THREE.Object3D[] = [];
    const furn = new Map<string, THREE.Group>();
    furnRef.current = furn;

    const floorSlab = (color: number, width: number, depth: number) => {
      const slab = piece(color, width, 0.14, depth, 0, 0.07, 0);
      floors.push(slab);
      add(slab);
    };
    const shell = (width: number, depth: number, rise: number, floor = true) => {
      if (floor) floorSlab(wood, width, depth);
      add(piece(wall, width, rise, 0.18, 0, rise / 2, -depth / 2));
      add(piece(wall, 0.18, rise, depth, -width / 2, rise / 2, 0));
      add(piece(wall, 0.18, rise, depth * 0.42, width / 2, rise / 2, -depth * 0.29));
      add(piece(0xe7dcc8, width, 0.1, 0.1, 0, 0.16, -depth / 2 + 0.14));
      add(piece(0xe7dcc8, 0.1, 0.1, depth, -width / 2 + 0.14, 0.16, 0));
      add(piece(gold, width, 0.08, 0.1, 0, rise - 0.05, -depth / 2 + 0.06));
      const wx = width * 0.16;
      const wy = rise * 0.58;
      const wz = -depth / 2 + 0.14;
      add(piece(0x9fd0ea, 2.6, 1.55, 0.06, wx, wy, wz));
      add(piece(0xf7f1e6, 2.8, 0.08, 0.1, wx, wy + 0.82, wz));
      add(piece(0xf7f1e6, 2.8, 0.08, 0.1, wx, wy - 0.82, wz));
      add(piece(0xf7f1e6, 0.08, 1.7, 0.1, wx - 1.34, wy, wz));
      add(piece(0xf7f1e6, 0.08, 1.7, 0.1, wx + 1.34, wy, wz));
    };
    const mattress = (x: number, z: number) => {
      add(piece(0x6a4630, 2.1, 0.22, 1.9, x, 0.25, z));
      add(piece(0xd9d2c4, 1.95, 0.2, 1.75, x, 0.46, z));
      add(piece(0xd9d2c4, 0.7, 0.14, 0.4, x, 0.63, z - 0.6));
    };
    const frontDoor = (width: number, depth: number, open: boolean) => {
      const dx = -width / 2;
      const dz = Math.min(3.3, depth / 2 - 2);
      const wood2 = 0x7a4a2a;
      add(piece(0x6a4630, 0.3, 2.5, 0.2, dx + 0.08, 1.25, dz - 1.05));
      add(piece(0x6a4630, 0.3, 2.5, 0.2, dx + 0.08, 1.25, dz + 1.05));
      add(piece(0x6a4630, 0.3, 0.22, 2.4, dx + 0.08, 2.5, dz));
      add(piece(0x2f7a4a, 1.0, 0.03, 1.7, dx + 0.75, 0.16, dz));
      add(piece(0xd9b77d, 0.5, 0.05, 2.0, dx, 0.165, dz));
      if (open) {
        const leaf = new THREE.Group();
        leaf.position.set(dx + 0.05, 0, dz - 0.95);
        leaf.rotation.y = 1.15;
        const door = piece(wood2, 0.1, 2.3, 1.9, 0, 1.2, 0.95);
        leaf.add(door);
        leaf.add(piece(gold, 0.1, 0.1, 0.1, 0.1, 1.15, 1.6));
        target.add(leaf);
      } else {
        add(piece(wood2, 0.1, 2.3, 1.9, dx + 0.12, 1.2, dz));
        add(piece(gold, 0.1, 0.1, 0.1, dx + 0.22, 1.15, dz + 0.65));
        add(piece(0xe7dcc8, 0.04, 0.5, 0.5, dx + 0.19, 1.6, dz - 0.4));
      }
    };
    const flight = (x: number, z0: number, down: boolean) => {
      const steps = 12;
      const rise = 0.22;
      const run = 0.34;
      const wide = duplex ? 1.9 : 1.5;
      for (let i = 0; i < steps; i += 1) {
        add(piece(i % 2 === 0 ? 0xe7c99a : 0xc88848, wide, rise * 0.92, run * 0.92, x, down ? -rise * (i + 0.5) : rise * (i + 0.5), down ? z0 + i * run : z0 - i * run));
      }
      const len = steps * run;
      const railZ = down ? z0 + len / 2 : z0 - len / 2;
      const railY = down ? 0.2 : steps * rise + 0.08;
      add(piece(gold, 0.08, 0.08, len, x - wide / 2, railY, railZ));
      add(piece(gold, 0.08, 0.08, len, x + wide / 2, railY, railZ));
      if (down) {
        add(piece(0x6a4630, 0.08, 1.35, 0.08, x - wide / 2, 0.75, z0 + 0.2));
        add(piece(0x6a4630, 0.08, 1.35, 0.08, x + wide / 2, 0.75, z0 + 0.2));
        add(piece(gold, 0.08, 0.08, 1.2, x - wide / 2, 1.35, z0 + 0.2));
        add(piece(gold, 0.08, 0.08, 1.2, x + wide / 2, 1.35, z0 + 0.2));
      }
    };
    const cyl = (color: number, r: number, h: number, x: number, y: number, z: number, sx = 1, sz = 1) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), new THREE.MeshLambertMaterial({ color }));
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, 1, sz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      add(mesh);
      return mesh;
    };
    const glass = (w: number, h: number, d: number, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: 0xbfe3f2, transparent: true, opacity: 0.35 }));
      mesh.position.set(x, y, z);
      add(mesh);
    };
    const tiles = (w: number, d: number, cols: number, rows: number, a: number, b: number) => {
      const cw = w / cols;
      const cd = d / rows;
      for (let i = 0; i < cols; i += 1) {
        for (let j = 0; j < rows; j += 1) {
          add(piece((i + j) % 2 === 0 ? a : b, cw - 0.03, 0.03, cd - 0.03, -w / 2 + cw * (i + 0.5), 0.155, -d / 2 + cd * (j + 0.5)));
        }
      }
    };
    const kitchenFixtures = () => {
      const f = 0.14;
      tiles(14, 10, 8, 6, 0xf1ebdd, 0xd8cdb4);
      for (let i = 0; i < 5; i += 1) {
        const x = -6.2 + i * 1.2;
        add(piece(0x7b5438, 1.2, 0.9, 0.62, x, f + 0.45, -4.58));
        add(piece(0xb98a56, 1.06, 0.7, 0.05, x, f + 0.5, -4.25));
        add(piece(gold, 0.34, 0.05, 0.05, x, f + 0.78, -4.21));
      }
      add(piece(0x2f3a40, 6.2, 0.08, 0.76, -3.8, f + 0.94, -4.55));
      add(piece(0xe9f0ee, 6.2, 0.75, 0.05, -3.8, f + 1.4, -4.86));
      add(piece(0xb8c0c8, 1.35, 0.03, 0.5, -3.2, f + 0.99, -4.5));
      add(piece(0x8f98a0, 0.58, 0.04, 0.4, -3.55, f + 1.0, -4.5));
      add(piece(0x8f98a0, 0.58, 0.04, 0.4, -2.85, f + 1.0, -4.5));
      cyl(0xb8c0c8, 0.04, 0.55, -3.2, f + 1.28, -4.8);
      add(piece(0xb8c0c8, 0.06, 0.06, 0.34, -3.2, f + 1.54, -4.65));
      add(piece(0xd9d2c4, 0.5, 0.05, 0.38, -5.3, f + 1.01, -4.5));
      for (let i = 0; i < 4; i += 1) {
        const x = -6.0 + i * 1.3;
        add(piece(0xc9a574, 1.22, 0.9, 0.4, x, f + 2.35, -4.7));
        add(piece(0xe0c496, 1.08, 0.74, 0.04, x, f + 2.35, -4.47));
        add(piece(gold, 0.05, 0.3, 0.05, x + 0.4, f + 2.2, -4.43));
      }
      add(piece(0x6a4630, 5.4, 0.08, 0.42, -3.35, f + 2.84, -4.7));
      add(piece(0xf7f1e6, 0.5, 0.05, 0.34, -1.35, f + 0.99, -4.5));
    };
    const bathFixtures = () => {
      const f = 0.14;
      tiles(9, 7.5, 6, 5, 0xf0f6f8, 0xcfe3ec);
      add(piece(0xcfe3ec, 8.8, 1.4, 0.05, 0, f + 0.7, -3.62));
      add(piece(0xcfe3ec, 0.05, 1.4, 7.3, -4.37, f + 0.7, 0));
      add(piece(gold, 8.8, 0.05, 0.07, 0, f + 1.42, -3.6));
      add(piece(gold, 0.07, 0.05, 7.3, -4.35, f + 1.42, 0));
      // shower cubicle
      add(piece(0xf4f8fa, 2.8, 0.14, 2.7, -2.95, f + 0.07, -2.3));
      cyl(0x6b747c, 0.12, 0.03, -2.95, f + 0.16, -2.3);
      glass(1.9, 2.15, 0.05, -3.4, f + 1.2, -0.97);
      glass(0.05, 2.15, 2.7, -1.55, f + 1.2, -2.3);
      add(piece(0xb8c0c8, 0.07, 2.2, 0.07, -2.45, f + 1.2, -0.97));
      add(piece(0xb8c0c8, 0.07, 2.2, 0.07, -1.55, f + 1.2, -0.97));
      add(piece(0xb8c0c8, 0.07, 2.2, 0.07, -1.55, f + 1.2, -3.6));
      add(piece(0xb8c0c8, 2.9, 0.06, 0.06, -3.0, f + 2.3, -0.97));
      cyl(0xb8c0c8, 0.035, 2.0, -3.6, f + 1.25, -3.56);
      add(piece(0xb8c0c8, 0.06, 0.06, 0.6, -3.6, f + 2.2, -3.28));
      cyl(0xb8c0c8, 0.26, 0.05, -3.6, f + 2.16, -2.95);
      cyl(0xb8c0c8, 0.07, 0.06, -2.8, f + 1.2, -3.58).rotation.x = Math.PI / 2;
      add(piece(0x9fd0ea, 0.2, 0.08, 0.04, -2.8, f + 1.0, -3.58));
      // toilet
      add(piece(0xf7fbfc, 0.5, 0.42, 0.55, 0.6, f + 0.21, -3.15));
      cyl(0xf7fbfc, 0.36, 0.24, 0.6, f + 0.5, -2.8, 1, 1.4);
      cyl(0xe9eef1, 0.3, 0.05, 0.6, f + 0.64, -2.8, 1, 1.35);
      cyl(0xf7fbfc, 0.36, 0.05, 0.6, f + 0.68, -2.8, 1, 1.4);
      add(piece(0xf7fbfc, 0.85, 0.72, 0.3, 0.6, f + 0.84, -3.42));
      add(piece(0xe9eef1, 0.9, 0.05, 0.34, 0.6, f + 1.22, -3.42));
      cyl(gold, 0.06, 0.05, 0.6, f + 1.27, -3.42);
      add(piece(0xf7f1e6, 0.14, 0.14, 0.14, 1.45, f + 0.9, -3.55));
      cyl(0xc4a574, 0.16, 0.45, 1.4, f + 0.23, -2.5);
      // vanity, basin and mirror
      add(piece(0xf0eadb, 1.9, 0.82, 0.62, 3.4, f + 0.41, -3.3));
      add(piece(0xd9cdb3, 0.85, 0.66, 0.04, 3.0, f + 0.42, -2.97));
      add(piece(0xd9cdb3, 0.85, 0.66, 0.04, 3.8, f + 0.42, -2.97));
      add(piece(gold, 0.05, 0.25, 0.05, 3.4, f + 0.5, -2.95));
      add(piece(0xe8e8e8, 2.0, 0.07, 0.68, 3.4, f + 0.85, -3.3));
      cyl(0xffffff, 0.3, 0.1, 3.4, f + 0.9, -3.25, 1.3, 1);
      cyl(0xbfd3dc, 0.22, 0.02, 3.4, f + 0.96, -3.25, 1.3, 1);
      cyl(0xb8c0c8, 0.03, 0.3, 3.4, f + 1.05, -3.55);
      add(piece(0xb8c0c8, 0.05, 0.05, 0.22, 3.4, f + 1.18, -3.45));
      add(piece(gold, 1.35, 1.05, 0.03, 3.4, f + 1.95, -3.62));
      add(piece(0xcfe7f0, 1.2, 0.9, 0.04, 3.4, f + 1.95, -3.59));
      // towel, mat and basket
      add(piece(0xb8c0c8, 0.05, 0.05, 1.5, -4.3, f + 1.35, 1.3));
      add(piece(0x245c78, 0.07, 0.9, 1.2, -4.3, f + 0.85, 1.3));
      add(piece(0x2f7a4a, 1.7, 0.03, 0.95, -2.7, f + 0.04, -0.2));
      cyl(0xc4a574, 0.38, 0.8, 3.7, f + 0.4, 1.2);
    };
    const doorFrames = (wide: number) => {
      for (let i = 0; i < beds; i += 1) {
        const span = beds <= 1 ? 0 : (wide - 4.4) / (beds - 1);
        const x = beds <= 1 ? 0 : -wide / 2 + 2.2 + i * span;
        add(piece(0xf7f1e6, 1.2, 2.35, 0.1, x, 1.25, -4.15));
        add(piece(0x6a4630, 1.4, 0.1, 0.12, x, 2.48, -4.1));
        add(piece(gold, 0.08, 0.08, 0.08, x + 0.38, 1.2, -4.02));
      }
    };
    const dropItems = (list: PlacedPiece[], tracked: boolean) => {
      for (const entry of list) {
        const model = buildFurniture(entry.id);
        model.position.set(entry.x, 0.14, entry.z);
        model.rotation.y = entry.rot;
        model.userData.key = entry.key;
        model.userData.id = entry.id;
        target.add(model);
        if (tracked) furn.set(entry.key, model);
      }
    };
    const hasBedIn = (list: PlacedPiece[]) => list.some((entry) => entry.id === "bed" || entry.id === "double-bed");

    let roomDistance = 26;
    let lookY = 1.35;
    let standX = 0;
    let standZ = 2.2;
    let span = 0;
    let walkPts: Array<[number, number]> | null = null;
    let walkFail = false;
    const me = createRealisticHuman({ lookId: look, scale: 0.92 });

    if (house) {
      const studio = beds <= 1 && !upstairs;
      type Kind = "parlour" | "kitchen" | "bathroom" | "landing" | "room";
      interface Plan {
        kind: Kind;
        roomNo: number;
        label: string;
        w: number;
        d: number;
        hall: boolean;
        x0: number;
        z0: number;
        doors: { n: number[]; s: number[]; e: number[]; w: number[] };
      }
      interface Row {
        rooms: Plan[];
        align: "top" | "bottom";
      }
      const plan = (kind: Kind, no: number, label: string): Plan => ({
        kind,
        roomNo: no,
        label,
        hall: false,
        x0: 0,
        z0: 0,
        doors: { n: [], s: [], e: [], w: [] },
        ...roomSize(kind, beds, upstairs, duplex),
      });
      const hallOf = (w: number, label: string): Plan => ({ ...plan("landing", 1, label), w, d: 4, hall: true });
      const bedrooms = () => Array.from({ length: Math.max(beds, 1) }, (_, i) => plan("room", i + 1, studio ? "Room" : `Room ${i + 1}`));
      const frontRow = () => [plan("kitchen", 1, "Kitchen"), plan("parlour", 1, "Parlour"), plan("bathroom", 1, "Bathroom")];
      const widthOf = (rooms: Plan[]) => rooms.reduce((sum, entry) => sum + entry.w, 0);
      const blocks: Array<{ title: string; rows: Row[] }> = [];
      if (studio) {
        blocks.push({ title: "", rows: [{ rooms: [...bedrooms(), plan("bathroom", 1, "Bathroom")], align: "top" }] });
      } else if (upstairs) {
        const upper = bedrooms();
        blocks.push({
          title: "UPSTAIRS",
          rows: [
            { rooms: upper, align: "bottom" },
            { rooms: [hallOf(widthOf(upper), "Landing")], align: "top" },
          ],
        });
        blocks.push({ title: "DOWNSTAIRS", rows: [{ rooms: frontRow(), align: "top" }] });
      } else {
        const back = bedrooms();
        const front = frontRow();
        blocks.push({
          title: "",
          rows: [
            { rooms: back, align: "bottom" },
            { rooms: [hallOf(Math.max(widthOf(back), widthOf(front)), "Hall")], align: "top" },
            { rooms: front, align: "top" },
          ],
        });
      }

      const board = new THREE.Group();
      spin.add(board);
      target = board;
      const everyRoom: Plan[] = [];
      let cursor = 0;
      let widest = 0;
      for (const block of blocks) {
        if (block.title) {
          const sign = labelSprite(block.title);
          sign.position.set(0, 3.2, cursor + 1);
          board.add(sign);
          cursor += 2.4;
        }
        for (const row of block.rows) {
          const rowW = widthOf(row.rooms);
          const rowD = Math.max(...row.rooms.map((entry) => entry.d));
          widest = Math.max(widest, rowW);
          let cx = -rowW / 2;
          for (const entry of row.rooms) {
            entry.x0 = cx;
            entry.z0 = row.align === "bottom" ? cursor + rowD - entry.d : cursor;
            cx += entry.w;
            everyRoom.push(entry);
          }
          cursor += rowD;
        }
        cursor += 3.5;
      }

      const near = (a: number, b: number) => Math.abs(a - b) < 0.05;
      const links: Array<{ a: Plan; b: Plan; x: number; z: number }> = [];
      for (const a of everyRoom) {
        for (const b of everyRoom) {
          if (a === b) continue;
          if (near(a.x0 + a.w, b.x0)) {
            const lo = Math.max(a.z0, b.z0);
            const hi = Math.min(a.z0 + a.d, b.z0 + b.d);
            if (hi - lo > 3 && (studio || a.kind === "parlour" || b.kind === "parlour")) {
              const mid = (lo + hi) / 2;
              a.doors.e.push(mid - (a.z0 + a.d / 2));
              b.doors.w.push(mid - (b.z0 + b.d / 2));
              links.push({ a, b, x: a.x0 + a.w, z: mid });
            }
          }
          if (near(a.z0 + a.d, b.z0)) {
            const lo = Math.max(a.x0, b.x0);
            const hi = Math.min(a.x0 + a.w, b.x0 + b.w);
            if (hi - lo > 3 && (a.hall || b.hall)) {
              const mid = (lo + hi) / 2;
              a.doors.s.push(mid - (a.x0 + a.w / 2));
              b.doors.n.push(mid - (b.x0 + b.w / 2));
              links.push({ a, b, x: mid, z: a.z0 + a.d });
            }
          }
        }
      }

      const wallRun = (alongX: boolean, fixed: number, length: number, doors: number[]) => {
        const h = 1.3;
        const half = 1.3;
        const frame = 0x6a4630;
        const seg = (from: number, to: number) => {
          if (to - from < 0.05) return;
          const mid = (from + to) / 2;
          add(alongX ? piece(wall, to - from, h, 0.2, mid, h / 2, fixed) : piece(wall, 0.2, h, to - from, fixed, h / 2, mid));
        };
        let start = -length / 2;
        for (const c of [...doors].sort((p, q) => p - q)) {
          seg(start, c - half);
          if (alongX) {
            add(piece(0xd9b77d, 2.6, 0.05, 0.34, c, 0.165, fixed));
            add(piece(frame, 0.25, 1.6, 0.3, c - half, 0.8, fixed));
            add(piece(frame, 0.25, 1.6, 0.3, c + half, 0.8, fixed));
            add(piece(frame, 2.85, 0.18, 0.3, c, 1.65, fixed));
          } else {
            add(piece(0xd9b77d, 0.34, 0.05, 2.6, fixed, 0.165, c));
            add(piece(frame, 0.3, 1.6, 0.25, fixed, 0.8, c - half));
            add(piece(frame, 0.3, 1.6, 0.25, fixed, 0.8, c + half));
            add(piece(frame, 0.3, 0.18, 2.85, fixed, 1.65, c));
          }
          start = c + half;
        }
        seg(start, length / 2);
      };

      for (const entry of everyRoom) {
        const room = new THREE.Group();
        room.position.set(entry.x0 + entry.w / 2, 0, entry.z0 + entry.d / 2);
        board.add(room);
        target = room;
        const frontEntry = studio ? entry.kind === "room" && entry.roomNo === 1 : entry.kind === "parlour";
        if (frontEntry) entry.doors.w.push(Math.min(3.3, entry.d / 2 - 2));
        floorSlab(entry.kind === "bathroom" ? 0xd5e8f0 : entry.kind === "kitchen" ? 0xe4dcc6 : wood, entry.w, entry.d);
        wallRun(true, -entry.d / 2, entry.w, entry.doors.n);
        wallRun(true, entry.d / 2, entry.w, entry.doors.s);
        wallRun(false, -entry.w / 2, entry.d, entry.doors.w);
        wallRun(false, entry.w / 2, entry.d, entry.doors.e);
        if (frontEntry) frontDoor(entry.w, entry.d, true);
        if (entry.kind === "kitchen") kitchenFixtures();
        if (entry.kind === "bathroom") bathFixtures();
        if (entry.kind === "parlour" && upstairs) flight(3.6, 2.4, false);
        const mine = items.filter((piece2) => (entry.kind === "room" ? piece2.spot === "room" && piece2.roomNo === entry.roomNo : piece2.spot === entry.kind));
        if (entry.kind === "room" && !hasBedIn(mine)) mattress(-(entry.w / 2 - 2), -(entry.d / 2 - 2.2));
        dropItems(mine, false);
        const tag = labelSprite(entry.label);
        tag.scale.set(entry.hall ? 3.4 : 4.6, entry.hall ? 0.85 : 1.15, 1);
        tag.position.set(0, entry.hall ? 1.8 : 2.6, entry.hall ? 0 : entry.d / 2 - 0.4);
        room.add(tag);
        target = board;
      }
      const keyOf = (entry: Plan) => (entry.hall ? (upstairs ? "landing" : "hall") : entry.kind === "room" ? `room:${entry.roomNo}` : entry.kind);
      const locKey = (loc: Loc) => (loc.spot === "room" ? `room:${loc.roomNo}` : loc.spot);
      const nodes = new Map<string, Plan>(everyRoom.map((entry) => [keyOf(entry), entry]));
      const stand = (entry: Plan): [number, number] => [entry.x0 + entry.w / 2, entry.z0 + entry.d / 2 + (entry.hall ? 0 : 1.4)];
      const edges = new Map<string, Array<{ to: string; via: Array<[number, number]> }>>();
      const joinNodes = (from: string, to: string, via: Array<[number, number]>) => {
        edges.set(from, [...(edges.get(from) ?? []), { to, via }]);
      };
      for (const link of links) {
        joinNodes(keyOf(link.a), keyOf(link.b), [[link.x, link.z]]);
        joinNodes(keyOf(link.b), keyOf(link.a), [[link.x, link.z]]);
      }
      const upper = nodes.get("landing");
      const lower = nodes.get("parlour");
      if (upstairs && upper && lower) {
        const sx = lower.x0 + lower.w / 2 + 3.6;
        const down: Array<[number, number]> = [[sx, upper.z0 + upper.d / 2], [sx, lower.z0 + 1.2]];
        joinNodes("landing", "parlour", down);
        joinNodes("parlour", "landing", [...down].reverse());
      }
      const route = (from: string, to: string) => {
        const prev = new Map<string, { from: string; via: Array<[number, number]> }>();
        const seen = new Set<string>([from]);
        const queue = [from];
        while (queue.length) {
          const cur = queue.shift() as string;
          if (cur === to) break;
          for (const edge of edges.get(cur) ?? []) {
            if (seen.has(edge.to)) continue;
            seen.add(edge.to);
            prev.set(edge.to, { from: cur, via: edge.via });
            queue.push(edge.to);
          }
        }
        if (!seen.has(to) || !nodes.has(from) || !nodes.has(to)) return null;
        const chain: Array<{ to: string; via: Array<[number, number]> }> = [];
        for (let cur = to; cur !== from; ) {
          const step = prev.get(cur) as { from: string; via: Array<[number, number]> };
          chain.unshift({ to: cur, via: step.via });
          cur = step.from;
        }
        const pts: Array<[number, number]> = [stand(nodes.get(from) as Plan)];
        for (const step of chain) pts.push(...step.via, stand(nodes.get(step.to) as Plan));
        return pts;
      };
      const home = nodes.get(locKey(at)) ?? everyRoom[0];
      const first = stand(home);
      me.position.set(first[0], 0.14, first[1]);
      me.scale.setScalar(0.78);
      board.add(me);
      if (walkTo) {
        const frontKey = studio ? "room:1" : "parlour";
        const toDoor = walkTo.spot === "door";
        const pts = route(nodes.has(locKey(at)) ? locKey(at) : keyOf(home), toDoor ? frontKey : locKey(walkTo));
        const front = nodes.get(frontKey);
        if (pts && toDoor && front) {
          const doorZ = front.z0 + front.d / 2 + Math.min(3.3, front.d / 2 - 2);
          pts.push([front.x0 + 1.4, doorZ], [front.x0 - 2.2, doorZ]);
        }
        if (pts && pts.length > 1) walkPts = pts;
        else walkFail = true;
      }
      board.position.z = -cursor / 2;
      span = Math.max(widest, cursor);
      lookY = 0.4;
    } else if (spot === "kitchen") {
      const size = roomSize("kitchen", beds, upstairs, duplex);
      shell(size.w, size.d, 3.5);
      kitchenFixtures();
      span = size.w * 0.88;
      dropItems(items.filter((entry) => entry.spot === "kitchen"), true);
      standX = 0.2;
      standZ = 1.8;
      roomDistance = 24;
    } else if (spot === "bathroom") {
      shell(9, 7.5, 3.2);
      bathFixtures();
      span = 9 * 1.05;
      standX = 0;
      standZ = 1.3;
      roomDistance = 16;
    } else if (spot === "landing") {
      const wide = duplex ? 18 : 15;
      shell(wide, 9, 3.4, false);
      add(piece(wood, 10, 0.14, 9, -4, 0.07, 0));
      flight(2.4, 1.2, true);
      doorFrames(wide);
      span = wide * 0.74;
      standX = -3.2;
      standZ = 1.4;
      roomDistance = 28;
    } else if (spot === "room") {
      const size = roomSize("room", beds, upstairs, duplex);
      shell(size.w, size.d, 3.5);
      if (beds <= 1 && !upstairs) frontDoor(size.w, size.d, false);
      const mine = items.filter((entry) => entry.spot === "room" && entry.roomNo === roomNo);
      if (!hasBedIn(mine)) mattress(-(size.w / 2 - 2), -(size.d / 2 - 2.2));
      const curtain = [0x1f6b45, 0xc4552a, 0x245c78, 0x7a3e6d][(roomNo - 1) % 4];
      add(piece(curtain, 0.35, 1.45, 0.06, size.w * 0.16 + 1.6, 2.05, -size.d / 2 + 0.15));
      dropItems(mine, true);
      span = size.w * 0.74;
      standX = size.w * 0.2;
      standZ = size.d / 2 - 1.6;
      roomDistance = beds <= 1 && !upstairs ? 26 : 22;
    } else {
      const size = roomSize("parlour", beds, upstairs, duplex);
      shell(size.w, size.d, 3.6);
      frontDoor(size.w, size.d, false);
      if (upstairs) flight(3.6, 2.4, false);
      dropItems(items.filter((entry) => entry.spot === "parlour"), true);
      span = size.w * 0.74;
      standX = size.w / 2 - 3;
      standZ = size.d / 2 - 1.6;
      roomDistance = duplex ? 34 : 28;
    }

    const baseDistance = roomDistance;
    if (!house && at.spot === spot && (spot !== "room" || at.roomNo === roomNo)) {
      me.position.set(standX, 0.0, standZ);
      spin.add(me);
    }
    const legs: number[] = [];
    let walkTotal = 0;
    if (walkPts) {
      for (let i = 1; i < walkPts.length; i += 1) {
        const len = Math.hypot(walkPts[i][0] - walkPts[i - 1][0], walkPts[i][1] - walkPts[i - 1][1]);
        legs.push(len);
        walkTotal += len;
      }
    }
    let walked = 0;
    let walkSent = false;
    let lastTick = performance.now();

    const marker = new THREE.Mesh(new THREE.BoxGeometry(1, 0.06, 1), new THREE.MeshBasicMaterial({ color: gold, transparent: true, opacity: 0.65 }));
    marker.visible = false;
    spin.add(marker);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 420);
    const aim = new THREE.Vector3(9, 11, 12).normalize();
    const fit = () => {
      const width = root.clientWidth || 1;
      const height = root.clientHeight || 1;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (house) roomDistance = Math.max((span * 1.25) / (0.536 * Math.min(camera.aspect, 1.7)), span * 1.1);
      else roomDistance = Math.min(58, Math.max(baseDistance, span / (0.536 * Math.min(camera.aspect, 1.7))));
    };
    fit();
    const detachControls = attachSceneCameraControls(root, rig, { minZoom: 0.7, maxZoom: 2.3, zoomSpeed: 0.08 });

    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const pointers = new Set<number>();
    let down: { x: number; y: number; t: number; multi: boolean } | null = null;
    const tap = (cx: number, cy: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      spin.updateMatrixWorld(true);
      const hits = ray.intersectObjects([...furn.values()], true);
      const picked = hits
        .map((hit) => {
          let node: THREE.Object3D | null = hit.object;
          while (node && !node.userData.key) node = node.parent;
          return node;
        })
        .filter((node): node is THREE.Object3D => Boolean(node));
      const chosen = picked.find((node) => node.userData.id !== "rug") ?? (live.current.selected ? null : picked[0] ?? null);
      if (!live.current.edit) {
        if (chosen && (spot === "parlour" || spot === "kitchen" || spot === "room")) {
          taps.current.select(chosen.userData.key as string);
          cbs.current.enter();
        }
        return;
      }
      if (chosen) {
        taps.current.select(chosen.userData.key as string);
        return;
      }
      if (!live.current.selected) return;
      const ground = ray.intersectObjects(floors, false)[0];
      if (!ground) return;
      const local = spin.worldToLocal(ground.point.clone());
      taps.current.drop(local.x, local.z);
    };
    const onDown = (event: PointerEvent) => {
      pointers.add(event.pointerId);
      if (pointers.size > 1) {
        if (down) down.multi = true;
      } else {
        down = { x: event.clientX, y: event.clientY, t: performance.now(), multi: false };
      }
    };
    const onUp = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      const start = down;
      if (pointers.size === 0) down = null;
      if (!start || start.multi) return;
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8 || performance.now() - start.t > 650) return;
      tap(event.clientX, event.clientY);
    };
    const onCancel = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      if (pointers.size === 0) down = null;
    };
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onCancel);

    let frame = 0;
    let alive = true;
    const loop = () => {
      if (!alive) return;
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastTick) / 1000);
      lastTick = now;
      if (walkPts && walkTotal > 0) {
        walked = Math.min(walkTotal, walked + dt * 2.4);
        let left = walked;
        let i = 0;
        while (i < legs.length - 1 && left > legs[i]) {
          left -= legs[i];
          i += 1;
        }
        const t = legs[i] > 0 ? Math.min(1, left / legs[i]) : 1;
        const [ax, az] = walkPts[i];
        const [bx, bz] = walkPts[i + 1];
        me.position.set(ax + (bx - ax) * t, 0.14 + Math.abs(Math.sin(walked * 3.2)) * 0.07, az + (bz - az) * t);
        if (bx !== ax || bz !== az) me.rotation.y = Math.atan2(bx - ax, bz - az);
        const limbs = me.userData.limbs as { legs: THREE.Group[]; arms: THREE.Group[] } | undefined;
        if (limbs && limbs.legs.length === 2 && limbs.arms.length === 2) {
          const swing = walked < walkTotal ? Math.sin(walked * 3.2) * 0.55 : 0;
          limbs.legs[0].rotation.x = swing;
          limbs.legs[1].rotation.x = -swing;
          limbs.arms[0].rotation.x = -swing * 0.8;
          limbs.arms[1].rotation.x = swing * 0.8;
        }
        if (walked >= walkTotal && !walkSent) {
          walkSent = true;
          cbs.current.walked();
        }
      } else if (walkFail && !walkSent) {
        walkSent = true;
        cbs.current.walked();
      }
      spin.rotation.y = rig.current.yaw;
      camera.position.copy(aim).multiplyScalar(roomDistance / rig.current.zoom);
      camera.lookAt(0, lookY, 0);
      const group = live.current.edit && live.current.selected ? furn.get(live.current.selected) : null;
      if (group) {
        const item = furnitureById(String(group.userData.id));
        marker.visible = Boolean(item);
        if (item) {
          marker.position.set(group.position.x, 0.17, group.position.z);
          marker.rotation.y = group.rotation.y;
          marker.scale.set(item.w + 0.4, 1, item.d + 0.4);
        }
      } else {
        marker.visible = false;
      }
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
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onCancel);
      detachControls();
      renderer.dispose();
      root.removeChild(renderer.domElement);
    };
  }, [placedKey, look, beds, upstairs, duplex, spot, roomNo, atKey, walkKey]);

  function turn(dir: number) {
    rig.current.yaw += dir * 0.55;
  }
  function dolly(factor: number) {
    rig.current.zoom = Math.min(2.3, Math.max(0.7, rig.current.zoom * factor));
  }
  function nudge(right: number, away: number) {
    if (!selected) return;
    const cur = currentOf(selected);
    if (!cur) return;
    const step = 0.5;
    const wx = right * 0.8 + away * -0.6;
    const wz = right * -0.6 + away * -0.8;
    const yaw = rig.current.yaw;
    push(selected, cur.x + (wx * Math.cos(yaw) - wz * Math.sin(yaw)) * step, cur.z + (wx * Math.sin(yaw) + wz * Math.cos(yaw)) * step, cur.rot);
  }
  function spinPiece(dir: number) {
    if (!selected) return;
    const cur = currentOf(selected);
    if (cur) push(selected, cur.x, cur.z, cur.rot + (dir * Math.PI) / 4);
  }

  const pad = "grid h-9 w-9 place-items-center rounded-full bg-white text-base font-semibold text-[#17241e] shadow disabled:opacity-40";
  const selectedItem = selected ? furnitureById(selected.split(":")[0]) : null;
  const bare = !edit && (spot === "parlour" || spot === "kitchen") && !placed.some((entry) => entry.spot === spot);
  return (
    <div className="absolute inset-0">
      <div ref={host} className="absolute inset-0 touch-none" />
      <div className="absolute right-3 top-32 z-10 flex flex-col gap-1">
        <button type="button" aria-label="Zoom in" onClick={() => dolly(1.18)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-semibold shadow">+</button>
        <button type="button" aria-label="Zoom out" onClick={() => dolly(1 / 1.18)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-semibold shadow">−</button>
        <button type="button" aria-label="Rotate left" onClick={() => turn(1)} className="mt-2 grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-semibold shadow">↺</button>
        <button type="button" aria-label="Rotate right" onClick={() => turn(-1)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-semibold shadow">↻</button>
      </div>
      {bare ? (
        <p className="pointer-events-none absolute inset-x-6 top-[42%] z-10 rounded-2xl bg-white/90 px-3 py-2 text-center text-xs font-semibold shadow">
          This {spot === "parlour" ? "parlour" : "kitchen"} is empty. Tap Shop to buy {spot === "parlour" ? "a sofa, a centre table, and a TV" : "a fridge and a cooker"}.
        </p>
      ) : null}
      {edit ? (
        <div className="absolute bottom-44 left-1/2 z-30 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl bg-[#17241e]/95 p-2 text-white shadow-xl">
          <p className="px-1 text-[11px] font-semibold text-[#e0b15a]">
            {selectedItem ? `${selectedItem.name}: tap the floor to put it there, or use the arrows.` : spot === "bathroom" || spot === "landing" || spot === "house" ? "Pick Parlour, Kitchen, or a Room to move furniture." : "Tap a piece of furniture to pick it up."}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <button type="button" aria-label="Move left" disabled={!selected} onClick={() => nudge(-1, 0)} className={pad}>←</button>
            <button type="button" aria-label="Move back" disabled={!selected} onClick={() => nudge(0, 1)} className={pad}>↑</button>
            <button type="button" aria-label="Move forward" disabled={!selected} onClick={() => nudge(0, -1)} className={pad}>↓</button>
            <button type="button" aria-label="Move right" disabled={!selected} onClick={() => nudge(1, 0)} className={pad}>→</button>
            <button type="button" aria-label="Turn piece left" disabled={!selected} onClick={() => spinPiece(1)} className={pad}>⟲</button>
            <button type="button" aria-label="Turn piece right" disabled={!selected} onClick={() => spinPiece(-1)} className={pad}>⟳</button>
            <button
              type="button"
              disabled={!selected || !draft || pending}
              onClick={() => {
                if (selected && draft) onKeep(selected, { x: draft.x, z: draft.z, rot: draft.rot });
              }}
              className="rounded-full bg-[#1f6b45] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
              Keep here
            </button>
            {selected && selectedItem ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!confirmSell) {
                    setConfirmSell(true);
                    return;
                  }
                  const key = selected;
                  setSelected(null);
                  setDraft(null);
                  setConfirmSell(false);
                  onSell(key);
                }}
                className="rounded-full bg-[#b4432f] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                {confirmSell ? `Tap again: sell for ${naira(Math.round(selectedItem.cost * 0.5))}` : `Sell · ${naira(Math.round(selectedItem.cost * 0.5))}`}
              </button>
            ) : null}
            <button type="button" onClick={onDone} className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#17241e]">Done</button>
          </div>
          {others.length && (spot === "parlour" || spot === "kitchen" || spot === "room") ? (
            <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-1">
              <span className="shrink-0 self-center text-[10px] text-[#cfe0c2]">Bring here:</span>
              {others.map((entry) => (
                <button key={entry.key} type="button" disabled={pending} onClick={() => onBring(entry.key)} className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold disabled:opacity-40">
                  {furnitureById(entry.id)?.name ?? entry.id} · {entry.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function HouseRoom({
  name,
  homeId,
  furniture,
  layout,
  pending,
  onBuy,
  onMove,
  onSell,
  look,
  beds,
  upstairs,
  duplex,
  onHouses,
  onSleep,
  onShower,
  onToilet,
  onOutside,
  entry = "look",
  shopNonce = 0,
}: {
  name: string;
  homeId: string;
  furniture: string[];
  layout: Record<string, Placement>;
  pending: boolean;
  onBuy: (itemId: string) => void;
  onMove: (key: string, placement: Placement) => void;
  onSell?: (key: string) => void;
  look?: LookId;
  beds: number;
  upstairs: boolean;
  duplex: boolean;
  onHouses?: () => void;
  onSleep?: () => void;
  onShower?: () => void;
  onToilet?: () => void;
  onOutside?: () => void;
  entry?: "look" | "shop";
  shopNonce?: number;
}) {
  const studio = beds <= 1 && !upstairs;
  const [shop, setShop] = useState(entry === "shop");
  const [edit, setEdit] = useState(false);
  const [group, setGroup] = useState<FurnitureGroup>("Parlour");
  const [spot, setSpot] = useState<HomeSpot>(studio ? "room" : "parlour");
  const [roomNo, setRoomNo] = useState(1);
  const [at, setAt] = useState<Loc>({ spot: studio ? "room" : "parlour", roomNo: 1 });
  const [walk, setWalk] = useState<{ to: Loc; then?: () => void } | null>(null);
  const sameLoc = (a: Loc, b: Loc) => a.spot === b.spot && (a.spot !== "room" || a.roomNo === b.roomNo);
  const placeName = (loc: Loc) => (loc.spot === "door" ? "the front door" : loc.spot === "room" ? (studio ? "the room" : `Room ${loc.roomNo}`) : loc.spot === "landing" ? "the landing" : `the ${loc.spot}`);
  function lookAt(s: HomeSpot, no = 1) {
    setWalk(null);
    setSpot(s);
    setRoomNo(no);
  }
  function walkTo(to: Loc, then?: () => void) {
    if (sameLoc(at, to)) {
      if (to.spot !== "door") lookAt(to.spot, to.roomNo);
      then?.();
      return;
    }
    setSpot("house");
    setWalk({ to, then });
  }
  function arrived() {
    if (!walk) return;
    const done = walk;
    if (done.to.spot === "door") {
      setWalk(null);
      done.then?.();
      return;
    }
    setAt(done.to);
    setWalk(null);
    setSpot(done.to.spot as HomeSpot);
    setRoomNo(done.to.roomNo);
    done.then?.();
  }
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
  const all = furnitureInstances(furniture).filter((piece) => Boolean(layout[piece.key]));
  const placed: PlacedPiece[] = all
    .filter((piece) => layout[piece.key].homeId === homeId)
    .map((piece) => ({ key: piece.key, id: piece.id, spot: layout[piece.key].spot, roomNo: layout[piece.key].roomNo, x: layout[piece.key].x, z: layout[piece.key].z, rot: layout[piece.key].rot }));
  const furnishable = spot === "parlour" || spot === "kitchen" || spot === "room";
  const roomName = (s: FurnitureSpot, no: number) => (s === "room" ? (studio ? "Room" : `Room ${no}`) : s === "parlour" ? "Parlour" : "Kitchen");
  const others: OtherPiece[] = furnishable
    ? all
        .filter((piece) => {
          const at = layout[piece.key];
          return at.homeId !== homeId || at.spot !== spot || (spot === "room" && at.roomNo !== roomNo);
        })
        .map((piece) => {
          const at = layout[piece.key];
          return { key: piece.key, id: piece.id, label: at.homeId === homeId ? roomName(at.spot, at.roomNo) : homeById(at.homeId).name };
        })
    : [];
  const chip = (active: boolean) => `rounded-full px-3 py-1 text-[10px] font-semibold shadow ${active ? "bg-[#17241e] text-white" : "bg-white"}`;

  function bring(key: string) {
    const piece = all.find((entryPiece) => entryPiece.key === key);
    const item = piece ? furnitureById(piece.id) : null;
    if (!piece || !item || !furnishable) return;
    const home = homeById(homeId);
    const where = placeIn(item, home, spot, spot === "room" ? roomNo : 1, 0);
    onMove(key, where);
  }

  return (
    <section className="relative h-full min-h-[28rem] overflow-hidden bg-[#cfe0c2] text-[#17241e]">
      <RoomView
        placed={placed}
        others={others}
        look={look ?? "chidi"}
        beds={beds}
        upstairs={upstairs}
        duplex={duplex}
        spot={spot}
        roomNo={roomNo}
        edit={edit}
        pending={pending}
        onKeep={(key, at) => {
          const current = layout[key];
          if (current) onMove(key, { ...current, x: at.x, z: at.z, rot: at.rot });
        }}
        onBring={bring}
        onDone={() => setEdit(false)}
        onSell={(key) => onSell?.(key)}
        onEdit={() => setEdit(true)}
        at={at}
        walkTo={walk ? walk.to : null}
        onWalked={arrived}
      />
      {walk ? (
        <div className="absolute bottom-[15.5rem] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#17241e]/95 px-3 py-2 text-xs font-semibold text-white shadow-lg">
          <span>Walking to {placeName(walk.to)}…</span>
          <button type="button" onClick={arrived} className="rounded-full bg-white px-2.5 py-1 text-[11px] text-[#17241e]">Skip</button>
        </div>
      ) : spot !== "house" && !sameLoc(at, { spot, roomNo }) ? (
        <button
          type="button"
          onClick={() => walkTo({ spot, roomNo })}
          className="absolute bottom-[15.5rem] left-1/2 z-30 -translate-x-1/2 rounded-full bg-[#e0b15a] px-6 py-2.5 text-sm font-semibold text-[#17241e] shadow-lg"
        >
          Come here
        </button>
      ) : null}
      <p className="pointer-events-none absolute left-3 top-20 z-10 rounded-full bg-white px-3 py-2 text-xs font-semibold shadow">{name}</p>
      <div className="absolute left-2 right-16 top-32 z-30 flex flex-wrap gap-1">
        {onSleep ? (
          <button type="button" disabled={pending || Boolean(walk)} onClick={() => walkTo(at.spot === "room" ? at : { spot: "room", roomNo: 1 }, onSleep)} className="rounded-full bg-[#17241e] px-3 py-1 text-[10px] font-semibold text-white shadow disabled:opacity-40">Sleep</button>
        ) : null}
        {onShower ? (
          <button type="button" disabled={pending || Boolean(walk)} onClick={() => walkTo({ spot: "bathroom", roomNo: 1 }, onShower)} className="rounded-full bg-[#245c78] px-3 py-1 text-[10px] font-semibold text-white shadow disabled:opacity-40">Shower</button>
        ) : null}
        {onToilet ? (
          <button
            type="button"
            disabled={pending || Boolean(walk)}
            onClick={() => walkTo({ spot: "bathroom", roomNo: 1 }, onToilet)}
            className="rounded-full bg-[#7a5a2a] px-3 py-1 text-[10px] font-semibold text-white shadow disabled:opacity-40"
          >
            Toilet
          </button>
        ) : null}
        {onOutside ? (
          <button type="button" disabled={pending || Boolean(walk)} onClick={() => walkTo({ spot: "door", roomNo: 1 }, onOutside)} className="rounded-full bg-[#a9782a] px-3 py-1 text-[10px] font-semibold text-white shadow disabled:opacity-40">Step outside</button>
        ) : null}
        {upstairs ? (
          at.spot === "landing" || at.spot === "room" ? (
            <button type="button" disabled={pending || Boolean(walk)} onClick={() => walkTo({ spot: "parlour", roomNo: 1 })} className="rounded-full bg-[#e0b15a] px-3 py-1 text-[10px] font-semibold text-[#17241e] shadow disabled:opacity-40">Go downstairs</button>
          ) : (
            <button type="button" disabled={pending || Boolean(walk)} onClick={() => walkTo({ spot: "landing", roomNo: 1 })} className="rounded-full bg-[#e0b15a] px-3 py-1 text-[10px] font-semibold text-[#17241e] shadow disabled:opacity-40">Go upstairs</button>
          )
        ) : null}
        <button type="button" onClick={() => lookAt("house")} className={chip(spot === "house")}>Full house</button>
        {!studio ? (
          <>
            <button type="button" onClick={() => lookAt("parlour")} className={chip(spot === "parlour")}>Parlour</button>
            <button type="button" onClick={() => lookAt("kitchen")} className={chip(spot === "kitchen")}>Kitchen</button>
          </>
        ) : null}
        <button type="button" onClick={() => lookAt("bathroom")} className={chip(spot === "bathroom")}>Bathroom</button>
        {upstairs ? <button type="button" onClick={() => lookAt("landing")} className={chip(spot === "landing")}>Upstairs</button> : null}
        {Array.from({ length: Math.max(beds, 1) }, (_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => lookAt("room", index + 1)}
            className={chip(spot === "room" && roomNo === index + 1)}
          >
            {studio ? "Room" : `Room ${index + 1}`}
          </button>
        ))}
      </div>
      {!edit ? (
        <div className="absolute bottom-44 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {onHouses ? (
            <button type="button" onClick={onHouses} className="rounded-full bg-[#1f6b45] px-4 py-2.5 text-sm font-semibold text-white shadow-lg">Houses</button>
          ) : null}
          <button type="button" onClick={() => setShop(true)} className="rounded-full bg-[#17241e] px-4 py-2.5 text-sm font-semibold text-white shadow-lg">Shop</button>
          <button
            type="button"
            onClick={() => {
              if (!furnishable) setSpot(studio ? "room" : "parlour");
              setEdit(true);
            }}
            className="rounded-full bg-[#a9782a] px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
          >
            Move furniture
          </button>
        </div>
      ) : null}
      {shop && typeof document !== "undefined" ? createPortal(
      <div className="ol-modal ol-sheet fixed inset-x-0 bottom-0 max-h-[52%] overflow-y-auto rounded-t-[1.8rem] pb-24 text-[#17241e]" style={{ zIndex: 200 }}>
        <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-[#e0b15a]" />
        <div className="flex items-center justify-between px-4 pt-2">
          <p className="font-display text-xl leading-none">Shop · {name}</p>
          <button type="button" aria-label="Close shop" onClick={() => setShop(false)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-lg leading-none shadow-sm">×</button>
        </div>
        <p className="px-4 pt-1 text-xs text-[#5d6b62]">Things you buy go straight into this house. Then tap Move furniture to place them.</p>
        <div className="flex gap-2 overflow-x-auto px-4 py-2">
          {FURNITURE_GROUPS.map((item) => (
            <button key={item} type="button" onClick={() => setGroup(item)} className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${group === item ? "bg-[#17241e] text-white" : "bg-[#f4efe4]"}`}>
              {item}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 overflow-y-auto px-4 pb-4 sm:grid-cols-3">
          {stock.map((item) => {
            const count = furniture.filter((id) => id === item.id).length;
            return (
              <button
                key={item.id}
                type="button"
                disabled={pending || count >= 6}
                onClick={() => onBuy(item.id)}
                className="rounded-2xl bg-white p-3 text-left shadow-sm disabled:opacity-50"
              >
                <span className="block text-sm font-semibold">{item.name}</span>
                <span className="mt-1 block text-sm font-semibold text-[#1f6b45]">{naira(item.cost)}</span>
                {count ? <span className="block text-[11px] text-[#5d6b62]">You have {count}</span> : null}
              </button>
            );
          })}
        </div>
      </div>,
      document.body,
      ) : null}
    </section>
  );
}
