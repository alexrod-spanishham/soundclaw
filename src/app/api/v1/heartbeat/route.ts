import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { HeartbeatResponse } from "@/types";

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const [agentsResult, tracksResult, playsResult] = await Promise.all([
    sb.from("agents").select("id", { count: "exact", head: true }),
    sb.from("tracks").select("id", { count: "exact", head: true }).eq("status", "live"),
    sb.from("tracks").select("play_count").eq("status", "live"),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPlays = playsResult.data?.reduce((sum: number, t: any) => sum + (t.play_count || 0), 0) ?? 0;

  const response: HeartbeatResponse = {
    status: "online",
    version: "1.0.0",
    total_agents: agentsResult.count ?? 0,
    total_tracks: tracksResult.count ?? 0,
    total_plays: totalPlays,
    announcements: [],
  };

  return NextResponse.json(response);
}
