'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Navigation from '../../../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import { useMySchoolStore } from '../../../store';
import AuthGuard from '../../../components/AuthGuard';
import { Student, WaitingListStudent, CallLog } from '../../../types';
import {
    PlusIcon,
    UserGroupIcon,
    UsersIcon,
    CalendarIcon,
    PencilIcon,
    TrashIcon,
    EnvelopeIcon,
    PhoneIcon,
    ClockIcon,
    CheckIcon,
    ExclamationTriangleIcon,
    QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import Link from 'next/link';
import { AttendanceStatus } from '../../../types';
import { formatTimeSimple } from '../../../utils/timeUtils';
import { getAttendanceClasses, getAttendanceDisplayLetter, getAttendanceTitle } from '../../../utils/attendanceUtils';
import { supabase } from '../../../lib/supabase';

// Component to check and display student status in the group
const StudentStatusBadge = ({ studentId, groupId }: { studentId: string; groupId: number }) => {
    const [status, setStatus] = React.useState<'active' | 'stopped' | 'loading'>('loading');
    const [stopReason, setStopReason] = React.useState<string | null>(null);

    React.useEffect(() => {
        const checkStudentStatus = async () => {
            try {
                // Check student_groups table for status
                const { data: studentGroup, error } = await supabase
                    .from('student_groups')
                    .select('status, notes')
                    .eq('student_id', studentId)
                    .eq('group_id', groupId)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error checking student status:', error);
                    setStatus('active'); // Default to active if error
                    return;
                }

                if (studentGroup) {
                    setStatus(studentGroup.status as 'active' | 'stopped');
                    if (studentGroup.status === 'stopped' && studentGroup.notes) {
                        setStopReason(studentGroup.notes);
                    }
                } else {
                    setStatus('active'); // Default to active if no record found
                }
            } catch (error) {
                console.error('Error checking student status:', error);
                setStatus('active');
            }
        };

        checkStudentStatus();
    }, [studentId, groupId]);

    if (status === 'loading') {
        return <span className="text-xs text-gray-400">Loading...</span>;
    }

    if (status === 'stopped') {
        return (
            <div className="flex items-center">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    ⏹️ Stopped
                </span>
                {stopReason && (
                    <span className="ml-2 text-xs text-gray-500" title={stopReason}>
                        (Reason: {stopReason.length > 20 ? stopReason.substring(0, 20) + '...' : stopReason})
                    </span>
                )}
            </div>
        );
    }

    return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✅ Active
        </span>
    );
};

// PaymentStatusCell component - FIXED VERSION
const PaymentStatusCell = ({ studentId, groupId }: { studentId: string; groupId: number }) => {
    const [isPending, setIsPending] = React.useState(true);
    const [paymentStatus, setPaymentStatus] = React.useState<'paid' | 'pending' | 'unknown'>('unknown');

    React.useEffect(() => {
        const checkPaymentStatus = async () => {
            try {
                // 🚨 FIX: Use direct database query to check actual payments
                const { data: payments, error } = await supabase
                    .from('payments')
                    .select('amount, notes, payment_type')
                    .eq('student_id', studentId)
                    .eq('group_id', groupId);

                if (error) {
                    console.error('Error checking payments:', error);
                    setPaymentStatus('unknown');
                } else {
                    // 🚨 FIX: Only count actual payments with proper notes and positive amounts
                    const actualPayments = payments.filter(p =>
                        p.amount > 0 &&
                        p.notes &&
                        p.notes.trim() !== '' &&
                        p.notes !== 'Registration fee' // Exclude registration fees from group payment calculation
                    );

                    const totalPaid = actualPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

                    // 🚨 FIX: Get group price to determine if fully paid
                    const { data: groupData } = await supabase
                        .from('groups')
                        .select('price')
                        .eq('id', groupId)
                        .single();

                    const groupPrice = Number(groupData?.price || 0);

                    // 🚨 FIX: If no group price is set, or if student was just added, show as pending
                    if (groupPrice === 0 || groupPrice === null) {
                        setPaymentStatus('pending');
                    } else if (totalPaid >= groupPrice) {
                        setPaymentStatus('paid');
                    } else {
                        setPaymentStatus('pending');
                    }

                    console.log(`🚨 DEBUG PaymentStatusCell: Student ${studentId}, Group ${groupId}:`, {
                        totalPaid,
                        groupPrice,
                        actualPayments: actualPayments.length,
                        status: totalPaid >= groupPrice ? 'paid' : 'pending',
                        allPayments: payments
                    });
                }
            } catch (error) {
                console.error('Error getting payment status:', error);
                setPaymentStatus('unknown');
            } finally {
                setIsPending(false);
            }
        };

        checkPaymentStatus();
    }, [studentId, groupId]);

    if (isPending) {
        return (
            <div className="flex justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            </div>
        );
    }

    return (
        <div className="flex justify-center">
            {paymentStatus === 'pending' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                    Pending
                </span>
            ) : paymentStatus === 'paid' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckIcon className="h-3 w-3 mr-1" />
                    Paid
                </span>
            ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <QuestionMarkCircleIcon className="h-3 w-3 mr-1" />
                    Unknown
                </span>
            )}
        </div>
    );
};

