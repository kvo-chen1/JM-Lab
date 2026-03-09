/**
 * 商家工作平台 - 售后管理模块
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw, 
  Search, 
  CheckCircle, 
  XCircle,
  Eye,
  Clock,
  Package,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

// 模拟售后数据
const mockAfterSales = [
  { id: 1, orderNo: 'ORD20240308001', buyer: '张三', type: 'refund', reason: '商品质量问题', amount: 500, status: 'pending', createTime: '2024-03-08 10:30:00' },
  { id: 2, orderNo: 'ORD20240308002', buyer: '李四', type: 'return', reason: '尺寸不合适', amount: 600, status: 'processing', createTime: '2024-03-08 11:15:00' },
  { id: 3, orderNo: 'ORD20240308003', buyer: '王五', type: 'exchange', reason: '颜色发错', amount: 300, status: 'completed', createTime: '2024-03-08 09:20:00' },
  { id: 4, orderNo: 'ORD20240308004', buyer: '赵六', type: 'refund', reason: '未收到货', amount: 1200, status: 'rejected', createTime: '2024-03-07 16:45:00' },
];

const AfterSalesManager: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredAfterSales = mockAfterSales.filter(item => {
    const matchesSearch = item.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.buyer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: mockAfterSales.length,
    pending: mockAfterSales.filter(a => a.status === 'pending').length,
    processing: mockAfterSales.filter(a => a.status === 'processing').length,
    completed: mockAfterSales.filter(a => a.status === 'completed').length,
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'refund': return '退款';
      case 'return': return '退货退款';
      case 'exchange': return '换货';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500 border-0">待处理</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500 border-0">处理中</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-500 border-0">已完成</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 border-0">已拒绝</Badge>;
      default:
        return <Badge className="border-0">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">售后管理</h2>
          <p className="text-sm text-gray-500 mt-0.5">处理退款、退货、换货等售后申请</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a]">
          <p className="text-sm text-gray-500">售后总数</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a]">
          <p className="text-sm text-gray-500">待处理</p>
          <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
        </div>
        <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a]">
          <p className="text-sm text-gray-500">处理中</p>
          <p className="text-2xl font-bold text-blue-400">{stats.processing}</p>
        </div>
        <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a]">
          <p className="text-sm text-gray-500">已完成</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.completed}</p>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="搜索订单号或买家..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-[#2a2a2a] rounded-lg px-3 py-2 bg-[#1a1a1a] text-white text-sm"
          >
            <option value="all">全部状态</option>
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="completed">已完成</option>
            <option value="rejected">已拒绝</option>
          </select>
        </div>
      </div>

      {/* 售后列表 */}
      <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a]">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">售后单号</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">买家</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">类型</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">原因</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">金额</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">状态</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">申请时间</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {filteredAfterSales.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-[#1a1a1a] transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-white">{item.orderNo}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{item.buyer}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{getTypeLabel(item.type)}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{item.reason}</td>
                  <td className="px-4 py-3 text-sm font-medium text-[#5ba3d4]">¥{item.amount}</td>
                  <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.createTime}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {item.status === 'pending' && (
                        <>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            同意
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10">
                            <XCircle className="w-4 h-4 mr-1" />
                            拒绝
                          </Button>
                        </>
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

export default AfterSalesManager;
