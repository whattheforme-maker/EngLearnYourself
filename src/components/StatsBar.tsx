"use client";

import { getJSON, STATS_REFRESH_EVENT } from "@/lib/api";
import type { Snapshot } from "@/lib/stats";
import { CoinIcon, FlameIcon, BookIcon } from "./Icons";
import { useEffect, useRef, useState } from "react";

export type StatsBarData = Pick<Snapshot, "coins" | "streakDays" | "learnedWords" | "totalWords" | "level">;

export function StatsBar({ initial }: { initial: StatsBarData }) {
  const [data, setData] = useState<StatsBarData>(initial);
  const [pulse, setPulse] = useState<string | null>(null);
  const prev = useRef(initial);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const snap = await getJSON<Snapshot>("/api/stats");
        if (!alive) return;
        const next: StatsBarData = {
          coins: snap.coins,
          streakDays: snap.streakDays,
          learnedWords: snap.learnedWords,
          totalWords: snap.totalWords,
          level: snap.level,
        };
        if (next.coins !== prev.current.coins) setPulse("coins");
        else if (next.streakDays !== prev.current.streakDays) setPulse("streak");
        else if (next.learnedWords !== prev.current.learnedWords) setPulse("words");
        prev.current = next;
        setData(next);
        window.setTimeout(() => setPulse(null), 700);
      } catch {
        /* server vaqtincha javob bermasa, boshlang'ich qiymat qoladi */
      }
    };
    void load();
    window.addEventListener(STATS_REFRESH_EVENT, load);
    return () => {
      alive = false;
      window.removeEventListener(STATS_REFRESH_EVENT, load);
    };
  }, []);

  const chip = (key: string) =>
    `flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-extrabold border transition ${
      pulse === key ? "animate-pop scale-105" : ""
    }`;

  return (
    <div className="flex items-center gap-2">
      <span
        className={chip("streak") + " border-tangerine/40 bg-tangerine/15 text-tangerine"}
        title="Kunlik ketma-ketlik"
      >
        <FlameIcon className="h-4 w-4" />
        {data.streakDays}
      </span>
      <span className={chip("words") + " border-sky/40 bg-sky/15 text-sky"} title="O'rganilgan so'zlar">
        <BookIcon className="h-4 w-4" />
        {data.learnedWords}
        <span className="font-semibold text-sky/60">/{data.totalWords}</span>
      </span>
      <span className={chip("coins") + " border-coin/40 bg-coin/15 text-coin"} title="Yig'ilgan tangalar">
        <CoinIcon className="h-4 w-4" />
        {data.coins}
      </span>
    </div>
  );
}
