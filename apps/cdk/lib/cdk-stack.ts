import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as iam from 'aws-cdk-lib/aws-iam';

interface CdkStackProps extends cdk.StackProps {
  stage: 'dev' | 'prod';
  sesDomain: string;
  certificateArn: string;
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CdkStackProps) {
    super(scope, id, props);

    const stage = props.stage;
    const isDev = stage !== 'prod';

    // S3 bucket for assets
    const assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      removalPolicy: isDev
        ? cdk.RemovalPolicy.DESTROY
        : cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: isDev,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
        },
      ],
    });

    // IAM constructs (require inside the constructor so no top-level import change is needed)

    // Create an IAM user for programmatic access to the assets bucket
    const assetsUser = new iam.User(this, 'BackendUser', {
      userName: `${stage}-backend-user`,
    });

    // Grant read/write permissions on the assets bucket to both the user and the role
    assetsBucket.grantReadWrite(assetsUser);

    // CloudFront distribution in front of the S3 bucket
    // ACM certificate for the CloudFront distribution
    const domainPrefix = isDev ? `assets-${stage}` : '';
    const domainName = isDev
      ? `${domainPrefix}.${props.sesDomain}`
      : `${props.sesDomain}`;

    const distribution = new cloudfront.Distribution(
      this,
      'AssetsDistribution',
      {
        defaultBehavior: {
          origin: origins.S3BucketOrigin.withOriginAccessControl(assetsBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        domainNames: [domainName],
        certificate: cdk.aws_certificatemanager.Certificate.fromCertificateArn(
          this,
          'cert',
          props.certificateArn
        ),
      }
    );

    // Route53 DNS entry for assets-dev.vidclip.co
    const hostedZone = route53.HostedZone.fromLookup(this, 'VidclipZone', {
      domainName: props.sesDomain,
    });

    new route53.ARecord(this, 'AssetsDevAliasRecord', {
      zone: hostedZone,
      recordName: domainPrefix,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
    });

    new route53.AaaaRecord(this, 'AssetsDevAliasRecordAAAA', {
      zone: hostedZone,
      recordName: domainPrefix,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
    });

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
