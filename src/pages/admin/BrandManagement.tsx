/**
 * 品牌方管理组件
 */
import React, { useState } from 'react';
import { useBrands } from '@/hooks/useBrands';
import { brandService } from '@/services/brandService';
import { useTheme } from '@/hooks/useTheme';
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
  const { isDark } = useTheme();
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
        return <Badge className="bg-emerald-500 border-0">已通过</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500 border-0">待审核</Badge>;
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
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>品牌方管理</h2>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>管理入驻品牌方的申请和审核</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`rounded-xl p-4 border ${isDark ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>品牌方总数</p>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{count}</p>
        </div>
        <div className={`rounded-xl p-4 border ${isDark ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>已通过</p>
          <p className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {brands.filter((b) => b.status === 'approved').length}
          </p>
        </div>
        <div className={`rounded-xl p-4 border ${isDark ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>待审核</p>
          <p className={`text-2xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
            {brands.filter((b) => b.status === 'pending').length}
          </p>
        </div>
        <div className={`rounded-xl p-4 border ${isDark ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>已拒绝</p>
          <p className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            {brands.filter((b) => b.status === 'rejected').length}
          </p>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className={`rounded-xl p-4 border flex flex-wrap gap-4 ${isDark ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <Input
              placeholder="搜索品牌方..."
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
          <option value="pending" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>待审核</option>
          <option value="approved" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>已通过</option>
          <option value="rejected" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>已拒绝</option>
        </select>
      </div>

      {/* 品牌方列表 */}
      <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
        <Table>
          <TableHeader>
            <TableRow className={`${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'} hover:bg-transparent`}>
              <TableHead className={isDark ? 'text-gray-400' : 'text-gray-500'}>品牌方</TableHead>
              <TableHead className={isDark ? 'text-gray-400' : 'text-gray-500'}>分类</TableHead>
              <TableHead className={isDark ? 'text-gray-400' : 'text-gray-500'}>联系人</TableHead>
              <TableHead className={isDark ? 'text-gray-400' : 'text-gray-500'}>状态</TableHead>
              <TableHead className={isDark ? 'text-gray-400' : 'text-gray-500'}>申请时间</TableHead>
              <TableHead className={isDark ? 'text-gray-400' : 'text-gray-500'}>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className={`w-6 h-6 animate-spin mx-auto ${isDark ? 'text-white' : 'text-gray-900'}`} />
                </TableCell>
              </TableRow>
            ) : filteredBrands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              filteredBrands.map((brand) => (
                <TableRow key={brand.id} className={isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}>
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
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{brand.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className={isDark ? 'text-gray-300' : 'text-gray-600'}>{brand.category || '-'}</TableCell>
                  <TableCell>
                    <div>
                      <p className={isDark ? 'text-white' : 'text-gray-900'}>{brand.contact_person || '-'}</p>
                      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{brand.contact_phone || '-'}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(brand.status)}</TableCell>
                  <TableCell className={isDark ? 'text-gray-400' : 'text-gray-500'}>
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
                      className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}
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
        <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-[#141414] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>品牌方详情</DialogTitle>
            <DialogDescription className={isDark ? 'text-gray-400' : 'text-gray-500'}>
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
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedBrand.name}</h3>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>{selectedBrand.category}</p>
                  {getStatusBadge(selectedBrand.status)}
                </div>
              </div>

              {/* 详细信息 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>联系人:</span>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedBrand.contact_person || '-'}</p>
                </div>
                <div>
                  <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>联系电话:</span>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedBrand.contact_phone || '-'}</p>
                </div>
                <div>
                  <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>联系邮箱:</span>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedBrand.contact_email || '-'}</p>
                </div>
                <div>
                  <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>所在地:</span>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedBrand.location || '-'}</p>
                </div>
                <div>
                  <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>创立年份:</span>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedBrand.established_year || '-'}</p>
                </div>
                <div>
                  <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>官网:</span>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedBrand.website || '-'}</p>
                </div>
              </div>

              {/* 品牌介绍 */}
              <div>
                <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>品牌介绍:</span>
                <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{selectedBrand.description || '暂无介绍'}</p>
              </div>

              {/* 审核操作 */}
              {selectedBrand.status === 'pending' && (
                <div className={`border-t pt-4 ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                  <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>审核备注:</span>
                  <Textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="请输入审核备注（可选）..."
                    className={`mt-2 ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'}`}
                    rows={3}
                  />
                  <div className="flex gap-3 mt-4">
                    <Button
                      variant="outline"
                      className={`flex-1 ${isDark ? 'border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a]' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                      onClick={() => handleReview(selectedBrand.id, 'rejected')}
                      disabled={isReviewing}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      拒绝
                    </Button>
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
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
