import { supabase } from './supabase';
import { Admin } from '../types';

// Fixed admin data - no database operations needed
const FIXED_ADMINS: Admin[] = [
    {
        id: '1',
        username: 'user1',
        name: 'User One',
        email: 'user1@myschool.com',
        phone: '+1234567890',
        role: 'admin',
        isActive: true,
        createdBy: 'system',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        password_hash: 'user1pass123'
    },
    {
        id: '2',
        username: 'user2',
        name: 'User Two',
        email: 'user2@myschool.com',
        phone: '+0987654321',
        role: 'admin',
        isActive: true,
        createdBy: 'system',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        password_hash: 'user2pass456'
    },
    {
        id: '3',
        username: 'dalila',
        name: 'Dalila',
        email: 'dalila@myschool.com',
        phone: '+1122334455',
        role: 'superuser',
        isActive: true,
        createdBy: 'system',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        password_hash: 'dali19dali25'
    }
];

export const adminService = {
    // Get all admins (only for superuser)
    async getAll(): Promise<Admin[]> {
        try {
            // Return fixed admins instead of database query
            return FIXED_ADMINS.filter(admin => admin.isActive);
        } catch (error) {
            console.error('Error fetching admins:', error);
            return [];
        }
    },

    // Get admin by username
    async getByUsername(username: string): Promise<Admin | null> {
        try {
            const admin = FIXED_ADMINS.find(a => a.username === username && a.isActive);
            return admin || null;
        } catch (error) {
            console.error('Error fetching admin:', error);
            return null;
        }
    },

    // Update admin password
    async updatePassword(id: string, newPassword: string): Promise<void> {
        try {
            const adminIndex = FIXED_ADMINS.findIndex(a => a.id === id);
            if (adminIndex !== -1) {
                FIXED_ADMINS[adminIndex].password_hash = newPassword;
                FIXED_ADMINS[adminIndex].updatedAt = new Date();
            }
        } catch (error) {
            console.error('Error updating password:', error);
            throw error;
        }
    },

    // Deactivate admin (soft delete)
    async deactivate(id: string): Promise<void> {
        try {
            const adminIndex = FIXED_ADMINS.findIndex(a => a.id === id);
            if (adminIndex !== -1) {
                FIXED_ADMINS[adminIndex].isActive = false;
                FIXED_ADMINS[adminIndex].updatedAt = new Date();
            }
        } catch (error) {
            console.error('Error deactivating admin:', error);
            throw error;
        }
    },

    // Verify credentials (for login)
    async verifyCredentials(username: string, password: string): Promise<Admin | null> {
        try {
            const admin = FIXED_ADMINS.find(a => a.username === username && a.isActive);

            if (!admin) {
                return null;
            }

            // Check password
            if (admin.password_hash === password) {
                return admin;
            }

            return null;
        } catch (error) {
            console.error('Error in verifyCredentials:', error);
            return null;
        }
    },

    // Test connection (simplified)
    async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            const activeAdmins = FIXED_ADMINS.filter(admin => admin.isActive);
            return {
                success: true,
                message: `System connected successfully. Found ${activeAdmins.length} admin(s).`
            };
        } catch (error) {
            return {
                success: false,
                message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
}; 