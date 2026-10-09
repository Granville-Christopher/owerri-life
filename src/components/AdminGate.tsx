"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin, registerAdmin } from "@/lib/game/admin";

const GATE = "/secure/restricted/admin";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await loginAdmin(email, password);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(GATE);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-md rounded-[2rem] bg-[#f6f1e6] p-6 text-[#17241e] shadow-2xl">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a9782a]">Restricted</p>
      <h1 className="font-display text-3xl">Admin sign in</h1>
      <p className="mt-2 text-sm text-[#5d6b62]">This account is only for the admin console. It is not a city person.</p>
      {error ? <p className="mt-3 rounded-2xl bg-[#f3d6cc] px-3 py-2 text-sm text-[#7a2e1e]">{error}</p> : null}
      <label className="mt-5 block text-sm font-semibold">
        Email
        <input type="email" required autoComplete="username" className="mt-1 w-full rounded-2xl border border-[#e4d8c4] bg-white px-3 py-3" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label className="mt-3 block text-sm font-semibold">
        Password
        <input type="password" required autoComplete="current-password" className="mt-1 w-full rounded-2xl border border-[#e4d8c4] bg-white px-3 py-3" value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      <button disabled={pending} className="mt-6 w-full rounded-full bg-[#1f6b45] px-4 py-3 font-semibold text-[#f6f1e6] disabled:opacity-40">
        {pending ? "Checking…" : "Enter admin"}
      </button>
      <p className="mt-4 text-center text-sm text-[#5d6b62]">
        No admin account yet? <a href={`${GATE}/register`} className="font-semibold text-[#1f6b45]">Register</a>
      </p>
    </form>
  );
}

export function AdminRegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await registerAdmin(username, email, password);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(GATE);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-md rounded-[2rem] bg-[#f6f1e6] p-6 text-[#17241e] shadow-2xl">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a9782a]">Restricted</p>
      <h1 className="font-display text-3xl">Register admin</h1>
      <p className="mt-2 text-sm text-[#5d6b62]">Creates an admin account only. It does not create a person in the city.</p>
      {error ? <p className="mt-3 rounded-2xl bg-[#f3d6cc] px-3 py-2 text-sm text-[#7a2e1e]">{error}</p> : null}
      <label className="mt-5 block text-sm font-semibold">
        Username
        <input required autoComplete="username" className="mt-1 w-full rounded-2xl border border-[#e4d8c4] bg-white px-3 py-3" value={username} onChange={(event) => setUsername(event.target.value)} />
      </label>
      <label className="mt-3 block text-sm font-semibold">
        Email
        <input type="email" required autoComplete="email" className="mt-1 w-full rounded-2xl border border-[#e4d8c4] bg-white px-3 py-3" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label className="mt-3 block text-sm font-semibold">
        Password
        <input type="password" required autoComplete="new-password" className="mt-1 w-full rounded-2xl border border-[#e4d8c4] bg-white px-3 py-3" value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      <p className="mt-2 text-xs text-[#5d6b62]">8 or more characters, with upper case, lower case, a number, and a special character.</p>
      <button disabled={pending} className="mt-6 w-full rounded-full bg-[#1f6b45] px-4 py-3 font-semibold text-[#f6f1e6] disabled:opacity-40">
        {pending ? "Creating…" : "Create admin account"}
      </button>
      <p className="mt-4 text-center text-sm text-[#5d6b62]">
        Already registered? <a href={GATE} className="font-semibold text-[#1f6b45]">Sign in</a>
      </p>
    </form>
  );
}
