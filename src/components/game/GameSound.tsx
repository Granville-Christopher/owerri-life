"use client";

import { useEffect, useRef, useState } from "react";

const MUTE_KEY = "ol-sound";

export function GameSound({ track, club, rate = 1 }: { track: string | null; club: boolean; rate?: number }) {
  const [muted, setMuted] = useState(false);
  const [heard, setHeard] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const unlocked = useRef(false);

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
      if (!node?.src || window.localStorage.getItem(MUTE_KEY) === "off") return;
      void node.play().then(() => setHeard(true)).catch(() => undefined);
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
      title={muted ? "Sound off" : club ? "Club beat" : "City sound"}
      onClick={toggle}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-base shadow-lg ${muted || !heard ? "bg-white text-[#5d6b62]" : "bg-[#17241e] text-white"}`}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
