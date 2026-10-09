import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SpaceRoom } from "@/components/game/SpaceRoom";
import { currentPlayer } from "@/lib/game/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Space", robots: { index: false, follow: false } };

export default async function SpacePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const clean = code.trim().toLowerCase();
  if (!/^[a-z0-9]{8}$/.test(clean)) redirect("/play");
  const player = await currentPlayer();
  if (!player || player.banned) redirect(`/login?next=/space/${clean}`);
  return <SpaceRoom code={clean} meId={player.id} />;
}
