import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLang } from '../hooks/useLang';
import { LayoutDashboard, Calendar, Phone, Settings, LogOut, Menu, X, Sun, Moon } from 'lucide-react';

const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const { logout, restaurant, user } = useAuth();
    const displayName = (restaurant?.name as string | undefined) || user?.email || '';
    const { lang, setLang, t } = useLang();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('theme') !== 'light';
    });

    // Canonical routes - no slug needed
    const nav = [
        { key: 'navDashboard', href: '/dashboard', icon: LayoutDashboard },
        { key: 'navReservations', href: '/bookings',  icon: Calendar        },
        { key: 'navCalls',       href: '/calls',     icon: Phone            },
        { key: 'navSettings',    href: '/settings',  icon: Settings         },
    ];

    const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

    const toggleTheme = () => {
        const next = !darkMode;
        setDarkMode(next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
        document.documentElement.classList.toggle('light', !next);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">

            {/* ── Navbar ───────────────────────────────────────────────── */}
            <nav className="fixed top-0 left-0 right-0 z-50 h-[52px] bg-[#111] border-b border-[#2a2a2a] flex items-center px-6">
                <div className="flex items-center justify-between w-full">

                    {/* Left */}
                    <div className="flex items-center gap-3 min-w-0">
                        <Link to="/dashboard" className="text-sm font-bold text-white tracking-tight whitespace-nowrap">
                            Table<span style={{ color: '#b8f000' }}>Now</span>
                        </Link>
                        {displayName && (
                            <span className="hidden sm:block text-sm text-[#888] truncate max-w-[140px]">
                                {displayName}
                            </span>
                        )}
                    </div>

                    {/* Centre — desktop nav */}
                    <div className="hidden md:flex items-center">
                        {nav.map(({ key, href }) => {
                            const active = isActive(href);
                            return (
                                <Link
                                    key={href}
                                    to={href}
                                    className={`relative flex items-center px-4 h-[52px] text-sm transition-colors ${
                                        active ? 'text-white' : 'text-[#888] hover:text-white'
                                    }`}
                                >
                                    <span>{t(key)}</span>
                                    {active && (
                                        <span className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: '#b8f000' }} />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Lang toggle */}
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setLang('fr')}
                                className={`text-xs font-bold px-2 py-1 rounded transition-colors ${
                                    lang === 'fr' ? 'text-black' : 'text-[#555] hover:text-white'
                                }`}
                                style={lang === 'fr' ? { background: '#b8f000' } : {}}
                            >FR</button>
                            <button
                                onClick={() => setLang('en')}
                                className={`text-xs font-bold px-2 py-1 rounded transition-colors ${
                                    lang === 'en' ? 'text-black' : 'text-[#555] hover:text-white'
                                }`}
                                style={lang === 'en' ? { background: '#b8f000' } : {}}
                            >EN</button>
                        </div>

                        {/* Theme toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-1.5 rounded-lg text-[#555] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                        >
                            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
                        </button>

                        {/* IA badge — toujours visible */}
                        <span className="text-[10px] font-bold tracking-widest px-2.5 py-1 rounded border border-[#b8f000] text-[#b8f000]">
                            {t('iaActive')}
                        </span>

                        {/* Logout */}
                        <button
                            onClick={logout}
                            className="flex items-center gap-1.5 text-xs text-[#555] hover:text-white transition-colors"
                        >
                            <LogOut size={13} />
                            <span className="hidden lg:block">{t('logout')}</span>
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

            {/* ── Mobile menu ───────────────────────────────────────────── */}
            {mobileOpen && (
                <div className="fixed top-[79px] left-0 right-0 z-30 bg-[#111] border-b border-[#2a2a2a] md:hidden">
                    <div className="px-4 py-3 space-y-1">
                        {nav.map(({ key, href, icon: Icon }) => {
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
                                    <span>{t(key)}</span>
                                </Link>
                            );
                        })}
                        <div className="flex items-center gap-3 px-3 py-2">
                            <button onClick={() => setLang('fr')} className={`text-xs font-bold px-2 py-1 rounded ${lang === 'fr' ? 'text-black' : 'text-[#555]'}`} style={lang === 'fr' ? { background: '#b8f000' } : {}}>FR</button>
                            <button onClick={() => setLang('en')} className={`text-xs font-bold px-2 py-1 rounded ${lang === 'en' ? 'text-black' : 'text-[#555]'}`} style={lang === 'en' ? { background: '#b8f000' } : {}}>EN</button>
                            <button onClick={toggleTheme} className="ml-auto p-1.5 text-[#555]">{darkMode ? <Sun size={14} /> : <Moon size={14} />}</button>
                        </div>
                        <button
                            onClick={() => { logout(); setMobileOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#555] hover:text-red-400"
                        >
                            <LogOut size={15} />
                            <span>{t('logout')}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ── Main content ──────────────────────────────────────────── */}
            <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ paddingTop: '80px' }}>
                {children || <Outlet />}
            </main>
        </div>
    );
};

export default Layout;
