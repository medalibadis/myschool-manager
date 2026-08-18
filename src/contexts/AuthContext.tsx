'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AdminProfile, AdminRole, AdminPermissionKey } from '../types';
import type { Session, User } from '@supabase/supabase-js';

export interface LoginResult {
    success: boolean;
    needsMFA?: boolean;
    needsSetup?: boolean;
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
    mfaAssuranceLevel: 'aal1' | 'aal2' | null;
    mfaEnrolled: boolean;
    login: (email: string, pass: string) => Promise<LoginResult>;
    verifyMFA: (code: string) => Promise<{ success: boolean; error?: string }>;
    enrollMFA: () => Promise<{ factorId: string; qrCode: string; secret: string } | null>;
    confirmMFAEnrollment: (factorId: string, code: string) => Promise<boolean>;
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
    const [mfaAssuranceLevel, setMfaAssuranceLevel] = useState<'aal1' | 'aal2' | null>(null);
    const [mfaEnrolled, setMfaEnrolled] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    const fetchProfileAndPermissions = useCallback(async (userId: string) => {
        try {
            // 1. Fetch Profile
            const { data: profile, error: profileError } = await supabase
                .from('admin_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError || !profile) {
                console.warn('Could not load admin profile:', profileError?.message);
                return null;
            }

            // 2. Fetch Granular Permissions
            const { data: permRows, error: permError } = await supabase
                .from('admin_permissions')
                .select('permission')
                .eq('admin_id', userId);

            const userPerms = permRows ? permRows.map(r => r.permission) : [];
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
            return fullProfile;
        } catch (err) {
            console.error('Error fetching admin profile and permissions:', err);
            return null;
        }
    }, []);

    const checkMFAStatus = useCallback(async () => {
        try {
            const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            const { data: factorsData } = await supabase.auth.mfa.listFactors();

            const enrolled = (factorsData?.totp?.length || 0) > 0;
            const currentLevel = (aalData?.currentLevel as 'aal1' | 'aal2') || 'aal1';

            setMfaEnrolled(enrolled);
            setMfaAssuranceLevel(currentLevel);

            return { enrolled, currentLevel, nextLevel: aalData?.nextLevel };
        } catch (e) {
            console.error('Error checking MFA status:', e);
            return { enrolled: false, currentLevel: 'aal1' as const, nextLevel: 'aal1' as const };
        }
    }, []);

    const refreshProfile = useCallback(async () => {
        if (session?.user?.id) {
            await fetchProfileAndPermissions(session.user.id);
            await checkMFAStatus();
        }
    }, [session?.user?.id, fetchProfileAndPermissions, checkMFAStatus]);

    useEffect(() => {
        let mounted = true;

        // Initialize session on mount
        supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
            if (!mounted) return;
            setSession(currentSession);

            if (currentSession?.user) {
                await fetchProfileAndPermissions(currentSession.user.id);
                await checkMFAStatus();
            }
            setLoading(false);
        });

        // Listen to Auth State Changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (!mounted) return;
            setSession(newSession);

            if (newSession?.user) {
                await fetchProfileAndPermissions(newSession.user.id);
                await checkMFAStatus();
            } else {
                setUser(null);
                setPermissions([]);
                setMfaAssuranceLevel(null);
                setMfaEnrolled(false);
            }
            setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchProfileAndPermissions, checkMFAStatus]);

    const login = async (email: string, pass: string): Promise<LoginResult> => {
        try {
            setLoading(true);
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: pass,
            });

            if (error || !data.session) {
                return { success: false, error: error?.message || 'Invalid email or password' };
            }

            setSession(data.session);
            const profile = await fetchProfileAndPermissions(data.user.id);

            if (!profile || !profile.is_active) {
                await supabase.auth.signOut();
                return { success: false, error: 'Your admin account is inactive or not found.' };
            }

            // Check MFA requirements
            const mfa = await checkMFAStatus();

            if (!mfa.enrolled) {
                // Admin must enroll TOTP on first login
                return { success: true, needsSetup: true };
            }

            if (mfa.currentLevel !== 'aal2' && mfa.nextLevel === 'aal2') {
                // Admin needs to provide 6-digit TOTP challenge
                return { success: true, needsMFA: true };
            }

            return { success: true };
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : 'Unknown login error' };
        } finally {
            setLoading(false);
        }
    };

    const verifyMFA = async (code: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { data: factors } = await supabase.auth.mfa.listFactors();
            const totpFactor = factors?.totp?.find(f => f.status === 'verified');

            if (!totpFactor) {
                return { success: false, error: 'No verified authenticator factor found.' };
            }

            const { error } = await supabase.auth.mfa.challengeAndVerify({
                factorId: totpFactor.id,
                code: code.trim(),
            });

            if (error) {
                return { success: false, error: error.message };
            }

            setMfaAssuranceLevel('aal2');
            return { success: true };
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : 'Verification failed' };
        }
    };

    const enrollMFA = async (): Promise<{ factorId: string; qrCode: string; secret: string } | null> => {
        try {
            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp',
                friendlyName: 'MySchool Admin Authenticator',
            });

            if (error || !data) {
                console.error('Error enrolling MFA:', error);
                return null;
            }

            return {
                factorId: data.id,
                qrCode: data.totp.qr_code,
                secret: data.totp.secret,
            };
        } catch (e) {
            console.error('Failed to start MFA enrollment:', e);
            return null;
        }
    };

    const confirmMFAEnrollment = async (factorId: string, code: string): Promise<boolean> => {
        try {
            const { error } = await supabase.auth.mfa.challengeAndVerify({
                factorId,
                code: code.trim(),
            });

            if (error) {
                console.error('Error confirming MFA enrollment:', error);
                return false;
            }

            setMfaEnrolled(true);
            setMfaAssuranceLevel('aal2');
            return true;
        } catch (e) {
            console.error('Failed to confirm MFA enrollment:', e);
            return false;
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setPermissions([]);
        setMfaAssuranceLevel(null);
        setMfaEnrolled(false);
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
        mfaAssuranceLevel,
        mfaEnrolled,
        login,
        verifyMFA,
        enrollMFA,
        confirmMFAEnrollment,
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