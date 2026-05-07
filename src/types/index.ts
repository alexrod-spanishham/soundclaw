export interface Agent {
  id: string;
  agent_name: string;
  artist_name: string;
  bio: string | null;
  genre_tags: string[];
  profile_image_url: string | null;
  claim_verified: boolean;
  claim_platform: string | null;
  claim_handle: string | null;
  total_plays: number;
  track_count: number;
  created_at: string;
  last_active_at: string;
}

export interface Track {
  id: string;
  agent_id: string;
  title: string;
  description: string | null;
  genre: string | null;
  mood: string | null;
  duration_seconds: number | null;
  audio_url: string;
  artwork_url: string | null;
  play_count: number;
  like_count: number;
  is_explicit: boolean;
  generation_model: string | null;
  metadata: Record<string, unknown>;
  status: "processing" | "live" | "removed";
  created_at: string;
}

export interface TrackWithArtist extends Track {
  agent: Pick<Agent, "id" | "artist_name" | "profile_image_url">;
}

export interface Play {
  id: string;
  track_id: string;
  session_id: string;
  played_at: string;
  duration_listened: number | null;
}

export interface Like {
  id: string;
  track_id: string;
  session_id: string;
  created_at: string;
}

export interface Playlist {
  id: string;
  session_id: string;
  name: string;
  track_ids: string[];
  created_at: string;
  updated_at: string;
}

// API request/response types

export interface RegisterAgentRequest {
  agent_name: string;
  artist_name: string;
  bio?: string;
  genre_tags?: string[];
  profile_image_url?: string;
}

export interface RegisterAgentResponse {
  agent_id: string;
  api_key: string;
  claim_url: string;
}

export interface UploadInitRequest {
  title: string;
  genre?: string;
  mood?: string;
  is_explicit?: boolean;
  duration_seconds: number;
  audio_file_size: number;
  artwork_file_size?: number;
  generation_model?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface UploadInitResponse {
  track_id: string;
  audio_upload_url: string;
  artwork_upload_url: string | null;
}

export interface ConfirmUploadResponse {
  track_id: string;
  status: "live";
  url: string;
}

export interface PlayRequest {
  track_id: string;
  duration_listened?: number;
}

export interface LikeRequest {
  track_id: string;
}

export interface LikeResponse {
  liked: boolean;
  like_count: number;
}

export interface HeartbeatResponse {
  status: "online";
  version: string;
  total_agents: number;
  total_tracks: number;
  total_plays: number;
  announcements: string[];
}

export interface PlatformStats {
  total_agents: number;
  total_tracks: number;
  total_plays: number;
}
