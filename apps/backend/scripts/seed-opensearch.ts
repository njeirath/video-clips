import { Client } from '@opensearch-project/opensearch';

/**
 * Seed script for OpenSearch with sample video clips data for E2E testing
 * 
 * This script populates OpenSearch with sample data that covers various test scenarios:
 * - Different shows and movies
 * - Multiple characters
 * - Various tags and descriptions
 * - Different creation dates for sorting tests
 */

const OPENSEARCH_HOST = process.env.OPENSEARCH_HOST || 'localhost';
const OPENSEARCH_PORT = process.env.OPENSEARCH_PORT || '9200';
const INDEX_NAME = 'video-clips';

const client = new Client({
  node: `http://${OPENSEARCH_HOST}:${OPENSEARCH_PORT}`,
});

const sampleVideoClips = [
  {
    id: 'clip-001',
    name: 'The Office - Michael Scott Paper Company',
    description: 'Michael starts his own paper company in the office building',
    userId: 'test-user-1',
    userEmail: 'test@example.com',
    videoUrl: 'https://example.com/videos/the-office-1.mp4',
    shareUrl: 'https://example.com/share/clip-001',
    thumbnailUrl: 'https://example.com/thumbnails/the-office-1.jpg',
    blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
    script: 'I am going to start my own paper company. The Michael Scott Paper Company.',
    duration: 45.5,
    characters: ['Michael Scott', 'Pam Beesly', 'Ryan Howard'],
    tags: ['comedy', 'office', 'business'],
    source: {
      type: 'show',
      title: 'The Office',
      season: 5,
      episode: 23,
      airDate: '2009-04-09T00:00:00Z',
      start: 125.5,
      end: 171.0,
    },
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'clip-002',
    name: 'Parks and Recreation - Treat Yo Self',
    description: 'Tom and Donna celebrate their annual Treat Yo Self day',
    userId: 'test-user-1',
    userEmail: 'test@example.com',
    videoUrl: 'https://example.com/videos/parks-rec-1.mp4',
    shareUrl: 'https://example.com/share/clip-002',
    thumbnailUrl: 'https://example.com/thumbnails/parks-rec-1.jpg',
    blurhash: 'LGF5?xYk^6#M@-5c,1J5@[or[Q6.',
    script: 'Treat yo self! It\'s the best day of the year.',
    duration: 32.0,
    characters: ['Tom Haverford', 'Donna Meagle'],
    tags: ['comedy', 'parks', 'shopping'],
    source: {
      type: 'show',
      title: 'Parks and Recreation',
      season: 4,
      episode: 4,
      airDate: '2011-10-13T00:00:00Z',
      start: 445.0,
      end: 477.0,
    },
    createdAt: '2024-01-16T14:20:00Z',
    updatedAt: '2024-01-16T14:20:00Z',
  },
  {
    id: 'clip-003',
    name: 'The Office - Parkour',
    description: 'The warehouse guys attempt parkour in the office',
    userId: 'test-user-2',
    userEmail: 'user2@example.com',
    videoUrl: 'https://example.com/videos/the-office-2.mp4',
    shareUrl: 'https://example.com/share/clip-003',
    thumbnailUrl: 'https://example.com/thumbnails/the-office-2.jpg',
    blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
    script: 'Parkour! Parkour! Hardcore parkour!',
    duration: 28.5,
    characters: ['Michael Scott', 'Andy Bernard', 'Dwight Schrute'],
    tags: ['comedy', 'parkour', 'physical'],
    source: {
      type: 'show',
      title: 'The Office',
      season: 6,
      episode: 1,
      airDate: '2009-09-17T00:00:00Z',
      start: 34.0,
      end: 62.5,
    },
    createdAt: '2024-01-17T09:15:00Z',
    updatedAt: '2024-01-17T09:15:00Z',
  },
  {
    id: 'clip-004',
    name: 'Parks and Recreation - Ron Swanson Breakfast',
    description: 'Ron Swanson orders all the bacon and eggs',
    userId: 'test-user-1',
    userEmail: 'test@example.com',
    videoUrl: 'https://example.com/videos/parks-rec-2.mp4',
    shareUrl: 'https://example.com/share/clip-004',
    thumbnailUrl: 'https://example.com/thumbnails/parks-rec-2.jpg',
    blurhash: 'LKOF:xYk^6#M@-5c,1J5@[or[Q6.',
    script: 'Give me all the bacon and eggs you have.',
    duration: 15.0,
    characters: ['Ron Swanson'],
    tags: ['comedy', 'food', 'breakfast'],
    source: {
      type: 'show',
      title: 'Parks and Recreation',
      season: 3,
      episode: 5,
      airDate: '2011-02-10T00:00:00Z',
      start: 567.0,
      end: 582.0,
    },
    createdAt: '2024-01-18T16:45:00Z',
    updatedAt: '2024-01-18T16:45:00Z',
  },
  {
    id: 'clip-005',
    name: 'Brooklyn Nine-Nine - Cool Cool Cool',
    description: 'Jake Peralta says cool cool cool',
    userId: 'test-user-2',
    userEmail: 'user2@example.com',
    videoUrl: 'https://example.com/videos/b99-1.mp4',
    shareUrl: 'https://example.com/share/clip-005',
    thumbnailUrl: 'https://example.com/thumbnails/b99-1.jpg',
    blurhash: 'L95hH]t7.AyE_3t7t7R**0o#DgR4',
    script: 'Cool cool cool cool cool cool cool. No doubt no doubt no doubt.',
    duration: 8.5,
    characters: ['Jake Peralta'],
    tags: ['comedy', 'catchphrase'],
    source: {
      type: 'show',
      title: 'Brooklyn Nine-Nine',
      season: 1,
      episode: 1,
      airDate: '2013-09-17T00:00:00Z',
      start: 123.0,
      end: 131.5,
    },
    createdAt: '2024-01-19T11:00:00Z',
    updatedAt: '2024-01-19T11:00:00Z',
  },
  {
    id: 'clip-006',
    name: 'The Office - That\'s What She Said',
    description: 'Michael Scott\'s classic catchphrase',
    userId: 'test-user-1',
    userEmail: 'test@example.com',
    videoUrl: 'https://example.com/videos/the-office-3.mp4',
    shareUrl: 'https://example.com/share/clip-006',
    thumbnailUrl: 'https://example.com/thumbnails/the-office-3.jpg',
    blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
    script: 'That\'s what she said!',
    duration: 3.0,
    characters: ['Michael Scott'],
    tags: ['comedy', 'catchphrase', 'classic'],
    source: {
      type: 'show',
      title: 'The Office',
      season: 2,
      episode: 1,
      airDate: '2005-09-20T00:00:00Z',
      start: 789.0,
      end: 792.0,
    },
    createdAt: '2024-01-20T08:30:00Z',
    updatedAt: '2024-01-20T08:30:00Z',
  },
  {
    id: 'clip-007',
    name: 'Brooklyn Nine-Nine - Title of Your Sex Tape',
    description: 'Jake makes a "title of your sex tape" joke',
    userId: 'test-user-2',
    userEmail: 'user2@example.com',
    videoUrl: 'https://example.com/videos/b99-2.mp4',
    shareUrl: 'https://example.com/share/clip-007',
    thumbnailUrl: 'https://example.com/thumbnails/b99-2.jpg',
    blurhash: 'L95hH]t7.AyE_3t7t7R**0o#DgR4',
    script: 'Title of your sex tape!',
    duration: 5.0,
    characters: ['Jake Peralta', 'Amy Santiago'],
    tags: ['comedy', 'catchphrase'],
    source: {
      type: 'show',
      title: 'Brooklyn Nine-Nine',
      season: 2,
      episode: 7,
      airDate: '2014-11-09T00:00:00Z',
      start: 456.0,
      end: 461.0,
    },
    createdAt: '2024-01-21T13:15:00Z',
    updatedAt: '2024-01-21T13:15:00Z',
  },
  {
    id: 'clip-008',
    name: 'Parks and Recreation - Li\'l Sebastian',
    description: 'The introduction of Li\'l Sebastian, Pawnee\'s miniature horse',
    userId: 'test-user-1',
    userEmail: 'test@example.com',
    videoUrl: 'https://example.com/videos/parks-rec-3.mp4',
    shareUrl: 'https://example.com/share/clip-008',
    thumbnailUrl: 'https://example.com/thumbnails/parks-rec-3.jpg',
    blurhash: 'LGF5?xYk^6#M@-5c,1J5@[or[Q6.',
    script: 'Bye bye Li\'l Sebastian!',
    duration: 42.0,
    characters: ['Leslie Knope', 'Ben Wyatt', 'Ron Swanson'],
    tags: ['comedy', 'emotional', 'horse'],
    source: {
      type: 'show',
      title: 'Parks and Recreation',
      season: 3,
      episode: 16,
      airDate: '2011-05-19T00:00:00Z',
      start: 1234.0,
      end: 1276.0,
    },
    createdAt: '2024-01-22T10:00:00Z',
    updatedAt: '2024-01-22T10:00:00Z',
  },
  {
    id: 'clip-009',
    name: 'The Office - Fire Drill',
    description: 'Dwight stages a fire drill that causes chaos',
    userId: 'test-user-2',
    userEmail: 'user2@example.com',
    videoUrl: 'https://example.com/videos/the-office-4.mp4',
    shareUrl: 'https://example.com/share/clip-009',
    thumbnailUrl: 'https://example.com/thumbnails/the-office-4.jpg',
    blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
    script: 'The fire is shooting at us!',
    duration: 125.0,
    characters: ['Dwight Schrute', 'Michael Scott', 'Jim Halpert', 'Pam Beesly'],
    tags: ['comedy', 'chaos', 'fire'],
    source: {
      type: 'show',
      title: 'The Office',
      season: 5,
      episode: 14,
      airDate: '2009-02-01T00:00:00Z',
      start: 45.0,
      end: 170.0,
    },
    createdAt: '2024-01-23T15:20:00Z',
    updatedAt: '2024-01-23T15:20:00Z',
  },
  {
    id: 'clip-010',
    name: 'Brooklyn Nine-Nine - Bone',
    description: 'Captain Holt gets excited about a case',
    userId: 'test-user-1',
    userEmail: 'test@example.com',
    videoUrl: 'https://example.com/videos/b99-3.mp4',
    shareUrl: 'https://example.com/share/clip-010',
    thumbnailUrl: 'https://example.com/thumbnails/b99-3.jpg',
    blurhash: 'L95hH]t7.AyE_3t7t7R**0o#DgR4',
    script: 'BONE! How dare you Detective Diaz!',
    duration: 35.0,
    characters: ['Raymond Holt', 'Jake Peralta', 'Amy Santiago', 'Rosa Diaz'],
    tags: ['comedy', 'argument'],
    source: {
      type: 'show',
      title: 'Brooklyn Nine-Nine',
      season: 5,
      episode: 11,
      airDate: '2018-01-07T00:00:00Z',
      start: 678.0,
      end: 713.0,
    },
    createdAt: '2024-01-24T09:45:00Z',
    updatedAt: '2024-01-24T09:45:00Z',
  },
  {
    id: 'clip-011',
    name: 'The Office - Diversity Day',
    description: 'Michael leads a diversity training session',
    userId: 'test-user-1',
    userEmail: 'test@example.com',
    videoUrl: 'https://example.com/videos/the-office-5.mp4',
    shareUrl: 'https://example.com/share/clip-011',
    thumbnailUrl: 'https://example.com/thumbnails/the-office-5.jpg',
    blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
    script: 'I am Beyonce, always.',
    duration: 67.0,
    characters: ['Michael Scott', 'Dwight Schrute', 'Jim Halpert', 'Stanley Hudson'],
    tags: ['comedy', 'training', 'awkward'],
    source: {
      type: 'show',
      title: 'The Office',
      season: 1,
      episode: 2,
      airDate: '2005-03-29T00:00:00Z',
      start: 234.0,
      end: 301.0,
    },
    createdAt: '2024-01-25T12:00:00Z',
    updatedAt: '2024-01-25T12:00:00Z',
  },
  {
    id: 'clip-012',
    name: 'Parks and Recreation - Snake Juice',
    description: 'The gang gets drunk on Snake Juice at the Snakehole Lounge',
    userId: 'test-user-2',
    userEmail: 'user2@example.com',
    videoUrl: 'https://example.com/videos/parks-rec-4.mp4',
    shareUrl: 'https://example.com/share/clip-012',
    thumbnailUrl: 'https://example.com/thumbnails/parks-rec-4.jpg',
    blurhash: 'LKOF:xYk^6#M@-5c,1J5@[or[Q6.',
    script: 'I have no idea what I did last night. I was baba booey drunk.',
    duration: 53.0,
    characters: ['Tom Haverford', 'Leslie Knope', 'April Ludgate', 'Donna Meagle'],
    tags: ['comedy', 'party', 'drunk'],
    source: {
      type: 'show',
      title: 'Parks and Recreation',
      season: 3,
      episode: 13,
      airDate: '2011-05-05T00:00:00Z',
      start: 890.0,
      end: 943.0,
    },
    createdAt: '2024-01-26T14:30:00Z',
    updatedAt: '2024-01-26T14:30:00Z',
  },
];

