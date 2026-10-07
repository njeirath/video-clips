import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import express from 'express';

interface PocVideoFile {
  id: string;
  label: string;
  fileName: string;
  extension: string;
  filePath: string;
}

const supportedExtensions = new Set(['.mkv', '.mp4']);
const defaultVideoDirectory = path.resolve(process.cwd(), 'testData');

function contentTypeFor(filePath: string): string {
  switch (path.extname(filePath).toLowerCase()) {
    case '.mkv':
      return 'video/x-matroska';
    case '.mp4':
      return 'video/mp4';
    default:
      return 'application/octet-stream';
  }
}

function errorCode(error: unknown): string | null {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code;
  }

  return null;
}

async function listVideoFiles(
  directory: string,
  relativeDirectory = ''
): Promise<PocVideoFile[]> {
  const entries = await readdir(path.join(directory, relativeDirectory), {
    withFileTypes: true,
  });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const relativePath = path.join(relativeDirectory, entry.name);
      if (entry.isDirectory()) {
        return listVideoFiles(directory, relativePath);
      }

      const extension = path.extname(entry.name);
      if (
        !entry.isFile() ||
        !supportedExtensions.has(extension.toLowerCase())
      ) {
        return [];
      }

      return [
        {
          id: Buffer.from(relativePath).toString('base64url'),
          label: relativePath,
          fileName: entry.name,
          extension: extension.slice(1).toUpperCase(),
          filePath: path.join(directory, relativePath),
        },
      ];
    })
  );

  return nestedFiles
    .flat()
    .sort((first, second) => first.label.localeCompare(second.label));
}

export function createVideoPocRouter(
  videoDirectory = defaultVideoDirectory
): express.Router {
  const router = express.Router();

  router.get('/videos', async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    try {
      const videos = await listVideoFiles(videoDirectory);
      res.json({
        videos: videos.map(({ id, label, fileName, extension }) => ({
          id,
          label,
          fileName,
          extension,
          available: true,
        })),
      });
    } catch (error) {
      if (errorCode(error) === 'ENOENT') {
        res.json({ videos: [] });
        return;
      }

      res.status(500).json({ message: 'Could not list local test videos.' });
    }
  });

  router.get('/videos/:id', async (req, res) => {
    let videos: PocVideoFile[];
    try {
      videos = await listVideoFiles(videoDirectory);
    } catch (error) {
      if (errorCode(error) === 'ENOENT') {
        res
          .status(404)
          .json({ message: 'The local test video folder was not found.' });
        return;
      }
      res.status(500).json({ message: 'Could not access local test videos.' });
      return;
    }

    // Only videos discovered under testData with an allowed extension can be
    // served; the browser cannot supply an arbitrary filesystem path.
    const video = videos.find((candidate) => candidate.id === req.params.id);
    if (!video) {
      res.status(404).json({ message: 'Unknown proof-of-concept video.' });
      return;
    }

    try {
      const fileStats = await stat(video.filePath);
      if (!fileStats.isFile()) {
        res
          .status(404)
          .json({ message: 'The configured video is not a file.' });
        return;
      }
    } catch (error) {
      if (errorCode(error) === 'ENOENT') {
        res
          .status(404)
          .json({ message: 'The configured video file was not found.' });
        return;
      }

      res
        .status(500)
        .json({ message: 'Could not access the configured video.' });
      return;
    }

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.type(contentTypeFor(video.filePath));
    res.sendFile(video.filePath, (error) => {
      if (error && !res.headersSent) {
        res
          .status(500)
          .json({ message: 'Could not stream the configured video.' });
      }
    });
  });

  return router;
}
