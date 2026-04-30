import React, { useState } from 'react';
import { Outlet, Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import {
  Menu, X,
  Settings as SettingsIcon,
  Clock, Utensils, Calendar, Bell, Bot, Key, Gift,
} from 'lucide-react';

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

type SectionId =
  | 'general' | 'hours' | 'services' | 'calendar'
  | 'notifications' | 'assistant' | 'identifiers' | 'referral';

const SIDEBAR_ITEMS: {
  id: SectionId;
  label: string;
  icon: React.ElementType;
  group: string;
}[] = [
  { id: 'general',       label: 'Général',      icon: SettingsIcon, group: 'RESTAURANT'   },
  { id: 'hours',         label: 'Horaires',      icon: Clock,        group: 'RESTAURANT'   },
  { id: 'services',      label: 'Services',      icon: Utensils,     group: 'RESTAURANT'   },
  { id: 'calendar',      label: 'Google Agenda', icon: Calendar,     group: 'INTÉGRATIONS' },
  { id: 'notifications', label: 'Notifications', icon: Bell,         group: 'INTÉGRATIONS' },
  { id: 'assistant',     label: 'Assistant IA',  icon: Bot,          group: 'SYSTÈME'      },
  { id: 'identifiers',   label: 'Identifiants',  icon: Key,          group: 'SYSTÈME'      },
  { id: 'referral',      label: 'Parrainage',    icon: Gift,         group: 'SYSTÈME'      },
];

const GROUPS = ['RESTAURANT', 'INTÉGRATIONS', 'SYSTÈME'] as const;

const SECTION_LABELS: Record<SectionId, string> = {
  general:       'GÉNÉRAL',
  hours:         'HORAIRES',
  services:      'SERVICES',
  calendar:      'GOOGLE AGENDA',
  notifications: 'NOTIFICATIONS',
  assistant:     'ASSISTANT IA',
  identifiers:   'IDENTIFIANTS',
  referral:      'PARRAINAGE',
};

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { activeSection, setActiveSection } = useSidebar();
  const location = useLocation();
  const { restaurantSlug } = useParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const base = `/r/${restaurantSlug}`;

  const segments = location.pathname.split('/');
  const currentKey = segments[segments.length - 1] || 'dashboard';
  const meta = ROUTE_META[currentKey] ?? { index: '—', label: currentKey.toUpperCase() };
  const isSettings = location.pathname.includes('/settings');
  const iaActive = !!(user as any)?.vapi_assistant_id;

  const isActive = (key: string) => location.pathname.endsWith(`/${key}`);

  const breadcrumbLabel = isSettings
    ? `04 — PARAMÈTRES › ${SECTION_LABELS[activeSection as SectionId] ?? activeSection.toUpperCase()}`
    : `${meta.index} — ${meta.label}`;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Breadcrumb strip */}
      <div className="fixed top-0 left-0 right-0 h-8 bg-[#0a0a0a] border-b border-[#1a1a1a] flex items-center px-6 z-50">
        <span className="text-[10px] tracking-[0.15em] uppercase text-[#555] font-medium">
          {breadcrumbLabel}
        </span>
      </div>

      {/* Navbar */}
      <nav className="fixed top-8 left-0 right-0 h-[52px] bg-[#111] border-b border-[#2a2a2a] flex items-center px-6 z-40">
        {/* Left: Logo + restaurant badge */}
        <div className="flex items-center gap-3">
          <Link to={`${base}/dashboard`} className="text-lg font-bold text-white leading-none">
            Table<span className="text-[#b8f000]">Now</span>
          </Link>
          {user && (
            <span className="hidden sm:inline border border-[#2a2a2a] rounded px-2 py-0.5 text-xs text-[#888] truncate max-w-[120px]">
              {user.name}
            </span>
          )}
        </div>

        {/* Center: nav links (desktop) */}
        <div className="flex-1 hidden md:flex items-center justify-center gap-1">
          {NAV.map(({ key, label }) => {
            const active = isActive(key);
            return (
              <Link
                key={key}
                to={`${base}/${key}`}
                className={`text-sm px-3 py-1 pb-[2px] transition-colors border-b-2 ${
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

        {/* Right: IA badge + logout (desktop) */}
        <div className="hidden md:flex items-center gap-3 ml-auto">
          <span className={`text-[11px] font-semibold tracking-wide px-3 py-1 rounded border ${
            iaActive ? 'border-[#b8f000] text-[#b8f000]' : 'border-[#2a2a2a] text-[#555]'
          }`}>
            {iaActive ? 'IA ACTIVE' : 'IA INACTIVE'}
          </span>
          <button
            onClick={logout}
            className="text-[#555] text-sm hover:text-white transition-colors"
          >
            Log out
          </button>
        </div>

        {/* Mobile: hamburger */}
        <button
          className="md:hidden ml-auto text-[#888] hover:text-white transition-colors"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu size={20} />
        </button>
      </nav>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[60] md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={`fixed left-0 top-0 bottom-0 w-64 bg-[#111] z-[70] flex flex-col transition-transform duration-200 md:hidden ${
        drawerOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between px-5 h-14 border-b border-[#2a2a2a]">
          <span className="text-lg font-bold text-white">
            Table<span className="text-[#b8f000]">Now</span>
          </span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-[#888] hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          {NAV.map(({ key, label }) => {
            const active = isActive(key);
            return (
              <Link
                key={key}
                to={`${base}/${key}`}
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center px-5 py-3 text-sm transition-colors border-l-2 ${
                  active
                    ? 'text-white border-[#b8f000] pl-[18px]'
                    : 'text-[#888] border-transparent hover:text-white'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
        <div className="px-5 py-4 border-t border-[#2a2a2a]">
          <button
            onClick={() => { logout(); setDrawerOpen(false); }}
            className="text-[#555] text-sm hover:text-white transition-colors w-full text-left"
          >
            Log out
          </button>
        </div>
      </div>

      {/* Settings sidebar (desktop only) */}
      {isSettings && (
        <nav className="hidden md:block fixed left-0 top-[84px] bottom-0 w-[220px] bg-[#0a0a0a] border-r border-[#1a1a1a] overflow-y-auto z-30 py-5">
          {GROUPS.map(group => (
            <div key={group} className="mb-5">
              <p className="text-[10px] font-semibold text-[#555] uppercase tracking-wider px-4 mb-1">
                {group}
              </p>
              {SIDEBAR_ITEMS.filter(i => i.group === group).map(item => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center gap-2.5 w-full px-4 py-2 text-xs transition-colors text-left border-l-2 ${
                      active
                        ? 'border-[#b8f000] text-white'
                        : 'border-transparent text-[#888] hover:text-white'
                    }`}
                  >
                    <Icon size={13} className="flex-shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      )}

      {/* Page content */}
      <main className={`pt-[84px]${isSettings ? ' md:pl-[220px]' : ''}`}>
        {/* Mobile settings tabs (fixed) + spacer */}
        {isSettings && (
          <>
            <div className="md:hidden fixed top-[84px] left-0 right-0 z-30 flex overflow-x-auto gap-1 px-4 py-2 bg-[#111] border-b border-[#2a2a2a]">
              {SIDEBAR_ITEMS.map(item => {
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`text-sm px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 transition-colors ${
                      active ? 'bg-[#b8f000] text-black font-medium' : 'text-[#888] hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            {/* Pushes content below the fixed mobile tab bar */}
            <div className="md:hidden h-[52px]" />
          </>
        )}
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
