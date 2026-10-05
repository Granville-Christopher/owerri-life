import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GameShell } from "@/components/game/GameShell";
import { sessionView } from "@/lib/game/queries";

export const metadata: Metadata = { title: "City", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PlayPage() {
  const view = await sessionView();
  if (!view) redirect("/login");
  return <GameShell view={view} />;
}
