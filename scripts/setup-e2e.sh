#!/bin/bash

# Script to set up OpenSearch for E2E testing
# This script starts OpenSearch in Docker and seeds it with sample data

set -e

echo "🚀 Starting OpenSearch for E2E testing..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Error: Docker Compose is not installed"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# Start OpenSearch using Docker Compose
echo "📦 Starting OpenSearch container..."
if docker compose version &> /dev/null; then
    docker compose up -d opensearch
else
    docker-compose up -d opensearch
fi

# Wait for OpenSearch to be healthy
echo "⏳ Waiting for OpenSearch to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:9200/_cluster/health > /dev/null 2>&1; then
        echo "✅ OpenSearch is ready!"
        break
    fi
    attempt=$((attempt + 1))
    echo "   Attempt $attempt/$max_attempts..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Error: OpenSearch failed to start within the expected time"
    exit 1
fi

# Start the backend to create the index
echo "🔧 Starting backend to create OpenSearch index..."
npx nx serve backend &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:3000/graphql > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    attempt=$((attempt + 1))
    echo "   Attempt $attempt/$max_attempts..."
    sleep 2
done

# Give backend a moment to create the index
sleep 3

# Stop the backend
echo "🛑 Stopping backend..."
kill $BACKEND_PID 2>/dev/null || true
wait $BACKEND_PID 2>/dev/null || true

# Build the seed script
echo "🏗️  Building seed script..."
npx nx build backend

# Seed the data
echo "🌱 Seeding OpenSearch with sample data..."
node dist/backend/apps/backend/scripts/seed-opensearch.js

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 OpenSearch is running at: http://localhost:9200"
echo "   You can verify the data with:"
echo "   curl http://localhost:9200/video-clips/_count"
echo ""
echo "🎬 To run E2E tests:"
echo "   npm run e2e"
echo ""
echo "🛑 To stop OpenSearch:"
echo "   docker-compose down"
echo ""
