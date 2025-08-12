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
import { GlobalKeyboardShortcuts } from '../../components/GlobalKeyboardShortcuts';
import {
    PhoneIcon,
    UserIcon,
    ClockIcon,
    DocumentTextIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    ClockIcon as HistoryIcon,
} from '@heroicons/react/24/outline';

export default function CallLogsPage() {
    const { callLogs, fetchCallLogs, loading, error, groups, fetchGroups } = useMySchoolStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('');

    // History modal state
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [studentCallLogs, setStudentCallLogs] = useState<CallLog[]>([]);

    // Call log detail modal state
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedCallLog, setSelectedCallLog] = useState<CallLog | null>(null);

    // Fetch call logs and groups on component mount
    useEffect(() => {
        fetchCallLogs();
        fetchGroups();
    }, [fetchCallLogs, fetchGroups]);

    // Helper function to check if search term matches first letters of names
    const matchesFirstLetters = (searchTerm: string, fullName: string) => {
        if (!searchTerm || !fullName) return false;

        const searchLower = searchTerm.toLowerCase().trim();
        const nameLower = fullName.toLowerCase();

        // Split name by spaces
        const nameWords = nameLower.split(/\s+/);

        // If search term is empty, return true
        if (searchLower === '') return true;

        // Handle single character search (e.g., "m" for "mohammed ali")
        if (searchLower.length === 1) {
            return nameWords.some(word => word.startsWith(searchLower));
        }

        // Handle multi-character search term (e.g., "ma" for "mohammed ali")
        if (searchLower.length > 1) {
            // Check if it matches the beginning of any name word
            if (nameWords.some(word => word.startsWith(searchLower))) {
                return true;
            }

            // Check if it matches first letters of multiple name words
            // e.g., "ma" should match "mohammed ali" (m + a)
            if (searchLower.length <= nameWords.length) {
                let match = true;
                for (let i = 0; i < searchLower.length && i < nameWords.length; i++) {
                    if (!nameWords[i].startsWith(searchLower[i])) {
                        match = false;
                        break;
                    }
                }
                if (match) return true;
            }
        }

        return false;
    };

    // Filter call logs based on search term and filters
    const filteredCallLogs = callLogs.filter(log => {
        const matchesSearch = searchTerm === '' ||
            matchesFirstLetters(searchTerm, log.studentName || '') ||
            log.studentPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.adminName?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === '' || log.callType === filterType;
        const matchesStatus = true; // No status filter, so always true

        return matchesSearch && matchesType && matchesStatus;
    });

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const getCallTypeColor = (type: string) => {
        switch (type) {
            case 'registration':
                return 'bg-blue-100 text-blue-800';
            case 'attendance':
                return 'bg-green-100 text-green-800';
            case 'payment':
                return 'bg-yellow-100 text-yellow-800';
            case 'activity':
                return 'bg-purple-100 text-purple-800';
            case 'other':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Get all unique students from groups for search
    const getAllStudents = () => {
        const allStudents: any[] = [];
        groups.forEach(group => {
            group.students.forEach(student => {
                // Check if student already exists (by student ID - most reliable)
                const exists = allStudents.some(s => s.id === student.id);
                if (!exists) {
                    allStudents.push({
                        ...student,
                        groupName: group.name
                    });
                }
            });
        });
        return allStudents;
    };

    // Filter students based on search term (name or phone)
    const filteredStudents = getAllStudents().filter(student => {
        const searchTerm = studentSearchTerm.toLowerCase().trim();
        if (!searchTerm) return true;

        // Search by first letters of names (including spaces)
        const nameMatch = matchesFirstLetters(studentSearchTerm, student.name);

        // Search by phone numbers (includes)
        const phoneMatch = student.phone && student.phone.includes(studentSearchTerm);
        const secondPhoneMatch = student.secondPhone && student.secondPhone.includes(studentSearchTerm);

        return nameMatch || phoneMatch || secondPhoneMatch;
    });

    // Handle student selection and load their call logs
    const handleStudentSelect = (student: any) => {
        setSelectedStudent(student);

        // Filter call logs for this student using multiple matching strategies
        // This handles cases where students (like brothers) share the same phone number
        const studentLogs = callLogs.filter(log => {
            // Strategy 1: Try to match by student ID if available (most reliable)
            if (log.studentId && student.id && log.studentId === student.id) {
                return true;
            }

            // Strategy 2: Match by exact name and phone combination (for students with same phone)
            // This ensures that even if two students have the same phone, only the one with
            // the exact matching name will be selected
            const nameMatch = log.studentName && student.name &&
                log.studentName.toLowerCase().trim() === student.name.toLowerCase().trim();
            const phoneMatch = log.studentPhone && student.phone &&
                log.studentPhone.trim() === student.phone.trim();

            // Only return true if BOTH name and phone match exactly
            return nameMatch && phoneMatch;
        });

        setStudentCallLogs(studentLogs);
    };

    // Handle student search change - automatically select student when typing
    const handleStudentSearchChange = (searchValue: string) => {
        setStudentSearchTerm(searchValue);

        // If search is empty, clear selection
        if (!searchValue.trim()) {
            setSelectedStudent(null);
            setStudentCallLogs([]);
            return;
        }

        // Find matching students
        const matchingStudents = getAllStudents().filter(student => {
            const searchLower = searchValue.toLowerCase().trim();
            if (!searchLower) return false;

            // Search by first letters of names (including spaces)
            const nameMatch = matchesFirstLetters(searchValue, student.name);

            // Search by phone numbers (includes)
            const phoneMatch = student.phone && student.phone.includes(searchValue);
            const secondPhoneMatch = student.secondPhone && student.secondPhone.includes(searchValue);

            return nameMatch || phoneMatch || secondPhoneMatch;
        });

        // If exactly one match, automatically select it
        if (matchingStudents.length === 1) {
            handleStudentSelect(matchingStudents[0]);
        } else if (matchingStudents.length > 1) {
            // If multiple matches, prioritize exact name matches
            const exactNameMatches = matchingStudents.filter(student =>
                student.name.toLowerCase().trim() === searchValue.toLowerCase().trim()
            );

            if (exactNameMatches.length === 1) {
                handleStudentSelect(exactNameMatches[0]);
            } else {
                // If multiple matches, don't auto-select - let user choose from the list
                setSelectedStudent(null);
                setStudentCallLogs([]);
            }
        } else {
            // No matches, clear selection
            setSelectedStudent(null);
            setStudentCallLogs([]);
        }
    };

    // Handle opening history modal
    const handleOpenHistory = () => {
        setShowHistoryModal(true);
        setStudentSearchTerm('');
        setSelectedStudent(null);
        setStudentCallLogs([]);
    };

    // Handle closing history modal
    const handleCloseHistory = () => {
        setShowHistoryModal(false);
        setStudentSearchTerm('');
        setSelectedStudent(null);
        setStudentCallLogs([]);
    };

    // Handle row click to show call log details
    const handleRowClick = (callLog: CallLog) => {
        setSelectedCallLog(callLog);
        setShowDetailModal(true);
    };

    // Handle closing detail modal
    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setSelectedCallLog(null);
    };

    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50">
                <Navigation />

                <div className="lg:ml-16">
                    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
                        {error && (
                            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                                {error}
                            </div>
                        )}

                        {loading && (
                            <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                                Loading...
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Call Logs</h1>
                                <p className="mt-2 text-gray-600">
                                    Track all student calls and confirmations
                                </p>
                            </div>
                            <Button
                                onClick={handleOpenHistory}
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                            >
                                <HistoryIcon className="h-4 w-4 mr-2" />
                                History
                            </Button>
                        </div>

                        {/* Search and Filters */}
                        <Card className="mb-6">
                            <CardHeader className="px-6 py-4">
                                <CardTitle className="flex items-center">
                                    <FunnelIcon className="h-5 w-5 mr-2" />
                                    Search & Filters
                                </CardTitle>
                                <CardDescription>
                                    Filter call logs by student (first letters), notes, admin, or phone
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-6 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="relative">
                                        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                                        <Input
                                            type="text"
                                            placeholder="Search by first letters (e.g., 'ma' for 'mohammed ali')..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                    <select
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">All Reasons</option>
                                        <option value="registration">Registration</option>
                                        <option value="attendance">Attendance</option>
                                        <option value="payment">Payment</option>
                                        <option value="activity">Activity</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setFilterType('');
                                        }}
                                    >
                                        Clear Filters
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Call Logs Table */}
                        <Card>
                            <CardHeader className="px-6 py-4">
                                <CardTitle>Recent Call Logs</CardTitle>
                                <CardDescription>
                                    {filteredCallLogs.length} of {callLogs.length} call logs
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-6 py-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Student
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Phone
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Reason
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Admin
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Notes
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date & Time
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredCallLogs.map((log) => (
                                                <tr
                                                    key={log.id}
                                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                                    onClick={() => handleRowClick(log)}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {log.studentName || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                                                            <span className="text-sm text-gray-900">
                                                                {log.studentPhone || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCallTypeColor(log.callType)}`}>
                                                            {log.callType.charAt(0).toUpperCase() + log.callType.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {log.adminName || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <DocumentTextIcon className="h-4 w-4 text-gray-400 mr-2" />
                                                            <span className="text-sm text-gray-900 max-w-xs truncate">
                                                                {log.notes || 'No notes'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                                                            <span className="text-sm text-gray-900">
                                                                {formatDate(log.callDate)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {filteredCallLogs.length === 0 && (
                                    <div className="text-center py-8">
                                        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No call logs found</h3>
                                        <p className="text-gray-500">
                                            {callLogs.length === 0
                                                ? 'No call logs have been created yet.'
                                                : 'No call logs match your current filters.'}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <GlobalKeyboardShortcuts />

                {/* Call Log Detail Modal */}
                <Modal
                    isOpen={showDetailModal}
                    onClose={handleCloseDetailModal}
                    title={`Call Log Details - ${selectedCallLog?.studentName || 'N/A'}`}
                    maxWidth="2xl"
                >
                    {selectedCallLog && (
                        <div className="space-y-6">
                            {/* Student Information */}
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                <h3 className="text-sm font-medium text-orange-700 mb-3">Student Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <UserIcon className="h-4 w-4 text-orange-500" />
                                        <div>
                                            <div className="text-xs font-medium text-orange-700">Student Name</div>
                                            <div className="text-sm text-gray-900">{selectedCallLog.studentName || 'N/A'}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <PhoneIcon className="h-4 w-4 text-orange-500" />
                                        <div>
                                            <div className="text-xs font-medium text-orange-700">Phone Number</div>
                                            <div className="text-sm text-gray-900">{selectedCallLog.studentPhone || 'N/A'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Call Details */}
                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Call Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <ClockIcon className="h-4 w-4 text-gray-500" />
                                        <div>
                                            <div className="text-xs font-medium text-gray-700">Date & Time</div>
                                            <div className="text-sm text-gray-900">{formatDate(selectedCallLog.callDate)}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <UserIcon className="h-4 w-4 text-gray-500" />
                                        <div>
                                            <div className="text-xs font-medium text-gray-700">Admin</div>
                                            <div className="text-sm text-gray-900">{selectedCallLog.adminName || 'N/A'}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                                        <div>
                                            <div className="text-xs font-medium text-gray-700">Call Type</div>
                                            <div className="text-sm">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCallTypeColor(selectedCallLog.callType)}`}>
                                                    {selectedCallLog.callType.charAt(0).toUpperCase() + selectedCallLog.callType.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes Section */}
                            <div className="bg-white p-4 rounded-lg border">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Notes</h3>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                        {selectedCallLog.notes || 'No notes provided for this call.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* History Modal */}
                <Modal
                    isOpen={showHistoryModal}
                    onClose={handleCloseHistory}
                    title="Student Call History"
                    maxWidth="2xl"
                >
                    <div className="space-y-4 px-4">
                        {/* Student Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Search Student by Name (first letters) or Phone
                            </label>
                            <Input
                                value={studentSearchTerm}
                                onChange={(e) => handleStudentSearchChange(e.target.value)}
                                placeholder="Type first letters (e.g., 'ma' for 'mohammed ali') or phone number..."
                                className="w-full"
                            />
                            {studentSearchTerm && !selectedStudent && filteredStudents.length === 0 && (
                                <p className="text-red-500 text-sm mt-1">No students found with that name or phone number</p>
                            )}
                            {studentSearchTerm && !selectedStudent && filteredStudents.length > 1 && (
                                <p className="text-blue-500 text-sm mt-1">Multiple students found. Please select one from the list below.</p>
                            )}
                        </div>

                        {/* Student Selection */}
                        {studentSearchTerm && !selectedStudent && filteredStudents.length > 1 && (
                            <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                                <div className="p-4">
                                    <h3 className="text-sm font-medium text-gray-700 mb-1">Select Student:</h3>
                                    {filteredStudents.length > 0 ? (
                                        <div className="space-y-1">
                                            {filteredStudents.map((student, index) => (
                                                <button
                                                    key={`${student.name}-${student.phone}-${index}`}
                                                    onClick={() => handleStudentSelect(student)}
                                                    className="w-full text-left p-2 rounded-lg hover:bg-orange-50 border border-gray-100 transition-colors"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <div className="font-medium text-gray-900">{student.name}</div>
                                                            <div className="text-sm text-gray-500">
                                                                {student.phone}
                                                                {student.secondPhone && (
                                                                    <span className="ml-2 text-gray-400">| {student.secondPhone}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-orange-600">{student.groupName}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-sm">No students found with that name or phone number</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Selected Student & Call History */}
                        {selectedStudent && (
                            <div className="space-y-3">
                                {/* Selected Student Info */}
                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-medium text-orange-700">{selectedStudent.name}</h3>
                                            <p className="text-sm text-orange-600">Phone: {selectedStudent.phone}</p>
                                            {selectedStudent.secondPhone && (
                                                <p className="text-sm text-orange-600">Secondary: {selectedStudent.secondPhone}</p>
                                            )}
                                        </div>
                                        <div className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                            Auto-selected
                                        </div>
                                    </div>
                                </div>

                                {/* Call History Table */}
                                <div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-3">
                                        Call History ({studentCallLogs.length} calls)
                                    </h4>

                                    {studentCallLogs.length > 0 ? (
                                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Date & Time
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Admin
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Reason
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Comment
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {studentCallLogs
                                                        .sort((a, b) => new Date(b.callDate).getTime() - new Date(a.callDate).getTime())
                                                        .map((log) => (
                                                            <tr key={log.id} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">
                                                                        {formatDate(new Date(log.callDate))}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {log.adminName}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCallTypeColor(log.callType)}`}>
                                                                        {log.callType}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="text-sm text-gray-900 max-w-xs truncate" title={log.notes || ''}>
                                                                        {log.notes || 'No notes'}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-gray-500">
                                            <PhoneIcon className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                                            <p>No call logs found for this student</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            </div>
        </AuthGuard>
    );
} 