
import "reflect-metadata";
import { ApolloServer } from "apollo-server-express";
import express from "express";
import { buildSchema } from "type-graphql";
import { SampleResolver } from "./resolvers/sample-resolver";
import { VideoClipResolver, Context } from "./resolvers/video-clip.resolver";
import { CognitoJwtVerifier } from "aws-jwt-verify";

// Create Cognito JWT verifier
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID || "us-east-2_CV9d0tKnO",
  tokenUse: "id",
  clientId: process.env.COGNITO_CLIENT_ID || "4lk87f6cg3o2dr9sbsldkv8ntq",
});

async function bootstrap() {
  const schema = await buildSchema({
    resolvers: [SampleResolver, VideoClipResolver],
  });

  const server = new ApolloServer({
    schema,
    context: async ({ req }): Promise<Context> => {
      const token = req.headers.authorization?.replace("Bearer ", "");
      
      if (!token) {
        return {};
      }

      try {
        const payload = await verifier.verify(token);
        return {
          userId: payload.sub,
          user: payload,
        };
      } catch (error) {
        console.error("Token verification failed:", error);
        return {};
      }
    },
  });

  const app = express();
  await server.start();
  server.applyMiddleware({ app });

  app.listen(3000, () => {
    console.log("Server started on http://localhost:3000/graphql");
  });
}

bootstrap();
