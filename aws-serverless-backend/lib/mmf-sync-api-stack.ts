import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as cdk from 'aws-cdk-lib';

export class MmfSyncApiStack extends Stack {
  public readonly appApi: apigw.LambdaRestApi;
  public readonly identityTable: cdk.aws_dynamodb.Table;
  public readonly nuggetTable: cdk.aws_dynamodb.Table;
  public readonly syncPushLambda: NodejsFunction;
  public readonly syncLambda: NodejsFunction;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Tables
    this.identityTable = this.createTable(this, cdk.RemovalPolicy.DESTROY, "IdentityTable", {
      name: 'id',
      type: cdk.aws_dynamodb.AttributeType.STRING
    }, {
        name: 'updatedAt',
        type: cdk.aws_dynamodb.AttributeType.NUMBER
    })

    this.nuggetTable = this.createTable(this, cdk.RemovalPolicy.DESTROY, "NuggetTable", {
      name: 'id',
      type: cdk.aws_dynamodb.AttributeType.STRING
    }, {
        name: 'updatedAt',
        type: cdk.aws_dynamodb.AttributeType.NUMBER
    })

    // Lambdas
    this.syncPushLambda = this.createLambda(this, "SyncPush", 'Syncs to database', 'lib/lambda/sync-push.ts', 'handler', { IDENTITY_TABLE_NAME: this.identityTable.tableName, NUGGET_TABLE_NAME: this.nuggetTable.tableName })
    this.nuggetTable.grantReadWriteData(this.syncPushLambda)
    this.identityTable.grantReadWriteData(this.syncPushLambda)

    this.syncLambda = this.createLambda(this, "Sync", 'Syncs from database', 'lib/lambda/sync.ts', 'handler', { IDENTITY_TABLE_NAME: this.identityTable.tableName, NUGGET_TABLE_NAME: this.nuggetTable.tableName });
    this.nuggetTable.grantReadData(this.syncLambda)
    this.identityTable.grantReadData(this.syncLambda)

    // API
    this.appApi = this.createAppApi({});
    const apiRoot = this.appApi.root.addResource('v1');
    // Sync
    const sync = apiRoot.addResource("sync")
    const syncType = sync.addResource("{collection}")
    syncType.addMethod("GET", new apigw.LambdaIntegration(this.syncLambda))
    syncType.addMethod("POST", new apigw.LambdaIntegration(this.syncPushLambda))
  }

  /**
   * App API
   * This creates a Rest API
   */
  private createAppApi(deployOptions: apigw.StageOptions): apigw.LambdaRestApi {
    return new apigw.RestApi(this, "AppApi", {
        restApiName: "AppApi",
        deployOptions: deployOptions,
        defaultMethodOptions: {
            authorizationType: apigw.AuthorizationType.NONE,
        },
        defaultCorsPreflightOptions: {
            allowHeaders: ['*'],
            allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            allowOrigins: ['*'],
            allowCredentials: true,
        },
        description: `App API`,
    });
  }

  private createLambda(construct: Construct, functionName: string,
    description: string, filePath: string, handler: string, environment?: { [key: string]: string }, timeout?: cdk.Duration,): NodejsFunction {
    const logEvent = new NodejsFunction(construct, functionName, {
        entry: filePath,
        handler: handler,
        functionName: functionName,
        description: description,
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
        environment: environment,
        timeout: timeout || cdk.Duration.seconds(10),
    });
    return logEvent
  }

  private createTable(construct: Construct, removalPolicy: cdk.RemovalPolicy, tableName: string, partitionKey: cdk.aws_dynamodb.Attribute, sortKey: cdk.aws_dynamodb.Attribute): cdk.aws_dynamodb.Table {
    return new cdk.aws_dynamodb.Table(
        construct,
        tableName,
        {
            tableName: tableName,
            partitionKey: partitionKey,
            sortKey: sortKey,
            billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: removalPolicy
        }
    );
  }

}
