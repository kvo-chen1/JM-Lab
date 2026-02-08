-- 修复 log_post_activity 触发器函数
-- 使用正确的字段名：action_type 而不是 activity_type

CREATE OR REPLACE FUNCTION public.log_post_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
        INSERT INTO public.user_activities (user_id, action_type, entity_type, entity_id, details, content)
        VALUES (
            NEW.user_id,
            'create_post',
            'post',
            NEW.id::text,
            jsonb_build_object('title', NEW.title, 'content', substring(NEW.content from 1 for 100)),
            '发布了新作品《' || NEW.title || '》'
        );
    END IF;
    RETURN NEW;
END;
$function$;
