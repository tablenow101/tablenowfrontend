import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { authAPI, restaurantsAPI } from '../lib/api';
import { isSupportedLanguage, SupportedLanguage } from '../i18n';

interface User {
    id: string;
    email: string;
    name: string;
    language?: 'fr' | 'en';
    [key: string]: any;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    setLanguage: (lang: SupportedLanguage) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'https://api.tablenow.io';

const getToken = () =>
    localStorage.getItem('token') || sessionStorage.getItem('token');

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { i18n } = useTranslation();

    useEffect(() => {
        checkAuth();
    }, []);

    const syncLanguageFromUser = (u: User | null) => {
        if (!u) return;
        if (isSupportedLanguage(u.language) && u.language !== i18n.resolvedLanguage) {
            i18n.changeLanguage(u.language);
        }
    };

    const checkAuth = async () => {
        const token = getToken();
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Unauthorized');
            const data = await res.json();
            const u = data.restaurant;
            setUser(u);
            syncLanguageFromUser(u);
        } catch (error) {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string, rememberMe = false) => {
        const response = await authAPI.login({ email, password });
        const token = response.data.token;

        // Store token first so subsequent requests include it
        if (rememberMe) {
            localStorage.setItem('token', token);
            sessionStorage.removeItem('token');
        } else {
            sessionStorage.setItem('token', token);
            localStorage.removeItem('token');
        }

        const u = response.data.restaurant;
        setUser(u);
        syncLanguageFromUser(u);
    };

    const register = async (data: any) => {
        await authAPI.register(data);
    };

    const logout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        setUser(null);
        window.location.href = '/login';
    };

    const refreshUser = async () => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            const u = data.restaurant;
            setUser(u);
            syncLanguageFromUser(u);
        } catch { /* silent */ }
    };

    const setLanguage = async (lang: SupportedLanguage) => {
        await i18n.changeLanguage(lang);
        if (user) {
            try {
                await restaurantsAPI.setLanguage(lang);
                setUser({ ...user, language: lang });
            } catch (err) {
                console.warn('Failed to sync language with backend:', err);
            }
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setLanguage }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
