import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.NEON_DB_URL
  });

  try {
    const migrationPath = path.join(__dirname, '../migrations/004_contact_settings.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('🔄 Running migration: 004_contact_settings.sql');
    await pool.query(sql);
    console.log('✅ Migration completed successfully!');

    // Verify
    const result = await pool.query('SELECT * FROM contact_settings');
    console.log('📊 Contact settings:', result.rows);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
