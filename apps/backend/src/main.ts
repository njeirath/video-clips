
import "reflect-metadata";
import { ApolloServer } from "apollo-server-express";
import express from "express";
import { buildSchema } from "type-graphql";
import { SampleResolver } from "./resolvers/sample-resolver";

async function bootstrap() {
  const schema = await buildSchema({
    resolvers: [SampleResolver],
  });

  const server = new ApolloServer({ schema });
  const app = express();
  await server.start();
  server.applyMiddleware({ app });

  app.listen(3000, () => {
    console.log("Server started on http://localhost:3000/graphql");
  });
}

bootstrap();
