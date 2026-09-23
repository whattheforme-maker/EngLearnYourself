import {
  boolean,
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Shaxsiy lug'at — foydalanuvchi kiritgan so'zlar.
 * image_path: data URL (galereya/kameradan yuklangan rasm) yoki null.
 * emoji: rasm bo'lmaganda vizual kartochka uchun piktogramma.
 */
export const words = pgTable("words", {
  id: serial("id").primaryKey(),
  word: text("word").notNull(),
  translation: text("translation").notNull(),
  transcription: text("transcription"),
  imagePath: text("image_path"),
  emoji: text("emoji"),
  category: text("category").notNull().default("Umumiy"),
  correctCount: integer("correct_count").notNull().default(0),
  wrongCount: integer("wrong_count").notNull().default(0),
  winStreak: integer("win_streak").notNull().default(0),
  isLearned: boolean("is_learned").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Gamifikatsiya va rejimlar bo'yicha daraja statistikasi (bitta qator). */
export const appStats = pgTable("app_stats", {
  id: serial("id").primaryKey(),
  coins: integer("coins").notNull().default(0),
  streakDays: integer("streak_days").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
  lastPlayedAt: date("last_played_at"),
  sessionsPlayed: integer("sessions_played").notNull().default(0),
  dailyDate: date("daily_date"),
  dailyCorrect: integer("daily_correct").notNull().default(0),
  dailyCoins: integer("daily_coins").notNull().default(0),
  quizCorrect: integer("quiz_correct").notNull().default(0),
  quizTotal: integer("quiz_total").notNull().default(0),
  listenCorrect: integer("listen_correct").notNull().default(0),
  listenTotal: integer("listen_total").notNull().default(0),
  spellCorrect: integer("spell_correct").notNull().default(0),
  spellTotal: integer("spell_total").notNull().default(0),
  tfCorrect: integer("tf_correct").notNull().default(0),
  tfTotal: integer("tf_total").notNull().default(0),
  seeded: boolean("seeded").notNull().default(false),
});

export type WordRow = typeof words.$inferSelect;
export type NewWord = typeof words.$inferInsert;
export type StatsRow = typeof appStats.$inferSelect;
