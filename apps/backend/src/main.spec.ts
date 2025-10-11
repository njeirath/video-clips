import { ApolloServer } from '@apollo/server';

describe('GraphQL API', () => {
  let server: ApolloServer;

  beforeAll(() => {
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

    const videos = [
      {
        id: '1',
        title: 'Sample Video 1',
        description: 'This is a sample video',
        url: 'https://example.com/video1.mp4',
      },
    ];

    const resolvers = {
      Query: {
        hello: () => 'Hello from GraphQL API!',
        videos: () => videos,
      },
    };

    server = new ApolloServer({
      typeDefs,
      resolvers,
    });
  });

  it('should respond to hello query', async () => {
    const response = await server.executeOperation({
      query: '{ hello }',
    });

    expect(response.body.kind).toBe('single');
    if (response.body.kind === 'single') {
      expect(response.body.singleResult.data?.hello).toBe('Hello from GraphQL API!');
    }
  });

  it('should respond to videos query', async () => {
    const response = await server.executeOperation({
      query: '{ videos { id title } }',
    });

    expect(response.body.kind).toBe('single');
    if (response.body.kind === 'single') {
      expect(response.body.singleResult.data?.videos).toBeDefined();
      expect(Array.isArray(response.body.singleResult.data?.videos)).toBe(true);
    }
  });
});
