const { Client } = require('pg');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

console.log('--- Database Connection Test ---');

if (!dbUrl) {
  console.error('❌ DATABASE_URL is not defined in .env');
  process.exit(1);
}

// Mask password for logging
const maskUrl = (url) => {
  try {
    const parsed = new URL(url);
    parsed.password = '****';
    return parsed.toString();
  } catch (e) {
    return 'Invalid URL';
  }
};

console.log(`DATABASE_URL: ${maskUrl(dbUrl)}`);
if (directUrl) console.log(`DIRECT_URL: ${maskUrl(directUrl)}`);

async function testConnection(url, label) {
  console.log(`\nTesting connection to ${label}...`);
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }, // Supabase requires SSL
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    console.log(`✅ Connected to ${label} successfully!`);
    const res = await client.query('SELECT NOW() as now');
    console.log(`   Server Time: ${res.rows[0].now}`);
    await client.end();
    return true;
  } catch (err) {
    console.error(`❌ Failed to connect to ${label}:`);
    console.error(`   Code: ${err.code}`);
    console.error(`   Message: ${err.message}`);
    if (err.address) console.error(`   Host: ${err.address}`);
    if (err.port) console.error(`   Port: ${err.port}`);
    return false;
  }
}

(async () => {
  let success = await testConnection(dbUrl, 'DATABASE_URL');
  if (directUrl && directUrl !== dbUrl) {
    success = (await testConnection(directUrl, 'DIRECT_URL')) && success;
  }

  if (success) {
    console.log('\n✅ All connections successful.');
    process.exit(0);
  } else {
    console.log('\n❌ Connection failed.');
    process.exit(1);
  }
})();
