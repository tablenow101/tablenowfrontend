import React from 'react';
import { Outlet, Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROUTE_META: Record<string, { index: string; label: string }> = {
  dashboard: { index: '01', label: 'DASHBOARD' },
  bookings:  { index: '02', label: 'RÉSERVATIONS' },
  calls:     { index: '03', label: 'APPELS' },
  settings:  { index: '04', label: 'PARAMÈTRES' },
};

const NAV = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'bookings',  label: 'Réservations' },
  { key: 'calls',     label: 'Appels' },
  { key: 'settings',  label: 'Paramètres' },
];

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { restaurantSlug } = useParams();
  const base = `/r/${restaurantSlug}`;

  const segments = location.pathname.split('/');
  const currentKey = segments[segments.length - 1] || 'dashboard';
  const meta = ROUTE_META[currentKey] ?? { index: '—', label: currentKey.toUpperCase() };

  const isActive = (key: string) => location.pathname.endsWith(`/${key}`);

  const iaActive = !!(user as any)?.vapi_assistant_id;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Breadcrumb strip */}
      <div className="fixed top-0 left-0 right-0 h-8 bg-[#0a0a0a] border-b border-[#1a1a1a] flex items-center px-6 z-50">
        <span className="text-[10px] tracking-[0.15em] uppercase text-[#555]">
          {meta.index} — {meta.label}
        </span>
      </div>

      {/* Navbar */}
      <nav className="fixed top-8 left-0 right-0 h-[52px] bg-[#111] border-b border-[#2a2a2a] flex items-center px-6 z-40">
        {/* Left: Logo + restaurant badge */}
        <div className="flex items-center gap-3 w-[200px]">
          <Link
            to={`${base}/dashboard`}
            className="text-base font-bold text-white leading-none"
          >
            Table<span className="text-[#b8f000]">Now</span>
          </Link>
          {user && (
            <span className="border border-[#2a2a2a] rounded px-2 py-0.5 text-[11px] text-[#888] truncate max-w-[100px]">
              {user.name}
            </span>
          )}
        </div>

        {/* Centre: nav links */}
        <div className="flex-1 flex items-center justify-center gap-8">
          {NAV.map(({ key, label }) => {
            const active = isActive(key);
            return (
              <Link
                key={key}
                to={`${base}/${key}`}
                className={`text-sm pb-px transition-colors border-b-2 ${
                  active
                    ? 'text-white border-[#b8f000]'
                    : 'text-[#888] border-transparent hover:text-white'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right: IA badge + logout */}
        <div className="flex items-center gap-4 w-[200px] justify-end">
          <span
            className={`text-[11px] font-semibold tracking-wide px-3 py-1 rounded border ${
              iaActive
                ? 'border-[#b8f000] text-[#b8f000]'
                : 'border-[#2a2a2a] text-[#555]'
            }`}
          >
            {iaActive ? 'IA ACTIVE' : 'IA INACTIVE'}
          </span>
          <button
            onClick={logout}
            className="text-[#555] text-xs hover:text-white transition-colors"
          >
            Log out
          </button>
        </div>
      </nav>

      {/* Page content — top padding = breadcrumb (32px) + navbar (52px) */}
      <main className="pt-[84px]">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
