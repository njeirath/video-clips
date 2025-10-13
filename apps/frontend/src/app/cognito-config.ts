// Update these values with your Cognito User Pool and App Client details
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-2_CV9d0tKnO',
      userPoolClientId: '4lk87f6cg3o2dr9sbsldkv8ntq',
      // @ts-ignore
      region: 'us-east-2',
      loginWith: {
        username: true,
      },
    },
  },
});
