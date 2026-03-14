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
  Search,
  Filter,
  MoreVertical,
  Edit3,
  Trash2,
  Power,
  RefreshCw,
  Calendar,
  DollarSign,
  Briefcase,
  User,
  MessageSquare,
  TrendingUp,
  Eye,
  X,
  CheckSquare,
  AlertCircle,
  Archive,
} from 'lucide-react';

// ============================================================================
// 类型定义
// ============================================================================

type OrderStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'closed';
type SortField = 'created_at' | 'budget_max' | 'deadline' | 'application_count';
type SortOrder = 'asc' | 'desc';

interface FilterState {
  status: OrderStatus;
  keyword: string;
  dateRange: { start: string; end: string };
  sort: { field: SortField; order: SortOrder };
}

// ============================================================================
// 状态标签组件
// ============================================================================

const StatusBadge = ({ status, size = 'md' }: { status: string; size?: 'sm' | 'md' | 'lg' }) => {
  const { isDark } = useTheme();
  
  const config = {
    pending: {
      bg: isDark ? 'bg-amber-500/15' : 'bg-amber-50',
      text: isDark ? 'text-amber-400' : 'text-amber-700',
      border: isDark ? 'border-amber-500/30' : 'border-amber-200',
      icon: Clock,
      label: '审核中',
    },
    approved: {
      bg: isDark ? 'bg-emerald-500/15' : 'bg-emerald-50',
      text: isDark ? 'text-emerald-400' : 'text-emerald-700',
      border: isDark ? 'border-emerald-500/30' : 'border-emerald-200',
      icon: CheckCircle,
      label: '已通过',
    },
    rejected: {
      bg: isDark ? 'bg-rose-500/15' : 'bg-rose-50',
      text: isDark ? 'text-rose-400' : 'text-rose-700',
      border: isDark ? 'border-rose-500/30' : 'border-rose-200',
      icon: XCircle,
      label: '已驳回',
    },
    closed: {
      bg: isDark ? 'bg-slate-500/15' : 'bg-slate-50',
      text: isDark ? 'text-slate-400' : 'text-slate-700',
      border: isDark ? 'border-slate-500/30' : 'border-slate-200',
      icon: Archive,
      label: '已结束',
    },
  };

  const style = config[status as keyof typeof config] || config.pending;
  const Icon = style.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${style.bg} ${style.text} ${style.border} ${sizeClasses[size]}`}>
      <Icon className="w-3.5 h-3.5" />
      {style.label}
    </span>
  );
};

// ============================================================================
// 申请状态标签
// ============================================================================

const ApplicationStatusBadge = ({ status }: { status: string }) => {
  const { isDark } = useTheme();
  
  const config = {
    pending: {
      bg: isDark ? 'bg-blue-500/15' : 'bg-blue-50',
      text: isDark ? 'text-blue-400' : 'text-blue-700',
      label: '待审核',
    },
    approved: {
      bg: isDark ? 'bg-emerald-500/15' : 'bg-emerald-50',
      text: isDark ? 'text-emerald-400' : 'text-emerald-700',
      label: '已通过',
    },
    rejected: {
      bg: isDark ? 'bg-rose-500/15' : 'bg-rose-50',
      text: isDark ? 'text-rose-400' : 'text-rose-700',
      label: '已拒绝',
    },
  };

  const style = config[status as keyof typeof config] || config.pending;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
};

// ============================================================================
// 统计卡片组件
// ============================================================================

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  color,
  isActive,
  onClick 
}: { 
  icon: any; 
  label: string; 
  value: number;
  trend?: { value: number; isPositive: boolean };
  color: string;
  isActive?: boolean;
  onClick?: () => void;
}) => {
  const { isDark } = useTheme();
  
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`relative overflow-hidden p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${
        isActive 
          ? isDark 
            ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/50 shadow-lg shadow-blue-500/10' 
            : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-300 shadow-lg shadow-blue-500/10'
          : isDark 
            ? 'bg-gray-800/60 border-gray-700 hover:border-gray-600' 
            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
    >
      {/* 背景装饰 */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 ${color}`} />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className={`p-2.5 rounded-xl w-fit mb-3 ${color} bg-opacity-20`}>
            <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-').replace('/20', '')}`} />
          </div>
          <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
          <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
          
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${
              trend.isPositive ? 'text-emerald-500' : 'text-rose-500'
            }`}>
              <TrendingUp className={`w-3 h-3 ${!trend.isPositive && 'rotate-180'}`} />
              <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
              <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>较上周</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// 商单列表项组件
// ============================================================================

const OrderListItem = React.forwardRef<HTMLDivElement, { 
  order: BrandOrder; 
  isSelected: boolean;
  onClick: () => void;
  onAction: (action: string, order: BrandOrder) => void;
}>(({ 
  order, 
  isSelected, 
  onClick,
  onAction
}, ref) => {
  const { isDark } = useTheme();
  const [showActions, setShowActions] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return '已截止';
    if (days === 0) return '今天截止';
    if (days === 1) return '明天截止';
    if (days <= 7) return `${days}天后截止`;
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={onClick}
      className={`group relative p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
        isSelected
          ? isDark 
            ? 'bg-blue-600/10 border-blue-500/50 shadow-md' 
            : 'bg-blue-50 border-blue-400 shadow-md'
          : isDark 
            ? 'bg-gray-800/40 border-gray-700 hover:border-gray-600 hover:bg-gray-800/60' 
            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      {/* 选中指示器 */}
      {isSelected && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-blue-500 rounded-r-full" />
      )}
      
      <div className="flex items-start gap-4">
        {/* 商单图标 */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
          isDark ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          <Briefcase className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        </div>
        
        {/* 主要内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {order.title}
              </h3>
              <p className={`text-sm mt-0.5 truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {order.brand_name}
              </p>
            </div>
            <StatusBadge status={order.status} size="sm" />
          </div>
          
          {/* 关键信息 */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <div className={`flex items-center gap-1.5 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="font-medium">{formatCurrency(order.budget_min)}</span>
              <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>-</span>
              <span className="font-medium">{formatCurrency(order.budget_max)}</span>
            </div>
            
            <div className={`flex items-center gap-1.5 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>{formatDate(order.deadline)}</span>
            </div>
            
            {order.application_count !== undefined && order.application_count > 0 && (
              <div className={`flex items-center gap-1.5 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <Users className="w-4 h-4 text-purple-500" />
                <span>{order.application_count} 个申请</span>
              </div>
            )}
          </div>
        </div>
        
        {/* 操作菜单 */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          <AnimatePresence>
            {showActions && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowActions(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  className={`absolute right-0 top-full mt-1 w-40 rounded-xl border shadow-lg z-50 overflow-hidden ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction('view', order);
                      setShowActions(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                      isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    查看详情
                  </button>
                  
                  {order.status !== 'closed' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction('edit', order);
                        setShowActions(false);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                        isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Edit3 className="w-4 h-4" />
                      编辑
                    </button>
                  )}
                  
                  {order.status === 'approved' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction('close', order);
                        setShowActions(false);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                        isDark ? 'hover:bg-gray-700 text-amber-400' : 'hover:bg-gray-50 text-amber-600'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                      结束商单
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction('delete', order);
                      setShowActions(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                      isDark ? 'hover:bg-rose-500/20 text-rose-400' : 'hover:bg-rose-50 text-rose-600'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
});

OrderListItem.displayName = 'OrderListItem';

// ============================================================================
// 详情面板组件
// ============================================================================

const OrderDetailPanel = ({ 
  order, 
  onClose, 
  onAction,
  applications,
  loadingApplications
}: { 
  order: BrandOrder | null;
  onClose: () => void;
  onAction: (action: string, order: BrandOrder) => void;
  applications: OrderApplication[];
  loadingApplications: boolean;
}) => {
  const { isDark } = useTheme();

  if (!order) {
    return (
      <div className={`h-full flex flex-col items-center justify-center p-8 ${
        isDark ? 'text-gray-500' : 'text-gray-400'
      }`}>
        <Package className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">选择一个商单查看详情</p>
        <p className="text-sm mt-1">点击左侧列表中的商单</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className={`flex items-center justify-between p-5 border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors lg:hidden ${
              isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              商单详情
            </h2>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              ID: {order.id.slice(0, 8)}...
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {order.status !== 'closed' && (
            <button
              onClick={() => onAction('edit', order)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isDark 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              编辑
            </button>
          )}
        </div>
      </div>
      
      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        {/* 基本信息卡片 */}
        <div className="p-5">
          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {order.title}
                </h3>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {order.brand_name}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            
            {/* 关键数据 */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-white'}`}>
                <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>预算范围</p>
                <p className={`text-lg font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {formatCurrency(order.budget_min)} - {formatCurrency(order.budget_max)}
                </p>
              </div>
              
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-white'}`}>
                <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>截止日期</p>
                <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {new Date(order.deadline).toLocaleDateString('zh-CN')}
                </p>
              </div>
              
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-white'}`}>
                <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>招募人数</p>
                <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  最多 {order.max_applicants} 人
                </p>
              </div>
              
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-white'}`}>
                <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>商单类型</p>
                <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {order.type}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 任务描述 */}
        <div className="px-5 pb-5">
          <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            任务描述
          </h4>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {order.description}
          </p>
        </div>
        
        {/* 任务要求 */}
        {order.requirements && order.requirements.length > 0 && (
          <div className="px-5 pb-5">
            <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              任务要求
            </h4>
            <ul className="space-y-2">
              {order.requirements.map((req, index) => (
                <li 
                  key={index} 
                  className={`flex items-start gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  <CheckSquare className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* 接单申请 */}
        <div className="px-5 pb-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              接单申请
            </h4>
            {loadingApplications && (
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            )}
          </div>
          
          {applications.length === 0 ? (
            <div className={`text-center py-8 rounded-xl border border-dashed ${
              isDark ? 'bg-gray-800/30 border-gray-700 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-400'
            }`}>
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无接单申请</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <ApplicationCard 
                  key={app.id} 
                  application={app} 
                  onReview={(status) => onAction('review', { ...order, applicationId: app.id, reviewStatus: status } as any)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* 底部操作 */}
      <div className={`p-5 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex gap-3">
          {order.status === 'approved' && (
            <button
              onClick={() => onAction('close', order)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                isDark 
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400' 
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
              }`}
            >
              <Power className="w-4 h-4" />
              结束商单
            </button>
          )}
          
          <button
            onClick={() => onAction('delete', order)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors ${
              isDark 
                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400' 
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            删除商单
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 申请卡片组件
// ============================================================================

const ApplicationCard = ({ 
  application, 
  onReview 
}: { 
  application: OrderApplication;
  onReview: (status: 'approved' | 'rejected') => void;
}) => {
  const { isDark } = useTheme();

  return (
    <motion.div
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
            {application.creator_avatar ? (
              <img 
                src={application.creator_avatar} 
                alt="" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            )}
          </div>
          <div>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {application.creator_name || '未知创作者'}
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {new Date(application.created_at).toLocaleDateString('zh-CN')} 申请
            </p>
          </div>
        </div>
        <ApplicationStatusBadge status={application.status} />
      </div>
      
      {application.message && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${
          isDark ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-600'
        }`}>
          <MessageSquare className="w-4 h-4 inline mr-1.5 opacity-70" />
          {application.message}
        </div>
      )}
      
      {application.status === 'pending' && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onReview('approved')}
            className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            通过
          </button>
          <button
            onClick={() => onReview('rejected')}
            className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            拒绝
          </button>
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// 编辑弹窗组件
// ============================================================================

const EditOrderModal = ({
  order,
  isOpen,
  onClose,
  onSave,
}: {
  order: BrandOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderId: string, data: Partial<BrandOrder>) => void;
}) => {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState<Partial<BrandOrder>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (order) {
      setFormData({
        title: order.title,
        brand_name: order.brand_name,
        description: order.description,
        budget_min: order.budget_min,
        budget_max: order.budget_max,
        deadline: order.deadline,
        max_applicants: order.max_applicants,
        location: order.location,
        type: order.type,
        requirements: order.requirements,
      });
    }
  }, [order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order?.id) return;
    
    setSaving(true);
    try {
      onSave(order.id, formData);
      onClose();
    } finally {
      setSaving(false);
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
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl ${
            isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                编辑商单
              </h2>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* 标题 */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                商单标题
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                  isDark
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                placeholder="输入商单标题"
              />
            </div>

            {/* 品牌名称 */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                品牌名称
              </label>
              <input
                type="text"
                value={formData.brand_name || ''}
                onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                  isDark
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                placeholder="输入品牌名称"
              />
            </div>

            {/* 预算范围 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  最低预算
                </label>
                <div className="relative">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    ¥
                  </span>
                  <input
                    type="number"
                    value={formData.budget_min || ''}
                    onChange={(e) => setFormData({ ...formData, budget_min: Number(e.target.value) })}
                    className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm transition-colors ${
                      isDark
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  最高预算
                </label>
                <div className="relative">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    ¥
                  </span>
                  <input
                    type="number"
                    value={formData.budget_max || ''}
                    onChange={(e) => setFormData({ ...formData, budget_max: Number(e.target.value) })}
                    className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm transition-colors ${
                      isDark
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* 截止日期和招募人数 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  截止日期
                </label>
                <input
                  type="date"
                  value={formData.deadline ? new Date(formData.deadline).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, deadline: new Date(e.target.value).toISOString() })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                    isDark
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  招募人数
                </label>
                <input
                  type="number"
                  value={formData.max_applicants || ''}
                  onChange={(e) => setFormData({ ...formData, max_applicants: Number(e.target.value) })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                    isDark
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  placeholder="1"
                  min={1}
                />
              </div>
            </div>

            {/* 描述 */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                任务描述
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors resize-none ${
                  isDark
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                placeholder="描述任务内容、要求等..."
              />
            </div>

            {/* 底部按钮 */}
            <div className={`flex gap-3 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                保存修改
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================================================
// 删除确认弹窗
// ============================================================================

const DeleteConfirmModal = ({
  order,
  isOpen,
  onClose,
  onConfirm,
}: {
  order: BrandOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  const { isDark } = useTheme();
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setDeleting(false);
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
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`w-full max-w-md rounded-2xl p-6 ${
            isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-full ${isDark ? 'bg-rose-500/20' : 'bg-rose-100'}`}>
              <AlertCircle className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                确认删除商单？
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                此操作不可撤销
              </p>
            </div>
          </div>
          
          <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{order.title}</p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{order.brand_name}</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={deleting}
              className="flex-1 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/50 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {deleting && <RefreshCw className="w-4 h-4 animate-spin" />}
              确认删除
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================================================
// 主组件
// ============================================================================

const BrandOrderManagement: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  
  // 状态管理
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
  const [filter, setFilter] = useState<FilterState>({
    status: 'all',
    keyword: '',
    dateRange: { start: '', end: '' },
    sort: { field: 'created_at', order: 'desc' },
  });
  const [selectedOrder, setSelectedOrder] = useState<BrandOrder | null>(null);
  const [applications, setApplications] = useState<OrderApplication[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<BrandOrder | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<BrandOrder | null>(null);

  // 加载数据
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const [ordersData, statsData] = await Promise.all([
        brandOrderService.getBrandOrders(user.id, {
          status: filter.status === 'all' ? undefined : filter.status,
          keyword: filter.keyword || undefined,
        }),
        brandOrderService.getBrandOrderStats(user.id),
      ]);
      
      // 排序
      const sortedOrders = [...ordersData].sort((a, b) => {
        const field = filter.sort.field;
        const order = filter.sort.order === 'asc' ? 1 : -1;
        
        if (field === 'created_at') {
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * order;
        }
        if (field === 'budget_max') {
          return ((a.budget_max || 0) - (b.budget_max || 0)) * order;
        }
        if (field === 'deadline') {
          return (new Date(a.deadline).getTime() - new Date(b.deadline).getTime()) * order;
        }
        if (field === 'application_count') {
          return ((a.application_count || 0) - (b.application_count || 0)) * order;
        }
        return 0;
      });
      
      setOrders(sortedOrders);
      setStats(statsData);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [user?.id, filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 加载申请列表
  const loadApplications = async (orderId: string) => {
    setLoadingApplications(true);
    try {
      const data = await brandOrderService.getOrderApplications(orderId);
      setApplications(data);
    } catch (error) {
      console.error('加载申请列表失败:', error);
    } finally {
      setLoadingApplications(false);
    }
  };

  // 选择商单
  const handleSelectOrder = async (order: BrandOrder) => {
    setSelectedOrder(order);
    setShowDetailPanel(true);
    await loadApplications(order.id);
  };

  // 处理操作
  const handleAction = async (action: string, order: BrandOrder) => {
    switch (action) {
      case 'view':
        handleSelectOrder(order);
        break;
      case 'edit':
        setEditingOrder(order);
        setShowEditModal(true);
        break;
      case 'delete':
        setDeletingOrder(order);
        setShowDeleteModal(true);
        break;
      case 'close':
        try {
          const success = await brandOrderService.closeBrandOrder(order.id);
          if (success) {
            toast.success('商单已结束');
            loadData();
            if (selectedOrder?.id === order.id) {
              setSelectedOrder({ ...selectedOrder, status: 'closed' });
            }
          } else {
            toast.error('操作失败');
          }
        } catch (error) {
          console.error('结束商单失败:', error);
          toast.error('结束商单失败');
        }
        break;
      case 'review':
        // 处理审核
        const reviewData = order as any;
        try {
          const success = await brandOrderService.reviewApplication(
            reviewData.applicationId,
            reviewData.reviewStatus
          );
          if (success) {
            toast.success(reviewData.reviewStatus === 'approved' ? '已通过申请' : '已拒绝申请');
            loadApplications(order.id);
            loadData();
          } else {
            toast.error('操作失败');
          }
        } catch (error) {
          console.error('审核失败:', error);
          toast.error('审核失败');
        }
        break;
    }
  };

  // 保存编辑
  const handleSaveEdit = async (orderId: string, data: Partial<BrandOrder>) => {
    try {
      const success = await brandOrderService.updateBrandOrder(orderId, data);
      if (success) {
        toast.success('商单已更新');
        loadData();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, ...data });
        }
      } else {
        toast.error('更新失败');
      }
    } catch (error) {
      console.error('更新商单失败:', error);
      toast.error('更新失败');
    }
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!deletingOrder) return;
    
    try {
      const success = await brandOrderService.deleteBrandOrder(deletingOrder.id);
      if (success) {
        toast.success('商单已删除');
        loadData();
        if (selectedOrder?.id === deletingOrder.id) {
          setSelectedOrder(null);
          setShowDetailPanel(false);
        }
      } else {
        toast.error('删除失败');
        throw new Error('删除失败');
      }
    } catch (error) {
      console.error('删除商单失败:', error);
      toast.error('删除失败');
      throw error;
    }
  };

  // 统计卡片数据
  const statCards = [
    { 
      key: 'all', 
      icon: Package, 
      label: '全部商单', 
      value: stats.total,
      color: 'bg-blue-500',
    },
    { 
      key: 'pending', 
      icon: Clock, 
      label: '审核中', 
      value: stats.pending,
      color: 'bg-amber-500',
    },
    { 
      key: 'approved', 
      icon: CheckCircle, 
      label: '已通过', 
      value: stats.approved,
      color: 'bg-emerald-500',
    },
    { 
      key: 'rejected', 
      icon: XCircle, 
      label: '已驳回', 
      value: stats.rejected,
      color: 'bg-rose-500',
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* 统计卡片区域 */}
      <div className="p-5 pb-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <StatCard
              key={card.key}
              icon={card.icon}
              label={card.label}
              value={card.value}
              color={card.color}
              isActive={filter.status === card.key}
              onClick={() => setFilter({ ...filter, status: card.key as OrderStatus })}
            />
          ))}
        </div>
      </div>

      {/* 三栏式布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：筛选和列表 - 根据是否选中商单动态调整宽度 */}
        <div className={`flex flex-col border-r transition-all duration-300 ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        } ${
          // 移动端：选中详情时隐藏列表
          showDetailPanel ? 'hidden lg:flex' : 'flex'
        } ${
          // 桌面端：根据是否选中调整宽度
          selectedOrder 
            ? 'w-full lg:w-[420px] xl:w-[480px] flex-shrink-0' 
            : 'w-full lg:flex-1'
        }`}>
          {/* 筛选栏 */}
          <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            {/* 搜索框 */}
            <div className="relative mb-3">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="搜索商单标题或品牌..."
                value={filter.keyword}
                onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border transition-colors ${
                  isDark
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
            
            {/* 排序选择 */}
            <div className="flex items-center gap-2">
              <Filter className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <select
                value={`${filter.sort.field}-${filter.sort.order}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setFilter({ 
                    ...filter, 
                    sort: { field: field as SortField, order: order as SortOrder }
                  });
                }}
                className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors ${
                  isDark
                    ? 'bg-gray-800 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:border-blue-500`}
              >
                <option value="created_at-desc">最新发布</option>
                <option value="created_at-asc">最早发布</option>
                <option value="budget_max-desc">预算从高到低</option>
                <option value="budget_max-asc">预算从低到高</option>
                <option value="deadline-asc">截止日期最近</option>
                <option value="application_count-desc">申请数最多</option>
              </select>
            </div>
          </div>
          
          {/* 商单列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : orders.length === 0 ? (
              <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">暂无商单</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {orders.map((order) => (
                  <OrderListItem
                    key={order.id}
                    order={order}
                    isSelected={selectedOrder?.id === order.id}
                    onClick={() => handleSelectOrder(order)}
                    onAction={handleAction}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* 右侧：详情面板 - 仅在有选中商单时显示 */}
        {selectedOrder && (
          <div className={`flex-1 ${
            showDetailPanel ? 'flex' : 'hidden lg:flex'
          } ${isDark ? 'bg-gray-900/50' : 'bg-gray-50/50'}`}>
            <OrderDetailPanel
              order={selectedOrder}
              onClose={() => setShowDetailPanel(false)}
              onAction={handleAction}
              applications={applications}
              loadingApplications={loadingApplications}
            />
          </div>
        )}
      </div>

      {/* 编辑弹窗 */}
      <EditOrderModal
        order={editingOrder}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingOrder(null);
        }}
        onSave={handleSaveEdit}
      />

      {/* 删除确认弹窗 */}
      <DeleteConfirmModal
        order={deletingOrder}
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingOrder(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default BrandOrderManagement;
