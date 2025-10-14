# Copilot Instructions for video-clips

This repository is an Nx monorepo for video clips applications and infrastructure. Use these instructions to help AI coding agents be productive and follow project conventions.

## Architecture Overview

- **Monorepo managed by Nx**: All apps and libraries are in a single repo. Use Nx CLI (`npx nx ...`) for all builds, tests, and code generation.
- **Apps**:
  - `apps/frontend/`: React 19 app (Vite, React Router 6, TypeScript). Entry: `src/main.tsx`, main app: `src/app/app.tsx`.
  - `apps/backend/`: Node.js backend (TypeScript, Express, Apollo GraphQL, planned). Entry: `src/main.ts`.
  - `apps/cdk/`: AWS CDK app (TypeScript) for infrastructure. Entry: `bin/cdk.ts`, stacks in `lib/`.
- **Shared code**: Place reusable code in `libs/` (currently empty, but intended for cross-app logic).

## Key Workflows

- **Start frontend**: `npx nx serve frontend` (or `npm start`)
- **Build all projects**: `npm run build` or `npx nx build <project>`
- **Test**: `npx nx test <project>` (Vitest for frontend, Jest for backend)
- **Lint**: `npx nx lint <project>` (no linter configured by default)
- **Generate code**: Use Nx generators, e.g. `npx nx g @nx/react:component my-component --project=frontend`
- **Visualize dependencies**: `npx nx graph`

## Project Conventions

- **No linter**: Linting is disabled (`linter: none`). Use Prettier for formatting (`.prettierrc`).
- **Testing**: Frontend uses Vitest + React Testing Library (`src/app/app.spec.tsx`). Backend uses Jest (`src/main.spec.ts`).
- **Routing**: React Router 6 in frontend (`src/app/app.tsx`).
- **Styling**: CSS modules and global styles in `src/` and `src/app/`.
- **Forms**: Use `react-hook-form` library for all form validation in the frontend. This provides better performance and cleaner validation logic.
- **GraphQL**: Frontend GraphQL codegen in `src/app/gql/` (see `gql.ts`, `graphql.ts`).
- **Infrastructure**: CDK stacks in `apps/cdk/lib/`. Deploy via CDK CLI or Nx.
- **Ports**: Frontend runs on 4200, backend (when available) on 3000 (`/graphql`).

## Nx-Specific Guidance

- **Always use Nx CLI** for builds, tests, and code generation. Avoid direct use of underlying tools (see `AGENTS.md`).
- **Check project details**: `npx nx show project <name>`
- **Use affected commands**: `npx nx affected:test` to test only changed projects.
- **Generators**: Prefer Nx generators for new apps, libs, and components. Example:
  - `npx nx g @nx/js:library my-lib`
  - `npx nx g @nx/web:application my-web-app`

## Integration & Patterns

- **Frontend-backend integration**: Planned via GraphQL (Apollo). No direct API calls yet.
- **CDK**: Infrastructure as code for AWS. Stacks are modular (`cdk-stack.ts`, `ses-stack.ts`).
- **Shared code**: Place in `libs/` for reuse across apps.

## References

- See `README.md` and `AGENTS.md` for more details and up-to-date conventions.
- Example config: `apps/frontend/vite.config.ts`, `apps/cdk/lib/cdk-stack.ts`

---
If any section is unclear or missing, please provide feedback to improve these instructions.
