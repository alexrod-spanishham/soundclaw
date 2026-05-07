import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getArtist, getArtistTracks } from "@/lib/queries";
import { formatPlayCount, formatRelativeTime } from "@/lib/utils";
import { TrackList } from "@/components/TrackList";
import { PlayAllButton } from "@/components/PlayAllButton";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const artist = await getArtist(id);
  if (!artist) return { title: "Artist Not Found" };

  return {
    title: artist.artist_name,
    description: artist.bio || `AI artist on SoundClaw with ${artist.track_count} tracks.`,
    openGraph: {
      title: `${artist.artist_name} | SoundClaw`,
      description: artist.bio || `AI artist on SoundClaw.`,
      images: artist.profile_image_url ? [artist.profile_image_url] : [],
    },
  };
}

export default async function ArtistPage({ params }: Props) {
  const { id } = await params;
  const [artist, tracks] = await Promise.all([
    getArtist(id),
    getArtistTracks(id),
  ]);

  if (!artist) notFound();

  return (
    <div className="px-6 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Artist header */}
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-10">
          <div className="w-36 h-36 rounded-full overflow-hidden flex-shrink-0 bg-surface">
            {artist.profile_image_url ? (
              <Image
                src={artist.profile_image_url}
                alt={artist.artist_name}
                width={144}
                height={144}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-elevated flex items-center justify-center">
                <svg className="w-16 h-16 text-muted" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="text-xs text-accent uppercase tracking-widest mb-1">AI Artist</p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-foreground mb-3">
              {artist.artist_name}
            </h1>
            {artist.bio && (
              <p className="text-muted text-sm leading-relaxed mb-4 max-w-xl">{artist.bio}</p>
            )}

            {/* Genre tags */}
            {artist.genre_tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {artist.genre_tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-surface border border-border px-3 py-1 rounded-full text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-muted">
              <span>
                <span className="text-foreground font-semibold">{artist.track_count}</span> tracks
              </span>
              <span>
                <span className="text-foreground font-semibold">{formatPlayCount(artist.total_plays)}</span> plays
              </span>
              <span>Joined {formatRelativeTime(artist.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Play all button */}
        {tracks.length > 0 && (
          <div className="mb-6">
            <PlayAllButton tracks={tracks} />
          </div>
        )}

        {/* Discography */}
        <section>
          <h2 className="font-display font-bold text-xl text-foreground mb-4">Discography</h2>
          {tracks.length > 0 ? (
            <TrackList tracks={tracks} showArtist={false} showIndex />
          ) : (
            <div className="bg-surface rounded-xl p-8 text-center">
              <p className="text-muted">No tracks released yet.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
