# Copilot Instructions for video-clips

This repository is a monorepo for video clips applications and libraries, powered by [Nx](https://nx.dev).

## Project Structure

This is an Nx monorepo with the following structure:

- `apps/` - Application projects
  - `frontend/` - React frontend application (Vite + React Router)
  - `backend/` - Node.js backend with GraphQL API (to be added)
- `libs/` - Shared library projects (currently empty)

## Technology Stack

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: React Router 6
- **Testing**: Vitest with React Testing Library
- **Language**: TypeScript

### Backend (planned)
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **GraphQL**: Apollo Server 5
- **Build Tool**: esbuild (via Nx)
- **Testing**: Jest

## Development Commands

### Running Applications
```bash
# Start frontend (default)
npm start
# or
npx nx serve frontend

# Start backend (when available)
npx nx serve backend
```

### Building
```bash
# Build all projects
npm run build

# Build specific project
npx nx build frontend
```

### Testing
```bash
# Run all tests
npm test

# Run tests for specific project
npx nx test frontend

# Run affected tests only
npx nx affected:test
```

### Linting
```bash
# Lint all projects
npm run lint

# Lint specific project
npx nx lint frontend
```

## Code Style

- This project uses **Prettier** for code formatting
- Configuration is in `.prettierrc`
- No linter is configured (Nx generators set to `linter: none`)
- Follow existing code conventions in the repository

## Nx Conventions

### Project Generators
When creating new projects, use Nx generators:

```bash
# Create a new application
npx nx g @nx/node:application my-app
npx nx g @nx/web:application my-web-app

# Create a new library
npx nx g @nx/js:library my-lib

# Create React components
npx nx g @nx/react:component my-component
```

### Working with Nx
- Use `npx nx show project <name>` to see project details
- Use `npx nx graph` to visualize project dependencies
- Use `npx nx affected` commands to work only with changed code
- Nx caches build, lint, and test targets for better performance

## Prerequisites

- Node.js (v20 or higher)
- npm (v10 or higher)

## Important Notes

- Always run `npm install` after cloning or pulling changes
- The monorepo uses Nx's caching to speed up builds and tests
- Frontend runs on port 4200 by default
- Backend will run on port 3000 (GraphQL endpoint at `/graphql`)
- Vite configuration is in `apps/frontend/vite.config.ts`

## When Making Changes

1. Use Nx commands (`npx nx`) for consistency with the monorepo setup
2. Run affected tests before committing: `npx nx affected:test`
3. Follow TypeScript best practices
4. Keep components focused and reusable
5. Place shared code in the `libs/` directory
