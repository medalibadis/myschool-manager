# 🚀 Complete Setup Guide for MySchool Manager

## 📋 Overview
This guide will help you set up your MySchool Manager application with sequential group IDs (1, 2, 3, etc.) instead of UUIDs.

## 🔧 Step 1: Environment Variables Setup

### 1.1 Create `.env.local` file
Create a file named `.env.local` in your project root and add:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key_here
```

### 1.2 Get Your Supabase Credentials
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon public** key
5. Replace the placeholder values in your `.env.local` file

## 🗄️ Step 2: Database Setup

### 2.1 Run the Complete Database Setup Script
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `complete-database-setup.sql`
4. Click **Run** to execute the script

This script will:
- ✅ Drop all existing tables
- ✅ Create new tables with proper structure
- ✅ Set up sequential group IDs (starting from 1)
- ✅ Create all necessary indexes
- ✅ Enable Row Level Security (RLS)
- ✅ Set up all RLS policies

### 2.2 Verify the Setup (Optional)
1. In the SQL Editor, run the contents of `test-database-setup.sql`
2. This will test the database and show you that group IDs are sequential

## 🎯 Step 3: Test Your Application

### 3.1 Start the Development Server
```bash
npm run dev
```

### 3.2 Create Your First Group
1. Go to `http://localhost:3001` (or your assigned port)
2. Click "Create Group"
3. Fill in the required information:
   - Select a teacher
   - Choose start date
   - Select recurring days
   - Choose language, level, and category
4. Click "Create Group"

### 3.3 Verify Sequential IDs
You should see:
- First group: `#000001`
- Second group: `#000002`
- Third group: `#000003`
- And so on...

## 🔍 Expected Results

### ✅ What You Should See:
- Group IDs start from 1 and increment sequentially
- UI displays IDs with leading zeros (e.g., #000001, #000002)
- All database operations work correctly
- No more JWT expired errors

### ❌ What You Should NOT See:
- UUID-style group IDs (long random strings)
- JWT expired errors
- Database connection issues

## 🛠️ Troubleshooting

### If you still see UUIDs:
1. Make sure you ran the `complete-database-setup.sql` script
2. Check that the `groups` table has `id SERIAL PRIMARY KEY`
3. Verify the sequence starts from 1: `ALTER SEQUENCE groups_id_seq RESTART WITH 1;`

### If you get JWT expired errors:
1. Check your `.env.local` file has correct Supabase credentials
2. Restart your development server: `npm run dev`
3. Clear browser cache and reload the page

### If database operations fail:
1. Check that all RLS policies are created
2. Verify your Supabase project is active
3. Check the browser console for specific error messages

## 📁 File Structure
```
myschool_manager/
├── .env.local                    # Your environment variables
├── complete-database-setup.sql   # Main database setup script
├── test-database-setup.sql       # Test script to verify setup
├── migrate-to-sequential-ids.sql # Migration script (if needed)
└── src/
    ├── lib/
    │   ├── supabase.ts          # Supabase client configuration
    │   └── supabase-service.ts  # Database service functions
    ├── types/
    │   └── index.ts             # TypeScript type definitions
    └── app/
        └── groups/
            └── page.tsx          # Groups page with ID formatting
```

## 🎉 Success!
Once you've completed these steps, your MySchool Manager will have:
- ✅ Sequential group IDs starting from 1
- ✅ Clean UI with formatted IDs (#000001, #000002, etc.)
- ✅ Proper database structure
- ✅ Working authentication
- ✅ All CRUD operations functional

Your groups will now have nice, predictable IDs that are easy to reference and track! 