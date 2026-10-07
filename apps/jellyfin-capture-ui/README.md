# Jellyfin Capture

A mobile-friendly LAN web app for capturing a playback-position snapshot from Jellyfin. The app currently reads Jellyfin sessions and supports choosing a stream and adjusting its position. Google Sheets saving is not integrated yet, so the save button is intentionally disabled.

## Configure Jellyfin

The API service reads the Jellyfin API key from its environment. Do not put the key in frontend code or commit it to the repository.

```bash
export JELLYFIN_API_KEY='your-jellyfin-api-key'
export JELLYFIN_URL='http://192.168.0.7:8096' # optional; this is the default
```

The backend makes the authenticated request to Jellyfin; the browser never receives the API key. The key is sent only from the API service to the Jellyfin server.

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
