const fs = require('fs');
const postgres = require('postgres');
const path = require('path');

const connectionString = "postgresql://postgres:*+5d8HXL7wgpu5A@db.bczmllkpasrkrfqtqjrs.supabase.co:5432/postgres";

const sql = postgres(connectionString, { ssl: 'require' });

async function run() {
  try {
    const dir = path.join(__dirname, 'supabase', 'migrations');
    const files = fs.readdirSync(dir).sort();
    
    for (const file of files) {
      if (!file.endsWith('.sql')) continue;
      console.log(`Running migration: ${file}`);
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      await sql.unsafe(content);
      console.log(`Successfully applied ${file}`);
    }
  } catch (err) {
    console.error("Error running migrations:", err);
  } finally {
    await sql.end();
  }
}

run();
