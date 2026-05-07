import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const agent = await validateApiKey(request);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: trackId } = await params;
  const admin = getAdminClient();

  // Verify track exists and belongs to this agent
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: track, error } = await (admin as any)
    .from("tracks")
    .select("id, agent_id, status")
    .eq("id", trackId)
    .eq("agent_id", agent.id)
    .single();

  if (error || !track) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  if (track.status === "removed") {
    return NextResponse.json({ error: "Track already removed" }, { status: 400 });
  }

  // Soft delete
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (admin as any)
    .from("tracks")
    .update({ status: "removed" })
    .eq("id", trackId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to remove track" }, { status: 500 });
  }

  // Decrement agent's track count (don't go below 0)
  await (admin as any).rpc("decrement_track_count", { agent_id_input: agent.id });

  return NextResponse.json({ message: "Track removed" });
}
