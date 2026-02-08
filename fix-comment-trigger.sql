-- 修复 log_comment_activity 触发器函数
-- 使用 user_activities 表实际存在的字段

CREATE OR REPLACE FUNCTION public.log_comment_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    post_title TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 获取帖子标题
        SELECT title INTO post_title FROM public.posts WHERE id = NEW.post_id;
        
        INSERT INTO public.user_activities (user_id, action_type, entity_type, entity_id, details, content)
        VALUES (
            NEW.user_id,
            'create_comment',
            'comment',
            NEW.id::text,
            jsonb_build_object('post_id', NEW.post_id, 'post_title', post_title, 'content', substring(NEW.content from 1 for 100)),
            '评论了作品《' || COALESCE(post_title, '未知作品') || '》'
        );
    END IF;
    RETURN NEW;
END;
$function$;
