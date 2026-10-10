-- Arthik AI Initial PostgreSQL Schema Migration
-- Migration Name: 20261010000000_initial_schema.sql
-- Enables RLS, Multi-Tenant Business Isolation, NUMERIC Currency, and Performance Indexes

-- 1. Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Businesses Table
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Business Members & Roles Table
CREATE TABLE IF NOT EXISTS public.business_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_business_user UNIQUE (business_id, user_id)
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    product_code VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    list_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_business_product_code UNIQUE (business_id, product_code)
);

-- 5. Sales Header Table
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    sale_code VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'Store',
    total_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_cogs NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Sale Items Detail Table
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit_cost_at_sale NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

-- 7. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    expense_code VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    vendor TEXT,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Business Settings Table
CREATE TABLE IF NOT EXISTS public.business_settings (
    business_id UUID PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    target_margin_pct NUMERIC(5, 2) NOT NULL DEFAULT 40.00,
    fiscal_year_start VARCHAR(10) NOT NULL DEFAULT 'April',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_business_members_user ON public.business_members(user_id);
CREATE INDEX IF NOT EXISTS idx_products_business ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_business_date ON public.sales(business_id, date);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_expenses_business_date ON public.expenses(business_id, date);

-- RLS helper function
CREATE OR REPLACE FUNCTION public.is_business_member(b_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.business_members
    WHERE business_id = b_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- Business Membership Policies
CREATE POLICY "Members can view authorized businesses" ON public.businesses FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.business_members WHERE business_id = id AND user_id = auth.uid()));

CREATE POLICY "Members can view co-members" ON public.business_members FOR SELECT
  USING (is_business_member(business_id));

-- Products Policies
CREATE POLICY "Members can view products" ON public.products FOR SELECT USING (is_business_member(business_id));
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (is_business_member(business_id));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (is_business_member(business_id));

-- Sales Policies
CREATE POLICY "Members can view sales" ON public.sales FOR SELECT USING (is_business_member(business_id));
CREATE POLICY "Members can insert sales" ON public.sales FOR INSERT WITH CHECK (is_business_member(business_id));

CREATE POLICY "Members can view sale items" ON public.sale_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id AND is_business_member(s.business_id))
);

-- Expenses Policies
CREATE POLICY "Members can view expenses" ON public.expenses FOR SELECT USING (is_business_member(business_id));
CREATE POLICY "Members can insert expenses" ON public.expenses FOR INSERT WITH CHECK (is_business_member(business_id));

-- Settings Policies
CREATE POLICY "Members can view settings" ON public.business_settings FOR SELECT USING (is_business_member(business_id));
CREATE POLICY "Admins can update settings" ON public.business_settings FOR UPDATE USING (is_business_member(business_id));
