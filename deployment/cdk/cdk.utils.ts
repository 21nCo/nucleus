import { HostedZone, IHostedZone } from "aws-cdk-lib/aws-route53";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import { Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { resolveDomainName } from "../deploy.utils";

export function resolveAcmCertificate(
  scope: Construct,
  zone: IHostedZone,
  domain: string
) {
  return new acm.Certificate(scope, `${domain}-certificate`, {
    domainName: domain,
    subjectAlternativeNames: [`*.${domain}`],
    validation: acm.CertificateValidation.fromDns(zone)
  });
}

export function resolveCommonResources(
  scope: Stack,
  props: {
    domain: string;
    subdomain?: string;
    isUseParentZone?: boolean;
  }
) {
  const zone = HostedZone.fromLookup(scope, "baseZone", {
    domainName:
      props.isUseParentZone || !props.subdomain
        ? props.domain
        : resolveDomainName(props)
  });
  // const bunRuntimeLayer = LayerVersion.fromLayerVersionArn(
  //   scope,
  //   "BunLayer",
  //   `arn:aws:lambda:${scope.region}:${scope.account}:layer:bun:1`
  // );
  return { zone };
}
