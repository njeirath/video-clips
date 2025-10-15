import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as route53 from 'aws-cdk-lib/aws-route53';

export class AcmStack extends cdk.Stack {
  certificate: cdk.aws_certificatemanager.Certificate;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainName = 'vidclip.co';

    this.certificate = new cdk.aws_certificatemanager.Certificate(
      this,
      'AssetsCertificate',
      {
        domainName: `*.${domainName}`,
        validation: cdk.aws_certificatemanager.CertificateValidation.fromDns(
          route53.HostedZone.fromLookup(this, 'AssetsCertZone', {
            domainName: domainName,
          })
        ),
      }
    );
  }
}
