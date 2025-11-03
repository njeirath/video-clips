import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  Authorized,
  Int,
} from 'type-graphql';
import { VideoClip, CreateVideoClipInput, UpdateVideoClipInput, PresignedUrlResponse, ShowWithCount, CharacterWithCount } from '../types/video-clip';
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
    limit?: number,
    @Arg('sortBy', () => String, { nullable: true }) sortBy?: string,
    @Arg('filterShow', () => String, { nullable: true }) filterShow?: string,
    @Arg('filterCharacter', () => String, { nullable: true }) filterCharacter?: string
  ): Promise<VideoClip[]> {
    const result = await openSearchService.searchVideoClips(
      searchQuery,
      offset,
      limit,
      sortBy,
      filterShow,
      filterCharacter
    );
    return result.clips;
  }

  @Query(() => VideoClip, { nullable: true })
  async videoClip(
    @Arg('id', () => String) id: string
  ): Promise<VideoClip | null> {
    try {
      return await openSearchService.getVideoClip(id);
    } catch (error) {
      console.error('Error fetching video clip:', error);
      return null;
    }
  }

  @Query(() => [VideoClip])
  async myVideoClips(@Ctx() ctx: Context): Promise<VideoClip[]> {
    if (!ctx.userId) {
      throw new Error('Not authenticated');
    }
    return await openSearchService.getVideoClipsByUser(ctx.userId);
  }

  @Query(() => [ShowWithCount])
  async availableShows(): Promise<ShowWithCount[]> {
    return await openSearchService.getAvailableShows();
  }

  @Query(() => [CharacterWithCount])
  async availableCharacters(): Promise<CharacterWithCount[]> {
    return await openSearchService.getAvailableCharacters();
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
      description: input.description?.trim() || '',
      videoUrl: input.videoUrl,
      thumbnailUrl: input.thumbnailUrl,
      source,
    });

    const videoClip = {
      id: clipId,
      name: input.name.trim(),
      description: input.description?.trim() || '',
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

  @Mutation(() => VideoClip)
  async updateVideoClip(
    @Arg('input', () => UpdateVideoClipInput) input: UpdateVideoClipInput,
    @Ctx() ctx: Context
  ): Promise<VideoClip> {
    // Require authentication
    if (!ctx.userId) {
      throw new Error('Not authenticated. Please sign in to edit video clips.');
    }

    if (!ctx.userEmail) {
      throw new Error('User email not found in authentication token.');
    }

    // Get the existing clip to verify it exists
    const existingClip = await openSearchService.getVideoClip(input.id);
    if (!existingClip) {
      throw new Error('Video clip not found');
    }

    // Build updates object with only provided fields
    const updates: any = {
      updatedAt: new Date().toISOString(),
      updatedBy: ctx.userEmail,
    };

    if (input.description !== undefined) {
      updates.description = input.description.trim();
    }

    if (input.shareUrl !== undefined) {
      updates.shareUrl = input.shareUrl;
    }

    if (input.script !== undefined) {
      updates.script = input.script;
    }

    if (input.duration !== undefined) {
      updates.duration = input.duration;
    }

    if (input.characters !== undefined) {
      updates.characters = input.characters;
    }

    if (input.tags !== undefined) {
      updates.tags = input.tags;
    }

    // Convert source input to source object for storage
    if (input.source !== undefined) {
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
      updates.source = source;
    }

    await openSearchService.updateVideoClip(input.id, updates);

    // Get updated clip and return it
    const updatedClip = await openSearchService.getVideoClip(input.id);
    return updatedClip;
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
