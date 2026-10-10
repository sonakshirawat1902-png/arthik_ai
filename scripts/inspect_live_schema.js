const { Client } = require('pg');
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

async function inspectLiveSchema() {
  console.log('=== LIVE DATABASE READ-ONLY COMPATIBILITY AUDIT ===');
  const connStr = cleanConnectionString(process.env.DIRECT_URL || process.env.DATABASE_URL);
  
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✓ Connected to remote PostgreSQL database.');

    const targetTables = [
      'profiles', 'users', 'businesses', 'business_members', 
      'business_settings', 'products', 'sales', 'sale_items', 'expenses'
    ];

    // 1. Check Table Existence & Columns
    console.log('\n--- 1. TABLE & COLUMN AUDIT ---');
    const colRes = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ANY($1)
      ORDER BY table_name, ordinal_position;
    `, [targetTables]);

    const tableSchemaMap = {};
    colRes.rows.forEach(r => {
      if (!tableSchemaMap[r.table_name]) tableSchemaMap[r.table_name] = [];
      tableSchemaMap[r.table_name].push(`${r.column_name} (${r.data_type}, nullable: ${r.is_nullable})`);
    });

    targetTables.forEach(tbl => {
      if (tableSchemaMap[tbl]) {
        console.log(`[EXISTS] public.${tbl}:`);
        tableSchemaMap[tbl].forEach(col => console.log(`  - ${col}`));
      } else {
        console.log(`[MISSING] public.${tbl} does NOT exist in public schema.`);
      }
    });

    // 2. Check Constraints (Primary Keys, Foreign Keys, Unique)
    console.log('\n--- 2. CONSTRAINTS AUDIT ---');
    const constraintRes = await client.query(`
      SELECT tc.table_name, tc.constraint_name, tc.constraint_type, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = ANY($1)
      ORDER BY tc.table_name, tc.constraint_type;
    `, [targetTables]);

    constraintRes.rows.forEach(r => {
      console.log(`  - Table: public.${r.table_name} | ${r.constraint_type}: ${r.constraint_name} (${r.column_name})`);
    });

    // 3. Check Triggers on auth.users
    console.log('\n--- 3. AUTH.USERS TRIGGERS AUDIT ---');
    const triggerRes = await client.query(`
      SELECT tgname, proname 
      FROM pg_trigger t
      JOIN pg_proc p ON t.tgfoid = p.oid
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'auth' AND c.relname = 'users';
    `);

    if (triggerRes.rows.length === 0) {
      console.log('✓ No triggers currently attached to auth.users.');
    } else {
      triggerRes.rows.forEach(r => {
        console.log(`  - Trigger on auth.users: ${r.tgname} -> Function: ${r.proname}`);
      });
    }

    // 4. Check RLS Policies
    console.log('\n--- 4. RLS POLICIES AUDIT ---');
    const policyRes = await client.query(`
      SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public';
    `);

    if (policyRes.rows.length === 0) {
      console.log('✓ No RLS policies currently exist in public schema (Row-Level Security defaults to DENY ALL).');
    } else {
      policyRes.rows.forEach(r => {
        console.log(`  - Policy on ${r.tablename}: "${r.policyname}" [Command: ${r.cmd}]`);
      });
    }

    await client.end();
  } catch (err) {
    console.error('Audit Error:', err.message);
    await client.end().catch(() => {});
  }
}

inspectLiveSchema();
