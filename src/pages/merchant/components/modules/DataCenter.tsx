/**
 * 商家工作平台 - 数据中心模块
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Download,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { merchantService, SalesTrend, ProductRanking } from '@/services/merchantService';
import { toast } from 'sonner';
import reconciliationService from '@/services/reconciliationService';

const DataCenter: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    salesChange: 0,
    totalOrders: 0,
    ordersChange: 0,
    totalVisitors: 0,
    visitorsChange: 0,
    avgOrderValue: 0,
    aovChange: 0,
  });
  const [salesData, setSalesData] = useState<SalesTrend[]>([]);
  const [productRanking, setProductRanking] = useState<ProductRanking[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('[DataCenter] Fetching data...');
        const merchant = await merchantService.getCurrentMerchant();
        console.log('[DataCenter] Merchant:', merchant);
        if (merchant) {
          // 获取仪表盘统计数据
          console.log('[DataCenter] Fetching dashboard stats for merchant:', merchant.id);
          const dashboardStats = await merchantService.getDashboardStats(merchant.id);
          console.log('[DataCenter] Dashboard stats:', dashboardStats);
          // 确保数据有默认值，避免 undefined
          const safeStats = {
            today_sales: dashboardStats?.today_sales ?? 0,
            today_orders: dashboardStats?.today_orders ?? 0,
            today_visitors: dashboardStats?.today_visitors ?? 0,
            total_sales: dashboardStats?.total_sales ?? 0,
            total_orders: dashboardStats?.total_orders ?? 0,
          };
          console.log('[DataCenter] Safe stats:', safeStats);
          setStats({
            totalSales: safeStats.total_sales,  // 使用累计销售额
            salesChange: safeStats.today_sales > 0 && safeStats.total_sales > 0
              ? Math.round((safeStats.today_sales / safeStats.total_sales) * 100)
              : 0,
            totalOrders: safeStats.total_orders,  // 使用累计订单数
            ordersChange: safeStats.today_orders > 0 && safeStats.total_orders > 0
              ? Math.round((safeStats.today_orders / safeStats.total_orders) * 100)
              : 0,
            totalVisitors: safeStats.today_visitors,
            visitorsChange: 0,
            avgOrderValue: safeStats.total_orders > 0
              ? Math.round(safeStats.total_sales / safeStats.total_orders)
              : 0,
            aovChange: 0,
          });
          console.log('[DataCenter] Stats set:', {
            totalSales: safeStats.total_sales,
            totalOrders: safeStats.total_orders,
          });

          // 获取销售趋势
          const trend = await merchantService.getSalesTrend(merchant.id, 7);
          setSalesData(trend);

          // 获取商品排行
          const ranking = await merchantService.getProductRanking(merchant.id, 5);
          setProductRanking(ranking);
        }
      } catch (error) {
        console.error('获取数据中心数据失败:', error);
        toast.error('获取数据中心数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-emerald-400' : 'text-red-400';
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUp className="w-4 h-4" />
    ) : (
      <TrendingDown className="w-4 h-4" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#5ba3d4]" />
        <span className="ml-2 text-[var(--text-muted)]">加载中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">数据中心</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">查看店铺运营数据和分析报表</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-[var(--border-primary)] rounded-lg px-3 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm"
          >
            <option value="today">今日</option>
            <option value="7days">近7天</option>
            <option value="30days">近30天</option>
            <option value="90days">近90天</option>
          </select>
          <Button variant="outline" className="border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
            <Download className="w-4 h-4 mr-2" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 核心数据卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border-primary)]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${getChangeColor(stats.salesChange)}`}>
              {getChangeIcon(stats.salesChange)}
              <span>{Math.abs(stats.salesChange)}%</span>
            </div>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-1">总销售额</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">¥{stats.totalSales.toLocaleString()}</p>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border-primary)]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${getChangeColor(stats.ordersChange)}`}>
              {getChangeIcon(stats.ordersChange)}
              <span>{Math.abs(stats.ordersChange)}%</span>
            </div>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-1">总订单数</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalOrders}</p>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border-primary)]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${getChangeColor(stats.visitorsChange)}`}>
              {getChangeIcon(stats.visitorsChange)}
              <span>{Math.abs(stats.visitorsChange)}%</span>
            </div>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-1">访客数</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalVisitors}</p>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border-primary)]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-amber-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${getChangeColor(stats.aovChange)}`}>
              {getChangeIcon(stats.aovChange)}
              <span>{Math.abs(stats.aovChange)}%</span>
            </div>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-1">客单价</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">¥{stats.avgOrderValue}</p>
        </div>
      </div>

      {/* 销售趋势图 */}
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-[var(--text-primary)]">销售趋势</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#5ba3d4]" />
              <span className="text-sm text-[var(--text-tertiary)]">销售额</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-sm text-[var(--text-tertiary)]">订单数</span>
            </div>
          </div>
        </div>

        {/* 简化的柱状图 */}
        <div className="h-64 flex items-end gap-2">
          {salesData.length === 0 ? (
            <div className="w-full text-center text-[var(--text-muted)] py-8">
              暂无销售数据
            </div>
          ) : (
            salesData.map((item, index) => {
              const maxSales = Math.max(...salesData.map(d => d.sales), 1);
              const height = (item.sales / maxSales) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex gap-1 items-end justify-center" style={{ height: '200px' }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className="w-4 bg-[#5ba3d4] rounded-t"
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(item.orders / Math.max(...salesData.map(d => d.orders), 1)) * 100}%` }}
                      transition={{ delay: index * 0.1 + 0.05, duration: 0.5 }}
                      className="w-4 bg-emerald-400 rounded-t"
                    />
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">{item.date}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 商品销售排行 */}
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] p-5">
        <h3 className="font-semibold text-[var(--text-primary)] mb-4">商品销售排行</h3>
        <div className="space-y-3">
          {productRanking.length === 0 ? (
            <div className="text-center text-[var(--text-muted)] py-8">
              暂无商品排行数据
            </div>
          ) : (
            productRanking.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-3 bg-[var(--bg-tertiary)] rounded-lg"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  index < 3
                    ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
                    : 'bg-[var(--border-secondary)] text-[var(--text-tertiary)]'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[var(--text-primary)]">{product.name}</p>
                  <p className="text-sm text-[var(--text-muted)]">销量 {product.sales} 件</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#5ba3d4]">¥{(product.revenue ?? 0).toLocaleString()}</p>
                  <p className="text-sm text-[var(--text-muted)]">销售额</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* 流量来源分析 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] p-5">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">流量来源</h3>
          <div className="space-y-3">
            {[
              { source: '搜索', value: 45, color: 'bg-[#5ba3d4]' },
              { source: '推荐', value: 30, color: 'bg-emerald-400' },
              { source: '直接访问', value: 15, color: 'bg-amber-400' },
              { source: '其他', value: 10, color: 'bg-purple-400' },
            ].map((item) => (
              <div key={item.source} className="flex items-center gap-3">
                <span className="text-sm text-[var(--text-tertiary)] w-16">{item.source}</span>
                <div className="flex-1 h-2 bg-[var(--border-primary)] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
                <span className="text-sm text-[var(--text-primary)] w-10 text-right">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] p-5">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">转化漏斗</h3>
          <div className="space-y-4">
            {[
              { stage: '浏览商品', value: stats.totalVisitors || 100, color: 'bg-[#5ba3d4]' },
              { stage: '加入购物车', value: Math.round((stats.totalVisitors || 100) * 0.23), color: 'bg-blue-400' },
              { stage: '提交订单', value: Math.round((stats.totalVisitors || 100) * 0.07), color: 'bg-emerald-400' },
              { stage: '完成支付', value: stats.totalOrders || 0, color: 'bg-amber-400' },
            ].map((item, index) => (
              <div key={item.stage} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[var(--text-tertiary)]">{item.stage}</span>
                  <span className="text-sm text-[var(--text-primary)]">{item.value}</span>
                </div>
                <div className="h-8 bg-[var(--border-primary)] rounded-lg overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((item.value / Math.max(stats.totalVisitors, 1)) * 100, 100)}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className={`h-full ${item.color} rounded-lg`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 对账管理 */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-6 border border-[var(--border-primary)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">对账管理</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : 'user-id';
              const result = reconciliationService.reconcile(userId);
              if (result.status === 'matched') {
                toast.success('对账完成，数据一致');
              } else {
                toast.warning(`发现${result.issues.length}个问题需要处理`);
              }
            }}
          >
            <i className="fas fa-sync-alt mr-2" />
            立即对账
          </Button>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          定期核对积分、订单、资金数据，确保账目准确无误
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
            <p className="text-sm text-[var(--text-muted)]">上次对账</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">今日 02:00</p>
          </div>
          <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
            <p className="text-sm text-[var(--text-muted)]">对账状态</p>
            <p className="text-lg font-semibold text-emerald-400">正常</p>
          </div>
          <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
            <p className="text-sm text-[var(--text-muted)]">异常记录</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">0 条</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataCenter;
