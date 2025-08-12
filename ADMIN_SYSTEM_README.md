# Admin System Setup

This document explains the admin system implementation for MySchool Manager.

## Overview

The admin system consists of two types of users:

1. **Superuser (Raouf)** - Has full access to create, manage, and delete admin accounts
2. **Admin (Dalila)** - Regular admin with access to all school management features

## Database Setup

### 1. Run the Admin System Setup

Execute the `admin-system-setup.sql` script in your Supabase SQL Editor:

```sql
-- This will create:
-- 1. admins table with role-based access
-- 2. admin_sessions table for session management
-- 3. Initial superuser (Raouf) and admin (Dalila) accounts
-- 4. Proper indexes and RLS policies
```

### 2. Verify Setup

After running the script, you should see:

```sql
-- Check admin accounts
SELECT username, name, role, is_active FROM admins ORDER BY role, username;
```

Expected output:
```
username | name   | role       | is_active
---------|--------|------------|----------
dalila   | Dalila | admin      | true
raouf    | Raouf  | superuser  | true
```

## User Credentials

### Superuser (Raouf)
- **Username:** `raouf`
- **Password:** `raoufbouk25`
- **Role:** `superuser`
- **Access:** Full system access + admin management

### Admin (Dalila)
- **Username:** `dalila`
- **Password:** `dali19dali25`
- **Role:** `admin`
- **Access:** All school management features

## Features

### Superuser Dashboard (`/superuser`)

1. **Admin Management**
   - View all admin accounts
   - Create new admin accounts
   - Deactivate admin accounts
   - Change admin passwords

2. **Credentials Board**
   - Display all admin credentials
   - Show/hide passwords
   - Copy credentials to clipboard
   - Secure credential management

3. **System Overview**
   - Admin account status
   - Role-based access control
   - Account creation tracking

### Admin Features

1. **School Management**
   - Groups management
   - Students management
   - Teachers management
   - Attendance tracking
   - Call logs
   - Payments

2. **Regular Access**
   - All standard school management features
   - No admin management capabilities

## Security Features

1. **Role-Based Access Control**
   - Superuser can manage all admins
   - Regular admins can only access school features
   - Automatic role checking on all pages

2. **Session Management**
   - Secure session tokens
   - Automatic session expiration
   - Logout functionality

3. **Password Security**
   - Passwords are hashed (in production)
   - Password change functionality
   - Secure credential storage

## Navigation

### Superuser Navigation
- Dashboard
- Registration
- Groups
- Students
- Teachers
- Attendance
- Call Logs
- **Superuser** (new)

### Admin Navigation
- Dashboard
- Registration
- Groups
- Students
- Teachers
- Attendance
- Call Logs

## Implementation Details

### Files Created/Modified

1. **Database**
   - `admin-system-setup.sql` - Database schema and initial data

2. **Types**
   - `src/types/index.ts` - Added Admin and AdminSession interfaces

3. **Services**
   - `src/lib/admin-service.ts` - Admin management service

4. **Components**
   - `src/components/AdminCredentialsBoard.tsx` - Credentials display
   - `src/components/Navigation.tsx` - Updated with superuser link

5. **Pages**
   - `src/app/superuser/page.tsx` - Superuser dashboard

6. **Context**
   - `src/contexts/AuthContext.tsx` - Updated with role-based authentication

### Key Features

1. **Automatic Role Detection**
   - System automatically detects user role
   - Shows/hides features based on role
   - Secure access control

2. **Admin Creation**
   - Superuser can create new admin accounts
   - Automatic role assignment
   - Secure password handling

3. **Credential Management**
   - Secure credential display
   - Copy-to-clipboard functionality
   - Password visibility toggle

## Usage Instructions

### For Raouf (Superuser)

1. **Login** with superuser credentials
2. **Access Superuser Dashboard** via the "Superuser" link in navigation
3. **Create New Admins** using the "Create New Admin" button
4. **Manage Existing Admins** using the admin table
5. **View Credentials** using the credentials board

### For Dalila (Admin)

1. **Login** with admin credentials
2. **Access School Features** via the navigation menu
3. **No Admin Management** - Cannot access superuser features

### For New Admins

1. **Created by Superuser** - Raouf creates new admin accounts
2. **Login** with provided credentials
3. **Access School Features** - Full access to school management
4. **No Admin Management** - Cannot manage other admins

## Security Notes

1. **Production Deployment**
   - Implement proper password hashing (bcrypt)
   - Use environment variables for sensitive data
   - Enable HTTPS
   - Implement rate limiting

2. **Database Security**
   - Enable Row Level Security (RLS)
   - Implement proper access policies
   - Regular security audits

3. **Session Security**
   - Secure session tokens
   - Automatic session cleanup
   - Logout on inactivity

## Troubleshooting

### Common Issues

1. **Login Fails**
   - Check credentials in `AuthContext.tsx`
   - Verify database connection
   - Check browser console for errors

2. **Superuser Access Denied**
   - Verify user role in database
   - Check `isSuperuser` logic in `AuthContext`
   - Clear browser cache and localStorage

3. **Admin Creation Fails**
   - Check database permissions
   - Verify admin service implementation
   - Check browser console for errors

### Support

For issues or questions:
1. Check browser console for error messages
2. Verify database setup
3. Check file permissions and imports
4. Review authentication flow 