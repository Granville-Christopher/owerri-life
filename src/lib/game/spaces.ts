"use server";

import { randomBytes } from "crypto";
import { siteUrl } from "@/lib/site";
import { currentPlayer } from "./auth";
import { ROOM_CAP, SPEAKER_CAP, rateLimit, spaceCollection, sweepSpace, type SpaceDoc, type SpaceRole } from "./live";

export type SpaceView = {
  code: string;
  title: string;
  hostId: string;
  hostName: string;
  ended: boolean;
  link: string;
  members: Array<{ id: string; name: string; role: SpaceRole; muted: boolean }>;
};

function freshCode() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(8);
  let out = "";
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return out;
}

function cleanTitle(raw: string) {
  const title = raw.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 60);
  if (title.length < 2) return null;
  return title;
}

function viewOf(space: SpaceDoc): SpaceView {
  return {
    code: space._id,
    title: space.title,
    hostId: space.hostId,
    hostName: space.hostName,
    ended: space.ended,
    link: `${siteUrl()}/space/${space._id}`,
    members: space.members.map((member) => ({ id: member.id, name: member.name, role: member.role, muted: Boolean(member.muted) })),
  };
}

async function signedIn() {
  const player = await currentPlayer();
  if (!player || player.banned) return null;
  return player;
}

function codeOf(raw: string) {
  const code = raw.trim().toLowerCase();
  if (!/^[a-z0-9]{8}$/.test(code)) return null;
  return code;
}

export async function listSpaces() {
  const player = await signedIn();
  if (!player) return { ok: false as const, error: "Sign in first.", spaces: [] as SpaceView[] };
  const col = await spaceCollection();
  const rows = await col.find({ ended: false }).sort({ createdAt: -1 }).limit(40).toArray();
  const spaces: SpaceView[] = [];
  for (const row of rows) {
    const before = row.members.length;
    sweepSpace(row);
    if (row.ended || row.members.length !== before) {
      await col.updateOne({ _id: row._id }, { $set: { ended: row.ended, members: row.members } });
    }
    if (!row.ended) spaces.push(viewOf(row));
  }
  return { ok: true as const, spaces };
}

export async function createSpace(titleRaw: string) {
  const player = await signedIn();
  if (!player) return { ok: false as const, error: "Sign in first." };
  const limited = rateLimit(`space-new:${player.id}`, 5, 10 * 60 * 1000);
  if (limited) return { ok: false as const, error: limited };
  const title = cleanTitle(titleRaw);
  if (!title) return { ok: false as const, error: "Give the space a name." };
  const col = await spaceCollection();
  const hosting = await col.countDocuments({ hostId: player.id, ended: false });
  if (hosting >= 3) return { ok: false as const, error: "End a space you already opened before starting another." };
  const now = new Date().toISOString();
  const doc: SpaceDoc = {
    _id: freshCode(),
    title,
    hostId: player.id,
    hostName: player.username,
    createdAt: now,
    ended: false,
    members: [{ id: player.id, name: player.username, role: "host", seenAt: now, muted: false }],
  };
  await col.insertOne(doc);
  return { ok: true as const, space: viewOf(doc) };
}

export async function joinSpace(codeRaw: string) {
  const player = await signedIn();
  if (!player) return { ok: false as const, error: "Sign in first." };
  const code = codeOf(codeRaw);
  if (!code) return { ok: false as const, error: "That space link is not valid." };
  const limited = rateLimit(`space-join:${player.id}`, 30, 60 * 1000);
  if (limited) return { ok: false as const, error: limited };
  const col = await spaceCollection();
  const space = await col.findOne({ _id: code });
  if (!space || space.ended) return { ok: false as const, error: "That space has ended." };
  sweepSpace(space);
  if (space.ended) {
    await col.updateOne({ _id: code }, { $set: { ended: true, members: space.members } });
    return { ok: false as const, error: "That space has ended." };
  }
  const now = new Date().toISOString();
  const existing = space.members.find((member) => member.id === player.id);
  if (existing) {
    existing.seenAt = now;
    existing.name = player.username;
  } else if (space.members.length >= ROOM_CAP) {
    return { ok: false as const, error: "This space is full." };
  } else {
    space.members.push({ id: player.id, name: player.username, role: "listener", seenAt: now, muted: false });
  }
  await col.updateOne({ _id: code, ended: false }, { $set: { members: space.members } });
  return { ok: true as const, space: viewOf(space) };
}

