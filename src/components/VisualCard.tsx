/* eslint-disable @next/next/no-img-element */
type Size = "sm" | "md" | "lg" | "xl";

const SIZES: Record<Size, { box: string; emoji: string }> = {
  sm: { box: "h-14 w-14 rounded-xl", emoji: "text-2xl" },
  md: { box: "h-20 w-20 rounded-2xl", emoji: "text-4xl" },
  lg: { box: "h-32 w-32 rounded-3xl", emoji: "text-6xl" },
  xl: { box: "h-44 w-44 rounded-[2rem]", emoji: "text-8xl" },
};

export function VisualCard({
  src,
  emoji,
  alt,
  size = "md",
  className = "",
}: {
  src?: string | null;
  emoji?: string | null;
  alt: string;
  size?: Size;
  className?: string;
}) {
  const s = SIZES[size];
  if (src) {
    return (
      <div
        className={`${s.box} ${className} relative shrink-0 overflow-hidden border-2 border-white/70 bg-white shadow-md`}
      >
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`${s.box} ${className} grid shrink-0 place-items-center border-2 border-white/60 bg-gradient-to-br from-white to-cream shadow-md`}
    >
      <span className={s.emoji} aria-label={alt} role="img">
        {emoji ?? "❔"}
      </span>
    </div>
  );
}
