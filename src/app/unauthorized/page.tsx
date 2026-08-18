'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldExclamationIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

export default function UnauthorizedPage() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-10 px-6 shadow-xl sm:rounded-xl sm:px-10 border border-gray-100 text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                        <ShieldExclamationIcon className="h-10 w-10 text-red-600" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Access Restricted
                    </h2>

                    <p className="text-sm text-gray-600 mb-6">
                        You do not have the required administrator permissions to view this section.
                    </p>

                    <div className="bg-gray-50 p-4 rounded-lg text-left text-xs text-gray-600 mb-6 border border-gray-200">
                        <p className="font-semibold text-gray-900 mb-1">Logged in as:</p>
                        <p>{user?.name} ({user?.email})</p>
                        <p className="mt-1"><span className="font-semibold">Role:</span> {user?.role}</p>
                    </div>

                    <div className="space-y-3">
                        <Link href="/" className="block w-full">
                            <Button variant="default" className="w-full justify-center">
                                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                                Return to Dashboard
                            </Button>
                        </Link>

                        <button
                            onClick={logout}
                            className="text-xs text-gray-500 hover:text-gray-700 underline pt-2"
                        >
                            Sign out / Switch account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
