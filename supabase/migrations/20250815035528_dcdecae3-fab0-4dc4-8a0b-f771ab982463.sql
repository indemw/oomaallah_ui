-- Create a profile for the current user if one doesn't exist
INSERT INTO profiles (user_id, email, full_name, role)
SELECT 
  auth.uid(),
  (SELECT email FROM auth.users WHERE id = auth.uid()),
  COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth.uid()), 'Admin User'),
  'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE user_id = auth.uid()
);