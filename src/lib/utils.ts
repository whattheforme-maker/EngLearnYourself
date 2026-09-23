export type GameMode = "quiz" | "listening" | "spelling" | "truefalse";

export const MODES: {
  id: GameMode;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  blob: string;
  shadow: string;
  skill: "reading" | "listening" | "spelling";
}[] = [
  {
    id: "quiz",
    title: "4 tadan 1 tanlov",
    subtitle: "Rasm va tarjimaga mos so'zni top",
    emoji: "🎯",
    color: "bg-sky",
    blob: "bg-sky/30",
    shadow: "#0369a1",
    skill: "reading",
  },
  {
    id: "listening",
    title: "Tinglab topish",
    subtitle: "Faqat audio — to'g'ri kartochkani bos",
    emoji: "🔊",
    color: "bg-grape",
    blob: "bg-grape/35",
    shadow: "#4c1d95",
    skill: "listening",
  },
  {
    id: "spelling",
    title: "Harflardan yig'ish",
    subtitle: "Aralashgan harflardan so'z ter",
    emoji: "🔤",
    color: "bg-mint",
    blob: "bg-mint/30",
    shadow: "#0f7a4c",
    skill: "spelling",
  },
  {
    id: "truefalse",
    title: "Rost yoki Yolg'on",
    subtitle: "So'z rasmga mosmi? Tez qaror qil!",
    emoji: "⚖️",
    color: "bg-berry",
    blob: "bg-berry/30",
    shadow: "#9d174d",
    skill: "reading",
  },
];

export function modeMeta(mode: GameMode) {
  return MODES.find((m) => m.id === mode) ?? MODES[0];
}

/** Fisher-Yates — variantlar takrorlanmasligi va haqiqiy tasodifiylik uchun. */
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function sample<T>(input: readonly T[], count: number): T[] {
  return shuffle(input).slice(0, Math.max(0, count));
}

export function mastery(correct: number, wrong: number, learned: boolean): number {
  const total = correct + wrong;
  if (learned) return 100;
  if (total === 0) return 0;
  return Math.max(4, Math.min(96, Math.round((correct / total) * 100)));
}

export function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
}

export function cleanWord(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function todayISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayISO(d);
}
