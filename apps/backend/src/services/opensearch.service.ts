import { Client } from "@opensearch-project/opensearch";

export class OpenSearchService {
  private client: Client;
  private readonly indexName = "video-clips";

  constructor() {
    // OpenSearch client configuration
    // For development, using localhost. In production, use environment variables.
    const host = process.env.OPENSEARCH_HOST || "localhost";
    const port = process.env.OPENSEARCH_PORT || "9200";
    const protocol = process.env.OPENSEARCH_PROTOCOL || "http";
    const username = process.env.OPENSEARCH_USERNAME;
    const password = process.env.OPENSEARCH_PASSWORD;
    const isProduction = process.env.NODE_ENV === "production";
    
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
    if (!isProduction && protocol === "https") {
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
                id: { type: "keyword" },
                name: { type: "text" },
                description: { type: "text" },
                userId: { type: "keyword" },
                userEmail: { type: "keyword" },
                createdAt: { type: "date" },
              },
            },
          },
        });
        console.log(`Created index: ${this.indexName}`);
      }
    } catch (error) {
      console.error("Error initializing OpenSearch index:", error);
      // Don't throw - allow app to start even if OpenSearch is not available
    }
  }

  async createVideoClip(data: {
    id: string;
    name: string;
    description: string;
    userId: string;
    userEmail: string;
    createdAt: string;
  }) {
    try {
      const response = await this.client.index({
        index: this.indexName,
        id: data.id,
        body: data,
        refresh: "true",
      });
      return response.body;
    } catch (error) {
      console.error("Error creating video clip in OpenSearch:", error);
      throw new Error("Failed to create video clip");
    }
  }

  async getVideoClip(id: string) {
    try {
      const response = await this.client.get({
        index: this.indexName,
        id,
      });
      return response.body._source;
    } catch (error) {
      console.error("Error fetching video clip from OpenSearch:", error);
      throw new Error("Failed to fetch video clip");
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
          sort: [{ createdAt: { order: "desc" } }],
        },
      });
      return response.body.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      console.error("Error fetching user video clips from OpenSearch:", error);
      throw new Error("Failed to fetch video clips");
    }
  }

  async getAllVideoClips() {
    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: { match_all: {} },
          sort: [{ createdAt: { order: "desc" } }],
        },
      });
      return response.body.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      console.error("Error fetching all video clips from OpenSearch:", error);
      // Return empty array if OpenSearch is not available
      return [];
    }
  }
}

// Singleton instance
export const openSearchService = new OpenSearchService();
