"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { DORIME_AMOUNTS, HOTEL_RATE, LOOKS, TREATMENT_FEE, npcsAt, placeActs, placeById, sprayFloor } from "@/lib/game/content";
import type { Place } from "@/lib/game/content";
import { naira } from "@/lib/game/format";
import type { LookId, TravelMode } from "@/lib/game/types";

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
      className={`absolute z-10 border-0 bg-transparent p-0 ${dim ? "opacity-50" : ""}`}
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

function ClubFloor({
  username,
  people,
  shout,
  service,
  besideId,
  selfId,
  dancing,
  onPick,
}: {
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
    <div className="ol-stage relative h-96 overflow-hidden bg-[radial-gradient(circle_at_50%_8%,#6a3478,#120810_55%)]">
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
      <ZoomStage>
      <div className="ol-spot left-4 top-0" />
      <div className="ol-spot right-6 top-0" style={{ animationDelay: "1.1s", background: "linear-gradient(rgba(80,140,255,.4), transparent 80%)" }} />
      <div className="ol-world">
        <div className="absolute left-1/2 top-16 w-40 -translate-x-1/2">
          <div className="ol-booth mx-auto" />
          <div className="absolute -left-6 -top-10 text-center">
            <Human look="ada" className="mx-auto h-9 w-5" />
            <span className="text-[9px] font-semibold">DJ</span>
          </div>
          <div className="group absolute -right-8 -top-10 text-center">
            <Human look="ibe" className="mx-auto h-9 w-5" />
            <span className="text-[9px] font-semibold">Hypeman</span>
            <span className={`ol-tip ${service ? "ol-tip-on" : ""}`}>Make some noise for {shout}</span>
          </div>
        </div>
        <div className="ol-floor">
          <div className="ol-pad left-[28%] top-[46%]" />
        </div>
      </div>
      <div className="absolute inset-0">
        {CLUB_TABLES.map((table) => (
          <div key={`${table.x}-${table.y}`} className="ol-table" style={{ left: `${table.x}%`, top: `${table.y}%` }} />
        ))}
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
      </ZoomStage>
    </div>
  );
}

