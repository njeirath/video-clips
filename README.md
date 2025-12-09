# video-clips

A monorepo for video clips applications and libraries, powered by [Nx](https://nx.dev).

## Features

- 🎬 **Video Clip Management**: Add, view, and manage video clips
- 📹 **Video File Upload**: Upload video files directly to S3 with CloudFront delivery
- 🔐 **Authentication**: AWS Cognito integration for secure user authentication
- 📊 **OpenSearch Backend**: Scalable data storage using OpenSearch
- 🚀 **GraphQL API**: Type-safe API with TypeGraphQL
- ⚛️ **React Frontend**: Modern React 19 app with Material-UI
- 🏗️ **Infrastructure as Code**: AWS CDK for cloud infrastructure
- 🔗 **Rich Link Previews**: Open Graph and Twitter Card meta tags for social sharing

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- npm (v10 or higher)

### Installation

```bash
npm install
```

## Monorepo Structure

This repository uses Nx as a build system with a focus on monorepo development:

- `apps/` - Contains application projects
  - `frontend/` - React frontend application
  - `backend/` - Node.js backend with GraphQL API
- `libs/` - Contains shared library projects

## Applications

### Frontend

A React application built with Vite and React Router.

**Features:**
- Video clip browsing and search
- Share button to copy shareable links with rich preview support
- Video playback on demand
- Real-time search with debouncing

**Start the frontend:**
```bash
npx nx serve frontend
```

### Backend

A Node.js application with TypeScript that provides a GraphQL API using Apollo Server and TypeGraphQL.

**Features:**
- GraphQL API with type-safe resolvers
- JWT-based authentication using AWS Cognito
- OpenSearch integration for video clips storage
- Video clip management (create, list)
- S3 presigned URL generation for secure video uploads
- Video file storage with CloudFront delivery
- **Automatic generation of static HTML pages with Open Graph and Twitter Card meta tags for rich link previews**

**Start the backend:**
```bash
npx nx serve backend
```

The GraphQL endpoint will be available at `http://localhost:3020/graphql`.

**Rich Link Previews:**
When creating a video clip, the backend automatically generates a static HTML page with Open Graph and Twitter Card meta tags. This page is uploaded to S3 and served via CloudFront, enabling rich previews in messaging apps and social media platforms without requiring JavaScript execution. See [docs/OPEN_GRAPH_META_TAGS.md](docs/OPEN_GRAPH_META_TAGS.md) for details.

**Example GraphQL queries:**

```graphql
# Get hello message
{
  hello
}

# Get all video clips
{
  videoClips {
    id
    name
    description
    userId
    createdAt
  }
}

# Create a video clip (requires authentication)
mutation CreateVideoClip($input: CreateVideoClipInput!) {
  createVideoClip(input: $input) {
    id
    name
    description
    userId
    s3Key
    videoUrl
    createdAt
  }
}

# Generate presigned URL for video upload (requires authentication)
mutation GenerateUploadUrl($fileName: String!, $contentType: String!) {
  generateUploadUrl(fileName: $fileName, contentType: $contentType) {
    uploadUrl
    s3Key
    videoUrl
  }
}
```

## Available Commands

### Development

- `npm start` - Serve the default application
- `npm run build` - Build the default project
- `npm test` - Run tests
- `npm run e2e` - Run end-to-end tests
- `npm run e2e:ui` - Run E2E tests in interactive UI mode
- `npm run lint` - Lint the code

### Nx Commands

- `npm run affected` - Run commands only on projects affected by changes
- `npm run graph` - Show the dependency graph of the workspace

### End-to-End Testing

The repository includes comprehensive E2E tests using Playwright that test critical user journeys:

- Home page video clips display
- Search functionality with debouncing
- Filter by shows and characters
- Combined search and filters
- Sort functionality

**Prerequisites for E2E tests:**
- Docker and Docker Compose (to run OpenSearch with sample data)

**Setup and run E2E tests:**
```bash
# One-time setup: Start OpenSearch and seed sample data
npm run e2e:setup

# Run E2E tests
npm run e2e

# Or run in UI mode for debugging
npm run e2e:ui
```

The E2E tests run against the actual GraphQL backend connected to OpenSearch, ensuring complete integration testing with realistic data.

For more details, see [apps/frontend-e2e/README.md](apps/frontend-e2e/README.md).

### Using Nx Directly

You can also use Nx directly for more advanced commands:

```bash
# Run a specific task for a specific project
npx nx <target> <project>

# Example: build a specific app
npx nx build my-app

# Run affected tests
npx nx affected:test

# View the dependency graph
npx nx graph
```

## Creating New Projects

### Create a new application

```bash
npx nx g @nx/node:application my-app
# or for a web app
npx nx g @nx/web:application my-app
```

### Create a new library

```bash
npx nx g @nx/js:library my-lib
```

## Backend Scripts

### Cleanup S3 Script

This script helps you identify and optionally clean up unused S3 objects related to video clips.

**Build the backend first:**
```bash
npx nx build backend
```

**Run the cleanup script (dry run):**
```bash
ENV_PATH=apps/backend/.env node dist/backend/apps/backend/scripts/cleanup-s3.js --dry-run
```

- Remove `--dry-run` to actually delete unused S3 objects.

### Process Clips Script

This script processes a CSV of video clips, downloads source files, trims videos, generates thumbnails and blurhashes, uploads to S3, and registers clips in the backend.

**Build the backend first:**
```bash
npx nx build backend
```

**Run the process-clips script:**
From the root of the repository:
```bash
node dist/backend/apps/backend/scripts/process-clips.js
```

The script utilizes two environment variables:
- Must set `GRAPHQL_AUTH_TOKEN` in the shell with a valid cognito ID token for the targeted environment
- Can set `ENDPOINT_HOST` to specify which environment to target (default: `localhost`)
- Make sure your `.env` file is configured with the necessary credentials and endpoints.
- The script expects the CSV file at `apps/backend/Video Clips - Sheet1.csv`.
- See comments in `apps/backend/scripts/process-clips.ts` for configuration details.

## Learn More

- [Nx Documentation](https://nx.dev)
- [Nx Tutorial](https://nx.dev/getting-started/intro)

## Docker / Production (compose)

The repository includes a production-oriented Docker Compose file at `docker-compose.prod.yml`. It builds the `backend` and `frontend` images from `apps/backend` and `apps/frontend` respectively, and runs an embedded OpenSearch instance for easy single-host deployments or testing.

Quick notes:
- The frontend uses an entrypoint script to write `/runtime-config.js` from the `GRAPHQL_URI` environment variable at container start. `docker-compose.prod.yml` sets this to `http://backend:3020/graphql` by default so the SPA points to the backend on the same Docker network.
- The backend listens on port `3020` and exposes the GraphQL endpoint at `/graphql`.
- OpenSearch runs on port `9200` and data is persisted to the `opensearch-data` Docker volume.

Validate the compose file:
```bash
docker compose -f docker-compose.prod.yml config
```

Start services (builds frontend/backend images from the `apps/*` folders):
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

View running containers and health status:
```bash
docker compose -f docker-compose.prod.yml ps
```

Tail logs for a specific service:
```bash
docker compose -f docker-compose.prod.yml logs -f opensearch
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

Quick smoke checks:
- Backend GraphQL: http://localhost:3020/graphql
- Frontend UI: http://localhost:4200
- OpenSearch: http://localhost:9200

Production considerations and recommendations:

- For production you should build images in CI and use tagged images (don't build on the host at deploy-time). Replace the `build:` section in compose with `image: your-repo/video-clips-backend:tag` and `image: your-repo/video-clips-frontend:tag`.
- Use a managed OpenSearch/Elasticsearch service or a dedicated cluster for reliability and scale; running OpenSearch on the same host is useful for demos and testing but not recommended for production-grade deployments.
- Store secrets (Cognito client IDs, OpenSearch credentials if enabled, S3 keys) in a secrets manager or use Docker secrets; do not commit them into the repo or use plain env vars for long-term production deployments.
- Consider placing an authenticated reverse proxy (TLS termination) in front of the frontend/backend, or use a cloud load balancer.

If you'd like, I can add a small `docker/` README snippet, a `.env.prod.example` file for commonly needed environment variables, or modify the compose to use prebuilt images from a registry.

### Environment files and credentials

For local testing you can provide AWS credentials and other runtime environment variables via an env file. The repository contains an example at `apps/backend/.env.prod.example`.

1. Copy the example to a local file that is ignored by git:

```bash
cp apps/backend/.env.prod.example apps/backend/.env.prod.local
# Edit apps/backend/.env.prod.local and fill in real values (DO NOT commit this file)
```

2. Tell Docker Compose to load the file when starting the backend service by either:

- Adding an `env_file` entry to `docker-compose.prod.yml` (local only):

```yaml
services:
  backend:
    env_file:
      - ./apps/backend/.env.prod.local
```

- Or exporting environment variables in your shell before running compose:

```bash
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
docker compose -f docker-compose.prod.yml up -d --build
```

Security notes:
- Never commit real credentials. The `.gitignore` has been updated to ignore common `.env` patterns and `apps/backend/.env.prod.local`.
- For production, prefer assigning an IAM role to the host or task (ECS task role, EC2 instance profile, or EKS IRSA) so the app uses temporary credentials provided by the platform.


