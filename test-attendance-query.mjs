import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kfykineemtweunyretmh.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeWtpbmVlbXR3ZXVueXJldG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMjE2NzQsImV4cCI6MjA2OTc5NzY3NH0.XEh-YUjLTyGUXz46vVUiLbiUV4avSejCj7NkL0esIBc';

const client = createClient(supabaseUrl, anonKey);

async function testAttendanceQuery() {
    console.log('1. Logging in as raouf@myschool.com...');
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
        email: 'raouf@myschool.com',
        password: 'Raouf#436739d7d5fd639d!2026'
    });

    if (authError || !authData.user) {
        console.error('Login failed:', authError);
        return;
    }
    console.log('✅ Logged in! User ID:', authData.user.id);

    console.log('\n2. Testing SELECT on admin_profiles...');
    const { data: profile, error: profErr } = await client
        .from('admin_profiles')
        .select('*')
        .eq('id', authData.user.id);
    console.log('Admin Profile result:', profile, 'Error:', profErr);

    console.log('\n3. Testing find group by name "English|A2+|Adults (Next)"...');
    const { data: groups, error: groupErr } = await client
        .from('groups')
        .select('id, name')
        .ilike('name', '%English%A2%Adults%')
        .limit(5);
    console.log('Groups found:', groups, 'Error:', groupErr);

    if (groups && groups.length > 0) {
        for (const targetGroup of groups) {
            console.log(`\n4. Testing attendance query for group ${targetGroup.id} (${targetGroup.name})...`);

            // Fetch sessions
            const { data: sessions, error: sessErr } = await client
                .from('sessions')
                .select('id, date, group_id')
                .eq('group_id', targetGroup.id);
            console.log(`Sessions count: ${sessions?.length || 0}`, 'Error:', sessErr);

            if (sessions && sessions.length > 0) {
                const sessionIds = sessions.map(s => s.id);
                const { data: attData, error: attErr } = await client
                    .from('attendance')
                    .select('session_id, student_id, status')
                    .in('session_id', sessionIds);

                console.log(`Attendance records count for group: ${attData?.length || 0}`, 'Error:', attErr);
                if (attData && attData.length > 0) {
                    console.log('Sample attendance record:', attData[0]);
                }
            }
        }
    }
}

testAttendanceQuery();
