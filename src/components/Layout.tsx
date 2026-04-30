import React from 'react';
import { Outlet, Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from './LanguageToggle';
import { LogOut, Menu, X } from 'lucide-react';

const Layout: React.FC = () => {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    const location = useLocation();
    const { restaurantSlug } = useParams();
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const base = `/r/${restaurantSlug}`;

    const navigation = [
        { name: t('nav.dashboard'), href: `${base}/dashboard` },
        { name: t('nav.bookings'),  href: `${base}/bookings` },
        { name: t('nav.calls'),     href: `${base}/calls` },
        { name: t('nav.settings'),  href: `${base}/settings` },
    ];

    const isActive = (path: string) => location.pathname === path;
    const restaurantName = (user?.name || '').toUpperCase();

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg0)' }}>
            {/* ── Navbar ────────────────────────────────────────────────────── */}
            <nav style={{
                height: '46px',
                background: 'var(--bg1)',
                borderBottom: '1px solid var(--line)',
                position: 'sticky',
                top: 0,
                zIndex: 200,
            }}>
                <div style={{
                    maxWidth: '1280px',
                    margin: '0 auto',
                    padding: '0 20px',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                }}>
                    {/* Logo */}
                    <Link to={`${base}/dashboard`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                        <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--t1)' }}>
                            Table<span style={{ color: 'var(--acc)' }}>Now</span>
                        </span>
                    </Link>

                    {/* Restaurant tag */}
                    {restaurantName && (
                        <span style={{
                            fontSize: '9px',
                            color: 'var(--t4)',
                            border: '1px solid var(--line3)',
                            borderRadius: '3px',
                            padding: '2px 7px',
                            marginLeft: '8px',
                            marginRight: '14px',
                            flexShrink: 0,
                            letterSpacing: '0.05em',
                        }}>
                            {restaurantName}
                        </span>
                    )}

                    {/* Vertical divider */}
                    <div style={{ width: '1px', height: '16px', background: 'var(--line3)', marginRight: '16px', flexShrink: 0 }} />

                    {/* Desktop nav links */}
                    <div className="hidden md:flex" style={{ alignItems: 'center', flex: 1, height: '100%' }}>
                        {navigation.map(item => (
                            <Link
                                key={item.href}
                                to={item.href}
                                style={{
                                    fontSize: '11px',
                                    color: isActive(item.href) ? 'var(--t1)' : 'var(--t3)',
                                    textDecoration: 'none',
                                    padding: '0 10px',
                                    height: '46px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderBottom: isActive(item.href) ? '2px solid var(--acc)' : '2px solid transparent',
                                    whiteSpace: 'nowrap',
                                    transition: 'color 120ms',
                                }}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>

                    {/* Right controls – desktop */}
                    <div className="hidden md:flex" style={{ alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
                        {user?.vapi_assistant_id && (
                            <span className="badge badge-acc">IA active</span>
                        )}
                        <LanguageToggle />
                        <button
                            onClick={logout}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '11px',
                                color: 'var(--t3)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px 8px',
                            }}
                        >
                            <LogOut size={13} />
                            <span>{t('common.logout')}</span>
                        </button>
                    </div>

                    {/* Mobile toggle */}
                    <button
                        className="flex md:hidden"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        style={{ background: 'none', border: 'none', color: 'var(--t2)', padding: '4px', marginLeft: 'auto' }}
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </nav>

            {/* ── Mobile nav ────────────────────────────────────────────────── */}
            {mobileOpen && (
                <div
                    className="md:hidden"
                    style={{ background: 'var(--bg1)', borderBottom: '1px solid var(--line)', padding: '8px 16px 12px' }}
                >
                    {navigation.map(item => (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setMobileOpen(false)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '9px 10px',
                                fontSize: '12px',
                                color: isActive(item.href) ? 'var(--t1)' : 'var(--t2)',
                                textDecoration: 'none',
                                borderRadius: 'var(--r6)',
                                background: isActive(item.href) ? 'var(--bg2)' : 'transparent',
                                marginBottom: '2px',
                                borderLeft: isActive(item.href) ? '2px solid var(--acc)' : '2px solid transparent',
                            }}
                        >
                            {item.name}
                        </Link>
                    ))}
                    <button
                        onClick={() => { logout(); setMobileOpen(false); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '9px 10px', fontSize: '12px', color: 'var(--red)',
                            background: 'none', border: 'none', cursor: 'pointer', width: '100%',
                            marginTop: '4px',
                        }}
                    >
                        <LogOut size={14} />
                        {t('common.logout')}
                    </button>
                </div>
            )}

            {/* ── Page content ──────────────────────────────────────────────── */}
            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
