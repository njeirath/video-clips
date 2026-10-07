import express from 'express';
import path from 'node:path';
import { fetchJellyfinSnapshot, JellyfinServiceError } from './jellyfin';

const app = express();
const host = process.env.HOST ?? '0.0.0.0';
const port = process.env.PORT ? Number(process.env.PORT) : 4301;
const uiDirectory =
  process.env.UI_DIST_DIR ??
  path.resolve(process.cwd(), 'dist/apps/jellyfin-capture-ui');

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
