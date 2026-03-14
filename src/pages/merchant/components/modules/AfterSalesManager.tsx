/**
 * 商家工作平台 - 售后管理模块
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  CheckCircle, 
  XCircle,
  Eye,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { merchantService, AfterSalesRequest } from '@/services/merchantService';
import { toast } from 'sonner';

const AfterSalesManager: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [afterSales, setAfterSales] = useState<AfterSalesRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [merchantId, setMerchantId] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const merchant = await merchantService.getCurrentMerchant();
        if (merchant) {
          setMerchantId(merchant.id);
          const requests = await merchantService.getAfterSalesRequests(merchant.id);
          setAfterSales(requests);
        }
      } catch (error) {
        console.error('获取售后数据失败:', error);
        toast.error('获取售后数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredAfterSales = afterSales.filter(item => {
    const matchesSearch = item.order_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: afterSales.length,
    pending: afterSales.filter(a => a.status === 'pending').length,
    processing: afterSales.filter(a => a.status === 'approved').length,
    completed: afterSales.filter(a => a.status === 'completed').length,
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
      case 'approved':
        return <Badge className="bg-blue-500 border-0">已同意</Badge>;
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
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">售后管理</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">处理退款、退货、换货等售后申请</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <p className="text-sm text-[var(--text-muted)]">售后总数</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <p className="text-sm text-[var(--text-muted)]">待处理</p>
          <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)]">
          <p className="text-sm text-[var(--text-muted)]">处理中</p>
          <p className="text-2xl font-bold text-blue-400">{stats.processing}</p>
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
            <option value="pending">待处理</option>
            <option value="approved">已同意</option>
            <option value="completed">已完成</option>
            <option value="rejected">已拒绝</option>
          </select>
        </div>
      </div>

      {/* 售后列表 */}
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--bg-tertiary)]">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-tertiary)]">售后单号</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-tertiary)]">买家</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-tertiary)]">类型</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-tertiary)]">原因</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-tertiary)]">金额</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-tertiary)]">状态</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-tertiary)]">申请时间</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-tertiary)]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {filteredAfterSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    暂无售后数据
                  </td>
                </tr>
              ) : (
                filteredAfterSales.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{item.order_no}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{item.customer_name}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{getTypeLabel(item.type)}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{item.reason}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#5ba3d4]">¥{item.amount}</td>
                    <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{formatDate(item.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AfterSalesManager;
