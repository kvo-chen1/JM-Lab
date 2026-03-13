import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import useCreatorDashboard, { TimePeriod, ReportSchedule } from '@/hooks/useCreatorDashboard';
import { TimeGranularity } from '@/services/creatorDashboardService';
import DashboardMetricsCards from '@/components/creator-dashboard/DashboardMetricsCards';
import TrendChart from '@/components/creator-dashboard/TrendChart';
import TopWorksList from '@/components/creator-dashboard/TopWorksList';
import AudienceInsights from '@/components/creator-dashboard/AudienceInsights';
import { 
  RefreshCw, 
  Download, 
  FileText, 
  FileSpreadsheet,
  FileJson,
  AlertCircle,
  Calendar,
  Clock,
  Bell,
  BellOff,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';

const timePeriods: { value: TimePeriod; label: string }[] = [
  { value: '7d', label: '近7天' },
  { value: '30d', label: '近30天' },
  { value: '90d', label: '近90天' },
  { value: '1y', label: '近1年' },
  { value: 'all', label: '全部' },
];

const scheduleOptions: { value: ReportSchedule; label: string }[] = [
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
];

const CreatorDashboardPage: React.FC = () => {
  const { isDark } = useTheme();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    metrics,
    trendData,
    topWorks,
    audienceInsights,
    deviceDistribution,
    loading,
    error,
    period,
    granularity,
    subscription,
    setPeriod,
    setGranularity,
    refresh,
    exportData,
    subscribeReport,
    unsubscribeReport,
  } = useCreatorDashboard();

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSubscribeMenu, setShowSubscribeMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleExport = useCallback(async (format: 'csv' | 'json' | 'excel') => {
    setIsExporting(true);
    try {
      await exportData(format);
      setShowExportMenu(false);
    } catch (err) {
      console.error('导出失败:', err);
      alert('导出失败，请稍后重试');
    } finally {
      setIsExporting(false);
    }
  }, [exportData]);

  const handleSubscribe = useCallback(async (schedule: ReportSchedule) => {
    setIsSubscribing(true);
    try {
      await subscribeReport(schedule);
      setShowSubscribeMenu(false);
      alert(`已成功订阅${scheduleOptions.find(s => s.value === schedule)?.label}报告`);
    } catch (err) {
      console.error('订阅失败:', err);
      alert('订阅失败，请稍后重试');
    } finally {
      setIsSubscribing(false);
    }
  }, [subscribeReport]);

  const handleUnsubscribe = useCallback(async () => {
    setIsSubscribing(true);
    try {
      await unsubscribeReport();
      setShowSubscribeMenu(false);
      alert('已取消订阅');
    } catch (err) {
      console.error('取消订阅失败:', err);
      alert('取消订阅失败，请稍后重试');
    } finally {
      setIsSubscribing(false);
    }
  }, [unsubscribeReport]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className={`p-8 rounded-3xl text-center ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-xl border ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            数据看板
          </h2>
          <p className={`mb-8 text-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            登录后即可查看你的创作数据分析
          </p>
          <Link to="/login">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25"
            >
              立即登录
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className={`p-8 rounded-3xl text-center ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-xl border ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            加载失败
          </h2>
          <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {error}
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={refresh}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium"
          >
            重试
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            数据看板
          </h1>
          <p className={`mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            深入了解你的创作表现和受众画像
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex rounded-lg overflow-hidden border ${
            isDark ? 'border-slate-700' : 'border-slate-200'
          }`}>
            {timePeriods.map(tp => (
              <button
                key={tp.value}
                onClick={() => setPeriod(tp.value)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  period === tp.value
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tp.label}
              </button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={refresh}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isDark 
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            } transition-colors disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </motion.button>

          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowSubscribeMenu(!showSubscribeMenu)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                subscription
                  ? isDark 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : isDark 
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              } transition-colors`}
            >
              {subscription ? (
                <>
                  <Bell className="w-4 h-4" />
                  已订阅
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4" />
                  订阅
                </>
              )}
            </motion.button>

            {showSubscribeMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-lg z-50 ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700' 
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="p-2">
                  <p className={`px-3 py-2 text-xs font-medium ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    选择报告频率
                  </p>
                  {scheduleOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleSubscribe(option.value)}
                      disabled={isSubscribing}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        subscription?.schedule === option.value
                          ? isDark 
                            ? 'bg-emerald-600/20 text-emerald-400' 
                            : 'bg-emerald-50 text-emerald-600'
                          : isDark 
                            ? 'text-slate-300 hover:bg-slate-700' 
                            : 'text-slate-600 hover:bg-slate-100'
                      } disabled:opacity-50`}
                    >
                      <span>{option.label}报告</span>
                      {subscription?.schedule === option.value && (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  ))}
                  {subscription && (
                    <button
                      onClick={handleUnsubscribe}
                      disabled={isSubscribing}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isDark 
                          ? 'text-red-400 hover:bg-slate-700' 
                          : 'text-red-500 hover:bg-red-50'
                      } disabled:opacity-50`}
                    >
                      <BellOff className="w-4 h-4" />
                      取消订阅
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowExportMenu(!showExportMenu)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isDark 
                  ? 'bg-blue-600 text-white hover:bg-blue-500' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              } transition-colors`}
            >
              <Download className="w-4 h-4" />
              导出
            </motion.button>

            {showExportMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`absolute right-0 mt-2 w-48 rounded-xl border shadow-lg z-50 ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700' 
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="p-2">
                  {[
                    { format: 'csv' as const, icon: FileText, label: '导出 CSV' },
                    { format: 'excel' as const, icon: FileSpreadsheet, label: '导出 Excel' },
                    { format: 'json' as const, icon: FileJson, label: '导出 JSON' },
                  ].map(item => (
                    <button
                      key={item.format}
                      onClick={() => handleExport(item.format)}
                      disabled={isExporting}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isDark 
                          ? 'text-slate-300 hover:bg-slate-700' 
                          : 'text-slate-600 hover:bg-slate-100'
                      } disabled:opacity-50`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <DashboardMetricsCards metrics={metrics} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart
            data={trendData}
            loading={loading}
            granularity={granularity}
            onGranularityChange={setGranularity}
          />
        </div>
        <div>
          <TopWorksList works={topWorks} loading={loading} />
        </div>
      </div>

      <AudienceInsights
        audienceData={audienceInsights}
        deviceData={deviceDistribution}
        loading={loading}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`p-6 rounded-2xl border ${
          isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-slate-100'
        } shadow-sm`}
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
            数据更新时间
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              数据统计周期
            </p>
            <p className={`font-semibold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {timePeriods.find(tp => tp.value === period)?.label || '-'}
            </p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              最后更新
            </p>
            <p className={`font-semibold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {new Date().toLocaleString('zh-CN')}
            </p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              数据来源
            </p>
            <p className={`font-semibold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              实时数据
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CreatorDashboardPage;
