import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  append: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
  googleAuth: vi.fn(),
  sheets: vi.fn(),
}));

vi.mock('googleapis', () => ({
  google: {
    auth: { GoogleAuth: mocks.googleAuth },
    sheets: mocks.sheets,
  },
}));

import {
  appendCapture,
  findCaptureHistory,
  findNextProcessingClip,
  updateProcessedClip,
} from './sheets';
import { processingRowRevision } from './processing-record';

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
    mocks.update.mockResolvedValue({ data: {} });
    mocks.sheets.mockReturnValue({
      spreadsheets: {
        values: {
          append: mocks.append,
          get: mocks.get,
          update: mocks.update,
        },
      },
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

  it('finds the first pending row in sheet order for the selected tab', async () => {
    mocks.get.mockResolvedValue({
      data: {
        values: [
          ['Show', 'Season', 'Episode', 'Start', 'End'],
          [
            'The Office',
            1,
            2,
            '00:07:30',
            '',
            '',
            '',
            '',
            '',
            '',
            '/mnt/nfs/Shows/The Office - US/S01/S01E02.mkv',
          ],
          ['The Office', 1, 3, '00:08:00', '00:08:10'],
        ],
      },
    });

    expect(await findNextProcessingClip('Shows')).toMatchObject({
      tab: 'Shows',
      rowNumber: 2,
      show: 'The Office',
      season: 1,
      episode: 2,
      start: '00:07:30.000',
      source: '/mnt/nfs/Shows/The Office - US/S01/S01E02.mkv',
      revision: expect.stringMatching(/^[a-f\d]{64}$/),
    });
    expect(mocks.get).toHaveBeenCalledWith(
      expect.objectContaining({ range: "'Shows'!A:K" })
    );
  });

  it('updates only the processing cells after checking the row revision', async () => {
    const row = [
      'The Office',
      1,
      2,
      '00:07:30',
      '',
      '',
      '',
      '',
      '',
      '',
      '/mnt/nfs/Shows/The Office - US/S01/S01E02.mkv',
    ];
    mocks.get.mockResolvedValue({ data: { values: [row] } });
    const revision = processingRowRevision(row, 'Shows');

    expect(
      await updateProcessedClip('Shows', 2, {
        revision,
        start: '00:07:31.042',
        end: '00:07:33.417',
        name: 'What You Want a Cookie',
        description: 'A short description',
        script: 'Michael: What you want a cookie?',
        characters: 'Michael Scott',
        tags: 'awkward, office',
      })
    ).toEqual({ tab: 'Shows', rowNumber: 2 });

    expect(mocks.update).toHaveBeenCalledWith({
      spreadsheetId: process.env.SHEET_ID,
      range: "'Shows'!D2:J2",
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          [
            '00:07:31.042',
            '00:07:33.417',
            'What You Want a Cookie',
            'A short description',
            'Michael: What you want a cookie?',
            'Michael Scott',
            'awkward, office',
          ],
        ],
      },
    });
  });

  it('updates the Movies timing and metadata columns without rewriting identity/source', async () => {
    const row = [
      'Arrival',
      '00:01:29',
      '',
      '',
      '',
      '',
      '',
      '',
      '/mnt/nfs/Movies/Arrival.mkv',
    ];
    mocks.get.mockResolvedValue({ data: { values: [row] } });

    await updateProcessedClip('Movies', 7, {
      revision: processingRowRevision(row, 'Movies'),
      start: '00:01:29.125',
      end: '00:01:31.500',
      name: 'Arrival',
      description: '',
      script: 'Louise: What is your name?',
      characters: 'Louise Banks, Ian Donnelly',
      tags: 'science fiction',
    });

    expect(mocks.update).toHaveBeenCalledWith({
      spreadsheetId: process.env.SHEET_ID,
      range: "'Movies'!B7:H7",
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          [
            '00:01:29.125',
            '00:01:31.500',
            'Arrival',
            '',
            'Louise: What is your name?',
            'Louise Banks, Ian Donnelly',
            'science fiction',
          ],
        ],
      },
    });
  });

  it('rejects a row that was processed or changed while it was open', async () => {
    const row = [
      'The Office',
      1,
      2,
      '00:07:30',
      '00:07:33',
      '',
      '',
      '',
      '',
      '',
      '/mnt/nfs/Shows/The Office - US/S01/S01E02.mkv',
    ];
    mocks.get.mockResolvedValue({ data: { values: [row] } });

    await expect(
      updateProcessedClip('Shows', 2, {
        revision: processingRowRevision(row, 'Shows'),
        start: '00:07:31.000',
        end: '00:07:34.000',
      })
    ).rejects.toThrow(/already been processed/);
    expect(mocks.update).not.toHaveBeenCalled();
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
      data: {
        values: [
          ['Title', 'Start'],
          ['Arrival', '00:01:29'],
        ],
      },
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
