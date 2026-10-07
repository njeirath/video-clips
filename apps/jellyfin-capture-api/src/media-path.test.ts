import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  MediaPathError,
  resolveMediaPath,
  resolveReadableMediaFile,
} from './media-path';

const originalMediaBasePath = process.env.MEDIA_BASE_PATH;
let tempDirectory: string;

afterEach(async () => {
  if (originalMediaBasePath === undefined) {
    delete process.env.MEDIA_BASE_PATH;
  } else {
    process.env.MEDIA_BASE_PATH = originalMediaBasePath;
  }
  if (tempDirectory) {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

describe('media source path resolution', () => {
  it('maps the server path below MEDIA_BASE_PATH for local development', async () => {
    tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'media-base-'));
    const expectedPath = path.join(
      tempDirectory,
      'mnt',
      'nfs',
      'Shows',
      'The Office - US',
      'S01',
      'S01E02.mkv'
    );
    await mkdir(path.dirname(expectedPath), { recursive: true });
    await writeFile(expectedPath, 'video-fixture');
    process.env.MEDIA_BASE_PATH = tempDirectory;

    expect(
      resolveMediaPath('/mnt/nfs/Shows/The Office - US/S01/S01E02.mkv').filePath
    ).toBe(expectedPath);
    expect(
      await resolveReadableMediaFile(
        '/mnt/nfs/Shows/The Office - US/S01/S01E02.mkv'
      )
    ).toMatchObject({ filePath: await realpath(expectedPath) });
  });

  it('uses the spreadsheet path directly when MEDIA_BASE_PATH is unset', () => {
    delete process.env.MEDIA_BASE_PATH;
    expect(resolveMediaPath('/mnt/nfs/Movies/Arrival.mkv').filePath).toBe(
      '/mnt/nfs/Movies/Arrival.mkv'
    );
  });

  it('rejects relative paths and paths outside the allowed media root', () => {
    expect(() => resolveMediaPath('Shows/episode.mkv')).toThrow(MediaPathError);
    expect(() => resolveMediaPath('/etc/passwd')).toThrow(/inside \/mnt\/nfs/);
    expect(() => resolveMediaPath('/mnt/nfs/../../etc/passwd')).toThrow(
      /inside \/mnt\/nfs/
    );
  });

  it('reports a missing media file without returning an arbitrary filesystem path', async () => {
    tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'media-base-'));
    process.env.MEDIA_BASE_PATH = tempDirectory;
    await mkdir(path.join(tempDirectory, 'mnt', 'nfs'), { recursive: true });

    await expect(
      resolveReadableMediaFile('/mnt/nfs/Shows/missing.mkv')
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
