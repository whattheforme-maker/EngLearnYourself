"use client";

import { useEffect, useState } from "react";
import { BookIcon, PenIcon, SpeakerIcon } from "./Icons";

type Ring = {
  key: "reading" | "listening" | "spelling";
  label: string;
  value: number;
  color: string;
  Icon: typeof BookIcon;
};

export function SkillRings({
  reading,
  listening,
  spelling,
  level,
  levelProgress,
}: {
  reading: number;
  listening: number;
  spelling: number;
  level: number;
  levelProgress: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 120);
    return () => window.clearTimeout(t);
  }, []);

  const rings: Ring[] = [
    { key: "reading", label: "Reading", value: reading, color: "#38bdf8", Icon: BookIcon },
    { key: "listening", label: "Listening", value: listening, color: "#a78bfa", Icon: SpeakerIcon },
    { key: "spelling", label: "Spelling", value: spelling, color: "#21c07a", Icon: PenIcon },
  ];

  const specs = [
    { r: 104, width: 15 },
    { r: 82, width: 15 },
    { r: 60, width: 15 },
  ];

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
      <div className="relative h-[15.5rem] w-[15.5rem] shrink-0">
        <div className="absolute inset-6 rounded-full bg-grape/25 blur-3xl" />
        <svg viewBox="0 0 240 240" className="relative h-full w-full -rotate-90">
          {specs.map((spec, i) => {
            const c = 2 * Math.PI * spec.r;
            const value = rings[i].value;
            return (
              <g key={rings[i].key}>
                <circle
                  cx="120"
                  cy="120"
                  r={spec.r}
                  fill="none"
                  stroke="rgba(255,255,255,0.09)"
                  strokeWidth={spec.width}
                />
                <circle
                  cx="120"
                  cy="120"
                  r={spec.r}
                  fill="none"
                  stroke={rings[i].color}
                  strokeWidth={spec.width}
                  strokeLinecap="round"
                  strokeDasharray={c}
                  strokeDashoffset={mounted ? c - (c * value) / 100 : c}
                  style={{ transition: `stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1) ${i * 0.15}s` }}
                />
              </g>
            );
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-grape-soft">
              Daraja
            </div>
            <div className="font-display text-5xl font-extrabold leading-none text-white">{level}</div>
            <div className="mx-auto mt-2 h-1.5 w-16 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-coin to-tangerine transition-[width] duration-1000"
                style={{ width: `${mounted ? levelProgress : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <ul className="w-full space-y-3">
        {rings.map(({ key, label, value, color, Icon }, i) => (
          <li
            key={key}
            className="animate-rise flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-night"
              style={{ backgroundColor: color }}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-display text-base font-bold text-white">{label}</span>
                <span className="text-sm font-extrabold" style={{ color }}>
                  {value}%
                </span>
              </span>
              <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-white/10">
                <span
                  className="block h-full rounded-full transition-[width] duration-1000"
                  style={{ width: `${mounted ? value : 0}%`, backgroundColor: color }}
                />
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
