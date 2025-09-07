import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import Modal from './ui/Modal';
import { Student, Group, Session, AttendanceStatus } from '../types';
import { AttendancePaymentAdjuster, PaymentPriorityManager } from '../utils/paymentUtils';
import { paymentService } from '../lib/payment-service';
import { supabase } from '../lib/supabase';
import {
    UserIcon,
    CurrencyDollarIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ClockIcon,
    StopIcon,
    QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

interface EnhancedAttendanceTableProps {
    group: Group;
    students: Student[];
    sessions: Session[];
    onAttendanceUpdate: (sessionId: string, studentId: string, status: AttendanceStatus) => void;
    onBulkUpdate: (updates: Array<{ sessionId: string; studentId: string; status: AttendanceStatus }>) => void;
}

interface PaymentStatus {
    studentId: string;
    isPaid: boolean;
    remainingAmount: number;
    groupBalance: number;
}

export default function EnhancedAttendanceTable({
    group,
    students,
    sessions,
    onAttendanceUpdate,
    onBulkUpdate,
}: EnhancedAttendanceTableProps) {
    const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [stopAttendanceModal, setStopAttendanceModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [stopReason, setStopReason] = useState('');
    const [bulkEditMode, setBulkEditMode] = useState(false);
    const [bulkUpdates, setBulkUpdates] = useState<Record<string, AttendanceStatus>>({});

    // Load payment statuses for all students
    useEffect(() => {
        loadPaymentStatuses();
    }, [group.id, students]);

    const loadPaymentStatuses = async () => {
        setLoading(true);
        try {
            const statuses: PaymentStatus[] = [];

            for (const student of students) {
                try {
                    const balance = await paymentService.getStudentBalance(student.id);
                    const groupBalance = balance.groupBalances.find(gb => gb.groupId === group.id);

                    statuses.push({
                        studentId: student.id,
                        isPaid: groupBalance ? groupBalance.remainingAmount <= 0 : false,
                        remainingAmount: groupBalance ? groupBalance.remainingAmount : group.price || 0,
                        groupBalance: groupBalance ? groupBalance.amountPaid : 0,
                    });
                } catch (error) {
                    console.error(`Error loading payment status for student ${student.id}:`, error);
                    statuses.push({
                        studentId: student.id,
                        isPaid: false,
                        remainingAmount: group.price || 0,
                        groupBalance: 0,
                    });
                }
            }

            setPaymentStatuses(statuses);
        } catch (error) {
            console.error('Error loading payment statuses:', error);
        } finally {
            setLoading(false);
        }
    };

    const getAttendanceStatus = (sessionId: string, studentId: string): AttendanceStatus => {
        const session = sessions.find(s => s.id === sessionId);
        return session?.attendance[studentId] || 'default';
    };

    const handleAttendanceChange = async (
        sessionId: string,
        studentId: string,
        newStatus: AttendanceStatus
    ) => {
        const oldStatus = getAttendanceStatus(sessionId, studentId);

        // Update attendance
        onAttendanceUpdate(sessionId, studentId, newStatus);

        // Handle payment adjustments if needed
        if (AttendancePaymentAdjuster.requiresPaymentAdjustment(newStatus)) {
            try {
                await paymentService.handleAttendanceAdjustment(
                    studentId,
                    group.id,
                    sessionId,
                    oldStatus,
                    newStatus
                );

                // Reload payment statuses
                await loadPaymentStatuses();
            } catch (error) {
                console.error('Error handling attendance payment adjustment:', error);
            }
        }
    };

    const handleStopAttendance = async () => {
        if (!selectedStudent || !stopReason.trim()) return;

        try {
            // Update all future sessions to 'stop' status
            const futureSessions = sessions.filter(s => new Date(s.date) > new Date());
            const updates = futureSessions.map(session => ({
                sessionId: session.id,
                studentId: selectedStudent.id,
                status: 'stop' as AttendanceStatus,
            }));

            // Apply bulk update
            onBulkUpdate(updates);

            // Handle stop attendance in payment system
            await paymentService.handleStopAttendance(
                selectedStudent.id,
                group.id,
                stopReason,
                'Admin'
            );

            // Reload payment statuses
            await loadPaymentStatuses();

            // Close modal
            setStopAttendanceModal(false);
            setSelectedStudent(null);
            setStopReason('');

        } catch (error) {
            console.error('Error handling stop attendance:', error);
            alert('Error stopping attendance. Please try again.');
        }
    };

    const getPaymentStatusIcon = (status: PaymentStatus) => {
        if (status.isPaid) {
            return <CheckCircleIcon className="h-5 w-5 text-green-600" title="Fully Paid" />;
        } else if (status.groupBalance > 0) {
            return <ClockIcon className="h-5 w-5 text-yellow-600" title="Partially Paid" />;
        } else {
            return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" title="Unpaid" />;
        }
    };

    const getPaymentStatusText = (status: PaymentStatus) => {
        if (status.isPaid) {
            return 'Paid';
        } else if (status.groupBalance > 0) {
            return `${status.groupBalance.toFixed(2)} DZD / ${(status.groupBalance + status.remainingAmount).toFixed(2)} DZD`;
        } else {
            return `${status.remainingAmount.toFixed(2)} DZD`;
        }
    };

    const getAttendanceClasses = (status: AttendanceStatus): string => {
        const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors text-sm font-medium';

        switch (status) {
            case 'present':
                return `${baseClasses} bg-green-500 text-white hover:bg-green-600`;
            case 'absent':
                return `${baseClasses} bg-red-500 text-white hover:bg-red-600`;
            case 'justified':
                return `${baseClasses} bg-blue-500 text-white hover:bg-blue-600`;
            case 'change':
                return `${baseClasses} bg-yellow-500 text-white hover:bg-yellow-600`;
            case 'stop':
                return `${baseClasses} bg-gray-500 text-white hover:bg-gray-600`;
            case 'new':
                return `${baseClasses} bg-purple-500 text-white hover:bg-purple-600`;
            case 'too_late':
                return `${baseClasses} bg-orange-500 text-white hover:bg-orange-600`;
            default:
                return `${baseClasses} bg-gray-300 text-gray-600 hover:bg-gray-400`;
        }
    };

    const getAttendanceDisplayLetter = (status: AttendanceStatus): string => {
        switch (status) {
            case 'present': return 'P';
            case 'absent': return 'A';
            case 'justified': return 'J';
            case 'change': return 'C';
            case 'stop': return 'S';
            case 'new': return 'N';
            case 'too_late': return 'L';
            default: return '-';
        }
    };

    const getNextStatus = (currentStatus: AttendanceStatus): AttendanceStatus => {
        const statusOrder: AttendanceStatus[] = ['default', 'present', 'absent', 'justified', 'change', 'stop', 'new', 'too_late'];
        const currentIndex = statusOrder.indexOf(currentStatus);
        const nextIndex = (currentIndex + 1) % statusOrder.length;
        return statusOrder[nextIndex];
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Loading Attendance Data...</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Attendance & Payment Status</CardTitle>
                            <CardDescription>
                                Group: {group.name} • {students.length} students • {sessions.length} sessions
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setBulkEditMode(!bulkEditMode)}
                                className={bulkEditMode ? 'bg-blue-100 border-blue-300' : ''}
                            >
                                {bulkEditMode ? 'Exit Bulk Edit' : 'Bulk Edit'}
                            </Button>
                            {bulkEditMode && (
                                <Button
                                    onClick={() => {
                                        const updates = Object.entries(bulkUpdates).map(([key, status]) => {
                                            const [sessionId, studentId] = key.split('-');
                                            return { sessionId, studentId, status };
                                        });
                                        onBulkUpdate(updates);
                                        setBulkUpdates({});
                                        setBulkEditMode(false);
                                    }}
                                    disabled={Object.keys(bulkUpdates).length === 0}
                                >
                                    Apply Changes
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Student
                                    </th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Payment Status
                                    </th>
                                    {sessions.map((session) => (
                                        <th key={session.id} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {new Date(session.date).toLocaleDateString()}
                                        </th>
                                    ))}
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {students.map((student) => {
                                    const paymentStatus = paymentStatuses.find(ps => ps.studentId === student.id);

                                    return (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                                                        <UserIcon className="h-4 w-4 text-orange-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {student.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {student.custom_id || student.id.substring(0, 8)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-3 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    {paymentStatus && getPaymentStatusIcon(paymentStatus)}
                                                    <div className="text-sm text-gray-900">
                                                        {paymentStatus ? getPaymentStatusText(paymentStatus) : 'Loading...'}
                                                    </div>
                                                </div>
                                            </td>

                                            {sessions.map((session) => {
                                                const currentStatus = getAttendanceStatus(session.id, student.id);
                                                const isFutureSession = new Date(session.date) > new Date();

                                                return (
                                                    <td key={session.id} className="px-3 py-4 whitespace-nowrap">
                                                        {bulkEditMode ? (
                                                            <select
                                                                value={bulkUpdates[`${session.id}-${student.id}`] || currentStatus}
                                                                onChange={(e) => {
                                                                    const newStatus = e.target.value as AttendanceStatus;
                                                                    setBulkUpdates(prev => ({
                                                                        ...prev,
                                                                        [`${session.id}-${student.id}`]: newStatus
                                                                    }));
                                                                }}
                                                                className="block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                            >
                                                                <option value="default">-</option>
                                                                <option value="present">Present</option>
                                                                <option value="absent">Absent</option>
                                                                <option value="justified">Justified</option>
                                                                <option value="change">Change</option>
                                                                <option value="stop">Stop</option>
                                                                <option value="new">New</option>
                                                                <option value="too_late">Too Late</option>
                                                            </select>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    if (isFutureSession) {
                                                                        const nextStatus = getNextStatus(currentStatus);
                                                                        handleAttendanceChange(session.id, student.id, nextStatus);
                                                                    }
                                                                }}
                                                                className={getAttendanceClasses(currentStatus)}
                                                                disabled={!isFutureSession}
                                                                title={isFutureSession ? 'Click to change status' : 'Past session - cannot change'}
                                                            >
                                                                {getAttendanceDisplayLetter(currentStatus)}
                                                            </button>
                                                        )}
                                                    </td>
                                                );
                                            })}

                                            <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedStudent(student);
                                                            setStopAttendanceModal(true);
                                                        }}
                                                        className="text-red-600 hover:text-red-900 hover:bg-red-100"
                                                        title="Stop attendance for this student"
                                                    >
                                                        <StopIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            // Show student payment details
                                                            console.log('Show payment details for:', student.name);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-900 hover:bg-blue-100"
                                                        title="View payment details"
                                                    >
                                                        <CurrencyDollarIcon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Legend */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Attendance Status Legend</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-medium">P</div>
                                <span>Present</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-medium">A</div>
                                <span>Absent</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">J</div>
                                <span>Justified</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-medium">C</div>
                                <span>Change</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-medium">S</div>
                                <span>Stop</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">N</div>
                                <span>New</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-medium">L</div>
                                <span>Too Late</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium">-</div>
                                <span>Default</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stop Attendance Modal */}
            <Modal
                isOpen={stopAttendanceModal}
                onClose={() => {
                    setStopAttendanceModal(false);
                    setSelectedStudent(null);
                    setStopReason('');
                }}
                title="Stop Student Attendance"
            >
                <div className="space-y-4">
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-center space-x-2">
                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                            <span className="text-sm text-yellow-800">
                                This will stop the student's attendance for all future sessions in this group.
                            </span>
                        </div>
                    </div>

                    {selectedStudent && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Student Information</h4>
                            <div className="text-sm text-gray-700">
                                <p><strong>Name:</strong> {selectedStudent.name}</p>
                                <p><strong>ID:</strong> {selectedStudent.custom_id || selectedStudent.id}</p>
                                <p><strong>Group:</strong> {group.name}</p>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for Stopping Attendance *
                        </label>
                        <textarea
                            value={stopReason}
                            onChange={(e) => setStopReason(e.target.value)}
                            placeholder="Enter the reason why this student is stopping attendance..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            required
                        />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• All future sessions will be marked as "Stop"</li>
                            <li>• Student status for this group will become "inactive"</li>
                            <li>• If group was fully paid, refund will be calculated for remaining sessions</li>
                            <li>• If group was not fully paid, only attended sessions will be charged</li>
                        </ul>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setStopAttendanceModal(false);
                                setSelectedStudent(null);
                                setStopReason('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleStopAttendance}
                            disabled={!stopReason.trim()}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Stop Attendance
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
