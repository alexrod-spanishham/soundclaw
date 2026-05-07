"use client";

import { TrackCard } from "./TrackCard";
import type { TrackWithArtist } from "@/types";

interface TrackGridProps {
  tracks: TrackWithArtist[];
}

export function TrackGrid({ tracks }: TrackGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {tracks.map((track, i) => (
        <div
          key={track.id}
          className="opacity-0"
          style={{
            animation: "stagger-in 0.5s ease-out forwards",
            animationDelay: `${i * 0.05}s`,
          }}
        >
          <TrackCard track={track} queue={tracks} index={i} />
        </div>
      ))}
    </div>
  );
}
