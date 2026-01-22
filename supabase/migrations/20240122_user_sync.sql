-- Migration: Add User Sync Trigger
-- Description: Automatically syncs new users from auth.users to public.users

-- Ensure the function exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    name, 
    avatar_url, 
    created_at, 
    updated_at
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'New User'), 
    new.raw_user_meta_data->>'avatar_url', 
    NOW(), 
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Handle potential race conditions
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Comment: This ensures that whenever a user signs up via Supabase Auth,
-- a corresponding record is created in the public.users table,
-- preventing "foreign key violation" errors in other tables.
