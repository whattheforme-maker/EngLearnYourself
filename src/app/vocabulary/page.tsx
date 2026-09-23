import { Shell } from "@/components/Shell";
import { VocabularyClient } from "@/components/VocabularyClient";
import { db } from "@/db";
import { words } from "@/db/schema";
import { ensureSeed } from "@/lib/seed";
import { getSnapshot } from "@/lib/stats";
import { toDTO } from "@/lib/types";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function VocabularyPage() {
  await ensureSeed();
  const snapshot = await getSnapshot();
  const rows = await db
    .select()
    .from(words)
    .orderBy(desc(words.createdAt), desc(words.id))
    .limit(400);
  const categories = Array.from(new Set(rows.map((r) => r.category))).sort((a, b) =>
    a.localeCompare(b, "uz"),
  );

  return (
    <Shell
      stats={{
        coins: snapshot.coins,
        streakDays: snapshot.streakDays,
        learnedWords: snapshot.learnedWords,
        totalWords: snapshot.totalWords,
        level: snapshot.level,
      }}
    >
      <VocabularyClient words={rows.map(toDTO)} categories={categories} />
    </Shell>
  );
}
