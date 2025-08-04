'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

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

export default function TestAttendancePage() {
    const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>('default');

    const handleClick = () => {
        const currentIndex = attendanceOptions.findIndex(opt => opt.value === attendanceStatus);
        const nextIndex = (currentIndex + 1) % attendanceOptions.length;
        const nextStatus = attendanceOptions[nextIndex].value;
        setAttendanceStatus(nextStatus);
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

    const option = attendanceOptions.find(opt => opt.value === attendanceStatus);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Attendance Circle Test</h1>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Test Attendance Circle</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center">
                            <p className="text-gray-600 mb-4">Click the circle below to cycle through attendance statuses:</p>

                            <div className="flex flex-col items-center space-y-4">
                                <div
                                    className={`
                                        w-16 h-16 rounded-full border-2 border-gray-300
                                        flex items-center justify-center text-center font-bold text-lg
                                        cursor-pointer transition-all hover:scale-110
                                        ${option?.bgColor || 'bg-gray-100'} ${option?.color || 'text-gray-800'}
                                        ${attendanceStatus === 'present' ? 'ring-2 ring-green-500' : ''}
                                        ${attendanceStatus === 'absent' ? 'ring-2 ring-red-500' : ''}
                                        ${attendanceStatus === 'justified' ? 'ring-2 ring-blue-500' : ''}
                                        ${attendanceStatus === 'change' ? 'ring-2 ring-purple-500' : ''}
                                        ${attendanceStatus === 'stop' ? 'ring-2 ring-gray-500' : ''}
                                        ${attendanceStatus === 'new' ? 'ring-2 ring-orange-500' : ''}
                                        ${attendanceStatus === 'default' ? 'ring-2 ring-gray-400' : ''}
                                    `}
                                    onClick={handleClick}
                                    title={`${option?.label || 'Default'} - Click to change`}
                                >
                                    {getDisplayLetter(attendanceStatus)}
                                </div>
                                <div className="text-sm text-gray-500">
                                    Current Status: {option?.label || 'Default'}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>All Attendance Statuses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {attendanceOptions.map((option) => (
                                <div key={option.value} className="flex items-center gap-3 p-3 border rounded-lg">
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                        ${option.bgColor} ${option.color}
                                    `}>
                                        {getDisplayLetter(option.value)}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{option.label}</div>
                                        <div className="text-xs text-gray-500">{option.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-8 text-center">
                    <a
                        href="/attendance"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Go to Real Attendance Page
                    </a>
                </div>
            </div>
        </div>
    );
} 