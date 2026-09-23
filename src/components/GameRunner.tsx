"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getJSON, notifyStatsChanged, sendJSON } from "@/lib/api";
import type { Question, WordCard } from "@/lib/game";
import { modeMeta, type GameMode } from "@/lib/utils";
import { playTone, primeVoices, speak, stopSpeaking } from "@/lib/tts";
import { Confetti } from "./Confetti";
import { VisualCard } from "./VisualCard";
import { ArrowLeftIcon, CheckIcon, CoinIcon, RefreshIcon, SpeakerIcon, XIcon } from "./Icons";
import { shadowVar } from "@/lib/vars";

type Phase = "loading" | "playing" | "feedback" | "finished" | "error";
type ResultItem = { wordId: number; correct: boolean };
type SessionResult = {
  coinsEarned: number;
  perfect: boolean;
  newlyLearned: string[];
  correct: number;
  total: number;
};

export function GameRunner({
  mode,
  count,
  weak = false,
}: {
  mode: GameMode;
  count: number;
  weak?: boolean;
}) {
  const meta = modeMeta(mode);
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tfAnswer, setTfAnswer] = useState<boolean | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [session, setSession] = useState<SessionResult | null>(null);
  const [nonce, setNonce] = useState(0);

  const [results, setResults] = useState<ResultItem[]>([]);
  const timerRef = useRef<number | null>(null);

  const question = questions[idx];
  const earnedCoins = results.filter((r) => r.correct).length * 5;

  useEffect(() => {
    primeVoices();
    return () => stopSpeaking();
  }, []);

  const load = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setResults([]);
    setIdx(0);
    setSession(null);
    setPicked([]);
    setSelectedId(null);
    setTfAnswer(null);
    try {
      const data = await getJSON<{ questions: Question[]; poolSize: number; error?: string }>(
        `/api/game?mode=${mode}&count=${count}${weak ? "&weak=1" : ""}`,
      );
      if (!data.questions.length) {
        setError(data.error ?? "Lug'atda yetarli so'z yo'q");
        setPhase("error");
        return;
      }
      setQuestions(data.questions);
      setPhase("playing");
    } catch {
      setError("Server bilan bog'lanib bo'lmadi");
      setPhase("error");
    }
  }, [mode, count, weak]);

  useEffect(() => {
    // Savollar serverdan olinadi — ekran avval "loading" holatiga o'tishi shart.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load, nonce]);

  // Listening rejimida yangi savol kelganda audio avtomatik yangraydi.
  useEffect(() => {
    if (phase !== "playing" || mode !== "listening" || !question) return;
    const t = window.setTimeout(() => speak(question.target.word), 450);
    return () => window.clearTimeout(t);
  }, [phase, idx, mode, question]);

  const finish = useCallback(
    async (finalResults: ResultItem[]) => {
      stopSpeaking();
      try {
        const res = await sendJSON<SessionResult>("/api/session", "POST", { mode, results: finalResults });
        setSession(res);
        notifyStatsChanged();
      } catch {
        setSession({
          coinsEarned: 0,
          perfect: false,
          newlyLearned: [],
          correct: finalResults.filter((r) => r.correct).length,
          total: finalResults.length,
        });
      }
      setPhase("finished");
      playTone("win");
    },
    [mode],
  );

  const answer = useCallback(
    (correct: boolean) => {
      if (phase !== "playing" || !question) return;
      const next = [...results, { wordId: question.target.id, correct }];
      setResults(next);
      setLastCorrect(correct);
      setPhase("feedback");
      playTone(correct ? "correct" : "wrong");
      if (correct) speak(question.target.word, { rate: 0.5 });

      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        if (idx + 1 >= questions.length) {
          void finish(next);
        } else {
          // Keyingi savolga o'tishda tanlov holatlari tozalanadi.
          setPicked([]);
          setSelectedId(null);
          setTfAnswer(null);
          setLastCorrect(null);
          setIdx((i) => i + 1);
          setPhase("playing");
        }
      }, correct ? 1150 : 1700);
    },
    [phase, question, idx, questions.length, finish, results],
  );

  const targetLetters = useMemo(() => {
    if (!question || mode !== "spelling") return [];
    return question.letters;
  }, [question, mode]);

  const builtWord = useMemo(
    () => picked.map((p) => targetLetters[p] ?? "").join(""),
    [picked, targetLetters],
  );

  // Spelling: barcha katak to'lganda avtomatik tekshirish.
  useEffect(() => {
    if (mode !== "spelling" || phase !== "playing" || !question) return;
    if (picked.length && picked.length === question.letters.length) {
      const answerWord = question.target.word.replace(/[^a-z]/gi, "").toLowerCase();
      const t = window.setTimeout(() => answer(builtWord.toLowerCase() === answerWord), 260);
      return () => window.clearTimeout(t);
    }
  }, [picked, question, mode, phase, builtWord, answer]);

  const progress = questions.length ? ((idx + (phase === "feedback" ? 1 : 0)) / questions.length) * 100 : 0;

  return (
    <div className="relative min-h-screen bg-night">
      <div className="dots-bg pointer-events-none fixed inset-0 opacity-60" />
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className={`absolute -top-28 left-1/4 h-80 w-80 rounded-full blur-[130px] ${meta.blob}`} />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-grape/30 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-5">
        {/* Yuqori panel */}
        <header className="flex items-center gap-3">
          <button
            onClick={() => {
              stopSpeaking();
              router.push("/play");
            }}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/12 bg-white/8 text-white/70 transition hover:bg-white/16 hover:text-white"
            aria-label="Chiqish"
          >
            <XIcon className="h-4 w-4" />
          </button>
          <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-white/12">
            <div
              className="h-full rounded-full bg-gradient-to-r from-coin to-tangerine transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="shrink-0 text-sm font-extrabold text-white/70">
            {Math.min(idx + 1, questions.length || 1)}/{questions.length || count}
          </span>
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-coin/40 bg-coin/12 px-2.5 py-1 text-xs font-extrabold text-coin">
            <CoinIcon className="h-3.5 w-3.5" />
            {earnedCoins}
          </span>
        </header>

        <div className="mt-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-white/45">
          <span className={`grid h-7 w-7 place-items-center rounded-lg ${meta.color} text-base`}>
            {meta.emoji}
          </span>
          {meta.title}
          {weak && (
            <span className="rounded-full border border-berry/40 bg-berry/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-berry">
              Xatolar ustida
            </span>
          )}
        </div>

        {/* Asosiy maydon */}
        <main className="flex flex-1 flex-col justify-center py-6">
          {phase === "loading" && <LoadingState label="Test generatsiya qilinmoqda…" />}

          {phase === "error" && (
            <div className="rounded-3xl border border-berry/40 bg-berry/10 p-8 text-center">
              <p className="font-display text-2xl font-extrabold text-white">O'yin boshlanmadi</p>
              <p className="mt-2 text-sm text-white/65">{error}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/vocabulary"
                  className="btn-3d rounded-2xl bg-mint px-5 py-3 font-display font-extrabold text-night"
                  style={shadowVar("#0f7a4c")}
                >
                  So'z qo'shish
                </Link>
                <Link
                  href="/play"
                  className="rounded-2xl border-2 border-white/15 px-5 py-3 font-display font-extrabold text-white/80"
                >
                  Rejimlar
                </Link>
              </div>
            </div>
          )}

          {phase === "finished" && session && (
            <FinishScreen
              session={session}
              mode={mode}
              onReplay={() => {
                playTone("tap");
                setNonce((n) => n + 1);
              }}
            />
          )}

          {question && (phase === "playing" || phase === "feedback") && (
            <div key={question.key} className="animate-rise space-y-6">
              {mode === "quiz" && (
                <QuizView
                  question={question}
                  selectedId={selectedId}
                  phase={phase}
                  lastCorrect={lastCorrect}
                  onPick={(card) => {
                    if (phase !== "playing") return;
                    setSelectedId(card.id);
                    playTone("tap");
                    answer(card.id === question.target.id);
                  }}
                />
              )}

              {mode === "listening" && (
                <ListeningView
                  question={question}
                  selectedId={selectedId}
                  phase={phase}
                  lastCorrect={lastCorrect}
                  onPick={(card) => {
                    if (phase !== "playing") return;
                    setSelectedId(card.id);
                    playTone("tap");
                    answer(card.id === question.target.id);
                  }}
                />
              )}

              {mode === "spelling" && (
                <SpellingView
                  question={question}
                  picked={picked}
                  phase={phase}
                  lastCorrect={lastCorrect}
                  builtWord={builtWord}
                  onTile={(tileIndex) => {
                    if (phase !== "playing") return;
                    playTone("tap");
                    setPicked((p) => (p.includes(tileIndex) ? p : [...p, tileIndex]));
                  }}
                  onSlot={(slotIndex) => {
                    if (phase !== "playing") return;
                    setPicked((p) => p.filter((_, i) => i !== slotIndex));
                  }}
                  onClear={() => setPicked([])}
                />
              )}

              {mode === "truefalse" && (
                <TrueFalseView
                  question={question}
                  tfAnswer={tfAnswer}
                  phase={phase}
                  lastCorrect={lastCorrect}
                  onPick={(value) => {
                    if (phase !== "playing") return;
                    setTfAnswer(value);
                    playTone("tap");
                    answer(value === question.answerTrue);
                  }}
                />
              )}

              {phase === "feedback" && <FeedbackBar correct={Boolean(lastCorrect)} word={question.target} />}
            </div>
          )}
        </main>
      </div>

      {phase === "finished" && session?.perfect && <Confetti count={60} />}
    </div>
  );
}

