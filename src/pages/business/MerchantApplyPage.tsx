/**
 * 商家入驻申请页面
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  Upload, 
  User, 
  Phone, 
  Mail, 
  FileText,
  CreditCard,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { uploadImage } from '@/services/storageServiceNew';
import { 
  merchantApplicationService, 
  ApplicationFormData,
  MerchantApplication 
} from '@/services/merchantApplicationService';
import { toast } from 'sonner';

const MerchantApplyPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [existingApplication, setExistingApplication] = useState<MerchantApplication | null>(null);
  
  const [formData, setFormData] = useState<ApplicationFormData>({
    store_name: '',
    store_description: '',
    store_logo: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    business_license: '',
    id_card_front: '',
    id_card_back: '',
  });

  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // 检查用户申请状态
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setCheckingStatus(true);
        const application = await merchantApplicationService.getMyApplication();
        setExistingApplication(application);
        
        if (application && application.status === 'pending') {
          // 如果正在审核中，填充表单数据
          setFormData({
            store_name: application.store_name,
            store_description: application.store_description || '',
            store_logo: application.store_logo || '',
            contact_name: application.contact_name,
            contact_phone: application.contact_phone,
            contact_email: application.contact_email || '',
            business_license: application.business_license || '',
            id_card_front: application.id_card_front || '',
            id_card_back: application.id_card_back || '',
          });
        }
      } catch (error) {
        console.error('检查申请状态失败:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkStatus();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (field: string, file: File) => {
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }

    // 验证文件大小 (最大 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('文件大小不能超过 5MB');
      return;
    }

    setUploading(prev => ({ ...prev, [field]: true }));

    try {
      const imageUrl = await uploadImage(file, 'merchant-documents');
      setFormData(prev => ({ ...prev, [field]: imageUrl }));
      toast.success('上传成功');
    } catch (error: any) {
      console.error('上传失败:', error);
      toast.error('上传失败: ' + error.message);
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.store_name.trim()) {
      toast.error('请输入店铺名称');
      return false;
    }
    if (!formData.contact_name.trim()) {
      toast.error('请输入联系人姓名');
      return false;
    }
    if (!formData.contact_phone.trim()) {
      toast.error('请输入联系电话');
      return false;
    }
    // 简单的手机号验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(formData.contact_phone)) {
      toast.error('请输入正确的手机号码');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      await merchantApplicationService.submitApplication(formData);
      toast.success('申请提交成功！请等待审核');
      
      // 刷新申请状态
      const application = await merchantApplicationService.getMyApplication();
      setExistingApplication(application);
    } catch (error: any) {
      console.error('提交申请失败:', error);
      toast.error(error.message || '提交申请失败');
    } finally {
      setLoading(false);
    }
  };

  const renderUploadButton = (field: string, label: string, required?: boolean) => (
    <div className="space-y-2">
      <Label className="text-[var(--text-primary)]">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex items-center gap-4">
        {formData[field as keyof ApplicationFormData] ? (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-[var(--border-primary)]">
            <img 
              src={formData[field as keyof ApplicationFormData] as string} 
              alt={label}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, [field]: '' }))}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRefs.current[field]?.click()}
            disabled={uploading[field]}
            className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-primary)] rounded-lg hover:border-[#5ba3d4] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-50"
          >
            {uploading[field] ? (
              <Loader2 className="w-6 h-6 text-[var(--text-muted)] animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6 text-[var(--text-muted)] mb-1" />
                <span className="text-xs text-[var(--text-muted)]">点击上传</span>
              </>
            )}
          </button>
        )}
        <input
          ref={el => fileInputRefs.current[field] = el}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(field, e.target.files[0])}
          className="hidden"
        />
      </div>
    </div>
  );

  // 审核中状态页面
  if (existingApplication?.status === 'pending') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <button
            onClick={() => navigate('/business')}
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>

          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] p-8 text-center">
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
              申请审核中
            </h1>
            <p className="text-[var(--text-muted)] mb-6">
              您的商家入驻申请已提交，我们正在审核中。<br />
              审核通常需要 1-3 个工作日，请耐心等待。
            </p>
            <div className="bg-[var(--bg-tertiary)] rounded-lg p-4 text-left mb-6">
              <p className="text-sm text-[var(--text-muted)] mb-2">申请信息：</p>
              <p className="text-[var(--text-primary)] font-medium">{existingApplication.store_name}</p>
              <p className="text-sm text-[var(--text-muted)]">
                申请时间：{new Date(existingApplication.created_at).toLocaleString('zh-CN')}
              </p>
            </div>
            <Button
              onClick={() => navigate('/business')}
              className="bg-[#5ba3d4] hover:bg-[#4a8ab8] text-white"
            >
              返回品牌合作
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 已通过状态页面
  if (existingApplication?.status === 'approved') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <button
            onClick={() => navigate('/business')}
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>

          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] p-8 text-center">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
              审核通过
            </h1>
            <p className="text-[var(--text-muted)] mb-6">
              恭喜！您的商家入驻申请已通过审核。<br />
              现在您可以进入商家工作台开始上架商品了。
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate('/merchant')}
                className="bg-[#5ba3d4] hover:bg-[#4a8ab8] text-white"
              >
                进入商家工作台
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/business')}
                className="border-[var(--border-primary)]"
              >
                返回品牌合作
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 被拒绝状态页面
  if (existingApplication?.status === 'rejected') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <button
            onClick={() => navigate('/business')}
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>

          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] p-8 text-center mb-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
              申请被拒绝
            </h1>
            <p className="text-[var(--text-muted)] mb-4">
              很抱歉，您的商家入驻申请未通过审核。
            </p>
            {existingApplication.rejection_reason && (
              <div className="bg-red-500/10 rounded-lg p-4 text-left mb-6">
                <p className="text-sm text-red-400 mb-1">拒绝原因：</p>
                <p className="text-[var(--text-primary)]">{existingApplication.rejection_reason}</p>
              </div>
            )}
            <p className="text-[var(--text-muted)] mb-6">
              您可以修改信息后重新提交申请。
            </p>
            <Button
              onClick={() => setExistingApplication(null)}
              className="bg-[#5ba3d4] hover:bg-[#4a8ab8] text-white"
            >
              重新申请
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#5ba3d4]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/business')}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          返回品牌合作
        </button>

        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            商家入驻申请
          </h1>
          <p className="text-[var(--text-muted)]">
            填写以下信息，申请成为津脉文创商城商家
          </p>
        </div>

        {/* 申请表单 */}
        <form onSubmit={handleSubmit} className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] p-8">
          {/* 店铺信息 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-[#5ba3d4]" />
              店铺信息
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="store_name" className="text-[var(--text-primary)] mb-2 block">
                  店铺名称 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="store_name"
                  name="store_name"
                  value={formData.store_name}
                  onChange={handleInputChange}
                  placeholder="请输入店铺名称"
                  className="bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-primary)]"
                  maxLength={100}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="store_description" className="text-[var(--text-primary)] mb-2 block">
                  店铺简介
                </Label>
                <Textarea
                  id="store_description"
                  name="store_description"
                  value={formData.store_description}
                  onChange={handleInputChange}
                  placeholder="请简要介绍您的店铺，包括主营产品、品牌理念等"
                  rows={3}
                  className="bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-primary)] resize-none"
                  maxLength={500}
                />
              </div>
              <div className="md:col-span-2">
                {renderUploadButton('store_logo', '店铺 Logo')}
              </div>
            </div>
          </div>

          {/* 联系人信息 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#5ba3d4]" />
              联系人信息
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="contact_name" className="text-[var(--text-primary)] mb-2 block">
                  联系人姓名 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <Input
                    id="contact_name"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleInputChange}
                    placeholder="请输入联系人姓名"
                    className="pl-10 bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-primary)]"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="contact_phone" className="text-[var(--text-primary)] mb-2 block">
                  联系电话 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <Input
                    id="contact_phone"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                    placeholder="请输入手机号码"
                    className="pl-10 bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-primary)]"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="contact_email" className="text-[var(--text-primary)] mb-2 block">
                  联系邮箱
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <Input
                    id="contact_email"
                    name="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                    placeholder="请输入联系邮箱"
                    className="pl-10 bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-primary)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 资质文件 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#5ba3d4]" />
              资质文件
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderUploadButton('business_license', '营业执照')}
              {renderUploadButton('id_card_front', '身份证正面')}
              {renderUploadButton('id_card_back', '身份证反面')}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-4">
              支持 JPG、PNG 格式，单张图片不超过 5MB
            </p>
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end gap-4 pt-6 border-t border-[var(--border-primary)]">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/business')}
              className="border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#5ba3d4] hover:bg-[#4a8ab8] text-white min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  提交中...
                </>
              ) : (
                '提交申请'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MerchantApplyPage;
