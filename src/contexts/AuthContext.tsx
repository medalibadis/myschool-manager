'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
    username: string;
    name: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_CREDENTIALS = {
    dalila: {
        username: 'dalila',
        password: 'dali19dali25',
        name: 'Dalila'
    },
    raouf: {
        username: 'raouf',
        password: 'raoufbouk25',
        name: 'Raouf'
    }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is authenticated on app load
        const checkAuth = () => {
            try {
                const authStatus = localStorage.getItem('isAuthenticated');
                const userData = localStorage.getItem('currentUser');

                if (authStatus === 'true' && userData) {
                    const user = JSON.parse(userData);
                    setIsAuthenticated(true);
                    setUser(user);
                }
            } catch (error) {
                console.error('Error checking authentication:', error);
                // Clear invalid data
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('currentUser');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const admin = Object.values(ADMIN_CREDENTIALS).find(
                admin => admin.username === username && admin.password === password
            );

            if (admin) {
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('currentUser', JSON.stringify({
                    username: admin.username,
                    name: admin.name
                }));

                setIsAuthenticated(true);
                setUser({
                    username: admin.username,
                    name: admin.name
                });

                return true;
            }

            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            login,
            logout,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 