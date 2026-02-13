
-- 1) Allow any authenticated user to SELECT criancas (needed for check-in panel)
CREATE POLICY "Authenticated can view criancas for checkin"
ON public.criancas
FOR SELECT
USING (true);

-- 2) Allow authenticated users to INSERT checkins_kids (for check-in)
CREATE POLICY "Authenticated can insert checkins_kids"
ON public.checkins_kids
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 3) Allow authenticated users to SELECT checkins_kids (for viewing today's checkins)
CREATE POLICY "Authenticated can view checkins_kids"
ON public.checkins_kids
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 4) Allow authenticated users to UPDATE checkins_kids (for checkout)
CREATE POLICY "Authenticated can update checkins_kids"
ON public.checkins_kids
FOR UPDATE
USING (auth.uid() IS NOT NULL);
