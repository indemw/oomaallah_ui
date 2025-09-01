-- Update RLS policies to grant super_admin full access where admins/managers/accountants have access

-- chart_of_accounts
DROP POLICY IF EXISTS "Accountants can manage chart of accounts" ON public.chart_of_accounts;
CREATE POLICY "Accountants can manage chart of accounts"
ON public.chart_of_accounts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = ANY (ARRAY['accountant','admin','super_admin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = ANY (ARRAY['accountant','admin','super_admin'])
  )
);

-- journal_entries
DROP POLICY IF EXISTS "Accountants can manage journal entries" ON public.journal_entries;
CREATE POLICY "Accountants can manage journal entries"
ON public.journal_entries
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = ANY (ARRAY['accountant','admin','super_admin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = ANY (ARRAY['accountant','admin','super_admin'])
  )
);

-- journal_entry_lines
DROP POLICY IF EXISTS "Accountants can manage journal entry lines" ON public.journal_entry_lines;
CREATE POLICY "Accountants can manage journal entry lines"
ON public.journal_entry_lines
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = ANY (ARRAY['accountant','admin','super_admin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = ANY (ARRAY['accountant','admin','super_admin'])
  )
);

-- stock_items
DROP POLICY IF EXISTS "Managers can manage stock items" ON public.stock_items;
CREATE POLICY "Managers can manage stock items"
ON public.stock_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = ANY (ARRAY['manager','admin','super_admin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = ANY (ARRAY['manager','admin','super_admin'])
  )
);

-- stock_requests (manager/admin/super_admin can update and view all)
DROP POLICY IF EXISTS "Managers can update requests" ON public.stock_requests;
CREATE POLICY "Managers can update requests"
ON public.stock_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = ANY (ARRAY['manager','admin','super_admin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = ANY (ARRAY['manager','admin','super_admin'])
  )
);

DROP POLICY IF EXISTS "Managers can view all requests" ON public.stock_requests;
CREATE POLICY "Managers can view all requests"
ON public.stock_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = ANY (ARRAY['manager','admin','super_admin'])
  )
);

-- keep existing policies for creating and viewing own requests as-is
