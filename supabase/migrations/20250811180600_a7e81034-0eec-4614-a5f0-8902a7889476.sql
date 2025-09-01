-- 1) Add VAT/Levy columns and auto-calculation triggers for POS bills and orders

-- POS Bills: add tourism levy and rate columns
ALTER TABLE public.pos_bills
  ADD COLUMN IF NOT EXISTS tourism_levy numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vat_rate numeric NOT NULL DEFAULT 0.165,
  ADD COLUMN IF NOT EXISTS levy_rate numeric NOT NULL DEFAULT 0.01;

-- Function to calculate POS bill totals (VAT inclusive pricing)
CREATE OR REPLACE FUNCTION public.calculate_pos_bill_totals()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- VAT is included in subtotal at vat_rate
  NEW.tax_amount := round(COALESCE(NEW.subtotal, 0) * COALESCE(NEW.vat_rate, 0.165) / (1 + COALESCE(NEW.vat_rate, 0.165)), 2);
  -- Tourism levy at levy_rate applied on subtotal only
  NEW.tourism_levy := round(COALESCE(NEW.subtotal, 0) * COALESCE(NEW.levy_rate, 0.01), 2);
  -- Total does not add VAT again since prices are tax-inclusive
  NEW.total_amount := round(
    COALESCE(NEW.subtotal, 0)
    - COALESCE(NEW.discount_amount, 0)
    + COALESCE(NEW.service_charge, 0)
    + COALESCE(NEW.tourism_levy, 0)
  , 2);

  RETURN NEW;
END;
$$;

-- Trigger for pos_bills
DROP TRIGGER IF EXISTS trg_calculate_pos_bill_totals_ins ON public.pos_bills;
DROP TRIGGER IF EXISTS trg_calculate_pos_bill_totals_upd ON public.pos_bills;
CREATE TRIGGER trg_calculate_pos_bill_totals_ins
BEFORE INSERT ON public.pos_bills
FOR EACH ROW
EXECUTE FUNCTION public.calculate_pos_bill_totals();

CREATE TRIGGER trg_calculate_pos_bill_totals_upd
BEFORE UPDATE ON public.pos_bills
FOR EACH ROW
EXECUTE FUNCTION public.calculate_pos_bill_totals();

-- POS Orders: mirror columns and trigger so order totals remain consistent
ALTER TABLE public.pos_orders
  ADD COLUMN IF NOT EXISTS tourism_levy numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vat_rate numeric NOT NULL DEFAULT 0.165,
  ADD COLUMN IF NOT EXISTS levy_rate numeric NOT NULL DEFAULT 0.01;

CREATE OR REPLACE FUNCTION public.calculate_pos_order_totals()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.tax_amount := round(COALESCE(NEW.subtotal, 0) * COALESCE(NEW.vat_rate, 0.165) / (1 + COALESCE(NEW.vat_rate, 0.165)), 2);
  NEW.tourism_levy := round(COALESCE(NEW.subtotal, 0) * COALESCE(NEW.levy_rate, 0.01), 2);
  NEW.total_amount := round(
    COALESCE(NEW.subtotal, 0)
    - COALESCE(NEW.discount_amount, 0)
    + COALESCE(NEW.service_charge, 0)
    + COALESCE(NEW.tourism_levy, 0)
  , 2);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calculate_pos_order_totals_ins ON public.pos_orders;
DROP TRIGGER IF EXISTS trg_calculate_pos_order_totals_upd ON public.pos_orders;
CREATE TRIGGER trg_calculate_pos_order_totals_ins
BEFORE INSERT ON public.pos_orders
FOR EACH ROW
EXECUTE FUNCTION public.calculate_pos_order_totals();

CREATE TRIGGER trg_calculate_pos_order_totals_upd
BEFORE UPDATE ON public.pos_orders
FOR EACH ROW
EXECUTE FUNCTION public.calculate_pos_order_totals();

