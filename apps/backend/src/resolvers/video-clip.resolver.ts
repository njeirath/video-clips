import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  Authorized,
  Int,
} from 'type-graphql';
import { VideoClip, CreateVideoClipInput, PresignedUrlResponse } from '../types/video-clip';
import { openSearchService } from '../services/opensearch.service';
import { s3Service } from '../services/s3.service';
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

    // Convert source input to source object for storage
    let source: any = undefined;
    if (input.source) {
      if (input.source.show) {
        source = {
          type: 'show',
          ...input.source.show,
        };
      } else if (input.source.movie) {
        source = {
          type: 'movie',
          ...input.source.movie,
        };
      }
    }

    const clipId = uuidv4();

    // Generate the static HTML share page with Open Graph meta tags
    const shareUrl = await s3Service.generateSharePage({
      id: clipId,
      name: input.name.trim(),
      description: input.description.trim(),
      videoUrl: input.videoUrl,
      source,
    });

    const videoClip = {
      id: clipId,
      name: input.name.trim(),
      description: input.description.trim(),
      userId: ctx.userId,
      userEmail: ctx.userEmail,
      s3Key: input.s3Key,
      videoUrl: input.videoUrl,
      shareUrl,
      script: input.script,
      duration: input.duration,
      characters: input.characters,
      tags: input.tags,
      thumbnailUrl: input.thumbnailUrl,
      blurhash: input.blurhash,
      source,
      createdAt: new Date().toISOString(),
    };

    await openSearchService.createVideoClip(videoClip);

    return videoClip;
  }

  @Mutation(() => PresignedUrlResponse)
  async generateUploadUrl(
    @Arg('fileName', () => String) fileName: string,
    @Arg('contentType', () => String) contentType: string,
    @Ctx() ctx: Context,
    @Arg('thumbnailFileName', () => String, { nullable: true })
    thumbnailFileName?: string,
    @Arg('thumbnailContentType', () => String, { nullable: true })
    thumbnailContentType?: string
  ): Promise<PresignedUrlResponse> {
    // Require authentication
    if (!ctx.userId) {
      throw new Error('Not authenticated. Please sign in to upload videos.');
    }

    try {
      const result = await s3Service.generatePresignedUploadUrl(
        ctx.userId,
        fileName,
        contentType,
        thumbnailFileName,
        thumbnailContentType
      );

      return result;
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to generate upload URL'
      );
    }
  }
}
