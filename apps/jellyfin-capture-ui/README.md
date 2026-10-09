# Jellyfin Capture

A mobile-friendly LAN web app for capturing a playback-position snapshot from Jellyfin and appending it to Google Sheets. The app supports choosing a stream, adjusting its frozen position, and saving TV episodes to the `Shows` tab or movies to the `Movies` tab.

## Configure Jellyfin

The API service reads the Jellyfin API key from its environment. Do not put the key in frontend code or commit it to the repository.

```bash
export JELLYFIN_API_KEY='your-jellyfin-api-key'
export JELLYFIN_URL='http://192.168.0.7:8096' # optional; this is the default
```

The backend makes the authenticated request to Jellyfin; the browser never receives the API key. The key is sent only from the API service to the Jellyfin server.

## Configure Google Sheets

Set the spreadsheet ID and the path to a service-account JSON credential file on the API service:

```bash
export SHEET_ID='your-google-spreadsheet-id'
export CREDENTIAL_PATH='/absolute/path/to/service-account.json'
```

Enable the Google Sheets API in the Google Cloud project for the service account, and share the existing spreadsheet with the service-account email address as an Editor. Keep the credential file outside the repository and do not commit it. A relative `CREDENTIAL_PATH` is resolved from the API process working directory.

The spreadsheet must already contain tabs named exactly `Shows` and `Movies`. The app uses the existing column order:

- **Shows** (`A:K`): `Show`, `Season`, `Episode`, `Start`, `End`, `name`, `description`, `script`, `characters`, `tags`, `source`. Episode captures fill Show from Jellyfin's series name, Season and Episode as integers, Start as `HH:MM:SS`, and source with the file path when Jellyfin provides it. Clip processing replaces Start and fills End with exact `HH:MM:SS.mmm` timecodes.
- **Movies** (`A:I`): `Title`, `Start`, `End`, `name`, `description`, `script`, `characters`, `tags`, `source`. Movie captures fill Title, Start as `HH:MM:SS`, and source when available. Clip processing replaces Start and fills End with exact `HH:MM:SS.mmm` timecodes.

The Jellyfin capture screen appends new rows and leaves existing rows unchanged. The clip processor updates only the selected row's `Start`, `End`, `name`, `description`, `script`, `characters`, and `tags` cells; it preserves the row identity and `source`. Capture-history and processing reads, appends, and updates all use the API's server-side service-account configuration.

## Media files

Processing reads the original media files from the media-server filesystem. Sheet `source` paths are expected to be absolute paths under `/mnt/nfs`. Docker Compose mounts the host `/mnt/nfs` at the same container path, read-only. Ensure the NFS mount is active before starting the service and that the configured container UID/GID can traverse and read it.

For local development outside Docker, set `MEDIA_BASE_PATH` to the repository's `testData` directory. For example:

```bash
MEDIA_BASE_PATH="$(pwd)/testData" npm run start:jellyfin-capture
```

A sheet path such as `/mnt/nfs/Shows/.../episode.mkv` then resolves under `testData/mnt/nfs/Shows/.../episode.mkv`. For local Docker testing instead, set `MEDIA_HOST_PATH=./testData/mnt/nfs` in `.env`; Compose mounts that directory at `/mnt/nfs`, so leave `MEDIA_BASE_PATH` unset. Neither mode copies or downloads media files.

## Run in development

From the repository root, with the environment variables set:

```bash
npm run start:jellyfin-capture
```

Open the Vite UI at <http://localhost:4300>. The API health endpoint is available at <http://localhost:4300/api/health> through the Vite proxy.

To use it from an Android device on the same network, open `http://<computer-lan-ip>:4300`. The Vite server listens on all network interfaces; allow the port through the host firewall if needed.

## Clip timing proof of concept

The local-only timing editor is available at `http://127.0.0.1:4300/poc` when started with:

```bash
npm run start:video-poc
```

This starts the UI and API bound to `127.0.0.1`, and enables a small API route that streams local test media with byte-range support so Chrome can seek. It does not call Jellyfin or Google Sheets and does not download files. The Shows/Movies selector at the top remembers the choice locally, but is not connected to a sheet queue yet. The existing app remains at `http://127.0.0.1:4300/`.

Put `.mkv` and `.mp4` test files anywhere under the root `testData/` folder. The proof of concept lists them recursively and shows their relative paths; these large local media files are ignored by Git. The current fixture is `testData/mnt/nfs/Shows/The Office - US/S01/S01E02.mkv`.

