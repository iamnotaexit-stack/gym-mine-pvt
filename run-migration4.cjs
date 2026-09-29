const fs = require('fs');
const postgres = require('postgres');
const path = require('path');

const connectionString = "postgresql://postgres:*+5d8HXL7wgpu5A@db.bczmllkpasrkrfqtqjrs.supabase.co:5432/postgres";
const sql = postgres(connectionString, { ssl: 'require' });

async function run() {
  try {
    const content = fs.readFileSync(path.join(__dirname, 'supabase', 'migrations', '0004_member_role.sql'), 'utf8');
    await sql.unsafe(content);
    console.log(`Successfully applied 0004`);
  } catch (err) {
    console.error("Error running migrations:", err);
  } finally {
    await sql.end();
  }
}

run();
