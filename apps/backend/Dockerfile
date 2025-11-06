# Multi-stage Dockerfile for the backend
# 1) Build stage - uses node to install deps and build the project via nx/esbuild
# 2) Runtime stage - minimal node image with built dist, package.json and workspace modules

FROM node:20-slim AS builder
WORKDIR /workspace

# Install deps
COPY package.json package-lock.json ./
COPY nx.json tsconfig.base.json ./
COPY apps/backend/project.json ./apps/backend/project.json
COPY apps/backend/tsconfig.app.json ./apps/backend/tsconfig.app.json
COPY apps/backend/tsconfig.json ./apps/backend/tsconfig.json
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/scripts ./apps/backend/scripts

RUN npm ci --legacy-peer-deps --silent

# Build the backend using nx/esbuild config
RUN npx nx build backend --configuration=production

# Production image
FROM node:20-slim AS runner
WORKDIR /app

# Copy built files
COPY --from=builder /workspace/dist/backend ./
COPY --from=builder /workspace/dist/backend/package.json ./package.json

# Copy lockfile from workspace root so we can install exact prod deps
COPY package-lock.json ./package-lock.json

# Install only production dependencies
RUN npm ci --omit=dev --silent

ENV NODE_ENV=production
EXPOSE 3020

# Run the compiled entrypoint
CMD ["node", "main.js"]
