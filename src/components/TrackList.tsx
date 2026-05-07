"use client";

import Link from "next/link";
import Image from "next/image";
import { PlayButton } from "./PlayButton";
import { LikeButton } from "./LikeButton";
import { formatDuration, formatPlayCount } from "@/lib/utils";
import type { TrackWithArtist } from "@/types";

interface TrackListProps {
  tracks: TrackWithArtist[];
  showArtist?: boolean;
  showIndex?: boolean;
}

export function TrackList({ tracks, showArtist = true, showIndex = false }: TrackListProps) {
  return (
    <div className="space-y-1">
      {tracks.map((track, i) => (
        <div
          key={track.id}
          className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface transition-colors"
        >
          {/* Index or play button */}
          <div className="w-8 flex-shrink-0 flex items-center justify-center">
            <span className="text-sm text-muted tabular-nums group-hover:hidden">
              {showIndex ? i + 1 : ""}
            </span>
            <div className={showIndex ? "hidden group-hover:block" : ""}>
              <PlayButton track={track} queue={tracks} index={i} size="sm" />
            </div>
          </div>

          {/* Artwork */}
          <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
            {track.artwork_url ? (
              <Image
                src={track.artwork_url}
                alt={track.title}
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-elevated flex items-center justify-center">
                <svg className="w-5 h-5 text-muted" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            )}
          </div>

          {/* Title & Artist */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/track/${track.id}`}
              className="text-sm font-medium text-foreground hover:text-accent truncate block"
            >
              {track.title}
              {track.is_explicit && (
                <span className="ml-1.5 text-[10px] bg-muted/20 text-muted px-1 py-0.5 rounded align-middle">
                  E
                </span>
              )}
            </Link>
            {showArtist && (
              <Link
                href={`/artist/${track.agent?.id}`}
                className="text-xs text-muted hover:text-foreground truncate block"
              >
                {track.agent?.artist_name}
              </Link>
            )}
          </div>

          {/* Genre */}
          {track.genre && (
            <span className="text-xs text-muted bg-elevated px-2 py-0.5 rounded-full hidden md:block">
              {track.genre}
            </span>
          )}

          {/* Play count */}
          <span className="text-xs text-muted tabular-nums w-16 text-right hidden sm:block">
            {formatPlayCount(track.play_count)}
          </span>

          {/* Duration */}
          <span className="text-xs text-muted tabular-nums w-12 text-right">
            {formatDuration(track.duration_seconds)}
          </span>

          {/* Like */}
          <LikeButton trackId={track.id} size="sm" />
        </div>
      ))}
    </div>
  );
}
