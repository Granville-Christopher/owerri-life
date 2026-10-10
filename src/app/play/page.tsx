import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GameShell } from "@/components/game/GameShell";
import { sessionView } from "@/lib/game/queries";

export const metadata: Metadata = { title: "City", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PlayPage({ searchParams }: { searchParams: Promise<{ space?: string }> }) {
  const params = await searchParams;
  const space = params.space?.trim().toLowerCase() ?? "";
  const view = await sessionView();
  if (!view) redirect(space ? `/login?next=${encodeURIComponent(`/play?space=${space}`)}` : "/login");
  const spaceCode = /^[a-z0-9]{8}$/.test(space) ? space : null;
  return <GameShell view={view} spaceCode={spaceCode} />;
}
