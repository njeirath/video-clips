# Backend API

This is a Node.js backend application built with TypeScript that provides a GraphQL API for the video clips application.

## Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **GraphQL Server**: Apollo Server (with TypeGraphQL)
- **Database**: OpenSearch (for video clips storage)
- **Authentication**: AWS Cognito JWT verification
- **Build Tool**: esbuild (via Nx)
- **Test Framework**: Jest

## Features

- ✅ GraphQL API with type-safe resolvers using TypeGraphQL
- ✅ JWT-based authentication using AWS Cognito
- ✅ Video clip management with OpenSearch backend
- ✅ User-specific video clip creation (authenticated users only)

## Getting Started

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file in the `apps/backend` directory (optional):

```bash
# OpenSearch Configuration
OPENSEARCH_HOST=localhost
OPENSEARCH_PORT=9200
OPENSEARCH_PROTOCOL=http

# Cognito Configuration (defaults to production pool if not set)
COGNITO_USER_POOL_ID=us-east-2_CV9d0tKnO
COGNITO_CLIENT_ID=4lk87f6cg3o2dr9sbsldkv8ntq
```

**Note**: The app works without OpenSearch for development. It will log connection errors but continue to function.

### Development Server

Start the backend in development mode with hot reloading:

```bash
npm run start:backend
# or
npx nx serve backend
```

The server will start at `http://localhost:3000` with the GraphQL endpoint at `http://localhost:3000/graphql`.

### Build

Build the backend for production:

```bash
npx nx build backend
```

The built output will be in `dist/backend/`.

### Run Tests

```bash
npx nx test backend
```

## GraphQL API

The backend provides a GraphQL API with the following schema:

### Types

#### VideoClip
```graphql
type VideoClip {
  id: ID!
  name: String!
  description: String!
  userId: String!
  createdAt: String!
}
```

#### CreateVideoClipInput
```graphql
input CreateVideoClipInput {
  name: String!
  description: String!
}
```

### Queries

#### hello
Returns a greeting message.

```graphql
{
  hello
}
```

**Response:**
```json
{
  "data": {
    "hello": "Hello from TypeGraphQL!"
  }
}
```

#### videoClips
Returns a list of all video clips.

```graphql
{
  videoClips {
    id
    name
    description
    userId
    createdAt
  }
}
```

**Response:**
```json
{
  "data": {
    "videoClips": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "My First Video Clip",
        "description": "A sample video clip",
        "userId": "user-123",
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### myVideoClips
Returns video clips for the authenticated user. **Requires authentication.**

```graphql
{
  myVideoClips {
    id
    name
    description
    createdAt
  }
}
```

### Mutations

#### createVideoClip
Creates a new video clip. **Requires authentication.**

```graphql
mutation CreateVideoClip($input: CreateVideoClipInput!) {
  createVideoClip(input: $input) {
    id
    name
    description
    userId
    createdAt
  }
}
```

**Variables:**
```json
{
  "input": {
    "name": "My Video Clip",
    "description": "This is a description of my video clip"
  }
}
```

**Headers:**
```json
{
  "Authorization": "Bearer <cognito-id-token>"
}
```

**Response:**
```json
{
  "data": {
    "createVideoClip": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "My Video Clip",
      "description": "This is a description of my video clip",
      "userId": "user-sub-from-token",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

### Authentication

The API uses JWT tokens from AWS Cognito for authentication. Protected endpoints require a valid Cognito ID token in the Authorization header:

```
Authorization: Bearer <cognito-id-token>
```

The user's ID is extracted from the token's `sub` claim and used to associate video clips with users.
      {
        "id": "1",
        "title": "Sample Video 1",
        "description": "This is a sample video",
        "url": "https://example.com/video1.mp4"
      },
      {
        "id": "2",
        "title": "Sample Video 2",
        "description": "Another sample video",
        "url": "https://example.com/video2.mp4"
      }
    ]
  }
}
```

## Testing the API

You can test the GraphQL API using curl:

```bash
# Test hello query
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ hello }"}'

# Test videoClips query
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ videoClips { id name description } }"}'

# Test createVideoClip mutation (requires authentication token)
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_COGNITO_ID_TOKEN" \
  -d '{"query":"mutation CreateVideoClip($input: CreateVideoClipInput!) { createVideoClip(input: $input) { id name description userId createdAt } }", "variables":{"input":{"name":"My Video","description":"A test video"}}}'
```

Or use a GraphQL client like Apollo Studio, GraphQL Playground, or Postman.

## Project Structure

```
apps/backend/
├── src/
│   ├── main.ts                      # Application entry point with GraphQL setup
│   ├── main.spec.ts                 # Tests for the GraphQL API
│   ├── generate-schema.ts           # Schema generation utility
│   ├── resolvers/
│   │   ├── sample-resolver.ts       # Sample resolver (hello query)
│   │   └── video-clip.resolver.ts   # Video clip resolver with queries and mutations
│   ├── services/
│   │   └── opensearch.service.ts    # OpenSearch client and operations
│   ├── types/
│   │   └── video-clip.ts            # VideoClip type definitions
│   └── assets/                      # Static assets
├── jest.config.ts                   # Jest configuration
├── project.json                     # Nx project configuration
├── tsconfig.app.json                # TypeScript config for application
├── tsconfig.json                    # Base TypeScript config
└── tsconfig.spec.json               # TypeScript config for tests
```


## Future Enhancements

- ✅ ~~Add mutations for creating video clips~~ (COMPLETED)
- ✅ ~~Add authentication and authorization~~ (COMPLETED)
- Add update and delete mutations for video clips
- Implement file upload for actual video content
- Add pagination and filtering for video queries
- Add subscriptions for real-time updates
- Add AWS OpenSearch Service integration for production
- Add video clip search functionality
