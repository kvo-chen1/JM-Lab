/**
 * 左侧边栏组件 V2 - 全新设计
 * 包含品牌Logo、用户头像、分类导航、品牌筛选等
 * 优化：更现代的UI、更好的交互体验
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  Home, 
  ShoppingBag, 
  Heart, 
  ShoppingCart, 
  User, 
  Settings,
  LogOut,
  Sparkles,
  Award,
  Store,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

interface LeftSidebarProps {
  categories?: Array<{ id: string; name: string; icon?: string }>;
  selectedCategory?: string;
  onCategorySelect?: (categoryId: string) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  categories = [],
  selectedCategory = '',
  onCategorySelect,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === '/marketplace' && location.pathname === '/marketplace') {
      return true;
    }
    if (path !== '/marketplace' && location.pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  const menuItems = [
    { id: 'home', label: '首页', icon: Home, href: '/marketplace' },
    { id: 'products', label: '全部商品', icon: ShoppingBag, href: '/marketplace?sort=newest' },
    { id: 'favorites', label: '我的收藏', icon: Heart, href: '/favorites' },
    { id: 'cart', label: '购物车', icon: ShoppingCart, href: '/marketplace/cart' },
    { id: 'orders', label: '我的订单', icon: Store, href: '/orders' },
  ];

  const handleMenuClick = (href: string) => {
    navigate(href);
  };

  return (
    <div className="space-y-4">
      {/* Logo区域 - 新设计 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mp-sidebar-card overflow-hidden relative"
      >
        {/* 装饰背景 */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-sky-100 to-transparent rounded-bl-full opacity-50" />
        
        <div className="flex items-center gap-3 relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-500/25">
            <Sparkles className="w-6 h-6 text-white flex-shrink-0" strokeWidth={2} />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">津门文创</h1>
            <p className="text-xs text-gray-500">传承非遗文化</p>
          </div>
        </div>
      </motion.div>

      {/* 用户信息卡片 - 新设计 */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mp-user-card"
        >
          <div className="flex items-center gap-3">
            <div className="mp-user-avatar">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.nickname || user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
              )}
              <div className="mp-user-vip-badge">
                <Award className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {user.nickname || user.username}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="mp-badge mp-badge-vip text-xs">VIP</span>
                <span className="text-xs text-gray-400">会员</span>
              </div>
            </div>
          </div>
          
          {/* 会员进度条 */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-500">成长值</span>
              <span className="text-gray-700 font-medium">1,250 / 2,000</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                style={{ width: '62.5%' }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* 主导航 - 新设计 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mp-sidebar-card"
      >
        <h3 className="mp-sidebar-card-title">
          <ShoppingBag className="w-4 h-4 text-gray-400" />
          快捷导航
        </h3>
        <nav className="mp-sidebar-nav">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href.split('?')[0]);
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                onClick={() => handleMenuClick(item.href)}
                className={`mp-sidebar-nav-item ${active ? 'active' : ''}`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                <span>{item.label}</span>
                {active && (
                  <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                )}
              </motion.button>
            );
          })}
        </nav>
      </motion.div>

      {/* 商品分类 - 新设计 */}
      {categories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mp-sidebar-card"
        >
          <h3 className="mp-sidebar-card-title">
            <Store className="w-4 h-4 text-gray-400" />
            商品分类
          </h3>
          <nav className="mp-sidebar-nav">
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => onCategorySelect?.('')}
              className={`mp-sidebar-nav-item ${selectedCategory === '' ? 'active' : ''}`}
            >
              <ShoppingBag className="w-5 h-5" strokeWidth={selectedCategory === '' ? 2.5 : 2} />
              <span>全部商品</span>
            </motion.button>
            {categories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                onClick={() => onCategorySelect?.(category.id)}
                className={`mp-sidebar-nav-item ${selectedCategory === category.id ? 'active' : ''}`}
              >
                <span className="w-5 h-5 flex items-center justify-center text-lg">
                  {category.icon || '📦'}
                </span>
                <span>{category.name}</span>
              </motion.button>
            ))}
          </nav>
        </motion.div>
      )}

      {/* 底部操作 - 新设计 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mp-sidebar-card"
      >
        <nav className="mp-sidebar-nav">
          <button
            onClick={() => navigate('/settings')}
            className="mp-sidebar-nav-item"
          >
            <Settings className="w-5 h-5" strokeWidth={2} />
            <span>设置</span>
          </button>
          {user && (
            <button
              onClick={logout}
              className="mp-sidebar-nav-item text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" strokeWidth={2} />
              <span>退出登录</span>
            </button>
          )}
        </nav>
      </motion.div>
    </div>
  );
};

export default LeftSidebar;
