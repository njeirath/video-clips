# Jellyfin Capture UI

## Project and tools

- Nx project `jellyfin-capture-ui`; React, TypeScript, Vite, and Vitest/Testing Library.
- Main screen: `src/app/app.tsx`; component styles: `src/app/app.module.css`; global styles: `src/styles.css`.
- Follow repository-level Nx instructions and use Nx targets for builds, tests, and typechecks.

## UI and API contract

- Keep the UI mobile-first and use same-origin `/api` requests. Never call Jellyfin directly from the browser or put credentials in frontend code.
- Vite listens on `0.0.0.0:4300` and proxies `/api` to the API at `127.0.0.1:4301`. In production, Express serves the built UI alongside the API.
- The app loads a frozen Jellyfin snapshot, includes paused sessions, auto-selects a sole stream, and allows manual selection when there are several. Position changes are local one-second adjustments; Refresh explicitly requests a new snapshot.
- The Jellyfin capture screen appends rows to `Shows` or `Movies`. The clip processor at `/process` updates only the selected pending row's timing and metadata through the dedicated processing API. Keep both API contracts and UI tests in sync; do not change the capture screen's append behavior.
- See `README.md` for Jellyfin/Sheets configuration, Docker Compose setup, and record-column details.

## Useful commands (from repository root)

- `npm run start:jellyfin-capture` (starts the Vite UI on port 4300 and API on port 4301)
- `npx nx test jellyfin-capture-ui`
- `npx nx typecheck jellyfin-capture-ui`
- `npx nx build jellyfin-capture-ui`
- `npx nx serve jellyfin-capture-api` (serves the production-built UI with the API on port 4301)
