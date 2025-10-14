import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { printSchema } from "graphql";
import { writeFileSync } from "fs";
import { resolvers } from "./resolvers";

async function generateSchema() {
  const schema = await buildSchema({
    resolvers: [...resolvers],
  });

  const schemaString = printSchema(schema);
  writeFileSync("schema.graphql", schemaString);
  console.log("Schema generated successfully at schema.graphql");
}

generateSchema();
