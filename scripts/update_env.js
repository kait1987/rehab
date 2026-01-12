const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
let content = fs.readFileSync(envPath, 'utf8');

const dbUrl = 'DATABASE_URL="postgresql://postgres.ggmoudegjlobgytngkgx:TBRGcwbR6a2GLmpW@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"';
const directUrl = 'DIRECT_URL="postgresql://postgres.ggmoudegjlobgytngkgx:TBRGcwbR6a2GLmpW@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"';

// Replace or append DATABASE_URL
if (content.match(/DATABASE_URL=/)) {
  content = content.replace(/DATABASE_URL=.*/g, dbUrl);
} else {
  content += '\n' + dbUrl;
}

// Replace or append DIRECT_URL
if (content.match(/DIRECT_URL=/)) {
  content = content.replace(/DIRECT_URL=.*/g, directUrl);
} else {
  content += '\n' + directUrl;
}

// Clean up commented out lines if they exist and are causing confusion (optional)
// content = content.replace(/^#postgresql:.*/gm, '');

fs.writeFileSync(envPath, content);
console.log('Updated .env successfully');
