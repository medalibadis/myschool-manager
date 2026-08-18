'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldCheckIcon, KeyIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function MFASetupPage() {
    const { enrollMFA, confirmMFAEnrollment, mfaEnrolled, logout } = useAuth();
    const router = useRouter();

    const [factorId, setFactorId] = useState<string>('');
    const [qrCode, setQrCode] = useState<string>('');
    const [secret, setSecret] = useState<string>('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (mfaEnrolled) {
            router.push('/');
            return;
        }

        const startEnrollment = async () => {
            setLoading(true);
            setError(null);
            const data = await enrollMFA();
            if (data) {
                setFactorId(data.factorId);
                setQrCode(data.qrCode);
                setSecret(data.secret);
            } else {
                setError('Failed to generate MFA secret. Please try again or re-login.');
            }
            setLoading(false);
        };

        startEnrollment();
    }, [enrollMFA, mfaEnrolled, router]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6 || !factorId) {
            setError('Please enter a valid 6-digit verification code.');
            return;
        }

        setVerifying(true);
        setError(null);

        const success = await confirmMFAEnrollment(factorId, code);
        if (success) {
            router.push('/');
        } else {
            setError('Invalid verification code. Please check your authenticator app and try again.');
            setVerifying(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-4">
                        <ShieldCheckIcon className="h-10 w-10 text-orange-600" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        Set Up Authenticator App
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Two-factor authentication (TOTP) is strictly required for all administrative access.
                    </p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-gray-100">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mx-auto mb-4"></div>
                            <p className="text-sm text-gray-500">Generating secure QR code...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                                    1. Scan this QR code in your Authenticator App
                                </h3>
                                <p className="text-xs text-gray-500 mb-3">
                                    Open Google Authenticator, Microsoft Authenticator, or Authy and scan:
                                </p>
                                {qrCode && (
                                    <div className="flex justify-center p-4 bg-white border border-gray-200 rounded-lg shadow-inner">
                                        <img
                                            src={qrCode}
                                            alt="Authenticator QR Code"
                                            className="w-48 h-48 object-contain"
                                        />
                                    </div>
                                )}
                            </div>

                            {secret && (
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1 flex items-center font-medium">
                                        <KeyIcon className="h-4 w-4 mr-1 text-gray-400" />
                                        Manual setup key (if you cannot scan):
                                    </p>
                                    <code className="text-xs font-mono font-bold text-gray-800 break-all select-all">
                                        {secret}
                                    </code>
                                </div>
                            )}

                            <form onSubmit={handleVerify} className="space-y-4 pt-2 border-t border-gray-100">
                                <div>
                                    <label htmlFor="totp-code" className="block text-sm font-semibold text-gray-900 mb-1">
                                        2. Enter the 6-digit code shown in your app
                                    </label>
                                    <Input
                                        id="totp-code"
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={6}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                        placeholder="000000"
                                        className="text-center text-2xl tracking-widest font-mono font-bold"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={verifying || code.length !== 6}
                                    className="w-full justify-center"
                                >
                                    {verifying ? (
                                        'Verifying...'
                                    ) : (
                                        <>
                                            Complete Setup & Enter Dashboard
                                            <ArrowRightIcon className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </form>

                            <div className="pt-3 text-center border-t border-gray-100">
                                <button
                                    onClick={logout}
                                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                                >
                                    Log out & cancel setup
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
