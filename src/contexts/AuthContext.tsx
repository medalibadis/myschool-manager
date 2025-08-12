'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Admin } from '../types';
import { adminService } from '../lib/admin-service';

interface AuthContextType {
    isAuthenticated: boolean;
    user: Admin | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
    isSuperuser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<Admin | null>(null);
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
            const admin = await adminService.verifyCredentials(username, password);

            if (admin) {
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('currentUser', JSON.stringify(admin));

                setIsAuthenticated(true);
                setUser(admin);

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

    const isSuperuser = user?.role === 'superuser';

    const value: AuthContextType = {
        isAuthenticated,
        user,
        login,
        logout,
        loading,
        isSuperuser
    };

    return (
        <AuthContext.Provider value={value}>
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