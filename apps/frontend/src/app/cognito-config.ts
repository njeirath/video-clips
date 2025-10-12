// Update these values with your Cognito User Pool and App Client details
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-2_NzuIRm18K',
      userPoolClientId: '58l9u9aubgo0nqniag9gtia6js',
      // @ts-ignore
      region: 'us-east-2',
      loginWith: {
        username: true,
      },
    },
  },
});
