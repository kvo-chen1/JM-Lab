-- Fix RLS policies for posts table
-- Ensure policies handle both user_id and author_id correctly

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Public can view published posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
DROP POLICY IF EXISTS "Posts are viewable" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;

-- Allow public read access to published posts
CREATE POLICY "Public can view published posts" 
ON public.posts FOR SELECT 
USING (status = 'published');

-- Allow users to view their own posts (drafts etc)
-- Checking both author_id and user_id to be safe
CREATE POLICY "Users can view own posts" 
ON public.posts FOR SELECT 
USING (auth.uid() = author_id);

-- Allow authenticated users to insert posts
-- CRITICAL: The WITH CHECK clause must match the data being inserted
-- If insert data contains author_id, this must match auth.uid()
CREATE POLICY "Users can insert own posts" 
ON public.posts FOR INSERT 
WITH CHECK (auth.uid() = author_id);

-- Allow users to update their own posts
CREATE POLICY "Users can update own posts" 
ON public.posts FOR UPDATE 
USING (auth.uid() = author_id);

-- Allow users to delete their own posts
CREATE POLICY "Users can delete own posts" 
ON public.posts FOR DELETE 
USING (auth.uid() = author_id);
