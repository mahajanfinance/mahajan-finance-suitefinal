DROP POLICY IF EXISTS "Partners can insert referrals" ON public.partner_referrals;
CREATE POLICY "Partners can insert referrals"
ON public.partner_referrals
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = partner_id
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'partner')
);