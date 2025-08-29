'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Navigation from '../../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useMySchoolStore } from '../../store';
import AuthGuard from '../../components/AuthGuard';
import { Teacher, Session } from '../../types';
import { GlobalKeyboardShortcuts } from '../../components/GlobalKeyboardShortcuts';
import { supabase } from '../../lib/supabase';
import {
    PlusIcon,
    UsersIcon,
    PencilIcon,
    TrashIcon,
    EnvelopeIcon,
    PhoneIcon,
    MagnifyingGlassIcon,
    ClipboardDocumentCheckIcon,
    CalendarIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';

export default function TeachersPage() {
    const {
        teachers,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        groups,
        fetchTeachers,
        loading,
        error
    } = useMySchoolStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [showTeacherDetailModal, setShowTeacherDetailModal] = useState(false);
    const [showEvaluationModal, setShowEvaluationModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [teacherAttendance, setTeacherAttendance] = useState<{ [key: string]: { [sessionId: string]: 'present' | 'late' | 'absent' | 'justified' } }>({});
    const [teacherHistory, setTeacherHistory] = useState<{ [teacherId: string]: Array<{ date: string, status: 'present' | 'late' | 'absent' | 'justified', groupName: string, sessionId: string }> }>({});

    // History modal states
    const [historySearchTerm, setHistorySearchTerm] = useState('');
    const [selectedHistoryTeacher, setSelectedHistoryTeacher] = useState<Teacher | null>(null);
    const [selectedHistoryGroup, setSelectedHistoryGroup] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
    });

    // Search state
    const [searchTerm, setSearchTerm] = useState('');

    // Form persistence states
    const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
    const [pendingFormData, setPendingFormData] = useState<any>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Fetch teachers on component mount
    React.useEffect(() => {
        fetchTeachers();
    }, [fetchTeachers]);

    // Filter teachers based on search term
    const filteredTeachers = useMemo(() => {
        return teachers.filter(teacher => {
            const matchesSearch = searchTerm === '' ||
                teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                teacher.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                formatTeacherId(teacher.id).toLowerCase().includes(searchTerm.toLowerCase());

            return matchesSearch;
        });
    }, [teachers, searchTerm]);

    // Keyboard navigation for form fields
    React.useEffect(() => {
        const handleKeyNavigation = (e: KeyboardEvent) => {
            if (!isCreateModalOpen) return;

            const focusableElements = document.querySelectorAll(
                'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
            ) as NodeListOf<HTMLElement>;

            const currentIndex = Array.from(focusableElements).findIndex(el => el === document.activeElement);

            if (currentIndex !== -1) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    // Move to next field on Enter
                    const nextIndex = (currentIndex + 1) % focusableElements.length;
                    focusableElements[nextIndex].focus();
                } else if (e.key === 'Tab') {
                    e.preventDefault();
                    // Handle Tab navigation
                    if (e.shiftKey) {
                        // Move backward
                        const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
                        focusableElements[prevIndex].focus();
                    } else {
                        // Move forward
                        const nextIndex = (currentIndex + 1) % focusableElements.length;
                        focusableElements[nextIndex].focus();
                    }
                }
                // Don't prevent default for other keys (like typing letters)
            }
        };

        document.addEventListener('keydown', handleKeyNavigation);

        return () => {
            document.removeEventListener('keydown', handleKeyNavigation);
        };
    }, [isCreateModalOpen, hasUnsavedChanges, formData]);

    // Form persistence effects
    React.useEffect(() => {
        if (isCreateModalOpen) {
            loadFormFromStorage();
        } else {
            saveFormToStorage();
        }
    }, [isCreateModalOpen]);

    // Load teacher history when history modal opens
    React.useEffect(() => {
        if (showHistoryModal && teachers.length > 0) {
            loadTeacherHistory();
        }
    }, [showHistoryModal, teachers]);

    // Load existing evaluations when evaluation modal opens or date changes
    React.useEffect(() => {
        if (showEvaluationModal && selectedDate && teachers.length > 0) {
            loadExistingEvaluations();
        }
    }, [showEvaluationModal, selectedDate, teachers]);

    const handleCreateTeacher = async () => {
        if (!formData.name || !formData.email) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            await addTeacher(formData);

            // Reset form
            resetForm();
            setIsCreateModalOpen(false);
        } catch (error) {
            console.error('Error creating teacher:', error);
            alert('Failed to create teacher. Please try again.');
        }
    };

    const handleEditTeacher = async () => {
        if (!editingTeacher || !formData.name || !formData.email) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            await updateTeacher(editingTeacher.id, formData);

            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
            });

            setEditingTeacher(null);
            setIsEditModalOpen(false);
        } catch (error) {
            console.error('Error updating teacher:', error);
            alert('Failed to update teacher. Please try again.');
        }
    };

    const handleEditClick = (teacher: Teacher) => {
        setEditingTeacher(teacher);
        setFormData({
            name: teacher.name,
            email: teacher.email,
            phone: teacher.phone || '',
        });
        setIsEditModalOpen(true);
    };

    const handleDeleteTeacher = async (teacherId: string) => {
        const teacherGroups = groups.filter(group => group.teacherId === teacherId);

        if (teacherGroups.length > 0) {
            alert('Cannot delete teacher who has assigned groups. Please reassign or delete the groups first.');
            return;
        }

        if (confirm('Are you sure you want to delete this teacher?')) {
            try {
                await deleteTeacher(teacherId);
            } catch (error) {
                console.error('Error deleting teacher:', error);
                alert('Failed to delete teacher. Please try again.');
            }
        }
    };

    const handleRowClick = (teacher: Teacher) => {
        setSelectedTeacher(teacher);
        setShowTeacherDetailModal(true);
    };

    const formatTeacherId = (id: string) => {
        // Convert UUID to a number and format as T01, T02, etc.
        // This is a simple hash-based approach for demo purposes
        const hash = id.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        const number = Math.abs(hash) % 99 + 1; // 1-99
        return `T${number.toString().padStart(2, '0')}`;
    };

    const getTeacherStats = (teacherId: string) => {
        const teacherGroups = groups.filter(group => group.teacherId === teacherId);
        return {
            groups: teacherGroups.length,
            students: teacherGroups.reduce((sum, group) => sum + group.students.length, 0),
            sessions: teacherGroups.reduce((sum, group) => sum + (group.sessions?.length || 0), 0)
        };
    };

    // Teacher Attendance Functions
    const fetchTeacherAttendance = async (teacherId: string, startDate?: string, endDate?: string) => {
        try {
            let query = supabase
                .from('teacher_attendance')
                .select(`
                    *,
                    sessions!inner(
                        id,
                        date,
                        session_number,
                        topic
                    ),
                    groups!inner(
                        id,
                        name
                    )
                `)
                .eq('teacher_id', teacherId)
                .order('date', { ascending: false });

            if (startDate) {
                query = query.gte('date', startDate);
            }
            if (endDate) {
                query = query.lte('date', endDate);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching teacher attendance:', error);
            return [];
        }
    };

    // Calculate session number for a given session (same logic as attendance page)
    const getSessionNumber = (session: Session, allSessions: Session[]): number => {
        if (!allSessions || allSessions.length === 0) return 1;

        // Sort sessions by date
        const sortedSessions = [...allSessions].sort((a, b) => {
            const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date;
            const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date;
            return dateA.getTime() - dateB.getTime();
        });

        // Find the index of the current session
        const sessionIndex = sortedSessions.findIndex(s => s.id === session.id);
        return sessionIndex >= 0 ? sessionIndex + 1 : 1;
    };

    const checkTeacherAttendanceTable = async () => {
        try {
            console.log('🔍 Checking if teacher_attendance table exists...');

            // Try a simple query to check if table exists
            const { data, error } = await supabase
                .from('teacher_attendance')
                .select('id')
                .limit(1);

            if (error) {
                console.error('❌ Teacher attendance table check failed:', error);
                console.error('❌ Table check error details:', {
                    message: error.message || 'No message',
                    details: error.details || 'No details',
                    hint: error.hint || 'No hint',
                    code: error.code || 'No code'
                });

                // Check if it's a table doesn't exist error
                if (error.code === '42P01') {
                    console.error('❌ Table "teacher_attendance" does not exist');
                    alert('The teacher attendance table does not exist. Please run the database migration first.');
                } else if (error.code === '42501') {
                    console.error('❌ Permission denied accessing table');
                    alert('Permission denied. Please check your database access rights.');
                } else {
                    console.error('❌ Unknown database error:', error.code);
                    alert('Database error occurred. Please check the console for details.');
                }

                return false;
            }

            console.log('✅ Teacher attendance table exists and is accessible');
            return true;
        } catch (error: any) {
            console.error('❌ Error checking teacher attendance table:', error);
            console.error('❌ Table check error details:', {
                message: error?.message || 'No message available',
                details: error?.details || 'No details available',
                hint: error?.hint || 'No hint available',
                code: error?.code || 'No code available',
                stack: error?.stack || 'No stack available'
            });
            return false;
        }
    };

    const saveTeacherAttendance = async (attendanceData: Array<{
        teacherId: string;
        sessionId: string;
        groupId: number;
        date: string;
        status: 'present' | 'late' | 'absent' | 'sick' | 'justified' | 'default';
        notes?: string;
    }>) => {
        try {
            console.log('🔄 Saving teacher attendance data:', attendanceData);

            // Direct database check - try to access the table
            console.log('🔍 Direct database check...');
            try {
                const { data: directCheck, error: directCheckError } = await supabase
                    .from('teacher_attendance')
                    .select('id')
                    .limit(1);

                if (directCheckError) {
                    console.error('❌ Direct table access failed:', directCheckError);
                    console.error('❌ Direct check error details:', {
                        message: directCheckError.message || 'No message',
                        details: directCheckError.details || 'No details',
                        hint: directCheckError.hint || 'No hint',
                        code: directCheckError.code || 'No code'
                    });

                    // Check specific error codes
                    if (directCheckError.code === '42P01') {
                        console.error('❌ Table "teacher_attendance" does not exist');
                        alert('The teacher attendance table does not exist. Please run the database migration first.');
                        return false;
                    } else if (directCheckError.code === '42501') {
                        console.error('❌ Permission denied accessing table');
                        alert('Permission denied. Please check your database access rights.');
                        return false;
                    } else {
                        console.error('❌ Unknown database error:', directCheckError.code);
                        alert('Database error occurred. Please check the console for details.');
                        return false;
                    }
                } else {
                    console.log('✅ Direct table access successful');
                }
            } catch (directError: any) {
                console.error('❌ Direct table access error:', directError);
                console.error('❌ Direct error details:', {
                    message: directError?.message || 'No message available',
                    details: directError?.details || 'No details available',
                    hint: directError?.hint || 'No hint available',
                    code: directError?.code || 'No code available',
                    stack: directError?.stack || 'No stack available'
                });
                return false;
            }

            // Validate input data
            if (!attendanceData || attendanceData.length === 0) {
                console.error('❌ No attendance data provided');
                return false;
            }

            // Validate each record
            for (const record of attendanceData) {
                if (!record.teacherId || !record.sessionId || !record.groupId || !record.date || !record.status) {
                    console.error('❌ Invalid record data:', record);
                    return false;
                }
            }

            // First, delete any existing attendance records for these sessions
            const sessionIds = attendanceData.map(d => d.sessionId);
            console.log('🗑️ Deleting existing records for sessions:', sessionIds);

            try {
                const { error: deleteError } = await supabase
                    .from('teacher_attendance')
                    .delete()
                    .in('session_id', sessionIds);

                if (deleteError) {
                    console.error('❌ Error deleting existing records:', deleteError);
                    console.error('❌ Delete error details:', {
                        message: deleteError.message || 'No message',
                        details: deleteError.details || 'No details',
                        hint: deleteError.hint || 'No hint',
                        code: deleteError.code || 'No code'
                    });
                    console.error('❌ Delete error object:', JSON.stringify(deleteError, null, 2));
                    throw deleteError;
                }
                console.log('✅ Successfully deleted existing records');
            } catch (deleteException: any) {
                console.error('❌ Exception during delete:', deleteException);
                console.error('❌ Delete exception details:', {
                    message: deleteException?.message || 'No message',
                    details: deleteException?.details || 'No details',
                    hint: deleteException?.hint || 'No hint',
                    code: deleteException?.code || 'No code',
                    stack: deleteException?.stack || 'No stack'
                });
                throw deleteException;
            }

            // Prepare data for insertion
            const insertData = attendanceData.map(data => ({
                teacher_id: data.teacherId,
                session_id: data.sessionId,
                group_id: data.groupId,
                date: data.date,
                status: data.status,
                notes: data.notes || null,
                evaluated_by: null // Set to null for now, can be updated later
            }));

            console.log('📝 Inserting new attendance records:', insertData);

            // Insert new attendance records
            try {
                console.log('📝 Attempting to insert records...');
                const { data: insertResult, error: insertError } = await supabase
                    .from('teacher_attendance')
                    .insert(insertData)
                    .select();

                if (insertError) {
                    console.error('❌ Error inserting new records:', insertError);
                    console.error('❌ Insert error details:', {
                        message: insertError.message || 'No message',
                        details: insertError.details || 'No details',
                        hint: insertError.hint || 'No hint',
                        code: insertError.code || 'No code'
                    });
                    console.error('❌ Insert error object:', JSON.stringify(insertError, null, 2));
                    throw insertError;
                }

                console.log('✅ Successfully inserted attendance records:', insertResult);
                return true;
            } catch (insertException: any) {
                console.error('❌ Exception during insert:', insertException);
                console.error('❌ Insert exception details:', {
                    message: insertException?.message || 'No message',
                    details: insertException?.details || 'No details',
                    hint: insertException?.hint || 'No hint',
                    code: insertException?.code || 'No code',
                    stack: insertException?.stack || 'No stack'
                });
                throw insertException;
            }
        } catch (error: any) {
            console.error('❌ Error saving teacher attendance:', error);
            console.error('❌ Error details:', {
                message: error?.message || 'No message available',
                details: error?.details || 'No details available',
                hint: error?.hint || 'No hint available',
                code: error?.code || 'No code available',
                stack: error?.stack || 'No stack available'
            });
            return false;
        }
    };

    // Load existing evaluations for the selected date
    const loadExistingEvaluations = async () => {
        try {
            console.log('🔄 Loading existing evaluations for date:', selectedDate);

            // Get all teacher attendance records for the selected date
            const { data: existingEvaluations, error } = await supabase
                .from('teacher_attendance')
                .select('*')
                .eq('date', selectedDate);

            if (error) {
                console.error('Error loading existing evaluations:', error);
                return;
            }

            // Convert to the format expected by teacherAttendance state
            const newAttendanceState: { [key: string]: { [sessionId: string]: 'present' | 'late' | 'absent' | 'justified' } } = {};

            existingEvaluations.forEach(evaluation => {
                if (!newAttendanceState[evaluation.teacher_id]) {
                    newAttendanceState[evaluation.teacher_id] = {};
                }
                newAttendanceState[evaluation.teacher_id][evaluation.session_id] = evaluation.status;
            });

            console.log('📊 Loaded existing evaluations:', newAttendanceState);
            setTeacherAttendance(newAttendanceState);
        } catch (error) {
            console.error('Error loading existing evaluations:', error);
        }
    };

    const loadTeacherHistory = async () => {
        try {
            const newHistory: { [teacherId: string]: Array<{ date: string, status: 'present' | 'late' | 'absent' | 'justified', groupName: string, sessionId: string }> } = {};

            for (const teacher of teachers) {
                const attendance = await fetchTeacherAttendance(teacher.id);
                if (attendance.length > 0) {
                    newHistory[teacher.id] = attendance.map(record => ({
                        date: record.date,
                        status: record.status,
                        groupName: record.groups.name,
                        sessionId: record.session_id
                    }));
                }
            }

            setTeacherHistory(newHistory);
        } catch (error) {
            console.error('Error loading teacher history:', error);
        }
    };

    // Refresh teacher history when groups are updated (e.g., after session rescheduling)
    useEffect(() => {
        if (groups.length > 0 && teachers.length > 0) {
            loadTeacherHistory();
        }
    }, [groups, teachers]);

    // Listen for session rescheduling events and refresh teacher evaluations
    useEffect(() => {
        const handleSessionRescheduled = () => {
            // Refresh teacher history when sessions are rescheduled
            loadTeacherHistory();
        };

        // Add event listener for session rescheduling
        window.addEventListener('sessionRescheduled', handleSessionRescheduled);

        return () => {
            window.removeEventListener('sessionRescheduled', handleSessionRescheduled);
        };
    }, []);

    // Form persistence functions
    const saveFormToStorage = () => {
        if (hasUnsavedChanges) {
            localStorage.setItem('teacherFormData', JSON.stringify({
                ...formData,
                timestamp: Date.now()
            }));
        }
    };

    const loadFormFromStorage = () => {
        const saved = localStorage.getItem('teacherFormData');
        if (saved) {
            const data = JSON.parse(saved);
            const isRecent = Date.now() - data.timestamp < 24 * 60 * 60 * 1000; // 24 hours
            if (isRecent) {
                setFormData({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                });
                setHasUnsavedChanges(true);
                alert('Unsaved form data has been restored.');
            }
        }
    };

    const clearFormStorage = () => {
        localStorage.removeItem('teacherFormData');
    };

    const handleFormChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setHasUnsavedChanges(true);
    };

    const handleModalClose = () => {
        if (hasUnsavedChanges) {
            setShowUnsavedWarning(true);
        } else {
            setIsCreateModalOpen(false);
            resetForm();
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
        });
        setHasUnsavedChanges(false);
        clearFormStorage();
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

                        {/* Fixed Top Section */}
                        <div className="sticky top-0 bg-gray-50 pt-8 pb-4 z-10">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Teachers</h1>
                                    <p className="mt-2 text-gray-600">
                                        Manage your teaching staff and their assignments
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowEvaluationModal(true);
                                            setTeacherAttendance({}); // Reset form when opening
                                        }}
                                    >
                                        <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" />
                                        Evaluate
                                    </Button>
                                    <Button onClick={() => setIsCreateModalOpen(true)}>
                                        <PlusIcon className="h-5 w-5 mr-2" />
                                        Add Teacher
                                    </Button>
                                </div>
                            </div>

                            {/* Search */}
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                                        Search Teachers
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                <Input
                                                    type="text"
                                                    placeholder="Search by name, email, phone, or teacher ID..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>
                                        {searchTerm && (
                                            <Button
                                                variant="outline"
                                                onClick={() => setSearchTerm('')}
                                                className="whitespace-nowrap"
                                            >
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Scrollable Table Section */}
                        <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
                            {filteredTeachers.length > 0 ? (
                                /* Teachers Table */
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Teachers ({filteredTeachers.length})</CardTitle>
                                        <CardDescription>
                                            All teaching staff and their assignments
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-orange-50 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                                                            Teacher
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                                                            Contact
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                                                            Groups
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {filteredTeachers.map((teacher) => {
                                                        const stats = getTeacherStats(teacher.id);
                                                        return (
                                                            <tr
                                                                key={teacher.id}
                                                                className="hover:bg-orange-50 transition-colors cursor-pointer"
                                                                onClick={() => handleRowClick(teacher)}
                                                            >
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="flex items-center">
                                                                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                                                                            <UsersIcon className="h-5 w-5 text-orange-600" />
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                                                                            <div className="text-sm text-gray-500">Teacher ID: #{formatTeacherId(teacher.id)}</div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="space-y-1">
                                                                        <div className="flex items-center text-sm text-gray-900">
                                                                            <EnvelopeIcon className="h-4 w-4 mr-2 text-orange-500" />
                                                                            <span>{teacher.email}</span>
                                                                        </div>
                                                                        {teacher.phone && (
                                                                            <div className="flex items-center text-sm text-gray-500">
                                                                                <PhoneIcon className="h-4 w-4 mr-2 text-orange-500" />
                                                                                <span>{teacher.phone}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="flex items-center">
                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                                            {stats.groups} {stats.groups === 1 ? 'group' : 'groups'}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                /* Empty State */
                                <Card>
                                    <CardContent className="p-12 text-center">
                                        <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            {teachers.length === 0 ? 'No teachers yet' : 'No teachers found'}
                                        </h3>
                                        <p className="text-gray-500 mb-6">
                                            {teachers.length === 0
                                                ? 'Add your first teacher to start creating groups'
                                                : 'Try adjusting your search criteria'
                                            }
                                        </p>
                                        {teachers.length === 0 && (
                                            <Button onClick={() => setIsCreateModalOpen(true)}>
                                                <PlusIcon className="h-5 w-5 mr-2" />
                                                Add First Teacher
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Create Teacher Modal */}
                    <Modal
                        isOpen={isCreateModalOpen}
                        onClose={handleModalClose}
                        title="Add New Teacher"
                    >
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Name *
                                </label>
                                <Input
                                    value={formData.name || ''}
                                    onChange={(e) => handleFormChange('name', e.target.value)}
                                    placeholder="Enter teacher name"
                                    required
                                    tabIndex={1}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email *
                                </label>
                                <Input
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={(e) => handleFormChange('email', e.target.value)}
                                    placeholder="Enter email address"
                                    required
                                    tabIndex={2}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone (Optional)
                                </label>
                                <Input
                                    type="tel"
                                    value={formData.phone || ''}
                                    onChange={(e) => handleFormChange('phone', e.target.value)}
                                    placeholder="Enter phone number"
                                    tabIndex={3}
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    tabIndex={4}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleCreateTeacher} tabIndex={5}>
                                    Add Teacher
                                </Button>
                            </div>
                        </div>
                    </Modal>

                    {/* Unsaved Changes Warning Modal */}
                    <Modal
                        isOpen={showUnsavedWarning}
                        onClose={() => setShowUnsavedWarning(false)}
                        title="Unsaved Changes"
                    >
                        <div className="space-y-4">
                            <p className="text-gray-600">
                                You have unsaved changes. Are you sure you want to close without saving?
                            </p>
                            <div className="flex justify-end space-x-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowUnsavedWarning(false)}
                                >
                                    Continue Editing
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowUnsavedWarning(false);
                                        setIsCreateModalOpen(false);
                                        resetForm();
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    Close Without Saving
                                </Button>
                            </div>
                        </div>
                    </Modal>
                </div>
            </div>

            {/* Edit Teacher Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingTeacher(null);
                }}
                title="Edit Teacher"
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Name *
                        </label>
                        <Input
                            value={formData.name || ''}
                            onChange={(e) => handleFormChange('name', e.target.value)}
                            placeholder="Enter teacher name"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                        </label>
                        <Input
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => handleFormChange('email', e.target.value)}
                            placeholder="Enter email address"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone (Optional)
                        </label>
                        <Input
                            type="tel"
                            value={formData.phone || ''}
                            onChange={(e) => handleFormChange('phone', e.target.value)}
                            placeholder="Enter phone number"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsEditModalOpen(false);
                                setEditingTeacher(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleEditTeacher}>
                            Update Teacher
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Teacher Detail Modal */}
            <Modal
                isOpen={showTeacherDetailModal}
                onClose={() => {
                    setShowTeacherDetailModal(false);
                    setSelectedTeacher(null);
                }}
                title={`Teacher Details - ${selectedTeacher?.name}`}
                maxWidth="2xl"
            >
                {selectedTeacher && (
                    <div className="space-y-6">
                        {/* Personal Information */}
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                            <h3 className="text-sm font-medium text-orange-700 mb-3">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2">
                                    <UsersIcon className="h-4 w-4 text-orange-500" />
                                    <div>
                                        <div className="text-xs font-medium text-orange-700">Name</div>
                                        <div className="text-sm text-gray-900">{selectedTeacher.name}</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <EnvelopeIcon className="h-4 w-4 text-orange-500" />
                                    <div>
                                        <div className="text-xs font-medium text-orange-700">Email</div>
                                        <div className="text-sm text-gray-900">{selectedTeacher.email}</div>
                                    </div>
                                </div>
                                {selectedTeacher.phone && (
                                    <div className="flex items-center space-x-2">
                                        <PhoneIcon className="h-4 w-4 text-orange-500" />
                                        <div>
                                            <div className="text-xs font-medium text-orange-700">Phone</div>
                                            <div className="text-sm text-gray-900">{selectedTeacher.phone}</div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center space-x-2">
                                    <UsersIcon className="h-4 w-4 text-orange-500" />
                                    <div>
                                        <div className="text-xs font-medium text-orange-700">Teacher ID</div>
                                        <div className="text-sm text-gray-900">#{formatTeacherId(selectedTeacher.id)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Statistics */}
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Statistics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {(() => {
                                    const stats = getTeacherStats(selectedTeacher.id);
                                    return (
                                        <>
                                            <div className="text-center p-3 bg-white rounded-lg border">
                                                <div className="text-2xl font-bold text-orange-600">{stats.groups}</div>
                                                <div className="text-xs text-gray-500">{stats.groups === 1 ? 'Group' : 'Groups'}</div>
                                            </div>
                                            <div className="text-center p-3 bg-white rounded-lg border">
                                                <div className="text-2xl font-bold text-blue-600">{stats.students}</div>
                                                <div className="text-xs text-gray-500">{stats.students === 1 ? 'Student' : 'Students'}</div>
                                            </div>
                                            <div className="text-center p-3 bg-white rounded-lg border">
                                                <div className="text-2xl font-bold text-green-600">{stats.sessions}</div>
                                                <div className="text-xs text-gray-500">{stats.sessions === 1 ? 'Session' : 'Sessions'}</div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Assigned Groups */}
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Assigned Groups</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {groups.filter(group => group.teacherId === selectedTeacher.id).length > 0 ? (
                                    groups.filter(group => group.teacherId === selectedTeacher.id).map((group) => (
                                        <div key={group.id} className="p-3 bg-white rounded-lg border hover:bg-orange-50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{group.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        Group #{group.id.toString().padStart(6, '0')} • {group.students.length} students
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                        {group.language || 'N/A'}
                                                    </span>
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {group.level || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-gray-500 text-center py-4">
                                        No groups assigned yet
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowTeacherDetailModal(false);
                                    handleEditClick(selectedTeacher);
                                }}
                                className="text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
                            >
                                <PencilIcon className="h-4 w-4 mr-2" />
                                Edit Teacher
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Teacher Evaluation Modal */}
            <Modal
                isOpen={showEvaluationModal}
                onClose={() => setShowEvaluationModal(false)}
                title="Teacher Evaluation"
            >
                <div className="space-y-6">
                    {/* Header with History Button */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">Select Date and Evaluate Teachers</h3>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowHistoryModal(true)}
                                className="text-sm"
                            >
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                History
                            </Button>

                        </div>
                    </div>

                    {/* Date Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <CalendarIcon className="h-4 w-4 inline mr-1" />
                            Select Date
                        </label>
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full"
                        />
                    </div>

                    {/* Teachers with Groups */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Teachers with Groups on {new Date(selectedDate).toLocaleDateString()}
                        </h3>

                        {(() => {
                            // Get teachers who have groups with sessions on the selected date
                            const teachersWithGroups = teachers.filter(teacher => {
                                const teacherGroups = groups.filter(group => group.teacherId === teacher.id);
                                return teacherGroups.some(group =>
                                    group.sessions?.some(session =>
                                        new Date(session.date).toISOString().split('T')[0] === selectedDate
                                    )
                                );
                            });

                            if (teachersWithGroups.length === 0) {
                                return (
                                    <div className="text-center py-8 text-gray-500">
                                        <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                        <p>No teachers have groups scheduled for this date.</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-4">
                                    {teachersWithGroups.map(teacher => {
                                        const teacherGroups = groups.filter(group =>
                                            group.teacherId === teacher.id &&
                                            group.sessions?.some(session => new Date(session.date).toISOString().split('T')[0] === selectedDate)
                                        );

                                        return (
                                            <div key={teacher.id} className="border rounded-lg p-4 bg-gray-50">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                                                            <UsersIcon className="h-5 w-5 text-orange-600" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-gray-900">{teacher.name}</h4>
                                                            <p className="text-sm text-gray-500">ID: {formatTeacherId(teacher.id)}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Groups and Sessions */}
                                                <div className="space-y-3">
                                                    {teacherGroups.map(group => {
                                                        const groupSessions = group.sessions?.filter(session =>
                                                            new Date(session.date).toISOString().split('T')[0] === selectedDate
                                                        ) || [];

                                                        return (
                                                            <div key={group.id} className="bg-white rounded-lg p-3 border">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div>
                                                                        <h5 className="font-medium text-gray-900">{group.name}</h5>
                                                                        <p className="text-sm text-gray-500">
                                                                            Group #{group.id.toString().padStart(6, '0')}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Sessions */}
                                                                <div className="space-y-2">
                                                                    {groupSessions.map((session, index) => (
                                                                        <div key={session.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                                            <div className="flex items-center">
                                                                                <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                                                                                <span className="text-sm text-gray-700">
                                                                                    Session #{getSessionNumber(session, group.sessions || [])} - {new Date(session.date).toLocaleDateString()}
                                                                                </span>
                                                                            </div>

                                                                            {/* Attendance Status */}
                                                                            <div className="flex items-center space-x-2">
                                                                                <span className="text-xs text-gray-500">Status:</span>
                                                                                <select
                                                                                    value={teacherAttendance[teacher.id]?.[session.id] || '-'}
                                                                                    onChange={(e) => {
                                                                                        const newStatus = e.target.value;
                                                                                        if (newStatus === '-') {
                                                                                            // Remove the status if "-" is selected
                                                                                            setTeacherAttendance(prev => {
                                                                                                const newState = { ...prev };
                                                                                                if (newState[teacher.id]) {
                                                                                                    delete newState[teacher.id][session.id];
                                                                                                    if (Object.keys(newState[teacher.id]).length === 0) {
                                                                                                        delete newState[teacher.id];
                                                                                                    }
                                                                                                }
                                                                                                return newState;
                                                                                            });
                                                                                        } else {
                                                                                            // Set the selected status
                                                                                            setTeacherAttendance(prev => ({
                                                                                                ...prev,
                                                                                                [teacher.id]: {
                                                                                                    ...prev[teacher.id],
                                                                                                    [session.id]: newStatus as 'present' | 'late' | 'absent' | 'justified'
                                                                                                }
                                                                                            }));
                                                                                        }
                                                                                    }}
                                                                                    className="text-xs border rounded px-2 py-1"
                                                                                >
                                                                                    <option value="-">-</option>
                                                                                    <option value="present">Present</option>
                                                                                    <option value="late">Late</option>
                                                                                    <option value="absent">Absent</option>
                                                                                    <option value="justified">Justified</option>
                                                                                </select>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setShowEvaluationModal(false);
                            setTeacherAttendance({}); // Reset form when closing
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={async () => {
                            try {
                                // Prepare attendance data for database
                                const attendanceData: Array<{
                                    teacherId: string;
                                    sessionId: string;
                                    groupId: number;
                                    date: string;
                                    status: 'present' | 'late' | 'absent' | 'justified';
                                    notes?: string;
                                }> = [];

                                // Process each teacher's attendance
                                Object.keys(teacherAttendance).forEach(teacherId => {
                                    const teacher = teachers.find(t => t.id === teacherId);
                                    if (!teacher) return;

                                    const teacherGroups = groups.filter(group =>
                                        group.teacherId === teacherId &&
                                        group.sessions?.some(session => new Date(session.date).toISOString().split('T')[0] === selectedDate)
                                    );

                                    teacherGroups.forEach(group => {
                                        const groupSessions = group.sessions?.filter(session =>
                                            new Date(session.date).toISOString().split('T')[0] === selectedDate
                                        ) || [];

                                        groupSessions.forEach(session => {
                                            const status = teacherAttendance[teacherId]?.[session.id];
                                            if (status) {
                                                attendanceData.push({
                                                    teacherId: teacherId,
                                                    sessionId: session.id,
                                                    groupId: group.id,
                                                    date: selectedDate,
                                                    status: status,
                                                    notes: `Teacher evaluation for ${selectedDate}`
                                                });
                                            }
                                        });
                                    });
                                });

                                if (attendanceData.length === 0) {
                                    alert('No attendance data to save. Please select attendance status for at least one session.');
                                    return;
                                }

                                console.log('📊 Prepared attendance data:', attendanceData);

                                // Save to database
                                const success = await saveTeacherAttendance(attendanceData);

                                if (success) {
                                    // Refresh teacher history
                                    await loadTeacherHistory();

                                    // Reset form
                                    setTeacherAttendance({});
                                    setShowEvaluationModal(false);

                                    alert('Teacher evaluation saved successfully to database!');
                                } else {
                                    alert('Failed to save teacher evaluation. Please check the console for details and try again.');
                                }
                            } catch (error) {
                                console.error('Error saving teacher evaluation:', error);
                                alert('Error saving teacher evaluation. Please try again.');
                            }
                        }}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        Save Evaluation
                    </Button>
                </div>
            </Modal>

            {/* Teacher Evaluation History Modal */}
            <Modal
                isOpen={showHistoryModal}
                onClose={() => {
                    setShowHistoryModal(false);
                    setSelectedHistoryTeacher(null);
                    setSelectedHistoryGroup(null);
                    setHistorySearchTerm('');
                }}
                title="Teacher Evaluation History"
            >
                <div className="space-y-6">
                    {!selectedHistoryTeacher ? (
                        // Step 1: Teacher Selection
                        <>
                            {/* Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <MagnifyingGlassIcon className="h-4 w-4 inline mr-1" />
                                    Search Teachers
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Search by name or ID..."
                                    value={historySearchTerm}
                                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                                    className="w-full"
                                />
                            </div>

                            {/* Teachers Table */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Select Teacher</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Teacher
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    ID
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Groups
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {teachers
                                                .filter(teacher => {
                                                    const matchesSearch = historySearchTerm === '' ||
                                                        teacher.name.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                                                        formatTeacherId(teacher.id).toLowerCase().includes(historySearchTerm.toLowerCase());
                                                    return matchesSearch;
                                                })
                                                .map(teacher => {
                                                    const teacherGroups = groups.filter(group => group.teacherId === teacher.id);

                                                    return (
                                                        <tr
                                                            key={teacher.id}
                                                            className="hover:bg-orange-50 transition-colors cursor-pointer"
                                                            onClick={() => setSelectedHistoryTeacher(teacher)}
                                                        >
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                                                                        <UsersIcon className="h-5 w-5 text-orange-600" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                                                                        <div className="text-sm text-gray-500">{teacher.email}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {formatTeacherId(teacher.id)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {teacherGroups.length}
                                                            </td>

                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : !selectedHistoryGroup ? (
                        // Step 2: Group Selection
                        <>
                            {/* Back Button */}
                            <div className="flex items-center mb-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedHistoryTeacher(null)}
                                    className="mr-3"
                                >
                                    ← Back
                                </Button>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {selectedHistoryTeacher.name} - Select Group
                                    </h3>
                                    <p className="text-sm text-gray-500">ID: {formatTeacherId(selectedHistoryTeacher.id)}</p>
                                </div>
                            </div>

                            {/* Groups Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Group Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Group ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Students
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {groups
                                            .filter(group => group.teacherId === selectedHistoryTeacher.id)
                                            .map(group => (
                                                <tr
                                                    key={group.id}
                                                    className="hover:bg-orange-50 transition-colors cursor-pointer"
                                                    onClick={() => setSelectedHistoryGroup(group.id)}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {group.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        #{group.id.toString().padStart(6, '0')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {group.students.length} students
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        // Step 3: Sessions and Evaluations
                        <>
                            {/* Back Button */}
                            <div className="flex items-center mb-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedHistoryGroup(null)}
                                    className="mr-3"
                                >
                                    ← Back
                                </Button>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {selectedHistoryTeacher.name} - {groups.find(g => g.id === selectedHistoryGroup)?.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Group #{selectedHistoryGroup?.toString().padStart(6, '0')} • Session Evaluations
                                    </p>
                                </div>
                            </div>

                            {/* Sessions Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Session & Topic
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {(() => {
                                            const selectedGroup = groups.find(g => g.id === selectedHistoryGroup);
                                            const groupName = selectedGroup?.name || '';
                                            const groupEvaluations = teacherHistory[selectedHistoryTeacher.id]?.filter(h => h.groupName === groupName) || [];

                                            // Get all sessions for this group, sorted by date
                                            const allGroupSessions = selectedGroup?.sessions?.sort((a, b) =>
                                                new Date(a.date).getTime() - new Date(b.date).getTime()
                                            ) || [];

                                            if (allGroupSessions.length === 0) {
                                                return (
                                                    <tr>
                                                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                                            <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                                            <p>No sessions found for this group.</p>
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            return allGroupSessions.map((session, index) => {
                                                // Find evaluation for this session if it exists
                                                const evaluation = groupEvaluations.find(e => e.sessionId === session.id);

                                                const sessionNumber = getSessionNumber(session, allGroupSessions);
                                                const sessionDate = new Date(session.date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: '2-digit'
                                                });

                                                return (
                                                    <tr key={session.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{sessionDate}</span>
                                                                <span className="text-xs text-gray-500">
                                                                    {new Date(session.date).toLocaleDateString('en-US', {
                                                                        weekday: 'short',
                                                                        year: 'numeric'
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-blue-600">#{sessionNumber}</span>
                                                                <span className="text-xs text-gray-500">Session</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {evaluation ? (
                                                                <select
                                                                    value={evaluation.status}
                                                                    onChange={async (e) => {
                                                                        const newStatus = e.target.value as 'present' | 'late' | 'absent' | 'justified';
                                                                        try {
                                                                            // Update the evaluation in the database using teacher_id and session_id
                                                                            const { error } = await supabase
                                                                                .from('teacher_attendance')
                                                                                .update({ status: newStatus })
                                                                                .eq('teacher_id', selectedHistoryTeacher.id)
                                                                                .eq('session_id', session.id);

                                                                            if (error) {
                                                                                console.error('Error updating status:', error);
                                                                                alert('Failed to update status. Please try again.');
                                                                                return;
                                                                            }

                                                                            // Refresh the teacher history
                                                                            await loadTeacherHistory();

                                                                            alert('Status updated successfully!');
                                                                        } catch (error) {
                                                                            console.error('Error updating status:', error);
                                                                            alert('Failed to update status. Please try again.');
                                                                        }
                                                                    }}
                                                                    className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer ${evaluation.status === 'present' ? 'bg-green-100 text-green-800' :
                                                                        evaluation.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                                                            evaluation.status === 'justified' ? 'bg-purple-100 text-purple-800' :
                                                                                'bg-red-100 text-red-800'
                                                                        }`}
                                                                >
                                                                    <option value="present">Present</option>
                                                                    <option value="late">Late</option>
                                                                    <option value="absent">Absent</option>
                                                                    <option value="justified">Justified</option>
                                                                </select>
                                                            ) : (
                                                                <select
                                                                    value="-"
                                                                    onChange={async (e) => {
                                                                        const newStatus = e.target.value;
                                                                        if (newStatus === '-') return;

                                                                        try {
                                                                            // Create a new evaluation record in the database
                                                                            const { error } = await supabase
                                                                                .from('teacher_attendance')
                                                                                .insert({
                                                                                    teacher_id: selectedHistoryTeacher.id,
                                                                                    session_id: session.id,
                                                                                    group_id: selectedHistoryGroup,
                                                                                    date: session.date,
                                                                                    status: newStatus,
                                                                                    notes: `Teacher evaluation created from history view`,
                                                                                    evaluated_by: null
                                                                                });

                                                                            if (error) {
                                                                                console.error('Error creating evaluation:', error);
                                                                                alert('Failed to create evaluation. Please try again.');
                                                                                return;
                                                                            }

                                                                            // Refresh the teacher history
                                                                            await loadTeacherHistory();

                                                                            alert('Evaluation created successfully!');
                                                                        } catch (error) {
                                                                            console.error('Error creating evaluation:', error);
                                                                            alert('Failed to create evaluation. Please try again.');
                                                                        }
                                                                    }}
                                                                    className="text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer bg-gray-100 text-gray-600 hover:bg-gray-200 border border-dashed border-gray-400"
                                                                >
                                                                    <option value="-">Not Evaluated</option>
                                                                    <option value="present">Present</option>
                                                                    <option value="late">Late</option>
                                                                    <option value="absent">Absent</option>
                                                                    <option value="justified">Justified</option>
                                                                </select>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setShowHistoryModal(false);
                            setSelectedHistoryTeacher(null);
                            setSelectedHistoryGroup(null);
                            setHistorySearchTerm('');
                        }}
                    >
                        Close
                    </Button>
                </div>
            </Modal>

            <GlobalKeyboardShortcuts
                onAddNew={() => setIsCreateModalOpen(true)}
                isModalOpen={isCreateModalOpen}
            />
        </AuthGuard>
    );
} 