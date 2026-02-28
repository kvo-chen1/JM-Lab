import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import * as brandOrderService from '@/services/brandOrderService';
import type { BrandOrder, BrandOrderStats, OrderApplication } from '@/services/brandOrderService';
import {
  Package,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  RefreshCw,
  Calendar,
  DollarSign,
  MapPin,
  Briefcase,
  User,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';

// 状态标签组件
const StatusBadge = ({ status }: { status: string }) => {
  const { isDark } = useTheme();
  
  const styles = {
    pending: isDark
      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      : 'bg-yellow-100 text-yellow-700 border-yellow-200',
    approved: isDark
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-green-100 text-green-700 border-green-200',
    rejected: isDark
      ? 'bg-red-500/20 text-red-400 border-red-500/30'
      : 'bg-red-100 text-red-700 border-red-200',
    closed: isDark
      ? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      : 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const labels = {
    pending: '审核中',
    approved: '已通过',
    rejected: '已驳回',
    closed: '已关闭',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.pending}`}>
      {labels[status as keyof typeof labels] || status}
    </span>
  );
};

// 申请状态标签
const ApplicationStatusBadge = ({ status }: { status: string }) => {
  const { isDark } = useTheme();
  
  const styles = {
    pending: isDark
      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      : 'bg-blue-100 text-blue-700 border-blue-200',
    approved: isDark
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-green-100 text-green-700 border-green-200',
    rejected: isDark
      ? 'bg-red-500/20 text-red-400 border-red-500/30'
      : 'bg-red-100 text-red-700 border-red-200',
  };

  const labels = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.pending}`}>
      {labels[status as keyof typeof labels] || status}
    </span>
  );
};

