'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { AdminProfile } from '../../types';
import { adminService } from '../../lib/admin-service';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Navigation from '../../components/Navigation';
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
    ClockIcon,
    DocumentTextIcon,
    PrinterIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';

// Reports Section Component
function ReportsSection() {
    const [reportsData, setReportsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showReports, setShowReports] = useState(false);

    const fetchReportsData = async () => {
        console.log(`🚀 FORCE REFRESH: Starting fetchReportsData - ${new Date().toISOString()}`);
        setLoading(true);

        // Clear any cached data first
        setReportsData([]);
        setShowReports(false);

        try {
            // Fetch all groups with basic info
            const { data: groups, error: groupsError } = await supabase
                .from('groups')
                .select(`
                    id,
                    name,
                    language,
                    level,
                    category,
                    price,
                    teacher_id,
                    total_sessions,
                    teachers!inner(name)
                `);

            if (groupsError) throw groupsError;

            if (!groups || groups.length === 0) {
                setReportsData([]);
                setShowReports(true);
                return;
            }

            // Fetch student_groups relationships for all groups
            const { data: studentGroups, error: studentGroupsError } = await supabase
                .from('student_groups')
                .select(`
                    student_id,
                    group_id,
                    group_discount,
                    students!inner(
                        id,
                        name,
                        custom_id,
                        default_discount
                    )
                `)
                .in('group_id', groups.map(g => g.id));

            if (studentGroupsError) throw studentGroupsError;

            // Fetch sessions for all groups
            const { data: sessions, error: sessionsError } = await supabase
                .from('sessions')
                .select(`
                    id,
                    date,
                    group_id
                `)
                .in('group_id', groups.map(g => g.id));

            if (sessionsError) throw sessionsError;

            // Skip attendance fetching for now - use sessions count as proxy
            let attendance: any[] = []; // Empty for now

            // Fetch payments for all groups
            const { data: payments, error: paymentsError } = await supabase
                .from('payments')
                .select(`
                    id,
                    student_id,
                    group_id,
                    amount,
                    payment_type,
                    notes
                `)
                .in('group_id', groups.map(g => g.id));

            if (paymentsError) throw paymentsError;

            // Debug logging after all variables are declared
            console.log(`🔧 VARIABLE SCOPE FIXED: Groups found: ${groups?.length || 0}, Sessions: ${sessions?.length || 0}, StudentGroups: ${studentGroups?.length || 0}, Payments: ${payments?.length || 0} - ${new Date().toISOString()}`);

            // Process the data
            const processedData = groups.map(group => {
                const groupStudentGroups = studentGroups?.filter(sg => sg.group_id === group.id) || [];
                const groupSessions = sessions?.filter(s => s.group_id === group.id) || [];
                const groupAttendance = attendance?.filter(a =>
                    groupSessions.some(s => s.id === a.session_id)
                ) || [];

                // Count students
                const totalStudents = groupStudentGroups.length;

                // Count active vs stopped students from student_groups status
                const activeStudents = groupStudentGroups.filter(sg => (sg as any).status !== 'stopped').length;
                const stoppedStudents = groupStudentGroups.filter(sg => (sg as any).status === 'stopped').length;

                // Count sessions taught (sessions with actual attendance records)
                const sessionsTaught = groupSessions.filter(session => {
                    const sessionAttendance = groupAttendance.filter(att => att.session_id === session.id);
                    console.log(`🔍 Group ${group.id} Session ${session.id}: ${sessionAttendance.length} attendance records`);
                    if (sessionAttendance.length > 0) {
                        console.log(`📊 Sample attendance record:`, sessionAttendance[0]);
                    }
                    // A session is considered taught if at least one student has non-default attendance
                    const hasNonDefaultAttendance = sessionAttendance.some(att => att.status !== 'default');
                    console.log(`✅ Session ${session.id} has non-default attendance: ${hasNonDefaultAttendance}`);
                    return hasNonDefaultAttendance;
                }).length;

                console.log(`📈 Group ${group.id} (${group.name}): ${sessionsTaught} sessions taught out of ${groupSessions.length} total sessions`);

                // Debug: Show all unique status values in attendance data
                const allStatuses = groupAttendance.map(att => att.status);
                const uniqueStatuses = [...new Set(allStatuses)];
                console.log(`🔍 Group ${group.id} unique attendance statuses:`, uniqueStatuses);

                // Count paid students using the same logic as group details page
                const groupPayments = payments?.filter(p => p.group_id === group.id) || [];
                const paidStudents = groupStudentGroups.filter(sg => {
                    const studentPayments = groupPayments.filter(p => p.student_id === sg.student_id);
                    const actualPayments = studentPayments.filter(p =>
                        p.amount > 0 &&
                        p.notes &&
                        p.notes.trim() !== '' &&
                        p.notes !== 'Registration fee'
                    );
                    const totalPaid = actualPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
                    const groupPrice = Number(group.price || 0);
                    return groupPrice > 0 && totalPaid >= groupPrice;
                }).length;

                const unpaidStudents = Math.max(0, activeStudents - paidStudents);

                // Count students with 100% discount (free) - check both group_discount and default_discount
                const freeStudents = groupStudentGroups.filter(sg =>
                    (sg as any).group_discount === 100 || (sg as any).students?.default_discount === 100
                ).length;

                // Revenue = group fee × number of paid students
                const totalRevenue = (group.price || 0) * paidStudents;

                return {
                    gid: group.id,
                    name: group.name,
                    language: group.language || 'Unknown',
                    level: group.level || 'Unknown',
                    category: group.category || 'Unknown',
                    teacher: (group.teachers as any)?.name || 'Unknown',
                    totalStudents,
                    activeStudents,
                    stoppedStudents,
                    sessionsTaught,
                    totalSessions: group.total_sessions || groupSessions.length,
                    paidStudents,
                    unpaidStudents,
                    freeStudents,
                    totalRevenue,
                    price: group.price || 0
                };
            });

            console.log(`🔍 DEBUG: Processed data:`, processedData);
            console.log(`🔍 DEBUG: Processed data length: ${processedData.length}`);

            // Debug: Log the first group's data to see what we're working with
            if (processedData.length > 0) {
                console.log(`🔍 DEBUG: First group data:`, processedData[0]);
            }

            setReportsData(processedData);
            setShowReports(true);
        } catch (error) {
            console.error('Error fetching reports data:', error);
            alert('Failed to fetch reports data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const printReport = () => {
        console.log('🖨️ PRINT: Starting print process...');
        console.log('🖨️ PRINT: reportsData.length =', reportsData.length);
        console.log('🖨️ PRINT: showReports =', showReports);

        // Force a small delay to ensure DOM is ready
        setTimeout(() => {
            window.print();
        }, 100);
    };

    const calculateTotals = () => {
        if (reportsData.length === 0) return null;

        return {
            totalGroups: reportsData.length,
            totalStudents: reportsData.reduce((sum, g) => sum + g.totalStudents, 0),
            totalActiveStudents: reportsData.reduce((sum, g) => sum + g.activeStudents, 0),
            totalStoppedStudents: reportsData.reduce((sum, g) => sum + g.stoppedStudents, 0),
            totalSessionsTaught: reportsData.reduce((sum, g) => sum + g.sessionsTaught, 0),
            totalPaidStudents: reportsData.reduce((sum, g) => sum + g.paidStudents, 0),
            totalUnpaidStudents: reportsData.reduce((sum, g) => sum + g.unpaidStudents, 0),
            totalFreeStudents: reportsData.reduce((sum, g) => sum + g.freeStudents, 0),
            totalRevenue: reportsData.reduce((sum, g) => sum + g.totalRevenue, 0)
        };
    };

    const totals = calculateTotals();

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <DocumentTextIcon className="h-6 w-6 text-orange-600" />
                    Group Reports
                </h2>
                <div className="flex gap-2">
                    <Button
                        onClick={fetchReportsData}
                        disabled={loading}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {loading ? 'Loading...' : 'Generate Reports'}
                    </Button>
                    {showReports && (
                        <Button
                            onClick={printReport}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <PrinterIcon className="h-4 w-4" />
                            Print Report
                        </Button>
                    )}
                </div>
            </div>

            {/* Debug info */}
            <div className="mb-4 p-2 bg-yellow-100 text-xs">
                <p>Debug: showReports = {showReports.toString()}, reportsData.length = {reportsData.length}</p>
            </div>

            {showReports && reportsData.length > 0 && (
                <div className="overflow-x-auto reports-section">
                    {/* Print Header */}
                    <div className="print-header print:hidden">
                        <h3 className="text-lg font-bold text-gray-900">Group Reports Summary</h3>
                        <p className="text-sm text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
                    </div>

                    {/* Print-only title */}
                    <div className="hidden print:block print-title">
                        <h1>Group Reports Summary</h1>
                        <p>Generated on {new Date().toLocaleDateString()}</p>
                    </div>

                    <table className="min-w-full divide-y divide-gray-200 reports-table print:border-collapse print:border print:border-black" style={{ display: 'table' }}>
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GID</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group Name</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Students</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Active Students</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stopped Students</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions Taught</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sessions</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Students</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Unpaid Students</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Free Students (100% Discount)</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {reportsData.map((group) => (
                                <tr key={group.gid} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                        #{group.gid.toString().padStart(6, '0')}
                                    </td>
                                    <td className="px-3 py-2 text-sm text-gray-900">{group.name}</td>
                                    <td className="px-3 py-2 text-sm text-gray-900">{group.language}</td>
                                    <td className="px-3 py-2 text-sm text-gray-900">{group.level}</td>
                                    <td className="px-3 py-2 text-sm text-gray-900">{group.category}</td>
                                    <td className="px-3 py-2 text-sm text-gray-900">{group.teacher}</td>
                                    <td className="px-3 py-2 text-center text-sm text-gray-900">{group.totalStudents}</td>
                                    <td className="px-3 py-2 text-center text-sm text-gray-900">{group.activeStudents}</td>
                                    <td className="px-3 py-2 text-center text-sm text-gray-900">{group.stoppedStudents}</td>
                                    <td className="px-3 py-2 text-center text-sm text-gray-900">{group.sessionsTaught}</td>
                                    <td className="px-3 py-2 text-center text-sm text-gray-900">{group.totalSessions}</td>
                                    <td className="px-3 py-2 text-center text-sm text-green-600 font-medium">{group.paidStudents}</td>
                                    <td className="px-3 py-2 text-center text-sm text-red-600 font-medium">{group.unpaidStudents}</td>
                                    <td className="px-3 py-2 text-center text-sm text-blue-600 font-medium">{group.freeStudents}</td>
                                    <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                                        {group.totalRevenue.toFixed(2)} DZD
                                    </td>
                                </tr>
                            ))}
                            {/* Totals Row */}
                            {totals && (
                                <tr className="bg-gray-100 font-bold">
                                    <td className="px-3 py-2 text-sm text-gray-900" colSpan={6}>
                                        TOTALS
                                    </td>
                                    <td className="px-3 py-2 text-center text-sm text-gray-900">{totals.totalStudents}</td>
                                    <td className="px-3 py-2 text-center text-sm text-gray-900">{totals.totalActiveStudents}</td>
                                    <td className="px-3 py-2 text-center text-sm text-gray-900">{totals.totalStoppedStudents}</td>
                                    <td className="px-3 py-2 text-center text-sm text-gray-900">{totals.totalSessionsTaught}</td>
                                    <td className="px-3 py-2 text-center text-sm text-gray-900">-</td>
                                    <td className="px-3 py-2 text-center text-sm text-green-600">{totals.totalPaidStudents}</td>
                                    <td className="px-3 py-2 text-center text-sm text-red-600">{totals.totalUnpaidStudents}</td>
                                    <td className="px-3 py-2 text-center text-sm text-blue-600">{totals.totalFreeStudents}</td>
                                    <td className="px-3 py-2 text-right text-sm text-gray-900">
                                        {totals.totalRevenue.toFixed(2)} DZD
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showReports && reportsData.length === 0 && (
                <div className="text-center py-8">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Found</h3>
                    <p className="text-gray-500">No groups or data found. Check console for debugging information.</p>
                    <div className="mt-4 p-4 bg-gray-100 rounded">
                        <p className="text-sm text-gray-600">Debug Info:</p>
                        <p className="text-xs text-gray-500">showReports: {showReports.toString()}</p>
                        <p className="text-xs text-gray-500">reportsData.length: {reportsData.length}</p>
                    </div>
                </div>
            )}

            {!showReports && (
                <div className="text-center py-8">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Group Reports</h3>
                    <p className="text-gray-500">Click "Generate Reports" to view comprehensive statistics for all active groups.</p>
                </div>
            )}
        </Card>
    );
}

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
                                                {request.requested_amount.toFixed(2)} DZD
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
                                    <p className="text-lg font-bold text-green-600">{selectedRequest.requested_amount.toFixed(2)} DZD</p>
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
    const { user, isSuperuser, isSuperAdmin } = useAuth();
    const router = useRouter();
    const [admins, setAdmins] = useState<AdminProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedAdmin, setSelectedAdmin] = useState<AdminProfile | null>(null);

    // Create Admin state
    const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
    const [createAdminLoading, setCreateAdminLoading] = useState(false);
    const [newAdmin, setNewAdmin] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
    });
    const [newAdminPermissions, setNewAdminPermissions] = useState<string[]>([]);

    const ALL_PERMISSIONS = [
        { key: 'students.view', label: 'View Students', group: 'Students' },
        { key: 'students.create', label: 'Create Students', group: 'Students' },
        { key: 'students.edit', label: 'Edit Students', group: 'Students' },
        { key: 'students.delete', label: 'Delete Students', group: 'Students' },
        { key: 'groups.view', label: 'View Groups', group: 'Groups' },
        { key: 'groups.create', label: 'Create Groups', group: 'Groups' },
        { key: 'groups.edit', label: 'Edit Groups', group: 'Groups' },
        { key: 'groups.delete', label: 'Delete Groups', group: 'Groups' },
        { key: 'attendance.view', label: 'View Attendance', group: 'Attendance' },
        { key: 'attendance.edit', label: 'Edit Attendance', group: 'Attendance' },
        { key: 'payments.view', label: 'View Payments', group: 'Payments' },
        { key: 'payments.create', label: 'Create Payments', group: 'Payments' },
        { key: 'payments.edit', label: 'Edit Payments', group: 'Payments' },
        { key: 'payments.delete', label: 'Delete Payments', group: 'Payments' },
        { key: 'teachers.view', label: 'View Teachers', group: 'Teachers' },
        { key: 'teachers.create', label: 'Create Teachers', group: 'Teachers' },
        { key: 'teachers.edit', label: 'Edit Teachers', group: 'Teachers' },
        { key: 'teachers.delete', label: 'Delete Teachers', group: 'Teachers' },
        { key: 'salary.manage', label: 'Manage Salary', group: 'Salary' },
        { key: 'waiting_list.manage', label: 'Manage Waiting List', group: 'Waiting List' },
        { key: 'call_logs.manage', label: 'Manage Call Logs', group: 'Call Logs' },
    ];

    const permissionGroups = ALL_PERMISSIONS.reduce((acc, p) => {
        if (!acc[p.group]) acc[p.group] = [];
        acc[p.group].push(p);
        return acc;
    }, {} as Record<string, typeof ALL_PERMISSIONS>);

    useEffect(() => {
        if (!isSuperuser && !isSuperAdmin) {
            router.push('/');
            return;
        }
        fetchAdmins();
    }, [isSuperuser, isSuperAdmin, router]);

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

    const handleToggleAdminStatus = async (admin: AdminProfile) => {
        const action = admin.is_active ? 'deactivate' : 'activate';
        if (!confirm(`Are you sure you want to ${action} ${admin.name}?`)) return;

        try {
            await adminService.updateStatus(admin.id, !admin.is_active);
            fetchAdmins();
            alert(`Admin ${action}d successfully`);
        } catch (error) {
            console.error(`Error ${action} admin:`, error);
            alert(`Error: Could not ${action} admin`);
        }
    };



    const handleSelectAllPermissions = () => {
        if (newAdminPermissions.length === ALL_PERMISSIONS.length) {
            setNewAdminPermissions([]);
        } else {
            setNewAdminPermissions(ALL_PERMISSIONS.map(p => p.key));
        }
    };

    const handleTogglePermission = (key: string) => {
        setNewAdminPermissions(prev =>
            prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
        );
    };

    const handleCreateAdmin = async () => {
        if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
            alert('Name, email, and password are required.');
            return;
        }
        if (newAdmin.password.length < 12) {
            alert('Password must be at least 12 characters.');
            return;
        }
        if (newAdminPermissions.length === 0) {
            alert('Please select at least one permission.');
            return;
        }

        setCreateAdminLoading(true);
        try {
            const result = await adminService.createAdmin({
                name: newAdmin.name,
                email: newAdmin.email,
                password: newAdmin.password,
                phone: newAdmin.phone || undefined,
                role: 'ADMIN',
                permissions: newAdminPermissions,
            });

            if (result.success) {
                alert(`✅ ${result.message}`);
                setShowCreateAdminModal(false);
                setNewAdmin({ name: '', email: '', phone: '', password: '' });
                setNewAdminPermissions([]);
                fetchAdmins();
            } else {
                alert(`❌ Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error creating admin:', error);
            alert('Failed to create admin.');
        } finally {
            setCreateAdminLoading(false);
        }
    };

    if (!isSuperuser && !isSuperAdmin) {
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
        <div className="min-h-screen bg-gray-50">
            <Navigation />
            <div className="lg:ml-16 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <ShieldCheckIcon className="h-8 w-8 text-orange-600" />
                                    Super Admin Dashboard
                                </h1>
                                <p className="text-gray-600 mt-1">Manage admin accounts, permissions, and system settings</p>
                            </div>
                        </div>
                    </div>

                    {/* Admin Accounts Board */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <UserIcon className="h-6 w-6 text-orange-600" />
                                Admin Accounts
                            </h2>
                            <Button
                                onClick={() => setShowCreateAdminModal(true)}
                                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
                            >
                                <span className="text-lg leading-none">+</span>
                                Create Admin
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Admin
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
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
                                                {admin.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${admin.role === 'SUPER_ADMIN'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${admin.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {admin.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    {admin.id !== user?.id && admin.role !== 'SUPER_ADMIN' && (
                                                        <>

                                                            <button
                                                                onClick={() => handleToggleAdminStatus(admin)}
                                                                className={admin.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                                                                title={admin.is_active ? 'Deactivate Admin' : 'Activate Admin'}
                                                            >
                                                                {admin.is_active ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>



                    {/* Reports Section */}
                    <div className="mt-6">
                        <ReportsSection />
                    </div>

                    {/* Refund Requests Section */}
                    <div className="mt-6">
                        <RefundRequestsSection />
                    </div>
                </div>



                {/* Create Admin Modal */}
                <Modal
                    isOpen={showCreateAdminModal}
                    onClose={() => setShowCreateAdminModal(false)}
                    title="Create New Admin"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                            <Input
                                value={newAdmin.name}
                                onChange={(e) => setNewAdmin(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g. Dalila Mostefaoui"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <Input
                                type="email"
                                value={newAdmin.email}
                                onChange={(e) => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="e.g. dalila@myschool.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <Input
                                value={newAdmin.phone}
                                onChange={(e) => setNewAdmin(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="Optional"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password * (min 12 characters)</label>
                            <Input
                                type="password"
                                value={newAdmin.password}
                                onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                                placeholder="Secure password"
                            />
                        </div>

                        {/* Permissions */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">Permissions *</label>
                                <button
                                    type="button"
                                    onClick={handleSelectAllPermissions}
                                    className="text-xs text-orange-600 hover:text-orange-800 font-medium"
                                >
                                    {newAdminPermissions.length === ALL_PERMISSIONS.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3 space-y-3">
                                {Object.entries(permissionGroups).map(([groupName, perms]) => (
                                    <div key={groupName}>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{groupName}</p>
                                        <div className="grid grid-cols-2 gap-1">
                                            {perms.map(p => (
                                                <label key={p.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={newAdminPermissions.includes(p.key)}
                                                        onChange={() => handleTogglePermission(p.key)}
                                                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                    />
                                                    {p.label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {newAdminPermissions.length} of {ALL_PERMISSIONS.length} permissions selected
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setShowCreateAdminModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateAdmin}
                            className="bg-orange-600 hover:bg-orange-700"
                            disabled={createAdminLoading}
                        >
                            {createAdminLoading ? 'Creating...' : 'Create Admin'}
                        </Button>
                    </div>
                </Modal>
            </div>
        </div>
    );
} 