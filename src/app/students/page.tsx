'use client';

import React, { useState, useMemo } from 'react';
import Navigation from '../../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useMySchoolStore } from '../../store';
import AuthGuard from '../../components/AuthGuard';
import { Student } from '../../types';
import {
    UsersIcon,
    UserIcon,
    MapPinIcon,
    PhoneIcon,
    AcademicCapIcon,
    MagnifyingGlassIcon,
    GlobeAltIcon,
    CalendarIcon,
    UserGroupIcon,
    PencilIcon,
    EyeIcon,
    PhoneIcon as PhoneIconSolid,
    EnvelopeIcon,
    PencilSquareIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';
import { formatTimeSimple } from '../../utils/timeUtils';
import Modal from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';

export default function StudentsPage() {
    const {
        groups,
        teachers,
        fetchGroups,
        fetchTeachers,
        loading,
        error
    } = useMySchoolStore();

    // Search state
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [selectedStudent, setSelectedStudent] = useState<(Student & { groups: Array<{ id: string | number; name: string; status: string; language: string; category: string; level: string; teacherId: string; startTime?: string; endTime?: string }> }) | null>(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCallLogModal, setShowCallLogModal] = useState(false);
    const [callLogData, setCallLogData] = useState({
        studentName: '',
        studentPhone: '',
        studentSecondPhone: '',
        adminName: '',
        comment: '',
    });
    const [editStudentData, setEditStudentData] = useState({
        name: '',
        email: '',
        phone: '',
        secondPhone: '',
        parentName: '',
        address: '',
        birthDate: '',
        courseFee: '',
    });

    React.useEffect(() => {
        fetchGroups();
        fetchTeachers();
    }, [fetchGroups, fetchTeachers]);

    // Get all students from all groups with their actual status
    const allStudents = useMemo(() => {
        const studentsMap = new Map<string, Student & { groups: Array<{ id: string | number; name: string; status: string; language: string; category: string; level: string; teacherId: string; startTime?: string; endTime?: string }> }>();

        console.log('Processing groups for students:', groups.length);

        groups.forEach(group => {
            console.log(`Group ${group.id} (${group.name}) has ${group.students?.length || 0} students`);

            if (group.students) {
                group.students.forEach(student => {
                    console.log(`Processing student: ${student.name} (ID: ${student.id}) in group ${group.id}`);

                    // Use a combination of name and phone for deduplication since IDs might be different
                    const studentKey = `${student.name}-${student.phone}`;

                    // Get the actual status from student_groups table if available
                    const actualStatus = (student as any).groupStatus || 'active';

                    if (studentsMap.has(studentKey)) {
                        // Student already exists, add this group to their groups array
                        const existingStudent = studentsMap.get(studentKey);

                        // Check if this group is already added to avoid duplicates
                        const groupExists = existingStudent?.groups?.some((g: { id: string | number }) => g.id === group.id);

                        if (!groupExists && existingStudent) {
                            console.log(`Student ${student.name} already exists, adding group ${group.name} with status: ${actualStatus}`);
                            existingStudent.groups.push({
                                id: group.id,
                                name: group.name,
                                language: group.language || 'Unknown',
                                level: group.level || 'Unknown',
                                category: group.category || 'Unknown',
                                teacherId: group.teacherId || '',
                                startTime: group.startTime,
                                endTime: group.endTime,
                                status: actualStatus,
                            });
                        } else {
                            console.log(`Student ${student.name} already has group ${group.name}, skipping`);
                        }
                    } else {
                        // New student, create entry
                        console.log(`Creating new student entry for ${student.name} with status: ${actualStatus}`);
                        studentsMap.set(studentKey, {
                            ...student,
                            groups: [{
                                id: group.id,
                                name: group.name,
                                language: group.language || 'Unknown',
                                level: group.level || 'Unknown',
                                category: group.category || 'Unknown',
                                teacherId: group.teacherId || '',
                                startTime: group.startTime,
                                endTime: group.endTime,
                                status: actualStatus,
                            }]
                        });
                    }
                });
            }
        });

        const result = Array.from(studentsMap.values());
        console.log('Final deduplicated students:', result.length);
        result.forEach(student => {
            console.log(`Student: ${student.name} - Groups: ${student.groups.length}`);
            student.groups.forEach((group: { name: string; status: string }) => {
                console.log(`  Group ${group.name}: status = ${group.status}`);
            });
        });

        return result;
    }, [groups]);

    // Filter students based on search term
    const filteredStudents = useMemo(() => {
        return allStudents.filter(student => {
            const matchesSearch = searchTerm === '' ||
                student.name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
                student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.address?.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesSearch;
        });
    }, [allStudents, searchTerm]);

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

    const getTeacherName = (teacherId: string) => {
        const teacher = teachers.find(t => t.id === teacherId);
        return teacher?.name || 'Unknown Teacher';
    };

    const handleViewProfile = (student: Student & { groups: Array<{ id: string | number; name: string; status: string; language: string; category: string; level: string; teacherId: string; startTime?: string; endTime?: string }> }) => {
        setSelectedStudent(student);
        setShowProfileModal(true);
    };

    const handleEditStudent = (student: Student & { groups: Array<{ id: string | number; name: string; status: string; language: string; category: string; level: string; teacherId: string; startTime?: string; endTime?: string }> }) => {
        setEditStudentData({
            name: student.name || '',
            email: student.email || '',
            phone: student.phone || '',
            secondPhone: student.secondPhone || '',
            parentName: student.parentName || '',
            address: student.address || '',
            birthDate: student.birthDate ? format(new Date(student.birthDate), 'yyyy-MM-dd') : '',
            courseFee: student.courseFee ? student.courseFee.toString() : '',
        });
        setSelectedStudent(student);
        setShowEditModal(true);
    };

    const handleSaveEditStudent = async () => {
        if (!editStudentData.name.trim()) {
            alert('Please enter student name');
            return;
        }

        try {
            // Update student in all groups where they exist
            const updatedStudent = {
                name: editStudentData.name,
                email: editStudentData.email || undefined,
                phone: editStudentData.phone || undefined,
                secondPhone: editStudentData.secondPhone || undefined,
                parentName: editStudentData.parentName || undefined,
                address: editStudentData.address || undefined,
                birthDate: editStudentData.birthDate ? new Date(editStudentData.birthDate) : undefined,
                courseFee: editStudentData.courseFee ? parseFloat(editStudentData.courseFee) : undefined,
            };

            // Update student in all groups where they exist
            if (selectedStudent?.groups) {
                for (const group of selectedStudent.groups) {
                    await useMySchoolStore.getState().updateStudent(
                        Number(group.id),
                        selectedStudent.id,
                        updatedStudent
                    );
                }
            }

            // Refresh data
            await useMySchoolStore.getState().fetchGroups();

            setShowEditModal(false);
            setSelectedStudent(null);
            setEditStudentData({
                name: '',
                email: '',
                phone: '',
                secondPhone: '',
                parentName: '',
                address: '',
                birthDate: '',
                courseFee: '',
            });
            alert('Student updated successfully!');
        } catch (error) {
            console.error('Error updating student:', error);
            alert('Failed to update student. Please try again.');
        }
    };

    const handleCallLog = (student: Student & { groups: Array<{ id: string | number; name: string; status: string; language: string; category: string; level: string; teacherId: string; startTime?: string; endTime?: string }> }) => {
        setCallLogData({
            studentName: student.name,
            studentPhone: student.phone || '',
            studentSecondPhone: student.secondPhone || '',
            adminName: 'Dalila', // Default admin name
            comment: '',
        });
        setSelectedStudent(student);
        setShowCallLogModal(true);
    };

    const handleSaveCallLog = async () => {
        if (!callLogData.adminName.trim()) {
            alert('Please enter admin name');
            return;
        }

        try {
            let studentId = null;

            // First, try to find if this student already exists in the waiting list
            const { data: existingStudents } = await supabase
                .from('waiting_list')
                .select('id')
                .eq('name', callLogData.studentName)
                .eq('phone', callLogData.studentPhone)
                .limit(1);

            if (existingStudents && existingStudents.length > 0) {
                studentId = existingStudents[0].id;
            } else {
                // Create a temporary student in the waiting list for this call log
                // Use a default email if the student doesn't have one
                const defaultEmail = `${callLogData.studentName.toLowerCase().replace(/\s+/g, '.')}@temp.calllog.com`;

                const { data: newStudent, error: createError } = await supabase
                    .from('waiting_list')
                    .insert({
                        name: callLogData.studentName,
                        email: defaultEmail, // Use default email for temporary entries
                        phone: callLogData.studentPhone,
                        second_phone: callLogData.studentSecondPhone || null,
                        language: 'other',
                        level: 'other',
                        category: 'other',
                        notes: `Temporary entry for call log - ${callLogData.comment || 'No additional notes'}`,
                    })
                    .select('id')
                    .single();

                if (createError) {
                    console.error('Error creating temporary student:', createError);
                    throw new Error('Failed to create temporary student for call log');
                }

                studentId = newStudent.id;
            }

            const callLogDataToSave = {
                studentId: studentId,
                callDate: new Date(),
                callType: 'other' as const,
                status: 'coming' as const, // Use valid status value
                notes: callLogData.comment || '',
                adminName: callLogData.adminName,
            };

            // Add call log to the store
            await useMySchoolStore.getState().addCallLog(callLogDataToSave);

            // Refresh call logs
            await useMySchoolStore.getState().fetchCallLogs();

            setShowCallLogModal(false);
            setCallLogData({
                studentName: '',
                studentPhone: '',
                studentSecondPhone: '',
                adminName: '',
                comment: '',
            });
            alert('Call log saved successfully!');
        } catch (error) {
            console.error('Error saving call log:', error);
            alert('Failed to save call log. Please try again.');
        }
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
                                    <h1 className="text-3xl font-bold text-gray-900">Students</h1>
                                    <p className="mt-2 text-gray-600">
                                        View all students across all groups
                                    </p>
                                </div>
                                <div className="text-sm text-gray-500">
                                    Total Students: {allStudents.length}
                                </div>
                            </div>

                            {/* Search */}
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                                        Search Students
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                <Input
                                                    type="text"
                                                    placeholder="Search by name, email, phone, or address..."
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
                            <Card>
                                <CardHeader>
                                    <CardTitle>Students ({filteredStudents.length})</CardTitle>
                                    <CardDescription>
                                        All students across all groups
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-orange-50 sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                                                        Student
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                                                        Contact
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                                                        Groups
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                                                        Address
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredStudents.map((student) => (
                                                    <tr key={student.id} className="hover:bg-orange-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                                                                    <UsersIcon className="h-5 w-5 text-orange-600" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {student.name}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {student.groups.length} group{student.groups.length !== 1 ? 's' : ''}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                <div className="flex items-center mb-1">
                                                                    <EnvelopeIcon className="h-4 w-4 mr-2 text-orange-500" />
                                                                    {student.email || 'No email'}
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <PhoneIcon className="h-4 w-4 mr-2 text-orange-500" />
                                                                    {student.phone}
                                                                </div>
                                                                {student.secondPhone && (
                                                                    <div className="flex items-center mt-1">
                                                                        <PhoneIcon className="h-4 w-4 mr-2 text-orange-500" />
                                                                        <span className="text-sm text-gray-500">{student.secondPhone}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            <div className="flex items-center">
                                                                <MapPinIcon className="h-4 w-4 mr-2 text-orange-500" />
                                                                {student.address || 'No address'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <div className="flex items-center space-x-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleViewProfile(student)}
                                                                    className="text-orange-600 hover:text-orange-900 hover:bg-orange-100"
                                                                    title="View Profile"
                                                                >
                                                                    <EyeIcon className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleEditStudent(student)}
                                                                    className="text-green-600 hover:text-green-900 hover:bg-green-100"
                                                                    title="Edit Student"
                                                                >
                                                                    <PencilIcon className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleCallLog(student)}
                                                                    className="text-blue-600 hover:text-blue-900 hover:bg-blue-100"
                                                                    title="Call Log"
                                                                >
                                                                    <PhoneIconSolid className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {filteredStudents.length === 0 && (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        {allStudents.length === 0 ? 'No students yet' : 'No students found'}
                                    </h3>
                                    <p className="text-gray-500 mb-6">
                                        {allStudents.length === 0
                                            ? 'Add students to groups to see them here'
                                            : 'Try adjusting your search or filter criteria'
                                        }
                                    </p>
                                    {allStudents.length === 0 && (
                                        <Link href="/groups">
                                            <Button>
                                                <UserGroupIcon className="h-5 w-5 mr-2" />
                                                Go to Groups
                                            </Button>
                                        </Link>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* View Profile Modal */}
            <Modal
                isOpen={showProfileModal}
                onClose={() => {
                    setShowProfileModal(false);
                    setSelectedStudent(null);
                }}
                title={`Student Profile - ${selectedStudent?.name}`}
                maxWidth="2xl"
            >
                {selectedStudent && (
                    <div className="space-y-4">
                        {/* Personal Information */}
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                            <h3 className="text-sm font-medium text-orange-700 mb-3">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex items-center space-x-2">
                                    <UserIcon className="h-4 w-4 text-orange-500" />
                                    <div>
                                        <div className="text-xs font-medium text-orange-700">Name</div>
                                        <div className="text-sm text-gray-900">{selectedStudent.name}</div>
                                    </div>
                                </div>
                                {selectedStudent.email && (
                                    <div className="flex items-center space-x-2">
                                        <EnvelopeIcon className="h-4 w-4 text-orange-500" />
                                        <div>
                                            <div className="text-xs font-medium text-orange-700">Email</div>
                                            <div className="text-sm text-gray-900">{selectedStudent.email}</div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center space-x-2">
                                    <PhoneIcon className="h-4 w-4 text-orange-500" />
                                    <div>
                                        <div className="text-xs font-medium text-orange-700">Phone</div>
                                        <div className="text-sm text-gray-900">{selectedStudent.phone}</div>
                                    </div>
                                </div>
                                {selectedStudent.secondPhone && (
                                    <div className="flex items-center space-x-2">
                                        <PhoneIcon className="h-4 w-4 text-orange-500" />
                                        <div>
                                            <div className="text-xs font-medium text-orange-700">Secondary Phone</div>
                                            <div className="text-sm text-gray-900">{selectedStudent.secondPhone}</div>
                                        </div>
                                    </div>
                                )}
                                {selectedStudent.parentName && (
                                    <div className="flex items-center space-x-2">
                                        <UserIcon className="h-4 w-4 text-orange-500" />
                                        <div>
                                            <div className="text-xs font-medium text-orange-700">Parent Name</div>
                                            <div className="text-sm text-gray-900">{selectedStudent.parentName}</div>
                                        </div>
                                    </div>
                                )}
                                {selectedStudent.address && (
                                    <div className="flex items-center space-x-2 md:col-span-2">
                                        <MapPinIcon className="h-4 w-4 text-orange-500" />
                                        <div>
                                            <div className="text-xs font-medium text-orange-700">Address</div>
                                            <div className="text-sm text-gray-900">{selectedStudent.address}</div>
                                        </div>
                                    </div>
                                )}
                                {selectedStudent.birthDate && (
                                    <div className="flex items-center space-x-2">
                                        <CalendarIcon className="h-4 w-4 text-orange-500" />
                                        <div>
                                            <div className="text-xs font-medium text-orange-700">Birth Date</div>
                                            <div className="text-sm text-gray-900">{format(new Date(selectedStudent.birthDate), 'MMMM dd, yyyy')}</div>
                                        </div>
                                    </div>
                                )}
                                {selectedStudent.courseFee && (
                                    <div className="flex items-center space-x-2">
                                        <AcademicCapIcon className="h-4 w-4 text-orange-500" />
                                        <div>
                                            <div className="text-xs font-medium text-orange-700">Course Fee</div>
                                            <div className="text-sm text-gray-900">${selectedStudent.courseFee}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Groups Information */}
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Groups ({selectedStudent.groups?.length || 0})</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {selectedStudent.groups && selectedStudent.groups.length > 0 ? (
                                    selectedStudent.groups.map((group: { id: string | number; name: string; status: string; language: string; category: string; level: string; teacherId: string; startTime?: string; endTime?: string }) => (
                                        <Link
                                            key={group.id}
                                            href={`/groups/${group.id}`}
                                            className="block p-3 border border-gray-200 rounded-lg hover:bg-orange-50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-lg">{getLanguageFlag(group.language)}</span>
                                                    <span className="text-lg">{getCategoryIcon(group.category)}</span>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {group.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            #{formatGroupId(Number(group.id))} • {group.level} • {getTeacherName(group.teacherId)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {/* Status indicator */}
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${group.status === 'stopped'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-green-100 text-green-800'
                                                        }`}>
                                                        {group.status === 'stopped' ? 'Stopped' : 'Active'}
                                                    </span>
                                                    <div className="text-xs text-gray-500 text-right">
                                                        {group.startTime && group.endTime && (
                                                            <div>{formatTimeSimple(group.startTime)} - {formatTimeSimple(group.endTime)}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="text-sm text-gray-500 text-center py-4">
                                        No groups assigned
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit Student Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedStudent(null);
                    setEditStudentData({
                        name: '',
                        email: '',
                        phone: '',
                        secondPhone: '',
                        parentName: '',
                        address: '',
                        birthDate: '',
                        courseFee: '',
                    });
                }}
                title={`Edit Student - ${selectedStudent?.name}`}
                maxWidth="2xl"
            >
                <div className="space-y-6">
                    {/* Student Info Section */}
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <h3 className="text-sm font-medium text-orange-700 mb-3">Student Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-orange-700 mb-1">
                                    Student Name *
                                </label>
                                <Input
                                    value={editStudentData.name}
                                    onChange={(e) => setEditStudentData({ ...editStudentData, name: e.target.value })}
                                    placeholder="Enter student name"
                                    className="focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-orange-700 mb-1">
                                    Email
                                </label>
                                <Input
                                    value={editStudentData.email}
                                    onChange={(e) => setEditStudentData({ ...editStudentData, email: e.target.value })}
                                    placeholder="Enter student email"
                                    className="focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-orange-700 mb-1">
                                    Phone
                                </label>
                                <Input
                                    value={editStudentData.phone}
                                    onChange={(e) => setEditStudentData({ ...editStudentData, phone: e.target.value })}
                                    placeholder="Enter student phone"
                                    className="focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-orange-700 mb-1">
                                    Secondary Phone
                                </label>
                                <Input
                                    value={editStudentData.secondPhone}
                                    onChange={(e) => setEditStudentData({ ...editStudentData, secondPhone: e.target.value })}
                                    placeholder="Enter secondary phone"
                                    className="focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-orange-700 mb-1">
                                    Parent Name
                                </label>
                                <Input
                                    value={editStudentData.parentName}
                                    onChange={(e) => setEditStudentData({ ...editStudentData, parentName: e.target.value })}
                                    placeholder="Enter parent name"
                                    className="focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-orange-700 mb-1">
                                    Address
                                </label>
                                <Input
                                    value={editStudentData.address}
                                    onChange={(e) => setEditStudentData({ ...editStudentData, address: e.target.value })}
                                    placeholder="Enter student address"
                                    className="focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-orange-700 mb-1">
                                    Birth Date
                                </label>
                                <Input
                                    type="date"
                                    value={editStudentData.birthDate}
                                    onChange={(e) => setEditStudentData({ ...editStudentData, birthDate: e.target.value })}
                                    className="focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-orange-700 mb-1">
                                    Course Fee
                                </label>
                                <Input
                                    type="number"
                                    value={editStudentData.courseFee}
                                    onChange={(e) => setEditStudentData({ ...editStudentData, courseFee: e.target.value })}
                                    placeholder="Enter course fee"
                                    className="focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Groups Information */}
                    {selectedStudent && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg border">
                                Groups ({selectedStudent.groups?.length || 0})
                            </h3>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {selectedStudent.groups && selectedStudent.groups.length > 0 ? (
                                    selectedStudent.groups.map((group: { id: string | number; name: string; status: string; language: string; category: string; level: string; teacherId: string; startTime?: string; endTime?: string }) => (
                                        <div key={group.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <span className="text-2xl">{getLanguageFlag(group.language)}</span>
                                                <span className="text-2xl">{getCategoryIcon(group.category)}</span>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {group.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        #{formatGroupId(Number(group.id))} • {group.level}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {getTeacherName(group.teacherId)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {/* Status indicator */}
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${group.status === 'stopped'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {group.status === 'stopped' ? 'Stopped' : 'Active'}
                                                </span>
                                                <div className="text-xs text-gray-500 text-right">
                                                    {group.startTime && group.endTime && (
                                                        <div>{formatTimeSimple(group.startTime)} - {formatTimeSimple(group.endTime)}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-gray-500 text-center py-4">
                                        No groups assigned
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setShowEditModal(false);
                            setSelectedStudent(null);
                            setEditStudentData({
                                name: '',
                                email: '',
                                phone: '',
                                secondPhone: '',
                                parentName: '',
                                address: '',
                                birthDate: '',
                                courseFee: '',
                            });
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveEditStudent}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        Save Changes
                    </Button>
                </div>
            </Modal>

            {/* Call Log Modal */}
            <Modal
                isOpen={showCallLogModal}
                onClose={() => {
                    setShowCallLogModal(false);
                    setSelectedStudent(null);
                    setCallLogData({
                        studentName: '',
                        studentPhone: '',
                        studentSecondPhone: '',
                        adminName: '',
                        comment: '',
                    });
                }}
                title="Add Call Log"
                maxWidth="2xl"
            >
                <div className="space-y-6">
                    {/* Student Info Section */}
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <h3 className="text-sm font-medium text-orange-700 mb-3">Student Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-orange-700 mb-1">
                                    Student Name
                                </label>
                                <div className="text-sm text-gray-900 bg-white px-3 py-2 rounded border">
                                    {callLogData.studentName}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-orange-700 mb-1">
                                    Student Phone
                                </label>
                                <div className="text-sm text-gray-900 bg-white px-3 py-2 rounded border">
                                    {callLogData.studentPhone}
                                </div>
                            </div>
                            {callLogData.studentSecondPhone && (
                                <div>
                                    <label className="block text-xs font-medium text-orange-700 mb-1">
                                        Secondary Phone
                                    </label>
                                    <div className="text-sm text-gray-900 bg-white px-3 py-2 rounded border">
                                        {callLogData.studentSecondPhone}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Call Details Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg border">
                            Call Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Admin Name *
                                </label>
                                <Input
                                    value={callLogData.adminName}
                                    onChange={(e) => setCallLogData({ ...callLogData, adminName: e.target.value })}
                                    placeholder="Enter admin name"
                                    className="focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Call Notes
                                </label>
                                <textarea
                                    value={callLogData.comment}
                                    onChange={(e) => setCallLogData({ ...callLogData, comment: e.target.value })}
                                    placeholder="Enter call details, notes, or follow-up actions..."
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setShowCallLogModal(false);
                            setSelectedStudent(null);
                            setCallLogData({
                                studentName: '',
                                studentPhone: '',
                                studentSecondPhone: '',
                                adminName: '',
                                comment: '',
                            });
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveCallLog}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        Save Call Log
                    </Button>
                </div>
            </Modal>
        </AuthGuard>
    );
} 