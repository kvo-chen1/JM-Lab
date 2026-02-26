import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  DollarSign,
  BarChart3,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Package,
  User,
  Calendar,
  CreditCard
} from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabaseClient';

// 订单状态配置
const statusConfig = {
  pending: { label: '待支付', color: 'yellow', icon: Clock },
  paid: { label: '已支付', color: 'blue', icon: CheckCircle },
  running: { label: '推广中', color: 'green', icon: TrendingUp },
  completed: { label: '已完成', color: 'purple', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'red', icon: XCircle },
  refunded: { label: '已退款', color: 'gray', icon: XCircle },
};

// 套餐类型配置
const packageConfig = {
  standard: { label: '标准套餐', color: 'blue' },
  basic: { label: '基础套餐', color: 'green' },
  long: { label: '长效套餐', color: 'purple' },
  custom: { label: '自定义', color: 'orange' },
};

interface PromotionOrder {
  id: string;
  order_no: string;
  user_id: string;
  work_id: string;
  work_title: string;
  work_thumbnail: string;
  package_type: string;
  package_name: string;
  target_type: string;
  metric_type: string;
  original_price: number;
  discount_amount: number;
  final_price: number;
  expected_views: string;
  actual_views: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  user?: {
    username: string;
    email: string;
    avatar_url: string;
  };
}

interface OrderStats {
  totalOrders: number;
  pendingCount: number;
  paidCount: number;
  runningCount: number;
  completedCount: number;
  totalRevenue: number;
  todayRevenue: number;
}

