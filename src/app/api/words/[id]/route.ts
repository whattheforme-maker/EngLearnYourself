import { db } from "@/db";
import { words } from "@/db/schema";
import { cleanWord } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const wordId = Number(id);
    if (!Number.isFinite(wordId)) {
      return NextResponse.json({ error: "Noto'g'ri id" }, { status: 400 });
    }
    const body = (await request.json()) as Record<string, unknown>;
    const patch: Record<string, unknown> = {};

    if (typeof body.word === "string") {
      const value = cleanWord(body.word);
      if (!value) return NextResponse.json({ error: "So'z bo'sh bo'lishi mumkin emas" }, { status: 400 });
      patch.word = value.slice(0, 80);
    }
    if (typeof body.translation === "string") {
      const value = cleanWord(body.translation);
      if (!value) return NextResponse.json({ error: "Tarjima bo'sh bo'lishi mumkin emas" }, { status: 400 });
      patch.translation = value.slice(0, 160);
    }
    if (typeof body.transcription === "string") patch.transcription = cleanWord(body.transcription).slice(0, 80) || null;
    if (typeof body.category === "string") patch.category = cleanWord(body.category).slice(0, 60) || "Umumiy";
    if (typeof body.emoji === "string") patch.emoji = body.emoji.slice(0, 8) || null;
    if (typeof body.imagePath === "string") {
      patch.imagePath = body.imagePath.startsWith("data:image/") ? body.imagePath : null;
    }
    if (typeof body.isLearned === "boolean") patch.isLearned = body.isLearned;
    if (body.reset === true) {
      patch.correctCount = 0;
      patch.wrongCount = 0;
      patch.winStreak = 0;
      patch.isLearned = false;
    }

    patch.updatedAt = new Date();

    const [row] = await db.update(words).set(patch).where(eq(words.id, wordId)).returning();
    if (!row) return NextResponse.json({ error: "So'z topilmadi" }, { status: 404 });
    return NextResponse.json({ word: row });
  } catch (error) {
    console.error("[api/words PATCH]", error);
    return NextResponse.json({ error: "Yangilanmadi" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const wordId = Number(id);
    if (!Number.isFinite(wordId)) {
      return NextResponse.json({ error: "Noto'g'ri id" }, { status: 400 });
    }
    const [row] = await db.delete(words).where(eq(words.id, wordId)).returning({ id: words.id });
    if (!row) return NextResponse.json({ error: "So'z topilmadi" }, { status: 404 });
    return NextResponse.json({ ok: true, id: wordId });
  } catch (error) {
    console.error("[api/words DELETE]", error);
    return NextResponse.json({ error: "O'chirilmadi" }, { status: 500 });
  }
}
