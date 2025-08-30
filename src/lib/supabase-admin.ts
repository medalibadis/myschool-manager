import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;



// Create a Supabase client with service role key for admin operations
// Only create if service role key is available
export const supabaseAdmin = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;

// Helper function to check if admin client is available
export const isAdminClientAvailable = () => {
    return supabaseAdmin !== null;
};

// Helper function to get admin client or throw error
export const getAdminClient = () => {
    if (!supabaseAdmin) {
        throw new Error('Missing Supabase service role environment variables. Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.');
    }
    return supabaseAdmin;
};
