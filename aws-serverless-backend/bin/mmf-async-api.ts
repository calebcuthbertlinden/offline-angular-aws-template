#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MmfSyncApiStack } from '../lib/mmf-sync-api-stack';

const app = new cdk.App();
new MmfSyncApiStack(app, 'MmfSyncApiStack');
