"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePlayerStore } from "@/stores/playerStore";
import { LikeButton } from "./LikeButton";
import { formatDuration } from "@/lib/utils";

export function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playTimerRef = useRef<number>(0); // accumulated play time in seconds
  const playCountedRef = useRef<boolean>(false);
  const lastTrackIdRef = useRef<string | null>(null);

  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setDuration,
    setCurrentTime,
    setVolume,
    toggleMute,
  } = usePlayerStore();

  // Reset play counter when track changes
  useEffect(() => {
    if (currentTrack?.id !== lastTrackIdRef.current) {
      playTimerRef.current = 0;
      playCountedRef.current = false;
      lastTrackIdRef.current = currentTrack?.id || null;
    }
  }, [currentTrack?.id]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.play().catch(() => {
        // Browser may block autoplay
        usePlayerStore.setState({ isPlaying: false });
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // Handle volume
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Handle seek from store
  const lastSeekRef = useRef<number>(0);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    // Only seek if the difference is significant (user clicked progress bar)
    if (Math.abs(audio.currentTime - currentTime) > 1.5) {
      audio.currentTime = currentTime;
    }
    lastSeekRef.current = currentTime;
  }, [currentTime, currentTrack]);

  // Play count tracking — accumulate actual play time
  useEffect(() => {
    if (!isPlaying || !currentTrack || playCountedRef.current) return;

    const interval = setInterval(() => {
      playTimerRef.current += 1;
      if (playTimerRef.current >= 30 && !playCountedRef.current) {
        playCountedRef.current = true;
        // Fire play count
        fetch("/api/v1/plays", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            track_id: currentTrack.id,
            duration_listened: Math.floor(playTimerRef.current),
          }),
        }).catch(() => {}); // silent fail
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
  }, [setCurrentTime]);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration);
  }, [setDuration]);

  const handleEnded = useCallback(() => {
    nextTrack();
  }, [nextTrack]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = e.currentTarget;
      const rect = bar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      seek(newTime);
      if (audioRef.current) {
        audioRef.current.currentTime = newTime;
      }
    },
    [duration, seek]
  );

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border animate-slide-up">
      {/* Progress bar — clickable, full width at top of player */}
      <div
        className="h-1 w-full bg-border cursor-pointer group"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-accent transition-all duration-100 group-hover:h-1.5"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-4 py-3 max-w-screen-2xl mx-auto">
        {/* Track info — left */}
        <div className="flex items-center gap-3 min-w-0 w-1/3">
          {currentTrack.artwork_url ? (
            <Image
              src={currentTrack.artwork_url}
              alt={currentTrack.title}
              width={48}
              height={48}
              className="rounded shadow-lg flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-elevated flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-muted" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
          <div className="min-w-0">
            <Link
              href={`/track/${currentTrack.id}`}
              className="text-sm font-medium text-foreground hover:text-accent truncate block"
            >
              {currentTrack.title}
            </Link>
            <Link
              href={`/artist/${currentTrack.agent?.id}`}
              className="text-xs text-muted hover:text-foreground truncate block"
            >
              {currentTrack.agent?.artist_name}
            </Link>
          </div>
          <LikeButton trackId={currentTrack.id} size="sm" />
        </div>

        {/* Controls — center */}
        <div className="flex flex-col items-center gap-1 w-1/3">
          <div className="flex items-center gap-4">
            {/* Previous */}
            <button
              onClick={prevTrack}
              className="text-muted hover:text-foreground transition-colors"
              aria-label="Previous track"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 transition-transform"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Next */}
            <button
              onClick={nextTrack}
              className="text-muted hover:text-foreground transition-colors"
              aria-label="Next track"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>

          {/* Time display */}
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="w-10 text-right tabular-nums">
              {formatDuration(Math.floor(currentTime))}
            </span>
            <span>/</span>
            <span className="w-10 tabular-nums">
              {formatDuration(Math.floor(duration))}
            </span>
          </div>
        </div>

        {/* Volume — right */}
        <div className="flex items-center justify-end gap-2 w-1/3">
          <button
            onClick={toggleMute}
            className="text-muted hover:text-foreground transition-colors hidden sm:block"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : volume < 0.5 ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 hidden sm:block"
            aria-label="Volume"
          />
        </div>
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={currentTrack.audio_url}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
    </div>
  );
}