export async function talkInSpace(codeRaw: string) {
  const player = await signedIn();
  if (!player) return { ok: false as const, error: "Sign in first." };
  const code = codeOf(codeRaw);
  if (!code) return { ok: false as const, error: "That space link is not valid." };
  const col = await spaceCollection();
  const space = await col.findOne({ _id: code });
  if (!space || space.ended) return { ok: false as const, error: "That space has ended." };
  sweepSpace(space);
  const member = space.members.find((item) => item.id === player.id);
  if (!member) return { ok: false as const, error: "Join the space first." };
  const speakers = space.members.filter((item) => item.role === "host" || item.role === "speaker").length;
  if (member.role === "listener" && speakers >= SPEAKER_CAP) return { ok: false as const, error: "Speakers are full. Listen for now." };
  if (member.role === "listener") member.role = "speaker";
  member.muted = false;
  member.seenAt = new Date().toISOString();
  await col.updateOne({ _id: code }, { $set: { members: space.members, ended: space.ended } });
  return { ok: true as const, space: viewOf(space) };
}

export async function listenInSpace(codeRaw: string) {
  const player = await signedIn();
  if (!player) return { ok: false as const, error: "Sign in first." };
  const code = codeOf(codeRaw);
  if (!code) return { ok: false as const, error: "That space link is not valid." };
  const col = await spaceCollection();
  const space = await col.findOne({ _id: code });
  if (!space) return { ok: false as const, error: "That space has ended." };
  const member = space.members.find((item) => item.id === player.id);
  if (!member) return { ok: false as const, error: "Join the space first." };
  if (member.role !== "host") member.role = "listener";
  member.muted = false;
  member.seenAt = new Date().toISOString();
  await col.updateOne({ _id: code }, { $set: { members: space.members } });
  return { ok: true as const, space: viewOf(space) };
}

export async function setMicInSpace(codeRaw: string, muted: boolean) {
  const player = await signedIn();
  if (!player) return { ok: false as const, error: "Sign in first." };
  const code = codeOf(codeRaw);
  if (!code) return { ok: false as const, error: "That space link is not valid." };
  const col = await spaceCollection();
  const space = await col.findOne({ _id: code });
  if (!space || space.ended) return { ok: false as const, error: "That space has ended." };
  const member = space.members.find((item) => item.id === player.id);
  if (!member) return { ok: false as const, error: "Join the space first." };
  if (member.role === "listener") return { ok: false as const, error: "Tap the mic under your face to talk." };
  member.muted = muted;
  member.seenAt = new Date().toISOString();
  await col.updateOne({ _id: code }, { $set: { members: space.members } });
  return { ok: true as const, space: viewOf(space) };
}

export async function leaveSpace(codeRaw: string) {
  const player = await signedIn();
  if (!player) return { ok: false as const, error: "Sign in first." };
  const code = codeOf(codeRaw);
  if (!code) return { ok: true as const };
  const col = await spaceCollection();
  const space = await col.findOne({ _id: code });
  if (!space || space.hostId === player.id) return { ok: true as const };
  space.members = space.members.filter((member) => member.id !== player.id);
  await col.updateOne({ _id: code }, { $set: { members: space.members } });
  return { ok: true as const };
}

export async function endSpace(codeRaw: string) {
  const player = await signedIn();
  if (!player) return { ok: false as const, error: "Sign in first." };
  const code = codeOf(codeRaw);
  if (!code) return { ok: false as const, error: "That space link is not valid." };
  const col = await spaceCollection();
  const space = await col.findOne({ _id: code });
  if (!space) return { ok: false as const, error: "That space has ended." };
  if (space.hostId !== player.id) return { ok: false as const, error: "Only the host can end this space." };
  await col.updateOne({ _id: code }, { $set: { ended: true, members: [] } });
  return { ok: true as const };
}
