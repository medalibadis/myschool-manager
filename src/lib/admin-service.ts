import { supabase } from './supabase';
import { AdminProfile, AdminRole, Admin } from '../types';

export const adminService = {
    // Get all admin profiles (Super Admin only, enforced by RLS)
    async getAll(): Promise<AdminProfile[]> {
        try {
            const { data: profiles, error: profileError } = await supabase
                .from('admin_profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (profileError) {
                console.error('Error fetching admin profiles:', profileError);
                return [];
            }

            const { data: allPerms } = await supabase
                .from('admin_permissions')
                .select('admin_id, permission');

            const permsByAdmin: Record<string, string[]> = {};
            (allPerms || []).forEach(p => {
                if (!permsByAdmin[p.admin_id]) permsByAdmin[p.admin_id] = [];
                permsByAdmin[p.admin_id].push(p.permission);
            });

            return (profiles || []).map(p => ({
                id: p.id,
                name: p.name,
                email: p.email,
                phone: p.phone,
                role: p.role as AdminRole,
                is_active: p.is_active,
                created_at: p.created_at,
                updated_at: p.updated_at,
                permissions: permsByAdmin[p.id] || [],
            }));
        } catch (error) {
            console.error('Exception fetching admins:', error);
            return [];
        }
    },

    // Get admin profile by ID
    async getById(id: string): Promise<AdminProfile | null> {
        try {
            const { data: profile, error } = await supabase
                .from('admin_profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !profile) return null;

            const { data: perms } = await supabase
                .from('admin_permissions')
                .select('permission')
                .eq('admin_id', id);

            return {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
                role: profile.role as AdminRole,
                is_active: profile.is_active,
                created_at: profile.created_at,
                updated_at: profile.updated_at,
                permissions: perms ? perms.map(p => p.permission) : [],
            };
        } catch (error) {
            console.error('Error fetching admin profile:', error);
            return null;
        }
    },

    // Update admin permissions (Super Admin only)
    async updatePermissions(adminId: string, permissions: string[]): Promise<void> {
        try {
            // Delete existing permissions
            const { error: delError } = await supabase
                .from('admin_permissions')
                .delete()
                .eq('admin_id', adminId);

            if (delError) throw delError;

            if (permissions.length > 0) {
                const inserts = permissions.map(p => ({
                    admin_id: adminId,
                    permission: p,
                }));

                const { error: insError } = await supabase
                    .from('admin_permissions')
                    .insert(inserts);

                if (insError) throw insError;
            }
        } catch (error) {
            console.error('Error updating admin permissions:', error);
            throw error;
        }
    },

    // Update active status (soft disable)
    async updateStatus(adminId: string, isActive: boolean): Promise<void> {
        const { error } = await supabase
            .from('admin_profiles')
            .update({ is_active: isActive, updated_at: new Date().toISOString() })
            .eq('id', adminId);

        if (error) throw error;
    },

    // Create a new admin (Super Admin only, calls protected API)
    async createAdmin(params: {
        name: string;
        email: string;
        password: string;
        phone?: string;
        role?: string;
        permissions?: string[];
    }): Promise<{ success: boolean; message?: string; userId?: string }> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/admin/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || ''}`,
                },
                body: JSON.stringify(params),
            });

            const data = await res.json();
            return { success: res.ok, message: data.message || data.error, userId: data.userId };
        } catch (e) {
            return { success: false, message: 'Failed to create admin account.' };
        }
    },
};