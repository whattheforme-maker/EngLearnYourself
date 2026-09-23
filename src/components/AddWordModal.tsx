"use client";

import { useEffect, useRef, useState } from "react";
import { EMOJI_LIBRARY, fileToDataUrl } from "@/lib/image";
import { sendJSON } from "@/lib/api";
import { playTone, speak } from "@/lib/tts";
import { CameraIcon, CheckIcon, PlusIcon, SpeakerIcon, TrashIcon, XIcon } from "./Icons";
import { shadowVar } from "@/lib/vars";

export type WordDraft = {
  word: string;
  translation: string;
  transcription: string;
  category: string;
  imagePath: string | null;
  emoji: string | null;
};

const EMPTY: WordDraft = {
  word: "",
  translation: "",
  transcription: "",
  category: "Umumiy",
  imagePath: null,
  emoji: "📘",
};

export type AddWordModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: string[];
  initial?: WordDraft | null;
  editId?: number | null;
};

/**
 * Modal yopiq bo'lsa hech narsa render qilinmaydi, ochiq bo'lsa forma
 * komponenti mount bo'ladi — shu sababli boshlang'ich holat `initial` dan
 * bir marta quriladi (effect ichida setState qilish shart emas).
 */
export function AddWordModal(props: AddWordModalProps) {
  if (!props.open) return null;
  // Tahrirlanayotgan so'z almashganda forma holati qaytadan quriladi.
  return <AddWordModalForm key={props.editId ?? "new"} {...props} />;
}

