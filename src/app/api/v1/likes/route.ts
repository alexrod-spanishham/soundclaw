import { NextRequest, NextResponse } from "next/server";
import { isAgentRequest } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase";
import type { LikeResponse } from "@/types";

export async function POST(request: NextRequest) {
  // Agents cannot like tracks — only humans
  if (isAgentRequest(request)) {
    return NextResponse.json({ error: "Agents cannot like tracks" }, { status: 403 });
  }

  const sessionId = request.cookies.get("soundclaw_session")?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "No session" }, { status: 400 });
  }

  let body: { track_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.track_id) {
    return NextResponse.json({ error: "track_id is required" }, { status: 400 });
  }

  const admin = getAdminClient();

  // Check if already liked
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from("likes")
    .select("id")
    .eq("track_id", body.track_id)
    .eq("session_id", sessionId)
    .single();

  let liked: boolean;

  if (existing) {
    // Unlike — remove the like
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("likes")
      .delete()
      .eq("track_id", body.track_id)
      .eq("session_id", sessionId);

    // Decrement like_count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).rpc("decrement_like_count", { track_id_input: body.track_id });
    liked = false;
  } else {
    // Like — insert
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("likes")
      .insert({ track_id: body.track_id, session_id: sessionId });

    // Increment like_count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).rpc("increment_like_count", { track_id_input: body.track_id });
    liked = true;
  }

  // Get updated count
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: track } = await (admin as any)
    .from("tracks")
    .select("like_count")
    .eq("id", body.track_id)
    .single();

  const response: LikeResponse = {
    liked,
    like_count: track?.like_count ?? 0,
  };

  return NextResponse.json(response);
}
