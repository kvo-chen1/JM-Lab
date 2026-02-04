-- RPC: Create Post Transaction
-- Handles: Inserting post, updating user post count, updating community post count
CREATE OR REPLACE FUNCTION public.create_post_transaction(
    p_title TEXT,
    p_content TEXT,
    p_community_id UUID,
    p_author_id UUID,
    p_images JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (admin), allowing stats updates that might be RLS-restricted
AS $$
DECLARE
    v_post_id UUID;
    v_post_data JSONB;
BEGIN
    -- 1. Insert Post
    INSERT INTO public.posts (title, content, community_id, author_id, images, status)
    VALUES (p_title, p_content, p_community_id, p_author_id, p_images, 'published')
    RETURNING id INTO v_post_id;

    -- 2. Update User Stats (Atomic Increment)
    UPDATE public.users
    SET 
        posts_count = COALESCE(posts_count, 0) + 1,
        last_active_at = NOW()
    WHERE id = p_author_id;

    -- 3. Update Community Stats
    IF p_community_id IS NOT NULL THEN
        UPDATE public.communities
        SET 
            posts_count = COALESCE(posts_count, 0) + 1,
            updated_at = NOW()
        WHERE id = p_community_id;
    END IF;

    -- 4. Return the created post structure
    SELECT to_jsonb(p) INTO v_post_data FROM public.posts p WHERE id = v_post_id;
    
    RETURN v_post_data;

EXCEPTION WHEN OTHERS THEN
    -- Transaction will automatically rollback on error
    RAISE;
END;
$$;

-- RPC: Toggle Like Transaction
-- Handles: Insert/Delete like record, update post likes count
CREATE OR REPLACE FUNCTION public.toggle_like_transaction(
    p_post_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN -- Returns TRUE for Liked, FALSE for Unliked
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- Check if like exists
    SELECT EXISTS (SELECT 1 FROM public.likes WHERE post_id = p_post_id AND user_id = p_user_id) INTO v_exists;

    IF v_exists THEN
        -- Unlike
        DELETE FROM public.likes WHERE post_id = p_post_id AND user_id = p_user_id;
        -- Decrement count, preventing negative values
        UPDATE public.posts SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) WHERE id = p_post_id;
        RETURN FALSE;
    ELSE
        -- Like
        INSERT INTO public.likes (post_id, user_id) VALUES (p_post_id, p_user_id);
        -- Increment count
        UPDATE public.posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = p_post_id;
        RETURN TRUE;
    END IF;
END;
$$;
