# Video Clip Schema Documentation

This document describes the data structure for video clips in the system.

## Overview

The video clip model supports comprehensive metadata about video clips, including information about the clip content, source material, and optional enrichment data.

## Core Fields

### Required Fields

- **id** (ID!): Unique identifier for the video clip
- **name** (String!): Name/title of the video clip
- **userId** (String!): ID of the user who created the clip
- **userEmail** (String!): Email of the user who created the clip
- **createdAt** (String!): ISO 8601 timestamp of when the clip was created

### Optional Core Fields

- **description** (String): Description of the video clip content

### Optional Video Storage Fields

- **s3Key** (String): S3 object key where the video file is stored
- **videoUrl** (String): CloudFront or S3 URL to access the video

## Optional Enrichment Fields

All of the following fields are optional and can be provided to add additional context and metadata to video clips:

### script (String)
Text representing the words spoken in the clip. This can be used for:
- Searchability of dialogue
- Accessibility (closed captions)
- Content analysis

Example:
```json
"script": "Hello, I'm Inigo Montoya. You killed my father. Prepare to die."
```

### duration (Float)
Duration of the clip in seconds. Useful for:
- Displaying clip length to users
- Filtering clips by duration
- Time-based sorting

Example:
```json
"duration": 120.5
```

### characters (Array of Strings)
List of characters who appear in the clip. Useful for:
- Searching clips by character
- Organizing clips by characters
- Discovering related clips

Example:
```json
"characters": ["Inigo Montoya", "The Man in Black"]
```

### tags (Array of Strings)
List of tags relevant to the clip. Useful for:
- Categorizing clips
- Filtering and searching
- Content organization

Example:
```json
"tags": ["comedy", "action", "revenge", "sword-fighting"]
```

### thumbnailUrl (String)
URL to a preview image for the video clip. Useful for:
- Displaying thumbnail previews in lists and grids
- Social media sharing with Open Graph images
- Improving visual browsing experience

Example:
```json
"thumbnailUrl": "https://cdn.example.com/previews/clip-123.jpg"
```

### blurhash (String)
Compact representation of the thumbnail for fast placeholder rendering. Useful for:
- Showing blurred placeholders while images load
- Improving perceived performance
- Creating visually appealing loading states

Learn more about BlurHash: https://blurha.sh/

Example:
```json
"blurhash": "U1F5E9kCj@ay~qj[ayj[ayj[ayj["
```

## Source Information

The **source** field provides context about where the clip originated from. It can be one of two types:

### Show Source

Used when the clip comes from a TV show or series episode.

**Required:**
- **title** (String!): Name of the show

**Optional:**
- **airDate** (String): Date the episode was aired (ISO 8601 date format)
- **season** (Int): Season number
- **episode** (Int): Episode number within the season
- **start** (Float): Start time within the episode (in seconds)
- **end** (Float): End time within the episode (in seconds)

Example:
```json
{
  "source": {
    "show": {
      "title": "The Office",
      "airDate": "2005-03-24",
      "season": 1,
      "episode": 1,
      "start": 120.5,
      "end": 145.8
    }
  }
}
```

### Movie Source

Used when the clip comes from a movie.

**Required:**
- **title** (String!): Movie title

**Optional:**
- **releaseDate** (String): Movie release date (ISO 8601 date format)
- **start** (Float): Start time within the movie (in seconds)
- **end** (Float): End time within the movie (in seconds)

Example:
```json
{
  "source": {
    "movie": {
      "title": "The Princess Bride",
      "releaseDate": "1987-09-25",
      "start": 3456.2,
      "end": 3489.7
    }
  }
}
```

## GraphQL Schema

### Types

```graphql
type VideoClip {
  id: ID!
  name: String!
  description: String
  userId: String!
  userEmail: String!
  s3Key: String
  videoUrl: String
  script: String
  duration: Float
  actors: [String!]
  tags: [String!]
  source: VideoClipSource
  createdAt: String!
}

union VideoClipSource = ShowSource | MovieSource

type ShowSource {
  title: String!
  airDate: String
  season: Int
  episode: Int
  start: Float
  end: Float
}

type MovieSource {
  title: String!
  releaseDate: String
  start: Float
  end: Float
}
```

### Input Types

```graphql
input CreateVideoClipInput {
  name: String!
  description: String
  s3Key: String
  videoUrl: String
  script: String
  duration: Float
  characters: [String!]
  tags: [String!]
  thumbnailUrl: String
  blurhash: String
  source: VideoClipSourceInput
}

input VideoClipSourceInput {
  show: ShowSourceInput
  movie: MovieSourceInput
}

input ShowSourceInput {
  title: String!
  airDate: String
  season: Int
  episode: Int
  start: Float
  end: Float
}

input MovieSourceInput {
  title: String!
  releaseDate: String
  start: Float
  end: Float
}
```

