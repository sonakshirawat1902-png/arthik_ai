const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

function cleanConnectionString(raw) {
  if (!raw) return '';
  let str = raw.trim();
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1);
  }
  return str.trim();
}

async function testConnection() {
  console.log('=== POSTGRESQL SAFE CONNECTION & SCHEMA AUDIT ===');

  const rawConnStr = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const connectionString = cleanConnectionString(rawConnStr);

  if (!connectionString) {
    console.log('STATUS: No connection string found in .env (DATABASE_URL / DIRECT_URL)');
    return { connected: false, error: 'No connection string' };
  }

  // Obfuscated indicator for logging
  const maskedHost = connectionString.includes('@')
    ? connectionString.split('@')[1].split('/')[0]
    : 'configured_host';
  console.log(`Target Database Host: [REDACTED_USER]@${maskedHost}`);

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✓ Successfully connected to PostgreSQL server!');

    // 1. Safe Query test: SELECT 1
    const testRes = await client.query('SELECT 1 as alive;');
    if (testRes.rows[0].alive === 1) {
      console.log('✓ SELECT 1 test passed successfully!');
    }

    // 2. Check public schema tables
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('businesses', 'products', 'sales', 'sale_items', 'expenses', 'profiles', 'business_members', 'business_settings');
    `);

    const existingTables = tableRes.rows.map(r => r.table_name).sort();
    console.log('Existing Application Tables in Public Schema:', existingTables);

    // 3. Check Row Level Security (RLS) status
    const rlsRes = await client.query(`
      SELECT relname, relrowsecurity 
      FROM pg_class c 
      JOIN pg_namespace n ON n.oid = c.relnamespace 
      WHERE n.nspname = 'public' 
        AND c.relname IN ('businesses', 'products', 'sales', 'expenses', 'profiles');
    `);

    const rlsMap = {};
    rlsRes.rows.forEach(r => {
      rlsMap[r.relname] = r.relrowsecurity;
    });

    console.log('Row-Level Security (RLS) Status per Table:', rlsMap);

    const isFullyMigrated = existingTables.includes('businesses') && existingTables.includes('products') && existingTables.includes('sales');

    await client.end();
    return {
      connected: true,
      tablesFound: existingTables,
      isFullyMigrated,
      rlsMap,
    };
  } catch (err) {
    console.error('Connection Verification Result: FAILURE');
    console.error('Error Details:', err.message);
    await client.end().catch(() => {});
    return { connected: false, error: err.message };
  }
}

testConnection().then(res => {
  console.log('--- TEST SUMMARY ---');
  console.log('Connected:', res.connected);
  if (res.connected) {
    console.log('Schema Migrated:', res.isFullyMigrated);
  } else {
    console.log('Authentication/Connection Error:', res.error);
  }
  process.exit(0);
});
