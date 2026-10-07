import path from 'node:path';
import { google } from 'googleapis';
import type { sheets_v4 } from 'googleapis';
import {
  buildCaptureLookup,
  buildCaptureSheetRow,
  matchCaptureHistoryRows,
  type CaptureHistoryEntry,
  type CaptureSheetName,
} from './capture-record';
import {
  findNextPendingClip,
  ProcessingConflictError,
  processingRowRevision,
  validateProcessingUpdate,
  type PendingClip,
  type ProcessingTab,
} from './processing-record';

const SPREADSHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const SHEET_ROWS_CACHE_TTL_MS = 60_000;

export class SheetsServiceError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = 'SheetsServiceError';
  }
}

interface SheetsConfiguration {
  spreadsheetId: string;
  credentialPath: string;
  sheets: sheets_v4.Sheets;
}

interface CachedSheetRows {
  expiresAt: number;
  rows: unknown[][];
}

let cachedClient: {
  credentialPath: string;
  sheets: sheets_v4.Sheets;
} | null = null;

const cachedSheetRows = new Map<string, CachedSheetRows>();
const pendingSheetReads = new Map<string, Promise<unknown[][]>>();
const sheetCacheGenerations = new Map<string, number>();

function getSheetsClient(credentialPath: string): sheets_v4.Sheets {
  if (!cachedClient || cachedClient.credentialPath !== credentialPath) {
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialPath,
      scopes: [SPREADSHEETS_SCOPE],
    });

    cachedClient = {
      credentialPath,
      sheets: google.sheets({ version: 'v4', auth }),
    };
  }

  return cachedClient.sheets;
}

function getSheetsConfiguration(): SheetsConfiguration {
  const spreadsheetId = process.env.SHEET_ID?.trim();
  const configuredCredentialPath = process.env.CREDENTIAL_PATH?.trim();

  if (!spreadsheetId || !configuredCredentialPath) {
    throw new SheetsServiceError(
      'Google Sheets is not configured. Set SHEET_ID and CREDENTIAL_PATH for the API service.',
      503
    );
  }

  const credentialPath = path.resolve(process.cwd(), configuredCredentialPath);
  return {
    spreadsheetId,
    credentialPath,
    sheets: getSheetsClient(credentialPath),
  };
}

function googleStatusCode(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const candidate = error as {
    code?: unknown;
    response?: { status?: unknown };
  };

  if (typeof candidate.code === 'number') {
    return candidate.code;
  }

  return typeof candidate.response?.status === 'number'
    ? candidate.response.status
    : null;
}

function googleErrorMessage(
  statusCode: number | null,
  operation: 'read' | 'append' | 'update'
): string {
  if (statusCode === 401 || statusCode === 403) {
    return 'Google Sheets rejected the service account. Check the credential file and make sure its account has Editor access to the spreadsheet.';
  }

  if (statusCode === 404) {
    return 'Google Sheets could not find the spreadsheet or the Shows/Movies tab. Check SHEET_ID and make sure both tabs already exist.';
  }

  if (statusCode === 400) {
    if (operation === 'append') {
      return 'Google Sheets rejected the record. Check that the existing sheet tabs have the expected columns.';
    }
    return operation === 'update'
      ? 'Google Sheets rejected the clip update. Check that the Shows/Movies tabs have the expected columns.'
      : 'Google Sheets rejected the history lookup. Check that the Shows/Movies tabs have the expected columns.';
  }

  if (operation === 'append') {
    return 'Could not append the record to Google Sheets. Check the Sheets API configuration and network connection.';
  }
  return operation === 'update'
    ? 'Could not update the clip in Google Sheets. Check the Sheets API configuration and network connection.'
    : 'Could not read capture history from Google Sheets. Check the Sheets API configuration and network connection.';
}

function sheetsServiceError(
  error: unknown,
  operation: 'read' | 'append' | 'update'
): SheetsServiceError {
  const statusCode = googleStatusCode(error);
  console.error(
    `[jellyfin-capture] Google Sheets ${operation} failed${
      statusCode === null ? '' : ` (HTTP ${statusCode})`
    }.`
  );
  return new SheetsServiceError(googleErrorMessage(statusCode, operation), 502);
}

function sheetRowsCacheKey(
  spreadsheetId: string,
  credentialPath: string,
  sheetName: CaptureSheetName
): string {
  return JSON.stringify([spreadsheetId, credentialPath, sheetName]);
}

function invalidateSheetRowsCache(
  spreadsheetId: string,
  credentialPath: string,
  sheetName: CaptureSheetName
): void {
  const key = sheetRowsCacheKey(spreadsheetId, credentialPath, sheetName);
  sheetCacheGenerations.set(key, (sheetCacheGenerations.get(key) ?? 0) + 1);
  cachedSheetRows.delete(key);
  pendingSheetReads.delete(key);
}

