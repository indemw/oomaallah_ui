-- Reservations schema: room types and rooms (fixed policy creation)

-- 1) Create room_types table
CREATE TABLE IF NOT EXISTS public.room_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  capacity integer NOT NULL DEFAULT 1,
  base_rate numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MWK',
  amenities text[] NOT NULL DEFAULT '{}',
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for room_types
DROP POLICY IF EXISTS "Authenticated can view room_types" ON public.room_types;
DROP POLICY IF EXISTS "Admins and front office can manage room_types" ON public.room_types;

CREATE POLICY "Authenticated can view room_types"
ON public.room_types
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and front office can manage room_types"
ON public.room_types
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
DROP TRIGGER IF EXISTS update_room_types_updated_at ON public.room_types;
CREATE TRIGGER update_room_types_updated_at
BEFORE UPDATE ON public.room_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- 2) Create rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number text NOT NULL UNIQUE,
  room_type_id uuid NOT NULL REFERENCES public.room_types(id) ON DELETE RESTRICT,
  floor text,
  status text NOT NULL DEFAULT 'vacant', -- 'vacant' | 'occupied' | 'oos'
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for rooms
DROP POLICY IF EXISTS "Authenticated can view rooms" ON public.rooms;
DROP POLICY IF EXISTS "Admins and front office can manage rooms" ON public.rooms;

CREATE POLICY "Authenticated can view rooms"
ON public.rooms
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and front office can manage rooms"
ON public.rooms
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
DROP TRIGGER IF EXISTS update_rooms_updated_at ON public.rooms;
CREATE TRIGGER update_rooms_updated_at
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_rooms_room_type_id ON public.rooms(room_type_id);
CREATE INDEX IF NOT EXISTS idx_room_types_active ON public.room_types(active);
CREATE INDEX IF NOT EXISTS idx_rooms_active ON public.rooms(active);
