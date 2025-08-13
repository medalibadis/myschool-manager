// =====================================================
// TEST SUPABASE CONNECTION FROM FRONTEND
// Run this in your browser console to test connection
// =====================================================

console.log('🔍 Testing Supabase connection...');

// Check if environment variables are loaded
console.log('Environment check:');
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Loaded' : '❌ Missing');
console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Loaded' : '❌ Missing');

// Test basic connection
async function testSupabaseConnection() {
    try {
        console.log('🔄 Testing basic connection...');

        // Try to fetch a simple record
        const { data, error } = await supabase
            .from('call_logs')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Connection failed:', error);
            return false;
        }

        console.log('✅ Connection successful!');
        console.log('Data sample:', data);
        return true;

    } catch (err) {
        console.error('❌ Connection error:', err);
        return false;
    }
}

// Test insert operation
async function testInsertOperation() {
    try {
        console.log('🔄 Testing insert operation...');

        const testData = {
            student_name: 'Test Connection',
            student_phone: '+1234567890',
            call_date: new Date().toISOString().split('T')[0],
            call_time: new Date().toTimeString().split(' ')[0],
            notes: 'Testing connection from frontend',
            call_status: 'test'
        };

        const { data, error } = await supabase
            .from('call_logs')
            .insert(testData)
            .select();

        if (error) {
            console.error('❌ Insert failed:', error);
            return false;
        }

        console.log('✅ Insert successful!');
        console.log('Inserted data:', data);

        // Clean up - delete the test record
        await supabase
            .from('call_logs')
            .delete()
            .eq('student_name', 'Test Connection');

        console.log('🧹 Test data cleaned up');
        return true;

    } catch (err) {
        console.error('❌ Insert error:', err);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Supabase connection tests...');

    const connectionOk = await testSupabaseConnection();
    if (!connectionOk) {
        console.log('❌ Basic connection failed. Stopping tests.');
        return;
    }

    const insertOk = await testInsertOperation();

    console.log('📊 Test Results:');
    console.log('Connection:', connectionOk ? '✅ PASS' : '❌ FAIL');
    console.log('Insert:', insertOk ? '✅ PASS' : '❌ FAIL');

    if (connectionOk && insertOk) {
        console.log('🎉 All tests passed! Supabase connection is working.');
    } else {
        console.log('⚠️ Some tests failed. Check the errors above.');
    }
}

// Run tests when this script is loaded
runAllTests();
