import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

interface StorageStackProps extends cdk.StackProps {
  stage: 'dev' | 'prod';
}

export class StorageStack extends cdk.Stack {
  public readonly videoBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const stage = props.stage;
    const isDev = stage === 'dev';

    // S3 bucket for video files
    this.videoBucket = new s3.Bucket(this, 'VideoBucket', {
      bucketName: `${stage}-video-clips-storage`,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: ['*'], // In production, restrict this to your domain
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: isDev
        ? cdk.RemovalPolicy.DESTROY
        : cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: isDev, // Only delete objects in dev environment
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
    });

    // CloudFront Origin Access Identity for S3
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'VideoClipsOAI',
      {
        comment: `OAI for ${stage} video clips bucket`,
      }
    );

    // Grant CloudFront read access to S3 bucket
    this.videoBucket.grantRead(originAccessIdentity);

    // CloudFront distribution for video delivery
    this.distribution = new cloudfront.Distribution(
      this,
      'VideoClipsDistribution',
      {
        defaultBehavior: {
          origin: new origins.S3Origin(this.videoBucket, {
            originAccessIdentity,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only North America and Europe
        comment: `${stage} Video Clips Distribution`,
      }
    );

    // Output the bucket name and CloudFront domain
    new cdk.CfnOutput(this, 'VideoBucketName', {
      value: this.videoBucket.bucketName,
      description: 'S3 bucket name for video storage',
      exportName: `${stage}-VideoBucketName`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
      exportName: `${stage}-CloudFrontDomain`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront distribution ID',
      exportName: `${stage}-CloudFrontDistributionId`,
    });
  }
}
