import { Binary } from "mongodb";
import { currentPlayer } from "@/lib/game/auth";
import { npcById } from "@/lib/game/content";
import { POLICE_ID } from "@/lib/game/engine";
import { stamp } from "@/lib/game/format";
import { VOICE_MAX_BYTES, audioMime, rateLimit, voiceCollection } from "@/lib/game/live";
import { mutate } from "@/lib/game/store";

export const runtime = "nodejs";

function boxFor(playerId: string, peerId: string) {
  return [playerId, peerId].sort().join("|");
}

export async function POST(request: Request) {
  const player = await currentPlayer();
  if (!player) return Response.json({ ok: false, error: "Sign in first." }, { status: 401 });
  if (player.banned) return Response.json({ ok: false, error: "This account is closed." }, { status: 403 });
  const limited = rateLimit(`voice:${player.id}`, 20, 10 * 60 * 1000);
  if (limited) return Response.json({ ok: false, error: limited }, { status: 429 });
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > VOICE_MAX_BYTES + 50_000) return Response.json({ ok: false, error: "That voice note is too long." }, { status: 413 });

  const form = await request.formData();
  const peerId = String(form.get("peerId") ?? "");
  const file = form.get("audio");
  if (!/^[0-9a-z-]{8,80}$/i.test(peerId)) return Response.json({ ok: false, error: "That person is not in the city." }, { status: 400 });
  if (!(file instanceof File)) return Response.json({ ok: false, error: "Record a voice note first." }, { status: 400 });
  if (file.size > VOICE_MAX_BYTES) return Response.json({ ok: false, error: "Keep the voice note under 30 seconds." }, { status: 413 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = audioMime(bytes, file.type || "audio/webm");
  if (!mime) return Response.json({ ok: false, error: "That recording is not a voice note." }, { status: 400 });

  const voiceId = crypto.randomUUID();
  const box = boxFor(player.id, peerId);
  await (await voiceCollection()).insertOne({
    _id: voiceId,
    box,
    fromId: player.id,
    mime,
    bytes: new Binary(bytes),
    createdAt: new Date(),
  });
  const saved = await mutate<{ ok: true } | { ok: false; error: string }>((db) => {
    if (peerId === POLICE_ID) return { save: false, value: { ok: false, error: "The State CID does not take chat. Come to the station." } };
    if (player.blocked.includes(peerId)) return { save: false, value: { ok: false, error: "You blocked this person." } };
    if (player.dmToday >= 30) return { save: false, value: { ok: false, error: "Daily message limit reached. Let a day pass." } };
    if (npcById(peerId)) return { save: false, value: { ok: false, error: "Voice notes are for people in the city." } };
    const other = db.players.find((item) => item.id === peerId);
    if (!other) return { save: false, value: { ok: false, error: "That person is not in the city." } };
    if (other.blocked.includes(player.id)) return { save: false, value: { ok: false, error: "They are not taking messages from you." } };
    const fresh = db.players.find((item) => item.id === player.id);
    if (!fresh || fresh.banned) return { save: false, value: { ok: false, error: "This account is closed." } };
    if (fresh.dmToday >= 30) return { save: false, value: { ok: false, error: "Daily message limit reached. Let a day pass." } };
    db.messages.push({
      id: crypto.randomUUID(),
      box: boxFor(player.id, peerId),
      fromId: player.id,
      text: "Voice note",
      at: stamp(fresh.day, fresh.hour),
      kind: "voice",
      voiceId,
    });
    fresh.dmToday += 1;
    if (!fresh.met.includes(peerId)) fresh.met.push(peerId);
    return { save: true, value: { ok: true } };
  });
  if (!saved.ok) {
    await (await voiceCollection()).deleteOne({ _id: voiceId });
    return Response.json(saved, { status: 400 });
  }
  return Response.json({ ok: true, voiceId });
}
