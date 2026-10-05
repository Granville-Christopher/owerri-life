import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { readDb } from "./store";

const COOKIE = "ol_session";

function secret() {
  return process.env.SESSION_SECRET || "owerri-life-local-dev-secret";
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 32);
  const prev = Buffer.from(hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
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
