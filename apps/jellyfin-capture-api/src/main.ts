import express from 'express';
import path from 'node:path';
import { CaptureValidationError } from './capture-record';
import { fetchJellyfinSnapshot, JellyfinServiceError } from './jellyfin';
import {
  appendCapture,
  findCaptureHistory,
  SheetsServiceError,
} from './sheets';
import { createProcessingRouter } from './processing-routes';
import { createVideoPocRouter } from './video-poc';

const app = express();
const host = process.env.HOST ?? '0.0.0.0';
const port = process.env.PORT ? Number(process.env.PORT) : 4301;
const uiDirectory =
  process.env.UI_DIST_DIR ??
  path.resolve(process.cwd(), 'dist/apps/jellyfin-capture-ui');

app.use(express.json({ limit: '16kb' }));

if (process.env.VIDEO_POC_ENABLED === 'true') {
  app.use('/api/poc', createVideoPocRouter());
}
app.use('/api/processing', createProcessingRouter());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'jellyfin-capture-api' });
});

app.get('/api/sessions', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  try {
    res.json(await fetchJellyfinSnapshot());
  } catch (error) {
    const statusCode =
      error instanceof JellyfinServiceError ? error.statusCode : 502;
    const message =
      error instanceof Error
        ? error.message
        : 'The Jellyfin sessions could not be loaded.';

    res.status(statusCode).json({ message });
  }
});

app.post('/api/records/matches', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  try {
    res.json(await findCaptureHistory(req.body));
  } catch (error) {
    const statusCode =
      error instanceof CaptureValidationError
        ? 400
        : error instanceof SheetsServiceError
        ? error.statusCode
        : 502;
    const message =
      error instanceof Error
        ? error.message
        : 'Could not load saved capture history.';

    res.status(statusCode).json({ message });
  }
});

app.post('/api/records', async (req, res) => {
  try {
    // appendCapture validates the payload before making an API request.
    const result = await appendCapture(req.body);
    res.status(201).json({ status: 'ok', sheetName: result.sheetName });
  } catch (error) {
    const statusCode =
      error instanceof CaptureValidationError
        ? 400
        : error instanceof SheetsServiceError
        ? error.statusCode
        : 502;
    const message =
      error instanceof Error
        ? error.message
        : 'The record could not be saved to Google Sheets.';

    res.status(statusCode).json({ message });
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

app.use(express.static(uiDirectory));
app.get('*', (_req, res) => {
  res.sendFile(path.join(uiDirectory, 'index.html'));
});

app.listen(port, host, () => {
  console.log(`[ready] Jellyfin Capture listening at http://${host}:${port}`);
});
