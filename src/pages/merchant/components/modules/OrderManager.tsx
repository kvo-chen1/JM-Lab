/**
 * 商家工作平台 - 交易管理模块
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Truck, 
  Eye,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { merchantService, Order } from '@/services/merchantService';
import { toast } from 'sonner';

const OrderManager: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [merchantId, setMerchantId] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const merchant = await merchantService.getCurrentMerchant();
        console.log('[OrderManager] 当前商户:', merchant);
        if (merchant) {
          setMerchantId(merchant.id);
          console.log('[OrderManager] 商户ID:', merchant.id, 'user_id:', (merchant as any).user_id);
          // 使用 user_id 查询订单，因为订单表的 seller_id 存储的是 user_id
          const userId = (merchant as any).user_id || merchant.id;
          const merchantOrders = await merchantService.getOrdersByUserId(userId);
          console.log('[OrderManager] 获取到的订单:', merchantOrders);
          setOrders(merchantOrders);
        }
      } catch (error) {
        console.error('获取订单数据失败:', error);
        toast.error('获取订单数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.items.some(item => item.product_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending_payment').length,
    paid: orders.filter(o => o.status === 'paid').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <Badge className="bg-amber-500 border-0">待付款</Badge>;
      case 'paid':
        return <Badge className="bg-blue-500 border-0">待发货</Badge>;
      case 'shipped':
        return <Badge className="bg-purple-500 border-0">已发货</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-500 border-0">已完成</Badge>;
      case 'cancelled':
        return <Badge className="bg-slate-500 border-0">已取消</Badge>;
      default:
        return <Badge className="border-0">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#5ba3d4]" />
        <span className="ml-2 text-[var(--text-muted)]">加载中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">交易管理</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">管理订单、处理发货、跟踪物流</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <p className="text-sm text-[var(--text-muted)]">订单总数</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <p className="text-sm text-[var(--text-muted)]">待付款</p>
          <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <p className="text-sm text-[var(--text-muted)]">待发货</p>
          <p className="text-2xl font-bold text-blue-400">{stats.paid}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <p className="text-sm text-[var(--text-muted)]">已发货</p>
          <p className="text-2xl font-bold text-purple-400">{stats.shipped}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <p className="text-sm text-[var(--text-muted)]">已完成</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.completed}</p>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <Input
                placeholder="搜索订单号、买家或商品..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-[var(--border-primary)] rounded-lg px-3 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm"
          >
            <option value="all">全部状态</option>
            <option value="pending_payment">待付款</option>
            <option value="paid">待发货</option>
            <option value="shipped">已发货</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>

      {/* 订单列表 */}
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--bg-tertiary)]">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-tertiary)]">订单号</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-tertiary)]">买家</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-tertiary)]">商品</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-tertiary)]">金额</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-tertiary)]">状态</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-tertiary)]">下单时间</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-tertiary)]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    暂无订单数据
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{order.order_no}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{order.customer_name}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {order.items && order.items.length > 0 
                        ? order.items.map(item => item.product_name).join(', ')
                        : '-'
                      }
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[#5ba3d4]">¥{order.total_amount}</td>
                    <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {order.status === 'paid' && (
                          <Button size="sm" className="bg-[#5ba3d4] hover:bg-[#4a8ab8] text-white">
                            <Truck className="w-4 h-4 mr-1" />
                            发货
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderManager;
