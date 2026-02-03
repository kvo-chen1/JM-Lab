-- Fix communities table schema to match application code
ALTER TABLE communities
  ALTER COLUMN id SET DEFAULT ('cm_' || substr(md5(random()::text), 1, 10)); -- Generate a random ID if not provided, or use uuid

-- Better yet, let's just make it a text column that defaults to a random string or uuid if not provided
-- But the application might expect a specific format.
-- Looking at local-api.mjs, it uses `community-${Date.now()}`.
-- But we are using Supabase now.
-- Let's set default to gen_random_uuid()::text if it's not set.

ALTER TABLE communities
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS topic text,
  ADD COLUMN IF NOT EXISTS avatar text,
  ADD COLUMN IF NOT EXISTS cover_image text,
  ADD COLUMN IF NOT EXISTS creator_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_special boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS theme jsonb DEFAULT '{"primaryColor": "#3b82f6", "secondaryColor": "#60a5fa", "backgroundColor": "#f3f4f6", "textColor": "#1f2937"}'::jsonb,
  ADD COLUMN IF NOT EXISTS layout_type text DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS enabled_modules jsonb DEFAULT '{"posts": true, "chat": true, "members": true, "announcements": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS member_count integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Fix community_members table
-- user_id needs to be uuid to match auth.users and public.users
-- We will recreate the column
ALTER TABLE community_members DROP COLUMN IF EXISTS user_id;
ALTER TABLE community_members ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Ensure community_members has a unique constraint on (community_id, user_id)
ALTER TABLE community_members DROP CONSTRAINT IF EXISTS community_members_user_id_community_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_community_members_unique ON community_members(community_id, user_id);

-- Add RLS policies if not present (optional but good practice)
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone for communities
CREATE POLICY "Communities are viewable by everyone" 
ON communities FOR SELECT 
USING (true);

-- Allow authenticated users to create communities
CREATE POLICY "Users can create communities" 
ON communities FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

-- Allow updates by creator or members with admin role (simplified to creator for now)
CREATE POLICY "Creator can update community" 
ON communities FOR UPDATE 
USING (auth.uid() = creator_id);

-- Policies for community_members
CREATE POLICY "Community members are viewable by everyone" 
ON community_members FOR SELECT 
USING (true);

CREATE POLICY "Users can join communities" 
ON community_members FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities" 
ON community_members FOR DELETE 
USING (auth.uid() = user_id);
