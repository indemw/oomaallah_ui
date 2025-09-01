-- Public visibility for active menu items
-- Allow anonymous users to view active menu items for website menu display
CREATE POLICY IF NOT EXISTS "Public can view active menu items" 
ON public.menu_items
FOR SELECT
TO public
USING (is_active = true);

-- Optional: Seed initial menu items if table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.menu_items) THEN
    INSERT INTO public.menu_items (name, description, category, price, station, is_active, tax_rate)
    VALUES
      -- Restaurant (kitchen)
      ('Grilled Lake Malawi Chambo', 'Fresh chambo fish grilled with local herbs, served with nsima and vegetables', 'Local Specialties', 4500, 'kitchen', true, 0.16),
      ('Malawian Curry Chicken', 'Tender chicken in aromatic curry sauce with rice and traditional sides', 'Local Specialties', 3800, 'kitchen', true, 0.16),
      ('Beef Steak with Chips', 'Premium beef steak with crispy chips and salad', 'International', 5200, 'kitchen', true, 0.16),
      ('Vegetarian Pasta', 'Fresh pasta with seasonal vegetables in herb sauce', 'International', 3200, 'kitchen', true, 0.16),
      ('Tropical Fruit Salad', 'Fresh seasonal fruits from local farms', 'Desserts', 1500, 'kitchen', true, 0.16),
      -- Bar
      ('Classic Mojito', 'Refreshing mint, lime, sugar, soda, and rum', 'Cocktails', 3000, 'bar', true, 0.16),
      ('Gin and Tonic', 'Premium gin with tonic water and lime', 'Cocktails', 2800, 'bar', true, 0.16),
      ('Local Beer', 'Chilled Malawian lager', 'Beer', 1500, 'bar', true, 0.16),
      ('Fresh Passion Juice', 'House-made passion fruit juice', 'Soft Drinks', 1200, 'bar', true, 0.16);
  END IF;
END $$;