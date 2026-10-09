"use server";

import { homeAreaId, placeById } from "./content";
import { poolsOf, wallet } from "./engine";
import { naira, stamp } from "./format";
import { authBlocked, authCleared, authFailed, burnPasswordCheck, clearAdminSession, currentAdmin, hashPassword, needsUpgrade, setAdminSession, verifyPassword } from "./auth";
import { passwordProblem } from "./password";
import { mutate, readDb } from "./store";
import type { MoneySource, Player } from "./types";

async function adminId() {
  const admin = await currentAdmin();
  if (!admin) return null;
  return admin.id;
}

function adminNameOk(username: string) {
  if (!/^[a-zA-Z0-9_]{3,16}$/.test(username)) return "Username needs 3 to 16 characters. Letters, numbers, and underscores are allowed.";
  if (/^\d+$/.test(username)) return "A username cannot be only numbers. Add a letter or an underscore.";
  if (/^_+$/.test(username)) return "A username cannot be only underscores. Add a letter or a number.";
  return null;
}

export async function registerAdmin(usernameRaw: string, emailRaw: string, password: string) {
  const username = usernameRaw.trim();
  const email = emailRaw.trim().toLowerCase();
  const blocked = authBlocked(`admin-join:${email}`);
  if (blocked) return { ok: false as const, error: blocked };
  const nameError = adminNameOk(username);
  if (nameError) return { ok: false as const, error: nameError };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false as const, error: "Enter a real email." };
  const passwordError = passwordProblem(password);
  if (passwordError) return { ok: false as const, error: passwordError };
  const created = await mutate<{ ok: true; id: string } | { ok: false; error: string }>((db) => {
    const taken = db.admins.some((item) => item.email === email || item.username.toLowerCase() === username.toLowerCase());
    if (taken) return { save: false, value: { ok: false, error: "That admin email or username is already registered." } };
    const id = crypto.randomUUID();
    db.admins.push({ id, username, email, passwordHash: hashPassword(password), createdAt: new Date().toISOString() });
    return { save: true, value: { ok: true, id } };
  });
  if (!created.ok) {
    authFailed(`admin-join:${email}`);
    return created;
  }
  authCleared(`admin-join:${email}`);
  await setAdminSession(created.id);
  return { ok: true as const, notice: "Admin account created." };
}

export async function loginAdmin(emailRaw: string, password: string) {
  const email = emailRaw.trim().toLowerCase();
  const blocked = authBlocked(`admin-login:${email}`);
  if (blocked) return { ok: false as const, error: blocked };
  const outcome = await mutate<{ ok: true; id: string } | { ok: false; error: string }>((db) => {
    const admin = db.admins.find((item) => item.email === email);
    const matches = admin ? verifyPassword(password, admin.passwordHash) : (burnPasswordCheck(password), false);
    if (!admin || !matches) return { save: false, value: { ok: false, error: "Email or password is wrong." } };
    const upgrade = needsUpgrade(admin.passwordHash);
    if (upgrade) admin.passwordHash = hashPassword(password);
    return { save: upgrade, value: { ok: true, id: admin.id } };
  });
  if (!outcome.ok) {
    authFailed(`admin-login:${email}`);
    return outcome;
  }
  authCleared(`admin-login:${email}`);
  await setAdminSession(outcome.id);
  return { ok: true as const, notice: "Signed in." };
}

export async function logoutAdmin() {
  await clearAdminSession();
  return { ok: true as const, notice: "Signed out." };
}

function publicUser(player: Player, balance: number) {
  return {
    id: player.id,
    username: player.username,
    email: player.email,
    balance,
    place: placeById(player.locationId).name,
    locationId: player.locationId,
    indoors: player.indoors,
    day: player.day,
    hour: player.hour,
    job: player.job?.careerId ?? null,
    banned: Boolean(player.banned),
    detained: Boolean(player.detainedUntil),
    createdAt: player.createdAt,
    sick: player.sick,
    homeId: player.homeId,
  };
}

export async function adminSnapshot() {
  const id = await adminId();
  if (!id) return null;
  const db = await readDb();
  const users = db.players
    .map((player) => publicUser(player, wallet(db.ledger, player.id)))
    .sort((a, b) => a.username.localeCompare(b.username));
  return {
    users,
    reports: db.reports
      .filter((report) => !report.reviewed)
      .slice(-40)
      .reverse()
      .map((report) => ({
        id: report.id,
        targetName: report.targetName,
        note: report.note,
        at: report.at,
        reporter: db.players.find((player) => player.id === report.reporterId)?.username ?? "Unknown",
      })),
    payments: [...db.payments]
      .slice(-40)
      .reverse()
      .map((payment) => ({
        id: payment.id,
        reference: payment.reference,
        amount: payment.amount,
        status: payment.status,
        at: payment.at,
        username: db.players.find((player) => player.id === payment.playerId)?.username ?? "Unknown",
      })),
    openBets: db.bets.filter((bet) => bet.status === "open").length,
    chat: db.chat.length,
  };
}

