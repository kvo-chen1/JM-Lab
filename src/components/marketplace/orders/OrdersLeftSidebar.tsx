/**
 * 订单页面左栏组件
 * 包含用户信息卡片、订单状态导航和快捷功能入口
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  ShoppingBag,
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  RotateCcw,
  MapPin,
  Ticket,
  Heart,
  History,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface UserMiniCardProps {
  user: {
    id?: string;
    username?: string;
    avatar_url?: string;
    membership_level?: string;
  } | null;
}

// 用户迷你卡片
const UserMiniCard: React.FC<UserMiniCardProps> = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="p-5 border-b border-slate-100">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-semibold shadow-lg">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user?.username || '用户'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">
            {user?.username || '用户'}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-medium rounded-full">
              {user?.membership_level || '普通会员'}
            </span>
          </div>
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <QuickLink
          icon={User}
          label="个人中心"
          onClick={() => navigate('/dashboard')}
        />
        <QuickLink
          icon={MapPin}
          label="收货地址"
          onClick={() => navigate('/marketplace/address')}
        />
        <QuickLink
          icon={Ticket}
          label="优惠券"
          onClick={() => toast.info('优惠券功能开发中')}
        />
      </div>
    </div>
  );
};

// 快捷链接
interface QuickLinkProps {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}

const QuickLink: React.FC<QuickLinkProps> = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
  >
    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
      <Icon className="w-4 h-4 text-slate-600 group-hover:text-blue-600" />
    </div>
    <span className="text-xs text-slate-600">{label}</span>
  </button>
);

// 订单状态导航项
interface StatusNavItemProps {
  icon: React.ElementType;
  label: string;
  count?: number;
  isActive?: boolean;
  color?: string;
  onClick?: () => void;
}

const StatusNavItem: React.FC<StatusNavItemProps> = ({
  icon: Icon,
  label,
  count,
  isActive,
  color = 'blue',
  onClick,
}) => {
  const colorClasses: Record<string, { active: string; inactive: string; badge: string }> = {
    blue: {
      active: 'bg-blue-50 text-blue-700 border-blue-200',
      inactive: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
      badge: 'bg-blue-100 text-blue-700',
    },
    amber: {
      active: 'bg-amber-50 text-amber-700 border-amber-200',
      inactive: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
      badge: 'bg-amber-100 text-amber-700',
    },
    purple: {
      active: 'bg-purple-50 text-purple-700 border-purple-200',
      inactive: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
      badge: 'bg-purple-100 text-purple-700',
    },
    green: {
      active: 'bg-green-50 text-green-700 border-green-200',
      inactive: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
      badge: 'bg-green-100 text-green-700',
    },
    gray: {
      active: 'bg-slate-100 text-slate-700 border-slate-200',
      inactive: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
      badge: 'bg-slate-200 text-slate-700',
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
        isActive ? `${colors.active} border` : colors.inactive
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${isActive ? '' : 'text-slate-400'}`} />
        <span>{label}</span>
      </div>
      {count !== undefined && count > 0 && (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${colors.badge}`}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
};

// 快捷功能项
interface QuickActionItemProps {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}

const QuickActionItem: React.FC<QuickActionItemProps> = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors group"
  >
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
      <span>{label}</span>
    </div>
    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
  </button>
);

// 主组件
interface OrdersLeftSidebarProps {
  user: any;
  activeStatus: string;
  statusCounts: Record<string, number>;
  onStatusChange: (status: string) => void;
}

export const OrdersLeftSidebar: React.FC<OrdersLeftSidebarProps> = ({
  user,
  activeStatus,
  statusCounts,
  onStatusChange,
}) => {
  const navigate = useNavigate();

  const statusNavItems = [
    { value: 'all', label: '全部订单', icon: ShoppingBag, color: 'blue' },
    { value: 'pending_payment', label: '待付款', icon: Clock, color: 'amber' },
    { value: 'paid', label: '待发货', icon: Package, color: 'blue' },
    { value: 'shipped', label: '待收货', icon: Truck, color: 'purple' },
    { value: 'completed', label: '已完成', icon: CheckCircle, color: 'green' },
    { value: 'cancelled', label: '已取消', icon: XCircle, color: 'gray' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="flex flex-col h-full">
      {/* 用户信息卡片 */}
      <UserMiniCard user={user} />

      {/* 订单状态导航 */}
      <div className="flex-1 py-4 px-3">
        <h4 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          订单状态
        </h4>
        <motion.nav
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-1"
        >
          {statusNavItems.map((item) => (
            <motion.div key={item.value} variants={itemVariants}>
              <StatusNavItem
                icon={item.icon}
                label={item.label}
                count={statusCounts[item.value]}
                isActive={activeStatus === item.value}
                color={item.color}
                onClick={() => onStatusChange(item.value)}
              />
            </motion.div>
          ))}
        </motion.nav>
      </div>

      {/* 快捷功能 */}
      <div className="py-4 px-3 border-t border-slate-100">
        <h4 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          快捷功能
        </h4>
        <div className="space-y-1">
          <QuickActionItem
            icon={RotateCcw}
            label="售后服务"
            onClick={() => toast.info('售后服务功能开发中')}
          />
          <QuickActionItem
            icon={FileText}
            label="发票管理"
            onClick={() => toast.info('发票管理功能开发中')}
          />
          <QuickActionItem
            icon={Heart}
            label="我的收藏"
            onClick={() => navigate('/favorites')}
          />
          <QuickActionItem
            icon={History}
            label="浏览历史"
            onClick={() => navigate('/history')}
          />
        </div>
      </div>
    </div>
  );
};

export default OrdersLeftSidebar;
