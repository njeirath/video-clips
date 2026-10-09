import express from 'express';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PendingClip, ProcessingTab } from './processing-record';
import { createProcessingRouter } from './processing-routes';

const originalMediaBasePath = process.env.MEDIA_BASE_PATH;
const mediaSource = '/mnt/nfs/Shows/The Office - US/S01/S01E02.mkv';
let tempDirectory: string;
let server: Server;
let origin: string;
let currentClip: PendingClip;
const findNext = vi.fn(
  async (_tab: ProcessingTab, _options?: { forceRefresh?: boolean }) =>
    currentClip
);
const update = vi.fn(async (tab: ProcessingTab, rowNumber: number) => ({
  tab,
  rowNumber,
}));

beforeEach(async () => {
  vi.clearAllMocks();
  tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'processing-routes-'));
  const localFile = path.join(
    tempDirectory,
    'mnt',
    'nfs',
    'Shows',
    'The Office - US',
    'S01',
    'S01E02.mkv'
  );
  await mkdir(path.dirname(localFile), { recursive: true });
  await writeFile(localFile, Buffer.from([0, 1, 2, 3, 4]));
  process.env.MEDIA_BASE_PATH = tempDirectory;

  currentClip = {
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
    source: mediaSource,
  };
  findNext.mockImplementation(async () => currentClip);

  const app = express();
  app.use(express.json());
  app.use('/api/processing', createProcessingRouter({ findNext, update }));
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as AddressInfo;
  origin = `http://127.0.0.1:${address.port}`;
});

afterEach(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await rm(tempDirectory, { recursive: true, force: true });
  if (originalMediaBasePath === undefined) {
    delete process.env.MEDIA_BASE_PATH;
  } else {
    process.env.MEDIA_BASE_PATH = originalMediaBasePath;
  }
});

describe('processing API routes', () => {
  it('returns the next clip and a restricted range-stream URL', async () => {
    const response = await fetch(`${origin}/api/processing/next?tab=Shows`);
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      clip: PendingClip & {
        mediaUrl: string | null;
        mediaError: string | null;
      };
    };
    expect(payload.clip).toMatchObject({
      tab: 'Shows',
      rowNumber: 2,
      source: mediaSource,
      mediaError: null,
    });
    expect(payload.clip.mediaUrl).toMatch(/^\/api\/processing\/media\//);
    expect(findNext).toHaveBeenCalledWith('Shows');

    const mediaResponse = await fetch(`${origin}${payload.clip.mediaUrl}`, {
      headers: { Range: 'bytes=1-3' },
    });
    expect(mediaResponse.status).toBe(206);
    expect(mediaResponse.headers.get('content-range')).toBe('bytes 1-3/5');
    expect(Buffer.from(await mediaResponse.arrayBuffer())).toEqual(
      Buffer.from([1, 2, 3])
    );
  });

  it('forces a fresh row read when the queue refresh query is set', async () => {
    const response = await fetch(
      `${origin}/api/processing/next?tab=Shows&refresh=true`
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(findNext).toHaveBeenCalledWith('Shows', { forceRefresh: true });
  });

  it('returns pending rows with a missing-source warning instead of silently skipping them', async () => {
    currentClip = { ...currentClip, source: null };
    const response = await fetch(`${origin}/api/processing/next?tab=Shows`);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      clip: {
        rowNumber: 2,
        mediaUrl: null,
        mediaError: 'This row has no source path.',
      },
    });
  });

  it('rejects an unsupported tab before reading Sheets', async () => {
    const response = await fetch(`${origin}/api/processing/next?tab=Other`);
    expect(response.status).toBe(400);
    expect(findNext).not.toHaveBeenCalled();
  });

  it('saves updates to the selected sheet row', async () => {
    const payload = {
      revision: 'a'.repeat(64),
      start: '00:07:31.042',
      end: '00:07:33.417',
      name: 'What You Want a Cookie',
      description: '',
      script: 'Michael: What you want a cookie?',
      characters: 'Michael Scott',
      tags: 'awkward, office',
    };
    const response = await fetch(`${origin}/api/processing/rows/Shows/2`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: 'ok',
      tab: 'Shows',
      rowNumber: 2,
    });
    expect(update).toHaveBeenCalledWith('Shows', 2, payload);
  });
});
