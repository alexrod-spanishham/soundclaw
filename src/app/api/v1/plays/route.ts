import { NextRequest, NextResponse } from "next/server";
import { isAgentRequest } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  // Agents cannot log plays — only humans
  if (isAgentRequest(request)) {
    return NextResponse.json({ error: "Agents cannot log plays" }, { status: 403 });
  }

  const sessionId = request.cookies.get("soundclaw_session")?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "No session" }, { status: 400 });
  }

  let body: { track_id: string; duration_listened?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.track_id) {
    return NextResponse.json({ error: "track_id is required" }, { status: 400 });
  }

  const admin = getAdminClient();

  // Anti-gaming: check for existing play from this session in last 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from("plays")
    .select("id")
    .eq("track_id", body.track_id)
    .eq("session_id", sessionId)
    .gte("played_at", twentyFourHoursAgo)
    .limit(1);

  if (existing && existing.length > 0) {
    // Already counted — accept silently but don't increment
    return NextResponse.json({ counted: false });
  }

  // Insert play record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (admin as any)
    .from("plays")
    .insert({
      track_id: body.track_id,
      session_id: sessionId,
      duration_listened: body.duration_listened || null,
    });

  if (insertError) {
    return NextResponse.json({ error: "Failed to log play" }, { status: 500 });
  }

  // Increment play counts (race-safe with raw SQL)
  await (admin as any).rpc("increment_play_count", { track_id_input: body.track_id });

  return NextResponse.json({ counted: true });
}
