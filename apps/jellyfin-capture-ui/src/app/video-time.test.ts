import { describe, expect, it } from 'vitest';
import {
  formatTimecode,
  median,
  parseTimecode,
  presentedFrameInterval,
} from './video-time';

describe('video timecode helpers', () => {
  it('formats decimal spreadsheet timecodes without wrapping hours', () => {
    expect(formatTimecode(0)).toBe('00:00:00.000');
    expect(formatTimecode(450.25)).toBe('00:07:30.250');
    expect(formatTimecode(90_061.007)).toBe('25:01:01.007');
    expect(formatTimecode(null)).toBe('--:--:--.---');
  });

  it('parses whole-second and millisecond timecodes', () => {
    expect(parseTimecode('00:07:30')).toBe(450);
    expect(parseTimecode('00:07:30.25')).toBe(450.25);
    expect(parseTimecode('01:02:03.007')).toBe(3723.007);
    expect(parseTimecode('not a timecode')).toBeNull();
    expect(parseTimecode('00:61:00')).toBeNull();
  });

  it('normalizes skipped callbacks by the number of presented frames', () => {
    expect(presentedFrameInterval(null, 1, null, 1)).toBeNull();
    expect(presentedFrameInterval(10, 10.125, 10, 13)).toBeCloseTo(1 / 24, 5);
    expect(presentedFrameInterval(10, 10.04, null, null)).toBeCloseTo(0.04, 5);
    expect(presentedFrameInterval(10, 10, 10, 10)).toBeNull();
  });

  it('calculates the median observed frame interval', () => {
    expect(median([])).toBeNull();
    expect(median([0.041, 0.042, 0.04])).toBe(0.041);
    expect(median([0.04, 0.042])).toBe(0.041);
  });
});
