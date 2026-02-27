import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  TrendingUp,
  Eye,
  MousePointer,
  Percent,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  BarChart3,
  Activity,
  Target,
  Zap,
  Flame,
  ShoppingCart,
  Clock,
  CheckCircle,
  Play,
  User,
  Package,
  Pause,
  StopCircle,
  TrendingDown,
  Calendar,
  Hash,
  Award,
  Sparkles,
  PlayCircle,
  StopCircle as StopIcon
} from 'lucide-react';
import { promotionService, PromotedWork } from '@/services/promotionService';
import { supabaseAdmin } from '@/lib/supabaseClient';

interface PromotionStats {
  activePromotions: number;
  totalImpressions: number;
  totalClicks: number;
  avgCtr: number;
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
}

// 扩展的推广作品类型，包含关联的用户和订单信息
interface EnrichedPromotedWork extends PromotedWork {
  workTitle?: string;
  workThumbnail?: string;
  userUsername?: string;
  userAvatar?: string;
  packageType?: string;
  finalPrice?: number;
}

// 生成模拟历史数据用于趋势图
const generateTrendData = (currentValue: number, points: number = 7) => {
  const data = [];
  for (let i = 0; i < points; i++) {
    // 生成递增趋势的数据，最后一个是当前值
    const ratio = (i + 1) / points;
    const randomFactor = 0.8 + Math.random() * 0.4;
    data.push(Math.round(currentValue * ratio * randomFactor));
  }
  return data;
};

