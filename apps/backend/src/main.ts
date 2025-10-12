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

  type SignupResult {
    message: String!
    userSub: String
  }

  type Mutation {
    signup(username: String!, password: String!): SignupResult!
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
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
if (!COGNITO_CLIENT_ID)
  throw new Error('COGNITO_CLIENT_ID environment variable is not set.');

const REGION = process.env.AWS_REGION || 'us-east-2';
const cognito = new CognitoIdentityProviderClient({ region: REGION });

const resolvers = {
  Query: {
    hello: () => 'Hello from GraphQL API!',
    videos: () => videos,
  },
  Mutation: {
    signup: async (
      _: any,
      { username, password }: { username: string; password: string }
    ) => {
      if (!username || !password) {
        throw new Error('Username and password are required.');
      }
      try {
        const command = new SignUpCommand({
          ClientId: COGNITO_CLIENT_ID,
          Username: username,
          Password: password,
          UserAttributes: [{ Name: 'preferred_username', Value: username }],
        });
        const response = await cognito.send(command);
        return { message: 'Signup successful', userSub: response.UserSub };
      } catch (error: any) {
        throw new Error(error.message || 'Signup failed');
      }
    },
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
