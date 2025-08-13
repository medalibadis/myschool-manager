'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '../../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useMySchoolStore } from '../../store';
import AuthGuard from '../../components/AuthGuard';
import {
    PhoneIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    CalendarIcon,
    ClockIcon,
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
    const [editingCallLog, setEditingCallLog] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        studentName: '',
        studentPhone: '',
        callDate: new Date().toISOString().split('T')[0],
        callTime: new Date().toTimeString().split(' ')[0],
        notes: '',
        status: 'pending',
        callType: 'incoming',
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
                callType: formData.callType as any,
                status: formData.status as any,
                notes: formData.notes,
                adminName: formData.adminName,
            });
            setIsCreateModalOpen(false);
            setFormData({
                studentName: '',
                studentPhone: '',
                callDate: new Date().toISOString().split('T')[0],
                callTime: new Date().toTimeString().split(' ')[0],
                notes: '',
                status: 'pending',
                callType: 'incoming',
                adminName: 'Dalila',
            });
            // Refresh the call logs
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
                callType: formData.callType as any,
                status: formData.status as any,
                notes: formData.notes,
                adminName: formData.adminName,
            });
            setIsEditModalOpen(false);
            setEditingCallLog(null);
            // Refresh the call logs
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
                // Refresh the call logs
                fetchCallLogs();
            } catch (error) {
                console.error('Error deleting call log:', error);
                alert('Failed to delete call log. Please try again.');
            }
        }
    };

    const openEditModal = (callLog: any) => {
        setEditingCallLog(callLog);
        setFormData({
            studentName: callLog.studentName || '',
            studentPhone: callLog.studentPhone || '',
            callDate: callLog.callDate.toISOString().split('T')[0],
            callTime: callLog.callTime || '',
            notes: callLog.notes || '',
            status: callLog.status || 'pending',
            callType: callLog.callType || 'incoming',
            adminName: callLog.adminName || 'Dalila',
        });
        setIsEditModalOpen(true);
    };

    const filteredCallLogs = callLogs.filter(log =>
        log.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.studentPhone?.includes(searchTerm) ||
        log.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50">
                <Navigation />
                <div className="p-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Call Logs</h1>
                                <p className="text-gray-600 mt-2">
                                    Manage and track all student communication records
                                </p>
                                <div className="text-sm text-gray-500 mt-1">
                                    Total call logs: {callLogs.length}
                                </div>
                            </div>
                            <Button onClick={() => setIsCreateModalOpen(true)}>
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Add Call Log
                            </Button>
                        </div>

                        {error && (
                            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
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
                            <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                                    Loading call logs...
                                </div>
                            </div>
                        )}

                        <div className="mb-4">
                            <div className="relative">
                                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search call logs..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {filteredCallLogs.length === 0 ? (
                                <Card>
                                    <CardContent className="p-6 text-center">
                                        <PhoneIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            {searchTerm ? 'No call logs found' : 'No call logs yet'}
                                        </h3>
                                        <p className="text-gray-600 mb-4">
                                            {searchTerm
                                                ? 'Try adjusting your search terms'
                                                : 'Start by adding your first call log'
                                            }
                                        </p>
                                        {!searchTerm && (
                                            <Button onClick={() => setIsCreateModalOpen(true)}>
                                                <PlusIcon className="h-5 w-5 mr-2" />
                                                Add First Call Log
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : (
                                filteredCallLogs.map((callLog) => (
                                    <Card key={callLog.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-semibold text-lg text-gray-900">
                                                            {callLog.studentName || 'Unknown Student'}
                                                        </h3>
                                                        <span className={`px-2 py-1 text-xs rounded-full ${callLog.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                callLog.status === 'coming' ? 'bg-green-100 text-green-800' :
                                                                    'bg-red-100 text-red-800'
                                                            }`}>
                                                            {callLog.status}
                                                        </span>
                                                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                            {callLog.callType}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-600 mb-2">
                                                        <span className="flex items-center gap-1">
                                                            <PhoneIcon className="h-4 w-4" />
                                                            {callLog.studentPhone || 'No phone'}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-600 mb-2">
                                                        <span className="flex items-center gap-1">
                                                            <CalendarIcon className="h-4 w-4" />
                                                            {format(callLog.callDate, 'MMM dd, yyyy')}
                                                        </span>
                                                    </div>
                                                    {callLog.notes && (
                                                        <p className="text-gray-700 text-sm">{callLog.notes}</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openEditModal(callLog)}
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDeleteCallLog(callLog.id)}
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Create Call Log Modal */}
                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    title="Add New Call Log"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Student Name
                            </label>
                            <Input
                                value={formData.studentName}
                                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                                placeholder="Enter student name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Student Phone
                            </label>
                            <Input
                                value={formData.studentPhone}
                                onChange={(e) => setFormData({ ...formData, studentPhone: e.target.value })}
                                placeholder="Enter phone number"
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
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Call Type
                            </label>
                            <select
                                value={formData.callType}
                                onChange={(e) => setFormData({ ...formData, callType: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="incoming">Incoming</option>
                                <option value="outgoing">Outgoing</option>
                                <option value="follow-up">Follow-up</option>
                                <option value="registration">Registration</option>
                                <option value="payment">Payment</option>
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="pending">Pending</option>
                                <option value="coming">Coming</option>
                                <option value="not_coming">Not Coming</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Enter call notes..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                            />
                        </div>
                        <div className="flex gap-2 pt-4">
                            <Button onClick={handleCreateCallLog} className="flex-1">
                                Create Call Log
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Edit Call Log Modal */}
                <Modal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    title="Edit Call Log"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Student Name
                            </label>
                            <Input
                                value={formData.studentName}
                                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                                placeholder="Enter student name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Student Phone
                            </label>
                            <Input
                                value={formData.studentPhone}
                                onChange={(e) => setFormData({ ...formData, studentPhone: e.target.value })}
                                placeholder="Enter phone number"
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
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Call Type
                            </label>
                            <select
                                value={formData.callType}
                                onChange={(e) => setFormData({ ...formData, callType: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="incoming">Incoming</option>
                                <option value="outgoing">Outgoing</option>
                                <option value="follow-up">Follow-up</option>
                                <option value="registration">Registration</option>
                                <option value="payment">Payment</option>
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="pending">Pending</option>
                                <option value="coming">Coming</option>
                                <option value="not_coming">Not Coming</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Enter call notes..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                            />
                        </div>
                        <div className="flex gap-2 pt-4">
                            <Button onClick={handleUpdateCallLog} className="flex-1">
                                Update Call Log
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </AuthGuard>
    );
} 