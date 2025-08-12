-- Make email field optional in waiting_list table
ALTER TABLE waiting_list ALTER COLUMN email DROP NOT NULL; 