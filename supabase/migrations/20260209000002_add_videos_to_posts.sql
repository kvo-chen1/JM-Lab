-- 添加 videos 字段到 posts 表，支持帖子视频功能

-- 添加 videos 列
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'videos') THEN
        ALTER TABLE public.posts ADD COLUMN videos TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- 添加 audios 列（语音功能）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'audios') THEN
        ALTER TABLE public.posts ADD COLUMN audios TEXT[] DEFAULT '{}';
    END IF;
END $$;
