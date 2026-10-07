export function formatTimecode(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) {
    return '--:--:--.---';
  }

  const totalMilliseconds = Math.max(0, Math.round(seconds * 1000));
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const wholeSeconds = totalSeconds % 60;
  const milliseconds = totalMilliseconds % 1000;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0'
  )}:${String(wholeSeconds).padStart(2, '0')}.${String(milliseconds).padStart(
    3,
    '0'
  )}`;
}

export function parseTimecode(value: string): number | null {
  const match = /^(\d+):([0-5]\d):([0-5]\d)(?:\.(\d{1,3}))?$/.exec(
    value.trim()
  );
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const milliseconds = Number((match[4] ?? '').padEnd(3, '0') || '0');
  const total = hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;

  return Number.isFinite(total) ? total : null;
}

export function presentedFrameInterval(
  previousTime: number | null,
  currentTime: number,
  previousPresentedFrames: number | null,
  currentPresentedFrames: number | null
): number | null {
  if (previousTime === null) {
    return null;
  }

  const elapsed = currentTime - previousTime;
  const framesPresented =
    previousPresentedFrames !== null && currentPresentedFrames !== null
      ? currentPresentedFrames - previousPresentedFrames
      : 1;
  if (framesPresented <= 0) {
    return null;
  }

  const interval = elapsed / framesPresented;
  return interval >= 0.001 && interval <= 0.25 ? interval : null;
}

export function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((first, second) => first - second);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}
