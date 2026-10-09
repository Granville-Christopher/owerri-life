import { Binary } from "mongodb";
import { sessionPlayerId } from "@/lib/game/auth";
import { voiceCollection } from "@/lib/game/live";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const playerId = await sessionPlayerId();
  if (!playerId) return new Response("Sign in first.", { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found.", { status: 404 });
  const doc = await (await voiceCollection()).findOne({ _id: id });
  if (!doc) return new Response("Not found.", { status: 404 });
  const people = doc.box.split("|");
  if (!people.includes(playerId)) return new Response("Not found.", { status: 404 });
  const view = doc.bytes instanceof Binary ? doc.bytes.buffer : Buffer.from(doc.bytes as unknown as Uint8Array);
  const raw = Buffer.isBuffer(view) ? view : Buffer.from(view.buffer, view.byteOffset, view.byteLength);
  return new Response(new Uint8Array(raw), {
    status: 200,
    headers: {
      "Content-Type": doc.mime,
      "Content-Length": String(raw.length),
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
