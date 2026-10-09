import { RtcRole, RtcTokenBuilder } from "agora-token";
import { currentPlayer } from "@/lib/game/auth";
import { agoraUid, spaceCollection, sweepSpace } from "@/lib/game/live";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const player = await currentPlayer();
  if (!player || player.banned) return Response.json({ ok: false, error: "Sign in first." }, { status: 401 });
  const appId = process.env.AGORA_APP_ID?.trim() ?? "";
  const certificate = process.env.AGORA_APP_CERTIFICATE?.trim() ?? "";
  if (!/^[a-f0-9]{32}$/i.test(appId) || certificate.length < 32) {
    return Response.json({ ok: false, error: "Live talk needs Agora keys on the server." }, { status: 503 });
  }
  const body = (await request.json().catch(() => null)) as { code?: string } | null;
  const code = String(body?.code ?? "").trim().toLowerCase();
  if (!/^[a-z0-9]{8}$/.test(code)) return Response.json({ ok: false, error: "That space link is not valid." }, { status: 400 });
  const space = await (await spaceCollection()).findOne({ _id: code });
  if (!space || space.ended) return Response.json({ ok: false, error: "That space has ended." }, { status: 404 });
  sweepSpace(space);
  if (space.ended) return Response.json({ ok: false, error: "That space has ended." }, { status: 404 });
  const member = space.members.find((item) => item.id === player.id);
  if (!member) return Response.json({ ok: false, error: "Join the space first." }, { status: 403 });
  const uid = agoraUid(player.id);
  const role = member.role === "listener" ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;
  const token = RtcTokenBuilder.buildTokenWithUid(appId, certificate, code, uid, role, 3600, 3600);
  return Response.json({ ok: true, appId, token, uid, channel: code, role: member.role });
}
