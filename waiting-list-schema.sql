-- Create waiting_list table
CREATE TABLE IF NOT EXISTS waiting_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    birth_date DATE,
    language VARCHAR(100) NOT NULL,
    level VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_waiting_list_language ON waiting_list(language);
CREATE INDEX IF NOT EXISTS idx_waiting_list_level ON waiting_list(level);
CREATE INDEX IF NOT EXISTS idx_waiting_list_category ON waiting_list(category);
CREATE INDEX IF NOT EXISTS idx_waiting_list_email ON waiting_list(email);

-- Enable Row Level Security (RLS)
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access" ON waiting_list FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON waiting_list FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON waiting_list FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON waiting_list FOR DELETE USING (true); 