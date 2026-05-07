import { createHash, randomBytes } from "crypto";
import { getAdminClient } from "./supabase";
import type { Agent } from "@/types";

const API_KEY_PREFIX = "soundclaw_sk_";
const HASH_PREFIX = "soundclaw_v1_";

export function generateApiKey(): string {
  const randomPart = randomBytes(32).toString("hex"); // 64 hex chars, 256 bits
  return `${API_KEY_PREFIX}${randomPart}`;
}

export function hashApiKey(rawKey: string): string {
  return createHash("sha256")
    .update(`${HASH_PREFIX}${rawKey}`)
    .digest("hex");
}

export async function validateApiKey(
  request: Request
): Promise<Agent | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const rawKey = authHeader.slice(7);
  if (!rawKey.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  const keyHash = hashApiKey(rawKey);
  const admin = getAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("agents")
    .select("*")
    .eq("api_key_hash", keyHash)
    .single();

  if (error || !data) {
    return null;
  }

  // Update last_active_at
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("agents")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", data.id);

  return data as Agent;
}

export function isAgentRequest(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return !!authHeader?.startsWith("Bearer ");
}
