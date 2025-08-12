# Fix Console Errors - Missing Database Columns

## Problem
You're seeing console errors like:
```
Error fetching group 3 details: {}
Error fetching group 4 details: {}
Error fetching group 6 details: {}
```

These errors occur because the payment system is trying to access columns (`is_frozen` and `freeze_date`) that don't exist in your `groups` table yet.

## Solution

### Option 1: Run the Migration (Recommended)
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `fix-missing-freeze-columns.sql`
4. Run the SQL script
5. This will add the missing columns to your `groups` table

### Option 2: The Code Already Handles Missing Columns
The payment system has been updated to gracefully handle missing columns. It will:
- Try to fetch the freeze status columns first
- Fall back to basic group information if the columns don't exist
- Assume groups are active (not frozen) by default
- Continue working without errors

## What the Migration Does
- Adds `is_frozen` column (boolean, defaults to false)
- Adds `freeze_date` column (timestamp, nullable)
- Sets existing groups to have `is_frozen = false` by default

## After Running the Migration
- Console errors should disappear
- The payment system will properly check group freeze status
- Refunds and debt collection will work correctly based on group status

## Verification
After running the migration, you can verify the columns were added by running:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'groups' 
AND column_name IN ('is_frozen', 'freeze_date')
ORDER BY column_name;
```

## Note
The code has been updated to handle both scenarios (with and without the columns), so your application will work in either case. Running the migration just enables the full functionality.
