"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  adminBan,
  adminClearSick,
  adminClearPaystack,
  adminDismissReport,
  adminGrant,
  adminRelease,
  adminSavePaystack,
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

type PaystackInfo = {
  ready: boolean;
  fromDashboard: boolean;
  secretHint: string;
  publicKey: string;
  webhookUrl: string;
  callbackUrl: string;
};

type Section = "overview" | "users" | "reports" | "payments" | "paystack";

const NAV: Array<{ id: Section; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "reports", label: "Reports" },
  { id: "payments", label: "Payments" },
  { id: "paystack", label: "Paystack" },
];

export function AdminConsole({
  users,
  reports,
  payments,
  openBets,
  chat,
  focus,
  adminName,
  paystack,
}: {
  users: UserRow[];
  reports: Array<{ id: string; targetName: string; note: string; at: string; reporter: string }>;
  payments: Array<{ id: string; reference: string; amount: number; credit: number; status: string; at: string; username: string }>;
  openBets: number;
  chat: number;
  focus: Detail | null;
  adminName: string;
  paystack: PaystackInfo;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState(false);
  const [section, setSection] = useState<Section>(focus ? "users" : "overview");
  const paid = payments.filter((row) => row.status === "paid").length;
  const shown = users.filter((user) => `${user.username} ${user.email}`.toLowerCase().includes(q.trim().toLowerCase()));
  const title = NAV.find((item) => item.id === section)?.label ?? "Admin";

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenu(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  function go(work: () => Promise<{ ok: boolean; error?: string; notice?: string }>) {
    start(async () => {
      const result = await work();
      setNote(result.ok ? (result.notice ?? "Done.") : (result.error ?? "That failed."));
      router.refresh();
    });
  }

  function pick(next: Section) {
    setSection(next);
    setMenu(false);
  }

  function countFor(id: Section) {
    if (id === "users") return users.length;
    if (id === "reports") return reports.length;
    if (id === "payments") return payments.length;
    return null;
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-[#efe8da] text-[#17241e]">
      {menu ? (
        <button type="button" aria-label="Close menu" className="fixed inset-0 z-30 bg-[#0c1a14]/55 md:hidden" onClick={() => setMenu(false)} />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[17.5rem] flex-col bg-[#10241c] text-[#f6f1e6] shadow-2xl transition-transform duration-200 md:static md:translate-x-0 ${menu ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e0b15a]">Owerri Life</p>
            <p className="font-display text-2xl leading-none">Admin</p>
          </div>
          <button type="button" aria-label="Close sidebar" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 md:hidden" onClick={() => setMenu(false)}>
            <span className="text-lg leading-none">×</span>
          </button>
        </div>
        <nav className="mt-4 flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const active = section === item.id;
            const count = countFor(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => pick(item.id)}
                className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-semibold ${active ? "bg-[#e0b15a] text-[#17241e]" : "text-[#d5e4d8] hover:bg-white/10"}`}
              >
                <span>{item.label}</span>
                {count != null ? <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? "bg-[#17241e]/15" : "bg-white/10"}`}>{count}</span> : null}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#e0b15a]">Signed in</p>
          <p className="mt-1 truncate text-sm font-semibold">{adminName}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-[#e4d8c4] bg-[#f7f3ea] px-4 py-3 md:px-8">
          <button type="button" aria-label="Open menu" aria-expanded={menu} className="grid h-10 w-10 place-items-center rounded-2xl bg-[#10241c] text-[#f6f1e6] md:hidden" onClick={() => setMenu(true)}>
            <span className="flex flex-col gap-1" aria-hidden>
              <span className="block h-0.5 w-4 bg-current" />
              <span className="block h-0.5 w-4 bg-current" />
              <span className="block h-0.5 w-4 bg-current" />
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a9782a]">Dashboard</p>
            <h1 className="truncate font-display text-2xl leading-none md:text-3xl">{title}</h1>
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
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-7">
          {note ? <p className="mb-4 rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">{note}</p> : null}
          {pending ? <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#a9782a]">Working…</p> : null}

          {section === "overview" ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="Users" value={String(users.length)} onOpen={() => pick("users")} />
                <Stat label="Open reports" value={String(reports.length)} onOpen={() => pick("reports")} />
                <Stat label="Open bets" value={String(openBets)} />
                <Stat label="Paid top-ups" value={String(paid)} onOpen={() => pick("payments")} />
              </div>
              <div className="grid gap-3 lg:grid-cols-3">
                <Stat label="Chat lines" value={String(chat)} />
                <Stat label="Paystack" value={paystack.ready ? "On" : "Off"} onOpen={() => pick("paystack")} />
                <Stat label="Recent payments" value={String(payments.length)} onOpen={() => pick("payments")} />
              </div>
              <Panel title="Latest reports" action="All reports" onAction={() => pick("reports")}>
                {reports.length ? reports.slice(0, 4).map((report) => (
                  <article key={report.id} className="border-t border-[#efe4d2] px-4 py-3 first:border-t-0">
                    <p className="font-semibold">{report.targetName}</p>
                    <p className="text-xs text-[#5d6b62]">{report.reporter} · {report.at}</p>
                    <p className="mt-1 text-sm">{report.note}</p>
                  </article>
                )) : <Empty>No open reports.</Empty>}
              </Panel>
            </div>
          ) : null}

          {section === "users" ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#5d6b62]">{shown.length} of {users.length} people</p>
                <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search name or email" className="w-full rounded-2xl border border-[#e4d8c4] bg-white px-4 py-3 text-sm sm:w-72" />
              </div>
              <ul className="space-y-2 md:hidden">
                {shown.map((user) => (
                  <li key={user.id}>
                    <a href={`/secure/restricted/admin?user=${user.id}`} className="block rounded-2xl bg-white p-4 shadow-sm" onClick={() => setMenu(false)}>
                      <span className="flex items-start justify-between gap-3">
                        <span>
                          <span className="block font-semibold">{user.username}</span>
                          <span className="block text-xs text-[#5d6b62]">{user.email}</span>
                        </span>
                        <span className="text-sm font-semibold">{naira(user.balance)}</span>
                      </span>
                      <span className="mt-2 block text-xs text-[#5d6b62]">{user.place}{user.indoors ? " · inside" : ""} · Day {user.day} · {user.hour}:00</span>
                      <StateLine user={user} />
                    </a>
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f7f3ea] text-[10px] uppercase tracking-wide text-[#5d6b62]">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Balance</th>
                      <th className="px-4 py-3">Where</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((user) => (
                      <tr key={user.id} className="border-t border-[#efe4d2]">
                        <td className="px-4 py-3">
                          <a className="font-semibold underline decoration-[#e0b15a] underline-offset-2" href={`/secure/restricted/admin?user=${user.id}`}>{user.username}</a>
                          <span className="block text-xs text-[#5d6b62]">{user.email}</span>
                        </td>
                        <td className="px-4 py-3">{naira(user.balance)}</td>
                        <td className="px-4 py-3">{user.place}{user.indoors ? " · inside" : ""}</td>
                        <td className="px-4 py-3">Day {user.day} · {user.hour}:00</td>
                        <td className="px-4 py-3"><StateLine user={user} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {shown.length === 0 ? <Empty>No user matches that search.</Empty> : null}
              {focus ? <UserDetail focus={focus} pending={pending} go={go} /> : null}
            </div>
          ) : null}

          {section === "reports" ? (
            <div className="space-y-2">
              {reports.length ? reports.map((report) => (
                <article key={report.id} className="flex items-start justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
                  <div>
                    <p className="font-semibold">{report.targetName}</p>
                    <p className="text-xs text-[#5d6b62]">{report.reporter} · {report.at}</p>
                    <p className="mt-2 text-sm leading-6">{report.note}</p>
                  </div>
                  <button type="button" disabled={pending} className="shrink-0 rounded-full bg-[#17241e] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40" onClick={() => go(() => adminDismissReport(report.id))}>Close</button>
                </article>
              )) : <Empty>No open reports.</Empty>}
            </div>
          ) : null}

          {section === "payments" ? (
            <div className="space-y-2">
              {payments.length ? payments.map((payment) => (
                <article key={payment.id} className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{payment.username}</p>
                      <p className="mt-1 text-xs text-[#5d6b62]">Paid {naira(payment.amount)} · got {naira(payment.credit)}</p>
                      <p className="mt-1 break-all font-mono text-xs text-[#5d6b62]">{payment.reference}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{naira(payment.credit)}</p>
                      <p className={`mt-1 text-xs font-semibold uppercase tracking-wide ${payment.status === "paid" ? "text-[#1f6b45]" : payment.status === "failed" ? "text-[#8c3d2f]" : "text-[#a9782a]"}`}>{payment.status}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-[#5d6b62]">{payment.at}</p>
                </article>
              )) : <Empty>No payments yet.</Empty>}
            </div>
          ) : null}

          {section === "paystack" ? <PaystackPanel paystack={paystack} pending={pending} go={go} /> : null}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, onOpen }: { label: string; value: string; onOpen?: () => void }) {
  const body = (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a9782a]">{label}</p>
      <p className="mt-2 font-display text-3xl leading-none">{value}</p>
    </>
  );
  if (!onOpen) return <div className="rounded-2xl bg-white p-4 shadow-sm">{body}</div>;
  return (
    <button type="button" onClick={onOpen} className="rounded-2xl bg-white p-4 text-left shadow-sm">
      {body}
    </button>
  );
}

function Panel({ title, action, onAction, children }: { title: string; action: string; onAction: () => void; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="font-semibold">{title}</h2>
        <button type="button" className="text-xs font-semibold text-[#1f6b45]" onClick={onAction}>{action}</button>
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: string }) {
  return <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-[#5d6b62] shadow-sm">{children}</p>;
}

function StateLine({ user }: { user: UserRow }) {
  const bits = [user.banned ? "closed" : "", user.detained ? "custody" : "", user.sick !== "none" ? user.sick : ""].filter(Boolean);
  return <span className="mt-2 inline-flex rounded-full bg-[#f7f3ea] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#5d6b62]">{bits.join(" · ") || "ok"}</span>;
}

function UserDetail({
  focus,
  pending,
  go,
}: {
  focus: Detail;
  pending: boolean;
  go: (work: () => Promise<{ ok: boolean; error?: string; notice?: string }>) => void;
}) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl leading-none">{focus.username}</h2>
          <p className="mt-2 text-sm text-[#5d6b62]">{focus.email}</p>
          <p className="mt-1 text-sm">{naira(focus.balance)} · {focus.place}</p>
          <p className="mt-1 text-xs text-[#5d6b62]">Earned {naira(focus.pools.earned)} · Gifted {naira(focus.pools.gifted)} · Purchased {naira(focus.pools.purchased)}</p>
        </div>
        <a href="/secure/restricted/admin" className="shrink-0 text-xs font-semibold text-[#1f6b45]">Close</a>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Action disabled={pending} onClick={() => go(() => adminGrant(focus.id, 5000, "purchased"))}>+₦5,000 purchased</Action>
        <Action disabled={pending} onClick={() => go(() => adminGrant(focus.id, 20000, "earned"))}>+₦20,000 earned</Action>
        <Action tone="ghost" disabled={pending} onClick={() => go(() => adminTake(focus.id, 5000))}>−₦5,000</Action>
        <Action tone="ghost" disabled={pending} onClick={() => go(() => adminSendHome(focus.id))}>Send home</Action>
        <Action tone="ghost" disabled={pending} onClick={() => go(() => adminRelease(focus.id))}>Release</Action>
        <Action tone="ghost" disabled={pending} onClick={() => go(() => adminClearSick(focus.id))}>Clear sickness</Action>
        <Action tone="danger" disabled={pending} onClick={() => go(() => adminBan(focus.id, !focus.banned))}>{focus.banned ? "Reopen account" : "Close account"}</Action>
      </div>
      <form
        className="mt-4 flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          go(() => adminGrant(focus.id, Number(data.get("amount")), String(data.get("source")) as MoneySource));
        }}
      >
        <input name="amount" type="number" min={1} placeholder="Custom amount" className="w-36 rounded-2xl border border-[#e4d8c4] px-3 py-2 text-sm" />
        <select name="source" className="rounded-2xl border border-[#e4d8c4] bg-white px-3 py-2 text-sm">
          <option value="purchased">purchased</option>
          <option value="earned">earned</option>
          <option value="gifted">gifted</option>
        </select>
        <button type="submit" disabled={pending} className="rounded-full bg-[#e0b15a] px-4 py-2 text-xs font-semibold disabled:opacity-40">Grant</button>
      </form>
      <form
        className="mt-2 flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          go(() => adminTake(focus.id, Number(data.get("amount"))));
        }}
      >
        <input name="amount" type="number" min={1} placeholder="Amount to remove" className="w-40 rounded-2xl border border-[#e4d8c4] px-3 py-2 text-sm" />
        <button type="submit" disabled={pending} className="rounded-full bg-white px-4 py-2 text-xs font-semibold ring-1 ring-[#e4d8c4] disabled:opacity-40">Remove</button>
      </form>
      <ul className="mt-4 space-y-1 text-xs text-[#5d6b62]">
        {focus.ledger.map((row, index) => (
          <li key={`${row.at}-${index}`}>{row.at} · {naira(row.amount)} · {row.source} · {row.reason}</li>
        ))}
      </ul>
      {focus.log.length ? <p className="mt-3 text-xs text-[#5d6b62]">{focus.log.join(" · ")}</p> : null}
    </section>
  );
}

function Action({
  children,
  onClick,
  disabled,
  tone = "solid",
}: {
  children: string;
  onClick: () => void;
  disabled: boolean;
  tone?: "solid" | "ghost" | "danger";
}) {
  const look = tone === "danger" ? "bg-[#8c3d2f] text-white" : tone === "ghost" ? "bg-white ring-1 ring-[#e4d8c4]" : "bg-[#143d2c] text-white";
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`rounded-full px-3 py-2 text-xs font-semibold disabled:opacity-40 ${look}`}>
      {children}
    </button>
  );
}

function PaystackPanel({
  paystack,
  pending,
  go,
}: {
  paystack: PaystackInfo;
  pending: boolean;
  go: (work: () => Promise<{ ok: boolean; error?: string; notice?: string }>) => void;
}) {
  return (
    <section className="max-w-3xl rounded-2xl bg-white p-4 shadow-sm md:p-6">
      <p className="text-sm text-[#5d6b62]">
        {paystack.ready
          ? paystack.fromDashboard
            ? `Charges are on. Saved secret key ${paystack.secretHint}.`
            : "Charges are on, using the secret key set on the server. Save a key here to replace it."
          : "Charges are off. Paste the secret key from your Paystack dashboard."}
      </p>
      <form
        key={`${paystack.secretHint}|${paystack.publicKey}`}
        className="mt-4 grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          go(() => adminSavePaystack(String(data.get("secret") ?? ""), String(data.get("public") ?? "")));
        }}
      >
        <label className="block text-sm font-semibold">
          Secret key
          <input name="secret" type="password" autoComplete="off" placeholder={paystack.secretHint || "sk_live_ or sk_test_"} className="mt-1 w-full rounded-2xl border border-[#e4d8c4] px-3 py-3 font-normal" />
        </label>
        <label className="block text-sm font-semibold">
          Public key
          <input name="public" defaultValue={paystack.publicKey} autoComplete="off" placeholder="pk_live_ or pk_test_" className="mt-1 w-full rounded-2xl border border-[#e4d8c4] px-3 py-3 font-normal" />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={pending} className="rounded-full bg-[#143d2c] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">Save Paystack</button>
          <button type="button" disabled={pending} className="rounded-full bg-white px-4 py-2 text-xs font-semibold ring-1 ring-[#e4d8c4] disabled:opacity-40" onClick={() => go(() => adminClearPaystack())}>Remove saved keys</button>
        </div>
      </form>
      <div className="mt-5 space-y-3 rounded-2xl bg-[#f7f3ea] p-4 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5d6b62]">Webhook URL</p>
          <p className="mt-1 break-all font-mono text-xs">{paystack.webhookUrl}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5d6b62]">Return URL</p>
          <p className="mt-1 break-all font-mono text-xs">{paystack.callbackUrl}</p>
        </div>
        <p className="text-xs text-[#5d6b62]">Leave the secret key blank to keep the one already saved. Paste the webhook URL into Paystack.</p>
      </div>
    </section>
  );
}
