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

- **Shows** (`A:K`): `Show`, `Season`, `Episode`, `Start`, `End`, `name`, `description`, `script`, `characters`, `tags`, `source`. Episode records fill Show from Jellyfin's series name, Season and Episode as integers, Start as `HH:MM:SS`, and source with the file path when Jellyfin provides it. Other cells are left blank.
- **Movies** (`A:I`): `Title`, `Start`, `End`, `name`, `description`, `script`, `characters`, `tags`, `source`. Movie records fill Title, Start as `HH:MM:SS`, and source when available. Other cells are left blank.

Writes use the Sheets API append operation with row insertion enabled. The app does not update, clear, or rewrite existing data. Only Jellyfin items typed as an episode or movie can be saved; an episode must include series, season, and episode metadata. If Jellyfin does not expose a file path, `source` is appended as an empty cell.

## Run in development

From the repository root, with the environment variables set:

```bash
npm run start:jellyfin-capture
```

Open the Vite UI at <http://localhost:4300>. The API health endpoint is available at <http://localhost:4300/api/health> through the Vite proxy.

To use it from an Android device on the same network, open `http://<computer-lan-ip>:4300`. The Vite server listens on all network interfaces; allow the port through the host firewall if needed.

## Run as one service

```bash
npx nx serve jellyfin-capture-api
```

This builds the UI and serves it with the API from Express at <http://localhost:4301>. For a device on the same network, use `http://<computer-lan-ip>:4301`. The health endpoint is at `/api/health`.

## Playback snapshot behavior

- On page load, `GET /api/sessions` requests Jellyfin's `/Sessions` endpoint once. Paused sessions with a current media item are included.
- A single stream is selected automatically; with multiple streams, select one from the list.
- The displayed position is frozen from that response. Use Refresh to request a new snapshot; it will warn before discarding unsaved position adjustments.
- Position adjustments are in one-second increments and are clamped to zero and, when known, the media duration.
- Episode, season, series, title, user/device, duration, and file path are returned when Jellyfin provides them. The path may be omitted by Jellyfin or its permissions.

Keep the service on your trusted LAN and do not expose it directly to the public internet. A browser home-screen shortcut can open the app on Android; a standalone installable PWA/HTTPS setup has not been added.
