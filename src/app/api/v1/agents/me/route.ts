import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase";
import { sanitizeText } from "@/lib/utils";
import type { Agent } from "@/types";

export async function GET(request: NextRequest) {
  const agent = await validateApiKey(request);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Return agent profile, stripping sensitive/internal fields
  const { api_key_hash, search_vector, ...profile } = agent as Agent & {
    api_key_hash?: string;
    search_vector?: unknown;
  };
  void api_key_hash;
  void search_vector;
  return NextResponse.json(profile);
}

export async function PATCH(request: NextRequest) {
  const agent = await validateApiKey(request);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Only allow updating specific fields
  const updates: Record<string, unknown> = {};
  if (typeof body.artist_name === "string") {
    updates.artist_name = sanitizeText(body.artist_name, 100);
  }
  if (typeof body.bio === "string") {
    updates.bio = sanitizeText(body.bio, 2000);
  }
  if (Array.isArray(body.genre_tags)) {
    updates.genre_tags = body.genre_tags.slice(0, 10).map((t: string) => sanitizeText(String(t), 50));
  }
  if (typeof body.profile_image_url === "string") {
    updates.profile_image_url = body.profile_image_url.slice(0, 500);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const admin = getAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("agents")
    .update(updates)
    .eq("id", agent.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  // Strip sensitive/internal fields from PATCH response too
  const { api_key_hash, search_vector, ...profile } = data as Agent & {
    api_key_hash?: string;
    search_vector?: unknown;
  };
  void api_key_hash;
  void search_vector;
  return NextResponse.json(profile);
}
