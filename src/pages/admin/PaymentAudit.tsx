import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import {
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Image as ImageIcon,
  User,
  CreditCard,
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
  QrCode,
  CheckSquare,
  XSquare,
  AlertCircle,
  FileText,
  RotateCcw
} from 'lucide-react';

// 支付订单状态类型
type PaymentStatus = 'pending' | 'verifying' | 'completed' | 'failed' | 'cancelled' | 'refunded';

// 支付类型
type PaymentType = 'enterprise' | 'personal_qr';

// 支付订单接口
interface PaymentOrder {
  id: string;
  user_id: string;
  username: string;
  user_email?: string;
  user_avatar?: string;
  membership_type: string;
  membership_name: string;
  amount: number;
  status: PaymentStatus;
  payment_type: PaymentType;
  payment_code?: string;
  payment_proof?: {
    image_url: string;
    uploaded_at: string;
    description?: string;
  };
  payer_info?: {
    name?: string;
    phone?: string;
    note?: string;
  };
  verified_by?: string;
  verified_by_name?: string;
  verified_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// 审核统计接口
interface AuditStats {
  total: number;
  pending: number;
  verifying: number;
  completed: number;
  failed: number;
  todayCount: number;
  todayAmount: number;
}

const PaymentAudit: React.FC = () => {
  const { isDark } = useTheme();
  
  // 订单列表状态
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // 筛选和搜索状态
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<PaymentType | 'all'>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // 统计状态
  const [stats, setStats] = useState<AuditStats>({
    total: 0,
    pending: 0,
    verifying: 0,
    completed: 0,
    failed: 0,
    todayCount: 0,
    todayAmount: 0
  });
  
  // 审核备注
  const [auditNote, setAuditNote] = useState('');
  const [processingAction, setProcessingAction] = useState<'approve' | 'reject' | 'refund' | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  
  // 凭证图片弹窗
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofModalUrl, setProofModalUrl] = useState('');

  // 获取订单列表
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabaseAdmin
        .from('membership_orders')
        .select(`
          *,
          user:user_id (username, email, avatar_url)
        `, { count: 'exact' });

      // 状态筛选
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // 支付类型筛选
      if (paymentTypeFilter !== 'all') {
        query = query.eq('payment_type', paymentTypeFilter);
      }

      // 日期范围筛选
      if (dateRange !== 'all') {
        const now = new Date();
        const startDate = new Date();
        switch (dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        }
        query = query.gte('created_at', startDate.toISOString());
      }

      // 搜索筛选
      if (searchTerm) {
        query = query.or(`payment_code.ilike.%${searchTerm}%,user.username.ilike.%${searchTerm}%,user.email.ilike.%${searchTerm}%`);
      }

