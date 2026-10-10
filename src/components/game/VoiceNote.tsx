"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const RATES = [1, 1.5, 2] as const;
let currentNote: HTMLAudioElement | null = null;

export function VoiceNotePlayer({ src }: { src: string }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState<(typeof RATES)[number]>(1);
  const [progress, setProgress] = useState(0);

  function toggle() {
    const el = audio.current;
    if (!el) return;
    if (el.paused) {
      if (currentNote && currentNote !== el) currentNote.pause();
      currentNote = el;
      el.playbackRate = rate;
      void el.play();
      return;
    }
    el.pause();
  }

  function cycle() {
    const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    setRate(next);
    if (audio.current) audio.current.playbackRate = next;
  }

  const label = rate === 1 ? "1×" : rate === 1.5 ? "1.5×" : "2×";

  return (
    <div className="flex min-w-[11rem] items-center gap-2">
      <audio
        ref={audio}
        preload="metadata"
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
          if (currentNote === audio.current) currentNote = null;
        }}
        onTimeUpdate={() => {
          const el = audio.current;
          if (!el || !Number.isFinite(el.duration) || el.duration <= 0) return;
          setProgress(el.currentTime / el.duration);
        }}
      />
      <button type="button" aria-label={playing ? "Pause voice note" : "Play voice note"} onClick={toggle} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#143d2c] text-[11px] font-semibold text-white">
        {playing ? "II" : "▶"}
      </button>
      <span className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-[#143d2c]/15">
        <span className="block h-full rounded-full bg-[#1f6b45]" style={{ width: `${Math.min(100, progress * 100)}%` }} />
      </span>
      <button type="button" aria-label={`Speed ${label}`} onClick={cycle} className="shrink-0 rounded-full bg-[#143d2c]/10 px-2 py-1 text-[10px] font-semibold text-[#143d2c]">
        {label}
      </button>
    </div>
  );
}

export function VoiceNoteButton({ peerId, disabled }: { peerId: string; disabled: boolean }) {
  const router = useRouter();
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<number | null>(null);
  const stream = useRef<MediaStream | null>(null);

  function stopTracks() {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  }

  async function finish(blob: Blob) {
    const body = new FormData();
    body.set("peerId", peerId);
    body.set("audio", blob, "note.webm");
    const response = await fetch("/api/voice", { method: "POST", body });
    const data = (await response.json()) as { ok: boolean; error?: string };
    if (!data.ok) {
      setError(data.error ?? "The voice note did not send.");
      return;
    }
    setError(null);
    router.refresh();
  }

  async function toggle() {
    if (recording && recorder.current) {
      recorder.current.stop();
      return;
    }
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("This phone cannot record a voice note.");
      return;
    }
    setError(null);
    try {
      const live = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = live;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const rec = mime ? new MediaRecorder(live, { mimeType: mime }) : new MediaRecorder(live);
      chunks.current = [];
      rec.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
        stopTracks();
        setRecording(false);
        if (blob.size > 0) void finish(blob);
      };
      recorder.current = rec;
      rec.start();
      setRecording(true);
      timer.current = window.setTimeout(() => rec.stop(), 30_000);
    } catch {
      stopTracks();
      setRecording(false);
      setError("Allow the microphone to send a voice note.");
    }
  }

  return (
    <span className="relative shrink-0">
      {error ? <span className="absolute bottom-full left-0 z-10 mb-1 w-40 rounded-xl bg-[#f3d6cc] px-2 py-1 text-[10px] leading-4 text-[#7a2e1e]">{error}</span> : null}
      <button
        type="button"
        aria-label={recording ? "Stop voice note" : "Voice note"}
        disabled={disabled}
        onClick={() => void toggle()}
        className={`grid h-10 w-10 place-items-center rounded-full border ${recording ? "border-[#7a2e1e] bg-[#7a2e1e] text-white" : "border-[#e4d8c4] bg-white text-[#143d2c]"} disabled:opacity-40`}
      >
        {recording ? (
          <span className="h-3 w-3 rounded-[3px] bg-white" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M6 11a6 6 0 0 0 12 0" />
            <path d="M12 17v3" />
            <path d="M8 20h8" />
          </svg>
        )}
      </button>
    </span>
  );
}
