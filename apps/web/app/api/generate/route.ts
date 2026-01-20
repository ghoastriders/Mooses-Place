import { NextRequest, NextResponse } from "next/server";
import { apiProxy } from "@/lib/apiProxy";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.game_id) {
    return NextResponse.json({ error: "missing game_id" }, { status: 400 });
  }
  const res = await apiProxy("/v1/generate", { method: "POST", body: JSON.stringify(body) });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { "content-type": "application/json" } });
}
