const TICKS_PER_SECOND = 10_000_000;

const DEFAULT_JELLYFIN_URL = 'http://192.168.0.7:8096';

interface JellyfinItemDto {
  Id?: unknown;
  Name?: unknown;
  Type?: unknown;
  SeriesName?: unknown;
  ParentIndexNumber?: unknown;
  IndexNumber?: unknown;
  Path?: unknown;
  RunTimeTicks?: unknown;
  MediaSources?: Array<{ Path?: unknown }>;
}

interface JellyfinSessionDto {
  Id?: unknown;
  DeviceId?: unknown;
  UserName?: unknown;
  Client?: unknown;
  DeviceName?: unknown;
  NowPlayingItem?: JellyfinItemDto | null;
  PlayState?: {
    PositionTicks?: unknown;
    IsPaused?: unknown;
  } | null;
}

export interface PlayingStream {
  sessionId: string;
  itemId: string | null;
  title: string;
  itemType: string | null;
  seriesName: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  path: string | null;
  userName: string | null;
  client: string | null;
  deviceName: string | null;
  isPaused: boolean;
  positionSeconds: number;
  durationSeconds: number | null;
}

export interface JellyfinSnapshot {
  snapshotAt: string;
  streams: PlayingStream[];
}

export class JellyfinServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
    this.name = 'JellyfinServiceError';
  }
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function optionalNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function ticksToSeconds(value: unknown): number {
  const ticks = optionalNumber(value);
  if (ticks === null || ticks <= 0) {
    return 0;
  }

  return Math.round(ticks / TICKS_PER_SECOND);
}

function getItemPath(item: JellyfinItemDto): string | null {
  const directPath = optionalString(item.Path);
  if (directPath) {
    return directPath;
  }

  for (const source of item.MediaSources ?? []) {
    const sourcePath = optionalString(source.Path);
    if (sourcePath) {
      return sourcePath;
    }
  }

  return null;
}

function normalizeSession(
  session: JellyfinSessionDto,
  index: number
): PlayingStream | null {
  const item = session.NowPlayingItem;
  if (!item) {
    return null;
  }

  const itemId = optionalString(item.Id);
  const sessionId = optionalString(session.Id) ?? `session-${index}`;
  const durationTicks = optionalNumber(item.RunTimeTicks);

  return {
    sessionId,
    itemId,
    title: optionalString(item.Name) ?? 'Unknown media',
    itemType: optionalString(item.Type),
    seriesName: optionalString(item.SeriesName),
    seasonNumber: optionalNumber(item.ParentIndexNumber),
    episodeNumber: optionalNumber(item.IndexNumber),
    path: getItemPath(item),
    userName: optionalString(session.UserName),
    client: optionalString(session.Client),
    deviceName: optionalString(session.DeviceName),
    isPaused: session.PlayState?.IsPaused === true,
    positionSeconds: ticksToSeconds(session.PlayState?.PositionTicks),
    durationSeconds:
      durationTicks !== null && durationTicks > 0
        ? ticksToSeconds(durationTicks)
        : null,
  };
}

function createAuthorizationHeader(apiKey: string): string {
  const token = apiKey.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `MediaBrowser Client="Jellyfin Capture", Device="LAN Web App", DeviceId="jellyfin-capture", Version="1.0", Token="${token}"`;
}

export async function fetchJellyfinSnapshot(): Promise<JellyfinSnapshot> {
  const apiKey = process.env.JELLYFIN_API_KEY?.trim();
  if (!apiKey) {
    throw new JellyfinServiceError(
      'Jellyfin is not configured: set JELLYFIN_API_KEY for the API service.',
      503
    );
  }

  const serverUrl = process.env.JELLYFIN_URL?.trim() || DEFAULT_JELLYFIN_URL;
  let sessionsUrl: URL;
  try {
    const parsedUrl = new URL(serverUrl);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Unsupported protocol');
    }
    sessionsUrl = new URL('/Sessions', parsedUrl);
  } catch {
    throw new JellyfinServiceError(
      'JELLYFIN_URL must be a valid HTTP or HTTPS URL.',
      500
    );
  }

  let response: Response;
  try {
    response = await fetch(sessionsUrl, {
      headers: {
        Accept: 'application/json',
        Authorization: createAuthorizationHeader(apiKey),
      },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new JellyfinServiceError(
      'Could not reach Jellyfin. Check the server URL and network connection.',
      502
    );
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new JellyfinServiceError(
        'Jellyfin rejected the API key. Check JELLYFIN_API_KEY.',
        502
      );
    }

    throw new JellyfinServiceError(
      `Jellyfin returned an error (HTTP ${response.status}).`,
      502
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new JellyfinServiceError(
      'Jellyfin returned a response that could not be read.',
      502
    );
  }

  if (!Array.isArray(payload)) {
    throw new JellyfinServiceError(
      'Jellyfin returned an unexpected sessions response.',
      502
    );
  }

  const streams = (payload as JellyfinSessionDto[])
    .map((session, index) => normalizeSession(session, index))
    .filter((stream): stream is PlayingStream => stream !== null);

  return {
    snapshotAt: new Date().toISOString(),
    streams,
  };
}
