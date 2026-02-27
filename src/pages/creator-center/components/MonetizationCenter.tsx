import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  Wallet, 
  CreditCard,
  Briefcase,
  Star,
  Clock,
  AlertCircle,
  Gift,
  FileText,
  Loader2,
  Coins,
  Send,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Building2,
  Users,
  PiggyBank,
  Target,
  TrendingUp
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useCreatorCenter, RevenueRecord } from '@/hooks/useCreatorCenter';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import BrandTaskParticipation from '@/pages/creator/BrandTaskParticipation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Dot
} from 'recharts';

// 格式化金额
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const monetizationChannels = [
  {
    id: 'ads',
    title: '广告分成',
    desc: '作品页面展示广告，获得分成收益',
    icon: FileText,
    gradient: 'from-blue-500 via-blue-600 to-indigo-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    iconBg: 'bg-blue-500',
    status: 'active',
    features: ['自动接入', '按展示计费', '月度结算'],
    stats: '0% 分成比例'
  },
  {
    id: 'brand-tasks',
    title: '品牌任务',
    desc: '参与品牌任务，按效果获得激励',
    icon: Target,
    gradient: 'from-violet-500 via-purple-600 to-fuchsia-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    iconBg: 'bg-purple-500',
    status: 'active',
    features: ['按效果计费', '自由参与', '高额激励'],
    stats: '去参与 →',
    link: '/creator-center/monetization?tab=brand-tasks'
  },
  {
    id: 'sponsorship',
    title: '品牌合作',
    desc: '与品牌方合作创作内容',
    icon: Building2,
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    iconBg: 'bg-pink-500',
    status: 'active',
    features: ['优质品牌', '自由接单', '高价合作'],
    stats: '0 个合作中'
  },
  {
    id: 'tipping',
    title: '粉丝打赏',
    desc: '接受粉丝的支持与鼓励',
    icon: Gift,
    gradient: 'from-amber-400 via-orange-500 to-red-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    iconBg: 'bg-orange-500',
    status: 'active',
    features: ['即时到账', '全额归你', '感谢粉丝'],
    stats: '0 次打赏'
  },
  {
    id: 'membership',
    title: '会员订阅',
    desc: '粉丝订阅获取专属内容',
    icon: Star,
    gradient: 'from-cyan-400 via-blue-500 to-indigo-500',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
    iconBg: 'bg-cyan-500',
    status: 'pending',
    features: ['专属内容', '粉丝特权', '稳定收入'],
    stats: '即将上线'
  },
];

const taskFilters = [
  { id: 'all', label: '全部任务' },
  { id: 'available', label: '我可投稿' },
  { id: 'applied', label: '已报名' },
  { id: 'review', label: '好物测评' },
];

const MIN_FOLLOWERS_FOR_TASKS = 2; // 最低粉丝数要求

// 根据收入记录生成近30天收益数据
const generateRevenueDataFromRecords = (records: RevenueRecord[]) => {
  const data = [];
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  
  // 创建日期到收益的映射（只统计收入，不包括提现）
  const dailyRevenue: Record<string, number> = {};
  
  records.forEach(record => {
    // 只统计收入类型的记录（排除提现）
    if (record.type === 'withdrawal' || record.status === 'cancelled') {
      return;
    }
    
    const recordDate = new Date(record.createdAt);
    // 只统计近30天的记录
    if (recordDate >= thirtyDaysAgo && recordDate <= today) {
      const dateKey = recordDate.toISOString().split('T')[0];
      dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + record.amount;
    }
  });
  
  // 生成近30天的数据（包括没有收益的日期）
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    data.push({
      date: dateKey,
      amount: dailyRevenue[dateKey] || 0,
    });
  }
  
  return data;
};

