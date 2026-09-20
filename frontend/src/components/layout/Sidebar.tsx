import React from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useSetup } from "../../contexts/SetupContext";

const navItems = [
  {
    path: "/",
    label: "Dashboard",
    sub: "Risk overview",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1",
  },
  {
    path: "/intelligence",
    label: "News Analysis",
    sub: "Analyze an article",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  {
    path: "/analysis",
    label: "Model Impact",
    sub: "Calculate the loss",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    path: "/responses",
    label: "Recovery Options",
    sub: "Compare your choices",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  {
    path: "/sources",
    label: "Source Article",
    sub: "The scenario text",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  {
    path: "/company",
    label: "Company Data",
    sub: "Products & suppliers",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    path: "/evals",
    label: "AI Accuracy",
    sub: "Model eval results",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userAttributes } = useAuth();
  const { companyName, resetSetup } = useSetup();

  const handleSwitch = () => {
    resetSetup();
    navigate("/setup", { replace: true });
  };

  return (
    <motion.aside
      className="fixed left-0 top-0 z-40 flex h-screen w-[220px] flex-col border-r border-border bg-bg-secondary"
      initial={{ x: -220 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Logo + company */}
      <div className="flex items-center gap-2.5 px-6 pt-6 pb-3">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/20">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <span className="text-lg font-bold text-text-primary tracking-tight">
          MarginGuard
        </span>
      </div>

      {/* Company name pill */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between rounded-lg bg-bg-tertiary border border-border px-3 py-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-text-tertiary font-medium">Modeling</p>
            <p className="text-xs font-semibold text-text-primary truncate">{companyName}</p>
          </div>
          <button
            onClick={handleSwitch}
            className="ml-2 text-[10px] text-primary-400 hover:text-primary-300 whitespace-nowrap transition-colors"
          >
            Switch
          </button>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary-600/15 text-primary-300"
                  : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.04 }}
            >
              {isActive && (
                <motion.div
                  className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-primary-400"
                  layoutId="sidebar-indicator"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              <svg
                className="w-[18px] h-[18px] shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={isActive ? 2 : 1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={item.icon}
                />
              </svg>
              <span className="flex flex-col items-start">
                <span>{item.label}</span>
                <span className="text-[10px] font-normal text-text-tertiary leading-tight">{item.sub}</span>
              </span>
            </motion.button>
          );
        })}
      </nav>

      {/* User card at bottom */}
      <div className="p-3">
        <div className="rounded-lg bg-primary-600/10 border border-primary-600/20 p-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white">
              {(userAttributes?.email?.[0] || "D").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">
                {userAttributes?.email?.split("@")[0] || "Demo User"}
              </p>
              <p className="text-[10px] text-text-tertiary truncate">
                {userAttributes?.email || "demo@marginguard.com"}
              </p>
            </div>
            <button
              onClick={() => navigate("/logout")}
              className="text-text-tertiary hover:text-text-secondary transition-colors"
              title="Logout"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};
