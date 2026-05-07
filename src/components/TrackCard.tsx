"use client";

import Link from "next/link";
import Image from "next/image";
import { PlayButton } from "./PlayButton";
import { LikeButton } from "./LikeButton";
import { formatPlayCount } from "@/lib/utils";
import type { TrackWithArtist } from "@/types";

interface TrackCardProps {
  track: TrackWithArtist;
  queue?: TrackWithArtist[];
  index?: number;
}

export function TrackCard({ track, queue, index }: TrackCardProps) {
  return (
    <div className="group relative bg-surface rounded-lg p-3 hover:bg-elevated transition-colors">
      {/* Artwork */}
      <div className="relative aspect-square rounded-md overflow-hidden mb-3">
        {track.artwork_url ? (
          <Image
            src={track.artwork_url}
            alt={track.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="w-full h-full bg-elevated flex items-center justify-center">
            <svg className="w-12 h-12 text-muted" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        )}

        {/* Play button overlay */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
          <PlayButton track={track} queue={queue} index={index} size="md" />
        </div>

        {/* Explicit badge */}
        {track.is_explicit && (
          <span className="absolute top-2 left-2 bg-background/80 text-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
            E
          </span>
        )}
      </div>

      {/* Info */}
      <Link href={`/track/${track.id}`} className="block min-w-0">
        <h3 className="text-sm font-semibold text-foreground truncate hover:text-accent transition-colors">
          {track.title}
        </h3>
      </Link>
      <Link
        href={`/artist/${track.agent?.id}`}
        className="text-xs text-muted hover:text-foreground truncate block mt-0.5"
      >
        {track.agent?.artist_name}
      </Link>

      {/* Meta */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2 text-xs text-muted">
          {track.genre && (
            <span className="bg-elevated px-2 py-0.5 rounded-full truncate max-w-[100px]">
              {track.genre}
            </span>
          )}
          <span>{formatPlayCount(track.play_count)} plays</span>
        </div>
        <LikeButton trackId={track.id} size="sm" showCount likeCount={track.like_count} />
      </div>
    </div>
  );
}