// 统计卡片组件
const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) => {
  const { isDark } = useTheme();
  
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`p-4 rounded-xl border ${
        isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        </div>
      </div>
    </motion.div>
  );
};

// 商单详情弹窗
const OrderDetailModal = ({
  order,
  isOpen,
  onClose,
  onReview,
}: {
  order: BrandOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onReview: (applicationId: string, status: 'approved' | 'rejected') => void;
}) => {
  const { isDark } = useTheme();
  const [applications, setApplications] = useState<OrderApplication[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order?.id) {
      loadApplications();
    }
  }, [order?.id]);

  const loadApplications = async () => {
    if (!order?.id) return;
    setLoading(true);
    try {
      const data = await brandOrderService.getOrderApplications(order.id);
      setApplications(data);
    } catch (error) {
      console.error('加载申请列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`w-full max-w-4xl max-h-[90vh] overflow-auto rounded-2xl ${
            isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {order.title}
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  品牌：{order.brand_name}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
          </div>

          {/* 内容 */}
          <div className="p-6 space-y-6">
            {/* 基本信息 */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl ${
              isDark ? 'bg-gray-800/50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-2">
                <DollarSign className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  ¥{order.budget_min}-¥{order.budget_max}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  {new Date(order.deadline).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{order.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  最多{order.max_applicants}人
                </span>
              </div>
            </div>

            {/* 任务描述 */}
            <div>
              <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                任务描述
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {order.description}
              </p>
            </div>

            {/* 任务要求 */}
            {order.requirements && order.requirements.length > 0 && (
              <div>
                <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  任务要求
                </h3>
                <ul className="space-y-1">
                  {order.requirements.map((req, index) => (
                    <li key={index} className={`text-sm flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 接单申请列表 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  接单申请 ({applications.length})
                </h3>
                {loading && <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />}
              </div>

              {applications.length === 0 ? (
                <div className={`text-center py-8 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                  <Users className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    暂无接单申请
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl border ${
                        isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isDark ? 'bg-gray-700' : 'bg-gray-100'
                          }`}>
                            {app.creator_avatar ? (
                              <img src={app.creator_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <User className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                            )}
                          </div>
                          <div>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {app.creator_name || '未知创作者'}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {new Date(app.created_at).toLocaleDateString()} 申请
                            </p>
                          </div>
                        </div>
                        <ApplicationStatusBadge status={app.status} />
                      </div>

                      {app.message && (
                        <div className={`mt-3 p-3 rounded-lg text-sm ${
                          isDark ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-600'
                        }`}>
                          <MessageSquare className="w-4 h-4 inline mr-1" />
                          {app.message}
                        </div>
                      )}

                      {app.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => onReview(app.id, 'approved')}
                            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            通过
                          </button>
                          <button
                            onClick={() => onReview(app.id, 'rejected')}
                            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            拒绝
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 底部 */}
          <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end`}>
            <button
              onClick={onClose}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              关闭
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// 主组件
const BrandOrderManagement: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  
  const [orders, setOrders] = useState<BrandOrder[]>([]);
  const [stats, setStats] = useState<BrandOrderStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalApplications: 0,
    pendingApplications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<BrandOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 加载数据
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const [ordersData, statsData] = await Promise.all([
        brandOrderService.getBrandOrders(user.id, {
          status: filter === 'all' ? undefined : filter,
          keyword: searchKeyword || undefined,
        }),
        brandOrderService.getBrandOrderStats(user.id),
      ]);
      
      setOrders(ordersData);
      setStats(statsData);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [user?.id, filter, searchKeyword]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 审核申请
  const handleReview = async (applicationId: string, status: 'approved' | 'rejected') => {
    try {
      const success = await brandOrderService.reviewApplication(applicationId, status);
      if (success) {
        toast.success(status === 'approved' ? '已通过申请' : '已拒绝申请');
        // 刷新详情
        if (selectedOrder) {
          const detail = await brandOrderService.getBrandOrderDetail(selectedOrder.id);
          if (detail) {
            setSelectedOrder(detail);
          }
        }
        // 刷新列表
        loadData();
      } else {
        toast.error('操作失败');
      }
    } catch (error) {
      console.error('审核失败:', error);
      toast.error('审核失败');
    }
  };

  // 打开详情
  const openDetail = async (order: BrandOrder) => {
    const detail = await brandOrderService.getBrandOrderDetail(order.id);
    if (detail) {
      setSelectedOrder(detail);
      setIsDetailOpen(true);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            商单管理
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            管理您发布的商单和接单申请
          </p>
        </div>
        <button
          onClick={loadData}
          className={`p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label="总商单"
          value={stats.total}
          color="bg-blue-500"
        />
        <StatCard
          icon={Clock}
          label="审核中"
          value={stats.pending}
          color="bg-yellow-500"
        />
        <StatCard
          icon={CheckCircle}
          label="已通过"
          value={stats.approved}
          color="bg-green-500"
        />
        <StatCard
          icon={Users}
          label="待审核申请"
          value={stats.pendingApplications}
          color="bg-purple-500"
        />
      </div>

      {/* 筛选和搜索 */}
      <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col md:flex-row gap-4">
          {/* 状态筛选 */}
          <div className="flex gap-2">
            {[
              { key: 'all', label: '全部' },
              { key: 'pending', label: '审核中' },
              { key: 'approved', label: '已通过' },
              { key: 'rejected', label: '已驳回' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === item.key
                    ? 'bg-blue-500 text-white'
                    : isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="搜索商单标题或品牌..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm border transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>
        </div>
      </div>

      {/* 商单列表 */}
      <div className="space-y-4">
        {loading ? (
          // 加载状态
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : orders.length === 0 ? (
          // 空状态
          <div className={`text-center py-12 rounded-xl border ${
            isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <Package className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              暂无商单
            </p>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              您还没有发布任何商单，去发布一个吧
            </p>
          </div>
        ) : (
          // 商单列表
          orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-lg ${
                isDark
                  ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => openDetail(order)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {order.title}
                    </h3>
                    <StatusBadge status={order.status} />
                  </div>
                  
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    品牌：{order.brand_name}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <div className={`flex items-center gap-1 text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <DollarSign className="w-4 h-4" />
                      ¥{order.budget_min}-¥{order.budget_max}
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <Calendar className="w-4 h-4" />
                      截止：{new Date(order.deadline).toLocaleDateString()}
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <Users className="w-4 h-4" />
                      最多{order.max_applicants}人
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <Briefcase className="w-4 h-4" />
                      {order.type}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {order.application_count > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isDark
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {order.application_count} 个申请
                    </span>
                  )}
                  <ChevronDown className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* 详情弹窗 */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onReview={handleReview}
      />
    </div>
  );
};

export default BrandOrderManagement;
