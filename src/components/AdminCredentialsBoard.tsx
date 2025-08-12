'use client';

import React, { useState } from 'react';
import { Admin } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { EyeIcon, EyeSlashIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';

interface AdminCredentialsBoardProps {
    admins: Admin[];
}

export default function AdminCredentialsBoard({ admins }: AdminCredentialsBoardProps) {
    const [showPasswords, setShowPasswords] = useState(false);
    const [copiedAdmin, setCopiedAdmin] = useState<string | null>(null);

    // Fixed credentials for all admins
    const adminCredentials = {
        'user1': 'user1pass123',
        'user2': 'user2pass456',
        'dalila': 'dali19dali25'
    };

    const copyToClipboard = async (text: string, adminId: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedAdmin(adminId);
            setTimeout(() => setCopiedAdmin(null), 2000);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    };

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    Admin Credentials
                </h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasswords(!showPasswords)}
                >
                    {showPasswords ? (
                        <>
                            <EyeSlashIcon className="h-4 w-4 mr-2" />
                            Hide Passwords
                        </>
                    ) : (
                        <>
                            <EyeIcon className="h-4 w-4 mr-2" />
                            Show Passwords
                        </>
                    )}
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {admins.map((admin) => (
                    <div
                        key={admin.id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{admin.name}</h4>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${admin.role === 'superuser'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                                }`}>
                                {admin.role}
                            </span>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="text-gray-500">Username:</span>
                                <div className="flex items-center justify-between">
                                    <span className="font-mono bg-white px-2 py-1 rounded border">
                                        {admin.username}
                                    </span>
                                    <button
                                        onClick={() => copyToClipboard(admin.username, admin.id)}
                                        className="text-gray-400 hover:text-gray-600"
                                        title="Copy username"
                                    >
                                        <ClipboardDocumentIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {showPasswords && (
                                <div>
                                    <span className="text-gray-500">Password:</span>
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono bg-white px-2 py-1 rounded border">
                                            {adminCredentials[admin.username as keyof typeof adminCredentials] || '******'}
                                        </span>
                                        <button
                                            onClick={() => copyToClipboard(
                                                adminCredentials[admin.username as keyof typeof adminCredentials] || '',
                                                admin.id
                                            )}
                                            className="text-gray-400 hover:text-gray-600"
                                            title="Copy password"
                                        >
                                            <ClipboardDocumentIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="text-xs text-gray-400 mt-2">
                                {copiedAdmin === admin.id && (
                                    <span className="text-green-600">✓ Copied!</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {!showPasswords && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-700">
                        Click "Show Passwords" to view admin credentials. These can be used to login to the system.
                    </p>
                </div>
            )}
        </Card>
    );
} 