import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useAnalyticsStore } from '@/stores/useAnalyticsStore';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import GradientHero from '@/components/GradientHero';
import AnalyticsLayout from '@/components/analytics/AnalyticsLayout';
import LeftSidebar from '@/components/analytics/LeftSidebar';
import MainContent from '@/components/analytics/MainContent';
import RightSidebar from '@/components/analytics/RightSidebar';
import MobileFilterDrawer from '@/components/analytics/MobileFilterDrawer';
import analyticsService, { 
  MetricType, 
  TimeRange, 
  GroupBy,
  AnalyticsQueryParams,
  ExportFormat
} from '@/services/analyticsService';

type ChartType = 'line' | 'bar' | 'pie' | 'area';

export default function Analytics() {
  const { isDark } = useTheme();
  const { logUserAction, fetchData, subscribeToRealtime, unsubscribeFromRealtime } = useAnalyticsStore();
  
  // 状态管理
  const [activeMetric, setActiveMetric] = useState<MetricType>('views');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // 记录页面访问
  useEffect(() => {
    logUserAction('page_view', { page: 'analytics_dashboard', timestamp: Date.now() });
  }, [logUserAction]);

  // 数据获取
  useEffect(() => {
    const queryParams: AnalyticsQueryParams = {
      metric: activeMetric,
      timeRange: timeRange,
      groupBy: groupBy,
    };

    fetchData(queryParams);
    subscribeToRealtime();

    return () => {
      unsubscribeFromRealtime();
    };
  }, [activeMetric, timeRange, groupBy, fetchData, subscribeToRealtime, unsubscribeFromRealtime]);

  // 导出处理
  const handleExport = useCallback(async (format: ExportFormat) => {
    const queryParams: AnalyticsQueryParams = {
      metric: activeMetric,
      timeRange: timeRange,
      groupBy: groupBy,
    };
    await analyticsService.downloadExport(queryParams, format);
  }, [activeMetric, timeRange, groupBy]);

  // Hero 区域
  const heroHeader = (
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
      backgroundImage="https://picsum.photos/id/3/2000/1000"
    />
  );

  // 移动端筛选按钮
  const MobileFilterButton = () => (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setIsMobileFilterOpen(true)}
      className={`lg:hidden fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg ${
        isDark 
          ? 'bg-slate-800 text-white border border-slate-700' 
          : 'bg-white text-slate-700 border border-slate-200'
      }`}
    >
      <SlidersHorizontal className="w-4 h-4" />
      <span className="text-sm font-medium">筛选</span>
    </motion.button>
  );

  return (
    <>
      <AnalyticsLayout
        header={heroHeader}
        leftSidebar={
          <LeftSidebar
            activeMetric={activeMetric}
            setActiveMetric={setActiveMetric}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            chartType={chartType}
            setChartType={setChartType}
            groupBy={groupBy}
            setGroupBy={setGroupBy}
          />
        }
        mainContent={
          <MainContent
            activeMetric={activeMetric}
            timeRange={timeRange}
            chartType={chartType}
            groupBy={groupBy}
            onExport={handleExport}
          />
        }
        rightSidebar={
          <RightSidebar
            onExport={handleExport}
          />
        }
      />

      {/* 移动端筛选按钮 */}
      <MobileFilterButton />

      {/* 移动端筛选抽屉 */}
      <MobileFilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        activeMetric={activeMetric}
        setActiveMetric={setActiveMetric}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        chartType={chartType}
        setChartType={setChartType}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
      />
    </>
  );
}