export default function GroupDetailPage() {
    const params = useParams();
    const groupId = parseInt(params.id as string, 10);

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
        getWaitingListByCriteria,
        moveFromWaitingListToGroup,
        addCallLog,
        getStudentBalance,
        getLastPaymentCallNote,
        addGroup,
        teachers,
        loading,
        error
    } = useMySchoolStore();

    const group = getGroupById(groupId);
    const uniqueStudents = React.useMemo(() => {
        if (!group || !group.students) return [] as Student[];
        const byId = new Map<string, Student>();
        for (const s of group.students) {
            if (!byId.has(s.id)) byId.set(s.id, s);
        }
        return Array.from(byId.values());
    }, [group?.students]);
    const teacher = group ? getTeacherById(group.teacherId) : null;

    React.useEffect(() => {
        fetchGroups();
        fetchTeachers();
    }, [fetchGroups, fetchTeachers]);

    // Refresh data periodically to stay in sync with attendance page
    React.useEffect(() => {
        const interval = setInterval(() => {
            fetchGroups();
        }, 5000); // Refresh every 5 seconds

        return () => clearInterval(interval);
    }, [fetchGroups]);

    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [showWaitingListModal, setShowWaitingListModal] = useState(false);
    const [waitingListStudents, setWaitingListStudents] = useState<WaitingListStudent[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

    // Configure Next Group Modal State
    const [showConfigureNextGroupModal, setShowConfigureNextGroupModal] = useState(false);
    const [nextGroupFormData, setNextGroupFormData] = useState({
        teacherId: '',
        startDate: '',
        totalSessions: 16,
        recurringDays: [] as number[],
        price: 0,
        language: '',
        level: '',
        category: '',
        startTime: '09:00',
        endTime: '11:00',
        selectedStudents: [] as string[],
    });

    // New state for call log functionality
    const [isCallLogModalOpen, setIsCallLogModalOpen] = useState(false);
    const [selectedStudentForCall, setSelectedStudentForCall] = useState<Student | null>(null);
    const [callLogData, setCallLogData] = useState({
        callType: 'payment' as 'payment' | 'activity', // Payment or activity for groups page
        status: 'pending' as 'pending' | 'coming' | 'not_coming',
        notes: '',
    });
    const [lastPaymentCallNote, setLastPaymentCallNote] = useState<string | null>(null);
    const [groupRemainingFees, setGroupRemainingFees] = useState<number | null>(null);

    // New state for student search
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<(WaitingListStudent | Student)[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // New state for attendance updates
    const [updatingAttendance, setUpdatingAttendance] = useState<Set<string>>(new Set());

    if (!group) {
        return (
            <AuthGuard>
                <div className="min-h-screen bg-gray-50">
                    <Navigation />
                    <div className="lg:ml-16">
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
                </div>
            </AuthGuard>
        );
    }

    const handleEditStudent = async () => {
        if (!editingStudent || !editingStudent.name || !editingStudent.phone) {
            alert('Please fill in all required fields (Name and Phone)');
            return;
        }

        try {
            await updateStudent(groupId, editingStudent.id, {
                name: editingStudent.name,
                email: editingStudent.email || '',
                phone: editingStudent.phone,
                secondPhone: editingStudent.secondPhone || undefined,
                parentName: editingStudent.parentName || undefined,
                address: editingStudent.address || undefined,
                birthDate: editingStudent.birthDate ? new Date(editingStudent.birthDate) : undefined,
            });

            setIsEditStudentModalOpen(false);
            setEditingStudent(null);
        } catch (error) {
            console.error('Error updating student:', error);
            alert('Failed to update student. Please try again.');
        }
    };

    const handleEditStudentClick = (student: Student) => {
        setEditingStudent({ ...student });
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

    // New function to handle call log creation
    const handleAddCallLog = async () => {
        if (!selectedStudentForCall || !callLogData.notes.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        // For payment calls, status is required
        if (callLogData.callType === 'payment' && !callLogData.status) {
            alert('Please select a status for payment calls');
            return;
        }

        try {
            await addCallLog({
                studentId: selectedStudentForCall.id,
                callDate: new Date(),
                callType: callLogData.callType, // Use selected call type
                status: callLogData.callType === 'payment' ? callLogData.status : 'pending', // Default status for activity calls
                notes: callLogData.notes,
                adminName: 'Dalila',
            });

            // Reset form and close modal
            setCallLogData({
                callType: 'payment' as 'payment' | 'activity',
                status: 'pending',
                notes: '',
            });
            setSelectedStudentForCall(null);
            setIsCallLogModalOpen(false);
            setLastPaymentCallNote(null);
            setGroupRemainingFees(null);

            alert(`${callLogData.callType.charAt(0).toUpperCase() + callLogData.callType.slice(1)} call log added successfully!`);
        } catch (error) {
            console.error('Error adding call log:', error);
            alert('Failed to add call log. Please try again.');
        }
    };

    // Function to check payment status for a student
    const getPaymentStatus = async (studentId: string) => {
        try {
            const balance = await getStudentBalance(studentId);
            const groupBalance = balance.groupBalances.find(gb => gb.groupId === groupId);
            return groupBalance ? groupBalance.remainingAmount > 0 : false;
        } catch (error) {
            console.error('Error getting payment status:', error);
            return false;
        }
    };

    // Function to open call log modal
    const handleOpenCallLogModal = async (student: Student) => {
        setSelectedStudentForCall(student);
        setIsCallLogModalOpen(true);

        try {
            // Fetch last payment call note
            const lastNote = await getLastPaymentCallNote(student.id);
            setLastPaymentCallNote(lastNote);

            // Fetch remaining fees for this group
            const balance = await getStudentBalance(student.id);
            const groupBalance = balance.groupBalances.find(gb => gb.groupId === groupId);
            setGroupRemainingFees(groupBalance ? groupBalance.remainingAmount : 0);
        } catch (error) {
            console.error('Error fetching call log data:', error);
            setLastPaymentCallNote(null);
            setGroupRemainingFees(null);
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

    const handleShowWaitingList = async () => {
        try {
            const students = await getWaitingListByCriteria(group.language, group.level, group.category);
            setWaitingListStudents(students);
            setShowWaitingListModal(true);
        } catch (error) {
            console.error('Error fetching waiting list:', error);
            alert('Failed to fetch waiting list. Please try again.');
        }
    };

    const handleAddFromWaitingList = async () => {
        try {
            for (const studentId of selectedStudents) {
                await moveFromWaitingListToGroup(studentId, groupId);
            }
            setShowWaitingListModal(false);
            setSelectedStudents([]);
            setWaitingListStudents([]);
        } catch (error) {
            console.error('Error adding students from waiting list:', error);
            alert('Failed to add students from waiting list. Please try again.');
        }
    };

    const handleStudentSelection = (studentId: string) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const weekDays = [
        'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];

    const languages = [
        { value: 'French', label: 'French' },
        { value: 'English', label: 'English' },
        { value: 'Spanish', label: 'Spanish' },
        { value: 'German', label: 'German' },
    ];

    const levels = [
        { value: 'A1', label: 'A1 - Beginner' },
        { value: 'A1+', label: 'A1+ - Beginner+' },
        { value: 'A2', label: 'A2 - Elementary' },
        { value: 'A2+', label: 'A2+ - Elementary+' },
        { value: 'B1', label: 'B1 - Intermediate' },
        { value: 'B1+', label: 'B1+ - Intermediate+' },
        { value: 'B2', label: 'B2 - Upper-Intermediate' },
        { value: 'B2+', label: 'B2+ - Upper-Intermediate+' },
        { value: 'C1', label: 'C1 - Advanced' },
        { value: 'C1+', label: 'C1+ - Advanced+' },
    ];

    const formatTeacherId = (id: string | null) => {
        if (!id) return 'No Teacher';
        // Convert UUID to a number and format as T01, T02, etc.
        // This is a simple hash-based approach for demo purposes
        const hash = id.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        const number = Math.abs(hash) % 99 + 1; // 1-99
        return `T${number.toString().padStart(2, '0')}`;
    };

    // Search for existing students
    const handleSearchStudents = async (searchValue: string) => {
        setSearchTerm(searchValue);

        if (!searchValue.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            // Search in waiting list - get all waiting list students
            const waitingListResults = await getWaitingListByCriteria();
            const filteredWaitingList = waitingListResults.filter(student =>
                student.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                student.email?.toLowerCase().includes(searchValue.toLowerCase()) ||
                student.phone?.includes(searchValue)
            );

            // Search in already registered students (from all groups)
            // Note: These students exist in the system but may not be actively studying
            const allGroups = useMySchoolStore.getState().groups;
            const allRegisteredStudents: Student[] = [];
            allGroups.forEach(g => {
                g.students.forEach(student => {
                    // Don't include students already in this group
                    if (g.id !== groupId) {
                        allRegisteredStudents.push(student);
                    }
                });
            });

            const filteredRegisteredStudents = allRegisteredStudents.filter(student =>
                student.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                student.email?.toLowerCase().includes(searchValue.toLowerCase()) ||
                student.phone?.includes(searchValue)
            );

            // Combine results and remove duplicates
            const combinedResults = [...filteredWaitingList, ...filteredRegisteredStudents];
            const uniqueResults = combinedResults.filter((student, index, self) =>
                index === self.findIndex(s => s.name === student.name && s.phone === student.phone)
            );

            setSearchResults(uniqueResults);
        } catch (error) {
            console.error('Error searching students:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Add selected student to group
    const handleAddExistingStudent = async (student: WaitingListStudent | Student) => {
        try {
            if ('language' in student) {
                // This is a WaitingListStudent - move from waiting list to group
                await moveFromWaitingListToGroup(student.id, groupId);
            } else {
                // This is an existing Student - add to group (copy student data)
                await addStudentToGroup(groupId, {
                    name: student.name,
                    email: student.email || '',
                    phone: student.phone || '',
                    secondPhone: student.secondPhone || undefined,
                    parentName: student.parentName || undefined,
                    address: student.address || undefined,
                    birthDate: student.birthDate || undefined,
                    totalPaid: 0,
                    groupId: groupId,
                });
            }

            // Clear search and close modal
            setSearchTerm('');
            setSearchResults([]);
            setIsAddStudentModalOpen(false);

            alert(`Student "${student.name}" has been added to the group successfully!`);
        } catch (error) {
            console.error('Error adding existing student:', error);
            alert('Failed to add student. Please try again.');
        }
    };

    // New function to handle attendance status click
    const handleAttendanceClick = async (sessionId: string, studentId: string, currentStatus: AttendanceStatus) => {
        const updateKey = `${sessionId}-${studentId}`;
        if (updatingAttendance.has(updateKey)) return; // Prevent multiple clicks

        setUpdatingAttendance(prev => new Set(prev).add(updateKey));

        const newStatus = getNextAttendanceStatus(currentStatus);
        try {
            await updateAttendance(sessionId, studentId, newStatus);
            // Re-fetch the group to update the attendance in the table
            fetchGroups();
        } catch (error) {
            console.error('Error updating attendance:', error);
            alert('Failed to update attendance. Please try again.');
        } finally {
            setUpdatingAttendance(prev => {
                const newSet = new Set(prev);
                newSet.delete(updateKey);
                return newSet;
            });
        }
    };

    // Helper function to get the next attendance status
    const getNextAttendanceStatus = (currentStatus: AttendanceStatus): AttendanceStatus => {
        switch (currentStatus) {
            case 'default':
                return 'present';
            case 'present':
                return 'absent';
            case 'absent':
                return 'justified';
            case 'justified':
                return 'change';
            case 'change':
                return 'stop';
            case 'stop':
                return 'new';
            case 'new':
                return 'too_late';
            case 'too_late':
                return 'default'; // Cycle back to default
            default:
                return 'default';
        }
    };

    // Handle next group form changes
    const handleNextGroupFormChange = (field: string, value: any) => {
        setNextGroupFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle student selection for next group
    const handleStudentSelectionForNextGroup = (studentId: string) => {
        setNextGroupFormData(prev => ({
            ...prev,
            selectedStudents: prev.selectedStudents.includes(studentId)
                ? prev.selectedStudents.filter(id => id !== studentId)
                : [...prev.selectedStudents, studentId]
        }));
    };

    // Create next group
    const handleCreateNextGroup = async () => {
        if (!nextGroupFormData.teacherId || !nextGroupFormData.startDate || nextGroupFormData.selectedStudents.length === 0) {
            alert('Please fill in all required fields and select at least one student');
            return;
        }

        try {
            // Create the new group
            const newGroup = await addGroup({
                name: `${nextGroupFormData.language} ${nextGroupFormData.level} - ${nextGroupFormData.category} (Next)`,
                teacherId: nextGroupFormData.teacherId,
                startDate: new Date(nextGroupFormData.startDate),
                totalSessions: nextGroupFormData.totalSessions,
                recurringDays: nextGroupFormData.recurringDays,
                price: nextGroupFormData.price,
                language: nextGroupFormData.language,
                level: nextGroupFormData.level,
                category: nextGroupFormData.category,
                startTime: nextGroupFormData.startTime,
                endTime: nextGroupFormData.endTime,
                students: [], // Empty students array initially
            });

            // Add selected students to the new group
            for (const studentId of nextGroupFormData.selectedStudents) {
                const student = uniqueStudents.find(s => s.id === studentId);
                if (student) {
                    await addStudentToGroup(newGroup.id, {
                        name: student.name,
                        email: student.email || '',
                        phone: student.phone || '',
                        secondPhone: student.secondPhone || undefined,
                        parentName: student.parentName || undefined,
                        address: student.address || undefined,
                        birthDate: student.birthDate || undefined,
                        totalPaid: 0,
                        groupId: newGroup.id,
                    });
                }
            }

            // Generate sessions for the new group
            await generateSessions(newGroup.id);

            // Close modal and reset form
            setShowConfigureNextGroupModal(false);
            setNextGroupFormData({
                teacherId: '',
                startDate: '',
                totalSessions: 16,
                recurringDays: [],
                price: 0,
                language: '',
                level: '',
                category: '',
                startTime: '09:00',
                endTime: '11:00',
                selectedStudents: [],
            });

            alert(`Next group created successfully! New group ID: #${newGroup.id.toString().padStart(6, '0')}`);

            // Redirect to the new group
            window.location.href = `/groups/${newGroup.id}`;
        } catch (error) {
            console.error('Error creating next group:', error);
            alert('Failed to create next group. Please try again.');
        }
    };

    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50">
                <Navigation />

                <div className="lg:ml-16">
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
                                    Teacher: {teacher?.name} {group.teacherId ? `(#${formatTeacherId(group.teacherId)})` : ''} • {uniqueStudents.length} students • {group.sessions.length} sessions
                                </p>
                            </div>
                            <div className="flex space-x-3">
                                <Button
                                    onClick={() => setIsAddStudentModalOpen(true)}
                                    className="flex items-center space-x-2"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    <span>Add Existing Student</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleShowWaitingList}
                                    disabled={!group.language || !group.level || !group.category}
                                >
                                    <ClockIcon className="h-5 w-5 mr-2" />
                                    Add from Waiting List
                                </Button>
                                {group.sessions.length === 0 && (
                                    <Button onClick={handleGenerateSessions}>
                                        <CalendarIcon className="h-5 w-5 mr-2" />
                                        Generate Sessions
                                    </Button>
                                )}
                                {(group.progress?.completedSessions || 0) >= group.totalSessions && (
                                    <Button
                                        onClick={() => {
                                            // Initialize form with current group data
                                            setNextGroupFormData({
                                                teacherId: group.teacherId,
                                                startDate: new Date().toISOString().split('T')[0], // Today's date
                                                totalSessions: group.totalSessions,
                                                recurringDays: group.recurringDays,
                                                price: group.price || 0,
                                                language: group.language || '',
                                                level: group.level || '',
                                                category: group.category || '',
                                                startTime: group.startTime || '09:00',
                                                endTime: group.endTime || '11:00',
                                                selectedStudents: uniqueStudents.map(s => s.id), // Include all students initially
                                            });
                                            setShowConfigureNextGroupModal(true);
                                        }}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <PlusIcon className="h-5 w-5 mr-2" />
                                        Configure Next Group
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
                                        <div className="flex items-center justify-between text-base font-semibold bg-orange-50 p-4 rounded-lg border border-orange-200">
                                            <div className="flex items-center space-x-8">
                                                <div>
                                                    <span className="text-orange-700">ID:</span>
                                                    <span className="text-gray-900 ml-2">#{group.id.toString().padStart(6, '0')}</span>
                                                </div>
                                                <div>
                                                    <span className="text-orange-700">Start:</span>
                                                    <span className="text-gray-900 ml-2">{format(new Date(group.startDate), 'MMM dd, yyyy')}</span>
                                                </div>
                                                <div>
                                                    <span className="text-orange-700">Time:</span>
                                                    <span className="text-gray-900 ml-2">
                                                        {group.startTime && group.endTime ? (
                                                            `${formatTimeSimple(group.startTime)}-${formatTimeSimple(group.endTime)}`
                                                        ) : (
                                                            'N/A'
                                                        )}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-orange-700">Progress:</span>
                                                    <span className="text-gray-900 ml-2">
                                                        {group.progress?.completedSessions || 0}/{group.totalSessions}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-orange-700">Days:</span>
                                                    <span className="text-gray-900 ml-2">
                                                        {group.recurringDays.map(day => weekDays[day].substring(0, 3)).join(', ')}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-orange-700">Teacher:</span>
                                                    <span className="text-gray-900 ml-2">{teacher?.name} {group.teacherId ? `(#${formatTeacherId(group.teacherId)})` : ''}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>



                            {/* Sessions */}
                            <div className="lg:col-span-3">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle>Sessions ({group.sessions.length})</CardTitle>
                                                <CardDescription>
                                                    Attendance history for all students and sessions
                                                </CardDescription>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fetchGroups()}
                                                className="flex items-center space-x-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                <span>Refresh</span>
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {group.sessions.length === 0 ? (
                                            <div className="text-center py-8">
                                                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                                <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
                                                <p className="text-gray-500 mb-4">
                                                    Generate sessions to start tracking attendance.
                                                </p>
                                                <Button onClick={handleGenerateSessions}>
                                                    <CalendarIcon className="h-5 w-5 mr-2" />
                                                    Generate Sessions
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Student
                                                            </th>
                                                            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Status
                                                            </th>
                                                            {group.sessions.map((session) => (
                                                                <th key={session.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    {format(session.date, 'MMM dd')}
                                                                </th>
                                                            ))}
                                                            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Call Log
                                                            </th>
                                                            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Payment Status
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {uniqueStudents.map((student) => (
                                                            <tr key={student.id}>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {student.name}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {student.email}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap text-center">
                                                                    <StudentStatusBadge studentId={student.id} groupId={groupId} />
                                                                </td>
                                                                {group.sessions.map((session) => {
                                                                    const attendance = session.attendance && typeof session.attendance === 'object'
                                                                        ? session.attendance[student.id]
                                                                        : 'default';
                                                                    const updateKey = `${session.id}-${student.id}`;
                                                                    const isUpdating = updatingAttendance.has(updateKey);

                                                                    return (
                                                                        <td key={session.id} className="px-3 py-4 whitespace-nowrap text-center">
                                                                            <div
                                                                                className={`${getAttendanceClasses(attendance as AttendanceStatus, 'md')} hover:scale-110 transition-transform duration-200 ${isUpdating ? 'opacity-50' : ''}`}
                                                                                title={`${getAttendanceTitle(attendance as AttendanceStatus)} → ${getAttendanceTitle(getNextAttendanceStatus(attendance as AttendanceStatus))} (Click to change)`}
                                                                                onClick={() => !isUpdating && handleAttendanceClick(session.id, student.id, attendance as AttendanceStatus)}
                                                                                style={{ cursor: isUpdating ? 'not-allowed' : 'pointer' }}
                                                                            >
                                                                                {isUpdating ? (
                                                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mx-auto"></div>
                                                                                ) : (
                                                                                    <span className="font-medium">{getAttendanceDisplayLetter(attendance as AttendanceStatus)}</span>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    );
                                                                })}
                                                                <td className="px-3 py-4 whitespace-nowrap text-center">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleOpenCallLogModal(student)}
                                                                        className="text-blue-600 hover:text-blue-900 hover:bg-blue-100"
                                                                        title="Add Call Log"
                                                                    >
                                                                        <PhoneIcon className="h-5 w-5" />
                                                                    </Button>
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap text-center">
                                                                    <PaymentStatusCell studentId={student.id} groupId={groupId} />
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

                        {/* Add Student Modal */}
                        <Modal
                            isOpen={isAddStudentModalOpen}
                            onClose={() => {
                                setIsAddStudentModalOpen(false);
                                setSearchTerm('');
                                setSearchResults([]);
                            }}
                            title="Add Existing Student"
                        >
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Search for Existing Student *
                                    </label>
                                    <Input
                                        value={searchTerm}
                                        onChange={(e) => handleSearchStudents(e.target.value)}
                                        placeholder="Search by name, email, or phone number..."
                                        className="w-full"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Search for students from the waiting list or already enrolled students
                                    </p>
                                </div>

                                {isSearching && (
                                    <div className="text-center py-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
                                        <p className="text-sm text-gray-500 mt-2">Searching...</p>
                                    </div>
                                )}

                                {!isSearching && searchResults.length > 0 && (
                                    <div className="max-h-96 overflow-y-auto space-y-2">
                                        <div className="text-sm font-medium text-gray-700 mb-2">
                                            Found {searchResults.length} student(s):
                                        </div>
                                        {searchResults.map((student) => (
                                            <div
                                                key={student.id}
                                                className="p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 cursor-pointer transition-colors"
                                                onClick={() => handleAddExistingStudent(student)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium text-gray-900">
                                                            {student.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {student.email || 'No email'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {student.phone || 'No phone'}
                                                        </div>
                                                        {'language' in student && (
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    {student.language}
                                                                </span>
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    {student.level}
                                                                </span>
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                                    {student.category}
                                                                </span>
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                    Waiting List
                                                                </span>
                                                            </div>
                                                        )}
                                                        {!('language' in student) && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                                                Registered Student
                                                            </span>
                                                        )}
                                                    </div>
                                                    <PlusIcon className="h-5 w-5 text-orange-600" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {!isSearching && searchTerm.trim() && searchResults.length === 0 && (
                                    <div className="text-center py-8">
                                        <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                                        <p className="text-gray-500 mb-4">
                                            No existing students match your search criteria.
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            New students should be added through the registrations page.
                                        </p>
                                    </div>
                                )}

                                {!searchTerm.trim() && (
                                    <div className="text-center py-8">
                                        <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Search for Students</h3>
                                        <p className="text-gray-500 mb-4">
                                            Enter a name, email, or phone number to search for students.
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            Search includes waiting list students and registered students from other groups.
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsAddStudentModalOpen(false);
                                        setSearchTerm('');
                                        setSearchResults([]);
                                    }}
                                >
                                    Cancel
                                </Button>
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
                            {editingStudent && (
                                <>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Name *
                                            </label>
                                            <Input
                                                value={editingStudent.name}
                                                onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                                                placeholder="Enter student name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email
                                            </label>
                                            <Input
                                                type="email"
                                                value={editingStudent.email || ''}
                                                onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                                                placeholder="Enter email address"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Phone *
                                            </label>
                                            <Input
                                                value={editingStudent.phone}
                                                onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                                                placeholder="Enter phone number"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Second Phone
                                            </label>
                                            <Input
                                                value={editingStudent.secondPhone || ''}
                                                onChange={(e) => setEditingStudent({ ...editingStudent, secondPhone: e.target.value })}
                                                placeholder="Enter second phone number"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Parent Name
                                            </label>
                                            <Input
                                                value={editingStudent.parentName || ''}
                                                onChange={(e) => setEditingStudent({ ...editingStudent, parentName: e.target.value })}
                                                placeholder="Enter parent name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Address
                                            </label>
                                            <Input
                                                value={editingStudent.address || ''}
                                                onChange={(e) => setEditingStudent({ ...editingStudent, address: e.target.value })}
                                                placeholder="Enter address"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Birth Date
                                            </label>
                                            <Input
                                                type="date"
                                                value={editingStudent.birthDate ? format(new Date(editingStudent.birthDate), 'yyyy-MM-dd') : ''}
                                                onChange={(e) => setEditingStudent({ ...editingStudent, birthDate: new Date(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 mt-6">
                                        <Button variant="outline" onClick={() => {
                                            setIsEditStudentModalOpen(false);
                                            setEditingStudent(null);
                                        }}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleEditStudent}>
                                            Update Student
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Modal>

                        {/* Waiting List Modal */}
                        <Modal
                            isOpen={showWaitingListModal}
                            onClose={() => {
                                setShowWaitingListModal(false);
                                setSelectedStudents([]);
                                setWaitingListStudents([]);
                            }}
                            title="Add Students from Waiting List"
                        >
                            <div className="space-y-4">
                                {waitingListStudents.length === 0 ? (
                                    <div className="text-center py-8">
                                        <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No matching students</h3>
                                        <p className="text-gray-500 mb-4">
                                            No students in the waiting list match this group&apos;s criteria.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-sm text-gray-600 mb-4">
                                            Select students to add to this group:
                                        </div>
                                        <div className="max-h-96 overflow-y-auto space-y-2">
                                            {waitingListStudents.map((student) => (
                                                <div
                                                    key={student.id}
                                                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedStudents.includes(student.id)
                                                        ? 'border-orange-500 bg-orange-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    onClick={() => handleStudentSelection(student.id)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedStudents.includes(student.id)}
                                                                onChange={() => handleStudentSelection(student.id)}
                                                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                            />
                                                            <div>
                                                                <div className="font-medium text-gray-900">
                                                                    {student.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {student.email}
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                        {student.language}
                                                                    </span>
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                        {student.level}
                                                                    </span>
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                                        {student.category}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {selectedStudents.includes(student.id) && (
                                                            <CheckIcon className="h-5 w-5 text-orange-600" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowWaitingListModal(false);
                                        setSelectedStudents([]);
                                        setWaitingListStudents([]);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddFromWaitingList}
                                    disabled={selectedStudents.length === 0}
                                >
                                    Add Selected Students ({selectedStudents.length})
                                </Button>
                            </div>
                        </Modal>

                        {/* Call Log Modal */}
                        <Modal
                            isOpen={isCallLogModalOpen}
                            onClose={() => {
                                setIsCallLogModalOpen(false);
                                setSelectedStudentForCall(null);
                                setCallLogData({
                                    callType: 'payment' as 'payment' | 'activity',
                                    status: 'pending',
                                    notes: '',
                                });
                                setLastPaymentCallNote(null);
                                setGroupRemainingFees(null);
                            }}
                            title={`Add Call Log - ${selectedStudentForCall?.name || 'Student'}`}
                        >
                            <div className="space-y-4">
                                {selectedStudentForCall && (
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <h3 className="text-lg font-medium text-blue-700">{selectedStudentForCall.name}</h3>
                                                <p className="text-sm text-blue-600">{selectedStudentForCall.email}</p>
                                                <p className="text-sm text-blue-600">{selectedStudentForCall.phone}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Call Type *
                                    </label>
                                    <select
                                        value={callLogData.callType}
                                        onChange={(e) => setCallLogData({ ...callLogData, callType: e.target.value as 'payment' | 'activity' })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        <option value="payment">Payment</option>
                                        <option value="activity">Activity</option>
                                    </select>
                                </div>

                                {callLogData.callType === 'payment' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Status *
                                            </label>
                                            <select
                                                value={callLogData.status}
                                                onChange={(e) => setCallLogData({ ...callLogData, status: e.target.value as any })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="coming">Coming</option>
                                                <option value="not_coming">Not Coming</option>
                                            </select>
                                        </div>

                                        {/* Last Payment Call Note Reminder */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Last Payment Call Note (Reminder)
                                            </label>
                                            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                                                <p className="text-sm text-yellow-800">
                                                    {lastPaymentCallNote ? lastPaymentCallNote : 'No previous payment call notes found.'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Remaining Fees for Current Group */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Remaining Fees for This Group
                                            </label>
                                            <div className="bg-red-50 p-3 rounded-md border border-red-200">
                                                <p className="text-sm text-red-800">
                                                    {groupRemainingFees !== null ? `$${groupRemainingFees.toFixed(2)}` : 'Loading...'}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes *
                                    </label>
                                    <textarea
                                        value={callLogData.notes}
                                        onChange={(e) => setCallLogData({ ...callLogData, notes: e.target.value })}
                                        placeholder="Enter call log details..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsCallLogModalOpen(false);
                                        setSelectedStudentForCall(null);
                                        setCallLogData({
                                            callType: 'payment' as 'payment' | 'activity',
                                            status: 'pending',
                                            notes: '',
                                        });
                                        setLastPaymentCallNote(null);
                                        setGroupRemainingFees(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleAddCallLog}>
                                    Add Call Log
                                </Button>
                            </div>
                        </Modal>

                        {/* Configure Next Group Modal */}
                        <Modal
                            isOpen={showConfigureNextGroupModal}
                            onClose={() => {
                                setShowConfigureNextGroupModal(false);
                                setNextGroupFormData({
                                    teacherId: '',
                                    startDate: '',
                                    totalSessions: 16,
                                    recurringDays: [],
                                    price: 0,
                                    language: '',
                                    level: '',
                                    category: '',
                                    startTime: '09:00',
                                    endTime: '11:00',
                                    selectedStudents: [],
                                });
                            }}
                            title="Configure Next Group"
                            maxWidth="4xl"
                        >
                            <div className="space-y-6">
                                {/* Group Configuration */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Teacher *
                                        </label>
                                        <select
                                            value={nextGroupFormData.teacherId}
                                            onChange={(e) => handleNextGroupFormChange('teacherId', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            required
                                        >
                                            <option value="">Select Teacher</option>
                                            {teachers.map((teacher) => (
                                                <option key={teacher.id} value={teacher.id}>
                                                    {teacher.name} (#{formatTeacherId(teacher.id)})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Start Date *
                                        </label>
                                        <Input
                                            type="date"
                                            value={nextGroupFormData.startDate}
                                            onChange={(e) => handleNextGroupFormChange('startDate', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Total Sessions
                                        </label>
                                        <Input
                                            type="number"
                                            value={nextGroupFormData.totalSessions}
                                            onChange={(e) => handleNextGroupFormChange('totalSessions', parseInt(e.target.value))}
                                            min="1"
                                            max="100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Price (DA)
                                        </label>
                                        <Input
                                            type="number"
                                            value={nextGroupFormData.price}
                                            onChange={(e) => handleNextGroupFormChange('price', parseFloat(e.target.value))}
                                            min="0"
                                            step="50"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Language
                                        </label>
                                        <select
                                            value={nextGroupFormData.language}
                                            onChange={(e) => handleNextGroupFormChange('language', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        >
                                            <option value="">Select Language</option>
                                            {languages.map((lang) => (
                                                <option key={lang.value} value={lang.value}>
                                                    {lang.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Level
                                        </label>
                                        <select
                                            value={nextGroupFormData.level}
                                            onChange={(e) => handleNextGroupFormChange('level', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        >
                                            <option value="">Select Level</option>
                                            {levels.map((level) => (
                                                <option key={level.value} value={level.value}>
                                                    {level.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Category
                                        </label>
                                        <select
                                            value={nextGroupFormData.category}
                                            onChange={(e) => handleNextGroupFormChange('category', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        >
                                            <option value="">Select Category</option>
                                            <option value="Children">Children</option>
                                            <option value="Teenagers">Teenagers</option>
                                            <option value="Adults">Adults</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Start Time
                                        </label>
                                        <Input
                                            type="time"
                                            value={nextGroupFormData.startTime}
                                            onChange={(e) => handleNextGroupFormChange('startTime', e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            End Time
                                        </label>
                                        <Input
                                            type="time"
                                            value={nextGroupFormData.endTime}
                                            onChange={(e) => handleNextGroupFormChange('endTime', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Recurring Days */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Recurring Days
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {weekDays.map((day, index) => (
                                            <label key={index} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={nextGroupFormData.recurringDays.includes(index)}
                                                    onChange={(e) => {
                                                        const newDays = e.target.checked
                                                            ? [...nextGroupFormData.recurringDays, index]
                                                            : nextGroupFormData.recurringDays.filter(d => d !== index);
                                                        handleNextGroupFormChange('recurringDays', newDays);
                                                    }}
                                                    className="mr-2"
                                                />
                                                <span className="text-sm">{day}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Student Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Active Students ({nextGroupFormData.selectedStudents.length} selected)
                                    </label>
                                    <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-4">
                                        {uniqueStudents.map((student) => (
                                            <div
                                                key={student.id}
                                                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                                                onClick={() => handleStudentSelectionForNextGroup(student.id)}
                                            >
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={nextGroupFormData.selectedStudents.includes(student.id)}
                                                        onChange={() => handleStudentSelectionForNextGroup(student.id)}
                                                        className="mr-3"
                                                    />
                                                    <div>
                                                        <div className="font-medium">{student.name}</div>
                                                        <div className="text-sm text-gray-500">{student.email}</div>
                                                    </div>
                                                </div>
                                                <StudentStatusBadge studentId={student.id} groupId={groupId} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowConfigureNextGroupModal(false);
                                        setNextGroupFormData({
                                            teacherId: '',
                                            startDate: '',
                                            totalSessions: 16,
                                            recurringDays: [],
                                            price: 0,
                                            language: '',
                                            level: '',
                                            category: '',
                                            startTime: '09:00',
                                            endTime: '11:00',
                                            selectedStudents: [],
                                        });
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateNextGroup}
                                    className="bg-green-600 hover:bg-green-700"
                                    disabled={!nextGroupFormData.teacherId || !nextGroupFormData.startDate || nextGroupFormData.selectedStudents.length === 0}
                                >
                                    Create Next Group
                                </Button>
                            </div>
                        </Modal>
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
} 