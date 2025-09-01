-- Add request_type to stock_requests to distinguish replenishment vs deduction
ALTER TABLE public.stock_requests
ADD COLUMN IF NOT EXISTS request_type TEXT NOT NULL DEFAULT 'replenishment';

-- Optional: constrain to expected values via a CHECK-like trigger avoided; we keep flexible text

-- No changes to policies needed; existing RLS still applies