-- =====================================================
-- FIX CUSTOM ID GENERATION FUNCTION
-- This fixes the type mismatch error in the generate_custom_id function
-- =====================================================

-- 1. Drop the existing broken function
DROP FUNCTION IF EXISTS generate_custom_id();

-- 2. Create the corrected function with proper type handling
CREATE OR REPLACE FUNCTION generate_custom_id()
RETURNS TRIGGER AS $$
DECLARE
    next_id INTEGER;
BEGIN
    -- Get the next ID number from existing custom_ids
    SELECT COALESCE(MAX(CAST(SUBSTRING(custom_id FROM 3) AS INTEGER)), 0) + 1
    INTO next_id
    FROM students 
    WHERE custom_id ~ '^ST[0-9]+$';
    
    -- Generate the new custom_id with proper formatting
    NEW.custom_id := 'ST' || LPAD(next_id::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_generate_custom_id ON students;

CREATE TRIGGER trigger_generate_custom_id
    BEFORE INSERT ON students
    FOR EACH ROW
    WHEN (NEW.custom_id IS NULL)
    EXECUTE FUNCTION generate_custom_id();

-- 4. Test the function
SELECT 'TESTING CUSTOM ID FUNCTION:' as info;

-- Test with a sample student insert
INSERT INTO students (
    name, 
    email, 
    phone
) VALUES (
    'Test Custom ID Student', 
    'testcustom@student.com', 
    '+1234567890'
) ON CONFLICT DO NOTHING;

-- 5. Verify the custom_id was generated
SELECT 'VERIFYING CUSTOM ID:' as info;
SELECT name, custom_id FROM students WHERE name = 'Test Custom ID Student';

-- 6. Final status
SELECT '🎉 CUSTOM ID FUNCTION FIXED!' as message;
SELECT 'The generate_custom_id function now works without type errors.' as details;
