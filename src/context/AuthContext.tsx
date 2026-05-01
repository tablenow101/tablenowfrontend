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
    /** Met à jour la langue du restaurant côté backend ET côté i18n. */
    setLanguage: (lang: SupportedLanguage) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { i18n } = useTranslation();

    useEffect(() => {
        checkAuth();
    }, []);

    /** Aligne i18n sur la langue du restaurant après login/refresh. */
    const syncLanguageFromUser = (u: User | null) => {
        if (!u) return;
        if (isSupportedLanguage(u.language) && u.language !== i18n.resolvedLanguage) {
            i18n.changeLanguage(u.language);
        }
    };

    const checkAuth = async () => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await authAPI.getMe();
            const u = response.data.restaurant;
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
        if (rememberMe) {
            localStorage.setItem('token', token);
        } else {
            sessionStorage.setItem('token', token);
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
        const response = await authAPI.getMe();
        const u = response.data.restaurant;
        setUser(u);
        syncLanguageFromUser(u);
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
