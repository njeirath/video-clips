# Build the API and its dependent Vite UI from the Nx workspace.
FROM node:20-bookworm-slim AS builder
WORKDIR /workspace

COPY package.json package-lock.json nx.json tsconfig.base.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN NX_DAEMON=false npx nx build jellyfin-capture-api --configuration=production

# Install only the production dependencies emitted for this API project.
FROM node:20-bookworm-slim AS production-deps
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /workspace/dist/apps/jellyfin-capture-api/package.json ./package.json
COPY --from=builder /workspace/dist/apps/jellyfin-capture-api/package-lock.json ./package-lock.json
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# Small runtime image containing the API, UI assets, and production dependencies.
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4301 \
    UI_DIST_DIR=/app/dist/apps/jellyfin-capture-ui

COPY --from=production-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /workspace/dist/apps/jellyfin-capture-api/ ./
COPY --from=builder --chown=node:node /workspace/dist/apps/jellyfin-capture-ui/ ./dist/apps/jellyfin-capture-ui/

USER node
EXPOSE 4301
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:4301/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["node", "main.js"]
