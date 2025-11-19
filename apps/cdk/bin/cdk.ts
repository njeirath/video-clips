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
  certificateArn:
    'arn:aws:acm:us-east-1:910246205140:certificate/3644ea47-07ad-47f4-95ce-ccce1fe5ad5d',
});

new CdkStack(app, 'Prod', {
  env,
  stage: 'prod',
  sesDomain: 'vidclip.co',
  certificateArn:
    'arn:aws:acm:us-east-1:910246205140:certificate/6eed4165-aef9-4f01-844b-c040d7686334',
});
