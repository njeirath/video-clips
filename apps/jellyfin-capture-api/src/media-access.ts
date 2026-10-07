import { randomUUID } from 'node:crypto';

const MEDIA_ACCESS_TTL_MS = 12 * 60 * 60 * 1000;

interface MediaAccessEntry {
  source: string;
  expiresAt: number;
}

const mediaAccessEntries = new Map<string, MediaAccessEntry>();

function removeExpiredEntries(now: number): void {
  for (const [token, entry] of mediaAccessEntries) {
    if (entry.expiresAt <= now) {
      mediaAccessEntries.delete(token);
    }
  }
}

export function createMediaAccessToken(source: string): string {
  const now = Date.now();
  removeExpiredEntries(now);
  const token = randomUUID();
  mediaAccessEntries.set(token, {
    source,
    expiresAt: now + MEDIA_ACCESS_TTL_MS,
  });
  return token;
}

export function getMediaSourceForToken(token: string): string | null {
  const entry = mediaAccessEntries.get(token);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt <= Date.now()) {
    mediaAccessEntries.delete(token);
    return null;
  }
  return entry.source;
}
