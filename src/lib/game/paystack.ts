import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { TOP_UPS } from "./content";
import { stamp } from "./format";
import { siteUrl } from "@/lib/site";
import { mutate } from "./store";
import type { LedgerEntry, MoneySource } from "./types";

function secret() {
  return process.env.PAYSTACK_SECRET_KEY?.trim() ?? "";
}

export function paystackReady() {
  return secret().startsWith("sk_");
}

function entry(playerId: string, amount: number, source: MoneySource, reason: string, at: string): LedgerEntry {
  return { id: crypto.randomUUID(), playerId, amount, source, reason, at };
}

export async function openTopUp(playerId: string, email: string, amount: number) {
  const gain = Math.round(amount);
  if (!(TOP_UPS as readonly number[]).includes(gain)) return { ok: false as const, error: "Pick a top-up amount." };
  if (!paystackReady()) return { ok: false as const, error: "Paystack is not set up yet." };
  const reference = `ol_${randomBytes(12).toString("hex")}`;
  await mutate((db) => {
    db.payments.push({
      id: crypto.randomUUID(),
      reference,
      playerId,
      amount: gain,
      status: "pending",
      at: new Date().toISOString(),
    });
    return { save: true, value: null };
  });
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      amount: gain * 100,
      reference,
      currency: "NGN",
      callback_url: `${siteUrl()}/topup/return`,
      metadata: { playerId, gameAmount: gain },
    }),
  });
  const body = (await response.json()) as { status?: boolean; data?: { authorization_url?: string }; message?: string };
  if (!response.ok || !body.status || !body.data?.authorization_url) {
    await mutate((db) => {
      const row = db.payments.find((item) => item.reference === reference);
      if (row && row.status === "pending") row.status = "failed";
      return { save: true, value: null };
    });
    return { ok: false as const, error: body.message || "Paystack did not start the payment." };
  }
  return { ok: true as const, url: body.data.authorization_url };
}

export function paystackSignatureOk(raw: string, header: string | null) {
  if (!header || !secret()) return false;
  const digest = createHmac("sha512", secret()).update(raw).digest("hex");
  const a = Buffer.from(digest);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function settlePaystack(reference: string) {
  const ref = reference.trim();
  if (!ref || !paystackReady()) return { ok: false as const, error: "Payment could not be checked." };
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`, {
    headers: { Authorization: `Bearer ${secret()}` },
  });
  const body = (await response.json()) as {
    status?: boolean;
    data?: { status?: string; amount?: number; reference?: string; metadata?: { playerId?: string } };
  };
  if (!response.ok || !body.status || body.data?.status !== "success") {
    return { ok: false as const, error: "Paystack has not confirmed this payment." };
  }
  const paidKobo = body.data.amount ?? 0;
  return mutate<{ ok: true; notice: string } | { ok: false; error: string }>((db) => {
    const row = db.payments.find((item) => item.reference === ref);
    if (!row) return { save: false, value: { ok: false, error: "This payment is not on our books." } };
    if (row.status === "paid") return { save: false, value: { ok: true, notice: "This top-up is already on your balance." } };
    if (paidKobo !== row.amount * 100) {
      row.status = "failed";
      return { save: true, value: { ok: false, error: "The amount paid does not match the top-up." } };
    }
    const player = db.players.find((item) => item.id === row.playerId);
    if (!player || player.banned) {
      row.status = "failed";
      return { save: true, value: { ok: false, error: "This account cannot receive a top-up." } };
    }
    row.status = "paid";
    row.paidAt = new Date().toISOString();
    db.ledger.push(entry(player.id, row.amount, "purchased", "Paystack top-up", stamp(player.day, player.hour)));
    return { save: true, value: { ok: true, notice: "Top-up added. Purchased naira cannot pay a meet-up." } };
  });
}
