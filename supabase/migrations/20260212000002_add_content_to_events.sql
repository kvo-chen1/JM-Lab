-- 添加所有缺少的字段到 events 表
DO $$
BEGIN
  -- 检查并添加 content 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'content'
  ) THEN
    ALTER TABLE public.events ADD COLUMN content TEXT NOT NULL DEFAULT '';
    RAISE NOTICE 'Added content column to events table';
  END IF;

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

  -- 检查并添加 start_time 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'start_time'
  ) THEN
    ALTER TABLE public.events ADD COLUMN start_time TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;

  -- 检查并添加 end_time 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'end_time'
  ) THEN
    ALTER TABLE public.events ADD COLUMN end_time TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;

  -- 检查并添加 location 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'location'
  ) THEN
    ALTER TABLE public.events ADD COLUMN location TEXT;
  END IF;

  -- 检查并添加 type 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE public.events ADD COLUMN type TEXT NOT NULL DEFAULT 'offline' CHECK (type IN ('online', 'offline'));
  END IF;

  -- 检查并添加 max_participants 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'max_participants'
  ) THEN
    ALTER TABLE public.events ADD COLUMN max_participants INTEGER;
  END IF;

  -- 检查并添加 is_public 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.events ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;

  -- 检查并添加 tags 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'tags'
  ) THEN
    ALTER TABLE public.events ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- 检查并添加 status 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.events ADD COLUMN status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'rejected'));
  END IF;

  -- 检查并添加 contact_name 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'contact_name'
  ) THEN
    ALTER TABLE public.events ADD COLUMN contact_name TEXT;
  END IF;

  -- 检查并添加 contact_phone 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'contact_phone'
  ) THEN
    ALTER TABLE public.events ADD COLUMN contact_phone TEXT;
  END IF;

  -- 检查并添加 contact_email 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE public.events ADD COLUMN contact_email TEXT;
  END IF;

  -- 检查并添加 push_to_community 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'push_to_community'
  ) THEN
    ALTER TABLE public.events ADD COLUMN push_to_community BOOLEAN DEFAULT FALSE;
  END IF;

  -- 检查并添加 apply_for_recommendation 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'apply_for_recommendation'
  ) THEN
    ALTER TABLE public.events ADD COLUMN apply_for_recommendation BOOLEAN DEFAULT FALSE;
  END IF;
END
$$;
