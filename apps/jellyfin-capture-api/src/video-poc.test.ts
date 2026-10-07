import express from 'express';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createVideoPocRouter } from './video-poc';

let directory: string;
let server: Server;
let baseUrl: string;

beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'video-poc-'));
  await writeFile(
    path.join(directory, 'sample.mp4'),
    Buffer.from([0, 1, 2, 3, 4, 5])
  );
  await writeFile(path.join(directory, 'sample.mkv'), Buffer.from([6, 7, 8]));
  const nestedDirectory = path.join(
    directory,
    'mnt',
    'nfs',
    'Shows',
    'The Office - US',
    'S01'
  );
  await mkdir(nestedDirectory, { recursive: true });
  await writeFile(
    path.join(nestedDirectory, 'S01E02.mkv'),
    Buffer.from([9, 10])
  );
  await writeFile(path.join(directory, 'ignore.txt'), 'not a video');

  const app = express();
  app.use('/api/poc', createVideoPocRouter(directory));
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}/api/poc`;
});

afterEach(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await rm(directory, { recursive: true, force: true });
});

describe('local video proof-of-concept route', () => {
  it('lists MP4 and MKV files recursively under the configured test directory', async () => {
    const response = await fetch(`${baseUrl}/videos`);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({
      videos: [
        {
          id: Buffer.from(
            'mnt/nfs/Shows/The Office - US/S01/S01E02.mkv'
          ).toString('base64url'),
          label: 'mnt/nfs/Shows/The Office - US/S01/S01E02.mkv',
          fileName: 'S01E02.mkv',
          extension: 'MKV',
          available: true,
        },
        {
          id: Buffer.from('sample.mkv').toString('base64url'),
          label: 'sample.mkv',
          fileName: 'sample.mkv',
          extension: 'MKV',
          available: true,
        },
        {
          id: Buffer.from('sample.mp4').toString('base64url'),
          label: 'sample.mp4',
          fileName: 'sample.mp4',
          extension: 'MP4',
          available: true,
        },
      ],
    });
  });

  it('streams a video with byte ranges so the browser can seek', async () => {
    const videoId = Buffer.from('sample.mp4').toString('base64url');
    const response = await fetch(`${baseUrl}/videos/${videoId}`, {
      headers: { Range: 'bytes=1-3' },
    });

    expect(response.status).toBe(206);
    expect(response.headers.get('content-range')).toBe('bytes 1-3/6');
    expect(response.headers.get('content-type')).toContain('video/mp4');
    expect(Buffer.from(await response.arrayBuffer())).toEqual(
      Buffer.from([1, 2, 3])
    );
  });

  it('does not allow arbitrary paths to be streamed', async () => {
    const response = await fetch(`${baseUrl}/videos/not-configured.mp4`);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      message: 'Unknown proof-of-concept video.',
    });
  });
});
