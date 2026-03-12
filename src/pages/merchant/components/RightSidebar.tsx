/**
 * 商家工作平台 - 右侧数据概览
 * 使用真实数据库数据
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Package,
  DollarSign,
  Users,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  CheckCircle2,
  Clock,
  Loader2
} from 'lucide-react';
import { merchantService, DashboardStats } from '@/services/merchantService';
import { toast } from 'sonner';

const RightSidebar: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // 获取真实数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const merchant = await merchantService.getCurrentMerchant();
        if (merchant) {
          const dashboardStats = await merchantService.getDashboardStats(merchant.id);
          setStats(dashboardStats);
        }
      } catch (error) {
        console.error('获取仪表盘数据失败:', error);
        toast.error('获取数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 待办事项数据（基于真实统计）
  const todoList = stats ? [
    { id: 1, title: '待发货订单', count: stats.pending_orders || 0, type: 'warning' as const },
    { id: 2, title: '待处理售后', count: stats.pending_aftersales || 0, type: 'danger' as const },
    { id: 3, title: '待回复评价', count: stats.pending_reviews || 0, type: 'info' as const },
    { id: 4, title: '库存预警', count: stats.low_stock_products || 0, type: 'warning' as const },
  ] : [];

  // 模拟通知数据（后续可以替换为真实数据）
  const notifications = [
    { id: 1, title: '新订单提醒', content: '您有一笔新订单待处理', time: '5分钟前', read: false },
    { id: 2, title: '售后申请', content: '买家申请退款，请及时处理', time: '1小时前', read: false },
    { id: 3, title: '系统通知', content: '平台将于今晚进行系统维护', time: '2小时前', read: true },
  ];

  const getChangeIcon = (change: number) => {
    if (change >= 0) {
      return <ArrowUpRight className="w-3 h-3 text-emerald-400" />;
    }
    return <ArrowDownRight className="w-3 h-3 text-red-400" />;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-emerald-400' : 'text-red-400';
  };

  // 计算环比变化百分比（真实数据）
  const calculateChangePercent = (today: number, yesterday: number): number => {
    if (yesterday === 0) {
      return today > 0 ? 100 : 0;
    }
    return Number(((today - yesterday) / yesterday * 100).toFixed(1));
  };

  if (loading) {
    return (
      <div className="space-y-4 sticky top-6">
        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] p-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#5ba3d4]" />
          </div>
        </div>
      </div>
    );
  }

  // 计算各项环比变化
  const salesChange = calculateChangePercent(stats?.today_sales || 0, stats?.yesterday_sales || 0);
  const ordersChange = calculateChangePercent(stats?.today_orders || 0, stats?.yesterday_orders || 0);
  const visitorsChange = calculateChangePercent(stats?.today_visitors || 0, stats?.yesterday_visitors || 0);
  const conversionChange = calculateChangePercent(
    stats?.today_conversion_rate || 0,
    stats?.yesterday_conversion_rate || 0
  );

  return (
    <div className="space-y-4 sticky top-6">
      {/* 今日数据概览 */}
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-[#5ba3d4]" />
          <h3 className="font-semibold text-[var(--text-primary)]">今日数据</h3>
        </div>

        <div className="space-y-4">
          {/* 销售额 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm text-[var(--text-tertiary)]">销售额</span>
            </div>
            <div className="text-right">
              <p className="font-semibold text-[var(--text-primary)]">
                ¥{(stats?.today_sales || 0).toLocaleString()}
              </p>
              <div className={`flex items-center gap-1 text-xs ${getChangeColor(salesChange)}`}>
                {getChangeIcon(salesChange)}
                <span>{Math.abs(salesChange)}%</span>
              </div>
            </div>
          </div>

          {/* 订单数 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm text-[var(--text-tertiary)]">订单数</span>
            </div>
            <div className="text-right">
              <p className="font-semibold text-[var(--text-primary)]">{stats?.today_orders || 0}</p>
              <div className={`flex items-center gap-1 text-xs ${getChangeColor(ordersChange)}`}>
                {getChangeIcon(ordersChange)}
                <span>{Math.abs(ordersChange)}%</span>
              </div>
            </div>
          </div>

          {/* 访客数 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-sm text-[var(--text-tertiary)]">访客数</span>
            </div>
            <div className="text-right">
              <p className="font-semibold text-[var(--text-primary)]">{stats?.today_visitors || 0}</p>
              <div className={`flex items-center gap-1 text-xs ${getChangeColor(visitorsChange)}`}>
                {getChangeIcon(visitorsChange)}
                <span>{Math.abs(visitorsChange)}%</span>
              </div>
            </div>
          </div>

          {/* 转化率 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-sm text-[var(--text-tertiary)]">转化率</span>
            </div>
            <div className="text-right">
              <p className="font-semibold text-[var(--text-primary)]">{(stats?.today_conversion_rate || 0).toFixed(1)}%</p>
              <div className={`flex items-center gap-1 text-xs ${getChangeColor(conversionChange)}`}>
                {getChangeIcon(conversionChange)}
                <span>{Math.abs(conversionChange)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 待办事项 */}
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-[var(--text-primary)]">待办事项</h3>
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            共 {todoList.reduce((acc, item) => acc + item.count, 0)} 项
          </span>
        </div>

        <div className="space-y-2">
          {todoList.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
            >
              <span className="text-sm text-[var(--text-secondary)]">{item.title}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                item.type === 'danger'
                  ? 'bg-red-500/20 text-red-400'
                  : item.type === 'warning'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                {item.count}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 消息通知 */}
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#5ba3d4]" />
            <h3 className="font-semibold text-[var(--text-primary)]">消息通知</h3>
          </div>
          <button className="text-xs text-[#5ba3d4] hover:text-[#7ab8e0]">
            查看全部
          </button>
        </div>

        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border ${
                notification.read
                  ? 'bg-[var(--bg-tertiary)] border-[var(--border-primary)]'
                  : 'bg-[#5ba3d4]/5 border-[#5ba3d4]/20'
              }`}
            >
              <div className="flex items-start gap-2">
                {notification.read ? (
                  <CheckCircle2 className="w-4 h-4 text-[var(--text-muted)] mt-0.5" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-[#5ba3d4] mt-1.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${notification.read ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'}`}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{notification.content}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-[var(--text-muted)]">
                    <Clock className="w-3 h-3" />
                    <span>{notification.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="bg-gradient-to-br from-[#5ba3d4]/10 to-[#3d6a8a]/10 rounded-xl border border-[#5ba3d4]/20 p-4">
        <h3 className="font-semibold text-[var(--text-primary)] mb-3">快捷入口</h3>
        <div className="grid grid-cols-2 gap-2">
          <button className="p-3 bg-[var(--bg-secondary)]/50 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors">
            发布商品
          </button>
          <button className="p-3 bg-[var(--bg-secondary)]/50 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors">
            订单发货
          </button>
          <button className="p-3 bg-[var(--bg-secondary)]/50 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors">
            售后处理
          </button>
          <button className="p-3 bg-[var(--bg-secondary)]/50 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors">
            数据报表
          </button>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
