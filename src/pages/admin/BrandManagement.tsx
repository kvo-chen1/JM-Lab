/**
 * 品牌方管理组件
 */
import React, { useState } from 'react';
import { useBrands, useUpdateAuthorizationStatus } from '@/hooks/useBrands';
import { brandService } from '@/services/brandService';
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { CheckCircle, XCircle, Search, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BrandManagement: React.FC = () => {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  const { brands, count, loading, refetch } = useBrands({
    status: statusFilter === 'all' ? undefined : (statusFilter as any),
    limit: 50,
  });

  // 审核品牌方
  const handleReview = async (brandId: string, status: 'approved' | 'rejected') => {
    setIsReviewing(true);
    try {
      const result = await brandService.adminReviewBrand(brandId, status);
      if (result.data) {
        toast.success(status === 'approved' ? '已通过审核' : '已拒绝申请');
        refetch();
        setIsDetailOpen(false);
      } else {
        toast.error('操作失败');
      }
    } catch (err) {
      toast.error('操作失败');
    } finally {
      setIsReviewing(false);
    }
  };

  // 过滤品牌方
  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(filter.toLowerCase()) ||
    brand.category?.toLowerCase().includes(filter.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">已通过</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">待审核</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">已拒绝</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">品牌方总数</p>
          <p className="text-2xl font-bold">{count}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">已通过</p>
          <p className="text-2xl font-bold text-green-600">
            {brands.filter((b) => b.status === 'approved').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">待审核</p>
          <p className="text-2xl font-bold text-yellow-600">
            {brands.filter((b) => b.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">已拒绝</p>
          <p className="text-2xl font-bold text-red-600">
            {brands.filter((b) => b.status === 'rejected').length}
          </p>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索品牌方..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="all">全部状态</option>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="rejected">已拒绝</option>
        </select>
      </div>

      {/* 品牌方列表 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>品牌方</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>联系人</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>申请时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredBrands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              filteredBrands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C02C38] to-[#991b1b] flex items-center justify-center">
                          <span className="text-white font-bold">{brand.name.charAt(0)}</span>
                        </div>
                      )}
                      <span className="font-medium">{brand.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{brand.category || '-'}</TableCell>
                  <TableCell>
                    <div>
                      <p>{brand.contact_person || '-'}</p>
                      <p className="text-sm text-gray-500">{brand.contact_phone || '-'}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(brand.status)}</TableCell>
                  <TableCell>
                    {new Date(brand.created_at).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedBrand(brand);
                        setIsDetailOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      查看
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 详情弹窗 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>品牌方详情</DialogTitle>
            <DialogDescription>
              查看品牌方入驻申请详情
            </DialogDescription>
          </DialogHeader>

          {selectedBrand && (
            <div className="space-y-6 py-4">
              {/* 基本信息 */}
              <div className="flex items-center gap-4">
                {selectedBrand.logo ? (
                  <img
                    src={selectedBrand.logo}
                    alt={selectedBrand.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C02C38] to-[#991b1b] flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {selectedBrand.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold">{selectedBrand.name}</h3>
                  <p className="text-gray-500">{selectedBrand.category}</p>
                  {getStatusBadge(selectedBrand.status)}
                </div>
              </div>

              {/* 详细信息 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">联系人:</span>
                  <p className="font-medium">{selectedBrand.contact_person || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">联系电话:</span>
                  <p className="font-medium">{selectedBrand.contact_phone || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">联系邮箱:</span>
                  <p className="font-medium">{selectedBrand.contact_email || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">所在地:</span>
                  <p className="font-medium">{selectedBrand.location || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">创立年份:</span>
                  <p className="font-medium">{selectedBrand.established_year || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">官网:</span>
                  <p className="font-medium">{selectedBrand.website || '-'}</p>
                </div>
              </div>

              {/* 品牌介绍 */}
              <div>
                <span className="text-gray-500">品牌介绍:</span>
                <p className="mt-1 text-gray-700">{selectedBrand.description || '暂无介绍'}</p>
              </div>

              {/* 审核操作 */}
              {selectedBrand.status === 'pending' && (
                <div className="border-t pt-4">
                  <span className="text-gray-500">审核备注:</span>
                  <Textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="请输入审核备注（可选）..."
                    className="mt-2"
                    rows={3}
                  />
                  <div className="flex gap-3 mt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleReview(selectedBrand.id, 'rejected')}
                      disabled={isReviewing}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      拒绝
                    </Button>
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleReview(selectedBrand.id, 'approved')}
                      disabled={isReviewing}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      通过
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrandManagement;
