import { Dashboard } from "@/components/Dashboard";
import { Shell } from "@/components/Shell";
import { db } from "@/db";
import { words } from "@/db/schema";
import { getSnapshot } from "@/lib/stats";
import { toDTO } from "@/lib/types";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const snapshot = await getSnapshot();
  const rows = await db
    .select()
    .from(words)
    .orderBy(desc(words.createdAt), desc(words.id))
    .limit(8);
  const catRows = await db.select({ category: words.category }).from(words);
  const categories = Array.from(new Set(catRows.map((c) => c.category))).sort((a, b) =>
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
      <Dashboard snapshot={snapshot} recent={rows.map(toDTO)} categories={categories} />
    </Shell>
  );
}
