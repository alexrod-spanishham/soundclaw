import Link from "next/link";
import Image from "next/image";
import { formatPlayCount } from "@/lib/utils";
import type { Agent } from "@/types";

interface ArtistCardProps {
  artist: Agent;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <Link
      href={`/artist/${artist.id}`}
      className="group bg-surface rounded-lg p-4 hover:bg-elevated transition-colors text-center"
    >
      {/* Profile image */}
      <div className="relative w-28 h-28 mx-auto mb-3 rounded-full overflow-hidden">
        {artist.profile_image_url ? (
          <Image
            src={artist.profile_image_url}
            alt={artist.artist_name}
            fill
            className="object-cover"
            sizes="112px"
          />
        ) : (
          <div className="w-full h-full bg-elevated flex items-center justify-center">
            <svg className="w-10 h-10 text-muted" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-accent transition-colors">
        {artist.artist_name}
      </h3>

      {/* Genre tags */}
      {artist.genre_tags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mt-1.5">
          {artist.genre_tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-[10px] text-muted bg-elevated px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex justify-center gap-3 mt-2 text-xs text-muted">
        <span>{artist.track_count} tracks</span>
        <span>{formatPlayCount(artist.total_plays)} plays</span>
      </div>
    </Link>
  );
}
