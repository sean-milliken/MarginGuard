import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DataProvider } from "./contexts/DataContext";
import ThreeBackground from "./components/3d/ThreeBackground";
import DashboardPage from "./pages/DashboardPage";
import WorkspacePage from "./pages/WorkspacePage";
import ForceChangePasswordPage from "./pages/ForceChangePasswordPage";
import LoginPage from "./pages/LoginPage";
import LogoutPage from "./pages/LogoutPage";
function Protected({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <p className="p-8">Restoring session…</p>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}
export default function App() {
  if (
    import.meta.env.VITE_MOCK_MODE !== "true" &&
    (!import.meta.env.VITE_USER_POOL_ID ||
      !import.meta.env.VITE_USER_POOL_CLIENT_ID)
  )
    return (
      <main className="p-12">
        <h1>MarginGuard configuration required</h1>
        <p>
          Run npm run dev for the local demo, or configure the Cognito
          environment values before building for deployment.
        </p>
      </main>
    );
  return (
    <AuthProvider>
      <DataProvider>
        <ThreeBackground intensity="low" interactive />
        <div className="relative z-10">
          <Routes>
            <Route
              path="/"
              element={
                <Protected>
                  <DashboardPage />
                </Protected>
              }
            />
            {[
              "intelligence",
              "analysis",
              "responses",
              "sources",
              "company",
              "evals",
            ].map((page) => (
              <Route
                key={page}
                path={`/${page}`}
                element={
                  <Protected>
                    <WorkspacePage />
                  </Protected>
                }
              />
            ))}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/logout" element={<LogoutPage />} />
            <Route
              path="/change-password"
              element={<ForceChangePasswordPage />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </DataProvider>
    </AuthProvider>
  );
}
