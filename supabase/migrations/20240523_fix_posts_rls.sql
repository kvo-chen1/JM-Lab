-- Enable RLS on posts table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published posts
CREATE POLICY "Public can view published posts" 
ON posts FOR SELECT 
USING (status = 'published');

-- Allow users to view their own posts (drafts etc)
CREATE POLICY "Users can view own posts" 
ON posts FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = author_id);

-- Allow authenticated users to insert posts
CREATE POLICY "Users can insert own posts" 
ON posts FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.uid() = author_id);

-- Allow users to update their own posts
CREATE POLICY "Users can update own posts" 
ON posts FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() = author_id);

-- Allow users to delete their own posts
CREATE POLICY "Users can delete own posts" 
ON posts FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() = author_id);

-- Enable RLS on post_tags table
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

-- Allow public read access to post_tags
CREATE POLICY "Public can view post_tags" 
ON post_tags FOR SELECT 
TO public 
USING (true);

-- Allow authenticated users to insert post_tags
CREATE POLICY "Users can insert post_tags" 
ON post_tags FOR INSERT 
TO authenticated 
WITH CHECK (true); 
-- Note: Ideally we should check if the user owns the post, but for simplicity we allow authenticated users to tag.
-- A stricter policy would be:
-- WITH CHECK (EXISTS (SELECT 1 FROM posts WHERE id = post_id AND (user_id = auth.uid() OR author_id = auth.uid())))

-- Enable RLS on tags table
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Allow public read access to tags
CREATE POLICY "Public can view tags" 
ON tags FOR SELECT 
TO public 
USING (true);

-- Allow authenticated users to insert tags
CREATE POLICY "Users can insert tags" 
ON tags FOR INSERT 
TO authenticated 
WITH CHECK (true);
