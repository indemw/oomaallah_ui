-- Update a user to admin role for conference room creation
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'jamesm@sadc-gmi.org';