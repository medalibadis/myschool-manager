'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '../../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useMySchoolStore } from '../../store';
import AuthGuard from '../../components/AuthGuard';
import { supabase } from '../../lib/supabase';

import {
    CreditCardIcon,
    PlusIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    UserIcon,
    CalendarIcon,
    CalculatorIcon,
    ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

interface StudentWithGroups {
    id: string;
    custom_id?: string; // ST0001, ST0002, etc.
    name: string;
    email: string;
    phone: string;
    groups: Array<{
        id: number;
        name: string;
        price: number;
        amountPaid: number;
        remainingAmount: number;
    }>;
    totalBalance: number;
    totalPaid: number;
    remainingBalance: number;
    availableCredit?: number; // Total unallocated credit
    defaultDiscount: number;
}

export default function PaymentsPage() {
    const {
        groups,
        payments,
        addPayment,
        deletePayment,
        fetchGroups,
        fetchPayments,
        getStudentBalance,
        getRecentPayments,
        getRefundList,
        getDebtsList,
        processRefund,
        // processDebtPayment, - REMOVED
        loading,
        error,
        depositAndAllocate,
        undoPaymentAllocation,
    } = useMySchoolStore();

    const { isSuperuser } = useAuth();

    const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<StudentWithGroups[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<StudentWithGroups | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        discount: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
    });
    const [recentPayments, setRecentPayments] = useState<Array<any>>([]);
    const [receiptsList, setReceiptsList] = useState<Array<any>>([]);
    const [receiptsFilter, setReceiptsFilter] = useState('');
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
    const [allocationResult, setAllocationResult] = useState<{
        depositId: string;
        allocations: Array<{
            groupId: number;
            groupName: string;
            amountAllocated: number;
            wasFullyPaid: boolean;
            remainingAfterPayment: number;
            receipt?: string;
            paymentId?: string;
            notes?: string;
        }>;
        totalPaid: number;
        remainingCredit: number;
        receipts: string[];
    } | null>(null);
    const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
    const [unpaidGroups, setUnpaidGroups] = useState<Array<{
        id: number;
        name: string;
        remaining: number;
        originalPrice: number;
        discount: number;
        isRegistrationFee: boolean;
        startDate?: string | null
    }>>([]);

    // New state for click-to-pay system
    const [selectedGroupForPayment, setSelectedGroupForPayment] = useState<{
        id: number;
        name: string;
        remaining: number;
        originalPrice: number;
        currentDiscount: number;
        isRegistrationFee: boolean;
    } | null>(null);
    const [showGroupPaymentModal, setShowGroupPaymentModal] = useState(false);
    const [groupPaymentData, setGroupPaymentData] = useState({
        amount: '',
        discount: '',
        notes: ''
    });
    const [isSavingGroupDiscount, setIsSavingGroupDiscount] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [isProcessingRefund, setIsProcessingRefund] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historySearchTerm, setHistorySearchTerm] = useState('');
    const [historySelectedStudent, setHistorySelectedStudent] = useState<{ id: string; name: string; custom_id?: string } | null>(null);
    const [isStudentHistoryOpen, setIsStudentHistoryOpen] = useState(false);
    const [isRefreshingStudentData, setIsRefreshingStudentData] = useState(false);

    // Refund and Debts state
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

    // Attendance Adjustment History state
    const [attendanceAdjustments, setAttendanceAdjustments] = useState<Array<any>>([]);
    const [isAttendanceHistoryModalOpen, setIsAttendanceHistoryModalOpen] = useState(false);
    const [selectedStudentForAttendance, setSelectedStudentForAttendance] = useState<{ id: string; name: string; custom_id?: string } | null>(null);
    const [isDebtsModalOpen, setIsDebtsModalOpen] = useState(false);
    const [debtsSearchTerm, setDebtsSearchTerm] = useState('');
    const [refundsSearchTerm, setRefundsSearchTerm] = useState('');
    const [refundList, setRefundList] = useState<Array<{
        studentId: string;
        studentName: string;
        customId?: string;
        balance: number;
        groups: Array<{ id: number; name: string; status: string; stopReason?: string }>;
        isApprovedRequest?: boolean;
        requestId?: string;
        approvedAt?: string;
        approvedBy?: string;
        superadminNotes?: string;
        adminReason?: string;
    }>>([]);
    const [debtsList, setDebtsList] = useState<Array<{
        studentId: string;
        studentName: string;
        customId?: string;
        balance: number;
        groups: Array<{ id: number; name: string; status: string }>;
    }>>([]);

    const [selectedRefundStudent, setSelectedRefundStudent] = useState<{
        studentId: string;
        studentName: string;
        customId?: string;
        balance: number;
        groups: Array<{ id: number; name: string; status: string; stopReason?: string }>;
        isApprovedRequest?: boolean;
        requestId?: string;
        approvedAt?: string;
        approvedBy?: string;
        superadminNotes?: string;
        adminReason?: string;
    } | null>(null);
    const [refundData, setRefundData] = useState({
        amount: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
    });

    // Fetch data on component mount
    useEffect(() => {
        const initializeData = async () => {
            try {
                // Load basic data first
                await fetchGroups();
                await fetchPayments();

                // Then load dependent data with individual error handling
                try {
                    await loadRecentPayments();
                } catch (error) {
                    console.error('Error loading recent payments:', error);
                }

                try {
                    await loadReceipts();
                } catch (error) {
                    console.error('Error loading receipts:', error);
                }

                try {
                    await loadRefundList();
                } catch (error) {
                    console.error('Error loading refund list:', error);
                }

                try {
                    await loadDebtsList();
                } catch (error) {
                    console.error('Error loading debts list:', error);
                }
            } catch (error) {
                console.error('Error initializing basic payment data:', error);
            }
        };

        initializeData();
    }, [fetchGroups, fetchPayments]);

    // Recompute unpaid groups for selected student (ordered oldest first)
    useEffect(() => {
        if (selectedStudent) {
            // Use the proper refresh function that has the correct logic
            // Make it non-blocking by not awaiting it
            refreshSelectedStudentData().catch(error => {
                console.error('Error refreshing student data:', error);
            });
        } else {
            setUnpaidGroups([]);
        }
    }, [selectedStudent?.id]); // ✅ FIX: Only depend on student ID to prevent infinite loop

    const loadRecentPayments = async () => {
        try {
            const recent = await getRecentPayments(50);
            setRecentPayments(recent);
        } catch (error) {
            console.error('Error loading recent payments:', error);
        }
    };

    // Load receipts from database
    const loadReceipts = async () => {
        try {
            console.log('🔍 Checking if receipts table exists...');

            // First, try to check if the table exists by doing a simple select
            const { data: receipts, error } = await supabase
                .from('receipts')
                .select('id')
                .limit(1);

            if (error) {
                if (error.message.includes('does not exist')) {
                    console.log('❌ Receipts table does not exist yet!');
                    console.log('💡 This table will be created automatically when you make your first payment.');
                    setReceiptsList([]);
                } else {
                    console.error('❌ Error checking receipts table:', error);
                    setReceiptsList([]);
                }
            } else {
                // Table exists, now load actual receipts
                const { data: allReceipts, error: loadError } = await supabase
                    .from('receipts')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (loadError) {
                    console.error('❌ Error loading receipts:', loadError);
                    setReceiptsList([]);
                } else {
                    setReceiptsList(allReceipts || []);
                    console.log(`✅ Loaded ${allReceipts?.length || 0} receipts from database`);
                }
            }
        } catch (error) {
            console.error('❌ Error in loadReceipts:', error);
            setReceiptsList([]);
        }
    };

    const loadApprovedRefundRequests = async () => {
        try {
            const { data: approvedRequests, error } = await supabase
                .from('refund_requests')
                .select('*')
                .eq('status', 'approved'); // Only get approved (not processed) requests

            if (error) throw error;

            // Convert approved requests to refund list format
            return (approvedRequests || []).map(request => ({
                studentId: request.student_id,
                studentName: request.student_name,
                customId: request.student_custom_id,
                balance: request.requested_amount,
                groups: request.stopped_groups || [],
                requestId: request.id,
                approvedAt: request.approved_at,
                approvedBy: request.approved_by,
                superadminNotes: request.superadmin_notes,
                adminReason: request.reason
            }));
        } catch (error) {
            console.error('Error loading approved refund requests:', error);
            return [];
        }
    };

    const loadRefundList = async () => {
        try {
            console.log('🔄 Loading refund list...');

            // Load both eligible students and approved refund requests
            const [refunds, approvedRequests] = await Promise.all([
                getRefundList(),
                loadApprovedRefundRequests()
            ]);

            // Combine both lists, ensuring no duplicates by student ID
            const approvedStudentIds = new Set(approvedRequests.map(r => r.studentId));
            const filteredRefunds = refunds.filter(r => !approvedStudentIds.has(r.studentId));

            console.log(`✅ Refund list loaded: ${filteredRefunds.length} eligible students, ${approvedRequests.length} approved requests (${refunds.length - filteredRefunds.length} students filtered out due to pending approval)`);

            const combinedList = [
                ...filteredRefunds.map(r => ({ ...r, isApprovedRequest: false })),
                ...approvedRequests.map(r => ({ ...r, isApprovedRequest: true }))
            ];

            setRefundList(combinedList);
        } catch (error) {
            console.error('❌ Error loading refund list:', error);
            // Show more informative error message
            let errorMessage = 'Unknown error occurred';
            if (error instanceof Error) {
                if (error.message.includes('does not exist')) {
                    errorMessage = 'Database schema is missing required tables or columns. Please run the database migrations first.';
                } else if (error.message.includes('Cannot read properties of undefined')) {
                    errorMessage = 'Student data is incomplete. Please check the database for missing student information.';
                } else if (error.message.includes('Invalid student ID')) {
                    errorMessage = 'Database contains invalid student records. Please check the students table.';
                } else {
                    errorMessage = error.message;
                }
            }
            alert(`Error loading refund list: ${errorMessage}`);
            // Set empty list to prevent further errors
            setRefundList([]);
        }
    };

    const loadDebtsList = async () => {
        try {
            console.log('🔄 Loading debts list...');
            const debts = await getDebtsList();
            console.log(`✅ Debts list loaded: ${debts.length} students with debts`);
            setDebtsList(debts);
        } catch (error) {
            console.error('❌ Error loading debts list:', error);
            // Show more informative error message
            let errorMessage = 'Unknown error occurred';
            if (error instanceof Error) {
                if (error.message.includes('does not exist')) {
                    errorMessage = 'Database schema is missing required tables or columns. Please run the database migrations first.';
                } else if (error.message.includes('Cannot read properties of undefined')) {
                    errorMessage = 'Student data is incomplete. Please check the database for missing student information.';
                } else if (error.message.includes('Invalid student ID')) {
                    errorMessage = 'Database contains invalid student records. Please check the students table.';
                } else {
                    errorMessage = error.message;
                }
            }
            alert(`Error loading debts list: ${errorMessage}`);
            // Set empty list to prevent further errors
            setDebtsList([]);
        }
    };

    const loadAttendanceAdjustmentHistory = async (studentId: string) => {
        try {
            // Temporarily disabled - method not available in simplified service
            setAttendanceAdjustments([]);
            console.log('📊 Attendance adjustments: feature temporarily disabled');
        } catch (error) {
            console.error('Error loading attendance adjustment history:', error);
            setAttendanceAdjustments([]);
        }
    };

    // Function to refresh selected student data (balance and unpaid groups)
    const refreshSelectedStudentData = async () => {
        if (!selectedStudent) return;

        console.log('Refreshing data for student:', selectedStudent.id, selectedStudent.name);

        try {
            // Refresh student balance using store method (includes retrospective logic for stopped students)
            const balance = await getStudentBalance(selectedStudent.id);

            console.log('Balance calculation result:', {
                totalBalance: balance.totalBalance,
                totalPaid: balance.totalPaid,
                remainingBalance: balance.remainingBalance,
                groupBalancesCount: balance.groupBalances.length
            });

            // Update selectedStudent with new balance
            setSelectedStudent(prev => prev ? {
                ...prev,
                remainingBalance: balance.remainingBalance,
                availableCredit: (balance as any).availableCredit || 0
            } : null);

            // Update unpaid groups with proper priority ordering
            console.log('Processing groupBalances:', balance.groupBalances);

            // 🚨 DEBUG: Show all group balances before filtering
            console.log('🚨 DEBUG: All group balances before filtering:');
            balance.groupBalances.forEach((gb, index) => {
                console.log(`  ${index + 1}. ${gb.groupName} (ID: ${gb.groupId}): Fee=${gb.groupFees}, Paid=${gb.amountPaid}, Remaining=${gb.remainingAmount}, isRegistrationFee=${gb.isRegistrationFee}`);
            });

            const list = balance.groupBalances
                .filter(gb => {
                    // 🚨 DEBUG: Show filtering decision for each group
                    // Add small tolerance for floating-point precision issues
                    const tolerance = 0.01; // 1 cent tolerance
                    const shouldInclude = gb.remainingAmount > tolerance;
                    console.log(`🚨 DEBUG: Group ${gb.groupName} (ID: ${gb.groupId}): remainingAmount=${gb.remainingAmount}, shouldInclude=${shouldInclude}`);
                    return shouldInclude;
                })
                .sort((a, b) => {
                    // Priority 1: Registration fee (groupId 0) always first
                    if (a.groupId === 0) return -1;
                    if (b.groupId === 0) return 1;

                    // Priority 2: Groups by start date (oldest first) - for now just use group ID
                    return a.groupId - b.groupId;
                })
                .map(gb => ({
                    id: gb.groupId,
                    name: gb.groupName,
                    remaining: gb.remainingAmount,
                    originalPrice: gb.groupFees,
                    discount: gb.discount || 0,
                    isRegistrationFee: gb.isRegistrationFee || false,
                    startDate: undefined // We don't have start date in our current calculation
                }));

            console.log('Unpaid groups list:', list);

            setUnpaidGroups(list);

            console.log('Selected student data refreshed:', {
                balance: balance.remainingBalance,
                unpaidGroups: list.length
            });
        } catch (error) {
            console.error('Error refreshing selected student data:', error);
        }
    };



    // Function to generate receipt for payment
    const generateReceipt = (studentName: string, paymentAmount: number, paymentType: string, groupName?: string, remainingAmount?: number, extraAmount?: number) => {
        const date = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const time = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        let receiptText = `=== PAYMENT RECEIPT ===\n`;
        receiptText += `Date: ${date} at ${time}\n`;
        receiptText += `Student: ${studentName}\n`;
        receiptText += `Payment Type: ${paymentType}\n`;
        receiptText += `Amount Paid: ${paymentAmount.toFixed(2)} DZD\n`;

        if (groupName) {
            receiptText += `For: ${groupName}\n`;
        }

        // Special handling for debt reduction payments
        if (paymentType === 'debt_reduction') {
            receiptText += `Purpose: Debt Reduction Payment\n`;
            receiptText += `This payment reduces your overall debt balance.\n`;
        }

        if (remainingAmount && remainingAmount > 0) {
            receiptText += `Remaining Amount: ${remainingAmount.toFixed(2)} DZD\n`;
        }

        if (extraAmount && extraAmount > 0) {
            receiptText += `Extra Credit: ${extraAmount.toFixed(2)} DZD\n`;
        }

        receiptText += `\nThank you for your payment!\n`;
        receiptText += `========================`;

        return receiptText;
    };



    // Helper function to check if search term matches first letters of names
    const matchesFirstLetters = (searchTerm: string, fullName: string) => {
        if (!searchTerm || !fullName) return false;

        const searchLower = searchTerm.toLowerCase().trim();
        const nameLower = fullName.toLowerCase();

        // Split name by spaces
        const nameWords = nameLower.split(/\s+/);

        // If search term is empty, return true
        if (searchLower === '') return true;

        // Check if search term matches the beginning of any word in the name
        if (nameWords.some(word => word.startsWith(searchLower))) {
            return true;
        }

        // Check if search term matches first letters of multiple name words
        // e.g., "ma" should match "mohammed ali" (m + a)
        if (searchLower.length <= nameWords.length) {
            for (let i = 0; i < searchLower.length && i < nameWords.length; i++) {
                if (!nameWords[i].startsWith(searchLower[i])) {
                    return false;
                }
            }
            return true;
        }

        return false;
    };

    // Search for students with debouncing
    const handleSearchStudents = async (searchValue: string) => {
        setSearchTerm(searchValue);

        if (!searchValue.trim()) {
            setSearchResults([]);
            return;
        }

        // Clear any existing timeout
        if ((window as any).searchTimeout) {
            clearTimeout((window as any).searchTimeout);
        }

        // Set a new timeout for debouncing
        (window as any).searchTimeout = setTimeout(async () => {
            try {
                // Validate that groups data exists
                if (!groups || !Array.isArray(groups)) {
                    console.error('Groups data is not available');
                    setSearchResults([]);
                    return;
                }

                // Step 1: Create a map to store unique students by ID
                const studentMap = new Map<string, StudentWithGroups>();

                // Step 2: First pass - collect all students that match the search criteria
                for (const group of groups) {
                    if (group.students && Array.isArray(group.students)) {
                        for (const student of group.students) {
                            // Check if student matches search criteria
                            const searchLower = searchValue.toLowerCase().trim();
                            const nameLower = student.name.toLowerCase();
                            const emailLower = student.email?.toLowerCase() || '';
                            const phoneLower = student.phone?.toLowerCase() || '';
                            const studentIdLower = student.id.toLowerCase();
                            const customIdLower = student.custom_id?.toLowerCase() || '';

                            const matchesSearch =
                                // Search by custom ID (exact match or partial)
                                customIdLower.includes(searchLower) ||
                                // Search by student ID (exact match or partial)
                                studentIdLower.includes(searchLower) ||
                                // Search by name (starts with, contains, or first letters)
                                nameLower.startsWith(searchLower) ||
                                nameLower.includes(searchLower) ||
                                matchesFirstLetters(searchValue, student.name) ||
                                // Search by email
                                emailLower.includes(searchLower) ||
                                // Search by phone
                                phoneLower.includes(searchLower);

                            if (matchesSearch) {
                                // If student not in map, add them
                                if (!studentMap.has(student.id)) {
                                    studentMap.set(student.id, {
                                        id: student.id,
                                        custom_id: student.custom_id,
                                        name: student.name,
                                        email: student.email || '',
                                        phone: student.phone || '',
                                        groups: [],
                                        totalBalance: 0,
                                        totalPaid: 0,
                                        remainingBalance: 0, // Will be calculated below
                                        defaultDiscount: student.defaultDiscount || 0,
                                    });
                                }
                            }
                        }
                    }
                }

                // Step 3: Second pass - add all groups for each matched student
                console.log('Processing groups for search results:', groups.length);
                for (const group of groups) {
                    if (group.students && Array.isArray(group.students)) {
                        console.log(`Group ${group.name} has ${group.students.length} students`);
                        for (const student of group.students) {
                            const existingStudent = studentMap.get(student.id);
                            if (existingStudent) {
                                // Check if this group is already added to this student
                                const groupExists = existingStudent.groups.some(g => g.id === group.id);
                                if (!groupExists) {
                                    existingStudent.groups.push({
                                        id: group.id,
                                        name: group.name,
                                        price: group.price || 0,
                                        amountPaid: 0,
                                        remainingAmount: 0,
                                    });
                                    console.log(`Added group ${group.name} (${group.price}) to student ${existingStudent.name}`);
                                }
                            }
                        }
                    }
                }

                // Step 4: Convert to array and show results immediately
                const studentsArray = Array.from(studentMap.values());

                // Sort students by name for better UX
                studentsArray.sort((a, b) => a.name.localeCompare(b.name));

                setSearchResults(studentsArray);

                // Step 5: Calculate balances in the background (non-blocking)
                setTimeout(async () => {
                    const updatedStudents = [...studentsArray];
                    for (const student of updatedStudents) {
                        try {
                            // Add null check for student.id
                            if (!student || !student.id) {
                                console.error('Invalid student data in search results:', student);
                                continue;
                            }

                            // Calculate student balance using store method (includes retrospective logic)
                            const balance = await getStudentBalance(student.id);
                            student.totalBalance = balance.totalBalance;
                            student.totalPaid = balance.totalPaid;
                            student.remainingBalance = balance.remainingBalance;

                            // Update group balances with unpaid amounts
                            student.groups = student.groups.map(group => {
                                const groupBalance = balance.groupBalances.find(gb => gb.groupId === group.id);
                                if (groupBalance) {
                                    group.amountPaid = groupBalance.amountPaid;
                                    group.remainingAmount = groupBalance.remainingAmount;
                                } else {
                                    // If no balance record exists, assume the full group price is unpaid
                                    group.amountPaid = 0;
                                    group.remainingAmount = group.price || 0;
                                }
                                return group;
                            });
                        } catch (error) {
                            console.error(`Error calculating balance for student ${student?.id || 'Unknown'}:`, error);
                        }
                    }

                    // Update results with calculated balances
                    setSearchResults(updatedStudents);
                }, 0);
            } catch (error) {
                console.error('Error searching students:', error);
                setSearchResults([]);
            }
        }, 300); // 300ms debounce delay
    };

    // Handle student selection
    const handleStudentSelect = (student: StudentWithGroups) => {
        if (!student || !student.id) {
            console.error('Invalid student data:', student);
            alert('Invalid student data. Please try again.');
            return;
        }

        setSelectedStudent(student);
        // Don't automatically open payment modal - let user decide
        // setIsAddPaymentModalOpen(true);
        setHistorySelectedStudent(null);
    };

    // Handle group selection for payment
    const handleGroupSelect = (groupId: number) => {
        setSelectedGroup(groupId);
        const group = selectedStudent?.groups.find(g => g.id === groupId);
        if (group) {
            const defaultDiscount = selectedStudent?.defaultDiscount || 0;
            const originalAmount = group.remainingAmount;
            const discountedAmount = originalAmount * (1 - defaultDiscount / 100);

            setPaymentData(prev => ({
                ...prev,
                amount: discountedAmount.toFixed(2),
                discount: defaultDiscount.toString(),
            }));
        }
    };

    // Handle discount change with auto-calculation
    const handleDiscountChange = (discountValue: string) => {
        const discountPercentage = parseFloat(discountValue) || 0;
        const group = selectedStudent?.groups.find(g => g.id === selectedGroup);

        if (group && discountPercentage >= 0 && discountPercentage < 100) {
            // The discount should be applied to the NEW PRICE (amount paid), not the remaining amount
            // So we need to calculate what the student should pay based on the discount
            const originalAmount = group.remainingAmount;
            const discountedAmount = originalAmount * (1 - discountPercentage / 100);

            setPaymentData(prev => ({
                ...prev,
                discount: discountValue,
                amount: discountedAmount.toFixed(2),
            }));
        } else {
            setPaymentData(prev => ({
                ...prev,
                discount: discountValue,
            }));
        }
    };

    // Function to save group-specific discount as new price
    const handleGroupPayment = async () => {
        if (!selectedGroupForPayment || !selectedStudent) return;

        // Prevent double-clicking
        if (isSavingGroupDiscount) {
            console.log('Group payment already in progress, ignoring click');
            return;
        }

        try {
            setIsSavingGroupDiscount(true);
            const originalAmount = parseFloat(groupPaymentData.amount);
            const discountPercentage = parseFloat(groupPaymentData.discount || '0');
            const discountAmount = originalAmount * (discountPercentage / 100);
            const newPrice = originalAmount - discountAmount;

            console.log('🎯 Setting new group price:');
            console.log(`   Group: ${selectedGroupForPayment.name}`);
            console.log(`   Original amount: ${originalAmount}`);
            console.log(`   Discount: ${discountPercentage}%`);
            console.log(`   New price: ${newPrice}`);

            // Update the group discount in student_groups table
            const { error } = await supabase
                .from('student_groups')
                .update({
                    group_discount: discountPercentage > 0 ? discountPercentage : null
                })
                .eq('student_id', selectedStudent.id)
                .eq('group_id', selectedGroupForPayment.id);

            if (error) {
                console.error('❌ Error updating group discount:', error);
                alert('Failed to save discount. Please try again.');
                return;
            }

            console.log('✅ Group discount saved successfully');

            // Close modal and refresh data
            setShowGroupPaymentModal(false);
            setSelectedGroupForPayment(null);
            setGroupPaymentData({ amount: '', discount: '', notes: '' });

            // Refresh student data
            await refreshSelectedStudentData();

        } catch (error) {
            console.error('❌ Error saving group discount:', error);
            alert('Failed to save discount. Please try again.');
        } finally {
            setIsSavingGroupDiscount(false);
        }
    };

    // Handle adding payment
    const handleAddPayment = async () => {
        if (!selectedStudent || !paymentData.amount) {
            alert('Please select a student and enter an amount');
            return;
        }

        // Prevent double-clicking
        if (isProcessingPayment) {
            console.log('Payment already in progress, ignoring click');
            return;
        }

        try {
            setIsProcessingPayment(true);
            const depositAmount = Math.abs(parseFloat(paymentData.amount || '0'));

            console.log('Processing payment:', {
                studentId: selectedStudent.id,
                depositAmount,
                date: paymentData.date,
                notes: paymentData.notes,
                selectedGroupForPayment: selectedGroupForPayment
            });

            // Check if a specific group was selected for payment
            if (selectedGroupForPayment && selectedGroupForPayment.id !== 0) {
                // Direct payment to the selected group
                console.log(`💰 Creating direct payment to group: ${selectedGroupForPayment.name} (ID: ${selectedGroupForPayment.id})`);

                const { data: paymentRecord, error: paymentError } = await supabase
                    .from('payments')
                    .insert({
                        student_id: selectedStudent.id,
                        group_id: selectedGroupForPayment.id,
                        amount: depositAmount,
                        date: paymentData.date,
                        notes: paymentData.notes || `Payment for ${selectedGroupForPayment.name}`,
                        admin_name: 'Dalila',
                        payment_type: 'group_payment'
                    })
                    .select()
                    .single();

                if (paymentError) {
                    throw new Error(`Failed to create payment: ${paymentError.message}`);
                }

                console.log('✅ Direct payment created:', paymentRecord);

                // Create a simple allocation result
                const formattedResult = {
                    depositId: paymentRecord.id,
                    allocations: [{
                        groupId: selectedGroupForPayment.id,
                        groupName: selectedGroupForPayment.name,
                        amountAllocated: depositAmount,
                        wasFullyPaid: depositAmount >= selectedGroupForPayment.remaining,
                        remainingAfterPayment: Math.max(0, selectedGroupForPayment.remaining - depositAmount),
                        paymentId: paymentRecord.id,
                        notes: `Payment for ${selectedGroupForPayment.name}`
                    }],
                    totalPaid: depositAmount,
                    remainingCredit: 0,
                    receipts: []
                };

                // Clear the selected group
                setSelectedGroupForPayment(null);

                // Refresh and show results
                const updatedBalance = await getStudentBalance(selectedStudent.id);
                setSelectedStudent(prev => prev ? {
                    ...prev,
                    remainingBalance: updatedBalance.remainingBalance
                } : null);

                await refreshSelectedStudentData();
                setPaymentData({
                    amount: '',
                    discount: '',
                    notes: '',
                    date: new Date().toISOString().split('T')[0],
                });

                await loadRecentPayments();
                await loadReceipts();
                await fetchPayments();

                setAllocationResult(formattedResult);
                setIsAllocationModalOpen(true);

                console.log('✅ Direct payment process completed successfully!');
                return;
            }

            // Use the backend service to properly allocate payments and reduce debt
            console.log('🔍 Student ID format check:', {
                studentId: selectedStudent.id,
                studentIdType: typeof selectedStudent.id,
                studentIdLength: selectedStudent.id?.length
            });

            // Call the backend service to properly allocate payments and reduce debt
            const result = await depositAndAllocate(
                selectedStudent.id,
                depositAmount,
                new Date(paymentData.date),
                paymentData.notes || '',
                0, // No discount for main deposit
                depositAmount
            );

            // Convert backend result to expected format
            const formattedResult = {
                depositId: result.depositId || `deposit_${Date.now()}`,
                allocations: result.allocations || [],
                totalPaid: depositAmount,
                remainingCredit: 0,
                receipts: []
            };

            console.log('Payment allocation result from backend:', result);

            // Use the result from the backend service
            console.log('Using result from backend service:', result);

            // Refresh student data to show updated balance and unpaid groups
            console.log('💾 Refreshing student data after payment...');
            // Use the centralized service method instead of local calculation
            const updatedBalance = await getStudentBalance(selectedStudent.id);
            console.log('Updated balance after payment:', updatedBalance);

            // Update selected student with new balance
            setSelectedStudent(prev => prev ? {
                ...prev,
                remainingBalance: updatedBalance.remainingBalance
            } : null);

            // Update unpaid groups to remove paid groups
            await refreshSelectedStudentData();

            // Reset form but keep the student selected to see the changes
            setPaymentData({
                amount: '',
                discount: '',
                notes: '',
                date: new Date().toISOString().split('T')[0],
            });

            // Refresh data
            await loadRecentPayments();
            await loadReceipts();
            await fetchPayments();

            // Show allocation summary with receipts
            setAllocationResult(formattedResult);
            setIsAllocationModalOpen(true);

            console.log('✅ Payment process completed successfully!');
        } catch (error) {
            console.error('Error adding payment:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw error;
        } finally {
            setIsProcessingPayment(false);
        }
    };

    // Handle payment deletion
    const handleDeletePayment = async (paymentId: string) => {
        if (confirm('Are you sure you want to delete this payment?')) {
            try {
                await deletePayment(paymentId);
                await loadRecentPayments();
                alert('Payment deleted successfully!');
            } catch (error) {
                console.error('Error deleting payment:', error);
                alert('Failed to delete payment. Please try again.');
            }
        }
    };

    // Handle sending refund request to superadmin
    const handleSendRefundRequest = async () => {
        if (!selectedRefundStudent || !refundData.amount) {
            alert('Please select a student and enter an amount');
            return;
        }

        // Prevent double-clicking
        if (isProcessingRefund) {
            console.log('Refund already in progress, ignoring click');
            return;
        }

        try {
            setIsProcessingRefund(true);
            console.log(`📤 Sending refund request for ${selectedRefundStudent.studentName}: ${refundData.amount} DZD`);

            // Create refund request record
            console.log('📤 Attempting to insert refund request:', {
                student_id: selectedRefundStudent.studentId,
                student_name: selectedRefundStudent.studentName,
                requested_amount: parseFloat(refundData.amount)
            });

            const { data: insertData, error: requestError } = await supabase
                .from('refund_requests')
                .insert({
                    student_id: selectedRefundStudent.studentId,
                    student_name: selectedRefundStudent.studentName,
                    student_custom_id: selectedRefundStudent.customId || null,
                    requested_amount: parseFloat(refundData.amount),
                    reason: refundData.notes || 'Refund request for stopped student',
                    stopped_groups: selectedRefundStudent.groups || [],
                    admin_name: 'Dalila', // Using consistent admin name from your system
                    status: 'pending'
                })
                .select();

            if (requestError) {
                throw requestError;
            }

            // Close modal and reset form
            setIsRefundModalOpen(false);
            setSelectedRefundStudent(null);
            setRefundData({
                amount: '',
                notes: '',
                date: new Date().toISOString().split('T')[0],
            });

            // Show success message
            alert(`✅ Refund request of ${refundData.amount} DZD sent to superadmin for approval!\n\nThe superadmin will review this request and approve or reject it. Once approved, you can process the refund in the payments page.`);

            // Refresh the refund list to remove this student (since request is now pending)
            await loadRefundList();

        } catch (error) {
            console.error('❌ Error sending refund request:', error);
            alert('Failed to send refund request. Please try again.');
        } finally {
            setIsProcessingRefund(false);
        }
    };

    // Handle processing approved refund
    const handleProcessApprovedRefund = async () => {
        if (!selectedRefundStudent || !refundData.amount) {
            alert('Please select a student and enter an amount');
            return;
        }

        // Prevent double-clicking
        if (isProcessingRefund) {
            console.log('Refund already in progress, ignoring click');
            return;
        }

        try {
            setIsProcessingRefund(true);
            console.log(`💰 Processing approved refund for ${selectedRefundStudent.studentName}: ${refundData.amount} DZD`);
            const refundAmount = parseFloat(refundData.amount);

            // Step 1: Create a refund payment record (reduces student's credit balance)
            const refundNotes = `REFUND - Superadmin approved refund - ${refundData.notes || selectedRefundStudent.adminReason || 'Student stopped in all groups'}`;

            console.log('📝 Creating refund payment:', {
                student_id: selectedRefundStudent.studentId,
                amount: -refundAmount, // Negative = money going out (refund)
                date: refundData.date,
                notes: refundNotes
            });

            const { data: paymentData, error: paymentError } = await supabase
                .from('payments')
                .insert({
                    student_id: selectedRefundStudent.studentId,
                    group_id: null, // No specific group for refunds
                    amount: -refundAmount, // NEGATIVE amount = refund (reduces student's balance)
                    date: refundData.date,
                    notes: refundNotes,
                    admin_name: 'Dalila',
                    payment_type: 'balance_addition' // Use balance_addition with negative amount for refunds
                })
                .select();

            if (paymentError) {
                throw new Error(`Failed to create refund payment: ${paymentError.message}`);
            }

            console.log('✅ Refund payment created:', paymentData);

            // Step 2: Generate receipt for the refund
            const receiptText = `REFUND RECEIPT
Student: ${selectedRefundStudent.studentName}
${selectedRefundStudent.customId ? `Student ID: ${selectedRefundStudent.customId}` : ''}
Refund Amount: ${refundAmount.toFixed(2)} DZD
Date: ${new Date(refundData.date).toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}
Reason: ${selectedRefundStudent.adminReason || 'Student stopped in all groups'}
Approved by: ${selectedRefundStudent.approvedBy || 'Superadmin'}
${selectedRefundStudent.superadminNotes ? `Notes: ${selectedRefundStudent.superadminNotes}` : ''}
Status: REFUND PROCESSED
Thank you!`;

            console.log('📄 Creating refund receipt...');
            const { data: receiptData, error: receiptError } = await supabase
                .from('receipts')
                .insert({
                    student_id: selectedRefundStudent.studentId,
                    student_name: selectedRefundStudent.studentName,
                    receipt_text: receiptText,
                    amount: refundAmount,
                    payment_type: 'refund',
                    group_name: 'Refund',
                    created_at: new Date().toISOString()
                })
                .select();

            if (receiptError) {
                console.warn('⚠️ Could not create receipt:', receiptError);
                // Continue anyway, the payment was processed
            } else {
                console.log('✅ Refund receipt generated successfully:', receiptData);
            }

            // Step 3: Mark the refund request as processed in the database
            if (selectedRefundStudent.requestId) {
                const { error: updateError } = await supabase
                    .from('refund_requests')
                    .update({
                        status: 'processed',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', selectedRefundStudent.requestId);

                if (updateError) {
                    console.error('Warning: Failed to update request status:', updateError);
                    // Continue anyway since the refund was processed
                }
            }

            // Close modal and reset form
            setIsRefundModalOpen(false);
            setSelectedRefundStudent(null);
            setRefundData({
                amount: '',
                notes: '',
                date: new Date().toISOString().split('T')[0],
            });

            // Add a small delay to ensure the refund is processed
            await new Promise(resolve => setTimeout(resolve, 500));

            // Check the student's balance after refund
            console.log('🔍 Checking student balance after refund...');
            try {
                const updatedBalance = await getStudentBalance(selectedRefundStudent.studentId);
                console.log('📊 Updated balance after refund:', updatedBalance);
            } catch (balanceError) {
                console.error('Error checking updated balance:', balanceError);
            }

            // Refresh lists to remove student from refund list (balance should now be 0 or negative)
            await loadRefundList();
            await loadRecentPayments();

            // Refresh selected student data if applicable
            if (selectedStudent && selectedStudent.id === selectedRefundStudent.studentId) {
                await refreshSelectedStudentData();
            }

            // Show success message
            alert(`✅ Refund of ${refundAmount.toFixed(2)} DZD processed successfully for ${selectedRefundStudent.studentName}!\n\n📄 Receipt generated\n💰 Student balance updated\n🔄 Student removed from refund list`);

        } catch (error) {
            console.error('❌ Error processing approved refund:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            alert(`Failed to process approved refund: ${errorMessage}. Please try again.`);
        } finally {
            setIsProcessingRefund(false);
        }
    };

    // Refresh debt list after payments
    const refreshDebtsList = async () => {
        try {
            await loadDebtsList();
        } catch (error) {
            console.error('Error refreshing debts list:', error);
        }
    };

    // Refresh debt list when payments change
    useEffect(() => {
        if (recentPayments.length > 0) {
            refreshDebtsList();
        }
    }, [recentPayments]);

    // Handle showing receipt details
    const handleShowReceipt = (payment: any) => {
        setSelectedReceipt(payment);
        setIsReceiptModalOpen(true);
    };

    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50">
                <Navigation />

                <div className="lg:ml-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {error && (
                            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                                <strong>Error:</strong> {error}
                                <button
                                    onClick={() => window.location.reload()}
                                    className="ml-2 text-red-800 underline hover:no-underline"
                                >
                                    Reload Page
                                </button>
                            </div>
                        )}

                        {loading && (
                            <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                                    Loading payment data...
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
                                <p className="mt-2 text-gray-600">
                                    Manage student payments and track financial records
                                </p>
                                <div className="text-sm text-gray-500 mt-1">
                                    Groups loaded: {groups?.length || 0} | Payments loaded: {payments?.length || 0}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button variant="outline" onClick={() => setIsHistoryModalOpen(true)}>
                                    History
                                </Button>
                                <Button variant="outline" onClick={async () => {
                                    try {
                                        await loadRefundList();
                                        setIsRefundModalOpen(true);
                                    } catch (error) {
                                        console.error('Error loading refund list:', error);
                                        alert('Failed to load refund data. Please try again.');
                                    }
                                }}>
                                    Refund
                                </Button>
                                <Button variant="outline" onClick={async () => {
                                    try {
                                        await loadDebtsList();
                                        setIsDebtsModalOpen(true);
                                    } catch (error) {
                                        console.error('Error loading debts list:', error);
                                        alert('Failed to load debts data. Please try again.');
                                    }
                                }}>
                                    Debts
                                </Button>
                                <Button onClick={() => setIsSearchModalOpen(true)}>
                                    <PlusIcon className="h-5 w-5 mr-2" />
                                    Add Payment
                                </Button>

                            </div>
                        </div>

                        {/* Recent Payments Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Receipts</CardTitle>
                                <CardDescription>
                                    Latest payment transactions and receipts
                                </CardDescription>
                                <div className="mt-3">
                                    <Input
                                        value={receiptsFilter}
                                        onChange={(e) => setReceiptsFilter(e.target.value)}
                                        placeholder="Filter receipts by student name..."
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Student
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Payment Type
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Group
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>

                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {receiptsList
                                                .filter(receipt =>
                                                    receipt.student_name?.toLowerCase().includes(receiptsFilter.toLowerCase()) ||
                                                    receipt.group_name?.toLowerCase().includes(receiptsFilter.toLowerCase())
                                                )
                                                .map((receipt) => (
                                                    <tr
                                                        key={receipt.id}
                                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                                        onClick={() => {
                                                            setSelectedReceipt(receipt);
                                                            setIsReceiptModalOpen(true);
                                                        }}
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                                                    <UserIcon className="h-4 w-4 text-green-600" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {receipt.student_name}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {receipt.student_id?.substring(0, 8)}...
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {receipt.payment_type === 'registration_fee' ? '🎓 Registration Fee' :
                                                                    receipt.payment_type === 'group_payment' ? '👥 Group Fee' :
                                                                        receipt.payment_type === 'balance_addition' ? '💰 Balance Credit' :
                                                                            receipt.payment_type === 'balance_credit' ? '✨ Attendance Credit' :
                                                                                receipt.payment_type === 'attendance_credit' ? '📅 Session Adjustment' :
                                                                                    receipt.payment_type === 'debt_reduction' ? '💳 Debt Reduction' :
                                                                                        receipt.payment_type === 'refund' ? '💸 Refund' :
                                                                                            receipt.payment_type}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {receipt.group_name || 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-green-600">
                                                                {receipt.amount?.toFixed(2)} DZD
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {new Date(receipt.created_at).toLocaleDateString()}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {new Date(receipt.created_at).toLocaleTimeString()}
                                                            </div>
                                                        </td>

                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                                {receiptsList.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        <div className="text-4xl mb-4">📄</div>
                                        <p>No receipts generated yet.</p>
                                        <p className="text-sm">Receipts will appear here after payments are made.</p>
                                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-700">
                                                <strong>💡 To test the receipt system:</strong>
                                            </p>
                                            <ul className="text-xs text-blue-600 mt-2 text-left list-disc list-inside">
                                                <li>Add a new student (will have unpaid 500 DZD registration fee)</li>
                                                <li>Add existing student to a new group (will have unpaid group fee)</li>
                                                <li>Make a payment for any unpaid fees</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Automatic Calculations Results */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CalculatorIcon className="h-5 w-5 text-yellow-600" />
                                    Automatic Attendance-Based Calculations
                                </CardTitle>
                                <CardDescription>
                                    Results of automatic payment calculations based on attendance status
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Refresh Button */}
                                <div className="flex justify-center mb-4">
                                    <Button
                                        onClick={async () => {
                                            alert('Comprehensive refresh is temporarily disabled. This feature will be available soon.');
                                            return;

                                            // try {
                                            //     console.log('Starting comprehensive refresh...');
                                            //     const result = await refreshAllStudentsForDebtsAndRefunds();
                                            //     console.log('Refresh result:', result);

                                            //     // Reload the lists
                                            //     await loadRefundList();
                                            //     await loadDebtsList();

                                            //     alert(`Refresh Complete!\n\nProcessed: ${result.processedStudents} students\nRefunds: ${result.refundsCount}\nDebts: ${result.debtsCount}\nErrors: ${result.errors.length}`);
                                            // } catch (error) {
                                            //     console.error('Error during refresh:', error);
                                            //     alert(`Error during refresh: ${error}`);
                                            // }
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                                    >
                                        🔄 Refresh All Students for Debts & Refunds
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Refunds Section */}
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h3 className="text-lg font-semibold text-green-800 mb-3">
                                            Students Eligible for Refunds
                                        </h3>

                                        {/* Search input for refunds */}
                                        <div className="mb-4">
                                            <div className="relative">
                                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search by name or ID..."
                                                    value={refundsSearchTerm}
                                                    onChange={(e) => setRefundsSearchTerm(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {(() => {
                                                const filteredRefunds = refundList.filter(refund =>
                                                    refund.studentName.toLowerCase().includes(refundsSearchTerm.toLowerCase()) ||
                                                    (refund.customId && refund.customId.toLowerCase().includes(refundsSearchTerm.toLowerCase()))
                                                );

                                                return filteredRefunds.length > 0 ? (
                                                    filteredRefunds.map((refund) => (
                                                        <div key={refund.studentId} className="bg-white p-3 rounded border border-green-200">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <div className="font-medium text-green-900">
                                                                        {refund.studentName}
                                                                    </div>
                                                                    <div className="text-sm text-green-700">
                                                                        {refund.customId || 'No ID'}
                                                                    </div>
                                                                    <div className="text-xs text-green-600">
                                                                        Groups: {refund.groups.map((g: { id: number; name: string; status: string }) => g.name).join(', ')}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-lg font-bold text-green-800">
                                                                        {refund.balance.toFixed(2)} DZD
                                                                    </div>
                                                                    <div className="text-xs text-green-600">Refund Amount</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-green-600 text-center py-4">
                                                        {refundsSearchTerm ? `No students found matching "${refundsSearchTerm}"` : 'No students eligible for refunds'}
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    </div>

                                    {/* Debts Section */}
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <h3 className="text-lg font-semibold text-red-800 mb-3">
                                            Students with Outstanding Debts
                                        </h3>

                                        {/* Search input for debts */}
                                        <div className="mb-4">
                                            <div className="relative">
                                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search by name or ID..."
                                                    value={debtsSearchTerm}
                                                    onChange={(e) => setDebtsSearchTerm(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {(() => {
                                                const filteredDebts = debtsList.filter(debt =>
                                                    debt.studentName.toLowerCase().includes(debtsSearchTerm.toLowerCase()) ||
                                                    (debt.customId && debt.customId.toLowerCase().includes(debtsSearchTerm.toLowerCase()))
                                                );

                                                return filteredDebts.length > 0 ? (
                                                    filteredDebts.map((debt) => (
                                                        <div key={debt.studentId} className="bg-white p-3 rounded border border-red-200">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <div className="font-medium text-red-900">
                                                                        {debt.studentName}
                                                                    </div>
                                                                    <div className="text-sm text-red-700">
                                                                        {debt.customId || 'No ID'}
                                                                    </div>
                                                                    <div className="text-xs text-red-600">
                                                                        Groups: {debt.groups.map((g: { id: number; name: string; status: string }) => g.name).join(', ')}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-lg font-bold text-red-800">
                                                                        {debt.balance.toFixed(2)} DZD
                                                                    </div>
                                                                    <div className="text-xs text-red-600">Debt Amount</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-red-600 text-center py-4">
                                                        {debtsSearchTerm ? `No students found matching "${debtsSearchTerm}"` : 'No students with outstanding debts'}
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Search Student Modal */}
                <Modal
                    isOpen={isSearchModalOpen}
                    onClose={() => {
                        setIsSearchModalOpen(false);
                        setSearchTerm('');
                        setSearchResults([]);
                    }}
                    title="Search for Student"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Search for Student *
                            </label>
                            <Input
                                value={searchTerm}
                                onChange={(e) => handleSearchStudents(e.target.value)}
                                placeholder="Search by student ID (ST0001), name, email, or phone number..."
                                className="w-full"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Search for students by ID (ST0001), name, email, or phone number
                            </p>
                        </div>

                        {searchResults.length > 0 && (
                            <div className="max-h-96 overflow-y-auto space-y-2">
                                <div className="text-sm font-medium text-gray-700 mb-2">
                                    Found {searchResults.length} student(s):
                                </div>
                                {searchResults.map((student) => (
                                    <div
                                        key={student.id}
                                        className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
                                    >
                                        <div className="space-y-3">
                                            {/* Student Info */}
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {student.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        ID: {student.custom_id || student.id.substring(0, 4) + '...'} • Groups: {student.groups.length} • Balance:
                                                        <span className={`font-medium ${student.remainingBalance > 0 ? 'text-green-600' : student.remainingBalance < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                                            {student.remainingBalance > 0 ? '+' : ''}{Math.abs(student.remainingBalance).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Student Details */}
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <div>Email: {student.email}</div>
                                                <div>Phone: {student.phone}</div>
                                                <div>Total Paid: {student.totalPaid.toFixed(2)} DA</div>
                                                <div>Default Discount: {student.defaultDiscount}%</div>
                                            </div>

                                            {/* Groups Info */}
                                            {student.groups.length > 0 && (
                                                <div className="text-sm">
                                                    <div className="font-medium text-gray-700 mb-1">Groups:</div>
                                                    <div className="space-y-1">
                                                        {student.groups.map((group) => (
                                                            <div key={group.id} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                                                                <span>{group.name}</span>
                                                                <span className={`font-medium ${group.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                    {group.remainingAmount > 0 ? `-${group.remainingAmount.toFixed(2)}` : `+${Math.abs(group.remainingAmount).toFixed(2)}`}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStudentSelect(student);
                                                        setIsAddPaymentModalOpen(true);
                                                        setIsSearchModalOpen(false);
                                                    }}
                                                    className="flex-1"
                                                >
                                                    <PlusIcon className="h-4 w-4 mr-1" />
                                                    Add Payment
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStudentSelect(student);
                                                    }}
                                                >
                                                    View Details
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {searchTerm.trim() && searchResults.length === 0 && (
                            <div className="text-center py-8">
                                <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                                <p className="text-gray-500">
                                    No students match your search criteria.
                                </p>
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSearchResults([]);
                                    }}
                                    className="mt-2 text-orange-600 hover:text-orange-800 underline"
                                >
                                    Clear search and try again
                                </button>
                            </div>
                        )}

                        {!searchTerm.trim() && (
                            <div className="text-center py-8">
                                <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Search for Students</h3>
                                <p className="text-gray-500">
                                    Enter a student ID, name, email, or phone number to search for students.
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchTerm('');
                                    setSearchResults([]);
                                }}
                            >
                                Clear Search
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsSearchModalOpen(false);
                                    setSearchTerm('');
                                    setSearchResults([]);
                                    setSelectedStudent(null);
                                }}
                            >
                                Close Search
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Add Payment Modal */}
                <Modal
                    isOpen={isAddPaymentModalOpen}
                    onClose={() => {
                        setIsAddPaymentModalOpen(false);
                        // Go back to search modal instead of closing everything
                        setIsSearchModalOpen(true);
                        setSelectedStudent(null);
                        setSelectedGroup(null);
                        setPaymentData({
                            amount: '',
                            discount: '',
                            notes: '',
                            date: new Date().toISOString().split('T')[0],
                        });
                    }}
                    title={`Add Payment - ${selectedStudent?.name || 'Student'}`}
                >
                    {selectedStudent && (
                        <div className="space-y-6">
                            {/* Student Info */}
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-medium text-orange-700">{selectedStudent.name}</h3>
                                        <div className="text-sm text-orange-600">{selectedStudent.email}</div>
                                        <div className="text-sm text-orange-600">{selectedStudent.phone}</div>
                                    </div>
                                    <Button
                                        onClick={refreshSelectedStudentData}
                                        size="sm"
                                        variant="outline"
                                        className="text-xs px-2 py-1"
                                    >
                                        🔄 Refresh
                                    </Button>
                                </div>
                                <div className="text-sm text-gray-700 flex flex-col gap-1">
                                    <div>
                                        <span className="font-medium">Balance:</span>
                                        <span className={`ml-2 font-bold ${selectedStudent.remainingBalance > 0 ? 'text-green-600' : selectedStudent.remainingBalance < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                            {selectedStudent.remainingBalance > 0 ? '+' : selectedStudent.remainingBalance < 0 ? '-' : ''}
                                            {Math.abs(selectedStudent.remainingBalance).toFixed(2)} DZD
                                        </span>
                                    </div>
                                    {selectedStudent.availableCredit !== undefined && selectedStudent.availableCredit > 0 && (
                                        <div className="flex items-center justify-between bg-white p-2 rounded border border-green-100">
                                            <div className="text-green-600 font-medium tracking-tight">
                                                <span className="text-gray-700 font-medium">Available Credit:</span>
                                                <span className="ml-2">+{selectedStudent.availableCredit.toFixed(2)} DZD</span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-xs h-7 px-2 border-green-200 text-green-700 hover:bg-green-100"
                                                onClick={async () => {
                                                    if (confirm(`Apply ${selectedStudent.availableCredit?.toFixed(2)} DZD from available credit to unpaid fees?`)) {
                                                        try {
                                                            const result = await depositAndAllocate(
                                                                selectedStudent.id,
                                                                0,
                                                                new Date(),
                                                                'Allocation from existing credit'
                                                            );
                                                            setAllocationResult(result);
                                                            setIsAllocationModalOpen(true);
                                                            await refreshSelectedStudentData();
                                                        } catch (err) {
                                                            alert('Failed to allocate credit.');
                                                        }
                                                    }
                                                }}
                                            >
                                                ⚡ Use Credit
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                {selectedStudent.defaultDiscount > 0 && (
                                    <div className="text-sm text-blue-700">
                                        <span className="font-medium">Default Discount:</span>
                                        <span className="ml-2 font-bold">{selectedStudent.defaultDiscount}%</span>
                                    </div>
                                )}
                            </div>

                            {/* Unpaid Groups list with priority ordering */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-3">Unpaid Groups - Click to Set Discount</h4>
                                {unpaidGroups.length > 0 ? (
                                    <ul className="space-y-3">
                                        {unpaidGroups.map((g, index) => (
                                            <li
                                                key={g.id}
                                                className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all ${g.id === 0 ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                                                onClick={() => {
                                                    setSelectedGroupForPayment({
                                                        id: g.id,
                                                        name: g.name,
                                                        remaining: g.remaining,
                                                        originalPrice: g.originalPrice,
                                                        currentDiscount: g.discount,
                                                        isRegistrationFee: g.isRegistrationFee
                                                    });
                                                    setGroupPaymentData({
                                                        amount: g.remaining.toString(),
                                                        discount: g.discount.toString(),
                                                        notes: ''
                                                    });
                                                    setShowGroupPaymentModal(true);
                                                }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${g.id === 0 ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
                                                            }`}>
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">
                                                                {g.id === 0 ? 'Registration Fee' : g.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {g.id === 0 ? 'Priority 1 - Always First' : `Priority ${index + 1} - Group #${g.id}`}
                                                            </div>
                                                            {g.discount > 0 && (
                                                                <div className="text-xs text-blue-600 mt-1">
                                                                    💰 Original: {g.originalPrice.toFixed(2)} DZD | Discount: {g.discount}% | Final: {g.remaining.toFixed(2)} DZD
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-red-600">-{g.remaining.toFixed(2)}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {g.id === 0 ? 'Registration Fee' : 'Group Fee'}
                                                        </div>
                                                        {g.discount > 0 && (
                                                            <div className="text-xs text-blue-600">
                                                                ({g.discount}% discount applied)
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center py-6 text-gray-500">
                                        <div className="text-4xl mb-2">✅</div>
                                        <p className="font-medium">All groups are fully paid!</p>
                                        <p className="text-sm">💰 <strong>You can still add extra payments!</strong></p>
                                        <p className="text-xs text-blue-600 mt-2">
                                            Extra amounts will be added to the student's balance as credit (shown in green).
                                        </p>
                                    </div>
                                )}
                                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                                    <strong>How it works:</strong> Click on any group to set a discount. Deposits are allocated from oldest to newest groups using the discounted prices.
                                </div>
                            </div>

                            {/* Deposit Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Deposit Amount *
                                    </label>
                                    <Input
                                        type="number"
                                        value={paymentData.amount}
                                        onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                                        placeholder="Enter amount to deposit"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={paymentData.date}
                                        onChange={(e) => setPaymentData(prev => ({ ...prev, date: e.target.value }))}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        value={paymentData.notes}
                                        onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Enter deposit details..."
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAddPaymentModalOpen(false);
                                // Go back to search modal instead of closing everything
                                setIsSearchModalOpen(true);
                                setSelectedStudent(null);
                                setSelectedGroup(null);
                                setPaymentData({
                                    amount: '',
                                    discount: '',
                                    notes: '',
                                    date: new Date().toISOString().split('T')[0],
                                });
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddPayment}
                            disabled={!selectedStudent || !paymentData.amount || isProcessingPayment}
                        >
                            {isProcessingPayment ? 'Processing...' : 'Deposit & Auto-Allocate'}
                        </Button>
                    </div>
                </Modal>

                {/* Allocation Summary Modal */}
                <Modal
                    isOpen={isAllocationModalOpen}
                    onClose={() => {
                        setIsAllocationModalOpen(false);
                        setAllocationResult(null);
                        // Go directly back to search modal (skip payment modal)
                        setIsAddPaymentModalOpen(false);
                        setIsSearchModalOpen(true);
                        setSelectedStudent(null);
                        setSelectedGroup(null);
                        setPaymentData({
                            amount: '',
                            discount: '',
                            notes: '',
                            date: new Date().toISOString().split('T')[0],
                        });
                    }}
                    title="Allocation Summary"
                >
                    {allocationResult ? (
                        <div className="space-y-4">
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                <p className="text-sm text-orange-700">
                                    Deposit ID: <span className="font-mono">{allocationResult.depositId}</span>
                                </p>
                            </div>
                            {allocationResult.allocations.length > 0 ? (
                                <div className="space-y-4">
                                    <h4 className="font-medium text-gray-900">Payment Allocations</h4>

                                    {/* Allocations Summary */}
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <ul className="space-y-2 text-sm text-gray-800">
                                            {allocationResult.allocations.map((a, index) => (
                                                <li key={index} className="flex justify-between items-center">
                                                    <div>
                                                        <span className="font-medium">
                                                            {a.groupName}
                                                        </span>
                                                        <span className="text-gray-600 ml-2">
                                                            {a.wasFullyPaid ? '✅ Fully Paid' : '💰 Partially Paid'}
                                                        </span>
                                                        {a.paymentId && (
                                                            <span className="text-xs text-blue-600 ml-2">
                                                                (Payment ID: {a.paymentId})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-green-600">
                                                            +{(a.amountAllocated || 0).toFixed(2)} DZD
                                                        </div>
                                                        {a.remainingAfterPayment > 0 && (
                                                            <div className="text-xs text-red-600">
                                                                Remaining: {(a.remainingAfterPayment || 0).toFixed(2)} DZD
                                                            </div>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Receipts Stored Successfully */}
                                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-600">📄</span>
                                            <span className="text-sm text-green-700">
                                                <strong>Receipts Generated & Stored!</strong>
                                            </span>
                                        </div>
                                        <p className="text-xs text-green-600 mt-1">
                                            {allocationResult.receipts?.length || 0} receipts have been stored in the database and are now visible in the Recent Receipts table below.
                                        </p>
                                    </div>

                                    {/* Debt Reduction Information */}
                                    {allocationResult.allocations.some(a => a.notes?.includes('Debt reduction payment')) && (
                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                            <div className="flex items-center gap-2">
                                                <span className="text-blue-600">💳</span>
                                                <span className="text-sm text-blue-700">
                                                    <strong>Debt Reduction Payment:</strong> Successfully processed
                                                </span>
                                            </div>
                                            <p className="text-xs text-blue-600 mt-1">
                                                This payment has reduced the student's overall debt balance.
                                            </p>
                                        </div>
                                    )}

                                    {/* Credit Information */}
                                    {allocationResult.remainingCredit > 0 && (
                                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                            <div className="flex items-center gap-2">
                                                <span className="text-green-600">💰</span>
                                                <span className="text-sm text-green-700">
                                                    <strong>Credit Balance:</strong> {(allocationResult.remainingCredit || 0).toFixed(2)} DZD
                                                </span>
                                            </div>
                                            <p className="text-xs text-green-600 mt-1">
                                                This amount will be applied to future unpaid fees.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-700">No unpaid groups or not enough balance to allocate at this time.</p>
                            )}

                            <div className="flex justify-end gap-3 mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsAllocationModalOpen(false);
                                        setAllocationResult(null);
                                        // Go directly back to search modal (skip payment modal)
                                        setIsAddPaymentModalOpen(false);
                                        setIsSearchModalOpen(true);
                                        setSelectedStudent(null);
                                        setSelectedGroup(null);
                                        setPaymentData({
                                            amount: '',
                                            discount: '',
                                            notes: '',
                                            date: new Date().toISOString().split('T')[0],
                                        });
                                    }}
                                >
                                    Add Another Payment
                                </Button>
                                <Button
                                    onClick={() => {
                                        setIsAllocationModalOpen(false);
                                        setAllocationResult(null);
                                        // Close payment modal completely and go back to search
                                        setIsAddPaymentModalOpen(false);
                                        setIsSearchModalOpen(true);
                                        setSelectedStudent(null);
                                        setSelectedGroup(null);
                                        setPaymentData({
                                            amount: '',
                                            discount: '',
                                            notes: '',
                                            date: new Date().toISOString().split('T')[0],
                                        });
                                    }}
                                >
                                    Close Payment Modal
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </Modal>

                {/* Receipt Modal */}
                <Modal
                    isOpen={isReceiptModalOpen}
                    onClose={() => {
                        setIsReceiptModalOpen(false);
                        setSelectedReceipt(null);
                    }}
                    title={`Receipt - ${selectedReceipt?.student_name || 'Payment'}`}
                >
                    {selectedReceipt && (
                        <div className="space-y-6">
                            {/* Receipt Header */}
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-medium text-orange-700">Payment Receipt</h3>
                                        <p className="text-sm text-orange-600">Receipt #{selectedReceipt.id}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-orange-600">Date: {new Date(selectedReceipt.created_at).toLocaleDateString()}</p>
                                        <p className="text-sm text-orange-600">Time: {new Date(selectedReceipt.created_at).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Student Information */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">Student Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Name</p>
                                        <p className="font-medium text-gray-900">{selectedReceipt.student_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Student ID</p>
                                        <p className="font-medium text-gray-900">{selectedReceipt.student_id}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Details */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">Payment Details</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Payment Type:</span>
                                        <span className="font-medium text-gray-900">
                                            {selectedReceipt.payment_type === 'registration_fee' ? '🎓 Registration Fee' :
                                                selectedReceipt.payment_type === 'group_payment' ? '👥 Group Fee' :
                                                    selectedReceipt.payment_type === 'balance_addition' ? '💰 Balance Credit' :
                                                        selectedReceipt.payment_type === 'balance_credit' ? '✨ Attendance Credit' :
                                                            selectedReceipt.payment_type === 'attendance_credit' ? '📅 Session Adjustment' :
                                                                selectedReceipt.payment_type}
                                        </span>
                                    </div>
                                    {selectedReceipt.group_name && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Group:</span>
                                            <span className="font-medium text-gray-900">
                                                {selectedReceipt.group_name}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Amount:</span>
                                        <span className="font-bold text-lg text-green-600">
                                            {selectedReceipt.amount.toFixed(2)} DZD
                                        </span>
                                    </div>


                                </div>
                            </div>

                            {/* Receipt Text */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">Receipt Details</h4>
                                <div className="bg-white p-3 rounded border font-mono text-sm whitespace-pre-wrap">
                                    {selectedReceipt.receipt_text}
                                </div>
                            </div>

                            {/* Receipt Footer */}
                            <div className="border-t pt-4">
                                <div className="text-center">
                                    <p className="text-sm text-gray-500">
                                        Thank you for your payment!
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Receipt generated on {new Date(selectedReceipt.created_at).toLocaleDateString()} at {new Date(selectedReceipt.created_at).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                        {selectedReceipt && selectedReceipt.group_name && selectedReceipt.group_name !== 'N/A' && selectedReceipt.group_name !== 'Registration Fee' && selectedReceipt.group_name !== 'Balance Credit' && (
                            <Button
                                variant="outline"
                                onClick={async () => {
                                    if (confirm(`⚠️ RETURN PAYMENT\n\nAre you sure you want to return this payment of ${selectedReceipt.amount} DZD to the student balance?\n\nThis will make the course "${selectedReceipt.group_name}" unpaid.`)) {
                                        try {
                                            await undoPaymentAllocation(selectedReceipt.payment_id);
                                            setIsReceiptModalOpen(false);
                                            setSelectedReceipt(null);

                                            // Refresh global data
                                            await fetchPayments();
                                            await fetchGroups();

                                            // 🚨 CRITICAL: Refresh selected student data to update balance and unpaid list
                                            if (selectedStudent) {
                                                await refreshSelectedStudentData();
                                            }

                                            alert('Success: Payment returned to balance.');
                                        } catch (error) {
                                            console.error('Error undoing allocation:', error);
                                            alert('Failed to return payment. Please try again.');
                                        }
                                    }
                                }}
                                className="text-orange-600 border-orange-200 hover:bg-orange-50"
                            >
                                <ArrowUturnLeftIcon className="h-4 w-4 mr-2" />
                                Return
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsReceiptModalOpen(false);
                                setSelectedReceipt(null);
                            }}
                        >
                            Close
                        </Button>
                        <Button
                            onClick={() => {
                                window.print();
                            }}
                        >
                            Print Receipt
                        </Button>
                    </div>
                </Modal>

                {/* History Modal */}
                <Modal
                    isOpen={isHistoryModalOpen}
                    onClose={() => {
                        setIsHistoryModalOpen(false);
                        setHistorySearchTerm('');
                        setHistorySelectedStudent(null);
                    }}
                    title="Payment History"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Search Student</label>
                            <Input
                                value={historySearchTerm}
                                onChange={(e) => setHistorySearchTerm(e.target.value)}
                                placeholder="Search by student name or ID..."
                            />
                        </div>
                        <div className="max-h-48 overflow-y-auto border rounded">
                            {groups.flatMap(g => g.students).filter((s, idx, arr) => {
                                // dedupe by id
                                return arr.findIndex(x => x.id === s.id) === idx;
                            }).filter(s => {
                                const term = historySearchTerm.toLowerCase().trim();
                                if (!term) return true;
                                const nameMatch = s.name.toLowerCase().includes(term);
                                const idMatch = (s.custom_id || '').toLowerCase().includes(term) || s.id.toLowerCase().includes(term);
                                return nameMatch || idMatch;
                            }).slice(0, 50).map(s => (
                                <div
                                    key={s.id}
                                    className={`px-3 py-2 cursor-pointer ${historySelectedStudent?.id === s.id ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                                    onClick={() => {
                                        setHistorySelectedStudent({ id: s.id, name: s.name, custom_id: (s as any).custom_id });
                                        setIsStudentHistoryOpen(true);
                                    }}
                                >
                                    <div className="text-sm text-gray-900">{s.name}</div>
                                    <div className="text-xs text-gray-500">{(s as any).custom_id || s.id.substring(0, 4) + '...'}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end">
                            <Button variant="outline" onClick={() => setIsHistoryModalOpen(false)}>Close</Button>
                        </div>
                    </div>
                </Modal>

                {/* Student History Modal (modern timeline) */}
                <Modal
                    isOpen={isStudentHistoryOpen}
                    onClose={() => {
                        setIsStudentHistoryOpen(false);
                    }}
                    title={`Payment History - ${historySelectedStudent?.name || ''}`}
                    maxWidth="2xl"
                >
                    {historySelectedStudent && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-2">
                                <div>
                                    <div className="text-sm text-gray-600">Student</div>
                                    <div className="text-base font-medium text-gray-900">{historySelectedStudent.name}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-sm text-gray-600">
                                        ID: <span className="font-mono">{historySelectedStudent.custom_id || historySelectedStudent.id.substring(0, 4) + '...'}</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedStudentForAttendance(historySelectedStudent);
                                            loadAttendanceAdjustmentHistory(historySelectedStudent.id);
                                            setIsAttendanceHistoryModalOpen(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-900 hover:bg-blue-100"
                                    >
                                        📊 Attendance Adjustments
                                    </Button>
                                </div>
                            </div>

                            <div className="max-h-96 overflow-y-auto pr-2">
                                <div className="relative">
                                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                                    <ul className="space-y-4">
                                        {payments
                                            .filter(p => p.studentId === historySelectedStudent.id)
                                            .filter(p => (p as any).groupId == null) // 🆕 Only show balance additions (credits)
                                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                            .map((p) => {
                                                return (
                                                    <li key={p.id} className="relative pl-12">
                                                        <span className="absolute left-2 top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white bg-green-500"></span>
                                                        <div className="p-1">
                                                            <div className="flex items-center justify-between">
                                                                <div className="text-xs text-gray-500">{format(new Date(p.date), 'MMM dd, yyyy')}</div>
                                                                <div className="text-sm font-semibold text-green-600">
                                                                    +{p.amount.toFixed(2)}
                                                                </div>
                                                            </div>
                                                            <div className="mt-0.5 text-sm text-gray-700">
                                                                💰 Balance Credit
                                                            </div>
                                                            {p.notes && (
                                                                <div className="mt-0.5 text-xs text-gray-500">{p.notes}</div>
                                                            )}
                                                        </div>
                                                    </li>
                                                );
                                            })}

                                        {/* 🆕 Show message when no balance credits exist */}
                                        {payments
                                            .filter(p => p.studentId === historySelectedStudent.id)
                                            .filter(p => (p as any).groupId == null)
                                            .length === 0 && (
                                                <li className="relative pl-12">
                                                    <span className="absolute left-2 top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white bg-gray-300"></span>
                                                    <div className="p-1">
                                                        <div className="text-sm text-gray-500 italic">
                                                            No balance credits found
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            Balance credits appear when extra payments are made
                                                        </div>
                                                    </div>
                                                </li>
                                            )}
                                    </ul>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button variant="outline" onClick={() => setIsStudentHistoryOpen(false)}>Close</Button>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Refund Modal */}
                <Modal
                    isOpen={isRefundModalOpen}
                    onClose={() => {
                        setIsRefundModalOpen(false);
                        setSelectedRefundStudent(null);
                        setRefundsSearchTerm(''); // Clear search when modal closes
                        setRefundData({
                            amount: '',
                            notes: '',
                            date: new Date().toISOString().split('T')[0],
                        });
                    }}
                    title="Refund Management"
                    maxWidth="2xl"
                >
                    <div className="space-y-6">
                        {/* Refund List */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Students Eligible for Refund</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Students with positive balance who are no longer studying in any active groups
                            </p>

                            {/* Search input for main refunds list */}
                            <div className="mb-4">
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search refunds by name or ID..."
                                        value={refundsSearchTerm}
                                        onChange={(e) => setRefundsSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                            </div>

                            {(() => {
                                const filteredRefunds = refundList.filter(student =>
                                    student.studentName.toLowerCase().includes(refundsSearchTerm.toLowerCase()) ||
                                    (student.customId && student.customId.toLowerCase().includes(refundsSearchTerm.toLowerCase()))
                                );

                                return filteredRefunds.length > 0 ? (
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {filteredRefunds.map((student, index) => (
                                            <div
                                                key={`${student.studentId}-${student.isApprovedRequest ? 'approved' : 'eligible'}-${index}`}
                                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedRefundStudent?.studentId === student.studentId
                                                    ? 'border-orange-500 bg-orange-50'
                                                    : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                                                    }`}
                                                onClick={() => {
                                                    setSelectedRefundStudent(student);
                                                    setRefundData(prev => ({
                                                        ...prev,
                                                        amount: student.balance.toString(),
                                                    }));
                                                }}
                                            >
                                                <div className="space-y-3">
                                                    {/* Student Info Header */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                                                    <UserIcon className="h-5 w-5 text-orange-600" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-gray-900">{student.studentName}</div>
                                                                    <div className="text-sm text-gray-500">
                                                                        ID: {student.customId || student.studentId.substring(0, 8) + '...'}
                                                                    </div>
                                                                    <div className="text-sm font-medium">
                                                                        {student.isApprovedRequest ? (
                                                                            <span className="text-green-600">✅ Approved for refund</span>
                                                                        ) : (
                                                                            <span className="text-red-600">⏹️ Stopped in all groups</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-lg font-bold text-green-600">
                                                                +{student.balance.toFixed(2)} DZD
                                                            </div>
                                                            <div className="text-sm text-gray-500">Available for refund</div>
                                                        </div>
                                                    </div>

                                                    {/* Stopped Groups with Reasons OR Approval Info */}
                                                    <div className="bg-white p-3 rounded border border-gray-100">
                                                        {student.isApprovedRequest ? (
                                                            <>
                                                                <div className="text-sm font-medium text-green-700 mb-2">
                                                                    ✅ Superadmin Approved Refund:
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <div className="text-sm">
                                                                        <div className="font-medium text-gray-900">
                                                                            Approved by: {student.approvedBy}
                                                                        </div>
                                                                        <div className="text-gray-600">
                                                                            Approved on: {student.approvedAt && new Date(student.approvedAt).toLocaleString()}
                                                                        </div>
                                                                        {student.superadminNotes && (
                                                                            <div className="text-gray-600 italic mt-1">
                                                                                Notes: "{student.superadminNotes}"
                                                                            </div>
                                                                        )}
                                                                        {student.adminReason && (
                                                                            <div className="text-gray-600 mt-1">
                                                                                Original reason: "{student.adminReason}"
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="text-sm font-medium text-gray-700 mb-2">
                                                                    Stopped Groups & Reasons:
                                                                </div>
                                                                <div className="space-y-2">
                                                                    {student.groups.map((group, groupIndex) => (
                                                                        <div key={`${group.id}-${groupIndex}-${student.studentId}`} className="flex items-start gap-2 text-sm">
                                                                            <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></div>
                                                                            <div className="flex-1">
                                                                                <div className="font-medium text-gray-900">{group.name}</div>
                                                                                <div className="text-gray-600 italic">
                                                                                    Reason: "{group.stopReason || 'No reason provided'}"
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            {refundsSearchTerm ? `No students found matching "${refundsSearchTerm}"` : 'No refunds available'}
                                        </h3>
                                        <p className="text-gray-500">
                                            {refundsSearchTerm ? 'Try adjusting your search terms.' : 'No students are currently eligible for refunds.'}
                                        </p>
                                    </div>
                                )
                            })()}
                        </div>

                        {/* Refund Form */}
                        {selectedRefundStudent && (
                            <div className={`p-4 rounded-lg border ${selectedRefundStudent.isApprovedRequest ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                                <h3 className={`text-lg font-medium mb-4 ${selectedRefundStudent.isApprovedRequest ? 'text-green-900' : 'text-orange-900'}`}>
                                    {selectedRefundStudent.isApprovedRequest ?
                                        `💰 Process Approved Refund for ${selectedRefundStudent.studentName}` :
                                        `📤 Send Refund Request for ${selectedRefundStudent.studentName}`
                                    }
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Refund Amount *
                                        </label>
                                        <Input
                                            type="number"
                                            value={refundData.amount}
                                            onChange={(e) => setRefundData(prev => ({ ...prev, amount: e.target.value }))}
                                            placeholder="Enter refund amount"
                                            className="w-full"
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            Maximum available: {selectedRefundStudent.balance.toFixed(2)}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Refund Date
                                        </label>
                                        <Input
                                            type="date"
                                            value={refundData.date}
                                            onChange={(e) => setRefundData(prev => ({ ...prev, date: e.target.value }))}
                                            className="w-full"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        value={refundData.notes}
                                        onChange={(e) => setRefundData(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Enter refund reason and details..."
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                                    />
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedRefundStudent(null);
                                            setRefundData({
                                                amount: '',
                                                notes: '',
                                                date: new Date().toISOString().split('T')[0],
                                            });
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={selectedRefundStudent?.isApprovedRequest ? handleProcessApprovedRefund : handleSendRefundRequest}
                                        disabled={!refundData.amount || parseFloat(refundData.amount) <= 0 || isProcessingRefund}
                                        className={selectedRefundStudent?.isApprovedRequest ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}
                                    >
                                        {isProcessingRefund ? 'Processing...' : selectedRefundStudent?.isApprovedRequest ?
                                            "💰 Process Approved Refund" :
                                            "📤 Send Refund Request to Superadmin"
                                        }
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Summary */}
                        {refundList.length > 0 && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <h4 className="font-medium text-blue-900 mb-2">Refund Summary</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-blue-700">Total Students:</span>
                                        <span className="ml-2 font-medium text-blue-900">{refundList.length}</span>
                                    </div>
                                    <div>
                                        <span className="text-blue-700">Total Amount:</span>
                                        <span className="ml-2 font-medium text-blue-900">
                                            +{refundList.reduce((sum, s) => sum + s.balance, 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>

                {/* Debts Modal */}
                <Modal
                    isOpen={isDebtsModalOpen}
                    onClose={() => {
                        setIsDebtsModalOpen(false);
                        setDebtsSearchTerm(''); // Clear search when modal closes
                    }}
                    title="Debts Management"
                    maxWidth="2xl"
                >
                    <div className="space-y-6">
                        {/* Debts List */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Students with Outstanding Debts</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Students with negative balance who are no longer studying in any active groups
                            </p>

                            {/* Search input for main debts list */}
                            <div className="mb-4">
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search debts by name or ID..."
                                        value={debtsSearchTerm}
                                        onChange={(e) => setDebtsSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    />
                                </div>
                            </div>

                            {(() => {
                                const filteredDebts = debtsList.filter(student =>
                                    student.studentName.toLowerCase().includes(debtsSearchTerm.toLowerCase()) ||
                                    (student.customId && student.customId.toLowerCase().includes(debtsSearchTerm.toLowerCase()))
                                );

                                return filteredDebts.length > 0 ? (
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {filteredDebts.map((student) => (
                                            <div
                                                key={student.studentId}
                                                className="p-4 border rounded-lg transition-colors border-gray-200 bg-red-50"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                                                <UserIcon className="h-5 w-5 text-red-600" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900">{student.studentName}</div>
                                                                <div className="text-sm text-gray-500">
                                                                    ID: {student.customId || student.studentId.substring(0, 8) + '...'}
                                                                </div>
                                                                <div className="text-sm text-gray-600">
                                                                    Status: No active group enrollments
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-red-600">
                                                            {student.balance.toFixed(2)}
                                                        </div>
                                                        <div className="text-sm text-gray-500">Outstanding debt</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            {debtsSearchTerm ? `No students found matching "${debtsSearchTerm}"` : 'No debts found'}
                                        </h3>
                                        <p className="text-gray-500">
                                            {debtsSearchTerm ? 'Try adjusting your search terms.' : 'No students currently have outstanding debts.'}
                                        </p>
                                    </div>
                                )
                            })()}
                        </div>

                        {/* Debt Payment Form - REMOVED */}

                        {/* Instructions */}
                        {debtsList.length > 0 && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <div className="flex items-start space-x-3">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-blue-900 mb-2">How to collect debts:</h4>
                                        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                            <li>Go to <strong>Add Payment</strong> page</li>
                                            <li>Search for the student by name</li>
                                            <li>Add a deposit payment for the debt amount</li>
                                            <li>The system will automatically allocate it to unpaid balances</li>
                                            <li>Student will disappear from this list once balance is 0</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Summary */}
                        {debtsList.length > 0 && (
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <h4 className="font-medium text-green-900 mb-2">Debts Summary</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-green-700">Total Students:</span>
                                        <span className="ml-2 font-medium text-green-900">{debtsList.length}</span>
                                    </div>
                                    <div>
                                        <span className="text-green-700">Total Amount:</span>
                                        <span className="ml-2 font-medium text-green-900">
                                            {Math.abs(debtsList.reduce((sum, s) => sum + s.balance, 0)).toFixed(2)} DA
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>

                {/* Attendance Adjustment History Modal */}
                <Modal
                    isOpen={isAttendanceHistoryModalOpen}
                    onClose={() => {
                        setIsAttendanceHistoryModalOpen(false);
                        setSelectedStudentForAttendance(null);
                        setAttendanceAdjustments([]);
                    }}
                    title={`Attendance Adjustments - ${selectedStudentForAttendance?.name || ''}`}
                    maxWidth="2xl"
                >
                    {selectedStudentForAttendance && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                                <div>
                                    <div className="text-sm text-blue-600">Student</div>
                                    <div className="text-base font-medium text-blue-900">{selectedStudentForAttendance.name}</div>
                                </div>
                                <div className="text-sm text-blue-600">
                                    ID: <span className="font-mono">{selectedStudentForAttendance.custom_id || selectedStudentForAttendance.id.substring(0, 4) + '...'}</span>
                                </div>
                            </div>

                            {attendanceAdjustments.length > 0 ? (
                                <div className="max-h-96 overflow-y-auto">
                                    <div className="relative">
                                        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                                        <ul className="space-y-4">
                                            {attendanceAdjustments.map((adjustment, index) => (
                                                <li key={index} className="relative pl-12">
                                                    <span className={`absolute left-2 top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${adjustment.adjustmentType === 'refund' ? 'bg-green-500' : 'bg-blue-500'
                                                        }`}></span>
                                                    <div className="p-1">
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-xs text-gray-500">{adjustment.sessionDate}</div>
                                                            <div className={`text-sm font-semibold ${adjustment.adjustmentType === 'refund' ? 'text-green-600' : 'text-blue-600'
                                                                }`}>
                                                                {adjustment.adjustmentType === 'refund' ? '+' : '-'}{adjustment.sessionAmount.toFixed(2)}
                                                            </div>
                                                        </div>
                                                        <div className="mt-0.5 text-sm text-gray-700">
                                                            {adjustment.adjustmentType === 'refund' ? '💰 Refund' : '💳 Debt Reduction'}
                                                        </div>
                                                        <div className="mt-0.5 text-xs text-gray-500">
                                                            Status: <span className="font-medium">{adjustment.attendanceStatus.toUpperCase()}</span>
                                                        </div>
                                                        {adjustment.notes && (
                                                            <div className="mt-0.5 text-xs text-gray-500">{adjustment.notes}</div>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 text-4xl mb-2">📊</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Adjustments</h3>
                                    <p className="text-gray-500">
                                        This student has no attendance-based payment adjustments yet.
                                    </p>
                                    <p className="text-sm text-gray-400 mt-2">
                                        Adjustments are created automatically when attendance status changes to justify/change/new.
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsAttendanceHistoryModalOpen(false);
                                        setSelectedStudentForAttendance(null);
                                        setAttendanceAdjustments([]);
                                    }}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Group Discount Modal */}
                <Modal
                    isOpen={showGroupPaymentModal}
                    onClose={() => {
                        setShowGroupPaymentModal(false);
                        setSelectedGroupForPayment(null);
                        setGroupPaymentData({ amount: '', discount: '', notes: '' });
                    }}
                    title={`Set Discount for ${selectedGroupForPayment?.name || 'Group'}`}
                    maxWidth="2xl"
                >
                    {selectedGroupForPayment && (
                        <div className="space-y-6">
                            {/* Group Information */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <h3 className="text-sm font-medium text-blue-700 mb-3">Group Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <div className="text-xs font-medium text-blue-700">Group Name</div>
                                        <div className="text-sm text-blue-900">{selectedGroupForPayment.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-blue-700">Original Price</div>
                                        <div className="text-sm text-blue-900">{selectedGroupForPayment.originalPrice.toFixed(2)} DZD</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-blue-700">Remaining Amount</div>
                                        <div className="text-sm text-blue-900 font-medium">{selectedGroupForPayment.remaining.toFixed(2)} DZD</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-blue-700">Current Discount</div>
                                        <div className="text-sm text-blue-900">{selectedGroupForPayment.currentDiscount}%</div>
                                    </div>
                                </div>
                            </div>

                            {/* Discount Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Original Group Fee *
                                    </label>
                                    <Input
                                        type="number"
                                        value={groupPaymentData.amount}
                                        onChange={(e) => setGroupPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                                        placeholder="Enter original group fee"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Discount (%)
                                    </label>
                                    <Input
                                        type="number"
                                        value={groupPaymentData.discount}
                                        onChange={(e) => setGroupPaymentData(prev => ({ ...prev, discount: e.target.value }))}
                                        placeholder="Enter discount percentage (0-100)"
                                        min="0"
                                        max="100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes
                                    </label>
                                    <Input
                                        value={groupPaymentData.notes}
                                        onChange={(e) => setGroupPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Discount notes (optional)"
                                    />
                                </div>

                                {/* Calculated Amount Display */}
                                {groupPaymentData.amount && groupPaymentData.discount && (
                                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                        <div className="text-xs text-green-700 mb-2 font-medium">
                                            💡 New Price Calculation
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Original Fee:</span>
                                            <span className="font-medium">{parseFloat(groupPaymentData.amount || '0').toFixed(2)} DZD</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Discount ({groupPaymentData.discount}%):</span>
                                            <span className="font-medium text-green-600">-{(parseFloat(groupPaymentData.amount || '0') * parseFloat(groupPaymentData.discount || '0') / 100).toFixed(2)} DZD</span>
                                        </div>
                                        <div className="border-t pt-2 mt-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700">New Group Fee:</span>
                                                <span className="font-bold text-lg text-green-600">
                                                    {(parseFloat(groupPaymentData.amount || '0') * (1 - parseFloat(groupPaymentData.discount || '0') / 100)).toFixed(2)} DZD
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowGroupPaymentModal(false);
                                        setSelectedGroupForPayment(null);
                                        setGroupPaymentData({ amount: '', discount: '', notes: '' });
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleGroupPayment}
                                    disabled={!groupPaymentData.amount || isSavingGroupDiscount}
                                >
                                    {isSavingGroupDiscount ? 'Saving...' : 'Save Discount'}
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </AuthGuard>
    );
}