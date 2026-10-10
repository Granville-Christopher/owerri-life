import { currentPlayer } from "@/lib/game/auth";
import { readDb } from "@/lib/game/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const me = await currentPlayer();
  if (!me) return Response.json({ alerts: [], incoming: 0 }, { status: 401 });
  const db = await readDb();
  const incoming = (db.requests ?? []).filter((request) => request.toId === me.id).length;
  return Response.json({
    alerts: (me.alerts ?? []).map((alert) => ({ id: alert.id, text: alert.text })),
    incoming,
  });
}
