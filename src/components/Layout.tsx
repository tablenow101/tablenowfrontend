import React from 'react';
import { Outlet, Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Calendar, Phone, Settings, LogOut, Menu, X } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
    dashboard:  'TABLEAU DE BORD',
    bookings:   'RÉSERVATIONS',
    calls:      'APPELS',
    settings:   'PARAMÈTRES',
};

const Layout: React.FC = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const { restaurantSlug } = useParams();
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const base = `/r/${restaurantSlug}`;

    const nav = [
        { name: 'Dashboard',    href: `${base}/dashboard`, icon: LayoutDashboard },
        { name: 'Réservations', href: `${base}/bookings`,  icon: Calendar },
        { name: 'Appels',       href: `${base}/calls`,     icon: Phone },
        { name: 'Paramètres',   href: `${base}/settings`,  icon: Settings },
    ];

    const segment = location.pathname.split('/').pop() || '';
    const breadcrumb = ROUTE_LABELS[segment] || '';
    const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">

            {/* ── Breadcrumb strip ──────────────────────────────────── */}
            <div className="fixed top-0 left-0 right-0 z-50 h-8 bg-[#0a0a0a] border-b border-[#1a1a1a] flex items-center px-6">
                <span className="text-[10px] tracking-[0.18em] uppercase text-[#555] select-none">
                    TableNow{breadcrumb ? ` › ${breadcrumb}` : ''}
                </span>
            </div>

            {/* ── Navbar ───────────────────────────────────────────── */}
            <nav className="fixed top-8 left-0 right-0 z-40 h-[52px] bg-[#111] border-b border-[#2a2a2a] flex items-center px-6">
                <div className="flex items-center justify-between w-full">

                    {/* Left */}
                    <div className="flex items-center gap-3 min-w-0">
                        <Link to={`${base}/dashboard`} className="text-sm font-bold text-white tracking-tight whitespace-nowrap">
                            Table<span style={{ color: '#b8f000' }}>Now</span>
                        </Link>
                        {user?.name && (
                            <span className="hidden sm:block px-2 py-0.5 rounded border border-[#2a2a2a] text-xs text-[#888] truncate max-w-[140px]">
                                {user.name}
                            </span>
                        )}
                    </div>

                    {/* Centre — desktop nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {nav.map(({ name, href, icon: Icon }) => {
                            const active = isActive(href);
                            return (
                                <Link
                                    key={href}
                                    to={href}
                                    className={`relative flex items-center gap-2 px-4 h-[52px] text-sm transition-colors ${
                                        active ? 'text-white' : 'text-[#888] hover:text-white'
                                    }`}
                                >
                                    <Icon size={15} />
                                    <span>{name}</span>
                                    {active && (
                                        <span className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: '#b8f000' }} />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right */}
                    <div className="hidden md:flex items-center gap-3">
                        {user?.vapi_assistant_id && (
                            <span className="text-[10px] font-bold tracking-widest px-3 py-1 rounded border"
                                style={{ color: '#b8f000', borderColor: '#b8f000' }}>
                                IA ACTIVE
                            </span>
                        )}
                        <button
                            onClick={logout}
                            className="flex items-center gap-1.5 text-xs text-[#555] hover:text-white transition-colors"
                        >
                            <LogOut size={14} />
                            <span>Déconnexion</span>
                        </button>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden text-[#888] hover:text-white p-1"
                        onClick={() => setMobileOpen(v => !v)}
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </nav>

            {/* ── Mobile menu ───────────────────────────────────────── */}
            {mobileOpen && (
                <div className="fixed top-[88px] left-0 right-0 z-30 bg-[#111] border-b border-[#2a2a2a] md:hidden">
                    <div className="px-4 py-3 space-y-1">
                        {nav.map(({ name, href, icon: Icon }) => {
                            const active = isActive(href);
                            return (
                                <Link
                                    key={href}
                                    to={href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                                        active ? 'text-white' : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'
                                    }`}
                                    style={active ? { borderLeft: '2px solid #b8f000', paddingLeft: '10px' } : {}}
                                >
                                    <Icon size={15} />
                                    <span>{name}</span>
                                </Link>
                            );
                        })}
                        <button
                            onClick={() => { logout(); setMobileOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#555] hover:text-red-400"
                        >
                            <LogOut size={15} />
                            <span>Déconnexion</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ── Main content ──────────────────────────────────────── */}
            <main className="pt-[88px] px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
