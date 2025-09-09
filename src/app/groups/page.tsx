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
    FunnelIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';
import { formatDuration } from '../../utils/timeUtils';
import ProgressBar from '../../components/ProgressBar';
import { GlobalKeyboardShortcuts } from '../../components/GlobalKeyboardShortcuts';

export default function GroupsPage() {
    const {
        groups,
        teachers,
        addGroup,
        updateGroup,
        deleteGroup,
        generateSessions,
        fetchGroups,
        fetchTeachers,
        loading,
        error
    } = useMySchoolStore();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);
    const [editingGroup, setEditingGroup] = useState<any>(null);
    const [formData, setFormData] = useState({
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
    });

    // Search state
    const [searchTerm, setSearchTerm] = useState('');

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

    const categories = [
        { value: 'Children', label: 'Children' },
        { value: 'Teenagers', label: 'Teenagers' },
        { value: 'Adults', label: 'Adults' },
    ];

    const generateGroupName = () => {
        // Utility function to convert language, level, and category to abbreviated names
        const getAbbreviatedGroupName = (language: string, level: string, category: string): string => {
            // Language abbreviations
            const languageAbbr: { [key: string]: string } = {
                'English': 'Eng', 'French': 'Fre', 'Spanish': 'Spa', 'German': 'Ger', 'Italian': 'Ita',
                'Arabic': 'Ara', 'Chinese': 'Chi', 'Japanese': 'Jap', 'Korean': 'Kor', 'Russian': 'Rus',
                'Portuguese': 'Por', 'Dutch': 'Dut', 'Swedish': 'Swe', 'Norwegian': 'Nor', 'Danish': 'Dan',
                'Finnish': 'Fin', 'Polish': 'Pol', 'Czech': 'Cze', 'Hungarian': 'Hun', 'Romanian': 'Rom',
                'Bulgarian': 'Bul', 'Croatian': 'Cro', 'Serbian': 'Ser', 'Slovenian': 'Slo', 'Slovak': 'Slk',
                'Estonian': 'Est', 'Latvian': 'Lat', 'Lithuanian': 'Lit', 'Greek': 'Gre', 'Turkish': 'Tur',
                'Hebrew': 'Heb', 'Hindi': 'Hin', 'Urdu': 'Urd', 'Bengali': 'Ben', 'Tamil': 'Tam',
                'Telugu': 'Tel', 'Marathi': 'Mar', 'Gujarati': 'Guj', 'Kannada': 'Kan', 'Malayalam': 'Mal',
                'Punjabi': 'Pun', 'Sinhala': 'Sin', 'Thai': 'Tha', 'Vietnamese': 'Vie', 'Indonesian': 'Ind',
                'Malay': 'May', 'Filipino': 'Fil'
            };

            // Level abbreviations
            const levelAbbr: { [key: string]: string } = {
                'Beginner': 'Beg', 'Elementary': 'Ele', 'Pre-Intermediate': 'Pre', 'Intermediate': 'Int',
                'Upper-Intermediate': 'Upp', 'Advanced': 'Adv', 'Proficient': 'Pro', 'A1': 'A1', 'A2': 'A2',
                'B1': 'B1', 'B2': 'B2', 'C1': 'C1', 'C2': 'C2', 'A1+': 'A1+', 'A2+': 'A2+', 'B1+': 'B1+',
                'B2+': 'B2+', 'C1+': 'C1+'
            };

            // Category abbreviations
            const categoryAbbr: { [key: string]: string } = {
                'Children': 'Child', 'Teenagers': 'Teens', 'Adults': 'Adults', 'Seniors': 'Seniors',
                'Business': 'Bus', 'Academic': 'Acad', 'Conversation': 'Conv', 'Grammar': 'Gram',
                'Writing': 'Writ', 'Reading': 'Read', 'Listening': 'List', 'Speaking': 'Speak',
                'Exam Preparation': 'Exam', 'TOEFL': 'TOEFL', 'IELTS': 'IELTS', 'TOEIC': 'TOEIC',
                'Cambridge': 'Camb', 'DELF': 'DELF', 'DALF': 'DALF', 'DELE': 'DELE', 'TestDaF': 'TestDaF',
                'Goethe': 'Goethe', 'HSK': 'HSK', 'JLPT': 'JLPT', 'TOPIK': 'TOPIK'
            };

            // Handle custom values and avoid "other" abbreviations
            const langAbbr = languageAbbr[language] || (language && language !== 'other' ? language.substring(0, 3).toUpperCase() : 'Gen');
            const levelAbbr_ = levelAbbr[level] || (level && level !== 'other' ? level : 'Gen');
            const catAbbr = categoryAbbr[category] || (category && category !== 'other' ? category.substring(0, 4) : 'Gen');

            return `${langAbbr}|${levelAbbr_}|${catAbbr}`;
        };

        return getAbbreviatedGroupName(formData.language, formData.level, formData.category);
    };

    const handleCreateGroup = async () => {
        if (!formData.teacherId || !formData.startDate || formData.recurringDays.length === 0 ||
            !formData.language || !formData.level || !formData.category ||
            !formData.startTime || !formData.endTime) {
            alert('Please fill in all required fields');
            return;
        }

        // Prevent double-clicking
        if (isCreatingGroup) {
            console.log('Group creation already in progress, ignoring click');
            return;
        }

        try {
            setIsCreatingGroup(true);
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
                startTime: formData.startTime,
                endTime: formData.endTime,
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
                startTime: '09:00',
                endTime: '11:00',
            });

            setIsCreateModalOpen(false);
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Failed to create group. Please try again.');
        } finally {
            setIsCreatingGroup(false);
        }
    };

    const handleEditGroup = (group: any) => {
        setEditingGroup(group);
        setFormData({
            teacherId: group.teacherId,
            startDate: format(new Date(group.startDate), 'yyyy-MM-dd'),
            totalSessions: group.totalSessions,
            recurringDays: group.recurringDays,
            price: group.price || 0,
            language: group.language || '',
            level: group.level || '',
            category: group.category || '',
            startTime: group.startTime || '09:00',
            endTime: group.endTime || '11:00',
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateGroup = async () => {
        if (!formData.teacherId || !formData.startDate || formData.recurringDays.length === 0 ||
            !formData.language || !formData.level || !formData.category ||
            !formData.startTime || !formData.endTime) {
            alert('Please fill in all required fields');
            return;
        }

        // Prevent double-clicking
        if (isUpdatingGroup) {
            console.log('Group update already in progress, ignoring click');
            return;
        }

        try {
            setIsUpdatingGroup(true);
            const updatedGroup = {
                name: generateGroupName(),
                teacherId: formData.teacherId,
                startDate: new Date(formData.startDate),
                recurringDays: formData.recurringDays,
                totalSessions: formData.totalSessions,
                language: formData.language,
                level: formData.level,
                category: formData.category,
                price: formData.price,
                startTime: formData.startTime,
                endTime: formData.endTime,
            };

            await updateGroup(editingGroup.id, updatedGroup);
            await fetchGroups();

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
                startTime: '09:00',
                endTime: '11:00',
            });

            setIsEditModalOpen(false);
            setEditingGroup(null);
        } catch (error) {
            console.error('Error updating group:', error);
            alert('Failed to update group. Please try again.');
        } finally {
            setIsUpdatingGroup(false);
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
            French: '🇫🇷',
            English: '🇬🇧',
            Spanish: '🇪🇸',
            German: '🇩🇪',
        };
        return flags[language] || '🌐';
    };

    const getCategoryIcon = (category: string) => {
        const icons: { [key: string]: string } = {
            Children: '👶',
            Teenagers: '👨‍🎓',
            Adults: '👨‍💼',
        };
        return icons[category] || '👥';
    };

    const formatGroupId = (id: number) => {
        return id.toString().padStart(6, '0');
    };

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

    // Filter groups based on search term
    const filteredGroups = groups.filter(group => {
        if (searchTerm === '') return true;

        const searchLower = searchTerm.toLowerCase();
        const teacher = teachers.find(t => t.id === group.teacherId);
        const teacherName = teacher?.name?.toLowerCase() || '';
        const groupId = group.id.toString();

        return (
            group.name.toLowerCase().includes(searchLower) ||
            group.language?.toLowerCase().includes(searchLower) ||
            group.level?.toLowerCase().includes(searchLower) ||
            teacherName.includes(searchLower) ||
            groupId.includes(searchTerm) ||
            formatGroupId(group.id).toLowerCase().includes(searchLower)
        );
    });

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

                            {/* Search */}
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                                        Search Groups
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                <Input
                                                    type="text"
                                                    placeholder="Search by group name, teacher name, group ID, language, or level..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Button
                                                variant="outline"
                                                onClick={() => setSearchTerm('')}
                                                className="whitespace-nowrap"
                                            >
                                                Clear Search
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Scrollable Table Section */}
                        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                            <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Group
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Teacher
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Time
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Study Days
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Students
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Progress
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredGroups.map((group) => (
                                            <tr
                                                key={group.id}
                                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                                                onClick={() => window.location.href = `/groups/${group.id}`}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {group.name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    #{formatGroupId(group.id)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div>
                                                        <div className="font-medium">{teachers.find(t => t.id === group.teacherId)?.name || 'Unknown Teacher'}</div>
                                                        <div className="text-gray-500">{group.teacherId ? `#${formatTeacherId(group.teacherId)}` : 'No Teacher'}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {group.startTime && group.endTime ? (
                                                        formatDuration(group.startTime, group.endTime)
                                                    ) : (
                                                        'N/A'
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {group.recurringDays && group.recurringDays.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {group.recurringDays.map((day: number) => {
                                                                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                                                return (
                                                                    <span
                                                                        key={day}
                                                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                                                                    >
                                                                        {dayNames[day]}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        'N/A'
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {group.students.length} students
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-1 mr-2">
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                                                                    style={{
                                                                        width: `${Math.min(100, ((group.progress?.completedSessions || 0) / group.totalSessions) * 100)}%`
                                                                    }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                        <span className="text-sm text-gray-600">
                                                            {group.progress?.completedSessions || 0}/{group.totalSessions}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {filteredGroups.length === 0 && (
                            <div className="text-center py-12">
                                <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {searchTerm ? 'No groups found' : 'No groups yet'}
                                </h3>
                                <p className="text-gray-500 mb-6">
                                    {searchTerm
                                        ? 'Try adjusting your search terms'
                                        : 'Create your first group to start managing students and sessions'
                                    }
                                </p>
                                {!searchTerm && (
                                    <Button onClick={() => setIsCreateModalOpen(true)}>
                                        <PlusIcon className="h-5 w-5 mr-2" />
                                        Create First Group
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Group Modal */}
                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    title="Create New Group"
                    maxWidth="2xl"
                >
                    <div className="space-y-4">
                        {/* Row 1: Teacher, Start Date */}
                        <div className="grid grid-cols-2 gap-4">
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
                        </div>

                        {/* Row 2: Language, Level, Category */}
                        <div className="grid grid-cols-3 gap-4">
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
                        </div>

                        {/* Row 3: Group Fees, Start Time, End Time */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Group Fees *
                                </label>
                                <Input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                    placeholder="0.00"
                                    min="0"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Total fees for the entire group course
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Time *
                                </label>
                                <Input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Time *
                                </label>
                                <Input
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        {/* Row 4: Total Sessions, Recurring Days */}
                        <div className="grid grid-cols-2 gap-4">
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
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setIsCreateModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleCreateGroup} disabled={isCreatingGroup}>
                                {isCreatingGroup ? 'Creating...' : 'Create Group'}
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Edit Group Modal */}
                <Modal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingGroup(null);
                    }}
                    title="Edit Group"
                    maxWidth="2xl"
                >
                    <div className="space-y-4">
                        {/* Row 1: Teacher, Start Date */}
                        <div className="grid grid-cols-2 gap-4">
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
                        </div>

                        {/* Row 2: Language, Level, Category */}
                        <div className="grid grid-cols-3 gap-4">
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
                        </div>

                        {/* Row 3: Group Fees, Start Time, End Time */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Group Fees *
                                </label>
                                <Input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                    placeholder="0.00"
                                    min="0"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Total fees for the entire group course
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Time *
                                </label>
                                <Input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Time *
                                </label>
                                <Input
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        {/* Row 4: Total Sessions, Recurring Days */}
                        <div className="grid grid-cols-2 gap-4">
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
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setEditingGroup(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateGroup} disabled={isUpdatingGroup}>
                                {isUpdatingGroup ? 'Updating...' : 'Update Group'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
            <GlobalKeyboardShortcuts
                onAddNew={() => setIsCreateModalOpen(true)}
                isModalOpen={isCreateModalOpen}
            />
        </AuthGuard>
    );
} 