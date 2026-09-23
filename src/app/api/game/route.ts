import { db } from "@/db";
import { words } from "@/db/schema";
import { buildQuestions, type PoolWord } from "@/lib/game";
import { ensureSeed } from "@/lib/seed";
import { asc } from "drizzle-orm";
import { type GameMode } from "@/lib/utils";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const VALID_MODES: GameMode[] = ["quiz", "listening", "spelling", "truefalse"];

export async function GET(request: Request) {
  try {
    await ensureSeed();
    const url = new URL(request.url);
    const rawMode = url.searchParams.get("mode") ?? "quiz";
    const mode = (VALID_MODES as string[]).includes(rawMode) ? (rawMode as GameMode) : "quiz";
    const requested = Number(url.searchParams.get("count") ?? "10");
    const count = Number.isFinite(requested) ? Math.max(3, Math.min(25, requested)) : 10;
    const weakOnly = url.searchParams.get("weak") === "1";

    let rows = await db.select().from(words).orderBy(asc(words.id)).limit(500);

    // Xatolar ustida ishlash: ko'p xato qilingan so'zlar birinchi navbatda.
    if (weakOnly) {
      const weakRows = rows
        .filter((r) => r.wrongCount > 0)
        .sort((a, b) => b.wrongCount - a.wrongCount || a.correctCount - b.correctCount)
        .slice(0, 12);
      if (weakRows.length >= 4) rows = weakRows;
    }

    const pool: PoolWord[] = rows.map((r) => ({
      id: r.id,
      word: r.word,
      translation: r.translation,
      transcription: r.transcription,
      imagePath: r.imagePath,
      emoji: r.emoji,
      category: r.category,
      isLearned: r.isLearned,
      correctCount: r.correctCount,
      wrongCount: r.wrongCount,
    }));

    if (pool.length < 4) {
      return NextResponse.json({
        questions: [],
        poolSize: pool.length,
        error: "O'yinni boshlash uchun kamida 4 ta so'z kerak",
      });
    }

    const questions = buildQuestions(pool, mode, count);
    return NextResponse.json({ questions, poolSize: pool.length, mode });
  } catch (error) {
    console.error("[api/game]", error);
    return NextResponse.json({ error: "Test yaratilmadi" }, { status: 500 });
  }
}
