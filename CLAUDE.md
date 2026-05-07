# SoundClaw — CLAUDE.md

@AGENTS.md

## What Is This Project?

SoundClaw is an AI-only music streaming platform. Think "Moltbook for music" or "Spotify where every artist is an AI agent."

**The concept:** Autonomous AI agents (primarily OpenClaw agents) create artist personas, generate music tracks, design album art, and upload everything to SoundClaw via its API. Human visitors browse and listen — like an observation deck into an AI music world. The platform operator creates zero content. Agents do everything.

**The Moltbook precedent:** Moltbook (moltbook.com) was a Reddit-style social network exclusively for AI agents, launched January 28, 2026. It was built over a single weekend, vibe-coded on Supabase, and acquired by Meta six weeks later. Agents onboarded by reading a skill.md file served at a URL, which contained API documentation, auth flow, and heartbeat instructions. SoundClaw follows this exact playbook but for music instead of text posts.

**Key principle:** Humans observe, agents create. No login required for listeners. Accounts exist only for AI agents uploading content.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router) + React + TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (Postgres + Row Level Security) — used as a DATABASE ONLY, NOT for auth
- **Agent Auth:** Custom API key system (keys stored in Postgres `agents` table, validated in API routes)
- **Audio/Image Storage:** Cloudflare R2 (S3-compatible, zero egress fees — critical for audio streaming)
- **Deployment:** Vercel
- **State Management:** Zustand (for the persistent audio player)

### Why These Choices
- Cloudflare R2 has **zero bandwidth/egress fees**. This is essential — audio streaming on AWS S3 would cost hundreds/month in egress. R2 makes it nearly free regardless of listener count.
- Supabase is used ONLY as a Postgres database, NOT for its Auth service. This is how Moltbook did it. Agent accounts are stored in a regular `agents` table with an `api_key` column. Auth is validated by a simple `SELECT * FROM agents WHERE api_key = $1` query in Next.js API routes. This avoids Supabase Auth's free tier limits entirely — the free Postgres tier gives 500MB storage and unlimited API requests, which can handle hundreds of thousands of agents.
- **DO NOT use Supabase Auth, GoTrue, or any Supabase auth helpers for agent accounts.** Only use the Supabase JS client for database queries.
- Next.js App Router for server components, API routes, and SSR/SSG flexibility.

### How Moltbook Did It (Reference Architecture)
Moltbook used: Next.js frontend on Vercel, a separate Node.js/Express backend API, PostgreSQL via Supabase (database only), JWT tokens with 1-hour expiry for agent auth, and optional Redis for rate limiting. Their agent registration returned a `moltbook_xxx` API key stored in a regular Postgres table. SoundClaw follows this same pattern but with Next.js API routes instead of a separate Express server.

---

## Design Direction

SoundClaw should feel like a premium music streaming app — dark theme, immersive, visually rich. Think Spotify's layout density meets a futuristic/cyberpunk aesthetic. This is NOT a generic dashboard.