// 收益趋势图表组件
const RevenueChart: React.FC<{ data: { date: string; amount: number }[] }> = ({ data }) => {
  const { isDark } = useTheme();
  
  const [hoveredData, setHoveredData] = useState<{ date: string; amount: number } | null>(null);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const date = new Date(label);
      const formattedDate = date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).replace(/\//g, '/');
      
      return (
        <div className={`p-3 rounded-xl border shadow-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{formattedDate}</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>总收益（元）：</span>
            <span className="text-lg font-bold text-rose-500">{value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (hoveredData && hoveredData.date === payload.date) {
      return (
        <Dot
          cx={cx}
          cy={cy}
          r={6}
          fill="#fff"
          stroke="#ec4899"
          strokeWidth={3}
        />
      );
    }
    return null;
  };

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '/');
  };

  return (
    <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800/80' : 'bg-white'} shadow-lg border ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>近30天总收益（元）</h3>
        </div>
        <button className={`text-sm flex items-center gap-1 transition-colors ${isDark ? 'text-rose-400 hover:text-rose-300' : 'text-rose-500 hover:text-rose-600'}`}>
          查看收益明细
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            onMouseMove={(e: any) => {
              if (e.activePayload && e.activePayload[0]) {
                setHoveredData(e.activePayload[0].payload);
              }
            }}
            onMouseLeave={() => setHoveredData(null)}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={true}
              horizontal={true}
              stroke={isDark ? '#374151' : '#E5E7EB'}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              stroke={isDark ? '#6B7280' : '#9CA3AF'}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={4}
            />
            <YAxis
              stroke={isDark ? '#6B7280' : '#9CA3AF'}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 'auto']}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {hoveredData && (
              <ReferenceLine
                x={hoveredData.date}
                stroke="#ec4899"
                strokeDasharray="3 3"
              />
            )}
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#ec4899"
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={{ r: 6, fill: '#fff', stroke: '#ec4899', strokeWidth: 3 }}
              fill="url(#revenueGradient)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const MonetizationCenter: React.FC = () => {
  const { isDark } = useTheme();
  const { revenue, stats, businessTasks, taskApplications, revenueRecords, loading, applyForTask, createWithdrawal } = useCreatorCenter();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'history' | 'brand-tasks'>('overview');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [taskFilter, setTaskFilter] = useState('all');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAmount, setShowAmount] = useState(true);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // 根据真实收入记录生成近30天收益数据
  const revenueData = useMemo(() => generateRevenueDataFromRecords(revenueRecords), [revenueRecords]);

  // 获取粉丝数
  const followersCount = stats?.followersCount || 0;
  const hasEnoughFollowers = followersCount >= MIN_FOLLOWERS_FOR_TASKS;

  // 计算可参与任务数
  const availableTasksCount = businessTasks.filter(t => !t.applied && t.status === 'open').length;
  const ongoingTasksCount = taskApplications.filter(a => a.status === 'accepted').length;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      applied: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400 border-violet-200 dark:border-violet-800',
      settled: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    };
    const labels: Record<string, string> = {
      active: '进行中',
      pending: '审核中',
      open: '可接单',
      applied: '已申请',
      settled: '已结算',
    };
    return { style: styles[status] || styles.open, label: labels[status] || status };
  };

  // 处理提现
  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      alert('请输入有效的提现金额');
      return;
    }
    if (amount < 100) {
      alert('最低提现金额为 ¥100');
      return;
    }
    if (revenue && amount > revenue.withdrawableRevenue) {
      alert('提现金额不能超过可提现余额');
      return;
    }

    setIsSubmitting(true);
    const success = await createWithdrawal(amount);
    setIsSubmitting(false);
    
    if (success) {
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      alert('提现申请已提交，预计1-3个工作日到账');
    } else {
      alert('提现申请失败，请稍后重试');
    }
  };

  // 处理申请任务
  const handleApplyTask = async (taskId: string) => {
    const success = await applyForTask(taskId);
    if (success) {
      alert('申请成功！请等待品牌方审核');
    } else {
      alert('申请失败，请稍后重试');
    }
  };

  // 筛选任务
  const filteredTasks = businessTasks.filter(task => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'available') return !task.applied && task.status === 'open';
    if (taskFilter === 'applied') return task.applied;
    if (taskFilter === 'review') return task.tags.includes('测评') || task.type === 'review';
    return true;
  });

  // 等待认证状态检查
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // 未登录状态
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className={`p-8 rounded-3xl text-center ${isDark ? 'bg-gray-800/80' : 'bg-white'} shadow-xl border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Coins className="w-10 h-10 text-white" />
          </div>
          <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            变现中心
          </h2>
          <p className={`mb-8 text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            登录后即可查看你的收入和变现数据
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 变现广场卡片 */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 p-8 text-white shadow-2xl shadow-rose-500/20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-1">变现广场</h2>
              <p className="text-white/70 text-sm">多渠道变现，让创作更有价值</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowWithdrawModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-rose-500 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              <Wallet className="w-4 h-4" />
              去提现
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-2xl bg-white/10 backdrop-blur-sm">
              <p className="text-4xl font-bold mb-1">{availableTasksCount}</p>
              <p className="text-sm text-white/70">可参与任务数</p>
            </div>
            <div className="text-center p-4 rounded-2xl bg-white/10 backdrop-blur-sm">
              <p className="text-4xl font-bold mb-1">{ongoingTasksCount}</p>
              <p className="text-sm text-white/70">进行中任务</p>
            </div>
            <div className="text-center p-4 rounded-2xl bg-white/10 backdrop-blur-sm">
              <p className="text-4xl font-bold mb-1">
                {showAmount ? `¥${formatNumber(revenue?.monthlyRevenue || 0)}` : '****'}
              </p>
              <p className="text-sm text-white/70">30日收入总金额</p>
            </div>
            <div className="text-center p-4 rounded-2xl bg-white/10 backdrop-blur-sm">
              <p className="text-4xl font-bold mb-1">
                {showAmount ? `¥${formatNumber(revenue?.withdrawableRevenue || 0)}` : '****'}
              </p>
              <p className="text-sm text-white/70">可提现金额</p>
              <button 
                onClick={() => setShowAmount(!showAmount)}
                className="text-xs text-white/60 underline cursor-pointer mt-1"
              >
                {showAmount ? '隐藏' : '显示'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 收入统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: '累计收入', 
            value: revenue?.totalRevenue || 0, 
            change: revenue?.revenueChange || 0,
            icon: PiggyBank, 
            color: 'emerald',
            gradient: 'from-emerald-500 to-teal-600'
          },
          { 
            label: '本月收入', 
            value: revenue?.monthlyRevenue || 0, 
            change: 0,
            icon: DollarSign, 
            color: 'blue',
            gradient: 'from-blue-500 to-indigo-600'
          },
          { 
            label: '待结算', 
            value: revenue?.pendingRevenue || 0, 
            change: null,
            icon: Clock, 
            color: 'amber',
            gradient: 'from-amber-500 to-orange-600'
          },
          { 
            label: '可提现', 
            value: revenue?.withdrawableRevenue || 0, 
            change: null,
            icon: CreditCard, 
            color: 'violet',
            gradient: 'from-violet-500 to-purple-600'
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.change && stat.change > 0;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative overflow-hidden p-5 rounded-2xl ${isDark ? 'bg-gray-800/80' : 'bg-white'} shadow-lg border ${
                isDark ? 'border-gray-700/50' : 'border-gray-100'
              } group hover:shadow-xl transition-shadow`}
            >
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
              
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {stat.change !== null && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    isPositive 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {isPositive ? '+' : ''}{stat.change}%
                  </span>
                )}
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {showAmount ? formatCurrency(stat.value) : '****'}
                </p>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {stat.label}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 近30天收益趋势图 */}
      <RevenueChart data={revenueData} />

      {/* 标签页 */}
      <div className={`rounded-3xl ${isDark ? 'bg-gray-800/80' : 'bg-white'} shadow-xl border ${
        isDark ? 'border-gray-700/50' : 'border-gray-100'
      } overflow-hidden`}>
        <div className={`flex border-b ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
          {[
            { id: 'overview', label: '变现渠道', icon: Sparkles },
            { id: 'brand-tasks', label: '品牌任务', icon: Target },
            { id: 'orders', label: '商单广场', icon: Briefcase },
            { id: 'history', label: '收入明细', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : isDark
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                {monetizationChannels.map((channel, index) => {
                  const Icon = channel.icon;
                  const status = getStatusBadge(channel.status);
                  return (
                    <motion.div
                      key={channel.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => channel.link && (window.location.href = channel.link || '')}
                      className={`relative overflow-hidden p-6 rounded-2xl border ${
                        isDark 
                          ? 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50' 
                          : `${channel.bgColor} border-gray-200/50 hover:border-gray-300`
                      } transition-all cursor-pointer group`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${channel.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {channel.title}
                            </h3>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${status.style}`}>
                              {status.label}
                            </span>
                          </div>
                          <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {channel.desc}
                          </p>
                          <div className="flex items-center gap-2 text-xs">
                            {channel.features.map((feature, i) => (
                              <span
                                key={i}
                                className={`px-2.5 py-1 rounded-lg ${
                                  isDark ? 'bg-gray-600/50 text-gray-300' : 'bg-white/80 text-gray-600'
                                }`}
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-600/50' : 'border-gray-200/50'}`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {channel.stats}
                          </span>
                          <ArrowUpRight className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'} group-hover:text-blue-500 transition-colors`} />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {activeTab === 'brand-tasks' && (
              <motion.div
                key="brand-tasks"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <BrandTaskParticipation />
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* 粉丝数不足提示 */}
                {!hasEnoughFollowers && (
                  <div className={`p-5 rounded-2xl ${isDark ? 'bg-gradient-to-r from-amber-900/40 to-orange-900/40' : 'bg-gradient-to-r from-amber-50 to-orange-50'} border ${
                    isDark ? 'border-amber-800/50' : 'border-amber-200/50'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl ${isDark ? 'bg-amber-500/20' : 'bg-amber-500/10'} flex items-center justify-center flex-shrink-0`}>
                        <Users className="w-7 h-7 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <p className={`font-bold text-lg ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                          粉丝数不足，暂时无法接单
                        </p>
                        <p className={`text-sm mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                          需要至少 {MIN_FOLLOWERS_FOR_TASKS} 粉丝才能接商单，你当前有 {followersCount} 粉丝
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <div className={`flex-1 h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            <div 
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                              style={{ width: `${Math.min((followersCount / MIN_FOLLOWERS_FOR_TASKS) * 100, 100)}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                            {Math.round((followersCount / MIN_FOLLOWERS_FOR_TASKS) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 入驻星图计划提示 */}
                {hasEnoughFollowers && (
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gradient-to-r from-blue-900/40 to-purple-900/40' : 'bg-gradient-to-r from-blue-50 to-indigo-50'} border ${
                    isDark ? 'border-blue-800/50' : 'border-blue-200/50'
                  } flex items-center gap-4`}>
                    <div className={`w-10 h-10 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'} flex items-center justify-center flex-shrink-0`}>
                      <Sparkles className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                        入驻星图计划，获取更多商单机会
                      </p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        完成实名认证并达到 Lv.3 等级即可申请入驻
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-500/25"
                    >
                      立即入驻
                    </motion.button>
                  </div>
                )}

                {/* 任务筛选标签 */}
                {hasEnoughFollowers && (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {taskFilters.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setTaskFilter(filter.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
                          taskFilter === filter.id
                            ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg'
                            : isDark
                            ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* 任务列表 */}
                {hasEnoughFollowers && filteredTasks.length > 0 ? (
                  <div className="space-y-3">
                    {filteredTasks.map((task, index) => {
                      const status = getStatusBadge(task.applied ? 'applied' : task.status);
                      const daysLeft = Math.ceil((new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 rounded-xl border ${
                            isDark 
                              ? 'bg-gray-700/30 border-gray-600/50 hover:border-gray-500' 
                              : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                          } transition-all`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-gray-600/50' : 'bg-gradient-to-br from-blue-100 to-indigo-100'} flex items-center justify-center flex-shrink-0`}>
                              <Building2 className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-blue-600'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                                  isDark ? 'bg-gray-600/50 text-gray-300' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {task.type === 'design' && '设计创作'}
                                  {task.type === 'illustration' && '插画创作'}
                                  {task.type === 'video' && '视频创作'}
                                  {task.type === 'writing' && '文案创作'}
                                  {task.type === 'photography' && '摄影创作'}
                                  {task.type === 'other' && '其他'}
                                </span>
                                <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${status.style}`}>
                                  {task.applied ? '已申请' : status.label}
                                </span>
                              </div>
                              <h3 className={`font-bold text-lg mb-1 truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {task.title}
                              </h3>
                              <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                品牌方: {task.brandName}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {task.requirements.slice(0, 3).map((req, i) => (
                                  <span
                                    key={i}
                                    className={`text-xs px-2.5 py-1 rounded-lg ${
                                      isDark ? 'bg-gray-600/30 text-gray-400' : 'bg-gray-50 text-gray-500'
                                    }`}
                                  >
                                    {req}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xl font-bold text-emerald-500">
                                ¥{formatNumber(task.budgetMin)}-{formatNumber(task.budgetMax)}
                              </p>
                              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {daysLeft > 0 ? `剩余 ${daysLeft} 天` : '已截止'}
                              </p>
                              {!task.applied && task.status === 'open' && daysLeft > 0 ? (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleApplyTask(task.id)}
                                  className="mt-2 px-4 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-500/25"
                                >
                                  立即接单
                                </motion.button>
                              ) : task.applied ? (
                                <span className="mt-2 inline-block px-4 py-1.5 text-sm font-medium text-violet-500">
                                  <CheckCircle2 className="w-4 h-4 inline mr-1" />
                                  已申请
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : hasEnoughFollowers ? (
                  <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div className="flex justify-center gap-8 mb-8">
                      <Link to="/creator-center/submit" className="flex flex-col items-center group">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 transition-all group-hover:scale-110 ${
                          isDark ? 'bg-blue-500/10 group-hover:bg-blue-500/20' : 'bg-blue-50 group-hover:bg-blue-100'
                        }`}>
                          <Send className="w-8 h-8 text-blue-500" />
                        </div>
                        <span className={`font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          发布新作品
                        </span>
                        <span className="text-xs mt-1 text-blue-500">去发布 →</span>
                      </Link>
                      <div className="flex flex-col items-center group cursor-pointer">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 transition-all group-hover:scale-110 ${
                          isDark ? 'bg-orange-500/10 group-hover:bg-orange-500/20' : 'bg-orange-50 group-hover:bg-orange-100'
                        }`}>
                          <BookOpen className="w-8 h-8 text-orange-500" />
                        </div>
                        <span className={`font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          学习涨粉课程
                        </span>
                        <span className="text-xs mt-1 text-orange-500">去学习 →</span>
                      </div>
                    </div>
                    <p className="text-sm">暂无商单，你可通过以下方式涨粉后，解锁新商单</p>
                  </div>
                ) : null}
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {revenueRecords.length > 0 ? (
                  <div className="space-y-3">
                    {revenueRecords.map((record, index) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 rounded-xl border ${
                          isDark 
                            ? 'bg-gray-700/30 border-gray-600/50' 
                            : 'bg-white border-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              record.type === 'withdrawal' 
                                ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                                : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                            }`}>
                              {record.type === 'withdrawal' ? <Wallet className="w-6 h-6" /> : <Coins className="w-6 h-6" />}
                            </div>
                            <div>
                              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {record.description || {
                                  ads: '广告分成',
                                  sponsorship: '品牌合作',
                                  tipping: '粉丝打赏',
                                  membership: '会员订阅',
                                  task: '商单任务',
                                  withdrawal: '提现'
                                }[record.type]}
                              </p>
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {new Date(record.createdAt).toLocaleDateString('zh-CN')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${
                              record.type === 'withdrawal' ? 'text-rose-500' : 'text-emerald-500'
                            }`}>
                              {record.type === 'withdrawal' ? '-' : '+'}¥{formatNumber(record.amount)}
                            </p>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              record.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                : record.status === 'pending'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {record.status === 'completed' ? '已完成' : record.status === 'pending' ? '处理中' : '已取消'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center">
                      <FileText className="w-10 h-10 opacity-50" />
                    </div>
                    <p className="text-lg font-medium">暂无收入记录</p>
                    <p className="text-sm mt-2">开始创作，获得你的第一笔收入！</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 提现弹窗 */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`w-full max-w-md p-6 rounded-3xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
          >
            <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              提现申请
            </h3>
            <div className={`p-5 rounded-2xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} mb-6`}>
              <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>可提现金额</p>
              <p className="text-3xl font-bold text-emerald-500">
                {formatCurrency(revenue?.withdrawableRevenue || 0)}
              </p>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  提现金额
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="请输入提现金额"
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500' 
                      : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                  } outline-none transition-colors`}
                />
              </div>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                最低提现金额 ¥100，预计 1-3 个工作日到账
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className={`flex-1 py-3 rounded-xl font-semibold ${
                  isDark 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } transition-colors`}
              >
                取消
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl"
              >
                {isSubmitting ? '处理中...' : '确认提现'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MonetizationCenter;
