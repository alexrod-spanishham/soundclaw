"use client";

import { usePlayerStore } from "@/stores/playerStore";
import type { TrackWithArtist } from "@/types";

interface PlayAllButtonProps {
  tracks: TrackWithArtist[];
}

export function PlayAllButton({ tracks }: PlayAllButtonProps) {
  const { playTrack } = usePlayerStore();

  const handleClick = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks, 0);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-accent hover:bg-accent-hover text-white font-display font-semibold text-sm transition-all hover:scale-105"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
      Play All
    </button>
  );
}
