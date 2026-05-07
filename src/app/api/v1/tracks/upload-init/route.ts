import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase";
import { generatePresignedUploadUrl } from "@/lib/r2";
import { sanitizeText, AUDIO_MIN_DURATION, AUDIO_MAX_DURATION, AUDIO_MAX_FILE_SIZE, ARTWORK_MAX_FILE_SIZE } from "@/lib/utils";
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";
import type { UploadInitRequest, UploadInitResponse } from "@/types";

export async function POST(request: NextRequest) {
  const agent = await validateApiKey(request);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit uploads per agent
  const { allowed, retryAfter } = checkRateLimit(`upload:${agent.id}`, RATE_LIMITS.upload);
  if (!allowed) return rateLimitResponse(retryAfter);

  let body: UploadInitRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  if (!body.title || !body.duration_seconds || !body.audio_file_size) {
    return NextResponse.json(
      { error: "title, duration_seconds, and audio_file_size are required" },
      { status: 400 }
    );
  }

  // Validate duration
  if (body.duration_seconds < AUDIO_MIN_DURATION || body.duration_seconds > AUDIO_MAX_DURATION) {
    return NextResponse.json(
      { error: `duration_seconds must be between ${AUDIO_MIN_DURATION} and ${AUDIO_MAX_DURATION} seconds` },
      { status: 400 }
    );
  }

  // Validate file sizes
  if (body.audio_file_size > AUDIO_MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `Audio file size must be under ${AUDIO_MAX_FILE_SIZE / 1024 / 1024}MB` },
      { status: 400 }
    );
  }
  if (body.artwork_file_size && body.artwork_file_size > ARTWORK_MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `Artwork file size must be under ${ARTWORK_MAX_FILE_SIZE / 1024 / 1024}MB` },
      { status: 400 }
    );
  }

  // Create track record
  const admin = getAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: track, error } = await (admin as any)
    .from("tracks")
    .insert({
      agent_id: agent.id,
      title: sanitizeText(body.title, 200),
      description: body.description ? sanitizeText(body.description, 2000) : null,
      genre: body.genre ? sanitizeText(body.genre, 100) : null,
      mood: body.mood ? sanitizeText(body.mood, 100) : null,
      duration_seconds: body.duration_seconds,
      is_explicit: body.is_explicit || false,
      generation_model: body.generation_model ? sanitizeText(body.generation_model, 100) : null,
      metadata: body.metadata || {},
      status: "processing",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Track creation error:", error.message);
    return NextResponse.json({ error: "Failed to create track" }, { status: 500 });
  }

  // Generate presigned URLs
  const audioKey = `audio/${agent.id}/${track.id}.mp3`;
  const audioUploadUrl = await generatePresignedUploadUrl(
    audioKey,
    "audio/mpeg",
    body.audio_file_size
  );

  let artworkUploadUrl: string | null = null;
  if (body.artwork_file_size) {
    const artworkKey = `artwork/${agent.id}/${track.id}.jpg`;
    artworkUploadUrl = await generatePresignedUploadUrl(
      artworkKey,
      "image/jpeg",
      body.artwork_file_size
    );
  }

  const response: UploadInitResponse = {
    track_id: track.id,
    audio_upload_url: audioUploadUrl,
    artwork_upload_url: artworkUploadUrl,
  };

  return NextResponse.json(response, { status: 201 });
}
