import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ClipProcessor from './clip-processor';

const pendingClip = {
  tab: 'Shows',
  rowNumber: 2,
  revision: 'a'.repeat(64),
  show: 'The Office',
  title: null,
  season: 1,
  episode: 2,
  start: '00:07:30.000',
  name: '',
  description: '',
  script: '',
  characters: '',
  tags: '',
  source: '/mnt/nfs/Shows/The Office - US/S01/S01E02.mkv',
  mediaUrl: '/api/processing/media/test-token',
  mediaError: null,
};

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe('clip processor', () => {
  it('loads the selected queue row and updates exact times and metadata on save', async () => {
    const fetchMock = vi.fn(async (input: string, options?: RequestInit) => {
      if (input === '/api/processing/next?tab=Shows') {
        return {
          ok: true,
          json: async () => ({ clip: pendingClip }),
        };
      }
      if (
        input === '/api/processing/rows/Shows/2' &&
        options?.method === 'PUT'
      ) {
        return {
          ok: true,
          json: async () => ({ status: 'ok', tab: 'Shows', rowNumber: 2 }),
        };
      }
      return {
        ok: false,
        json: async () => ({ message: 'Unexpected request' }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const { container } = render(<ClipProcessor />);
    expect(
      await screen.findByRole('heading', { name: /The Office/ })
    ).toBeTruthy();
    expect(
      screen.getByRole('combobox', { name: 'Processing tab' })
    ).toHaveProperty('value', 'Shows');
    expect(await screen.findByDisplayValue('00:07:30.000')).toBeTruthy();

    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    if (video) {
      Object.defineProperty(video, 'currentTime', {
        configurable: true,
        value: 450,
        writable: true,
      });
    }

    const endInput = screen.getByLabelText('End timecode');
    fireEvent.change(endInput, { target: { value: '00:07:33.417' } });
    fireEvent.blur(endInput);
    if (video) {
      fireEvent.seeked(video);
    }
    expect(screen.getAllByText('00:07:33.417').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'What You Want a Cookie' },
    });
    fireEvent.change(screen.getByLabelText('Script'), {
      target: { value: 'Michael: What you want a cookie?' },
    });
    fireEvent.change(screen.getByLabelText(/Characters/), {
      target: { value: 'Michael Scott' },
    });
    fireEvent.change(screen.getByLabelText(/Tags/), {
      target: { value: 'awkward, office' },
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));
    expect(await screen.findByText(/Saved to the Shows sheet/)).toBeTruthy();
    expect((screen.getByLabelText('Name') as HTMLInputElement).disabled).toBe(
      true
    );

    const saveCall = fetchMock.mock.calls.find(
      ([url, options]) =>
        url === '/api/processing/rows/Shows/2' && options?.method === 'PUT'
    );
    expect(saveCall).toBeDefined();
    expect(JSON.parse(String(saveCall?.[1]?.body))).toEqual({
      revision: 'a'.repeat(64),
      start: '00:07:30.000',
      end: '00:07:33.417',
      name: 'What You Want a Cookie',
      description: '',
      script: 'Michael: What you want a cookie?',
      characters: 'Michael Scott',
      tags: 'awkward, office',
    });
  });

  it('offers second, half-second, and frame adjustments for both points', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ clip: pendingClip }),
      })
    );

    const { container } = render(<ClipProcessor />);
    expect(
      await screen.findByRole('heading', { name: /The Office/ })
    ).toBeTruthy();

    const video = container.querySelector('video');
    if (video) {
      Object.defineProperty(video, 'currentTime', {
        configurable: true,
        value: 450,
        writable: true,
      });
    }

    const startInput = screen.getByLabelText('Start timecode');
    const startSteps = [
      ['Move start back one second', '00:07:29.000'],
      ['Move start back half a second', '00:07:28.500'],
      ['Move start back one frame', '00:07:28.460'],
      ['Move start forward one frame', '00:07:28.500'],
      ['Move start forward half a second', '00:07:29.000'],
      ['Move start forward one second', '00:07:30.000'],
    ] as const;
    for (const [buttonName, expectedTime] of startSteps) {
      fireEvent.click(screen.getByRole('button', { name: buttonName }));
      expect(startInput).toHaveProperty('value', expectedTime);
    }

    const endInput = screen.getByLabelText('End timecode');
    fireEvent.change(endInput, { target: { value: '00:07:40.000' } });
    fireEvent.blur(endInput);

    const endSteps = [
      ['Move end back one second', '00:07:39.000'],
      ['Move end back half a second', '00:07:38.500'],
      ['Move end back one frame', '00:07:38.460'],
      ['Move end forward one frame', '00:07:38.500'],
      ['Move end forward half a second', '00:07:39.000'],
      ['Move end forward one second', '00:07:40.000'],
    ] as const;
    for (const [buttonName, expectedTime] of endSteps) {
      fireEvent.click(screen.getByRole('button', { name: buttonName }));
      expect(endInput).toHaveProperty('value', expectedTime);
    }
  });

  it('shows a clear empty state when the selected tab has no pending rows', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ clip: null }) })
    );

    render(<ClipProcessor />);
    expect(
      await screen.findByRole('heading', { name: 'No pending clips' })
    ).toBeTruthy();
  });
});
