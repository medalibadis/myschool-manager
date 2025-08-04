# Supabase Setup Guide

## Prerequisites
- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed
- Next.js project set up

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `myschool_manager` (or your preferred name)
   - Database Password: Create a strong password
   - Region: Choose the closest region to your users
5. Click "Create new project"

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy the following values:
   - Project URL (starts with `https://`)
   - Anon public key (starts with `eyJ`)

## Step 3: Set Up Environment Variables

1. Create a `.env.local` file in your project root
2. Add the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace `your_project_url_here` and `your_anon_key_here` with the values from Step 2.

## Step 4: Set Up Database Schema

1. In your Supabase dashboard, go to SQL Editor
2. Copy and paste the contents of `supabase-schema.sql`
3. Click "Run" to execute the schema

This will create:
- `teachers` table (UUID IDs)
- `groups` table (Sequential IDs starting from 1)
- `students` table (UUID IDs)
- `sessions` table (UUID IDs)
- `attendance` table (UUID IDs)
- `payments` table (UUID IDs)
- All necessary indexes and relationships
- Row Level Security (RLS) policies

### Group ID System

The groups table now uses **sequential integer IDs** starting from 1:
- First group created: ID = 1 (displayed as #000001)
- Second group created: ID = 2 (displayed as #000002)
- And so on...

This provides a clean, predictable numbering system for your groups.

## Step 5: Verify Setup

1. Run the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:3000`

3. Check the browser console for any connection errors

## Step 6: Test Database Connection

You can test the database connection by:

1. Going to the Teachers page and trying to create a teacher
2. Going to the Groups page and trying to create a group
3. Checking the browser's Network tab for any failed requests

## Migration from UUID to Sequential IDs

If you have an existing database with UUID group IDs and want to migrate to sequential IDs:

1. **Backup your data** first!
2. Run the migration script `migrate-to-sequential-ids.sql` in your Supabase SQL Editor
3. **Warning**: This will delete all existing groups, students, sessions, and payments data

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Make sure your `.env.local` file exists and has the correct values
   - Restart your development server after adding environment variables

2. **"Failed to fetch teachers/groups"**
   - Check that your Supabase URL and key are correct
   - Verify that the database schema has been created
   - Check the browser console for detailed error messages

3. **"Table does not exist"**
   - Make sure you've run the `supabase-schema.sql` script in your Supabase SQL Editor
   - Check that all tables were created successfully

4. **RLS (Row Level Security) errors**
   - The schema includes public access policies for development
   - For production, you should implement proper authentication and RLS policies

5. **Group ID type errors**
   - Make sure you're using the updated schema with sequential IDs
   - Check that all TypeScript types are updated to use `number` for group IDs

### Environment Variables

Make sure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Database Schema Verification

You can verify your database schema by running this query in the Supabase SQL Editor:

```sql
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('teachers', 'groups', 'students', 'sessions', 'attendance', 'payments')
ORDER BY table_name, ordinal_position;
```

### Verify Group ID System

To check that the sequential ID system is working:

```sql
-- Check the current sequence value
SELECT currval('groups_id_seq');

-- Check existing groups
SELECT id, name, created_at FROM groups ORDER BY id;
```

## Security Considerations

1. **Environment Variables**: Never commit your `.env.local` file to version control
2. **RLS Policies**: The current setup allows public access for development. For production, implement proper authentication
3. **API Keys**: Keep your service role key secure and only use it for server-side operations

## Next Steps

1. Add authentication (Supabase Auth)
2. Implement proper RLS policies
3. Add data validation
4. Set up backups
5. Configure monitoring and logging

## Support

If you encounter issues:
1. Check the Supabase documentation: https://supabase.com/docs
2. Check the browser console for error messages
3. Verify your database schema matches the expected structure
4. Test the connection using the validation script in `src/lib/supabase-validation.ts` 