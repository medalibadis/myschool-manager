-- Migration to add custom ID fields for students and teachers
-- Students: ST0001, ST0002, etc. (ST + 4-digit number)
-- Teachers: T01, T02, etc. (T + 2-digit number)

-- Step 1: Add custom_id columns to existing tables
ALTER TABLE students ADD COLUMN IF NOT EXISTS custom_id VARCHAR(10) UNIQUE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS custom_id VARCHAR(10) UNIQUE;

-- Step 2: Create sequences for generating custom IDs
CREATE SEQUENCE IF NOT EXISTS student_custom_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS teacher_custom_id_seq START 1;

-- Step 3: Create function to generate student custom ID
CREATE OR REPLACE FUNCTION generate_student_custom_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate custom ID in format ST0001, ST0002, etc.
    NEW.custom_id := 'ST' || LPAD(nextval('student_custom_id_seq')::text, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create function to generate teacher custom ID
CREATE OR REPLACE FUNCTION generate_teacher_custom_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate custom ID in format T01, T02, etc.
    NEW.custom_id := 'T' || LPAD(nextval('teacher_custom_id_seq')::text, 2, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create triggers to automatically generate custom IDs
DROP TRIGGER IF EXISTS trigger_generate_student_custom_id ON students;
CREATE TRIGGER trigger_generate_student_custom_id
    BEFORE INSERT ON students
    FOR EACH ROW
    WHEN (NEW.custom_id IS NULL)
    EXECUTE FUNCTION generate_student_custom_id();

DROP TRIGGER IF EXISTS trigger_generate_teacher_custom_id ON teachers;
CREATE TRIGGER trigger_generate_teacher_custom_id
    BEFORE INSERT ON teachers
    FOR EACH ROW
    WHEN (NEW.custom_id IS NULL)
    EXECUTE FUNCTION generate_teacher_custom_id();

-- Step 6: Update existing records with custom IDs (if any)
-- For students
UPDATE students 
SET custom_id = 'ST' || LPAD(nextval('student_custom_id_seq')::text, 4, '0')
WHERE custom_id IS NULL;

-- For teachers
UPDATE teachers 
SET custom_id = 'T' || LPAD(nextval('teacher_custom_id_seq')::text, 2, '0')
WHERE custom_id IS NULL;

-- Step 7: Make custom_id columns NOT NULL after populating existing data
ALTER TABLE students ALTER COLUMN custom_id SET NOT NULL;
ALTER TABLE teachers ALTER COLUMN custom_id SET NOT NULL;

-- Step 8: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_custom_id ON students(custom_id);
CREATE INDEX IF NOT EXISTS idx_teachers_custom_id ON teachers(custom_id);
