// @refresh reset
import React, { useState, useEffect } from 'react';
import { authAPI } from '../lib/api';
import { AuthContext } from './authContext';

interface User {
    id: string;
    email: string;
    name: string;
    slug?: string;
    [key: string]: unknown;
}

const API_BASE = (import.meta as Record<string, unknown>).env?.VITE_API_URL || 'https://api.tablenow.io';

const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { checkAuth(); }, []);

    const checkAuth = async () => {
        const token = getToken();
        if (!token) { setLoading(false); return; }
        try {
            const res = await fetch(`${API_BASE}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Unauthorized');
            const data = await res.json();
            setUser(data.restaurant);
        } catch {
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
            sessionStorage.removeItem('token');
        } else {
            sessionStorage.setItem('token', token);
            localStorage.removeItem('token');
        }
        setUser(response.data.restaurant);
    };

    const loginWithToken = (token: string, restaurant: User): void => {
        localStorage.setItem('token', token);
        setUser(restaurant);
    };

    const register = async (data: Record<string, unknown>) => {
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
            setUser(data.restaurant);
        } catch { /* silent */ }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, loginWithToken, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
