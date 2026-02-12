-- 添加 content 字段到 events 表（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'content'
  ) THEN
    ALTER TABLE public.events ADD COLUMN content TEXT NOT NULL DEFAULT '';
    RAISE NOTICE 'Added content column to events table';
  ELSE
    RAISE NOTICE 'content column already exists in events table';
  END IF;
END
$$;

-- 确保其他必要字段也存在
DO $$
BEGIN
  -- 检查并添加 description 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.events ADD COLUMN description TEXT NOT NULL DEFAULT '';
  END IF;

  -- 检查并添加 media 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'media'
  ) THEN
    ALTER TABLE public.events ADD COLUMN media JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- 检查并添加 thumbnail_url 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'thumbnail_url'
  ) THEN
    ALTER TABLE public.events ADD COLUMN thumbnail_url TEXT;
  END IF;
END
$$;
