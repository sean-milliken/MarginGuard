import { useState } from "react";
/** Explicit local-demo authentication. Never enabled in the deployed configuration. */
export const useMockAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem("marginguard-demo-logout") !== "true",
  );
  return {
    isAuthenticated,
    isLoading: false,
    error: null,
    cognitoUser: null,
    userAttributes: { email: "demo@marginguard.com", name: "Demo User" },
    login: async () => {
      sessionStorage.removeItem("marginguard-demo-logout");
      setIsAuthenticated(true);
      return { status: "success" as const };
    },
    logout: () => {
      sessionStorage.setItem("marginguard-demo-logout", "true");
      setIsAuthenticated(false);
    },
    completeNewPasswordChallenge: async () => {},
    clearError: () => {},
  };
};
