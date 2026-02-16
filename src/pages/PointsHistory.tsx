import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { usePoints } from '@/contexts/PointsContext';
import pointsService, { PointsRecord, PointsSource } from '@/services/pointsService';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Filter, 
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  Gift,
  ShoppingCart,
  CheckCircle,
  Star,
  Zap
} from 'lucide-react';

// 积分来源图标映射
const sourceIcons: Record<PointsSource, React.ReactNode> = {
  achievement: <Star className="w-4 h-4" />,
  task: <CheckCircle className="w-4 h-4" />,
  daily: <Calendar className="w-4 h-4" />,
  consumption: <ShoppingCart className="w-4 h-4" />,
  exchange: <Gift className="w-4 h-4" />,
  system: <Zap className="w-4 h-4" />
};

// 积分来源标签映射
const sourceLabels: Record<PointsSource, string> = {
  achievement: '成就奖励',
  task: '任务奖励',
  daily: '每日签到',
  consumption: '消费返积分',
  exchange: '积分兑换',
  system: '系统奖励'
};

// 积分来源颜色映射
const sourceColors: Record<PointsSource, string> = {
  achievement: 'bg-purple-500',
  task: 'bg-blue-500',
  daily: 'bg-green-500',
  consumption: 'bg-orange-500',
  exchange: 'bg-red-500',
  system: 'bg-gray-500'
};

