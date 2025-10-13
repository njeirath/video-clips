import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { printSchema } from "graphql";
import { writeFileSync } from "fs";
import { SampleResolver } from "./resolvers/sample-resolver";
import { VideoClipResolver } from "./resolvers/video-clip.resolver";

async function generateSchema() {
  const schema = await buildSchema({
    resolvers: [SampleResolver, VideoClipResolver],
  });

  const schemaString = printSchema(schema);
  writeFileSync("schema.graphql", schemaString);
  console.log("Schema generated successfully at schema.graphql");
}

generateSchema();
