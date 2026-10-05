"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkUsername, createAccount } from "@/lib/game/actions";
import { CAREERS, DREAMS, LOOKS, TRAITS } from "@/lib/game/content";
import { naira } from "@/lib/game/format";
import { Avatar } from "./Avatar";
import type { LookId, TraitId } from "@/lib/game/types";

const steps = ["Account", "Look", "Traits", "Dream", "Career"];

export function JoinWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [username, setUsername] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState(false);
  const [look, setLook] = useState<LookId>("ada");
  const [traits, setTraits] = useState<TraitId[]>([]);
  const [dream, setDream] = useState(DREAMS[0].id);
  const [careerId, setCareerId] = useState(CAREERS[2].id);
  const [reveal, setReveal] = useState<{ title: string; cash: number; home: string; perk: string } | null>(null);

  function toggleTrait(id: TraitId) {
    setTraits((current) => {
      if (current.includes(id)) return current.filter((trait) => trait !== id);
      if (current.length >= 2) return current;
      return [...current, id];
    });
  }

  const canNext =
    (step === 0 && age && username.trim().length >= 3 && email.includes("@") && password.length >= 8) ||
    (step === 1) ||
    (step === 2 && traits.length === 2) ||
    (step === 3) ||
    step === 4;

  async function finish() {
    setPending(true);
    setError(null);
    const result = await createAccount({
      username,
      email,
      password,
      ageConfirmed: age,
      look,
      traits,
      dream,
      careerId,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      setSuggestions(result.suggestions ?? []);
      if (result.suggestions?.length) setStep(0);
      return;
    }
    setReveal(result.reveal);
  }

  if (reveal) {
    return (
      <section className="mx-auto w-full max-w-md rounded-[2rem] bg-[#f6f1e6] p-6 text-[#17241e] shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a9782a]">Birth lottery</p>
        <h1 className="mt-2 font-display text-4xl">{reveal.title}</h1>
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-[#e4d8c4] pb-3">
            <dt>Starting cash</dt>
            <dd className="font-semibold">{naira(reveal.cash)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-[#e4d8c4] pb-3">
            <dt>Home</dt>
            <dd className="text-right font-semibold">{reveal.home}</dd>
          </div>
          <div>
            <dt className="text-[#5d6b62]">Perk</dt>
            <dd className="mt-1">{reveal.perk}</dd>
          </div>
        </dl>
        <button
          className="mt-8 w-full rounded-full bg-[#1f6b45] px-4 py-3 font-semibold text-[#f6f1e6]"
          onClick={() => router.push("/play")}
        >
          Enter Owerri
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-[2rem] bg-[#f6f1e6] p-6 text-[#17241e] shadow-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5d6b62]">
        {steps[step]} · {step + 1} / {steps.length}
      </p>
      <h1 className="mt-1 font-display text-3xl">Make your person</h1>
      {error ? <p className="mt-3 rounded-2xl bg-[#f3d6cc] px-3 py-2 text-sm text-[#7a2e1e]">{error}</p> : null}

      {step === 0 ? (
        <div className="mt-5 space-y-3">
          <label className="block text-sm font-semibold">
            Username
            <input
              className="mt-1 w-full rounded-2xl border border-[#e4d8c4] bg-white px-3 py-3"
              value={username}
              autoComplete="username"
              onChange={(event) => {
                setUsername(event.target.value);
                setSuggestions([]);
              }}
            />
          </label>
          <p className="text-xs leading-5 text-[#5d6b62]">Letters, numbers, and underscores. Not numbers on their own, and not underscores on their own.</p>
          {suggestions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold"
                  onClick={() => {
                    setUsername(name);
                    setSuggestions([]);
                    setError(null);
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          ) : null}
          <label className="block text-sm font-semibold">
            Email
            <input type="email" className="mt-1 w-full rounded-2xl border border-[#e4d8c4] bg-white px-3 py-3" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <input type="password" className="mt-1 w-full rounded-2xl border border-[#e4d8c4] bg-white px-3 py-3" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <label className="flex items-start gap-3 rounded-2xl bg-white px-3 py-3 text-sm">
            <input type="checkbox" className="mt-1" checked={age} onChange={(event) => setAge(event.target.checked)} />
            I confirm I am 18 or older.
          </label>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="mt-5 grid grid-cols-3 gap-3">
          {LOOKS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLook(item.id)}
              className={`rounded-3xl border px-2 py-3 ${look === item.id ? "border-[#1f6b45] bg-white" : "border-transparent bg-white/60"}`}
            >
              <Avatar look={item.id} name={item.name} size={64} />
              <span className="mt-2 block text-sm font-semibold">{item.name}</span>
            </button>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-5 grid gap-2">
          <p className="text-sm text-[#5d6b62]">Pick two.</p>
          {TRAITS.map((trait) => {
            const on = traits.includes(trait.id);
            return (
              <button
                key={trait.id}
                type="button"
                onClick={() => toggleTrait(trait.id)}
                className={`rounded-2xl border px-3 py-3 text-left ${on ? "border-[#1f6b45] bg-white" : "border-[#e4d8c4] bg-white/70"}`}
              >
                <span className="font-semibold">{trait.name}</span>
                <span className="mt-1 block text-sm text-[#5d6b62]">{trait.detail}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-5 grid gap-2">
          {DREAMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDream(item.id)}
              className={`rounded-2xl border px-3 py-3 text-left ${dream === item.id ? "border-[#1f6b45] bg-white" : "border-[#e4d8c4] bg-white/70"}`}
            >
              <span className="font-semibold">{item.name}</span>
              <span className="mt-1 block text-sm text-[#5d6b62]">{item.detail}</span>
            </button>
          ))}
        </div>
      ) : null}

      {step === 4 ? (
        <div className="mt-5 grid gap-2">
          <p className="text-sm text-[#5d6b62]">
            Heirs start this career at level 3. If the lottery says Struggle, you still get the job from your phone.
          </p>
          {CAREERS.map((career) => (
            <button
              key={career.id}
              type="button"
              onClick={() => setCareerId(career.id)}
              className={`rounded-2xl border px-3 py-3 text-left ${careerId === career.id ? "border-[#1f6b45] bg-white" : "border-[#e4d8c4] bg-white/70"}`}
            >
              <span className="font-semibold">{career.name}</span>
              <span className="mt-1 block text-sm text-[#5d6b62]">
                Level 1 {naira(career.l1)} · Level 5 {naira(career.l5)}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex gap-2">
        {step > 0 ? (
          <button type="button" className="rounded-full border border-[#e4d8c4] px-4 py-3" onClick={() => setStep((value) => value - 1)}>
            Back
          </button>
        ) : null}
        {step < 4 ? (
          <button
            type="button"
            disabled={!canNext || pending}
            className="flex-1 rounded-full bg-[#1f6b45] px-4 py-3 font-semibold text-[#f6f1e6] disabled:opacity-40"
            onClick={async () => {
              if (step !== 0) {
                setStep((value) => value + 1);
                return;
              }
              setPending(true);
              setError(null);
              const result = await checkUsername(username);
              setPending(false);
              if (!result.ok) {
                setError(result.error);
                setSuggestions(result.suggestions);
                return;
              }
              setSuggestions([]);
              setStep(1);
            }}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            className="flex-1 rounded-full bg-[#1f6b45] px-4 py-3 font-semibold text-[#f6f1e6] disabled:opacity-40"
            onClick={finish}
          >
            {pending ? "Rolling the lottery…" : "Roll birth lottery"}
          </button>
        )}
      </div>
    </section>
  );
}
