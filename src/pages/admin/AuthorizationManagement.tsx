/**
 * 授权管理组件 - 深色主题
 */
import React, { useState } from 'react';
import { useAuthorizations, useUpdateAuthorizationStatus } from '@/hooks/useBrands';
import { Button } from '@/components/ui/Button';
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
import { CheckCircle, XCircle, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AuthorizationManagement: React.FC = () => {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { authorizations, count, loading, refetch } = useAuthorizations({
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 50,
  });

  const { updateStatus } = useUpdateAuthorizationStatus();

  // 处理授权申请
  const handleReview = async (authId: string, status: 'approved' | 'rejected') => {
    const result = await updateStatus(authId, status);
    if (result) {
      toast.success(status === 'approved' ? '已通过授权' : '已拒绝授权');
      refetch();
    } else {
      toast.error('操作失败');
    }
  };

  const filteredAuthorizations = authorizations.filter(
    (auth) =>
      auth.brand?.name.toLowerCase().includes(filter.toLowerCase()) ||
      auth.ip_asset?.name.toLowerCase().includes(filter.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500 border-0">待审核</Badge>;
      case 'approved':
        return <Badge className="bg-emerald-500 border-0">已批准</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 border-0">已拒绝</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500 border-0">已完成</Badge>;
      default:
        return <Badge className="border-0">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">授权管理</h2>
          <p className="text-sm text-gray-500 mt-0.5">管理品牌方IP授权申请</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a]">
          <p className="text-sm text-gray-500">申请总数</p>
          <p className="text-2xl font-bold text-white">{count}</p>
        </div>
        <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a]">
          <p className="text-sm text-gray-500">待审核</p>
          <p className="text-2xl font-bold text-amber-400">
            {authorizations.filter((a) => a.status === 'pending').length}
          </p>
        </div>
        <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a]">
          <p className="text-sm text-gray-500">已批准</p>
          <p className="text-2xl font-bold text-emerald-400">
            {authorizations.filter((a) => a.status === 'approved').length}
          </p>
        </div>
        <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a]">
          <p className="text-sm text-gray-500">已完成</p>
          <p className="text-2xl font-bold text-blue-400">
            {authorizations.filter((a) => a.status === 'completed').length}
          </p>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a] flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="搜索品牌方或IP资产..."
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
          <option value="pending" className="bg-[#1a1a1a]">待审核</option>
          <option value="approved" className="bg-[#1a1a1a]">已批准</option>
          <option value="rejected" className="bg-[#1a1a1a]">已拒绝</option>
          <option value="completed" className="bg-[#1a1a1a]">已完成</option>
        </select>
      </div>

      {/* 授权申请列表 */}
      <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[#2a2a2a] hover:bg-transparent">
              <TableHead className="text-gray-400">品牌方</TableHead>
              <TableHead className="text-gray-400">IP资产</TableHead>
              <TableHead className="text-gray-400">申请者</TableHead>
              <TableHead className="text-gray-400">期望价格</TableHead>
              <TableHead className="text-gray-400">状态</TableHead>
              <TableHead className="text-gray-400">申请时间</TableHead>
              <TableHead className="text-gray-400">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-white" />
                </TableCell>
              </TableRow>
            ) : filteredAuthorizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              filteredAuthorizations.map((auth) => (
                <TableRow key={auth.id} className="border-[#2a2a2a]">
                  <TableCell className="font-medium text-white">{auth.brand?.name || '-'}</TableCell>
                  <TableCell className="text-gray-300">{auth.ip_asset?.name || '-'}</TableCell>
                  <TableCell className="text-gray-300">{auth.applicant?.username || '-'}</TableCell>
                  <TableCell className="text-white">
                    {auth.proposed_price ? `¥${auth.proposed_price.toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(auth.status)}</TableCell>
                  <TableCell className="text-gray-400">
                    {new Date(auth.created_at).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    {auth.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReview(auth.id, 'approved')}
                          className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReview(auth.id, 'rejected')}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
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

export default AuthorizationManagement;
