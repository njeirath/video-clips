import 'reflect-metadata';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { buildSchema } from 'type-graphql';
import { resolvers } from './resolvers';
import { Context } from './resolvers/video-clip.resolver';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

// Create Cognito JWT verifier
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID || 'us-east-2_CV9d0tKnO',
  tokenUse: 'id',
  clientId: process.env.COGNITO_CLIENT_ID || '4lk87f6cg3o2dr9sbsldkv8ntq',
});

async function bootstrap() {
  const schema = await buildSchema({
    resolvers: [...resolvers],
  });

  const server = new ApolloServer({
    schema,
    context: async ({ req }): Promise<Context> => {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return {};
      }

      try {
        const payload = await verifier.verify(token);
        return {
          userId: payload.sub,
          userEmail: payload.email as string,
          user: payload,
        };
      } catch (error) {
        console.error('Token verification failed:', error);
        return {};
      }
    },
  });

  const app = express();
  await server.start();
  server.applyMiddleware({ app });

  const PORT = process.env.PORT ? Number(process.env.PORT) : 3020;

  // Start the HTTP server and keep a reference so we can close it on shutdown
  const httpServer = app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}/graphql`);
  });

  // Graceful shutdown helper
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    try {
      // Stop accepting new requests
      httpServer.close((err?: Error) => {
        if (err) {
          console.error('Error closing HTTP server:', err);
        } else {
          console.log('HTTP server closed.');
        }
      });

      // Stop Apollo server
      await server.stop();
      console.log('Apollo server stopped.');

      // Give some time for close callbacks to run then exit
      setTimeout(() => {
        console.log('Shutdown complete. Exiting.');
        process.exit(0);
      }, 100);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap();
