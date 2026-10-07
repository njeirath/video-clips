import { useEffect, useState } from 'react';
import styles from './app.module.css';

interface PlayingStream {
  sessionId: string;
  itemId: string | null;
  title: string;
  itemType: string | null;
  seriesName: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  path: string | null;
  userName: string | null;
  client: string | null;
  deviceName: string | null;
  isPaused: boolean;
  positionSeconds: number;
  durationSeconds: number | null;
}

interface SessionSnapshot {
  snapshotAt: string;
  streams: PlayingStream[];
}

interface CaptureHistoryEntry {
  rowNumber: number;
  positionSeconds: number;
  path: string | null;
}

interface CaptureHistoryResponse {
  entries: CaptureHistoryEntry[];
}

interface CaptureHistoryState {
  sessionId: string;
  status: 'loading' | 'loaded' | 'error';
  entries: CaptureHistoryEntry[];
  error?: string;
}

let inFlightSnapshot: Promise<SessionSnapshot> | null = null;

function requestSnapshot(): Promise<SessionSnapshot> {
  if (!inFlightSnapshot) {
    inFlightSnapshot = fetch('/api/sessions', {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          const message =
            payload &&
            typeof payload === 'object' &&
            'message' in payload &&
            typeof payload.message === 'string'
              ? payload.message
              : 'Could not load Jellyfin sessions.';
          throw new Error(message);
        }

        if (
          !payload ||
          typeof payload !== 'object' ||
          !('streams' in payload) ||
          !Array.isArray(payload.streams) ||
          !('snapshotAt' in payload) ||
          typeof payload.snapshotAt !== 'string'
        ) {
          throw new Error('Jellyfin returned an unexpected response.');
        }

        return payload as SessionSnapshot;
      })
      .finally(() => {
        inFlightSnapshot = null;
      });
  }

  return inFlightSnapshot;
}

async function requestCaptureHistory(
  stream: PlayingStream
): Promise<CaptureHistoryResponse> {
  const response = await fetch('/api/records/matches', {
    method: 'POST',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      itemType: stream.itemType,
      title: stream.title,
      seriesName: stream.seriesName,
      seasonNumber: stream.seasonNumber,
      episodeNumber: stream.episodeNumber,
    }),
  });
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'message' in payload &&
      typeof payload.message === 'string'
        ? payload.message
        : 'Could not load saved capture history.';
    throw new Error(message);
  }

  if (
    !payload ||
    typeof payload !== 'object' ||
    !('entries' in payload) ||
    !Array.isArray(payload.entries)
  ) {
    throw new Error('Google Sheets returned an unexpected history response.');
  }

  const entries = payload.entries.flatMap((value) => {
    if (!value || typeof value !== 'object') {
      return [];
    }

    const entry = value as Record<string, unknown>;
    if (
      typeof entry.rowNumber !== 'number' ||
      !Number.isSafeInteger(entry.rowNumber) ||
      entry.rowNumber < 1 ||
      typeof entry.positionSeconds !== 'number' ||
      !Number.isSafeInteger(entry.positionSeconds) ||
      entry.positionSeconds < 0
    ) {
      return [];
    }

    return [
      {
        rowNumber: entry.rowNumber,
        positionSeconds: entry.positionSeconds,
        path: typeof entry.path === 'string' ? entry.path : null,
      },
    ];
  });

  return { entries };
}

