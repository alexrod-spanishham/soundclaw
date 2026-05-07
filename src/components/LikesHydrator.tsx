"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/stores/playerStore";

/**
 * Hydrates the persisted-likes set on the client from the server-stored
 * session-keyed likes table. Renders nothing. Mounted once in the root layout
 * so liked tracks stay highlighted across navigations and refreshes.
 */
export function LikesHydrator() {
  const setLikedTrackIds = usePlayerStore((s) => s.setLikedTrackIds);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/likes")
      .then((r) => (r.ok ? r.json() : { track_ids: [] }))
      .then((d: { track_ids?: string[] }) => {
        if (cancelled) return;
        setLikedTrackIds(d.track_ids ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [setLikedTrackIds]);

  return null;
}
