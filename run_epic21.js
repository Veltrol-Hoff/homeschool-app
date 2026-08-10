const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const connectionString = process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to DB');
    const sql = fs.readFileSync('C:/Users/ewhof/.gemini/antigravity/brain/0772288e-39e9-4683-a48b-40af064eb763/epic21_decouple_academic_years.sql', 'utf8');
    await client.query(sql);
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
