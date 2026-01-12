const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    await client.connect();
    const res = await client.query('SELECT id FROM gyms LIMIT 1');
    if (res.rows.length > 0) {
      console.log(res.rows[0].id);
    } else {
      console.error('No gyms found');
      process.exit(1);
    }
    await client.end();
  } catch (err) {
    console.error('Failed to fetch gym ID:', err);
    process.exit(1);
  }
})();
