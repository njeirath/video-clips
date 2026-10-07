import express from 'express';
import path from 'node:path';
import { createMediaAccessToken, getMediaSourceForToken } from './media-access';
import { MediaPathError, resolveReadableMediaFile } from './media-path';
import {
  isProcessingTab,
  ProcessingConflictError,
  ProcessingValidationError,
} from './processing-record';
import {
  findNextProcessingClip,
  SheetsServiceError,
  updateProcessedClip,
} from './sheets';

interface ProcessingRouteServices {
  findNext: typeof findNextProcessingClip;
  update: typeof updateProcessedClip;
}

function messageFor(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function statusFor(error: unknown, fallback = 502): number {
  if (error instanceof ProcessingValidationError) {
    return 400;
  }
  if (error instanceof ProcessingConflictError) {
    return 409;
  }
  if (error instanceof SheetsServiceError || error instanceof MediaPathError) {
    return error.statusCode;
  }
  return fallback;
}

export function createProcessingRouter(
  services: ProcessingRouteServices = {
    findNext: findNextProcessingClip,
    update: updateProcessedClip,
  }
): express.Router {
  const router = express.Router();

  router.get('/next', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const tab = req.query.tab;
    if (!isProcessingTab(tab)) {
      res.status(400).json({ message: 'The tab must be Shows or Movies.' });
      return;
    }

    try {
      const clip = await services.findNext(tab);
      if (!clip) {
        res.json({ clip: null });
        return;
      }

      let mediaUrl: string | null = null;
      let mediaError: string | null = null;
      if (!clip.source) {
        mediaError = 'This row has no source path.';
      } else {
        try {
          await resolveReadableMediaFile(clip.source);
          const token = createMediaAccessToken(clip.source);
          mediaUrl = `/api/processing/media/${token}`;
        } catch (error) {
          mediaError = messageFor(error, 'The source file is not available.');
        }
      }

      res.json({ clip: { ...clip, mediaUrl, mediaError } });
    } catch (error) {
      res
        .status(statusFor(error))
        .json({ message: messageFor(error, 'Could not load the next clip.') });
    }
  });

  router.put('/rows/:tab/:rowNumber', async (req, res) => {
    const tab = req.params.tab;
    if (!isProcessingTab(tab)) {
      res.status(400).json({ message: 'The tab must be Shows or Movies.' });
      return;
    }

    const rowNumber = Number(req.params.rowNumber);
    try {
      const result = await services.update(tab, rowNumber, req.body);
      res.json({ status: 'ok', ...result });
    } catch (error) {
      res
        .status(statusFor(error))
        .json({ message: messageFor(error, 'Could not save this clip.') });
    }
  });

  router.get('/media/:token', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const source = getMediaSourceForToken(req.params.token);
    if (!source) {
      res
        .status(404)
        .json({ message: 'This media link has expired. Reload the clip.' });
      return;
    }

    try {
      const media = await resolveReadableMediaFile(source);
      const extension = path.extname(media.filePath).toLowerCase();
      const contentType =
        extension === '.mkv'
          ? 'video/x-matroska'
          : extension === '.mp4'
          ? 'video/mp4'
          : 'application/octet-stream';
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.type(contentType);
      res.sendFile(media.filePath, (error) => {
        if (error && !res.headersSent) {
          res.status(500).json({ message: 'Could not stream the media file.' });
        }
      });
    } catch (error) {
      res
        .status(statusFor(error, 404))
        .json({ message: messageFor(error, 'The media file is unavailable.') });
    }
  });

  return router;
}
