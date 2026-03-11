/**
 * 创建店铺页面
 * 用户填写店铺信息后创建店铺，然后进入商家工作台
 */
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store,
  User,
  Phone,
  Mail,
  MapPin,
  Upload,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { uploadImage } from '@/services/storageServiceNew';
import { merchantStoreService, StoreFormData } from '@/services/merchantStoreService';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, title: '基本信息', icon: Store },
  { id: 2, title: '联系信息', icon: User },
  { id: 3, title: '资质信息', icon: CheckCircle },
];

const CATEGORIES = [
  '文创产品',
  '手工艺品',
  '艺术品',
  '设计服务',
  '数字产品',
  '图书音像',
  '服装配饰',
  '家居用品',
  '其他',
];

const CreateStorePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  
  const [formData, setFormData] = useState<StoreFormData>({
    store_name: '',
    store_logo: '',
    store_description: '',
    categories: [],
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    store_address: '',
    business_license: '',
    id_card_front: '',
    id_card_back: '',
  });

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories?.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...(prev.categories || []), category],
    }));
  };

  const handleFileUpload = async (field: string, file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }

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

  const renderUploadButton = (field: string, label: string, required?: boolean) => (
    <div className="space-y-2">
      <Label className="text-[var(--text-primary)]">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex items-center gap-4">
        {formData[field as keyof StoreFormData] ? (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-[var(--border-primary)]">
            <img
              src={formData[field as keyof StoreFormData] as string}
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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.store_name.trim()) {
          toast.error('请输入店铺名称');
          return false;
        }
        if (formData.categories?.length === 0) {
          toast.error('请至少选择一个经营类目');
          return false;
        }
        return true;
      case 2:
        if (!formData.contact_name.trim()) {
          toast.error('请输入联系人姓名');
          return false;
        }
        if (!formData.contact_phone.trim()) {
          toast.error('请输入联系人电话');
          return false;
        }
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(formData.contact_phone)) {
          toast.error('请输入正确的手机号码');
          return false;
        }
        return true;
      case 3:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      await merchantStoreService.createStore(formData);
      toast.success('店铺创建成功！');
      navigate('/merchant');
    } catch (error: any) {
      console.error('创建店铺失败:', error);
      toast.error(error.message || '创建店铺失败');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
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

            <div>
              {renderUploadButton('store_logo', '店铺 Logo')}
            </div>

            <div>
              <Label htmlFor="store_description" className="text-[var(--text-primary)] mb-2 block">
                店铺简介
              </Label>
              <Textarea
                id="store_description"
                name="store_description"
                value={formData.store_description}
                onChange={handleInputChange}
                placeholder="请简要介绍您的店铺，包括主营产品、品牌理念等"
                rows={4}
                className="bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-primary)] resize-none"
                maxLength={500}
              />
            </div>

            <div>
              <Label className="text-[var(--text-primary)] mb-3 block">
                经营类目 <span className="text-red-500">*</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(category => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryToggle(category)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      formData.categories?.includes(category)
                        ? 'bg-[#5ba3d4] text-white'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-primary)] hover:border-[#5ba3d4]'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
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
                联系人电话 <span className="text-red-500">*</span>
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

            <div>
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

            <div>
              <Label htmlFor="store_address" className="text-[var(--text-primary)] mb-2 block">
                店铺地址
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <Input
                  id="store_address"
                  name="store_address"
                  value={formData.store_address}
                  onChange={handleInputChange}
                  placeholder="请输入店铺地址"
                  className="pl-10 bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-primary)]"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderUploadButton('business_license', '营业执照')}
              {renderUploadButton('id_card_front', '身份证正面')}
              {renderUploadButton('id_card_back', '身份证反面')}
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              支持 JPG、PNG 格式，单张图片不超过 5MB
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            创建您的店铺
          </h1>
          <p className="text-[var(--text-muted)]">
            填写店铺信息，开启您的商家之旅
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 左侧步骤指示器 */}
          <div className="md:col-span-1">
            <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] p-6 sticky top-8">
              <div className="space-y-4">
                {STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = step.id === currentStep;
                  const isCompleted = step.id < currentStep;

                  return (
                    <div key={step.id} className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-[#5ba3d4] text-white'
                            : isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${
                          isActive ? 'text-[#5ba3d4]' : 'text-[var(--text-secondary)]'
                        }`}>
                          步骤 {step.id}
                        </p>
                        <p className={`text-sm ${
                          isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                        }`}>
                          {step.title}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 进度条 */}
              <div className="mt-6">
                <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#5ba3d4] transition-all duration-300"
                    style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                  />
                </div>
                <p className="text-center text-sm text-[var(--text-muted)] mt-2">
                  {Math.round((currentStep / STEPS.length) * 100)}% 完成
                </p>
              </div>
            </div>
          </div>

          {/* 右侧表单内容 */}
          <div className="md:col-span-3">
            <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
                    {STEPS[currentStep - 1].title}
                  </h2>
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>

              {/* 按钮区域 */}
              <div className="flex justify-between mt-8 pt-6 border-t border-[var(--border-primary)]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentStep === 1 || loading}
                  className="border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  上一步
                </Button>

                {currentStep === STEPS.length ? (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-[#5ba3d4] hover:bg-[#4a8ab8] text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        创建中...
                      </>
                    ) : (
                      <>
                        创建店铺
                        <CheckCircle className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-[#5ba3d4] hover:bg-[#4a8ab8] text-white"
                  >
                    下一步
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateStorePage;
