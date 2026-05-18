// @refresh reset
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { authAPI } from '../lib/api';
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

    useEffect(() => {
        // Initialize auth state from Supabase session
        const initAuth = async () => {
            try {
                // Give Supabase a moment to hydrate from localStorage
                await new Promise(resolve => setTimeout(resolve, 100));

                const { data } = await supabase.auth.getSession();
                if (data?.session?.access_token) {
                    // Session exists, fetch user from backend
                    try {
                        const res = await authAPI.getMe();
                        setUser(res.data?.restaurant || null);
                    } catch (err) {
                        console.error('Failed to fetch user:', err);
                        setUser(null);
                    }
                } else {
                    // No Supabase session
                    setUser(null);
                }
            } catch (err) {
                console.error('Auth init failed:', err);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // Listen for Supabase auth changes
        const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.access_token) {
                // User logged in or token refreshed
                try {
                    const res = await authAPI.getMe();
                    setUser(res.data?.restaurant || null);
                } catch (err) {
                    console.error('Failed to fetch user on auth change:', err);
                    setUser(null);
                }
            } else {
                // User logged out or no session
                setUser(null);
            }
        });

        return () => {
            listener?.subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string, rememberMe = false) => {
        // Note: This is for email/password login. For OAuth, Supabase handles the session.
        const response = await authAPI.login({ email, password });
        const token = response.data.token;
        // Store JWT in localStorage for email/password auth (backend issues this, not Supabase)
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

    const logout = async () => {
        // Sign out from Supabase
        await supabase.auth.signOut();
        // Clear localStorage
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        setUser(null);
        window.location.href = '/login';
    };

    const refreshUser = async () => {
        try {
            const { data } = await supabase.auth.getSession();
            if (!data?.session?.access_token) {
                setUser(null);
                return;
            }
            const res = await authAPI.getMe();
            setUser(res.data?.restaurant || null);
        } catch (err) {
            console.error('Failed to refresh user:', err);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, loginWithToken, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
