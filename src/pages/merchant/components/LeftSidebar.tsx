/**
 * 商家工作平台 - 左侧功能导航
 * 使用真实数据库数据
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  ShoppingCart, 
  RefreshCw, 
  MessageSquare, 
  BarChart3,
  Store,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { merchantService } from '@/services/merchantService';

interface Module {
  id: string;
  label: string;
  icon: string;
}

interface LeftSidebarProps {
  modules: Module[];
  activeModule: string;
  onModuleChange: (moduleId: string) => void;
}

// 图标映射
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Package,
  ShoppingCart,
  RefreshCw,
  MessageSquare,
  BarChart3,
};

const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
  modules, 
  activeModule, 
  onModuleChange 
}) => {
  const [badgeCounts, setBadgeCounts] = useState({
    orders: 0,
    aftersales: 0,
    reviews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadgeCounts = async () => {
      try {
        setLoading(true);
        const merchant = await merchantService.getCurrentMerchant();
        if (merchant) {
          // 使用 user_id 查询，因为订单表的 seller_id 存储的是 user_id
          const userId = (merchant as any).user_id || merchant.id;
          
          // 获取待处理订单数
          const orders = await merchantService.getOrdersByUserId(userId, { status: 'paid' });
          
          // 获取待处理售后数
          const afterSales = await merchantService.getAfterSalesRequests(merchant.id, { status: 'pending' });
          
          // 获取待回复评价数
          const reviews = await merchantService.getReviews(merchant.id, { hasReply: false });

          setBadgeCounts({
            orders: orders.length,
            aftersales: afterSales.length,
            reviews: reviews.length,
          });
        }
      } catch (error) {
        console.error('获取徽章计数失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBadgeCounts();
  }, []);

  const getBadgeCount = (moduleId: string): number => {
    switch (moduleId) {
      case 'orders':
        return badgeCounts.orders;
      case 'aftersales':
        return badgeCounts.aftersales;
      case 'reviews':
        return badgeCounts.reviews;
      default:
        return 0;
    }
  };

  const getBadgeColor = (moduleId: string): string => {
    switch (moduleId) {
      case 'orders':
        return 'bg-red-500';
      case 'aftersales':
        return 'bg-amber-500';
      case 'reviews':
        return 'bg-blue-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <div className="space-y-4 sticky top-6">
      {/* 功能导航卡片 */}
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] overflow-hidden">
        {/* 标题 */}
        <div className="px-4 py-3 bg-[var(--bg-tertiary)] border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#5ba3d4]" />
            <span className="font-semibold text-[var(--text-primary)]">工作台</span>
          </div>
        </div>
        
        {/* 导航菜单 */}
        <nav className="p-2">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-[#5ba3d4]" />
            </div>
          ) : (
            modules.map((module, index) => {
              const Icon = iconMap[module.icon] || Package;
              const isActive = activeModule === module.id;
              const badgeCount = getBadgeCount(module.id);
              
              return (
                <motion.button
                  key={module.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onModuleChange(module.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all mb-1 ${
                    isActive 
                      ? 'bg-[#5ba3d4] text-white shadow-lg shadow-[#5ba3d4]/20' 
                      : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{module.label}</span>
                  
                  {/* 未读标记（真实数据） */}
                  {badgeCount > 0 && (
                    <span className={`ml-auto min-w-[20px] h-5 ${getBadgeColor(module.id)} rounded-full text-xs flex items-center justify-center text-white px-1`}>
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </motion.button>
              );
            })
          )}
        </nav>
      </div>

      {/* 快捷帮助 */}
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-sm font-medium text-[var(--text-tertiary)]">帮助中心</span>
        </div>
        <div className="space-y-2">
          <button className="w-full text-left text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors py-1">
            • 如何发布商品？
          </button>
          <button className="w-full text-left text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors py-1">
            • 订单发货流程
          </button>
          <button className="w-full text-left text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors py-1">
            • 售后处理指南
          </button>
          <button className="w-full text-left text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors py-1">
            • 联系平台客服
          </button>
        </div>
      </div>

      {/* 平台公告 */}
      <div className="bg-gradient-to-br from-[#5ba3d4]/10 to-[#3d6a8a]/10 rounded-xl border border-[#5ba3d4]/20 p-4">
        <h4 className="text-sm font-medium text-[#5ba3d4] mb-2">平台公告</h4>
        <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
          新功能上线：商家数据中心现已支持实时数据监控，帮助您更好地了解店铺运营情况。
        </p>
      </div>
    </div>
  );
};

export default LeftSidebar;
