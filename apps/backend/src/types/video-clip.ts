import { ObjectType, Field, ID, InputType, Int, Float, createUnionType } from "type-graphql";

// Source types for video clips
@ObjectType()
export class ShowSource {
  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  airDate?: string;

  @Field(() => Int, { nullable: true })
  season?: number;

  @Field(() => Int, { nullable: true })
  episode?: number;

  @Field(() => Float, { nullable: true })
  start?: number;

  @Field(() => Float, { nullable: true })
  end?: number;
}

@ObjectType()
export class MovieSource {
  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  releaseDate?: string;

  @Field(() => Float, { nullable: true })
  start?: number;

  @Field(() => Float, { nullable: true })
  end?: number;
}

export const VideoClipSource = createUnionType({
  name: "VideoClipSource",
  types: () => [ShowSource, MovieSource] as const,
  resolveType: (value) => {
    if ("season" in value || "episode" in value || "airDate" in value) {
      return ShowSource;
    }
    if ("releaseDate" in value) {
      return MovieSource;
    }
    return undefined;
  },
});

@ObjectType()
export class VideoClip {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String)
  userId: string;

  @Field(() => String)
  userEmail: string;

  @Field(() => String, { nullable: true })
  s3Key?: string;

  @Field(() => String, { nullable: true })
  videoUrl?: string;

  @Field(() => String, { nullable: true })
  shareUrl?: string;

  @Field(() => String, { nullable: true })
  script?: string;

  @Field(() => Float, { nullable: true })
  duration?: number;

  @Field(() => [String], { nullable: true })
  characters?: string[];

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => String, { nullable: true })
  thumbnailUrl?: string;

  @Field(() => String, { nullable: true })
  blurhash?: string;

  @Field(() => VideoClipSource, { nullable: true })
  source?: typeof VideoClipSource;

  @Field(() => String)
  createdAt: string;

  @Field(() => String, { nullable: true })
  updatedAt?: string;

  @Field(() => String, { nullable: true })
  updatedBy?: string;
}

// Input types for source
@InputType()
export class ShowSourceInput {
  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  airDate?: string;

  @Field(() => Int, { nullable: true })
  season?: number;

  @Field(() => Int, { nullable: true })
  episode?: number;

  @Field(() => Float, { nullable: true })
  start?: number;

  @Field(() => Float, { nullable: true })
  end?: number;
}

@InputType()
export class MovieSourceInput {
  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  releaseDate?: string;

  @Field(() => Float, { nullable: true })
  start?: number;

  @Field(() => Float, { nullable: true })
  end?: number;
}

@InputType()
export class VideoClipSourceInput {
  @Field(() => ShowSourceInput, { nullable: true })
  show?: ShowSourceInput;

  @Field(() => MovieSourceInput, { nullable: true })
  movie?: MovieSourceInput;
}

@InputType()
export class CreateVideoClipInput {
  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  s3Key?: string;

  @Field(() => String, { nullable: true })
  videoUrl?: string;

  @Field(() => String, { nullable: true })
  script?: string;

  @Field(() => Float, { nullable: true })
  duration?: number;

  @Field(() => [String], { nullable: true })
  characters?: string[];

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => String, { nullable: true })
  thumbnailUrl?: string;

  @Field(() => String, { nullable: true })
  blurhash?: string;

  @Field(() => VideoClipSourceInput, { nullable: true })
  source?: VideoClipSourceInput;
}

@InputType()
export class UpdateVideoClipInput {
  @Field(() => String)
  id: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  shareUrl?: string;

  @Field(() => String, { nullable: true })
  script?: string;

  @Field(() => Float, { nullable: true })
  duration?: number;

  @Field(() => [String], { nullable: true })
  characters?: string[];

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => VideoClipSourceInput, { nullable: true })
  source?: VideoClipSourceInput;
}

@ObjectType()
export class ShowWithCount {
  @Field(() => String)
  name: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class PresignedUrlResponse {
  @Field(() => String)
  uploadUrl: string;

  @Field(() => String)
  s3Key: string;

  @Field(() => String)
  videoUrl: string;

  @Field(() => String, { nullable: true })
  thumbnailUploadUrl?: string;

  @Field(() => String, { nullable: true })
  thumbnailS3Key?: string;

  @Field(() => String, { nullable: true })
  thumbnailUrl?: string;
}

