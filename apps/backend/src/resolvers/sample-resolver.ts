import { Resolver, Query } from "type-graphql";

@Resolver()
export class SampleResolver {
  @Query(() => String)
  hello() {
    return "Hello from TypeGraphQL!";
  }
}