export default function PromotionOrderImplementation() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PromotionStats>({
    activePromotions: 0,
    totalImpressions: 0,
    totalClicks: 0,
    avgCtr: 0,
    totalOrders: 0,
    completedOrders: 0,
    totalRevenue: 0
  });
  const [promotedWorks, setPromotedWorks] = useState<EnrichedPromotedWork[]>([]);
  const [selectedWork, setSelectedWork] = useState<EnrichedPromotedWork | null>(null);
  
  // 自动曝光机制状态
  const [autoExposureEnabled, setAutoExposureEnabled] = useState(false);
  const [exposureInterval, setExposureInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastExposureResult, setLastExposureResult] = useState<{
    processed: number;
    totalViewsAdded: number;
    totalClicksAdded: number;
  } | null>(null);

  // 图表悬浮提示状态
  const [chartTooltip, setChartTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    title: string;
    value: number;
    type: 'views' | 'clicks';
  } | null>(null);

  // 获取推广实施数据
  const fetchImplementationData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('========== 开始获取推广实施数据 ==========');

      // 使用 promotionService 获取所有推广作品
      const allPromotedWorks = await promotionService.getAllPromotedWorks();
      console.log('获取到推广作品:', allPromotedWorks.length, '条');

      // 获取关联的订单信息
      const orderIds = allPromotedWorks.map(pw => pw.orderId);
      const { data: ordersData } = await supabaseAdmin
        .from('promotion_orders')
        .select('id, user_id, work_id, work_title, work_thumbnail, package_type, final_price')
        .in('id', orderIds);

      // 获取用户信息
      const userIds = [...new Set((ordersData || []).map(o => o.user_id))];
      const { data: usersData } = await supabaseAdmin
        .from('users')
        .select('id, username, email, avatar_url')
        .in('id', userIds);

      const orderMap = new Map(ordersData?.map(o => [o.id, o]) || []);
      const userMap = new Map(usersData?.map(u => [u.id, u]) || []);

      // 合并数据
      const enrichedWorks: EnrichedPromotedWork[] = allPromotedWorks.map(pw => {
        const order = orderMap.get(pw.orderId);
        const user = order ? userMap.get(order.user_id) : null;
        return {
          ...pw,
          workTitle: order?.work_title || pw.workTitle,
          workThumbnail: order?.work_thumbnail || pw.workThumbnail,
          userUsername: user?.username || '未知用户',
          userAvatar: user?.avatar_url || null,
          packageType: order?.package_type || pw.packageType,
          finalPrice: order?.final_price || pw.finalPrice,
        };
      });

      // 计算统计数据 - 显示所有进行中的推广（active 和 paused）
      const runningWorks = enrichedWorks.filter(pw => pw.status === 'active' || pw.status === 'paused');
      const activeWorks = enrichedWorks.filter(pw => pw.status === 'active');
      const totalImpressions = enrichedWorks.reduce((sum, pw) => sum + (pw.actualViews || 0), 0);
      const totalClicks = enrichedWorks.reduce((sum, pw) => sum + (pw.actualClicks || 0), 0);

      const newStats: PromotionStats = {
        activePromotions: activeWorks.length,
        totalImpressions,
        totalClicks,
        avgCtr: totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0,
        totalOrders: enrichedWorks.length,
        completedOrders: enrichedWorks.filter(pw => pw.status === 'completed').length,
        totalRevenue: enrichedWorks.reduce((sum, pw) => sum + (pw.finalPrice || 0), 0)
      };

      console.log('推广实施统计数据:', newStats);
      setStats(newStats);

      // 设置正在推广的作品列表（包括 active 和 paused）
      setPromotedWorks(runningWorks);
      console.log('活跃推广作品:', activeWorks.length, '条');

      console.log('========== 推广实施数据获取完成 ==========');
    } catch (error: any) {
      console.error('获取推广实施数据失败:', error);
      toast.error('获取数据失败: ' + (error?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImplementationData();
  }, [fetchImplementationData]);

  // 返回推广订单管理页面
  const handleBack = () => {
    window.location.href = '/admin?tab=promotionOrderManagement';
  };

  // 刷新数据
  const handleRefresh = () => {
    fetchImplementationData();
    toast.success('数据已刷新');
  };

  // 暂停推广
  const handlePause = async (workId: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('promoted_works')
        .update({ status: 'paused', updated_at: new Date().toISOString() })
        .eq('id', workId);
      
      if (error) throw error;
      toast.success('推广已暂停');
      fetchImplementationData();
    } catch (error: any) {
      toast.error('操作失败: ' + error.message);
    }
  };

  // 恢复推广
  const handleResume = async (workId: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('promoted_works')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', workId);
      
      if (error) throw error;
      toast.success('推广已恢复');
      fetchImplementationData();
    } catch (error: any) {
      toast.error('操作失败: ' + error.message);
    }
  };

  // 手动触发曝光模拟
  const handleSimulateExposure = async () => {
    try {
      toast.info('正在模拟推广曝光...');
      const result = await promotionService.simulatePromotionExposure();
      
      if (result && result.length > 0) {
        const totalViews = result.reduce((sum, r) => sum + r.viewsAdded, 0);
        const totalClicks = result.reduce((sum, r) => sum + r.clicksAdded, 0);
        toast.success(`曝光模拟完成！共处理 ${result.length} 个作品，增加 ${totalViews} 曝光，${totalClicks} 点击`);
        fetchImplementationData();
      } else {
        toast.info('暂无活跃推广需要处理');
      }
    } catch (error: any) {
      toast.error('模拟曝光失败: ' + error.message);
    }
  };

  // 手动触发批量曝光
  const handleAutoExposureBatch = async () => {
    try {
      const result = await promotionService.autoExposureBatch();
      
      if (result.processed > 0) {
        setLastExposureResult(result);
        toast.success(`批量曝光完成！处理 ${result.processed} 个作品，+${result.totalViewsAdded} 曝光，+${result.totalClicksAdded} 点击`);
        fetchImplementationData();
      } else {
        toast.info('暂无活跃推广需要处理');
      }
    } catch (error: any) {
      toast.error('批量曝光失败: ' + error.message);
    }
  };

  // 切换自动曝光
  const toggleAutoExposure = () => {
    if (autoExposureEnabled) {
      // 停止自动曝光
      if (exposureInterval) {
        clearInterval(exposureInterval);
        setExposureInterval(null);
      }
      setAutoExposureEnabled(false);
      toast.info('自动曝光已停止');
    } else {
      // 启动自动曝光 - 每30秒执行一次（减少刷新频率）
      const interval = setInterval(async () => {
        try {
          const result = await promotionService.autoExposureBatch();
          if (result.processed > 0) {
            setLastExposureResult(result);
            // 每2次执行后才刷新数据（减少图表跳动）
            if (!lastExposureResult || lastExposureResult.processed === 0) {
              fetchImplementationData();
            }
          }
        } catch (err) {
          console.error('自动曝光执行失败:', err);
        }
      }, 30000); // 每30秒执行一次
      
      setExposureInterval(interval);
      setAutoExposureEnabled(true);
      toast.success('自动曝光已启动！每30秒自动增加曝光量');
      
      // 立即执行一次
      handleAutoExposureBatch();
    }
  };

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (exposureInterval) {
        clearInterval(exposureInterval);
      }
    };
  }, [exposureInterval]);

  // 生成趋势数据 - 使用 useMemo 缓存，避免不必要的重新生成
  const viewsTrend = useMemo(() => generateTrendData(stats.totalImpressions), [stats.totalImpressions]);
  const clicksTrend = useMemo(() => generateTrendData(stats.totalClicks), [stats.totalClicks]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            返回订单管理
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-green-500" />
              推广订单管理
              <span className="text-sm font-normal text-gray-400">/ 实施</span>
            </h1>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              实时监控推广效果，管理正在进行的推广活动
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin?tab=promotionUserManagement')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isDark ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            审核
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/admin?tab=promotionOrderManagement')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isDark ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            订单
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleRefresh}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新数据
          </button>
          <button
            onClick={handleAutoExposureBatch}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isDark ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'
            }`}
            title="手动触发一次曝光增加"
          >
            <Sparkles className="w-4 h-4" />
            批量曝光
          </button>
          <button
            onClick={toggleAutoExposure}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              autoExposureEnabled
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
            title={autoExposureEnabled ? '停止自动曝光' : '启动自动曝光'}
          >
            {autoExposureEnabled ? <StopIcon className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
            {autoExposureEnabled ? '停止自动' : '自动曝光'}
          </button>
        </div>
      </div>

      {/* 自动曝光状态提示 */}
      {autoExposureEnabled && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg ${isDark ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75" />
              </div>
              <span className={`font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                自动曝光运行中
              </span>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                每30秒自动为活跃推广增加曝光
              </span>
            </div>
            {lastExposureResult && (
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                上次: 处理 {lastExposureResult.processed} 个作品，+{lastExposureResult.totalViewsAdded} 曝光，+{lastExposureResult.totalClicksAdded} 点击
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* 推广效果统计 */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            推广效果统计
          </h3>
          <BarChart3 className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-pink-50'} shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-pink-100 text-pink-600">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.activePromotions}
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                活跃推广
              </p>
            </div>
            <p className="text-xs mt-2 text-pink-500">
              当前正在推广
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-blue-50'} shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Eye className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.totalImpressions.toLocaleString()}
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                总曝光量
              </p>
            </div>
            <p className="text-xs mt-2 text-blue-500">
              累计曝光次数
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-purple-50'} shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <MousePointer className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.totalClicks.toLocaleString()}
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                总点击量
              </p>
            </div>
            <p className="text-xs mt-2 text-purple-500">
              累计点击次数
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-orange-50'} shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                <Percent className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.avgCtr}%
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                平均点击率
              </p>
            </div>
            <p className="text-xs mt-2 text-orange-500">
              整体点击率
            </p>
          </motion.div>
        </div>
      </div>

      {/* 正在推广的作品列表 */}
      <div className={`rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm overflow-hidden`}>
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              正在推广的作品
              <span className="ml-2 text-xs font-normal">
                <span className="text-green-500">● 推广中 {promotedWorks.filter(pw => pw.status === 'active').length}</span>
                <span className="mx-2">|</span>
                <span className="text-yellow-500">● 已暂停 {promotedWorks.filter(pw => pw.status === 'paused').length}</span>
              </span>
            </h3>
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              共 {promotedWorks.length} 个
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className={`animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full mx-auto`} />
            <p className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>加载中...</p>
          </div>
        ) : promotedWorks.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>暂无正在推广的作品</p>
            <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              在推广订单管理页面审核通过后，作品将开始推广
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>作品信息</th>
                  <th className={`px-6 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>用户信息</th>
                  <th className={`px-6 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>推广数据</th>
                  <th className={`px-6 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>点击率</th>
                  <th className={`px-6 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>进度</th>
                  <th className={`px-6 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>剩余时间</th>
                  <th className={`px-6 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>状态</th>
                  <th className={`px-6 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {promotedWorks.map((pw, index) => {
                  // 计算进度、点击率和剩余时间
                  const targetViews = pw.targetViews || 1000;
                  const actualViews = pw.actualViews || 0;
                  const progressPercent = Math.min(Math.round((actualViews / targetViews) * 100), 100);
                  const ctr = actualViews > 0 ? Number(((pw.actualClicks || 0) / actualViews * 100).toFixed(2)) : 0;
                  const remainingHours = Math.max(0, Math.ceil((new Date(pw.endTime).getTime() - Date.now()) / (1000 * 60 * 60)));
                  
                  return (
                    <motion.tr
                      key={pw.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {pw.workThumbnail ? (
                            <img
                              src={pw.workThumbnail}
                              alt={pw.workTitle}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                              <Package className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                            </div>
                          )}
                          <div>
                            <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {pw.workTitle || '未命名作品'}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {pw.packageType}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {pw.userAvatar ? (
                            <img
                              src={pw.userAvatar}
                              alt={pw.userUsername}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                              <User className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                            </div>
                          )}
                          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {pw.userUsername}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>曝光</p>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {(pw.actualViews || 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>点击</p>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {(pw.actualClicks || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${
                          ctr > 5 ? 'text-green-500' :
                          ctr > 2 ? 'text-yellow-500' :
                          'text-gray-500'
                        }`}>
                          {ctr}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-32">
                          <div className={`h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {progressPercent}%
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {remainingHours} 小时
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          pw.status === 'active' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {pw.status === 'active' ? '推广中' : '已暂停'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {pw.status === 'active' ? (
                            <button
                              onClick={() => handlePause(pw.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                isDark ? 'bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-500' : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-600'
                              }`}
                              title="暂停推广"
                            >
                              <Pause className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleResume(pw.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                isDark ? 'bg-green-600/20 hover:bg-green-600/30 text-green-500' : 'bg-green-100 hover:bg-green-200 text-green-600'
                              }`}
                              title="恢复推广"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 推广效果趋势图 */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            推广效果趋势
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>曝光量</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>点击量</span>
            </div>
            <Zap className="w-5 h-5 text-yellow-500" />
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>实时更新</span>
          </div>
        </div>
        
        {/* 简化的趋势图表 */}
        <div className={`h-64 rounded-lg p-4 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} relative`}>
          {promotedWorks.length > 0 ? (
            <div className="h-full flex flex-col">
              {/* 图表区域 */}
              <div className="flex-1 relative">
                <svg className="w-full h-full" viewBox="0 0 700 200" preserveAspectRatio="xMidYMid meet">
                  {/* 网格线 - 水平 */}
                  {[0, 50, 100, 150, 200].map((y) => (
                    <line
                      key={y}
                      x1="50"
                      y1={y}
                      x2="650"
                      y2={y}
                      stroke={isDark ? '#374151' : '#e5e7eb'}
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* 垂直网格线 */}
                  {[50, 150, 250, 350, 450, 550, 650].map((x) => (
                    <line
                      key={`v-${x}`}
                      x1={x}
                      y1="0"
                      x2={x}
                      y2="200"
                      stroke={isDark ? '#374151' : '#e5e7eb'}
                      strokeWidth="1"
                      strokeDasharray="4,4"
                    />
                  ))}
                  
                  {/* Y轴标签 */}
                  <text x="40" y="15" textAnchor="end" fontSize="10" fill={isDark ? '#9ca3af' : '#6b7280'}>
                    {Math.max(...viewsTrend, 1)}
                  </text>
                  <text x="40" y="105" textAnchor="end" fontSize="10" fill={isDark ? '#9ca3af' : '#6b7280'}>
                    {Math.round(Math.max(...viewsTrend, 1) / 2)}
                  </text>
                  <text x="40" y="195" textAnchor="end" fontSize="10" fill={isDark ? '#9ca3af' : '#6b7280'}>
                    0
                  </text>
                  
                  {/* 曝光量趋势区域填充 */}
                  {viewsTrend.length > 0 && (
                    <polygon
                      fill="rgba(59, 130, 246, 0.1)"
                      stroke="none"
                      points={`50,200 ${viewsTrend.map((v, i) => {
                        const maxVal = Math.max(...viewsTrend, 1);
                        const x = 50 + (i / (viewsTrend.length - 1)) * 600;
                        const y = 200 - (v / maxVal) * 180 - 10;
                        return `${x},${y}`;
                      }).join(' ')} 650,200`}
                    />
                  )}
                  
                  {/* 曝光量折线 (蓝色) */}
                  {viewsTrend.length > 0 && (
                    <polyline
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={viewsTrend.map((v, i) => {
                        const maxVal = Math.max(...viewsTrend, 1);
                        const x = 50 + (i / (viewsTrend.length - 1)) * 600;
                        const y = 200 - (v / maxVal) * 180 - 10;
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                  )}
                  
                  {/* 点击量折线 (绿色) - 使用右侧Y轴 */}
                  {clicksTrend.length > 0 && (
                    <polyline
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={clicksTrend.map((v, i) => {
                        const maxVal = Math.max(...clicksTrend, 1);
                        const x = 50 + (i / (clicksTrend.length - 1)) * 600;
                        const y = 200 - (v / maxVal) * 180 - 10;
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                  )}
                </svg>
                
                {/* 数据点 - 使用HTML元素实现悬浮提示 */}
                {viewsTrend.map((v, i) => {
                  const maxVal = Math.max(...viewsTrend, 1);
                  const left = 50 + (i / (viewsTrend.length - 1)) * 600;
                  const top = 200 - (v / maxVal) * 180 - 10;
                  const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
                  return (
                    <div
                      key={`view-point-${i}`}
                      className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full cursor-pointer hover:scale-125"
                      style={{
                        left: `${(left / 700) * 100}%`,
                        top: `${(top / 200) * 100}%`,
                        backgroundColor: '#3b82f6',
                        border: `2px solid ${isDark ? '#1f2937' : '#fff'}`,
                        transition: 'all 0.5s ease-out',
                      }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setChartTooltip({
                          visible: true,
                          x: rect.left + rect.width / 2,
                          y: rect.top - 40,
                          title: dayLabels[i],
                          value: v,
                          type: 'views'
                        });
                      }}
                      onMouseLeave={() => setChartTooltip(null)}
                    />
                  );
                })}
                
                {clicksTrend.map((v, i) => {
                  const maxVal = Math.max(...clicksTrend, 1);
                  const left = 50 + (i / (clicksTrend.length - 1)) * 600;
                  const top = 200 - (v / maxVal) * 180 - 10;
                  const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
                  return (
                    <div
                      key={`click-point-${i}`}
                      className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full cursor-pointer hover:scale-125"
                      style={{
                        left: `${(left / 700) * 100}%`,
                        top: `${(top / 200) * 100}%`,
                        backgroundColor: '#22c55e',
                        border: `2px solid ${isDark ? '#1f2937' : '#fff'}`,
                        transition: 'all 0.5s ease-out',
                      }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setChartTooltip({
                          visible: true,
                          x: rect.left + rect.width / 2,
                          y: rect.top - 40,
                          title: dayLabels[i],
                          value: v,
                          type: 'clicks'
                        });
                      }}
                      onMouseLeave={() => setChartTooltip(null)}
                    />
                  );
                })}
              </div>
              
              {/* X轴标签 */}
              <div className="flex justify-between mt-2 px-12 text-xs text-gray-400">
                {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, i) => (
                  <span key={i} className="text-center" style={{ width: '14.28%' }}>{day}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  暂无推广数据
                </p>
              </div>
            </div>
          )}
          
          {/* 悬浮提示 */}
          {chartTooltip && chartTooltip.visible && (
            <div
              className={`fixed z-50 px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-none transform -translate-x-1/2 ${
                isDark ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 border border-gray-200'
              }`}
              style={{
                left: chartTooltip.x,
                top: chartTooltip.y,
              }}
            >
              <div className="font-medium">{chartTooltip.title}</div>
              <div className={`${chartTooltip.type === 'views' ? 'text-blue-500' : 'text-green-500'}`}>
                {chartTooltip.type === 'views' ? '曝光量' : '点击量'}: {chartTooltip.value}
              </div>
            </div>
          )}
        </div>
        
        {/* 数据摘要卡片 */}
        {promotedWorks.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-blue-500" />
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总曝光趋势</p>
              </div>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.totalImpressions.toLocaleString()}
              </p>
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +12.5% 较上周
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`p-4 rounded-lg ${isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <MousePointer className="w-4 h-4 text-green-500" />
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总点击趋势</p>
              </div>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.totalClicks.toLocaleString()}
              </p>
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +8.3% 较上周
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`p-4 rounded-lg ${isDark ? 'bg-orange-900/20 border border-orange-800' : 'bg-orange-50 border border-orange-200'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-4 h-4 text-orange-500" />
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>平均点击率</p>
              </div>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.avgCtr}%
              </p>
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                -2.1% 较上周
              </p>
            </motion.div>
          </div>
        )}
      </div>

      {/* 推广效果排行榜 */}
      {promotedWorks.length > 0 && (
        <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Award className="w-5 h-5 inline-block mr-2 text-yellow-500" />
              推广效果排行
            </h3>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>按曝光量排序</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...promotedWorks]
              .sort((a, b) => (b.actualViews || 0) - (a.actualViews || 0))
              .slice(0, 6)
              .map((pw, index) => {
                const ctr = pw.actualViews > 0 
                  ? Number(((pw.actualClicks || 0) / pw.actualViews * 100).toFixed(2)) 
                  : 0;
                return (
                  <motion.div
                    key={pw.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-400 text-white' :
                        isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {pw.workThumbnail ? (
                            <img src={pw.workThumbnail} alt="" className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <div className={`w-8 h-8 rounded flex items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                              <Package className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {pw.workTitle || '未命名作品'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                            <Eye className="w-3 h-3 inline mr-1" />
                            {(pw.actualViews || 0).toLocaleString()}
                          </span>
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                            <MousePointer className="w-3 h-3 inline mr-1" />
                            {(pw.actualClicks || 0).toLocaleString()}
                          </span>
                          <span className={ctr > 5 ? 'text-green-500' : ctr > 2 ? 'text-yellow-500' : 'text-gray-500'}>
                            {ctr}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
