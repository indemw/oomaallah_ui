-- Add image_url column to conference_rooms table if it doesn't exist
ALTER TABLE public.conference_rooms 
ADD COLUMN IF NOT EXISTS image_url TEXT;