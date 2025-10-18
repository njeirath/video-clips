import "reflect-metadata";
import { VideoClipResolver, Context } from "./video-clip.resolver";
import { CreateVideoClipInput, UpdateVideoClipInput } from "../types/video-clip";

// Mock the OpenSearch service
jest.mock("../services/opensearch.service", () => ({
  openSearchService: {
    createVideoClip: jest.fn().mockResolvedValue({}),
    getAllVideoClips: jest.fn().mockResolvedValue([]),
    getVideoClipsByUser: jest.fn().mockResolvedValue([]),
    searchVideoClips: jest.fn().mockResolvedValue({ clips: [], total: 0 }),
    getVideoClip: jest.fn().mockResolvedValue(null),
    updateVideoClip: jest.fn().mockResolvedValue({}),
  },
}));

// Mock the S3 service
jest.mock("../services/s3.service", () => ({
  s3Service: {
    generatePresignedUploadUrl: jest.fn().mockResolvedValue({
      uploadUrl: "https://example.com/presigned-upload-url",
      s3Key: "videos/user-123/test-video.mp4",
      videoUrl: "https://cloudfront.example.com/videos/user-123/test-video.mp4",
    }),
    generateSharePage: jest.fn().mockResolvedValue(
      "https://cloudfront.example.com/s/abc123"
    ),
  },
}));

