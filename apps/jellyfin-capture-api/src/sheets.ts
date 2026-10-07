import path from 'node:path';
import { google } from 'googleapis';
import type { sheets_v4 } from 'googleapis';
import { buildCaptureSheetRow, type CaptureSheetName } from './capture-record';

const SPREADSHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

export class SheetsServiceError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = 'SheetsServiceError';
  }
}

let cachedClient: {
  credentialPath: string;
  sheets: sheets_v4.Sheets;
} | null = null;

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

function googleErrorMessage(statusCode: number | null): string {
  if (statusCode === 401 || statusCode === 403) {
    return 'Google Sheets rejected the service account. Check the credential file and make sure its account has Editor access to the spreadsheet.';
  }

  if (statusCode === 404) {
    return 'Google Sheets could not find the spreadsheet or the Shows/Movies tab. Check SHEET_ID and make sure both tabs already exist.';
  }

  if (statusCode === 400) {
    return 'Google Sheets rejected the record. Check that the existing sheet tabs have the expected columns.';
  }

  return 'Could not append the record to Google Sheets. Check the Sheets API configuration and network connection.';
}

export async function appendCapture(
  input: unknown
): Promise<{ sheetName: CaptureSheetName }> {
  const row = buildCaptureSheetRow(input);
  const spreadsheetId = process.env.SHEET_ID?.trim();
  const configuredCredentialPath = process.env.CREDENTIAL_PATH?.trim();

  if (!spreadsheetId || !configuredCredentialPath) {
    throw new SheetsServiceError(
      'Google Sheets is not configured. Set SHEET_ID and CREDENTIAL_PATH for the API service.',
      503
    );
  }

  const credentialPath = path.resolve(process.cwd(), configuredCredentialPath);

  try {
    const sheets = getSheetsClient(credentialPath);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: row.range,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row.values] },
    });
  } catch (error) {
    const statusCode = googleStatusCode(error);
    console.error(
      `[jellyfin-capture] Google Sheets append failed${
        statusCode === null ? '' : ` (HTTP ${statusCode})`
      }.`
    );
    throw new SheetsServiceError(googleErrorMessage(statusCode), 502);
  }

  return { sheetName: row.sheetName };
}
