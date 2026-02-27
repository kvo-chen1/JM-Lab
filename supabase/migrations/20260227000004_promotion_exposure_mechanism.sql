-- 推广曝光机制 - 创建函数模拟真实推广效果

-- 函数：增加推广作品的曝光量
CREATE OR REPLACE FUNCTION increment_promotion_views(
  p_work_id UUID,
  p_view_count INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_views INTEGER;
  v_target_views INTEGER;
  v_progress INTEGER;
BEGIN
  -- 获取当前曝光量
  SELECT actual_views, target_views INTO v_current_views, v_target_views
  FROM promoted_works
  WHERE id = p_work_id;
  
  IF v_current_views IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 更新曝光量
  UPDATE promoted_works
  SET 
    actual_views = actual_views + p_view_count,
    updated_at = NOW(),
    -- 如果达到目标曝光量，自动标记为完成
    status = CASE 
      WHEN actual_views + p_view_count >= target_views THEN 'completed'::promotion_status
      ELSE status
    END,
    end_time = CASE 
      WHEN actual_views + p_view_count >= target_views THEN NOW()
      ELSE end_time
    END
  WHERE id = p_work_id;
  
  RETURN TRUE;
END;
$$;

-- 函数：增加推广作品的点击量
CREATE OR REPLACE FUNCTION increment_promotion_clicks(
  p_work_id UUID,
  p_click_count INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_clicks INTEGER;
BEGIN
  -- 获取当前点击量
  SELECT actual_clicks INTO v_current_clicks
  FROM promoted_works
  WHERE id = p_work_id;
  
  IF v_current_clicks IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 更新点击量
  UPDATE promoted_works
  SET 
    actual_clicks = actual_clicks + p_click_count,
    updated_at = NOW()
  WHERE id = p_work_id;
  
  RETURN TRUE;
END;
$$;

-- 函数：模拟推广曝光（自动为所有活跃推广增加曝光）
CREATE OR REPLACE FUNCTION simulate_promotion_exposure()
RETURNS TABLE(
  work_id UUID,
  work_title TEXT,
  views_added INTEGER,
  clicks_added INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_work RECORD;
  v_views INTEGER;
  v_clicks INTEGER;
  v_ctr DECIMAL(5,2);
BEGIN
  -- 遍历所有活跃状态的推广作品
  FOR v_work IN 
    SELECT pw.id, pw.order_id, pw.actual_views, pw.actual_clicks, pw.target_views
    FROM promoted_works pw
    WHERE pw.status = 'active'
    AND pw.end_time > NOW()
  LOOP
    -- 根据目标曝光量计算每次增加的曝光数（模拟不同速度）
    -- 基础曝光：每小时 50-150 次
    v_views := FLOOR(50 + RANDOM() * 100)::INTEGER;
    
    -- 点击率通常在 1%-5% 之间
    v_ctr := 1.0 + RANDOM() * 4.0;
    v_clicks := GREATEST(1, ROUND(v_views * v_ctr / 100))::INTEGER;
    
    -- 检查是否会超过目标曝光量
    IF v_work.actual_views + v_views > v_work.target_views THEN
      v_views := GREATEST(0, v_work.target_views - v_work.actual_views);
      v_clicks := GREATEST(0, ROUND(v_views * v_ctr / 100))::INTEGER;
    END IF;
    
    -- 更新曝光量
    IF v_views > 0 THEN
      UPDATE promoted_works
      SET 
        actual_views = actual_views + v_views,
        actual_clicks = actual_clicks + v_clicks,
        updated_at = NOW(),
        -- 如果达到目标，自动完成
        status = CASE 
          WHEN actual_views + v_views >= target_views THEN 'completed'::promotion_status
          ELSE status
        END,
        end_time = CASE 
          WHEN actual_views + v_views >= target_views THEN NOW()
          ELSE end_time
        END
      WHERE id = v_work.id;
      
      -- 同时更新订单表的统计数据
      UPDATE promotion_orders
      SET 
        actual_views = COALESCE(actual_views, 0) + v_views,
        actual_clicks = COALESCE(actual_clicks, 0) + v_clicks
      WHERE id = v_work.order_id;
      
      -- 返回结果
      work_id := v_work.id;
      views_added := v_views;
      clicks_added := v_clicks;
      
      -- 尝试获取作品标题
      SELECT work_title INTO work_title
      FROM promotion_orders
      WHERE id = v_work.order_id;
      
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

-- 创建定时任务（如果 pg_cron 扩展可用）
-- 每小时执行一次模拟曝光
DO $$
BEGIN
  -- 检查 pg_cron 扩展是否存在
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- 删除已存在的任务
    PERFORM cron.unschedule('promotion-exposure-simulation');
    
    -- 创建新任务：每小时执行一次
    PERFORM cron.schedule(
      'promotion-exposure-simulation',
      '0 * * * *',  -- 每小时第0分钟执行
      'SELECT simulate_promotion_exposure()'
    );
    
    RAISE NOTICE 'Created cron job for promotion exposure simulation';
  ELSE
    RAISE NOTICE 'pg_cron extension not available, skipping cron job creation';
  END IF;
END;
$$;

-- 添加注释
COMMENT ON FUNCTION increment_promotion_views IS '增加指定推广作品的曝光量';
COMMENT ON FUNCTION increment_promotion_clicks IS '增加指定推广作品的点击量';
COMMENT ON FUNCTION simulate_promotion_exposure IS '模拟推广曝光，为所有活跃推广自动增加曝光和点击';
