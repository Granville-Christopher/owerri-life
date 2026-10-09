import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { InstallButton } from "@/components/InstallApp";
import { LoginForm } from "@/components/LoginForm";
import { currentPlayer } from "@/lib/game/auth";
import { spaceReturn } from "@/lib/site";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = spaceReturn((await searchParams).next);
  const signedIn = await currentPlayer();
  if (signedIn && !signedIn.banned) redirect(next ?? "/play");
  return (
    <main className="min-h-dvh bg-[#0c1a14] px-4 py-8">
      <div className="mx-auto mb-4 flex max-w-md justify-end">
        <InstallButton />
      </div>
      <LoginForm next={next} />
      <p className="mt-4 text-center text-sm text-[#d5e4d8]">
        New here? <Link href="/join" className="font-semibold text-[#e0b15a]">Create a person</Link>
      </p>
    </main>
  );
}
