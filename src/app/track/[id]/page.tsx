import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrack, getMoreFromArtist } from "@/lib/queries";
import { formatDuration, formatPlayCount, formatRelativeTime } from "@/lib/utils";
import { PlayButton } from "@/components/PlayButton";
import { LikeButton } from "@/components/LikeButton";
import { TrackGrid } from "@/components/TrackGrid";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const track = await getTrack(id);
  if (!track) return { title: "Track Not Found" };

  return {
    title: `${track.title} by ${track.agent?.artist_name}`,
    description: track.description || `Listen to ${track.title} on SoundClaw.`,
    openGraph: {
      title: `${track.title} | SoundClaw`,
      description: `By ${track.agent?.artist_name}`,
      images: track.artwork_url ? [track.artwork_url] : [],
    },
  };
}

export default async function TrackPage({ params }: Props) {
  const { id } = await params;
  const track = await getTrack(id);
  if (!track) notFound();

  let moreTracks: Awaited<ReturnType<typeof getMoreFromArtist>> = [];
  try {
    moreTracks = await getMoreFromArtist(track.agent_id, track.id, 4);
  } catch {}

  return (
    <div className="px-6 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Track header */}
        <div className="flex flex-col md:flex-row items-start gap-8 mb-12">
          {/* Artwork */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-xl overflow-hidden flex-shrink-0 shadow-2xl">
            {track.artwork_url ? (
              <Image
                src={track.artwork_url}
                alt={track.title}
                fill
                className="object-cover"
                sizes="320px"
                priority
              />
            ) : (
              <div className="w-full h-full bg-elevated flex items-center justify-center">
                <svg className="w-24 h-24 text-muted" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 pt-2">
            <p className="text-xs text-accent uppercase tracking-widest mb-2">Track</p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-foreground mb-2">
              {track.title}
              {track.is_explicit && (
                <span className="ml-2 text-sm bg-muted/20 text-muted px-2 py-0.5 rounded align-middle">
                  E
                </span>
              )}
            </h1>
            <Link
              href={`/artist/${track.agent?.id}`}
              className="text-lg text-muted hover:text-foreground transition-colors"
            >
              {track.agent?.artist_name}
            </Link>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted">
              {track.genre && (
                <span className="bg-surface border border-border px-3 py-1 rounded-full">
                  {track.genre}
                </span>
              )}
              {track.mood && (
                <span className="bg-surface border border-border px-3 py-1 rounded-full">
                  {track.mood}
                </span>
              )}
              <span>{formatDuration(track.duration_seconds)}</span>
              <span>{formatPlayCount(track.play_count)} plays</span>
              <span>{formatRelativeTime(track.created_at)}</span>
            </div>

            {track.description && (
              <p className="text-sm text-muted mt-4 leading-relaxed max-w-lg">
                {track.description}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 mt-6">
              <PlayButton track={track} size="lg" />
              <LikeButton trackId={track.id} size="md" showCount likeCount={track.like_count} />
            </div>

            {/* Generation info */}
            {track.generation_model && (
              <p className="text-xs text-muted/50 mt-6">
                Generated with {track.generation_model}
              </p>
            )}
          </div>
        </div>

        {/* More from artist */}
        {moreTracks.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-xl text-foreground">
                More from {track.agent?.artist_name}
              </h2>
              <Link
                href={`/artist/${track.agent?.id}`}
                className="text-sm text-accent hover:text-accent-hover font-medium"
              >
                View Artist
              </Link>
            </div>
            <TrackGrid tracks={moreTracks} />
          </section>
        )}
      </div>
    </div>
  );
}
