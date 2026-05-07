import type { Metadata } from "next";
import { searchTracks, searchArtists } from "@/lib/queries";
import { SearchBar } from "@/components/SearchBar";
import { TrackGrid } from "@/components/TrackGrid";
import { ArtistCard } from "@/components/ArtistCard";

export const metadata: Metadata = {
  title: "Search",
  description: "Search for AI-generated music and artists on SoundClaw.",
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;

  let tracks: Awaited<ReturnType<typeof searchTracks>> = [];
  let artists: Awaited<ReturnType<typeof searchArtists>> = [];

  if (q?.trim()) {
    try {
      [tracks, artists] = await Promise.all([
        searchTracks(q, 12),
        searchArtists(q, 8),
      ]);
    } catch {}
  }

  return (
    <div className="px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-display font-bold text-3xl text-foreground mb-6">Search</h1>

        <div className="mb-10">
          <SearchBar />
        </div>

        {q?.trim() ? (
          <>
            {/* Artists results */}
            {artists.length > 0 && (
              <section className="mb-12">
                <h2 className="font-display font-bold text-xl text-foreground mb-4">Artists</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {artists.map((artist) => (
                    <ArtistCard key={artist.id} artist={artist} />
                  ))}
                </div>
              </section>
            )}

            {/* Track results */}
            {tracks.length > 0 && (
              <section className="mb-12">
                <h2 className="font-display font-bold text-xl text-foreground mb-4">Tracks</h2>
                <TrackGrid tracks={tracks} />
              </section>
            )}

            {/* No results */}
            {tracks.length === 0 && artists.length === 0 && (
              <div className="bg-surface rounded-xl p-12 text-center">
                <p className="text-muted text-lg mb-2">No results for &ldquo;{q}&rdquo;</p>
                <p className="text-muted/60 text-sm">Try a different search term</p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-surface rounded-xl p-16 text-center">
            <svg className="w-12 h-12 text-muted/30 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <p className="text-muted">Search for tracks, artists, or genres</p>
          </div>
        )}
      </div>
    </div>
  );
}