## Usage Examples

### Creating a Simple Clip

```graphql
mutation {
  createVideoClip(input: {
    name: "Funny Moment"
    s3Key: "videos/user-123/clip-456.mp4"
    videoUrl: "https://cdn.example.com/videos/user-123/clip-456.mp4"
  }) {
    id
    name
    createdAt
  }
}
```

### Creating a Clip with Description

```graphql
mutation {
  createVideoClip(input: {
    name: "Funny Moment"
    description: "A hilarious scene from the movie"
    s3Key: "videos/user-123/clip-456.mp4"
    videoUrl: "https://cdn.example.com/videos/user-123/clip-456.mp4"
  }) {
    id
    name
    description
    createdAt
  }
}
```

### Creating a Clip with Full Metadata

```graphql
mutation {
  createVideoClip(input: {
    name: "Iconic Duel Scene"
    description: "The famous sword fight scene"
    s3Key: "videos/user-123/clip-789.mp4"
    videoUrl: "https://cdn.example.com/videos/user-123/clip-789.mp4"
    script: "Hello. My name is Inigo Montoya. You killed my father. Prepare to die."
    duration: 33.5
    characters: ["Inigo Montoya", "The Man in Black"]
    tags: ["action", "sword-fight", "revenge", "classic"]
    thumbnailUrl: "https://cdn.example.com/previews/clip-princess-bride-duel.jpg"
    blurhash: "U1F5E9kCj@ay~qj[ayj[ayj[ayj["
    source: {
      movie: {
        title: "The Princess Bride"
        releaseDate: "1987-09-25"
        start: 3456.2
        end: 3489.7
      }
    }
  }) {
    id
    name
    script
    duration
    characters
    tags
    thumbnailUrl
    blurhash
    source {
      ... on MovieSource {
        title
        releaseDate
        start
        end
      }
    }
  }
}
```

### Creating a Clip from a TV Show

```graphql
mutation {
  createVideoClip(input: {
    name: "Dundies Award Ceremony"
    description: "Michael hosts the Dundies awards"
    script: "And the Dundie goes to..."
    duration: 45.2
    characters: ["Michael Scott", "Pam Beesly"]
    tags: ["comedy", "office-party", "awards"]
    source: {
      show: {
        title: "The Office"
        airDate: "2005-09-22"
        season: 2
        episode: 1
        start: 180.5
        end: 225.7
      }
    }
  }) {
    id
    name
    source {
      ... on ShowSource {
        title
        season
        episode
        airDate
      }
    }
  }
}
```

## Search and Filtering

The video clip search functionality includes the new enrichment fields:

- **name**: Boosted 2x in search relevance
- **description**: Standard search relevance
- **script**: Standard search relevance
- **characters**: Standard search relevance
- **tags**: Standard search relevance

This allows users to search for clips by dialogue, characters, or tags in addition to the clip name and description.

## OpenSearch Index Mappings

The OpenSearch index includes the following field mappings:

```json
{
  "id": { "type": "keyword" },
  "name": { "type": "text" },
  "description": { "type": "text" },
  "userId": { "type": "keyword" },
  "userEmail": { "type": "keyword" },
  "s3Key": { "type": "keyword" },
  "videoUrl": { "type": "keyword" },
  "script": { "type": "text" },
  "duration": { "type": "float" },
  "characters": { "type": "keyword" },
  "tags": { "type": "keyword" },
  "thumbnailUrl": { "type": "keyword" },
  "blurhash": { "type": "keyword" },
  "source": {
    "type": "object",
    "properties": {
      "type": { "type": "keyword" },
      "title": { "type": "text" },
      "airDate": { "type": "date" },
      "season": { "type": "integer" },
      "episode": { "type": "integer" },
      "releaseDate": { "type": "date" },
      "start": { "type": "float" },
      "end": { "type": "float" }
    }
  },
  "createdAt": { "type": "date" }
}
```

## Notes

- The **description** field is now **optional** (as of the latest update) to allow clips without descriptions
- All other enrichment fields (script, duration, characters, tags, source, thumbnailUrl, blurhash) are **optional** to maintain backward compatibility
- The source field uses a union type to support both show and movie sources
- When providing a source, you must specify either `show` OR `movie`, not both
- Time values (start, end, duration) are in seconds and support decimal precision
- Dates should be in ISO 8601 format (YYYY-MM-DD)
