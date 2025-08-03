# Supabase Integration Setup Guide

This guide will help you set up Supabase with your MySchool Manager project.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed on your system

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Choose your organization
4. Enter a project name (e.g., "myschool-manager")
5. Enter a database password
6. Choose a region close to your users
7. Click "Create new project"

## Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy your Project URL
3. Copy your anon/public key

## Step 3: Set Up Environment Variables

1. Create a `.env.local` file in your project root
2. Add the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace `your_project_url_here` and `your_anon_key_here` with your actual Supabase credentials.

## Step 4: Set Up the Database Schema

1. In your Supabase dashboard, go to SQL Editor
2. Copy the contents of `supabase-schema.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the schema

This will create all the necessary tables:
- `teachers` - Store teacher information
- `groups` - Store group information
- `students` - Store student information
- `sessions` - Store session information
- `attendance` - Store attendance records
- `payments` - Store payment records

## Step 5: Install Dependencies

Run the following command to install Supabase dependencies:

```bash
npm install
```

## Step 6: Test the Integration

1. Start your development server:
```bash
npm run dev
```

2. Navigate to your teachers page
3. Try creating, editing, and deleting teachers
4. Check the Supabase dashboard to see the data being stored

## Step 7: Deploy to Vercel

1. Push your changes to GitHub
2. In your Vercel dashboard, add the environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy your application

## Environment Variables for Vercel

Make sure to add these environment variables in your Vercel project settings:

- `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key

## Database Schema Overview

### Teachers Table
- `id` - Unique identifier
- `name` - Teacher's name
- `email` - Teacher's email (unique)
- `phone` - Teacher's phone number (optional)
- `created_at` - Timestamp

### Groups Table
- `id` - Unique identifier
- `name` - Group name
- `teacher_id` - Reference to teacher
- `start_date` - When the group starts
- `recurring_days` - Array of days (0=Sunday, 1=Monday, etc.)
- `total_sessions` - Number of sessions
- `created_at` - Timestamp

### Students Table
- `id` - Unique identifier
- `name` - Student's name
- `email` - Student's email
- `phone` - Student's phone (optional)
- `price_per_session` - Cost per session
- `total_paid` - Total amount paid
- `group_id` - Reference to group
- `created_at` - Timestamp

### Sessions Table
- `id` - Unique identifier
- `date` - Session date
- `group_id` - Reference to group
- `created_at` - Timestamp

### Attendance Table
- `id` - Unique identifier
- `session_id` - Reference to session
- `student_id` - Reference to student
- `attended` - Whether student attended
- `created_at` - Timestamp

### Payments Table
- `id` - Unique identifier
- `student_id` - Reference to student
- `group_id` - Reference to group
- `amount` - Payment amount
- `date` - Payment date
- `notes` - Payment notes (optional)
- `created_at` - Timestamp

## Security Notes

- The current setup allows public access to all tables
- For production, consider implementing authentication
- You can modify the RLS (Row Level Security) policies in Supabase
- Consider adding user authentication with Supabase Auth

## Troubleshooting

### Common Issues

1. **Environment variables not working**
   - Make sure you've created `.env.local` file
   - Restart your development server after adding environment variables

2. **Database connection errors**
   - Verify your Supabase URL and anon key are correct
   - Check that your Supabase project is active

3. **Schema errors**
   - Make sure you've run the SQL schema in Supabase
   - Check the SQL Editor for any error messages

4. **CORS errors**
   - Add your domain to the allowed origins in Supabase settings

### Getting Help

- Check the Supabase documentation: https://supabase.com/docs
- Check the Next.js documentation: https://nextjs.org/docs
- Check the Zustand documentation: https://github.com/pmndrs/zustand 