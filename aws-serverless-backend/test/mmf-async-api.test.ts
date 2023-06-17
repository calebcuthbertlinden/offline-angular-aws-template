import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as MmfAsyncApi from '../lib/mmf-sync-api-stack';

test('SQS Queue and SNS Topic Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new MmfAsyncApi.MmfSyncApiStack(app, 'MyTestStack');
  // THEN

  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::SQS::Queue', {
    VisibilityTimeout: 300
  });
  template.resourceCountIs('AWS::SNS::Topic', 1);
});
