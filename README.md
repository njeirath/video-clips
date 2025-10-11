# video-clips

A monorepo for video clips applications and libraries, powered by [Nx](https://nx.dev).

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

**Start the frontend:**
```bash
npx nx serve frontend
```

### Backend

A Node.js application with TypeScript that provides a GraphQL API using Apollo Server.

**Start the backend:**
```bash
npx nx serve backend
```

The GraphQL endpoint will be available at `http://localhost:3000/graphql`.

**Example GraphQL queries:**

```graphql
# Get hello message
{
  hello
}

# Get all videos
{
  videos {
    id
    title
    description
    url
  }
}
```

## Available Commands

### Development

- `npm start` - Serve the default application
- `npm run build` - Build the default project
- `npm test` - Run tests
- `npm run lint` - Lint the code

### Nx Commands

- `npm run affected` - Run commands only on projects affected by changes
- `npm run graph` - Show the dependency graph of the workspace

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

## Learn More

- [Nx Documentation](https://nx.dev)
- [Nx Tutorial](https://nx.dev/getting-started/intro)

