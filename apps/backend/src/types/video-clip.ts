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

  @Field(() => String)
  createdAt: string;
}

@InputType()
export class CreateVideoClipInput {
  @Field(() => String)
  name: string;

  @Field(() => String)
  description: string;
}