describe("VideoClipResolver", () => {
  let resolver: VideoClipResolver;

  beforeEach(() => {
    resolver = new VideoClipResolver();
    jest.clearAllMocks();
  });

  describe("videoClips query", () => {
    it("should return all video clips", async () => {
      const result = await resolver.videoClips();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("myVideoClips query", () => {
    it("should throw error when not authenticated", async () => {
      const context: Context = {};

      await expect(resolver.myVideoClips(context)).rejects.toThrow(
        "Not authenticated"
      );
    });

    it("should return user's video clips when authenticated", async () => {
      const context: Context = {
        userId: "test-user-123",
        userEmail: "test@example.com",
      };

      const result = await resolver.myVideoClips(context);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("createVideoClip mutation", () => {
    it("should throw error when not authenticated", async () => {
      const input: CreateVideoClipInput = {
        name: "Test Video",
        description: "Test Description",
      };
      const context: Context = {};

      await expect(resolver.createVideoClip(input, context)).rejects.toThrow(
        "Not authenticated"
      );
    });

    it("should throw error when email is missing", async () => {
      const input: CreateVideoClipInput = {
        name: "Test Video",
        description: "Test Description",
      };
      const context: Context = {
        userId: "test-user-123",
      };

      await expect(resolver.createVideoClip(input, context)).rejects.toThrow(
        "email not found"
      );
    });

    it("should throw error when name is empty", async () => {
      const input: CreateVideoClipInput = {
        name: "",
        description: "Test Description",
      };
      const context: Context = {
        userId: "test-user-123",
        userEmail: "test@example.com",
      };

      await expect(resolver.createVideoClip(input, context)).rejects.toThrow(
        "Name is required"
      );
    });

    it("should throw error when name is only whitespace", async () => {
      const input: CreateVideoClipInput = {
        name: "   ",
        description: "Test Description",
      };
      const context: Context = {
        userId: "test-user-123",
        userEmail: "test@example.com",
      };

      await expect(resolver.createVideoClip(input, context)).rejects.toThrow(
        "Name is required"
      );
    });

    it("should throw error when description is empty", async () => {
      const input: CreateVideoClipInput = {
        name: "Test Video",
        description: "",
      };
      const context: Context = {
        userId: "test-user-123",
        userEmail: "test@example.com",
      };

      await expect(resolver.createVideoClip(input, context)).rejects.toThrow(
        "Description is required"
      );
    });

    it("should create video clip with valid input", async () => {
      const input: CreateVideoClipInput = {
        name: "Test Video",
        description: "Test Description",
      };
      const context: Context = {
        userId: "test-user-123",
        userEmail: "test@example.com",
      };

      const result = await resolver.createVideoClip(input, context);

      expect(result).toBeDefined();
      expect(result.name).toBe("Test Video");
      expect(result.description).toBe("Test Description");
      expect(result.userId).toBe("test-user-123");
      expect(result.userEmail).toBe("test@example.com");
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
    });

    it("should trim whitespace from name and description", async () => {
      const input: CreateVideoClipInput = {
        name: "  Test Video  ",
        description: "  Test Description  ",
      };
      const context: Context = {
        userId: "test-user-123",
        userEmail: "test@example.com",
      };

      const result = await resolver.createVideoClip(input, context);

      expect(result.name).toBe("Test Video");
      expect(result.description).toBe("Test Description");
    });

    it("should create video clip with s3Key and videoUrl", async () => {
      const input: CreateVideoClipInput = {
        name: "Test Video",
        description: "Test Description",
        s3Key: "videos/user-123/test.mp4",
        videoUrl: "https://cloudfront.example.com/videos/user-123/test.mp4",
      };
      const context: Context = {
        userId: "test-user-123",
        userEmail: "test@example.com",
      };

      const result = await resolver.createVideoClip(input, context);

      expect(result.s3Key).toBe("videos/user-123/test.mp4");
      expect(result.videoUrl).toBe("https://cloudfront.example.com/videos/user-123/test.mp4");
    });

    it("should create video clip with new optional fields", async () => {
      const input: CreateVideoClipInput = {
        name: "Test Video",
        description: "Test Description",
        script: "Hello, world!",
        duration: 120.5,
        characters: ["Character 1", "Character 2"],
        tags: ["comedy", "action"],
      };
      const context: Context = {
        userId: "test-user-123",
        userEmail: "test@example.com",
      };

      const result = await resolver.createVideoClip(input, context);

      expect(result.script).toBe("Hello, world!");
      expect(result.duration).toBe(120.5);
      expect(result.characters).toEqual(["Character 1", "Character 2"]);
      expect(result.tags).toEqual(["comedy", "action"]);
    });

    it("should create video clip with show source", async () => {
      const input: CreateVideoClipInput = {
        name: "Test Video",
        description: "Test Description",
        source: {
          show: {
            title: "Test Show",
            airDate: "2024-01-01",
            season: 1,
            episode: 5,
            start: 10.5,
            end: 30.5,
          },
        },
      };
      const context: Context = {
        userId: "test-user-123",
        userEmail: "test@example.com",
      };

      const result = await resolver.createVideoClip(input, context);

      expect(result.source).toBeDefined();
      expect(result.source).toMatchObject({
        type: "show",
        title: "Test Show",
        airDate: "2024-01-01",
        season: 1,
        episode: 5,
        start: 10.5,
        end: 30.5,
      });
    });

    it("should create video clip with movie source", async () => {
      const input: CreateVideoClipInput = {
        name: "Test Video",
        description: "Test Description",
        source: {
          movie: {
            title: "Test Movie",
            releaseDate: "2023-06-15",
            start: 45.0,
            end: 90.0,
          },
        },
      };
      const context: Context = {
        userId: "test-user-123",
        userEmail: "test@example.com",
      };

      const result = await resolver.createVideoClip(input, context);

      expect(result.source).toBeDefined();
      expect(result.source).toMatchObject({
        type: "movie",
        title: "Test Movie",
        releaseDate: "2023-06-15",
        start: 45.0,
        end: 90.0,
      });
    });
  });

  describe("generateUploadUrl mutation", () => {
    it("should throw error when not authenticated", async () => {
      const context: Context = {};

      await expect(
        resolver.generateUploadUrl("test.mp4", "video/mp4", context)
      ).rejects.toThrow("Not authenticated");
    });

    it("should generate presigned URL for authenticated user", async () => {
      const context: Context = {
        userId: "test-user-123",
        userEmail: "test@example.com",
      };

      const result = await resolver.generateUploadUrl(
        "test.mp4",
        "video/mp4",
        context
      );

      expect(result.uploadUrl).toBeDefined();
      expect(result.s3Key).toBeDefined();
      expect(result.videoUrl).toBeDefined();
    });

    it("should generate presigned URLs for both video and thumbnail", async () => {
      const context: Context = {
        userId: "test-user-123",
        userEmail: "test@example.com",
      };

      // Mock the S3 service to return thumbnail URLs
      const { s3Service } = require("../services/s3.service");
      s3Service.generatePresignedUploadUrl.mockResolvedValueOnce({
        uploadUrl: "https://example.com/presigned-upload-url",
        s3Key: "videos/user-123/test-video.mp4",
        videoUrl: "https://cloudfront.example.com/videos/user-123/test-video.mp4",
        thumbnailUploadUrl: "https://example.com/presigned-thumbnail-url",
        thumbnailS3Key: "thumbnails/user-123/test-video.png",
        thumbnailUrl: "https://cloudfront.example.com/thumbnails/user-123/test-video.png",
      });

      const result = await resolver.generateUploadUrl(
        "test.mp4",
        "video/mp4",
        context,
        "test.png",
        "image/png"
      );

      expect(result.uploadUrl).toBeDefined();
      expect(result.s3Key).toBeDefined();
      expect(result.videoUrl).toBeDefined();
      expect(result.thumbnailUploadUrl).toBeDefined();
      expect(result.thumbnailS3Key).toBeDefined();
      expect(result.thumbnailUrl).toBeDefined();
    });
  });

  describe("videoClip query", () => {
    it("should return null if video clip not found", async () => {
      const result = await resolver.videoClip("non-existent-id");
      expect(result).toBeNull();
    });

    it("should return video clip if found", async () => {
      const mockClip = {
        id: "test-id",
        name: "Test Video",
        description: "Test Description",
        userId: "test-user-123",
        userEmail: "test@example.com",
        createdAt: "2024-01-01T00:00:00.000Z",
      };

      const { openSearchService } = require("../services/opensearch.service");
      openSearchService.getVideoClip.mockResolvedValueOnce(mockClip);

      const result = await resolver.videoClip("test-id");
      expect(result).toEqual(mockClip);
    });
  });

  describe("updateVideoClip mutation", () => {
    it("should throw error when not authenticated", async () => {
      const input: UpdateVideoClipInput = {
        id: "test-id",
        description: "Updated Description",
      };
      const context: Context = {};

      await expect(resolver.updateVideoClip(input, context)).rejects.toThrow(
        "Not authenticated"
      );
    });

    it("should throw error when email is missing", async () => {
      const input: UpdateVideoClipInput = {
        id: "test-id",
        description: "Updated Description",
      };
      const context: Context = {
        userId: "test-user-123",
      };

      await expect(resolver.updateVideoClip(input, context)).rejects.toThrow(
        "email not found"
      );
    });

    it("should throw error when video clip not found", async () => {
      const input: UpdateVideoClipInput = {
        id: "non-existent-id",
        description: "Updated Description",
      };
      const context: Context = {
        userId: "test-user-123",
        userEmail: "test@example.com",
      };

      const { openSearchService } = require("../services/opensearch.service");
      openSearchService.getVideoClip.mockResolvedValueOnce(null);

      await expect(resolver.updateVideoClip(input, context)).rejects.toThrow(
        "Video clip not found"
      );
    });

    it("should throw error when description is empty", async () => {
      const input: UpdateVideoClipInput = {
        id: "test-id",
        description: "",
      };
      const context: Context = {
        userId: "test-user-123",
        userEmail: "test@example.com",
      };

      const { openSearchService } = require("../services/opensearch.service");
      openSearchService.getVideoClip.mockResolvedValueOnce({
        id: "test-id",
        name: "Test Video",
        description: "Original Description",
      });

      await expect(resolver.updateVideoClip(input, context)).rejects.toThrow(
        "Description cannot be empty"
      );
    });

    it("should update video clip with valid input", async () => {
      const input: UpdateVideoClipInput = {
        id: "test-id",
        description: "Updated Description",
        script: "Updated Script",
        tags: ["tag1", "tag2"],
      };
      const context: Context = {
        userId: "test-user-123",
        userEmail: "test@example.com",
      };

      const existingClip = {
        id: "test-id",
        name: "Test Video",
        description: "Original Description",
        userId: "test-user-123",
        userEmail: "test@example.com",
        createdAt: "2024-01-01T00:00:00.000Z",
      };

      const updatedClip = {
        ...existingClip,
        description: "Updated Description",
        script: "Updated Script",
        tags: ["tag1", "tag2"],
        updatedAt: expect.any(String),
        updatedBy: "test@example.com",
      };

      const { openSearchService } = require("../services/opensearch.service");
      openSearchService.getVideoClip
        .mockResolvedValueOnce(existingClip)
        .mockResolvedValueOnce(updatedClip);

      const result = await resolver.updateVideoClip(input, context);

      expect(result.description).toBe("Updated Description");
      expect(result.script).toBe("Updated Script");
      expect(result.tags).toEqual(["tag1", "tag2"]);
      expect(result.updatedBy).toBe("test@example.com");
      expect(result.updatedAt).toBeDefined();
    });

    it("should update video clip with source", async () => {
      const input: UpdateVideoClipInput = {
        id: "test-id",
        source: {
          show: {
            title: "Updated Show",
            season: 2,
            episode: 3,
          },
        },
      };
      const context: Context = {
        userId: "test-user-123",
        userEmail: "test@example.com",
      };

      const existingClip = {
        id: "test-id",
        name: "Test Video",
        description: "Test Description",
        userId: "test-user-123",
        userEmail: "test@example.com",
        createdAt: "2024-01-01T00:00:00.000Z",
      };

      const updatedClip = {
        ...existingClip,
        source: {
          type: "show",
          title: "Updated Show",
          season: 2,
          episode: 3,
        },
        updatedAt: "2024-01-02T00:00:00.000Z",
        updatedBy: "test@example.com",
      };

      const { openSearchService } = require("../services/opensearch.service");
      openSearchService.getVideoClip
        .mockResolvedValueOnce(existingClip)
        .mockResolvedValueOnce(updatedClip);

      const result = await resolver.updateVideoClip(input, context);

      expect(result.source).toBeDefined();
      expect(result.source).toMatchObject({
        type: "show",
        title: "Updated Show",
        season: 2,
        episode: 3,
      });
    });
  });
});
