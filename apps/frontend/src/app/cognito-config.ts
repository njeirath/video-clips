// Update these values with your Cognito User Pool and App Client details
import { Amplify } from 'aws-amplify';

// Read runtime config injected at container runtime (public/runtime-config.js)
const runtimeConfig = (typeof window !== 'undefined' && (window as any).__RUNTIME_CONFIG__) || {};

const userPoolId = runtimeConfig.COGNITO_USER_POOL_ID || 'us-east-2_CV9d0tKnO';
const userPoolClientId = runtimeConfig.COGNITO_USER_POOL_CLIENT_ID || '4lk87f6cg3o2dr9sbsldkv8ntq';
const region = runtimeConfig.COGNITO_REGION || 'us-east-2';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId,
      // @ts-ignore
      region,
      loginWith: {
        username: true,
      },
    },
  },
});