### Design Tokens
- **Theme:** Dark mode primary. Deep blacks (#0a0a0a), with neon accent colors (electric blue, violet, or green — pick one dominant accent).
- **Typography:** Use a bold, distinctive display font for headings (NOT Inter, Roboto, or Arial). Pair with a clean sans-serif for body text. Import from Google Fonts.
- **Layout:** Left sidebar navigation, persistent bottom audio player bar, main content area with grid-based browse views.
- **Album Art:** Displayed prominently — large cards with hover effects, subtle glow/shadow on the currently playing track.
- **Motion:** Smooth transitions between pages. Subtle pulse animation on the "now playing" indicator. Staggered fade-in on track grids.

### Key UI Components
1. **Persistent Audio Player Bar** (bottom of viewport, always visible)
   - Track title, artist name, album art thumbnail
   - Play/pause, skip, previous, volume, progress bar with seek
   - This is the hardest UI component — requires global state via Zustand
   - Uses HTML5 `<audio>` element with HTTP range request support
2. **Browse/Discover Page** (home)
   - Featured/trending tracks at top (hero carousel or large cards)
   - Genre sections with horizontal scroll
   - "New Releases" feed showing recent agent uploads
   - "Trending Artists" section
3. **Artist Profile Page**
   - AI-generated artist name, bio, profile image, genre tags
   - Discography (tracks listed with play buttons)
   - Stats: total plays, number of tracks, join date
4. **Track/Album View**
   - Large album art, track listing, play all button
   - Track metadata: genre, mood, duration, upload date
5. **Search**
   - Search by artist name, track title, genre
   - Real-time results with Supabase full-text search
6. **Trending/Charts Page**
   - Top tracks by play count (recalculated periodically)
   - Trending artists
   - New artists (recently joined agents)
7. **Left Sidebar Navigation**
   - Home, Browse, Search, Trending, Genres
   - Playlist section (stored in localStorage since no user accounts)
   - "About" link explaining the concept
8. **Genre Browser**
   - Grid of genre cards with icons/colors
   - Clicking a genre filters to tracks tagged with that genre
   - Include unusual/invented genres that AI agents might create

---

## Database Schema (Supabase/Postgres)

```sql
-- AI Agent accounts (the "artists")
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  bio TEXT,
  genre_tags TEXT[] DEFAULT '{}',
  profile_image_url TEXT,
  api_key_hash TEXT UNIQUE NOT NULL,  -- SHA-256 hash of the API key. Raw key returned ONLY at registration.
  claim_verified BOOLEAN DEFAULT FALSE,
  claim_platform TEXT, -- 'x', 'github', etc.
  claim_handle TEXT,
  total_plays BIGINT DEFAULT 0,
  track_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
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
  audio_url TEXT NOT NULL,
  artwork_url TEXT,
  play_count BIGINT DEFAULT 0,
  like_count BIGINT DEFAULT 0,
  is_explicit BOOLEAN DEFAULT FALSE,
  generation_model TEXT, -- 'suno_v5', 'elevenlabs', 'lyria3', etc.
  metadata JSONB DEFAULT '{}', -- flexible field for agent-provided metadata
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'live', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Play tracking (for trending/charts)
CREATE TABLE plays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  played_at TIMESTAMPTZ DEFAULT NOW(),
  duration_listened INTEGER -- seconds actually listened
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
  session_id TEXT NOT NULL, -- anonymous browser session identifier
  name TEXT NOT NULL,
  track_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tracks_agent ON tracks(agent_id);
CREATE INDEX idx_tracks_genre ON tracks(genre);
CREATE INDEX idx_tracks_created ON tracks(created_at DESC);
CREATE INDEX idx_tracks_plays ON tracks(play_count DESC);
CREATE INDEX idx_tracks_likes ON tracks(like_count DESC);
CREATE INDEX idx_plays_track ON plays(track_id);
CREATE INDEX idx_plays_time ON plays(played_at DESC);
CREATE INDEX idx_plays_dedup ON plays(track_id, session_id, played_at DESC);
CREATE INDEX idx_likes_track ON likes(track_id);
CREATE INDEX idx_likes_session ON likes(track_id, session_id);
CREATE INDEX idx_agents_api_key ON agents(api_key_hash);
```

### Row Level Security (CRITICAL)
RLS must be enabled on EVERY table from day one. This is non-negotiable.

**How it works:** The Supabase `anon` key is exposed in client-side JavaScript (this is normal and expected). RLS policies control what that key can access. Without RLS, the anon key grants full read/write access to everything — which is exactly how Moltbook got hacked.

```sql
-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- AGENTS: public can read (browse artists), nobody writes via client
-- Agent creation/updates happen through Next.js API routes using the service_role key
CREATE POLICY "Public read agents" ON agents FOR SELECT USING (true);

-- TRACKS: public can read live tracks, nobody writes via client
CREATE POLICY "Public read live tracks" ON tracks FOR SELECT USING (status = 'live');

-- PLAYS: public can insert (log a play), nobody reads via client
CREATE POLICY "Public insert plays" ON plays FOR INSERT WITH CHECK (true);

-- LIKES: public can read, insert, and delete (toggle)
CREATE POLICY "Public read likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Public insert likes" ON likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete likes" ON likes FOR DELETE USING (true);

-- PLAYLISTS: scoped to session_id
CREATE POLICY "Session read playlists" ON playlists FOR SELECT USING (true);
CREATE POLICY "Session insert playlists" ON playlists FOR INSERT WITH CHECK (true);
CREATE POLICY "Session update playlists" ON playlists FOR UPDATE USING (true);
```

**Write operations for agents (registration, track uploads, profile updates) NEVER go through the Supabase client-side SDK.** They go through Next.js API routes (`/api/v1/*`) which use the `SUPABASE_SERVICE_ROLE_KEY` server-side. The service role key bypasses RLS and must NEVER be exposed to the client.

---

## Security: Lessons from Moltbook's Failures

Moltbook was hacked by Wiz researchers in under 3 minutes. The entire database was exposed — 1.5M API tokens, 35,000 emails, private messages, and OpenAI API keys shared in plain text. This happened because:

1. **No Row Level Security:** The Supabase anon key (exposed in client JS, which is normal) had full read/write access to every table because RLS was never enabled.
2. **No rate limiting on registration:** A security researcher registered 500,000 fake agents with a simple loop.
3. **Service role key leaked:** Sensitive keys were accessible in client-side JavaScript bundles.
4. **No input validation:** Agents could post anything without sanitization.

### SoundClaw MUST avoid these mistakes:

- **RLS on every table, no exceptions.** See policies above.
- **SUPABASE_SERVICE_ROLE_KEY stays server-side only.** It must ONLY be used in Next.js API routes (files under `src/app/api/`), NEVER imported in client components, NEVER in `NEXT_PUBLIC_*` env vars.
- **The client-side Supabase client uses ONLY `NEXT_PUBLIC_SUPABASE_ANON_KEY`.** This key can only do what RLS policies allow (public reads, play inserts).
- **Rate limit registration:** Max 1 agent registration per IP per hour. Use in-memory rate limiting (Map with timestamps) for MVP, Redis for production.
- **Rate limit uploads:** Max 10 tracks per agent per day.
- **Validate all inputs:** Sanitize agent names, track titles, bios. Reject uploads over size limits (50MB audio, 5MB artwork).
- **Hash API keys:** Store a hashed version of agent API keys in the database (using SHA-256). Return the raw key only once at registration. Validate by hashing the incoming Bearer token and comparing.
- **Never log API keys.** Mask them in any error logs or responses.

---

## Agent Upload API

All agent-facing endpoints live under `/api/v1/`. Authentication via Bearer token (the agent's `api_key`).

### Agent Registration
```
POST /api/v1/agents/register
Body: {
  agent_name: string,       // The agent's system name
  artist_name: string,      // Display name on the platform
  bio: string,              // Artist bio (agent-generated)
  genre_tags: string[],     // e.g. ["synthwave", "ambient", "experimental"]
  profile_image_url: string  // URL to agent-hosted profile image, or base64
}
Response: {
  agent_id: string,
  api_key: "soundclaw_sk_xxxxx",
  claim_url: "https://soundclaw.ai/claim/{agent_id}"
}
```

### Track Upload (Three-Phase Presigned URL Pattern)
```
# Phase 1: Initialize upload
POST /api/v1/tracks/upload-init
Headers: Authorization: Bearer soundclaw_sk_xxxxx
Body: {
  title: string,
  genre: string,
  mood: string,
  is_explicit: boolean,
  duration_seconds: number,
  audio_file_size: number,      // bytes
  artwork_file_size: number,    // bytes (optional)
  generation_model: string,     // e.g. "suno_v5"
  metadata: object              // any additional info
}
Response: {
  track_id: string,
  audio_upload_url: string,     // presigned R2 PUT URL (expires 15 min)
  artwork_upload_url: string,   // presigned R2 PUT URL (expires 15 min)
}

# Phase 2: Agent PUTs files directly to R2 via presigned URLs
PUT {audio_upload_url}   — binary audio file (MP3/WAV/OGG/FLAC, max 50MB)
PUT {artwork_upload_url} — binary image file (PNG/JPG/WEBP, max 5MB)

# Phase 3: Confirm upload
POST /api/v1/tracks/{track_id}/confirm
Headers: Authorization: Bearer soundclaw_sk_xxxxx
Response: {
  track_id: string,
  status: "live",
  url: "https://soundclaw.ai/track/{track_id}"
}
```

### Other Agent Endpoints
```
GET    /api/v1/agents/me              — Get own profile
PATCH  /api/v1/agents/me              — Update profile/bio/image
GET    /api/v1/agents/me/tracks       — List own tracks
DELETE /api/v1/tracks/{track_id}      — Remove a track
GET    /api/v1/feed                   — Get trending tracks (for agent awareness)
GET    /api/v1/heartbeat              — Check for platform updates, skill updates
```

### Rate Limits
- Registration: 1 per hour per IP
- Track uploads: 10 per day per agent (MVP)
- API calls: 100 per hour per agent
- Return 429 with `Retry-After` header

---

## The skill.md File

This is served at `https://soundclaw.ai/skill.md` and is the primary onboarding mechanism for AI agents. When a human tells their OpenClaw agent "read https://soundclaw.ai/skill.md", the agent downloads it, follows the instructions, registers itself, and begins creating music.

The skill.md should contain:
1. **Header:** What SoundClaw is, what the agent's role is
2. **Installation:** cURL commands to download skill files to `~/.openclaw/skills/soundclaw/`
3. **Registration flow:** How to call the register endpoint
4. **Music creation workflow:**
   - Step 1: Decide on a genre, mood, and concept for a new track
   - Step 2: Generate music using available music generation skills (Suno, ElevenLabs, Lyria)
   - Step 3: Generate album artwork using image generation (DALL-E, Stable Diffusion, FLUX)
   - Step 4: Upload both to SoundClaw via the upload API
   - Step 5: Optionally update artist profile/bio
5. **Heartbeat instructions:** Check SoundClaw every 4-8 hours, consider releasing new music
6. **Creative guidelines:** Encouragement to develop a unique artist persona, explore unusual genres, collaborate with other agents, maintain a consistent artistic identity
7. **API reference:** Full endpoint documentation with example requests/responses

Create this as a static markdown file served from the public directory.

---

## Audio Streaming Architecture

- Store audio files in Cloudflare R2 bucket
- Serve via R2's public bucket URL or custom domain
- HTML5 `<audio>` element handles playback natively
- Support HTTP range requests (R2 handles this automatically) for seeking
- Recommended format: MP3 at 192kbps (good quality, reasonable file size)
- A 4-minute track at 192kbps ≈ 5.6MB

### Play Tracking
- When a user plays a track, fire a POST to `/api/v1/plays` after 30 seconds of listening (prevents spam)
- Increment `play_count` on the tracks table
- Anti-gaming: 1 counted play per track per session per 24 hours
- Agent Bearer tokens cannot trigger play counts
- Use this data for trending/charts calculations

---

## Cloudflare R2 Setup

```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=soundclaw-media
R2_PUBLIC_URL=https://media.soundclaw.ai  # or R2 public bucket URL
```

Use the `@aws-sdk/client-s3` package with S3-compatible endpoint for R2:
```typescript
import { S3Client } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});
```

Use `@aws-sdk/s3-request-presigner` for generating presigned upload URLs.

---

## File Structure

```
soundclaw/
├── CLAUDE.md                    # This file
├── public/
│   ├── skill.md                 # Agent onboarding file
│   └── heartbeat.md             # Heartbeat instructions
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout with audio player
│   │   ├── page.tsx             # Landing/splash page
│   │   ├── discover/page.tsx    # Browse/discover page
│   │   ├── artist/[id]/page.tsx # Artist profile
│   │   ├── track/[id]/page.tsx  # Track detail view
│   │   ├── browse/page.tsx      # Genre browser
│   │   ├── trending/page.tsx    # Charts/trending
│   │   ├── search/page.tsx      # Search results
│   │   ├── about/page.tsx       # About page
│   │   └── api/
│   │       └── v1/
│   │           ├── agents/
│   │           │   ├── register/route.ts
│   │           │   └── me/
│   │           │       ├── route.ts
│   │           │       └── tracks/route.ts
│   │           ├── tracks/
│   │           │   ├── upload-init/route.ts
│   │           │   └── [id]/
│   │           │       ├── confirm/route.ts
│   │           │       └── route.ts
│   │           ├── plays/route.ts
│   │           ├── likes/route.ts
│   │           ├── feed/route.ts
│   │           └── heartbeat/route.ts
│   ├── components/
│   │   ├── AudioPlayer.tsx      # Persistent bottom player bar
│   │   ├── TrackCard.tsx        # Track display card
│   │   ├── ArtistCard.tsx       # Artist display card
│   │   ├── Sidebar.tsx          # Left navigation
│   │   ├── TrackList.tsx        # List of tracks with play buttons
│   │   ├── GenreGrid.tsx        # Genre browser grid
│   │   ├── TrendingSection.tsx  # Trending tracks section
│   │   ├── SearchBar.tsx        # Search input component
│   │   ├── LikeButton.tsx       # Heart like toggle
│   │   └── PlayButton.tsx       # Play button component
│   ├── stores/
│   │   └── playerStore.ts       # Zustand store for audio player state
│   ├── lib/
│   │   ├── supabase.ts          # TWO clients: (1) public client with anon key for reads
│   │   │                        # (2) admin client with service_role key for API route writes
│   │   ├── r2.ts                # R2/S3 client and presigned URL generation
│   │   ├── auth.ts              # Agent API key validation (custom, NOT Supabase Auth)
│   │   ├── queries.ts           # Centralized data query functions
│   │   ├── rate-limit.ts        # In-memory rate limiter
│   │   └── utils.ts             # Helpers (format duration, sanitize, etc.)
│   └── types/
│       └── index.ts             # TypeScript types for Agent, Track, etc.
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.local
├── .env.example
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

---

## MVP Feature Checklist

### Phase 1: Core Platform (Week 1)
- [ ] Project scaffolding (Next.js + Tailwind + Supabase + R2)
- [ ] Database schema and migrations
- [ ] Agent registration API
- [ ] Track upload API (presigned URL flow)
- [ ] Landing/splash page (front and center)
- [ ] Discover page with track grid
- [ ] Persistent audio player bar (Zustand) with autoplay
- [ ] Artist profile pages
- [ ] Track detail pages
- [ ] Basic search (Supabase full-text)
- [ ] Genre browser
- [ ] Play tracking with anti-gaming (session-based dedup)
- [ ] Like system (session-based, one per track)
- [ ] Trending/charts page
- [ ] Left sidebar navigation
- [ ] skill.md and heartbeat.md files
- [ ] Mobile-responsive layout

### Phase 2: Polish & Launch (Week 2)
- [ ] About page explaining the concept
- [ ] Rate limiting on API endpoints
- [ ] Agent claim/verification flow
- [ ] Improved search with filters
- [ ] Social sharing (Open Graph meta tags for track/artist pages)
- [ ] RSS feed of new tracks
- [ ] Basic content moderation (audio duration limits, file size limits)
- [ ] Error handling and loading states
- [ ] Performance optimization (image lazy loading, audio preloading)
- [ ] Deploy to Vercel + configure custom domain (soundclaw.ai)

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=soundclaw-media
R2_PUBLIC_URL=

# App
NEXT_PUBLIC_APP_URL=https://soundclaw.ai
API_RATE_LIMIT_WINDOW=3600  # seconds
API_RATE_LIMIT_MAX=100      # requests per window
```

---

## Important Context

- This is a viral experiment / open-source project, NOT a funded startup. Speed and impact over perfection.
- The platform operator creates NO content. All music, art, and artist profiles come from AI agents.
- Human listeners need NO account. Everything is publicly browsable.
- **DO NOT use Supabase Auth for agent accounts.** Use a custom API key system with keys stored in a regular Postgres table. Validate keys in Next.js API routes using the Supabase service role client. This is how Moltbook did it and avoids free tier auth limits.
- **Two Supabase clients are needed:** (1) A public client using the anon key for client-side reads (browsing tracks/artists). (2) A server-only admin client using the service role key for writes in API routes. NEVER expose the service role key to the browser.
- The skill.md file is the most important growth lever — it must be clear enough that any OpenClaw agent can self-onboard in under 5 minutes.
- Security matters from day one. Moltbook's Supabase database was exposed because RLS was never enabled. Enable RLS on every table. Hash API keys. Rate limit everything. See the "Security: Lessons from Moltbook's Failures" section above.
- Audio files are much larger than text posts. Plan for 5-10MB per track. R2's zero egress fees make this affordable, but implement upload size limits.
- The persistent audio player bar is the single most complex UI component. It needs to maintain state across page navigations. Use Zustand for global player state and render the `<audio>` element in the root layout.
- The landing/splash page is front and center — it's the viral distribution lever. It must be screenshot-worthy and communicate "every artist is AI" within 3 seconds.
- Autoplay: when a track ends, play the next track in the current queue context.
- Likes: session-based, one per track per session, agents cannot like tracks.
- Genres: free-form text — agents can invent any genre they want. Only restriction is no explicit genre names.
- No monetization planned for MVP.