async function seedData() {
  try {
    console.log(`Connecting to OpenSearch at ${OPENSEARCH_HOST}:${OPENSEARCH_PORT}...`);
    
    // Check if OpenSearch is available
    const health = await client.cluster.health();
    console.log('OpenSearch cluster health:', health.body.status);

    // Check if index exists
    const indexExists = await client.indices.exists({ index: INDEX_NAME });
    
    if (!indexExists.body) {
      console.log(`Index ${INDEX_NAME} does not exist. It will be created by the backend service.`);
      console.log('Please ensure the backend service has been started at least once to create the index.');
      console.log('Starting backend to create index...');
      
      // Wait a moment for potential index creation
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`Seeding ${sampleVideoClips.length} video clips...`);

    // Bulk insert all clips
    const operations = sampleVideoClips.flatMap(clip => [
      { index: { _index: INDEX_NAME, _id: clip.id } },
      clip,
    ]);

    const bulkResponse = await client.bulk({
      refresh: 'true',
      body: operations,
    });

    if (bulkResponse.body.errors) {
      console.error('Some documents failed to index:');
      bulkResponse.body.items.forEach((item: any, i: number) => {
        if (item.index?.error) {
          console.error(`Document ${i}:`, item.index.error);
        }
      });
    } else {
      console.log(`✅ Successfully seeded ${sampleVideoClips.length} video clips!`);
    }

    // Verify the data
    const countResponse = await client.count({ index: INDEX_NAME });
    console.log(`Total documents in ${INDEX_NAME}: ${countResponse.body.count}`);

    console.log('\n📊 Sample data summary:');
    console.log(`  - Shows: The Office, Parks and Recreation, Brooklyn Nine-Nine`);
    console.log(`  - Characters: Michael Scott, Tom Haverford, Jake Peralta, and more`);
    console.log(`  - Total clips: ${sampleVideoClips.length}`);
    console.log(`  - Date range: 2024-01-15 to 2024-01-26`);

  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seed script
seedData().then(() => {
  console.log('\n✅ Seeding complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
