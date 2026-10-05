import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { readDb } from "./store";

const COOKIE = "ol_session";

const COST = 32768;
const SCRYPT = { r: 8, p: 1, maxmem: 64 * 1024 * 1024 } as const;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Set SESSION_SECRET to a long random string in the host environment.");
  }
  return "owerri-life-local-dev-secret";
}

function scrypt(password: string, salt: string, cost: number) {
  return scryptSync(password, salt, 32, { ...SCRYPT, cost });
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scrypt(password, salt, COST).toString("hex");
  return `2:${COST}:${salt}:${hash}`;
}

let dummy: string | null = null;

function dummyHash() {
  dummy ??= hashPassword("not-a-real-password");
  return dummy;
}

export function verifyPassword(password: string, stored: string) {
  const parts = stored.split(":");
  let cost = 16384;
  let salt = "";
  let hash = "";
  if (parts.length === 4 && parts[0] === "2") {
    cost = Number(parts[1]);
    salt = parts[2] ?? "";
    hash = parts[3] ?? "";
  } else if (parts.length === 2) {
    salt = parts[0] ?? "";
    hash = parts[1] ?? "";
  } else {
    return false;
  }
  if (!salt || !hash || !Number.isInteger(cost) || cost < 16384 || cost > 262144) return false;
  const next = scrypt(password, salt, cost);
  const prev = Buffer.from(hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

export function needsUpgrade(stored: string) {
  return !stored.startsWith("2:");
}

const strikes = new Map<string, { count: number; until: number }>();

export function authBlocked(key: string) {
  const row = strikes.get(key);
  if (!row) return null;
  if (row.count >= 8 && row.until > Date.now()) return "Too many tries. Wait 15 minutes and try again.";
  if (row.until && row.until <= Date.now()) strikes.delete(key);
  return null;
}

export function authFailed(key: string) {
  const row = strikes.get(key) ?? { count: 0, until: 0 };
  row.count += 1;
  if (row.count >= 8) row.until = Date.now() + 15 * 60 * 1000;
  strikes.set(key, row);
  if (strikes.size > 500) {
    const first = strikes.keys().next().value;
    if (first) strikes.delete(first);
  }
}

export function authCleared(key: string) {
  strikes.delete(key);
}

export function burnPasswordCheck(password: string) {
  verifyPassword(password, dummyHash());
}

function sign(id: string) {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 30;
  const body = `${id}.${exp}`;
  const sig = createHmac("sha256", secret()).update(body).digest("hex");
  return `${body}.${sig}`;
}

function readToken(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  const body = `${id}.${exp}`;
  const expected = createHmac("sha256", secret()).update(body).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(exp) < Date.now()) return null;
  return id;
}

export async function setSession(id: string) {
  const jar = await cookies();
  jar.set(COOKIE, sign(id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function sessionPlayerId() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return readToken(token);
}

export async function currentPlayer() {
  const id = await sessionPlayerId();
  if (!id) return null;
  const db = await readDb();
  return db.players.find((player) => player.id === id) ?? null;
}
