'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Navigation from '../../../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import { useMySchoolStore } from '../../../store';
import { Student } from '../../../types';
import {
    PlusIcon,
    UserGroupIcon,
    UsersIcon,
    CalendarIcon,
    PencilIcon,
    TrashIcon,
    EnvelopeIcon,
    PhoneIcon,
    CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import Link from 'next/link';

export default function GroupDetailPage() {
    const params = useParams();
    const groupId = params.id as string;

    const {
        getGroupById,
        getTeacherById,
        addStudentToGroup,
        removeStudentFromGroup,
        updateStudent,
        generateSessions,
        updateAttendance,
        fetchGroups,
        fetchTeachers,
        loading,
        error
    } = useMySchoolStore();

    const group = getGroupById(groupId);
    const teacher = group ? getTeacherById(group.teacherId) : null;

    // Fetch data on component mount
    React.useEffect(() => {
        fetchGroups();
        fetchTeachers();
    }, [fetchGroups, fetchTeachers]);

    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [studentData, setStudentData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        birthDate: '',
    });

    if (!group) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navigation />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card>
                        <CardContent className="p-12 text-center">
                            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Group not found</h3>
                            <p className="text-gray-500 mb-6">
                                The group you&apos;re looking for doesn&apos;t exist.
                            </p>
                            <Link href="/groups">
                                <Button>Back to Groups</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const handleAddStudent = async () => {
        if (!studentData.name || !studentData.phone) {
            alert('Please fill in all required fields (Name and Phone)');
            return;
        }

        try {
            await addStudentToGroup(groupId, {
                name: studentData.name,
                email: studentData.email || '',
                phone: studentData.phone,
                address: studentData.address || undefined,
                birthDate: studentData.birthDate ? new Date(studentData.birthDate) : undefined,
                totalPaid: 0,
            });

            // Reset form
            setStudentData({
                name: '',
                email: '',
                phone: '',
                address: '',
                birthDate: '',
            });

            setIsAddStudentModalOpen(false);
        } catch (error) {
            console.error('Error adding student:', error);
            alert('Failed to add student. Please try again.');
        }
    };

    const handleEditStudent = async () => {
        if (!editingStudent || !studentData.name || !studentData.phone) {
            alert('Please fill in all required fields (Name and Phone)');
            return;
        }

        try {
            await updateStudent(groupId, editingStudent.id, {
                name: studentData.name,
                email: studentData.email,
                phone: studentData.phone,
                address: studentData.address || undefined,
                birthDate: studentData.birthDate ? new Date(studentData.birthDate) : undefined,
            });

            // Reset form
            setStudentData({
                name: '',
                email: '',
                phone: '',
                address: '',
                birthDate: '',
            });

            setEditingStudent(null);
            setIsEditStudentModalOpen(false);
        } catch (error) {
            console.error('Error updating student:', error);
            alert('Failed to update student. Please try again.');
        }
    };

    const handleEditStudentClick = (student: Student) => {
        setEditingStudent(student);
        setStudentData({
            name: student.name,
            email: student.email,
            phone: student.phone || '',
            address: student.address || '',
            birthDate: student.birthDate ? student.birthDate.toISOString().split('T')[0] : '',
        });
        setIsEditStudentModalOpen(true);
    };

    const handleDeleteStudent = async (studentId: string) => {
        if (confirm('Are you sure you want to remove this student from the group?')) {
            try {
                await removeStudentFromGroup(groupId, studentId);
            } catch (error) {
                console.error('Error removing student:', error);
                alert('Failed to remove student. Please try again.');
            }
        }
    };

    const handleGenerateSessions = async () => {
        try {
            await generateSessions(groupId);
        } catch (error) {
            console.error('Error generating sessions:', error);
            alert('Failed to generate sessions. Please try again.');
        }
    };

    const handleAttendanceToggle = async (sessionId: string, studentId: string, attended: boolean) => {
        try {
            await updateAttendance(sessionId, studentId, attended);
        } catch (error) {
            console.error('Error updating attendance:', error);
            alert('Failed to update attendance. Please try again.');
        }
    };

    const weekDays = [
        'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];

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
                        <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
                        <p className="mt-2 text-gray-600">
                            Teacher: {teacher?.name} • {group.students.length} students • {group.sessions.length} sessions
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <Button variant="outline" onClick={() => setIsAddStudentModalOpen(true)}>
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Add Student
                        </Button>
                        {group.sessions.length === 0 && (
                            <Button onClick={handleGenerateSessions}>
                                <CalendarIcon className="h-5 w-5 mr-2" />
                                Generate Sessions
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Group Information */}
                    <div className="lg:col-span-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Group Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Group ID</label>
                                        <p className="text-gray-900 font-semibold">{group.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Start Date</label>
                                        <p className="text-gray-900">{format(new Date(group.startDate), 'MMMM dd, yyyy')}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Recurring Days</label>
                                        <p className="text-gray-900">
                                            {group.recurringDays.map(day => weekDays[day]).join(', ')}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Teacher</label>
                                        <p className="text-gray-900">{teacher?.name}</p>
                                        <p className="text-sm text-gray-600">{teacher?.email}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Students List */}
                    <div className="lg:col-span-3">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Students ({group.students.length})</CardTitle>
                                        <CardDescription>
                                            Manage students in this group
                                        </CardDescription>
                                    </div>
                                    <Button variant="outline" onClick={() => setIsAddStudentModalOpen(true)}>
                                        <PlusIcon className="h-5 w-5 mr-2" />
                                        Add Student
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {group.students.length === 0 ? (
                                    <div className="text-center py-8">
                                        <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No students yet</h3>
                                        <p className="text-gray-500 mb-4">
                                            Add students to start tracking attendance and payments
                                        </p>
                                        <Button onClick={() => setIsAddStudentModalOpen(true)}>
                                            <PlusIcon className="h-5 w-5 mr-2" />
                                            Add First Student
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {group.students.map((student) => (
                                            <div key={student.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h3 className="font-medium text-gray-900">{student.name}</h3>
                                                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                                            {student.email && (
                                                                <span className="flex items-center">
                                                                    <EnvelopeIcon className="h-4 w-4 mr-1" />
                                                                    {student.email}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center">
                                                                <PhoneIcon className="h-4 w-4 mr-1" />
                                                                {student.phone}
                                                            </span>
                                                            {student.address && (
                                                                <span className="flex items-center">
                                                                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    </svg>
                                                                    {student.address}
                                                                </span>
                                                            )}
                                                            {student.birthDate && (
                                                                <span className="flex items-center">
                                                                    <CalendarIcon className="h-4 w-4 mr-1" />
                                                                    {format(new Date(student.birthDate), 'MMM dd, yyyy')}
                                                                </span>
                                                            )}
                                                            {student.pricePerSession && (
                                                                <span className="flex items-center">
                                                                    <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                                                                    ${student.pricePerSession}/session
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditStudentClick(student)}
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteStudent(student.id)}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Sessions Table */}
                {group.sessions.length > 0 && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Sessions ({group.sessions.length})</CardTitle>
                            <CardDescription>
                                Session schedule and attendance overview
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Session
                                            </th>
                                            {group.students.map((student) => (
                                                <th key={student.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {student.name}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {group.sessions.map((session) => (
                                            <tr key={session.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {format(new Date(session.date), 'MMM dd, yyyy')}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {format(new Date(session.date), 'EEEE')}
                                                    </div>
                                                </td>
                                                {group.students.map((student) => (
                                                    <td key={student.id} className="px-3 py-4 whitespace-nowrap text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${session.attendance[student.id]
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {session.attendance[student.id] ? 'Present' : 'Absent'}
                                                        </span>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Add Student Modal */}
            <Modal
                isOpen={isAddStudentModalOpen}
                onClose={() => setIsAddStudentModalOpen(false)}
                title="Add Student"
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Name *
                        </label>
                        <Input
                            value={studentData.name}
                            onChange={(e) => setStudentData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter student name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email (Optional)
                        </label>
                        <Input
                            type="email"
                            value={studentData.email}
                            onChange={(e) => setStudentData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Enter email address"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone (Required)
                        </label>
                        <Input
                            type="tel"
                            value={studentData.phone}
                            onChange={(e) => setStudentData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Enter phone number"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address (Optional)
                        </label>
                        <Input
                            value={studentData.address}
                            onChange={(e) => setStudentData(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Enter address"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Birth Date (Optional)
                        </label>
                        <Input
                            type="date"
                            value={studentData.birthDate}
                            onChange={(e) => setStudentData(prev => ({ ...prev, birthDate: e.target.value }))}
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsAddStudentModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleAddStudent}>
                            Add Student
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Edit Student Modal */}
            <Modal
                isOpen={isEditStudentModalOpen}
                onClose={() => {
                    setIsEditStudentModalOpen(false);
                    setEditingStudent(null);
                }}
                title="Edit Student"
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Name *
                        </label>
                        <Input
                            value={studentData.name}
                            onChange={(e) => setStudentData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter student name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email (Optional)
                        </label>
                        <Input
                            type="email"
                            value={studentData.email}
                            onChange={(e) => setStudentData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Enter email address"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone (Required)
                        </label>
                        <Input
                            type="tel"
                            value={studentData.phone}
                            onChange={(e) => setStudentData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Enter phone number"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address (Optional)
                        </label>
                        <Input
                            value={studentData.address}
                            onChange={(e) => setStudentData(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Enter address"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Birth Date (Optional)
                        </label>
                        <Input
                            type="date"
                            value={studentData.birthDate}
                            onChange={(e) => setStudentData(prev => ({ ...prev, birthDate: e.target.value }))}
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsEditStudentModalOpen(false);
                                setEditingStudent(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleEditStudent}>
                            Update Student
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
} 