function formatPosition(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;

  return [hours, minutes, remainder]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

function formatSnapshotTime(value: string): string {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(timestamp);
}

function isEpisode(stream: PlayingStream): boolean {
  return stream.itemType?.toLowerCase() === 'episode';
}

function sheetForStream(stream: PlayingStream): 'Shows' | 'Movies' | null {
  const itemType = stream.itemType?.toLowerCase();
  if (itemType === 'episode') {
    return 'Shows';
  }
  if (itemType === 'movie') {
    return 'Movies';
  }
  return null;
}

function canSaveStream(stream: PlayingStream): boolean {
  const sheet = sheetForStream(stream);
  if (sheet === 'Movies') {
    return Boolean(stream.title.trim());
  }

  return (
    sheet === 'Shows' &&
    Boolean(stream.seriesName?.trim()) &&
    Number.isSafeInteger(stream.seasonNumber) &&
    (stream.seasonNumber ?? -1) >= 0 &&
    Number.isSafeInteger(stream.episodeNumber) &&
    (stream.episodeNumber ?? -1) >= 0
  );
}

function mainTitle(stream: PlayingStream): string {
  return isEpisode(stream) ? stream.seriesName ?? stream.title : stream.title;
}

function episodeDetails(stream: PlayingStream): string {
  const parts = [
    stream.seasonNumber === null ? null : `Season ${stream.seasonNumber}`,
    stream.episodeNumber === null ? null : `Episode ${stream.episodeNumber}`,
    stream.seriesName ? stream.title : null,
  ].filter((part): part is string => part !== null);

  return parts.join(' · ') || 'TV episode';
}

function playbackSource(stream: PlayingStream): string | null {
  const source = [stream.userName, stream.deviceName || stream.client]
    .filter((value): value is string => Boolean(value))
    .join(' · ');

  return source || null;
}

function describePositionDifference(differenceSeconds: number): string {
  if (differenceSeconds === 0) {
    return 'Same position';
  }

  const absoluteDifference = Math.abs(differenceSeconds);
  const unit = absoluteDifference === 1 ? 'second' : 'seconds';
  const direction = differenceSeconds < 0 ? 'earlier' : 'later';
  return `${absoluteDifference} ${unit} ${direction}`;
}

export function App() {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedSheet, setSavedSheet] = useState<'Shows' | 'Movies' | null>(null);
  const [captureHistory, setCaptureHistory] =
    useState<CaptureHistoryState | null>(null);
  const [historyRequestVersion, setHistoryRequestVersion] = useState(0);

  function applySnapshot(nextSnapshot: SessionSnapshot) {
    setSnapshot(nextSnapshot);
    setSaveError(null);
    setSavedSheet(null);
    setPositions(
      Object.fromEntries(
        nextSnapshot.streams.map((stream) => [
          stream.sessionId,
          stream.positionSeconds,
        ])
      )
    );
    setSelectedSessionId(
      nextSnapshot.streams.length === 1
        ? nextSnapshot.streams[0].sessionId
        : null
    );
  }

  useEffect(() => {
    let isMounted = true;

    requestSnapshot()
      .then((nextSnapshot) => {
        if (isMounted) {
          applySnapshot(nextSnapshot);
        }
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Could not load Jellyfin sessions.'
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedStream =
    snapshot?.streams.find(
      (stream) => stream.sessionId === selectedSessionId
    ) ?? null;
  const selectedPosition = selectedStream
    ? positions[selectedStream.sessionId] ?? selectedStream.positionSeconds
    : 0;
  const selectedSheet = selectedStream ? sheetForStream(selectedStream) : null;
  const selectedCanSave =
    selectedStream !== null && canSaveStream(selectedStream);
  const hasPositionEdits =
    snapshot?.streams.some(
      (stream) => positions[stream.sessionId] !== stream.positionSeconds
    ) ?? false;

  useEffect(() => {
    if (!selectedStream || !selectedCanSave) {
      setCaptureHistory(null);
      return;
    }

    let isCurrent = true;
    const sessionId = selectedStream.sessionId;
    setCaptureHistory({ sessionId, status: 'loading', entries: [] });

    requestCaptureHistory(selectedStream)
      .then(({ entries }) => {
        if (isCurrent) {
          setCaptureHistory({ sessionId, status: 'loaded', entries });
        }
      })
      .catch((requestError: unknown) => {
        if (isCurrent) {
          setCaptureHistory({
            sessionId,
            status: 'error',
            entries: [],
            error:
              requestError instanceof Error
                ? requestError.message
                : 'Could not load saved capture history.',
          });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedStream, selectedCanSave, historyRequestVersion]);

  const selectedHistory =
    selectedStream && captureHistory?.sessionId === selectedStream.sessionId
      ? captureHistory
      : null;
  const nearbyHistoryEntries =
    selectedHistory?.status === 'loaded'
      ? selectedHistory.entries
          .map((entry) => ({
            ...entry,
            differenceSeconds: entry.positionSeconds - selectedPosition,
          }))
          .filter((entry) => Math.abs(entry.differenceSeconds) <= 60)
          .sort(
            (first, second) =>
              Math.abs(first.differenceSeconds) -
                Math.abs(second.differenceSeconds) ||
              second.rowNumber - first.rowNumber
          )
      : [];

  async function refreshSnapshot() {
    if (
      hasPositionEdits &&
      !window.confirm(
        'Refreshing will discard your position adjustments. Continue?'
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    setSaveError(null);
    try {
      applySnapshot(await requestSnapshot());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not load Jellyfin sessions.'
      );
    } finally {
      setLoading(false);
    }
  }

  function selectStream(sessionId: string) {
    setSelectedSessionId(sessionId);
    setSaveError(null);
    setSavedSheet(null);
  }

  function adjustPosition(delta: number) {
    if (!selectedStream) {
      return;
    }

    setSaveError(null);
    setSavedSheet(null);
    const sessionId = selectedStream.sessionId;
    const duration = selectedStream.durationSeconds;
    setPositions((current) => {
      const currentPosition =
        current[sessionId] ?? selectedStream.positionSeconds;
      const adjustedPosition = Math.max(0, currentPosition + delta);
      return {
        ...current,
        [sessionId]:
          duration === null
            ? adjustedPosition
            : Math.min(duration, adjustedPosition),
      };
    });
  }

  async function saveCapture() {
    if (
      !selectedStream ||
      !selectedSheet ||
      !selectedCanSave ||
      saving ||
      savedSheet
    ) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemType: selectedStream.itemType,
          title: selectedStream.title,
          seriesName: selectedStream.seriesName,
          seasonNumber: selectedStream.seasonNumber,
          episodeNumber: selectedStream.episodeNumber,
          path: selectedStream.path,
          positionSeconds: selectedPosition,
        }),
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          payload &&
          typeof payload === 'object' &&
          'message' in payload &&
          typeof payload.message === 'string'
            ? payload.message
            : 'The record could not be saved to Google Sheets.';
        throw new Error(message);
      }

      const responseSheet =
        payload &&
        typeof payload === 'object' &&
        'sheetName' in payload &&
        (payload.sheetName === 'Shows' || payload.sheetName === 'Movies')
          ? payload.sheetName
          : selectedSheet;
      setSavedSheet(responseSheet);
      setHistoryRequestVersion((version) => version + 1);
    } catch (requestError) {
      setSaveError(
        requestError instanceof Error
          ? requestError.message
          : 'The record could not be saved to Google Sheets.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topBar}>
          <div className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              ▶
            </span>
            <span>Jellyfin Capture</span>
          </div>
          <button
            className={styles.refreshButton}
            type="button"
            onClick={refreshSnapshot}
            disabled={loading || saving}
            aria-label="Refresh Jellyfin snapshot"
          >
            <span aria-hidden="true">↻</span>
            <span>{loading ? 'Loading' : 'Refresh'}</span>
          </button>
        </header>

        {error && (
          <div className={styles.errorBanner} role="alert">
            <span>{error}</span>
            {!snapshot && (
              <button type="button" onClick={refreshSnapshot}>
                Try again
              </button>
            )}
          </div>
        )}

        {loading && !snapshot ? (
          <div className={styles.loadingState} role="status">
            <span className={styles.loadingPulse} aria-hidden="true" />
            Connecting to Jellyfin…
          </div>
        ) : snapshot ? (
          <>
            <section
              className={styles.streamSection}
              aria-labelledby="streams-heading"
            >
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.sectionEyebrow}>Jellyfin</p>
                  <h2 id="streams-heading">Current streams</h2>
                </div>
                <span className={styles.countBadge}>
                  {snapshot.streams.length}{' '}
                  {snapshot.streams.length === 1 ? 'stream' : 'streams'}
                </span>
              </div>

              {snapshot.streams.length > 0 ? (
                <div className={styles.streamList}>
                  {snapshot.streams.map((stream) => {
                    const selected = stream.sessionId === selectedSessionId;
                    const source = playbackSource(stream);
                    const episode = isEpisode(stream);

                    return (
                      <button
                        className={`${styles.streamCard} ${
                          selected ? styles.streamCardSelected : ''
                        }`}
                        type="button"
                        key={stream.sessionId}
                        onClick={() => selectStream(stream.sessionId)}
                        disabled={saving}
                        aria-pressed={selected}
                      >
                        <span className={styles.mediaIcon} aria-hidden="true">
                          {episode ? '▤' : '▶'}
                        </span>
                        <span className={styles.streamText}>
                          <span className={styles.mediaType}>
                            {stream.itemType ?? 'Media'}
                            {source ? ` · ${source}` : ''}
                          </span>
                          <span className={styles.streamTitle}>
                            {mainTitle(stream)}
                          </span>
                          <span className={styles.streamSubtitle}>
                            {episode
                              ? episodeDetails(stream)
                              : formatPosition(stream.positionSeconds)}
                          </span>
                        </span>
                        <span className={styles.streamBadges}>
                          {stream.isPaused && (
                            <span className={styles.pausedBadge}>Paused</span>
                          )}
                          {selected && (
                            <span
                              className={styles.selectedMark}
                              aria-hidden="true"
                            >
                              ✓
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon} aria-hidden="true">
                    ◷
                  </span>
                  <h3>No media is playing</h3>
                  <p>
                    Start playback in Jellyfin, then refresh to take a new
                    snapshot. Paused sessions will appear here too.
                  </p>
                </div>
              )}

              <p className={styles.snapshotNote}>
                Snapshot captured at {formatSnapshotTime(snapshot.snapshotAt)}.
                Positions stay frozen until you refresh.
              </p>
            </section>

            {snapshot.streams.length > 1 && !selectedStream && (
              <p className={styles.selectionHint}>
                Choose a stream above to edit its playback position.
              </p>
            )}

            {selectedStream && (
              <section
                className={styles.capturePanel}
                aria-labelledby="selected-heading"
              >
                <div className={styles.captureHeading}>
                  <div>
                    <p className={styles.sectionEyebrow}>Selected media</p>
                    <h2 id="selected-heading">{mainTitle(selectedStream)}</h2>
                    <p className={styles.captureSubtitle}>
                      {isEpisode(selectedStream)
                        ? episodeDetails(selectedStream)
                        : selectedStream.itemType ?? 'Media'}
                    </p>
                  </div>
                  <span
                    className={`${styles.playbackBadge} ${
                      selectedStream.isPaused ? styles.playbackBadgePaused : ''
                    }`}
                  >
                    <span aria-hidden="true" />
                    {selectedStream.isPaused ? 'Paused' : 'Playing'}
                  </span>
                </div>

                <div className={styles.positionArea}>
                  <p className={styles.positionLabel}>Position in file</p>
                  <output className={styles.positionValue} aria-live="polite">
                    {formatPosition(selectedPosition)}
                  </output>
                  {selectedStream.durationSeconds !== null && (
                    <p className={styles.durationLabel}>
                      of {formatPosition(selectedStream.durationSeconds)}
                    </p>
                  )}
                </div>

                <div className={styles.adjustmentControls}>
                  <button
                    className={styles.adjustButton}
                    type="button"
                    onClick={() => adjustPosition(-1)}
                    disabled={saving}
                    aria-label="Move position back one second"
                  >
                    <span aria-hidden="true">−</span>
                    <span>1 second</span>
                  </button>
                  <button
                    className={styles.adjustButton}
                    type="button"
                    onClick={() => adjustPosition(1)}
                    disabled={saving}
                    aria-label="Move position forward one second"
                  >
                    <span aria-hidden="true">+</span>
                    <span>1 second</span>
                  </button>
                </div>

                {selectedCanSave && (
                  <section
                    className={styles.historyPanel}
                    aria-labelledby="history-heading"
                  >
                    <div className={styles.historyHeader}>
                      <div>
                        <p className={styles.sectionEyebrow}>Google Sheets</p>
                        <h3
                          className={styles.historyTitle}
                          id="history-heading"
                        >
                          Nearby saved positions
                        </h3>
                      </div>
                      {selectedHistory?.status === 'loaded' && (
                        <span className={styles.historyCount}>
                          {nearbyHistoryEntries.length} nearby
                        </span>
                      )}
                    </div>

                    {!selectedHistory || selectedHistory.status === 'loading' ? (
                      <p className={styles.historyStatus} role="status">
                        Checking saved positions…
                      </p>
                    ) : selectedHistory.status === 'error' ? (
                      <div className={styles.historyError} role="alert">
                        <span>{selectedHistory.error}</span>
                        <button
                          className={styles.historyRetryButton}
                          type="button"
                          onClick={() =>
                            setHistoryRequestVersion((version) => version + 1)
                          }
                        >
                          Retry
                        </button>
                      </div>
                    ) : nearbyHistoryEntries.length > 0 ? (
                      <ol className={styles.historyList}>
                        {nearbyHistoryEntries.map((entry) => (
                          <li
                            className={styles.historyEntry}
                            key={entry.rowNumber}
                          >
                            <div className={styles.historyEntryHeading}>
                              <strong className={styles.historyPosition}>
                                {formatPosition(entry.positionSeconds)}
                              </strong>
                              <span className={styles.historyDifference}>
                                {describePositionDifference(
                                  entry.differenceSeconds
                                )}
                              </span>
                            </div>
                            <span className={styles.historyRow}>
                              Sheet row {entry.rowNumber}
                            </span>
                            {entry.path && (
                              <details className={styles.historyPath}>
                                <summary>Show saved file path</summary>
                                <code>{entry.path}</code>
                              </details>
                            )}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className={styles.historyStatus}>
                        No saved positions within one minute of this position.
                      </p>
                    )}
                  </section>
                )}

                {selectedStream.path && (
                  <details className={styles.pathDetails}>
                    <summary>Show Jellyfin file path</summary>
                    <code>{selectedStream.path}</code>
                  </details>
                )}

                <button
                  className={styles.saveButton}
                  type="button"
                  onClick={saveCapture}
                  disabled={!selectedCanSave || saving || savedSheet !== null}
                >
                  {saving
                    ? 'Saving…'
                    : savedSheet
                    ? `Saved to ${savedSheet}`
                    : `Save to ${selectedSheet ?? 'Google Sheets'}`}
                </button>
                {saveError && (
                  <p className={styles.saveError} role="alert">
                    {saveError}
                  </p>
                )}
                {savedSheet && (
                  <p className={styles.saveSuccess} role="status">
                    Added as a new row in the {savedSheet} sheet.
                  </p>
                )}
                {!selectedCanSave && (
                  <p className={styles.saveNote}>
                    {isEpisode(selectedStream)
                      ? 'Jellyfin must provide the series, season, and episode details to save this show.'
                      : selectedSheet === null
                      ? 'Only Jellyfin TV episodes and movies can be saved.'
                      : 'The movie title is unavailable.'}
                  </p>
                )}
                {selectedCanSave && !saveError && !savedSheet && (
                  <p className={styles.saveNote}>
                    This app appends a new row; existing sheet data is left
                    unchanged.
                  </p>
                )}
              </section>
            )}
          </>
        ) : null}

        <footer className={styles.footer}>
          <span className={styles.footerDot} aria-hidden="true" />
          Jellyfin session snapshot
        </footer>
      </div>
    </main>
  );
}

export default App;
