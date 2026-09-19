import React, { createContext, useContext, ReactNode } from 'react';
import { AuthProvider as RealAuthProvider, useAuth as useRealAuth } from '../hooks/useAuth';
import { useMockAuth } from '../hooks/useMockAuth';

// Check if we're in mock mode
const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';

// Create a context for auth (will be provided by either real or mock)
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  cognitoUser: any;
  userAttributes: Record<string, string>;
  login: (...args: any[]) => Promise<any>;
  logout: () => void;
  completeNewPasswordChallenge: (...args: any[]) => Promise<any>;
  clearError: () => void;
}

const AuthWrapperContext = createContext<AuthContextType | undefined>(undefined);

// Mock Auth Provider (simple passthrough)
const MockAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const mockAuth = useMockAuth();

  return (
    <AuthWrapperContext.Provider value={mockAuth}>
      {children}
    </AuthWrapperContext.Provider>
  );
};

// Unified AuthProvider that chooses real or mock based on env
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  if (isMockMode) {
    return <MockAuthProvider>{children}</MockAuthProvider>;
  }

  // Real auth mode - use the existing AuthProvider and bridge to our context
  return (
    <RealAuthProvider>
      <AuthBridge>{children}</AuthBridge>
    </RealAuthProvider>
  );
};

// Bridge component to connect real auth to our wrapper context
const AuthBridge: React.FC<{ children: ReactNode }> = ({ children }) => {
  const realAuth = useRealAuth();

  return (
    <AuthWrapperContext.Provider value={realAuth}>
      {children}
    </AuthWrapperContext.Provider>
  );
};

// Hook to use auth (works with both real and mock)
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthWrapperContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
