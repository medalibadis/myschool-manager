# Admin System Setup Guide

## 🚨 **IMPORTANT: Database Setup Required**

Before you can create admins, you need to set up the database tables. Follow these steps:

### Step 1: Run Database Setup Script

1. **Go to your Supabase Dashboard**
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Setup Script**
   - Copy the entire content from `setup-admin-system.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

4. **Verify the Setup**
   - You should see: "✅ Admin system setup completed!"
   - You should see Raouf and Dalila created

### Step 2: Test the Connection

1. **Login as Raouf (Superuser)**
   - Username: `raouf`
   - Password: `raoufbouk25`

2. **Go to Superuser Dashboard**
   - Navigate to `/superuser`
   - Click "Test Connection"
   - You should see: "Database connected successfully. Found 2 admin(s)."

### Step 3: Create New Admins

1. **Click "Create New Admin"**
   - Fill in the required fields:
     - **Username**: Choose a unique username
     - **Password**: Choose a secure password
     - **Full Name**: Enter the admin's full name
     - **Email**: (Optional) Enter email address
     - **Phone**: (Optional) Enter phone number
     - **Role**: Choose 'admin' or 'superuser'

2. **Submit the Form**
   - Click "Create Admin"
   - You should see: "Admin created successfully! Username: [username], Password: [password]"

3. **Test the New Admin**
   - Logout and login with the new credentials
   - The new admin should be able to access the system

## 🔧 **Troubleshooting**

### Error: "Admins table does not exist"

**Solution**: Run the `setup-admin-system.sql` script in your Supabase dashboard.

### Error: "Username already exists"

**Solution**: Choose a different username for the new admin.

### Error: "Permission denied"

**Solution**: Make sure you're logged in as a superuser (Raouf).

### Error: "Database connection error"

**Solution**: 
1. Check your Supabase URL and key in `.env.local`
2. Restart your development server
3. Clear browser cache

## 📋 **Admin Credentials**

### Initial Admins (Created by Setup Script)

1. **Raouf (Superuser)**
   - Username: `raouf`
   - Password: `raoufbouk25`
   - Role: `superuser`

2. **Dalila (Admin)**
   - Username: `dalila`
   - Password: `dali19dali25`
   - Role: `admin`

### New Admins (Created by You)

- Username: As specified during creation
- Password: As specified during creation
- Role: `admin` or `superuser`

## 🔐 **Security Notes**

1. **Password Hashing**: Passwords are hashed before storing in the database
2. **RLS Policies**: Row Level Security is enabled with permissive policies for testing
3. **Session Management**: Admin sessions are tracked in the `admin_sessions` table

## 🎯 **Expected Results**

After setup, you should have:
- ✅ Admin creation working without errors
- ✅ New admins can login with their credentials
- ✅ Superuser can manage all admins
- ✅ Admin table displays all created admins
- ✅ Test connection shows success message

## 📞 **Support**

If you encounter issues:
1. Check the browser console for error messages
2. Verify the database setup was completed
3. Ensure you're using the correct Supabase credentials
4. Test the connection using the "Test Connection" button 