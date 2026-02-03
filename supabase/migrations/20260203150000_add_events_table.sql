-- 创建events表
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  organizer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  participants INTEGER NOT NULL DEFAULT 0,
  max_participants INTEGER,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  type TEXT NOT NULL CHECK (type IN ('online', 'offline')),
  tags JSONB DEFAULT '[]'::jsonb,
  thumbnail_url TEXT,
  media JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'rejected')),
  published_at TIMESTAMPTZ,
  rejection_reason TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  share_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  push_to_community BOOLEAN DEFAULT FALSE,
  apply_for_recommendation BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建触发器更新updated_at字段
DROP TRIGGER IF EXISTS set_events_updated_at ON public.events;
CREATE TRIGGER set_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(type);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_events_end_time ON public.events(end_time DESC);
CREATE INDEX IF NOT EXISTS idx_events_is_public ON public.events(is_public);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);

-- 启用行级安全
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 创建行级安全策略
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'events' AND policyname = 'Events are viewable'
  ) THEN
    EXECUTE 'CREATE POLICY "Events are viewable" ON public.events FOR SELECT USING (is_public = true OR auth.uid() = organizer_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'events' AND policyname = 'Organizers can create events'
  ) THEN
    EXECUTE 'CREATE POLICY "Organizers can create events" ON public.events FOR INSERT WITH CHECK (auth.uid() = organizer_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'events' AND policyname = 'Organizers can update events'
  ) THEN
    EXECUTE 'CREATE POLICY "Organizers can update events" ON public.events FOR UPDATE USING (auth.uid() = organizer_id) WITH CHECK (auth.uid() = organizer_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'events' AND policyname = 'Organizers can delete events'
  ) THEN
    EXECUTE 'CREATE POLICY "Organizers can delete events" ON public.events FOR DELETE USING (auth.uid() = organizer_id)';
  END IF;
END
$$;
