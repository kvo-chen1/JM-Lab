-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID,
    operation TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view audit logs (Assuming an 'admin' role or specific user logic exists, otherwise restricted to service_role)
-- For now, we allow no public access. Data should be accessed via Supabase Dashboard or Admin API.
CREATE POLICY "No public access to audit logs" ON public.audit_logs
    FOR ALL
    USING (false);

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        operation,
        old_data,
        new_data,
        changed_by
    )
    VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id), -- Handle DELETE case where NEW is null
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
        auth.uid()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach triggers to critical tables
-- Users
DROP TRIGGER IF EXISTS audit_users_changes ON public.users;
CREATE TRIGGER audit_users_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Posts
DROP TRIGGER IF EXISTS audit_posts_changes ON public.posts;
CREATE TRIGGER audit_posts_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Communities
DROP TRIGGER IF EXISTS audit_communities_changes ON public.communities;
CREATE TRIGGER audit_communities_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.communities
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Comments
DROP TRIGGER IF EXISTS audit_comments_changes ON public.comments;
CREATE TRIGGER audit_comments_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
