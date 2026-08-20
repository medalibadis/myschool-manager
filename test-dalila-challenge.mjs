import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kfykineemtweunyretmh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeWtpbmVlbXR3ZXVueXJldG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMjE2NzQsImV4cCI6MjA2OTc5NzY3NH0.XEh-YUjLTyGUXz46vVUiLbiUV4avSejCj7NkL0esIBc';

const client = createClient(supabaseUrl, supabaseKey);

async function testChallenge() {
    console.log('Logging in...');
    const { data: authData, error: loginError } = await client.auth.signInWithPassword({
        email: 'dalila@myschool.com',
        password: 'Dalila#af6764cf09aa2026'
    });

    if (loginError) {
        console.error('Login error:', loginError);
        return;
    }

    console.log('List factors...');
    const { data: factors } = await client.auth.mfa.listFactors();
    console.log('Factors:', factors);
    const verifiedFactor = factors?.totp?.find(f => f.status === 'verified');

    if (!verifiedFactor) {
        console.error('No verified factor found.');
        return;
    }

    console.log('Challenging with dummy code 000000...');
    const start = Date.now();
    const { error: challengeError } = await client.auth.mfa.challengeAndVerify({
        factorId: verifiedFactor.id,
        code: '000000'
    });
    console.log(`Challenge finished in ${Date.now() - start}ms`);
    console.log('Challenge error (should be invalid code):', challengeError);
}

testChallenge();
