'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { AdminPermissionKey } from '../types';

interface AuthGuardProps {
    children: React.ReactNode;
    requiredPermission?: AdminPermissionKey | string;
    requireSuperAdmin?: boolean;
}

export default function AuthGuard({
    children,
    requiredPermission,
    requireSuperAdmin = false,
}: AuthGuardProps) {
    const {
        isAuthenticated,
        loading,
        authResolved,
        session,
        isSuperAdmin,
        hasPermission,
    } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const isPublicAuthRoute =
        pathname === '/login' ||
        pathname === '/unauthorized';

    useEffect(() => {
        if (loading) return;

        // A Supabase session exists but the admin profile has not resolved yet.
        // Wait rather than bouncing a validly signed-in user back to /login.
        if (session && !authResolved) return;

        // 1. Not Authenticated
        if (!isAuthenticated) {
            if (!isPublicAuthRoute) {
                router.push('/login');
            }
            return;
        }

        // 2. Authenticated -> Route Specific Permissions
        if (pathname === '/login') {
            router.push('/');
            return;
        }

        if (requireSuperAdmin && !isSuperAdmin) {
            router.push('/unauthorized');
            return;
        }

        if (requiredPermission && !hasPermission(requiredPermission)) {
            router.push('/unauthorized');
            return;
        }
    }, [
        isAuthenticated,
        loading,
        authResolved,
        session,
        isSuperAdmin,
        hasPermission,
        requiredPermission,
        requireSuperAdmin,
        pathname,
        isPublicAuthRoute,
        router,
    ]);

    if (loading || (session && !authResolved)) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Verifying session...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated && !isPublicAuthRoute) {
        return null;
    }

    return <>{children}</>;
}