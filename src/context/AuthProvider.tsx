import React, { useState, useEffect } from 'react';
import { authAPI } from '../lib/api';
import { setAccessToken, getAccessToken } from '../lib/authToken';
import { AuthContext } from './authContext';

interface User {
    id: string;
    email: string;
    name: string;
    slug?: string;
    [key: string]: unknown;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                // Restore token from localStorage
                const savedToken = localStorage.getItem('backend_token');
                if (savedToken) {
                    setAccessToken(savedToken);
                }

                // Validate token with /api/auth/me
                const token = getAccessToken();
                if (token) {
                    try {
                        const response = await authAPI.getMe();
                        if (mounted) {
                            setUser(response.data);
                        }
                    } catch {
                        // Token invalid, clear it
                        localStorage.removeItem('backend_token');
                        setAccessToken(null);
                        setUser(null);
                    }
                }
            } catch (err) {
                console.error('Auth init error:', err);
            } finally {
                if (mounted) {
                    setLoading(false);
                    setAuthReady(true);
                }
            }
        };

        initAuth();

        return () => {
            mounted = false;
        };
    }, []);

    const login = async (email: string, password: string, rememberMe = false) => {
        const response = await authAPI.login({ email, password });
        const token = response.data.access_token || response.data.token;

        if (token) {
            setAccessToken(token);
            localStorage.setItem('backend_token', token);
            const userResponse = await authAPI.getMe();
            setUser(userResponse.data);
        }
    };

    const loginWithToken = (token: string, restaurant: User): void => {
        setAccessToken(token);
        localStorage.setItem('backend_token', token);
        setUser(restaurant);
    };

    const register = async (data: Record<string, unknown>) => {
        await authAPI.register(data);
    };

    const logout = () => {
        setAccessToken(null);
        localStorage.removeItem('backend_token');
        setUser(null);
        setAuthReady(false);
        window.location.href = '/login';
    };

    const refreshUser = async () => {
        try {
            const response = await authAPI.getMe();
            setUser(response.data);
        } catch (err) {
            console.error('Refresh user error:', err);
            await logout();
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, authReady, login, loginWithToken, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
