
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  mobile TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  user_type TEXT NOT NULL DEFAULT 'customer' CHECK (user_type IN ('customer', 'partner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User roles
CREATE TYPE public.app_role AS ENUM ('admin', 'customer', 'partner');
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Service applications tracking
CREATE TABLE public.service_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'loan',
  loan_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'rejected', 'done', 'skipped')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'failed')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own applications" ON public.service_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own applications" ON public.service_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anon can insert applications" ON public.service_applications FOR INSERT TO anon WITH CHECK (true);

-- Partner referrals
CREATE TABLE public.partner_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_name TEXT NOT NULL,
  lead_mobile TEXT NOT NULL,
  service TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processing', 'done', 'not_interested', 'not_eligible')),
  commission_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (commission_status IN ('paid', 'unpaid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.partner_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partners can view own referrals" ON public.partner_referrals FOR SELECT TO authenticated USING (auth.uid() = partner_id);
CREATE POLICY "Partners can insert referrals" ON public.partner_referrals FOR INSERT TO authenticated WITH CHECK (auth.uid() = partner_id);

-- Income/Expense tracker
CREATE TABLE public.income_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.income_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own entries" ON public.income_expenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entries" ON public.income_expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries" ON public.income_expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entries" ON public.income_expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);