async function getSheetRows(
  configuration: SheetsConfiguration,
  sheetName: CaptureSheetName,
  range: string
): Promise<unknown[][]> {
  const key = sheetRowsCacheKey(
    configuration.spreadsheetId,
    configuration.credentialPath,
    sheetName
  );
  const cached = cachedSheetRows.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.rows;
  }

  const pending = pendingSheetReads.get(key);
  if (pending) {
    return pending;
  }

  const generation = sheetCacheGenerations.get(key) ?? 0;
  const request = configuration.sheets.spreadsheets.values
    .get({
      spreadsheetId: configuration.spreadsheetId,
      range,
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'SERIAL_NUMBER',
    })
    .then(({ data }) => {
      const rows = (data.values ?? []) as unknown[][];
      if ((sheetCacheGenerations.get(key) ?? 0) === generation) {
        cachedSheetRows.set(key, {
          expiresAt: Date.now() + SHEET_ROWS_CACHE_TTL_MS,
          rows,
        });
      }
      return rows;
    })
    .finally(() => {
      if (pendingSheetReads.get(key) === request) {
        pendingSheetReads.delete(key);
      }
    });

  pendingSheetReads.set(key, request);
  return request;
}

export async function appendCapture(
  input: unknown
): Promise<{ sheetName: CaptureSheetName }> {
  const row = buildCaptureSheetRow(input);
  const configuration = getSheetsConfiguration();

  try {
    await configuration.sheets.spreadsheets.values.append({
      spreadsheetId: configuration.spreadsheetId,
      range: row.range,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row.values] },
    });
  } catch (error) {
    throw sheetsServiceError(error, 'append');
  }

  invalidateSheetRowsCache(
    configuration.spreadsheetId,
    configuration.credentialPath,
    row.sheetName
  );
  return { sheetName: row.sheetName };
}

export async function findNextProcessingClip(
  tab: ProcessingTab
): Promise<PendingClip | null> {
  const configuration = getSheetsConfiguration();
  const range = tab === 'Shows' ? "'Shows'!A:K" : "'Movies'!A:I";

  try {
    const rows = await getSheetRows(configuration, tab, range);
    return findNextPendingClip(rows, tab);
  } catch (error) {
    throw sheetsServiceError(error, 'read');
  }
}

export async function updateProcessedClip(
  tab: ProcessingTab,
  rowNumberValue: unknown,
  input: unknown
): Promise<{ tab: ProcessingTab; rowNumber: number }> {
  const update = validateProcessingUpdate(tab, rowNumberValue, input);
  const configuration = getSheetsConfiguration();
  const rowRange =
    tab === 'Shows'
      ? `'Shows'!A${update.rowNumber}:K${update.rowNumber}`
      : `'Movies'!A${update.rowNumber}:I${update.rowNumber}`;

  let currentRow: unknown[] | undefined;
  try {
    const { data } = await configuration.sheets.spreadsheets.values.get({
      spreadsheetId: configuration.spreadsheetId,
      range: rowRange,
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'SERIAL_NUMBER',
    });
    currentRow = (data.values?.[0] ?? []) as unknown[];
  } catch (error) {
    throw sheetsServiceError(error, 'update');
  }

  if (!currentRow || currentRow.length === 0) {
    throw new ProcessingConflictError(
      'The sheet row no longer exists. Reload the queue and try again.'
    );
  }

  const endColumn = tab === 'Shows' ? 4 : 2;
  const endValue = currentRow[endColumn];
  if (
    endValue !== undefined &&
    endValue !== null &&
    String(endValue).trim() !== ''
  ) {
    throw new ProcessingConflictError(
      'This clip has already been processed. Reload the queue.'
    );
  }

  if (processingRowRevision(currentRow, tab) !== update.revision) {
    throw new ProcessingConflictError(
      'This sheet row changed while you were editing it. Reload the queue before saving.'
    );
  }

  const updateRange =
    tab === 'Shows'
      ? `'Shows'!D${update.rowNumber}:J${update.rowNumber}`
      : `'Movies'!B${update.rowNumber}:H${update.rowNumber}`;
  try {
    await configuration.sheets.spreadsheets.values.update({
      spreadsheetId: configuration.spreadsheetId,
      range: updateRange,
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          [
            update.start,
            update.end,
            update.name,
            update.description,
            update.script,
            update.characters,
            update.tags,
          ],
        ],
      },
    });
  } catch (error) {
    throw sheetsServiceError(error, 'update');
  }

  invalidateSheetRowsCache(
    configuration.spreadsheetId,
    configuration.credentialPath,
    tab
  );
  return { tab, rowNumber: update.rowNumber };
}

export async function findCaptureHistory(
  input: unknown
): Promise<{ sheetName: CaptureSheetName; entries: CaptureHistoryEntry[] }> {
  const lookup = buildCaptureLookup(input);
  const configuration = getSheetsConfiguration();

  try {
    const rows = await getSheetRows(
      configuration,
      lookup.sheetName,
      lookup.range
    );
    return {
      sheetName: lookup.sheetName,
      entries: matchCaptureHistoryRows(rows, lookup),
    };
  } catch (error) {
    throw sheetsServiceError(error, 'read');
  }
}
