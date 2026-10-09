import { NextResponse } from "next/server";
import { paystackSignatureOk, settlePaystack } from "@/lib/game/paystack";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const raw = await request.text();
  if (!paystackSignatureOk(raw, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(raw) as { event?: string; data?: { reference?: string } };
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (event.event === "charge.success" && event.data?.reference) {
    await settlePaystack(event.data.reference);
  }
  return NextResponse.json({ ok: true });
}
