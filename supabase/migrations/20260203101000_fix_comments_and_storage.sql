-- 修复 comments 表结构和 Storage
-- 1. 修复 comments 表，确保 reply_to 存在且类型正确 (INTEGER)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'reply_to') THEN
        ALTER TABLE public.comments ADD COLUMN reply_to INTEGER REFERENCES public.comments(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. 尝试再次创建 storage bucket (通过 insert into storage.buckets)
-- 注意：这通常需要 postgres 角色有权限，如果失败，用户需要在 Dashboard 手动创建
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-images', 'community-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. 确保存储桶策略存在
DO $$ BEGIN
  CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'community-images' );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'community-images' AND auth.role() = 'authenticated' );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
