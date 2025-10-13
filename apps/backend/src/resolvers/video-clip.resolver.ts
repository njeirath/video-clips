import { Resolver, Query, Mutation, Arg, Ctx, Authorized } from "type-graphql";
import { VideoClip, CreateVideoClipInput } from "../types/video-clip";
import { openSearchService } from "../services/opensearch.service";
import { v4 as uuidv4 } from "uuid";

// Context type for GraphQL requests
export interface Context {
  userId?: string;
  user?: any;
}

@Resolver(() => VideoClip)
export class VideoClipResolver {
  @Query(() => [VideoClip])
  async videoClips(): Promise<VideoClip[]> {
    return await openSearchService.getAllVideoClips();
  }

  @Query(() => [VideoClip])
  async myVideoClips(@Ctx() ctx: Context): Promise<VideoClip[]> {
    if (!ctx.userId) {
      throw new Error("Not authenticated");
    }
    return await openSearchService.getVideoClipsByUser(ctx.userId);
  }

  @Mutation(() => VideoClip)
  async createVideoClip(
    @Arg("input") input: CreateVideoClipInput,
    @Ctx() ctx: Context
  ): Promise<VideoClip> {
    // Require authentication
    if (!ctx.userId) {
      throw new Error("Not authenticated. Please sign in to add video clips.");
    }

    // Validate input
    if (!input.name || !input.name.trim()) {
      throw new Error("Name is required");
    }

    if (!input.description || !input.description.trim()) {
      throw new Error("Description is required");
    }

    const videoClip = {
      id: uuidv4(),
      name: input.name.trim(),
      description: input.description.trim(),
      userId: ctx.userId,
      createdAt: new Date().toISOString(),
    };

    await openSearchService.createVideoClip(videoClip);

    return videoClip;
  }
}
