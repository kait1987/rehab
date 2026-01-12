const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL is not defined');
  process.exit(1);
}

const sqlPath = path.join(process.cwd(), 'supabase/migrations/20240112_gym_reports_rls.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    await client.connect();
    console.log('Connected to DB. Applying RLS...');
    await client.query(sql);
    console.log('✅ RLS policies applied successfully!');
    await client.end();
  } catch (err) {
    console.error('❌ Failed to apply RLS:', err);
    process.exit(1);
  }
})();
