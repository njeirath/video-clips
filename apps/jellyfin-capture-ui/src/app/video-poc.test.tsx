import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import VideoPoc from './video-poc';

function mockVideoApi() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        videos: [
          {
            id: 'S01E02.mkv',
            label: 'S01E02.mkv',
            fileName: 'S01E02.mkv',
            extension: 'MKV',
            available: true,
          },
        ],
      }),
    })
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe('video timing proof of concept', () => {
  it('loads the local test list and captures displayed frame times for both markers', async () => {
    mockVideoApi();

    const { container } = render(<VideoPoc />);
    expect(
      await screen.findByRole('heading', { name: 'Clip timing workbench' })
    ).toBeTruthy();

    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    if (!video) {
      throw new Error('Expected the configured video element.');
    }

    Object.defineProperty(video, 'duration', {
      configurable: true,
      value: 120,
    });
    Object.defineProperty(video, 'currentTime', {
      configurable: true,
      value: 7.75,
      writable: true,
    });
    fireEvent(video, new Event('loadedmetadata', { bubbles: true }));
    fireEvent.timeUpdate(video);
    fireEvent.click(
      screen.getByRole('button', { name: 'Set start to displayed frame' })
    );
    expect(screen.getAllByText('00:00:07.750').length).toBeGreaterThan(0);

    video.currentTime = 9.25;
    fireEvent.timeUpdate(video);
    fireEvent.click(
      screen.getByRole('button', { name: 'Set end to displayed frame' })
    );
    expect(screen.getAllByText('00:00:09.250').length).toBeGreaterThan(0);
    expect(
      (
        screen.getByRole('button', {
          name: /Play selection/,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(false);
    expect(screen.getByText(/Values use/)).toBeTruthy();
  });

  it('defaults to Shows and remembers the selected processing tab', async () => {
    mockVideoApi();

    const firstRender = render(<VideoPoc />);
    const initialSelect = (await screen.findByRole('combobox', {
      name: 'Processing tab',
    })) as HTMLSelectElement;

    expect(initialSelect.value).toBe('Shows');
    fireEvent.change(initialSelect, { target: { value: 'Movies' } });
    expect(initialSelect.value).toBe('Movies');
    expect(window.localStorage.getItem('jellyfin-capture-processing-tab')).toBe(
      'Movies'
    );

    firstRender.unmount();
    render(<VideoPoc />);
    const rememberedSelect = (await screen.findByRole('combobox', {
      name: 'Processing tab',
    })) as HTMLSelectElement;
    expect(rememberedSelect.value).toBe('Movies');
  });
});
