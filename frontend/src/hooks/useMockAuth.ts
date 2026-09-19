import { useState, useEffect } from 'react';

// Mock auth hook that bypasses Cognito for hackathon demo
export const useMockAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-authenticate on mount
  useEffect(() => {
    setIsAuthenticated(true);
    setIsLoading(false);
  }, []);

  return {
    isAuthenticated: true,
    isLoading: false,
    error: null,
    cognitoUser: null,
    userAttributes: {
      email: 'demo@marginguard.com',
      name: 'Demo User',
      'custom:company': 'Steel City Beverages'
    },
    login: async () => {
      setIsAuthenticated(true);
      return { status: 'success' as const };
    },
    logout: () => {
      setIsAuthenticated(false);
    },
    completeNewPasswordChallenge: async () => {
      return { status: 'success' as const };
    },
    clearError: () => {}
  };
};
