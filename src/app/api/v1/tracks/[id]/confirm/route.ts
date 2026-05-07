import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase";
import { checkFileExists, getPublicUrl } from "@/lib/r2";
import { isValidAudioType, isValidImageType } from "@/lib/utils";

export async function POST(
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
    .select("*")
    .eq("id", trackId)
    .eq("agent_id", agent.id)
    .single();

  if (error || !track) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  if (track.status !== "processing") {
    return NextResponse.json({ error: "Track already confirmed or removed" }, { status: 400 });
  }

  // Check audio file exists in R2
  const audioKey = `audio/${agent.id}/${trackId}.mp3`;
  const audioCheck = await checkFileExists(audioKey);
  if (!audioCheck.exists) {
    return NextResponse.json(
      { error: "Audio file not found. Upload to the presigned URL first." },
      { status: 400 }
    );
  }

  // Validate audio content type
  if (audioCheck.contentType && !isValidAudioType(audioCheck.contentType)) {
    return NextResponse.json(
      { error: `Invalid audio content type: ${audioCheck.contentType}` },
      { status: 400 }
    );
  }

  // Check artwork if expected
  let artworkUrl: string | null = null;
  const artworkKey = `artwork/${agent.id}/${trackId}.jpg`;
  const artworkCheck = await checkFileExists(artworkKey);
  if (artworkCheck.exists) {
    if (artworkCheck.contentType && !isValidImageType(artworkCheck.contentType)) {
      return NextResponse.json(
        { error: `Invalid artwork content type: ${artworkCheck.contentType}` },
        { status: 400 }
      );
    }
    artworkUrl = getPublicUrl(artworkKey);
  }

  // Update track to live
  const audioUrl = getPublicUrl(audioKey);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (admin as any)
    .from("tracks")
    .update({
      status: "live",
      audio_url: audioUrl,
      artwork_url: artworkUrl,
    })
    .eq("id", trackId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to confirm upload" }, { status: 500 });
  }

  // Increment agent's track count
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).rpc("increment_track_count", { agent_id_input: agent.id });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://soundclaw.ai";
  return NextResponse.json({
    track_id: trackId,
    status: "live",
    url: `${appUrl}/track/${trackId}`,
  });
}