-- 2) Generic invoices to support Reservations/Accounting invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL CHECK (module IN ('reservations','accounting','restaurant','conference','stock')),
  reference_id uuid,
  customer_name text,
  currency text NOT NULL DEFAULT 'MWK',
  subtotal numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  tourism_levy numeric NOT NULL DEFAULT 0,
  service_charge numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  vat_rate numeric NOT NULL DEFAULT 0.165,
  levy_rate numeric NOT NULL DEFAULT 0.01,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Policies: Accountants/Admins manage; staff can view their own created invoices
CREATE POLICY "Invoices: accountants manage" ON public.invoices
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('accountant','admin','super_admin')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('accountant','admin','super_admin')));

CREATE POLICY "Invoices: staff view own" ON public.invoices
FOR SELECT TO authenticated
USING (created_by = auth.uid());

-- Auto-update updated_at
DROP TRIGGER IF EXISTS trg_update_invoices_updated_at ON public.invoices;
CREATE TRIGGER trg_update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Calculate totals for invoices (VAT inclusive? Reservations/Accounting likely tax-exclusive)
-- BUT per user spec, VAT and levy apply on subtotal only. Assume subtotal is tax-exclusive for invoices.
CREATE OR REPLACE FUNCTION public.calculate_invoice_totals()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_subtotal numeric := COALESCE(NEW.subtotal, 0);
  v_vat_rate numeric := COALESCE(NEW.vat_rate, 0.165);
  v_levy_rate numeric := COALESCE(NEW.levy_rate, 0.01);
BEGIN
  -- For generic invoices, treat subtotal as tax-exclusive
  NEW.tax_amount := round(v_subtotal * v_vat_rate, 2);
  NEW.tourism_levy := round(v_subtotal * v_levy_rate, 2);
  NEW.total_amount := round(v_subtotal - COALESCE(NEW.discount_amount,0) + COALESCE(NEW.service_charge,0) + NEW.tax_amount + NEW.tourism_levy, 2);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calculate_invoice_totals_ins ON public.invoices;
DROP TRIGGER IF EXISTS trg_calculate_invoice_totals_upd ON public.invoices;
CREATE TRIGGER trg_calculate_invoice_totals_ins
BEFORE INSERT ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.calculate_invoice_totals();
CREATE TRIGGER trg_calculate_invoice_totals_upd
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.calculate_invoice_totals();

-- 3) Staff Chat tables
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  is_public boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat rooms: view" ON public.chat_rooms
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Chat rooms: create" ON public.chat_rooms
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Chat rooms: update own or admin" ON public.chat_rooms
FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('admin','super_admin')))
WITH CHECK (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('admin','super_admin')));

DROP TRIGGER IF EXISTS trg_update_chat_rooms_updated_at ON public.chat_rooms;
CREATE TRIGGER trg_update_chat_rooms_updated_at
BEFORE UPDATE ON public.chat_rooms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON public.chat_messages(room_id, created_at DESC);

CREATE POLICY "Chat messages: view" ON public.chat_messages
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Chat messages: insert own" ON public.chat_messages
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Chat messages: delete own or admin" ON public.chat_messages
FOR DELETE TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('admin','super_admin')));

-- Seed a default General room if not exists
INSERT INTO public.chat_rooms (name)
VALUES ('General')
ON CONFLICT (name) DO NOTHING;

-- 4) Roles & Permissions tables
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roles: view" ON public.roles
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Roles: manage by admins" ON public.roles
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('admin','super_admin')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('admin','super_admin')));

DROP TRIGGER IF EXISTS trg_update_roles_updated_at ON public.roles;
CREATE TRIGGER trg_update_roles_updated_at
BEFORE UPDATE ON public.roles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  module text NOT NULL CHECK (module IN ('reservations','conference','restaurant','stock','accounting','users','chat')),
  can_create boolean NOT NULL DEFAULT false,
  can_read boolean NOT NULL DEFAULT true,
  can_update boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  UNIQUE (role_id, module)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Role permissions: view" ON public.role_permissions
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Role permissions: manage by admins" ON public.role_permissions
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('admin','super_admin')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('admin','super_admin')));

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User roles: view" ON public.user_roles
FOR SELECT TO authenticated USING (true);

CREATE POLICY "User roles: manage by admins" ON public.user_roles
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('admin','super_admin')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('admin','super_admin')));
