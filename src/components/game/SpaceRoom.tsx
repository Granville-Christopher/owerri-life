"use client";

import { useEffect, useRef, useState } from "react";
import type { IAgoraRTCClient, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";
import { endSpace, joinSpace, leaveSpace, listenInSpace, talkInSpace, type SpaceView } from "@/lib/game/spaces";

export function SpaceRoom({ code, meId, onLeave }: { code: string; meId: string; onLeave: () => void }) {
  const [space, setSpace] = useState<SpaceView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Joining the space…");
  const [muted, setMuted] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const micRef = useRef<IMicrophoneAudioTrack | null>(null);
  const roleRef = useRef<string>("");
  const mutedRef = useRef(false);

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
    const timer = window.setInterval(() => void beat(), 4000);
    return () => {
      stop = true;
      window.clearInterval(timer);
      void leaveSpace(code);
      void hangUp();
    };
  }, [code]);

  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let stop = false;
    async function hold() {
      try {
        lock = await navigator.wakeLock?.request("screen");
      } catch {
        /* The screen can still sleep. The mic track stays published. */
      }
    }
    void hold();
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void hold();
      const mic = micRef.current;
      if (mic && !mutedRef.current) void mic.setEnabled(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop = true;
      document.removeEventListener("visibilitychange", onVisible);
      if (!stop) lock?.release().catch(() => undefined);
      lock?.release().catch(() => undefined);
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
      return;
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
      await mic.setEnabled(!mutedRef.current);
      await client.publish([mic]);
    }
    setStatus(publish ? (mutedRef.current ? "Mic off." : "You are talking.") : "You are listening.");
  }

  const mine = space?.members.find((member) => member.id === meId);
  const role = mine?.role ?? "";
  const live = role === "host" || role === "speaker";

  useEffect(() => {
    if (!space || space.ended || !mine) return;
    if (roleRef.current === role && clientRef.current) return;
    roleRef.current = role;
    void connect(live).catch(() => setStatus("The mic could not connect."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [space?.ended, role, code]);

  async function pressMic() {
    setError(null);
    if (!live) {
      const result = await talkInSpace(code);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      mutedRef.current = false;
      setMuted(false);
      setSpace(result.space);
      return;
    }
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    await micRef.current?.setEnabled(!next);
    setStatus(next ? "Mic off." : "You are talking.");
  }

  async function quiet() {
    mutedRef.current = false;
    setMuted(false);
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
    onLeave();
  }

  async function exit() {
    if (space?.hostId === meId) {
      await finish();
      return;
    }
    await leaveSpace(code);
    await hangUp();
    onLeave();
  }

  const chosen = space?.members.find((member) => member.id === picked) ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0c1a14] text-[#f6f1e6]">
      <div className="flex items-center justify-between gap-2 px-3 py-3">
        <div className="min-w-0">
          <p className="truncate font-display text-2xl leading-none">{space?.title ?? "Space"}</p>
          <p className="mt-1 text-[11px] text-[#d5e4d8]">{status}</p>
        </div>
        <button type="button" onClick={() => void exit()} className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#143d2c]">
          Leave
        </button>
      </div>
      {error ? <p className="mx-3 rounded-2xl bg-[#f3d6cc] px-3 py-2 text-xs text-[#7a2e1e]">{error}</p> : null}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="grid grid-cols-3 gap-4">
          {space?.members.map((member) => {
            const self = member.id === meId;
            const speaking = member.role === "host" || member.role === "speaker";
            const quietMic = !speaking || (self && muted);
            const letter = member.name.slice(0, 1).toUpperCase();
            return (
              <button key={member.id} type="button" onClick={() => setPicked(member.id)} className="flex flex-col items-center gap-1">
                <span className="relative">
                  <span className={`grid h-16 w-16 place-items-center rounded-full text-xl font-semibold ${self ? "bg-[#e0b15a] text-[#1a140c]" : "bg-[#1f6b45]"}`}>{letter}</span>
                  <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-[#0c1a14] text-sm" aria-label={quietMic ? "Microphone off" : "Microphone on"}>
                    {quietMic ? "🎤🚫" : "🎤"}
                  </span>
                </span>
                <span className="max-w-full truncate text-xs font-semibold">{member.name}</span>
                {self ? (
                  <span
                    role="presentation"
                    className="grid h-8 w-8 place-items-center rounded-full bg-white text-sm text-[#143d2c]"
                    onClick={(event) => {
                      event.stopPropagation();
                      void pressMic();
                    }}
                  >
                    {muted || !speaking ? "🎤🚫" : "🎤"}
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[#e0b15a]">{member.role}</span>
                )}
              </button>
            );
          })}
        </div>
        {chosen ? (
          <div className="mt-4 rounded-3xl bg-[#143d2c] px-3 py-3 text-sm">
            <p className="font-semibold">{chosen.name}</p>
            <p className="text-xs uppercase tracking-[0.12em] text-[#e0b15a]">{chosen.role}</p>
            {chosen.id === meId && live ? (
              <button type="button" onClick={() => void quiet()} className="mt-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#143d2c]">
                Step off the mic
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="flex gap-2 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => {
            if (!space) return;
            void navigator.clipboard.writeText(space.link).then(() => setCopied(true));
          }}
          className="flex-1 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#143d2c]"
        >
          {copied ? "Link copied" : "Share"}
        </button>
        {space?.hostId === meId && !space.ended ? (
          <button type="button" onClick={() => void finish()} className="flex-1 rounded-full bg-[#7a2e1e] px-3 py-2 text-xs font-semibold">
            End space
          </button>
        ) : null}
      </div>
    </div>
  );
}
