import { Client } from '@opensearch-project/opensearch';

export class OpenSearchService {
  private client: Client;
  private readonly indexName = 'video-clips';

  constructor() {
    // OpenSearch client configuration
    // For development, using localhost. In production, use environment variables.
    const host = process.env.OPENSEARCH_HOST || 'localhost';
    const port = process.env.OPENSEARCH_PORT || '9200';
    const protocol = process.env.OPENSEARCH_PROTOCOL || 'http';
    const username = process.env.OPENSEARCH_USERNAME;
    const password = process.env.OPENSEARCH_PASSWORD;
    const isProduction = process.env.NODE_ENV === 'production';

    const clientConfig: any = {
      node: `${protocol}://${host}:${port}`,
    };

    // Add basic auth if username and password are provided
    if (username && password) {
      clientConfig.auth = {
        username,
        password,
      };
    }

    // In non-production environments, ignore certificate errors
    if (!isProduction && protocol === 'https') {
      clientConfig.ssl = {
        rejectUnauthorized: false,
      };
    }

    this.client = new Client(clientConfig);

    this.initializeIndex();
  }

  private async initializeIndex() {
    try {
      const indexExists = await this.client.indices.exists({
        index: this.indexName,
      });

      if (!indexExists.body) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                name: {
                  type: 'text',
                  fields: {
                    keyword: {
                      type: 'keyword',
                    },
                  },
                },
                description: { type: 'text' },
                userId: { type: 'keyword' },
                userEmail: { type: 'keyword' },
                s3Key: { type: 'keyword' },
                videoUrl: { type: 'keyword' },
                script: { type: 'text' },
                duration: { type: 'float' },
                characters: { type: 'keyword' },
                tags: { type: 'keyword' },
                thumbnailUrl: { type: 'keyword' },
                blurhash: { type: 'keyword' },
                source: {
                  type: 'object',
                  properties: {
                    type: { type: 'keyword' },
                    title: {
                      type: 'text',
                      fields: {
                        keyword: {
                          type: 'keyword',
                        },
                      },
                    },
                    airDate: { type: 'date' },
                    season: { type: 'integer' },
                    episode: { type: 'integer' },
                    releaseDate: { type: 'date' },
                    start: { type: 'float' },
                    end: { type: 'float' },
                  },
                },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' },
                updatedBy: { type: 'keyword' },
              },
            },
          },
        });
        console.log(`Created index: ${this.indexName}`);
      }
    } catch (error) {
      console.error('Error initializing OpenSearch index:', error);
      // Don't throw - allow app to start even if OpenSearch is not available
    }
  }

  async createVideoClip(data: {
    id: string;
    name: string;
    description: string;
    userId: string;
    userEmail: string;
    s3Key?: string;
    videoUrl?: string;
    script?: string;
    duration?: number;
    characters?: string[];
    tags?: string[];
    thumbnailUrl?: string;
    blurhash?: string;
    source?: any;
    createdAt: string;
  }) {
    try {
      const response = await this.client.index({
        index: this.indexName,
        id: data.id,
        body: data,
        refresh: 'true',
      });
      return response.body;
    } catch (error) {
      console.error('Error creating video clip in OpenSearch:', error);
      throw new Error('Failed to create video clip');
    }
  }

  async getVideoClip(id: string): Promise<any> {
    try {
      const response = await this.client.get({
        index: this.indexName,
        id,
      });
      return response.body._source;
    } catch (error) {
      console.error('Error fetching video clip from OpenSearch:', error);
      throw new Error('Failed to fetch video clip');
    }
  }

  async updateVideoClip(
    id: string,
    updates: {
      description?: string;
      shareUrl?: string;
      script?: string;
      duration?: number;
      characters?: string[];
      tags?: string[];
      source?: any;
      updatedAt?: string;
      updatedBy?: string;
    }
  ): Promise<any> {
    try {
      const response = await this.client.update({
        index: this.indexName,
        id,
        body: {
          doc: updates,
        },
        refresh: 'true',
      });
      return response.body;
    } catch (error) {
      console.error('Error updating video clip in OpenSearch:', error);
      throw new Error('Failed to update video clip');
    }
  }

  async getVideoClipsByUser(userId: string) {
    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            match: { userId },
          },
          sort: [{ createdAt: { order: 'desc' } }],
        },
      });
      return response.body.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      console.error('Error fetching user video clips from OpenSearch:', error);
      throw new Error('Failed to fetch video clips');
    }
  }

  async getAllVideoClips() {
    try {
      // Use the scroll API to fetch all documents instead of relying on the default size (10)
      const allClips: any[] = [];
      const pageSize = 1000; // reasonable batch size

      let response = await this.client.search({
        index: this.indexName,
        scroll: '1m',
        size: pageSize,
        body: {
          query: { match_all: {} },
          sort: [{ createdAt: { order: 'desc' } }],
        },
      });

      let hits = response.body.hits.hits || [];
      allClips.push(...hits.map((hit: any) => hit._source));

      // Continue scrolling while we get full pages
  let scrollId = response.body._scroll_id;
      while (hits.length === pageSize) {
        const next = await this.client.scroll({
          scroll_id: scrollId,
          scroll: '1m',
        });
        hits = next.body.hits.hits || [];
        if (hits.length === 0) break;
        allClips.push(...hits.map((hit: any) => hit._source));
  scrollId = next.body._scroll_id || scrollId;
      }

      // Clear the scroll context to free resources
      try {
        if (scrollId) {
          await this.client.clearScroll({ scroll_id: scrollId });
        }
      } catch (e) {
        // Non-fatal if clearScroll fails
      }

      return allClips;
    } catch (error) {
      console.error('Error fetching all video clips from OpenSearch:', error);
      // Return empty array if OpenSearch is not available
      return [];
    }
  }

  async searchVideoClips(
    searchQuery?: string,
    offset: number = 0,
    limit: number = 12,
    sortBy?: string,
    filterShow?: string
  ): Promise<{ clips: any[]; total: number }> {
    try {
      let query: any;

      // Build the query with optional show filter
      if (filterShow && filterShow.trim()) {
        // Filter by show title
        const showFilter = {
          bool: {
            must: [
              { term: { 'source.type': 'show' } },
              { match: { 'source.title': filterShow.trim() } },
            ],
          },
        };

        // If there's also a search query, combine them
        if (searchQuery && searchQuery.trim()) {
          query = {
            bool: {
              must: [
                {
                  multi_match: {
                    query: searchQuery.trim(),
                    fields: [
                      'name^2',
                      'description',
                      'script',
                      'characters',
                      'tags',
                    ],
                    type: 'best_fields',
                    fuzziness: 'AUTO',
                  },
                },
                showFilter,
              ],
            },
          };
        } else {
          query = showFilter;
        }
      } else if (searchQuery && searchQuery.trim()) {
        // Use multi_match to search across name, description, script, characters, and tags fields
        query = {
          multi_match: {
            query: searchQuery.trim(),
            fields: ['name^2', 'description', 'script', 'characters', 'tags'], // Boost name matches
            type: 'best_fields',
            fuzziness: 'AUTO',
          },
        };
      } else {
        query = { match_all: {} };
      }

      // Determine sort order
      let sort: any[];
      if (sortBy === 'name') {
        sort = [{ 'name.keyword': { order: 'asc' } }];
      } else {
        // Default: sort by createdAt descending
        sort = [{ createdAt: { order: 'desc' } }];
      }

      const response = await this.client.search({
        index: this.indexName,
        body: {
          query,
          sort,
          from: offset,
          size: limit,
        },
      });

      const clips = response.body.hits.hits.map((hit: any) => hit._source);
      const total =
        typeof response.body.hits.total === 'number'
          ? response.body.hits.total
          : response.body.hits.total.value;

      return { clips, total };
    } catch (error) {
      console.error('Error searching video clips from OpenSearch:', error);
      // Return empty result if OpenSearch is not available
      return { clips: [], total: 0 };
    }
  }

  async getAvailableShows(): Promise<Array<{ name: string; count: number }>> {
    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          size: 0, // We don't need the actual documents
          query: {
            term: { 'source.type': 'show' },
          },
          aggs: {
            unique_shows: {
              terms: {
                field: 'source.title.keyword',
                size: 1000, // Max number of unique shows to retrieve
                order: { _key: 'asc' }, // Sort alphabetically
              },
            },
          },
        },
      });

      // Extract unique show titles and counts from aggregation results
      const aggregations = response.body.aggregations as any;
      const buckets = aggregations?.unique_shows?.buckets || [];
      return buckets.map((bucket: any) => ({
        name: bucket.key,
        count: bucket.doc_count,
      }));
    } catch (error) {
      console.error('Error fetching available shows from OpenSearch:', error);
      // Return empty array if OpenSearch is not available
      return [];
    }
  }
}

// Singleton instance
export const openSearchService = new OpenSearchService();
