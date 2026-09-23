import { db } from "@/db";
import { appStats, words } from "@/db/schema";
import { ensureSeed } from "@/lib/seed";
import { getSnapshot } from "@/lib/stats";
import { todayISO, yesterdayISO, type GameMode } from "@/lib/utils";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ResultItem = { wordId: number; correct: boolean };

const MODE_KEYS: Record<GameMode, { correct: "quizCorrect" | "listenCorrect" | "spellCorrect" | "tfCorrect"; total: "quizTotal" | "listenTotal" | "spellTotal" | "tfTotal" }> = {
  quiz: { correct: "quizCorrect", total: "quizTotal" },
  listening: { correct: "listenCorrect", total: "listenTotal" },
  spelling: { correct: "spellCorrect", total: "spellTotal" },
  truefalse: { correct: "tfCorrect", total: "tfTotal" },
};

export async function POST(request: Request) {
  try {
    await ensureSeed();
    const body = (await request.json()) as { mode?: string; results?: ResultItem[] };
    const mode = (Object.keys(MODE_KEYS) as GameMode[]).includes(body.mode as GameMode)
      ? (body.mode as GameMode)
      : "quiz";
    const results = Array.isArray(body.results) ? body.results.slice(0, 60) : [];

    const [stat] = await db.select().from(appStats).limit(1);
    if (!stat) return NextResponse.json({ error: "Statistika topilmadi" }, { status: 500 });

    const ids = Array.from(new Set(results.map((r) => Number(r.wordId)).filter((n) => Number.isFinite(n))));
    const rows = ids.length ? await db.select().from(words).where(inArray(words.id, ids)) : [];
    const map = new Map(rows.map((r) => [r.id, { ...r }]));

    const newlyLearned: string[] = [];
    let correctAnswers = 0;

    for (const result of results) {
      const local = map.get(Number(result.wordId));
      if (!local) continue;
      const isCorrect = Boolean(result.correct);
      if (isCorrect) correctAnswers += 1;

      const winStreak = isCorrect ? local.winStreak + 1 : 0;
      const isLearned = winStreak >= 3; // ketma-ket 3 marta to'g'ri → "O'zlashtirildi"
      if (isLearned && !local.isLearned) newlyLearned.push(local.word);

      local.winStreak = winStreak;
      local.isLearned = isLearned;
      local.correctCount += isCorrect ? 1 : 0;
      local.wrongCount += isCorrect ? 0 : 1;
    }

    for (const local of map.values()) {
      await db
        .update(words)
        .set({
          correctCount: local.correctCount,
          wrongCount: local.wrongCount,
          winStreak: local.winStreak,
          isLearned: local.isLearned,
          updatedAt: new Date(),
        })
        .where(eq(words.id, local.id));
    }

    // Tangalar: har bir to'g'ri javob +5, xato uchun ham +1 (harakat rag'batlantiriladi).
    let coinsEarned = correctAnswers * 5 + (results.length - correctAnswers) * 1;
    const perfect = results.length >= 5 && correctAnswers === results.length;
    if (perfect) coinsEarned += 25;
    if (newlyLearned.length) coinsEarned += newlyLearned.length * 10;

    const today = todayISO();
    let streakDays = stat.streakDays;
    if (stat.lastPlayedAt !== today) {
      streakDays = stat.lastPlayedAt === yesterdayISO() ? stat.streakDays + 1 : 1;
    }

    const key = MODE_KEYS[mode];
    await db
      .update(appStats)
      .set({
        coins: stat.coins + coinsEarned,
        streakDays,
        bestStreak: Math.max(stat.bestStreak, streakDays),
        lastPlayedAt: today,
        sessionsPlayed: stat.sessionsPlayed + 1,
        dailyDate: today,
        dailyCorrect: (stat.dailyDate === today ? stat.dailyCorrect : 0) + correctAnswers,
        dailyCoins: (stat.dailyDate === today ? stat.dailyCoins : 0) + coinsEarned,
        [key.correct]: stat[key.correct] + correctAnswers,
        [key.total]: stat[key.total] + results.length,
      })
      .where(eq(appStats.id, stat.id));

    const snapshot = await getSnapshot();

    return NextResponse.json({
      ok: true,
      coinsEarned,
      perfect,
      newlyLearned,
      correct: correctAnswers,
      total: results.length,
      snapshot,
    });
  } catch (error) {
    console.error("[api/session]", error);
    return NextResponse.json({ error: "Natija saqlanmadi" }, { status: 500 });
  }
}