function AddWordModalForm({ onClose, onSaved, categories, initial, editId }: AddWordModalProps) {
  const [draft, setDraft] = useState<WordDraft>(() => (initial ? { ...initial } : { ...EMPTY }));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const wordRef = useRef<HTMLInputElement>(null);

  // Modal ochilganda kiritish maydoniga fokus (tashqi tizim bilan ishlash).
  useEffect(() => {
    const timer = window.setTimeout(() => wordRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const set = <K extends keyof WordDraft>(key: K, value: WordDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Faqat rasm fayli yuklash mumkin");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      set("imagePath", dataUrl);
      set("emoji", null);
      setError(null);
      playTone("tap");
    } catch {
      setError("Rasmni yuklab bo'lmadi, boshqa fayl tanlang");
    }
  }

  async function submit() {
    if (!draft.word.trim() || !draft.translation.trim()) {
      setError("Inglizcha so'z va o'zbekcha ma'nosi majburiy");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = {
        word: draft.word.trim(),
        translation: draft.translation.trim(),
        transcription: draft.transcription.trim(),
        category: draft.category.trim() || "Umumiy",
        imagePath: draft.imagePath ?? "",
        emoji: draft.emoji ?? "",
      };
      if (editId) {
        await sendJSON(`/api/words/${editId}`, "PATCH", payload);
      } else {
        await sendJSON("/api/words", "POST", payload);
      }
      playTone("coin");
      onSaved();
      onClose();
    } catch {
      setError("Saqlashda xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-2xl border-2 border-white/12 bg-white/6 px-4 py-3 text-base font-semibold text-white placeholder:text-white/35 outline-none transition focus:border-coin/70 focus:bg-white/10";
  const label = "mb-1.5 block text-xs font-extrabold uppercase tracking-[0.14em] text-grape-soft";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night/80 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <button className="absolute inset-0 cursor-default" aria-label="Yopish" onClick={onClose} />
      <div className="animate-slide-up relative max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] border border-white/12 bg-night-2 p-5 shadow-2xl sm:rounded-[2rem]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-white">
              {editId ? "So'zni tahrirlash" : "Yangi so'z qo'shish"}
            </h2>
            <p className="text-sm text-white/55">
              Kitob, dars yoki videodan uchratgan so'zingizni kartochka qiling.
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/12 bg-white/8 text-white/70 transition hover:bg-white/16 hover:text-white"
            aria-label="Yopish"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Vizual kartochka */}
        <div className="mb-4 flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="relative">
            {draft.imagePath ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={draft.imagePath}
                alt="Tanlangan rasm"
                className="h-24 w-24 rounded-2xl border-2 border-white/60 object-cover"
              />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-2xl border-2 border-white/60 bg-gradient-to-br from-white to-cream text-5xl">
                {draft.emoji ?? "📘"}
              </div>
            )}
            {draft.imagePath && (
              <button
                onClick={() => set("imagePath", null)}
                className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-berry text-white shadow-md"
                aria-label="Rasmni olib tashlash"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => galleryRef.current?.click()}
                className="btn-3d flex items-center gap-2 rounded-xl bg-sky px-3 py-2 text-xs font-extrabold text-night"
                style={shadowVar("#0369a1")}
              >
                <PlusIcon className="h-4 w-4" /> Galereya
              </button>
              <button
                onClick={() => cameraRef.current?.click()}
                className="btn-3d flex items-center gap-2 rounded-xl bg-grape-soft px-3 py-2 text-xs font-extrabold text-night"
                style={shadowVar("#5b21b6")}
              >
                <CameraIcon className="h-4 w-4" /> Kamera
              </button>
              <button
                onClick={() => setShowEmoji((v) => !v)}
                className="rounded-xl border-2 border-white/15 px-3 py-2 text-xs font-extrabold text-white/80 transition hover:bg-white/10"
              >
                {showEmoji ? "Yopish" : "Emodzi"}
              </button>
            </div>
            <p className="text-[11px] leading-snug text-white/45">
              Rasm yuklanmasa emodzi kartochka ishlatiladi — o'yinlarda baribir ko'rinadi.
            </p>
          </div>
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </div>

        {showEmoji && (
          <div className="no-scrollbar mb-4 grid max-h-36 grid-cols-8 gap-1.5 overflow-y-auto rounded-2xl border border-white/10 bg-night/60 p-2">
            {EMOJI_LIBRARY.map((e) => (
              <button
                key={e}
                onClick={() => {
                  set("emoji", e);
                  set("imagePath", null);
                  setShowEmoji(false);
                  playTone("tap");
                }}
                className={`grid aspect-square place-items-center rounded-lg text-xl transition hover:bg-white/15 ${
                  draft.emoji === e ? "bg-coin/30 ring-2 ring-coin" : ""
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3.5">
          <div>
            <label className={label} htmlFor="w-word">
              Inglizcha so&apos;z *
            </label>
            <div className="flex gap-2">
              <input
                id="w-word"
                ref={wordRef}
                className={field}
                placeholder="masalan: Achievement"
                value={draft.word}
                maxLength={80}
                onChange={(e) => set("word", e.target.value)}
              />
              <button
                type="button"
                onClick={() => draft.word.trim() && speak(draft.word.trim())}
                className="btn-3d grid w-14 shrink-0 place-items-center rounded-2xl bg-coin text-night"
                style={shadowVar("#b45309")}
                aria-label="Talaffuzni eshitish"
                title="Talaffuz (en-US)"
              >
                <SpeakerIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div>
            <label className={label} htmlFor="w-trans">
              O&apos;zbekcha ma&apos;nosi *
            </label>
            <input
              id="w-trans"
              className={field}
              placeholder="masalan: Yutuq, erishuv"
              value={draft.translation}
              maxLength={160}
              onChange={(e) => set("translation", e.target.value)}
            />
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="w-ipa">
                Transkripsiya / izoh
              </label>
              <input
                id="w-ipa"
                className={field}
                placeholder="/əˈtʃiːv.mənt/"
                value={draft.transcription}
                maxLength={80}
                onChange={(e) => set("transcription", e.target.value)}
              />
            </div>
            <div>
              <label className={label} htmlFor="w-cat">
                Kategoriya / mavzu
              </label>
              <input
                id="w-cat"
                className={field}
                list="cat-list"
                placeholder="12-dars, IELTS Reading…"
                value={draft.category}
                maxLength={60}
                onChange={(e) => set("category", e.target.value)}
              />
              <datalist id="cat-list">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border-2 border-berry/40 bg-berry/15 px-3 py-2 text-sm font-bold text-berry">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border-2 border-white/15 py-3.5 text-base font-extrabold text-white/75 transition hover:bg-white/10"
          >
            Bekor qilish
          </button>
          <button
            onClick={() => void submit()}
            disabled={busy}
            className="btn-3d flex flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-mint py-3.5 text-base font-extrabold text-night"
            style={shadowVar("#0f7a4c")}
          >
            {busy ? "Saqlanmoqda…" : editId ? "Saqlash" : "Lug'atga qo'shish"}
            {!busy && <CheckIcon className="h-5 w-5" />}
          </button>
        </div>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-white/35">
          <TrashIcon className="h-3.5 w-3.5" /> Talaffuz flutter_tts o'rniga brauzer TTS (en-US, 0.45x) bilan
          generatsiya qilinadi
        </p>
      </div>
    </div>
  );
}
