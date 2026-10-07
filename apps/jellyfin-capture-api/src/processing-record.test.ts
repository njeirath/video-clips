import { describe, expect, it } from 'vitest';
import {
  findNextPendingClip,
  ProcessingValidationError,
  validateProcessingUpdate,
} from './processing-record';

const showsHeader = [
  'Show',
  'Season',
  'Episode',
  'Start',
  'End',
  'name',
  'description',
  'script',
  'characters',
  'tags',
  'source',
];

const moviesHeader = [
  'Title',
  'Start',
  'End',
  'name',
  'description',
  'script',
  'characters',
  'tags',
  'source',
];

describe('findNextPendingClip', () => {
  it('returns the first pending Shows row in sheet order with a revision token', () => {
    const rows = [
      showsHeader,
      [
        'The Office',
        1,
        2,
        '00:07:30',
        '',
        'Cookie',
        '',
        'Michael: Want a cookie?',
        'Michael Scott',
        'awkward, office',
        '/mnt/nfs/Shows/The Office - US/S01/S01E02.mkv',
      ],
      [
        'The Office',
        1,
        3,
        '00:10:00',
        '00:10:03.125',
        '',
        '',
        '',
        '',
        '',
        '/mnt/nfs/Shows/The Office - US/S01/S01E03.mkv',
      ],
      ['The Office', 1, 4, '00:12:00', '', '', '', '', '', '', ''],
    ];

    expect(findNextPendingClip(rows, 'Shows')).toEqual({
      tab: 'Shows',
      rowNumber: 2,
      revision: expect.stringMatching(/^[a-f\d]{64}$/),
      show: 'The Office',
      title: null,
      season: 1,
      episode: 2,
      start: '00:07:30.000',
      name: 'Cookie',
      description: '',
      script: 'Michael: Want a cookie?',
      characters: 'Michael Scott',
      tags: 'awkward, office',
      source: '/mnt/nfs/Shows/The Office - US/S01/S01E02.mkv',
    });
  });

  it('returns pending rows without a source so the UI can show a warning', () => {
    const clip = findNextPendingClip(
      [
        showsHeader,
        ['The Office', 1, 2, '00:07:30', '', '', '', '', '', '', ''],
      ],
      'Shows'
    );

    expect(clip?.rowNumber).toBe(2);
    expect(clip?.source).toBeNull();
  });

  it('formats numeric Sheets time values and reads Movies columns', () => {
    const clip = findNextPendingClip(
      [
        moviesHeader,
        [
          'Arrival',
          0.5,
          '',
          'Arrival',
          'Description',
          'Script',
          'Amy, Ian',
          'sci-fi',
          '/mnt/nfs/Movies/Arrival.mkv',
        ],
      ],
      'Movies'
    );

    expect(clip).toMatchObject({
      tab: 'Movies',
      rowNumber: 2,
      title: 'Arrival',
      show: null,
      start: '12:00:00.000',
      name: 'Arrival',
      description: 'Description',
      script: 'Script',
      characters: 'Amy, Ian',
      tags: 'sci-fi',
      source: '/mnt/nfs/Movies/Arrival.mkv',
    });
  });

  it('returns null if every record has an End or there are no records', () => {
    expect(findNextPendingClip([showsHeader], 'Shows')).toBeNull();
    expect(
      findNextPendingClip(
        [showsHeader, ['The Office', 1, 2, '00:07:30', '00:07:33']],
        'Shows'
      )
    ).toBeNull();
  });
});

describe('validateProcessingUpdate', () => {
  it('normalizes timestamp strings and trims metadata', () => {
    expect(
      validateProcessingUpdate('Shows', 2, {
        revision: 'a'.repeat(64),
        start: '00:07:31.04',
        end: '00:07:33',
        name: ' Cookie ',
        description: '',
        script: 'Michael: Cookie?',
        characters: 'Michael Scott',
        tags: 'awkward, office',
      })
    ).toEqual({
      tab: 'Shows',
      rowNumber: 2,
      revision: 'a'.repeat(64),
      start: '00:07:31.040',
      end: '00:07:33.000',
      name: 'Cookie',
      description: '',
      script: 'Michael: Cookie?',
      characters: 'Michael Scott',
      tags: 'awkward, office',
    });
  });

  it('rejects invalid rows, malformed times, and end times not after start', () => {
    expect(() => validateProcessingUpdate('Shows', 1, {})).toThrow(
      ProcessingValidationError
    );
    expect(() =>
      validateProcessingUpdate('Shows', 2, {
        revision: 'a'.repeat(64),
        start: 'not a time',
        end: '00:07:33',
      })
    ).toThrow(/Start time/);
    expect(() =>
      validateProcessingUpdate('Shows', 2, {
        revision: 'a'.repeat(64),
        start: '00:07:33',
        end: '00:07:33',
      })
    ).toThrow(/End must be later/);
  });
});
