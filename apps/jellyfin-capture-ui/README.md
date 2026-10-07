# Jellyfin Capture starter

This Nx app contains a mobile-friendly placeholder page and a small Express API. It does not connect to Jellyfin or Google Sheets yet.

## Run the development servers

From the repository root:

```bash
npm run start:jellyfin-capture
```

Open the Vite UI at <http://localhost:4300>. The API health endpoint is available at <http://localhost:4300/api/health> through the Vite proxy.

To open the dev UI from an Android device on the same network, use `http://<computer-lan-ip>:4300`. The Vite dev server listens on all network interfaces; allow the port through the host firewall if needed.

## Run as one service

```bash
npx nx serve jellyfin-capture-api
```

This builds the UI and serves it, along with the API, from Express at <http://localhost:4301>. For a device on the same network, use `http://<computer-lan-ip>:4301`. The API health endpoint is at `/api/health`.
