# Arthik AI — Database & Authentication Setup Guide

This guide provides step-by-step instructions to configure **Supabase PostgreSQL** and **Authentication** for Arthik AI.

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New Project** and name it `arthik-ai-prod`.
3. Choose a strong database password and set your region (e.g., `Mumbai (ap-south-1)`).
4. Wait for database provisioning to complete (takes ~1-2 minutes).

---

## 2. Apply Database Schema & RLS Migrations

1. In your Supabase Dashboard, navigate to the **SQL Editor** tab.
2. Click **New Query**.
3. Copy and paste the complete content of:
   [`supabase/migrations/20261010000000_initial_schema.sql`](file:///c:/Users/thepa/arthik%20ai/supabase/migrations/20261010000000_initial_schema.sql)
4. Click **Run** (or press Ctrl+Enter).
5. Verify that all 8 tables (`profiles`, `businesses`, `business_members`, `products`, `sales`, `sale_items`, `expenses`, `business_settings`) and Row-Level Security (RLS) policies are created.

---

## 3. Environment Variables Configuration

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Retrieve API credentials from Supabase:
   - Go to **Project Settings** -> **API**.
   - Copy **Project URL** to `NEXT_PUBLIC_SUPABASE_URL`.
   - Copy **anon / public key** to `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Copy **service_role key** to `SUPABASE_SERVICE_ROLE_KEY` *(Server-side only)*.

Example `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 4. Row-Level Security (RLS) Isolation Architecture

All tenant tables enforce RLS using the helper function `is_business_member(business_id)`.
- Users can ONLY query records for businesses where they possess an active row in `business_members`.
- The `SUPABASE_SERVICE_ROLE_KEY` is kept strictly server-side and never exposed to browser bundles.

---

## 5. Safe Demo Seeding (Optional)

To seed your PostgreSQL database with the 3,165 synthetic sales demo records:

```bash
$env:PATH = "c:\Users\thepa\node_env\node-v20.18.0-win-x64;" + $env:PATH
npx ts-node scripts/seed_demo_data.ts
```
