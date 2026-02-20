import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '@/contexts/authContext';
import { apiClient } from '@/lib/apiClient';
import { useTheme } from '@/hooks/useTheme';

// 会员中心组件
import LeftSidebar from '@/components/membership/LeftSidebar';
import RightSidebar from '@/components/membership/RightSidebar';
import MembershipStatusCard from '@/components/membership/MembershipStatusCard';
import BenefitsGrid from '@/components/membership/BenefitsGrid';
import PricingCards from '@/components/membership/PricingCards';
import FAQSection from '@/components/membership/FAQSection';
import OrdersList from '@/components/membership/OrdersList';

// 图标
import {
  Menu,
  X,
  Sparkles,
  Crown,
  ChevronRight,
  Loader2
} from 'lucide-react';

// 会员权益数据类型
interface MembershipBenefits {
  levels: {
    free: {
      name: string;
      description: string;
      features: Array<{
        id: string;
        name: string;
        value: boolean | string;
        icon: string;
      }>;
      limits: {
        aiGenerationsPerDay: number;
        storageGB: number;
        exportsPerMonth: number;
      };
    };
    premium: {
      name: string;
      description: string;
      features: Array<{
        id: string;
        name: string;
        value: boolean | string;
        icon: string;
      }>;
      limits: {
        aiGenerationsPerDay: number | null;
        storageGB: number;
        exportsPerMonth: number;
      };
    };
    vip: {
      name: string;
      description: string;
      features: Array<{
        id: string;
        name: string;
        value: boolean | string;
        icon: string;
      }>;
      limits: {
        aiGenerationsPerDay: number | null;
        storageGB: number | null;
        exportsPerMonth: number | null;
      };
    };
  };
  pricing: {
    premium: {
      monthly: { price: number; period: string; discount?: string; originalPrice?: number };
      quarterly: { price: number; period: string; discount?: string; originalPrice?: number };
      yearly: { price: number; period: string; discount?: string; originalPrice?: number };
    };
    vip: {
      monthly: { price: number; period: string; discount?: string; originalPrice?: number };
      quarterly: { price: number; period: string; discount?: string; originalPrice?: number };
      yearly: { price: number; period: string; discount?: string; originalPrice?: number };
    };
  };
  currentLevel: string;
}

// 使用统计数据类型
interface UsageStats {
  aiGenerations: {
    used: number;
    total: number | null;
    percentage: number;
  };
  storage: {
    used: number;
    total: number | null;
    percentage: number;
  };
  exports: {
    used: number;
    total: number | null;
    percentage: number;
  };
}

// 订单数据类型
interface Order {
  id: string;
  plan: string;
  plan_name: string;
  period: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  payment_method: string;
  created_at: string;
  paid_at: string | null;
  expires_at: string | null;
}

