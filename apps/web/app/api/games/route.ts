import { NextResponse } from "next/server";
import { apiProxy } from "@/lib/apiProxy";

export async function GET() {
  const res = await apiProxy("/v1/games", { method: "GET" });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { "content-type": "application/json" } });
}
