````markdown
# Frontend Docker image

Build the frontend Docker image from the repository root:

```bash
docker build -f apps/frontend/Dockerfile -t video-clips-frontend:latest .
```

- Run (exposes port 4200 by default):

```bash
docker run -p 4200:80 video-clips-frontend:latest
```

Runtime configuration:
- The image contains an entrypoint that will write `runtime-config.js` from the `GRAPHQL_URI` environment variable at container start. This lets you point the SPA at a different backend without rebuilding the image.

Example (set runtime GraphQL endpoint at container start):

```bash
docker run -p 4200:80 -e GRAPHQL_URI="https://api.example.com/graphql" video-clips-frontend:latest
```

Notes:
- The Dockerfile uses a multi-stage build: it runs the frontend build (Vite) in a Node builder stage and then copies the `dist` into an `nginx` runner image. The container serves the files on port 80 inside the image; we map host port 4200 to container port 80 above.
- The build step relies on `npm run build` being available in `apps/frontend/package.json`. If your workspace uses a different package manager (pnpm/yarn), adjust the Dockerfile accordingly.

````
