import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

async function seedDemoDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes('your-project-ref')) {
    console.error('ERROR: Supabase URL or Service Role Key missing in environment variables.');
    console.error('Please configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local before running seed.');
    process.exit(1);
  }

  console.log('--- Arthik AI Demo Database Seeder ---');
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // 1. Create Demo Business
  const { data: bus, error: busErr } = await supabase
    .from('businesses')
    .insert({ name: 'Rangoli Home & Gifts (Demo)', currency: 'INR' })
    .select()
    .single();

  if (busErr) {
    console.error('Failed to create demo business:', busErr.message);
    process.exit(1);
  }

  const businessId = bus.id;
  console.log(`Created Demo Business: ${bus.name} (ID: ${businessId})`);

  // 2. Load and Insert Products
  const productsCsv = fs.readFileSync(path.join(__dirname, '../data/products.csv'), 'utf-8');
  const pLines = productsCsv.split('\n').filter(l => l.trim() && !l.startsWith('product_id'));
  const pRows = pLines.map(l => {
    const parts = l.split(',');
    return {
      business_id: businessId,
      product_code: parts[0],
      name: parts[1],
      category: parts[2],
      list_price: parseFloat(parts[3]),
      unit_cost: parseFloat(parts[4]),
    };
  });

  const { data: insertedProducts, error: pErr } = await supabase
    .from('products')
    .insert(pRows)
    .select();

  if (pErr) {
    console.error('Failed to insert products:', pErr.message);
    process.exit(1);
  }
  console.log(`Inserted ${insertedProducts.length} Products.`);

  // 3. Load and Insert Expenses
  const expensesCsv = fs.readFileSync(path.join(__dirname, '../data/expenses.csv'), 'utf-8');
  const eLines = expensesCsv.split('\n').filter(l => l.trim() && !l.startsWith('expense_id'));
  const eRows = eLines.map(l => {
    const parts = l.split(',');
    return {
      business_id: businessId,
      expense_code: parts[0],
      date: parts[1],
      category: parts[2],
      amount: parseFloat(parts[3]),
      vendor: parts[4] || '',
      note: parts[5] || '',
    };
  });

  const { error: eErr } = await supabase.from('expenses').insert(eRows);
  if (eErr) {
    console.error('Failed to insert expenses:', eErr.message);
    process.exit(1);
  }
  console.log(`Inserted ${eRows.length} Expenses.`);

  console.log('--- Demo Data Seeding Completed Successfully! ---');
}

seedDemoDatabase().catch(err => console.error(err));
