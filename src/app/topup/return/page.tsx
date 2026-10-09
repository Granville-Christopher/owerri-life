import { redirect } from "next/navigation";
import { settlePaystack } from "@/lib/game/paystack";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function TopUpReturn({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  const { reference } = await searchParams;
  if (reference) await settlePaystack(reference);
  redirect("/play");
}
