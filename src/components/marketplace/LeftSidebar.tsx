/**
 * 左侧边栏组件
 * 包含品牌Logo、用户头像、分类导航、品牌筛选等
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  Store
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
  const { user, logout } = useAuth();

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
      {/* Logo区域 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mp-sidebar-card"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--haihe-500)] to-[var(--haihe-600)] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white flex-shrink-0" strokeWidth={2} />
          </div>
          <div>
            <h1 className="font-bold text-lg text-[var(--text-primary)]">津门文创</h1>
            <p className="text-xs text-[var(--text-muted)]">传承非遗文化</p>
          </div>
        </div>
      </motion.div>

      {/* 用户信息 */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mp-sidebar-card"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.nickname || user.username}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[var(--haihe-200)]"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--haihe-400)] to-[var(--haihe-600)] flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-white flex-shrink-0" strokeWidth={2} />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[var(--jinmen-500)] rounded-full flex items-center justify-center flex-shrink-0">
                <Award className="w-3 h-3 text-white flex-shrink-0" strokeWidth={2.5} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[var(--text-primary)] truncate">
                {user.nickname || user.username}
              </p>
              <p className="text-xs text-[var(--text-muted)]">VIP会员</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* 主导航 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mp-sidebar-card"
      >
        <h3 className="mp-sidebar-card-title">快捷导航</h3>
        <nav className="mp-sidebar-nav">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                onClick={() => handleMenuClick(item.href)}
                className="mp-sidebar-nav-item w-full text-left"
              >
                <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                <span>{item.label}</span>
              </motion.button>
            );
          })}
        </nav>
      </motion.div>

      {/* 商品分类 */}
      {categories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mp-sidebar-card"
        >
          <h3 className="mp-sidebar-card-title">商品分类</h3>
          <nav className="mp-sidebar-nav">
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => onCategorySelect?.('')}
              className={`mp-sidebar-nav-item w-full text-left ${selectedCategory === '' ? 'active' : ''}`}
            >
              <ShoppingBag className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              <span>全部商品</span>
            </motion.button>
            {categories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                onClick={() => onCategorySelect?.(category.id)}
                className={`mp-sidebar-nav-item w-full text-left ${selectedCategory === category.id ? 'active' : ''}`}
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

      {/* 底部操作 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mp-sidebar-card"
      >
        <nav className="mp-sidebar-nav">
          <button
            onClick={() => navigate('/settings')}
            className="mp-sidebar-nav-item w-full text-left"
          >
            <Settings className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
            <span>设置</span>
          </button>
          {user && (
            <button
              onClick={logout}
              className="mp-sidebar-nav-item w-full text-left text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              <span>退出登录</span>
            </button>
          )}
        </nav>
      </motion.div>
    </div>
  );
};

export default LeftSidebar;
