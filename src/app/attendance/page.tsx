'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '../../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useMySchoolStore } from '../../store';
import { Group, Student, Session, AttendanceStatus } from '../../types';
import { supabase } from '../../lib/supabase';
import { GlobalKeyboardShortcuts } from '../../components/GlobalKeyboardShortcuts';
import AuthGuard from '../../components/AuthGuard';
import {
    UserPlusIcon,
    UsersIcon,
    PencilIcon,
    TrashIcon,
    PlusIcon,
    XMarkIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    PhoneIcon,
    EnvelopeIcon,
    MapPinIcon,
    CalendarIcon,
    ClockIcon,
    UserIcon,
    AcademicCapIcon,
    GlobeAltIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    ChevronUpIcon,
    EyeIcon,
} from '@heroicons/react/24/outline';
import { format, isSameDay, parseISO } from 'date-fns';
import { formatTimeSimple } from '../../utils/timeUtils';

// Attendance utility functions
const getNextAttendanceStatus = (currentStatus: AttendanceStatus): AttendanceStatus => {
    const statusOrder: AttendanceStatus[] = ['default', 'present', 'absent', 'justified', 'change', 'stop', 'new', 'too_late'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    return statusOrder[nextIndex];
};

const getAttendanceClasses = (status: AttendanceStatus, size: 'sm' | 'md' = 'md'): string => {
    const baseClasses = 'rounded-full flex items-center justify-center cursor-pointer transition-colors';
    const sizeClasses = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';

    switch (status) {
        case 'present':
            return `${baseClasses} ${sizeClasses} bg-green-500 text-white hover:bg-green-600`;
        case 'absent':
            return `${baseClasses} ${sizeClasses} bg-red-500 text-white hover:bg-red-600`;
        case 'justified':
            return `${baseClasses} ${sizeClasses} bg-blue-500 text-white hover:bg-blue-600`;
        case 'change':
            return `${baseClasses} ${sizeClasses} bg-yellow-500 text-white hover:bg-yellow-600`;
        case 'stop':
            return `${baseClasses} ${sizeClasses} bg-gray-500 text-white hover:bg-gray-600`;
        case 'new':
            return `${baseClasses} ${sizeClasses} bg-purple-500 text-white hover:bg-purple-600`;
        case 'too_late':
            return `${baseClasses} ${sizeClasses} bg-orange-500 text-white hover:bg-orange-600`;
        default:
            return `${baseClasses} ${sizeClasses} bg-gray-300 text-gray-600 hover:bg-gray-400`;
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

const getAttendanceTitle = (status: AttendanceStatus): string => {
    switch (status) {
        case 'present': return 'Present';
        case 'absent': return 'Absent';
        case 'justified': return 'Justified Absence';
        case 'change': return 'Changed';
        case 'stop': return 'Stopped';
        case 'new': return 'New Student';
        case 'too_late': return 'Too Late';
        default: return 'Default';
    }
};

export default function AttendancePage() {
    const {
        groups,
        teachers,
        updateAttendance,
        updateAttendanceBulk,
        fetchGroups,
        fetchTeachers,
        loading,
        error
    } = useMySchoolStore();

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [attendanceMap, setAttendanceMap] = useState<{ [sessionId: string]: { [studentId: string]: AttendanceStatus } }>({});

    // Call log state
    const [showCallLogModal, setShowCallLogModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [callLogData, setCallLogData] = useState({
        adminName: 'Dalila',
        comment: ''
    });



    // Reschedule modal state
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState<Date>(new Date());
    const [sessionsToReschedule, setSessionsToReschedule] = useState<Session[]>([]);

    useEffect(() => {
        fetchGroups();
        fetchTeachers();
    }, [fetchGroups, fetchTeachers]);



    // Filter groups that have sessions on the selected date
    const groupsWithSessionsOnDate = React.useMemo(() => {
        return groups.filter(group => {
            return group.sessions.some(session => {
                const sessionDate = typeof session.date === 'string' ? new Date(session.date) : session.date;
                return isSameDay(sessionDate, selectedDate); // Check if session date is on selectedDate
            });
        });
    }, [groups, selectedDate]);

    // Find the selected group
    const selectedGroup = React.useMemo(() => {
        return groups.find(group => group.id === selectedGroupId);
    }, [groups, selectedGroupId]);

    // Find the teacher for the selected group
    const teacher = selectedGroup ? teachers.find(t => t.id === selectedGroup.teacherId) : null;

    // Get sessions for the selected date (for default view)
    const sessionsForSelectedDate = React.useMemo(() => {
        if (!selectedGroup) return [];

        // Create a Map to ensure unique sessions by ID
        const uniqueSessionsMap = new Map();

        selectedGroup.sessions.forEach(session => {
            const sessionDate = typeof session.date === 'string' ? new Date(session.date) : session.date;
            if (isSameDay(sessionDate, selectedDate)) { // Only add if session date is on selectedDate
                // Only add if not already in map (prevents duplicates)
                if (!uniqueSessionsMap.has(session.id)) {
                    uniqueSessionsMap.set(session.id, session);
                }
            }
        });

        const uniqueSessions = Array.from(uniqueSessionsMap.values());
        return uniqueSessions;
    }, [selectedGroup, selectedDate]);

    // Get all sessions for the selected group (for history view)
    const allSessionsForGroup = React.useMemo(() => {
        if (!selectedGroup) return [];

        // Create a Map to ensure unique sessions by ID
        const uniqueSessionsMap = new Map();

        selectedGroup.sessions.forEach(session => {
            // Only add if not already in map (prevents duplicates)
            if (!uniqueSessionsMap.has(session.id)) {
                uniqueSessionsMap.set(session.id, session);
            }
        });

        return Array.from(uniqueSessionsMap.values()).sort((a, b) => {
            const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date;
            const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date;
            return dateA.getTime() - dateB.getTime();
        });
    }, [selectedGroup]);

    const getAttendanceStatus = (sessionId: string, studentId: string): AttendanceStatus => {
        // First check the local attendance map (for unsaved changes)
        const localStatus = attendanceMap[sessionId]?.[studentId];
        if (localStatus) return localStatus;

        // Then check the session's attendance data from the database
        const session = selectedGroup?.sessions.find(s => s.id === sessionId);
        const dbStatus = session?.attendance[studentId];
        return dbStatus || 'default';
    };

    const handleAttendanceUpdate = (sessionId: string, studentId: string, status: AttendanceStatus) => {
        setAttendanceMap(prev => ({
            ...prev,
            [sessionId]: {
                ...(prev[sessionId] || {}),
                [studentId]: status
            }
        }));
    };

    const handleSaveChanges = async () => {
        if (!selectedGroup) return;
        const updates: Array<{ sessionId: string; studentId: string; status: AttendanceStatus }> = [];
        Object.entries(attendanceMap).forEach(([sessionId, map]) => {
            Object.entries(map).forEach(([studentId, status]) => {
                updates.push({ sessionId, studentId, status });
            });
        });
        if (updates.length === 0) return;
        try {
            await updateAttendanceBulk(selectedGroup.id, updates);
            setAttendanceMap({});
            alert('Attendance changes saved. Refunds (if any) have been aggregated per student.');
        } catch (e) {
            console.error('Saving attendance changes failed:', e);
            alert('Failed to save attendance changes.');
        }
    };

    const renderAttendanceCircleForSession = (sessionId: string, studentId: string) => {
        const currentStatus = getAttendanceStatus(sessionId, studentId);

        // Get session number for tooltip
        const session = selectedGroup?.sessions.find(s => s.id === sessionId);
        const sessionNumber = session ? getSessionNumber(session, selectedGroup?.sessions || []) : 1;

        const handleClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            // Cycle to next attendance status
            const nextStatus = getNextAttendanceStatus(currentStatus);
            handleAttendanceUpdate(sessionId, studentId, nextStatus);
        };

        return (
            <div className="relative">
                <div
                    onClick={handleClick}
                    className={getAttendanceClasses(currentStatus, 'md')}
                    title={`Session #${sessionNumber} - ${getAttendanceTitle(currentStatus)} - Click to cycle to next status`}
                >
                    <span className="font-medium">{getAttendanceDisplayLetter(currentStatus)}</span>
                </div>
            </div>
        );
    };

    // Call log functions
    const handleCallLog = (student: Student) => {
        setSelectedStudent(student);
        setCallLogData({
            adminName: 'Dalila',
            comment: ''
        });
        setShowCallLogModal(true);
    };

    const handleSaveCallLog = async () => {
        if (!selectedStudent || !callLogData.comment.trim()) {
            alert('Please enter a comment');
            return;
        }

        try {
            // Import supabase directly
            const { supabase } = await import('../../lib/supabase');

            let studentId = null;

            // Try to find existing student in waiting_list first
            const { data: existingStudent } = await supabase
                .from('waiting_list')
                .select('id')
                .eq('name', selectedStudent.name)
                .eq('phone', selectedStudent.phone)
                .single();

            if (existingStudent) {
                studentId = existingStudent.id;
            } else {
                // Try to create a minimal student record
                const studentData = {
                    name: selectedStudent.name || 'Unknown Student',
                    email: selectedStudent.email || null,
                    phone: selectedStudent.phone || null,
                    language: 'other',
                    level: 'other',
                    category: 'other',
                    second_phone: selectedStudent.secondPhone || null,
                    parent_name: selectedStudent.parentName || null,
                    address: selectedStudent.address || null,
                    birth_date: selectedStudent.birthDate || null
                };

                // Add optional fields only if they exist
                if (selectedStudent.secondPhone) studentData.second_phone = selectedStudent.secondPhone;
                if (selectedStudent.parentName) studentData.parent_name = selectedStudent.parentName;
                if (selectedStudent.address) studentData.address = selectedStudent.address;
                if (selectedStudent.birthDate) studentData.birth_date = selectedStudent.birthDate;

                const { data: newStudent, error: createError } = await supabase
                    .from('waiting_list')
                    .insert(studentData)
                    .select('id')
                    .single();

                if (createError) {
                    console.error('Error creating student for call log:', createError);
                    // If we can't create a student, try to save call log with null student_id
                    // (assuming the database migration was run to allow null student_id)
                    studentId = null;
                } else {
                    studentId = newStudent.id;
                }
            }

            // Use only the comment as notes (student info is already linked via student_id)
            const notes = callLogData.comment;

            interface CallLogEntry {
                call_type: string;
                status: string;
                notes: string;
                admin_name: string;
                call_date: string;
                student_id?: string;
            }

            const callLogEntry: CallLogEntry = {
                call_type: 'attendance',
                status: 'coming',
                notes: notes,
                admin_name: callLogData.adminName,
                call_date: new Date().toISOString(),
            };

            // Only add student_id if we have one
            if (studentId) {
                callLogEntry.student_id = studentId;
            }



            const { error } = await supabase.from('call_logs').insert(callLogEntry);

            if (error) {
                console.error('Error saving call log:', error);
                alert(`Failed to save call log: ${error.message || 'Unknown error'}`);
                return;
            }

            // Close modal and reset state
            setShowCallLogModal(false);
            setSelectedStudent(null);
            setCallLogData({ adminName: 'Dalila', comment: '' });

            alert('Call log saved successfully!');
        } catch (error) {
            console.error('Error saving call log:', error);
            alert('Failed to save call log. Please try again.');
        }
    };

    const handleFreezeToggle = async () => {
        if (!selectedGroup) return;

        try {
            if (selectedGroup.isFrozen) {
                // Unfreeze - need to get the unfreeze date
                const unfreezeDate = new Date();
                await useMySchoolStore.getState().unfreezeGroup(selectedGroup.id, unfreezeDate);
                alert('Group unfrozen successfully! Sessions will be rescheduled from today.');
            } else {
                // Freeze
                await useMySchoolStore.getState().freezeGroup(selectedGroup.id);
                alert('Group frozen successfully! Group is now in vacation mode.');
            }
        } catch (error) {
            console.error('Error freezing/unfreezing group:', error);
            alert('Failed to freeze/unfreeze group. Please try again.');
        }
    };

    const handleRescheduleToday = async () => {
        if (!selectedGroup) return;

        try {
            // Find all sessions for today's date
            const todaySessions = selectedGroup.sessions.filter(session => {
                const sessionDate = typeof session.date === 'string' ? new Date(session.date) : session.date;
                return isSameDay(sessionDate, selectedDate); // Only reschedule sessions for today's date
            });

            if (todaySessions.length === 0) {
                alert('No sessions found for today.');
                return;
            }

            // Find the next available study day after the last scheduled session
            const lastSession = selectedGroup.sessions
                .sort((a, b) => {
                    const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date;
                    const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date;
                    return dateB.getTime() - dateA.getTime();
                })[0];

            if (!lastSession) {
                alert('No sessions found to determine next date.');
                return;
            }

            const lastSessionDate = typeof lastSession.date === 'string' ? new Date(lastSession.date) : lastSession.date;

            // Find the next study day based on recurring days
            const nextStudyDate = findNextStudyDay(lastSessionDate, selectedGroup.recurringDays);

            // Reschedule each session
            for (const session of todaySessions) {
                await useMySchoolStore.getState().rescheduleSession(session.id, nextStudyDate);
            }

            alert(`Sessions rescheduled to ${format(nextStudyDate, 'MMMM dd, yyyy')}`);
        } catch (error) {
            console.error('Error rescheduling sessions:', error);
            alert('Failed to reschedule sessions. Please try again.');
        }
    };

    // Helper function to find the next study day
    const findNextStudyDay = (fromDate: Date, recurringDays: number[]): Date => {
        const nextDate = new Date(fromDate);
        nextDate.setDate(nextDate.getDate() + 1); // Start from the next day

        // Find the next day that matches the recurring days
        while (!recurringDays.includes(nextDate.getDay())) {
            nextDate.setDate(nextDate.getDate() + 1);
        }

        return nextDate;
    };

    // Calculate session number for a given session
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

    // Handle reschedule with calendar picker
    const handleRescheduleWithCalendar = () => {
        if (!selectedGroup) return;

        // Find all sessions for today's date
        const todaySessions = selectedGroup.sessions.filter(session => {
            const sessionDate = typeof session.date === 'string' ? new Date(session.date) : session.date;
            return isSameDay(sessionDate, selectedDate); // Only reschedule sessions for today's date
        });

        if (todaySessions.length === 0) {
            alert('No sessions found for today.');
            return;
        }

        setSessionsToReschedule(todaySessions);
        setRescheduleDate(new Date());
        setShowRescheduleModal(true);
    };

    // Handle reschedule confirmation
    const handleRescheduleConfirm = async () => {
        if (!selectedGroup || sessionsToReschedule.length === 0) return;

        try {
            // Reschedule each session to the selected date
            for (const session of sessionsToReschedule) {
                await useMySchoolStore.getState().rescheduleSession(session.id, rescheduleDate);
            }

            alert(`Sessions rescheduled to ${format(rescheduleDate, 'MMMM dd, yyyy')}`);
            setShowRescheduleModal(false);
            setSessionsToReschedule([]);

            // Refresh the groups to show updated data
            await fetchGroups();
        } catch (error) {
            console.error('Error rescheduling sessions:', error);
            alert('Failed to reschedule sessions. Please try again.');
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

                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
                            <p className="mt-2 text-gray-600">
                                Track student attendance for your educational groups
                            </p>
                        </div>

                        {/* Date Selection */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Select Date</CardTitle>
                                <CardDescription>
                                    Choose a date to view and manage attendance
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center space-x-4">
                                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                                    <input
                                        type="date"
                                        value={format(selectedDate, 'yyyy-MM-dd')}
                                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Group Selection */}
                        {groupsWithSessionsOnDate.length > 0 && (
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Select Group</CardTitle>
                                    <CardDescription>
                                        Click on a group to manage attendance for {format(selectedDate, 'MMMM dd, yyyy')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-orange-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                                                        Group
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                                                        Teacher
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                                                        Students
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                                                        Sessions Today
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {groupsWithSessionsOnDate.map((group) => {
                                                    const groupTeacher = teachers.find(t => t.id === group.teacherId);

                                                    // Create a Map to ensure unique sessions by ID for the group table display
                                                    const uniqueSessionsMap = new Map();
                                                    group.sessions.forEach(session => {
                                                        const sessionDate = typeof session.date === 'string' ? new Date(session.date) : session.date;
                                                        if (isSameDay(sessionDate, selectedDate)) { // Only add if session date is on selectedDate
                                                            if (!uniqueSessionsMap.has(session.id)) {
                                                                uniqueSessionsMap.set(session.id, session);
                                                            }
                                                        }
                                                    });
                                                    const sessionsOnDate = Array.from(uniqueSessionsMap.values());

                                                    return (
                                                        <tr
                                                            key={group.id}
                                                            onClick={() => {
                                                                setSelectedGroupId(group.id);
                                                                setShowAttendanceModal(true);
                                                            }}
                                                            className="cursor-pointer transition-colors hover:bg-orange-50"
                                                        >
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                                                                        <UserGroupIcon className="h-5 w-5 text-orange-600" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-medium text-gray-900">{group.name}</div>
                                                                        <div className="text-sm text-gray-500">Group #{group.id.toString().padStart(6, '0')}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <UsersIcon className="h-4 w-4 mr-2 text-orange-500" />
                                                                    <span className="text-sm text-gray-900">{groupTeacher?.name || 'Unknown'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    {group.students.length} {group.students.length === 1 ? 'student' : 'students'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    {sessionsOnDate.length} {sessionsOnDate.length === 1 ? 'session' : 'sessions'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {groupsWithSessionsOnDate.length === 0 && (
                            <Card className="mb-6">
                                <CardContent className="p-8 text-center">
                                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions on this date</h3>
                                    <p className="text-gray-500">
                                        No groups have sessions scheduled for {format(selectedDate, 'MMMM dd, yyyy')}
                                    </p>
                                </CardContent>
                            </Card>
                        )}


                    </div>
                </div>
            </div>

            {/* Attendance Management Modal */}
            <Modal
                isOpen={showAttendanceModal}
                onClose={() => {
                    setShowAttendanceModal(false);
                    setSelectedGroupId(null);
                    setShowHistory(false);
                }}
                title={selectedGroup ? `Attendance - ${selectedGroup.name}` : 'Attendance Management'}
                maxWidth="2xl"
            >
                {selectedGroup && (
                    <div className="space-y-6 w-full max-w-7xl">
                        {/* Group Info Header */}
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-medium text-orange-700">{selectedGroup.name}</h3>
                                    <p className="text-sm text-orange-600">
                                        Teacher: {teacher?.name} • {selectedGroup.students.length} students • {format(selectedDate, 'MMMM dd, yyyy')}
                                    </p>
                                    {selectedGroup.isFrozen && (
                                        <p className="text-sm text-red-600 font-medium">
                                            🧊 Group is frozen (vacation mode)
                                        </p>
                                    )}
                                </div>
                                <div className="flex space-x-2">
                                    {/* Freeze/Unfreeze Button */}
                                    <Button
                                        variant="outline"
                                        onClick={handleFreezeToggle}
                                        className={`flex items-center space-x-2 ${selectedGroup.isFrozen
                                            ? 'text-blue-600 border-blue-200 hover:bg-blue-50'
                                            : 'text-orange-600 border-orange-200 hover:bg-orange-50'
                                            }`}
                                    >
                                        {selectedGroup.isFrozen ? (
                                            <>
                                                <span>🧊</span>
                                                <span>Unfreeze</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>❄️</span>
                                                <span>Freeze</span>
                                            </>
                                        )}
                                    </Button>

                                    {/* Reschedule Button */}
                                    <Button
                                        variant="outline"
                                        onClick={handleRescheduleWithCalendar}
                                        className="flex items-center space-x-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                                        disabled={selectedGroup.isFrozen}
                                    >
                                        <span>📅</span>
                                        <span>Reschedule Today</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={() => setShowHistory(!showHistory)}
                                        className="flex items-center space-x-2"
                                    >
                                        {showHistory ? <ChevronUpIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                        <span>{showHistory ? 'Hide History' : 'View History'}</span>
                                    </Button>

                                    <Button
                                        onClick={handleSaveChanges}
                                        className="bg-orange-600 hover:bg-orange-700 text-white"
                                        disabled={Object.keys(attendanceMap).length === 0}
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Attendance Table */}
                        {selectedGroup.students.length === 0 ? (
                            <div className="text-center py-8">
                                <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No students in this group</h3>
                                <p className="text-gray-500">
                                    Add students to the group to start tracking attendance
                                </p>
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
                                                Call
                                            </th>
                                            {showHistory ? (
                                                // Show all sessions in history view
                                                allSessionsForGroup.map((session) => {
                                                    const sessionNumber = getSessionNumber(session, allSessionsForGroup);
                                                    return (
                                                        <th key={session.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            <div className="flex flex-col items-center">
                                                                <span className="font-bold text-blue-600">#{sessionNumber}</span>
                                                                <span>{format(typeof session.date === 'string' ? new Date(session.date) : session.date, 'MMM dd')}</span>
                                                            </div>
                                                        </th>
                                                    );
                                                })
                                            ) : (
                                                // Show only sessions for selected date in default view
                                                sessionsForSelectedDate.map((session) => {
                                                    const sessionNumber = getSessionNumber(session, selectedGroup.sessions);
                                                    return (
                                                        <th key={session.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            <div className="flex flex-col items-center">
                                                                <span className="font-bold text-blue-600">#{sessionNumber}</span>
                                                                <span>{format(typeof session.date === 'string' ? new Date(session.date) : session.date, 'MMM dd')}</span>
                                                            </div>
                                                        </th>
                                                    );
                                                })
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {selectedGroup.students.map((student) => (
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
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCallLog(student);
                                                        }}
                                                        className="text-orange-600 hover:text-orange-800 transition-colors"
                                                        title={`Call ${student.name}`}
                                                    >
                                                        <PhoneIcon className="h-4 w-4" />
                                                    </button>
                                                </td>
                                                {showHistory ? (
                                                    // Show attendance circles for all sessions
                                                    allSessionsForGroup.map((session) => (
                                                        <td key={session.id} className="px-3 py-4 whitespace-nowrap text-center">
                                                            {renderAttendanceCircleForSession(session.id, student.id)}
                                                        </td>
                                                    ))
                                                ) : (
                                                    // Show attendance circles for selected date sessions only
                                                    sessionsForSelectedDate.map((session) => (
                                                        <td key={session.id} className="px-3 py-4 whitespace-nowrap text-center">
                                                            {renderAttendanceCircleForSession(session.id, student.id)}
                                                        </td>
                                                    ))
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Call Log Modal */}
            <Modal
                isOpen={showCallLogModal}
                onClose={() => {
                    setShowCallLogModal(false);
                    setSelectedStudent(null);
                    setCallLogData({ adminName: 'Dalila', comment: '' });
                }}
                title={`Call Log - ${selectedStudent?.name || 'Student'}`}
                maxWidth="2xl"
            >
                {selectedStudent && (
                    <div className="space-y-6">
                        {/* Student Info */}
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-lg font-medium text-orange-700">{selectedStudent.name}</h3>
                                    <p className="text-sm text-orange-600">Primary Phone: {selectedStudent.phone || 'N/A'}</p>
                                    {selectedStudent.secondPhone && (
                                        <p className="text-sm text-orange-600">Secondary Phone: {selectedStudent.secondPhone}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Email: {selectedStudent.email || 'N/A'}</p>
                                    {selectedStudent.parentName && (
                                        <p className="text-sm text-gray-600">Parent: {selectedStudent.parentName}</p>
                                    )}
                                    <p className="text-sm text-gray-600">Reason: Attendance</p>
                                </div>
                            </div>
                        </div>

                        {/* Call Log Form */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Admin Name *
                                </label>
                                <Input
                                    value={callLogData.adminName}
                                    onChange={(e) => setCallLogData({ ...callLogData, adminName: e.target.value })}
                                    placeholder="Enter admin name"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Comment *
                                </label>
                                <textarea
                                    value={callLogData.comment}
                                    onChange={(e) => setCallLogData({ ...callLogData, comment: e.target.value })}
                                    placeholder="Enter call details and notes..."
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowCallLogModal(false);
                                    setSelectedStudent(null);
                                    setCallLogData({ adminName: 'Dalila', comment: '' });
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveCallLog}
                                className="bg-orange-600 hover:bg-orange-700"
                                disabled={!callLogData.comment.trim()}
                            >
                                Save Call Log
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Reschedule Modal */}
            <Modal
                isOpen={showRescheduleModal}
                onClose={() => {
                    setShowRescheduleModal(false);
                    setSessionsToReschedule([]);
                    setRescheduleDate(new Date());
                }}
                title={`Reschedule Sessions for ${format(selectedDate, 'MMMM dd, yyyy')}`}
                maxWidth="sm"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Date *
                        </label>
                        <input
                            type="date"
                            value={format(rescheduleDate, 'yyyy-MM-dd')}
                            onChange={(e) => setRescheduleDate(new Date(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                    <p className="text-sm text-gray-600">
                        Selected sessions will be rescheduled to this date.
                    </p>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setShowRescheduleModal(false);
                            setSessionsToReschedule([]);
                            setRescheduleDate(new Date());
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleRescheduleConfirm}
                        className="bg-orange-600 hover:bg-orange-700"
                        disabled={!rescheduleDate || sessionsToReschedule.length === 0}
                    >
                        Confirm Reschedule
                    </Button>
                </div>
            </Modal>

        </AuthGuard>
    );
} 