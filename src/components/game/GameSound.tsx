"use client";

import { useEffect, useRef, useState } from "react";

const MUTE_KEY = "ol-sound";

export function GameSound({ track, club, rate = 1, wind = false }: { track: string | null; club: boolean; rate?: number; wind?: boolean }) {
  const [muted, setMuted] = useState(false);
  const [heard, setHeard] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const unlocked = useRef(false);
  const windStop = useRef<(() => void) | null>(null);
  const windCtx = useRef<AudioContext | null>(null);

  useEffect(() => {
    setMuted(window.localStorage.getItem(MUTE_KEY) === "off");
    const el = new Audio();
    el.loop = true;
    el.preload = "auto";
    el.autoplay = true;
    audio.current = el;
    const unlock = () => {
      unlocked.current = true;
      const node = audio.current;
      if (window.localStorage.getItem(MUTE_KEY) === "off") return;
      if (node?.src) void node.play().then(() => setHeard(true)).catch(() => undefined);
      void windCtx.current?.resume().then(() => setHeard(true)).catch(() => undefined);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      el.pause();
      el.src = "";
      if (audio.current === el) audio.current = null;
    };
  }, []);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    if (!track || muted) {
      el.pause();
      return;
    }
    el.volume = club ? 0.72 : 0.42;
    el.playbackRate = rate;
    const next = new URL(track, window.location.origin).href;
    if (el.src !== next) {
      el.src = next;
      el.load();
    }
    void el.play().then(() => {
      unlocked.current = true;
      setHeard(true);
    }).catch(() => undefined);
  }, [track, club, muted, rate]);

  useEffect(() => {
    windStop.current?.();
    windStop.current = null;
    if (!wind || muted || typeof window === "undefined") return;
    const ctx = new AudioContext();
    windCtx.current = ctx;
    const seconds = 3;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1;
      brown = brown * 0.98 + white * 0.02;
      data[i] = brown * 3.2;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const air = ctx.createBiquadFilter();
    air.type = "bandpass";
    air.frequency.value = 480;
    air.Q.value = 0.55;
    const body = ctx.createBiquadFilter();
    body.type = "lowpass";
    body.frequency.value = 1400;
    const gain = ctx.createGain();
    gain.gain.value = 0.16;
    source.connect(air);
    air.connect(body);
    body.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    let frame = 0;
    const sweep = () => {
      if (ctx.state === "closed") return;
      const t = ctx.currentTime;
      const whoosh = 0.5 + 0.5 * Math.sin(t * 2.1);
      const gust = 0.62 + 0.38 * Math.sin(t * 0.37);
      air.frequency.setTargetAtTime(220 + whoosh * gust * 980, t, 0.05);
      gain.gain.setTargetAtTime(0.07 + whoosh * 0.2, t, 0.06);
      frame = window.requestAnimationFrame(sweep);
    };
    frame = window.requestAnimationFrame(sweep);
    void ctx.resume().then(() => setHeard(true)).catch(() => undefined);
    const stop = () => {
      window.cancelAnimationFrame(frame);
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
      void ctx.close();
    };
    windStop.current = stop;
    return () => {
      stop();
      if (windCtx.current === ctx) windCtx.current = null;
      if (windStop.current === stop) windStop.current = null;
    };
  }, [wind, muted]);

  function toggle() {
    const next = !muted;
    setMuted(next);
    unlocked.current = true;
    setHeard(true);
    window.localStorage.setItem(MUTE_KEY, next ? "off" : "on");
  }

  return (
    <button
      type="button"
      aria-label={muted ? "Turn sound on" : "Turn sound off"}
      title={muted ? "Sound off" : wind ? "Wind" : club ? "Club beat" : "City sound"}
      onClick={toggle}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-base shadow-lg ${muted || !heard ? "bg-white text-[#5d6b62]" : "bg-[#17241e] text-white"}`}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
