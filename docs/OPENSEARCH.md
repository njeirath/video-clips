# OpenSearch Integration

This document describes the OpenSearch integration for video clips storage.

## Overview

The application uses OpenSearch as the backend database for storing video clip metadata. OpenSearch is a distributed, open-source search and analytics suite that provides scalable and efficient data storage and querying capabilities.

## Configuration

### Environment Variables

Configure OpenSearch connection using environment variables in the backend:

```bash
# OpenSearch Configuration
OPENSEARCH_HOST=localhost          # Default: localhost
OPENSEARCH_PORT=9200              # Default: 9200
OPENSEARCH_PROTOCOL=http          # Default: http
```

### Development Setup

For local development, the application is designed to work without OpenSearch:
- If OpenSearch is not available, connection errors are logged but the app continues to run
- This allows development without requiring a local OpenSearch instance

### Production Setup

For production, you should:
1. Use AWS OpenSearch Service (managed OpenSearch)
2. Configure proper authentication (AWS SigV4 signing)
3. Update the OpenSearch client configuration in `apps/backend/src/services/opensearch.service.ts`

## Data Schema

### Video Clips Index

**Index Name**: `video-clips`

**Mapping**:
```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "name": { "type": "text" },
      "description": { "type": "text" },
      "userId": { "type": "keyword" },
      "createdAt": { "type": "date" }
    }
  }
}
```

### Field Descriptions

- **id**: Unique identifier for the video clip (UUID v4)
- **name**: The title/name of the video clip (searchable text)
- **description**: Description of the video clip (searchable text)
- **userId**: Cognito user sub (identifier) who created the clip
- **createdAt**: ISO 8601 timestamp when the clip was created

## Operations

### Create Video Clip

Adds a new video clip document to the index:

```typescript
await openSearchService.createVideoClip({
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "My Video Clip",
  description: "A sample video clip",
  userId: "user-sub-from-cognito",
  createdAt: "2025-01-01T00:00:00.000Z"
});
```

### Get Video Clip by ID

Retrieves a single video clip by its ID:

```typescript
const clip = await openSearchService.getVideoClip("550e8400-...");
```

### Get User's Video Clips

Retrieves all video clips for a specific user:

```typescript
const clips = await openSearchService.getVideoClipsByUser("user-sub");
```

### Get All Video Clips

Retrieves all video clips (sorted by creation date, newest first):

```typescript
const clips = await openSearchService.getAllVideoClips();
```

## Error Handling

The OpenSearch service is designed with graceful error handling:
- Connection errors during initialization are logged but don't crash the app
- Query errors are caught and return meaningful error messages
- If OpenSearch is unavailable, `getAllVideoClips()` returns an empty array

## Future Enhancements

- **Full-text search**: Implement search across name and description fields
- **Pagination**: Add offset/limit support for large result sets
- **Filtering**: Add filters by date range, user, etc.
- **Aggregations**: Add analytics and statistics
- **Update/Delete**: Add support for updating and deleting clips
- **AWS Integration**: Implement AWS SigV4 signing for AWS OpenSearch Service
- **Index management**: Automated index lifecycle management

## AWS OpenSearch Service Setup

For production deployment with AWS OpenSearch Service:

1. Create an OpenSearch domain using AWS CDK or Console
2. Configure access policies and VPC settings
3. Update the OpenSearch client to use AWS SigV4 signing:

```typescript
import { Client } from '@opensearch-project/opensearch';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import createAwsOpensearchConnector from 'aws-opensearch-connector';

const awsCredentials = await defaultProvider()();
const connector = createAwsOpensearchConnector({
  credentials: awsCredentials,
  region: process.env.AWS_REGION || 'us-east-2',
  getCredentials: () => defaultProvider()()
});

const client = new Client({
  ...connector,
  node: process.env.OPENSEARCH_ENDPOINT
});
```

## References

- [OpenSearch Documentation](https://opensearch.org/docs/latest/)
- [OpenSearch JavaScript Client](https://github.com/opensearch-project/opensearch-js)
- [AWS OpenSearch Service](https://aws.amazon.com/opensearch-service/)
