# Backend Docker image

Build the backend Docker image from the repository root:

```bash
docker build -f apps/backend/Dockerfile -t video-clips-backend:latest .
```

Run (exposes port 3020 by default):

```bash
docker run -p 3020:3020 -e PORT=3020 video-clips-backend:latest
```

Notes:
- The Dockerfile uses a multi-stage build and runs the Nx build for the `backend` project. It expects `package-lock.json` to exist at the repo root. If your workspace uses pnpm or yarn, adjust the Dockerfile accordingly.
