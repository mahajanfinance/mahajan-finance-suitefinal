CREATE TABLE IF NOT EXISTS public.tracker_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  trial_started_at timestamptz NOT NULL DEFAULT now(),
  paid_until timestamptz,
  last_payment_id text,
  last_payment_amount integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.tracker_subscriptions TO authenticated;
GRANT ALL ON public.tracker_subscriptions TO service_role;

ALTER TABLE public.tracker_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own subscription" ON public.tracker_subscriptions;
DROP POLICY IF EXISTS "Users insert own subscription" ON public.tracker_subscriptions;
DROP POLICY IF EXISTS "Users update own subscription" ON public.tracker_subscriptions;

CREATE POLICY "Users view own subscription" ON public.tracker_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own subscription" ON public.tracker_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own subscription" ON public.tracker_subscriptions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_tracker_subs_updated ON public.tracker_subscriptions;
CREATE TRIGGER trg_tracker_subs_updated
  BEFORE UPDATE ON public.tracker_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();