      // 分页
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const formattedOrders: PaymentOrder[] = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        username: item.user?.username || '未知用户',
        user_email: item.user?.email,
        user_avatar: item.user?.avatar_url,
        membership_type: item.membership_type,
        membership_name: item.membership_name,
        amount: item.amount,
        status: item.status,
        payment_type: item.payment_type || 'enterprise',
        payment_code: item.payment_code,
        payment_proof: item.payment_proof,
        payer_info: item.payer_info,
        verified_by: item.verified_by,
        verified_by_name: item.verified_by_name,
        verified_at: item.verified_at,
        notes: item.notes,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setOrders(formattedOrders);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('获取订单列表失败:', error);
      toast.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentTypeFilter, dateRange, searchTerm, currentPage, pageSize]);

  // 获取统计数据
  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('membership_orders')
        .select('status, amount, created_at');

      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const statsData = (data || []).reduce((acc: AuditStats, item: any) => {
        acc.total++;
        if (item.status === 'pending') acc.pending++;
        if (item.status === 'verifying') acc.verifying++;
        if (item.status === 'completed') acc.completed++;
        if (item.status === 'failed') acc.failed++;
        
        const itemDate = new Date(item.created_at);
        if (itemDate >= today) {
          acc.todayCount++;
          acc.todayAmount += item.amount || 0;
        }
        
        return acc;
      }, {
        total: 0,
        pending: 0,
        verifying: 0,
        completed: 0,
        failed: 0,
        todayCount: 0,
        todayAmount: 0
      });

      setStats(statsData);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders, fetchStats]);

  // 处理审核通过
  const handleApprove = async () => {
    if (!selectedOrder) return;
    
    setProcessingAction('approve');
    try {
      const { error } = await supabaseAdmin
        .from('membership_orders')
        .update({
          status: 'completed',
          verified_at: new Date().toISOString(),
          notes: auditNote || '审核通过'
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      // 更新用户会员状态
      await supabaseAdmin
        .from('users')
        .update({
          membership_level: selectedOrder.membership_type,
          membership_status: 'active',
          membership_start: new Date().toISOString(),
          membership_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1年有效期
        })
        .eq('id', selectedOrder.user_id);

      toast.success('审核通过，会员已激活');
      setShowDetailModal(false);
      setAuditNote('');
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error('审核失败:', error);
      toast.error('审核操作失败');
    } finally {
      setProcessingAction(null);
    }
  };

  // 处理审核拒绝
  const handleReject = async () => {
    if (!selectedOrder) return;
    
    setProcessingAction('reject');
    try {
      const { error } = await supabaseAdmin
        .from('membership_orders')
        .update({
          status: 'failed',
          verified_at: new Date().toISOString(),
          notes: auditNote || '审核未通过'
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast.success('已拒绝该支付申请');
      setShowDetailModal(false);
      setAuditNote('');
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error('拒绝失败:', error);
      toast.error('操作失败');
    } finally {
      setProcessingAction(null);
    }
  };

  // 处理退款
  const handleRefund = async () => {
    if (!selectedOrder) return;
    
    const amount = parseFloat(refundAmount);
    if (!amount || amount <= 0 || amount > selectedOrder.amount) {
      toast.error('请输入有效的退款金额');
      return;
    }
    
    setProcessingAction('refund');
    try {
      const { error } = await supabaseAdmin
        .from('membership_orders')
        .update({
          status: 'refunded',
          refund_amount: amount,
          refunded_at: new Date().toISOString(),
          notes: auditNote || `已退款 ¥${amount}`
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      // 如果全额退款，取消用户会员状态
      if (amount >= selectedOrder.amount) {
        await supabaseAdmin
          .from('users')
          .update({
            membership_status: 'inactive',
            membership_end: new Date().toISOString()
          })
          .eq('id', selectedOrder.user_id);
      }

      toast.success(`退款成功，金额：¥${amount}`);
      setShowRefundModal(false);
      setShowDetailModal(false);
      setAuditNote('');
      setRefundAmount('');
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error('退款失败:', error);
      toast.error('退款操作失败');
    } finally {
      setProcessingAction(null);
    }
  };

  // 导出数据
  const handleExport = () => {
    const csvContent = [
      ['订单ID', '用户名', '邮箱', '会员类型', '金额', '状态', '支付方式', '支付识别码', '创建时间', '审核时间', '备注'].join(','),
      ...orders.map(order => [
        order.id,
        order.username,
        order.user_email || '',
        order.membership_name,
        order.amount,
        order.status,
        order.payment_type === 'personal_qr' ? '个人收款码' : '企业支付',
        order.payment_code || '',
        new Date(order.created_at).toLocaleString('zh-CN'),
        order.verified_at ? new Date(order.verified_at).toLocaleString('zh-CN') : '',
        order.notes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `支付审核记录_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success('数据导出成功');
  };

  // 获取状态显示
  const getStatusDisplay = (status: PaymentStatus) => {
    const statusMap = {
      pending: { label: '待支付', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
      verifying: { label: '待审核', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Eye },
      completed: { label: '已完成', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
      failed: { label: '已拒绝', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
      cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400', icon: XSquare },
      refunded: { label: '已退款', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: AlertCircle }
    };
    return statusMap[status];
  };

  // 统计卡片组件
  const StatCard = ({ title, value, subValue, icon: Icon, color }: {
    title: string;
    value: string | number;
    subValue?: string;
    icon: React.ElementType;
    color: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subValue && (
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{subValue}</p>
          )}
        </div>
        <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">会员支付审核</h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            审核会员支付凭证，管理订单状态
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
            onClick={() => { fetchOrders(); fetchStats(); }}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
            } shadow-sm disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </motion.button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="待审核"
          value={stats.verifying}
          icon={Eye}
          color="#3b82f6"
        />
        <StatCard
          title="今日订单"
          value={stats.todayCount}
          subValue={`¥${stats.todayAmount.toFixed(2)}`}
          icon={Calendar}
          color="#10b981"
        />
        <StatCard
          title="已完成"
          value={stats.completed}
          icon={CheckCircle}
          color="#22c55e"
        />
        <StatCard
          title="总订单数"
          value={stats.total}
          icon={CreditCard}
          color="#8b5cf6"
        />
      </div>

      {/* 筛选栏 */}
      <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="flex flex-col md:flex-row gap-4">
          {/* 搜索框 */}
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="搜索用户名、邮箱或支付识别码..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm transition-colors ${
                isDark 
                  ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600' 
                  : 'bg-gray-50 text-gray-900 placeholder-gray-500 border-gray-200'
              } border focus:outline-none focus:ring-2 focus:ring-red-500`}
            />
          </div>

          {/* 状态筛选 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
            className={`px-4 py-2 rounded-xl text-sm transition-colors ${
              isDark 
                ? 'bg-gray-700 text-white border-gray-600' 
                : 'bg-gray-50 text-gray-900 border-gray-200'
            } border focus:outline-none focus:ring-2 focus:ring-red-500`}
          >
            <option value="all">全部状态</option>
            <option value="verifying">待审核</option>
            <option value="pending">待支付</option>
            <option value="completed">已完成</option>
            <option value="failed">已拒绝</option>
            <option value="cancelled">已取消</option>
          </select>

          {/* 支付类型筛选 */}
          <select
            value={paymentTypeFilter}
            onChange={(e) => setPaymentTypeFilter(e.target.value as PaymentType | 'all')}
            className={`px-4 py-2 rounded-xl text-sm transition-colors ${
              isDark 
                ? 'bg-gray-700 text-white border-gray-600' 
                : 'bg-gray-50 text-gray-900 border-gray-200'
            } border focus:outline-none focus:ring-2 focus:ring-red-500`}
          >
            <option value="all">全部支付方式</option>
            <option value="personal_qr">个人收款码</option>
            <option value="enterprise">企业支付</option>
          </select>

          {/* 日期范围 */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className={`px-4 py-2 rounded-xl text-sm transition-colors ${
              isDark 
                ? 'bg-gray-700 text-white border-gray-600' 
                : 'bg-gray-50 text-gray-900 border-gray-200'
            } border focus:outline-none focus:ring-2 focus:ring-red-500`}
          >
            <option value="all">全部时间</option>
            <option value="today">今天</option>
            <option value="week">最近7天</option>
            <option value="month">最近30天</option>
          </select>
        </div>
      </div>

      {/* 订单列表 */}
      <div className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">用户信息</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">会员类型</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">金额</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">支付方式</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">支付识别码</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">支付凭证</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">创建时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-red-600" />
                    <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>加载中...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <FileText className="w-12 h-12 mx-auto text-gray-400" />
                    <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>暂无订单数据</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const statusDisplay = getStatusDisplay(order.status);
                  const StatusIcon = statusDisplay.icon;
                  
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`hover:${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} transition-colors`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={order.user_avatar || 'https://via.placeholder.com/40'}
                            alt={order.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium text-sm">{order.username}</p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{order.user_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{order.membership_name}</span>
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {order.membership_type === 'premium' && '高级会员'}
                            {order.membership_type === 'basic' && '基础会员'}
                            {order.membership_type === 'vip' && 'VIP会员'}
                            {order.membership_type === 'svip' && 'SVIP会员'}
                            {!['premium', 'basic', 'vip', 'svip'].includes(order.membership_type) && order.membership_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-red-600">¥{order.amount}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          order.payment_type === 'personal_qr' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {order.payment_type === 'personal_qr' ? <QrCode className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                          {order.payment_type === 'personal_qr' ? '个人收款码' : '企业支付'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusDisplay.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusDisplay.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <code className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          {order.payment_code || '-'}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        {order.payment_proof?.image_url ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setProofModalUrl(order.payment_proof!.image_url);
                              setShowProofModal(true);
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                          >
                            <ImageIcon className="w-3 h-3" />
                            查看凭证
                          </motion.button>
                        ) : (
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(order.created_at).toLocaleString('zh-CN')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDetailModal(true);
                              setAuditNote('');
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            查看
                          </motion.button>
                          {order.status === 'verifying' && (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowDetailModal(true);
                                  setAuditNote('');
                                  // 延迟执行审核通过，等待弹窗打开
                                  setTimeout(() => {
                                    if (confirm('确认审核通过该订单？')) {
                                      handleApprove();
                                    }
                                  }, 300);
                                }}
                                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                              >
                                <CheckCircle className="w-3 h-3" />
                                通过
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowDetailModal(true);
                                  setAuditNote('');
                                  // 延迟执行审核拒绝，等待弹窗打开
                                  setTimeout(() => {
                                    if (confirm('确认拒绝该订单？')) {
                                      handleReject();
                                    }
                                  }, 300);
                                }}
                                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                              >
                                <XCircle className="w-3 h-3" />
                                拒绝
                              </motion.button>
                            </>
                          )}
                          {order.status === 'completed' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setSelectedOrder(order);
                                setRefundAmount(order.amount.toString());
                                setAuditNote('');
                                setShowRefundModal(true);
                              }}
                              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" />
                              退款
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            共 {totalCount} 条记录，第 {currentPage} / {Math.ceil(totalCount / pageSize)} 页
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / pageSize), p + 1))}
              disabled={currentPage >= Math.ceil(totalCount / pageSize)}
              className={`p-2 rounded-lg transition-colors ${
                currentPage >= Math.ceil(totalCount / pageSize)
                  ? 'opacity-50 cursor-not-allowed'
                  : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 凭证图片弹窗 */}
      <AnimatePresence>
        {showProofModal && proofModalUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setShowProofModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh]"
            >
              <button
                onClick={() => setShowProofModal(false)}
                className="absolute -top-10 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <XCircle className="w-6 h-6 text-white" />
              </button>
              <img
                src={proofModalUrl}
                alt="支付凭证"
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 退款弹窗 */}
      <AnimatePresence>
        {showRefundModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowRefundModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
            >
              {/* 弹窗头部 */}
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <div>
                  <h3 className="text-xl font-bold">订单退款</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>订单号: {selectedOrder.id}</p>
                </div>
                <button
                  onClick={() => setShowRefundModal(false)}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* 弹窗内容 */}
              <div className="p-6 space-y-4">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>订单金额</span>
                    <span className="font-bold text-lg">¥{selectedOrder.amount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>会员类型</span>
                    <span className="font-medium">{selectedOrder.membership_name}</span>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    退款金额 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder="请输入退款金额"
                      min="0.01"
                      max={selectedOrder.amount}
                      step="0.01"
                      className={`w-full pl-8 pr-4 py-2 rounded-xl text-sm transition-colors ${
                        isDark 
                          ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600' 
                          : 'bg-gray-50 text-gray-900 placeholder-gray-500 border-gray-200'
                      } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    最大可退款金额：¥{selectedOrder.amount}
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    退款备注
                  </label>
                  <textarea
                    value={auditNote}
                    onChange={(e) => setAuditNote(e.target.value)}
                    placeholder="请输入退款原因或备注（可选）..."
                    rows={3}
                    className={`w-full px-4 py-2 rounded-xl text-sm transition-colors resize-none ${
                      isDark 
                        ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600' 
                        : 'bg-gray-50 text-gray-900 placeholder-gray-500 border-gray-200'
                    } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowRefundModal(false)}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                      isDark 
                        ? 'bg-gray-700 text-white hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    取消
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRefund}
                    disabled={processingAction === 'refund' || !refundAmount}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {processingAction === 'refund' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    确认退款
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 详情弹窗 */}
      <AnimatePresence>
        {showDetailModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
            >
              {/* 弹窗头部 */}
              <div className={`sticky top-0 px-6 py-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} flex items-center justify-between`}>
                <div>
                  <h3 className="text-xl font-bold">订单详情</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>订单号: {selectedOrder.id}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* 弹窗内容 */}
              <div className="p-6 space-y-6">
                {/* 用户信息 */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-red-600" />
                    用户信息
                  </h4>
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedOrder.user_avatar || 'https://via.placeholder.com/60'}
                      alt={selectedOrder.username}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-lg">{selectedOrder.username}</p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{selectedOrder.user_email}</p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>用户ID: {selectedOrder.user_id}</p>
                    </div>
                  </div>
                </div>

                {/* 订单信息 */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-red-600" />
                    订单信息
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>会员类型</p>
                      <p className="font-medium">{selectedOrder.membership_name}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {selectedOrder.membership_type === 'premium' && '高级会员'}
                        {selectedOrder.membership_type === 'basic' && '基础会员'}
                        {selectedOrder.membership_type === 'vip' && 'VIP会员'}
                        {selectedOrder.membership_type === 'svip' && 'SVIP会员'}
                        {!['premium', 'basic', 'vip', 'svip'].includes(selectedOrder.membership_type) && selectedOrder.membership_type}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>支付金额</p>
                      <p className="font-bold text-red-600 text-lg">¥{selectedOrder.amount}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>支付方式</p>
                      <p className="font-medium">
                        {selectedOrder.payment_type === 'personal_qr' ? '个人收款码' : '企业支付'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>支付识别码</p>
                      <code className={`text-sm px-2 py-1 rounded ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                        {selectedOrder.payment_code || '-'}
                      </code>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>创建时间</p>
                      <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString('zh-CN')}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>当前状态</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusDisplay(selectedOrder.status).color}`}>
                        {React.createElement(getStatusDisplay(selectedOrder.status).icon, { className: 'w-3 h-3' })}
                        {getStatusDisplay(selectedOrder.status).label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 付款人信息 */}
                {selectedOrder.payer_info && (
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <User className="w-4 h-4 text-red-600" />
                      付款人信息
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedOrder.payer_info.name && (
                        <div>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>付款人姓名</p>
                          <p className="font-medium">{selectedOrder.payer_info.name}</p>
                        </div>
                      )}
                      {selectedOrder.payer_info.phone && (
                        <div>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>联系电话</p>
                          <p className="font-medium">{selectedOrder.payer_info.phone}</p>
                        </div>
                      )}
                      {selectedOrder.payer_info.note && (
                        <div className="col-span-2">
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>备注</p>
                          <p className="font-medium">{selectedOrder.payer_info.note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 支付凭证 */}
                {selectedOrder.payment_proof?.image_url && (
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-red-600" />
                      支付凭证
                    </h4>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setProofModalUrl(selectedOrder.payment_proof!.image_url);
                          setShowProofModal(true);
                        }}
                        className="block relative group w-full"
                      >
                        <img
                          src={selectedOrder.payment_proof.image_url}
                          alt="支付凭证"
                          className="w-full max-h-96 object-contain rounded-lg border-2 border-transparent group-hover:border-red-500 transition-colors"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          <span className="text-white text-sm font-medium flex items-center gap-2">
                            <Eye className="w-5 h-5" />
                            点击查看大图
                          </span>
                        </div>
                      </button>
                      {selectedOrder.payment_proof.description && (
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          用户备注: {selectedOrder.payment_proof.description}
                        </p>
                      )}
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        上传时间: {new Date(selectedOrder.payment_proof.uploaded_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                )}

                {/* 审核历史 */}
                {selectedOrder.verified_at && (
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-red-600" />
                      审核记录
                    </h4>
                    <div className="space-y-2">
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        审核人: {selectedOrder.verified_by_name || selectedOrder.verified_by}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        审核时间: {new Date(selectedOrder.verified_at).toLocaleString('zh-CN')}
                      </p>
                      {selectedOrder.notes && (
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          审核备注: {selectedOrder.notes}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 审核操作区 */}
                {selectedOrder.status === 'verifying' ? (
                  <div className={`p-4 rounded-xl border-2 border-red-500 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <h4 className="font-medium mb-3 flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      审核操作
                    </h4>
                    <div className="space-y-4">
                      <textarea
                        value={auditNote}
                        onChange={(e) => setAuditNote(e.target.value)}
                        placeholder="请输入审核备注（可选）..."
                        rows={3}
                        className={`w-full px-4 py-2 rounded-xl text-sm transition-colors resize-none ${
                          isDark 
                            ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600' 
                            : 'bg-gray-50 text-gray-900 placeholder-gray-500 border-gray-200'
                        } border focus:outline-none focus:ring-2 focus:ring-red-500`}
                      />
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleApprove}
                          disabled={processingAction !== null}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {processingAction === 'approve' ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          审核通过并开通会员
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleReject}
                          disabled={processingAction !== null}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {processingAction === 'reject' ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          拒绝申请
                        </motion.button>
                      </div>
                    </div>
                  </div>
                ) : selectedOrder.status === 'pending' ? (
                  <div className={`p-4 rounded-xl border-2 border-yellow-500 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <h4 className="font-medium mb-2 flex items-center gap-2 text-yellow-600">
                      <Clock className="w-4 h-4" />
                      等待用户支付
                    </h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      该订单尚未收到支付凭证，等待用户上传支付截图后才能进行审核。
                    </p>
                  </div>
                ) : selectedOrder.status === 'completed' ? (
                  <div className={`p-4 rounded-xl border-2 border-green-500 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <h4 className="font-medium mb-2 flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      审核已完成
                    </h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      该订单已审核通过，会员已开通。
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setRefundAmount(selectedOrder.amount.toString());
                        setAuditNote('');
                        setShowRefundModal(true);
                      }}
                      className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      申请退款
                    </motion.button>
                  </div>
                ) : selectedOrder.status === 'failed' ? (
                  <div className={`p-4 rounded-xl border-2 border-red-500 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <h4 className="font-medium mb-2 flex items-center gap-2 text-red-600">
                      <XCircle className="w-4 h-4" />
                      已拒绝
                    </h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      该订单已被拒绝。
                    </p>
                  </div>
                ) : selectedOrder.status === 'refunded' ? (
                  <div className={`p-4 rounded-xl border-2 border-purple-500 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <h4 className="font-medium mb-2 flex items-center gap-2 text-purple-600">
                      <RotateCcw className="w-4 h-4" />
                      已退款
                    </h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      该订单已退款处理。
                    </p>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentAudit;