-- 修复 log_post_activity 触发器函数
-- 使用 user_activities 表实际存在的字段

CREATE OR REPLACE FUNCTION public.log_post_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
        INSERT INTO public.user_activities (user_id, activity_type, entity_type, entity_id, details)
        VALUES (
            NEW.user_id,
            'post',
            'post',
            NEW.id::text,
            jsonb_build_object('title', NEW.title, 'content', substring(NEW.content from 1 for 100))
        );
    END IF;
    RETURN NEW;
END;
$function$;

-- 重新创建触发器（如果存在则先删除）
DROP TRIGGER IF EXISTS log_post_activity_trigger ON public.posts;

CREATE TRIGGER log_post_activity_trigger
    AFTER INSERT ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.log_post_activity();
