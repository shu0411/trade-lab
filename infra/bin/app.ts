#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TradeLabStack } from '../lib/trade-lab-stack';

const app = new cdk.App();
new TradeLabStack(app, 'TradeLabStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'ap-northeast-1',
  },
});
