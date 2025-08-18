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
    CreditCardIcon,
    PlusIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    UserIcon,
    CalendarIcon,
    CalculatorIcon,
} from '@heroicons/react/24/outline';
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
        processDebtPayment,
        refreshAllStudentsForDebtsAndRefunds,

        loading,
        error,
        depositAndAllocate,
    } = useMySchoolStore();

    const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<StudentWithGroups[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<StudentWithGroups | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
    });
    const [recentPayments, setRecentPayments] = useState<Array<any>>([]);
    const [receiptsFilter, setReceiptsFilter] = useState('');
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
    const [allocationResult, setAllocationResult] = useState<{ depositId: string; allocations: any[] } | null>(null);
    const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
    const [unpaidGroups, setUnpaidGroups] = useState<Array<{ id: number; name: string; remaining: number; startDate?: Date }>>([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historySearchTerm, setHistorySearchTerm] = useState('');
    const [historySelectedStudent, setHistorySelectedStudent] = useState<{ id: string; name: string; custom_id?: string } | null>(null);
    const [isStudentHistoryOpen, setIsStudentHistoryOpen] = useState(false);

    // Refund and Debts state
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [isDebtsModalOpen, setIsDebtsModalOpen] = useState(false);
    const [refundList, setRefundList] = useState<Array<{
        studentId: string;
        studentName: string;
        customId?: string;
        balance: number;
        groups: Array<{ id: number; name: string; status: string }>;
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
        groups: Array<{ id: number; name: string; status: string }>;
    } | null>(null);
    const [selectedDebtStudent, setSelectedDebtStudent] = useState<{
        studentId: string;
        studentName: string;
        customId?: string;
        balance: number;
        groups: Array<{ id: number; name: string; status: string }>;
    } | null>(null);
    const [refundData, setRefundData] = useState({
        amount: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
    });
    const [debtData, setDebtData] = useState({
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
        const loadUnpaid = async () => {
            if (!selectedStudent) {
                setUnpaidGroups([]);
                return;
            }
            try {
                const balance = await getStudentBalance(selectedStudent.id);
                const list = balance.groupBalances
                    .filter(gb => gb.remainingAmount > 0)
                    .map(gb => {
                        const full = groups.find(gr => gr.id === gb.groupId);
                        return {
                            id: gb.groupId,
                            name: full?.name || gb.groupName,
                            remaining: gb.remainingAmount,
                            startDate: full?.startDate,
                        };
                    })
                    .sort((a, b) => {
                        const da = a.startDate ? a.startDate.getTime() : 0;
                        const db = b.startDate ? b.startDate.getTime() : 0;
                        return da - db; // oldest first
                    });
                setUnpaidGroups(list);
            } catch (e) {
                console.error('Error loading unpaid groups:', e);
                setUnpaidGroups([]);
            }
        };
        loadUnpaid();
    }, [selectedStudent, groups, getStudentBalance]);

    const loadRecentPayments = async () => {
        try {
            const recent = await getRecentPayments(50);
            setRecentPayments(recent);
        } catch (error) {
            console.error('Error loading recent payments:', error);
        }
    };

    const loadRefundList = async () => {
        try {
            console.log('Loading refund list...');
            const refunds = await getRefundList();
            console.log('Refund list loaded:', refunds);
            setRefundList(refunds);
        } catch (error) {
            console.error('Error loading refund list:', error);
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
            console.log('Loading debts list...');
            const debts = await getDebtsList();
            console.log('Debts list loaded:', debts);
            setDebtsList(debts);
        } catch (error) {
            console.error('Error loading debts list:', error);
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

    // Function to refresh selected student data (balance and unpaid groups)
    const refreshSelectedStudentData = async () => {
        if (!selectedStudent) return;

        try {
            // Refresh student balance
            const balance = await getStudentBalance(selectedStudent.id);

            // Update selectedStudent with new balance
            setSelectedStudent(prev => prev ? {
                ...prev,
                remainingBalance: balance.remainingBalance
            } : null);

            // Update unpaid groups
            const list = balance.groupBalances
                .filter(gb => gb.remainingAmount > 0)
                .sort((a, b) => a.groupId - b.groupId) // Sort by group ID
                .map(gb => ({
                    id: gb.groupId,
                    name: gb.groupName,
                    remaining: gb.remainingAmount,
                    startDate: undefined // We don't have start date in groupBalances
                }));

            setUnpaidGroups(list);

            console.log('Selected student data refreshed:', {
                balance: balance.remainingBalance,
                unpaidGroups: list.length
            });
        } catch (error) {
            console.error('Error refreshing selected student data:', error);
        }
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
                                        remainingBalance: 0,
                                        defaultDiscount: student.defaultDiscount || 0,
                                    });
                                }
                            }
                        }
                    }
                }

                // Step 3: Second pass - add all groups for each matched student
                for (const group of groups) {
                    if (group.students && Array.isArray(group.students)) {
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

                            const balance = await getStudentBalance(student.id);
                            student.totalBalance = balance.totalBalance;
                            student.totalPaid = balance.totalPaid;
                            student.remainingBalance = balance.remainingBalance;

                            // Update group balances
                            student.groups = student.groups.map(group => {
                                const groupBalance = balance.groupBalances.find(gb => gb.groupId === group.id);
                                if (groupBalance) {
                                    group.amountPaid = groupBalance.amountPaid;
                                    group.remainingAmount = groupBalance.remainingAmount;
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
        setIsSearchModalOpen(false);
        setIsAddPaymentModalOpen(true);
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

    // Handle payment submission
    const handleAddPayment = async () => {
        if (!selectedStudent || !selectedStudent.id || !paymentData.amount) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const depositAmount = Math.abs(parseFloat(paymentData.amount));

            // Perform deposit and auto-allocation
            const result = await depositAndAllocate(
                selectedStudent.id,
                depositAmount,
                new Date(paymentData.date),
                paymentData.notes
            );

            // Reset form
            setPaymentData({
                amount: '',
                notes: '',
                date: new Date().toISOString().split('T')[0],
            });
            setSelectedStudent(null);
            setSelectedGroup(null);
            setIsAddPaymentModalOpen(false);

            // Refresh data
            await loadRecentPayments();
            await fetchPayments();

            // Show allocation summary
            setAllocationResult(result);
            setIsAllocationModalOpen(true);
        } catch (error) {
            console.error('Error adding payment:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(errorMessage);
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

    // Handle refund processing
    const handleProcessRefund = async () => {
        if (!selectedRefundStudent || !refundData.amount) return;

        try {
            await processRefund(
                selectedRefundStudent.studentId,
                parseFloat(refundData.amount),
                new Date(refundData.date),
                refundData.notes
            );

            // Close modal and refresh lists
            setIsRefundModalOpen(false);
            setSelectedRefundStudent(null);
            setRefundData({
                amount: '',
                notes: '',
                date: new Date().toISOString().split('T')[0],
            });

            // Add a small delay to ensure the refund is processed
            await new Promise(resolve => setTimeout(resolve, 500));

            // Clear the current lists to force refresh
            setRefundList([]);

            // Refresh lists
            await loadRefundList();
            await loadRecentPayments();

            // Refresh selected student data if it's the same student
            if (selectedStudent && selectedStudent.id === selectedRefundStudent.studentId) {
                await refreshSelectedStudentData();
            }

            // Show success message
            alert(`Refund of $${refundData.amount} processed successfully for ${selectedRefundStudent.studentName}`);
        } catch (error) {
            console.error('Error processing refund:', error);
        }
    };

    // Handle debt payment processing
    const handleProcessDebtPayment = async () => {
        if (!selectedDebtStudent || !debtData.amount) {
            alert('Please select a student and enter an amount');
            return;
        }

        try {
            // Ensure debt payment notes include "debt" for proper receipt labeling
            const debtNotes = debtData.notes ?
                `${debtData.notes} (debt payment)` :
                'Debt payment received';

            await processDebtPayment(
                selectedDebtStudent.studentId,
                parseFloat(debtData.amount),
                new Date(debtData.date),
                debtNotes
            );

            // Close modal and refresh lists
            setIsDebtsModalOpen(false);
            setSelectedDebtStudent(null);
            setDebtData({
                amount: '',
                notes: '',
                date: new Date().toISOString().split('T')[0],
            });

            // Add a small delay to ensure the payment is processed
            await new Promise(resolve => setTimeout(resolve, 500));

            // Clear the current debts list to force refresh
            setDebtsList([]);

            // Refresh lists
            await loadDebtsList();
            await loadRecentPayments();

            // Refresh selected student data if it's the same student
            if (selectedStudent && selectedStudent.id === selectedDebtStudent.studentId) {
                await refreshSelectedStudentData();
            }

            // Show success message
            alert(`Debt payment of $${debtData.amount} processed successfully for ${selectedDebtStudent.studentName}`);
        } catch (error) {
            console.error('Error processing debt payment:', error);
        }
    };

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
                                                    GID
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Amount Paid
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Admin
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {recentPayments
                                                .filter(p => p.studentName?.toLowerCase().includes(receiptsFilter.toLowerCase()))
                                                .map((payment) => (
                                                    <tr key={payment.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                                                                    <UserIcon className="h-4 w-4 text-orange-600" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {payment.studentName}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {payment.studentId}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {payment.groupName}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {payment.groupId ? `#${payment.groupId}` : 'Balance Addition'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {/* Enhanced payment type detection and styling */}
                                                            {(() => {
                                                                const isRegistrationFee = !payment.groupId && payment.notes && String(payment.notes).toLowerCase().includes('registration fee');
                                                                const isRefund = payment.amount < 0;
                                                                const isGroupFee = payment.groupId && payment.paymentType === 'group_payment';
                                                                const isBalanceAddition = payment.paymentType === 'balance_addition' && payment.amount > 0;
                                                                const isDebtPayment = payment.paymentType === 'balance_addition' && payment.amount > 0 && payment.notes && String(payment.notes).toLowerCase().includes('debt');

                                                                let amountColor = 'text-gray-900';
                                                                let paymentLabel = '';
                                                                let icon = null;

                                                                if (isRegistrationFee) {
                                                                    amountColor = 'text-green-600';
                                                                    paymentLabel = 'Registration Fee';
                                                                    icon = '🎓';
                                                                } else if (isGroupFee) {
                                                                    amountColor = 'text-green-600';
                                                                    paymentLabel = 'Group Fee';
                                                                    icon = '👥';
                                                                } else if (isRefund) {
                                                                    amountColor = 'text-red-600';
                                                                    paymentLabel = 'Refund';
                                                                    icon = '↩️';
                                                                } else if (isDebtPayment) {
                                                                    amountColor = 'text-blue-600';
                                                                    paymentLabel = 'Debt Payment';
                                                                    icon = '💰';
                                                                } else if (isBalanceAddition) {
                                                                    amountColor = 'text-blue-600';
                                                                    paymentLabel = 'Balance Addition';
                                                                    icon = '➕';
                                                                }

                                                                return (
                                                                    <>
                                                                        <div className={`text-sm font-medium ${amountColor} flex items-center gap-1`}>
                                                                            <span>{icon}</span>
                                                                            {isRefund ? '' : '+'}{payment.amount.toFixed(2)}
                                                                        </div>
                                                                        {payment.discount > 0 && (isGroupFee || isRegistrationFee) && (
                                                                            <div className="text-sm text-green-600">
                                                                                -{((payment.originalAmount || payment.amount) - payment.amount).toFixed(2)} discount
                                                                            </div>
                                                                        )}
                                                                        <div className={`text-sm ${amountColor} font-medium`}>
                                                                            {paymentLabel}
                                                                        </div>
                                                                    </>
                                                                );
                                                            })()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {format(new Date(payment.date), 'MMM dd, yyyy')}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {payment.adminName || 'Dalila'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <div className="flex space-x-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleShowReceipt(payment)}
                                                                    className="text-blue-600 hover:text-blue-900 hover:bg-blue-100"
                                                                >
                                                                    <CreditCardIcon className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDeletePayment(payment.id)}
                                                                    className="text-red-600 hover:text-red-900 hover:bg-red-100"
                                                                >
                                                                    <TrashIcon className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                                {recentPayments.length === 0 && (
                                    <div className="text-center py-8">
                                        <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h3>
                                        <p className="text-gray-500">
                                            Start by adding a payment for a student.
                                        </p>
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
                                            try {
                                                console.log('Starting comprehensive refresh...');
                                                const result = await refreshAllStudentsForDebtsAndRefunds();
                                                console.log('Refresh result:', result);

                                                // Reload the lists
                                                await loadRefundList();
                                                await loadDebtsList();

                                                alert(`Refresh Complete!\n\nProcessed: ${result.processedStudents} students\nRefunds: ${result.refundsCount}\nDebts: ${result.debtsCount}\nErrors: ${result.errors.length}`);
                                            } catch (error) {
                                                console.error('Error during refresh:', error);
                                                alert(`Error during refresh: ${error}`);
                                            }
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
                                        <div className="space-y-2">
                                            {refundList.length > 0 ? (
                                                refundList.map((refund) => (
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
                                                                    ${refund.balance.toFixed(2)}
                                                                </div>
                                                                <div className="text-xs text-green-600">Refund Amount</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-green-600 text-center py-4">
                                                    No students eligible for refunds
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Debts Section */}
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <h3 className="text-lg font-semibold text-red-800 mb-3">
                                            Students with Outstanding Debts
                                        </h3>
                                        <div className="space-y-2">
                                            {debtsList.length > 0 ? (
                                                debtsList.map((debt) => (
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
                                                                    ${debt.balance.toFixed(2)}
                                                                </div>
                                                                <div className="text-xs text-red-600">Debt Amount</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-red-600 text-center py-4">
                                                    No students with outstanding debts
                                                </div>
                                            )}
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
                                        className="p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 cursor-pointer transition-colors"
                                        onClick={() => handleStudentSelect(student)}
                                    >
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
                                            <PlusIcon className="h-5 w-5 text-orange-600" />
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
                    </div>
                </Modal>

                {/* Add Payment Modal */}
                <Modal
                    isOpen={isAddPaymentModalOpen}
                    onClose={() => {
                        setIsAddPaymentModalOpen(false);
                        setSelectedStudent(null);
                        setSelectedGroup(null);
                        setPaymentData({
                            amount: '',
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
                                <div className="text-sm text-gray-700">
                                    <span className="font-medium">Balance:</span>
                                    <span className={`ml-2 font-bold ${selectedStudent.remainingBalance > 0 ? 'text-green-600' : selectedStudent.remainingBalance < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                        {selectedStudent.remainingBalance > 0 ? '+' : selectedStudent.remainingBalance < 0 ? '-' : ''}
                                        {Math.abs(selectedStudent.remainingBalance).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Unpaid Groups list with priority ordering */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-3">Unpaid Groups (Priority Order)</h4>
                                {unpaidGroups.length > 0 ? (
                                    <ul className="space-y-3">
                                        {unpaidGroups.map((g, index) => (
                                            <li key={g.id} className={`p-3 rounded-lg border ${g.id === 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                                                }`}>
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
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-red-600">-{g.remaining.toFixed(2)}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {g.id === 0 ? 'Registration Fee' : 'Group Fee'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-600">No unpaid groups.</p>
                                )}
                                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                                    <strong>Payment Priority:</strong> Registration fees are always paid first, then groups are paid from oldest to newest.
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
                                        placeholder="Enter amount student gives (+ to balance)"
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
                                setSelectedStudent(null);
                                setSelectedGroup(null);
                                setPaymentData({
                                    amount: '',
                                    notes: '',
                                    date: new Date().toISOString().split('T')[0],
                                });
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddPayment}
                            disabled={!selectedStudent || !paymentData.amount}
                        >
                            Deposit & Auto-Allocate
                        </Button>
                    </div>
                </Modal>

                {/* Allocation Summary Modal */}
                <Modal
                    isOpen={isAllocationModalOpen}
                    onClose={() => {
                        setIsAllocationModalOpen(false);
                        setAllocationResult(null);
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
                                <div className="space-y-2">
                                    <h4 className="font-medium text-gray-900">Allocations</h4>
                                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800">
                                        {allocationResult.allocations.map((a) => (
                                            <li key={a.id}>
                                                Paid {Number(a.amount).toFixed(2)} to group #{a.groupId} on {format(new Date(a.date), 'MMM dd, yyyy')}
                                                {a.notes ? ` — ${a.notes}` : ''}
                                            </li>
                                        ))}
                                    </ul>
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
                                    }}
                                >
                                    Close
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
                    title={`Receipt - ${selectedReceipt?.studentName || 'Payment'}`}
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
                                        <p className="text-sm text-orange-600">Date: {format(new Date(selectedReceipt.date), 'MMM dd, yyyy')}</p>
                                        <p className="text-sm text-orange-600">Time: {format(new Date(selectedReceipt.date), 'HH:mm')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Student Information */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">Student Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Name</p>
                                        <p className="font-medium text-gray-900">{selectedReceipt.studentName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Student ID</p>
                                        <p className="font-medium text-gray-900">{selectedReceipt.studentId}</p>
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
                                            {(() => {
                                                const isRegistrationFee = !selectedReceipt.groupId && selectedReceipt.notes && String(selectedReceipt.notes).toLowerCase().includes('registration fee');
                                                const isRefund = selectedReceipt.amount < 0;
                                                const isGroupFee = selectedReceipt.groupId && selectedReceipt.paymentType === 'group_payment';
                                                const isBalanceAddition = selectedReceipt.paymentType === 'balance_addition' && selectedReceipt.amount > 0;
                                                const isDebtPayment = selectedReceipt.paymentType === 'balance_addition' && selectedReceipt.amount > 0 && selectedReceipt.notes && String(selectedReceipt.notes).toLowerCase().includes('debt');

                                                if (isRegistrationFee) return '🎓 Registration Fee';
                                                if (isGroupFee) return '👥 Group Fee';
                                                if (isRefund) return '↩️ Refund';
                                                if (isDebtPayment) return '💰 Debt Payment';
                                                if (isBalanceAddition) return '➕ Balance Addition';
                                                return 'Payment';
                                            })()}
                                        </span>
                                    </div>
                                    {selectedReceipt.groupId && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Group:</span>
                                            <span className="font-medium text-gray-900">
                                                {selectedReceipt.groupName} (#{selectedReceipt.groupId})
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Amount:</span>
                                        <span className={`font-bold text-lg ${(() => {
                                            const isRegistrationFee = !selectedReceipt.groupId && selectedReceipt.notes && String(selectedReceipt.notes).toLowerCase().includes('registration fee');
                                            const isRefund = selectedReceipt.amount < 0;
                                            const isGroupFee = selectedReceipt.groupId && selectedReceipt.paymentType === 'group_payment';
                                            const isBalanceAddition = selectedReceipt.paymentType === 'balance_addition' && selectedReceipt.amount > 0;
                                            const isDebtPayment = selectedReceipt.paymentType === 'balance_addition' && selectedReceipt.amount > 0 && selectedReceipt.notes && String(selectedReceipt.notes).toLowerCase().includes('debt');

                                            // POSITIVE amounts (green, +): Registration fees, group fees, debt payments
                                            if (isRegistrationFee || isGroupFee || isDebtPayment) return 'text-green-600';
                                            // NEGATIVE amounts (red, -): Only refund payments (when giving cash to student)
                                            if (isRefund) return 'text-red-600';
                                            // Other positive amounts (blue, +): Balance additions
                                            if (isBalanceAddition) return 'text-blue-600';
                                            return 'text-gray-900';
                                        })()}`}>
                                            {(() => {
                                                const isRefund = selectedReceipt.amount < 0;
                                                const isDebtPayment = selectedReceipt.paymentType === 'balance_addition' && selectedReceipt.amount > 0 && selectedReceipt.notes && String(selectedReceipt.notes).toLowerCase().includes('debt');
                                                const isRegistrationFee = !selectedReceipt.groupId && selectedReceipt.notes && String(selectedReceipt.notes).toLowerCase().includes('registration fee');
                                                const isGroupFee = selectedReceipt.groupId && selectedReceipt.paymentType === 'group_payment';

                                                // POSITIVE amounts (+): Registration fees, group fees, debt payments, balance additions
                                                if (isRegistrationFee || isGroupFee || isDebtPayment || selectedReceipt.amount > 0) return '+';
                                                // NEGATIVE amounts (-): Only refund payments (when giving cash to student)
                                                if (isRefund) return '-';
                                                return '+';
                                            })()}{Math.abs(selectedReceipt.amount).toFixed(2)}
                                        </span>
                                    </div>
                                    {selectedReceipt.discount > 0 && (selectedReceipt.paymentType === 'group_payment' || (!selectedReceipt.groupId && selectedReceipt.notes && String(selectedReceipt.notes).toLowerCase().includes('registration fee'))) && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Discount:</span>
                                            <span className="font-medium text-green-600">
                                                -{((selectedReceipt.originalAmount || selectedReceipt.amount) - selectedReceipt.amount).toFixed(2)} ({selectedReceipt.discount}%)
                                            </span>
                                        </div>
                                    )}
                                    {selectedReceipt.originalAmount && selectedReceipt.originalAmount !== selectedReceipt.amount && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Original Amount:</span>
                                            <span className="font-medium text-gray-900">
                                                {selectedReceipt.originalAmount.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedReceipt.notes && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                                    <p className="text-gray-700 whitespace-pre-wrap">{selectedReceipt.notes}</p>
                                </div>
                            )}

                            {/* Admin Information */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">Processed By</h4>
                                <p className="text-gray-700">{selectedReceipt.adminName || 'Dalila'}</p>
                            </div>

                            {/* Receipt Footer */}
                            <div className="border-t pt-4">
                                <div className="text-center">
                                    <p className="text-sm text-gray-500">
                                        Thank you for your payment!
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Receipt generated on {format(new Date(), 'MMM dd, yyyy HH:mm')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
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
                                // Here you could add functionality to print or download the receipt
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
                                <div className="text-sm text-gray-600">
                                    ID: <span className="font-mono">{historySelectedStudent.custom_id || historySelectedStudent.id.substring(0, 4) + '...'}</span>
                                </div>
                            </div>

                            <div className="max-h-96 overflow-y-auto pr-2">
                                <div className="relative">
                                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                                    <ul className="space-y-4">
                                        {payments
                                            .filter(p => p.studentId === historySelectedStudent.id)
                                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                            .map((p) => {
                                                const isCredit = (p as any).groupId == null;
                                                const group = p.groupId ? groups.find(g => g.id === p.groupId) : null;
                                                return (
                                                    <li key={p.id} className="relative pl-12">
                                                        <span className={`absolute left-2 top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${isCredit ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                        <div className="p-1">
                                                            <div className="flex items-center justify-between">
                                                                <div className="text-xs text-gray-500">{format(new Date(p.date), 'MMM dd, yyyy')}</div>
                                                                <div className={`text-sm font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {isCredit ? '+' : '-'}{p.amount.toFixed(2)}
                                                                </div>
                                                            </div>
                                                            {!isCredit && (
                                                                <div className="mt-0.5 text-sm text-gray-700">
                                                                    Group: <span className="font-medium">{group?.name || `#${p.groupId}`}</span> <span className="text-gray-500">(#{p.groupId})</span>
                                                                </div>
                                                            )}
                                                            {p.notes && (
                                                                <div className="mt-0.5 text-xs text-gray-500">{p.notes}</div>
                                                            )}
                                                        </div>
                                                    </li>
                                                );
                                            })}
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

                            {refundList.length > 0 ? (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {refundList.map((student) => (
                                        <div
                                            key={student.studentId}
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
                                                            <div className="text-sm text-gray-600">
                                                                Status: No active group enrollments
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-green-600">
                                                        +{student.balance.toFixed(2)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">Available for refund</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No refunds available</h3>
                                    <p className="text-gray-500">
                                        No students are currently eligible for refunds.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Refund Form */}
                        {selectedRefundStudent && (
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                <h3 className="text-lg font-medium text-orange-900 mb-4">
                                    Process Refund for {selectedRefundStudent.studentName}
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
                                        onClick={handleProcessRefund}
                                        disabled={!refundData.amount || parseFloat(refundData.amount) <= 0}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        Process Refund
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
                        setSelectedDebtStudent(null);
                        setDebtData({
                            amount: '',
                            notes: '',
                            date: new Date().toISOString().split('T')[0],
                        });
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

                            {debtsList.length > 0 ? (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {debtsList.map((student) => (
                                        <div
                                            key={student.studentId}
                                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedDebtStudent?.studentId === student.studentId
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                                                }`}
                                            onClick={() => {
                                                setSelectedDebtStudent(student);
                                                setDebtData(prev => ({
                                                    ...prev,
                                                    amount: Math.abs(student.balance).toString(),
                                                }));
                                            }}
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
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No debts found</h3>
                                    <p className="text-gray-500">
                                        No students currently have outstanding debts.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Debt Payment Form */}
                        {selectedDebtStudent && (
                            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                <h3 className="text-lg font-medium text-red-900 mb-4">
                                    Process Debt Payment for {selectedDebtStudent.studentName}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Payment Amount *
                                        </label>
                                        <Input
                                            type="number"
                                            value={debtData.amount}
                                            onChange={(e) => setDebtData(prev => ({ ...prev, amount: e.target.value }))}
                                            placeholder="Enter payment amount"
                                            className="w-full"
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            Outstanding debt: {Math.abs(selectedDebtStudent.balance).toFixed(2)}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Payment Date
                                        </label>
                                        <Input
                                            type="date"
                                            value={debtData.date}
                                            onChange={(e) => setDebtData(prev => ({ ...prev, date: e.target.value }))}
                                            className="w-1/2"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        value={debtData.notes}
                                        onChange={(e) => setDebtData(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Enter payment details and notes..."
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                                    />
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedDebtStudent(null);
                                            setDebtData({
                                                amount: '',
                                                notes: '',
                                                date: new Date().toISOString().split('T')[0],
                                            });
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleProcessDebtPayment}
                                        disabled={!debtData.amount || parseFloat(debtData.amount) <= 0}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        Process Payment
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Summary */}
                        {debtsList.length > 0 && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <h4 className="font-medium text-blue-900 mb-2">Debts Summary</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-blue-700">Total Students:</span>
                                        <span className="ml-2 font-medium text-blue-900">{debtsList.length}</span>
                                    </div>
                                    <div>
                                        <span className="text-blue-700">Total Amount:</span>
                                        <span className="ml-2 font-medium text-blue-900">
                                            {debtsList.reduce((sum, s) => sum + s.balance, 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            </div>
        </AuthGuard>
    );
} 