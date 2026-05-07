"use client";

import { usePlayerStore } from "@/stores/playerStore";
import { cn } from "@/lib/utils";
import type { TrackWithArtist } from "@/types";

interface PlayButtonProps {
  track: TrackWithArtist;
  queue?: TrackWithArtist[];
  index?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PlayButton({ track, queue, index, size = "md", className }: PlayButtonProps) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const isCurrentTrack = currentTrack?.id === track.id;
  const isTrackPlaying = isCurrentTrack && isPlaying;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isCurrentTrack) {
      togglePlay();
    } else {
      playTrack(track, queue, index);
    }
  };

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const iconClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center transition-all hover:scale-105 shadow-lg",
        isTrackPlaying && "animate-pulse-glow",
        sizeClasses[size],
        className
      )}
      aria-label={isTrackPlaying ? "Pause" : "Play"}
    >
      {isTrackPlaying ? (
        <svg className={iconClasses[size]} fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        </svg>
      ) : (
        <svg className={cn(iconClasses[size], "ml-0.5")} fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  );
}
