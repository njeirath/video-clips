export type CaptureSheetName = 'Shows' | 'Movies';
export type CaptureSheetCell = string | number;

export interface CaptureSheetRow {
  sheetName: CaptureSheetName;
  range: string;
  values: CaptureSheetCell[];
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
