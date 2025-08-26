'use client';

import React, { useState, useMemo } from 'react';
import Navigation from '../../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useMySchoolStore } from '../../store';
import AuthGuard from '../../components/AuthGuard';
import { Teacher } from '../../types';
import { GlobalKeyboardShortcuts } from '../../components/GlobalKeyboardShortcuts';
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
    const [teacherAttendance, setTeacherAttendance] = useState<{ [key: string]: { [sessionId: string]: 'present' | 'late' | 'absent' } }>({});
    const [teacherHistory, setTeacherHistory] = useState<{ [teacherId: string]: Array<{ date: string, status: 'present' | 'late' | 'absent', groupName: string, sessionId: string }> }>({});

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
                                        onClick={() => setShowEvaluationModal(true)}
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
                                                                                    Session #{index + 1} - {new Date(session.date).toLocaleDateString()}
                                                                                </span>
                                                                            </div>

                                                                            {/* Attendance Status */}
                                                                            <div className="flex items-center space-x-2">
                                                                                <span className="text-xs text-gray-500">Status:</span>
                                                                                <select
                                                                                    value={teacherAttendance[teacher.id]?.[session.id] || 'present'}
                                                                                    onChange={(e) => {
                                                                                        setTeacherAttendance(prev => ({
                                                                                            ...prev,
                                                                                            [teacher.id]: {
                                                                                                ...prev[teacher.id],
                                                                                                [session.id]: e.target.value as 'present' | 'late' | 'absent'
                                                                                            }
                                                                                        }));
                                                                                    }}
                                                                                    className="text-xs border rounded px-2 py-1"
                                                                                >
                                                                                    <option value="present">Present</option>
                                                                                    <option value="late">Late</option>
                                                                                    <option value="absent">Absent</option>
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
                        onClick={() => setShowEvaluationModal(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            // Save teacher attendance to history
                            const newHistory = { ...teacherHistory };

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
                                            if (!newHistory[teacherId]) {
                                                newHistory[teacherId] = [];
                                            }

                                            // Add to history
                                            newHistory[teacherId].push({
                                                date: selectedDate,
                                                status: status,
                                                groupName: group.name,
                                                sessionId: session.id
                                            });
                                        }
                                    });
                                });
                            });

                            setTeacherHistory(newHistory);
                            setTeacherAttendance({});
                            setShowEvaluationModal(false);

                            // Show success message
                            alert('Teacher evaluation saved successfully!');
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
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Evaluations
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
                                                    const evaluations = teacherHistory[teacher.id] || [];
                                                    const presentCount = evaluations.filter(h => h.status === 'present').length;
                                                    const totalEvaluations = evaluations.length;
                                                    const attendanceRate = totalEvaluations > 0 ? Math.round((presentCount / totalEvaluations) * 100) : 0;

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
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <span className="text-sm font-medium text-gray-900">{totalEvaluations}</span>
                                                                    {totalEvaluations > 0 && (
                                                                        <span className="ml-2 text-xs text-gray-500">
                                                                            ({attendanceRate}% present)
                                                                        </span>
                                                                    )}
                                                                </div>
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

                            {/* Groups List */}
                            <div className="space-y-3">
                                {groups
                                    .filter(group => group.teacherId === selectedHistoryTeacher.id)
                                    .map(group => {
                                        const groupEvaluations = teacherHistory[selectedHistoryTeacher.id]?.filter(h => h.groupName === group.name) || [];
                                        const presentCount = groupEvaluations.filter(h => h.status === 'present').length;
                                        const totalEvaluations = groupEvaluations.length;
                                        const attendanceRate = totalEvaluations > 0 ? Math.round((presentCount / totalEvaluations) * 100) : 0;

                                        return (
                                            <div
                                                key={group.id}
                                                className="border rounded-lg p-4 hover:bg-orange-50 transition-colors cursor-pointer"
                                                onClick={() => setSelectedHistoryGroup(group.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">{group.name}</h4>
                                                        <p className="text-sm text-gray-500">
                                                            Group #{group.id.toString().padStart(6, '0')} • {group.students.length} students
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-medium text-gray-900">{totalEvaluations} evaluations</div>
                                                        {totalEvaluations > 0 && (
                                                            <div className="text-xs text-gray-500">{attendanceRate}% present</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
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
                                                Session
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Group
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {(() => {
                                            const groupName = groups.find(g => g.id === selectedHistoryGroup)?.name || '';
                                            const groupEvaluations = teacherHistory[selectedHistoryTeacher.id]?.filter(h => h.groupName === groupName) || [];

                                            if (groupEvaluations.length === 0) {
                                                return (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                            <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                                            <p>No evaluations found for this group.</p>
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            return groupEvaluations
                                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                .map((evaluation, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {new Date(evaluation.date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            Session #{index + 1}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${evaluation.status === 'present' ? 'bg-green-100 text-green-800' :
                                                                    evaluation.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-red-100 text-red-800'
                                                                }`}>
                                                                {evaluation.status.charAt(0).toUpperCase() + evaluation.status.slice(1)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {evaluation.groupName}
                                                        </td>
                                                    </tr>
                                                ));
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