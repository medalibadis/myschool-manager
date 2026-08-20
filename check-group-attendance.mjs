import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kfykineemtweunyretmh.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeWtpbmVlbXR3ZXVueXJldG1oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIyMTY3NCwiZXhwIjoyMDY5Nzk3Njc0fQ.kezFAqh6FiD5H4248Py16D3UgWwX8W1E_8YsZHcv6eA';

const client = createClient(supabaseUrl, serviceRoleKey);

async function checkExactGroup() {
    console.log('Searching for groups matching "%English%Adults%"...');
    const { data: groups, error } = await client
        .from('groups')
        .select('id, name, teacher_id, created_at')
        .ilike('name', '%English%Adults%');

    console.log('All matching groups in DB:');
    for (const g of groups || []) {
        const { data: sessions } = await client.from('sessions').select('id, date').eq('group_id', g.id);
        const sessionIds = (sessions || []).map(s => s.id);
        const { count } = await client
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .in('session_id', sessionIds);

        console.log(`- ID: ${g.id}, Name: "${g.name}", Sessions: ${sessions?.length || 0}, Attendance rows: ${count || 0}`);
    }
}

checkExactGroup();
