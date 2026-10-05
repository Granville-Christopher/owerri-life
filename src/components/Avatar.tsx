import { lookById } from "@/lib/game/content";
import type { LookId } from "@/lib/game/types";

const hair: Record<LookId, string> = {
  ada: "M16 28c1-14 31-16 34-2-8-8-26-8-34 2z",
  chidi: "M18 30c0-16 28-18 32 0-6-6-24-8-32 0z",
  ngozi: "M14 32c2-18 36-18 38 2-10-12-28-12-38-2z",
  emeka: "M20 28c2-12 24-14 28 0-8-4-20-4-28 0z",
  zara: "M12 30c4-20 40-18 42 4-12-14-30-14-42-4z",
  ibe: "M18 26c2-10 26-12 30 2-8-6-22-6-30-2z",
};

export function Avatar({
  look,
  name,
  size = 48,
}: {
  look: LookId | null;
  name: string;
  size?: number;
}) {
  if (!look) {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-full bg-[#1f6b45] font-semibold text-[#f6f1e6]"
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
    );
  }
  const palette = lookById(look);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0 rounded-full">
      <circle cx="32" cy="32" r="32" fill="#efe4d2" />
      <path d={hair[look]} fill={palette.hair} />
      <circle cx="32" cy="28" r="11" fill={palette.skin} />
      <path d="M10 66c6-16 38-16 44 0" fill={palette.shirt} />
    </svg>
  );
}
