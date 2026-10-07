# Jellyfin Capture API

## Project and tools

- Nx project `jellyfin-capture-api`; TypeScript, Express, Node.js, Google Sheets API (`googleapis`), and Vitest.
- Main server: `src/main.ts`. Jellyfin integration: `src/jellyfin.ts`. Record validation/mapping: `src/capture-record.ts`. Sheets append: `src/sheets.ts`.
- Follow the repository-level Nx instructions; run project tasks through `nx`.

## Behavior and safeguards

- `GET /api/health` is the liveness endpoint; `GET /api/sessions` returns a Jellyfin session/position snapshot; `POST /api/records` validates and appends a capture.
- Keep Jellyfin and Google credentials server-side. Never commit or log API keys or service-account JSON. In Docker, root `.env` supplies runtime variables and the service-account directory is mounted read-only.
- The Jellyfin capture route (`POST /api/records`) remains append-only and preserves the existing `Shows` (`A:K`) and `Movies` (`A:I`) column order. The dedicated processing routes may update only the existing row's timing/metadata cells (`Shows` `D:J`, `Movies` `B:H`), and must verify the row revision and blank `End` before updating. Do not create test records in the live spreadsheet; mock Sheets calls in tests.
- Jellyfin URL defaults to `http://192.168.0.7:8096`; `JELLYFIN_API_KEY` is required. Sheets uses `SHEET_ID` and `CREDENTIAL_PATH` (Docker path: `/run/secrets/google-service-account.json`). Media sources are restricted to `/mnt/nfs`; Docker mounts that tree read-only, while local development may map it with `MEDIA_BASE_PATH`. See `../jellyfin-capture-ui/README.md` for setup and exact sheet columns.

## Useful commands (from repository root)

- `npx nx test jellyfin-capture-api`
- `npx nx typecheck jellyfin-capture-api`
- `npx nx build jellyfin-capture-api --configuration=production` (also builds the UI)
- `npx nx serve jellyfin-capture-api` (API and built UI on port 4301)
- `docker compose build jellyfin-capture` (builds the service image; Compose run/config instructions are in the UI README)
