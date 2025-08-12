'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Admin } from '../../types';
import { adminService } from '../../lib/admin-service';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import AdminCredentialsBoard from '../../components/AdminCredentialsBoard';
import {
    UserIcon,
    ShieldCheckIcon,
    TrashIcon,
    PencilIcon,
    EyeIcon,
    EyeSlashIcon
} from '@heroicons/react/24/outline';

export default function SuperuserDashboard() {
    const { user, isSuperuser } = useAuth();
    const router = useRouter();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!isSuperuser) {
            router.push('/');
            return;
        }
        fetchAdmins();
    }, [isSuperuser, router]);

    const fetchAdmins = async () => {
        try {
            const data = await adminService.getAll();
            setAdmins(data);
        } catch (error) {
            console.error('Error fetching admins:', error);
        } finally {
            setLoading(false);
        }
    };

    const testConnection = async () => {
        try {
            const result = await adminService.testConnection();
            alert(result.message);
        } catch (error) {
            alert(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleDeactivateAdmin = async (adminId: string) => {
        if (!confirm('Are you sure you want to deactivate this admin?')) return;

        try {
            await adminService.deactivate(adminId);
            fetchAdmins();
            alert('Admin deactivated successfully');
        } catch (error) {
            console.error('Error deactivating admin:', error);
            alert('Error deactivating admin');
        }
    };

    const handleChangePassword = async () => {
        if (!selectedAdmin || !newPassword) return;

        try {
            await adminService.updatePassword(selectedAdmin.id, newPassword);
            setShowPasswordModal(false);
            setNewPassword('');
            setSelectedAdmin(null);
            alert('Password changed successfully');
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Error changing password');
        }
    };

    if (!isSuperuser) {
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <ShieldCheckIcon className="h-8 w-8 text-orange-600" />
                                Superuser Dashboard
                            </h1>
                            <p className="text-gray-600 mt-1">Manage admin accounts and system settings</p>
                        </div>
                        <Button
                            onClick={testConnection}
                            variant="outline"
                        >
                            Test Connection
                        </Button>
                    </div>
                </div>

                {/* Admin Accounts Board */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <UserIcon className="h-6 w-6 text-orange-600" />
                        Admin Accounts
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Admin
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Username
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {admins.map((admin) => (
                                    <tr key={admin.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                                        <UserIcon className="h-6 w-6 text-orange-600" />
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {admin.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {admin.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {admin.username}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${admin.role === 'superuser'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {admin.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${admin.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {admin.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(admin.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedAdmin(admin);
                                                        setShowPasswordModal(true);
                                                    }}
                                                    className="text-orange-600 hover:text-orange-900"
                                                    title="Change Password"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                {admin.id !== user?.id && (
                                                    <button
                                                        onClick={() => handleDeactivateAdmin(admin.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Deactivate Admin"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Admin Credentials Board */}
                <div className="mt-6">
                    <AdminCredentialsBoard admins={admins} />
                </div>
            </div>

            {/* Change Password Modal */}
            <Modal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                title="Change Password"
            >
                <div className="space-y-4">
                    {selectedAdmin && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-600">
                                Changing password for: <strong>{selectedAdmin.name}</strong> ({selectedAdmin.username})
                            </p>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                        </label>
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                                ) : (
                                    <EyeIcon className="h-5 w-5 text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <Button
                        variant="outline"
                        onClick={() => setShowPasswordModal(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleChangePassword}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        Change Password
                    </Button>
                </div>
            </Modal>
        </div>
    );
} 