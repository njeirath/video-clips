import "reflect-metadata";
import { VideoClipResolver, Context } from "./video-clip.resolver";
import { CreateVideoClipInput } from "../types/video-clip";

// Mock the OpenSearch service
jest.mock("../services/opensearch.service", () => ({
  openSearchService: {
    createVideoClip: jest.fn().mockResolvedValue({}),
    getAllVideoClips: jest.fn().mockResolvedValue([]),
    getVideoClipsByUser: jest.fn().mockResolvedValue([]),
    searchVideoClips: jest.fn().mockResolvedValue({ clips: [], total: 0 }),
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
  });
});
