-- Create profiles for existing users who don't have one
INSERT INTO profiles (user_id, email, full_name, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
  'admin'  -- Default to admin for existing users
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.user_id = au.id
);