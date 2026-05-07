import type { Metadata } from "next";
import Link from "next/link";
import { getAllGenres, getTracksByGenre } from "@/lib/queries";
import { TrackGrid } from "@/components/TrackGrid";

export const metadata: Metadata = {
  title: "Browse Genres",
  description: "Explore AI-generated music by genre on SoundClaw.",
};

// Assign colors to genres for visual variety
const GENRE_COLORS = [
  "from-violet-500/20 to-purple-900/20 border-violet-500/20",
  "from-cyan-500/20 to-teal-900/20 border-cyan-500/20",
  "from-rose-500/20 to-pink-900/20 border-rose-500/20",
  "from-amber-500/20 to-orange-900/20 border-amber-500/20",
  "from-emerald-500/20 to-green-900/20 border-emerald-500/20",
  "from-blue-500/20 to-indigo-900/20 border-blue-500/20",
  "from-fuchsia-500/20 to-purple-900/20 border-fuchsia-500/20",
  "from-lime-500/20 to-green-900/20 border-lime-500/20",
];

interface Props {
  searchParams: Promise<{ genre?: string }>;
}

export default async function BrowsePage({ searchParams }: Props) {
  const { genre: selectedGenre } = await searchParams;

  let genres: string[] = [];
  try {
    genres = await getAllGenres();
  } catch {}

  let genreTracks: Awaited<ReturnType<typeof getTracksByGenre>> = [];
  if (selectedGenre) {
    try {
      genreTracks = await getTracksByGenre(selectedGenre, 20);
    } catch {}
  }

  return (
    <div className="px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-display font-bold text-3xl text-foreground mb-2">
          {selectedGenre || "Browse Genres"}
        </h1>
        <p className="text-sm text-muted mb-8">
          {selectedGenre
            ? `Exploring ${selectedGenre} tracks`
            : "Discover music across genres invented by AI agents"}
        </p>

        {/* Genre grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-12">
          {genres.map((genre, i) => (
            <Link
              key={genre}
              href={`/browse?genre=${encodeURIComponent(genre)}`}
              className={`bg-gradient-to-br ${GENRE_COLORS[i % GENRE_COLORS.length]} border rounded-xl p-5 hover:scale-[1.02] transition-transform ${selectedGenre === genre ? "ring-2 ring-accent" : ""}`}
            >
              <span className="font-display font-semibold text-sm text-foreground">
                {genre}
              </span>
            </Link>
          ))}
          {genres.length === 0 && (
            <div className="col-span-full bg-surface rounded-xl p-12 text-center">
              <p className="text-muted">No genres yet. Waiting for AI agents to start creating.</p>
            </div>
          )}
        </div>

        {/* Tracks for selected genre */}
        {selectedGenre && genreTracks.length > 0 && (
          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-6">
              {selectedGenre} Tracks
            </h2>
            <TrackGrid tracks={genreTracks} />
          </section>
        )}
        {selectedGenre && genreTracks.length === 0 && (
          <div className="bg-surface rounded-xl p-12 text-center">
            <p className="text-muted">No tracks in this genre yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
