import express from 'express';
import { ApolloServer } from 'apollo-server-express';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// GraphQL schema definition
const typeDefs = `#graphql
  type Query {
    hello: String
    videos: [Video!]!
  }

  type Video {
    id: ID!
    title: String!
    description: String
    url: String!
  }

`;

// Sample data
const videos = [
  {
    id: '1',
    title: 'Sample Video 1',
    description: 'This is a sample video',
    url: 'https://example.com/video1.mp4',
  },
  {
    id: '2',
    title: 'Sample Video 2',
    description: 'Another sample video',
    url: 'https://example.com/video2.mp4',
  },
];

// Resolvers

const resolvers = {
  Query: {
    hello: () => 'Hello from GraphQL API!',
    videos: () => videos,
  },
};

async function startServer() {
  const app = express();

  // ApolloServer as middleware (REST+GraphQL)
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  app.listen(port, host, () => {
    console.log(`[ ready ] http://${host}:${port}`);
    console.log(`[ graphql ] http://${host}:${port}/graphql`);
  });
}

startServer().catch((error) => {
  console.error('Error starting server:', error);
  process.exit(1);
});
