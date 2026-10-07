import { createHash } from 'node:crypto';
import type { CaptureSheetName } from './capture-record';

export type ProcessingTab = CaptureSheetName;

export interface PendingClip {
  tab: ProcessingTab;
  rowNumber: number;
  revision: string;
  show: string | null;
  title: string | null;
  season: number | null;
  episode: number | null;
  start: string | null;
  name: string;
  description: string;
  script: string;
  characters: string;
  tags: string;
  source: string | null;
}

export interface ProcessingUpdate {
  tab: ProcessingTab;
  rowNumber: number;
  revision: string;
  start: string;
  end: string;
  name: string;
  description: string;
  script: string;
  characters: string;
  tags: string;
}

export class ProcessingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProcessingValidationError';
  }
}

export class ProcessingConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProcessingConflictError';
  }
}

export function isProcessingTab(value: unknown): value is ProcessingTab {
  return value === 'Shows' || value === 'Movies';
}

function cellText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

function isBlankCell(value: unknown): boolean {
  return value === undefined || value === null || cellText(value) === '';
}

function parseTimecode(value: string): number | null {
  const parts = value.trim().split(':');
  if (parts.length !== 2 && parts.length !== 3) {
    return null;
  }

  const secondsMatch = /^(\d{1,2})(?:\.(\d{1,3}))?$/.exec(
    parts[parts.length - 1] ?? ''
  );
  if (!secondsMatch) {
    return null;
  }

  const seconds = Number(secondsMatch[1]);
  const milliseconds = Number((secondsMatch[2] ?? '').padEnd(3, '0') || '0');
  if (seconds > 59) {
    return null;
  }

  if (parts.length === 2) {
    if (!/^\d+$/.test(parts[0])) {
      return null;
    }
    return Number(parts[0]) * 60 + seconds + milliseconds / 1000;
  }

  const [hoursText, minutesText] = parts;
  if (!/^\d+$/.test(hoursText) || !/^\d{1,2}$/.test(minutesText)) {
    return null;
  }
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  if (minutes > 59) {
    return null;
  }
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

function formatTimecode(totalSeconds: number): string {
  const totalMilliseconds = Math.max(0, Math.round(totalSeconds * 1000));
  const wholeSeconds = Math.floor(totalMilliseconds / 1000);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const seconds = wholeSeconds % 60;
  const milliseconds = totalMilliseconds % 1000;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0'
  )}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(
    3,
    '0'
  )}`;
}

function timecodeCell(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return formatTimecode(value * 24 * 60 * 60);
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  const seconds = parseTimecode(value);
  return seconds === null ? null : formatTimecode(seconds);
}

function optionalCell(row: unknown[], index: number): string {
  return cellText(row[index]);
}

function nullableNonNegativeInteger(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value >= 0 ? value : null;
  }
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    return Number.isSafeInteger(parsed) ? parsed : null;
  }
  return null;
}

function normalizedRow(row: unknown[], width: number): unknown[] {
  return Array.from({ length: width }, (_value, index) => row[index] ?? '');
}

export function processingRowRevision(
  row: unknown[],
  tab: ProcessingTab
): string {
  const width = tab === 'Shows' ? 11 : 9;
  return createHash('sha256')
    .update(JSON.stringify(normalizedRow(row, width)))
    .digest('hex');
}

export function findNextPendingClip(
  rows: unknown[][],
  tab: ProcessingTab
): PendingClip | null {
  const startColumn = tab === 'Shows' ? 3 : 1;
  const endColumn = tab === 'Shows' ? 4 : 2;
  const metadataOffset = tab === 'Shows' ? 5 : 3;
  const sourceColumn = tab === 'Shows' ? 10 : 8;
  const width = tab === 'Shows' ? 11 : 9;

  // Row 1 is the header. Preserve the spreadsheet's top-to-bottom processing order.
  for (let index = 1; index < rows.length; index += 1) {
    const row = Array.isArray(rows[index]) ? rows[index] : [];
    if (!isBlankCell(row[endColumn])) {
      continue;
    }

    const hasClipData = row.some(
      (value, column) => column !== endColumn && !isBlankCell(value)
    );
    if (!hasClipData) {
      continue;
    }

    const season = tab === 'Shows' ? nullableNonNegativeInteger(row[1]) : null;
    const episode = tab === 'Shows' ? nullableNonNegativeInteger(row[2]) : null;

    return {
      tab,
      rowNumber: index + 1,
      revision: processingRowRevision(row, tab),
      show: tab === 'Shows' ? cellText(row[0]) || null : null,
      title: tab === 'Movies' ? cellText(row[0]) || null : null,
      season,
      episode,
      start: timecodeCell(row[startColumn]),
      name: optionalCell(row, metadataOffset),
      description: optionalCell(row, metadataOffset + 1),
      script: optionalCell(row, metadataOffset + 2),
      characters: optionalCell(row, metadataOffset + 3),
      tags: optionalCell(row, metadataOffset + 4),
      source: cellText(row[sourceColumn]) || null,
    };
  }

  return null;
}

function requiredRowNumber(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 2) {
    throw new ProcessingValidationError(
      'A valid spreadsheet row number is required.'
    );
  }
  return value;
}

function requiredRevision(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-f\d]{64}$/.test(value)) {
    throw new ProcessingValidationError('A valid row revision is required.');
  }
  return value;
}

function requiredTimecode(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new ProcessingValidationError(`The ${field} timecode is required.`);
  }

  const parsed = parseTimecode(value);
  if (parsed === null) {
    throw new ProcessingValidationError(
      `The ${field} time must use HH:MM:SS.mmm format.`
    );
  }
  return formatTimecode(parsed);
}

function optionalText(value: unknown, field: string): string {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value !== 'string') {
    throw new ProcessingValidationError(`The ${field} field must be text.`);
  }
  return value.trim();
}

export function validateProcessingUpdate(
  tab: ProcessingTab,
  rowNumberValue: unknown,
  input: unknown
): ProcessingUpdate {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new ProcessingValidationError('A clip update is required.');
  }
  const record = input as Record<string, unknown>;
  const rowNumber = requiredRowNumber(rowNumberValue);
  const revision = requiredRevision(record.revision);
  const start = requiredTimecode(record.start, 'Start');
  const end = requiredTimecode(record.end, 'End');

  if ((parseTimecode(end) ?? 0) <= (parseTimecode(start) ?? 0)) {
    throw new ProcessingValidationError('End must be later than Start.');
  }

  return {
    tab,
    rowNumber,
    revision,
    start,
    end,
    name: optionalText(record.name, 'name'),
    description: optionalText(record.description, 'description'),
    script: optionalText(record.script, 'script'),
    characters: optionalText(record.characters, 'characters'),
    tags: optionalText(record.tags, 'tags'),
  };
}
