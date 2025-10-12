# Backend API

This is a Node.js backend application built with TypeScript that provides a GraphQL API for the video clips application.

## Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **GraphQL Server**: Apollo Server 5
- **Build Tool**: esbuild (via Nx)
- **Test Framework**: Jest

## Getting Started

### Install Dependencies

```bash
npm install
```

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

#### Video
```graphql
type Video {
  id: ID!
  title: String!
  description: String
  url: String!
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
    "hello": "Hello from GraphQL API!"
  }
}
```

#### videos
Returns a list of all videos.

```graphql
{
  videos {
    id
    title
    description
    url
  }
}
```

**Response:**
```json
{
  "data": {
    "videos": [
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
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ hello }"}'
```

Or use a GraphQL client like Apollo Studio, GraphQL Playground, or Postman.

## Project Structure

```
apps/backend/
├── src/
│   ├── main.ts          # Application entry point with GraphQL setup
│   ├── main.spec.ts     # Tests for the GraphQL API
│   └── assets/          # Static assets
├── jest.config.ts       # Jest configuration
├── project.json         # Nx project configuration
├── tsconfig.app.json    # TypeScript config for application
├── tsconfig.json        # Base TypeScript config
└── tsconfig.spec.json   # TypeScript config for tests
```


## Future Enhancements

- Add mutations for creating, updating, and deleting videos
- Add authentication and authorization
- Implement file upload for video content
- Add pagination and filtering for video queries
- Add subscriptions for real-time updates
