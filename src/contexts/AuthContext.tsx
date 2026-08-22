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

    // Ref to track if we have a valid user (avoids stale closures)
    const hasUserRef = useRef(false);

    // Keep ref in sync with state
    useEffect(() => {
        hasUserRef.current = !!user;
    }, [user]);

    // Fast unified loader for Profile and Permissions
    const loadUserData = useCallback(async (userId: string): Promise<boolean> => {
        try {
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

            // If there was a network/RLS error, preserve existing state
            if (profileRes.error) {
                console.error('Error fetching profile:', profileRes.error);
                return hasUserRef.current; // Keep existing user if we have one
            }

            const profile = profileRes.data;
            const userPerms = permsRes.data ? permsRes.data.map(r => r.permission) : [];

            if (profile && profile.is_active) {
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
                return true;
            } else {
                // Profile genuinely not found or inactive
                setUser(null);
                setPermissions([]);
                return false;
            }
        } catch (err) {
            console.error('Error loading user auth data:', err);
            // Network error - preserve existing state
            return hasUserRef.current;
        }
    }, []); // No dependencies - uses ref for current user check

    const refreshProfile = useCallback(async () => {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.user) {
            await loadUserData(currentSession.user.id);
        }
    }, [loadUserData]);

    useEffect(() => {
        let mounted = true;

        // Safety timeout - loading MUST end within 4 seconds no matter what
        const safetyTimer = setTimeout(() => {
            if (mounted && loading) {
                console.warn('Auth safety timer fired - forcing loading to false');
                setLoading(false);
            }
        }, 4000);

        const initAuth = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                if (!mounted) return;
                
                setSession(initialSession);
                
                if (initialSession?.user) {
                    await loadUserData(initialSession.user.id);
                } else {
                    setUser(null);
                    setPermissions([]);
                }
            } catch (err) {
                console.error('Error during auth initialization:', err);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (!mounted) return;

            // Handle explicit sign out - always clear state
            if (event === 'SIGNED_OUT') {
                setSession(null);
                setUser(null);
                setPermissions([]);
                if (mounted) setLoading(false);
                return;
            }

            // For all other events, update session
            setSession(newSession);

            if (newSession?.user) {
                // Load user data but don't block on failure
                await loadUserData(newSession.user.id).catch(err => {
                    console.error('Non-blocking loadUserData error:', err);
                });
            }
            // Intentionally NOT clearing user on null session during non-SIGNED_OUT events
            // This prevents false logouts during token refresh race conditions
            
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
            const isValid = await loadUserData(data.user.id);
            
            if (!isValid) {
                await supabase.auth.signOut();
                setSession(null);
                setLoading(false);
                return { success: false, error: 'Your account is inactive or not found.' };
            }

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