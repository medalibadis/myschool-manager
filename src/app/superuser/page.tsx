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
    EyeSlashIcon,
    CurrencyDollarIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';

// Refund Requests Section Component
function RefundRequestsSection() {
    const [refundRequests, setRefundRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [superadminNotes, setSuperadminNotes] = useState('');

    useEffect(() => {
        fetchRefundRequests();
    }, []);

    const fetchRefundRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('refund_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRefundRequests(data || []);
        } catch (error) {
            console.error('Error fetching refund requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveRequest = async (requestId: string) => {
        try {
            const { error } = await supabase
                .from('refund_requests')
                .update({
                    status: 'approved',
                    approved_at: new Date().toISOString(),
                    approved_by: 'Superadmin',
                    superadmin_notes: superadminNotes || 'Approved by superadmin',
                    updated_at: new Date().toISOString()
                })
                .eq('id', requestId);

            if (error) throw error;

            alert('✅ Refund request approved! Admin can now process the refund in payments page.');
            await fetchRefundRequests();
            setShowDetailsModal(false);
            setSelectedRequest(null);
            setSuperadminNotes('');
        } catch (error) {
            console.error('Error approving request:', error);
            alert('Failed to approve request. Please try again.');
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        if (!superadminNotes.trim()) {
            alert('Please provide a reason for rejecting this request.');
            return;
        }

        try {
            const { error } = await supabase
                .from('refund_requests')
                .update({
                    status: 'rejected',
                    approved_by: 'Superadmin',
                    superadmin_notes: superadminNotes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', requestId);

            if (error) throw error;

            alert('❌ Refund request rejected.');
            await fetchRefundRequests();
            setShowDetailsModal(false);
            setSelectedRequest(null);
            setSuperadminNotes('');
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert('Failed to reject request. Please try again.');
        }
    };

    const openDetailsModal = (request: any) => {
        setSelectedRequest(request);
        setSuperadminNotes(request.superadmin_notes || '');
        setShowDetailsModal(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    Pending
                </span>;
            case 'approved':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                    Approved
                </span>;
            case 'rejected':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircleIcon className="w-3 h-3 mr-1" />
                    Rejected
                </span>;
            default:
                return <span className="text-gray-500">{status}</span>;
        }
    };

    if (loading) {
        return (
            <Card className="p-6">
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading refund requests...</p>
                </div>
            </Card>
        );
    }

    return (
        <>
            <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CurrencyDollarIcon className="h-6 w-6 text-orange-600" />
                    Refund Requests ({refundRequests.filter(r => r.status === 'pending').length} pending)
                </h2>

                {refundRequests.length === 0 ? (
                    <div className="text-center py-8">
                        <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No refund requests</h3>
                        <p className="text-gray-500">No refund requests have been submitted yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Student
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Reason
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Submitted
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {refundRequests.map((request) => (
                                    <tr key={request.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {request.student_name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    ID: {request.student_custom_id || request.student_id.substring(0, 8) + '...'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-green-600">
                                                ${request.requested_amount.toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate">
                                                {request.reason}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(request.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(request.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openDetailsModal(request)}
                                            >
                                                View Details
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Refund Request Details Modal */}
            <Modal
                isOpen={showDetailsModal}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedRequest(null);
                    setSuperadminNotes('');
                }}
                title="Refund Request Details"
            >
                {selectedRequest && (
                    <div className="space-y-6">
                        {/* Student Info */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-900 mb-3">Student Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Name:</span>
                                    <p className="text-sm text-gray-900">{selectedRequest.student_name}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Student ID:</span>
                                    <p className="text-sm text-gray-900">
                                        {selectedRequest.student_custom_id || selectedRequest.student_id}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Requested Amount:</span>
                                    <p className="text-lg font-bold text-green-600">${selectedRequest.requested_amount.toFixed(2)}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Status:</span>
                                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Stopped Groups */}
                        <div className="bg-red-50 p-4 rounded-lg">
                            <h3 className="text-lg font-medium text-red-900 mb-3">Stopped Groups & Reasons</h3>
                            <div className="space-y-3">
                                {selectedRequest.stopped_groups?.map((group: any, index: number) => (
                                    <div key={group.id || index} className="bg-white p-3 rounded border">
                                        <div className="font-medium text-gray-900">{group.name}</div>
                                        <div className="text-sm text-gray-600 italic mt-1">
                                            Stop Reason: "{group.stopReason || 'No reason provided'}"
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Request Details */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="text-lg font-medium text-blue-900 mb-3">Request Details</h3>
                            <div className="space-y-2">
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Reason:</span>
                                    <p className="text-sm text-gray-900">{selectedRequest.reason}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Submitted by:</span>
                                    <p className="text-sm text-gray-900">{selectedRequest.admin_name}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Submitted on:</span>
                                    <p className="text-sm text-gray-900">
                                        {new Date(selectedRequest.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Superadmin Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Superadmin Notes {selectedRequest.status === 'pending' && <span className="text-red-500">*</span>}
                            </label>
                            <textarea
                                value={superadminNotes}
                                onChange={(e) => setSuperadminNotes(e.target.value)}
                                placeholder={selectedRequest.status === 'pending'
                                    ? "Add notes about your decision..."
                                    : "Notes from superadmin decision"}
                                rows={3}
                                disabled={selectedRequest.status !== 'pending'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none disabled:bg-gray-100"
                            />
                        </div>

                        {/* Actions */}
                        {selectedRequest.status === 'pending' && (
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSuperadminNotes('');
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => handleRejectRequest(selectedRequest.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    ❌ Reject Request
                                </Button>
                                <Button
                                    onClick={() => handleApproveRequest(selectedRequest.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    ✅ Approve Request
                                </Button>
                            </div>
                        )}

                        {selectedRequest.status !== 'pending' && (
                            <div className="pt-4 border-t">
                                <div className="text-center text-gray-500">
                                    This request has been {selectedRequest.status} by {selectedRequest.approved_by} on{' '}
                                    {selectedRequest.approved_at && new Date(selectedRequest.approved_at).toLocaleString()}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
}

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

                {/* Refund Requests Section */}
                <div className="mt-6">
                    <RefundRequestsSection />
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