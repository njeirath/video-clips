<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->

## Jellyfin Capture apps

- `apps/jellyfin-capture-api/` is the TypeScript/Express backend. It reads Jellyfin sessions, appends validated captures, and serves the clip-processing queue/update API for Google Sheets; keep API keys and service-account credentials server-side. See its `AGENTS.md` for routes, configuration, and commands.
- `apps/jellyfin-capture-ui/` is the mobile-friendly React/Vite frontend. It uses the backend’s `/api` routes; Vite runs on port 4300 and proxies API requests to port 4301. See its `AGENTS.md` for UI behavior and commands.
