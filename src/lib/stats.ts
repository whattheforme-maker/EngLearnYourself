import { db } from "@/db";
import { appStats, words } from "@/db/schema";
import { sql } from "drizzle-orm";
import { percent, todayISO } from "./utils";
import { ensureSeed } from "./seed";

export type Snapshot = {
  coins: number;
  streakDays: number;
  bestStreak: number;
  sessionsPlayed: number;
  lastPlayedAt: string | null;
  totalWords: number;
  learnedWords: number;
  learningWords: number;
  weakWords: number;
  totalCorrect: number;
  totalWrong: number;
  dailyCorrect: number;
  dailyCoins: number;
  dailyGoal: number;
  level: number;
  levelProgress: number;
  skills: {
    reading: number;
    listening: number;
    spelling: number;
  };
  modeAccuracy: {
    quiz: number;
    listening: number;
    spelling: number;
    truefalse: number;
  };
};

const EMPTY: Snapshot = {
  coins: 0,
  streakDays: 0,
  bestStreak: 0,
  sessionsPlayed: 0,
  lastPlayedAt: null,
  totalWords: 0,
  learnedWords: 0,
  learningWords: 0,
  weakWords: 0,
  totalCorrect: 0,
  totalWrong: 0,
  dailyCorrect: 0,
  dailyCoins: 0,
  dailyGoal: 20,
  level: 1,
  levelProgress: 0,
  skills: { reading: 0, listening: 0, spelling: 0 },
  modeAccuracy: { quiz: 0, listening: 0, spelling: 0, truefalse: 0 },
};

export async function getSnapshot(): Promise<Snapshot> {
  await ensureSeed();
  const [stat] = await db.select().from(appStats).limit(1);
  const [agg] = await db
    .select({
      total: sql<number>`count(*)::int`,
      learned: sql<number>`count(*) filter (where ${words.isLearned})::int`,
      weak: sql<number>`count(*) filter (where ${words.wrongCount} > 0)::int`,
    })
    .from(words);

  if (!stat) {
    return {
      ...EMPTY,
      totalWords: agg?.total ?? 0,
      learnedWords: agg?.learned ?? 0,
      weakWords: agg?.weak ?? 0,
    };
  }

  const totalAnswers =
    stat.quizTotal + stat.listenTotal + stat.spellTotal + stat.tfTotal;
  const totalCorrect = stat.quizCorrect + stat.listenCorrect + stat.spellCorrect + stat.tfCorrect;
  const level = Math.floor(totalCorrect / 25) + 1;
  const isToday = stat.dailyDate === todayISO();

  return {
    dailyCorrect: isToday ? stat.dailyCorrect : 0,
    dailyCoins: isToday ? stat.dailyCoins : 0,
    dailyGoal: 20,
    coins: stat.coins,
    streakDays: stat.streakDays,
    bestStreak: stat.bestStreak,
    sessionsPlayed: stat.sessionsPlayed,
    lastPlayedAt: stat.lastPlayedAt,
    totalWords: agg?.total ?? 0,
    learnedWords: agg?.learned ?? 0,
    learningWords: (agg?.total ?? 0) - (agg?.learned ?? 0),
    weakWords: agg?.weak ?? 0,
    totalCorrect,
    totalWrong: totalAnswers - totalCorrect,
    level,
    levelProgress: percent(totalCorrect % 25, 25),
    skills: {
      reading: percent(stat.quizCorrect + stat.tfCorrect, stat.quizTotal + stat.tfTotal),
      listening: percent(stat.listenCorrect, stat.listenTotal),
      spelling: percent(stat.spellCorrect, stat.spellTotal),
    },
    modeAccuracy: {
      quiz: percent(stat.quizCorrect, stat.quizTotal),
      listening: percent(stat.listenCorrect, stat.listenTotal),
      spelling: percent(stat.spellCorrect, stat.spellTotal),
      truefalse: percent(stat.tfCorrect, stat.tfTotal),
    },
  };
}
