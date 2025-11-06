# Multi-stage Dockerfile for frontend (Vite + React)

# Build stage
FROM node:20-slim AS builder
WORKDIR /workspace

# Copy workspace package files and nx config so the monorepo build works
COPY package.json package-lock.json nx.json tsconfig.base.json ./

# Copy the frontend app sources (no package.json inside apps/frontend in this repo)
COPY apps/frontend ./apps/frontend

RUN npm ci --silent

# Build the frontend using Nx
WORKDIR /workspace
RUN npx nx build frontend --configuration=production

# Production image served by nginx
FROM nginx:1.25-alpine AS runner
COPY --from=builder /workspace/dist/frontend /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint that can write runtime-config.js from env vars
COPY apps/frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 4200

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