The editor uses Chrome's presented-frame callback when available to display the timestamp for the frame currently shown. Play the video briefly to estimate a typical frame interval, then use the one-frame controls to refine Start and End. If needed, enter a frame-step interval in milliseconds manually. The output preview shows the decimal timecodes (`HH:MM:SS.mmm`) only; no spreadsheet calls are made. Browser support for MKV depends on the container's codecs, so playback errors are useful POC results rather than a converted-file fallback.

## Clip processor

Open `http://localhost:4300/process` in development, or `/process` on the deployed service. The remembered Shows/Movies selector scopes the queue to the first top-to-bottom row with a blank `End`. The processor loads that row's `source`, starts at its approximate `Start`, and saves exact `Start`/`End` plus metadata back to the same row. Use **Reload queue** to fetch current rows directly from Google Sheets, bypassing the API's in-memory cache; reloading discards unsaved edits to the current clip. Use **Save & Next** to continue through the selected tab. Rows without a readable `source` remain visible with an error instead of being silently skipped.

## Run as one service

```bash
npx nx serve jellyfin-capture-api
```

This builds the UI and serves it with the API from Express at <http://localhost:4301>. For a device on the same network, use `http://<computer-lan-ip>:4301`. The health endpoint is at `/api/health`.

## Run with Docker Compose

The `jellyfin-capture` service is available in both `docker-compose.yml` and `docker-compose.prod.yml`; use one Compose file at a time. From the repository root, copy the template to the ignored `.env` file and edit it:

```bash
cp .env.example .env
```

Both Compose files load the root `.env` into the service environment. Compose also reads it for host port and UID/GID interpolation. The `.env` file is gitignored; do not commit real credentials.

`JELLYFIN_API_KEY` is required for Jellyfin access. `SHEET_ID` is only needed for Google Sheets saving. To enable Sheets, place the service-account JSON at `apps/jellyfin-capture-api/secrets/google-service-account.json` (create the directory if needed); this local secrets directory is excluded from git and mounted read-only in the container. Compose sets `CREDENTIAL_PATH` to `/run/secrets/google-service-account.json` inside the container, so do not set it to a host filesystem path. The container runs as the non-root UID/GID `1000:1000` by default; if the credential file is only readable by your host account, set `JELLYFIN_CAPTURE_UID` and `JELLYFIN_CAPTURE_GID` to the numeric values from `id -u` and `id -g`.

Build and start just the capture service from the default Compose file:

```bash
docker compose up -d --build jellyfin-capture
```

Or start it alongside the production stack:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Check its status and logs with:

```bash
docker compose ps jellyfin-capture
docker compose logs -f jellyfin-capture
```

Open `http://<computer-lan-ip>:4301` from a device on the same network. To change the host port, set `JELLYFIN_CAPTURE_PORT` in `.env`. The container healthcheck uses `/api/health` and does not require Jellyfin or Sheets credentials to be configured.

## Playback snapshot behavior

- On page load, `GET /api/sessions` requests Jellyfin's `/Sessions` endpoint once. Paused sessions with a current media item are included.
- A single stream is selected automatically; with multiple streams, select one from the list.
- The displayed position is frozen from that response. Use Refresh to request a new snapshot; it will warn before discarding unsaved position adjustments.
- Position adjustments are in one-second increments and are clamped to zero and, when known, the media duration.
- Episode, season, series, title, user/device, duration, and file path are returned when Jellyfin provides them. The path may be omitted by Jellyfin or its permissions.

## Saved-position history

- Capture history is requested only after a supported movie or episode is selected; an empty stream list does not read Google Sheets.
- The backend reads only the relevant tab (`Shows` or `Movies`), filters rows to the same series/season/episode or movie title, and returns those saved positions. The browser displays only entries within 60 seconds of the currently adjusted position, closest first; changing the position does not trigger more Sheets requests.
- Rows for each tab are cached in the API process for up to 60 seconds and the relevant cache is invalidated after a successful append or processing update. The processing page's **Reload queue** action bypasses that cache, so direct Google Sheets edits are visible when it completes; other cached reads may take up to one minute to reflect external edits.
- The Sheets Values API reads ranges rather than filtering by cell values, so the backend scans the selected tab’s rows. For a personal capture log this avoids reading the workbook on every page load while keeping the implementation simple.

Keep the service on your trusted LAN and do not expose it directly to the public internet. A browser home-screen shortcut can open the app on Android; a standalone installable PWA/HTTPS setup has not been added.
