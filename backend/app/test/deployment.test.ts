import test from "node:test";
import assert from "node:assert/strict";
import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { InfraStack } from "../../../infra/lib/infra-stack";
test("AWS template routes analysis to Node and requires Cognito on application routes", () => {
  const app = new App();
  const stack = new InfraStack(app, "IntegrationTest", {
    env: { account: "111111111111", region: "us-east-1" },
  });
  const template = Template.fromStack(stack);
  template.hasResourceProperties("AWS::Lambda::Function", {
    Runtime: "nodejs24.x",
    Handler: "lambda.handler",
  });
  const routes = Object.values(
    template.findResources("AWS::ApiGatewayV2::Route"),
  ) as { Properties: { RouteKey: string; AuthorizationType?: string } }[];
  for (const route of routes)
    if (route.Properties.RouteKey !== "GET /health")
      assert.equal(
        route.Properties.AuthorizationType,
        "JWT",
        route.Properties.RouteKey,
      );
  assert.ok(routes.some((r) => r.Properties.RouteKey === "POST /intelligence"));
  assert.ok(routes.some((r) => r.Properties.RouteKey === "GET /dashboard"));
});
