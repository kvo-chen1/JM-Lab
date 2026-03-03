import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * 用户会话跟踪 Hook
 * 记录用户的在线时间和活跃行为
 */
export function useUserSession() {
  const sessionId = useRef<string | null>(null);
  const lastActiveTime = useRef<number>(Date.now());
  const pageViewCount = useRef<number>(0);
  const actionCount = useRef<number>(0);

  useEffect(() => {
    // 获取当前用户
    const initSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 创建新会话（只插入必需字段，避免 schema cache 问题）
      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          session_start: new Date().toISOString(),
          last_active: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (data) {
        sessionId.current = data.id;
      }

      if (error) {
        console.error('Failed to create session:', error);
      }
    };

    initSession();

    // 更新活跃时间的函数
    const updateActivity = async () => {
      if (!sessionId.current) return;

      const now = Date.now();
      const timeSinceLastActive = now - lastActiveTime.current;

      // 每30秒更新一次
      if (timeSinceLastActive > 30000) {
        lastActiveTime.current = now;

        await supabase
          .from('user_sessions')
          .update({
            last_active: new Date().toISOString(),
          })
          .eq('id', sessionId.current);
      }
    };

    // 监听用户活动
    const handleActivity = () => {
      actionCount.current++;
      updateActivity();
    };

    // 监听页面浏览
    const handlePageView = () => {
      pageViewCount.current++;
      updateActivity();
    };

    // 添加事件监听器
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('beforeunload', handlePageView);

    // 定期更新会话
    const intervalId = setInterval(updateActivity, 30000);

    // 清理函数
    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('beforeunload', handlePageView);
      clearInterval(intervalId);

      // 结束会话
      if (sessionId.current) {
        supabase
          .from('user_sessions')
          .update({
            session_end: new Date().toISOString(),
          })
          .eq('id', sessionId.current)
          .then(({ error }) => {
            if (error) {
              console.error('Failed to end session:', error);
            }
          });
      }
    };
  }, []);
}
