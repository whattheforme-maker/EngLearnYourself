import { db } from "@/db";
import { appStats, words } from "@/db/schema";
import { sql } from "drizzle-orm";

type SeedWord = [string, string, string, string, string];

const SEED: SeedWord[] = [
  ["Brave", "Jasur, mard", "/breɪv/", "🦁", "Sifatlar"],
  ["Whisper", "Pichirlamoq", "/ˈwɪs.pər/", "🤫", "Fe'llar"],
  ["Journey", "Sayohat, yo'l", "/ˈdʒɜː.ni/", "🧭", "Ot"],
  ["Knowledge", "Bilim, ma'lumot", "/ˈnɑː.lɪdʒ/", "📚", "Ot"],
  ["Curious", "Qiziquvchan", "/ˈkjʊr.i.əs/", "🔍", "Sifatlar"],
  ["Achieve", "Erishmoq, yutmoq", "/əˈtʃiːv/", "🏆", "Fe'llar"],
  ["Environment", "Atrof-muhit", "/ɪnˈvaɪ.rən.mənt/", "🌍", "IELTS Reading"],
  ["Reliable", "Ishonchli", "/rɪˈlaɪ.ə.bəl/", "🤝", "Sifatlar"],
  ["Improve", "Yaxshilamoq", "/ɪmˈpruːv/", "📈", "Fe'llar"],
  ["Delicious", "Juda mazali", "/dɪˈlɪʃ.əs/", "🍜", "Sifatlar"],
  ["Vocabulary", "Lug'at boyligi", "/voʊˈkæb.jə.ler.i/", "🔤", "IELTS Reading"],
  ["Neighbour", "Qo'shni", "/ˈneɪ.bər/", "🏘️", "12-dars"],
  ["Courage", "Jasorat, mardlik", "/ˈkɜː.rɪdʒ/", "🛡️", "Qiyin so'zlar"],
  ["Thorough", "Puxta, sinchkov", "/ˈθɜː.roʊ/", "🧐", "Qiyin so'zlar"],
  ["Sunset", "Quyosh botishi", "/ˈsʌn.set/", "🌇", "Umumiy"],
  ["Butterfly", "Kapalak", "/ˈbʌt.ɚ.flaɪ/", "🦋", "Umumiy"],
];

let inFlight: Promise<void> | null = null;

/**
 * Birinchi ochilishda demo lug'atni yuklaydi (idempotent).
 * Paralel chaqiruvlar bitta so'rovga birlashtiriladi.
 */
export async function ensureSeed(): Promise<void> {
  if (inFlight) return inFlight;

  const task = (async () => {
    try {
      const existing = await db.select().from(appStats).limit(1);
      if (existing.length && existing[0].seeded) return;

      const countResult = await db.select({ n: sql<number>`count(*)::int` }).from(words);
      const hasWords = (countResult[0]?.n ?? 0) > 0;

      if (!hasWords) {
        await db.insert(words).values(
          SEED.map(([word, translation, transcription, emoji, category]) => ({
            word,
            translation,
            transcription,
            emoji,
            category,
          })),
        );
      }

      if (existing.length) {
        await db
          .update(appStats)
          .set({ seeded: true })
          .where(sql`${appStats.id} = ${existing[0].id}`);
      } else {
        await db.insert(appStats).values({ seeded: true });
      }
    } catch (error) {
      console.error("[seed] failed", error);
    }
  })();

  inFlight = task;
  try {
    await task;
  } finally {
    inFlight = null;
  }
}
