'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Track if the initial auth check has completed
    // Once the form has been shown, never go back to the spinner
    const hasShownForm = useRef(false);

    useEffect(() => {
        if (!loading) {
            hasShownForm.current = true;
        }
    }, [loading]);

    // We removed the useEffect redirect here to prevent race conditions.
    // Navigation is handled via hard redirect in handleSubmit.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const result = await login(email, password);

            if (result.success) {
                // Hard redirect to bypass any Next.js router / AuthGuard race conditions
                // This guarantees the app mounts fresh with the new session.
                window.location.href = '/';
                return; // Keep button on Verifying while browser unloads the page
            } else {
                setError(result.error || 'Invalid credentials or inactive account.');
            }
        } catch (err) {
            setError('An error occurred during sign-in.');
        } 
        
        setIsSubmitting(false);
    };

    // Only show the loading spinner during INITIAL page load auth check
    // Never show it once the user has seen the login form
    if (loading && !hasShownForm.current) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Verifying session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card className="shadow-xl border border-orange-100/50">
                    <CardHeader className="text-center pb-4">
                        <div className="mx-auto w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                            <LockClosedIcon className="h-8 w-8 text-orange-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900">
                            MySchool Manager
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            Private Administration Portal
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Admin Email
                                </label>
                                <div className="relative">
                                    <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (error) setError('');
                                        }}
                                        placeholder="admin@myschool.com"
                                        className="pl-10"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Password
                                </label>
                                <div className="relative">
                                    <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (error) setError('');
                                        }}
                                        placeholder="••••••••••••"
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full justify-center py-2.5 text-base"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Verifying...' : 'Sign In'}
                            </Button>
                        </form>

                        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                            <p className="text-xs text-gray-500">
                                🔒 Secure access protected by Supabase Auth.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}