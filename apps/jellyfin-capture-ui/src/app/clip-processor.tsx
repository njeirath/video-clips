import { useEffect, useRef, useState } from 'react';
import styles from './clip-processor.module.css';
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

interface ProcessingClip {
  tab: ProcessingTab;
  rowNumber: number;
  revision: string;
  show: string | null;
  title: string | null;
  season: number | null;
  episode: number | null;
  start: string | null;
  name: string;
  description: string;
  script: string;
  characters: string;
  tags: string;
  source: string | null;
  mediaUrl: string | null;
  mediaError: string | null;
}

interface MetadataForm {
  name: string;
  description: string;
  script: string;
  characters: string;
  tags: string;
}

type Boundary = 'start' | 'end';
type StepUnit = 'frame' | 'half-second' | 'second';

const stepAdjustments = [
  {
    label: '-1s',
    direction: -1,
    unit: 'second',
    description: 'one second',
  },
  {
    label: '-0.5s',
    direction: -1,
    unit: 'half-second',
    description: 'half a second',
  },
  { label: '-1f', direction: -1, unit: 'frame', description: 'one frame' },
  { label: '+1f', direction: 1, unit: 'frame', description: 'one frame' },
  {
    label: '+0.5s',
    direction: 1,
    unit: 'half-second',
    description: 'half a second',
  },
  {
    label: '+1s',
    direction: 1,
    unit: 'second',
    description: 'one second',
  },
] as const;

const emptyForm: MetadataForm = {
  name: '',
  description: '',
  script: '',
  characters: '',
  tags: '',
};

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

function isProcessingClip(value: unknown): value is ProcessingClip {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const clip = value as Record<string, unknown>;
  return (
    (clip.tab === 'Shows' || clip.tab === 'Movies') &&
    typeof clip.rowNumber === 'number' &&
    Number.isSafeInteger(clip.rowNumber) &&
    typeof clip.revision === 'string' &&
    (typeof clip.show === 'string' || clip.show === null) &&
    (typeof clip.title === 'string' || clip.title === null) &&
    (typeof clip.season === 'number' || clip.season === null) &&
    (typeof clip.episode === 'number' || clip.episode === null) &&
    (typeof clip.start === 'string' || clip.start === null) &&
    typeof clip.name === 'string' &&
    typeof clip.description === 'string' &&
    typeof clip.script === 'string' &&
    typeof clip.characters === 'string' &&
    typeof clip.tags === 'string' &&
    (typeof clip.source === 'string' || clip.source === null) &&
    (typeof clip.mediaUrl === 'string' || clip.mediaUrl === null) &&
    (typeof clip.mediaError === 'string' || clip.mediaError === null)
  );
}

function clipHeading(clip: ProcessingClip): string {
  if (clip.tab === 'Movies') {
    return clip.title || 'Untitled movie row';
  }

  const episode =
    clip.season !== null && clip.episode !== null
      ? `S${String(clip.season).padStart(2, '0')} · E${String(
          clip.episode
        ).padStart(2, '0')}`
      : 'Episode details incomplete';
  return `${clip.show || 'Untitled show'} · ${episode}`;
}

