'use client';

import React, { useState } from 'react';
import Navigation from '../../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useMySchoolStore } from '../../store';
import {
    PlusIcon,
    UserGroupIcon,
    UsersIcon,
    CalendarIcon,
    PencilIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';

export default function GroupsPage() {
    const { groups, teachers, addGroup, deleteGroup, generateSessions } = useMySchoolStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        teacherId: '',
        startDate: '',
        totalSessions: 16,
        recurringDays: [] as number[],
        price: 0,
    });

    const weekDays = [
        { value: 0, label: 'Sunday' },
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' },
        { value: 6, label: 'Saturday' },
    ];

    const generateUniqueId = () => {
        // Find the highest numeric group ID
        const maxId = groups.reduce((max, group) => {
            const num = parseInt(group.id, 10);
            return !isNaN(num) && num > max ? num : max;
        }, 0);
        // Next ID, padded to 6 digits
        return String(maxId + 1).padStart(6, '0');
    };

    const handleCreateGroup = () => {
        if (!formData.teacherId || !formData.startDate || formData.recurringDays.length === 0) {
            alert('Please fill in all required fields');
            return;
        }

        const uniqueId = generateUniqueId();
        const newGroup = {
            id: uniqueId, // <-- add this line
            name: `Group ${uniqueId}`,
            teacherId: formData.teacherId,
            students: [],
            startDate: new Date(formData.startDate),
            recurringDays: formData.recurringDays,
            totalSessions: formData.totalSessions,
            price: formData.price,
        };

        addGroup(newGroup);

        // Reset form
        setFormData({
            teacherId: '',
            startDate: '',
            totalSessions: 16,
            recurringDays: [],
            price: 0,
        });

        setIsCreateModalOpen(false);
    };

    const handleDayToggle = (dayValue: number) => {
        setFormData(prev => ({
            ...prev,
            recurringDays: prev.recurringDays.includes(dayValue)
                ? prev.recurringDays.filter(d => d !== dayValue)
                : [...prev.recurringDays, dayValue],
        }));
    };

    const handleGenerateSessions = (groupId: string) => {
        generateSessions(groupId);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
                        <p className="mt-2 text-gray-600">
                            Manage your educational groups and their sessions
                        </p>
                    </div>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Create Group
                    </Button>
                </div>

                {groups.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
                            <p className="text-gray-500 mb-6">
                                Create your first educational group to get started
                            </p>
                            <Button onClick={() => setIsCreateModalOpen(true)}>
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Create Your First Group
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groups
    .slice() // create a shallow copy to avoid mutating the store
    .sort((a, b) => (b.sessions?.length || 0) - (a.sessions?.length || 0))
    .map((group) => {
        const teacher = teachers.find(t => t.id === group.teacherId);
        return (
            <Card key={group.id}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg">{group.name}</CardTitle>
                            <CardDescription>
                                Teacher: {teacher?.name || 'Unknown'}
                            </CardDescription>
                        </div>
                        <div className="flex space-x-2">
                            <Link href={`/groups/${group.id}`}>
                                <Button variant="ghost" size="sm">
                                    <PencilIcon className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteGroup(group.id)}
                                className="text-red-600 hover:text-red-700"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                            <UsersIcon className="h-4 w-4 mr-2" />
                            {group.students.length} students
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            {group.sessions.length} sessions
                        </div>
                        <div className="text-sm text-gray-600">
                            Start: {format(new Date(group.startDate), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-gray-600">
                            Days: {group.recurringDays.map(day => weekDays[day].label).join(', ')}
                        </div>

                        <div className="pt-3 space-y-2">
                            {group.sessions.length === 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleGenerateSessions(group.id)}
                                    className="w-full"
                                >
                                    Generate Sessions
                                </Button>
                            )}
                            <Link href={`/groups/${group.id}`}>
                                <Button variant="outline" size="sm" className="w-full">
                                    View Details
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    })
}
                    </div>
                )}
            </div>

            {/* Create Group Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Group"
                maxWidth="lg"
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Teacher *
                        </label>
                        <select
                            value={formData.teacherId}
                            onChange={(e) => setFormData(prev => ({ ...prev, teacherId: e.target.value }))}
                            className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                        >
                            <option value="">Select a teacher</option>
                            {teachers.map((teacher) => (
                                <option key={teacher.id} value={teacher.id}>
                                    {teacher.name}
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
                            value={formData.startDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Total Sessions
                        </label>
                        <Input
                            type="number"
                            value={formData.totalSessions}
                            onChange={(e) => setFormData(prev => ({ ...prev, totalSessions: parseInt(e.target.value) || 16 }))}
                            min="1"
                            max="100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Recurring Days *
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {weekDays.map((day) => (
                                <label key={day.value} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.recurringDays.includes(day.value)}
                                        onChange={() => handleDayToggle(day.value)}
                                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                    />
                                    <span className="text-sm text-gray-700">{day.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Student Price
                        </label>
                        <Input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleCreateGroup}>
                            Create Group
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}