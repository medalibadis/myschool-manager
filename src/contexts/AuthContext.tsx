'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { AdminProfile, AdminRole, AdminPermissionKey } from '../types';
import type { Session, User } from '@supabase/supabase-js';

export interface LoginResult {
    success: boolean;
    error?: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: AdminProfile | null;
    session: Session | null;
    loading: boolean;
    isSuperuser: boolean;
    isSuperAdmin: boolean;
    permissions: string[];
    login: (email: string, pass: string) => Promise<LoginResult>;
    logout: () => Promise<void>;
    hasPermission: (permission: AdminPermissionKey | string) => boolean;
    hasAnyPermission: (permissions: (AdminPermissionKey | string)[]) => boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<AdminProfile | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const isInitializing = useRef(false);

    // Fast unified loader for Profile and Permissions
    const loadUserData = useCallback(async (userId: string, currentUser?: User | null) => {
        try {
            // Run profile and permissions in parallel
            const [profileRes, permsRes] = await Promise.all([
                supabase
                    .from('admin_profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle(),
                supabase
                    .from('admin_permissions')
                    .select('permission')
                    .eq('admin_id', userId),
            ]);

            const profile = profileRes.data;
            const userPerms = permsRes.data ? permsRes.data.map(r => r.permission) : [];

            if (profile) {
                const fullProfile: AdminProfile = {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    phone: profile.phone,
                    role: profile.role as AdminRole,
                    is_active: profile.is_active,
                    created_at: profile.created_at,
                    updated_at: profile.updated_at,
                    permissions: userPerms,
                };
                setUser(fullProfile);
                setPermissions(userPerms);
            }
        } catch (err) {
            console.error('Error loading user auth data:', err);
        }
    }, []);

    const refreshProfile = useCallback(async () => {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.user) {
            await loadUserData(currentSession.user.id, currentSession.user);
        }
    }, [loadUserData]);

    useEffect(() => {
        let mounted = true;

        // Set safety timeout to ensure loading spinner never hangs
        const safetyTimer = setTimeout(() => {
            if (mounted && loading) {
                setLoading(false);
            }
        }, 3500);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (!mounted) return;

            setSession(newSession);

            if (newSession?.user) {
                await loadUserData(newSession.user.id, newSession.user);
            } else {
                setUser(null);
                setPermissions([]);
            }

            if (mounted) {
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(safetyTimer);
            subscription.unsubscribe();
        };
    }, []); // Empty dependency array to mount once

    const login = async (email: string, pass: string): Promise<LoginResult> => {
        try {
            setLoading(true);
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: pass,
            });

            if (error || !data.session) {
                setLoading(false);
                return { success: false, error: error?.message || 'Invalid email or password' };
            }

            setSession(data.session);
            await loadUserData(data.user.id, data.user);
            setLoading(false);

            return { success: true };
        } catch (err) {
            setLoading(false);
            return { success: false, error: err instanceof Error ? err.message : 'Unknown login error' };
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setPermissions([]);
    };

    const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === ('superuser' as any);

    const hasPermission = useCallback((permission: AdminPermissionKey | string): boolean => {
        if (isSuperAdmin) return true;
        return permissions.includes(permission);
    }, [isSuperAdmin, permissions]);

    const hasAnyPermission = useCallback((perms: (AdminPermissionKey | string)[]): boolean => {
        if (isSuperAdmin) return true;
        return perms.some(p => permissions.includes(p));
    }, [isSuperAdmin, permissions]);

    const isAuthenticated = !!session && !!user && user.is_active;

    const value: AuthContextType = {
        isAuthenticated,
        user,
        session,
        loading,
        isSuperuser: isSuperAdmin,
        isSuperAdmin,
        permissions,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
        refreshProfile,
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