'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldCheckIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function MFAChallengePage() {
    const { verifyMFA, mfaAssuranceLevel, logout, user } = useAuth();
    const router = useRouter();

    const [code, setCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6) {
            setError('Please enter a 6-digit code.');
            return;
        }

        setVerifying(true);
        setError(null);

        const result = await verifyMFA(code);
        if (result.success) {
            router.push('/');
        } else {
            setError(result.error || 'Invalid verification code. Please try again.');
            setVerifying(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-4">
                        <LockClosedIcon className="h-10 w-10 text-orange-600" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        Two-Factor Verification
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Enter the 6-digit security code from your Authenticator App for <strong>{user?.email || 'your account'}</strong>.
                    </p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="challenge-code" className="block text-sm font-semibold text-gray-900 mb-2 text-center">
                                Security Code
                            </label>
                            <Input
                                id="challenge-code"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                className="text-center text-3xl tracking-widest font-mono font-bold py-3"
                                required
                                autoFocus
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={verifying || code.length !== 6}
                            className="w-full justify-center text-base py-3"
                        >
                            {verifying ? 'Verifying...' : 'Verify & Continue'}
                        </Button>
                    </form>

                    <div className="mt-6 pt-4 text-center border-t border-gray-100">
                        <button
                            onClick={logout}
                            className="text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                            Sign in with a different account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
