#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';
import { SesStack } from '../lib/ses-stack';
import { AcmStack } from '../lib/acm-stack';
import { EcrStack } from '../lib/ecr-stack';

const usEast1Env = { account: '910246205140', region: 'us-east-1' };
const env = { account: '910246205140', region: 'us-east-2' };

const app = new cdk.App();

new EcrStack(app, 'Ecr', {
  env,
  repositoryNames: ['video-clips-api', 'video-clips-ui'],
});

new SesStack(app, 'Ses', { env });
const acm = new AcmStack(app, 'Acm', { env: usEast1Env });

new CdkStack(app, 'Dev', {
  env,
  stage: 'dev',
  sesDomain: 'vidclip.co',
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
