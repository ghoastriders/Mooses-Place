import { NextRequest, NextResponse } from "next/server";
import { apiProxy } from "@/lib/apiProxy";

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  const expected = process.env.ADMIN_IMPORT_KEY || "";
  if (!expected || adminKey !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const res = await apiProxy("/v1/import", { method: "POST", body: JSON.stringify(body) });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { "content-type": "application/json" } });
}
