import { createHash } from "crypto";
import { Binary } from "mongodb";
import { mongoDb } from "./store";

const limits = new Map<string, { n: number; reset: number }>();

export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const row = limits.get(key);
  if (!row || row.reset <= now) {
    limits.set(key, { n: 1, reset: now + windowMs });
    if (limits.size > 5000) {
      const first = limits.keys().next().value;
      if (first) limits.delete(first);
    }
    return null;
  }
  row.n += 1;
  if (row.n > max) return "Slow down a moment and try again.";
  return null;
}

export type VoiceDoc = {
  _id: string;
  box: string;
  fromId: string;
  mime: string;
  bytes: Binary;
  createdAt: Date;
};

let voiceReady = false;

export async function voiceCollection() {
  const col = mongoDb().collection<VoiceDoc>("voice");
  if (!voiceReady) {
    await col.createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 14 });
    voiceReady = true;
  }
  return col;
}

export type SpaceRole = "host" | "speaker" | "listener";

export type SpaceMember = {
  id: string;
  name: string;
  role: SpaceRole;
  seenAt: string;
  muted?: boolean;
};

export type SpaceDoc = {
  _id: string;
  title: string;
  hostId: string;
  hostName: string;
  createdAt: string;
  ended: boolean;
  members: SpaceMember[];
};

let spaceReady = false;

export async function spaceCollection() {
  const col = mongoDb().collection<SpaceDoc>("spaces");
  if (!spaceReady) {
    await col.createIndex({ ended: 1, createdAt: -1 });
    spaceReady = true;
  }
  return col;
}

const STALE_MS = 10 * 60 * 1000;
const HOST_STALE_MS = 10 * 60 * 1000;

export function sweepSpace(space: SpaceDoc, now = Date.now()) {
  space.members = space.members.filter((member) => {
    const age = now - Date.parse(member.seenAt);
    if (Number.isNaN(age)) return false;
    if (member.role === "host") return age < HOST_STALE_MS;
    return age < STALE_MS;
  });
  const hostGone = !space.members.some((member) => member.id === space.hostId);
  if (hostGone && now - Date.parse(space.createdAt) > HOST_STALE_MS) space.ended = true;
}

export const SPEAKER_CAP = 16;
export const ROOM_CAP = 200;
export const VOICE_MAX_BYTES = 500_000;

export function agoraUid(playerId: string) {
  const digest = createHash("sha256").update(playerId).digest();
  return (digest.readUInt32BE(0) % 2_147_483_646) + 1;
}

export function audioMime(bytes: Buffer, claimed: string) {
  const base = claimed.split(";")[0]?.trim().toLowerCase() ?? "";
  const allowed = new Set(["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav", "audio/x-m4a"]);
  if (!allowed.has(base)) return null;
  if (bytes.length < 12 || bytes.length > VOICE_MAX_BYTES) return null;
  const head = bytes.subarray(0, 12);
  const webm = head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3;
  const ogg = head.subarray(0, 4).toString("ascii") === "OggS";
  const wav = head.subarray(0, 4).toString("ascii") === "RIFF";
  const mp4 = head.subarray(4, 8).toString("ascii") === "ftyp";
  const mp3 = (head[0] === 0xff && (head[1] & 0xe0) === 0xe0) || head.subarray(0, 3).toString("ascii") === "ID3";
  if (base === "audio/webm" && !webm) return null;
  if (base === "audio/ogg" && !ogg) return null;
  if (base === "audio/wav" && !wav) return null;
  if ((base === "audio/mp4" || base === "audio/x-m4a") && !mp4) return null;
  if (base === "audio/mpeg" && !mp3) return null;
  return base === "audio/x-m4a" ? "audio/mp4" : base;
}
