import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Play,
  TrendingUp,
  DollarSign,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  Package,
  Target,
  Zap,
  Award,
  MousePointer,
  Percent,
  Settings,
  Info,
  ArrowRight,
  Star,
  Flame,
  ShoppingCart,
  Activity
} from 'lucide-react';
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';
import { promotionService } from '@/services/promotionService';

// 数据库推广订单类型（下划线命名）
interface DbPromotionOrder {
  id: string;
  user_id: string;
  order_no: string;
  work_id: string;
  work_title: string;
  work_thumbnail?: string;
  package_type: 'standard' | 'basic' | 'long' | 'custom';
  package_name: string;
  package_duration?: number;
  expected_views_min?: number;
  expected_views_max?: number;
  target_type: 'account' | 'product' | 'live';
  metric_type: 'views' | 'followers' | 'engagement' | 'heat';
  original_price: number;
  discount_amount: number;
  final_price: number;
  status: 'pending' | 'paid' | 'processing' | 'active' | 'completed' | 'cancelled' | 'refunded';
  payment_method?: string;
  payment_time?: string;
  start_time?: string;
  end_time?: string;
  actual_views?: number;
  actual_clicks?: number;
  created_at: string;
  updated_at?: string;
  user?: {
    id: string;
    username: string;
    email?: string;
    avatar_url?: string;
  };
}

// 推广套餐配置
const packageConfig = {
  standard: {
    label: '标准套餐',
    color: 'blue',
    duration: '24小时',
    targetViews: 1000,
    price: 98,
    description: '适合新作品快速获得初始曝光',
    features: ['24小时推广时长', '预计1000+曝光', '基础排序权重', '标准展示位置']
  },
  basic: {
    label: '基础套餐',
    color: 'green',
    duration: '24小时',
    targetViews: 2500,
    price: 198,
    description: '适合需要更多曝光的作品',
    features: ['24小时推广时长', '预计2500+曝光', '中等排序权重', '优先展示位置']
  },
  long: {
    label: '长效套餐',
    color: 'purple',
    duration: '48小时',
    targetViews: 7500,
    price: 498,
    description: '适合重要作品长期推广',
    features: ['48小时推广时长', '预计7500+曝光', '高排序权重', '置顶展示位置', '精选标识']
  },
  custom: {
    label: '定制套餐',
    color: 'orange',
    duration: '自定义',
    targetViews: 15000,
    price: 998,
    description: '适合品牌宣传或爆款打造',
    features: ['自定义推广时长', '预计15000+曝光', '最高排序权重', '首页置顶', '精选标识', '专属客服']
  }
};

// 订单状态配置
const orderStatusConfig = {
  pending: { label: '待支付', color: 'yellow', icon: Clock },
  paid: { label: '待审核', color: 'blue', icon: Eye },
  processing: { label: '审核中', color: 'purple', icon: Settings },
  active: { label: '推广中', color: 'green', icon: TrendingUp },
  completed: { label: '已完成', color: 'gray', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'red', icon: XCircle },
  refunded: { label: '已退款', color: 'orange', icon: DollarSign }
};

// 推广机制说明
const promotionMechanism = {
  title: '推广机制说明',
  description: '必火推广采用智能排序算法，根据推广权重、点击率、时间等因素综合计算展示位置',
  rules: [
    { title: '排序算法', desc: '推广权重 × 时间因子 × 效果因子 × 套餐因子 = 优先级分数' },
    { title: '展示位置', desc: '置顶推广优先展示在首页前3位，普通推广每隔5个作品插入1个' },
    { title: '效果追踪', desc: '实时统计曝光量、点击量、点击率，支持按天查看趋势' },
    { title: '流量分配', desc: '根据套餐类型分配不同流量，长效套餐获得更多曝光机会' }
  ]
};

