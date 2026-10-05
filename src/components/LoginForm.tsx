"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/game/actions";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await login(email, password);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/play");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-md rounded-[2rem] bg-[#f6f1e6] p-6 text-[#17241e] shadow-2xl">
      <h1 className="font-display text-3xl">Back to the city</h1>
      <p className="mt-2 text-sm text-[#5d6b62]">Same email you used when you moved in.</p>
      {error ? <p className="mt-3 rounded-2xl bg-[#f3d6cc] px-3 py-2 text-sm text-[#7a2e1e]">{error}</p> : null}
      <label className="mt-5 block text-sm font-semibold">
        Email
        <input type="email" required className="mt-1 w-full rounded-2xl border border-[#e4d8c4] bg-white px-3 py-3" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label className="mt-3 block text-sm font-semibold">
        Password
        <input type="password" required className="mt-1 w-full rounded-2xl border border-[#e4d8c4] bg-white px-3 py-3" value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      <button disabled={pending} className="mt-6 w-full rounded-full bg-[#1f6b45] px-4 py-3 font-semibold text-[#f6f1e6] disabled:opacity-40">
        {pending ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}
