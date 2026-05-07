"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TrackWithArtist } from "@/types";

interface PlayerState {
  // Playback state
  currentTrack: TrackWithArtist | null;
  queue: TrackWithArtist[];
  queueIndex: number;
  isPlaying: boolean;

  // Audio state
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;

  // Likes
  likedTrackIds: Set<string>;
  likeCounts: Record<string, number>;

  // Actions
  playTrack: (track: TrackWithArtist, queue?: TrackWithArtist[], index?: number) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (time: number) => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleLike: (trackId: string) => void;
  setLikedTrackIds: (ids: string[]) => void;
  isLiked: (trackId: string) => boolean;
  setLikeCount: (trackId: string, count: number) => void;
  adjustLikeCount: (trackId: string, delta: number) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      queue: [],
      queueIndex: 0,
      isPlaying: false,
      duration: 0,
      currentTime: 0,
      volume: 0.7,
      isMuted: false,
      likedTrackIds: new Set<string>(),
      likeCounts: {},

      playTrack: (track, queue, index) => {
        set({
          currentTrack: track,
          queue: queue || [track],
          queueIndex: index ?? 0,
          isPlaying: true,
          currentTime: 0,
          duration: track.duration_seconds || 0,
        });
      },

      togglePlay: () => {
        const { currentTrack } = get();
        if (!currentTrack) return;
        set((state) => ({ isPlaying: !state.isPlaying }));
      },

      nextTrack: () => {
        const { queue, queueIndex } = get();
        if (queueIndex < queue.length - 1) {
          const nextIndex = queueIndex + 1;
          set({
            currentTrack: queue[nextIndex],
            queueIndex: nextIndex,
            isPlaying: true,
            currentTime: 0,
            duration: queue[nextIndex].duration_seconds || 0,
          });
        } else {
          set({ isPlaying: false });
        }
      },

      prevTrack: () => {
        const { queue, queueIndex, currentTime } = get();
        // If more than 3 seconds in, restart current track
        if (currentTime > 3) {
          set({ currentTime: 0 });
          return;
        }
        if (queueIndex > 0) {
          const prevIndex = queueIndex - 1;
          set({
            currentTrack: queue[prevIndex],
            queueIndex: prevIndex,
            isPlaying: true,
            currentTime: 0,
            duration: queue[prevIndex].duration_seconds || 0,
          });
        }
      },

      seek: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),
      setCurrentTime: (time) => set({ currentTime: time }),
      setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

      toggleLike: (trackId) => {
        set((state) => {
          const newSet = new Set(state.likedTrackIds);
          if (newSet.has(trackId)) {
            newSet.delete(trackId);
          } else {
            newSet.add(trackId);
          }
          return { likedTrackIds: newSet };
        });
      },

      setLikedTrackIds: (ids) => set({ likedTrackIds: new Set(ids) }),

      isLiked: (trackId) => get().likedTrackIds.has(trackId),

      setLikeCount: (trackId, count) =>
        set((state) => ({
          likeCounts: { ...state.likeCounts, [trackId]: Math.max(0, count) },
        })),

      adjustLikeCount: (trackId, delta) =>
        set((state) => {
          const current = state.likeCounts[trackId] ?? 0;
          return {
            likeCounts: { ...state.likeCounts, [trackId]: Math.max(0, current + delta) },
          };
        }),
    }),
    {
      name: "soundclaw-player",
      // Only persist volume and mute state
      partialize: (state) => ({
        volume: state.volume,
        isMuted: state.isMuted,
      }),
    }
  )
);
