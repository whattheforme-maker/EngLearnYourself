import { db } from "@/db";
import { words } from "@/db/schema";
import { ensureSeed } from "@/lib/seed";
import { cleanWord } from "@/lib/utils";
import { and, desc, ilike, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_IMAGE_CHARS = 1_200_000;

function normalizeImage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith("data:image/")) return null;
  if (trimmed.length > MAX_IMAGE_CHARS) return null;
  return trimmed;
}

export async function GET(request: Request) {
  try {
    await ensureSeed();
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const category = url.searchParams.get("category")?.trim() ?? "";
    const status = url.searchParams.get("status") ?? "all";

    const filters = [];
    if (q) {
      filters.push(or(ilike(words.word, `%${q}%`), ilike(words.translation, `%${q}%`)));
    }
    if (category && category !== "Barchasi") {
      filters.push(sql`${words.category} = ${category}`);
    }
    if (status === "learned") filters.push(sql`${words.isLearned} = true`);
    if (status === "learning") filters.push(sql`${words.isLearned} = false`);

    const rows = await db
      .select()
      .from(words)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(words.createdAt), desc(words.id))
      .limit(400);

    const all = await db.select({ category: words.category }).from(words);
    const categories = Array.from(new Set(all.map((c) => c.category))).sort((a, b) =>
      a.localeCompare(b, "uz"),
    );

    return NextResponse.json({ words: rows, categories });
  } catch (error) {
    console.error("[api/words GET]", error);
    return NextResponse.json({ error: "Lug'atni yuklab bo'lmadi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureSeed();
    const body = (await request.json()) as Record<string, unknown>;
    const word = cleanWord(String(body.word ?? ""));
    const translation = cleanWord(String(body.translation ?? ""));

    if (!word || !translation) {
      return NextResponse.json(
        { error: "Inglizcha so'z va o'zbekcha ma'nosi majburiy" },
        { status: 400 },
      );
    }
    if (word.length > 80 || translation.length > 160) {
      return NextResponse.json({ error: "So'z yoki tarjima juda uzun" }, { status: 400 });
    }

    const [row] = await db
      .insert(words)
      .values({
        word,
        translation,
        transcription: cleanWord(String(body.transcription ?? "")).slice(0, 80) || null,
        imagePath: normalizeImage(body.imagePath),
        emoji: typeof body.emoji === "string" ? body.emoji.slice(0, 8) || null : null,
        category: cleanWord(String(body.category ?? "Umumiy")).slice(0, 60) || "Umumiy",
      })
      .returning();

    return NextResponse.json({ word: row }, { status: 201 });
  } catch (error) {
    console.error("[api/words POST]", error);
    return NextResponse.json({ error: "So'z qo'shilmadi" }, { status: 500 });
  }
}
