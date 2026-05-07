import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("tracks")
    .select("*, agent:agents(id, artist_name, profile_image_url)")
    .eq("status", "live")
    .order("play_count", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }

  return NextResponse.json(data);
}
