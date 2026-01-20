import { NextRequest, NextResponse } from "next/server";
import { apiProxy } from "@/lib/apiProxy";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get("game_id");
  const limit = searchParams.get("limit") || "50";
  if (!gameId) {
    return NextResponse.json({ error: "missing game_id" }, { status: 400 });
  }
  const res = await apiProxy(`/v1/draws?game_id=${encodeURIComponent(gameId)}&limit=${encodeURIComponent(limit)}`, { method: "GET" });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { "content-type": "application/json" } });
}
