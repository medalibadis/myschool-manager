import { supabase } from './supabase';

export interface SchemaValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export async function validateDatabaseSchema(): Promise<SchemaValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
        // Check if tables exist
        const tables = ['teachers', 'groups', 'students', 'sessions', 'attendance', 'payments'];

        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);

                if (error) {
                    errors.push(`Table '${table}' is not accessible: ${error.message}`);
                }
            } catch (err) {
                errors.push(`Table '${table}' does not exist or is not accessible`);
            }
        }

        // Check if environment variables are set
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
            errors.push('NEXT_PUBLIC_SUPABASE_URL is not set');
        }

        if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
        }

        // Test basic operations
        try {
            const { data: teachers, error: teacherError } = await supabase
                .from('teachers')
                .select('id, name, email, phone, created_at')
                .limit(1);

            if (teacherError) {
                errors.push(`Teachers table structure issue: ${teacherError.message}`);
            }
        } catch (err) {
            errors.push('Cannot access teachers table');
        }

        // Check for data consistency
        try {
            const { data: groups, error: groupError } = await supabase
                .from('groups')
                .select(`
          id, name, teacher_id, start_date, recurring_days, total_sessions, created_at,
          teachers (id, name)
        `)
                .limit(1);

            if (groupError) {
                errors.push(`Groups table structure issue: ${groupError.message}`);
            }
        } catch (err) {
            errors.push('Cannot access groups table or related data');
        }

    } catch (err) {
        errors.push(`Database connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

export async function testDatabaseConnection(): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('teachers')
            .select('count')
            .limit(1);

        return !error;
    } catch {
        return false;
    }
} 