function BoundaryCard(props: {
  boundary: Boundary;
  value: number | null;
  draft: string;
  currentFrameAvailable: boolean;
  disabled: boolean;
  onDraftChange: (value: string) => void;
  onCommit: () => void;
  onMarkCurrent: () => void;
  onStep: (direction: -1 | 1, unit: StepUnit) => void;
  onJump: () => void;
}) {
  const { boundary, value, draft, currentFrameAvailable, disabled } = props;
  const label = boundary === 'start' ? 'Start' : 'End';
  const lowerLabel = label.toLowerCase();

  return (
    <article className={styles.boundaryCard}>
      <div className={styles.boundaryHeading}>
        <div>
          <span>{boundary === 'start' ? 'In point' : 'Out point'}</span>
          <h3>{label}</h3>
        </div>
        <output>{formatTimecode(value)}</output>
      </div>
      <label className={styles.fieldLabel} htmlFor={`${boundary}-timecode`}>
        Spreadsheet timecode
      </label>
      <input
        className={styles.timeInput}
        id={`${boundary}-timecode`}
        type="text"
        inputMode="decimal"
        placeholder="HH:MM:SS.mmm"
        value={draft}
        disabled={disabled}
        onChange={(event) => props.onDraftChange(event.target.value)}
        onBlur={() => {
          if (draft.trim()) {
            props.onCommit();
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
        className={styles.secondaryButton}
        type="button"
        disabled={!currentFrameAvailable || disabled}
        onClick={props.onMarkCurrent}
      >
        Set {lowerLabel} to displayed frame
      </button>
      <div className={styles.stepButtons}>
        {stepAdjustments.map((step) => (
          <button
            key={step.label}
            type="button"
            disabled={value === null || disabled}
            aria-label={`Move ${lowerLabel} ${
              step.direction < 0 ? 'back' : 'forward'
            } ${step.description}`}
            onClick={() => props.onStep(step.direction, step.unit)}
          >
            {step.label}
          </button>
        ))}
      </div>
      <button
        className={styles.textButton}
        type="button"
        disabled={value === null || disabled}
        onClick={props.onJump}
      >
        Jump to {lowerLabel}
      </button>
    </article>
  );
}

export function ClipProcessor() {
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
  const loadGenerationRef = useRef(0);

  const [tab, setTab] = useState<ProcessingTab>(readRememberedProcessingTab);
  const [clip, setClip] = useState<ProcessingClip | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadGeneration, setLoadGeneration] = useState(0);
  const [form, setForm] = useState<MetadataForm>(emptyForm);
  const [duration, setDuration] = useState<number | null>(null);
  const [currentFrameTime, setCurrentFrameTime] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [startDraft, setStartDraft] = useState('');
  const [endDraft, setEndDraft] = useState('');
  const [loopEnabled, setLoopEnabled] = useState(true);
  const [seekingBoundary, setSeekingBoundary] = useState<Boundary | null>(null);
  const [frameApiAvailable, setFrameApiAvailable] = useState(false);
  const [observedFrameStep, setObservedFrameStep] = useState<number | null>(
    null
  );
  const [frameStepOverrideMs, setFrameStepOverrideMs] = useState('');
  const [timeError, setTimeError] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const isValidRange =
    startTime !== null && endTime !== null && endTime > startTime;
  const manualFrameStepMs = Number(frameStepOverrideMs);
  const hasManualFrameStep =
    frameStepOverrideMs.trim() !== '' &&
    Number.isFinite(manualFrameStepMs) &&
    manualFrameStepMs > 0;
  const frameStepSeconds = hasManualFrameStep
    ? manualFrameStepMs / 1000
    : observedFrameStep ?? 1 / 25;

  async function loadNextClip(selectedTab: ProcessingTab) {
    const generation = ++loadGenerationRef.current;
    setLoading(true);
    setLoadError(null);
    setSaveError(null);
    setSaved(false);
    setClip(null);

    try {
      const response = await fetch(
        `/api/processing/next?tab=${encodeURIComponent(selectedTab)}`,
        { cache: 'no-store', headers: { Accept: 'application/json' } }
      );
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          errorMessage(payload, 'Could not load the next pending clip.')
        );
      }
      if (!payload || typeof payload !== 'object' || !('clip' in payload)) {
        throw new Error('The processing API returned an invalid response.');
      }
      const next = payload.clip;
      if (next !== null && !isProcessingClip(next)) {
        throw new Error('The processing API returned an invalid clip row.');
      }
      if (generation === loadGenerationRef.current) {
        setClip(next);
      }
    } catch (error) {
      if (generation === loadGenerationRef.current) {
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Could not load the next pending clip.'
        );
      }
    } finally {
      if (generation === loadGenerationRef.current) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadNextClip(tab);
    return () => {
      loadGenerationRef.current += 1;
    };
  }, [tab, loadGeneration]);

  useEffect(() => {
    currentFrameTimeRef.current = null;
    durationRef.current = null;
    startTimeRef.current = clip?.start ? parseTimecode(clip.start) : null;
    endTimeRef.current = null;
    loopEnabledRef.current = loopEnabled;
    pendingBoundaryRef.current = null;
    setSeekingBoundary(null);
    lastFrameTimeRef.current = null;
    lastPresentedFrameCountRef.current = null;
    frameSamplesRef.current = [];

    setDuration(null);
    setCurrentFrameTime(null);
    setStartTime(startTimeRef.current);
    setEndTime(null);
    setStartDraft(
      startTimeRef.current === null ? '' : formatTimecode(startTimeRef.current)
    );
    setEndDraft('');
    setObservedFrameStep(null);
    setPlaybackError(null);
    setTimeError(null);
    setForm(
      clip
        ? {
            name: clip.name,
            description: clip.description,
            script: clip.script,
            characters: clip.characters,
            tags: clip.tags,
          }
        : emptyForm
    );
  }, [clip?.tab, clip?.rowNumber, clip?.revision]);

  function setBoundaryValue(boundary: Boundary, requestedTime: number) {
    setSaved(false);
    setSaveError(null);
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

    const pending = pendingBoundaryRef.current;
    if (pending && !video.seeking) {
      pendingBoundaryRef.current = null;
      setSeekingBoundary(null);
      setBoundaryValue(pending, time);
    }

    const start = startTimeRef.current;
    const end = endTimeRef.current;
    if (
      !video.paused &&
      loopEnabledRef.current &&
      start !== null &&
      end !== null &&
      end > start &&
      time >= end
    ) {
      lastFrameTimeRef.current = null;
      lastPresentedFrameCountRef.current = null;
      video.currentTime = start;
    }
  }

  const mediaKey = clip ? `${clip.tab}-${clip.rowNumber}-${clip.revision}` : '';
  const mediaUrl = clip?.mediaUrl ?? null;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !mediaUrl) {
      setFrameApiAvailable(false);
      return;
    }

    const resetFrameSamples = () => {
      lastFrameTimeRef.current = null;
      lastPresentedFrameCountRef.current = null;
    };
    const fallbackTimeUpdate = () => {
      if (typeof video.requestVideoFrameCallback !== 'function') {
        recordPresentedFrame(video.currentTime, video);
      }
    };

    video.addEventListener('seeking', resetFrameSamples);
    video.addEventListener('timeupdate', fallbackTimeUpdate);
    video.addEventListener('seeked', fallbackTimeUpdate);

    if (typeof video.requestVideoFrameCallback !== 'function') {
      setFrameApiAvailable(false);
      return () => {
        video.removeEventListener('seeking', resetFrameSamples);
        video.removeEventListener('timeupdate', fallbackTimeUpdate);
        video.removeEventListener('seeked', fallbackTimeUpdate);
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
      video.removeEventListener('seeking', resetFrameSamples);
      video.removeEventListener('timeupdate', fallbackTimeUpdate);
      video.removeEventListener('seeked', fallbackTimeUpdate);
    };
  }, [mediaKey, mediaUrl]);

  function onLoadedMetadata(video: HTMLVideoElement) {
    const nextDuration = Number.isFinite(video.duration)
      ? video.duration
      : null;
    durationRef.current = nextDuration;
    setDuration(nextDuration);
    if (Number.isFinite(video.currentTime)) {
      currentFrameTimeRef.current = video.currentTime;
      setCurrentFrameTime(video.currentTime);
    }
    const approximateStart = startTimeRef.current;
    if (approximateStart !== null) {
      const seekTime =
        nextDuration === null
          ? approximateStart
          : Math.min(approximateStart, nextDuration);
      if (seekTime !== approximateStart) {
        setBoundaryValue('start', seekTime);
      }
      video.currentTime = seekTime;
    }
  }

  function markAtCurrentFrame(boundary: Boundary) {
    const video = videoRef.current;
    const time = currentFrameTimeRef.current ?? video?.currentTime;
    if (time === null || time === undefined || !Number.isFinite(time)) {
      return;
    }
    pendingBoundaryRef.current = null;
    setSeekingBoundary(null);
    setTimeError(null);
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
    setTimeError(null);
    setBoundaryValue(boundary, clampedTime);
    if (!video) {
      return;
    }
    if (Math.abs(video.currentTime - clampedTime) < 0.0005) {
      pendingBoundaryRef.current = null;
      setSeekingBoundary(null);
      const displayedTime = currentFrameTimeRef.current;
      if (displayedTime !== null) {
        setBoundaryValue(boundary, displayedTime);
      }
      return;
    }

    pendingBoundaryRef.current = boundary;
    setSeekingBoundary(boundary);
    video.currentTime = clampedTime;
    if (typeof video.requestVideoFrameCallback !== 'function') {
      video.addEventListener(
        'seeked',
        () => {
          if (pendingBoundaryRef.current === boundary) {
            pendingBoundaryRef.current = null;
            setSeekingBoundary(null);
            setBoundaryValue(boundary, video.currentTime);
          }
        },
        { once: true }
      );
    }
  }

  function stepBoundary(
    boundary: Boundary,
    direction: -1 | 1,
    unit: StepUnit
  ) {
    const current =
      boundary === 'start' ? startTimeRef.current : endTimeRef.current;
    if (current !== null) {
      const stepSize =
        unit === 'frame'
          ? frameStepSeconds
          : unit === 'half-second'
          ? 0.5
          : 1;
      seekToBoundary(boundary, current + direction * stepSize);
    }
  }

  function commitTimeInput(boundary: Boundary, draft: string) {
    const parsed = parseTimecode(draft);
    if (parsed === null) {
      setTimeError('Enter a time as HH:MM:SS or HH:MM:SS.mmm.');
      return;
    }
    if (durationRef.current !== null && parsed > durationRef.current) {
      setTimeError('The time must be within the video duration.');
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

  function handleTabChange(nextTab: ProcessingTab) {
    setTab(nextTab);
    rememberProcessingTab(nextTab);
  }

  function updateForm(field: keyof MetadataForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setSaveError(null);
    setSaved(false);
  }

  function updateTimeDraft(boundary: Boundary, value: string) {
    if (boundary === 'start') {
      setStartDraft(value);
    } else {
      setEndDraft(value);
    }
    setTimeError(null);
    setSaveError(null);
    setSaved(false);
  }

  async function saveClip(andNext: boolean) {
    if (!clip || !isValidRange || !clip.mediaUrl || saving || saved) {
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(
        `/api/processing/rows/${clip.tab}/${clip.rowNumber}`,
        {
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            revision: clip.revision,
            start: formatTimecode(startTime),
            end: formatTimecode(endTime),
            ...form,
          }),
        }
      );
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          errorMessage(payload, 'Could not save this clip to Google Sheets.')
        );
      }

      if (andNext) {
        setLoadGeneration((value) => value + 1);
      } else {
        setSaved(true);
      }
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Could not save this clip to Google Sheets.'
      );
    } finally {
      setSaving(false);
    }
  }

  const validRange = isValidRange;
  const startDraftSeconds = parseTimecode(startDraft);
  const endDraftSeconds = parseTimecode(endDraft);
  const draftsMatchMarkers =
    startDraftSeconds !== null &&
    endDraftSeconds !== null &&
    startTime !== null &&
    endTime !== null &&
    Math.abs(startDraftSeconds - startTime) < 0.001 &&
    Math.abs(endDraftSeconds - endTime) < 0.001;
  const canSave = Boolean(
    clip?.mediaUrl &&
      validRange &&
      draftsMatchMarkers &&
      timeError === null &&
      seekingBoundary === null &&
      !saved
  );
  const rowHeading = clip ? clipHeading(clip) : '';

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <a className={styles.backLink} href="/">
              <span aria-hidden="true">←</span> Capture app
            </a>
            <label className={styles.tabSelector} htmlFor="processor-tab">
              <span>Processing tab</span>
              <select
                id="processor-tab"
                value={tab}
                onChange={(event) =>
                  handleTabChange(event.target.value as ProcessingTab)
                }
              >
                <option value="Shows">Shows</option>
                <option value="Movies">Movies</option>
              </select>
            </label>
          </div>
        </header>

        {loadError && (
          <div className={styles.errorBanner} role="alert">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => setLoadGeneration((value) => value + 1)}
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className={styles.emptyPanel} role="status">
            Loading the next pending clip…
          </div>
        ) : loadError ? null : !clip ? (
          <section className={styles.emptyPanel}>
            <p className={styles.eyebrow}>{tab} queue</p>
            <h2>No pending clips</h2>
            <p>Every populated row in this tab has an End time.</p>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => setLoadGeneration((value) => value + 1)}
            >
              Check again
            </button>
          </section>
        ) : (
          <>
            <section className={styles.clipHeading}>
              <div>
                <p className={styles.eyebrow}>
                  {tab} · Sheet row {clip.rowNumber}
                </p>
                <h2>{rowHeading}</h2>
              </div>
              <div className={styles.sourceSummary}>
                <span>Approximate start</span>
                <strong>{clip.start ?? 'Not set'}</strong>
                <details>
                  <summary>Source path</summary>
                  <code>{clip.source ?? 'No source path in this row'}</code>
                </details>
              </div>
            </section>

            {clip.mediaError && (
              <div className={styles.warningBanner} role="alert">
                <strong>Video unavailable.</strong> {clip.mediaError}
                {clip.source === null &&
                  ' Add a source path to the sheet before processing this row.'}
              </div>
            )}

            <div className={styles.workspace}>
              <section className={styles.videoColumn} aria-label="Clip timing">
                {clip.mediaUrl ? (
                  <div className={styles.playerPanel}>
                    <video
                      key={mediaKey}
                      ref={videoRef}
                      className={styles.video}
                      src={clip.mediaUrl}
                      controls
                      playsInline
                      preload="metadata"
                      onLoadedMetadata={(event) =>
                        onLoadedMetadata(event.currentTarget)
                      }
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
                      onError={() =>
                        setPlaybackError(
                          'Chrome could not play or seek this video. Check the file codec and media mount.'
                        )
                      }
                    />
                    {playbackError && (
                      <p className={styles.playbackError} role="alert">
                        {playbackError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className={styles.playerPlaceholder}>
                    <span aria-hidden="true">▶</span>
                    <p>The selected row has no playable source file.</p>
                  </div>
                )}

                <section
                  className={styles.playbackStatus}
                  aria-label="Playback timing"
                >
                  <div>
                    <span className={styles.statusLabel}>
                      Displayed frame time
                    </span>
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
                      <strong>
                        {observedFrameStep === null
                          ? 'Not measured yet'
                          : `${(observedFrameStep * 1000).toFixed(3)} ms`}
                      </strong>
                    </span>
                  </div>
                </section>
              </section>

              <aside className={styles.editorSidebar}>
                <section
                  className={styles.timingPanel}
                  aria-label="Start and end controls"
                >
                  <section
                    className={styles.frameSettings}
                    aria-label="Frame step settings"
                  >
                    <label htmlFor="processor-frame-step">
                      Frame-step interval override (ms)
                    </label>
                    <input
                      id="processor-frame-step"
                      type="number"
                      min="0.1"
                      step="0.001"
                      placeholder="Auto from playback"
                      value={frameStepOverrideMs}
                      disabled={saved}
                      onChange={(event) =>
                        setFrameStepOverrideMs(event.target.value)
                      }
                    />
                    <p>
                      {hasManualFrameStep
                        ? `Using ${manualFrameStepMs.toFixed(3)} ms per step.`
                        : observedFrameStep !== null
                        ? 'Using the measured median frame interval.'
                        : 'Play briefly to measure the frame interval; stepping initially uses a 40 ms fallback.'}
                    </p>
                  </section>

                  <div className={styles.boundaryHeading}>
                    <div>
                      <p className={styles.eyebrow}>Edit points</p>
                      <h2>Start and end</h2>
                    </div>
                    <label className={styles.loopToggle}>
                      <input
                        type="checkbox"
                        checked={loopEnabled}
                        disabled={!validRange || saved}
                        onChange={(event) => {
                          loopEnabledRef.current = event.target.checked;
                          setLoopEnabled(event.target.checked);
                        }}
                      />
                      Loop selection
                    </label>
                  </div>
                  <div className={styles.boundaryGrid}>
                    <BoundaryCard
                      boundary="start"
                      value={startTime}
                      draft={startDraft}
                      currentFrameAvailable={currentFrameTime !== null}
                      disabled={saved}
                      onDraftChange={(value) => updateTimeDraft('start', value)}
                      onCommit={() => commitTimeInput('start', startDraft)}
                      onMarkCurrent={() => markAtCurrentFrame('start')}
                      onStep={(direction, unit) =>
                        stepBoundary('start', direction, unit)
                      }
                      onJump={() => jumpToBoundary('start')}
                    />
                    <BoundaryCard
                      boundary="end"
                      value={endTime}
                      draft={endDraft}
                      currentFrameAvailable={currentFrameTime !== null}
                      disabled={saved}
                      onDraftChange={(value) => updateTimeDraft('end', value)}
                      onCommit={() => commitTimeInput('end', endDraft)}
                      onMarkCurrent={() => markAtCurrentFrame('end')}
                      onStep={(direction, unit) =>
                        stepBoundary('end', direction, unit)
                      }
                      onJump={() => jumpToBoundary('end')}
                    />
                  </div>
                  {timeError && (
                    <p className={styles.validationError} role="alert">
                      {timeError}
                    </p>
                  )}
                  {startTime !== null &&
                    endTime !== null &&
                    endTime <= startTime && (
                      <p className={styles.validationError} role="alert">
                        End must be later than Start.
                      </p>
                    )}
                  <button
                    className={styles.playSelectionButton}
                    type="button"
                    disabled={!validRange || !clip.mediaUrl}
                    onClick={() => {
                      const video = videoRef.current;
                      if (!video || startTimeRef.current === null) return;
                      video.currentTime = startTimeRef.current;
                      void video
                        .play()
                        .catch(() =>
                          setPlaybackError('Chrome could not start playback.')
                        );
                    }}
                  >
                    <span aria-hidden="true">▶</span> Play selection from Start
                  </button>
                </section>
                <section
                  className={styles.metadataPanel}
                  aria-labelledby="metadata-heading"
                >
                  <div>
                    <p className={styles.eyebrow}>Clip details</p>
                    <h2 id="metadata-heading">Metadata</h2>
                  </div>
                  <label className={styles.fieldLabel} htmlFor="clip-name">
                    Name
                  </label>
                  <input
                    id="clip-name"
                    disabled={saved}
                    value={form.name}
                    onChange={(event) => updateForm('name', event.target.value)}
                  />
                  <label
                    className={styles.fieldLabel}
                    htmlFor="clip-description"
                  >
                    Description
                  </label>
                  <textarea
                    id="clip-description"
                    rows={3}
                    disabled={saved}
                    value={form.description}
                    onChange={(event) =>
                      updateForm('description', event.target.value)
                    }
                  />
                  <label className={styles.fieldLabel} htmlFor="clip-script">
                    Script
                  </label>
                  <textarea
                    id="clip-script"
                    rows={5}
                    disabled={saved}
                    value={form.script}
                    onChange={(event) =>
                      updateForm('script', event.target.value)
                    }
                  />
                  <label
                    className={styles.fieldLabel}
                    htmlFor="clip-characters"
                  >
                    Characters <span>Comma-separated</span>
                  </label>
                  <input
                    id="clip-characters"
                    disabled={saved}
                    value={form.characters}
                    onChange={(event) =>
                      updateForm('characters', event.target.value)
                    }
                  />
                  <label className={styles.fieldLabel} htmlFor="clip-tags">
                    Tags <span>Comma-separated</span>
                  </label>
                  <input
                    id="clip-tags"
                    disabled={saved}
                    value={form.tags}
                    onChange={(event) => updateForm('tags', event.target.value)}
                  />

                  <section
                    className={styles.sheetPreview}
                    aria-label="Times to write"
                  >
                    <p className={styles.eyebrow}>Spreadsheet preview</p>
                    <div>
                      <span>Start</span>
                      <output>{formatTimecode(startTime)}</output>
                    </div>
                    <div>
                      <span>End</span>
                      <output>{formatTimecode(endTime)}</output>
                    </div>
                  </section>
                  <div className={styles.saveButtons}>
                    <button
                      className={styles.saveButton}
                      type="button"
                      disabled={!canSave || saving}
                      onClick={() => void saveClip(false)}
                    >
                      {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
                    </button>
                    <button
                      className={styles.nextButton}
                      type="button"
                      disabled={!canSave || saving}
                      onClick={() => void saveClip(true)}
                    >
                      Save &amp; Next
                    </button>
                  </div>
                  {saveError && (
                    <p className={styles.validationError} role="alert">
                      {saveError}
                    </p>
                  )}
                  {saved && (
                    <p className={styles.savedNotice} role="status">
                      Saved to the {tab} sheet. The row is now marked processed.
                    </p>
                  )}
                  <p className={styles.formNote}>
                    Saving updates this existing row; it does not append a new
                    record.
                  </p>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default ClipProcessor;
