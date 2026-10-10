import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SpacePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const clean = code.trim().toLowerCase();
  if (!/^[a-z0-9]{8}$/.test(clean)) redirect("/play");
  redirect(`/play?space=${clean}`);
}
