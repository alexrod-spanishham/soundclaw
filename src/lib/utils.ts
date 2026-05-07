import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDuration(seconds: number | null): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatPlayCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) return date.toLocaleDateString();
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return "just now";
}

export function sanitizeText(input: string, maxLength: number = 500): string {
  return input
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/\s+/g, " ") // normalize whitespace
    .trim()
    .slice(0, maxLength);
}

export function generateSessionId(): string {
  return crypto.randomUUID();
}

const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/ogg",
  "audio/flac",
];

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

export function isValidAudioType(contentType: string): boolean {
  return ALLOWED_AUDIO_TYPES.includes(contentType.toLowerCase());
}

export function isValidImageType(contentType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(contentType.toLowerCase());
}

// Audio validation constants
export const AUDIO_MIN_DURATION = 30; // seconds
export const AUDIO_MAX_DURATION = 900; // 15 minutes
export const AUDIO_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const ARTWORK_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Content-type → file extension mappings. Used by the upload-init route to
// generate a presigned R2 key with the right extension, and by the confirm
// route to know which path to HEAD-check. Defaults preserve the prior
// behavior (mp3/jpg) when content_type isn't supplied.
const AUDIO_CONTENT_TYPE_TO_EXT: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/wave": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
  "audio/flac": "flac",
};

const IMAGE_CONTENT_TYPE_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function audioExtensionFor(contentType: string | undefined | null): string {
  if (!contentType) return "mp3";
  return AUDIO_CONTENT_TYPE_TO_EXT[contentType.toLowerCase()] ?? "mp3";
}

export function imageExtensionFor(contentType: string | undefined | null): string {
  if (!contentType) return "jpg";
  return IMAGE_CONTENT_TYPE_TO_EXT[contentType.toLowerCase()] ?? "jpg";
}
