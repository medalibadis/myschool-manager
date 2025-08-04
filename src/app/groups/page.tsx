'use client';

import React, { useState } from 'react';
import Navigation from '../../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useMySchoolStore } from '../../store';
import AuthGuard from '../../components/AuthGuard';
import {
    PlusIcon,
    UserGroupIcon,
    UsersIcon,
    CalendarIcon,
    PencilIcon,
    TrashIcon,
    GlobeAltIcon,
    AcademicCapIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';

export default function GroupsPage() {
    const {
        groups,
        teachers,
        addGroup,
        deleteGroup,
        generateSessions,
        fetchGroups,
        fetchTeachers,
        loading,
        error
    } = useMySchoolStore();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        teacherId: '',
        startDate: '',
        totalSessions: 16,
        recurringDays: [] as number[],
        price: 0,
        language: '',
        level: '',
        category: '',
    });

    // Fetch data on component mount
    React.useEffect(() => {
        fetchGroups();
        fetchTeachers();
    }, [fetchGroups, fetchTeachers]);

    const weekDays = [
        { value: 0, label: 'Sunday' },
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' },
        { value: 6, label: 'Saturday' },
    ];

    // New options for the additional fields
    const languages = [
        { value: 'french', label: 'French' },
        { value: 'english', label: 'English' },
        { value: 'spanish', label: 'Spanish' },
        { value: 'german', label: 'German' },
    ];

    const levels = [
        { value: 'A1', label: 'A1 - Beginner' },
        { value: 'A2', label: 'A2 - Elementary' },
        { value: 'B1', label: 'B1 - Intermediate' },
        { value: 'B2', label: 'B2 - Upper-Intermediate' },
        { value: 'C1', label: 'C1 - Advanced' },
    ];

    const categories = [
        { value: 'kids', label: 'Kids' },
        { value: 'teens', label: 'Teens' },
        { value: 'adults', label: 'Adults' },
    ];

    const generateGroupName = () => {
        const languageLabel = languages.find(l => l.value === formData.language)?.label || '';
        const levelLabel = formData.level;
        const categoryLabel = categories.find(c => c.value === formData.category)?.label || '';

        return `${languageLabel} ${levelLabel} - ${categoryLabel}`.trim();
    };

    const handleCreateGroup = async () => {
        if (!formData.teacherId || !formData.startDate || formData.recurringDays.length === 0 ||
            !formData.language || !formData.level || !formData.category) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const newGroup = {
                name: generateGroupName(),
                teacherId: formData.teacherId,
                startDate: new Date(formData.startDate),
                recurringDays: formData.recurringDays,
                totalSessions: formData.totalSessions,
                language: formData.language,
                level: formData.level,
                category: formData.category,
                price: formData.price,
                students: [],
            };

            await addGroup(newGroup);

            // After addGroup, refresh groups and generate sessions for the latest group
            await fetchGroups();
            const latestGroup = groups[groups.length - 1];
            if (latestGroup) {
                await generateSessions(latestGroup.id);
            }

            // Reset form
            setFormData({
                teacherId: '',
                startDate: '',
                totalSessions: 16,
                recurringDays: [],
                price: 0,
                language: '',
                level: '',
                category: '',
            });

            setIsCreateModalOpen(false);
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Failed to create group. Please try again.');
        }
    };

    const handleDeleteGroup = async (groupId: number) => {
        if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
            try {
                await deleteGroup(groupId);
            } catch (error) {
                console.error('Error deleting group:', error);
                alert('Failed to delete group. Please try again.');
            }
        }
    };

    const handleDayToggle = (dayValue: number) => {
        setFormData(prev => ({
            ...prev,
            recurringDays: prev.recurringDays.includes(dayValue)
                ? prev.recurringDays.filter(day => day !== dayValue)
                : [...prev.recurringDays, dayValue]
        }));
    };

    const getLanguageFlag = (language: string) => {
        const flags: { [key: string]: string } = {
            french: '🇫🇷',
            english: '🇬🇧',
            spanish: '🇪🇸',
            german: '🇩🇪',
        };
        return flags[language] || '🌐';
    };

    const getCategoryIcon = (category: string) => {
        const icons: { [key: string]: string } = {
            kids: '👶',
            teens: '👨‍🎓',
            adults: '👨‍💼',
        };
        return icons[category] || '👥';
    };

    const formatGroupId = (id: number) => {
        return id.toString().padStart(6, '0');
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groups.map((group) => (
                            <Card key={group.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{group.name}</CardTitle>
                                            <CardDescription>
                                                Group #{formatGroupId(group.id)}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-2xl">{getLanguageFlag(group.language || '')}</span>
                                            <span className="text-xl">{getCategoryIcon(group.category || '')}</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <UsersIcon className="h-4 w-4 mr-2" />
                                            <span>{group.students.length} students</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <CalendarIcon className="h-4 w-4 mr-2" />
                                            <span>{group.sessions.length} sessions</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <AcademicCapIcon className="h-4 w-4 mr-2" />
                                            <span>{group.level || 'N/A'}</span>
                                        </div>
                                        {group.price && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <UserIcon className="h-4 w-4 mr-2" />
                                                <span>${group.price}/session</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 flex space-x-2">
                                        <Link href={`/groups/${group.id}`}>
                                            <Button variant="outline" size="sm" className="flex-1">
                                                View Details
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteGroup(group.id)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {groups.length === 0 && (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
                                <p className="text-gray-500 mb-6">
                                    Create your first group to start managing students and sessions
                                </p>
                                <Button onClick={() => setIsCreateModalOpen(true)}>
                                    <PlusIcon className="h-5 w-5 mr-2" />
                                    Create First Group
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Create Group Modal */}
                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    title="Create New Group"
                >
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Teacher *
                            </label>
                            <select
                                value={formData.teacherId}
                                onChange={(e) => setFormData(prev => ({ ...prev, teacherId: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                required
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
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Language *
                            </label>
                            <select
                                value={formData.language}
                                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                required
                            >
                                <option value="">Select language</option>
                                {languages.map((lang) => (
                                    <option key={lang.value} value={lang.value}>
                                        {lang.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Level *
                            </label>
                            <select
                                value={formData.level}
                                onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                required
                            >
                                <option value="">Select level</option>
                                {levels.map((level) => (
                                    <option key={level.value} value={level.value}>
                                        {level.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category *
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                required
                            >
                                <option value="">Select category</option>
                                {categories.map((category) => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Price per Session
                            </label>
                            <Input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
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
                                max="52"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Recurring Days *
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {weekDays.map((day) => (
                                    <label key={day.value} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.recurringDays.includes(day.value)}
                                            onChange={() => handleDayToggle(day.value)}
                                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">{day.label}</span>
                                    </label>
                                ))}
                            </div>
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
        </AuthGuard>
    );
}