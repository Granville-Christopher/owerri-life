import Link from "next/link";
import { redirect } from "next/navigation";
import { InstallButton } from "@/components/InstallApp";
import { LoginForm } from "@/components/LoginForm";
import { currentPlayer } from "@/lib/game/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await currentPlayer()) redirect("/play");
  return (
    <main className="min-h-dvh bg-[#0c1a14] px-4 py-8">
      <div className="mx-auto mb-4 flex max-w-md justify-end">
        <InstallButton />
      </div>
      <LoginForm />
      <p className="mt-4 text-center text-sm text-[#d5e4d8]">
        New here? <Link href="/join" className="font-semibold text-[#e0b15a]">Create a person</Link>
      </p>
    </main>
  );
}
