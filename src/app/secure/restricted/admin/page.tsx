import type { Metadata } from "next";
import { AdminConsole } from "@/components/AdminConsole";
import { AdminLoginForm } from "@/components/AdminGate";
import { adminSnapshot, adminUser } from "@/lib/game/admin";
import { currentAdmin } from "@/lib/game/auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function RestrictedAdminPage({ searchParams }: { searchParams: Promise<{ user?: string }> }) {
  const admin = await currentAdmin();
  if (!admin) {
    return (
      <main className="flex min-h-dvh items-center bg-[#0c1a14] px-4 py-10">
        <AdminLoginForm />
      </main>
    );
  }
  const { user } = await searchParams;
  const snap = await adminSnapshot();
  if (!snap) {
    return (
      <main className="flex min-h-dvh items-center bg-[#0c1a14] px-4 py-10">
        <AdminLoginForm />
      </main>
    );
  }
  const focus = user ? await adminUser(user) : null;
  return <AdminConsole users={snap.users} reports={snap.reports} payments={snap.payments} openBets={snap.openBets} chat={snap.chat} focus={focus} adminName={admin.username} paystack={snap.paystack} />;
}
