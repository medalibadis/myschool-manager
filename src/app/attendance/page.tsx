'use client';

import React, { useState, useMemo } from 'react';
import Navigation from '../../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useMySchoolStore } from '../../store';
import AuthGuard from '../../components/AuthGuard';
import {
    CalendarIcon,
    UserGroupIcon,
    UsersIcon,
    CheckIcon,
    ClockIcon,
    EyeIcon,
    ChevronDownIcon,
    ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { format, isSameDay, parseISO, isAfter, isBefore } from 'date-fns';

type AttendanceStatus = 'default' | 'present' | 'absent' | 'justified' | 'change' | 'stop' | 'new';

interface AttendanceOption {
    value: AttendanceStatus;
    label: string;
    color: string;
    bgColor: string;
}

const attendanceOptions: AttendanceOption[] = [
    { value: 'default', label: 'Default', color: 'text-gray-500', bgColor: 'bg-gray-100' },
    { value: 'present', label: 'Present', color: 'text-green-800', bgColor: 'bg-green-100' },
    { value: 'absent', label: 'Absent', color: 'text-red-800', bgColor: 'bg-red-100' },
    { value: 'justified', label: 'Justified', color: 'text-blue-800', bgColor: 'bg-blue-100' },
    { value: 'change', label: 'Change', color: 'text-purple-800', bgColor: 'bg-purple-100' },
    { value: 'stop', label: 'Stop', color: 'text-gray-800', bgColor: 'bg-gray-300' },
    { value: 'new', label: 'New', color: 'text-orange-800', bgColor: 'bg-orange-100' },
];

export default function AttendancePage() {
    const {
        groups,
        teachers,
        updateAttendance,
        fetchGroups,
        fetchTeachers,
        loading,
        error
    } = useMySchoolStore();

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [attendanceMap, setAttendanceMap] = useState<{ [sessionId: string]: { [studentId: string]: AttendanceStatus } }>({});

    React.useEffect(() => {
        fetchGroups();
        fetchTeachers();
    }, [fetchGroups, fetchTeachers]);

    // Filter groups that have sessions on the selected date
    const groupsWithSessionsOnDate = useMemo(() => {
        return groups.filter(group => {
            return group.sessions.some(session => {
                const sessionDate = typeof session.date === 'string' ? parseISO(session.date) : session.date;
                return isSameDay(sessionDate, selectedDate);
            });
        });
    }, [groups, selectedDate]);

    const selectedGroup = selectedGroupId ? groups.find(g => g.id === selectedGroupId) : null;
    const teacher = selectedGroup ? teachers.find(t => t.id === selectedGroup.teacherId) : null;

    // Get sessions for the selected date (for default view)
    const sessionsForSelectedDate = useMemo(() => {
        if (!selectedGroup) return [];
        return selectedGroup.sessions.filter(session => {
            const sessionDate = typeof session.date === 'string' ? parseISO(session.date) : session.date;
            return isSameDay(sessionDate, selectedDate);
        });
    }, [selectedGroup, selectedDate]);

    // Get all sessions for the selected group (for history view)
    const allSessionsForGroup = useMemo(() => {
        if (!selectedGroup) return [];
        return selectedGroup.sessions.sort((a, b) => {
            const dateA = typeof a.date === 'string' ? parseISO(a.date) : a.date;
            const dateB = typeof b.date === 'string' ? parseISO(b.date) : b.date;
            return dateA.getTime() - dateB.getTime();
        });
    }, [selectedGroup]);

    const getAttendanceStatus = (sessionId: string, studentId: string): AttendanceStatus => {
        return attendanceMap[sessionId]?.[studentId] || 'default';
    };

    const handleAttendanceUpdate = async (sessionId: string, studentId: string, status: AttendanceStatus) => {
        setAttendanceMap(prev => ({
            ...prev,
            [sessionId]: {
                ...(prev[sessionId] || {}),
                [studentId]: status
            }
        }));

        try {
            // Convert status to boolean for the API
            const attended = status === 'present';
            await updateAttendance(sessionId, studentId, attended);
        } catch (error) {
            console.error('Error updating attendance:', error);
        }
    };

    const renderAttendanceCircle = (sessionId: string, studentId: string) => {
        const currentStatus = getAttendanceStatus(sessionId, studentId);

        const handleClick = () => {
            const currentIndex = attendanceOptions.findIndex(option => option.value === currentStatus);
            const nextIndex = (currentIndex + 1) % attendanceOptions.length;
            const nextStatus = attendanceOptions[nextIndex].value;
            handleAttendanceUpdate(sessionId, studentId, nextStatus);
        };

        const getDisplayLetter = (status: AttendanceStatus) => {
            switch (status) {
                case 'default': return 'D';
                case 'present': return 'P';
                case 'absent': return 'A';
                case 'justified': return 'J';
                case 'change': return 'C';
                case 'stop': return 'S';
                case 'new': return 'N';
                default: return 'D';
            }
        };

        const option = attendanceOptions.find(opt => opt.value === currentStatus) || attendanceOptions[0];

        return (
            <div
                onClick={handleClick}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${option.bgColor} ${option.color} hover:opacity-80`}
                title={`${option.label} - Click to change`}
            >
                <span className="text-sm font-medium">{getDisplayLetter(currentStatus)}</span>
            </div>
        );
    };

    return (
        <AuthGuard>
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
                                    Choose a group to manage attendance for the selected date
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {groupsWithSessionsOnDate.map((group) => {
                                        const groupTeacher = teachers.find(t => t.id === group.teacherId);
                                        const sessionsOnDate = group.sessions.filter(session => {
                                            const sessionDate = typeof session.date === 'string' ? parseISO(session.date) : session.date;
                                            return isSameDay(sessionDate, selectedDate);
                                        });

                                        return (
                                            <div
                                                key={group.id}
                                                onClick={() => setSelectedGroupId(group.id)}
                                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedGroupId === group.id
                                                        ? 'border-orange-500 bg-orange-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-medium text-gray-900">{group.name}</h3>
                                                    <UserGroupIcon className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    <p>Teacher: {groupTeacher?.name || 'Unknown'}</p>
                                                    <p>Students: {group.students.length}</p>
                                                    <p>Sessions on this date: {sessionsOnDate.length}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
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

                    {/* Attendance Management */}
                    {selectedGroup && (
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>{selectedGroup.name}</CardTitle>
                                        <CardDescription>
                                            Teacher: {teacher?.name} • {selectedGroup.students.length} students
                                        </CardDescription>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowHistory(!showHistory)}
                                            className="flex items-center space-x-2"
                                        >
                                            {showHistory ? <ChevronUpIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                            <span>{showHistory ? 'Hide History' : 'View History'}</span>
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
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
                                                    {showHistory ? (
                                                        // Show all sessions in history view
                                                        allSessionsForGroup.map((session) => (
                                                            <th key={session.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                {format(typeof session.date === 'string' ? parseISO(session.date) : session.date, 'MMM dd')}
                                                            </th>
                                                        ))
                                                    ) : (
                                                        // Show only sessions for selected date in default view
                                                        sessionsForSelectedDate.map((session) => (
                                                            <th key={session.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                {format(typeof session.date === 'string' ? parseISO(session.date) : session.date, 'MMM dd')}
                                                            </th>
                                                        ))
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
                                                        {showHistory ? (
                                                            // Show attendance circles for all sessions
                                                            allSessionsForGroup.map((session) => (
                                                                <td key={session.id} className="px-3 py-4 whitespace-nowrap text-center">
                                                                    {renderAttendanceCircle(session.id, student.id)}
                                                                </td>
                                                            ))
                                                        ) : (
                                                            // Show attendance circles for selected date sessions only
                                                            sessionsForSelectedDate.map((session) => (
                                                                <td key={session.id} className="px-3 py-4 whitespace-nowrap text-center">
                                                                    {renderAttendanceCircle(session.id, student.id)}
                                                                </td>
                                                            ))
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AuthGuard>
    );
} 