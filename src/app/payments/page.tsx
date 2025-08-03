'use client';

import React, { useState } from 'react';
import Navigation from '../../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useMySchoolStore } from '../../store';
import {
    CreditCardIcon,
    PlusIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function PaymentsPage() {
    const { 
        groups, 
        payments, 
        addPayment, 
        deletePayment, 
        getStudentStats, 
        fetchGroups, 
        fetchPayments, 
        loading, 
        error 
    } = useMySchoolStore();
    const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<{ groupId: string; studentId: string } | null>(null);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    // Fetch data on component mount
    React.useEffect(() => {
        fetchGroups();
        fetchPayments();
    }, [fetchGroups, fetchPayments]);

    const handleAddPayment = async () => {
        if (!selectedStudent || !paymentData.amount) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            await addPayment({
                studentId: selectedStudent.studentId,
                groupId: selectedStudent.groupId,
                amount: parseFloat(paymentData.amount),
                date: new Date(paymentData.date),
                notes: paymentData.notes,
            });

            // Reset form
            setPaymentData({
                amount: '',
                date: new Date().toISOString().split('T')[0],
                notes: '',
            });
            setSelectedStudent(null);
            setIsAddPaymentModalOpen(false);
        } catch (error) {
            console.error('Error adding payment:', error);
            alert('Failed to add payment. Please try again.');
        }
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (confirm('Are you sure you want to delete this payment?')) {
            try {
                await deletePayment(paymentId);
            } catch (error) {
                console.error('Error deleting payment:', error);
                alert('Failed to delete payment. Please try again.');
            }
        }
    };

    const getStudentPaymentStats = (groupId: string, studentId: string) => {
        return getStudentStats(groupId, studentId);
    };

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalStudents = groups.reduce((sum, group) => sum + group.students.length, 0);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
                        <p className="mt-2 text-gray-600">
                            Track student payments and manage financial records
                        </p>
                    </div>
                    <Button onClick={() => setIsAddPaymentModalOpen(true)}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Payment
                    </Button>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="p-3 rounded-lg bg-green-100">
                                    <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                    <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="p-3 rounded-lg bg-blue-100">
                                    <UserGroupIcon className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                                    <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="p-3 rounded-lg bg-orange-100">
                                    <CreditCardIcon className="h-6 w-6 text-orange-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Payments</p>
                                    <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Student Payment Details */}
                <div className="space-y-6">
                    {groups.map((group) => (
                        <Card key={group.id}>
                            <CardHeader>
                                <CardTitle>{group.name}</CardTitle>
                                <CardDescription>
                                    Student payment details and financial tracking
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {group.students.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">
                                        No students in this group yet.
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {group.students.map((student) => {
                                            const stats = getStudentPaymentStats(group.id, student.id);
                                            const studentPayments = payments.filter(p => p.studentId === student.id);

                                            return (
                                                <div key={student.id} className="border border-gray-200 rounded-lg p-4">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h3 className="font-medium text-gray-900">{student.name}</h3>
                                                            <p className="text-sm text-gray-600">{student.email}</p>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedStudent({ groupId: group.id, studentId: student.id });
                                                                setIsAddPaymentModalOpen(true);
                                                            }}
                                                        >
                                                            <PlusIcon className="h-4 w-4 mr-1" />
                                                            Add Payment
                                                        </Button>
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                        <div className="text-center">
                                                            <p className="text-sm text-gray-600">Sessions Attended</p>
                                                            <p className="text-lg font-semibold text-gray-900">
                                                                {stats.attendedSessions}/{stats.totalSessions}
                                                            </p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-sm text-gray-600">Price per Session</p>
                                                            <p className="text-lg font-semibold text-gray-900">
                                                                ${student.pricePerSession}
                                                            </p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-sm text-gray-600">Total Due</p>
                                                            <p className="text-lg font-semibold text-orange-600">
                                                                ${stats.totalDue.toFixed(2)}
                                                            </p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-sm text-gray-600">Balance</p>
                                                            <p className={`text-lg font-semibold ${stats.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'
                                                                }`}>
                                                                ${stats.remainingBalance.toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {studentPayments.length > 0 && (
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 mb-2">Payment History</h4>
                                                            <div className="space-y-2">
                                                                {studentPayments.map((payment) => (
                                                                    <div key={payment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                                        <div className="flex items-center space-x-4">
                                                                            <span className="text-sm text-gray-600">
                                                                                {format(new Date(payment.date), 'MMM dd, yyyy')}
                                                                            </span>
                                                                            <span className="text-sm font-medium text-gray-900">
                                                                                ${payment.amount.toFixed(2)}
                                                                            </span>
                                                                            {payment.notes && (
                                                                                <span className="text-sm text-gray-500">
                                                                                    {payment.notes}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleDeletePayment(payment.id)}
                                                                            className="text-red-600 hover:text-red-700"
                                                                        >
                                                                            <TrashIcon className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Add Payment Modal */}
            <Modal
                isOpen={isAddPaymentModalOpen}
                onClose={() => {
                    setIsAddPaymentModalOpen(false);
                    setSelectedStudent(null);
                }}
                title="Add Payment"
            >
                <div className="space-y-6">
                    {selectedStudent && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Student
                            </label>
                            <p className="text-sm text-gray-900">
                                {groups.find(g => g.id === selectedStudent.groupId)?.students.find(s => s.id === selectedStudent.studentId)?.name}
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount *
                        </label>
                        <Input
                            type="number"
                            step="0.01"
                            value={paymentData.amount}
                            onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                            placeholder="Enter payment amount"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Date
                        </label>
                        <Input
                            type="date"
                            value={paymentData.date}
                            onChange={(e) => setPaymentData(prev => ({ ...prev, date: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={paymentData.notes}
                            onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Add payment notes"
                            className="w-full h-20 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAddPaymentModalOpen(false);
                                setSelectedStudent(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleAddPayment}>
                            Add Payment
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
} 