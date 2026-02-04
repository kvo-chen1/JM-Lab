-- Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL,
    organizer_id UUID REFERENCES auth.users(id),
    max_participants INTEGER DEFAULT 100,
    current_participants INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published', -- 'draft', 'published', 'cancelled', 'completed'
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Participants Table
CREATE TABLE IF NOT EXISTS public.event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'registered', -- 'registered', 'checked_in', 'cancelled'
    checked_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Drafts Table (For Creation Center)
CREATE TABLE IF NOT EXISTS public.drafts (
    id TEXT PRIMARY KEY, -- Using TEXT to match local UUIDs or client-generated IDs
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT,
    content TEXT,
    template_id TEXT,
    template_name TEXT,
    summary TEXT,
    category TEXT,
    tags TEXT[], -- Array of strings
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Events
CREATE POLICY "Public events are viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Users can create events" ON public.events FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizers can update their events" ON public.events FOR UPDATE USING (auth.uid() = organizer_id);

-- RLS Policies for Participants
CREATE POLICY "Participants viewable by organizer or self" ON public.event_participants 
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = auth.uid()
    ));
CREATE POLICY "Users can register themselves" ON public.event_participants 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel their registration" ON public.event_participants 
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for Drafts
CREATE POLICY "Users can CRUD their own drafts" ON public.drafts
    FOR ALL USING (auth.uid() = user_id);

-- RPC: Register for Event (Concurrency Safe)
CREATE OR REPLACE FUNCTION public.register_for_event_transaction(
    p_event_id UUID,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_status TEXT;
    v_current INTEGER;
    v_max INTEGER;
    v_registration_id UUID;
BEGIN
    -- Lock the event row for update to prevent race conditions
    SELECT status, current_participants, max_participants 
    INTO v_event_status, v_current, v_max
    FROM public.events 
    WHERE id = p_event_id 
    FOR UPDATE;

    -- Checks
    IF v_event_status != 'published' THEN
        RAISE EXCEPTION 'Event is not open for registration';
    END IF;

    IF v_current >= v_max THEN
        RAISE EXCEPTION 'Event is full';
    END IF;

    -- Check if already registered
    IF EXISTS (SELECT 1 FROM public.event_participants WHERE event_id = p_event_id AND user_id = p_user_id) THEN
        RAISE EXCEPTION 'User already registered';
    END IF;

    -- Insert Participant
    INSERT INTO public.event_participants (event_id, user_id, status)
    VALUES (p_event_id, p_user_id, 'registered')
    RETURNING id INTO v_registration_id;

    -- Update Count
    UPDATE public.events 
    SET current_participants = current_participants + 1 
    WHERE id = p_event_id;

    RETURN jsonb_build_object('success', true, 'registration_id', v_registration_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
