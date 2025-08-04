'use client';

import React, { useState } from 'react';
import Navigation from '../../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useMySchoolStore } from '../../store';
import AuthGuard from '../../components/AuthGuard';
import { Teacher } from '../../types';
import {
    PlusIcon,
    UsersIcon,
    PencilIcon,
    TrashIcon,
    EnvelopeIcon,
    PhoneIcon,
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
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
    });

    // Fetch teachers on component mount
    React.useEffect(() => {
        fetchTeachers();
    }, [fetchTeachers]);

    const handleCreateTeacher = async () => {
        if (!formData.name || !formData.email) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            await addTeacher(formData);

            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
            });

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

    const getTeacherStats = (teacherId: string) => {
        const teacherGroups = groups.filter(group => group.teacherId === teacherId);
        const totalStudents = teacherGroups.reduce((sum, group) => sum + group.students.length, 0);
        const totalSessions = teacherGroups.reduce((sum, group) => sum + group.sessions.length, 0);

        return { groups: teacherGroups.length, students: totalStudents, sessions: totalSessions };
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
                            <h1 className="text-3xl font-bold text-gray-900">Teachers</h1>
                            <p className="mt-2 text-gray-600">
                                Manage your teaching staff and their assignments
                            </p>
                        </div>
                        <Button onClick={() => setIsCreateModalOpen(true)}>
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Add Teacher
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teachers.map((teacher) => {
                            const stats = getTeacherStats(teacher.id);
                            return (
                                <Card key={teacher.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">{teacher.name}</CardTitle>
                                                <CardDescription>{teacher.email}</CardDescription>
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditClick(teacher)}
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteTeacher(teacher.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {teacher.phone && (
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <PhoneIcon className="h-4 w-4 mr-2" />
                                                    <span>{teacher.phone}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center text-sm text-gray-600">
                                                <UsersIcon className="h-4 w-4 mr-2" />
                                                <span>{stats.groups} groups</span>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <EnvelopeIcon className="h-4 w-4 mr-2" />
                                                <span>{stats.students} students</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {teachers.length === 0 && (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No teachers yet</h3>
                                <p className="text-gray-500 mb-6">
                                    Add your first teacher to start creating groups
                                </p>
                                <Button onClick={() => setIsCreateModalOpen(true)}>
                                    <PlusIcon className="h-5 w-5 mr-2" />
                                    Add First Teacher
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Create Teacher Modal */}
                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    title="Add New Teacher"
                >
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Name *
                            </label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
                                value={formData.phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="Enter phone number"
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setIsCreateModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleCreateTeacher}>
                                Add Teacher
                            </Button>
                        </div>
                    </div>
                </Modal>

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
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
                                value={formData.phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
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
            </div>
        </AuthGuard>
    );
} 