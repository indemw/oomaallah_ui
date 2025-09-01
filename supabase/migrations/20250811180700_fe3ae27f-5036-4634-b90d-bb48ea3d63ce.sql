-- Fix linter: set search_path on newly created functions

CREATE OR REPLACE FUNCTION public.calculate_pos_bill_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.calculate_pos_order_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.calculate_invoice_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_subtotal numeric := COALESCE(NEW.subtotal, 0);
  v_vat_rate numeric := COALESCE(NEW.vat_rate, 0.165);
  v_levy_rate numeric := COALESCE(NEW.levy_rate, 0.01);
BEGIN
  NEW.tax_amount := round(v_subtotal * v_vat_rate, 2);
  NEW.tourism_levy := round(v_subtotal * v_levy_rate, 2);
  NEW.total_amount := round(v_subtotal - COALESCE(NEW.discount_amount,0) + COALESCE(NEW.service_charge,0) + NEW.tax_amount + NEW.tourism_levy, 2);
  RETURN NEW;
END;
$$;
