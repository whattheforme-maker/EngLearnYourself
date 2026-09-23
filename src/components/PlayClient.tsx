"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Snapshot } from "@/lib/stats";
import { MODES, type GameMode } from "@/lib/utils";
import { shadowVar } from "@/lib/vars";
import { playTone, primeVoices } from "@/lib/tts";
import { CoinIcon, FlameIcon, PlayIcon, PlusIcon, TargetIcon } from "./Icons";

const COUNTS = [5, 10, 15, 20];

export function PlayClient({ snapshot }: { snapshot: Snapshot }) {
  const router = useRouter();
  const [count, setCount] = useState(10);
  const [mode, setMode] = useState<GameMode | null>(null);

  useEffect(() => {
    primeVoices();
  }, []);

  const canPlay = snapshot.totalWords >= 4;

  function start(next: GameMode) {
    if (!canPlay) {
      router.push("/vocabulary");
      return;
    }
    playTone("tap");
    router.push(`/play/${next}?n=${count}`);
  }

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-tangerine">
          Mashq markazi
        </p>
        <h1 className="font-display text-4xl font-extrabold text-white sm:text-5xl">
          Qaysi rejimda o&apos;ynaymiz?
        </h1>
        <p className="mt-1 max-w-xl text-sm text-white/55">
          Savollar sizning lug&apos;atingizdan Fisher-Yates algoritmi bilan yig&apos;iladi: to&apos;g&apos;ri
          javob — hali yod olinmagan so&apos;zlar orasidan, 3 ta chalg&apos;ituvchi — qolgan so&apos;zlar
          orasidan.
        </p>
      </header>

      {!canPlay && (
        <div className="flex flex-wrap items-center gap-3 rounded-3xl border-2 border-coin/40 bg-coin/12 p-4">
          <TargetIcon className="h-6 w-6 text-coin" />
          <p className="flex-1 text-sm font-bold text-white/80">
            O&apos;yinni boshlash uchun kamida 4 ta so&apos;z kerak (hozir {snapshot.totalWords} ta). Optimal
            10–15 ta.
          </p>
          <Link
            href="/vocabulary"
            className="btn-3d flex items-center gap-2 rounded-xl bg-coin px-4 py-2.5 font-display text-sm font-extrabold text-night"
            style={shadowVar("#b45309")}
          >
            <PlusIcon className="h-4 w-4" /> So&apos;z qo&apos;shish
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.05] p-4">
        <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/45">
          Savollar soni
        </span>
        <div className="flex gap-2">
          {COUNTS.map((c) => (
            <button
              key={c}
              onClick={() => {
                playTone("tap");
                setCount(c);
              }}
              className={`h-10 w-12 rounded-xl font-display text-base font-extrabold transition ${
                count === c
                  ? "bg-grape text-white shadow-md"
                  : "border border-white/12 bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-tangerine/40 bg-tangerine/12 px-3 py-1.5 text-xs font-extrabold text-tangerine">
            <FlameIcon className="h-4 w-4" /> {snapshot.streakDays} kun
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-coin/40 bg-coin/12 px-3 py-1.5 text-xs font-extrabold text-coin">
            <CoinIcon className="h-4 w-4" /> {snapshot.coins}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {MODES.map((m, i) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id);
              start(m.id);
            }}
            disabled={!canPlay}
            className="card-3d animate-rise group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 text-left transition hover:-translate-y-1 hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className={`absolute -right-8 -top-10 h-32 w-32 rounded-full blur-3xl ${m.blob}`} />
            <span className={`relative grid h-14 w-14 place-items-center rounded-2xl text-3xl ${m.color}`}>
              {m.emoji}
            </span>
            <h2 className="font-display relative mt-4 text-xl font-extrabold text-white">{m.title}</h2>
            <p className="relative mt-1 text-sm leading-snug text-white/55">{m.subtitle}</p>
            <span className="relative mt-4 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/35">
                Aniqlik {snapshot.modeAccuracy[m.id]}%
              </span>
              <span
                className={`flex items-center gap-2 rounded-xl ${m.color} px-3 py-2 text-xs font-extrabold text-night`}
              >
                <PlayIcon className="h-3.5 w-3.5" /> Boshlash
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="card-3d rounded-[2rem] border border-white/10 bg-gradient-to-br from-grape/40 to-night-2 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-extrabold text-white">Aralash mashq</h2>
            <p className="text-sm text-white/60">
              Tasodifiy rejim — miya bir xil formatga o&apos;rganib qolmasligi uchun.
            </p>
          </div>
          <button
            onClick={() => {
              const random = MODES[Math.floor(Math.random() * MODES.length)];
              setMode(random.id);
              start(random.id);
            }}
            disabled={!canPlay}
            className="btn-3d font-display flex items-center gap-2 rounded-2xl bg-coin px-6 py-4 text-lg font-extrabold text-night disabled:opacity-50"
            style={shadowVar("#b45309")}
          >
            <PlayIcon className="h-5 w-5" /> TASODIFIY
          </button>
        </div>
        {mode && (
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-white/45">
            Oxirgi tanlov: {MODES.find((m) => m.id === mode)?.title}
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <InfoCard
          title="O'zlashtirish qoidasi"
          body="Ketma-ket 3 marta to'g'ri javob bersangiz so'z “O'zlashtirildi” maqomini oladi va savollarda kamroq uchraydi."
          tone="border-mint/35 bg-mint/10"
        />
        <InfoCard
          title="Xato — bu ham foyda"
          body="Xato qilingan so'z winStreak nolga tushadi va o'rganish sikliga qayta qo'shiladi. +1 tanga baribir hisoblanadi."
          tone="border-berry/35 bg-berry/10"
        />
        <InfoCard
          title="Tovush va talaffuz"
          body="Barcha so'zlar brauzer TTS orqali toza en-US aksentida, 0.45x tezlikda aytiladi."
          tone="border-sky/35 bg-sky/10"
        />
      </div>
    </div>
  );
}

function InfoCard({ title, body, tone }: { title: string; body: string; tone: string }) {
  return (
    <div className={`rounded-3xl border p-4 ${tone}`}>
      <h3 className="font-display text-base font-extrabold text-white">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-white/60">{body}</p>
    </div>
  );
}
