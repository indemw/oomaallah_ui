-- Create recipe mapping between menu items and stock items
CREATE TABLE IF NOT EXISTS public.menu_item_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  stock_item_id UUID NOT NULL REFERENCES public.stock_items(id),
  quantity_per_unit NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (menu_item_id, stock_item_id)
);

-- Enable RLS
ALTER TABLE IF EXISTS public.menu_item_components ENABLE ROW LEVEL SECURITY;

-- Policies for menu_item_components (use DO block to avoid IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'menu_item_components' AND policyname = 'Restaurant can view components'
  ) THEN
    CREATE POLICY "Restaurant can view components"
    ON public.menu_item_components
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
          AND (
            p.role IN ('admin','super_admin','manager')
            OR p.department IN ('restaurant','kitchen','bar')
          )
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'menu_item_components' AND policyname = 'Restaurant can manage components'
  ) THEN
    CREATE POLICY "Restaurant can manage components"
    ON public.menu_item_components
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
          AND (
            p.role IN ('admin','super_admin','manager')
            OR p.department IN ('restaurant')
          )
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
          AND (
            p.role IN ('admin','super_admin','manager')
            OR p.department IN ('restaurant')
          )
      )
    );
  END IF;
END $$;

-- updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_menu_item_components_updated_at'
  ) THEN
    CREATE TRIGGER trg_menu_item_components_updated_at
    BEFORE UPDATE ON public.menu_item_components
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Create stock movements table
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_item_id UUID NOT NULL REFERENCES public.stock_items(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in','out')),
  quantity NUMERIC NOT NULL,
  reference_table TEXT,
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE IF EXISTS public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Policies for stock_movements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stock_movements' AND policyname = 'Restaurant can view movements'
  ) THEN
    CREATE POLICY "Restaurant can view movements"
    ON public.stock_movements
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
          AND (
            p.role IN ('admin','super_admin','manager')
            OR p.department IN ('restaurant','kitchen','bar')
          )
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stock_movements' AND policyname = 'Restaurant can insert movements'
  ) THEN
    CREATE POLICY "Restaurant can insert movements"
    ON public.stock_movements
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
          AND (
            p.role IN ('admin','super_admin','manager')
            OR p.department IN ('restaurant','kitchen','bar')
          )
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stock_movements' AND policyname = 'Managers can update movements'
  ) THEN
    CREATE POLICY "Managers can update movements"
    ON public.stock_movements
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid() AND p.role IN ('admin','super_admin','manager')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid() AND p.role IN ('admin','super_admin','manager')
      )
    );
  END IF;
END $$;

-- Function to deduct stock when a ticket is completed
CREATE OR REPLACE FUNCTION public.handle_ticket_completed_deduct_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  item JSONB;
  order_item_id UUID;
  qty NUMERIC;
  v_menu_item_id UUID;
  comp RECORD;
  out_qty NUMERIC;
BEGIN
  -- Only act when status becomes 'completed'
  IF NEW.status = 'completed' AND COALESCE(OLD.status, '') <> 'completed' THEN
    -- Iterate ticket items jsonb: [{order_item_id, name, qty}]
    FOR item IN SELECT jsonb_array_elements(NEW.items) LOOP
      order_item_id := (item->>'order_item_id')::uuid;
      qty := COALESCE((item->>'qty')::numeric, 0);
      IF order_item_id IS NULL OR qty <= 0 THEN
        CONTINUE;
      END IF;

      -- Find the menu_item_id from the order item
      SELECT poi.menu_item_id INTO v_menu_item_id
      FROM public.pos_order_items poi
      WHERE poi.id = order_item_id;

      IF v_menu_item_id IS NULL THEN
        CONTINUE;
      END IF;

      -- For each component of the menu item, deduct stock
      FOR comp IN
        SELECT stock_item_id, quantity_per_unit
        FROM public.menu_item_components mic
        WHERE mic.menu_item_id = v_menu_item_id
      LOOP
        out_qty := qty * comp.quantity_per_unit;

        -- Update stock quantity
        UPDATE public.stock_items si
        SET current_quantity = current_quantity - out_qty,
            updated_at = now()
        WHERE si.id = comp.stock_item_id;

        -- Record movement
        INSERT INTO public.stock_movements (
          stock_item_id, movement_type, quantity, reference_table, reference_id, notes, created_by
        ) VALUES (
          comp.stock_item_id, 'out', out_qty, 'pos_tickets', NEW.id, 'Auto deduction for completed ticket', NEW.created_by
        );
      END LOOP;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_ticket_completed_deduct_stock IS 'Deducts stock based on menu item components when a POS ticket is marked completed.';

