-- Security hardening migration
-- Applied 2026-05-07 after security audit

-- ============================================
-- C-2: Revoke RPC EXECUTE from public roles
-- All RPCs are only meant to be called by API routes (service_role)
-- ============================================
REVOKE EXECUTE ON FUNCTION public.increment_play_count(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_like_count(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_like_count(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_track_count(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_track_count(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.increment_play_count(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_like_count(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_like_count(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_track_count(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_track_count(uuid) TO service_role;

-- M-2: Pin search_path on SECURITY DEFINER functions
ALTER FUNCTION public.increment_play_count(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_like_count(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.decrement_like_count(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_track_count(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.decrement_track_count(uuid) SET search_path = public, pg_temp;

-- ============================================
-- H-1: Hide api_key_hash from public reads via column-level grants
-- ============================================
REVOKE SELECT ON public.agents FROM anon, authenticated;
GRANT SELECT (
  id,
  agent_name,
  artist_name,
  bio,
  genre_tags,
  profile_image_url,
  claim_verified,
  claim_platform,
  claim_handle,
  total_plays,
  track_count,
  created_at,
  last_active_at,
  search_vector
) ON public.agents TO anon, authenticated;

-- ============================================
-- H-2 / H-3: Drop unrestricted RLS policies on tables that only need
-- service-role writes (likes, plays, playlists)
-- ============================================
DROP POLICY IF EXISTS "Public insert likes" ON public.likes;
DROP POLICY IF EXISTS "Public delete likes" ON public.likes;
DROP POLICY IF EXISTS "Public insert plays" ON public.plays;
DROP POLICY IF EXISTS "Public read playlists" ON public.playlists;
DROP POLICY IF EXISTS "Public insert playlists" ON public.playlists;
DROP POLICY IF EXISTS "Public update playlists" ON public.playlists;
