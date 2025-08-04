'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '../../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useMySchoolStore } from '../../store';
import AuthGuard from '../../components/AuthGuard';
import { WaitingListStudent } from '../../types';
import {
    UserPlusIcon,
    UsersIcon,
    PencilIcon,
    TrashIcon,
    PlusIcon,
    XMarkIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';

export default function WaitingListPage() {
    const {
        waitingList,
        fetchWaitingList,
        addToWaitingList,
        updateWaitingListStudent,
        deleteFromWaitingList,
        loading,
        error
    } = useMySchoolStore();

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState<WaitingListStudent | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        birthDate: '',
        language: '',
        level: '',
        category: '',
        notes: '',
    });

    // Language options - same as groups
    const languageOptions = [
        { value: 'french', label: 'French' },
        { value: 'english', label: 'English' },
        { value: 'spanish', label: 'Spanish' },
        { value: 'german', label: 'German' },
    ];

    // Level options - same as groups
    const levelOptions = [
        { value: 'A1', label: 'A1 - Beginner' },
        { value: 'A2', label: 'A2 - Elementary' },
        { value: 'B1', label: 'B1 - Intermediate' },
        { value: 'B2', label: 'B2 - Upper-Intermediate' },
        { value: 'C1', label: 'C1 - Advanced' },
    ];

    // Category options - same as groups
    const categoryOptions = [
        { value: 'kids', label: 'Kids' },
        { value: 'teens', label: 'Teens' },
        { value: 'adults', label: 'Adults' },
    ];

    useEffect(() => {
        fetchWaitingList();
    }, [fetchWaitingList]);

    const handleAddStudent = async () => {
        try {
            await addToWaitingList({
                name: formData.name,
                email: formData.email,
                phone: formData.phone || undefined,
                address: formData.address || undefined,
                birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
                language: formData.language,
                level: formData.level,
                category: formData.category,
                notes: formData.notes || undefined,
            });
            setShowAddModal(false);
            resetForm();
        } catch (error) {
            console.error('Error adding student to waiting list:', error);
        }
    };

    const handleEditStudent = async () => {
        if (!editingStudent) return;

        try {
            await updateWaitingListStudent(editingStudent.id, {
                name: formData.name,
                email: formData.email,
                phone: formData.phone || undefined,
                address: formData.address || undefined,
                birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
                language: formData.language,
                level: formData.level,
                category: formData.category,
                notes: formData.notes || undefined,
            });
            setShowEditModal(false);
            setEditingStudent(null);
            resetForm();
        } catch (error) {
            console.error('Error updating student in waiting list:', error);
        }
    };

    const handleDeleteStudent = async (id: string) => {
        if (confirm('Are you sure you want to remove this student from the waiting list?')) {
            try {
                await deleteFromWaitingList(id);
            } catch (error) {
                console.error('Error deleting student from waiting list:', error);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            address: '',
            birthDate: '',
            language: '',
            level: '',
            category: '',
            notes: '',
        });
    };

    const openEditModal = (student: WaitingListStudent) => {
        setEditingStudent(student);
        setFormData({
            name: student.name,
            email: student.email,
            phone: student.phone || '',
            address: student.address || '',
            birthDate: student.birthDate ? student.birthDate.toISOString().split('T')[0] : '',
            language: student.language,
            level: student.level,
            category: student.category,
            notes: student.notes || '',
        });
        setShowEditModal(true);
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
                            <h1 className="text-3xl font-bold text-gray-900">Waiting List</h1>
                            <p className="mt-2 text-gray-600">
                                Manage students waiting to be assigned to groups
                            </p>
                        </div>
                        <Button onClick={() => setShowAddModal(true)}>
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Add Student
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {waitingList.map((student) => (
                            <Card key={student.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{student.name}</CardTitle>
                                            <CardDescription>{student.email}</CardDescription>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditModal(student)}
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteStudent(student.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {student.phone && (
                                            <div className="text-sm text-gray-600">
                                                <span className="font-medium">Phone:</span> {student.phone}
                                            </div>
                                        )}
                                        {student.address && (
                                            <div className="text-sm text-gray-600">
                                                <span className="font-medium">Address:</span> {student.address}
                                            </div>
                                        )}
                                        {student.birthDate && (
                                            <div className="text-sm text-gray-600">
                                                <span className="font-medium">Birth Date:</span> {student.birthDate.toLocaleDateString()}
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {languageOptions.find(l => l.value === student.language)?.label || student.language}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {student.level}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                {categoryOptions.find(c => c.value === student.category)?.label || student.category}
                                            </span>
                                        </div>
                                        {student.notes && (
                                            <div className="text-sm text-gray-600">
                                                <span className="font-medium">Notes:</span> {student.notes}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {waitingList.length === 0 && (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <UserPlusIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No students in waiting list</h3>
                                <p className="text-gray-500 mb-6">
                                    Add students to the waiting list to start managing potential group assignments
                                </p>
                                <Button onClick={() => setShowAddModal(true)}>
                                    <PlusIcon className="h-5 w-5 mr-2" />
                                    Add First Student
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Add Student Modal */}
                <Modal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    title="Add Student to Waiting List"
                >
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Name *
                            </label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter student name"
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Address (Optional)
                            </label>
                            <Input
                                value={formData.address}
                                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="Enter address"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Birth Date (Optional)
                            </label>
                            <Input
                                type="date"
                                value={formData.birthDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
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
                                <option value="">Select Language</option>
                                {languageOptions.map((lang) => (
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
                                <option value="">Select Level</option>
                                {levelOptions.map((level) => (
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
                                <option value="">Select Category</option>
                                {categoryOptions.map((category) => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Enter any additional notes"
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowAddModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleAddStudent}>
                                Add Student
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Edit Student Modal */}
                <Modal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingStudent(null);
                    }}
                    title="Edit Student"
                >
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Name *
                            </label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter student name"
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Address (Optional)
                            </label>
                            <Input
                                value={formData.address}
                                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="Enter address"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Birth Date (Optional)
                            </label>
                            <Input
                                type="date"
                                value={formData.birthDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
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
                                <option value="">Select Language</option>
                                {languageOptions.map((lang) => (
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
                                <option value="">Select Level</option>
                                {levelOptions.map((level) => (
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
                                <option value="">Select Category</option>
                                {categoryOptions.map((category) => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Enter any additional notes"
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingStudent(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleEditStudent}>
                                Update Student
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </AuthGuard>
    );
} 