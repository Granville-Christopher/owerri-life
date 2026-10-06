import type { LookId } from "@/lib/game/types";

const AVATAR_IMAGES: Record<LookId, string> = {
  ada: "/avatars/ada.jpg",
  chidi: "/avatars/chidi.jpg",
  ngozi: "/avatars/ngozi.jpg",
  emeka: "/avatars/emeka.jpg",
  zara: "/avatars/zara.jpg",
  ibe: "/avatars/ibe.jpg",
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
        className="grid shrink-0 place-items-center rounded-full bg-[#1f6b45] font-semibold text-[#f6f1e6] shadow-sm"
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  const src = AVATAR_IMAGES[look];

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full ring-2 ring-[#e0b15a]/60 shadow-lg bg-[#16202c]"
      style={{ width: size, height: size }}
      title={name}
    >
      <img
        src={src}
        alt={name}
        className="h-full w-full object-cover rounded-full select-none"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}

