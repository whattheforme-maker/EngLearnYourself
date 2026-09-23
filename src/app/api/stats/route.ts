import { getSnapshot } from "@/lib/stats";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("[api/stats]", error);
    return NextResponse.json({ error: "Statistikani olishda xatolik" }, { status: 500 });
  }
}
