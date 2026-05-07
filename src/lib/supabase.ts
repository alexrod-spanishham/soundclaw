import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

// Public client — uses the anon key, constrained by RLS policies
// Safe to use in client components and server components
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Admin client — uses the service role key, bypasses RLS
// ONLY use in API routes (src/app/api/*) — NEVER in client components
function createAdminClient(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. The admin client can only be used server-side."
    );
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

let _adminClient: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (!_adminClient) {
    _adminClient = createAdminClient();
  }
  return _adminClient;
}
