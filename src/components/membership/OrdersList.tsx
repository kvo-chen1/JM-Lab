import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Crown,
  Star,
  User
} from 'lucide-react';

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

interface OrdersListProps {
  isDark: boolean;
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  loading?: boolean;
}

const OrdersList: React.FC<OrdersListProps> = ({
  isDark,
  orders,
  pagination,
  onPageChange,
  loading = false
}) => {
  const getStatusConfig = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle2,
          label: '已完成',
          color: isDark ? 'text-emerald-400' : 'text-emerald-600',
          bgColor: isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
        };
      case 'pending':
        return {
          icon: Clock,
          label: '待支付',
          color: isDark ? 'text-amber-400' : 'text-amber-600',
          bgColor: isDark ? 'bg-amber-500/20' : 'bg-amber-100'
        };
      case 'failed':
        return {
          icon: XCircle,
          label: '支付失败',
          color: isDark ? 'text-rose-400' : 'text-rose-600',
          bgColor: isDark ? 'bg-rose-500/20' : 'bg-rose-100'
        };
      case 'cancelled':
        return {
          icon: XCircle,
          label: '已取消',
          color: isDark ? 'text-slate-400' : 'text-slate-600',
          bgColor: isDark ? 'bg-slate-500/20' : 'bg-slate-100'
        };
      case 'refunded':
        return {
          icon: AlertCircle,
          label: '已退款',
          color: isDark ? 'text-blue-400' : 'text-blue-600',
          bgColor: isDark ? 'bg-blue-500/20' : 'bg-blue-100'
        };
      default:
        return {
          icon: Clock,
          label: '未知',
          color: isDark ? 'text-slate-400' : 'text-slate-600',
          bgColor: isDark ? 'bg-slate-500/20' : 'bg-slate-100'
        };
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'vip':
        return <Crown size={20} className="text-purple-500" />;
      case 'premium':
        return <Star size={20} className="text-blue-500" />;
      default:
        return <User size={20} className="text-gray-500" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'vip':
        return isDark ? 'text-purple-400' : 'text-purple-600';
      case 'premium':
        return isDark ? 'text-blue-400' : 'text-blue-600';
      default:
        return isDark ? 'text-slate-400' : 'text-slate-600';
    }
  };

  const formatPeriod = (period: string) => {
    const periodMap: Record<string, string> = {
      monthly: '月付',
      quarterly: '季付',
      yearly: '年付'
    };
    return periodMap[period] || period;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatPaymentMethod = (method: string | null) => {
    if (!method) return '-';
    const methodMap: Record<string, string> = {
      alipay: '支付宝',
      wechat: '微信支付',
      card: '银行卡'
    };
    return methodMap[method] || method;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>加载中...</span>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className={`
          w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4
          ${isDark ? 'bg-slate-800' : 'bg-gray-100'}
        `}>
          <FileText size={28} className={isDark ? 'text-slate-500' : 'text-gray-400'} />
        </div>
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          暂无订单记录
        </h3>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          您还没有购买过会员服务
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          订单记录
        </h3>
        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          共 {pagination.total} 条记录
        </span>
      </div>

      {/* 订单列表 */}
      <div className="space-y-4">
        {orders.map((order, index) => {
          const statusConfig = getStatusConfig(order.status);
          const StatusIcon = statusConfig.icon;

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                p-4 rounded-2xl border transition-all duration-200
                ${isDark
                  ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  : 'bg-white border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-start justify-between gap-4">
                {/* 左侧：订单信息 */}
                <div className="flex items-start gap-4">
                  {/* 套餐图标 */}
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                    ${isDark ? 'bg-slate-700' : 'bg-gray-100'}
                  `}>
                    {getPlanIcon(order.plan)}
                  </div>

                  {/* 订单详情 */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {order.plan_name}
                      </h4>
                      <span className={`
                        px-2 py-0.5 rounded text-xs font-medium
                        ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}
                      `}>
                        {formatPeriod(order.period)}
                      </span>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'} mb-2`}>
                      订单号: {order.id}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                        创建时间: {formatDate(order.created_at)}
                      </span>
                      {order.paid_at && (
                        <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                          支付时间: {formatDate(order.paid_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 右侧：金额和状态 */}
                <div className="text-right">
                  <div className={`text-xl font-bold mb-2 ${getPlanColor(order.plan)}`}>
                    ¥{order.amount}
                  </div>
                  <div className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                    ${statusConfig.bgColor} ${statusConfig.color}
                  `}>
                    <StatusIcon size={14} />
                    <span>{statusConfig.label}</span>
                  </div>
                </div>
              </div>

              {/* 底部信息 */}
              <div className={`
                mt-4 pt-4 border-t flex items-center justify-between text-sm
                ${isDark ? 'border-slate-700 text-slate-400' : 'border-gray-100 text-gray-500'}
              `}>
                <div className="flex items-center gap-4">
                  <span>支付方式: {formatPaymentMethod(order.payment_method)}</span>
                  {order.expires_at && (
                    <span>有效期至: {formatDate(order.expires_at)}</span>
                  )}
                </div>
                {order.status === 'pending' && (
                  <button className={`
                    px-4 py-2 rounded-lg font-medium text-sm
                    ${isDark
                      ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                    }
                    transition-colors
                  `}>
                    去支付
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 分页 */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className={`
              p-2 rounded-lg transition-colors
              ${pagination.page === 1
                ? isDark ? 'text-slate-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
                : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }
            `}
          >
            <ChevronLeft size={20} />
          </button>

          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`
                w-10 h-10 rounded-lg font-medium text-sm transition-colors
                ${page === pagination.page
                  ? isDark
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'bg-indigo-50 text-indigo-600'
                  : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className={`
              p-2 rounded-lg transition-colors
              ${pagination.page === pagination.totalPages
                ? isDark ? 'text-slate-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
                : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }
            `}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default OrdersList;
