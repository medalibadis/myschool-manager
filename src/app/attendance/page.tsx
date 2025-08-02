'use client';

import React, { useState, useMemo } from 'react';
import Navigation from '../../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useMySchoolStore } from '../../store';
import {
    CalendarIcon,
    UserGroupIcon,
    UsersIcon,
    CheckIcon,
    XMarkIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import { format, isSameDay, parseISO } from 'date-fns';

// Attendance status types
type AttendanceStatus = 'P' | 'A' | 'J' | 'N' | 'S' | 'C' | 'D';

interface AttendanceOption {
    value: AttendanceStatus;
    label: string;
    color: string;
    bgColor: string;
    description: string;
}

const attendanceOptions: AttendanceOption[] = [
    { value: 'P', label: 'Present', color: 'text-green-800', bgColor: 'bg-green-100', description: 'Student attended' },
    { value: 'A', label: 'Absent', color: 'text-red-800', bgColor: 'bg-red-100', description: 'Student absent' },
    { value: 'J', label: 'Justified', color: 'text-yellow-800', bgColor: 'bg-yellow-100', description: 'Absent with justification' },
    { value: 'N', label: 'New', color: 'text-blue-800', bgColor: 'bg-blue-100', description: 'New student' },
    { value: 'C', label: 'Changed', color: 'text-purple-800', bgColor: 'bg-purple-100', description: 'Status changed' },
    { value: 'S', label: 'Stopped', color: 'text-gray-800', bgColor: 'bg-gray-300', description: 'Student stopped' },
    { value: 'D', label: 'Default', color: 'text-gray-500', bgColor: 'bg-gray-100', description: 'Not marked' },
];

export default function AttendancePage() {
    const { groups, teachers, updateAttendance } = useMySchoolStore();
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [attendanceMap, setAttendanceMap] = useState<{ [sessionId: string]: { [studentId: string]: AttendanceStatus } }>({});

    // Get groups that have sessions on the selected date
    const groupsWithSessionsOnDate = useMemo(() => {
        return groups.filter(group => {
            return group.sessions.some(session => {
                const sessionDate = typeof session.date === 'string' ? parseISO(session.date) : session.date;
                return isSameDay(sessionDate, selectedDate);
            });
        });
    }, [groups, selectedDate]);

    // Get sessions for the selected date
    const sessionsForSelectedDate = useMemo(() => {
        if (!selectedGroupId) return [];
        const group = groups.find(g => g.id === selectedGroupId);
        if (!group) return [];

        return group.sessions.filter(session => {
            const sessionDate = typeof session.date === 'string' ? parseISO(session.date) : session.date;
            return isSameDay(sessionDate, selectedDate);
        });
    }, [groups, selectedGroupId, selectedDate]);

    const selectedGroup = groups.find(g => g.id === selectedGroupId);
    const teacher = selectedGroup ? teachers.find(t => t.id === selectedGroup.teacherId) : null;

    // Get attendance status for a student/session
    const getAttendanceStatus = (sessionId: string, studentId: string): AttendanceStatus => {
        return attendanceMap[sessionId]?.[studentId] || 'D';
    };

    // Update attendance status
    const handleAttendanceUpdate = (sessionId: string, studentId: string, status: AttendanceStatus) => {
        setAttendanceMap(prev => ({
            ...prev,
            [sessionId]: {
                ...(prev[sessionId] || {}),
                [studentId]: status,
            }
        }));

        // Update the store with boolean attendance (for backward compatibility)
        const isAttended = status === 'P';
        updateAttendance(sessionId, studentId, isAttended);
    };

    // Get attendance statistics for a group
    const getAttendanceStats = (groupId: string) => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return { totalSessions: 0, totalStudents: 0, averageAttendance: 0 };

        const totalSessions = group.sessions.length;
        const totalStudents = group.students.length;
        const totalAttendance = group.sessions.reduce((sum, session) => {
            return sum + Object.values(session.attendance).filter(Boolean).length;
        }, 0);
        const averageAttendance = totalSessions > 0 ? (totalAttendance / (totalSessions * totalStudents)) * 100 : 0;

        return {
            totalSessions,
            totalStudents,
            averageAttendance: Math.round(averageAttendance),
        };
    };

    // Get attendance statistics for the selected date
    const getDateAttendanceStats = () => {
        if (!selectedGroup || sessionsForSelectedDate.length === 0) return null;

        const totalStudents = selectedGroup.students.length;
        const totalSessions = sessionsForSelectedDate.length;
        const presentStudents = sessionsForSelectedDate.reduce((sum, session) => {
            return sum + Object.values(session.attendance).filter(Boolean).length;
        }, 0);

        return {
            totalStudents,
            totalSessions,
            presentStudents,
            attendanceRate: totalStudents > 0 ? Math.round((presentStudents / (totalStudents * totalSessions)) * 100) : 0
        };
    };

    const dateStats = getDateAttendanceStats();

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
                    <p className="mt-2 text-gray-600">
                        Track and manage student attendance for your educational groups
                    </p>
                </div>

                {/* Date Selector */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 text-gray-500" />
                                <label htmlFor="attendance-date" className="text-sm font-medium text-gray-700">
                                    Select Date:
                                </label>
                            </div>
                            <input
                                id="attendance-date"
                                type="date"
                                value={format(selectedDate, 'yyyy-MM-dd')}
                                onChange={e => setSelectedDate(new Date(e.target.value))}
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                            <div className="text-sm text-gray-500">
                                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {groups.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No groups available</h3>
                            <p className="text-gray-500 mb-6">
                                Create groups and generate sessions to start tracking attendance
                            </p>
                        </CardContent>
                    </Card>
                ) : groupsWithSessionsOnDate.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions on this date</h3>
                            <p className="text-gray-500 mb-6">
                                No groups have sessions scheduled for {format(selectedDate, 'MMMM d, yyyy')}.
                                Try selecting a different date or generate sessions for your groups.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {/* Available Groups for Selected Date */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <UserGroupIcon className="h-5 w-5" />
                                    Groups with Sessions on {format(selectedDate, 'MMM d, yyyy')}
                                </CardTitle>
                                <CardDescription>
                                    Select a group to manage attendance for this date
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {groupsWithSessionsOnDate.map((group) => {
                                        const stats = getAttendanceStats(group.id);
                                        const groupTeacher = teachers.find(t => t.id === group.teacherId);
                                        const sessionsOnDate = group.sessions.filter(session => {
                                            const sessionDate = typeof session.date === 'string' ? parseISO(session.date) : session.date;
                                            return isSameDay(sessionDate, selectedDate);
                                        });

                                        return (
                                            <Card
                                                key={group.id}
                                                className={`cursor-pointer transition-all hover:shadow-md ${selectedGroupId === group.id ? 'ring-2 ring-orange-500 bg-orange-50' : ''
                                                    }`}
                                                onClick={() => setSelectedGroupId(group.id)}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h3 className="font-medium text-gray-900">{group.name}</h3>
                                                        {selectedGroupId === group.id && (
                                                            <CheckIcon className="h-5 w-5 text-orange-600" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        Teacher: {groupTeacher?.name || 'Unknown'}
                                                    </p>
                                                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                                                        <span className="flex items-center">
                                                            <UsersIcon className="h-4 w-4 mr-1" />
                                                            {group.students.length} students
                                                        </span>
                                                        <span className="flex items-center">
                                                            <ClockIcon className="h-4 w-4 mr-1" />
                                                            {sessionsOnDate.length} session{sessionsOnDate.length !== 1 ? 's' : ''} today
                                                        </span>
                                                    </div>
                                                    {stats.totalSessions > 0 && (
                                                        <div className="text-sm">
                                                            <span className="text-gray-600">Overall Attendance: </span>
                                                            <span className="font-medium text-orange-600">
                                                                {stats.averageAttendance}%
                                                            </span>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Attendance Management for Selected Group */}
                        {selectedGroup && (
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <UserGroupIcon className="h-5 w-5" />
                                                {selectedGroup.name} - Attendance
                                            </CardTitle>
                                            <CardDescription>
                                                Teacher: {teacher?.name} • {selectedGroup.students.length} students • {sessionsForSelectedDate.length} session{sessionsForSelectedDate.length !== 1 ? 's' : ''} on {format(selectedDate, 'MMM d, yyyy')}
                                            </CardDescription>
                                        </div>
                                        {dateStats && (
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-orange-600">
                                                    {dateStats.attendanceRate}%
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Attendance Rate
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {sessionsForSelectedDate.length === 0 ? (
                                        <div className="text-center py-8">
                                            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions for this date</h3>
                                            <p className="text-gray-500 mb-4">
                                                This group doesn't have any sessions scheduled for {format(selectedDate, 'MMMM d, yyyy')}.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Attendance Legend */}
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h4 className="text-sm font-medium text-gray-700 mb-3">Attendance Status Legend</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                    {attendanceOptions.map((option) => (
                                                        <div key={option.value} className="flex items-center gap-2 text-sm">
                                                            <div className={`
                                                                w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs
                                                                ${option.bgColor} ${option.color}
                                                            `}>
                                                                {option.value}
                                                            </div>
                                                            <span className="text-gray-600">{option.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Attendance Table */}
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Student
                                                            </th>
                                                            {sessionsForSelectedDate.map((session) => (
                                                                <th key={session.id} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    <div className="flex flex-col items-center">
                                                                        <span>{format(typeof session.date === 'string' ? parseISO(session.date) : session.date, 'HH:mm')}</span>
                                                                        <span className="text-xs text-gray-400">Session</span>
                                                                    </div>
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {selectedGroup.students.map((student) => (
                                                            <tr key={student.id} className="hover:bg-gray-50">
                                                                <td className="px-4 py-3 whitespace-nowrap">
                                                                    <div>
                                                                        <div className="text-sm font-medium text-gray-900">
                                                                            {student.name}
                                                                        </div>
                                                                        <div className="text-sm text-gray-500">
                                                                            {student.email || student.phone}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                {sessionsForSelectedDate.map((session) => {
                                                                    const currentStatus = getAttendanceStatus(session.id, student.id);
                                                                    const option = attendanceOptions.find(opt => opt.value === currentStatus);

                                                                    return (
                                                                        <td key={session.id} className="px-2 py-3 whitespace-nowrap text-center">
                                                                            <select
                                                                                value={currentStatus}
                                                                                onChange={(e) => handleAttendanceUpdate(session.id, student.id, e.target.value as AttendanceStatus)}
                                                                                className={`
                                                                                    w-10 h-10 rounded-full border-2 border-gray-300
                                                                                    flex items-center justify-center text-center font-bold text-sm
                                                                                    cursor-pointer appearance-none transition-all
                                                                                    hover:border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200
                                                                                    ${option?.bgColor || 'bg-gray-100'} ${option?.color || 'text-gray-800'}
                                                                                `}
                                                                                title={option?.description || 'Select attendance status'}
                                                                            >
                                                                                {attendanceOptions.map((opt) => (
                                                                                    <option key={opt.value} value={opt.value}>
                                                                                        {opt.value}
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Summary Stats */}
                                            {dateStats && (
                                                <div className="bg-orange-50 p-4 rounded-lg">
                                                    <h4 className="text-sm font-medium text-orange-800 mb-2">Summary for {format(selectedDate, 'MMM d, yyyy')}</h4>
                                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-orange-600 font-medium">Total Students:</span>
                                                            <span className="ml-2 text-gray-700">{dateStats.totalStudents}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-orange-600 font-medium">Sessions:</span>
                                                            <span className="ml-2 text-gray-700">{dateStats.totalSessions}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-orange-600 font-medium">Present:</span>
                                                            <span className="ml-2 text-gray-700">{dateStats.presentStudents}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}