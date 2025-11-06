import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { ApolloProvider } from '@apollo/client/react';
import App from './app/app';
import { fetchAuthSession } from 'aws-amplify/auth';

// Runtime config override (served from /runtime-config.js) - can be edited in the container
const runtimeConfig = (globalThis as any).__RUNTIME_CONFIG__ as
  | { GRAPHQL_URI?: string }
  | undefined;

// Create HTTP link. Priority: runtime config -> Vite env -> fallback localhost
const GRAPHQL_URI =
  runtimeConfig?.GRAPHQL_URI ||
  ((import.meta.env as { VITE_GRAPHQL_URI?: string }).VITE_GRAPHQL_URI) ||
  'http://localhost:3020/graphql';

// Create HTTP link
const httpLink = createHttpLink({
  uri: GRAPHQL_URI,
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
