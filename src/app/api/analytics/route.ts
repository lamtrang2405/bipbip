import { NextResponse } from "next/server";
import { AnalyticsEventPayload } from "@/lib/analytics";

export async function POST(request: Request) {
  const payload = (await request.json()) as AnalyticsEventPayload;
  if (!payload?.eventName || !payload?.path) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Placeholder for Supabase insert or GA4 Measurement Protocol.
  return NextResponse.json({ ok: true });
}
