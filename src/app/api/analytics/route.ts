import { NextResponse } from "next/server";
import { AnalyticsEventPayload } from "@/lib/analytics";

export async function POST(request: Request) {
  let payload: AnalyticsEventPayload | null = null;
  try {
    payload = (await request.json()) as AnalyticsEventPayload;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!payload?.eventName || !payload?.path) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Placeholder for Supabase insert or GA4 Measurement Protocol.
  return NextResponse.json({ ok: true });
}
