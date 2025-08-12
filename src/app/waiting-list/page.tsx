'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '../../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useMySchoolStore } from '../../store';
import { groupService } from '../../lib/supabase-service';
import AuthGuard from '../../components/AuthGuard';
import { WaitingListStudent } from '../../types';
import { supabase } from '../../lib/supabase';
import { GlobalKeyboardShortcuts } from '../../components/GlobalKeyboardShortcuts';
import {
    UserPlusIcon,
    UsersIcon,
    PencilIcon,
    TrashIcon,
    PlusIcon,
    XMarkIcon,
    CheckIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { formatTimeSimple } from '../../utils/timeUtils';

export default function WaitingListPage() {
    const {
        waitingList,
        teachers,
        fetchWaitingList,
        fetchTeachers,
        addToWaitingList,
        updateWaitingListStudent,
        deleteFromWaitingList,
        getSuggestedGroups,
        loading,
        error
    } = useMySchoolStore();

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState<WaitingListStudent | null>(null);
    const [activeTab, setActiveTab] = useState<'new' | 'enrolled'>('new');
    const [enrolledSearchTerm, setEnrolledSearchTerm] = useState('');
    const [selectedEnrolledStudent, setSelectedEnrolledStudent] = useState<any>(null);
    const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
    const [suggestedGroups, setSuggestedGroups] = useState<Array<{
        groupName: string;
        language: string;
        level: string;
        category: string;
        studentCount: number;
        students: WaitingListStudent[];
        teacherId?: string | null;
        teacherName?: string | null;
        startDate?: string | null;
        startTime?: string | null;
        endTime?: string | null;
        recurringDays?: number[];
        sessionsNumber?: number;
        coursePrice?: number;
        notes?: string | null;
        isConfigured?: boolean;
    }>>([]);

    // New state for group configuration
    const [showGroupConfigModal, setShowGroupConfigModal] = useState(false);
    const [showGroupStudentsModal, setShowGroupStudentsModal] = useState(false);
    const [showStudentConfirmationModal, setShowStudentConfirmationModal] = useState(false);
    const [showFinalConfirmationModal, setShowFinalConfirmationModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<typeof suggestedGroups[0] | null>(null);
    const [studentConfirmations, setStudentConfirmations] = useState<Array<{
        studentId: string;
        name: string;
        phone: string;
        status: 'pending' | 'coming' | 'not_coming';
        notes: string;
    }>>([]);
    const [finalStudentSelections, setFinalStudentSelections] = useState<Array<{
        studentId: string;
        name: string;
        phone: string;
        selected: boolean;
        status: 'pending' | 'coming' | 'not_coming';
        notes: string;
    }>>([]);
    const [groupConfigData, setGroupConfigData] = useState({
        language: '',
        level: '',
        category: '',
        teacherId: '',
        startDate: '',
        startTime: '',
        endTime: '',
        sessionsNumber: 16,
        recurringDays: [] as number[],
        coursePrice: 0,
        notes: '',
    });
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
        parentName: '',
        secondPhone: '',
        defaultDiscount: '',
        registrationFeePaid: false,
        registrationFeeAmount: 500,
    });

    // Form persistence states
    const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
    const [pendingFormData, setPendingFormData] = useState<any>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Filter states
    const [languageFilter, setLanguageFilter] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [adminName, setAdminName] = useState('');

    // Language options - same as groups
    const languageOptions = [
        { value: 'French', label: 'French' },
        { value: 'English', label: 'English' },
        { value: 'Spanish', label: 'Spanish' },
        { value: 'German', label: 'German' },
    ];

    // Level options - same as groups
    const levelOptions = [
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

    // Category options - same as groups
    const categoryOptions = [
        { value: 'Children', label: 'Children' },
        { value: 'Teenagers', label: 'Teenagers' },
        { value: 'Adults', label: 'Adults' },
    ];

    // Week days for multiple selection
    const weekDays = [
        { value: 0, label: 'Sunday' },
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' },
        { value: 6, label: 'Saturday' },
    ];

    useEffect(() => {
        fetchWaitingList();
        fetchTeachers();
        fetchEnrolledStudents();
        fetchSuggestedGroups();
    }, [fetchWaitingList, fetchTeachers]);

    // Handle form persistence and tab navigation
    useEffect(() => {
        // Load saved form data when modal opens
        if (showAddModal && !hasUnsavedChanges) {
            const hasSavedData = loadFormFromStorage();
            if (hasSavedData) {
                alert('You have unsaved form data. Your previous entries have been restored.');
            }
        }

        // Save form data when modal closes
        if (!showAddModal && hasUnsavedChanges) {
            saveFormToStorage();
        }

        // Handle tab and enter key navigation
        const handleKeyNavigation = (e: KeyboardEvent) => {
            if (showAddModal && (e.key === 'Tab' || e.key === 'Enter')) {
                const focusableElements = document.querySelectorAll(
                    'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
                ) as NodeListOf<HTMLElement>;

                const currentIndex = Array.from(focusableElements).findIndex(el => el === document.activeElement);

                if (currentIndex !== -1) {
                    e.preventDefault();

                    if (e.key === 'Enter') {
                        // Move to next field on Enter
                        const nextIndex = (currentIndex + 1) % focusableElements.length;
                        focusableElements[nextIndex].focus();
                    } else if (e.key === 'Tab') {
                        // Handle Tab navigation
                        if (e.shiftKey) {
                            // Shift+Tab: move backward
                            const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
                            focusableElements[prevIndex].focus();
                        } else {
                            // Tab: move forward
                            const nextIndex = (currentIndex + 1) % focusableElements.length;
                            focusableElements[nextIndex].focus();
                        }
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyNavigation);

        return () => {
            document.removeEventListener('keydown', handleKeyNavigation);
        };
    }, [showAddModal, hasUnsavedChanges, formData]);

    const fetchEnrolledStudents = async () => {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .order('name');

            if (error) throw error;
            setEnrolledStudents(data || []);
        } catch (error) {
            console.error('Error fetching enrolled students:', error);
        }
    };

    const fetchSuggestedGroups = async () => {
        try {
            const groups = await getSuggestedGroups();
            console.log('Fetched suggested groups:', groups);

            // Preserve existing configurations when refreshing
            setSuggestedGroups(prev => {
                const newGroups = groups.map(newGroup => {
                    const existingGroup = prev.find(g => g.groupName === newGroup.groupName);
                    if (existingGroup) {
                        return {
                            ...newGroup,
                            // Only use properties that exist in the type
                        };
                    }
                    return newGroup;
                });

                // Filter out groups with no students
                const filteredGroups = newGroups.filter(group => group.studentCount > 0);
                console.log('Filtered suggested groups:', filteredGroups);

                return filteredGroups;
            });
        } catch (error) {
            console.error('Error fetching suggested groups:', error);
        }
    };

    const handleAddStudent = async () => {
        try {
            // Email is optional, phone is required
            if (!formData.name.trim() || !formData.phone.trim() || !formData.language || !formData.level || !formData.category) {
                alert('Please fill in all required fields: Name, Phone, Language, Level, and Category');
                return;
            }

            const studentData = {
                name: formData.name.trim(),
                email: formData.email.trim() || '', // Ensure email is always a string
                phone: formData.phone.trim(), // Phone is required
                address: formData.address || undefined,
                birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
                language: formData.language,
                level: formData.level,
                category: formData.category,
                notes: formData.notes || undefined,
                parentName: formData.parentName || undefined,
                secondPhone: formData.secondPhone || undefined,
                defaultDiscount: formData.defaultDiscount ? parseFloat(formData.defaultDiscount) : 0,
                registrationFeePaid: !!formData.registrationFeePaid,
                registrationFeeAmount: formData.registrationFeeAmount || 500,
            };

            console.log('Submitting student data:', studentData);
            await addToWaitingList(studentData);

            // Link to payment system immediately: create/update students row
            try {
                // Check if student already exists by name+phone
                const { data: existingStd, error: checkErr } = await supabase
                    .from('students')
                    .select('id')
                    .eq('name', studentData.name)
                    .eq('phone', studentData.phone)
                    .limit(1);

                let studentId: string | null = existingStd && existingStd.length > 0 ? existingStd[0].id : null;

                if (!studentId) {
                    const { data: createdStd, error: createStdErr } = await supabase
                        .from('students')
                        .insert({
                            name: studentData.name,
                            email: studentData.email || null,
                            phone: studentData.phone,
                            address: studentData.address || null,
                            birth_date: studentData.birthDate ? (studentData.birthDate as Date).toISOString().split('T')[0] : null,
                            parent_name: studentData.parentName || null,
                            second_phone: studentData.secondPhone || null,
                            default_discount: studentData.defaultDiscount || 0,
                            registration_fee_paid: studentData.registrationFeePaid || false,
                            registration_fee_amount: studentData.registrationFeeAmount || 500,
                        })
                        .select()
                        .single();
                    if (!createStdErr) studentId = createdStd.id;
                } else {
                    // Update registration fields if provided
                    await supabase
                        .from('students')
                        .update({
                            registration_fee_paid: studentData.registrationFeePaid || false,
                            registration_fee_amount: studentData.registrationFeeAmount || 500,
                        })
                        .eq('id', studentId);
                }

                // If registration fee is marked paid, create immediate receipt
                if (studentId && studentData.registrationFeePaid) {
                    // Avoid duplicate if exists
                    const { data: existingRec } = await supabase
                        .from('payments')
                        .select('id')
                        .eq('student_id', studentId)
                        .is('group_id', null)
                        .ilike('notes', 'Registration fee%')
                        .limit(1);
                    if (!existingRec || existingRec.length === 0) {
                        await supabase
                            .from('payments')
                            .insert({
                                student_id: studentId,
                                group_id: null,
                                amount: studentData.registrationFeeAmount || 500,
                                date: new Date().toISOString().split('T')[0],
                                notes: 'Registration fee',
                                admin_name: 'Dalila',
                                discount: 0,
                                original_amount: studentData.registrationFeeAmount || 500,
                            });
                        await supabase
                            .from('students')
                            .update({ registration_fee_paid: true })
                            .eq('id', studentId);
                    }
                }
            } catch (linkErr) {
                console.error('Error linking registration to payment system:', linkErr);
            }
            setShowAddModal(false);
            resetForm();
            clearFormStorage(); // Clear saved form data after successful save
            // Refresh suggested groups after adding a student, but preserve configurations
            await fetchSuggestedGroups();
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
                parentName: formData.parentName || undefined,
                secondPhone: formData.secondPhone || undefined,
                defaultDiscount: formData.defaultDiscount ? parseFloat(formData.defaultDiscount) : 0,
                registrationFeePaid: !!formData.registrationFeePaid,
                registrationFeeAmount: formData.registrationFeeAmount || undefined,
            });
            setShowEditModal(false);
            setEditingStudent(null);
            resetForm();
            // Refresh suggested groups after updating a student
            await fetchSuggestedGroups();
        } catch (error) {
            console.error('Error updating student in waiting list:', error);
        }
    };

    const handleDeleteStudent = async (id: string) => {
        if (confirm('Are you sure you want to remove this student from the waiting list?')) {
            try {
                await deleteFromWaitingList(id);
                // Refresh suggested groups after deleting a student
                await fetchSuggestedGroups();
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
            parentName: '',
            secondPhone: '',
            defaultDiscount: '',
            registrationFeePaid: false,
            registrationFeeAmount: 500,
        });
        setSelectedEnrolledStudent(null);
        setEnrolledSearchTerm('');
        setHasUnsavedChanges(false);
        setPendingFormData(null);
    };

    // Form persistence functions
    const saveFormToStorage = () => {
        if (hasUnsavedChanges) {
            localStorage.setItem('waitingListFormData', JSON.stringify(formData));
            localStorage.setItem('waitingListFormTimestamp', Date.now().toString());
        }
    };

    const loadFormFromStorage = () => {
        const saved = localStorage.getItem('waitingListFormData');
        const timestamp = localStorage.getItem('waitingListFormTimestamp');

        if (saved && timestamp) {
            const timeDiff = Date.now() - parseInt(timestamp);
            // Load if saved within last 24 hours
            if (timeDiff < 24 * 60 * 60 * 1000) {
                const savedData = JSON.parse(saved);
                setFormData(savedData);
                setHasUnsavedChanges(true);
                return true;
            }
        }
        return false;
    };

    const clearFormStorage = () => {
        localStorage.removeItem('waitingListFormData');
        localStorage.removeItem('waitingListFormTimestamp');
    };

    // Handle form changes
    const handleFormChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setHasUnsavedChanges(true);
    };

    // Handle modal close with unsaved changes warning
    const handleModalClose = () => {
        if (hasUnsavedChanges) {
            setShowUnsavedWarning(true);
            setPendingFormData({ action: 'close', modal: 'add' });
        } else {
            setShowAddModal(false);
            resetForm();
        }
    };

    // Filter waiting list students
    const filteredWaitingList = waitingList.filter(student => {
        const matchesSearch = searchTerm === '' ||
            student.name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
            student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.phone?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesLanguage = languageFilter === '' || student.language === languageFilter;
        const matchesLevel = levelFilter === '' || student.level === levelFilter;
        const matchesCategory = categoryFilter === '' || student.category === categoryFilter;

        return matchesSearch && matchesLanguage && matchesLevel && matchesCategory;
    });

    // Filter suggested groups based on search and filters
    const filteredSuggestedGroups = suggestedGroups.filter(group => {
        const matchesSearch = searchTerm === '' ||
            group.groupName.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
            group.language?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group.level?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group.category?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesLanguage = languageFilter === '' || group.language === languageFilter;
        const matchesLevel = levelFilter === '' || group.level === levelFilter;
        const matchesCategory = categoryFilter === '' || group.category === categoryFilter;

        return matchesSearch && matchesLanguage && matchesLevel && matchesCategory;
    });

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
            parentName: student.parentName || '',
            secondPhone: student.secondPhone || '',
            defaultDiscount: student.defaultDiscount ? student.defaultDiscount.toString() : '',
            registrationFeePaid: !!student.registrationFeePaid,
            registrationFeeAmount: student.registrationFeeAmount ? student.registrationFeeAmount : 500,
        });
        setShowEditModal(true);
    };

    const handleViewGroupStudents = async (group: any) => {
        setSelectedGroup(group);

        // Initialize admin name with current user
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        setAdminName(currentUser.name || '');

        try {
            // Fetch latest call logs for all students in this group
            const { data: callLogs, error } = await supabase
                .from('call_logs')
                .select('*')
                .in('student_id', group.students.map((s: any) => s.id))
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching call logs:', error);
            }

            // Initialize student confirmations with latest call log data
            const confirmations = group.students.map((student: WaitingListStudent) => {
                // Find the latest call log for this student
                const latestCallLog = callLogs?.find(log => log.student_id === student.id);

                return {
                    studentId: student.id,
                    name: student.name,
                    phone: student.phone || '',
                    status: (latestCallLog?.status as 'pending' | 'coming' | 'not_coming') || 'pending',
                    notes: latestCallLog?.notes || '',
                };
            });
            setStudentConfirmations(confirmations);

            setShowStudentConfirmationModal(true);
        } catch (error) {
            console.error('Error preparing student confirmations:', error);
            // Fallback to default confirmations if there's an error
            const confirmations = group.students.map((student: WaitingListStudent) => ({
                studentId: student.id,
                name: student.name,
                phone: student.phone || '',
                status: 'pending' as 'pending' | 'coming' | 'not_coming',
                notes: '',
            }));
            setStudentConfirmations(confirmations);
            setShowStudentConfirmationModal(true);
        }
    };

    const generateGroupName = (language: string, level: string, category: string): string => {
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

    const handleConfigureGroup = (group: any) => {
        setSelectedGroup(group);
        setGroupConfigData({
            language: group.language || '',
            level: group.level || '',
            category: group.category,
            teacherId: group.teacherId || '',
            startDate: group.startDate || '',
            startTime: group.startTime || '',
            endTime: group.endTime || '',
            sessionsNumber: group.sessionsNumber || 16,
            recurringDays: group.recurringDays || [1], // Default to Monday
            coursePrice: group.coursePrice || 0,
            notes: group.notes || '',
        });
        setShowGroupConfigModal(true);
    };

    const handleDayToggle = (dayValue: number) => {
        setGroupConfigData(prev => ({
            ...prev,
            recurringDays: prev.recurringDays.includes(dayValue)
                ? prev.recurringDays.filter(day => day !== dayValue)
                : [...prev.recurringDays, dayValue]
        }));
    };

    const handleStudentStatusChange = (studentId: string, status: 'pending' | 'coming' | 'not_coming') => {
        setStudentConfirmations(prev =>
            prev.map(confirmation =>
                confirmation.studentId === studentId
                    ? { ...confirmation, status }
                    : confirmation
            )
        );
    };

    const handleStudentNotesChange = (studentId: string, notes: string) => {
        setStudentConfirmations(prev =>
            prev.map(confirmation =>
                confirmation.studentId === studentId
                    ? { ...confirmation, notes }
                    : confirmation
            )
        );
    };

    const handleSaveConfirmations = async () => {
        try {
            // Use the admin name from the form, fallback to current user if empty
            let finalAdminName = adminName;
            if (!finalAdminName.trim()) {
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                finalAdminName = currentUser.name || 'Admin';
            }

            // Save confirmations to database and call logs
            for (const confirmation of studentConfirmations) {
                // Find the student to get their second phone number
                const student = selectedGroup?.students.find((s: WaitingListStudent) => s.id === confirmation.studentId);
                const secondPhone = student?.secondPhone || '';

                // Update student status and notes in waiting list
                await updateWaitingListStudent(confirmation.studentId, {
                    status: confirmation.status,
                    notes: confirmation.notes,
                });

                // Create call log entry with just the comment
                await supabase.from('call_logs').insert({
                    student_id: confirmation.studentId,
                    call_type: 'registration',
                    status: confirmation.status,
                    notes: confirmation.notes,
                    admin_name: finalAdminName,
                    call_date: new Date().toISOString(),
                });
            }

            setShowStudentConfirmationModal(false);
            setSelectedGroup(null);
            setStudentConfirmations([]);
            setAdminName(''); // Reset admin name

            // Only refresh waiting list, don't refresh suggested groups to preserve configuration
            await fetchWaitingList();

            alert('Student confirmations saved successfully!');
        } catch (error) {
            console.error('Error saving confirmations:', error);
            alert('Error saving confirmations. Please try again.');
        }
    };

    const handleSaveGroupConfiguration = async () => {
        if (!selectedGroup) return;

        try {
            // Update the suggested group with configuration data
            const updatedGroup = {
                ...selectedGroup,
                teacherId: groupConfigData.teacherId || null,
                teacherName: teachers.find(t => t.id === groupConfigData.teacherId)?.name || null,
                startDate: groupConfigData.startDate || null,
                startTime: groupConfigData.startTime || null,
                endTime: groupConfigData.endTime || null,
                sessionsNumber: groupConfigData.sessionsNumber,
                recurringDays: groupConfigData.recurringDays,
                coursePrice: groupConfigData.coursePrice,
                notes: groupConfigData.notes || null,
                isConfigured: true,
            };

            // Update the suggested groups list with configuration data
            setSuggestedGroups(prev =>
                prev.map(group =>
                    group.groupName === selectedGroup.groupName ? {
                        ...group,
                        ...updatedGroup,
                        isConfigured: true,
                        teacherName: teachers.find(t => t.id === groupConfigData.teacherId)?.name || null,
                        startTime: groupConfigData.startTime || null,
                        endTime: groupConfigData.endTime || null,
                        startDate: groupConfigData.startDate || null,
                        sessionsNumber: groupConfigData.sessionsNumber,
                        recurringDays: groupConfigData.recurringDays,
                        coursePrice: groupConfigData.coursePrice,
                        notes: groupConfigData.notes || null,
                    } : group
                )
            );

            // Close modal and refresh
            setShowGroupConfigModal(false);
            setSelectedGroup(null);
            setGroupConfigData({
                language: '',
                level: '',
                category: '',
                teacherId: '',
                startDate: '',
                startTime: '',
                endTime: '',
                sessionsNumber: 16,
                recurringDays: [1], // Default to Monday
                coursePrice: 0,
                notes: '',
            });

            alert(`Group ${selectedGroup?.isConfigured ? 'updated' : 'configured'} successfully!`);
        } catch (error) {
            console.error('Error configuring group:', error);
            alert(`Error ${selectedGroup?.isConfigured ? 'updating' : 'configuring'} group. Please try again.`);
        }
    };

    const handleStartGroup = async (group: any) => {
        try {
            // Fetch latest call logs for all students in this group
            const { data: callLogs, error } = await supabase
                .from('call_logs')
                .select('*')
                .in('student_id', group.students.map((s: any) => s.id))
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching call logs:', error);
            }

            // Filter students with "coming" status and include their notes
            const confirmedStudents = group.students.filter((student: any) => {
                const latestCallLog = callLogs?.find(log => log.student_id === student.id);
                return latestCallLog?.status === 'coming';
            });

            // Initialize final student selections with status and notes
            const selections = confirmedStudents.map((student: any) => {
                const latestCallLog = callLogs?.find(log => log.student_id === student.id);
                return {
                    studentId: student.id,
                    name: student.name,
                    phone: student.phone || '',
                    selected: true, // Default to selected
                    status: latestCallLog?.status || 'pending',
                    notes: latestCallLog?.notes || '',
                };
            });

            setFinalStudentSelections(selections);
            setSelectedGroup(group);
            setShowFinalConfirmationModal(true);
        } catch (error) {
            console.error('Error preparing final confirmation:', error);
            alert('Error preparing final confirmation. Please try again.');
        }
    };

    const handleLaunchGroup = async () => {
        if (!selectedGroup) return;

        try {
            console.log('=== LAUNCH GROUP START ===');
            console.log('Selected group:', selectedGroup);
            console.log('Final student selections:', finalStudentSelections);

            // Get selected students
            const selectedStudents = finalStudentSelections.filter(s => s.selected);
            console.log('Selected students to move:', selectedStudents);

            // Generate group name automatically
            const groupName = generateGroupName(
                selectedGroup.language || 'English',
                selectedGroup.level || 'A1',
                selectedGroup.category || 'Adults'
            );

            // Use the teacher assigned during configuration, or get/create a default teacher
            let teacherId;
            try {
                if (selectedGroup.teacherId) {
                    // Use the teacher assigned during configuration
                    teacherId = selectedGroup.teacherId;
                    console.log('Using configured teacher ID:', teacherId);
                } else {
                    // Fallback to first available teacher or create default
                    const { data: teachers } = await supabase.from('teachers').select('id').limit(1);
                    if (teachers && teachers.length > 0) {
                        teacherId = teachers[0].id;
                        console.log('Using first available teacher ID:', teacherId);
                    } else {
                        const { data: newTeacher } = await supabase
                            .from('teachers')
                            .insert({ name: 'Default Teacher', email: 'default@school.com', phone: '000-000-0000' })
                            .select('id')
                            .single();
                        if (newTeacher) {
                            teacherId = newTeacher.id;
                            console.log('Created default teacher ID:', teacherId);
                        } else {
                            throw new Error('Failed to create default teacher');
                        }
                    }
                }
            } catch (error) {
                console.error('Error with teacher:', error);
                throw new Error('Failed to get or create teacher');
            }

            // Create group directly in database
            const { data: newGroup, error: groupError } = await supabase
                .from('groups')
                .insert({
                    name: groupName,
                    teacher_id: selectedGroup.teacherId || null,
                    start_date: selectedGroup.startDate || null,
                    language: selectedGroup.language || null,
                    level: selectedGroup.level || null,
                    category: selectedGroup.category || null,
                    start_time: selectedGroup.startTime || null,
                    end_time: selectedGroup.endTime || null,
                    recurring_days: selectedGroup.recurringDays || [1],
                    total_sessions: selectedGroup.sessionsNumber || 16,
                    price: selectedGroup.coursePrice || 0,
                })
                .select()
                .single();

            if (groupError) {
                console.error('Error creating group:', groupError);
                throw new Error(`Failed to create group: ${groupError.message}`);
            }

            console.log('Group created successfully:', newGroup);

            // Move students to the new group
            let movedCount = 0;
            for (const selection of selectedStudents) {
                const student = selectedGroup.students.find((s: any) => s.id === selection.studentId);
                if (student) {
                    try {
                        // Create or link student to new group using junction table
                        // 1) Try to find existing student by name + phone
                        const { data: existingRows, error: existingFindError } = await supabase
                            .from('students')
                            .select('id')
                            .eq('name', student.name)
                            .eq('phone', student.phone)
                            .limit(1);

                        if (existingFindError) {
                            console.error('Error checking existing student:', existingFindError);
                            continue;
                        }

                        let studentId: string | null = existingRows && existingRows.length > 0 ? existingRows[0].id : null;

                        // 2) Create student if not found (no group_id here; we link via student_groups)
                        if (!studentId) {
                            const { data: createdStudent, error: createStdError } = await supabase
                                .from('students')
                                .insert({
                                    name: student.name,
                                    email: student.email || null,
                                    phone: student.phone || '',
                                    address: student.address || '',
                                    birth_date: student.birthDate ? new Date(student.birthDate).toISOString().split('T')[0] : null,
                                    parent_name: student.parentName || '',
                                    second_phone: student.secondPhone || '',
                                    total_paid: 0,
                                    default_discount: 0,
                                })
                                .select()
                                .single();

                            if (createStdError) {
                                console.error('Error creating student:', createStdError);
                                continue;
                            }

                            studentId = createdStudent.id;
                            console.log('Student created:', createdStudent);
                        }

                        // 3) Link student to the new group via junction
                        const { error: linkError } = await supabase
                            .from('student_groups')
                            .insert({
                                student_id: studentId,
                                group_id: newGroup.id,
                            });

                        if (linkError) {
                            console.error('Error linking student to group:', linkError);
                            continue;
                        }

                        // 4) Remove from waiting list
                        const { error: deleteError } = await supabase
                            .from('waiting_list')
                            .delete()
                            .eq('id', student.id);

                        if (deleteError) {
                            console.error('Error removing from waiting list:', deleteError);
                        } else {
                            console.log('Student removed from waiting list');
                            movedCount++;
                        }
                    } catch (error) {
                        console.error('Error processing student:', error);
                    }
                }
            }

            console.log(`Moved ${movedCount} students to group`);

            // Remove group from suggested groups
            setSuggestedGroups(prev => prev.filter(g => g.groupName !== selectedGroup.groupName));

            // Close modal and refresh
            setShowFinalConfirmationModal(false);
            setSelectedGroup(null);
            setFinalStudentSelections([]);
            await fetchWaitingList();
            await fetchSuggestedGroups();

            console.log('=== LAUNCH GROUP SUCCESS ===');
            alert(`Group "${newGroup.name}" launched successfully with ${movedCount} students!`);

            // 4) Auto allocate from existing credit to cover new group's fees if possible
            try {
                // Reuse existing service endpoint via RPC-like call pattern
                // We can't import paymentService here; trigger by inserting zero deposit and allocation
                // Instead, rely on server-side function: we call allocations by inserting with available credit
                // Using existing API: none in this file, so we skip calling directly.
            } catch (e) {
                console.error('Auto allocation from existing credit failed:', e);
            }
        } catch (error) {
            console.error('Error launching group:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error launching group: ${errorMessage}`);
        }
    };

    const handleStudentSelectionToggle = (studentId: string) => {
        setFinalStudentSelections(prev =>
            prev.map(selection =>
                selection.studentId === studentId
                    ? { ...selection, selected: !selection.selected }
                    : selection
            )
        );
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

                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Registration</h1>
                                <p className="mt-2 text-gray-600">
                                    Manage students waiting to be assigned to groups
                                </p>
                            </div>
                            <Button onClick={() => setShowAddModal(true)}>
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Add Student
                            </Button>
                        </div>

                        {/* Filters */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <FunnelIcon className="h-5 w-5 mr-2" />
                                    Search & Filters
                                </CardTitle>
                                <CardDescription>
                                    Filter both waiting list students and suggested groups
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Search
                                        </label>
                                        <div className="relative">
                                            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <Input
                                                type="text"
                                                placeholder="Search students, groups, teachers..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Language
                                        </label>
                                        <select
                                            value={languageFilter}
                                            onChange={(e) => setLanguageFilter(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        >
                                            <option value="">All Languages</option>
                                            {languageOptions.map(lang => (
                                                <option key={lang.value} value={lang.value}>
                                                    {lang.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Level
                                        </label>
                                        <select
                                            value={levelFilter}
                                            onChange={(e) => setLevelFilter(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        >
                                            <option value="">All Levels</option>
                                            {levelOptions.map(level => (
                                                <option key={level.value} value={level.value}>
                                                    {level.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Category
                                        </label>
                                        <select
                                            value={categoryFilter}
                                            onChange={(e) => setCategoryFilter(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        >
                                            <option value="">All Categories</option>
                                            {categoryOptions.map(category => (
                                                <option key={category.value} value={category.value}>
                                                    {category.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setSearchTerm('');
                                                setLanguageFilter('');
                                                setLevelFilter('');
                                                setCategoryFilter('');
                                            }}
                                            className="w-full"
                                        >
                                            Clear Filters
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Suggested Groups */}
                        {suggestedGroups.length > 0 && (
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <UsersIcon className="h-5 w-5 mr-2" />
                                        Suggested Groups
                                        {filteredSuggestedGroups.length !== suggestedGroups.length && (
                                            <span className="ml-2 text-sm text-gray-500">
                                                ({filteredSuggestedGroups.length} of {suggestedGroups.length})
                                            </span>
                                        )}
                                    </CardTitle>
                                    <CardDescription>
                                        Students grouped by language, level, and category
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Group Name
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Teacher
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Time
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Days
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Start Date
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Students
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredSuggestedGroups.map((group, index) => (
                                                    <tr
                                                        key={index}
                                                        className="hover:bg-gray-50 cursor-pointer"
                                                        onClick={() => handleViewGroupStudents(group)}
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {group.groupName}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {group.teacherName || 'Not Assigned'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {group.startTime && group.endTime
                                                                    ? `${formatTimeSimple(group.startTime)} - ${formatTimeSimple(group.endTime)}`
                                                                    : 'Not Set'
                                                                }
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {group.recurringDays && group.recurringDays.length > 0
                                                                    ? group.recurringDays.map(day => weekDays[day].label).join(', ')
                                                                    : 'Not Set'
                                                                }
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {group.startDate || 'Not Set'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                {group.studentCount} students
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <div className="flex space-x-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleConfigureGroup(group);
                                                                    }}
                                                                    className="text-orange-600 hover:text-orange-900"
                                                                >
                                                                    {group.isConfigured ? 'Update' : 'Configure'}
                                                                </Button>
                                                                {group.isConfigured && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleStartGroup(group);
                                                                        }}
                                                                        className="text-green-600 hover:text-green-900"
                                                                    >
                                                                        Start
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {filteredSuggestedGroups.length === 0 && suggestedGroups.length > 0 && (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500">No suggested groups match your current filters.</p>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setSearchTerm('');
                                                    setLanguageFilter('');
                                                    setLevelFilter('');
                                                    setCategoryFilter('');
                                                }}
                                                className="mt-2"
                                            >
                                                Clear Filters
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}



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
                        onClose={handleModalClose}
                        title="Add Student to Registration"
                        maxWidth="2xl"
                    >
                        {/* Tab Navigation */}
                        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('new')}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'new'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                New Student
                            </button>
                            <button
                                onClick={() => setActiveTab('enrolled')}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'enrolled'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Enrolled Student
                            </button>
                        </div>

                        {activeTab === 'new' && (
                            <div className="space-y-4">
                                {/* Name, Address, Parent Name - Row 1 */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Name *
                                        </label>
                                        <Input
                                            value={formData.name || ''}
                                            onChange={(e) => handleFormChange('name', e.target.value)}
                                            placeholder="Enter student name"
                                            required
                                            tabIndex={1}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Address (Optional)
                                        </label>
                                        <Input
                                            value={formData.address || ''}
                                            onChange={(e) => handleFormChange('address', e.target.value)}
                                            placeholder="Enter address"
                                            tabIndex={2}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Parent Name (Optional)
                                        </label>
                                        <Input
                                            value={formData.parentName || ''}
                                            onChange={(e) => handleFormChange('parentName', e.target.value)}
                                            placeholder="Enter parent/guardian name"
                                            tabIndex={3}
                                        />
                                    </div>
                                </div>

                                {/* Email, Phone, Second Phone - Row 2 */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email (Optional)
                                        </label>
                                        <Input
                                            type="email"
                                            value={formData.email || ''}
                                            onChange={(e) => handleFormChange('email', e.target.value)}
                                            placeholder="Enter email address"
                                            tabIndex={4}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone *
                                        </label>
                                        <Input
                                            type="tel"
                                            value={formData.phone || ''}
                                            onChange={(e) => handleFormChange('phone', e.target.value)}
                                            placeholder="Enter phone number"
                                            required
                                            tabIndex={5}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Second Phone (Optional)
                                        </label>
                                        <Input
                                            type="tel"
                                            value={formData.secondPhone || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, secondPhone: e.target.value }))}
                                            placeholder="Enter second phone number"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Default Discount (%) (Optional)
                                        </label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={formData.defaultDiscount || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, defaultDiscount: e.target.value }))}
                                            placeholder="Enter default discount percentage"
                                        />
                                    </div>
                                </div>

                                {/* Language, Level, Category - Row 3 */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Language *
                                        </label>
                                        <select
                                            value={formData.language || ''}
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
                                            value={formData.level || ''}
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
                                            value={formData.category || ''}
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
                                </div>

                                {/* Birth Date and Notes - Row 4 */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Birth Date (Optional)
                                        </label>
                                        <Input
                                            type="date"
                                            value={formData.birthDate || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Notes (Optional)
                                        </label>
                                        <textarea
                                            value={formData.notes || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                            placeholder="Enter any additional notes"
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        />
                                    </div>
                                </div>

                                {/* Registration Fee - Row */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Registration Fee Paid?
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={!!formData.registrationFeePaid}
                                                onChange={(e) => handleFormChange('registrationFeePaid', e.target.checked.toString())}
                                            />
                                            <span className="text-sm text-gray-700">Mark paid on registration</span>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Registration Fee Amount
                                        </label>
                                        <Input
                                            type="number"
                                            value={formData.registrationFeeAmount ?? 500}
                                            onChange={(e) => handleFormChange('registrationFeeAmount', e.target.value)}
                                            placeholder="500"
                                        />
                                    </div>
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
                        )}

                        {activeTab === 'enrolled' && (
                            <div className="space-y-4">
                                {/* Search for Enrolled Student */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Search Enrolled Student
                                    </label>
                                    <div className="relative">
                                        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <Input
                                            type="text"
                                            placeholder="Search by student name..."
                                            value={enrolledSearchTerm}
                                            onChange={(e) => setEnrolledSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                {/* Search Results */}
                                {enrolledSearchTerm.length > 0 && (
                                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                                        {enrolledStudents
                                            .filter(student =>
                                                student.name.toLowerCase().startsWith(enrolledSearchTerm.toLowerCase())
                                            )
                                            .map((student) => (
                                                <div
                                                    key={student.id}
                                                    onClick={() => {
                                                        setSelectedEnrolledStudent(student);
                                                        setFormData({
                                                            name: student.name || '',
                                                            email: student.email || '',
                                                            phone: student.phone || '',
                                                            address: student.address || '',
                                                            birthDate: student.birthDate ? student.birthDate.toISOString().split('T')[0] : '',
                                                            language: '',
                                                            level: '',
                                                            category: '',
                                                            notes: '',
                                                            parentName: student.parentName || '',
                                                            secondPhone: student.secondPhone || '',
                                                            defaultDiscount: '',
                                                            registrationFeePaid: false,
                                                            registrationFeeAmount: 500,
                                                        });
                                                        setEnrolledSearchTerm('');
                                                    }}
                                                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                >
                                                    <div className="font-medium">{student.name}</div>
                                                    <div className="text-sm text-gray-600">{student.email}</div>
                                                    {student.phone && (
                                                        <div className="text-sm text-gray-500">{student.phone}</div>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                )}

                                {/* Selected Student Form - Same structure as New Student */}
                                {selectedEnrolledStudent && (
                                    <div className="space-y-4 border-t pt-4">
                                        <div className="bg-blue-50 p-3 rounded-md">
                                            <p className="text-sm text-blue-800">
                                                <strong>Selected Student:</strong> {selectedEnrolledStudent.name}
                                            </p>
                                        </div>

                                        {/* Name, Address, Parent Name - Row 1 */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Name *
                                                </label>
                                                <Input
                                                    value={formData.name || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                    placeholder="Enter student name"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Address (Optional)
                                                </label>
                                                <Input
                                                    value={formData.address || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                                    placeholder="Enter address"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Parent Name (Optional)
                                                </label>
                                                <Input
                                                    value={formData.parentName || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, parentName: e.target.value }))}
                                                    placeholder="Enter parent/guardian name"
                                                />
                                            </div>
                                        </div>

                                        {/* Email, Phone, Second Phone - Row 2 */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Email (Optional)
                                                </label>
                                                <Input
                                                    type="email"
                                                    value={formData.email || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                                    placeholder="Enter email address"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Phone *
                                                </label>
                                                <Input
                                                    type="tel"
                                                    value={formData.phone || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                                    placeholder="Enter phone number"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Second Phone (Optional)
                                                </label>
                                                <Input
                                                    type="tel"
                                                    value={formData.secondPhone || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, secondPhone: e.target.value }))}
                                                    placeholder="Enter second phone number"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Default Discount (%) (Optional)
                                                </label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={formData.defaultDiscount || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, defaultDiscount: e.target.value }))}
                                                    placeholder="Enter default discount percentage"
                                                />
                                            </div>
                                        </div>

                                        {/* Language, Level, Category - Row 3 */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Language *
                                                </label>
                                                <select
                                                    value={formData.language || ''}
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
                                                    value={formData.level || ''}
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
                                                    value={formData.category || ''}
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
                                        </div>

                                        {/* Birth Date and Notes - Row 4 */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Birth Date (Optional)
                                                </label>
                                                <Input
                                                    type="date"
                                                    value={formData.birthDate || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Notes (Optional)
                                                </label>
                                                <textarea
                                                    value={formData.notes || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                                    placeholder="Enter any additional notes"
                                                    rows={2}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end space-x-3 pt-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedEnrolledStudent(null);
                                                    resetForm();
                                                }}
                                            >
                                                Clear Selection
                                            </Button>
                                            <Button onClick={handleAddStudent}>
                                                Add Student
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
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
                                    Email (Optional)
                                </label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="Enter email address"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone *
                                </label>
                                <Input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="Enter phone number"
                                    required
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

                    {/* Student Confirmation Modal */}
                    <Modal
                        isOpen={showStudentConfirmationModal}
                        onClose={() => {
                            setShowStudentConfirmationModal(false);
                            setSelectedGroup(null);
                            setStudentConfirmations([]);
                            setAdminName(''); // Reset admin name
                        }}
                        title={`Student Confirmations - ${selectedGroup?.groupName || 'Group'}`}
                        maxWidth="2xl"
                    >
                        {selectedGroup && (
                            <div className="space-y-6">
                                {/* Group Information Section */}
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="font-medium text-gray-500">Time:</span>
                                            <span className="ml-1 text-gray-900">
                                                {selectedGroup.startTime && selectedGroup.endTime
                                                    ? `${formatTimeSimple(selectedGroup.startTime)} - ${formatTimeSimple(selectedGroup.endTime)}`
                                                    : 'Not Set'
                                                }
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-500">Days:</span>
                                            <span className="ml-1 text-gray-900">
                                                {selectedGroup.recurringDays && selectedGroup.recurringDays.length > 0
                                                    ? selectedGroup.recurringDays.map((day: number) => weekDays[day].label).join(', ')
                                                    : 'Not Set'
                                                }
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-500">Teacher:</span>
                                            <span className="ml-1 text-gray-900">
                                                {selectedGroup.teacherName || 'Not Assigned'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-500">Start:</span>
                                            <span className="ml-1 text-gray-900">
                                                {selectedGroup.startDate || 'Not Set'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Admin Name Section */}
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <label className="text-sm font-medium text-gray-700">
                                            Admin Name:
                                        </label>
                                        <Input
                                            type="text"
                                            value={adminName || ''}
                                            onChange={(e) => setAdminName(e.target.value)}
                                            placeholder="Enter admin name"
                                            className="flex-1 max-w-xs"
                                        />
                                    </div>
                                </div>

                                {/* Students Table */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Student Confirmations</h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Name
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Phone
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Secondary Phone
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Notes
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {studentConfirmations.map((confirmation) => {
                                                    const student = selectedGroup?.students.find((s: WaitingListStudent) => s.id === confirmation.studentId);
                                                    return (
                                                        <tr key={confirmation.studentId} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900">{confirmation.name}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-900">{confirmation.phone}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-900">{student?.secondPhone || '-'}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <select
                                                                    value={confirmation.status}
                                                                    onChange={(e) => handleStudentStatusChange(confirmation.studentId, e.target.value as 'pending' | 'coming' | 'not_coming')}
                                                                    className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                                >
                                                                    <option value="pending">Pending</option>
                                                                    <option value="coming">Coming</option>
                                                                    <option value="not_coming">Not Coming</option>
                                                                </select>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <textarea
                                                                    value={confirmation.notes}
                                                                    onChange={(e) => handleStudentNotesChange(confirmation.studentId, e.target.value)}
                                                                    placeholder="Add notes..."
                                                                    className="text-sm border border-gray-300 rounded-md px-3 py-2 w-96 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                                                                    rows={2}
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowStudentConfirmationModal(false);
                                            setSelectedGroup(null);
                                            setStudentConfirmations([]);
                                            setAdminName(''); // Reset admin name
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSaveConfirmations}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        Save Confirmations
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Modal>

                    {/* Group Configuration Modal */}
                    <Modal
                        isOpen={showGroupConfigModal}
                        onClose={() => {
                            setShowGroupConfigModal(false);
                            setSelectedGroup(null);
                        }}
                        title={selectedGroup?.isConfigured ? "Update Group Configuration" : "Configure Group"}
                        maxWidth="2xl"
                    >
                        <div className="space-y-4">
                            {/* Language, Level, Category - Row 1 */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Language *
                                    </label>
                                    <select
                                        value={groupConfigData.language || ''}
                                        onChange={(e) => setGroupConfigData(prev => ({ ...prev, language: e.target.value }))}
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
                                        value={groupConfigData.level || ''}
                                        onChange={(e) => setGroupConfigData(prev => ({ ...prev, level: e.target.value }))}
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
                                        value={groupConfigData.category || ''}
                                        onChange={(e) => setGroupConfigData(prev => ({ ...prev, category: e.target.value }))}
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
                            </div>

                            {/* Teacher, Sessions Number - Row 2 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Teacher (Optional)
                                    </label>
                                    <select
                                        value={groupConfigData.teacherId || ''}
                                        onChange={(e) => setGroupConfigData(prev => ({ ...prev, teacherId: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        <option value="">Select Teacher</option>
                                        {teachers.map((teacher) => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sessions Number
                                    </label>
                                    <Input
                                        type="number"
                                        value={groupConfigData.sessionsNumber || ''}
                                        onChange={(e) => setGroupConfigData(prev => ({ ...prev, sessionsNumber: parseInt(e.target.value) || 16 }))}
                                        placeholder="16"
                                    />
                                </div>
                            </div>

                            {/* Start Date, Start Time, End Time - Row 3 */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Start Date *
                                    </label>
                                    <Input
                                        type="date"
                                        value={groupConfigData.startDate || ''}
                                        onChange={(e) => setGroupConfigData(prev => ({ ...prev, startDate: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Start Time
                                    </label>
                                    <Input
                                        type="time"
                                        value={groupConfigData.startTime || ''}
                                        onChange={(e) => setGroupConfigData(prev => ({ ...prev, startTime: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        End Time
                                    </label>
                                    <Input
                                        type="time"
                                        value={groupConfigData.endTime || ''}
                                        onChange={(e) => setGroupConfigData(prev => ({ ...prev, endTime: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Recurring Days - Row 4 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Recurring Days *
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {weekDays.map((day) => (
                                        <label key={day.value} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={groupConfigData.recurringDays.includes(day.value)}
                                                onChange={() => handleDayToggle(day.value)}
                                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">{day.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Course Price, Notes - Row 4 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Course Price
                                    </label>
                                    <Input
                                        type="number"
                                        value={groupConfigData.coursePrice || ''}
                                        onChange={(e) => setGroupConfigData(prev => ({ ...prev, coursePrice: parseFloat(e.target.value) || 0 }))}
                                        placeholder="0"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Total price for the entire course
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={groupConfigData.notes || ''}
                                        onChange={(e) => setGroupConfigData(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Enter any additional notes"
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowGroupConfigModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveGroupConfiguration}
                                    className="bg-orange-600 hover:bg-orange-700"
                                >
                                    {selectedGroup?.isConfigured ? 'Update Configuration' : 'Save Configuration'}
                                </Button>
                            </div>
                        </div>
                    </Modal>

                    {/* Final Confirmation Modal */}
                    <Modal
                        isOpen={showFinalConfirmationModal}
                        onClose={() => {
                            setShowFinalConfirmationModal(false);
                            setSelectedGroup(null);
                            setFinalStudentSelections([]);
                        }}
                        title={`Launch Group - ${selectedGroup?.groupName || 'Group'}`}
                        maxWidth="2xl"
                    >
                        {selectedGroup && (
                            <div className="space-y-6">
                                {/* Group Information Section */}
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="font-medium text-gray-500">Time:</span>
                                            <span className="ml-1 text-gray-900">
                                                {selectedGroup.startTime && selectedGroup.endTime
                                                    ? `${formatTimeSimple(selectedGroup.startTime)} - ${formatTimeSimple(selectedGroup.endTime)}`
                                                    : 'Not Set'
                                                }
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-500">Days:</span>
                                            <span className="ml-1 text-gray-900">
                                                {selectedGroup.recurringDays && selectedGroup.recurringDays.length > 0
                                                    ? selectedGroup.recurringDays.map((day: number) => weekDays[day].label).join(', ')
                                                    : 'Not Set'
                                                }
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-500">Teacher:</span>
                                            <span className="ml-1 text-gray-900">
                                                {selectedGroup.teacherName || 'Not Assigned'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-500">Start:</span>
                                            <span className="ml-1 text-gray-900">
                                                {selectedGroup.startDate || 'Not Set'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Students Selection Table */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Select Students to Launch</h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Select
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Name
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Phone
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Notes
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {finalStudentSelections.map((selection) => (
                                                    <tr key={selection.studentId} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <input
                                                                type="checkbox"
                                                                checked={selection.selected}
                                                                onChange={() => handleStudentSelectionToggle(selection.studentId)}
                                                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">{selection.name}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{selection.phone}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selection.status === 'coming'
                                                                ? 'bg-green-100 text-green-800'
                                                                : selection.status === 'not_coming'
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                {selection.status === 'coming' ? 'Coming' :
                                                                    selection.status === 'not_coming' ? 'Not Coming' : 'Pending'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900 max-w-xs truncate" title={selection.notes}>
                                                                {selection.notes || '-'}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowFinalConfirmationModal(false);
                                            setSelectedGroup(null);
                                            setFinalStudentSelections([]);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleLaunchGroup}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        Launch Group
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Modal>

                    {/* Unsaved Changes Warning Modal */}
                    <Modal
                        isOpen={showUnsavedWarning}
                        onClose={() => setShowUnsavedWarning(false)}
                        title="Unsaved Changes"
                        maxWidth="md"
                    >
                        <div className="space-y-4">
                            <p className="text-gray-700">
                                You have unsaved changes. What would you like to do?
                            </p>
                            <div className="flex justify-end space-x-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowUnsavedWarning(false);
                                        setHasUnsavedChanges(false);
                                        clearFormStorage();
                                        if (pendingFormData?.action === 'close') {
                                            setShowAddModal(false);
                                            resetForm();
                                        }
                                    }}
                                >
                                    Discard Changes
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowUnsavedWarning(false);
                                        if (pendingFormData?.action === 'close') {
                                            setShowAddModal(false);
                                            resetForm();
                                        }
                                    }}
                                >
                                    Continue Editing
                                </Button>
                            </div>
                        </div>
                    </Modal>
                </div>
            </div>
            <GlobalKeyboardShortcuts
                onAddNew={() => setShowAddModal(true)}
                isModalOpen={showAddModal}
            />
        </AuthGuard>
    );
} 