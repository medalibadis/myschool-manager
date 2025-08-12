# Fix Database Issues Guide

## Problems
You're getting multiple database schema errors:

1. **`ERROR: 42703: column 'status' does not exist`** - `student_groups` table missing `status` column
2. **`Could not find the 'updated_at' column of 'attendance' in the schema cache`** - `attendance` table missing `updated_at` column

These mean your database tables exist but are missing required columns.

## Solution Options

### Option 1: Run the Migration Scripts (Recommended)
1. Open your database management tool (pgAdmin, Supabase Dashboard, etc.)
2. Run the SQL from `add-status-column-migration-simple.sql` to fix student_groups table
3. Run the SQL from `fix-attendance-table-migration-simple.sql` to fix attendance table
4. These simplified scripts work in any SQL interface and will add the missing columns

### Option 2: Manual SQL Commands
Run these commands in your database:

**For student_groups table:**
```sql
-- Add the status column
ALTER TABLE student_groups 
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active';

-- Add the check constraint
ALTER TABLE student_groups 
ADD CONSTRAINT check_status_values 
CHECK (status IN ('active', 'stopped'));

-- Update any existing records
UPDATE student_groups 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'student_groups' 
AND column_name = 'status';
```

**For attendance table:**
```sql
-- Add the updated_at column
ALTER TABLE attendance 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add status column if it doesn't exist
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'default';

-- Add check constraint for status values
ALTER TABLE attendance 
ADD CONSTRAINT check_attendance_status 
CHECK (status IN ('present', 'absent', 'late', 'excused', 'default'));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_attendance_updated_at();
```

### Option 3: Use the Browser Console
1. Open your application in the browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Run this command:
```javascript
// This will attempt to fix the missing column automatically
await studentService.fixMissingStatusColumn();
```

### Option 4: Recreate the Table (Nuclear Option)
If the above options don't work, you can drop and recreate the table:

```sql
-- Drop the existing table
DROP TABLE IF EXISTS student_groups CASCADE;

-- Run the complete create-student-group-junction.sql script
-- This will create the table with all required columns
```

## Verification
After fixing both tables, you should be able to:
1. Add students to groups without errors
2. Update attendance records without errors
3. See the status columns in your database
4. Use the full functionality of both student status and attendance systems

## Next Steps
Once both tables are fixed:
1. Refresh your application
2. Try adding a student from the waiting list again
3. Try updating attendance records
4. Both errors should be resolved
5. You can then use the full functionality of both systems
