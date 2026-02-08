import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { X, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import LeftSidebar from './LeftSidebar';
import { MetricType, TimeRange, GroupBy } from '@/services/analyticsService';

type ChartType = 'line' | 'bar' | 'pie' | 'area';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeMetric: MetricType;
  setActiveMetric: (metric: MetricType) => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  chartType: ChartType;
  setChartType: (type: ChartType) => void;
  groupBy: GroupBy;
  setGroupBy: (group: GroupBy) => void;
}

export default function MobileFilterDrawer({
  isOpen,
  onClose,
  activeMetric,
  setActiveMetric,
  timeRange,
  setTimeRange,
  chartType,
  setChartType,
  groupBy,
  setGroupBy,
}: MobileFilterDrawerProps) {
  const { isDark } = useTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
          />
          
          {/* 抽屉内容 */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed left-0 top-0 bottom-0 w-[300px] z-50 overflow-y-auto lg:hidden ${
              isDark ? 'bg-slate-900' : 'bg-slate-50'
            }`}
          >
            {/* 头部 */}
            <div className={`sticky top-0 z-10 flex items-center justify-between px-4 py-4 border-b ${
              isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-red-500" />
                <h2 className="font-semibold">筛选条件</h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* 筛选内容 */}
            <div className="p-4">
              <LeftSidebar
                activeMetric={activeMetric}
                setActiveMetric={(metric) => {
                  setActiveMetric(metric);
                  onClose();
                }}
                timeRange={timeRange}
                setTimeRange={(range) => {
                  setTimeRange(range);
                  onClose();
                }}
                chartType={chartType}
                setChartType={(type) => {
                  setChartType(type);
                  onClose();
                }}
                groupBy={groupBy}
                setGroupBy={(group) => {
                  setGroupBy(group);
                  onClose();
                }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