const Membership: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState('overview');
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [benefits, setBenefits] = useState<MembershipBenefits | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersPagination, setOrdersPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // 获取会员权益配置
  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        const response = await apiClient.get<{ success: boolean; data: MembershipBenefits }>('/api/membership/benefits');
        if (response.ok && response.data?.success) {
          setBenefits(response.data.data);
        }
      } catch (err) {
        console.error('获取会员权益失败:', err);
      }
    };

    fetchBenefits();
  }, []);

  // 获取使用统计
  useEffect(() => {
    const fetchUsageStats = async () => {
      if (!user) return;
      
      try {
        const response = await apiClient.get<{ success: boolean; data: UsageStats }>('/api/membership/usage');
        if (response.ok && response.data?.success) {
          setUsageStats(response.data.data);
        }
      } catch (err) {
        console.error('获取使用统计失败:', err);
      }
    };

    fetchUsageStats();
  }, [user]);

  // 获取订单记录
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        const response = await apiClient.get<{
          success: boolean;
          data: {
            orders: Order[];
            pagination: typeof ordersPagination;
          }
        }>(`/api/membership/orders?page=${ordersPagination.page}&limit=${ordersPagination.limit}`);
        
        if (response.ok && response.data?.success) {
          setOrders(response.data.data.orders);
          setOrdersPagination(response.data.data.pagination);
        }
      } catch (err) {
        console.error('获取订单记录失败:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, ordersPagination.page]);

  // 处理升级会员
  const handleUpgrade = (planId?: string) => {
    navigate('/membership/payment/personal', {
      state: { plan: planId || (user?.membershipLevel === 'free' ? 'premium' : 'vip') }
    });
  };

  // 处理续费
  const handleRenew = () => {
    // 如果当前是免费会员，则引导到升级页面
    const targetPlan = user?.membershipLevel === 'free' ? 'premium' : user?.membershipLevel;
    navigate('/membership/payment/personal', {
      state: { plan: targetPlan, renew: user?.membershipLevel !== 'free' }
    });
  };

  // 未登录状态
  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-slate-900' : 'bg-gray-50'
      }`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            text-center p-8 rounded-3xl max-w-md mx-4
            ${isDark ? 'bg-slate-800/50' : 'bg-white'}
            border ${isDark ? 'border-slate-700' : 'border-gray-200'}
            shadow-xl
          `}
        >
          <div className={`
            w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6
            ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}
          `}>
            <Crown size={40} className="text-indigo-500" />
          </div>
          <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            请先登录
          </h2>
          <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            登录后即可查看和管理您的会员权益
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/login')}
            className="
              px-8 py-3 rounded-xl font-medium text-white
              bg-gradient-to-r from-indigo-500 to-purple-500
              shadow-lg hover:shadow-xl hover:brightness-110
              transition-all duration-200
            "
          >
            立即登录
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // 渲染中间内容区
  const renderMainContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* 会员状态卡片 */}
            <MembershipStatusCard
              isDark={isDark}
              user={user}
              onRenew={handleRenew}
              onUpgrade={() => handleUpgrade()}
            />

            {/* 权益对比 */}
            <div className={`
              p-6 rounded-3xl border
              ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-gray-200'}
            `}>
              <BenefitsGrid isDark={isDark} user={user} benefits={benefits} />
            </div>

            {/* 升级套餐 */}
            <div className={`
              p-6 rounded-3xl border
              ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-gray-200'}
            `}>
              <PricingCards
                isDark={isDark}
                user={user}
                onUpgrade={handleUpgrade}
                pricing={benefits?.pricing}
              />
            </div>

            {/* FAQ */}
            <div className={`
              p-6 rounded-3xl border
              ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-gray-200'}
            `}>
              <FAQSection isDark={isDark} />
            </div>
          </div>
        );

      case 'subscription':
        return (
          <div className="space-y-8">
            <div className={`
              p-6 rounded-3xl border
              ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-gray-200'}
            `}>
              <PricingCards
                isDark={isDark}
                user={user}
                onUpgrade={handleUpgrade}
                pricing={benefits?.pricing}
              />
            </div>
          </div>
        );

      case 'benefits':
        return (
          <div className="space-y-8">
            <MembershipStatusCard
              isDark={isDark}
              user={user}
              onRenew={handleRenew}
              onUpgrade={() => handleUpgrade()}
            />
            <div className={`
              p-6 rounded-3xl border
              ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-gray-200'}
            `}>
              <BenefitsGrid isDark={isDark} user={user} benefits={benefits} />
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className={`
            p-6 rounded-3xl border
            ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-gray-200'}
          `}>
            <OrdersList
              isDark={isDark}
              orders={orders}
              pagination={ordersPagination}
              onPageChange={(page) => setOrdersPagination(prev => ({ ...prev, page }))}
              loading={loading}
            />
          </div>
        );

      case 'support':
        return (
          <div className={`
            p-6 rounded-3xl border
            ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-gray-200'}
          `}>
            <FAQSection isDark={isDark} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      {/* 移动端头部 */}
      <div className={`
        lg:hidden flex items-center justify-between p-4 sticky top-0 z-40
        ${isDark ? 'bg-slate-900/95 border-b border-slate-800' : 'bg-white/95 border-b border-gray-200'}
        backdrop-blur-sm
      `}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`
              p-2 rounded-lg transition-colors
              ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}
            `}
          >
            {isMobileMenuOpen ? (
              <X size={24} className={isDark ? 'text-slate-300' : 'text-gray-700'} />
            ) : (
              <Menu size={24} className={isDark ? 'text-slate-300' : 'text-gray-700'} />
            )}
          </button>
          <h1 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            会员中心
          </h1>
        </div>

        {/* 用户头像 */}
        <div className={`
          w-9 h-9 rounded-xl flex items-center justify-center
          ${isDark ? 'bg-slate-800' : 'bg-gray-100'}
        `}>
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-full h-full rounded-xl object-cover" />
          ) : (
            <span className="text-sm font-bold">{user?.username?.charAt(0)?.toUpperCase() || 'U'}</span>
          )}
        </div>
      </div>

      {/* 三栏布局 */}
      <div className="flex max-w-[1600px] mx-auto">
        {/* 左侧导航 - 桌面端 */}
        <aside className={`
          hidden lg:block sticky top-0 h-screen overflow-hidden
          border-r ${isDark ? 'border-slate-800' : 'border-gray-200'}
          transition-all duration-300
        `}>
          <LeftSidebar
            isDark={isDark}
            user={user}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isCollapsed={isLeftSidebarCollapsed}
            onToggleCollapse={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
          />
        </aside>

        {/* 移动端侧边栏 */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`
                  fixed left-0 top-0 bottom-0 w-72 z-50 lg:hidden
                  ${isDark ? 'bg-slate-900' : 'bg-white'}
                  border-r ${isDark ? 'border-slate-800' : 'border-gray-200'}
                `}
              >
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    会员中心
                  </h2>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      p-2 rounded-lg transition-colors
                      ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}
                    `}
                  >
                    <X size={20} className={isDark ? 'text-slate-400' : 'text-gray-500'} />
                  </button>
                </div>
                <LeftSidebar
                  isDark={isDark}
                  user={user}
                  activeTab={activeTab}
                  onTabChange={(tab) => {
                    setActiveTab(tab);
                    setIsMobileMenuOpen(false);
                  }}
                  isCollapsed={false}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* 中间内容区 */}
        <main className="flex-1 min-w-0">
          <div className="p-4 lg:p-8">
            {/* 页面标题 - 桌面端 */}
            <div className="hidden lg:flex items-center justify-between mb-8">
              <div>
                <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  会员中心
                </h1>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  管理您的会员权益和订阅
                </p>
              </div>

              {/* 面包屑导航 */}
              <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                <span>首页</span>
                <ChevronRight size={16} />
                <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>会员中心</span>
              </div>
            </div>

            {/* 内容区域 */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderMainContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* 右侧辅助区 - 桌面端 */}
        <aside className={`
          hidden xl:block sticky top-0 h-screen w-80 overflow-y-auto
          border-l ${isDark ? 'border-slate-800' : 'border-gray-200'}
        `}>
          <RightSidebar
            isDark={isDark}
            user={user}
            onRenew={handleRenew}
            onUpgrade={() => handleUpgrade()}
            usageStats={usageStats}
          />
        </aside>
      </div>

      {/* 移动端底部快捷操作 */}
      <div className={`
        lg:hidden fixed bottom-0 left-0 right-0 p-4
        ${isDark ? 'bg-slate-900/95 border-t border-slate-800' : 'bg-white/95 border-t border-gray-200'}
        backdrop-blur-sm z-30
      `}>
        <div className="flex gap-3">
          {user?.membershipLevel !== 'free' && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleRenew}
              className={`
                flex-1 py-3 rounded-xl font-medium text-sm
                ${isDark
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                }
              `}
            >
              续费会员
            </motion.button>
          )}
          {user?.membershipLevel !== 'vip' && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleUpgrade()}
              className="
                flex-1 py-3 rounded-xl font-medium text-sm text-white
                bg-gradient-to-r from-indigo-500 to-purple-500
                shadow-lg
              "
            >
              升级会员
            </motion.button>
          )}
        </div>
      </div>

      {/* 移动端底部安全区域 */}
      <div className="lg:hidden h-20" />
    </div>
  );
};

export default Membership;
