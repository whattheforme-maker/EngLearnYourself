import { GameRunner } from "@/components/GameRunner";
import { ensureSeed } from "@/lib/seed";
import type { GameMode } from "@/lib/utils";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const VALID: GameMode[] = ["quiz", "listening", "spelling", "truefalse"];

export default async function GamePage({
  params,
  searchParams,
}: {
  params: Promise<{ mode: string }>;
  searchParams: Promise<{ n?: string | string[]; weak?: string | string[] }>;
}) {
  const { mode } = await params;
  const sp = await searchParams;
  if (!(VALID as string[]).includes(mode)) notFound();

  await ensureSeed();
  const raw = Number(Array.isArray(sp.n) ? sp.n[0] : sp.n ?? 10);
  const count = Number.isFinite(raw) ? Math.max(3, Math.min(25, raw)) : 10;
  const weakRaw = Array.isArray(sp.weak) ? sp.weak[0] : sp.weak;
  const weak = weakRaw === "1" || weakRaw === "true";

  return <GameRunner mode={mode as GameMode} count={count} weak={weak} />;
}
