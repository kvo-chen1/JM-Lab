import { useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import GradientHero from '@/components/GradientHero';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { useAnalyticsStore } from '@/stores/useAnalyticsStore';

// 数据分析页面
export default function Analytics() {
  const { isDark } = useTheme();
  const { logUserAction } = useAnalyticsStore();

  useEffect(() => {
    // 记录页面访问
    logUserAction('page_view', { page: 'analytics_dashboard', timestamp: Date.now() });
  }, [logUserAction]);

  return (
    <main className="container mx-auto px-4 py-8">
      <GradientHero 
        title="数据分析与洞察" 
        subtitle="深入了解作品表现、用户活动和主题趋势"
        theme="indigo"
        stats={[
          { label: '总数据点数', value: '10,000+' },
          { label: '分析维度', value: '7+' },
          { label: '实时更新', value: 'Yes' }
        ]}
        pattern={true}
        size="md"
        // 中文注释：使用数据分析主题的背景图片
        backgroundImage="https://picsum.photos/id/3/2000/1000"
      />

      <div className="mt-8">
        <AnalyticsDashboard />
      </div>
    </main>
  );
}