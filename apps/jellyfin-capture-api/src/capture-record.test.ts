import { describe, expect, it } from 'vitest';
import {
  buildCaptureLookup,
  buildCaptureSheetRow,
  CaptureValidationError,
  matchCaptureHistoryRows,
} from './capture-record';

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

describe('capture history matching', () => {
  it('matches TV history by series, season, and episode', () => {
    const lookup = buildCaptureLookup({
      itemType: 'Episode',
      seriesName: 'the expanse',
      seasonNumber: 2,
      episodeNumber: 3,
    });
    const rows = [
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
      ['The Expanse', 2, 4, '00:50:00'],
      ['Other Show', 2, 3, '00:42:15'],
      ['The Expanse', '2', '3', 0.5],
    ];

    expect(lookup.sheetName).toBe('Shows');
    expect(matchCaptureHistoryRows(rows, lookup)).toEqual([
      {
        rowNumber: 2,
        positionSeconds: 2535,
        path: '/media/The Expanse/S02E03.mkv',
      },
      { rowNumber: 5, positionSeconds: 43_200, path: null },
    ]);
  });

  it('matches movie history by title and skips rows without a readable position', () => {
    const lookup = buildCaptureLookup({ itemType: 'Movie', title: 'arrival' });
    const rows = [
      ['Title', 'Start'],
      ['Arrival', '00:01:29', '', '', '', '', '', '', '/media/Arrival.mkv'],
      ['Arrival: The Final Cut', '00:01:29'],
      ['Arrival', 'not-a-time'],
    ];

    expect(lookup.sheetName).toBe('Movies');
    expect(matchCaptureHistoryRows(rows, lookup)).toEqual([
      {
        rowNumber: 2,
        positionSeconds: 89,
        path: '/media/Arrival.mkv',
      },
    ]);
  });

  it('reads existing MM:SS start values as minutes and seconds', () => {
    const lookup = buildCaptureLookup({
      itemType: 'Episode',
      seriesName: 'South Park',
      seasonNumber: 4,
      episodeNumber: 9,
    });

    expect(
      matchCaptureHistoryRows(
        [
          ['South Park', 4, 9, '18:20'],
          ['South Park', 4, 9, '19:05'],
        ],
        lookup
      )
    ).toEqual([
      { rowNumber: 1, positionSeconds: 1100, path: null },
      { rowNumber: 2, positionSeconds: 1145, path: null },
    ]);
  });

  it('rejects unsupported history lookups and incomplete TV identities', () => {
    expect(() => buildCaptureLookup({ itemType: 'Series' })).toThrow(
      CaptureValidationError
    );
    expect(() =>
      buildCaptureLookup({
        itemType: 'Episode',
        seriesName: 'The Expanse',
        seasonNumber: 2,
        episodeNumber: null,
      })
    ).toThrow(/episodeNumber/);
  });
});
