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
        mfaEnrolled,
        mfaAssuranceLevel,
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

        // 1. Not Authenticated
        if (!isAuthenticated) {
            if (!isPublicAuthRoute) {
                router.push('/login');
            }
            return;
        }

        // 2. Authenticated but Needs Initial MFA Enrollment
        if (!mfaEnrolled && pathname !== '/mfa-setup') {
            router.push('/mfa-setup');
            return;
        }

        // 3. Authenticated & Enrolled but Needs TOTP Challenge
        if (mfaEnrolled && mfaAssuranceLevel !== 'aal2' && pathname !== '/mfa-challenge') {
            router.push('/mfa-challenge');
            return;
        }

        // 4. Authenticated & MFA Complete -> Route Specific Permissions
        if (mfaAssuranceLevel === 'aal2' || !mfaEnrolled) {
            if (pathname === '/login' || pathname === '/mfa-challenge') {
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
        }
    }, [
        isAuthenticated,
        loading,
        mfaEnrolled,
        mfaAssuranceLevel,
        isSuperAdmin,
        hasPermission,
        requiredPermission,
        requireSuperAdmin,
        pathname,
        isPublicAuthRoute,
        router,
    ]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Verifying security session...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated && !isPublicAuthRoute) {
        return null;
    }

    return <>{children}</>;
}