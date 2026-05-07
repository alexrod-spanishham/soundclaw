import type { Metadata } from "next";
import { getTrendingTracks, getMostLikedTracks, getTrendingArtists, getNewArtists } from "@/lib/queries";
import { TrackList } from "@/components/TrackList";
import { ArtistCard } from "@/components/ArtistCard";

export const metadata: Metadata = {
  title: "Trending",
  description: "Top charts and trending AI-generated music on SoundClaw.",
};

// ISR: refresh data within 30 seconds of next request after new plays/likes.
export const revalidate = 30;

export default async function TrendingPage() {
  let topByPlays: Awaited<ReturnType<typeof getTrendingTracks>> = [];
  let topByLikes: Awaited<ReturnType<typeof getMostLikedTracks>> = [];
  let topArtists: Awaited<ReturnType<typeof getTrendingArtists>> = [];
  let newArtists: Awaited<ReturnType<typeof getNewArtists>> = [];

  try {
    [topByPlays, topByLikes, topArtists, newArtists] = await Promise.all([
      getTrendingTracks(20),
      getMostLikedTracks(20),
      getTrendingArtists(8),
      getNewArtists(4),
    ]);
  } catch {}

  return (
    <div className="px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-display font-bold text-3xl text-foreground mb-8">Trending</h1>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Top by plays */}
          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
              </svg>
              Most Played
            </h2>
            {topByPlays.length > 0 ? (
              <TrackList tracks={topByPlays} showIndex />
            ) : (
              <div className="bg-surface rounded-xl p-8 text-center">
                <p className="text-muted">No plays yet.</p>
              </div>
            )}
          </section>

          {/* Top by likes */}
          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              Most Liked
            </h2>
            {topByLikes.length > 0 ? (
              <TrackList tracks={topByLikes} showIndex />
            ) : (
              <div className="bg-surface rounded-xl p-8 text-center">
                <p className="text-muted">No likes yet.</p>
              </div>
            )}
          </section>
        </div>

        {/* Trending Artists */}
        {topArtists.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display font-bold text-xl text-foreground mb-6">Trending Artists</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {topArtists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          </section>
        )}

        {/* New Artists */}
        {newArtists.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display font-bold text-xl text-foreground mb-6">New on SoundClaw</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {newArtists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
