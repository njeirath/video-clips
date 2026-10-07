import { useEffect, useRef, useState } from 'react';
import styles from './video-poc.module.css';
import {
  formatTimecode,
  median,
  parseTimecode,
  presentedFrameInterval,
} from './video-time';
import {
  readRememberedProcessingTab,
  rememberProcessingTab,
  type ProcessingTab,
} from './processing-tab';

interface PocVideo {
  id: string;
  label: string;
  fileName: string;
  extension: string;
  available: boolean;
}

type Boundary = 'start' | 'end';

function errorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === 'object' &&
    'message' in payload &&
    typeof payload.message === 'string'
  ) {
    return payload.message;
  }

  return fallback;
}

function medianIntervalLabel(seconds: number | null): string {
  return seconds === null
    ? 'Not measured yet'
    : `${(seconds * 1000).toFixed(3)} ms`;
}

export function VideoPoc() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const currentFrameTimeRef = useRef<number | null>(null);
  const durationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const loopEnabledRef = useRef(true);
  const pendingBoundaryRef = useRef<Boundary | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const lastPresentedFrameCountRef = useRef<number | null>(null);
  const frameSamplesRef = useRef<number[]>([]);

  const [processingTab, setProcessingTab] = useState<ProcessingTab>(
    readRememberedProcessingTab
  );
  const [videos, setVideos] = useState<PocVideo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [currentFrameTime, setCurrentFrameTime] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [startDraft, setStartDraft] = useState('');
  const [endDraft, setEndDraft] = useState('');
  const [loopEnabled, setLoopEnabled] = useState(true);
  const [frameApiAvailable, setFrameApiAvailable] = useState(false);
  const [observedFrameStep, setObservedFrameStep] = useState<number | null>(
    null
  );
  const [frameStepOverrideMs, setFrameStepOverrideMs] = useState('');
  const [timeInputError, setTimeInputError] = useState<string | null>(null);

  const selectedVideo = videos.find((video) => video.id === selectedVideoId);
  const hasValidRange =
    startTime !== null && endTime !== null && endTime > startTime;
  const manualFrameStepMs = Number(frameStepOverrideMs);
  const hasManualFrameStep =
    frameStepOverrideMs.trim() !== '' &&
    Number.isFinite(manualFrameStepMs) &&
    manualFrameStepMs > 0;
  const frameStepSeconds = hasManualFrameStep
    ? manualFrameStepMs / 1000
    : observedFrameStep ?? 1 / 25;

  useEffect(() => {
    let isCurrent = true;

    fetch('/api/poc/videos', {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            errorMessage(payload, 'Could not load the local test videos.')
          );
        }
        if (
          !payload ||
          typeof payload !== 'object' ||
          !('videos' in payload) ||
          !Array.isArray(payload.videos)
        ) {
          throw new Error(
            'The local video service returned an invalid response.'
          );
        }

        const safeVideos = payload.videos.filter(
          (item): item is PocVideo =>
            Boolean(item) &&
            typeof item === 'object' &&
            'id' in item &&
            typeof item.id === 'string' &&
            'label' in item &&
            typeof item.label === 'string' &&
            'fileName' in item &&
            typeof item.fileName === 'string' &&
            'extension' in item &&
            typeof item.extension === 'string' &&
            'available' in item &&
            typeof item.available === 'boolean'
        );

        return safeVideos;
      })
      .then((nextVideos) => {
        if (!isCurrent) {
          return;
        }
        setVideos(nextVideos);
        setSelectedVideoId(
          nextVideos.find((video) => video.available)?.id ?? ''
        );
      })
      .catch((requestError: unknown) => {
        if (isCurrent) {
          setListError(
            requestError instanceof Error
              ? requestError.message
              : 'Could not load the local test videos.'
          );
        }
      })
      .finally(() => {
        if (isCurrent) {
          setListLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    currentFrameTimeRef.current = null;
    durationRef.current = null;
    startTimeRef.current = null;
    endTimeRef.current = null;
    loopEnabledRef.current = loopEnabled;
    pendingBoundaryRef.current = null;
    lastFrameTimeRef.current = null;
    lastPresentedFrameCountRef.current = null;
    frameSamplesRef.current = [];

    setDuration(null);
    setCurrentFrameTime(null);
    setStartTime(null);
    setEndTime(null);
    setStartDraft('');
    setEndDraft('');
    setObservedFrameStep(null);
    setPlaybackError(null);
    setTimeInputError(null);
  }, [selectedVideoId]);

  function setBoundaryValue(boundary: Boundary, requestedTime: number) {
    const maxDuration = durationRef.current;
    const time = Math.max(
      0,
      maxDuration === null
        ? requestedTime
        : Math.min(maxDuration, requestedTime)
    );

    if (boundary === 'start') {
      startTimeRef.current = time;
      setStartTime(time);
      setStartDraft(formatTimecode(time));
    } else {
      endTimeRef.current = time;
      setEndTime(time);
      setEndDraft(formatTimecode(time));
    }
  }

  function recordPresentedFrame(
    time: number,
    video: HTMLVideoElement,
    presentedFrameCount?: number
  ) {
    if (!Number.isFinite(time)) {
      return;
    }

    currentFrameTimeRef.current = time;
    setCurrentFrameTime(time);

    const interval = presentedFrameInterval(
      lastFrameTimeRef.current,
      time,
      lastPresentedFrameCountRef.current,
      presentedFrameCount ?? null
    );
    if (interval !== null) {
      const samples = [...frameSamplesRef.current, interval].slice(-45);
      frameSamplesRef.current = samples;
      setObservedFrameStep(median(samples));
    }
    lastFrameTimeRef.current = time;
    lastPresentedFrameCountRef.current = presentedFrameCount ?? null;

    const pendingBoundary = pendingBoundaryRef.current;
    if (pendingBoundary && !video.seeking) {
      pendingBoundaryRef.current = null;
      setBoundaryValue(pendingBoundary, time);
    }

    const loopStart = startTimeRef.current;
    const loopEnd = endTimeRef.current;
    if (
      !video.paused &&
      loopEnabledRef.current &&
      loopStart !== null &&
      loopEnd !== null &&
      loopEnd > loopStart &&
      time >= loopEnd
    ) {
      lastFrameTimeRef.current = null;
      lastPresentedFrameCountRef.current = null;
      video.currentTime = loopStart;
    }
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedVideoId) {
      setFrameApiAvailable(false);
      return;
    }

    const handleSeeking = () => {
      lastFrameTimeRef.current = null;
      lastPresentedFrameCountRef.current = null;
    };
    const handleFallbackTime = () => {
      if (typeof video.requestVideoFrameCallback !== 'function') {
        recordPresentedFrame(video.currentTime, video);
      }
    };

    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('timeupdate', handleFallbackTime);
    video.addEventListener('seeked', handleFallbackTime);

    if (typeof video.requestVideoFrameCallback !== 'function') {
      setFrameApiAvailable(false);
      return () => {
        video.removeEventListener('seeking', handleSeeking);
        video.removeEventListener('timeupdate', handleFallbackTime);
        video.removeEventListener('seeked', handleFallbackTime);
      };
    }

    setFrameApiAvailable(true);
    let disposed = false;
    let callbackId = 0;
    const onVideoFrame: VideoFrameRequestCallback = (_now, metadata) => {
      if (disposed) {
        return;
      }
      recordPresentedFrame(metadata.mediaTime, video, metadata.presentedFrames);
      callbackId = video.requestVideoFrameCallback(onVideoFrame);
    };

    callbackId = video.requestVideoFrameCallback(onVideoFrame);

    return () => {
      disposed = true;
      video.cancelVideoFrameCallback(callbackId);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('timeupdate', handleFallbackTime);
      video.removeEventListener('seeked', handleFallbackTime);
    };
  }, [selectedVideoId]);

  function updateDuration(video: HTMLVideoElement) {
    const nextDuration = Number.isFinite(video.duration)
      ? video.duration
      : null;
    durationRef.current = nextDuration;
    setDuration(nextDuration);
    if (Number.isFinite(video.currentTime)) {
      currentFrameTimeRef.current = video.currentTime;
      setCurrentFrameTime(video.currentTime);
    }
  }

  function markAtCurrentFrame(boundary: Boundary) {
    const video = videoRef.current;
    const time = currentFrameTimeRef.current ?? video?.currentTime;
    if (time === undefined || time === null || !Number.isFinite(time)) {
      return;
    }

    pendingBoundaryRef.current = null;
    setTimeInputError(null);
    setBoundaryValue(boundary, time);
  }

  function seekToBoundary(boundary: Boundary, requestedTime: number) {
    const video = videoRef.current;
    const maxDuration = durationRef.current;
    const clampedTime = Math.max(
      0,
      maxDuration === null
        ? requestedTime
        : Math.min(maxDuration, requestedTime)
    );

    setTimeInputError(null);
    setBoundaryValue(boundary, clampedTime);
    if (!video) {
      return;
    }

    if (Math.abs(video.currentTime - clampedTime) < 0.0005) {
      pendingBoundaryRef.current = null;
      const presentedTime = currentFrameTimeRef.current;
      if (presentedTime !== null) {
        setBoundaryValue(boundary, presentedTime);
      }
      return;
    }

    pendingBoundaryRef.current = boundary;
    video.currentTime = clampedTime;
    if (typeof video.requestVideoFrameCallback !== 'function') {
      const finishSeek = () => {
        if (pendingBoundaryRef.current === boundary) {
          pendingBoundaryRef.current = null;
          setBoundaryValue(boundary, video.currentTime);
        }
      };
      video.addEventListener('seeked', finishSeek, { once: true });
    }
  }

  function adjustBoundary(boundary: Boundary, direction: -1 | 1) {
    const current =
      boundary === 'start' ? startTimeRef.current : endTimeRef.current;
    if (current === null) {
      return;
    }
    seekToBoundary(boundary, current + direction * frameStepSeconds);
  }

  function commitTimeInput(boundary: Boundary) {
    const draft = boundary === 'start' ? startDraft : endDraft;
    const parsed = parseTimecode(draft);
    if (parsed === null) {
      setTimeInputError('Enter a time as HH:MM:SS or HH:MM:SS.mmm.');
      return;
    }
    if (durationRef.current !== null && parsed > durationRef.current) {
      setTimeInputError('The time must be within the video duration.');
      return;
    }

    seekToBoundary(boundary, parsed);
  }

  function jumpToBoundary(boundary: Boundary) {
    const video = videoRef.current;
    const time =
      boundary === 'start' ? startTimeRef.current : endTimeRef.current;
    if (video && time !== null) {
      video.currentTime = time;
    }
  }

  async function playSelection() {
    const video = videoRef.current;
    const start = startTimeRef.current;
    const end = endTimeRef.current;
    if (!video || start === null || end === null || end <= start) {
      return;
    }

    setPlaybackError(null);
    video.currentTime = start;
    try {
      await video.play();
    } catch {
      setPlaybackError('Chrome could not start playback for this video.');
    }
  }

  function handleLoopChange(enabled: boolean) {
    loopEnabledRef.current = enabled;
    setLoopEnabled(enabled);
  }

  function updateDraft(boundary: Boundary, value: string) {
    if (boundary === 'start') {
      setStartDraft(value);
    } else {
      setEndDraft(value);
    }
    setTimeInputError(null);
  }

  const availableVideos = videos.filter((video) => video.available);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerTopLine}>
            <a className={styles.backLink} href="/">
              <span aria-hidden="true">←</span> Capture app
            </a>
            <div className={styles.queueSelector}>
              <label htmlFor="processing-tab">Process</label>
              <select
                id="processing-tab"
                aria-label="Processing tab"
                value={processingTab}
                onChange={(event) => {
                  const nextTab = event.target.value as ProcessingTab;
                  setProcessingTab(nextTab);
                  rememberProcessingTab(nextTab);
                }}
              >
                <option value="Shows">Shows</option>
                <option value="Movies">Movies</option>
              </select>
              <span>Remembered locally · Sheet queue not connected yet</span>
            </div>
          </div>
          <p className={styles.eyebrow}>Proof of concept · Chrome playback</p>
          <h1>Clip timing workbench</h1>
          <p className={styles.intro}>
            Set in and out points on the frame shown by the browser, then
            compare the decimal timestamps with FFmpeg.
          </p>
        </header>

        {listError && (
          <div className={styles.errorBanner} role="alert">
            <strong>Local video service unavailable.</strong>
            <span>{listError}</span>
            <span>
              Start the app with <code>npm run start:video-poc</code>.
            </span>
          </div>
        )}

        <section
          className={styles.sourcePanel}
          aria-labelledby="source-heading"
        >
          <div>
            <p className={styles.eyebrow}>Test source</p>
            <h2 id="source-heading">Original local file</h2>
          </div>
          <label className={styles.selectLabel} htmlFor="video-source">
            Video file
            <select
              id="video-source"
              value={selectedVideoId}
              onChange={(event) => setSelectedVideoId(event.target.value)}
              disabled={listLoading || availableVideos.length === 0}
            >
              {videos.length === 0 && (
                <option value="">No files configured</option>
              )}
              {videos.map((video) => (
                <option
                  key={video.id}
                  value={video.id}
                  disabled={!video.available}
                >
                  {video.label}
                  {!video.available ? ' — file not found' : ''}
                </option>
              ))}
            </select>
          </label>
          {selectedVideo && (
            <p className={styles.fileNote}>
              {selectedVideo.fileName} ·{' '}
              {selectedVideo.extension || 'unknown format'}
            </p>
          )}
          {listLoading && (
            <p className={styles.subtleNote}>Loading test files…</p>
          )}
          {!listLoading && !listError && videos.length === 0 && (
            <p className={styles.warningNote}>
              No MP4 or MKV files were found. Put test videos in the root
              <code> testData/ </code> folder, then reload this page.
            </p>
          )}
          {!listLoading &&
            !listError &&
            videos.length > 0 &&
            availableVideos.length === 0 && (
              <p className={styles.warningNote}>
                The configured file was not found. Check that the test video
                exists in <code>testData/</code>.
              </p>
            )}
        </section>

        <section className={styles.playerPanel} aria-label="Video player">
          {selectedVideo?.available ? (
            <video
              key={selectedVideo.id}
              ref={videoRef}
              className={styles.video}
              src={`/api/poc/videos/${encodeURIComponent(selectedVideo.id)}`}
              controls
              playsInline
              preload="metadata"
              onLoadedMetadata={(event) => updateDuration(event.currentTarget)}
              onSeeking={() => {
                lastFrameTimeRef.current = null;
                lastPresentedFrameCountRef.current = null;
              }}
              onSeeked={(event) => {
                if (!frameApiAvailable) {
                  recordPresentedFrame(
                    event.currentTarget.currentTime,
                    event.currentTarget
                  );
                }
              }}
              onTimeUpdate={(event) => {
                if (!frameApiAvailable) {
                  recordPresentedFrame(
                    event.currentTarget.currentTime,
                    event.currentTarget
                  );
                }
              }}
              onError={() => {
                setPlaybackError(
                  'Chrome could not play this file. Check browser support for its container and video codec.'
                );
              }}
            />
          ) : (
            <div className={styles.playerPlaceholder}>
              <span aria-hidden="true">▶</span>
              <p>Select an available test video to begin.</p>
            </div>
          )}
          {playbackError && (
            <p className={styles.playbackError} role="alert">
              {playbackError}
            </p>
          )}
        </section>

        <section className={styles.playbackStatus} aria-label="Playback timing">
          <div>
            <span className={styles.statusLabel}>Displayed frame time</span>
            <output className={styles.currentTime} aria-live="polite">
              {formatTimecode(currentFrameTime)}
            </output>
          </div>
          <div className={styles.statusDetails}>
            <span>
              Duration <strong>{formatTimecode(duration)}</strong>
            </span>
            <span>
              Frame callback{' '}
              <strong>
                {frameApiAvailable ? 'available' : 'fallback clock'}
              </strong>
            </span>
            <span>
              Observed frame interval{' '}
              <strong>{medianIntervalLabel(observedFrameStep)}</strong>
            </span>
          </div>
        </section>

        <section
          className={styles.frameSettings}
          aria-label="Frame step settings"
        >
          <label htmlFor="frame-step-ms">
            Frame-step interval override (ms)
          </label>
          <input
            id="frame-step-ms"
            type="number"
            min="0.1"
            step="0.001"
            inputMode="decimal"
            placeholder="Auto from playback"
            value={frameStepOverrideMs}
            onChange={(event) => setFrameStepOverrideMs(event.target.value)}
          />
          <p>
            {hasManualFrameStep
              ? `Using ${manualFrameStepMs.toFixed(3)} ms per step.`
              : observedFrameStep !== null
              ? 'Using the median interval measured from frames presented during playback.'
              : 'Play briefly to measure the frame interval; before that, stepping uses a 40 ms fallback.'}
          </p>
        </section>

        <section
          className={styles.markerSection}
          aria-labelledby="markers-heading"
        >
          <div className={styles.markerHeading}>
            <div>
              <p className={styles.eyebrow}>Edit points</p>
              <h2 id="markers-heading">Start and end</h2>
            </div>
            <label className={styles.loopToggle}>
              <input
                type="checkbox"
                checked={loopEnabled}
                disabled={!hasValidRange}
                onChange={(event) => handleLoopChange(event.target.checked)}
              />
              Loop selection
            </label>
          </div>

          <div className={styles.markerGrid}>
            {(['start', 'end'] as const).map((boundary) => {
              const value = boundary === 'start' ? startTime : endTime;
              const draft = boundary === 'start' ? startDraft : endDraft;
              const isStart = boundary === 'start';
              const label = isStart ? 'Start' : 'End';

              return (
                <article className={styles.markerCard} key={boundary}>
                  <div className={styles.markerCardHeading}>
                    <div>
                      <span className={styles.markerKicker}>
                        {isStart ? 'In point' : 'Out point'}
                      </span>
                      <h3>{label}</h3>
                    </div>
                    <output className={styles.markerTime}>
                      {formatTimecode(value)}
                    </output>
                  </div>

                  <label
                    className={styles.timeInputLabel}
                    htmlFor={`${boundary}-timecode`}
                  >
                    Spreadsheet timecode
                  </label>
                  <input
                    id={`${boundary}-timecode`}
                    className={styles.timeInput}
                    type="text"
                    inputMode="decimal"
                    placeholder="HH:MM:SS.mmm"
                    value={draft}
                    onChange={(event) =>
                      updateDraft(boundary, event.target.value)
                    }
                    onBlur={() => {
                      if (draft.trim()) {
                        commitTimeInput(boundary);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.currentTarget.blur();
                      }
                    }}
                    aria-label={`${label} timecode`}
                  />

                  <button
                    className={styles.setCurrentButton}
                    type="button"
                    disabled={currentFrameTime === null}
                    onClick={() => markAtCurrentFrame(boundary)}
                  >
                    Set {label.toLowerCase()} to displayed frame
                  </button>

                  <div className={styles.stepButtons}>
                    <button
                      type="button"
                      disabled={value === null}
                      onClick={() => adjustBoundary(boundary, -1)}
                      aria-label={`Move ${label.toLowerCase()} back one frame`}
                    >
                      −1 frame
                    </button>
                    <button
                      type="button"
                      disabled={value === null}
                      onClick={() => adjustBoundary(boundary, 1)}
                      aria-label={`Move ${label.toLowerCase()} forward one frame`}
                    >
                      +1 frame
                    </button>
                  </div>

                  <button
                    className={styles.jumpButton}
                    type="button"
                    disabled={value === null}
                    onClick={() => jumpToBoundary(boundary)}
                  >
                    Jump to {label.toLowerCase()}
                  </button>
                </article>
              );
            })}
          </div>

          {timeInputError && (
            <p className={styles.validationError} role="alert">
              {timeInputError}
            </p>
          )}
          {startTime !== null && endTime !== null && endTime <= startTime && (
            <p className={styles.validationError} role="alert">
              End must be later than Start before the selection can loop.
            </p>
          )}

          <button
            className={styles.playSelectionButton}
            type="button"
            disabled={!hasValidRange || !selectedVideo?.available}
            onClick={playSelection}
          >
            <span aria-hidden="true">▶</span> Play selection from Start
          </button>
        </section>

        <section
          className={styles.outputPanel}
          aria-labelledby="output-heading"
        >
          <div>
            <p className={styles.eyebrow}>Spreadsheet preview</p>
            <h2 id="output-heading">Times to record</h2>
          </div>
          <div className={styles.outputGrid}>
            <div>
              <span>Start</span>
              <output>{formatTimecode(startTime)}</output>
            </div>
            <div>
              <span>End</span>
              <output>{formatTimecode(endTime)}</output>
            </div>
          </div>
          <p>
            Values use <code>HH:MM:SS.mmm</code> and are displayed only; this
            proof of concept does not access Google Sheets.
          </p>
        </section>

        <footer className={styles.footer}>
          Local proof of concept · Original test file streamed from this Mac
        </footer>
      </div>
    </main>
  );
}

export default VideoPoc;
