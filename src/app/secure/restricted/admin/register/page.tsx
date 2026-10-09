import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminRegisterForm } from "@/components/AdminGate";
import { currentAdmin } from "@/lib/game/auth";

export const metadata: Metadata = { title: "Register admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminRegisterPage() {
  if (await currentAdmin()) redirect("/secure/restricted/admin");
  return (
    <main className="flex min-h-dvh items-center bg-[#0c1a14] px-4 py-10">
      <AdminRegisterForm />
    </main>
  );
}
