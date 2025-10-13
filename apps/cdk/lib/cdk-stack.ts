import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';

interface CdkStackProps extends cdk.StackProps {
  stage: 'dev' | 'prod';
  sesDomain: string;
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CdkStackProps) {
    super(scope, id, props);

    const stage = props.stage;
    const isDev = stage === 'dev';

    // Cognito User Pool for dev or prod
    const userPool = new cognito.UserPool(this, `UserPool`, {
      userPoolName: `${stage}-user-pool`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      signInPolicy: {
        allowedFirstAuthFactors: {
          password: true,
          emailOtp: true,
        },
      },
      autoVerify: { email: true },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: isDev
        ? cdk.RemovalPolicy.DESTROY
        : cdk.RemovalPolicy.RETAIN,
      email: cognito.UserPoolEmail.withSES({
        fromEmail: `no-reply@${props.sesDomain}`,
        sesVerifiedDomain: props.sesDomain,
      }),
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
      },
    });

    // Cognito User Pool Client (App Client)
    const userPoolClient = new cognito.UserPoolClient(
      this,
      `${stage.charAt(0).toUpperCase() + stage.slice(1)}UserPoolClient`,
      {
        userPool,
        userPoolClientName: `${stage}-user-pool-client`,
        generateSecret: false,
        authFlows: {
          userPassword: false,
          userSrp: false,
          custom: false,
          user: true,
        },
      }
    );
  }
}
