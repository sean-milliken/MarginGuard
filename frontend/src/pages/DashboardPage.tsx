import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { CriticalRiskCard, EventTimeline, SupplierExposure } from '../components/features/Dashboard';
import { Tilt3D } from '../components/utility/Tilt3D';
import { AnimatedNumber } from '../components/utility/AnimatedNumber';
import { Sidebar } from '../components/layout/Sidebar';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { company, events, currentScenario, currentEvent } = useData();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const totalMarginAtRisk = 24_500 + 8_200 + 15_800;
  const activeRisks = events.filter(
    (e) => e.severity === 'HIGH' || e.severity === 'CRITICAL'
  ).length;

  const rightSidebarMetrics = [
    { label: 'Cash Position', value: company.cash, format: 'currency' as const, color: '#10B981', trend: '-2.3%' },
    { label: 'Monthly Burn', value: company.monthlyExpenses, format: 'currency' as const, color: '#EF4444', trend: '+1.8%' },
    { label: 'Active Risks', value: activeRisks, format: 'number' as const, color: '#EF4444', trend: '+1 today' },
    { label: 'Margin at Risk', value: totalMarginAtRisk, format: 'currency' as const, color: '#EF4444', trend: '+$24.5K' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area - offset by sidebar width */}
      <div className="flex-1 ml-[220px]">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-bg-primary/80 backdrop-blur-xl">
          <div className="flex items-center justify-between px-6 py-3">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-xl font-bold text-primary-300">
                Financial Command Center
              </h1>
            </motion.div>

            <div className="flex items-center gap-4">
              {/* Search bar - inspired by Figma */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
              >
                <input
                  type="text"
                  placeholder="Search events, suppliers..."
                  className="h-9 w-[260px] rounded-full border border-border bg-bg-secondary px-4 pr-10 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-primary-500/50 transition-colors"
                />
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </motion.div>

              <motion.div
                className="flex items-center gap-2 rounded-full bg-success-bg border border-success/20 px-3 py-1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                <span className="text-xs font-medium text-success">Live</span>
              </motion.div>

              <motion.button
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-600/20"
                whileHover={{ scale: 1.03, boxShadow: '0 12px 30px rgba(3,105,161,0.35)' }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Simulate Event
              </motion.button>
            </div>
          </div>
        </header>

        {/* Dashboard Body: Main + Right Sidebar */}
        <div className="flex">
          {/* Main Content */}
          <main className="flex-1 p-6 space-y-5 min-w-0">
            {/* Hero: Critical Risk Alert */}
            {currentScenario && currentEvent && (
              <CriticalRiskCard
                event={currentEvent}
                scenario={currentScenario}
                delay={0.15}
                onAnalyze={() => {}}
              />
            )}

            {/* Bottom split: Timeline + Supplier Exposure */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
              <div className="xl:col-span-3">
                <EventTimeline events={events} delay={0.35} />
              </div>
              <div className="xl:col-span-2">
                <SupplierExposure suppliers={company.suppliers} delay={0.4} />
              </div>
            </div>

            {/* Product Margins */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Tilt3D tiltMax={4} scale={1.005} perspective={1200}>
                <div className="relative overflow-hidden rounded-xl border border-border bg-bg-tertiary"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className="pointer-events-none absolute inset-0 rounded-xl"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 40%)' }}
                  />
                  <div className="flex items-center justify-between border-b border-border px-5 py-4"
                    style={{ transform: 'translateZ(10px)' }}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <h3 className="text-sm font-semibold text-text-primary">Product Margins</h3>
                    </div>
                    <span className="text-xs text-text-tertiary">Monthly overview</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border"
                    style={{ transform: 'translateZ(15px)' }}
                  >
                    {company.products.map((product, index) => (
                      <motion.div
                        key={product.id}
                        className="p-5 hover:bg-bg-hover/30 transition-colors"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.55 + index * 0.08 }}
                      >
                        <p className="text-sm font-medium text-text-primary mb-1">{product.name}</p>
                        <p className="text-2xl font-bold text-text-primary">
                          ${product.totalMargin.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary">
                          <span>{product.unitsPerMonth.toLocaleString()} units/mo</span>
                          <span className="text-border">|</span>
                          <span>${product.marginPerUnit.toFixed(2)}/unit</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </Tilt3D>
            </motion.div>
          </main>

          {/* Right Sidebar - Stacked metric cards (Figma-inspired) */}
          <aside className="hidden lg:block w-[280px] shrink-0 border-l border-border p-5 space-y-4">
            {/* Company header card */}
            <motion.div
              className="rounded-xl border border-border bg-bg-tertiary p-5 text-center"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="pointer-events-none absolute inset-0 rounded-xl"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 40%)' }}
              />
              <p className="text-xs text-text-tertiary uppercase tracking-wider mb-2">Monitoring</p>
              <h3 className="text-base font-semibold text-text-primary">{company.name}</h3>
              <p className="text-xs text-text-tertiary mt-1">{company.industry}</p>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-text-tertiary mb-1">Annual Revenue</p>
                <p className="text-lg font-bold text-primary-300">
                  ${(company.revenue / 1_000_000).toFixed(1)}M
                </p>
              </div>
            </motion.div>

            {/* Stacked metric cards */}
            {rightSidebarMetrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.08 }}
              >
                <Tilt3D tiltMax={10} scale={1.02} perspective={600}>
                  <div className="relative overflow-hidden rounded-xl border border-border bg-bg-tertiary p-4"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className="absolute top-0 left-0 h-0.5 w-full"
                      style={{ background: metric.color }}
                    />
                    <div className="pointer-events-none absolute inset-0 rounded-xl"
                      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)' }}
                    />
                    <div className="flex items-center justify-between mb-2" style={{ transform: 'translateZ(15px)' }}>
                      <p className="text-xs text-text-tertiary font-medium uppercase tracking-wider">
                        {metric.label}
                      </p>
                      <span className="text-[10px] font-semibold text-error">
                        {metric.trend}
                      </span>
                    </div>
                    <div style={{ transform: 'translateZ(25px)' }}>
                      <AnimatedNumber
                        value={metric.value}
                        format={metric.format}
                        decimals={0}
                        className="text-2xl font-bold text-text-primary"
                        duration={1400}
                      />
                    </div>
                    {/* Mini progress bar */}
                    <div className="mt-3 h-1 w-full rounded-full bg-bg-primary overflow-hidden"
                      style={{ transform: 'translateZ(10px)' }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: metric.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((metric.value / company.cash) * 100, 100)}%` }}
                        transition={{ duration: 1.2, delay: 0.3 + index * 0.1, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="pointer-events-none absolute -bottom-6 -right-6 h-16 w-16 rounded-full blur-xl opacity-10"
                      style={{ background: metric.color }}
                    />
                  </div>
                </Tilt3D>
              </motion.div>
            ))}

            {/* Runway indicator */}
            <motion.div
              className="rounded-xl border border-warning/20 bg-warning-bg p-4 text-center"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Cash Runway</p>
              <div className="flex items-baseline justify-center gap-1">
                <AnimatedNumber
                  value={company.burnRate}
                  format="decimal"
                  decimals={1}
                  className="text-3xl font-bold text-warning"
                  duration={1200}
                />
                <span className="text-sm text-text-tertiary">months</span>
              </div>
              <p className="text-[10px] text-text-tertiary mt-1">At current burn rate</p>
            </motion.div>
          </aside>
        </div>
      </div>
    </div>
  );
}
