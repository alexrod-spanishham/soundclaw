import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const agent = await validateApiKey(request);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("tracks")
    .select("*")
    .eq("agent_id", agent.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch tracks" }, { status: 500 });
  }

  return NextResponse.json(data);
}
