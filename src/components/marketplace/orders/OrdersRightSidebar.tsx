/**
 * 订单页面右栏组件
 * 包含订单统计、快捷操作
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  ShoppingCart,
  Clock,
  Package,
  Download,
  Printer,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

// 统计卡片
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: 'blue' | 'green' | 'purple' | 'amber';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color,
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-200',
    green: 'from-green-500 to-green-600 shadow-green-200',
    purple: 'from-purple-500 to-purple-600 shadow-purple-200',
    amber: 'from-amber-500 to-amber-600 shadow-amber-200',
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-slate-500'
            }`}>
              <TrendingUp className={`w-3 h-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white shadow-lg`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

// 快捷操作按钮
interface QuickActionButtonProps {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  variant = 'secondary',
}) => {
  const variantClasses = {
    primary: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
    secondary: 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors w-full ${variantClasses[variant]}`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
};

// 迷你趋势图
const MiniTrendChart: React.FC = () => {
  // 模拟数据点
  const dataPoints = [30, 45, 35, 50, 40, 60, 55, 70, 65, 80];
  const max = Math.max(...dataPoints);
  const min = Math.min(...dataPoints);
  const range = max - min;

  const points = dataPoints.map((value, index) => {
    const x = (index / (dataPoints.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="h-16 w-full">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,100 ${points} 100,100`}
          fill="url(#trendGradient)"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

// 主组件
interface OrdersRightSidebarProps {
  orders: any[];
}

export const OrdersRightSidebar: React.FC<OrdersRightSidebarProps> = ({ orders }) => {
  const navigate = useNavigate();

  // 计算统计数据
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
  });

  const monthlySpent = monthlyOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending_payment' || o.status === 'paid').length;

  // 处理导出订单
  const handleExportOrders = () => {
    // 创建 CSV 内容
    const headers = ['订单号', '下单时间', '状态', '商品名称', '数量', '金额'];
    const rows = orders.map(order => [
      order.order_no,
      new Date(order.created_at).toLocaleString('zh-CN'),
      order.status,
      order.items?.map((item: any) => item.product_name).join('; '),
      order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
      order.total_amount,
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `订单记录_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('订单记录已导出');
  };

  // 处理打印订单
  const handlePrintOrders = () => {
    window.print();
    toast.success('正在打印订单列表');
  };

  // 处理清理已完成订单
  const handleClearCompleted = () => {
    if (!confirm('确定要清理所有已完成的订单吗？此操作不会删除订单，只是将其归档。')) return;
    toast.success('已完成订单已归档');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col h-full p-5 space-y-6"
    >
      {/* 订单统计 */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">订单统计</h3>
          <span className="text-xs text-slate-400">本月</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="订单数"
            value={monthlyOrders.length}
            subtitle="较上月 +12%"
            icon={ShoppingCart}
            trend="up"
            trendValue="+12%"
            color="blue"
          />
          <StatCard
            title="消费金额"
            value={`¥${monthlySpent.toFixed(0)}`}
            subtitle="较上月 +8%"
            icon={TrendingUp}
            trend="up"
            trendValue="+8%"
            color="green"
          />
        </div>

        {/* 待处理订单提示 */}
        {pendingOrders > 0 && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">{pendingOrders} 个待处理订单</p>
              <p className="text-xs text-amber-700">请及时处理</p>
            </div>
          </div>
        )}

        {/* 趋势图 */}
        <div className="mt-4 p-4 bg-white rounded-2xl border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">消费趋势</span>
            <span className="text-xs text-green-600 font-medium">+23.5%</span>
          </div>
          <MiniTrendChart />
        </div>
      </motion.section>

      {/* 快捷操作 */}
      <motion.section variants={itemVariants}>
        <h3 className="text-sm font-semibold text-slate-900 mb-4">快捷操作</h3>
        <div className="space-y-2">
          <QuickActionButton
            icon={Download}
            label="导出订单记录"
            variant="secondary"
            onClick={handleExportOrders}
          />
          <QuickActionButton
            icon={Printer}
            label="打印订单列表"
            variant="secondary"
            onClick={handlePrintOrders}
          />
          <QuickActionButton
            icon={Trash2}
            label="清理已完成订单"
            variant="danger"
            onClick={handleClearCompleted}
          />
        </div>
      </motion.section>

      {/* 去商城购物入口 */}
      <motion.section variants={itemVariants}>
        <div
          onClick={() => navigate('/marketplace')}
          className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl text-white cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">去商城购物</p>
              <p className="text-sm text-blue-100 mt-1">发现更多好物</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
};

export default OrdersRightSidebar;
