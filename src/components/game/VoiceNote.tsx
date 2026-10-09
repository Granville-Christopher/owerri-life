"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="mb-2">
      {error ? <p className="mb-1 text-[11px] text-[#7a2e1e]">{error}</p> : null}
      <button type="button" disabled={disabled} onClick={() => void toggle()} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${recording ? "bg-[#7a2e1e] text-white" : "bg-[#efe4d2] text-[#143d2c]"}`}>
        {recording ? "Stop voice note" : "Voice note"}
      </button>
    </div>
  );
}
