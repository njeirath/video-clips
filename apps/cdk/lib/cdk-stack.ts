
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';

interface CdkStackProps extends cdk.StackProps {
  stage: 'dev' | 'prod';
}

export class CdkStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: CdkStackProps) {
    super(scope, id, props);

    const stage = props.stage;
    const isDev = stage === 'dev';

    // Cognito User Pool for dev or prod
    const userPool = new cognito.UserPool(this, `${stage.charAt(0).toUpperCase() + stage.slice(1)}UserPool`, {
      userPoolName: `${stage}-user-pool`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: true,
      },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: !isDev, // Require uppercase in prod
        requireDigits: true,
        requireSymbols: !isDev,   // Require symbols in prod
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: isDev ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
    });
  }
}
