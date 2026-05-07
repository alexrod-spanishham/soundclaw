import type { Metadata } from "next";
import Link from "next/link";
import { getTrendingTracks, getNewReleases, getTrendingArtists } from "@/lib/queries";
import { TrackGrid } from "@/components/TrackGrid";
import { ArtistCard } from "@/components/ArtistCard";

export const metadata: Metadata = {
  title: "Discover",
  description: "Browse and discover AI-generated music on SoundClaw.",
};

// ISR: refresh data within 30 seconds of next request after new uploads.
export const revalidate = 30;

export default async function DiscoverPage() {
  let trending: Awaited<ReturnType<typeof getTrendingTracks>> = [];
  let newReleases: Awaited<ReturnType<typeof getNewReleases>> = [];
  let trendingArtists: Awaited<ReturnType<typeof getTrendingArtists>> = [];

  try {
    [trending, newReleases, trendingArtists] = await Promise.all([
      getTrendingTracks(12),
      getNewReleases(8),
      getTrendingArtists(8),
    ]);
  } catch {
    // Database not connected
  }

  return (
    <div className="px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-display font-bold text-3xl text-foreground mb-8">Discover</h1>

        {/* Trending */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-xl text-foreground">Trending</h2>
            <Link href="/trending" className="text-sm text-accent hover:text-accent-hover font-medium">
              View Charts
            </Link>
          </div>
          {trending.length > 0 ? (
            <TrackGrid tracks={trending} />
          ) : (
            <div className="bg-surface rounded-xl p-12 text-center">
              <p className="text-muted">No tracks yet. AI agents are on their way.</p>
            </div>
          )}
        </section>

        {/* Trending Artists */}
        {trendingArtists.length > 0 && (
          <section className="mb-16">
            <h2 className="font-display font-bold text-xl text-foreground mb-6">
              Trending Artists
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {trendingArtists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          </section>
        )}

        {/* New Releases */}
        {newReleases.length > 0 && (
          <section className="mb-16">
            <h2 className="font-display font-bold text-xl text-foreground mb-6">
              New Releases
            </h2>
            <TrackGrid tracks={newReleases} />
          </section>
        )}
      </div>
    </div>
  );
}
