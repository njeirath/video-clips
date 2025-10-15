import { ObjectType, Field, ID, InputType } from "type-graphql";

@ObjectType()
export class VideoClip {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  description: string;

  @Field(() => String)
  userId: string;

  @Field(() => String)
  userEmail: string;

  @Field(() => String, { nullable: true })
  s3Key?: string;

  @Field(() => String, { nullable: true })
  videoUrl?: string;

  @Field(() => String)
  createdAt: string;
}

@InputType()
export class CreateVideoClipInput {
  @Field(() => String)
  name: string;

  @Field(() => String)
  description: string;

  @Field(() => String, { nullable: true })
  s3Key?: string;

  @Field(() => String, { nullable: true })
  videoUrl?: string;
}

@ObjectType()
export class PresignedUrlResponse {
  @Field(() => String)
  uploadUrl: string;

  @Field(() => String)
  s3Key: string;

  @Field(() => String)
  videoUrl: string;
}

