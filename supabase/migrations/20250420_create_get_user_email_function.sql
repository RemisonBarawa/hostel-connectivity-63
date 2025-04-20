
-- Create a secure function to get user email by ID
CREATE OR REPLACE FUNCTION public.get_user_email(user_id UUID)
RETURNS TABLE (email TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email 
  FROM auth.users 
  WHERE id = user_id;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_email TO authenticated;
