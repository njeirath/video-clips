import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  Authorized,
  Int,
} from 'type-graphql';
import { VideoClip, CreateVideoClipInput } from '../types/video-clip';
import { openSearchService } from '../services/opensearch.service';
import { v4 as uuidv4 } from 'uuid';

// Context type for GraphQL requests
export interface Context {
  userId?: string;
  userEmail?: string;
  user?: any;
}

@Resolver(() => VideoClip)
export class VideoClipResolver {
  @Query(() => [VideoClip])
  async videoClips(
    @Arg('searchQuery', () => String, { nullable: true }) searchQuery?: string,
    @Arg('offset', () => Int, { nullable: true, defaultValue: 0 })
    offset?: number,
    @Arg('limit', () => Int, { nullable: true, defaultValue: 12 })
    limit?: number
  ): Promise<VideoClip[]> {
    const result = await openSearchService.searchVideoClips(
      searchQuery,
      offset,
      limit
    );
    return result.clips;
  }

  @Query(() => [VideoClip])
  async myVideoClips(@Ctx() ctx: Context): Promise<VideoClip[]> {
    if (!ctx.userId) {
      throw new Error('Not authenticated');
    }
    return await openSearchService.getVideoClipsByUser(ctx.userId);
  }

  @Mutation(() => VideoClip)
  async createVideoClip(
    @Arg('input', () => CreateVideoClipInput) input: CreateVideoClipInput,
    @Ctx() ctx: Context
  ): Promise<VideoClip> {
    // Require authentication
    if (!ctx.userId) {
      throw new Error('Not authenticated. Please sign in to add video clips.');
    }

    if (!ctx.userEmail) {
      throw new Error('User email not found in authentication token.');
    }

    // Validate input
    if (!input.name || !input.name.trim()) {
      throw new Error('Name is required');
    }

    if (!input.description || !input.description.trim()) {
      throw new Error('Description is required');
    }

    const videoClip = {
      id: uuidv4(),
      name: input.name.trim(),
      description: input.description.trim(),
      userId: ctx.userId,
      userEmail: ctx.userEmail,
      createdAt: new Date().toISOString(),
    };

    await openSearchService.createVideoClip(videoClip);

    return videoClip;
  }
}
