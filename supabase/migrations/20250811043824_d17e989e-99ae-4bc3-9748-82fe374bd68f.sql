-- 3) Create reservations table if missing, linked to rooms and room_types
CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_number text NOT NULL UNIQUE DEFAULT (
    'RSV-' || to_char(now(), 'YYYYMMDD') || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,6)
  ),
  guest_name text NOT NULL,
  contact_email text,
  contact_phone text,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  adults integer NOT NULL DEFAULT 1,
  children integer NOT NULL DEFAULT 0,
  room_type_id uuid REFERENCES public.room_types(id) ON DELETE SET NULL,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'booked', -- booked | checked_in | checked_out | cancelled | no_show
  source text NOT NULL DEFAULT 'front_office', -- front_office | website | ota
  rate numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MWK',
  notes text,
  created_by uuid, -- user id from auth; not FK to avoid coupling
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_dates_valid CHECK (check_out_date > check_in_date)
);

-- Enable RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for reservations
DROP POLICY IF EXISTS "Authenticated can view reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins and front office can manage reservations" ON public.reservations;

CREATE POLICY "Authenticated can view reservations"
ON public.reservations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and front office can manage reservations"
ON public.reservations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND (p.role IN ('admin','super_admin') OR p.department = 'front_office')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND (p.role IN ('admin','super_admin') OR p.department = 'front_office')
  )
);

-- Trigger to keep updated_at fresh
DROP TRIGGER IF EXISTS update_reservations_updated_at ON public.reservations;
CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes for availability searches
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON public.reservations(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_reservations_room ON public.reservations(room_id);
CREATE INDEX IF NOT EXISTS idx_reservations_room_type ON public.reservations(room_type_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);

-- Enable realtime on reservations
ALTER TABLE public.reservations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;