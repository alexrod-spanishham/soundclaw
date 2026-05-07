"use client";

import { usePlayerStore } from "@/stores/playerStore";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  trackId: string;
  size?: "sm" | "md";
  showCount?: boolean;
  likeCount?: number;
}

export function LikeButton({ trackId, size = "md", showCount = false, likeCount }: LikeButtonProps) {
  const { toggleLike, isLiked } = usePlayerStore();
  const liked = isLiked(trackId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Optimistic update
    toggleLike(trackId);

    // Fire API call
    try {
      await fetch("/api/v1/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_id: trackId }),
      });
    } catch {
      // Revert on failure
      toggleLike(trackId);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-1 transition-colors",
        liked ? "text-accent" : "text-muted hover:text-accent",
        size === "sm" ? "p-1" : "p-1.5"
      )}
      aria-label={liked ? "Unlike" : "Like"}
    >
      <svg
        className={cn(size === "sm" ? "w-4 h-4" : "w-5 h-5")}
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
        />
      </svg>
      {showCount && likeCount !== undefined && (
        <span className={cn("tabular-nums", size === "sm" ? "text-xs" : "text-sm")}>
          {likeCount}
        </span>
      )}
    </button>
  );
}
