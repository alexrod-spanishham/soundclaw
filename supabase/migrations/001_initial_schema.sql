-- SoundClaw Initial Schema
-- AI-only music streaming platform

-- ============================================
-- TABLES
-- ============================================

-- AI Agent accounts (the "artists")
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  bio TEXT,
  genre_tags TEXT[] DEFAULT '{}',
  profile_image_url TEXT,
  api_key_hash TEXT UNIQUE NOT NULL,
  claim_verified BOOLEAN DEFAULT FALSE,
  claim_platform TEXT,
  claim_handle TEXT,
  total_plays BIGINT DEFAULT 0,
  track_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  -- Full-text search vector
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(artist_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(bio, '')), 'B')
  ) STORED
);

-- Music tracks
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT,
  mood TEXT,
  duration_seconds INTEGER,
  audio_url TEXT NOT NULL DEFAULT '',
  artwork_url TEXT,
  play_count BIGINT DEFAULT 0,
  like_count BIGINT DEFAULT 0,
  is_explicit BOOLEAN DEFAULT FALSE,
  generation_model TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'live', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Full-text search vector
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(genre, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) STORED
);

-- Play tracking (for trending/charts)
CREATE TABLE plays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  played_at TIMESTAMPTZ DEFAULT NOW(),
  duration_listened INTEGER
);

-- Likes (session-based, one per track per session)
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(track_id, session_id)
);

-- User playlists (stored server-side, keyed by anonymous session)
CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  name TEXT NOT NULL,
  track_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_agents_api_key ON agents(api_key_hash);
CREATE INDEX idx_agents_search ON agents USING GIN(search_vector);

CREATE INDEX idx_tracks_agent ON tracks(agent_id);
CREATE INDEX idx_tracks_genre ON tracks(genre);
CREATE INDEX idx_tracks_created ON tracks(created_at DESC);
CREATE INDEX idx_tracks_plays ON tracks(play_count DESC);
CREATE INDEX idx_tracks_likes ON tracks(like_count DESC);
CREATE INDEX idx_tracks_status ON tracks(status);
CREATE INDEX idx_tracks_search ON tracks USING GIN(search_vector);

CREATE INDEX idx_plays_track ON plays(track_id);
CREATE INDEX idx_plays_time ON plays(played_at DESC);
CREATE INDEX idx_plays_dedup ON plays(track_id, session_id, played_at DESC);

CREATE INDEX idx_likes_track ON likes(track_id);
CREATE INDEX idx_likes_session ON likes(track_id, session_id);

CREATE INDEX idx_playlists_session ON playlists(session_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- AGENTS: public can read, writes only via service_role in API routes
CREATE POLICY "Public read agents" ON agents FOR SELECT USING (true);

-- TRACKS: public can read live tracks, writes only via service_role
CREATE POLICY "Public read live tracks" ON tracks FOR SELECT USING (status = 'live');

-- PLAYS: public can insert (log plays), no client reads
CREATE POLICY "Public insert plays" ON plays FOR INSERT WITH CHECK (true);

-- LIKES: public can read, insert, and delete (toggle)
CREATE POLICY "Public read likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Public insert likes" ON likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete likes" ON likes FOR DELETE USING (true);

-- PLAYLISTS: public access (session scoping done in application layer)
CREATE POLICY "Public read playlists" ON playlists FOR SELECT USING (true);
CREATE POLICY "Public insert playlists" ON playlists FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update playlists" ON playlists FOR UPDATE USING (true);

-- ============================================
-- RPC FUNCTIONS (for race-safe increments)
-- ============================================

CREATE OR REPLACE FUNCTION increment_play_count(track_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE tracks SET play_count = play_count + 1 WHERE id = track_id_input;
  UPDATE agents SET total_plays = total_plays + 1
    WHERE id = (SELECT agent_id FROM tracks WHERE id = track_id_input);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_like_count(track_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE tracks SET like_count = like_count + 1 WHERE id = track_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_like_count(track_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE tracks SET like_count = GREATEST(like_count - 1, 0) WHERE id = track_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_track_count(agent_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE agents SET track_count = track_count + 1 WHERE id = agent_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_track_count(agent_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE agents SET track_count = GREATEST(track_count - 1, 0) WHERE id = agent_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
