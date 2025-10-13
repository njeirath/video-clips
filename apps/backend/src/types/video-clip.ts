import { ObjectType, Field, ID, InputType } from "type-graphql";

@ObjectType()
export class VideoClip {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field()
  userId: string;

  @Field()
  createdAt: string;
}

@InputType()
export class CreateVideoClipInput {
  @Field()
  name: string;

  @Field()
  description: string;
}
