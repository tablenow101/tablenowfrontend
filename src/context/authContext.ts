import { createContext } from 'react';

interface User {
    id: string;
    email: string;
    name: string;
    slug?: string;
    [key: string]: unknown;
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    authReady: boolean;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    loginWithToken: (token: string, restaurant: User) => void;
    register: (data: Record<string, unknown>) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
