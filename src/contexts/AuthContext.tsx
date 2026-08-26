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
    /** True once the admin profile lookup has settled, or definitively given up. */
    authResolved: boolean;
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
    const [authResolved, setAuthResolved] = useState(false);

    // Ref to track if we have a valid user (avoids stale closures)
    const hasUserRef = useRef(false);

    // Last known-good permissions, so a transient permissions read failure can
    // fall back to them instead of stripping the user down to none.
    const permissionsRef = useRef<string[]>([]);

    // Set only while logout() is running, so a deliberate sign-out can be told
    // apart from a SIGNED_OUT the library emits on its own.
    const isLoggingOutRef = useRef(false);

    // Most recent refresh token seen, including ones broadcast by other tabs.
    // _removeSession() wipes storage before emitting SIGNED_OUT, so this is the
    // only copy left to attempt a silent recovery with.
    const recoveryTokenRef = useRef<string | null>(null);

    // True once auth has settled, so the safety timer can tell a genuinely
    // stalled init apart from one that simply finished.
    const initSettledRef = useRef(false);

    // Keep refs in sync with state
    useEffect(() => {
        hasUserRef.current = !!user;
    }, [user]);

    useEffect(() => {
        permissionsRef.current = permissions;
    }, [permissions]);

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

            // Distinguish "no permission rows" from "the permissions read failed".
            // Treating a failure as an empty set silently strips every permission
            // and bounces a valid admin to /unauthorized.
            if (permsRes.error) {
                console.error('Error fetching permissions:', permsRes.error);
            }
            const fetchedPerms = permsRes.error || !permsRes.data
                ? null
                : permsRes.data.map(r => r.permission);
            const userPerms = fetchedPerms ?? permissionsRef.current;

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
                // If we got no data (profile is null) BUT we already have an active user,
                // this is likely a transient RLS failure during token refresh.
                // Do NOT log them out in this case!
                if (!profile && hasUserRef.current) {
                    console.warn('loadUserData returned 0 rows but preserving existing active user session to prevent transient logouts.');
                    return true;
                }

                // Otherwise, genuinely not found or inactive - clear state
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

        const settle = () => {
            initSettledRef.current = true;
            if (mounted) {
                setLoading(false);
                setAuthResolved(true);
            }
        };

        // Safety net for a genuinely stuck init.
        //
        // The previous 4s timer tested a `loading` captured on the first render,
        // which is always true, so it fired unconditionally. Flipping loading to
        // false while the profile query was still in flight left isAuthenticated
        // false, and AuthGuard then bounced a validly signed-in user to /login.
        // The profile and permission reads go through RLS policies that call
        // has_permission(), so they need a realistic budget.
        const safetyTimer = setTimeout(() => {
            if (mounted && !initSettledRef.current) {
                console.warn('Auth safety timer fired - giving up on the profile load');
                settle();
            }
        }, 15000);

        const initAuth = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                if (!mounted) return;

                setSession(initialSession);
                if (initialSession?.refresh_token) {
                    recoveryTokenRef.current = initialSession.refresh_token;
                }

                if (initialSession?.user) {
                    await loadUserData(initialSession.user.id);
                } else {
                    setUser(null);
                    setPermissions([]);
                }
            } catch (err) {
                console.error('Error during auth initialization:', err);
            } finally {
                settle();
            }
        };

        initAuth();

        const clearAuthState = () => {
            setSession(null);
            setUser(null);
            setPermissions([]);
            settle();
        };

        // This callback MUST stay synchronous and must never await a supabase.*
        // call. Supabase invokes it from inside the auth lock (e.g. the auto
        // refresh tick holds the lock across _notifyAllSubscribers). Any nested
        // supabase call - including supabase.from(), which resolves its token via
        // auth.getSession() - re-enters _acquireLock and waits on the very
        // operation that is waiting on this callback, deadlocking the client and
        // hanging every later query in the tab. Anything touching supabase is
        // therefore deferred to a macrotask, after the lock has been released.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
            if (!mounted) return;

            if (event === 'SIGNED_OUT') {
                // Consume the stashed token up front so a failed recovery cannot
                // loop: a failing refresh emits SIGNED_OUT again, and by then the
                // stash is empty and we fall through to a real sign-out.
                const recoveryToken = recoveryTokenRef.current;
                recoveryTokenRef.current = null;
                const deliberate = isLoggingOutRef.current;
                isLoggingOutRef.current = false;

                if (deliberate || !recoveryToken) {
                    clearAuthState();
                    return;
                }

                // Leave the current state in place for now: tearing it down here
                // would redirect to /login before recovery has even been tried.
                setTimeout(async () => {
                    if (!mounted) return;
                    try {
                        const { data, error } = await supabase.auth.refreshSession({
                            refresh_token: recoveryToken,
                        });

                        if (!error && data.session?.user) {
                            console.warn('Recovered from an unsolicited SIGNED_OUT via silent refresh.');
                            setSession(data.session);
                            recoveryTokenRef.current = data.session.refresh_token;
                            await loadUserData(data.session.user.id);
                            settle();
                            return;
                        }
                    } catch (err) {
                        console.error('Silent session recovery failed:', err);
                    }

                    if (mounted) clearAuthState();
                }, 0);
                return;
            }

            // Only ever move the session forward. Assigning a null session here -
            // which any non-SIGNED_OUT event may carry - makes isAuthenticated
            // false immediately and sends AuthGuard to /login.
            if (newSession) {
                setSession(newSession);
                if (newSession.refresh_token) {
                    recoveryTokenRef.current = newSession.refresh_token;
                }
            }

            const userId = newSession?.user?.id;
            if (!userId) {
                // Nothing to load. Only settle if init has already finished, so a
                // null-session event can't mark auth resolved while initAuth is
                // still fetching a profile for a session it did find.
                if (initSettledRef.current) settle();
                return;
            }

            setTimeout(() => {
                if (!mounted) return;
                loadUserData(userId)
                    .catch(err => console.error('Non-blocking loadUserData error:', err))
                    .finally(() => settle());
            }, 0);
        });

        return () => {
            mounted = false;
            clearTimeout(safetyTimer);
            subscription.unsubscribe();
        };
    }, [loadUserData]);

    const login = async (email: string, pass: string): Promise<LoginResult> => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: pass,
            });

            if (error || !data.session) {
                return { success: false, error: error?.message || 'Invalid email or password' };
            }

            setSession(data.session);
            recoveryTokenRef.current = data.session.refresh_token;
            const isValid = await loadUserData(data.user.id);

            if (!isValid) {
                // A deliberate sign-out: do not let the SIGNED_OUT handler try to
                // silently restore the session we are rejecting on purpose.
                isLoggingOutRef.current = true;
                recoveryTokenRef.current = null;
                await supabase.auth.signOut();
                setSession(null);
                return { success: false, error: 'Your account is inactive or not found.' };
            }

            return { success: true };
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : 'Unknown login error' };
        }
    };

    const logout = async () => {
        // Marks the SIGNED_OUT that follows as deliberate, so the handler tears
        // the session down instead of trying to recover it.
        isLoggingOutRef.current = true;
        recoveryTokenRef.current = null;
        try {
            await supabase.auth.signOut();
        } finally {
            setSession(null);
            setUser(null);
            setPermissions([]);
            isLoggingOutRef.current = false;
        }
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
        authResolved,
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