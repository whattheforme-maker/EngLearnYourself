import { PlayClient } from "@/components/PlayClient";
import { Shell } from "@/components/Shell";
import { getSnapshot } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function PlayPage() {
  const snapshot = await getSnapshot();
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
      <PlayClient snapshot={snapshot} />
    </Shell>
  );
}
