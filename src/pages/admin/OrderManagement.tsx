import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import productService, { ExchangeRecord } from '@/services/productService';
import {
  Package,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  RotateCcw,
  Eye,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  ShoppingBag,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

// 订单状态类型
type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';

// 统计卡片组件
const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
  trendValue
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}) => {
  const { isDark } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400'
            }`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
               trend === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div
          className="p-3 rounded-xl"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
};

// 订单状态配置
const orderStatusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string; icon: any }> = {
  pending: {
    label: '待处理',
    color: '#f59e0b',
    bgColor: 'bg-yellow-100',
    icon: Clock
  },
  processing: {
    label: '处理中',
    color: '#3b82f6',
    bgColor: 'bg-blue-100',
    icon: Package
  },
  completed: {
    label: '已完成',
    color: '#10b981',
    bgColor: 'bg-green-100',
    icon: CheckCircle
  },
  cancelled: {
    label: '已取消',
    color: '#6b7280',
    bgColor: 'bg-gray-100',
    icon: XCircle
  },
  refunded: {
    label: '已退款',
    color: '#ef4444',
    bgColor: 'bg-red-100',
    icon: RotateCcw
  }
};

export default function OrderManagement() {
  const { isDark } = useTheme();

  // 状态管理
  const [orders, setOrders] = useState<ExchangeRecord[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ExchangeRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // 筛选和分页
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pageSize] = useState(10);

  // 统计数据
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
    refunded: 0,
    totalPoints: 0,
    todayOrders: 0
  });

  // 管理员备注
  const [adminNotes, setAdminNotes] = useState('');

  // 加载订单数据
  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = (currentPage - 1) * pageSize;
      const response = await productService.getAllExchangeRecords({
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: pageSize,
        offset
      });

      setOrders(response.records);
      setTotalOrders(response.total);
    } catch (error) {
      console.error('加载订单失败:', error);
      toast.error('加载订单数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, statusFilter]);

  // 加载统计数据
  const loadStats = useCallback(async () => {
    try {
      const data = await productService.getOrderStats();
      setStats(data);
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadOrders();
    loadStats();
  }, [loadOrders, loadStats]);

  // 搜索过滤
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      order.productName?.toLowerCase().includes(search) ||
      order.userName?.toLowerCase().includes(search) ||
      order.userEmail?.toLowerCase().includes(search) ||
      order.id?.toLowerCase().includes(search)
    );
  });

  // 更新订单状态
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdating(true);
    try {
      const success = await productService.updateOrderStatus(
        orderId,
        newStatus,
        adminNotes,
        'admin' // 当前管理员ID
      );

      if (success) {
        toast.success(`订单状态已更新为${orderStatusConfig[newStatus].label}`);
        setAdminNotes('');
        await loadOrders();
        await loadStats();

        // 更新选中的订单
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      } else {
        toast.error('更新订单状态失败');
      }
    } catch (error) {
      console.error('更新订单状态失败:', error);
      toast.error('更新订单状态失败');
    } finally {
      setIsUpdating(false);
    }
  };

  // 导出订单数据
  const handleExport = () => {
    const headers = ['订单ID', '商品名称', '用户', '积分', '数量', '状态', '日期'];
    const rows = filteredOrders.map(order => [
      order.id,
      order.productName,
      order.userName || order.userId,
      order.points,
      order.quantity,
      orderStatusConfig[order.status as OrderStatus]?.label || order.status,
      new Date(order.date).toLocaleString('zh-CN')
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `订单数据_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('订单数据已导出');
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 总页数
  const totalPages = Math.ceil(totalOrders / pageSize);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* 页面标题 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">订单管理</h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            管理积分商城的兑换订单和处理售后
          </p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
            } shadow-sm`}
          >
            <Download className="w-4 h-4" />
            导出数据
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { loadOrders(); loadStats(); }}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
            } shadow-sm disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </motion.button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="总订单数"
          value={stats.total.toLocaleString()}
          icon={ShoppingBag}
          color="#8b5cf6"
          trend="up"
          trendValue={`+${stats.todayOrders} 今日`}
        />
        <StatCard
          title="待处理"
          value={stats.pending.toLocaleString()}
          icon={Clock}
          color="#f59e0b"
        />
        <StatCard
          title="已完成"
          value={stats.completed.toLocaleString()}
          icon={CheckCircle}
          color="#10b981"
        />
        <StatCard
          title="总积分消耗"
          value={stats.totalPoints.toLocaleString()}
          icon={CreditCard}
          color="#ef4444"
        />
      </div>

      {/* 筛选和搜索栏 */}
      <div className={`flex flex-col md:flex-row gap-4 ${isDark ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-md`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索订单号、商品名称、用户..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none transition-colors ${
              isDark
                ? 'bg-gray-700 text-white placeholder-gray-400 focus:bg-gray-600'
                : 'bg-gray-100 text-gray-900 placeholder-gray-500 focus:bg-gray-200'
            }`}
          />
        </div>

        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as OrderStatus | 'all');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-sm outline-none transition-colors ${
              isDark
                ? 'bg-gray-700 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            <option value="all">全部状态</option>
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
            <option value="refunded">已退款</option>
          </select>
        </div>
      </div>

      {/* 订单列表和详情 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧订单列表 */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className={`flex items-center justify-center py-16 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-16 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md`}>
              <FileText className="w-16 h-16 text-gray-400 mb-4" />
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                暂无订单数据
              </p>
            </div>
          ) : (
            <>
              <AnimatePresence>
                {filteredOrders.map((order, index) => {
                  const statusConfig = orderStatusConfig[order.status as OrderStatus];
                  const StatusIcon = statusConfig?.icon || Clock;

                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        setSelectedOrder(order);
                        setAdminNotes(order.adminNotes || '');
                      }}
                      className={`p-4 rounded-2xl cursor-pointer transition-all ${
                        selectedOrder?.id === order.id
                          ? isDark ? 'bg-gray-700 ring-2 ring-blue-500' : 'bg-white ring-2 ring-blue-500'
                          : isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                      } shadow-md`}
                    >
                      <div className="flex gap-4">
                        {/* 商品图片 */}
                        <img
                          src={order.productImage || 'https://via.placeholder.com/100'}
                          alt={order.productName}
                          className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-gray-200 dark:border-gray-600"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100';
                          }}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg truncate">{order.productName}</h3>
                                <span className="text-xs text-gray-400">#{order.id.slice(0, 8)}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {order.userName || order.userId}
                                </span>
                              </div>
                            </div>

                            <div
                              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig?.bgColor || 'bg-gray-100'}`}
                              style={{ color: statusConfig?.color }}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig?.label || order.status}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium text-red-500">
                                {order.points} 积分
                              </span>
                              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                x{order.quantity}
                              </span>
                              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {formatDate(order.date)}
                              </span>
                            </div>

                            {/* 快捷操作按钮 */}
                            {order.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(order.id, 'processing');
                                  }}
                                  disabled={isUpdating}
                                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs transition-colors"
                                >
                                  开始处理
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(order.id, 'cancelled');
                                  }}
                                  disabled={isUpdating}
                                  className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-xs transition-colors"
                                >
                                  取消
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-colors ${
                      currentPage === 1
                        ? 'opacity-50 cursor-not-allowed'
                        : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
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
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-red-600 text-white'
                            : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-colors ${
                      currentPage === totalPages
                        ? 'opacity-50 cursor-not-allowed'
                        : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* 右侧订单详情 */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedOrder ? (
              <motion.div
                key={selectedOrder.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden sticky top-6`}
              >
                {/* 详情头部 */}
                <div className="relative p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedOrder.productImage || 'https://via.placeholder.com/100'}
                      alt={selectedOrder.productName}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-gray-600"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100';
                      }}
                    />
                    <div>
                      <h3 className="font-bold text-lg">{selectedOrder.productName}</h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        订单 #{selectedOrder.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>

                  {/* 状态标签 */}
                  <div className="mt-4">
                    {(() => {
                      const config = orderStatusConfig[selectedOrder.status as OrderStatus];
                      const StatusIcon = config?.icon || Clock;
                      return (
                        <div
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config?.bgColor || 'bg-gray-100'}`}
                          style={{ color: config?.color }}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {config?.label || selectedOrder.status}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* 订单信息 */}
                  <div className="space-y-3">
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      订单信息
                    </p>
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="flex justify-between mb-2">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>订单金额</span>
                        <span className="font-medium text-red-500">{selectedOrder.points} 积分</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>数量</span>
                        <span className="font-medium">{selectedOrder.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>下单时间</span>
                        <span className="font-medium">{formatDate(selectedOrder.date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 用户信息 */}
                  <div className="space-y-3">
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      用户信息
                    </p>
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">{selectedOrder.userName || selectedOrder.userId}</span>
                      </div>
                      {selectedOrder.userEmail && (
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{selectedOrder.userEmail}</span>
                        </div>
                      )}
                      {selectedOrder.contactPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-purple-500" />
                          <span className="text-sm">{selectedOrder.contactPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 配送地址 */}
                  {selectedOrder.shippingAddress && (
                    <div className="space-y-3">
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        配送地址
                      </p>
                      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-red-500 mt-0.5" />
                          <span className="text-sm">{selectedOrder.shippingAddress}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 管理员备注 */}
                  <div className="space-y-3">
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      管理员备注
                    </p>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="添加订单处理备注..."
                      rows={3}
                      className={`w-full px-3 py-2 rounded-xl text-sm outline-none resize-none ${
                        isDark
                          ? 'bg-gray-700 text-white placeholder-gray-400'
                          : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* 操作按钮 */}
                  <div className="space-y-2">
                    {selectedOrder.status === 'pending' && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'processing')}
                          disabled={isUpdating}
                          className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                          开始处理
                        </motion.button>
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                            disabled={isUpdating}
                            className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors"
                          >
                            直接完成
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                            disabled={isUpdating}
                            className="flex-1 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl text-sm font-medium transition-colors"
                          >
                            取消订单
                          </motion.button>
                        </div>
                      </>
                    )}

                    {selectedOrder.status === 'processing' && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                          disabled={isUpdating}
                          className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                          标记完成
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'refunded')}
                          disabled={isUpdating}
                          className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                          退款处理
                        </motion.button>
                      </>
                    )}

                    {(selectedOrder.status === 'completed' || selectedOrder.status === 'cancelled') && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'refunded')}
                        disabled={isUpdating}
                        className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        退款处理
                      </motion.button>
                    )}
                  </div>

                  {/* 处理记录 */}
                  {(selectedOrder.processedAt || selectedOrder.processedBy) && (
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                      <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        处理记录
                      </p>
                      {selectedOrder.processedBy && (
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          处理人: {selectedOrder.processedBy}
                        </p>
                      )}
                      {selectedOrder.processedAt && (
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          处理时间: {formatDate(selectedOrder.processedAt)}
                        </p>
                      )}
                      {selectedOrder.adminNotes && (
                        <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          备注: {selectedOrder.adminNotes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-8 text-center`}
              >
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  选择一个订单查看详情
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
