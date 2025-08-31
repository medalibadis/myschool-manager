'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import Modal from './ui/Modal';
import { supabase } from '../lib/supabase';
import { Student, StudentGroup } from '../types';

interface GroupDiscountManagerProps {
    student: Student;
    onUpdate?: () => void;
}

interface GroupDiscountData {
    groupId: number;
    groupName: string;
    studentDefaultDiscount: number;
    groupSpecificDiscount: number | null;
    appliedDiscount: number;
}

export default function GroupDiscountManager({ student, onUpdate }: GroupDiscountManagerProps) {
    const [groupDiscounts, setGroupDiscounts] = useState<GroupDiscountData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState<GroupDiscountData | null>(null);
    const [editDiscount, setEditDiscount] = useState('');

    useEffect(() => {
        fetchGroupDiscounts();
    }, [student.id]);

    const fetchGroupDiscounts = async () => {
        try {
            setLoading(true);

            // Get all groups this student is enrolled in
            const { data: studentGroups, error: sgError } = await supabase
                .from('student_groups')
                .select(`
                    group_id,
                    group_discount,
                    groups (
                        id,
                        name,
                        price
                    )
                `)
                .eq('student_id', student.id);

            if (sgError) {
                console.error('Error fetching student groups:', sgError);
                return;
            }

            const discounts: GroupDiscountData[] = studentGroups.map(sg => {
                const studentDefaultDiscount = student.defaultDiscount || 0;
                const groupSpecificDiscount = sg.group_discount;
                const appliedDiscount = groupSpecificDiscount !== null ? groupSpecificDiscount : studentDefaultDiscount;

                return {
                    groupId: sg.group_id,
                    groupName: (sg.groups as any)?.name || 'Unknown Group',
                    studentDefaultDiscount,
                    groupSpecificDiscount,
                    appliedDiscount
                };
            });

            setGroupDiscounts(discounts);
        } catch (error) {
            console.error('Error fetching group discounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditDiscount = (group: GroupDiscountData) => {
        setEditingGroup(group);
        setEditDiscount(group.groupSpecificDiscount?.toString() || '');
        setShowEditModal(true);
    };

    const handleSaveDiscount = async () => {
        if (!editingGroup) return;

        try {
            const discountValue = editDiscount.trim() === '' ? null : parseFloat(editDiscount);

            if (discountValue !== null && (discountValue < 0 || discountValue > 100)) {
                alert('Discount must be between 0 and 100');
                return;
            }

            const { error } = await supabase
                .from('student_groups')
                .update({ group_discount: discountValue })
                .eq('student_id', student.id)
                .eq('group_id', editingGroup.groupId);

            if (error) {
                console.error('Error updating group discount:', error);
                alert('Failed to update discount');
                return;
            }

            console.log('✅ Group discount updated successfully');
            setShowEditModal(false);
            setEditingGroup(null);
            setEditDiscount('');

            // Refresh the data
            fetchGroupDiscounts();
            onUpdate?.();
        } catch (error) {
            console.error('Error saving discount:', error);
            alert('Failed to save discount');
        }
    };

    const handleClearDiscount = async (group: GroupDiscountData) => {
        try {
            const { error } = await supabase
                .from('student_groups')
                .update({ group_discount: null })
                .eq('student_id', student.id)
                .eq('group_id', group.groupId);

            if (error) {
                console.error('Error clearing group discount:', error);
                alert('Failed to clear discount');
                return;
            }

            console.log('✅ Group discount cleared successfully');
            fetchGroupDiscounts();
            onUpdate?.();
        } catch (error) {
            console.error('Error clearing discount:', error);
            alert('Failed to clear discount');
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Group Discounts</CardTitle>
                    <CardDescription>Loading...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Group Discounts</CardTitle>
                    <CardDescription>
                        Manage individual group discounts for {student.name}
                        {(student.defaultDiscount || 0) > 0 && (
                            <span className="text-blue-600 ml-2">
                                (Default: {(student.defaultDiscount || 0)}%)
                            </span>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {groupDiscounts.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                            No groups found for this student
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {groupDiscounts.map((group) => (
                                <div key={group.groupId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{group.groupName}</div>
                                        <div className="text-sm text-gray-500">
                                            Applied discount: {group.appliedDiscount}%
                                            {group.groupSpecificDiscount !== null && (
                                                <span className="text-blue-600 ml-2">
                                                    (Custom: {group.groupSpecificDiscount}%)
                                                </span>
                                            )}
                                            {group.groupSpecificDiscount === null && group.studentDefaultDiscount > 0 && (
                                                <span className="text-gray-600 ml-2">
                                                    (Using default)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleEditDiscount(group)}
                                        >
                                            Edit
                                        </Button>
                                        {group.groupSpecificDiscount !== null && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleClearDiscount(group)}
                                            >
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Discount Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingGroup(null);
                    setEditDiscount('');
                }}
                title={`Edit Discount for ${editingGroup?.groupName}`}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Group-Specific Discount (%)
                        </label>
                        <Input
                            type="number"
                            value={editDiscount}
                            onChange={(e) => setEditDiscount(e.target.value)}
                            placeholder="Enter discount percentage (0-100)"
                            min="0"
                            max="100"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Leave empty to use student's default discount ({(student.defaultDiscount || 0)}%)
                        </p>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="text-sm text-blue-700">
                            <strong>Discount Priority:</strong>
                            <ol className="list-decimal list-inside mt-1 space-y-1">
                                <li>Custom payment discount (if specified during payment)</li>
                                <li>Group-specific discount (if set)</li>
                                <li>Student default discount ({(student.defaultDiscount || 0)}%)</li>
                                <li>No discount</li>
                            </ol>
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowEditModal(false);
                                setEditingGroup(null);
                                setEditDiscount('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSaveDiscount}>
                            Save Discount
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
