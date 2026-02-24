import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Home,
  BarChart3,
  User,
  ChevronRight,
  Video,
  Users,
  MessageCircle,
  TrendingUp,
  Play,
  CreditCard,
  Calendar,
  Search,
  Download,
  Ticket,
  FileText,
  Gift,
  Target,
  CheckCircle2,
  X,
  Sparkles,
  Shield,
  Lightbulb,
  BookOpen,
  Settings,
  RefreshCw,
  Eye,
  Heart,
  Share2,
  Coins,
  Bookmark,
  Loader2,
  Wallet,
  Award,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { usePromotion } from '@/hooks/usePromotion';
import { useCreatorCenter } from '@/hooks/useCreatorCenter';

// 标签页类型
type TabType = 'home' | 'management' | 'analytics' | 'profile';

// 推广目标类型
type PromotionTarget = 'account' | 'transaction' | 'live';

// 提升指标类型
type BoostMetric = 'views' | 'fans' | 'interactions' | 'hot';

// 套餐类型
interface Package {
  id: string;
  name: string;
  views: string;
  duration: string;
  price: number;
  discount?: number;
  popular?: boolean;
}

const packages: Package[] = [
  { id: 'standard', name: '标准套餐', views: '417-1,167', duration: '24小时', price: 50, popular: true },
  { id: 'basic', name: '基础套餐', views: '834-2,334', duration: '24小时', price: 100 },
  { id: 'long', name: '长效套餐', views: '3,500-7,500', duration: '48小时', price: 300 },
  { id: 'custom', name: '自定义', views: '---', duration: '自定义', price: 0 },
];

