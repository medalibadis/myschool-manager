import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'https://kfykineemtweunyretmh.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeWtpbmVlbXR3ZXVueXJldG1oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIyMTY3NCwiZXhwIjoyMDY5Nzk3Njc0fQ.kezFAqh6FiD5H4248Py16D3UgWwX8W1E_8YsZHcv6eA';

const TABLES = [
    'teachers',
    'groups',
    'students',
    'student_groups',
    'sessions',
    'attendance',
    'payments',
    'receipts',
    'teacher_salaries',
    'teacher_attendance',
    'teacher_covering',
    'waiting_list',
    'call_logs',
    'admins'
];

async function fetchTableInBatches(tableName) {
    const pageSize = 1000;
    let offset = 0;
    let allRows = [];
    let hasMore = true;

    while (hasMore) {
        const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?select=*&limit=${pageSize}&offset=${offset}`, {
            headers: {
                'apikey': serviceRoleKey,
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Prefer': 'count=exact'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                // Table might not exist yet
                return null;
            }
            const err = await response.text();
            throw new Error(`Failed to export ${tableName}: ${err}`);
        }

        const rows = await response.json();
        allRows = allRows.concat(rows);

        if (rows.length < pageSize) {
            hasMore = false;
        } else {
            offset += pageSize;
        }
    }

    return allRows;
}

async function runBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.resolve(process.cwd(), `backup-${timestamp}`);
    fs.mkdirSync(backupDir, { recursive: true });

    console.log(`📦 Starting full production data backup to: ${backupDir}`);
    const summary = {};

    for (const table of TABLES) {
        try {
            process.stdout.write(`Fetching ${table}... `);
            const rows = await fetchTableInBatches(table);
            if (rows === null) {
                console.log(`(table does not exist in DB)`);
                continue;
            }
            const filePath = path.join(backupDir, `${table}.json`);
            fs.writeFileSync(filePath, JSON.stringify(rows, null, 2), 'utf8');
            summary[table] = rows.length;
            console.log(`✅ ${rows.length} rows saved to ${table}.json`);
        } catch (e) {
            console.log(`❌ Error: ${e.message}`);
        }
    }

    fs.writeFileSync(path.join(backupDir, `backup-summary.json`), JSON.stringify({
        timestamp,
        supabaseUrl,
        tables: summary
    }, null, 2), 'utf8');

    console.log('\n🎉 Backup completed successfully! Summary:');
    console.table(summary);
    console.log(`\nSaved in folder: ${backupDir}`);
}

runBackup();
