export type CaptureSheetName = 'Shows' | 'Movies';
export type CaptureSheetCell = string | number;

export interface CaptureSheetRow {
  sheetName: CaptureSheetName;
  range: string;
  values: CaptureSheetCell[];
}

export type CaptureLookup =
  | {
      itemType: 'episode';
      sheetName: 'Shows';
      range: "'Shows'!A:K";
      seriesName: string;
      seasonNumber: number;
      episodeNumber: number;
    }
  | {
      itemType: 'movie';
      sheetName: 'Movies';
      range: "'Movies'!A:I";
      title: string;
    };

export interface CaptureHistoryEntry {
  rowNumber: number;
  positionSeconds: number;
  path: string | null;
}

export class CaptureValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CaptureValidationError';
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new CaptureValidationError('A media record is required.');
  }

  return value as Record<string, unknown>;
}

function requiredString(
  record: Record<string, unknown>,
  field: string
): string {
  const value = record[field];
  if (typeof value !== 'string' || !value.trim()) {
    throw new CaptureValidationError(`The ${field} field is required.`);
  }

  return value.trim();
}

function optionalPath(record: Record<string, unknown>): string {
  const value = record.path;
  if (value === undefined || value === null || value === '') {
    return '';
  }

  if (typeof value !== 'string') {
    throw new CaptureValidationError('The path field must be a string.');
  }

  return value;
}

function requiredNonNegativeInteger(
  record: Record<string, unknown>,
  field: string
): number {
  const value = record[field];
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new CaptureValidationError(
      `Jellyfin must provide a valid ${field} number for this episode.`
    );
  }

  return value;
}

function formatPosition(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

function normalizeText(value: unknown): string | null {
  return typeof value === 'string' && value.trim()
    ? value.trim().toLowerCase()
    : null;
}

function parseNonNegativeInteger(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value >= 0 ? value : null;
  }

  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    return Number.isSafeInteger(parsed) ? parsed : null;
  }

  return null;
}

function parsePosition(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    // Numeric Google Sheets time/duration values are represented as fractions of a day.
    const seconds = Math.round(value * 24 * 60 * 60);
    return Number.isSafeInteger(seconds) ? seconds : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  // Accept the app's HH:MM:SS format and older MM:SS entries already in the sheet.
  const match = /^(?:(\d+):)?(\d+):([0-5]\d)$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const hours = match[1] === undefined ? 0 : Number(match[1]);
  const minutes = Number(match[2]);
  if (match[1] !== undefined && minutes > 59) {
    return null;
  }

  const seconds = hours * 3600 + minutes * 60 + Number(match[3]);
  return Number.isSafeInteger(seconds) ? seconds : null;
}

export function buildCaptureLookup(input: unknown): CaptureLookup {
  const record = asRecord(input);
  const itemType = requiredString(record, 'itemType').toLowerCase();

  if (itemType === 'episode') {
    return {
      itemType: 'episode',
      sheetName: 'Shows',
      range: "'Shows'!A:K",
      seriesName: requiredString(record, 'seriesName'),
      seasonNumber: requiredNonNegativeInteger(record, 'seasonNumber'),
      episodeNumber: requiredNonNegativeInteger(record, 'episodeNumber'),
    };
  }

  if (itemType === 'movie') {
    return {
      itemType: 'movie',
      sheetName: 'Movies',
      range: "'Movies'!A:I",
      title: requiredString(record, 'title'),
    };
  }

  throw new CaptureValidationError(
    'Only Jellyfin TV episodes and movies have saved capture history.'
  );
}

export function matchCaptureHistoryRows(
  rows: unknown[][],
  lookup: CaptureLookup
): CaptureHistoryEntry[] {
  const entries: CaptureHistoryEntry[] = [];

  rows.forEach((row, index) => {
    if (!Array.isArray(row)) {
      return;
    }

    const matchesMedia =
      lookup.itemType === 'episode'
        ? normalizeText(row[0]) === normalizeText(lookup.seriesName) &&
          parseNonNegativeInteger(row[1]) === lookup.seasonNumber &&
          parseNonNegativeInteger(row[2]) === lookup.episodeNumber
        : normalizeText(row[0]) === normalizeText(lookup.title);

    if (!matchesMedia) {
      return;
    }

    const positionColumn = lookup.itemType === 'episode' ? 3 : 1;
    const pathColumn = lookup.itemType === 'episode' ? 10 : 8;
    const positionSeconds = parsePosition(row[positionColumn]);
    if (positionSeconds === null) {
      return;
    }

    const path = row[pathColumn];
    entries.push({
      rowNumber: index + 1,
      positionSeconds,
      path: typeof path === 'string' && path.trim() ? path.trim() : null,
    });
  });

  return entries;
}

export function buildCaptureSheetRow(input: unknown): CaptureSheetRow {
  const record = asRecord(input);
  const itemType = requiredString(record, 'itemType').toLowerCase();
  const positionSeconds = record.positionSeconds;

  if (
    typeof positionSeconds !== 'number' ||
    !Number.isSafeInteger(positionSeconds) ||
    positionSeconds < 0
  ) {
    throw new CaptureValidationError(
      'The playback position must be a non-negative whole number of seconds.'
    );
  }

  const start = formatPosition(positionSeconds);
  const source = optionalPath(record);

  if (itemType === 'episode') {
    const show = requiredString(record, 'seriesName');
    const season = requiredNonNegativeInteger(record, 'seasonNumber');
    const episode = requiredNonNegativeInteger(record, 'episodeNumber');

    return {
      sheetName: 'Shows',
      range: "'Shows'!A:K",
      values: [show, season, episode, start, '', '', '', '', '', '', source],
    };
  }

  if (itemType === 'movie') {
    const title = requiredString(record, 'title');

    return {
      sheetName: 'Movies',
      range: "'Movies'!A:I",
      values: [title, start, '', '', '', '', '', '', source],
    };
  }

  throw new CaptureValidationError(
    'Only Jellyfin TV episodes and movies can be saved.'
  );
}
