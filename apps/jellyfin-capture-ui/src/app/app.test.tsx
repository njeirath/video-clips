import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './app';
import styles from './app.module.css';

interface MockStream {
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

interface MockHistoryEntry {
  rowNumber: number;
  positionSeconds: number;
  path: string | null;
}

const episode: MockStream = {
  sessionId: 'session-episode',
  itemId: 'episode-id',
  title: 'Home',
  itemType: 'Episode',
  seriesName: 'The Expanse',
  seasonNumber: 2,
  episodeNumber: 3,
  path: '/media/The Expanse/S02E03.mkv',
  userName: 'Viewer',
  client: 'Jellyfin Web',
  deviceName: 'Living Room TV',
  isPaused: false,
  positionSeconds: 2535,
  durationSeconds: 2700,
};

function mockApi(
  streams: MockStream[],
  historyEntries: MockHistoryEntry[] = []
) {
  const jsonResponse = (payload: unknown) => ({
    ok: true,
    json: async () => payload,
  });
  const fetchMock = vi.fn((url: string, options?: RequestInit) => {
    if (url === '/api/sessions') {
      return Promise.resolve(
        jsonResponse({
          snapshotAt: '2026-01-01T12:00:00.000Z',
          streams,
        })
      );
    }

    if (url === '/api/records/matches') {
      return Promise.resolve(
        jsonResponse({ sheetName: 'Shows', entries: historyEntries })
      );
    }

    if (url === '/api/records') {
      const record = JSON.parse(String(options?.body ?? '{}')) as {
        itemType?: string;
      };
      return Promise.resolve(
        jsonResponse({
          sheetName:
            record.itemType?.toLowerCase() === 'episode' ? 'Shows' : 'Movies',
        })
      );
    }

    return Promise.resolve({
      ok: false,
      json: async () => ({ message: 'Not found' }),
    });
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Jellyfin Capture', () => {
  it('loads a single snapshot, auto-selects the stream, and allows position adjustments', async () => {
    const fetchMock = mockApi([episode]);

    render(
      <StrictMode>
        <App />
      </StrictMode>
    );

    expect(
      await screen.findByRole('heading', { name: 'The Expanse' })
    ).toBeTruthy();
    expect(screen.getByText('00:42:15')).toBeTruthy();
    expect(screen.getByText('Show Jellyfin file path')).toBeTruthy();
    expect(await screen.findByText(/No saved positions within one minute/)).toBeTruthy();
    expect(
      screen
        .getByRole('region', { name: 'Nearby saved positions' })
        .classList.contains(styles.historyPanelNearby)
    ).toBe(false);
    expect(
      fetchMock.mock.calls.filter(([url]) => url === '/api/sessions')
    ).toHaveLength(1);
    expect(
      fetchMock.mock.calls.filter(([url]) => url === '/api/records/matches')
    ).toHaveLength(1);

    fireEvent.click(
      screen.getByRole('button', { name: 'Move position forward one second' })
    );
    expect(screen.getByText('00:42:16')).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: 'Move position back one second' })
    );
    expect(screen.getByText('00:42:15')).toBeTruthy();
    expect(
      fetchMock.mock.calls.filter(([url]) => url === '/api/records/matches')
    ).toHaveLength(1);
  });

  it('shows same-media captures within one minute and recalculates locally after adjustments', async () => {
    const fetchMock = mockApi([episode], [
      { rowNumber: 10, positionSeconds: 2475, path: null },
      { rowNumber: 11, positionSeconds: 2474, path: null },
      { rowNumber: 12, positionSeconds: 2595, path: null },
      { rowNumber: 13, positionSeconds: 2596, path: '/media/another-copy.mkv' },
    ]);

    render(<App />);

    expect(await screen.findByText('60 seconds earlier')).toBeTruthy();
    expect(screen.getByText('60 seconds later')).toBeTruthy();
    expect(
      screen
        .getByRole('region', { name: 'Nearby saved positions' })
        .classList.contains(styles.historyPanelNearby)
    ).toBe(true);
    expect(screen.queryByText('61 seconds earlier')).toBeNull();
    expect(screen.getByText('Sheet row 10')).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: 'Move position forward one second' })
    );

    expect(screen.queryByText('60 seconds earlier')).toBeNull();
    expect(screen.getByText('60 seconds later')).toBeTruthy();
    expect(screen.getByText('Sheet row 13')).toBeTruthy();
    expect(
      fetchMock.mock.calls.filter(([url]) => url === '/api/records/matches')
    ).toHaveLength(1);
  });

  it('posts a corrected TV episode position and refreshes its history after saving', async () => {
    const fetchMock = mockApi([episode]);

    render(<App />);
    const saveButton = await screen.findByRole('button', {
      name: 'Save to Shows',
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Move position forward one second' })
    );
    fireEvent.click(saveButton);

    expect(
      await screen.findByText('Added as a new row in the Shows sheet.')
    ).toBeTruthy();
    const saveCall = fetchMock.mock.calls.find(
      ([url]) => url === '/api/records'
    );
    expect(saveCall?.[1]?.method).toBe('POST');
    expect(JSON.parse(String(saveCall?.[1]?.body))).toMatchObject({
      itemType: 'Episode',
      title: 'Home',
      seriesName: 'The Expanse',
      seasonNumber: 2,
      episodeNumber: 3,
      path: '/media/The Expanse/S02E03.mkv',
      positionSeconds: 2536,
    });
    expect(
      fetchMock.mock.calls.filter(([url]) => url === '/api/records/matches')
    ).toHaveLength(2);
  });

  it('routes movies to the Movies sheet', async () => {
    const movie = {
      ...episode,
      sessionId: 'session-movie',
      itemId: 'movie-id',
      title: 'Arrival',
      itemType: 'Movie',
      seriesName: null,
      seasonNumber: null,
      episodeNumber: null,
      path: null,
    };
    const fetchMock = mockApi([movie]);

    render(<App />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Save to Movies' })
    );

    expect(
      await screen.findByText('Added as a new row in the Movies sheet.')
    ).toBeTruthy();
    const saveCall = fetchMock.mock.calls.find(
      ([url]) => url === '/api/records'
    );
    expect(saveCall?.[1]?.method).toBe('POST');
    expect(JSON.parse(String(saveCall?.[1]?.body))).toMatchObject({
      itemType: 'Movie',
      title: 'Arrival',
      positionSeconds: 2535,
    });
  });

  it('shows paused sessions and lets the user choose between streams', async () => {
    const pausedMovie = {
      ...episode,
      sessionId: 'session-movie',
      itemId: 'movie-id',
      title: 'Arrival',
      itemType: 'Movie',
      seriesName: null,
      seasonNumber: null,
      episodeNumber: null,
      path: null,
      isPaused: true,
      positionSeconds: 89,
      durationSeconds: 7000,
    };
    const fetchMock = mockApi([episode, pausedMovie]);

    render(<App />);

    const movieCard = await screen.findByRole('button', { name: /Arrival/ });
    expect(screen.getByText('Paused')).toBeTruthy();
    expect(
      fetchMock.mock.calls.filter(([url]) => url === '/api/records/matches')
    ).toHaveLength(0);
    fireEvent.click(movieCard);

    expect(screen.getByRole('heading', { name: 'Arrival' })).toBeTruthy();
    expect(screen.getAllByText('00:01:29')).toHaveLength(2);
    expect(await screen.findByText(/No saved positions within one minute/)).toBeTruthy();
    expect(
      fetchMock.mock.calls.filter(([url]) => url === '/api/records/matches')
    ).toHaveLength(1);
  });
});