const PointsHistory: React.FC = () => {
  const { isDark } = useTheme();
  const { currentPoints, stats } = usePoints();
  
  const [records, setRecords] = useState<PointsRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<PointsRecord[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | 'earned' | 'spent'>('all');
  const [selectedSource, setSelectedSource] = useState<PointsSource | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const itemsPerPage = 10;

  // 加载积分记录
  useEffect(() => {
    setIsLoading(true);
    const allRecords = pointsService.getPointsRecords(undefined, 1000);
    setRecords(allRecords);
    setFilteredRecords(allRecords);
    setIsLoading(false);
  }, []);

  // 过滤记录
  useEffect(() => {
    let result = [...records];

    // 按类型筛选
    if (selectedType !== 'all') {
      result = result.filter(r => 
        selectedType === 'earned' ? r.points > 0 : r.points < 0
      );
    }

    // 按来源筛选
    if (selectedSource !== 'all') {
      result = result.filter(r => r.type === selectedSource);
    }

    // 按日期筛选
    if (dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const weekAgo = today - 7 * 24 * 60 * 60 * 1000;
      const monthAgo = today - 30 * 24 * 60 * 60 * 1000;

      result = result.filter(r => {
        const recordTime = new Date(r.date).getTime();
        switch (dateRange) {
          case 'today':
            return recordTime >= today;
          case 'week':
            return recordTime >= weekAgo;
          case 'month':
            return recordTime >= monthAgo;
          default:
            return true;
        }
      });
    }

    // 按搜索词筛选
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.source.toLowerCase().includes(lowerQuery) ||
        r.description.toLowerCase().includes(lowerQuery)
      );
    }

    setFilteredRecords(result);
    setCurrentPage(1);
  }, [records, selectedType, selectedSource, dateRange, searchQuery]);

  // 分页
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  // 导出数据
  const handleExport = () => {
    const data = filteredRecords.map(r => ({
      日期: new Date(r.date).toLocaleString('zh-CN'),
      来源: r.source,
      类型: sourceLabels[r.type],
      积分变动: r.points > 0 ? `+${r.points}` : r.points,
      余额: r.balanceAfter,
      描述: r.description
    }));

    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `积分记录_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // 格式化数字
  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) {
      return '0';
    }
    return num.toLocaleString('zh-CN');
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // 今天
    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
      return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // 昨天
    if (diff < 48 * 60 * 60 * 1000 && date.getDate() === now.getDate() - 1) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <main className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">积分明细</h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            查看您的积分变动记录和统计
          </p>
        </div>

        {/* 积分概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-xl ${isDark ? 'bg-yellow-500/20' : 'bg-yellow-100'}`}>
                <Coins className="w-6 h-6 text-yellow-500" />
              </div>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>当前积分</span>
            </div>
            <div className="text-3xl font-bold">{formatNumber(currentPoints)}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-xl ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>累计获得</span>
            </div>
            <div className="text-3xl font-bold text-green-500">+{formatNumber(stats.totalEarned)}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-xl ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
                <TrendingDown className="w-6 h-6 text-red-500" />
              </div>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>累计消耗</span>
            </div>
            <div className="text-3xl font-bold text-red-500">-{formatNumber(stats.totalSpent)}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>记录总数</span>
            </div>
            <div className="text-3xl font-bold text-blue-500">{formatNumber(records.length)}</div>
          </motion.div>
        </div>

        {/* 筛选和搜索 */}
        <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg mb-6`}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="搜索记录..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl border-2 transition-all ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 focus:border-red-500 text-white placeholder-gray-500' 
                    : 'bg-gray-50 border-gray-200 focus:border-red-500 text-gray-900 placeholder-gray-400'
                } focus:outline-none`}
              />
            </div>

            {/* 类型筛选 */}
            <div className="flex gap-2">
              {[
                { value: 'all', label: '全部' },
                { value: 'earned', label: '收入' },
                { value: 'spent', label: '支出' }
              ].map(type => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedType === type.value 
                      ? isDark 
                        ? 'bg-red-600 text-white' 
                        : 'bg-red-500 text-white'
                      : isDark 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* 来源筛选 */}
            <div className="flex gap-2">
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value as PointsSource | 'all')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-100 border-gray-200 text-gray-700'
                } focus:outline-none`}
              >
                <option value="all">全部来源</option>
                {Object.entries(sourceLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* 日期筛选 */}
            <div className="flex gap-2">
              {[
                { value: 'all', label: '全部时间' },
                { value: 'today', label: '今天' },
                { value: 'week', label: '本周' },
                { value: 'month', label: '本月' }
              ].map(range => (
                <button
                  key={range.value}
                  onClick={() => setDateRange(range.value as any)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    dateRange === range.value 
                      ? isDark 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-500 text-white'
                      : isDark 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* 导出按钮 */}
            <button
              onClick={handleExport}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isDark 
                  ? 'bg-green-600 hover:bg-green-500 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              <Download className="w-4 h-4" />
              导出
            </button>
          </div>
        </div>

        {/* 记录列表 */}
        <div className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg overflow-hidden`}>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
                isDark ? 'border-red-500' : 'border-red-600'
              }`}></div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <Filter className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>没有找到匹配的记录</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>类型</th>
                      <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>来源</th>
                      <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>描述</th>
                      <th className={`text-right p-4 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>积分变动</th>
                      <th className={`text-right p-4 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>余额</th>
                      <th className={`text-right p-4 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {paginatedRecords.map((record, index) => (
                        <motion.tr
                          key={record.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.03 }}
                          className={`${isDark ? 'border-b border-gray-700' : 'border-b border-gray-200'} last:border-0 hover:${
                            isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                          } transition-colors`}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className={`p-2 rounded-lg ${sourceColors[record.type]} text-white`}>
                                {sourceIcons[record.type]}
                              </div>
                              <span className="text-sm">{sourceLabels[record.type]}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-medium">{record.source}</span>
                          </td>
                          <td className="p-4">
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {record.description}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <span className={`font-bold ${record.points > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {record.points > 0 ? '+' : ''}{formatNumber(record.points)}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <span className="font-medium">{formatNumber(record.balanceAfter)}</span>
                          </td>
                          <td className="p-4 text-right">
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {formatDate(record.date)}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      共 {filteredRecords.length} 条记录，第 {currentPage} / {totalPages} 页
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg transition-all ${
                          currentPage === 1
                            ? isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 h-10 rounded-lg font-medium transition-all ${
                              currentPage === pageNum
                                ? isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                                : isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-lg transition-all ${
                          currentPage === totalPages
                            ? isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 来源统计 */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">积分来源分布</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(stats.sourceStats).map(([source, count]) => (
              <motion.div
                key={source}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
              >
                <div className={`p-2 rounded-lg ${sourceColors[source as PointsSource]} text-white w-fit mb-2`}>
                  {sourceIcons[source as PointsSource]}
                </div>
                <div className="text-sm opacity-70">{sourceLabels[source as PointsSource]}</div>
                <div className="text-xl font-bold">{formatNumber(count)}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PointsHistory;
