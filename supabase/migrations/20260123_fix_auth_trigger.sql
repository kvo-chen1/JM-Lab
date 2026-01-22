-- Fix User Sync Trigger
-- Description: Updates the handle_new_user function to match the public.users table schema

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    username, 
    avatar, 
    created_at, 
    updated_at,
    membership_level,
    membership_status
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(
      new.raw_user_meta_data->>'username', 
      new.raw_user_meta_data->>'name', 
      new.raw_user_meta_data->>'full_name', 
      split_part(new.email, '@', 1)
    ), 
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'avatar'), 
    NOW(), 
    NOW(),
    'free',
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    avatar = EXCLUDED.avatar,
    updated_at = NOW();
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists and is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
