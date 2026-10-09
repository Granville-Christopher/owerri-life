import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminConsole } from "@/components/AdminConsole";
import { adminSnapshot, adminUser } from "@/lib/game/admin";
import { isAdmin } from "@/lib/game/adminAccess";
import { currentPlayer } from "@/lib/game/auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ user?: string }> }) {
  const me = await currentPlayer();
  if (!me) redirect("/login");
  if (!isAdmin(me)) redirect("/play");
  const { user } = await searchParams;
  const snap = await adminSnapshot();
  if (!snap) redirect("/play");
  const focus = user ? await adminUser(user) : null;
  return <AdminConsole users={snap.users} reports={snap.reports} payments={snap.payments} openBets={snap.openBets} chat={snap.chat} focus={focus} />;
}
