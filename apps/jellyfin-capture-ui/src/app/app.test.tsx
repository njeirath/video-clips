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

    expect(await screen.findByRole('heading', { name: 'The Expanse' })).toBeTruthy();
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
