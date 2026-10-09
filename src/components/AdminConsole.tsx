"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminBan,
  adminClearSick,
  adminDismissReport,
  adminGrant,
  adminRelease,
  adminSendHome,
  adminTake,
  logoutAdmin,
} from "@/lib/game/admin";
import { naira } from "@/lib/game/format";
import type { MoneySource } from "@/lib/game/types";

type UserRow = {
  id: string;
  username: string;
  email: string;
  balance: number;
  place: string;
  indoors: boolean;
  day: number;
  hour: number;
  banned: boolean;
  detained: boolean;
  sick: string;
};

type Detail = UserRow & {
  pools: { earned: number; gifted: number; purchased: number };
  ledger: Array<{ amount: number; reason: string; source: string; at: string }>;
  log: string[];
};

export function AdminConsole({
  users,
  reports,
  payments,
  openBets,
  chat,
  focus,
  adminName,
}: {
  users: UserRow[];
  reports: Array<{ id: string; targetName: string; note: string; at: string; reporter: string }>;
  payments: Array<{ id: string; reference: string; amount: number; status: string; at: string; username: string }>;
  openBets: number;
  chat: number;
  focus: Detail | null;
  adminName: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");
  const [q, setQ] = useState("");
  const shown = users.filter((user) => {
    const hay = `${user.username} ${user.email}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  function go(work: () => Promise<{ ok: boolean; error?: string; notice?: string }>) {
    start(async () => {
      const result = await work();
      setNote(result.ok ? (result.notice ?? "Done.") : (result.error ?? "That failed."));
      router.refresh();
    });
  }

  return (
    <main className="min-h-screen bg-[#f6f1e6] px-4 py-6 text-[#17241e]">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a9782a]">Owerri Life</p>
            <h1 className="font-display text-3xl">Admin</h1>
            <p className="mt-1 text-sm text-[#5d6b62]">Signed in as {adminName}</p>
          </div>
          <button
            type="button"
            disabled={pending}
            className="rounded-full bg-white px-3 py-2 text-xs font-semibold ring-1 ring-[#e4d8c4] disabled:opacity-40"
            onClick={() =>
              go(async () => {
                const result = await logoutAdmin();
                if (result.ok) router.push("/secure/restricted/admin");
                return result;
              })
            }
          >
            Sign out
          </button>
        </div>
        <p className="mt-1 text-sm text-[#5d6b62]">
          {users.length} users · {reports.length} open reports · {openBets} open bets · {chat} chat lines · {payments.filter((row) => row.status === "paid").length} recent paid top-ups
        </p>
        {note ? <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-sm">{note}</p> : null}

        <section className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Users</h2>
            <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search name or email" className="w-52 rounded-full border border-[#e4d8c4] bg-white px-3 py-2 text-sm" />
          </div>
          <div className="mt-3 overflow-x-auto rounded-2xl bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-[10px] uppercase tracking-wide text-[#5d6b62]">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Balance</th>
                  <th className="px-3 py-2">Where</th>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">State</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((user) => (
                  <tr key={user.id} className="border-t border-[#efe4d2]">
                    <td className="px-3 py-2">
                      <a className="font-semibold underline" href={`/secure/restricted/admin?user=${user.id}`}>{user.username}</a>
                      <span className="block text-xs text-[#5d6b62]">{user.email}</span>
                    </td>
                    <td className="px-3 py-2">{naira(user.balance)}</td>
                    <td className="px-3 py-2">{user.place}{user.indoors ? " · inside" : ""}</td>
                    <td className="px-3 py-2">Day {user.day} · {user.hour}:00</td>
                    <td className="px-3 py-2">{[user.banned ? "closed" : "", user.detained ? "custody" : "", user.sick !== "none" ? user.sick : ""].filter(Boolean).join(" · ") || "ok"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {focus ? (
          <section className="mt-6 rounded-2xl bg-white p-4">
            <h2 className="text-lg font-semibold">{focus.username}</h2>
            <p className="text-sm text-[#5d6b62]">{focus.email} · {naira(focus.balance)} · {focus.place}</p>
            <p className="mt-1 text-xs text-[#5d6b62]">Earned {naira(focus.pools.earned)} · Gifted {naira(focus.pools.gifted)} · Purchased {naira(focus.pools.purchased)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={pending} className="rounded-full bg-[#143d2c] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40" onClick={() => go(() => adminGrant(focus.id, 5000, "purchased"))}>+₦5,000 purchased</button>
              <button type="button" disabled={pending} className="rounded-full bg-[#143d2c] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40" onClick={() => go(() => adminGrant(focus.id, 20000, "earned"))}>+₦20,000 earned</button>
              <button type="button" disabled={pending} className="rounded-full bg-white px-3 py-2 text-xs font-semibold ring-1 ring-[#e4d8c4] disabled:opacity-40" onClick={() => go(() => adminTake(focus.id, 5000))}>−₦5,000</button>
              <button type="button" disabled={pending} className="rounded-full bg-white px-3 py-2 text-xs font-semibold ring-1 ring-[#e4d8c4] disabled:opacity-40" onClick={() => go(() => adminSendHome(focus.id))}>Send home</button>
              <button type="button" disabled={pending} className="rounded-full bg-white px-3 py-2 text-xs font-semibold ring-1 ring-[#e4d8c4] disabled:opacity-40" onClick={() => go(() => adminRelease(focus.id))}>Release</button>
              <button type="button" disabled={pending} className="rounded-full bg-white px-3 py-2 text-xs font-semibold ring-1 ring-[#e4d8c4] disabled:opacity-40" onClick={() => go(() => adminClearSick(focus.id))}>Clear sickness</button>
              <button type="button" disabled={pending} className="rounded-full bg-[#8c3d2f] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40" onClick={() => go(() => adminBan(focus.id, !focus.banned))}>{focus.banned ? "Reopen account" : "Close account"}</button>
            </div>
            <form
              className="mt-3 flex flex-wrap items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                const amount = Number(data.get("amount"));
                const source = String(data.get("source")) as MoneySource;
                go(() => adminGrant(focus.id, amount, source));
              }}
            >
              <input name="amount" type="number" min={1} placeholder="Custom amount" className="w-36 rounded-full border border-[#e4d8c4] px-3 py-2 text-sm" />
              <select name="source" className="rounded-full border border-[#e4d8c4] px-3 py-2 text-sm">
                <option value="purchased">purchased</option>
                <option value="earned">earned</option>
                <option value="gifted">gifted</option>
              </select>
              <button type="submit" disabled={pending} className="rounded-full bg-[#e0b15a] px-3 py-2 text-xs font-semibold disabled:opacity-40">Grant</button>
            </form>
            <form
              className="mt-2 flex flex-wrap items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                go(() => adminTake(focus.id, Number(data.get("amount"))));
              }}
            >
              <input name="amount" type="number" min={1} placeholder="Amount to remove" className="w-40 rounded-full border border-[#e4d8c4] px-3 py-2 text-sm" />
              <button type="submit" disabled={pending} className="rounded-full bg-white px-3 py-2 text-xs font-semibold ring-1 ring-[#e4d8c4] disabled:opacity-40">Remove</button>
            </form>
            <ul className="mt-4 space-y-1 text-xs text-[#5d6b62]">
              {focus.ledger.map((row, index) => (
                <li key={`${row.at}-${index}`}>{row.at} · {naira(row.amount)} · {row.source} · {row.reason}</li>
              ))}
            </ul>
            {focus.log.length ? <p className="mt-3 text-xs text-[#5d6b62]">{focus.log.join(" · ")}</p> : null}
          </section>
        ) : null}

        <section className="mt-6">
          <h2 className="text-lg font-semibold">Reports</h2>
          <ul className="mt-3 space-y-2">
            {reports.length ? reports.map((report) => (
              <li key={report.id} className="flex items-start justify-between gap-3 rounded-2xl bg-white px-3 py-3 text-sm">
                <span>
                  <span className="font-semibold">{report.targetName}</span>
                  <span className="block text-xs text-[#5d6b62]">{report.reporter} · {report.at}</span>
                  <span className="mt-1 block">{report.note}</span>
                </span>
                <button type="button" disabled={pending} className="shrink-0 rounded-full bg-[#17241e] px-3 py-1 text-xs font-semibold text-white disabled:opacity-40" onClick={() => go(() => adminDismissReport(report.id))}>Close</button>
              </li>
            )) : <li className="text-sm text-[#5d6b62]">No open reports.</li>}
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-semibold">Paystack top-ups</h2>
          <ul className="mt-3 space-y-2">
            {payments.length ? payments.map((payment) => (
              <li key={payment.id} className="rounded-2xl bg-white px-3 py-2 text-sm">
                <span className="font-semibold">{payment.username}</span> · {naira(payment.amount)} · {payment.status}
                <span className="block text-xs text-[#5d6b62]">{payment.reference}</span>
              </li>
            )) : <li className="text-sm text-[#5d6b62]">No payments yet.</li>}
          </ul>
        </section>
      </div>
    </main>
  );
}
