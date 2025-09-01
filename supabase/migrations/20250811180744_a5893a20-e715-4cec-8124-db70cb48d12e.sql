-- Fix remaining linter: set search_path on validate_conference_booking
CREATE OR REPLACE FUNCTION public.validate_conference_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;