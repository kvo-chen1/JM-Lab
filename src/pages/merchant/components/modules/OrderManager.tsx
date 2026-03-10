/**
 * 商家工作平台 - 交易管理模块
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  Search, 
  Truck, 
  Eye,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

// 模拟订单数据
const mockOrders = [
  { id: 1, orderNo: 'ORD20240308001', buyer: '张三', product: '津小脉文创 T 恤', amount: 500, status: 'pending_payment', createTime: '2024-03-08 10:30:00' },
  { id: 2, orderNo: 'ORD20240308002', buyer: '李四', product: '智能保温杯', amount: 600, status: 'paid', createTime: '2024-03-08 11:15:00' },
  { id: 3, orderNo: 'ORD20240308003', buyer: '王五', product: '津脉智坊定制笔记本', amount: 300, status: 'shipped', createTime: '2024-03-08 09:20:00' },
  { id: 4, orderNo: 'ORD20240308004', buyer: '赵六', product: '无线充电宝', amount: 1200, status: 'completed', createTime: '2024-03-07 16:45:00' },
  { id: 5, orderNo: 'ORD20240308005', buyer: '钱七', product: '津小脉毛绒公仔', amount: 800, status: 'cancelled', createTime: '2024-03-07 14:30:00' },
];

const OrderManager: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.buyer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: mockOrders.length,
    pending: mockOrders.filter(o => o.status === 'pending_payment').length,
    paid: mockOrders.filter(o => o.status === 'paid').length,
    shipped: mockOrders.filter(o => o.status === 'shipped').length,
    completed: mockOrders.filter(o => o.status === 'completed').length,
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
                placeholder="搜索订单号或买家..."
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
              {filteredOrders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{order.orderNo}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{order.buyer}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{order.product}</td>
                  <td className="px-4 py-3 text-sm font-medium text-[#5ba3d4]">¥{order.amount}</td>
                  <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{order.createTime}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderManager;
