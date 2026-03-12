/**
 * 平台统计数据 Hook
 */
import { useState, useEffect } from 'react';
import productService from '@/services/productService';

export interface PlatformStats {
  totalProducts: number;
  totalBrands: number;
  totalOrders: number;
  positiveRate: number;
}

// 获取平台统计数据
export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats>({
    totalProducts: 0,
    totalBrands: 0,
    totalOrders: 0,
    positiveRate: 99,
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
