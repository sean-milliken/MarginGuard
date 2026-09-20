import { NavLink, useNavigate } from "react-router-dom";
import { useSetup } from "../../contexts/SetupContext";

export function Sidebar() {
  const navigate = useNavigate();
  const { companyName, resetSetup } = useSetup();
  return (
    <aside className="sidebar fixed left-0 top-0 z-40 flex h-screen w-[220px] flex-col border-r border-border bg-bg-secondary">
      <NavLink to="/" className="brand">
        MarginGuard<span>Financial early warning</span>
      </NavLink>
      <nav aria-label="Main navigation" className="primary-nav">
        {[
          ["/", "Dashboard"],
          ["/intelligence", "Intelligence"],
          ["/scenarios", "Scenarios"],
          ["/evals", "Evals"],
        ].map(([path, label]) => (
          <NavLink
            end={path === "/"}
            key={path}
            to={path}
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-secondary">
        <details>
          <summary>Company &amp; sources</summary>
          <NavLink className="nav-link" to="/company">
            Company Data
          </NavLink>
          <NavLink className="nav-link" to="/sources">
            Sources
          </NavLink>
        </details>
        <p className="mt-6 text-sm">{companyName}</p>
        <p className="text-xs text-text-secondary">
          Synthetic manufacturing model
        </p>
        <div className="flex gap-4 mt-3">
          <button
            onClick={() => {
              resetSetup();
              navigate("/setup", { replace: true });
            }}
          >
            Switch
          </button>
          <button title="Logout" onClick={() => navigate("/logout")}>
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
