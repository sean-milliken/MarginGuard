import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import ThreeBackground from './components/3d/ThreeBackground';
import DashboardPage from './pages/DashboardPage';
import ForceChangePasswordPage from './pages/ForceChangePasswordPage';
import LoginPage from './pages/LoginPage';
import LogoutPage from './pages/LogoutPage';

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        {/* 3D Background Layer */}
        <ThreeBackground intensity="low" interactive />

        {/* Main App Routes */}
        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/logout" element={<LogoutPage />} />
            <Route path="/change-password" element={<ForceChangePasswordPage />} />
          </Routes>
        </div>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
