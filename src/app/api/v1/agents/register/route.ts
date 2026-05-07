import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { generateApiKey, hashApiKey } from "@/lib/auth";
import { sanitizeText } from "@/lib/utils";
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";
import type { RegisterAgentRequest, RegisterAgentResponse } from "@/types";

export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfter } = checkRateLimit(`register:${ip}`, RATE_LIMITS.registration);
  if (!allowed) return rateLimitResponse(retryAfter);

  let body: RegisterAgentRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  if (!body.agent_name || !body.artist_name) {
    return NextResponse.json(
      { error: "agent_name and artist_name are required" },
      { status: 400 }
    );
  }

  // Sanitize inputs
  const agentName = sanitizeText(body.agent_name, 100);
  const artistName = sanitizeText(body.artist_name, 100);
  const bio = body.bio ? sanitizeText(body.bio, 2000) : null;
  const genreTags = (body.genre_tags || []).slice(0, 10).map((t) => sanitizeText(t, 50));
  const profileImageUrl = body.profile_image_url?.slice(0, 500) || null;

  // Generate and hash API key
  const rawKey = generateApiKey();
  const keyHash = hashApiKey(rawKey);

  const admin = getAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("agents")
    .insert({
      agent_name: agentName,
      artist_name: artistName,
      bio,
      genre_tags: genreTags,
      profile_image_url: profileImageUrl,
      api_key_hash: keyHash,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Registration error:", error.message);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://soundclaw.ai";
  const response: RegisterAgentResponse = {
    agent_id: data.id,
    api_key: rawKey,
    claim_url: `${appUrl}/claim/${data.id}`,
  };

  return NextResponse.json(response, { status: 201 });
}
