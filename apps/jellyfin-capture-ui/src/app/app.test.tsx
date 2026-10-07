import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './app';

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

function mockSnapshot(streams: MockStream[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        snapshotAt: '2026-01-01T12:00:00.000Z',
        streams,
      }),
    })
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Jellyfin Capture', () => {
  it('loads one session once, auto-selects it, and allows one-second adjustments', async () => {
    mockSnapshot([episode]);

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
    expect(fetch).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByRole('button', { name: 'Move position forward one second' })
    );
    expect(screen.getByText('00:42:16')).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: 'Move position back one second' })
    );
    expect(screen.getByText('00:42:15')).toBeTruthy();
  });

  it('posts a corrected TV episode position and shows the append result', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          snapshotAt: '2026-01-01T12:00:00.000Z',
          streams: [episode],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sheetName: 'Shows' }),
      });
    vi.stubGlobal('fetch', fetchMock);

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
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe('/api/records');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'POST' });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toMatchObject(
      {
        itemType: 'Episode',
        title: 'Home',
        seriesName: 'The Expanse',
        seasonNumber: 2,
        episodeNumber: 3,
        path: '/media/The Expanse/S02E03.mkv',
        positionSeconds: 2536,
      }
    );
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
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          snapshotAt: '2026-01-01T12:00:00.000Z',
          streams: [movie],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sheetName: 'Movies' }),
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Save to Movies' })
    );

    expect(
      await screen.findByText('Added as a new row in the Movies sheet.')
    ).toBeTruthy();
    expect(fetchMock.mock.calls[1][0]).toBe('/api/records');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toMatchObject(
      {
        itemType: 'Movie',
        title: 'Arrival',
        positionSeconds: 2535,
      }
    );
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
    mockSnapshot([episode, pausedMovie]);

    render(<App />);

    const movieCard = await screen.findByRole('button', { name: /Arrival/ });
    expect(screen.getByText('Paused')).toBeTruthy();
    fireEvent.click(movieCard);

    expect(screen.getByRole('heading', { name: 'Arrival' })).toBeTruthy();
    expect(screen.getAllByText('00:01:29')).toHaveLength(2);
  });
});
