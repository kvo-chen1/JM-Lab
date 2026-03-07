/**
 * 品牌连接模块 - IP孵化中心的品牌方展示和授权申请
 */
import React, { useState } from 'react';
import { Brand, BrandAuthorization } from '@/services/brandService';
import { useBrands, useCreateAuthorization } from '@/hooks/useBrands';
import BrandList from '@/components/brand/BrandList';
import AuthorizationStatus from '@/components/brand/AuthorizationStatus';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { toast } from 'sonner';

interface BrandConnectionProps {
  ipAssetId: string;
  ipAssetName: string;
  userId: string;
  existingAuthorizations?: BrandAuthorization[];
}

const BrandConnection: React.FC<BrandConnectionProps> = ({
  ipAssetId,
  ipAssetName,
  userId,
  existingAuthorizations = [],
}) => {
  const { brands, loading: brandsLoading } = useBrands({ status: 'approved' });
  const { createAuthorization, loading: submitting } = useCreateAuthorization();

  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);

  // 申请表单数据
  const [applicationReason, setApplicationReason] = useState('');
  const [proposedUsage, setProposedUsage] = useState('');
  const [proposedDuration, setProposedDuration] = useState('12');
  const [proposedPrice, setProposedPrice] = useState('');

  // 检查是否已申请过该品牌
  const hasAppliedToBrand = (brandId: string) => {
    return existingAuthorizations.some(
      (auth) => auth.brand_id === brandId && ['pending', 'approved'].includes(auth.status)
    );
  };

  // 处理品牌点击
  const handleBrandClick = (brand: Brand) => {
    if (hasAppliedToBrand(brand.id)) {
      toast.info(`您已向 ${brand.name} 提交过授权申请`);
      return;
    }
    setSelectedBrand(brand);
    setIsApplyDialogOpen(true);
  };

  // 提交授权申请
  const handleSubmitApplication = async () => {
    if (!selectedBrand) return;

    if (!applicationReason.trim()) {
      toast.error('请填写申请理由');
      return;
    }

    if (!proposedUsage.trim()) {
      toast.error('请填写使用场景');
      return;
    }

    const result = await createAuthorization({
      ip_asset_id: ipAssetId,
      brand_id: selectedBrand.id,
      applicant_id: userId,
      application_reason: applicationReason,
      proposed_usage: proposedUsage,
      proposed_duration: parseInt(proposedDuration),
      proposed_price: proposedPrice ? parseFloat(proposedPrice) : undefined,
    });

    if (result) {
      toast.success('授权申请提交成功！');
      setIsApplyDialogOpen(false);
      // 重置表单
      setApplicationReason('');
      setProposedUsage('');
      setProposedDuration('12');
      setProposedPrice('');
      setSelectedBrand(null);
    } else {
      toast.error('授权申请提交失败，请重试');
    }
  };

  return (
    <div className="space-y-6">
      {/* 品牌方列表 */}
      <BrandList
        brands={brands}
        onBrandClick={handleBrandClick}
        title="🏢 已入驻品牌方"
        showScrollButtons={true}
      />

      {/* 现有授权申请 */}
      {existingAuthorizations.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 我的授权申请</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {existingAuthorizations.map((auth) => (
              <AuthorizationStatus key={auth.id} authorization={auth} />
            ))}
          </div>
        </div>
      )}

      {/* 授权申请弹窗 */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>🤝</span>
              申请品牌授权
            </DialogTitle>
            <DialogDescription>
              向 {selectedBrand?.name} 申请授权使用您的IP资产
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* IP资产信息 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <Label className="text-gray-500">IP资产</Label>
              <p className="font-medium text-gray-800 mt-1">{ipAssetName}</p>
            </div>

            {/* 品牌方信息 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <Label className="text-gray-500">品牌方</Label>
              <div className="flex items-center gap-3 mt-1">
                {selectedBrand?.logo ? (
                  <img
                    src={selectedBrand.logo}
                    alt={selectedBrand.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C02C38] to-[#991b1b] flex items-center justify-center">
                    <span className="text-white font-bold">{selectedBrand?.name.charAt(0)}</span>
                  </div>
                )}
                <span className="font-medium text-gray-800">{selectedBrand?.name}</span>
              </div>
            </div>

            {/* 申请理由 */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                申请理由 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="请说明您为什么希望获得该品牌的授权..."
                value={applicationReason}
                onChange={(e) => setApplicationReason(e.target.value)}
                rows={3}
              />
            </div>

            {/* 使用场景 */}
            <div className="space-y-2">
              <Label htmlFor="usage">
                使用场景 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="usage"
                placeholder="请描述您计划如何使用该品牌授权..."
                value={proposedUsage}
                onChange={(e) => setProposedUsage(e.target.value)}
                rows={3}
              />
            </div>

            {/* 授权期限 */}
            <div className="space-y-2">
              <Label htmlFor="duration">授权期限</Label>
              <Select value={proposedDuration} onValueChange={setProposedDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="选择授权期限" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3个月</SelectItem>
                  <SelectItem value="6">6个月</SelectItem>
                  <SelectItem value="12">1年</SelectItem>
                  <SelectItem value="24">2年</SelectItem>
                  <SelectItem value="36">3年</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 期望价格 */}
            <div className="space-y-2">
              <Label htmlFor="price">期望授权价格（可选）</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                <Input
                  id="price"
                  type="number"
                  placeholder="请输入期望价格"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsApplyDialogOpen(false)} className="flex-1">
              取消
            </Button>
            <Button
              onClick={handleSubmitApplication}
              disabled={submitting}
              className="flex-1 bg-[#C02C38] hover:bg-[#991b1b]"
            >
              {submitting ? '提交中...' : '提交申请'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrandConnection;
