/**
 * 平台统计数据 Hook
 */
import { useState, useEffect } from 'react';
import productService, { PlatformStats } from '@/services/productService';

// 获取平台统计数据
export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats>({
    totalWorks: 0,
    totalCreators: 0,
    activeUsers: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await productService.getPlatformStats();
        setStats(result);
      } catch (err: any) {
        setError(err.message || '获取平台统计数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}