/* ---------- Rejim ekranlari ---------- */

function QuizView({
  question,
  selectedId,
  phase,
  lastCorrect,
  onPick,
}: {
  question: Question;
  selectedId: number | null;
  phase: Phase;
  lastCorrect: boolean | null;
  onPick: (card: WordCard) => void;
}) {
  return (
    <>
      <div className="flex flex-col items-center gap-3 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
        <VisualCard src={question.target.imagePath} emoji={question.target.emoji} alt="Topiladigan so'z" size="xl" className="animate-float" />
        <p className="font-display text-center text-2xl font-extrabold text-white sm:text-3xl">
          {question.target.translation}
        </p>
        {question.target.transcription && phase === "feedback" && (
          <p className="text-sm font-semibold text-grape-soft">{question.target.transcription}</p>
        )}
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
          Qaysi inglizcha so'z mos keladi?
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((opt) => {
          const isTarget = opt.id === question.target.id;
          const isPicked = selectedId === opt.id;
          const reveal = phase === "feedback";
          const tone = !reveal
            ? "bg-sky text-night"
            : isTarget
              ? "bg-mint text-night"
              : isPicked
                ? "bg-berry text-white"
                : "bg-white/8 text-white/40";
          return (
            <button
              key={opt.id}
              onClick={() => onPick(opt)}
              disabled={reveal}
              className={`btn-3d font-display flex items-center justify-between gap-2 rounded-2xl px-5 py-4 text-left text-lg font-extrabold ${tone} ${
                reveal && isTarget ? "animate-pop" : ""
              } ${reveal && isPicked && !isTarget ? "animate-shake" : ""}`}
              style={shadowVar(reveal ? "rgba(0,0,0,.35)" : "#0369a1")}
            >
              <span className="truncate">{opt.word}</span>
              {reveal && isTarget && <CheckIcon className="h-5 w-5 shrink-0" />}
              {reveal && isPicked && !isTarget && <XIcon className="h-5 w-5 shrink-0" />}
            </button>
          );
        })}
      </div>
      {lastCorrect === false && phase === "feedback" && (
        <p className="text-center text-sm font-bold text-white/60">
          To'g'ri javob: <span className="text-mint">{question.target.word}</span>
        </p>
      )}
    </>
  );
}

