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
- `libs/` - Contains shared library projects

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

