#!/usr/bin/env node

/**
 * Run Database Migration Script
 * Executes the Q&A knowledge migration
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool();

  try {
    console.log('🚀 Starting migration: 005_qa_knowledge.sql');

    // Load environment variables
    require('dotenv').config();

    const databaseUrl = process.env.NEON_DB_URL;
    if (!databaseUrl) {
      throw new Error('NEON_DB_URL not found in environment variables');
    }

    // Create pool
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', '005_qa_knowledge.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded');
    console.log('🔗 Connecting to database...');

    const client = await pool.connect();

    try {
      // Execute migration
      console.log('⚡ Executing migration...');
      await client.query(migrationSQL);

      console.log('✅ Migration completed successfully!');
      console.log('');
      console.log('Created tables:');
      console.log('  - ai_behavior');
      console.log('  - qa_knowledge');
      console.log('');
      console.log('Created indexes:');
      console.log('  - idx_qa_category');
      console.log('  - idx_qa_keywords');
      console.log('  - idx_qa_active');
      console.log('  - idx_qa_priority');
      console.log('');
      console.log('Inserted sample data:');
      console.log('  - 4 AI behavior settings');
      console.log('  - 6 Q&A knowledge entries');
    } finally {
      client.release();
    }

    await pool.end();

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
runMigration();
