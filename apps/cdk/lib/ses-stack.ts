import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as ses from 'aws-cdk-lib/aws-ses';
import * as route53 from 'aws-cdk-lib/aws-route53';

export class SesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // SES Domain Identity (replace with your domain)
    const domainName = 'vidclip.co';

    // Lookup the hosted zone in Route 53
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName,
    });

    // SES Domain Identity with automatic DNS validation
    const sesDomainIdentity = new ses.EmailIdentity(this, 'SesDomainIdentity', {
      identity: ses.Identity.publicHostedZone(hostedZone),
      mailFromDomain: `mail.${domainName}`,
      dkimSigning: true,
      feedbackForwarding: true,
    });
  }
}
