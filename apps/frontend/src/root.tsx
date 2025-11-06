import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { ApolloProvider } from '@apollo/client/react';
import App from './app/app';
import { fetchAuthSession } from 'aws-amplify/auth';

// Create HTTP link
const httpLink = createHttpLink({
  uri: 'http://localhost:3020/graphql',
});

// Create auth link to add bearer token to all requests
const authLink = setContext(async (_, { headers }) => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    if (token) {
      return {
        headers: {
          ...headers,
          authorization: `Bearer ${token}`,
        },
      };
    }
  } catch (error) {
    // User not authenticated, continue without token
    console.debug('No authentication token available');
  }

  return { headers };
});

// Combine auth link and HTTP link
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export function Root() {
  return (
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  );
}

export default Root;
