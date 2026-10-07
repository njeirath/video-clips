import express from 'express';
import path from 'node:path';

const app = express();
const host = process.env.HOST ?? '0.0.0.0';
const port = process.env.PORT ? Number(process.env.PORT) : 4301;
const uiDirectory =
  process.env.UI_DIST_DIR ??
  path.resolve(process.cwd(), 'dist/apps/jellyfin-capture-ui');

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'jellyfin-capture-api' });
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
