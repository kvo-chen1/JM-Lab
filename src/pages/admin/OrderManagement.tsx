/**
 * 订单管理组件 - 深色主题
 */
import React, { useState } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/Table';
import { Search, Loader2 } from 'lucide-react';

const OrderManagement: React.FC = () => {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { orders, count, loading } = useOrders({
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 50,
  });

  const filteredOrders = orders.filter((order) =>
    order.order_no.toLowerCase().includes(filter.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <Badge className="bg-amber-500 border-0">待支付</Badge>;
      case 'paid':
        return <Badge className="bg-blue-500 border-0">已支付</Badge>;
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
          <h2 className="text-xl font-semibold text-white">订单管理</h2>
          <p className="text-sm text-gray-500 mt-0.5">查看和管理所有订单</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a]">
          <p className="text-sm text-gray-500">订单总数</p>
          <p className="text-2xl font-bold text-white">{count}</p>
        </div>
        <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a]">
          <p className="text-sm text-gray-500">待支付</p>
          <p className="text-2xl font-bold text-amber-400">
            {orders.filter((o) => o.status === 'pending_payment').length}
          </p>
        </div>
        <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a]">
          <p className="text-sm text-gray-500">已支付</p>
          <p className="text-2xl font-bold text-blue-400">
            {orders.filter((o) => o.status === 'paid').length}
          </p>
        </div>
        <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a]">
          <p className="text-sm text-gray-500">已发货</p>
          <p className="text-2xl font-bold text-purple-400">
            {orders.filter((o) => o.status === 'shipped').length}
          </p>
        </div>
        <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a]">
          <p className="text-sm text-gray-500">已完成</p>
          <p className="text-2xl font-bold text-emerald-400">
            {orders.filter((o) => o.status === 'completed').length}
          </p>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a] flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="搜索订单号..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-[#2a2a2a] rounded-lg px-3 py-2 bg-[#1a1a1a] text-white"
        >
          <option value="all" className="bg-[#1a1a1a]">全部状态</option>
          <option value="pending_payment" className="bg-[#1a1a1a]">待支付</option>
          <option value="paid" className="bg-[#1a1a1a]">已支付</option>
          <option value="shipped" className="bg-[#1a1a1a]">已发货</option>
          <option value="completed" className="bg-[#1a1a1a]">已完成</option>
          <option value="cancelled" className="bg-[#1a1a1a]">已取消</option>
        </select>
      </div>

      {/* 订单列表 */}
      <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[#2a2a2a] hover:bg-transparent">
              <TableHead className="text-gray-400">订单号</TableHead>
              <TableHead className="text-gray-400">买家</TableHead>
              <TableHead className="text-gray-400">金额</TableHead>
              <TableHead className="text-gray-400">状态</TableHead>
              <TableHead className="text-gray-400">下单时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-white" />
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="border-[#2a2a2a]">
                  <TableCell className="font-medium text-white">{order.order_no}</TableCell>
                  <TableCell className="text-gray-300">{order.buyer?.username || '-'}</TableCell>
                  <TableCell className="text-white">¥{order.final_amount.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-gray-400">
                    {new Date(order.created_at).toLocaleDateString('zh-CN')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OrderManagement;