export async function adminUser(userId: string) {
  const id = await adminId();
  if (!id) return null;
  const db = await readDb();
  const player = db.players.find((item) => item.id === userId);
  if (!player) return null;
  const pools = poolsOf(db.ledger, player.id);
  const ledger = db.ledger
    .filter((entry) => entry.playerId === player.id)
    .slice(-16)
    .reverse()
    .map((entry) => ({ amount: entry.amount, reason: entry.reason, source: entry.source, at: entry.at }));
  return { ...publicUser(player, wallet(db.ledger, player.id)), pools, ledger, log: player.log.slice(0, 8) };
}

function money(player: Player, amount: number, source: MoneySource, reason: string) {
  const gain = Math.round(amount);
  return { id: crypto.randomUUID(), playerId: player.id, amount: gain, source, reason, at: stamp(player.day, player.hour) };
}

export async function adminGrant(userId: string, amount: number, source: MoneySource) {
  const id = await adminId();
  if (!id) return { ok: false as const, error: "Admin only." };
  const gain = Math.round(amount);
  if (gain < 1 || gain > 50_000_000) return { ok: false as const, error: "Amount must be between ₦1 and ₦50,000,000." };
  if (source !== "earned" && source !== "gifted" && source !== "purchased") return { ok: false as const, error: "Pick a money type." };
  return mutate<{ ok: true; notice: string } | { ok: false; error: string }>((db) => {
    const player = db.players.find((item) => item.id === userId);
    if (!player) return { save: false, value: { ok: false, error: "No such user." } };
    db.ledger.push(money(player, gain, source, `Admin grant · ${source}`));
    return { save: true, value: { ok: true, notice: `${naira(gain)} ${source} added to ${player.username}.` } };
  });
}

export async function adminTake(userId: string, amount: number) {
  const id = await adminId();
  if (!id) return { ok: false as const, error: "Admin only." };
  const cost = Math.round(amount);
  if (cost < 1 || cost > 50_000_000) return { ok: false as const, error: "Amount must be between ₦1 and ₦50,000,000." };
  return mutate<{ ok: true; notice: string } | { ok: false; error: string }>((db) => {
    const player = db.players.find((item) => item.id === userId);
    if (!player) return { save: false, value: { ok: false, error: "No such user." } };
    const pools = poolsOf(db.ledger, player.id);
    let left = cost;
    const sources: MoneySource[] = ["purchased", "gifted", "earned"];
    for (const source of sources) {
      const take = Math.min(Math.max(0, pools[source]), left);
      if (take > 0) {
        db.ledger.push(money(player, -take, source, "Admin deduction"));
        left -= take;
      }
    }
    if (left > 0) return { save: false, value: { ok: false, error: "Their balance cannot cover that." } };
    return { save: true, value: { ok: true, notice: `${naira(cost)} removed from ${player.username}.` } };
  });
}

export async function adminBan(userId: string, banned: boolean) {
  const id = await adminId();
  if (!id) return { ok: false as const, error: "Admin only." };
  return mutate<{ ok: true; notice: string } | { ok: false; error: string }>((db) => {
    const player = db.players.find((item) => item.id === userId);
    if (!player) return { save: false, value: { ok: false, error: "No such user." } };
    player.banned = banned;
    return { save: true, value: { ok: true, notice: banned ? `${player.username} is closed.` : `${player.username} can sign in again.` } };
  });
}

export async function adminRelease(userId: string) {
  const id = await adminId();
  if (!id) return { ok: false as const, error: "Admin only." };
  return mutate<{ ok: true; notice: string } | { ok: false; error: string }>((db) => {
    const player = db.players.find((item) => item.id === userId);
    if (!player) return { save: false, value: { ok: false, error: "No such user." } };
    player.detainedUntil = null;
    player.policeInvite = null;
    return { save: true, value: { ok: true, notice: `${player.username} is out of custody.` } };
  });
}

export async function adminSendHome(userId: string) {
  const id = await adminId();
  if (!id) return { ok: false as const, error: "Admin only." };
  return mutate<{ ok: true; notice: string } | { ok: false; error: string }>((db) => {
    const player = db.players.find((item) => item.id === userId);
    if (!player) return { save: false, value: { ok: false, error: "No such user." } };
    player.locationId = homeAreaId(player.homeId);
    player.indoors = true;
    player.pose = "stand";
    player.besideId = null;
    player.room = null;
    return { save: true, value: { ok: true, notice: `${player.username} was sent home.` } };
  });
}

export async function adminClearSick(userId: string) {
  const id = await adminId();
  if (!id) return { ok: false as const, error: "Admin only." };
  return mutate<{ ok: true; notice: string } | { ok: false; error: string }>((db) => {
    const player = db.players.find((item) => item.id === userId);
    if (!player) return { save: false, value: { ok: false, error: "No such user." } };
    player.sick = "none";
    player.strain = 0;
    return { save: true, value: { ok: true, notice: `${player.username} is well.` } };
  });
}

export async function adminDismissReport(reportId: string) {
  const id = await adminId();
  if (!id) return { ok: false as const, error: "Admin only." };
  return mutate<{ ok: true; notice: string } | { ok: false; error: string }>((db) => {
    const report = db.reports.find((item) => item.id === reportId);
    if (!report) return { save: false, value: { ok: false, error: "Report is gone." } };
    report.reviewed = true;
    return { save: true, value: { ok: true, notice: "Report closed." } };
  });
}
