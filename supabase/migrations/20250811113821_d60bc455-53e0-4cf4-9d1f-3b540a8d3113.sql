-- POS / Restaurant schema
-- 1) Tables

-- Restaurant tables (seating)
CREATE TABLE IF NOT EXISTS public.pos_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  area text,
  capacity integer NOT NULL DEFAULT 4,
  status text NOT NULL DEFAULT 'vacant', -- vacant | occupied | reserved
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Menu items
CREATE TABLE IF NOT EXISTS public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  station text NOT NULL DEFAULT 'kitchen', -- kitchen | bar
  is_active boolean NOT NULL DEFAULT true,
  tax_rate numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS public.pos_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid REFERENCES public.pos_tables(id) ON DELETE SET NULL,
  created_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'open', -- open | sent | billed | paid | void
  notes text,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  service_charge numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Order items
CREATE TABLE IF NOT EXISTS public.pos_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.pos_orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name text NOT NULL, -- snapshot of item name
  category text,
  station text NOT NULL, -- kitchen | bar
  price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  notes text,
  status text NOT NULL DEFAULT 'new', -- new | sent | ready | served | void
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tickets (KOT/BOT)
CREATE TABLE IF NOT EXISTS public.pos_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.pos_orders(id) ON DELETE CASCADE,
  station text NOT NULL, -- kitchen | bar
  ticket_type text NOT NULL, -- KOT | BOT
  items jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{order_item_id, name, qty, notes}]
  status text NOT NULL DEFAULT 'pending', -- pending | printed | completed
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Bills
CREATE TABLE IF NOT EXISTS public.pos_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.pos_orders(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'unpaid', -- unpaid | paid | void
  subtotal numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  service_charge numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  posted_journal_entry_id uuid, -- link to accounting journal_entries.id
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Payments
CREATE TABLE IF NOT EXISTS public.pos_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES public.pos_bills(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  method text NOT NULL, -- cash | card | room_charge | mobile_money
  reference text,
  received_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2) RLS
ALTER TABLE public.pos_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_payments ENABLE ROW LEVEL SECURITY;

-- Helper policy condition: admins or restaurant-related departments
-- Using inline EXISTS conditions referencing profiles

-- pos_tables policies
CREATE POLICY IF NOT EXISTS "POS: view tables" ON public.pos_tables
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND (
      p.role IN ('admin','super_admin') OR p.department IN ('restaurant','kitchen','bar')
    )
  )
);
CREATE POLICY IF NOT EXISTS "POS: manage tables" ON public.pos_tables
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND (
      p.role IN ('admin','super_admin') OR p.department = 'restaurant'
    )
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND (
      p.role IN ('admin','super_admin') OR p.department = 'restaurant'
    )
  )
);

-- menu_items policies
CREATE POLICY IF NOT EXISTS "POS: view menu items" ON public.menu_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
  )
);
CREATE POLICY IF NOT EXISTS "POS: manage menu items" ON public.menu_items
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND (
      p.role IN ('admin','super_admin') OR p.department = 'restaurant'
    )
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND (
      p.role IN ('admin','super_admin') OR p.department = 'restaurant'
    )
  )
);

-- pos_orders policies
CREATE POLICY IF NOT EXISTS "POS: view orders" ON public.pos_orders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND (
      p.role IN ('admin','super_admin') OR p.department IN ('restaurant','kitchen','bar')
    )
  )
);
CREATE POLICY IF NOT EXISTS "POS: manage orders" ON public.pos_orders
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND (
      p.role IN ('admin','super_admin') OR p.department = 'restaurant'
    )
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND (
      p.role IN ('admin','super_admin') OR p.department = 'restaurant'
    )
  )
);

-- pos_order_items policies
CREATE POLICY IF NOT EXISTS "POS: view order items" ON public.pos_order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND (
      p.role IN ('admin','super_admin') OR p.department IN ('restaurant','kitchen','bar')
    )
  )
);
CREATE POLICY IF NOT EXISTS "POS: manage order items" ON public.pos_order_items
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND (
      p.role IN ('admin','super_admin') OR p.department IN ('restaurant','kitchen','bar')
    )
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND (
      p.role IN ('admin','super_admin') OR p.department IN ('restaurant','kitchen','bar')
    )
  )
);

-- pos_tickets policies
CREATE POLICY IF NOT EXISTS "POS: view tickets" ON public.pos_tickets
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND (
      p.role IN ('admin','super_admin') OR p.department IN ('restaurant','kitchen','bar')
    )
  )
);
CREATE POLICY IF NOT EXISTS "POS: manage tickets" ON public.pos_tickets
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND (
      p.role IN ('admin','super_admin') OR p.department IN ('restaurant','kitchen','bar')
    )
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND (
      p.role IN ('admin','super_admin') OR p.department IN ('restaurant','kitchen','bar')
    )
  )
);

-- pos_bills policies
CREATE POLICY IF NOT EXISTS "POS: view bills" ON public.pos_bills
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND (
      p.role IN ('admin','super_admin') OR p.department IN ('restaurant','kitchen','bar')
    )
  )
);
CREATE POLICY IF NOT EXISTS "POS: manage bills" ON public.pos_bills
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND (
      p.role IN ('admin','super_admin') OR p.department = 'restaurant'
    )
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND (
      p.role IN ('admin','super_admin') OR p.department = 'restaurant'
    )
  )
);

-- pos_payments policies
CREATE POLICY IF NOT EXISTS "POS: view payments" ON public.pos_payments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND (
      p.role IN ('admin','super_admin') OR p.department IN ('restaurant','kitchen','bar')
    )
  )
);
CREATE POLICY IF NOT EXISTS "POS: manage payments" ON public.pos_payments
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND (
      p.role IN ('admin','super_admin') OR p.department = 'restaurant'
    )
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND (
      p.role IN ('admin','super_admin') OR p.department = 'restaurant'
    )
  )
);

-- 3) Triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_pos_tables_updated_at'
  ) THEN
    CREATE TRIGGER trg_pos_tables_updated_at
    BEFORE UPDATE ON public.pos_tables
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_menu_items_updated_at'
  ) THEN
    CREATE TRIGGER trg_menu_items_updated_at
    BEFORE UPDATE ON public.menu_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_pos_orders_updated_at'
  ) THEN
    CREATE TRIGGER trg_pos_orders_updated_at
    BEFORE UPDATE ON public.pos_orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_pos_order_items_updated_at'
  ) THEN
    CREATE TRIGGER trg_pos_order_items_updated_at
    BEFORE UPDATE ON public.pos_order_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_pos_tickets_updated_at'
  ) THEN
    CREATE TRIGGER trg_pos_tickets_updated_at
    BEFORE UPDATE ON public.pos_tickets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_pos_bills_updated_at'
  ) THEN
    CREATE TRIGGER trg_pos_bills_updated_at
    BEFORE UPDATE ON public.pos_bills
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
