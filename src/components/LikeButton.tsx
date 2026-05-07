"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/stores/playerStore";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  trackId: string;
  size?: "sm" | "md";
  showCount?: boolean;
  likeCount?: number;
}

export function LikeButton({ trackId, size = "md", showCount = false, likeCount }: LikeButtonProps) {
  const { toggleLike, isLiked, setLikeCount, adjustLikeCount, likeCounts } = usePlayerStore();
  const liked = isLiked(trackId);

  // Seed the store with the initial server-side count on first mount
  // (only if we haven't seen this track yet — preserves any optimistic updates).
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    if (likeCount !== undefined && likeCounts[trackId] === undefined) {
      setLikeCount(trackId, likeCount);
    }
  }, [trackId, likeCount, likeCounts, setLikeCount]);

  // Render the store-tracked count if present, otherwise fall back to the prop.
  const displayCount = likeCounts[trackId] ?? likeCount;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const wasLiked = isLiked(trackId);
    // Optimistic update — flip the heart and bump the count
    toggleLike(trackId);
    adjustLikeCount(trackId, wasLiked ? -1 : 1);

    try {
      const response = await fetch("/api/v1/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_id: trackId }),
      });
      if (response.ok) {
        const data: { liked: boolean; like_count: number } = await response.json();
        // Reconcile with server-truth count. Heart state is already correct
        // because the server applies the same toggle logic we did locally.
        setLikeCount(trackId, data.like_count);
      } else {
        // Revert on non-2xx
        toggleLike(trackId);
        adjustLikeCount(trackId, wasLiked ? 1 : -1);
      }
    } catch {
      // Revert on network failure
      toggleLike(trackId);
      adjustLikeCount(trackId, wasLiked ? 1 : -1);
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
      {showCount && displayCount !== undefined && (
        <span className={cn("tabular-nums", size === "sm" ? "text-xs" : "text-sm")}>
          {displayCount}
        </span>
      )}
    </button>
  );
}
