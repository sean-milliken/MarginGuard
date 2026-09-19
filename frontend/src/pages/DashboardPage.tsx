import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, userAttributes } = useAuth();
  const { company } = useData();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/logout');
  };

  return (
    <div className="min-h-screen">
      <header className="bg-bg-secondary shadow-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-text-secondary hover:text-primary-500 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <Card>
          <h2 className="text-base font-semibold text-text-primary mb-3">
            {company.name}
          </h2>

          <div className="space-y-3 text-sm text-text-secondary">
            <p className="text-xs">
              {userAttributes.email}
            </p>

            <div className="bg-bg-secondary rounded-lg p-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-text-tertiary block">Revenue</span>
                  <p className="text-text-primary font-semibold">${(company.revenue / 1_000_000).toFixed(1)}M</p>
                </div>
                <div>
                  <span className="text-text-tertiary block">Cash</span>
                  <p className="text-text-primary font-semibold">${(company.cash / 1_000).toFixed(0)}K</p>
                </div>
                <div>
                  <span className="text-text-tertiary block">Monthly Burn</span>
                  <p className="text-text-primary font-semibold">${(company.monthlyExpenses / 1_000).toFixed(1)}K</p>
                </div>
                <div>
                  <span className="text-text-tertiary block">Runway</span>
                  <p className="text-text-primary font-semibold">{company.burnRate} mo</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-success">
              ✓ 3D Active • Mock Mode
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
