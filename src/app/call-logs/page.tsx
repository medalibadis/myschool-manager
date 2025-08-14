'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '../../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useMySchoolStore } from '../../store';
import AuthGuard from '../../components/AuthGuard';
import { CallLog } from '../../types';
import {
    PhoneIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    CalendarIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function CallLogsPage() {
    const {
        callLogs,
        fetchCallLogs,
        addCallLog,
        updateCallLog,
        deleteCallLog,
        loading,
        error
    } = useMySchoolStore();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [editingCallLog, setEditingCallLog] = useState<CallLog | null>(null);
    const [selectedCallLog, setSelectedCallLog] = useState<CallLog | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCallType, setSelectedCallType] = useState<string>('all');
    const [formData, setFormData] = useState({
        studentName: '',
        studentPhone: '',
        callDate: new Date().toISOString().split('T')[0],
        notes: '',
        status: 'pending',
        callType: 'registration',
        adminName: 'Dalila',
    });

    // Fetch call logs on component mount
    useEffect(() => {
        fetchCallLogs();
    }, [fetchCallLogs]);

    const handleCreateCallLog = async () => {
        try {
            await addCallLog({
                studentId: "studentId",
                studentName: formData.studentName,
                studentPhone: formData.studentPhone,
                callDate: new Date(formData.callDate),
                callType: formData.callType as 'registration' | 'attendance' | 'payment' | 'activity' | 'other',
                status: formData.status as 'pending' | 'coming' | 'not_coming',
                notes: formData.notes,
                adminName: formData.adminName,
            });
            setIsCreateModalOpen(false);
            setFormData({
                studentName: '',
                studentPhone: '',
                callDate: new Date().toISOString().split('T')[0],
                notes: '',
                status: 'pending',
                callType: 'registration',
                adminName: 'Dalila',
            });
            fetchCallLogs();
        } catch (error) {
            console.error('Error creating call log:', error);
            alert('Failed to create call log. Please try again.');
        }
    };

    const handleUpdateCallLog = async () => {
        if (!editingCallLog) return;

        try {
            await updateCallLog(editingCallLog.id, {
                studentName: formData.studentName,
                studentPhone: formData.studentPhone,
                callDate: new Date(formData.callDate),
                callType: formData.callType as 'registration' | 'attendance' | 'payment' | 'activity' | 'other',
                status: formData.status as 'pending' | 'coming' | 'not_coming',
                notes: formData.notes,
                adminName: formData.adminName,
            });
            setIsEditModalOpen(false);
            setEditingCallLog(null);
            fetchCallLogs();
        } catch (error) {
            console.error('Error updating call log:', error);
            alert('Failed to update call log. Please try again.');
        }
    };

    const handleDeleteCallLog = async (id: string) => {
        if (confirm('Are you sure you want to delete this call log?')) {
            try {
                await deleteCallLog(id);
                fetchCallLogs();
            } catch (error) {
                console.error('Error deleting call log:', error);
                alert('Failed to delete call log. Please try again.');
            }
        }
    };

    const openEditModal = (callLog: CallLog) => {
        setEditingCallLog(callLog);
        setFormData({
            studentName: callLog.studentName || '',
            studentPhone: callLog.studentPhone || '',
            callDate: callLog.callDate.toISOString().split('T')[0],
            notes: callLog.notes || '',
            status: callLog.status || 'pending',
            callType: callLog.callType || 'registration',
            adminName: callLog.adminName || 'Dalila',
        });
        setIsEditModalOpen(true);
    };

    const openDetailsModal = (callLog: CallLog) => {
        setSelectedCallLog(callLog);
        setIsDetailsModalOpen(true);
    };

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedCallType('all');
    };

    const filteredCallLogs = callLogs.filter(log => {
        const matchesSearch = log.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.studentPhone?.includes(searchTerm) ||
            log.notes?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCallType = selectedCallType === 'all' || log.callType === selectedCallType;

        return matchesSearch && matchesCallType;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'coming':
                return 'bg-green-100 text-green-800';
            case 'not_coming':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getCallTypeColor = (callType: string) => {
        switch (callType) {
            case 'registration':
                return 'bg-blue-100 text-blue-800';
            case 'attendance':
                return 'bg-purple-100 text-purple-800';
            case 'payment':
                return 'bg-green-100 text-green-800';
            case 'activity':
                return 'bg-orange-100 text-orange-800';
            case 'other':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50">
                <Navigation />
                <div className="p-4 pl-8">
                    <div className="max-w-6xl ml-auto mr-0">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Call Logs</h1>
                                <p className="text-gray-600 text-sm">
                                    {searchTerm || selectedCallType !== 'all'
                                        ? `Showing ${filteredCallLogs.length} of ${callLogs.length} records`
                                        : `Total: ${callLogs.length} records`
                                    }
                                </p>
                            </div>
                            <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Add Call Log
                            </Button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                                <strong>Error:</strong> {error}
                                <button
                                    onClick={() => fetchCallLogs()}
                                    className="ml-2 text-red-800 underline hover:no-underline"
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        {loading && (
                            <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded text-sm">
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                                    Loading call logs...
                                </div>
                            </div>
                        )}

                        <div className="mb-4">
                            <div className="flex gap-4">
                                <div className="relative flex-1">
                                    <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search call logs..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 h-9 text-sm"
                                    />
                                </div>
                                <div className="flex-shrink-0">
                                    <select
                                        value={selectedCallType}
                                        onChange={(e) => setSelectedCallType(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-9 text-sm bg-white"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="registration">Registration</option>
                                        <option value="attendance">Attendance</option>
                                        <option value="payment">Payment</option>
                                        <option value="activity">Activity</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                {(searchTerm || selectedCallType !== 'all') && (
                                    <div className="flex-shrink-0">
                                        <Button
                                            variant="outline"
                                            onClick={resetFilters}
                                            size="sm"
                                            className="h-9"
                                        >
                                            Clear Filters
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Call Logs</CardTitle>
                                <CardDescription>
                                    Communication records with students
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {filteredCallLogs.length === 0 ? (
                                    <div className="text-center py-8">
                                        <PhoneIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                        <h3 className="text-base font-medium text-gray-900 mb-2">
                                            {searchTerm ? 'No call logs found' : 'No call logs yet'}
                                        </h3>
                                        <p className="text-gray-600 text-sm mb-3">
                                            {searchTerm
                                                ? 'Try adjusting your search terms'
                                                : 'Start by adding your first call log'
                                            }
                                        </p>
                                        {!searchTerm && (
                                            <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
                                                <PlusIcon className="h-4 w-4 mr-2" />
                                                Add First Call Log
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Student
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Phone
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Date
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Type
                                                    </th>

                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Notes
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Admin
                                                    </th>

                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredCallLogs.map((callLog) => (
                                                    <tr
                                                        key={callLog.id}
                                                        className="hover:bg-gray-50 cursor-pointer"
                                                        onClick={() => openDetailsModal(callLog)}
                                                    >
                                                        <td className="px-4 py-2 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {callLog.studentName || 'Unknown Student'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap">
                                                            <div className="flex items-center text-sm text-gray-900">
                                                                <PhoneIcon className="h-3 w-3 mr-1 text-gray-400" />
                                                                {callLog.studentPhone || 'No phone'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                <div className="flex items-center">
                                                                    <CalendarIcon className="h-3 w-3 mr-1 text-gray-400" />
                                                                    {format(callLog.callDate, 'MMM dd, yyyy')}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap">
                                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCallTypeColor(callLog.callType)}`}>
                                                                {callLog.callType}
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-2">
                                                            <div className="text-sm text-gray-900 max-w-32 truncate">
                                                                {callLog.notes || '-'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap">
                                                            <div className="flex items-center text-sm text-gray-900">
                                                                <UserIcon className="h-3 w-3 mr-1 text-gray-400" />
                                                                {callLog.adminName || 'Unknown'}
                                                            </div>
                                                        </td>

                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Create Call Log Modal */}
                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    title="Add New Call Log"
                    maxWidth="md"
                >
                    {/* CREATE_MODAL_START */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Student Name
                            </label>
                            <Input
                                value={formData.studentName}
                                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                                placeholder="Enter student name"
                                className="h-9"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Student Phone
                            </label>
                            <Input
                                value={formData.studentPhone}
                                onChange={(e) => setFormData({ ...formData, studentPhone: e.target.value })}
                                placeholder="Enter student phone number"
                                className="h-9"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Call Date
                            </label>
                            <Input
                                type="date"
                                value={formData.callDate}
                                onChange={(e) => setFormData({ ...formData, callDate: e.target.value })}
                                className="h-9"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Call Type
                                </label>
                                <select
                                    value={formData.callType}
                                    onChange={(e) => setFormData({ ...formData, callType: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-9 text-sm"
                                >
                                    <option value="registration">Registration</option>
                                    <option value="attendance">Attendance</option>
                                    <option value="payment">Payment</option>
                                    <option value="activity">Activity</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-9 text-sm"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="coming">Coming</option>
                                    <option value="not_coming">Not Coming</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Enter call notes..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Admin Name
                            </label>
                            <Input
                                value={formData.adminName}
                                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                placeholder="Enter admin name"
                                className="h-9"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-200">
                        <Button
                            variant="outline"
                            onClick={() => setIsCreateModalOpen(false)}
                            size="sm"
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleCreateCallLog} size="sm">
                            Create Call Log
                        </Button>
                    </div>
                    {/* CREATE_MODAL_END */}
                </Modal>

                {/* Edit Call Log Modal */}
                <Modal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingCallLog(null);
                    }}
                    title="Edit Call Log"
                    maxWidth="md"
                >
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Student Name
                            </label>
                            <Input
                                value={formData.studentName}
                                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                                placeholder="Enter student name"
                                className="h-9"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Student Phone
                            </label>
                            <Input
                                value={formData.studentPhone}
                                onChange={(e) => setFormData({ ...formData, studentPhone: e.target.value })}
                                placeholder="Enter student phone number"
                                className="h-9"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Call Date
                            </label>
                            <Input
                                type="date"
                                value={formData.callDate}
                                onChange={(e) => setFormData({ ...formData, callDate: e.target.value })}
                                className="h-9"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Call Type
                                </label>
                                <select
                                    value={formData.callType}
                                    onChange={(e) => setFormData({ ...formData, callType: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-9 text-sm"
                                >
                                    <option value="registration">Registration</option>
                                    <option value="attendance">Attendance</option>
                                    <option value="payment">Payment</option>
                                    <option value="activity">Activity</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-9 text-sm"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="coming">Coming</option>
                                    <option value="not_coming">Not Coming</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Enter call notes..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Admin Name
                            </label>
                            <Input
                                value={formData.adminName}
                                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                placeholder="Enter admin name"
                                className="h-9"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-200">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsEditModalOpen(false);
                                setEditingCallLog(null);
                            }}
                            size="sm"
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateCallLog} size="sm">
                            Update Call Log
                        </Button>
                    </div>
                </Modal>

                {/* Call Log Details Modal */}
                <Modal
                    isOpen={isDetailsModalOpen}
                    onClose={() => {
                        setIsDetailsModalOpen(false);
                        setSelectedCallLog(null);
                    }}
                    title="Call Log Details"
                    maxWidth="md"
                >
                    {selectedCallLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Student Name
                                    </label>
                                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                        {selectedCallLog.studentName || 'Unknown Student'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone Number
                                    </label>
                                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                        {selectedCallLog.studentPhone || 'No phone'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Call Date
                                    </label>
                                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                        {format(selectedCallLog.callDate, 'MMM dd, yyyy')}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Call Type
                                    </label>
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getCallTypeColor(selectedCallLog.callType)}`}>
                                        {selectedCallLog.callType}
                                    </span>
                                </div>
                            </div>

                            {/* Only show status for activity and registration call types */}
                            {(selectedCallLog.callType === 'activity' || selectedCallLog.callType === 'registration') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedCallLog.status)}`}>
                                        {selectedCallLog.status}
                                    </span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
                                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded min-h-[60px]">
                                    {selectedCallLog.notes || 'No notes'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Admin Name
                                </label>
                                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                    {selectedCallLog.adminName || 'Unknown'}
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsDetailsModalOpen(false);
                                        setSelectedCallLog(null);
                                    }}
                                    size="sm"
                                >
                                    Close
                                </Button>
                                <Button
                                    onClick={() => {
                                        setIsDetailsModalOpen(false);
                                        setSelectedCallLog(null);
                                        openEditModal(selectedCallLog);
                                    }}
                                    size="sm"
                                >
                                    Edit
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </AuthGuard>
    );
} 