import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  append: vi.fn(),
  get: vi.fn(),
  googleAuth: vi.fn(),
  sheets: vi.fn(),
}));

vi.mock('googleapis', () => ({
  google: {
    auth: { GoogleAuth: mocks.googleAuth },
    sheets: mocks.sheets,
  },
}));

import { appendCapture, findCaptureHistory } from './sheets';

const originalSheetId = process.env.SHEET_ID;
const originalCredentialPath = process.env.CREDENTIAL_PATH;
let testId = 0;

function episodeInput() {
  return {
    itemType: 'Episode',
    title: 'Home',
    seriesName: 'The Expanse',
    seasonNumber: 2,
    episodeNumber: 3,
    positionSeconds: 2535,
    path: '/media/The Expanse/S02E03.mkv',
  };
}

describe('Google Sheets service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SHEET_ID = `test-spreadsheet-id-${++testId}`;
    process.env.CREDENTIAL_PATH = 'service-account.json';
    mocks.googleAuth.mockReturnValue({});
    mocks.append.mockResolvedValue({ data: {} });
    mocks.get.mockResolvedValue({ data: { values: [] } });
    mocks.sheets.mockReturnValue({
      spreadsheets: { values: { append: mocks.append, get: mocks.get } },
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

  it('appends a TV record with row insertion so existing rows are preserved', async () => {
    const result = await appendCapture(episodeInput());

    expect(result).toEqual({ sheetName: 'Shows' });
    expect(mocks.append).toHaveBeenCalledWith({
      spreadsheetId: process.env.SHEET_ID,
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

  it('selects the Movies tab when appending a movie record', async () => {
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

  it('reads and filters only the matching Shows tab, then caches the result', async () => {
    mocks.get.mockResolvedValue({
      data: {
        values: [
          ['Show', 'Season', 'Episode', 'Start'],
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
          ['The Expanse', 2, 4, '00:42:15'],
        ],
      },
    });

    const first = await findCaptureHistory(episodeInput());
    const second = await findCaptureHistory(episodeInput());

    expect(first).toEqual({
      sheetName: 'Shows',
      entries: [
        {
          rowNumber: 2,
          positionSeconds: 2535,
          path: '/media/The Expanse/S02E03.mkv',
        },
      ],
    });
    expect(second).toEqual(first);
    expect(mocks.get).toHaveBeenCalledTimes(1);
    expect(mocks.get).toHaveBeenCalledWith({
      spreadsheetId: process.env.SHEET_ID,
      range: "'Shows'!A:K",
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'SERIAL_NUMBER',
    });
  });

  it('reads movie history and invalidates that tab cache after an append', async () => {
    mocks.get.mockResolvedValue({
      data: { values: [['Title', 'Start'], ['Arrival', '00:01:29']] },
    });
    const movie = {
      itemType: 'Movie',
      title: 'Arrival',
      positionSeconds: 89,
    };

    expect(await findCaptureHistory(movie)).toEqual({
      sheetName: 'Movies',
      entries: [{ rowNumber: 2, positionSeconds: 89, path: null }],
    });
    await appendCapture(movie);
    await findCaptureHistory(movie);

    expect(mocks.get).toHaveBeenCalledTimes(2);
    expect(mocks.get).toHaveBeenLastCalledWith({
      spreadsheetId: process.env.SHEET_ID,
      range: "'Movies'!A:I",
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'SERIAL_NUMBER',
    });
  });
});