export default function PromotionOrderManagement() {
  const { isDark } = useTheme();

  // 数据状态
  const [orders, setOrders] = useState<PromotionOrder[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    pendingCount: 0,
    paidCount: 0,
    runningCount: 0,
    completedCount: 0,
    totalRevenue: 0,
    todayRevenue: 0,
  });

  // UI状态
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<PromotionOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 筛选状态
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [packageFilter, setPackageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // 获取数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 构建查询
      let query = supabaseAdmin
        .from('promotion_orders')
        .select('*', { count: 'exact' });

      // 应用筛选
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (packageFilter !== 'all') {
        query = query.eq('package_type', packageFilter);
      }
      if (searchQuery) {
        query = query.or(`order_no.ilike.%${searchQuery}%,work_title.ilike.%${searchQuery}%`);
      }
      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start);
      }
      if (dateRange.end) {
        query = query.lte('created_at', dateRange.end);
      }

      // 分页
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // 获取用户信息
      const userIds = [...new Set((data || []).map(o => o.user_id))];
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, username, email, avatar_url')
        .in('id', userIds);

      const userMap = new Map(users?.map(u => [u.id, u]) || []);

      const ordersWithUser = (data || []).map(order => ({
        ...order,
        user: userMap.get(order.user_id),
      }));

      setOrders(ordersWithUser);
      setTotalCount(count || 0);

      // 获取统计数据
      await fetchStats();
    } catch (error) {
      console.error('获取订单数据失败:', error);
      toast.error('获取订单数据失败');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, packageFilter, searchQuery, dateRange, currentPage, pageSize]);

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const { data: allOrders } = await supabaseAdmin
        .from('promotion_orders')
        .select('status, final_price, created_at');

      const today = new Date().toISOString().split('T')[0];

      const stats: OrderStats = {
        totalOrders: allOrders?.length || 0,
        pendingCount: allOrders?.filter(o => o.status === 'pending').length || 0,
        paidCount: allOrders?.filter(o => o.status === 'paid').length || 0,
        runningCount: allOrders?.filter(o => o.status === 'running').length || 0,
        completedCount: allOrders?.filter(o => o.status === 'completed').length || 0,
        totalRevenue: allOrders?.reduce((sum, o) => sum + (o.final_price || 0), 0) || 0,
        todayRevenue: allOrders?.filter(o => o.created_at?.startsWith(today))
          .reduce((sum, o) => sum + (o.final_price || 0), 0) || 0,
      };

      setStats(stats);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 查看详情
  const handleViewDetail = (order: PromotionOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  // 导出数据
  const handleExport = () => {
    const csvContent = [
      ['订单号', '用户', '作品', '套餐', '金额', '状态', '创建时间'].join(','),
      ...orders.map(o => [
        o.order_no,
        o.user?.username || o.user_id,
        o.work_title || o.work_id,
        packageConfig[o.package_type as keyof typeof packageConfig]?.label || o.package_type,
        o.final_price,
        statusConfig[o.status as keyof typeof statusConfig]?.label || o.status,
        new Date(o.created_at).toLocaleString('zh-CN'),
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `推广订单_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          推广订单管理
        </h1>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          查看和管理所有推广订单
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <StatCard
          title="总订单数"
          value={stats.totalOrders}
          icon={ShoppingCart}
          color="blue"
          isDark={isDark}
        />
        <StatCard
          title="待支付"
          value={stats.pendingCount}
          icon={Clock}
          color="yellow"
          isDark={isDark}
        />
        <StatCard
          title="已支付"
          value={stats.paidCount}
          icon={CheckCircle}
          color="blue"
          isDark={isDark}
        />
        <StatCard
          title="推广中"
          value={stats.runningCount}
          icon={TrendingUp}
          color="green"
          isDark={isDark}
        />
        <StatCard
          title="已完成"
          value={stats.completedCount}
          icon={CheckCircle}
          color="purple"
          isDark={isDark}
        />
        <StatCard
          title="总收入"
          value={`¥${stats.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          color="green"
          isDark={isDark}
        />
        <StatCard
          title="今日收入"
          value={`¥${stats.todayRevenue.toFixed(2)}`}
          icon={BarChart3}
          color="orange"
          isDark={isDark}
        />
      </div>

      {/* 筛选栏 */}
      <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="flex flex-wrap gap-4 items-center">
          {/* 搜索 */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="搜索订单号或作品名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-pink-500`}
            />
          </div>

          {/* 状态筛选 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-pink-500`}
          >
            <option value="all">全部状态</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          {/* 套餐筛选 */}
          <select
            value={packageFilter}
            onChange={(e) => setPackageFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-pink-500`}
          >
            <option value="all">全部套餐</option>
            {Object.entries(packageConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          {/* 日期范围 */}
          <input
            type="date"
            value={dateRange.start || ''}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className={`px-4 py-2 rounded-lg border ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-pink-500`}
          />
          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>至</span>
          <input
            type="date"
            value={dateRange.end || ''}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className={`px-4 py-2 rounded-lg border ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-pink-500`}
          />

          {/* 操作按钮 */}
          <button
            onClick={fetchData}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
            title="刷新"
          >
            <RefreshCw className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
          <button
            onClick={handleExport}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition-colors`}
          >
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      {/* 订单列表 */}
      <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <table className="w-full">
          <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <tr>
              <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>订单信息</th>
              <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>用户信息</th>
              <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>套餐</th>
              <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>金额</th>
              <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>状态</th>
              <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>创建时间</th>
              <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center">
                  <div className={`animate-spin w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full mx-auto`} />
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className={`px-4 py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  暂无订单数据
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const status = statusConfig[order.status as keyof typeof statusConfig];
                const packageType = packageConfig[order.package_type as keyof typeof packageConfig];

                return (
                  <tr key={order.id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {order.work_thumbnail ? (
                          <img
                            src={order.work_thumbnail}
                            alt={order.work_title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <Package className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                          </div>
                        )}
                        <div>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {order.work_title || '未命名作品'}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {order.order_no}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {order.user?.avatar_url ? (
                          <img
                            src={order.user.avatar_url}
                            alt={order.user.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <User className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                          </div>
                        )}
                        <div>
                          <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {order.user?.username || '未知用户'}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {order.user?.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs bg-${packageType?.color || 'gray'}-100 text-${packageType?.color || 'gray'}-600`}>
                        {packageType?.label || order.package_type}
                      </span>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        预计{order.expected_views || '-'}播放
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        ¥{order.final_price?.toFixed(2)}
                      </p>
                      {order.discount_amount > 0 && (
                        <p className={`text-xs line-through ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          ¥{order.original_price?.toFixed(2)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-${status?.color || 'gray'}-100 text-${status?.color || 'gray'}-600`}>
                        {status && <status.icon className="w-3 h-3" />}
                        {status?.label || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {new Date(order.created_at).toLocaleDateString('zh-CN')}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(order.created_at).toLocaleTimeString('zh-CN')}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewDetail(order)}
                        className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100'} transition-colors`}
                        title="查看详情"
                      >
                        <Eye className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* 分页 */}
        <div className={`flex items-center justify-between px-4 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            共 {totalCount} 条记录，第 {currentPage}/{totalPages || 1} 页
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg disabled:opacity-50 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
            >
              <ChevronLeft className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg disabled:opacity-50 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
            >
              <ChevronRight className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 详情弹窗 */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`w-full max-w-2xl rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                订单详情
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
              >
                <XCircle className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>

            <div className="space-y-4">
              {/* 作品信息 */}
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>作品信息</h3>
                <div className="flex items-center gap-4">
                  {selectedOrder.work_thumbnail ? (
                    <img
                      src={selectedOrder.work_thumbnail}
                      alt={selectedOrder.work_title}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className={`w-20 h-20 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <Package className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    </div>
                  )}
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedOrder.work_title || '未命名作品'}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      作品ID: {selectedOrder.work_id}
                    </p>
                  </div>
                </div>
              </div>

              {/* 订单信息 */}
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>订单信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>订单号</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.order_no}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>套餐类型</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {packageConfig[selectedOrder.package_type as keyof typeof packageConfig]?.label || selectedOrder.package_type}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>目标类型</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.target_type}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>推广指标</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.metric_type}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>预计播放量</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.expected_views || '-'}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>实际播放量</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.actual_views || 0}</p>
                  </div>
                </div>
              </div>

              {/* 金额信息 */}
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>金额信息</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>原价</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>¥{selectedOrder.original_price?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>优惠</p>
                    <p className={`font-medium text-green-500`}>-¥{selectedOrder.discount_amount?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>实付金额</p>
                    <p className={`font-medium text-pink-500 text-lg`}>¥{selectedOrder.final_price?.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* 时间信息 */}
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>时间信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>创建时间</p>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {new Date(selectedOrder.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  {selectedOrder.paid_at && (
                    <div className="flex items-center gap-2">
                      <CreditCard className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>支付时间</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {new Date(selectedOrder.paid_at).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// 统计卡片组件
function StatCard({ title, value, icon: Icon, color, isDark }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  isDark: boolean;
}) {
  const colorClasses: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
    green: { bg: 'bg-green-500/10', text: 'text-green-500' },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-500' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-500' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-500' },
    red: { bg: 'bg-red-500/10', text: 'text-red-500' },
    gray: { bg: 'bg-gray-500/10', text: 'text-gray-500' },
  };

  const colors = colorClasses[color] || colorClasses.gray;

  return (
    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${colors.text}`} />
      </div>
      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
    </div>
  );
}
