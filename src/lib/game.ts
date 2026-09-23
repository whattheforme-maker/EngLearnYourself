import { sample, shuffle, type GameMode } from "./utils";

export type WordCard = {
  id: number;
  word: string;
  translation: string;
  transcription: string | null;
  imagePath: string | null;
  emoji: string | null;
};

export type PoolWord = WordCard & {
  category: string;
  isLearned: boolean;
  correctCount: number;
  wrongCount: number;
};

export type Question = {
  key: string;
  mode: GameMode;
  target: WordCard;
  options: WordCard[];
  letters: string[];
  groups: number[];
  displayWord: string;
  answerTrue: boolean;
};

const LETTERS_ONLY = /[a-z]/gi;

function toCard(w: PoolWord): WordCard {
  return {
    id: w.id,
    word: w.word,
    translation: w.translation,
    transcription: w.transcription,
    imagePath: w.imagePath,
    emoji: w.emoji,
  };
}

function lettersOf(word: string) {
  const letters = word.match(LETTERS_ONLY) ?? [];
  const groups: number[] = [];
  for (const part of word.split(/[^a-z]+/gi)) {
    if (part.length) groups.push(part.length);
  }
  let scrambled = shuffle(letters);
  // Tasodifan aynan o'zi chiqib qolmasligi uchun qayta aralashtiramiz.
  let guard = 0;
  while (letters.length > 2 && scrambled.join("") === letters.join("") && guard < 8) {
    scrambled = shuffle(letters);
    guard += 1;
  }
  return { letters: scrambled, groups };
}

/**
 * Random test yaratish algoritmi (TZ 5-bo'lim):
 * 1) Target — hali yod olinmagan so'zlar orasidan tasodifiy.
 * 2) Distractors — id != target.id sharti bilan tasodifiy N ta.
 * 3) Variantlar Fisher-Yates bilan aralashtiriladi.
 */
export function buildQuestions(pool: PoolWord[], mode: GameMode, count: number): Question[] {
  if (pool.length < 4) return [];

  const unlearned = pool.filter((w) => !w.isLearned);
  const candidates = unlearned.length >= 2 ? unlearned : pool;
  const wanted = Math.max(1, Math.min(count, pool.length));

  const targets = sample(candidates, wanted);
  if (targets.length < wanted) {
    const used = new Set(targets.map((t) => t.id));
    for (const extra of sample(pool, wanted)) {
      if (targets.length >= wanted) break;
      if (!used.has(extra.id)) {
        targets.push(extra);
        used.add(extra.id);
      }
    }
  }

  const distractorCount = mode === "listening" ? 5 : 3;

  return targets.map((target, index) => {
    const others = pool.filter((w) => w.id !== target.id);
    const distractors = sample(others, Math.min(distractorCount, others.length));
    const base: Question = {
      key: `${mode}-${target.id}-${index}`,
      mode,
      target: toCard(target),
      options: [],
      letters: [],
      groups: [],
      displayWord: target.word,
      answerTrue: true,
    };

    if (mode === "quiz" || mode === "listening") {
      return { ...base, options: shuffle([toCard(target), ...distractors.map(toCard)]) };
    }

    if (mode === "spelling") {
      const { letters, groups } = lettersOf(target.word);
      return { ...base, letters, groups };
    }

    // truefalse: 50% holatda rasm ostida boshqa so'z ko'rsatiladi.
    const showTrue = Math.random() < 0.5 || distractors.length === 0;
    const fake = distractors[0];
    return {
      ...base,
      options: [toCard(target), ...(fake ? [toCard(fake)] : [])],
      displayWord: showTrue ? target.word : fake.word,
      answerTrue: showTrue,
    };
  });
}
