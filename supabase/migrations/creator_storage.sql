-- 中文注释：创建用于头像与帖子附件的存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('post-assets', 'post-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 中文注释：启用RLS并设置对象访问策略
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略，避免重复创建
DROP POLICY IF EXISTS objects_read_public_avatars ON storage.objects;
DROP POLICY IF EXISTS objects_read_public_post_assets ON storage.objects;
DROP POLICY IF EXISTS objects_insert_own ON storage.objects;
DROP POLICY IF EXISTS objects_update_own ON storage.objects;
DROP POLICY IF EXISTS objects_delete_own ON storage.objects;

-- 中文注释：公开读取头像与帖子资源
CREATE POLICY objects_read_public_avatars ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY objects_read_public_post_assets ON storage.objects
  FOR SELECT
  USING (bucket_id = 'post-assets');

-- 中文注释：仅本人可写入/更新/删除自己的对象
CREATE POLICY objects_insert_own ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (owner = auth.uid());

CREATE POLICY objects_update_own ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (owner = auth.uid())
  WITH CHECK (owner = auth.uid());

CREATE POLICY objects_delete_own ON storage.objects
  FOR DELETE
  TO authenticated
  USING (owner = auth.uid());

