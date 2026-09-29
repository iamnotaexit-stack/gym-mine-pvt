const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.SUPABASE_DB_URL, { ssl: 'require' });

async function run() {
  await sql`ALTER TABLE settings ADD COLUMN admission_fee integer DEFAULT 500`;
  console.log('Migration 5 applied!');
  process.exit(0);
}
run();
