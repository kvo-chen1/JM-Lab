-- 修复 get_square_works_with_promotion 函数中的类型转换错误
-- 错误: cannot cast type timestamp with time zone to bigint
-- 原因: 普通作品的 created_at 是 bigint，推广作品的 created_at 是 timestamptz，需要统一处理

-- 删除旧函数
DROP FUNCTION IF EXISTS public.get_square_works_with_promotion(integer, integer, uuid);

-- 创建修复后的函数
CREATE FUNCTION public.get_square_works_with_promotion(
    p_limit integer DEFAULT 20, 
    p_offset integer DEFAULT 0, 
    p_user_id uuid DEFAULT NULL::uuid
) 
RETURNS TABLE(
    id uuid, 
    work_type text, 
    title text, 
    thumbnail text, 
    video_url text, 
    creator_id uuid, 
    creator_username text, 
    creator_avatar text, 
    views integer, 
    likes integer, 
    comments integer, 
    created_at timestamp with time zone, 
    is_promoted boolean, 
    promoted_work_id uuid, 
    package_type text, 
    promotion_weight numeric
)
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  v_promoted_count INTEGER;
  v_normal_limit INTEGER;
BEGIN
  -- 计算需要插入的推广作品数量（约20%，至少1个）
  v_promoted_count := GREATEST(1, ROUND(p_limit * 0.2));
  v_normal_limit := p_limit - v_promoted_count;

  -- 使用 UNION ALL 合并普通作品和推广作品，确保返回统一的结果集
  RETURN QUERY
  WITH normal_works AS (
    -- 普通作品
    SELECT
      w.id::UUID as id,
      'normal'::TEXT as work_type,
      w.title::TEXT as title,
      COALESCE(w.thumbnail, w.cover_url, '')::TEXT as thumbnail,
      COALESCE(w.video_url, '')::TEXT as video_url,
      w.creator_id::UUID as creator_id,
      u.username::TEXT as creator_username,
      u.avatar_url::TEXT as creator_avatar,
      COALESCE(w.views, 0)::INTEGER as views,
      COALESCE(w.likes, 0)::INTEGER as likes,
      COALESCE(w.comments, 0)::INTEGER as comments,
      to_timestamp(w.created_at / 1000.0)::TIMESTAMPTZ as created_at,
      FALSE as is_promoted,
      NULL::UUID as promoted_work_id,
      NULL::TEXT as package_type,
      NULL::DECIMAL as promotion_weight
    FROM works w
    LEFT JOIN users u ON w.creator_id = u.id
    WHERE w.status = 'published'
    ORDER BY w.created_at DESC
    LIMIT v_normal_limit
    OFFSET p_offset
  ),
  promoted_works_list AS (
    -- 推广作品
    SELECT
      pw.work_id::UUID as id,
      'promoted'::TEXT as work_type,
      po.work_title::TEXT as title,
      COALESCE(po.work_thumbnail, '')::TEXT as thumbnail,
      ''::TEXT as video_url,
      pw.user_id::UUID as creator_id,
      u.username::TEXT as creator_username,
      u.avatar_url::TEXT as creator_avatar,
      COALESCE(pw.actual_views, 0)::INTEGER as views,
      0::INTEGER as likes,
      0::INTEGER as comments,
      pw.created_at as created_at,
      TRUE as is_promoted,
      pw.id::UUID as promoted_work_id,
      pw.package_type::TEXT as package_type,
      pw.promotion_weight::DECIMAL(3,2) as promotion_weight
    FROM promoted_works pw
    JOIN promotion_orders po ON pw.order_id = po.id
    LEFT JOIN users u ON pw.user_id = u.id
    WHERE pw.status = 'active'
      AND pw.end_time > NOW()
      AND (p_user_id IS NULL OR pw.user_id != p_user_id)
    ORDER BY pw.promotion_weight DESC, pw.priority_score DESC
    LIMIT v_promoted_count
  )
  -- 合并结果：先推广作品，再普通作品
  SELECT * FROM promoted_works_list
  UNION ALL
  SELECT * FROM normal_works
  -- 最终排序：推广作品优先，然后按时间倒序
  ORDER BY 
    CASE WHEN is_promoted THEN 1 ELSE 0 END DESC,
    created_at DESC;
END;
$$;

-- 添加函数注释
COMMENT ON FUNCTION public.get_square_works_with_promotion(integer, integer, uuid) 
IS '获取广场作品列表，包含推广作品（修复类型转换错误版）';
