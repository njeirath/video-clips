import express from 'express';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

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

// Create Apollo Server instance
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Start the server
async function startServer() {
  const { url } = await startStandaloneServer(server, {
    listen: { port, host },
  });

  console.log(`[ ready ] ${url}`);
  console.log(`[ graphql ] ${url}graphql`);
}

startServer().catch((error) => {
  console.error('Error starting server:', error);
  process.exit(1);
});
