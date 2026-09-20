import * as cdk from "aws-cdk-lib/core";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as amplify from "aws-cdk-lib/aws-amplify";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import { HttpUserPoolAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import * as apigwv2Integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as path from "path";
import { Construct } from "constructs";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── DynamoDB Tables ────────────────────────────────────────────────────

    const companiesTable = new dynamodb.Table(this, "CompaniesTable", {
      tableName: "MarginGuardCompanies",
      partitionKey: { name: "companyId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const eventsTable = new dynamodb.Table(this, "EventsTable", {
      tableName: "MarginGuardEvents",
      partitionKey: { name: "eventId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    eventsTable.addGlobalSecondaryIndex({
      indexName: "companyId-index",
      partitionKey: { name: "companyId", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const analysesTable = new dynamodb.Table(this, "AnalysesTable", {
      tableName: "MarginGuardAnalyses",
      partitionKey: { name: "analysisId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    analysesTable.addGlobalSecondaryIndex({
      indexName: "companyId-index",
      partitionKey: { name: "companyId", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const economicDataTable = new dynamodb.Table(this, "EconomicDataTable", {
      tableName: "MarginGuardEconomicData",
      partitionKey: { name: "seriesId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "date", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "expiresAt",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    economicDataTable.addGlobalSecondaryIndex({
      indexName: "seriesId-cachedAt-index",
      partitionKey: { name: "seriesId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "cachedAt", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ── S3 Bucket ──────────────────────────────────────────────────────────

    const sourcesBucket = new s3.Bucket(this, "SourcesBucket", {
      bucketName: `marginguard-sources-${this.account}-${this.region}`,
      versioned: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
          maxAge: 3000,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ── Shared Lambda config ───────────────────────────────────────────────

    const commonEnv: Record<string, string> = {
      COMPANIES_TABLE: companiesTable.tableName,
      EVENTS_TABLE: eventsTable.tableName,
      ANALYSES_TABLE: analysesTable.tableName,
      SOURCES_BUCKET: sourcesBucket.bucketName,
    };

    const lambdaDir = path.join(__dirname, "../../backend/lambda");

    const fn = (id: string, dir: string): lambda.Function =>
      new lambda.Function(this, id, {
        runtime: lambda.Runtime.PYTHON_3_13,
        architecture: lambda.Architecture.ARM_64,
        memorySize: 256,
        timeout: cdk.Duration.seconds(30),
        handler: "handler.handler",
        code: lambda.Code.fromAsset(path.join(lambdaDir, dir)),
        environment: commonEnv,
      });

    // ── Lambda Functions ───────────────────────────────────────────────────

    const healthFn = fn("HealthFunction", "health");
    const sourcesFn = fn("SourcesFunction", "sources");
    const applicationFn = new lambda.Function(this, "ApplicationFunction", {
      runtime: lambda.Runtime.NODEJS_24_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 512,
      timeout: cdk.Duration.seconds(29),
      handler: "lambda.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../backend/app/dist"),
      ),
      environment: {
        ANALYSES_TABLE: analysesTable.tableName,
        ECONOMIC_DATA_TABLE: economicDataTable.tableName,
      },
    });

    const nemotronSecretArn = this.node.tryGetContext("nemotronSecretArn") as
      string | undefined;
    if (nemotronSecretArn) {
      const secret = secretsmanager.Secret.fromSecretPartialArn(
        this,
        "NemotronSecret",
        nemotronSecretArn,
      );
      secret.grantRead(applicationFn);
      applicationFn.addEnvironment("NVIDIA_SECRET_ARN", nemotronSecretArn);
    }

    const fredSecretArn = this.node.tryGetContext("fredSecretArn") as
      string | undefined;
    if (fredSecretArn) {
      const fredSecret = secretsmanager.Secret.fromSecretPartialArn(
        this,
        "FredSecret",
        fredSecretArn,
      );
      fredSecret.grantRead(applicationFn);
      applicationFn.addEnvironment("FRED_SECRET_ARN", fredSecretArn);
    }

    // ── IAM Grants ─────────────────────────────────────────────────────────

    analysesTable.grantReadWriteData(applicationFn);
    economicDataTable.grantReadWriteData(applicationFn);
    sourcesBucket.grantWrite(sourcesFn);

    // ── Cognito (preserved) ────────────────────────────────────────────────

    const userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "margin-guard-user-pool",
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      mfa: cognito.Mfa.OFF,
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool,
      userPoolClientName: "margin-guard-app-client",
      authFlows: { userSrp: true, userPassword: true },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: ["http://localhost:5173/", "http://localhost:3000/"],
        logoutUrls: ["http://localhost:5173/", "http://localhost:3000/"],
      },
      preventUserExistenceErrors: true,
    });

    const authorizer = new HttpUserPoolAuthorizer("ApiAuthorizer", userPool, {
      userPoolClients: [userPoolClient],
    });

    // ── HTTP API with CORS ─────────────────────────────────────────────────

    const httpApi = new apigwv2.HttpApi(this, "MarginGuardApi", {
      apiName: "MarginGuard API",
      corsPreflight: {
        allowHeaders: [
          "Content-Type",
          "Authorization",
          "X-Amz-Date",
          "X-Api-Key",
        ],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
        allowOrigins: ["*"],
        maxAge: cdk.Duration.days(10),
      },
    });

    const addRoute = (
      integrationId: string,
      method: apigwv2.HttpMethod,
      routePath: string,
      targetFn: lambda.IFunction,
    ) => {
      httpApi.addRoutes({
        path: routePath,
        methods: [method],
        authorizer: routePath === "/health" ? undefined : authorizer,
        integration: new apigwv2Integrations.HttpLambdaIntegration(
          integrationId,
          targetFn,
        ),
      });
    };

    addRoute(
      "DashboardInt",
      apigwv2.HttpMethod.GET,
      "/dashboard",
      applicationFn,
    );
    addRoute(
      "ScenarioListInt",
      apigwv2.HttpMethod.GET,
      "/scenarios",
      applicationFn,
    );
    addRoute(
      "SourceListInt",
      apigwv2.HttpMethod.GET,
      "/sources",
      applicationFn,
    );
    addRoute(
      "AnalysisGetInt",
      apigwv2.HttpMethod.GET,
      "/analyses/{id}",
      applicationFn,
    );
    addRoute(
      "IntelligenceInt",
      apigwv2.HttpMethod.POST,
      "/intelligence",
      applicationFn,
    );
    addRoute("HealthInt", apigwv2.HttpMethod.GET, "/health", healthFn);
    addRoute(
      "CompaniesInt",
      apigwv2.HttpMethod.GET,
      "/companies/{companyId}",
      applicationFn,
    );
    addRoute("EventsListInt", apigwv2.HttpMethod.GET, "/events", applicationFn);
    addRoute(
      "EventsGetInt",
      apigwv2.HttpMethod.GET,
      "/events/{id}",
      applicationFn,
    );
    addRoute("SourcesInt", apigwv2.HttpMethod.POST, "/sources", sourcesFn);
    addRoute(
      "AnalysesInt",
      apigwv2.HttpMethod.POST,
      "/analyses",
      applicationFn,
    );
    addRoute(
      "FredSeriesListInt",
      apigwv2.HttpMethod.GET,
      "/fred/series",
      applicationFn,
    );
    addRoute(
      "FredSeriesGetInt",
      apigwv2.HttpMethod.GET,
      "/fred/series/{id}",
      applicationFn,
    );
    addRoute(
      "FredSignalsInt",
      apigwv2.HttpMethod.GET,
      "/fred/signals",
      applicationFn,
    );
    addRoute(
      "FredImpactInt",
      apigwv2.HttpMethod.GET,
      "/fred/impact/{id}",
      applicationFn,
    );
    addRoute(
      "ScenariosInt",
      apigwv2.HttpMethod.POST,
      "/scenarios/{id}/run",
      applicationFn,
    );

    // ── Amplify ────────────────────────────────────────────────────────────

    const amplifyApp = new amplify.CfnApp(this, "AmplifyApp", {
      name: "margin-guard-frontend",
      environmentVariables: [
        { name: "VITE_USER_POOL_ID", value: userPool.userPoolId },
        {
          name: "VITE_USER_POOL_CLIENT_ID",
          value: userPoolClient.userPoolClientId,
        },
        { name: "VITE_API_URL", value: httpApi.apiEndpoint },
        { name: "VITE_AWS_REGION", value: this.region },
      ],
      buildSpec: `version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build -w frontend
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*`,
      customRules: [
        {
          source:
            "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>",
          target: "/index.html",
          status: "200",
        },
      ],
    });

    // ── Outputs ────────────────────────────────────────────────────────────

    new cdk.CfnOutput(this, "ApiUrl", {
      value: httpApi.apiEndpoint,
      description: "HTTP API Gateway URL",
    });
    new cdk.CfnOutput(this, "SourcesBucketName", {
      value: sourcesBucket.bucketName,
      description: "S3 bucket for source documents",
    });
    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
      description: "Cognito User Pool ID",
    });
    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
      description: "Cognito User Pool Client ID",
    });
    new cdk.CfnOutput(this, "CognitoRegion", {
      value: this.region,
      description: "AWS Region for Cognito",
    });
    new cdk.CfnOutput(this, "AmplifyAppId", {
      value: amplifyApp.attrAppId,
      description: "Amplify App ID",
    });
  }
}
