"use client";

const COLORS = ["#ffc233", "#ff4d8d", "#21c07a", "#38bdf8", "#a78bfa", "#ff8a3d"];

/** Deterministik PRNG — render paytida tasodifiylik chaqirmaslik uchun. */
function seeded(n: number) {
  let t = n + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function Confetti({ count = 40 }: { count?: number }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const r1 = seeded(i * 7 + 1);
        const r2 = seeded(i * 13 + 2);
        const r3 = seeded(i * 17 + 3);
        const r4 = seeded(i * 29 + 4);
        return (
          <span
            key={i}
            className="animate-fall absolute top-0 block rounded-[2px]"
            style={{
              left: `${r1 * 100}%`,
              width: 7 + r2 * 9,
              height: (7 + r2 * 9) * 0.5,
              backgroundColor: COLORS[i % COLORS.length],
              animationDelay: `${r3 * 0.4}s`,
              animationDuration: `${1.6 + r4 * 1.4}s`,
            }}
          />
        );
      })}
    </div>
  );
}
