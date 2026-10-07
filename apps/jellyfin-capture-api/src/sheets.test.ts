import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  append: vi.fn(),
  googleAuth: vi.fn(),
  sheets: vi.fn(),
}));

vi.mock('googleapis', () => ({
  google: {
    auth: { GoogleAuth: mocks.googleAuth },
    sheets: mocks.sheets,
  },
}));

import { appendCapture } from './sheets';

const originalSheetId = process.env.SHEET_ID;
const originalCredentialPath = process.env.CREDENTIAL_PATH;

describe('appendCapture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SHEET_ID = 'test-spreadsheet-id';
    process.env.CREDENTIAL_PATH = 'service-account.json';
    mocks.googleAuth.mockReturnValue({});
    mocks.append.mockResolvedValue({ data: {} });
    mocks.sheets.mockReturnValue({
      spreadsheets: { values: { append: mocks.append } },
    });
  });

  afterEach(() => {
    if (originalSheetId === undefined) {
      delete process.env.SHEET_ID;
    } else {
      process.env.SHEET_ID = originalSheetId;
    }

    if (originalCredentialPath === undefined) {
      delete process.env.CREDENTIAL_PATH;
    } else {
      process.env.CREDENTIAL_PATH = originalCredentialPath;
    }
  });

  it('uses the append endpoint with row insertion so existing rows are preserved', async () => {
    const result = await appendCapture({
      itemType: 'Episode',
      title: 'Home',
      seriesName: 'The Expanse',
      seasonNumber: 2,
      episodeNumber: 3,
      positionSeconds: 2535,
      path: '/media/The Expanse/S02E03.mkv',
    });

    expect(result).toEqual({ sheetName: 'Shows' });
    expect(mocks.append).toHaveBeenCalledWith({
      spreadsheetId: 'test-spreadsheet-id',
      range: "'Shows'!A:K",
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [
          [
            'The Expanse',
            2,
            3,
            '00:42:15',
            '',
            '',
            '',
            '',
            '',
            '',
            '/media/The Expanse/S02E03.mkv',
          ],
        ],
      },
    });
  });

  it('selects the Movies tab for movie records', async () => {
    const result = await appendCapture({
      itemType: 'Movie',
      title: 'Arrival',
      positionSeconds: 89,
    });

    expect(result).toEqual({ sheetName: 'Movies' });
    expect(mocks.append).toHaveBeenCalledWith(
      expect.objectContaining({
        range: "'Movies'!A:I",
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [['Arrival', '00:01:29', '', '', '', '', '', '', '']],
        },
      })
    );
  });
});
