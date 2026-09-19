import { CognitoUserPool } from "amazon-cognito-identity-js";

// In mock mode, use dummy values to prevent errors
const isMockMode = import.meta.env.VITE_MOCK_MODE === "true";

const poolData = {
  UserPoolId: isMockMode
    ? "us-east-1_MOCK12345"
    : import.meta.env.VITE_USER_POOL_ID || "us-east-1_UNCONFIGURED",
  ClientId: isMockMode
    ? "mockclientid123456789"
    : import.meta.env.VITE_USER_POOL_CLIENT_ID || "unconfigured",
};

export const userPool = new CognitoUserPool(poolData);

export const cognitoConfig = {
  region: import.meta.env.VITE_AWS_REGION || "us-east-1",
  userPoolId: poolData.UserPoolId,
  clientId: poolData.ClientId,
};
