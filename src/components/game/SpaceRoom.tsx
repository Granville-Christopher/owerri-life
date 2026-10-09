"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { IAgoraRTCClient, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";
import { endSpace, joinSpace, leaveSpace, listenInSpace, talkInSpace, type SpaceView } from "@/lib/game/spaces";

export function SpaceRoom({ code, meId }: { code: string; meId: string }) {
  const [space, setSpace] = useState<SpaceView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Joining the space…");
  const [talking, setTalking] = useState(false);
  const [copied, setCopied] = useState(false);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const micRef = useRef<IMicrophoneAudioTrack | null>(null);
  const roleRef = useRef<string>("");

  useEffect(() => {
    let stop = false;
    async function beat() {
      const result = await joinSpace(code);
      if (stop) return;
      if (!result.ok) {
        setError(result.error);
        setSpace(null);
        void hangUp();
        return;
      }
      setError(null);
      setSpace(result.space);
    }
    void beat();
    const timer = window.setInterval(() => void beat(), 5000);
    return () => {
      stop = true;
      window.clearInterval(timer);
      void leaveSpace(code);
      void hangUp();
    };
  }, [code]);

  async function hangUp() {
    micRef.current?.close();
    micRef.current = null;
    const client = clientRef.current;
    clientRef.current = null;
    if (client) await client.leave().catch(() => undefined);
  }

  async function connect(publish: boolean) {
    const response = await fetch("/api/space/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = (await response.json()) as { ok: boolean; error?: string; appId?: string; token?: string; uid?: number; channel?: string };
    if (!data.ok || !data.appId || !data.token || !data.uid || !data.channel) {
      setStatus(data.error ?? "Voice is not connected.");
      return false;
    }
    const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
    await hangUp();
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    client.on("user-published", async (user, mediaType) => {
      if (mediaType !== "audio") return;
      await client.subscribe(user, "audio");
      user.audioTrack?.play();
    });
    await client.join(data.appId, data.channel, data.token, data.uid);
    clientRef.current = client;
    if (publish) {
      const mic = await AgoraRTC.createMicrophoneAudioTrack();
      micRef.current = mic;
      await client.publish([mic]);
      setTalking(true);
    } else {
      setTalking(false);
    }
    setStatus(publish ? "You are talking." : "You are listening.");
    return true;
  }

  const mine = space?.members.find((member) => member.id === meId);
  const role = mine?.role ?? "";

  useEffect(() => {
    if (!space || space.ended || !mine) return;
    if (roleRef.current === role && clientRef.current) return;
    roleRef.current = role;
    void connect(role === "host" || role === "speaker").catch(() => setStatus("The mic could not connect."));
    // connect is recreated each render; role is the signal that matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [space?.ended, role, code]);

  async function talk() {
    setError(null);
    const result = await talkInSpace(code);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSpace(result.space);
  }

  async function quiet() {
    const result = await listenInSpace(code);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSpace(result.space);
  }

  async function finish() {
    const result = await endSpace(code);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await hangUp();
    setSpace((current) => (current ? { ...current, ended: true, members: [] } : current));
    setStatus("This space has ended.");
  }

  async function copyLink() {
    if (!space) return;
    await navigator.clipboard.writeText(space.link);
    setCopied(true);
  }

  return (
    <main className="min-h-dvh bg-[#0c1a14] px-4 py-6 text-[#f6f1e6]">
      <div className="mx-auto w-full max-w-lg">
        <Link href="/play" className="text-sm font-semibold text-[#e0b15a]">Back to the city</Link>
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e0b15a]">Space</p>
        <h1 className="font-display text-4xl">{space?.title ?? "Space"}</h1>
        <p className="mt-2 text-sm text-[#d5e4d8]">{status}</p>
        {error ? <p className="mt-3 rounded-2xl bg-[#f3d6cc] px-3 py-2 text-sm text-[#7a2e1e]">{error}</p> : null}
        {space ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => void copyLink()} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#143d2c]">
              {copied ? "Link copied" : "Share link"}
            </button>
            {space.hostId === meId && !space.ended ? (
              <button type="button" onClick={() => void finish()} className="rounded-full bg-[#7a2e1e] px-4 py-2 text-sm font-semibold">End space</button>
            ) : null}
          </div>
        ) : null}
        {space && !space.ended ? (
          <p className="mt-3 break-all text-xs text-[#d5e4d8]">{space.link}</p>
        ) : null}
        <div className="mt-5 space-y-2">
          {space?.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-3xl bg-[#143d2c] px-4 py-3">
              <span className="font-semibold">{member.name}</span>
              <span className="text-xs uppercase tracking-[0.12em] text-[#e0b15a]">{member.role}</span>
            </div>
          ))}
        </div>
        {space && !space.ended && mine ? (
          <div className="mt-5">
            {talking || mine.role === "host" ? (
              mine.role === "host" ? (
                <p className="text-sm text-[#d5e4d8]">You are the host. Your mic is on while this page is open.</p>
              ) : (
                <button type="button" onClick={() => void quiet()} className="w-full rounded-full bg-white px-4 py-3 font-semibold text-[#143d2c]">Stop talking</button>
              )
            ) : (
              <button type="button" onClick={() => void talk()} className="w-full rounded-full bg-[#1f6b45] px-4 py-3 font-semibold">Talk</button>
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}
