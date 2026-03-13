import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useCreatorDashboard, TimePeriod } from '@/hooks/useCreatorDashboard';
import DashboardMetricsCards from './DashboardMetricsCards';
import TrendChart from './TrendChart';
import TopWorksList from './TopWorksList';
import AudienceInsights from './AudienceInsights';
import { 
  Calendar, 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  FileText,
  RefreshCw,
  Loader2,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';

const timePeriods: { value: TimePeriod; label: string }[] = [
  { value: '7d', label: '近7天' },
  { value: '30d', label: '近30天' },
  { value: '90d', label: '近90天' },
  { value: '1y', label: '近1年' },
  { value: 'all', label: '全部' },
];

const CreatorDashboardPage: React.FC = () => {
  const { isDark } = useTheme();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
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
    setPeriod,
    setGranularity,
    refresh,
    exportData,
  } = useCreatorDashboard();

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'json' | 'excel') => {
    setIsExporting(true);
    try {
      await exportData(format);
      setShowExportMenu(false);
    } catch (err) {
      console.error('导出失败:', err);
    } finally {
      setIsExporting(false);
    }
  };

  if (authLoading || (loading && !metrics)) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className={`p-8 rounded-3xl text-center ${
          isDark ? 'bg-slate-800' : 'bg-white'
        } shadow-xl border ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            数据看板
          </h2>
          <p className={`mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
        <div className={`p-8 rounded-3xl text-center ${
          isDark ? 'bg-slate-800' : 'bg-white'
        } shadow-xl border ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
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
        <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          数据洞察
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                最佳发布时间
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              根据数据分析，你的受众在 <strong className={isDark ? 'text-white' : 'text-slate-900'}>晚上 8-10 点</strong> 最活跃，建议在此时间段发布作品。
            </p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                内容建议
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              你的 <strong className={isDark ? 'text-white' : 'text-slate-900'}>视觉类作品</strong> 互动率最高，建议继续深耕此类内容。
            </p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-4 h-4 text-purple-500" />
              <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                数据报告
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              点击上方 <strong className={isDark ? 'text-white' : 'text-slate-900'}>"导出"</strong> 按钮，下载详细的数据分析报告。
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CreatorDashboardPage;