function RoomScene({
  look,
  kind,
  people,
  besideId,
  selfId,
  onPick,
}: {
  look: LookId;
  kind: Place["kind"];
  people: Array<{ id: string; name: string; look: LookId | null }>;
  besideId: string | null;
  selfId: string;
  onPick: (id: string) => void;
}) {
  const scene = sceneFor(kind);
  const spots = new Map(people.map((person) => [person.id, spotFor(person.name)]));
  if (besideId && spots.has(besideId) && spots.has(selfId)) {
    const host = spots.get(besideId)!;
    spots.set(selfId, { left: `${parseFloat(host.left) + 8}%`, top: host.top });
  }
  return (
    <div className={`ol-stage relative h-80 overflow-hidden ${scene.sky}`}>
      <ZoomStage>
      <div className="ol-world">
        {scene.set}
        <div className={`ol-floor ${scene.floor}`} />
      </div>
      <div className="absolute inset-0">
        {people.map((person) => (
          <PersonPin
            key={person.id}
            name={person.name}
            look={lookFrom(person.id, person.look ?? look)}
            style={spots.get(person.id) ?? spotFor(person.name)}
            onClick={() => onPick(person.id)}
          />
        ))}
      </div>
      </ZoomStage>
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
  onTake: (npcId: string, asking: number, hotelId: string) => Promise<{ ok: boolean }>;
}) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [miss, setMiss] = useState<string | null>(null);
  const picked = people.find((person) => person.id === chosen) ?? null;

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
                if (!meets) {
                  setChosen(null);
                  setMiss(`${person.name} asks ${naira(person.asking)}. Check someone whose price you can meet.`);
                  return;
                }
                setMiss(null);
                setChosen(person.id);
              }}
            />
          );
        })}
      </div>
      </ZoomStage>
      {miss ? <p className="absolute inset-x-3 bottom-3 rounded-2xl bg-[#fffaf2] px-3 py-2 text-xs text-[#17241e]">{miss}</p> : null}
      {picked ? (
        <div className="fixed inset-0 z-40 grid place-items-end bg-black/55 p-3">
          <div className="w-full max-w-md rounded-3xl bg-[#fffaf2] p-4 text-[#17241e]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a9782a]">She agrees</p>
            <h3 className="font-display text-2xl">{picked.name}</h3>
            <p className="mt-1 text-sm text-[#5d6b62]">Her price is {naira(picked.asking)}. Choose the hotel. The scene fades to black. Nothing explicit is shown. Topped-up naira cannot pay.</p>
            <div className="mt-3 grid gap-2">
              {Object.entries(HOTEL_RATE).map(([id, rate]) => (
                <button
                  key={id}
                  type="button"
                  disabled={pending}
                  onClick={async () => {
                    const result = await onTake(picked.id, picked.asking, id);
                    if (!result.ok) return;
                    setChosen(null);
                  }}
                  className="flex items-center justify-between rounded-2xl bg-white px-3 py-3 text-left text-sm disabled:opacity-40"
                >
                  <span className="font-semibold">{placeById(id).name}</span>
                  <span>Hour {naira(rate.hour)}</span>
                </button>
              ))}
            </div>
            <button type="button" className="mt-3 text-sm text-[#5d6b62]" onClick={() => setChosen(null)}>Check someone else</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ParkedCar({ className, color }: { className: string; color: string }) {
  return (
    <div className={`absolute bottom-3 ${className}`} aria-hidden>
      <div className="relative h-8 w-16 rounded-t-xl rounded-b-md" style={{ background: color }}>
        <div className="absolute left-3 top-1 h-3 w-6 rounded-t-md bg-[#d7e7f5]/80" />
        <div className="absolute -bottom-1 left-1 h-3 w-3 rounded-full bg-[#1a1a1a]" />
        <div className="absolute -bottom-1 right-1 h-3 w-3 rounded-full bg-[#1a1a1a]" />
      </div>
    </div>
  );
}

function Ride({ mode }: { mode: TravelMode }) {
  if (mode === "okada") {
    return (
      <div className="relative h-10 w-14">
        <div className="absolute bottom-0 left-0 h-3 w-3 rounded-full bg-[#111]" />
        <div className="absolute bottom-0 right-1 h-3 w-3 rounded-full bg-[#111]" />
        <div className="absolute bottom-2 left-2 h-2 w-10 rounded-full bg-[#c4552a]" />
        <div className="absolute bottom-4 left-6 h-4 w-3 rounded-sm bg-[#222]" />
      </div>
    );
  }
  if (mode === "keke") {
    return (
      <div className="relative h-12 w-16">
        <div className="absolute bottom-2 left-1 h-8 w-12 rounded-t-lg bg-[#f2c14e]" />
        <div className="absolute bottom-4 left-3 h-4 w-6 rounded-sm bg-[#17324d]/80" />
        <div className="absolute bottom-0 left-1 h-3 w-3 rounded-full bg-[#111]" />
        <div className="absolute bottom-0 right-2 h-3 w-3 rounded-full bg-[#111]" />
        <div className="absolute bottom-0 left-6 h-3 w-3 rounded-full bg-[#111]" />
      </div>
    );
  }
  const color = mode === "cab" ? "#f4d35e" : mode === "car" ? "#1f6b45" : "#245c78";
  return (
    <div className="relative h-12 w-24">
      <div className="absolute bottom-2 h-7 w-24 rounded-t-2xl rounded-b-md" style={{ background: color }}>
        <div className="absolute left-3 top-1 h-3 w-8 rounded-t-md bg-[#e7f3fb]" />
        <div className="absolute right-3 top-1 h-3 w-6 rounded-t-md bg-[#e7f3fb]" />
      </div>
      <div className="absolute bottom-0 left-2 h-4 w-4 rounded-full bg-[#111]" />
      <div className="absolute bottom-0 right-2 h-4 w-4 rounded-full bg-[#111]" />
    </div>
  );
}

export function ArrivalScene({
  placeId,
  ride,
  look,
  pending,
  onEnter,
  onLeave,
}: {
  placeId: string;
  ride: TravelMode;
  look: LookId;
  pending: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const place = placeById(placeId);
  const [ready, setReady] = useState(false);
  const onFoot = ride === "trek";
  const night = place.kind === "nightlife" || place.kind === "hotel" || place.kind === "pickup";

  return (
    <section className={`overflow-hidden rounded-[1.6rem] ${night ? "bg-[#141820]" : "bg-[#d7ebdd]"} text-white`}>
      <div className={`relative h-28 ${night ? "bg-gradient-to-b from-[#2a1a3a] to-[#141820]" : "bg-gradient-to-b from-[#9fd0ea] to-[#d7ebdd]"}`}>
        <div className={`absolute inset-x-6 bottom-0 h-16 rounded-t-xl ${night ? "bg-[#2c1810]" : "bg-[#f4efe4]"}`}>
          <div className="mx-auto mt-3 w-fit rounded-full bg-[#e0b15a] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1a140c]">
            {place.name}
          </div>
          <div className="mx-auto mt-2 h-8 w-10 rounded-t-md bg-[#0e1c16]" />
        </div>
      </div>
      <div className={`relative h-28 ${night ? "bg-[#2a241c]" : "bg-[#cbb892]"}`}>
        <ParkedCar className="left-2" color="#6d6256" />
        <ParkedCar className="left-20" color="#8c3d2f" />
        <ParkedCar className="right-3" color="#243044" />
        <div className={`absolute bottom-2 left-1/2 ${onFoot ? "ol-on-foot" : "ol-ride"}`}>
          {onFoot ? null : <Ride mode={ride} />}
          <PersonFigure look={look} className={`absolute bottom-0 left-2 h-16 w-10 ${onFoot ? "" : "ol-walker"}`} />
        </div>
      </div>
      <div
        className={`ol-choices flex gap-2 bg-[#0e1c16] p-3 ${ready ? "ol-ready" : ""}`}
        onAnimationEnd={(event) => {
          if (event.animationName === "ol-rise") setReady(true);
        }}
      >
        <button
          type="button"
          disabled={pending}
          onClick={onEnter}
          className="flex-1 rounded-full bg-[#e0b15a] py-3 text-sm font-semibold text-[#1a140c] disabled:opacity-40"
        >
          Enter
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onLeave}
          className="flex-1 rounded-full border border-white/20 py-3 text-sm font-semibold disabled:opacity-40"
        >
          Leave
        </button>
      </div>
    </section>
  );
}

function HotelRoom({ look, lying, onDone }: { look: LookId; lying: boolean; onDone: () => void }) {
  return (
    <div className="relative h-80 overflow-hidden bg-[radial-gradient(circle_at_50%_0%,#6a5344,#14110e_68%)]">
      <div className="absolute left-1/2 top-5 h-16 w-28 -translate-x-1/2 rounded-b-2xl bg-[#c5e4ef]/35" />
      <div className="absolute inset-x-8 bottom-6 h-32 rounded-t-[2rem] bg-[#4a3428] shadow-2xl">
        <div className="absolute left-5 top-4 h-10 w-16 rounded-xl bg-[#f6f1e6]" />
        <div className="absolute inset-x-3 bottom-3 h-10 rounded-xl bg-[#6a4a38]" />
      </div>
      <div className={`absolute bottom-28 left-[34%] ${lying ? "ol-lie" : ""}`} onAnimationEnd={() => { if (lying) onDone(); }}>
        <Human look={look} className="h-24 w-12" />
      </div>
    </div>
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
  onOffer: (npcId: string, offer: number, hotelId: string) => Promise<{ ok: boolean }>;
  onOutside: () => void;
  spendable: number;
  room: "hour" | "night" | null;
  onSleep: () => void;
  onLeaveRoom: () => void;
  onTreat: () => void;
  sick: "none" | "mild" | "severe";
}) {
  const acts = placeActs(place);
  const [notes, setNotes] = useState<Array<{ id: number; count: number }>>([]);
  const [sprayText, setSprayText] = useState("");
  const [dark, setDark] = useState(false);
  const [shout, setShout] = useState(username);
  const [service, setService] = useState(0);
  const [dancing, setDancing] = useState(false);
  const [lying, setLying] = useState(false);
  const slept = useRef(false);
  const club = acts.dance;
  const inRoom = Boolean(room);
  const listed = npcsAt(place.id).filter((npc) => npc.asking);
  const ward = npcsAt(place.id);
  const clinician = ward.find((npc) => npc.role === "Doctor") ?? ward.find((npc) => npc.role === "Nurse" || npc.role === "Chemist");
  const clinic = place.kind === "health" || place.id === "eke-ukwu";
  const treatPrice = TREATMENT_FEE[place.id] ?? null;

  return (
    <section className="relative overflow-hidden rounded-[1.6rem] bg-[#120c18] text-[#f6f1e6]">
      {clinic && treatPrice != null ? (
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
      <div className="relative">
        {inRoom ? (
          <HotelRoom
            look={look}
            lying={lying}
            onDone={() => {
              if (slept.current) return;
              slept.current = true;
              onSleep();
            }}
          />
        ) : club ? (
          <ClubFloor username={username} people={people} shout={shout} service={service} besideId={besideId} selfId={selfId} dancing={dancing} onPick={onPickPerson} />
        ) : acts.pickup ? (
          <PickupStreet
            people={listed.map((npc) => ({ id: npc.id, name: npc.name, asking: npc.asking ?? 0 }))}
            spendable={spendable}
            pending={pending}
            onTake={async (npcId, asking, hotelId) => {
              const result = await onOffer(npcId, asking, hotelId);
              if (result.ok) {
                setDark(true);
                window.setTimeout(() => setDark(false), 2600);
              }
              return result;
            }}
          />
        ) : (
          <>
            <RoomScene look={look} kind={place.kind} people={people} besideId={besideId} selfId={selfId} onPick={onPickPerson} />
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
      <div className="grid gap-2 p-3">
        {!inRoom && club ? (
          <div className="grid grid-cols-2 gap-2">
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
                className="rounded-full bg-[#e0b15a] py-2 text-xs font-semibold text-[#1a140c] disabled:opacity-40"
              >
                Do dorime · {naira(amount)}
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
            className="rounded-full border border-white/20 py-2 text-sm font-semibold disabled:opacity-40"
          >
            {dancing ? "Still dancing" : "Dance"}
          </button>
        ) : null}
        {!inRoom && acts.spray ? (
          <form
            className="grid grid-cols-[1fr_auto] gap-2"
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
              className="rounded-full border border-[#e0b15a]/50 bg-transparent px-3 py-2 text-sm text-[#f6f1e6]"
            />
            <button disabled={pending} className="rounded-full border border-[#e0b15a]/50 px-4 text-xs font-semibold text-[#e0b15a] disabled:opacity-40">
              Spray
            </button>
          </form>
        ) : null}
        {inRoom ? (
          <div className="grid gap-2">
            <button
              type="button"
              disabled={pending || lying}
              onClick={() => {
                if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                  if (slept.current) return;
                  slept.current = true;
                  onSleep();
                  return;
                }
                setLying(true);
              }}
              className="rounded-full bg-[#e0b15a] py-2 text-sm font-semibold text-[#1a140c] disabled:opacity-40"
            >
              Lie down and sleep
            </button>
            <button type="button" disabled={pending} onClick={onLeaveRoom} className="text-xs text-[#d5e4d8]">
              Leave the room
            </button>
          </div>
        ) : acts.hotel ? (
          <div className="grid grid-cols-2 gap-2">
            <button disabled={pending} onClick={() => onBook("hour")} className="rounded-full bg-white/10 py-2 text-xs font-semibold disabled:opacity-40">
              Hour · {naira(acts.hotel.hour)}
            </button>
            <button disabled={pending} onClick={() => onBook("night")} className="rounded-full bg-white/10 py-2 text-xs font-semibold disabled:opacity-40">
              Night · {naira(acts.hotel.night)}
            </button>
          </div>
        ) : null}
        {acts.pickup ? <p className="text-xs text-[#d5e4d8]">The price sits on her head. If you can meet it, she goes with you and you pick the hotel. If you cannot, check the others.</p> : null}
        <button
          type="button"
          onClick={() => {
            setDancing(false);
            onOutside();
          }}
          className="text-xs text-[#d5e4d8]"
        >
          Step outside
        </button>
      </div>
      {dark ? (
        <div className="ol-fade absolute inset-0 grid place-items-center bg-black text-center">
          <p className="font-display text-3xl">Two hours later…</p>
        </div>
      ) : null}
    </section>
  );
}