export default function PromotionUserManagement() {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // 数据状态
  const [orders, setOrders] = useState<DbPromotionOrder[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingCount: 0,
    paidCount: 0,
    processingCount: 0,
    activeCount: 0,
    completedCount: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    totalImpressions: 0,
    totalClicks: 0,
    avgCtr: 0
  });
  const [promotedWorks, setPromotedWorks] = useState<any[]>([]);

  // UI状态
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<DbPromotionOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showMechanismModal, setShowMechanismModal] = useState(false);
  const [auditAction, setAuditAction] = useState<'approve' | 'reject'>('approve');
  const [auditNotes, setAuditNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // 筛选状态
  const [statusFilter, setStatusFilter] = useState<string>('paid'); // 默认显示待审核
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'payment_time'>('payment_time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // 获取数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('========== 开始获取推广数据 ==========');
      console.log('当前筛选状态:', statusFilter);
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('是否使用 Service Role:', !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

      // 首先检查数据库连接
      console.log('测试数据库连接...');
      const { data: testData, error: testError } = await supabaseAdmin
        .from('promotion_orders')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('数据库连接测试失败:', testError);
        toast.error('数据库连接失败: ' + testError.message);
        setLoading(false);
        return;
      }
      console.log('数据库连接正常');

      // 获取推广订单
      console.log('开始获取推广订单...');
      let query = supabaseAdmin
        .from('promotion_orders')
        .select('*', { count: 'exact' });

      // 状态筛选
      if (statusFilter !== 'all') {
        console.log('应用状态筛选:', statusFilter);
        query = query.eq('status', statusFilter);
      }

      // 搜索
      if (searchQuery) {
        console.log('应用搜索:', searchQuery);
        query = query.or(`order_no.ilike.%${searchQuery}%,work_title.ilike.%${searchQuery}%`);
      }

      // 排序
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // 分页
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: ordersData, error: ordersError, count } = await query;

      if (ordersError) {
        console.error('获取订单失败:', ordersError);
        toast.error('获取订单失败: ' + ordersError.message);
        throw ordersError;
      }

      console.log('获取到订单数据:', ordersData?.length || 0, '条, 总计:', count || 0);
      if (ordersData && ordersData.length > 0) {
        console.log('第一条订单:', JSON.stringify(ordersData[0], null, 2));
      }

      // 获取用户信息
      const userIds = [...new Set((ordersData || []).map((o: any) => o.user_id).filter(Boolean))];
      console.log('需要获取的用户IDs:', userIds);

      let usersMap = new Map();
      if (userIds.length > 0) {
        console.log('开始获取用户信息...');
        const { data: usersData, error: usersError } = await supabaseAdmin
          .from('users')
          .select('id, username, avatar_url, email')
          .in('id', userIds);

        if (usersError) {
          console.error('获取用户信息失败:', usersError);
        } else {
          console.log('获取到用户数据:', usersData?.length || 0, '条');
          usersData?.forEach((u: any) => usersMap.set(u.id, u));
        }
      }

      // 合并数据
      const ordersWithUser = (ordersData || []).map((order: any) => ({
        ...order,
        user: usersMap.get(order.user_id)
      }));

      setOrders(ordersWithUser);
      setTotalCount(count || 0);

      // 获取统计数据
      console.log('开始获取统计数据...');
      const { data: allOrders, error: allOrdersError } = await supabaseAdmin
        .from('promotion_orders')
        .select('status, final_price, created_at, actual_views, actual_clicks');

      if (allOrdersError) {
        console.error('获取统计数据失败:', allOrdersError);
      } else {
        console.log('所有订单数据:', allOrders?.length || 0, '条');
      }

      // 获取推广作品统计
      console.log('开始获取推广作品统计...');
      let totalImpressions = 0;
      let totalClicks = 0;

      try {
        const { data: promotedWorksData, error: promotedError } = await supabaseAdmin
          .from('promoted_works')
          .select('status, actual_views, actual_clicks');

        if (promotedError) {
          console.error('获取推广作品失败:', promotedError);
        } else {
          console.log('推广作品数据:', promotedWorksData?.length || 0, '条');
          totalImpressions = promotedWorksData?.reduce((sum: number, pw: any) => sum + (pw.actual_views || 0), 0) || 0;
          totalClicks = promotedWorksData?.reduce((sum: number, pw: any) => sum + (pw.actual_clicks || 0), 0) || 0;
        }
      } catch (e) {
        console.error('获取推广作品统计异常:', e);
      }

      const today = new Date().toISOString().split('T')[0];

      const newStats = {
        totalOrders: allOrders?.length || 0,
        pendingCount: allOrders?.filter((o: any) => o.status === 'pending').length || 0,
        paidCount: allOrders?.filter((o: any) => o.status === 'paid').length || 0,
        processingCount: allOrders?.filter((o: any) => o.status === 'processing').length || 0,
        activeCount: allOrders?.filter((o: any) => o.status === 'active').length || 0,
        completedCount: allOrders?.filter((o: any) => o.status === 'completed').length || 0,
        totalRevenue: allOrders?.reduce((sum: number, o: any) => sum + (o.final_price || 0), 0) || 0,
        todayRevenue: allOrders?.filter((o: any) => o.created_at?.startsWith(today))
          .reduce((sum: number, o: any) => sum + (o.final_price || 0), 0) || 0,
        totalImpressions,
        totalClicks,
        avgCtr: totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0
      };

      console.log('统计数据:', newStats);
      setStats(newStats);

      // 获取正在推广的作品
      console.log('开始获取活跃推广作品...');
      try {
        const { data: activePromoted, error: activeError } = await supabaseAdmin
          .from('promoted_works')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(10);

        if (activeError) {
          console.error('获取活跃推广作品失败:', activeError);
          setPromotedWorks([]);
        } else if (activePromoted && activePromoted.length > 0) {
          console.log('活跃推广作品:', activePromoted.length, '条');
          
          // 获取关联的订单信息以获取用户和作品详情
          const orderIds = activePromoted.map(pw => pw.order_id);
          const { data: ordersData } = await supabaseAdmin
            .from('promotion_orders')
            .select('id, user_id, work_id, work_title, work_thumbnail')
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
          const enrichedPromotedWorks = activePromoted.map(pw => {
            const order = orderMap.get(pw.order_id);
            const user = order ? userMap.get(order.user_id) : null;
            return {
              ...pw,
              work_title: order?.work_title || pw.work_title,
              work_thumbnail: order?.work_thumbnail || pw.work_thumbnail,
              user_username: user?.username || '未知用户',
              user_avatar: user?.avatar_url || null,
            };
          });

          setPromotedWorks(enrichedPromotedWorks);
        } else {
          setPromotedWorks([]);
        }
      } catch (e) {
        console.error('获取活跃推广作品异常:', e);
        setPromotedWorks([]);
      }
      console.log('========== 数据获取完成 ==========');
    } catch (error: any) {
      console.error('获取推广数据失败:', error);
      toast.error('获取数据失败: ' + (error?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, sortBy, sortOrder, currentPage, pageSize]);

  // 初始加载
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 处理审核
  const handleAudit = async () => {
    if (!selectedOrder) return;

    setProcessing(true);
    try {
      const approved = auditAction === 'approve';
      const success = await promotionService.auditOrder(selectedOrder.id, approved, auditNotes);

      if (success) {
        if (approved) {
          toast.success('审核通过，推广已开始实施');
        } else {
          toast.success('已拒绝推广申请');
        }
        setShowAuditModal(false);
        setAuditNotes('');
        fetchData();
      } else {
        toast.error('审核操作失败，请重试');
      }
    } catch (error) {
      console.error('审核失败:', error);
      toast.error('审核操作失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  // 导出数据
  const handleExport = async () => {
    try {
      const { data } = await supabaseAdmin
        .from('promotion_orders')
        .select('*')
        .order('created_at', { ascending: false });

      const csv = [
        ['订单号', '作品标题', '用户', '套餐类型', '金额', '状态', '创建时间', '支付时间'].join(','),
        ...(data || []).map((o: any) => [
          o.order_no,
          o.work_title,
          o.user_id,
          o.package_type,
          o.final_price,
          o.status,
          o.created_at,
          o.payment_time
        ].join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `推广订单_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      toast.error('导出失败');
    }
  };

  // 创建测试订单
  const createTestOrder = async () => {
    try {
      console.log('========== 开始创建测试订单 ==========');
      
      // 获取当前用户（使用普通 supabase 客户端获取会话）
      console.log('获取当前用户...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('获取用户失败:', authError);
        toast.error('获取用户信息失败: ' + authError.message);
        return;
      }
      if (!user) {
        console.error('用户未登录');
        toast.error('请先登录');
        return;
      }
      console.log('当前用户:', user.id);

      // 获取用户的作品
      console.log('获取用户作品...');
      const { data: works, error: worksError } = await supabaseAdmin
        .from('works')
        .select('id, title, thumbnail, cover_url')
        .eq('creator_id', user.id)
        .limit(1);

      if (worksError) {
        console.error('获取作品失败:', worksError);
        toast.error('获取作品失败: ' + worksError.message);
        return;
      }

      if (!works || works.length === 0) {
        console.log('用户没有作品');
        toast.error('您没有作品，请先创建一个作品');
        return;
      }

      const work = works[0];
      console.log('找到作品:', work.id, work.title);

      // 生成订单号
      const orderNo = `PROMO${Date.now()}`;
      console.log('生成订单号:', orderNo);

      // 准备订单数据
      const orderData = {
        user_id: user.id,
        order_no: orderNo,
        work_id: work.id,
        work_title: work.title || '测试作品',
        work_thumbnail: work.thumbnail || work.cover_url,
        package_type: 'standard',
        package_name: '标准套餐',
        package_duration: 24,
        expected_views_min: 800,
        expected_views_max: 1200,
        target_type: 'account',
        metric_type: 'views',
        original_price: 98,
        discount_amount: 0,
        final_price: 98,
        status: 'paid',
        payment_method: 'wechat',
        payment_time: new Date().toISOString()
      };
      console.log('准备插入的订单数据:', orderData);

      // 创建测试订单
      console.log('开始插入订单...');
      const { data: order, error } = await supabaseAdmin
        .from('promotion_orders')
        .insert(orderData)
        .select()
        .single();

      if (error) {
        console.error('创建测试订单失败:', error);
        console.error('错误详情:', JSON.stringify(error, null, 2));
        toast.error('创建测试订单失败: ' + error.message);
        return;
      }

      console.log('订单创建成功:', order);
      toast.success('测试订单创建成功！订单号: ' + orderNo);
      
      // 刷新数据
      console.log('刷新数据...');
      await fetchData();
      console.log('========== 测试订单创建完成 ==========');
    } catch (error: any) {
      console.error('创建测试订单失败:', error);
      console.error('错误堆栈:', error?.stack);
      toast.error('创建测试订单失败: ' + (error?.message || '未知错误'));
    }
  };

  // 打开详情弹窗
  const openDetailModal = (order: DbPromotionOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  // 打开审核弹窗
  const openAuditModal = (order: DbPromotionOrder, action: 'approve' | 'reject') => {
    setSelectedOrder(order);
    setAuditAction(action);
    setAuditNotes('');
    setShowAuditModal(true);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-pink-500" />
            推广订单管理
            <span className="text-sm font-normal text-gray-400">/ 审核</span>
          </h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            管理用户推广订单，审核支付后的推广申请
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin?tab=promotionOrderManagement')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isDark ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            订单
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/admin?tab=promotionOrderImplementation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            实施
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowMechanismModal(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Info className="w-4 h-4" />
            推广机制
          </button>
          <button
            onClick={handleExport}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Download className="w-4 h-4" />
            导出数据
          </button>
        </div>
      </div>

      {/* 推广套餐展示 */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          推广套餐配置
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(packageConfig).map(([key, pkg]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-xl border-2 ${isDark ? 'border-gray-700 bg-gray-700/30' : 'border-gray-200 bg-gray-50'} hover:border-pink-300 transition-colors`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-1 rounded-full text-xs bg-${pkg.color}-100 text-${pkg.color}-600`}>
                  {pkg.label}
                </span>
                <span className={`text-lg font-bold text-${pkg.color}-500`}>
                  ¥{pkg.price}
                </span>
              </div>
              <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {pkg.description}
              </p>
              <div className="space-y-1">
                {pkg.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <CheckCircle className={`w-3 h-3 text-${pkg.color}-500`} />
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 筛选栏 */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="flex flex-wrap items-center gap-4">
          {/* 搜索框 */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="搜索订单号、作品标题..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-pink-500`}
            />
          </div>

          {/* 状态筛选 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-pink-500`}
          >
            <option value="all">全部状态</option>
            <option value="pending">待支付</option>
            <option value="paid">待审核</option>
            <option value="processing">审核中</option>
            <option value="active">推广中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
            <option value="refunded">已退款</option>
          </select>

          {/* 排序 */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as 'created_at' | 'payment_time');
              setSortOrder(order as 'asc' | 'desc');
            }}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-pink-500`}
          >
            <option value="payment_time-desc">支付时间 ↓</option>
            <option value="payment_time-asc">支付时间 ↑</option>
            <option value="created_at-desc">创建时间 ↓</option>
            <option value="created_at-asc">创建时间 ↑</option>
          </select>
        </div>
      </div>

      {/* 数据表格 */}
      <div className={`rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <th className="px-4 py-3 text-left text-sm font-medium">作品信息</th>
                <th className="px-4 py-3 text-left text-sm font-medium">用户信息</th>
                <th className="px-4 py-3 text-left text-sm font-medium">套餐类型</th>
                <th className="px-4 py-3 text-left text-sm font-medium">支付金额</th>
                <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium">推广效果</th>
                <th className="px-4 py-3 text-left text-sm font-medium">支付时间</th>
                <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-4">
                      <div className={`h-12 rounded animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>暂无数据</p>
                      <p className="text-sm mt-2">点击上方"创建测试订单"按钮创建测试数据</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const status = orderStatusConfig[order.status as keyof typeof orderStatusConfig];
                  const pkg = packageConfig[order.package_type as keyof typeof packageConfig];
                  const StatusIcon = status?.icon || Clock;

                  return (
                    <tr
                      key={order.id}
                      className={`hover:${isDark ? 'bg-gray-700/30' : 'bg-gray-50/50'} transition-colors`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {order.work_thumbnail ? (
                            <img
                              src={order.work_thumbnail}
                              alt={order.work_title}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                              <Package className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                            </div>
                          )}
                          <div>
                            <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {order.work_title || '未命名作品'}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                              <Users className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium">{order.user?.username || '未知用户'}</p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {order.user?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs bg-${pkg?.color || 'gray'}-100 text-${pkg?.color || 'gray'}-600`}>
                          {pkg?.label || order.package_type}
                        </span>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          预计{order.expected_views_max || pkg?.targetViews || '-'}曝光
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
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-${status?.color || 'gray'}-100 text-${status?.color || 'gray'}-600`}>
                          <StatusIcon className="w-3 h-3" />
                          {status?.label || order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {order.status === 'active' || order.status === 'completed' ? (
                          <div>
                            <div className="flex items-center gap-2 text-sm">
                              <Eye className="w-3 h-3 text-blue-500" />
                              <span>{(order.actual_views || 0).toLocaleString()}</span>
                              <MousePointer className="w-3 h-3 text-purple-500 ml-2" />
                              <span>{(order.actual_clicks || 0).toLocaleString()}</span>
                            </div>
                            <div className="mt-1">
                              <div className={`h-1.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'} w-20`}>
                                <div
                                  className="h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500"
                                  style={{ width: `${Math.min(((order.actual_views || 0) / (order.expected_views_max || 1)) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            未开始推广
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {order.payment_time ? new Date(order.payment_time).toLocaleDateString() : '-'}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {order.payment_time ? new Date(order.payment_time).toLocaleTimeString() : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openDetailModal(order)}
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
                          </button>

                          {order.status === 'paid' && (
                            <>
                              <button
                                onClick={() => openAuditModal(order, 'approve')}
                                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                title="通过并开启推广"
                              >
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              </button>
                              <button
                                onClick={() => openAuditModal(order, 'reject')}
                                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                title="拒绝并退款"
                              >
                                <XCircle className="w-4 h-4 text-red-500" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              共 {totalCount} 条记录，第 {currentPage}/{totalPages || 1} 页
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-colors ${
                  currentPage === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                      currentPage === page
                        ? 'bg-pink-600 text-white'
                        : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`p-2 rounded-lg transition-colors ${
                  currentPage === totalPages || totalPages === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 正在推广的作品 */}
      {promotedWorks.length > 0 && (
        <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              正在推广的作品（Top 10）
            </h3>
          </div>
          <table className="w-full">
            <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">排名</th>
                <th className="px-4 py-3 text-left text-sm font-medium">作品</th>
                <th className="px-4 py-3 text-left text-sm font-medium">用户</th>
                <th className="px-4 py-3 text-left text-sm font-medium">曝光量</th>
                <th className="px-4 py-3 text-left text-sm font-medium">点击量</th>
                <th className="px-4 py-3 text-left text-sm font-medium">点击率</th>
                <th className="px-4 py-3 text-left text-sm font-medium">进度</th>
                <th className="px-4 py-3 text-left text-sm font-medium">剩余时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {promotedWorks.map((pw, index) => (
                <tr key={pw.id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-400 text-white' :
                      isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {pw.work_thumbnail ? (
                        <img src={pw.work_thumbnail} alt={pw.work_title} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                          <Package className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        </div>
                      )}
                      <div>
                        <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{pw.work_title || '未命名'}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{pw.package_type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {pw.user_avatar ? (
                        <img src={pw.user_avatar} alt={pw.user_username} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                          <Users className={`w-3 h-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        </div>
                      )}
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{pw.user_username || '未知'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{(pw.actual_views || 0).toLocaleString()}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>目标: {(pw.target_views || 0).toLocaleString()}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{(pw.actual_clicks || 0).toLocaleString()}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${(pw.ctr || 0) > 5 ? 'text-green-500' : (pw.ctr || 0) > 2 ? 'text-yellow-500' : 'text-gray-500'}`}>
                      {pw.ctr || 0}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-24">
                      <div className={`h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500"
                          style={{ width: `${Math.min(pw.progress_percent || 0, 100)}%` }}
                        />
                      </div>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{pw.progress_percent || 0}%</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {Math.max(0, Math.ceil((new Date(pw.end_time).getTime() - Date.now()) / (1000 * 60 * 60)))}小时
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 推广机制说明弹窗 */}
      <AnimatePresence>
        {showMechanismModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
            >
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-500" />
                  {promotionMechanism.title}
                </h3>
                <button
                  onClick={() => setShowMechanismModal(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {promotionMechanism.description}
                </p>

                <div className="space-y-4">
                  {promotionMechanism.rules.map((rule, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                    >
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <ArrowRight className="w-4 h-4 text-pink-500" />
                        {rule.title}
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {rule.desc}
                      </p>
                    </div>
                  ))}
                </div>

                <div className={`p-4 rounded-xl ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'} border border-blue-200`}>
                  <h4 className="font-medium text-blue-600 mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    管理员操作指南
                  </h4>
                  <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <li>1. 用户支付后，订单状态变为"待审核"</li>
                    <li>2. 管理员需要审核作品内容，确认符合推广规范</li>
                    <li>3. 点击"通过"按钮开启推广，作品将立即进入推广池</li>
                    <li>4. 点击"拒绝"按钮将退款给用户</li>
                    <li>5. 推广中的作品可在"正在推广的作品"区域查看效果</li>
                  </ul>
                </div>
              </div>

              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => setShowMechanismModal(false)}
                  className="w-full px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white transition-colors"
                >
                  我知道了
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 详情弹窗 */}
      <AnimatePresence>
        {showDetailModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
            >
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <h3 className="text-xl font-bold">订单详情</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* 作品信息 */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <h4 className="font-medium mb-3">作品信息</h4>
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
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <h4 className="font-medium mb-3">订单信息</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>订单号</p>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.order_no}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>套餐类型</p>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {packageConfig[selectedOrder.package_type as keyof typeof packageConfig]?.label || selectedOrder.package_type}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>目标类型</p>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.target_type}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>推广指标</p>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.metric_type}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>预计播放量</p>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.expected_views_max || '-'}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>实际播放量</p>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.actual_views || 0}</p>
                    </div>
                  </div>
                </div>

                {/* 金额信息 */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <h4 className="font-medium mb-3">金额信息</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>原价</p>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>¥{selectedOrder.original_price?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>优惠</p>
                      <p className="font-medium text-green-500">-¥{selectedOrder.discount_amount?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>实付金额</p>
                      <p className="font-medium text-pink-500 text-lg">¥{selectedOrder.final_price?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* 推广效果 */}
                {(selectedOrder.actual_views || 0) > 0 || (selectedOrder.actual_clicks || 0) > 0 ? (
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <h4 className="font-medium mb-3">推广效果</h4>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>实际曝光</p>
                        <p className="font-medium text-lg">{(selectedOrder.actual_views || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>实际点击</p>
                        <p className="font-medium text-lg">{(selectedOrder.actual_clicks || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>点击率</p>
                        <p className="font-medium text-lg">
                          {(selectedOrder.actual_views || 0) > 0 ? (((selectedOrder.actual_clicks || 0) / (selectedOrder.actual_views || 1)) * 100).toFixed(2) : 0}%
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>完成进度</p>
                        <p className="font-medium text-lg">
                          {(selectedOrder.expected_views_max || 0) > 0 ? Math.min(Math.round(((selectedOrder.actual_views || 0) / (selectedOrder.expected_views_max || 1)) * 100), 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-3`}>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  关闭
                </button>
                {selectedOrder.status === 'paid' && (
                  <>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        openAuditModal(selectedOrder, 'reject');
                      }}
                      className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                    >
                      拒绝并退款
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        openAuditModal(selectedOrder, 'approve');
                      }}
                      className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
                    >
                      通过并开启推广
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 审核弹窗 */}
      <AnimatePresence>
        {showAuditModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
            >
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="text-xl font-bold">
                  {auditAction === 'approve' ? '通过并开启推广' : '拒绝并退款'}
                </h3>
              </div>

              <div className="p-6 space-y-4">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    {selectedOrder.work_thumbnail ? (
                      <img
                        src={selectedOrder.work_thumbnail}
                        alt={selectedOrder.work_title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                        <Package className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{selectedOrder.work_title || '未命名作品'}</p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {packageConfig[selectedOrder.package_type as keyof typeof packageConfig]?.label} · ¥{selectedOrder.final_price}
                      </p>
                    </div>
                  </div>
                </div>

                {auditAction === 'approve' ? (
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-green-900/20' : 'bg-green-50'} border border-green-200`}>
                    <p className="text-green-600 text-sm">
                      通过审核后，该作品将立即进入推广池，按照套餐配置获得相应的曝光量和排序权重。
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      拒绝原因 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={auditNotes}
                      onChange={(e) => setAuditNotes(e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border transition-colors mb-2 ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-red-500`}
                    >
                      <option value="">选择拒绝原因...</option>
                      <option value="作品内容不符合推广规范">作品内容不符合推广规范</option>
                      <option value="作品质量不达标">作品质量不达标</option>
                      <option value="涉及敏感内容">涉及敏感内容</option>
                      <option value="其他原因">其他原因</option>
                    </select>
                    <textarea
                      value={auditNotes}
                      onChange={(e) => setAuditNotes(e.target.value)}
                      placeholder="请详细说明拒绝原因..."
                      rows={3}
                      className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-red-500`}
                    />
                  </div>
                )}
              </div>

              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-3`}>
                <button
                  onClick={() => setShowAuditModal(false)}
                  disabled={processing}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  取消
                </button>
                <button
                  onClick={handleAudit}
                  disabled={processing || (auditAction === 'reject' && !auditNotes.trim())}
                  className={`px-4 py-2 rounded-lg text-white ${
                    auditAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } ${processing || (auditAction === 'reject' && !auditNotes.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {processing ? '处理中...' : auditAction === 'approve' ? '确认开启推广' : '确认拒绝并退款'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
