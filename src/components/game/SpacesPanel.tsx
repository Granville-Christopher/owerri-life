"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSpace, listSpaces, type SpaceView } from "@/lib/game/spaces";

export function SpacesPanel() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [spaces, setSpaces] = useState<SpaceView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let stop = false;
    void listSpaces().then((result) => {
      if (stop) return;
      if (!result.ok) setError(result.error);
      setSpaces(result.spaces);
    });
    return () => {
      stop = true;
    };
  }, []);

  async function open(next: string) {
    setPending(true);
    setError(null);
    const result = await createSpace(next);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/space/${result.space.code}`);
  }

  return (
    <section className="space-y-3 text-sm">
      <h2 className="font-display text-2xl">Spaces</h2>
      <p className="text-[#5d6b62]">Open a room, share the link, and talk. People join as listeners, then take a turn on the mic.</p>
      {error ? <p className="rounded-2xl bg-[#f3d6cc] px-3 py-2 text-[#7a2e1e]">{error}</p> : null}
      <form
        className="space-y-2 rounded-3xl bg-white p-3"
        onSubmit={(event) => {
          event.preventDefault();
          void open(title);
        }}
      >
        <label className="block font-semibold">
          Space name
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Friday night in Owerri" className="mt-1 w-full rounded-2xl border border-[#e4d8c4] px-3 py-2" />
        </label>
        <button disabled={pending} className="w-full rounded-full bg-[#1f6b45] px-4 py-2 font-semibold text-[#f6f1e6] disabled:opacity-40">
          {pending ? "Opening…" : "Create space"}
        </button>
      </form>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const next = code.trim().toLowerCase();
          if (!/^[a-z0-9]{8}$/.test(next)) {
            setError("Paste the 8-character space code.");
            return;
          }
          router.push(`/space/${next}`);
        }}
      >
        <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Space code" className="min-w-0 flex-1 rounded-full border border-[#e4d8c4] bg-white px-3 py-2" />
        <button className="rounded-full bg-[#143d2c] px-4 py-2 font-semibold text-[#f6f1e6]">Join</button>
      </form>
      <div className="space-y-2">
        {spaces.length === 0 ? <p className="text-[#5d6b62]">No live spaces yet. Start one.</p> : null}
        {spaces.map((space) => (
          <button key={space.code} type="button" onClick={() => router.push(`/space/${space.code}`)} className="block w-full rounded-3xl bg-white p-3 text-left">
            <p className="font-semibold">{space.title}</p>
            <p className="text-xs text-[#5d6b62]">{space.hostName} · {space.members.length} here</p>
          </button>
        ))}
      </div>
    </section>
  );
}
