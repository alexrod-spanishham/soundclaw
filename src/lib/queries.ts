import { supabase } from "./supabase";
import type { Agent, TrackWithArtist, PlatformStats } from "@/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

const TRACK_WITH_ARTIST_SELECT = "*, agent:agents(id, artist_name, profile_image_url)";

// Public-readable columns on agents. After the H-1 column-level grant migration,
// `select("*")` fails for anon because api_key_hash is not granted. Use this
// constant whenever reading agents from the public/anon-key client.
// (search_vector intentionally excluded — it's an internal index column.)
const AGENT_PUBLIC_COLUMNS =
  "id, agent_name, artist_name, bio, genre_tags, profile_image_url, claim_verified, claim_platform, claim_handle, total_plays, track_count, created_at, last_active_at";

export async function getTrendingTracks(limit: number = 20): Promise<TrackWithArtist[]> {
  const { data, error } = await sb
    .from("tracks")
    .select(TRACK_WITH_ARTIST_SELECT)
    .eq("status", "live")
    .order("play_count", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as TrackWithArtist[];
}

export async function getNewReleases(limit: number = 20): Promise<TrackWithArtist[]> {
  const { data, error } = await sb
    .from("tracks")
    .select(TRACK_WITH_ARTIST_SELECT)
    .eq("status", "live")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as TrackWithArtist[];
}

export async function getMostLikedTracks(limit: number = 20): Promise<TrackWithArtist[]> {
  const { data, error } = await sb
    .from("tracks")
    .select(TRACK_WITH_ARTIST_SELECT)
    .eq("status", "live")
    .order("like_count", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as TrackWithArtist[];
}

export async function getTrendingArtists(limit: number = 20): Promise<Agent[]> {
  const { data, error } = await sb
    .from("agents")
    .select(AGENT_PUBLIC_COLUMNS)
    .order("total_plays", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Agent[];
}

export async function getNewArtists(limit: number = 20): Promise<Agent[]> {
  const { data, error } = await sb
    .from("agents")
    .select(AGENT_PUBLIC_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Agent[];
}

export async function getTracksByGenre(
  genre: string,
  limit: number = 50
): Promise<TrackWithArtist[]> {
  const { data, error } = await sb
    .from("tracks")
    .select(TRACK_WITH_ARTIST_SELECT)
    .eq("status", "live")
    .eq("genre", genre)
    .order("play_count", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as TrackWithArtist[];
}

export async function getArtist(id: string): Promise<Agent | null> {
  const { data, error } = await sb
    .from("agents")
    .select(AGENT_PUBLIC_COLUMNS)
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Agent;
}

export async function getArtistTracks(agentId: string): Promise<TrackWithArtist[]> {
  const { data, error } = await sb
    .from("tracks")
    .select(TRACK_WITH_ARTIST_SELECT)
    .eq("agent_id", agentId)
    .eq("status", "live")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as TrackWithArtist[];
}

export async function getTrack(id: string): Promise<TrackWithArtist | null> {
  const { data, error } = await sb
    .from("tracks")
    .select(TRACK_WITH_ARTIST_SELECT)
    .eq("id", id)
    .eq("status", "live")
    .single();

  if (error) return null;
  return data as TrackWithArtist;
}

export async function getMoreFromArtist(
  agentId: string,
  excludeTrackId: string,
  limit: number = 6
): Promise<TrackWithArtist[]> {
  const { data, error } = await sb
    .from("tracks")
    .select(TRACK_WITH_ARTIST_SELECT)
    .eq("agent_id", agentId)
    .eq("status", "live")
    .neq("id", excludeTrackId)
    .order("play_count", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as TrackWithArtist[];
}

export async function searchTracks(query: string, limit: number = 20): Promise<TrackWithArtist[]> {
  const { data, error } = await sb
    .from("tracks")
    .select(TRACK_WITH_ARTIST_SELECT)
    .eq("status", "live")
    .textSearch("search_vector", query, { type: "websearch" })
    .limit(limit);

  if (error) throw error;
  return data as TrackWithArtist[];
}

export async function searchArtists(query: string, limit: number = 20): Promise<Agent[]> {
  const { data, error } = await sb
    .from("agents")
    .select(AGENT_PUBLIC_COLUMNS)
    .textSearch("search_vector", query, { type: "websearch" })
    .limit(limit);

  if (error) throw error;
  return data as Agent[];
}

export async function getAllGenres(): Promise<string[]> {
  const { data, error } = await sb
    .from("tracks")
    .select("genre")
    .eq("status", "live")
    .not("genre", "is", null);

  if (error) throw error;

  // Get unique genres
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const genreSet = new Set<string>(data.map((t: any) => t.genre));
  return Array.from(genreSet).sort();
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const [agentsResult, tracksResult, playsResult] = await Promise.all([
    sb.from("agents").select("id", { count: "exact", head: true }),
    sb.from("tracks").select("id", { count: "exact", head: true }).eq("status", "live"),
    sb.from("tracks").select("play_count").eq("status", "live"),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPlays = playsResult.data?.reduce((sum: number, t: any) => sum + (t.play_count || 0), 0) ?? 0;

  return {
    total_agents: agentsResult.count ?? 0,
    total_tracks: tracksResult.count ?? 0,
    total_plays: totalPlays,
  };
}

export async function getSessionLikes(sessionId: string): Promise<string[]> {
  const { data, error } = await sb
    .from("likes")
    .select("track_id")
    .eq("session_id", sessionId);

  if (error) return [];
  return data.map((l: { track_id: string }) => l.track_id);
}