function ListeningView({
  question,
  selectedId,
  phase,
  lastCorrect,
  onPick,
}: {
  question: Question;
  selectedId: number | null;
  phase: Phase;
  lastCorrect: boolean | null;
  onPick: (card: WordCard) => void;
}) {
  const reveal = phase === "feedback";
  return (
    <>
      <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-white/10 bg-gradient-to-br from-grape/35 to-white/[0.03] p-8">
        <button
          onClick={() => speak(question.target.word)}
          className="btn-3d grid h-28 w-28 place-items-center rounded-full bg-grape text-white"
          style={shadowVar("#4c1d95")}
          aria-label="Audioni qayta eshitish"
        >
          <SpeakerIcon className="h-14 w-14" />
        </button>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/50">
          Eshiting va to'g'ri kartochkani tanlang
        </p>
        {reveal && (
          <p className="font-display animate-pop text-3xl font-extrabold text-white">
            {question.target.word}
            <span className="ml-2 text-lg font-bold text-grape-soft">{question.target.translation}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {question.options.map((opt) => {
          const isTarget = opt.id === question.target.id;
          const isPicked = selectedId === opt.id;
          const ring = !reveal
            ? "border-white/12 bg-white/[0.07] hover:border-white/40"
            : isTarget
              ? "border-mint bg-mint/20"
              : isPicked
                ? "border-berry bg-berry/20"
                : "border-white/8 bg-white/[0.03] opacity-45";
          return (
            <button
              key={opt.id}
              onClick={() => onPick(opt)}
              disabled={reveal}
              className={`flex flex-col items-center gap-1 rounded-3xl border-2 p-3 transition ${ring} ${
                reveal && isPicked && !isTarget ? "animate-shake" : ""
              } ${reveal && isTarget ? "animate-pop" : ""}`}
            >
              <VisualCard src={opt.imagePath} emoji={opt.emoji} alt={reveal ? opt.word : "Kartochka"} size="md" className="border-white/40" />
              <span className="text-[11px] font-extrabold text-white/70">
                {reveal ? opt.word : "• • •"}
              </span>
            </button>
          );
        })}
      </div>
      {lastCorrect === false && reveal && (
        <p className="text-center text-sm font-bold text-white/60">
          To'g'ri javob: <span className="text-mint">{question.target.word}</span>
        </p>
      )}
    </>
  );
}

function SpellingView({
  question,
  picked,
  phase,
  lastCorrect,
  builtWord,
  onTile,
  onSlot,
  onClear,
}: {
  question: Question;
  picked: number[];
  phase: Phase;
  lastCorrect: boolean | null;
  builtWord: string;
  onTile: (index: number) => void;
  onSlot: (index: number) => void;
  onClear: () => void;
}) {
  const reveal = phase === "feedback";
  const groups = question.groups.length ? question.groups : [question.letters.length];
  let cursor = 0;

  return (
    <>
      <div className="flex flex-col items-center gap-3 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
        <VisualCard src={question.target.imagePath} emoji={question.target.emoji} alt="So'z" size="lg" className="animate-float" />
        <p className="font-display text-2xl font-extrabold text-white">{question.target.translation}</p>
        <button
          onClick={() => speak(question.target.word)}
          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-extrabold text-white/75 transition hover:bg-white/16"
        >
          <SpeakerIcon className="h-4 w-4" /> Talaffuzni eshitish
        </button>
      </div>

      <div className={`flex flex-wrap items-end justify-center gap-4 ${reveal && lastCorrect === false ? "animate-shake" : ""}`}>
        {groups.map((size, gi) => (
          <div key={gi} className="flex gap-1.5">
            {Array.from({ length: size }).map((_, si) => {
              const slotIndex = cursor++;
              const letter = picked[slotIndex] !== undefined ? question.letters[picked[slotIndex]] : "";
              const filled = Boolean(letter);
              return (
                <button
                  key={si}
                  onClick={() => filled && onSlot(slotIndex)}
                  className={`font-display grid h-12 w-10 place-items-center rounded-xl border-2 text-xl font-extrabold transition sm:h-14 sm:w-12 sm:text-2xl ${
                    reveal
                      ? lastCorrect
                        ? "border-mint bg-mint/25 text-white"
                        : "border-berry bg-berry/20 text-white"
                      : filled
                        ? "border-coin bg-coin/20 text-white"
                        : "border-dashed border-white/25 bg-white/5 text-white/25"
                  }`}
                >
                  {filled ? letter : "_"}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {question.letters.map((letter, i) => {
          const used = picked.includes(i);
          return (
            <button
              key={i}
              onClick={() => onTile(i)}
              disabled={used || reveal}
              className={`font-display btn-3d h-13 grid w-12 place-items-center rounded-2xl text-xl font-extrabold sm:h-14 sm:w-14 ${
                used
                  ? "border-2 border-white/8 bg-white/5 text-white/20 shadow-none"
                  : "bg-grape-soft text-night"
              }`}
              style={shadowVar(used ? "transparent" : "#5b21b6")}
            >
              {letter.toUpperCase()}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onClear}
          disabled={reveal || picked.length === 0}
          className="flex items-center gap-2 rounded-xl border-2 border-white/15 px-4 py-2 text-sm font-extrabold text-white/70 transition hover:bg-white/10 disabled:opacity-40"
        >
          <RefreshIcon className="h-4 w-4" /> Tozalash
        </button>
        <span className="text-sm font-bold text-white/40">{builtWord.length ? builtWord : "harflarni bosing"}</span>
      </div>

      {reveal && lastCorrect === false && (
        <p className="text-center text-sm font-bold text-white/60">
          To'g'ri yozilishi: <span className="text-mint">{question.target.word}</span>
        </p>
      )}
    </>
  );
}

function TrueFalseView({
  question,
  tfAnswer,
  phase,
  lastCorrect,
  onPick,
}: {
  question: Question;
  tfAnswer: boolean | null;
  phase: Phase;
  lastCorrect: boolean | null;
  onPick: (value: boolean) => void;
}) {
  const reveal = phase === "feedback";
  return (
    <>
      <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
        <VisualCard src={question.target.imagePath} emoji={question.target.emoji} alt="Rasm" size="xl" className="animate-float" />
        <p className="font-display text-center text-3xl font-extrabold tracking-wide text-white sm:text-4xl">
          {question.displayWord.toUpperCase()}
        </p>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
          Bu so'z rasmga mos keladimi?
        </p>
        {reveal && (
          <p className="animate-pop text-sm font-bold text-white/70">
            Rasm: <span className="text-mint">{question.target.word}</span> · {question.target.translation}
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => onPick(true)}
          disabled={reveal}
          className={`btn-3d font-display rounded-2xl px-6 py-6 text-2xl font-extrabold ${
            reveal
              ? question.answerTrue
                ? "animate-pop bg-mint text-night"
                : tfAnswer === true
                  ? "animate-shake bg-berry text-white"
                  : "bg-white/8 text-white/35"
              : "bg-mint text-night"
          }`}
          style={shadowVar("#0f7a4c")}
        >
          TO'G'RI
        </button>
        <button
          onClick={() => onPick(false)}
          disabled={reveal}
          className={`btn-3d font-display rounded-2xl px-6 py-6 text-2xl font-extrabold ${
            reveal
              ? !question.answerTrue
                ? "animate-pop bg-mint text-night"
                : tfAnswer === false
                  ? "animate-shake bg-berry text-white"
                  : "bg-white/8 text-white/35"
              : "bg-berry text-white"
          }`}
          style={shadowVar("#9d174d")}
        >
          NOTO'G'RI
        </button>
      </div>
      {lastCorrect === false && reveal && (
        <p className="text-center text-sm font-bold text-white/60">
          To'g'ri javob: <span className="text-mint">{question.answerTrue ? "TO'G'RI" : "NOTO'G'RI"}</span>
        </p>
      )}
    </>
  );
}

function FeedbackBar({ correct, word }: { correct: boolean; word: WordCard }) {
  return (
    <div
      className={`animate-slide-up fixed inset-x-0 bottom-0 z-30 border-t-2 px-4 py-4 ${
        correct ? "border-mint bg-mint/20 backdrop-blur-md" : "border-berry bg-berry/20 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-white ${
            correct ? "bg-mint" : "bg-berry"
          }`}
        >
          {correct ? <CheckIcon className="h-6 w-6" /> : <XIcon className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <p className="font-display text-lg font-extrabold leading-tight text-white">
            {correct ? "Zo'r! +5 tanga" : "Xato — bu so'z yana qaytadi"}
          </p>
          <p className="truncate text-sm font-semibold text-white/70">
            {word.word} — {word.translation}
          </p>
        </div>
        <button
          onClick={() => speak(word.word)}
          className="ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
          aria-label="Talaffuz"
        >
          <SpeakerIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function FinishScreen({
  session,
  mode,
  onReplay,
}: {
  session: SessionResult;
  mode: GameMode;
  onReplay: () => void;
}) {
  const meta = modeMeta(mode);
  const accuracy = session.total ? Math.round((session.correct / session.total) * 100) : 0;
  return (
    <div className="animate-rise mx-auto w-full max-w-md rounded-[2rem] border border-white/12 bg-gradient-to-br from-white/12 to-white/[0.03] p-7 text-center">
      <span className={`mx-auto grid h-20 w-20 place-items-center rounded-3xl text-4xl ${meta.color}`}>
        {accuracy >= 80 ? "🏆" : accuracy >= 50 ? "🎉" : "💪"}
      </span>
      <h2 className="font-display mt-4 text-3xl font-extrabold text-white">
        {accuracy >= 80 ? "Ajoyib natija!" : accuracy >= 50 ? "Yaxshi harakat!" : "Yana mashq qilamiz"}
      </h2>
      <p className="mt-1 text-sm text-white/60">{meta.title} rejimi yakunlandi</p>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <Stat label="To'g'ri" value={`${session.correct}/${session.total}`} color="text-mint" />
        <Stat label="Aniqlik" value={`${accuracy}%`} color="text-sky" />
        <Stat label="Tanga" value={`+${session.coinsEarned}`} color="text-coin" />
      </div>

      {session.perfect && (
        <p className="mt-4 rounded-2xl border border-coin/40 bg-coin/12 px-4 py-2 text-sm font-extrabold text-coin">
          ★ Barcha javoblar to'g'ri — +25 bonus tanga
        </p>
      )}

      {session.newlyLearned.length > 0 && (
        <div className="mt-4 rounded-2xl border border-mint/35 bg-mint/10 p-4 text-left">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-mint">
            Yangi o'zlashtirilgan so'zlar
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {session.newlyLearned.map((w) => (
              <li key={w} className="rounded-full bg-white/12 px-3 py-1 text-sm font-bold text-white">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid gap-3">
        <button
          onClick={onReplay}
          className="btn-3d font-display flex items-center justify-center gap-2 rounded-2xl bg-coin px-6 py-4 text-lg font-extrabold text-night"
          style={shadowVar("#b45309")}
        >
          <RefreshIcon className="h-5 w-5" /> Yana o'ynash
        </button>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/play"
            className="rounded-2xl border-2 border-white/15 px-4 py-3 font-display font-extrabold text-white/80 transition hover:bg-white/10"
          >
            Rejimlar
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-white/15 px-4 py-3 font-display font-extrabold text-white/80 transition hover:bg-white/10"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Bosh sahifa
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-night/50 py-3">
      <p className={`font-display text-lg font-extrabold ${color}`}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">{label}</p>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/15 border-t-coin" />
      <p className="text-sm font-bold text-white/55">{label}</p>
    </div>
  );
}
