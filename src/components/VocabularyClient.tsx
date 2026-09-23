"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { WordDTO } from "@/lib/types";
import { mastery } from "@/lib/utils";
import { notifyStatsChanged, sendJSON } from "@/lib/api";
import { playTone, primeVoices, speak } from "@/lib/tts";
import { useEffect } from "react";
import { VisualCard } from "./VisualCard";
import { AddWordModal, type WordDraft } from "./AddWordModal";
import { PlusIcon, RefreshIcon, SearchIcon, SpeakerIcon, TrashIcon } from "./Icons";
import { shadowVar } from "@/lib/vars";

type Status = "all" | "learning" | "learned";

const STATUS_TABS: { id: Status; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "learning", label: "O'rganilmoqda" },
  { id: "learned", label: "Yodlangan" },
];

export function VocabularyClient({
  words,
  categories,
}: {
  words: WordDTO[];
  categories: string[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Barchasi");
  const [status, setStatus] = useState<Status>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number; draft: WordDraft } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);

  useEffect(() => {
    primeVoices();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return words.filter((w) => {
      if (category !== "Barchasi" && w.category !== category) return false;
      if (status === "learned" && !w.isLearned) return false;
      if (status === "learning" && w.isLearned) return false;
      if (!q) return true;
      return (
        w.word.toLowerCase().includes(q) ||
        w.translation.toLowerCase().includes(q) ||
        (w.transcription ?? "").toLowerCase().includes(q)
      );
    });
  }, [words, query, category, status]);

  const learnedCount = words.filter((w) => w.isLearned).length;

  async function remove(id: number) {
    try {
      await sendJSON(`/api/words/${id}`, "DELETE");
      playTone("tap");
      notifyStatsChanged();
      router.refresh();
    } catch {
      /* ignore */
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div className="space-y-5">
      <header className="animate-rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-sky">
            Mening lug&apos;atim
          </p>
          <h1 className="font-display text-4xl font-extrabold text-white">
            {words.length} ta kartochka
          </h1>
          <p className="text-sm text-white/55">
            Shundan <span className="font-extrabold text-mint">{learnedCount} tasi</span> yodlangan
            deb belgilangan.
          </p>
        </div>
        <button
          onClick={() => {
            playTone("tap");
            setAddOpen(true);
          }}
          className="btn-3d flex items-center gap-2 rounded-2xl bg-mint px-5 py-3.5 font-display text-base font-extrabold text-night"
          style={shadowVar("#0f7a4c")}
        >
          <PlusIcon className="h-5 w-5" /> So&apos;z qo&apos;shish
        </button>
      </header>

      {/* Filtrlar */}
      <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.05] p-4">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="So'z yoki tarjima bo'yicha qidirish…"
            className="w-full rounded-2xl border-2 border-white/12 bg-night/60 py-3 pl-12 pr-4 font-semibold text-white placeholder:text-white/35 outline-none transition focus:border-sky/70"
          />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <FilterPill active={category === "Barchasi"} onClick={() => setCategory("Barchasi")}>
            Barchasi
          </FilterPill>
          {categories.map((c) => (
            <FilterPill key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </FilterPill>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setStatus(t.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold transition ${
                status === t.id
                  ? "bg-coin text-night"
                  : "border border-white/12 bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ro'yxat */}
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((w, i) => {
          const m = mastery(w.correctCount, w.wrongCount, w.isLearned);
          return (
            <article
              key={w.id}
              className="animate-rise card-3d group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.07] p-4 transition hover:border-white/25"
              style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
            >
              <div className="flex items-start gap-4">
                <VisualCard src={w.imagePath} emoji={w.emoji} alt={w.word} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-display truncate text-xl font-extrabold text-white">
                        {w.word}
                      </h3>
                      {w.transcription && (
                        <p className="truncate text-xs font-semibold text-grape-soft">
                          {w.transcription}
                        </p>
                      )}
                      <p className="mt-0.5 truncate text-sm font-semibold text-white/70">
                        {w.translation}
                      </p>
                    </div>
                    <button
                      onClick={() => speak(w.word)}
                      className="btn-3d grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky text-night"
                      style={shadowVar("#0369a1")}
                      aria-label={`${w.word} talaffuzi`}
                    >
                      <SpeakerIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/12">
                      <div
                        className={`h-full rounded-full transition-[width] duration-700 ${
                          w.isLearned ? "bg-mint" : m > 50 ? "bg-coin" : "bg-berry"
                        }`}
                        style={{ width: `${m}%` }}
                      />
                    </div>
                    <span className="text-xs font-extrabold text-white/60">{m}%</span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/12 bg-night/50 px-2.5 py-1 text-[11px] font-bold text-white/60">
                      {w.category}
                    </span>
                    <span className="text-[11px] font-bold text-mint">✓ {w.correctCount}</span>
                    <span className="text-[11px] font-bold text-berry">✕ {w.wrongCount}</span>
                    {w.isLearned && (
                      <span className="rounded-full bg-mint/20 px-2.5 py-1 text-[11px] font-extrabold text-mint">
                        O&apos;zlashtirildi
                      </span>
                    )}
                    <span className="ml-auto flex gap-1.5">
                      <button
                        onClick={() => {
                          setEditing({
                            id: w.id,
                            draft: {
                              word: w.word,
                              translation: w.translation,
                              transcription: w.transcription ?? "",
                              category: w.category,
                              imagePath: w.imagePath,
                              emoji: w.emoji,
                            },
                          });
                          setAddOpen(true);
                        }}
                        className="rounded-lg border border-white/12 px-2 py-1 text-[11px] font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
                      >
                        Tahrir
                      </button>
                      {pendingDelete === w.id ? (
                        <button
                          onClick={() => void remove(w.id)}
                          className="flex items-center gap-1 rounded-lg bg-berry px-2 py-1 text-[11px] font-extrabold text-white"
                        >
                          Tasdiqlash
                        </button>
                      ) : (
                        <button
                          onClick={() => setPendingDelete(w.id)}
                          className="grid h-7 w-7 place-items-center rounded-lg border border-white/12 text-white/50 transition hover:border-berry/50 hover:bg-berry/15 hover:text-berry"
                          aria-label="O'chirish"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center">
          <p className="font-display text-xl font-extrabold text-white">Hech narsa topilmadi</p>
          <p className="mt-1 text-sm text-white/55">
            Filtrni o&apos;zgartiring yoki yangi kartochka qo&apos;shing.
          </p>
          <button
            onClick={() => setAddOpen(true)}
            className="btn-3d mx-auto mt-5 flex items-center gap-2 rounded-2xl bg-grape px-5 py-3 font-display font-extrabold text-white"
            style={shadowVar("#4c1d95")}
          >
            <PlusIcon className="h-5 w-5" /> So&apos;z qo&apos;shish
          </button>
        </div>
      )}

      <button
        onClick={() => {
          playTone("tap");
          setEditing(null);
          setAddOpen(true);
        }}
        aria-label="So'z qo'shish"
        className="btn-3d fixed bottom-24 right-5 z-30 grid h-16 w-16 place-items-center rounded-full bg-mint text-night md:bottom-8"
        style={shadowVar("#0f7a4c")}
      >
        <PlusIcon className="h-7 w-7" />
      </button>

      <AddWordModal
        open={addOpen}
        categories={categories}
        editId={editing?.id ?? null}
        initial={editing?.draft ?? null}
        onClose={() => {
          setAddOpen(false);
          setEditing(null);
        }}
        onSaved={() => {
          setEditing(null);
          notifyStatsChanged();
          router.refresh();
        }}
      />

      <footer className="flex items-center justify-center gap-2 pt-2 text-[11px] font-semibold text-white/35">
        <RefreshIcon className="h-3.5 w-3.5" />
        Statistika har bir javobdan so&apos;ng avtomatik yangilanadi
      </footer>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-extrabold transition ${
        active
          ? "bg-sky text-night shadow-md"
          : "border border-white/12 bg-white/5 text-white/60 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
