/**
 * 订单管理组件
 */
import React, { useState } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { useTheme } from '@/hooks/useTheme';
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
  const { isDark } = useTheme();
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
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>订单管理</h2>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>查看和管理所有订单</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className={`rounded-xl p-4 border ${isDark ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>订单总数</p>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{count}</p>
        </div>
        <div className={`rounded-xl p-4 border ${isDark ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>待支付</p>
          <p className={`text-2xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
            {orders.filter((o) => o.status === 'pending_payment').length}
          </p>
        </div>
        <div className={`rounded-xl p-4 border ${isDark ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>已支付</p>
          <p className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            {orders.filter((o) => o.status === 'paid').length}
          </p>
        </div>
        <div className={`rounded-xl p-4 border ${isDark ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>已发货</p>
          <p className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
            {orders.filter((o) => o.status === 'shipped').length}
          </p>
        </div>
        <div className={`rounded-xl p-4 border ${isDark ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>已完成</p>
          <p className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {orders.filter((o) => o.status === 'completed').length}
          </p>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className={`rounded-xl p-4 border flex flex-wrap gap-4 ${isDark ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <Input
              placeholder="搜索订单号..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`pl-10 ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'}`}
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`border rounded-lg px-3 py-2 ${isDark ? 'border-[#2a2a2a] bg-[#1a1a1a] text-white' : 'border-gray-200 bg-white text-gray-900'}`}
        >
          <option value="all" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>全部状态</option>
          <option value="pending_payment" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>待支付</option>
          <option value="paid" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>已支付</option>
          <option value="shipped" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>已发货</option>
          <option value="completed" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>已完成</option>
          <option value="cancelled" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>已取消</option>
        </select>
      </div>

      {/* 订单列表 */}
      <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
        <Table>
          <TableHeader>
            <TableRow className={`${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'} hover:bg-transparent`}>
              <TableHead className={isDark ? 'text-gray-400' : 'text-gray-500'}>订单号</TableHead>
              <TableHead className={isDark ? 'text-gray-400' : 'text-gray-500'}>买家</TableHead>
              <TableHead className={isDark ? 'text-gray-400' : 'text-gray-500'}>金额</TableHead>
              <TableHead className={isDark ? 'text-gray-400' : 'text-gray-500'}>状态</TableHead>
              <TableHead className={isDark ? 'text-gray-400' : 'text-gray-500'}>下单时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className={`w-6 h-6 animate-spin mx-auto ${isDark ? 'text-white' : 'text-gray-900'}`} />
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className={isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}>
                  <TableCell className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{order.order_no}</TableCell>
                  <TableCell className={isDark ? 'text-gray-300' : 'text-gray-600'}>{order.buyer?.username || '-'}</TableCell>
                  <TableCell className={isDark ? 'text-white' : 'text-gray-900'}>¥{order.final_amount.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className={isDark ? 'text-gray-400' : 'text-gray-500'}>
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
