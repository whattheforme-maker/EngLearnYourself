"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Snapshot } from "@/lib/stats";
import type { WordDTO } from "@/lib/types";
import { mastery, MODES, percent } from "@/lib/utils";
import { notifyStatsChanged } from "@/lib/api";
import { playTone, primeVoices, speak } from "@/lib/tts";
import { useEffect } from "react";
import { SkillRings } from "./SkillRings";
import { VisualCard } from "./VisualCard";
import { AddWordModal } from "./AddWordModal";
import { CoinIcon, FlameIcon, PlayIcon, PlusIcon, SpeakerIcon, SparkIcon, TargetIcon } from "./Icons";
import { shadowVar } from "@/lib/vars";

export function Dashboard({
  snapshot,
  recent,
  categories,
}: {
  snapshot: Snapshot;
  recent: WordDTO[];
  categories: string[];
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    primeVoices();
  }, []);

  const dailyGoal = snapshot.dailyGoal;
  const doneToday = snapshot.dailyCorrect;
  const canPlay = snapshot.totalWords >= 4;

  return (
    <div className="space-y-6">
      {/* Sarlavha */}
      <section className="animate-rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-coin">
            Shaxsiy lug&apos;at · Mini-o&apos;yinlar
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Bugun yangi so&apos;z <span className="text-coin">yodlaymizmi?</span>
          </h1>
          <p className="mt-1 max-w-md text-sm text-white/55">
            So&apos;zlarni o&apos;zingiz kiriting — ilova ular asosida LinDuo mexanikasidagi mashqlarni
            avtomatik generatsiya qiladi.
          </p>
        </div>
        <button
          onClick={() => {
            playTone("tap");
            setAddOpen(true);
          }}
          className="btn-3d flex items-center gap-2 rounded-2xl bg-berry px-5 py-3.5 font-display text-base font-extrabold text-white"
          style={shadowVar("#9d174d")}
        >
          <PlusIcon className="h-5 w-5" /> So&apos;z qo&apos;shish
        </button>
      </section>

      {/* Markaziy doiraviy progress */}
      <section className="card-3d animate-rise rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] p-5 sm:p-7" style={{ animationDelay: "60ms" }}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-extrabold text-white">Yo&apos;nalishlar bo&apos;yicha daraja</h2>
          <div className="flex gap-2">
            <Chip icon={<FlameIcon className="h-4 w-4" />} value={`${snapshot.streakDays} kun`} tone="text-tangerine border-tangerine/40 bg-tangerine/12" />
            <Chip icon={<CoinIcon className="h-4 w-4" />} value={`${snapshot.coins} tanga`} tone="text-coin border-coin/40 bg-coin/12" />
          </div>
        </div>
        <SkillRings
          reading={snapshot.skills.reading}
          listening={snapshot.skills.listening}
          spelling={snapshot.skills.spelling}
          level={snapshot.level}
          levelProgress={snapshot.levelProgress}
        />
      </section>

      {/* Katta Play + kunlik maqsad */}
      <section className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="card-3d relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-grape to-night-2 p-6">
          <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-berry/40 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white">
              <SparkIcon className="h-3.5 w-3.5" /> Mashqni boshlash
            </span>
            <h3 className="font-display mt-3 text-3xl font-extrabold leading-tight text-white">
              {canPlay ? `${snapshot.learningWords} ta so'z navbatda` : "Kamida 4 ta so'z kerak"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-white/65">
              {canPlay
                ? "Tizim sizning lug'atingizdan tasodifiy test yig'adi: 4 tadan 1, tinglash, harf yig'ish va rost/yolg'on."
                : "O'yinlar ishlashi uchun lug'atga kamida 4 ta so'z qo'shing (optimal 10–15 ta)."}
            </p>
            <button
              disabled={!canPlay}
              onClick={() => {
                playTone("tap");
                router.push("/play");
              }}
              className="btn-3d mt-5 flex items-center gap-3 rounded-2xl bg-coin px-7 py-4 font-display text-xl font-extrabold text-night"
              style={shadowVar("#b45309")}
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-night/85 text-coin">
                <PlayIcon className="h-5 w-5" />
              </span>
              PLAY
            </button>
          </div>
        </div>

        <div className="card-3d rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
          <h3 className="font-display text-lg font-extrabold text-white">Kunlik maqsad</h3>
          <p className="text-xs font-semibold text-white/50">
            {doneToday} / {dailyGoal} to&apos;g&apos;ri javob · bugun{" "}
            <span className="font-extrabold text-coin">+{snapshot.dailyCoins}</span> tanga
          </p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-mint to-sky transition-[width] duration-1000"
              style={{ width: `${percent(doneToday, dailyGoal)}%` }}
            />
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
            <MiniStat label="Jami so'z" value={snapshot.totalWords} color="text-sky" />
            <MiniStat label="Yodlandi" value={snapshot.learnedWords} color="text-mint" />
            <MiniStat label="Aniqlik" value={`${percent(snapshot.totalCorrect, snapshot.totalCorrect + snapshot.totalWrong)}%`} color="text-coin" />
          </dl>
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-white/10 bg-night/50 p-3 text-[11px] leading-snug text-white/55">
            <TargetIcon className="mt-0.5 h-4 w-4 shrink-0 text-berry" />
            Ketma-ket 3 marta to&apos;g&apos;ri topilgan so&apos;z avtomatik &ldquo;O&apos;zlashtirildi&rdquo;
            maqomiga o&apos;tadi.
          </p>
        </div>
      </section>

      {/* Xatolar ustida ishlash */}
      {snapshot.weakWords > 0 && (
        <Link
          href={snapshot.weakWords >= 4 ? "/play/quiz?weak=1&n=8" : "/vocabulary"}
          className="card-3d flex flex-wrap items-center gap-4 rounded-[2rem] border-2 border-berry/35 bg-berry/12 p-5 transition hover:border-berry/60"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-berry text-2xl">
            🩹
          </span>
          <span className="min-w-0 flex-1">
            <span className="font-display block text-lg font-extrabold text-white">
              Xatolar ustida ishlash
            </span>
            <span className="block text-sm text-white/65">
              {snapshot.weakWords} ta so&apos;zda xato qilingan — ularni alohida mashq qiling.
            </span>
          </span>
          <span className="rounded-xl bg-white/15 px-4 py-2 text-sm font-extrabold text-white">
            {snapshot.weakWords >= 4 ? "Mashq qilish →" : "Ko'rib chiqish →"}
          </span>
        </Link>
      )}

      {/* Rejimlar */}
      <section>
        <h2 className="font-display mb-3 text-xl font-extrabold text-white">4 xil mini-o&apos;yin</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODES.map((m, i) => (
            <Link
              key={m.id}
              href={canPlay ? `/play/${m.id}` : "/vocabulary"}
              onClick={() => playTone("tap")}
              className="card-3d animate-rise group rounded-3xl border border-white/10 bg-white/[0.06] p-4 transition hover:-translate-y-1 hover:bg-white/[0.1]"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <span
                className={`${m.color} grid h-12 w-12 place-items-center rounded-2xl text-2xl shadow-md`}
              >
                {m.emoji}
              </span>
              <h3 className="font-display mt-3 text-base font-extrabold text-white">{m.title}</h3>
              <p className="mt-1 text-xs leading-snug text-white/55">{m.subtitle}</p>
              <p className="mt-3 text-[11px] font-extrabold uppercase tracking-wider text-white/35">
                Aniqlik {snapshot.modeAccuracy[m.id]}%
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* So'nggi qo'shilganlar */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold text-white">So&apos;nggi kartochkalar</h2>
          <Link href="/vocabulary" className="text-sm font-extrabold text-grape-soft hover:text-white">
            Barchasi →
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
          {recent.length === 0 && (
            <p className="rounded-2xl border border-dashed border-white/15 p-6 text-sm text-white/50">
              Hozircha kartochka yo&apos;q. &ldquo;So&apos;z qo&apos;shish&rdquo; tugmasidan boshlang.
            </p>
          )}
          {recent.map((w) => {
            const m = mastery(w.correctCount, w.wrongCount, w.isLearned);
            return (
              <div
                key={w.id}
                className="w-52 shrink-0 rounded-3xl border border-white/10 bg-white/[0.07] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <VisualCard src={w.imagePath} emoji={w.emoji} alt={w.word} size="sm" />
                  <button
                    onClick={() => speak(w.word)}
                    className="grid h-9 w-9 place-items-center rounded-full bg-sky/20 text-sky transition hover:bg-sky/35"
                    aria-label={`${w.word} talaffuzi`}
                  >
                    <SpeakerIcon className="h-4 w-4" />
                  </button>
                </div>
                <p className="font-display mt-3 truncate text-lg font-extrabold text-white">{w.word}</p>
                <p className="truncate text-sm text-white/60">{w.translation}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/12">
                  <div
                    className={`h-full rounded-full ${w.isLearned ? "bg-mint" : "bg-coin"}`}
                    style={{ width: `${m}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAB */}
      <button
        onClick={() => {
          playTone("tap");
          setAddOpen(true);
        }}
        aria-label="So'z qo'shish"
        className="btn-3d fixed bottom-24 right-5 z-30 grid h-16 w-16 place-items-center rounded-full bg-berry text-white md:bottom-8"
        style={shadowVar("#9d174d")}
      >
        <PlusIcon className="h-7 w-7" />
      </button>

      <AddWordModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => {
          notifyStatsChanged();
          router.refresh();
        }}
        categories={categories}
      />
    </div>
  );
}

function Chip({ icon, value, tone }: { icon: React.ReactNode; value: string; tone: string }) {
  return (
    <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-extrabold ${tone}`}>
      {icon}
      {value}
    </span>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-night/45 py-3">
      <dt className={`font-display text-xl font-extrabold ${color}`}>{value}</dt>
      <dd className="text-[10px] font-bold uppercase tracking-wider text-white/45">{label}</dd>
    </div>
  );
}
