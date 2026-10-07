import { describe, expect, it } from 'vitest';
import { buildCaptureSheetRow, CaptureValidationError } from './capture-record';

describe('buildCaptureSheetRow', () => {
  it('maps episodes to all 11 Shows columns and leaves unused cells blank', () => {
    const row = buildCaptureSheetRow({
      itemType: 'Episode',
      title: 'Home',
      seriesName: 'The Expanse',
      seasonNumber: 2,
      episodeNumber: 3,
      positionSeconds: 2535,
      path: '/media/The Expanse/S02E03.mkv',
    });

    expect(row).toEqual({
      sheetName: 'Shows',
      range: "'Shows'!A:K",
      values: [
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
    });
    expect(row.values).toHaveLength(11);
  });

  it('maps movies to all 9 Movies columns and keeps a missing path blank', () => {
    const row = buildCaptureSheetRow({
      itemType: 'Movie',
      title: 'Arrival',
      positionSeconds: 3601,
      path: null,
    });

    expect(row).toEqual({
      sheetName: 'Movies',
      range: "'Movies'!A:I",
      values: ['Arrival', '01:00:01', '', '', '', '', '', '', ''],
    });
    expect(row.values).toHaveLength(9);
  });

  it('does not wrap positions at 24 hours', () => {
    const row = buildCaptureSheetRow({
      itemType: 'Movie',
      title: 'Long Runtime',
      positionSeconds: 90_061,
    });

    expect(row.values[1]).toBe('25:01:01');
  });

  it('rejects unsupported media and incomplete episode metadata', () => {
    expect(() =>
      buildCaptureSheetRow({
        itemType: 'Series',
        title: 'The Expanse',
        positionSeconds: 0,
      })
    ).toThrow(CaptureValidationError);

    expect(() =>
      buildCaptureSheetRow({
        itemType: 'Episode',
        title: 'Home',
        seriesName: 'The Expanse',
        seasonNumber: null,
        episodeNumber: 3,
        positionSeconds: 0,
      })
    ).toThrow(/seasonNumber/);
  });
});
