import { AttendanceStatus } from '../types';

export interface AttendanceOption {
    value: AttendanceStatus;
    label: string;
    color: string;
    bgColor: string;
    displayLetter: string;
}

export const attendanceOptions: AttendanceOption[] = [
    { value: 'default', label: 'Default', color: 'text-gray-500', bgColor: 'bg-gray-100', displayLetter: 'D' },
    { value: 'present', label: 'Present', color: 'text-green-800', bgColor: 'bg-green-100', displayLetter: 'P' },
    { value: 'absent', label: 'Absent', color: 'text-red-800', bgColor: 'bg-red-100', displayLetter: 'A' },
    { value: 'justified', label: 'Justified', color: 'text-blue-800', bgColor: 'bg-blue-100', displayLetter: 'J' },
    { value: 'change', label: 'Change', color: 'text-purple-800', bgColor: 'bg-purple-100', displayLetter: 'C' },
    { value: 'stop', label: 'Stop', color: 'text-gray-800', bgColor: 'bg-gray-300', displayLetter: 'S' },
    { value: 'new', label: 'New', color: 'text-orange-800', bgColor: 'bg-orange-100', displayLetter: 'N' },
    { value: 'too_late', label: 'Too Late', color: 'text-yellow-800', bgColor: 'bg-yellow-100', displayLetter: 'L' },
];

export function getAttendanceOption(status: AttendanceStatus): AttendanceOption {
    return attendanceOptions.find(option => option.value === status) || attendanceOptions[0];
}

export function getNextAttendanceStatus(currentStatus: AttendanceStatus): AttendanceStatus {
    const currentIndex = attendanceOptions.findIndex(option => option.value === currentStatus);
    const nextIndex = (currentIndex + 1) % attendanceOptions.length;
    return attendanceOptions[nextIndex].value;
}

export function getAttendanceClasses(status: AttendanceStatus, size: 'sm' | 'md' | 'lg' = 'md'): string {
    const option = getAttendanceOption(status);
    const sizeClasses = {
        sm: 'w-6 h-6 text-xs',
        md: 'w-8 h-8 text-sm',
        lg: 'w-10 h-10 text-base'
    };

    return `${sizeClasses[size]} rounded-full flex items-center justify-center cursor-pointer transition-colors ${option.bgColor} ${option.color} hover:opacity-80`;
}

export function getAttendanceDisplayLetter(status: AttendanceStatus): string {
    const option = getAttendanceOption(status);
    return option.displayLetter;
}

export function getAttendanceTitle(status: AttendanceStatus): string {
    const option = getAttendanceOption(status);
    return `${option.label} - Click to cycle to next status`;
} 