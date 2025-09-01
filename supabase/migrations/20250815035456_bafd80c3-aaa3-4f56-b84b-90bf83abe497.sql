-- Update the current user's profile to have admin role for testing
UPDATE profiles 
SET role = 'admin' 
WHERE user_id = auth.uid();