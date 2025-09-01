-- Conference module schema (idempotent)
BEGIN;

-- 1) Conference Rooms table
CREATE TABLE IF NOT EXISTS public.conference_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 10,
  location TEXT,
  base_rate NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MWK',
  amenities TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name)
);

-- Enable RLS and policies
ALTER TABLE public.conference_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and front office can manage conference_rooms" ON public.conference_rooms;
CREATE POLICY "Admins and front office can manage conference_rooms"
ON public.conference_rooms
AS RESTRICTIVE
FOR ALL
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

DROP POLICY IF EXISTS "Authenticated can view conference_rooms" ON public.conference_rooms;
CREATE POLICY "Authenticated can view conference_rooms"
ON public.conference_rooms
AS RESTRICTIVE
FOR SELECT
USING (true);

-- Updated at trigger
DROP TRIGGER IF EXISTS update_conference_rooms_updated_at ON public.conference_rooms;
CREATE TRIGGER update_conference_rooms_updated_at
BEFORE UPDATE ON public.conference_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Conference Bookings table
CREATE TABLE IF NOT EXISTS public.conference_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  organizer TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  attendees_count INTEGER NOT NULL DEFAULT 1,
  layout TEXT NOT NULL DEFAULT 'theater',
  source TEXT NOT NULL DEFAULT 'front_office',
  status TEXT NOT NULL DEFAULT 'booked',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foreign key to rooms
DO $$ BEGIN
  ALTER TABLE public.conference_bookings
    ADD CONSTRAINT conference_bookings_room_id_fkey
    FOREIGN KEY (room_id) REFERENCES public.conference_rooms(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conference_bookings_room_time
  ON public.conference_bookings (room_id, start_datetime, end_datetime);

-- Enable RLS and policies
ALTER TABLE public.conference_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and front office can manage conference_bookings" ON public.conference_bookings;
CREATE POLICY "Admins and front office can manage conference_bookings"
ON public.conference_bookings
AS RESTRICTIVE
FOR ALL
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

DROP POLICY IF EXISTS "Authenticated can view conference_bookings" ON public.conference_bookings;
CREATE POLICY "Authenticated can view conference_bookings"
ON public.conference_bookings
AS RESTRICTIVE
FOR SELECT
USING (true);

-- Validation function to prevent overlaps and invalid times
CREATE OR REPLACE FUNCTION public.validate_conference_booking()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Ensure end is after start
  IF NEW.end_datetime <= NEW.start_datetime THEN
    RAISE EXCEPTION 'End time must be after start time';
  END IF;

  -- Prevent overlapping bookings on the same room for active statuses
  IF EXISTS (
    SELECT 1 FROM public.conference_bookings cb
    WHERE cb.room_id = NEW.room_id
      AND cb.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
      AND cb.status IN ('booked','confirmed','in_progress')
      AND tstzrange(cb.start_datetime, cb.end_datetime, '[)') && tstzrange(NEW.start_datetime, NEW.end_datetime, '[)')
  ) THEN
    RAISE EXCEPTION 'Time slot overlaps with an existing booking for this room';
  END IF;

  RETURN NEW;
END;
$$;

-- Triggers for bookings
DROP TRIGGER IF EXISTS trg_validate_conference_booking ON public.conference_bookings;
CREATE TRIGGER trg_validate_conference_booking
BEFORE INSERT OR UPDATE ON public.conference_bookings
FOR EACH ROW
EXECUTE FUNCTION public.validate_conference_booking();

DROP TRIGGER IF EXISTS update_conference_bookings_updated_at ON public.conference_bookings;
CREATE TRIGGER update_conference_bookings_updated_at
BEFORE UPDATE ON public.conference_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;