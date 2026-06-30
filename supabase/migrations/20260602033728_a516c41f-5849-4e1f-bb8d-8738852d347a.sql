
-- =========================================
-- ROLES: app_role enum, user_roles, has_role
-- =========================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('customer','partner','admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_can_read_own_roles" ON public.user_roles;
CREATE POLICY "user_can_read_own_roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
$$;

-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  mobile text,
  city text,
  user_type text NOT NULL DEFAULT 'customer',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _type text := COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer');
BEGIN
  INSERT INTO public.profiles (user_id, full_name, mobile, city, user_type)
  VALUES (NEW.id,
          NEW.raw_user_meta_data->>'full_name',
          NEW.raw_user_meta_data->>'mobile',
          NEW.raw_user_meta_data->>'city',
          _type)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, (CASE WHEN _type='partner' THEN 'partner' ELSE 'customer' END)::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- ACCOUNTING TABLES (all user-scoped via user_id)
-- =========================================
CREATE TABLE IF NOT EXISTS public.acc_business (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text,
  gstin text,
  pan text,
  address text,
  phone text,
  email text,
  logo_url text,
  invoice_prefix text DEFAULT 'INV',
  next_invoice_no int DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.acc_parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  party_type text NOT NULL DEFAULT 'customer', -- customer|vendor|both
  gstin text, phone text, email text, address text,
  opening_balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.acc_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text, hsn text, unit text DEFAULT 'pcs',
  sale_price numeric NOT NULL DEFAULT 0,
  purchase_price numeric NOT NULL DEFAULT 0,
  gst_rate numeric NOT NULL DEFAULT 18,
  stock_qty numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.acc_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  party_id uuid REFERENCES public.acc_parties(id) ON DELETE SET NULL,
  doc_type text NOT NULL DEFAULT 'invoice', -- invoice|bill
  invoice_no text NOT NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_total numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  paid numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'unpaid', -- unpaid|partial|paid|cancelled
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.acc_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.acc_invoices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.acc_items(id) ON DELETE SET NULL,
  description text NOT NULL,
  hsn text,
  qty numeric NOT NULL DEFAULT 1,
  rate numeric NOT NULL DEFAULT 0,
  gst_rate numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.acc_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  party_id uuid REFERENCES public.acc_parties(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES public.acc_invoices(id) ON DELETE SET NULL,
  direction text NOT NULL DEFAULT 'in', -- in|out
  mode text NOT NULL DEFAULT 'cash', -- cash|bank|upi|card|cheque
  amount numeric NOT NULL,
  pay_date date NOT NULL DEFAULT CURRENT_DATE,
  reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.acc_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  party_id uuid REFERENCES public.acc_parties(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'general',
  amount numeric NOT NULL,
  gst numeric NOT NULL DEFAULT 0,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  mode text NOT NULL DEFAULT 'cash',
  notes text,
  receipt_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- GRANTs + RLS for accounting tables
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'acc_business','acc_parties','acc_items','acc_invoices',
    'acc_invoice_items','acc_payments','acc_expenses'
  ]) LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated;', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role;', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_own_select" ON public.%I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_own_insert" ON public.%I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_own_update" ON public.%I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_own_delete" ON public.%I;', t, t);
    EXECUTE format('CREATE POLICY "%s_own_select" ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id);', t, t);
    EXECUTE format('CREATE POLICY "%s_own_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);', t, t);
    EXECUTE format('CREATE POLICY "%s_own_update" ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = user_id);', t, t);
    EXECUTE format('CREATE POLICY "%s_own_delete" ON public.%I FOR DELETE TO authenticated USING (auth.uid() = user_id);', t, t);
  END LOOP;
END $$;

-- Storage bucket for receipts/logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts','receipts', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "receipts_select_own" ON storage.objects;
DROP POLICY IF EXISTS "receipts_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "receipts_update_own" ON storage.objects;
DROP POLICY IF EXISTS "receipts_delete_own" ON storage.objects;
CREATE POLICY "receipts_select_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id='receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "receipts_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "receipts_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id='receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "receipts_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id='receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