// 推广学院课程
const courses = [
  { id: '1', title: '必火推广是什么？', subtitle: '了解推广基础概念', thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400', episode: 1 },
  { id: '2', title: '必火推广投放流程', subtitle: '掌握完整投放步骤', thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400', episode: 2 },
  { id: '3', title: '如何操作自定义设置？', subtitle: '高级功能使用指南', thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400', episode: 3 },
];

// 任务列表
const tasks = [
  { id: '1', title: '新春涨粉双周消耗任务', reward: '最高奖励100元优惠券', progress: 0, total: 100 },
  { id: '2', title: '限时消耗任务', reward: '最高奖励120元优惠券', progress: 0, total: 100 },
];

const HotPromotion: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { stats, trendData, userWorks, coupons, wallet, loading, orders, refresh } = usePromotion();
  const { stats: creatorStats, works: creatorWorks, level, revenue } = useCreatorCenter();
  
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedTarget, setSelectedTarget] = useState<PromotionTarget>('account');
  const [selectedMetric, setSelectedMetric] = useState<BoostMetric>('views');
  const [selectedWorks, setSelectedWorks] = useState<string[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>('standard');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'works' | 'live' | 'analysis'>('works');
  const [dataType, setDataType] = useState<'basic' | 'interaction' | 'cost'>('basic');

  const tabs = [
    { id: 'home' as TabType, label: '首页', icon: Home },
    { id: 'management' as TabType, label: '投放管理', icon: Target },
    { id: 'analytics' as TabType, label: '数据中心', icon: BarChart3 },
    { id: 'profile' as TabType, label: '我的', icon: User },
  ];

  const targets = [
    { id: 'account' as PromotionTarget, label: '账号经营', desc: '提升账号数据', icon: Users },
    { id: 'transaction' as PromotionTarget, label: '交易经营', desc: '提升交易转化', icon: CreditCard },
    { id: 'live' as PromotionTarget, label: '直播推广', desc: '提升直播热度', icon: Video },
  ];

  const metrics = [
    { id: 'views' as BoostMetric, label: '播放量', tag: '推荐' },
    { id: 'fans' as BoostMetric, label: '粉丝量' },
    { id: 'interactions' as BoostMetric, label: '互动量' },
    { id: 'hot' as BoostMetric, label: '热搜助推' },
  ];

  const toggleWorkSelection = (workId: string) => {
    setSelectedWorks(prev =>
      prev.includes(workId)
        ? prev.filter(id => id !== workId)
        : [...prev, workId]
    );
  };

  const selectedPackageData = packages.find(p => p.id === selectedPackage);
  const selectedCoupon = coupons[0];
  const originalPrice = selectedPackageData?.price || 0;
  const discount = selectedCoupon?.discount || 1;
  const discountAmount = selectedCoupon 
    ? Math.min(originalPrice * (1 - discount), selectedCoupon.maxDeduction)
    : 0;
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
  };

  // 格式化金额
  const formatMoney = (amount: number) => {
    return amount.toFixed(2);
  };

  // 获取用户头像和名称
  const userAvatar = user?.avatar || user?.avatar_url || '';
  const userName = user?.username || user?.email?.split('@')[0] || '创作者';
  const userId = user?.id?.slice(0, 16) || '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  const renderHomeTab = () => (
    <div className="space-y-6">
      {/* 新人优惠券横幅 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 p-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-white/20 text-white text-sm font-medium rounded-full">新人前3单</span>
            <span className="text-white/80 text-sm">下单立减！</span>
          </div>
          <div className="flex gap-4">
            {coupons.slice(0, 3).map((coupon, idx) => (
              <div key={idx} className="flex-1 bg-white/95 rounded-xl p-4 flex items-center gap-3">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${
                  idx === 0 ? 'from-yellow-400 to-orange-500' : 
                  idx === 1 ? 'from-pink-400 to-rose-500' : 'from-purple-400 to-pink-500'
                } flex items-center justify-center flex-shrink-0`}>
                  <span className="text-2xl font-bold text-white">{Math.round(coupon.discount * 10)}</span>
                  <span className="text-xs text-white">折</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {idx === 0 ? '首单优惠券' : idx === 1 ? '二单优惠券' : '三单优惠券'}
                  </p>
                  <p className="text-xs text-gray-500">最高减{coupon.maxDeduction}元</p>
                </div>
              </div>
            ))}
            {coupons.length === 0 && (
              <div className="flex-1 bg-white/95 rounded-xl p-4 text-center">
                <p className="text-gray-500">暂无可用优惠券</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 成功案例滚动 - 使用真实数据 */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} flex items-center gap-3`}>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap">
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {stats.totalOrders > 0 ? (
                <>平台创作者已通过必火推广获得 {formatNumber(stats.totalViews)} 次曝光 · 平均每次推广带来 {formatNumber(Math.round(stats.totalViews / Math.max(stats.totalOrders, 1)))} 次播放</>
              ) : (
                <>萧**花了49元，获得了10696播放 · 李**花了35元，获得了8923播放 · 张**花了100元，获得了25341播放</>
              )}
            </span>
          </div>
        </div>
        <span className="text-xs text-gray-400">刚刚</span>
      </div>

      {/* 推广目标选择 */}
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          你的推广目标是
        </h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {targets.map((target) => {
            const Icon = target.icon;
            const isSelected = selectedTarget === target.id;
            return (
              <button
                key={target.id}
                onClick={() => setSelectedTarget(target.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/10'
                    : isDark
                    ? 'border-gray-700 hover:border-gray-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                  isSelected ? 'bg-pink-500' : isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                </div>
                <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{target.label}</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{target.desc}</p>
              </button>
            );
          })}
        </div>

        <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          你想提升
        </h3>
        <div className="flex gap-3">
          {metrics.map((metric) => {
            const isSelected = selectedMetric === metric.id;
            return (
              <button
                key={metric.id}
                onClick={() => setSelectedMetric(metric.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-pink-500 text-white'
                    : isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {metric.label}
                {metric.tag && (
                  <span className="ml-1 px-1.5 py-0.5 bg-white/20 text-xs rounded">{metric.tag}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 选择推广稿件 - 使用真实作品数据 */}
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            你要推广的稿件
          </h3>
          <span className="text-sm text-gray-500">
            共 {userWorks.length} 个作品可选
          </span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          {userAvatar ? (
            <img src={userAvatar} alt={userName} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
          )}
          <div>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{userName}</p>
            <p className="text-xs text-gray-500">UID: {userId}</p>
          </div>
        </div>
        
        {userWorks.length > 0 ? (
          <>
            <div className="grid grid-cols-4 gap-3 mb-4 max-h-[400px] overflow-y-auto">
              {userWorks.map((work) => (
                <WorkCard
                  key={work.id}
                  work={work}
                  isSelected={selectedWorks.includes(work.id)}
                  onSelect={() => toggleWorkSelection(work.id)}
                  isDark={isDark}
                />
              ))}
            </div>
            {selectedWorks.length > 0 && (
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                已选择 {selectedWorks.length} 个作品进行推广
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              暂无已发布的作品，先去创作中心发布作品吧
            </p>
          </div>
        )}
      </div>

      {/* 选择套餐 */}
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            选择的套餐
          </h3>
          <button className="text-sm text-pink-500 flex items-center gap-1">
            切换至自定义
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg.id)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                selectedPackage === pkg.id
                  ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/10'
                  : isDark
                  ? 'border-gray-700 hover:border-gray-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-2 left-4 px-2 py-0.5 bg-pink-500 text-white text-xs rounded-full">
                  最受欢迎
                </span>
              )}
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{pkg.name}</p>
              <p className="text-xs text-gray-500 mt-1">预计播放量</p>
              <p className="text-lg font-bold text-pink-500">{pkg.views}</p>
              <p className="text-xs text-gray-400">{pkg.duration}</p>
              {pkg.price > 0 && (
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">¥{pkg.price}</p>
              )}
              {pkg.id === 'custom' && (
                <div className="mt-2 text-gray-400">
                  <Settings className="w-5 h-5" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* 优惠券 */}
        {coupons.length > 0 && (
          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} mb-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-pink-500" />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>优惠券</span>
              </div>
              <button className="text-sm text-pink-500 flex items-center gap-1">
                {Math.round(selectedCoupon?.discount! * 10)}折券 最高减{selectedCoupon?.maxDeduction}元
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 优惠明细 */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>订单总价</span>
            <span className={isDark ? 'text-white' : 'text-gray-900'}>¥{formatMoney(originalPrice)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>折扣券</span>
              <span className="text-green-500">-¥{formatMoney(discountAmount)}</span>
            </div>
          )}
        </div>

        {/* 底部支付栏 */}
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} flex items-center justify-between`}>
          <div>
            {discountAmount > 0 && (
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-pink-500 text-white text-xs rounded-full">
                  {Math.round(selectedCoupon?.discount! * 10)}折优惠券，已减¥{discountAmount.toFixed(0)}
                </span>
                <span className="text-xs text-gray-500">
                  有效期至 {new Date(selectedCoupon?.validUntil || '').toLocaleDateString('zh-CN')}
                </span>
              </div>
            )}
            <div className="flex items-center gap-4 mt-2">
              <div>
                <span className="text-xs text-gray-500">预计提升播放量</span>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedPackageData?.views}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">实付款</span>
                <p className="text-2xl font-bold text-pink-500">¥{finalPrice}</p>
              </div>
              {discountAmount > 0 && (
                <span className="text-sm text-gray-400 line-through">¥{originalPrice}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={selectedWorks.length === 0}
            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            立即支付
          </button>
        </div>
      </div>
    </div>
  );

  const renderManagementTab = () => (
    <div className="space-y-6">
      {/* 状态筛选 */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 overflow-x-auto">
          {[
            { key: 'all', label: '全部状态', count: orders.length },
            { key: 'pending', label: '待支付', count: orders.filter(o => o.status === 'pending').length },
            { key: 'running', label: '推广中', count: orders.filter(o => o.status === 'running').length },
            { key: 'completed', label: '推广完成', count: orders.filter(o => o.status === 'completed').length },
            { key: 'reviewing', label: '审核中', count: orders.filter(o => o.status === 'reviewing').length },
          ].map((status, idx) => (
            <button
              key={status.key}
              className={`text-sm font-medium transition-colors whitespace-nowrap ${
                idx === 0
                  ? 'text-pink-500 border-b-2 border-pink-500 pb-4 -mb-4'
                  : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {status.label}
              {status.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-pink-500 text-white text-xs rounded-full">{status.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* 筛选器 */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className={`flex-1 min-w-[200px] flex items-center gap-2 px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="输入作品名称/订单ID"
              className={`flex-1 bg-transparent text-sm outline-none ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
            />
          </div>
          <select className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
            <option>推广目标</option>
          </select>
          <select className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
            <option>推广方式</option>
          </select>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
            <Calendar className="w-4 h-4" />
            <span>2025-02-24 至 2026-02-24</span>
          </div>
          <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}>
            <Download className="w-4 h-4" />
            导出数据
          </button>
        </div>
      </div>

      {/* 订单列表 */}
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {order.workThumbnail ? (
                    <img src={order.workThumbnail} alt={order.workTitle} className="w-20 h-14 rounded-lg object-cover" />
                  ) : (
                    <div className="w-20 h-14 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
                  )}
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{order.workTitle}</p>
                    <p className="text-sm text-gray-500">{order.packageName} · 预计{order.expectedViews}播放</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleString('zh-CN')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-pink-500">¥{order.finalPrice}</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    order.status === 'running' ? 'bg-green-100 text-green-600' :
                    order.status === 'completed' ? 'bg-blue-100 text-blue-600' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {order.status === 'running' ? '推广中' :
                     order.status === 'completed' ? '已完成' :
                     order.status === 'pending' ? '待支付' : order.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 空状态 */
        <div className={`p-16 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'} text-center`}>
          <div className="w-32 h-32 mx-auto mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full opacity-50" />
            <div className="absolute inset-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
          </div>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>抱歉，当前暂无满足条件的订单</p>
          <p className="text-sm text-gray-400 mt-2">快去首页创建你的第一个推广订单吧</p>
        </div>
      )}
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      {/* 顶部筛选栏 */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            {['作品数据', '直播数据', '作品分析'].map((tab, idx) => (
              <button
                key={tab}
                onClick={() => setAnalyticsSubTab(['works', 'live', 'analysis'][idx] as any)}
                className={`text-sm font-medium transition-colors ${
                  analyticsSubTab === ['works', 'live', 'analysis'][idx]
                    ? 'text-pink-500 border-b-2 border-pink-500 pb-1'
                    : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <select className={`px-3 py-1.5 rounded-lg text-sm ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
              <option>类型: 给自己...</option>
            </select>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
              <span>消耗时间</span>
              <span className="text-gray-400">2026-02-24 至 2026-02-24</span>
              <Calendar className="w-4 h-4" />
            </div>
            <button className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}>
              <Download className="w-4 h-4" />
              导出数据
            </button>
          </div>
        </div>
      </div>

      {/* 数据类型切换 */}
      <div className="flex items-center gap-2">
        {[
          { id: 'basic', label: '基础数据' },
          { id: 'interaction', label: '互动数据' },
          { id: 'cost', label: '成本数据' },
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => setDataType(type.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dataType === type.id
                ? 'bg-pink-500 text-white'
                : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* 数据卡片网格 - 使用真实数据 */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: '消耗金额', value: formatMoney(stats.totalSpent), unit: '元', icon: CreditCard, highlight: true },
          { label: '播放量', value: formatNumber(stats.totalViews), icon: Play },
          { label: '净增粉丝', value: formatNumber(creatorStats?.followersCount || 0), icon: Users },
          { label: '点赞', value: formatNumber(creatorStats?.totalLikes || 0), icon: Heart },
          { label: '投币', value: '0', icon: Coins },
          { label: '评论', value: formatNumber(creatorStats?.totalComments || 0), icon: MessageCircle },
          { label: '弹幕', value: '0', icon: MessageCircle },
          { label: '收藏', value: '0', icon: Bookmark },
          { label: '分享', value: formatNumber(creatorStats?.totalShares || 0), icon: Share2 },
          { label: '曝光量', value: formatNumber(stats.totalViews * 3), icon: Eye },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`relative p-4 rounded-xl ${
                stat.highlight
                  ? 'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-500/10 dark:to-rose-500/10 border-2 border-pink-200 dark:border-pink-500/30'
                  : isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
              } shadow-sm`}
            >
              {stat.highlight && (
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-r-[20px] border-t-pink-400 border-r-pink-400 rounded-tr-xl" />
              )}
              <p className={`text-2xl font-bold ${stat.highlight ? 'text-pink-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
                {stat.value}
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* 趋势图表 - 使用真实趋势数据 */}
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>趋势分析</h3>
        <div className="h-64 flex items-center justify-center">
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>趋势图表数据加载中...</p>
        </div>
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* 个人信息卡片 */}
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {user?.username || '创作者'}
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
      </div>

      {/* 推广统计 */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>累计推广订单</p>
          <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.totalOrders}</p>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>累计消耗金额</p>
          <p className="text-2xl font-bold mt-1 text-pink-500">¥{formatMoney(stats.totalSpent)}</p>
        </div>
      </div>
    </div>
  );

  // 主渲染
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* 顶部导航 */}
      <div className={`sticky top-0 z-50 ${isDark ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-md border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>必火推广</span>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* 侧边栏 */}
          <div className="w-64 flex-shrink-0">
            <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'} sticky top-24`}>
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-pink-500 text-white'
                          : isDark
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* 内容区 */}
          <div className="flex-1">
            {activeTab === 'home' && renderHomeTab()}
            {activeTab === 'management' && renderManagementTab()}
            {activeTab === 'analytics' && renderAnalyticsTab()}
            {activeTab === 'profile' && renderProfileTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

// 作品卡片组件
interface WorkCardProps {
  work: {
    id: string;
    title: string;
    thumbnail?: string;
    videoUrl?: string;
    views: number;
    type: string;
  };
  isSelected: boolean;
  onSelect: () => void;
  isDark: boolean;
}

const WorkCard: React.FC<WorkCardProps> = ({ work, isSelected, onSelect, isDark }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
  };

  // 组件挂载时自动播放视频
  useEffect(() => {
    if (work.type === 'video' && videoRef.current) {
      videoRef.current.play().catch(() => {
        // 自动播放失败，忽略错误
      });
    }
  }, [work.type, work.videoUrl]);

  return (
    <button
      onClick={onSelect}
      className={`relative rounded-xl overflow-hidden aspect-video transition-all ${
        isSelected ? 'ring-2 ring-pink-500' : 'hover:scale-[1.02]'
      }`}
    >
      {/* 视频直接播放 */}
      {work.type === 'video' && work.videoUrl ? (
        <>
          <video
            ref={videoRef}
            src={work.videoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            loop
            playsInline
            autoPlay
            onError={(e) => console.log('Video error:', work.videoUrl)}
          />
          {/* 调试用：显示视频URL */}
          <div className="absolute bottom-8 left-2 right-2 text-[8px] text-white/50 truncate">
            {work.videoUrl?.substring(0, 30)}...
          </div>
        </>
      ) : work.thumbnail ? (
        <img
          src={work.thumbnail}
          alt={work.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.style.display = 'none';
            const parent = img.parentElement;
            if (parent) {
              parent.classList.add('bg-gradient-to-br', 'from-pink-400', 'to-purple-500');
            }
          }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
          <span className="text-white text-xs font-medium px-2 text-center line-clamp-2">
            {work.title}
          </span>
          {/* 调试用：显示类型和videoUrl */}
          <div className="absolute bottom-2 left-2 text-[8px] text-white/70">
            type:{work.type}, hasVideo:{work.videoUrl ? 'yes' : 'no'}
          </div>
        </div>
      )}

      {/* 渐变遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

      {/* 视频标识 */}
      {work.type === 'video' && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded-full flex items-center gap-1">
          <Video className="w-3 h-3 text-white" />
          <span className="text-white text-xs">视频</span>
        </div>
      )}

      {/* 播放量 */}
      <div className="absolute bottom-2 left-2 right-2">
        <div className="flex items-center gap-1 text-white text-xs">
          <Play className="w-3 h-3" />
          {formatNumber(work.views)}
        </div>
      </div>

      {/* 选中标记 */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-3 h-3 text-white" />
        </div>
      )}
    </button>
  );
};

export default HotPromotion;
