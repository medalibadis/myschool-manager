'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../../components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import AuthGuard from '../../../components/AuthGuard';
import { useMySchoolStore } from '../../../store';
import { ArrowLeftIcon, UserPlusIcon, EnvelopeIcon, PhoneIcon, BanknotesIcon } from '@heroicons/react/24/outline';

export default function NewTeacherPage() {
    const router = useRouter();
    const { addTeacher, loading, error } = useMySchoolStore();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        price_per_session: 1000,
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: field === 'price_per_session' ? Number(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.price_per_session) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            await addTeacher(formData);
            router.push('/teachers');
        } catch (err) {
            console.error('Error creating teacher:', err);
        }
    };

    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50 pb-12">
                <Navigation />

                <div className="lg:ml-16">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            className="mb-6"
                        >
                            <ArrowLeftIcon className="h-4 w-4 mr-2" />
                            Back to Teachers
                        </Button>

                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">Add New Teacher</h1>
                            <p className="mt-2 text-gray-600">Register a new teaching staff member to the system.</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
                                <span className="font-medium">Error:</span> {error}
                            </div>
                        )}

                        <Card className="shadow-lg border-0">
                            <CardHeader className="bg-orange-600 text-white rounded-t-lg">
                                <CardTitle className="flex items-center">
                                    <UserPlusIcon className="h-6 w-6 mr-2" />
                                    Teacher Information
                                </CardTitle>
                                <CardDescription className="text-orange-100">
                                    Enter the details of the new teacher
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Full Name *
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <UserPlusIcon className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <Input
                                                    value={formData.name}
                                                    onChange={(e) => handleChange('name', e.target.value)}
                                                    placeholder="John Doe"
                                                    required
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Email Address *
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <Input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => handleChange('email', e.target.value)}
                                                    placeholder="john.doe@example.com"
                                                    required
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Phone Number
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <Input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => handleChange('phone', e.target.value)}
                                                    placeholder="+213..."
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Price per Session (DA) *
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <BanknotesIcon className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <Input
                                                    type="number"
                                                    value={formData.price_per_session}
                                                    onChange={(e) => handleChange('price_per_session', e.target.value)}
                                                    placeholder="1000"
                                                    min="0"
                                                    step="50"
                                                    required
                                                    className="pl-10"
                                                />
                                            </div>
                                            <p className="mt-2 text-xs text-gray-500">
                                                This is the default payment rate for this teacher.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-4 pt-6">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => router.back()}
                                            disabled={loading}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="bg-orange-600 hover:bg-orange-700 text-white"
                                            disabled={loading}
                                        >
                                            {loading ? 'Adding...' : 'Add Teacher'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}