-- Trigger on pos_tickets updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_pos_tickets_after_update_deduct_stock'
  ) THEN
    CREATE TRIGGER trg_pos_tickets_after_update_deduct_stock
    AFTER UPDATE OF status ON public.pos_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_ticket_completed_deduct_stock();
  END IF;
END $$;

-- Optional seeding: basic stock items and recipe links if tables are empty
DO $$
DECLARE
  _has_stock BOOLEAN;
  _has_components BOOLEAN;
  v_mojito UUID;
  v_gnt UUID;
  v_beer UUID;
  v_pasta UUID;
  v_chambo UUID;
  v_chicken UUID;
  v_fruit UUID;
  s_mint UUID;
  s_rum UUID;
  s_gin UUID;
  s_tonic UUID;
  s_beer UUID;
  s_pasta UUID;
  s_chambo UUID;
  s_chicken UUID;
  s_fruit UUID;
  s_lime UUID;
  s_sugar UUID;
  s_soda UUID;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.stock_items) INTO _has_stock;
  IF NOT _has_stock THEN
    INSERT INTO public.stock_items (name, description, category, unit, unit_cost, supplier, minimum_quantity, current_quantity)
    VALUES
      ('Mint', 'Fresh mint leaves', 'Bar', 'bunch', 500, 'Local Supplier', 5, 50),
      ('White Rum', 'Premium white rum', 'Bar', 'bottle', 5500, 'Liquor Supplier', 5, 40),
      ('Lime', 'Fresh limes', 'Bar', 'piece', 150, 'Local Supplier', 20, 200),
      ('Sugar', 'Granulated sugar', 'Bar', 'kg', 1200, 'Grocery', 1, 10),
      ('Soda Water', 'Club soda', 'Bar', 'bottle', 500, 'Beverages Co', 10, 100),
      ('Gin', 'Premium gin', 'Bar', 'bottle', 6000, 'Liquor Supplier', 5, 40),
      ('Tonic Water', 'Tonic bottles', 'Bar', 'bottle', 700, 'Beverages Co', 10, 120),
      ('Beer Bottle', 'Local lager bottles', 'Bar', 'bottle', 800, 'Brewery', 24, 240),
      ('Dry Pasta', 'Penne or spaghetti', 'Kitchen', 'kg', 1800, 'Food Supplier', 5, 30),
      ('Chambo Fish', 'Lake Malawi chambo', 'Kitchen', 'kg', 4000, 'Fishmonger', 5, 25),
      ('Chicken Breast', 'Boneless chicken breast', 'Kitchen', 'kg', 3500, 'Butcher', 5, 30),
      ('Seasonal Fruit', 'Assorted fruits', 'Kitchen', 'kg', 1500, 'Local Farms', 5, 40);
  END IF;

  -- Cache stock item ids
  SELECT id INTO s_mint FROM public.stock_items WHERE name = 'Mint' LIMIT 1;
  SELECT id INTO s_rum FROM public.stock_items WHERE name = 'White Rum' LIMIT 1;
  SELECT id INTO s_lime FROM public.stock_items WHERE name = 'Lime' LIMIT 1;
  SELECT id INTO s_sugar FROM public.stock_items WHERE name = 'Sugar' LIMIT 1;
  SELECT id INTO s_soda FROM public.stock_items WHERE name = 'Soda Water' LIMIT 1;
  SELECT id INTO s_gin FROM public.stock_items WHERE name = 'Gin' LIMIT 1;
  SELECT id INTO s_tonic FROM public.stock_items WHERE name = 'Tonic Water' LIMIT 1;
  SELECT id INTO s_beer FROM public.stock_items WHERE name = 'Beer Bottle' LIMIT 1;
  SELECT id INTO s_pasta FROM public.stock_items WHERE name = 'Dry Pasta' LIMIT 1;
  SELECT id INTO s_chambo FROM public.stock_items WHERE name = 'Chambo Fish' LIMIT 1;
  SELECT id INTO s_chicken FROM public.stock_items WHERE name = 'Chicken Breast' LIMIT 1;
  SELECT id INTO s_fruit FROM public.stock_items WHERE name = 'Seasonal Fruit' LIMIT 1;

  -- Get menu item ids by name
  SELECT id INTO v_mojito FROM public.menu_items WHERE name = 'Classic Mojito' LIMIT 1;
  SELECT id INTO v_gnt FROM public.menu_items WHERE name = 'Gin and Tonic' LIMIT 1;
  SELECT id INTO v_beer FROM public.menu_items WHERE name = 'Local Beer' LIMIT 1;
  SELECT id INTO v_pasta FROM public.menu_items WHERE name = 'Vegetarian Pasta' LIMIT 1;
  SELECT id INTO v_chambo FROM public.menu_items WHERE name = 'Grilled Lake Malawi Chambo' LIMIT 1;
  SELECT id INTO v_chicken FROM public.menu_items WHERE name = 'Malawian Curry Chicken' LIMIT 1;
  SELECT id INTO v_fruit FROM public.menu_items WHERE name = 'Tropical Fruit Salad' LIMIT 1;

  -- Seed basic recipes if none exist
  SELECT EXISTS (SELECT 1 FROM public.menu_item_components) INTO _has_components;
  IF NOT _has_components THEN
    -- Mojito: mint, rum, lime, sugar, soda water
    IF v_mojito IS NOT NULL THEN
      INSERT INTO public.menu_item_components (menu_item_id, stock_item_id, quantity_per_unit)
      SELECT v_mojito, s_mint, 0.1 WHERE s_mint IS NOT NULL;
      INSERT INTO public.menu_item_components (menu_item_id, stock_item_id, quantity_per_unit)
      SELECT v_mojito, s_rum, 0.05 WHERE s_rum IS NOT NULL;
      INSERT INTO public.menu_item_components (menu_item_id, stock_item_id, quantity_per_unit)
      SELECT v_mojito, s_lime, 1 WHERE s_lime IS NOT NULL;
      INSERT INTO public.menu_item_components (menu_item_id, stock_item_id, quantity_per_unit)
      SELECT v_mojito, s_sugar, 0.02 WHERE s_sugar IS NOT NULL;
      INSERT INTO public.menu_item_components (menu_item_id, stock_item_id, quantity_per_unit)
      SELECT v_mojito, s_soda, 1 WHERE s_soda IS NOT NULL;
    END IF;

    -- Gin and tonic: gin, tonic water, lime
    IF v_gnt IS NOT NULL THEN
      INSERT INTO public.menu_item_components (menu_item_id, stock_item_id, quantity_per_unit)
      SELECT v_gnt, s_gin, 0.05 WHERE s_gin IS NOT NULL;
      INSERT INTO public.menu_item_components (menu_item_id, stock_item_id, quantity_per_unit)
      SELECT v_gnt, s_tonic, 1 WHERE s_tonic IS NOT NULL;
      INSERT INTO public.menu_item_components (menu_item_id, stock_item_id, quantity_per_unit)
      SELECT v_gnt, s_lime, 1 WHERE s_lime IS NOT NULL;
    END IF;

    -- Local beer: 1 bottle
    IF v_beer IS NOT NULL THEN
      INSERT INTO public.menu_item_components (menu_item_id, stock_item_id, quantity_per_unit)
      SELECT v_beer, s_beer, 1 WHERE s_beer IS NOT NULL;
    END IF;

    -- Vegetarian Pasta: pasta 0.12kg per portion
    IF v_pasta IS NOT NULL THEN
      INSERT INTO public.menu_item_components (menu_item_id, stock_item_id, quantity_per_unit)
      SELECT v_pasta, s_pasta, 0.12 WHERE s_pasta IS NOT NULL;
    END IF;

    -- Grilled Chambo: chambo 0.25kg per portion
    IF v_chambo IS NOT NULL THEN
      INSERT INTO public.menu_item_components (menu_item_id, stock_item_id, quantity_per_unit)
      SELECT v_chambo, s_chambo, 0.25 WHERE s_chambo IS NOT NULL;
    END IF;

    -- Fruit salad: seasonal fruit 0.2kg per portion
    IF v_fruit IS NOT NULL THEN
      INSERT INTO public.menu_item_components (menu_item_id, stock_item_id, quantity_per_unit)
      SELECT v_fruit, s_fruit, 0.2 WHERE s_fruit IS NOT NULL;
    END IF;
  END IF;
END $$;