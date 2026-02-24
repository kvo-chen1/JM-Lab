import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { uploadBrandLogo, uploadBusinessLicense } from '@/services/storageService';
import { 
  Send, 
  Building2, 
  User, 
  Phone, 
  Mail,
  FileText, 
  Upload,
  Image as ImageIcon,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  MapPin,
  Globe,
  CreditCard,
  FileCheck,
  Eye,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface BrandApplicationFormProps {
  isDark: boolean;
  onSubmit: (data: BrandApplicationData) => void;
}

export interface BrandApplicationData {
  // 步骤1：品牌基本信息
  brandName: string;
  brandShortName: string;
  brandLogo: string;
  description: string;
  brandWebsite: string;
  industry: string;
  subIndustry: string;
  establishedDate: string;
  
  // 步骤2：资质认证信息
  businessLicense: string;
  creditCode: string;
  companyName: string;
  legalPersonName: string;
  legalPersonIdCard: string;
  businessLicenseFile: string;
  authorizationLetter: string;
  
  // 步骤3：联系人信息
  contactName: string;
  contactPhone: string;
  verifyCode: string;
  contactEmail: string;
  contactAddress: string;
  
  // 协议同意
  agreedToTerms: boolean;
}

const steps = [
  { id: 1, title: '品牌信息', icon: Building2 },
  { id: 2, title: '资质认证', icon: FileCheck },
  { id: 3, title: '联系方式', icon: User },
  { id: 4, title: '确认提交', icon: CheckCircle2 },
];

const industries = [
  { value: 'technology', label: '科技互联网', subIndustries: ['软件开发', '人工智能', '电子商务', '游戏娱乐'] },
  { value: 'fashion', label: '服装时尚', subIndustries: ['男装', '女装', '童装', '配饰', '鞋靴'] },
  { value: 'beauty', label: '美妆护肤', subIndustries: ['护肤', '彩妆', '个护', '香水'] },
  { value: 'food', label: '食品饮料', subIndustries: ['休闲食品', '饮料', '酒类', '生鲜'] },
  { value: 'home', label: '家居生活', subIndustries: ['家具', '家纺', '厨具', '装饰'] },
  { value: 'culture', label: '文化创意', subIndustries: ['出版传媒', '动漫游戏', '艺术设计', '非遗传承'] },
  { value: 'other', label: '其他行业', subIndustries: ['其他'] },
];

const BrandApplicationForm: React.FC<BrandApplicationFormProps> = ({ isDark, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 表单数据
  const [formData, setFormData] = useState<BrandApplicationData>({
    brandName: '',
    brandShortName: '',
    brandLogo: '',
    description: '',
    brandWebsite: '',
    industry: '',
    subIndustry: '',
    establishedDate: '',
    businessLicense: '',
    creditCode: '',
    companyName: '',
    legalPersonName: '',
    legalPersonIdCard: '',
    businessLicenseFile: '',
    authorizationLetter: '',
    contactName: '',
    contactPhone: '',
    verifyCode: '',
    contactEmail: '',
    contactAddress: '',
    agreedToTerms: false,
  });

  // 上传状态
  const [uploadStates, setUploadStates] = useState({
    brandLogo: { isUploading: false, progress: 0 },
    businessLicense: { isUploading: false, progress: 0 },
    authorizationLetter: { isUploading: false, progress: 0 },
  });

  // 验证状态
  const [errors, setErrors] = useState<Partial<Record<keyof BrandApplicationData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof BrandApplicationData, boolean>>>({});

  // 验证码发送状态
  const [verifyCodeSent, setVerifyCodeSent] = useState(false);
  const [verifyCodeCountdown, setVerifyCodeCountdown] = useState(0);

  const fileInputRefs = {
    brandLogo: useRef<HTMLInputElement>(null),
    businessLicense: useRef<HTMLInputElement>(null),
    authorizationLetter: useRef<HTMLInputElement>(null),
  };

  // 更新表单字段
  const updateField = (field: keyof BrandApplicationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 标记字段为已触碰
  const markTouched = (field: keyof BrandApplicationData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // 验证字段
  const validateField = (field: keyof BrandApplicationData, value: any): string | undefined => {
    switch (field) {
      case 'brandName':
        if (!value?.trim()) return '请输入品牌名称';
        if (value.length < 2 || value.length > 30) return '品牌名称长度应为2-30个字符';
        break;
      case 'description':
        if (!value?.trim()) return '请输入品牌介绍';
        if (value.length < 10) return '品牌介绍至少10个字符';
        if (value.length > 500) return '品牌介绍最多500个字符';
        break;
      case 'industry':
        if (!value) return '请选择所属行业';
        break;
      case 'subIndustry':
        if (!value) return '请选择细分行业';
        break;
      case 'creditCode':
        if (!value?.trim()) return '请输入统一社会信用代码';
        if (!/^[A-Z0-9]{18}$/.test(value)) return '统一社会信用代码应为18位字母数字组合';
        break;
      case 'companyName':
        if (!value?.trim()) return '请输入企业全称';
        break;
      case 'legalPersonName':
        if (!value?.trim()) return '请输入法人姓名';
        break;
      case 'legalPersonIdCard':
        if (!value?.trim()) return '请输入法人身份证号';
        if (!/^\d{17}[\dX]$/.test(value)) return '请输入正确的18位身份证号';
        break;
      case 'businessLicenseFile':
        if (!value) return '请上传营业执照';
        break;
      case 'contactName':
        if (!value?.trim()) return '请输入联系人姓名';
        break;
      case 'contactPhone':
        if (!value?.trim()) return '请输入联系人手机号';
        if (!/^1[3-9]\d{9}$/.test(value)) return '请输入正确的11位手机号';
        break;
      case 'verifyCode':
        if (!value?.trim()) return '请输入验证码';
        if (!/^\d{6}$/.test(value)) return '验证码应为6位数字';
        break;
      case 'contactEmail':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '请输入正确的邮箱格式';
        break;
      case 'agreedToTerms':
        if (!value) return '请阅读并同意服务协议';
        break;
    }
    return undefined;
  };

  // 验证当前步骤
  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof BrandApplicationData, string>> = {};
    let isValid = true;

    const fieldsToValidate: Record<number, (keyof BrandApplicationData)[]> = {
      1: ['brandName', 'description', 'industry', 'subIndustry'],
      2: ['businessLicenseFile', 'creditCode', 'companyName', 'legalPersonName', 'legalPersonIdCard'],
      3: ['contactName', 'contactPhone', 'verifyCode'],
      4: ['agreedToTerms'],
    };

    const fields = fieldsToValidate[step] || [];
    fields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // 处理文件上传
  const handleFileUpload = async (
    field: 'brandLogo' | 'businessLicenseFile' | 'authorizationLetter',
    file: File
  ) => {
    setUploadStates(prev => ({
      ...prev,
      [field === 'businessLicenseFile' ? 'businessLicense' : field]: { isUploading: true, progress: 0 }
    }));

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadStates(prev => ({
          ...prev,
          [field === 'businessLicenseFile' ? 'businessLicense' : field]: {
            ...prev[field === 'businessLicenseFile' ? 'businessLicense' : field],
            progress: Math.min(prev[field === 'businessLicenseFile' ? 'businessLicense' : field].progress + 10, 90)
          }
        }));
      }, 200);

      let result;
      if (field === 'brandLogo') {
        result = await uploadBrandLogo(file, formData.brandName || 'temp');
      } else {
        result = await uploadBusinessLicense(file, formData.companyName || 'temp');
      }

      clearInterval(progressInterval);
      setUploadStates(prev => ({
        ...prev,
        [field === 'businessLicenseFile' ? 'businessLicense' : field]: { isUploading: false, progress: 100 }
      }));

      if (result.error) {
        toast.error(result.error);
      } else if (result.url) {
        updateField(field, result.url);
        toast.success('上传成功！');
      }
    } catch (error) {
      console.error('上传失败:', error);
      toast.error('上传失败，请重试');
    } finally {
      setUploadStates(prev => ({
        ...prev,
        [field === 'businessLicenseFile' ? 'businessLicense' : field]: { isUploading: false, progress: 0 }
      }));
    }
  };

  // 处理文件选择
  const handleFileSelect = (
    field: 'brandLogo' | 'businessLicenseFile' | 'authorizationLetter',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型和大小
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      toast.error('仅支持 JPG、PNG、WebP 或 PDF 格式');
      return;
    }

    if (file.size > maxSize) {
      toast.error('文件大小不能超过 5MB');
      return;
    }

    handleFileUpload(field, file);
  };

  // 删除已上传文件
  const handleRemoveFile = (field: 'brandLogo' | 'businessLicenseFile' | 'authorizationLetter') => {
    updateField(field, '');
    const refKey = field === 'businessLicenseFile' ? 'businessLicense' : field;
    if (fileInputRefs[refKey as keyof typeof fileInputRefs].current) {
      fileInputRefs[refKey as keyof typeof fileInputRefs].current!.value = '';
    }
  };

  // 发送验证码
  const handleSendVerifyCode = () => {
    const phoneError = validateField('contactPhone', formData.contactPhone);
    if (phoneError) {
      setErrors(prev => ({ ...prev, contactPhone: phoneError }));
      toast.error(phoneError);
      return;
    }

    // 模拟发送验证码
    setVerifyCodeSent(true);
    setVerifyCodeCountdown(60);
    toast.success('验证码已发送');

    const timer = setInterval(() => {
      setVerifyCodeCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 下一步
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      toast.error('请完善必填信息');
    }
  };

  // 上一步
  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast.error('请完善必填信息');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      toast.success('申请提交成功！');
    } catch (error) {
      console.error('提交失败:', error);
      toast.error('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 渲染步骤指示器
  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                  ${currentStep === step.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                    : currentStep > step.id
                    ? 'bg-green-500 text-white'
                    : isDark
                    ? 'bg-slate-700 text-gray-400'
                    : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                {currentStep > step.id ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={`
                  mt-2 text-xs font-medium transition-colors duration-300
                  ${currentStep === step.id
                    ? isDark ? 'text-blue-400' : 'text-blue-600'
                    : currentStep > step.id
                    ? isDark ? 'text-green-400' : 'text-green-600'
                    : isDark ? 'text-gray-500' : 'text-gray-400'
                  }
                `}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`
                  w-16 h-0.5 mx-2 transition-colors duration-300
                  ${currentStep > step.id + 1
                    ? 'bg-green-500'
                    : currentStep > step.id
                    ? 'bg-gradient-to-r from-green-500 to-blue-500'
                    : isDark
                    ? 'bg-slate-700'
                    : 'bg-gray-200'
                  }
                `}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  // 渲染表单字段标签
  const renderLabel = (
    icon: React.ElementType,
    label: string,
    required?: boolean,
    tooltip?: string
  ) => (
    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
      <div className="flex items-center gap-2">
        {React.createElement(icon, { className: 'w-4 h-4' })}
        {label}
        {required && <span className="text-red-500">*</span>}
        {tooltip && (
          <div className="group relative">
            <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
            <div className={`
              absolute left-full ml-2 top-1/2 -translate-y-1/2 w-64 p-2 rounded-lg text-xs
              opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all
              z-50 ${isDark ? 'bg-slate-700 text-gray-300' : 'bg-gray-800 text-white'}
            `}>
              {tooltip}
            </div>
          </div>
        )}
      </div>
    </label>
  );

  // 渲染输入框
  const renderInput = (
    field: keyof BrandApplicationData,
    type: string = 'text',
    placeholder: string = '',
    props: any = {}
  ) => (
    <div>
      <input
        type={type}
        value={formData[field] as string}
        onChange={(e) => updateField(field, e.target.value)}
        onBlur={() => markTouched(field)}
        placeholder={placeholder}
        className={`
          w-full px-4 py-3 rounded-xl transition-all
          ${isDark 
            ? 'bg-slate-800 text-white placeholder-gray-500 border border-slate-700 focus:border-blue-500' 
            : 'bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-500'}
          focus:outline-none focus:ring-2 focus:ring-blue-500/20
          ${errors[field] && touched[field] ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
        `}
        {...props}
      />
      {errors[field] && touched[field] && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {errors[field]}
        </p>
      )}
    </div>
  );

  // 渲染文本域
  const renderTextarea = (
    field: keyof BrandApplicationData,
    placeholder: string,
    rows: number = 4,
    maxLength?: number
  ) => (
    <div>
      <textarea
        value={formData[field] as string}
        onChange={(e) => updateField(field, e.target.value)}
        onBlur={() => markTouched(field)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={`
          w-full px-4 py-3 rounded-xl resize-none transition-all
          ${isDark 
            ? 'bg-slate-800 text-white placeholder-gray-500 border border-slate-700 focus:border-blue-500' 
            : 'bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-500'}
          focus:outline-none focus:ring-2 focus:ring-blue-500/20
          ${errors[field] && touched[field] ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
        `}
      />
      <div className="flex justify-between mt-1">
        {errors[field] && touched[field] ? (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors[field]}
          </p>
        ) : (
          <span />
        )}
        {maxLength && (
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {(formData[field] as string)?.length || 0}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );

  // 渲染文件上传区域
  const renderFileUpload = (
    field: 'brandLogo' | 'businessLicenseFile' | 'authorizationLetter',
    label: string,
    description: string,
    accept: string,
    showPreview: boolean = true
  ) => {
    const refKey = field === 'businessLicenseFile' ? 'businessLicense' : field;
    const uploadState = uploadStates[refKey as keyof typeof uploadStates];
    const hasFile = !!formData[field];

    return (
      <div>
        <input
          ref={fileInputRefs[refKey as keyof typeof fileInputRefs]}
          type="file"
          accept={accept}
          onChange={(e) => handleFileSelect(field, e)}
          className="hidden"
        />
        
        <div className="flex items-start gap-4">
          {hasFile && showPreview ? (
            <div className="relative">
              <img 
                src={formData[field]} 
                alt={label} 
                className="w-24 h-24 rounded-xl object-cover border-2 border-blue-500"
              />
              <button
                type="button"
                onClick={() => handleRemoveFile(field)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : hasFile ? (
            <div className="relative">
              <div className={`
                w-24 h-24 rounded-xl flex flex-col items-center justify-center border-2 border-blue-500
                ${isDark ? 'bg-slate-800' : 'bg-gray-50'}
              `}>
                <FileCheck className="w-8 h-8 text-blue-500" />
                <span className="text-xs text-blue-500 mt-1">已上传</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFile(field)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRefs[refKey as keyof typeof fileInputRefs].current?.click()}
              disabled={uploadState.isUploading}
              className={`
                w-24 h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all
                ${isDark 
                  ? 'border-slate-600 hover:border-blue-500 bg-slate-800' 
                  : 'border-gray-300 hover:border-blue-500 bg-gray-50'}
                ${uploadState.isUploading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {uploadState.isUploading ? (
                <div className="relative">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  {uploadState.progress > 0 && (
                    <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs text-blue-500">
                      {uploadState.progress}%
                    </span>
                  )}
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-xs text-gray-400">上传</span>
                </>
              )}
            </button>
          )}
          
          <div className={`text-sm flex-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <p className="font-medium text-gray-700 dark:text-gray-300">{label}</p>
            {description.split('\n').map((line, i) => (
              <p key={i} className={i === 0 ? 'mt-1' : ''}>{line}</p>
            ))}
          </div>
        </div>
        
        {errors[field] && (
          <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors[field]}
          </p>
        )}
      </div>
    );
  };

  // 渲染步骤1：品牌基本信息
  const renderStep1 = () => (
    <div className="space-y-6">
      {/* 品牌Logo */}
      <div>
        {renderLabel(ImageIcon, '品牌Logo', true)}
        {renderFileUpload(
          'brandLogo',
          '品牌Logo',
          '建议尺寸：200×200px\n支持格式：JPG、PNG、WebP\n最大大小：5MB',
          'image/jpeg,image/png,image/webp'
        )}
      </div>

      {/* 品牌名称 */}
      <div>
        {renderLabel(Building2, '品牌名称', true, '请填写与营业执照一致的品牌名称，2-30个字符')}
        {renderInput('brandName', 'text', '请输入品牌名称')}
      </div>

      {/* 品牌简称 */}
      <div>
        {renderLabel(Building2, '品牌简称', false, '用于平台展示，如与品牌名称相同可不填')}
        {renderInput('brandShortName', 'text', '请输入品牌简称（选填）')}
      </div>

      {/* 品牌介绍 */}
      <div>
        {renderLabel(FileText, '品牌介绍', true, '请简要介绍品牌历史、产品特色、目标用户等')}
        {renderTextarea(
          'description',
          '请简要介绍您的品牌，包括品牌历史、产品特色、目标用户等...',
          4,
          500
        )}
      </div>

      {/* 所属行业 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {renderLabel(Briefcase, '所属行业', true)}
          <select
            value={formData.industry}
            onChange={(e) => {
              updateField('industry', e.target.value);
              updateField('subIndustry', '');
            }}
            onBlur={() => markTouched('industry')}
            className={`
              w-full px-4 py-3 rounded-xl transition-all
              ${isDark 
                ? 'bg-slate-800 text-white border border-slate-700 focus:border-blue-500' 
                : 'bg-gray-50 text-gray-900 border border-gray-200 focus:border-blue-500'}
              focus:outline-none focus:ring-2 focus:ring-blue-500/20
              ${errors.industry && touched.industry ? 'border-red-500' : ''}
            `}
          >
            <option value="">请选择行业</option>
            {industries.map(ind => (
              <option key={ind.value} value={ind.value}>{ind.label}</option>
            ))}
          </select>
          {errors.industry && touched.industry && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.industry}
            </p>
          )}
        </div>

        <div>
          {renderLabel(Briefcase, '细分行业', true)}
          <select
            value={formData.subIndustry}
            onChange={(e) => updateField('subIndustry', e.target.value)}
            onBlur={() => markTouched('subIndustry')}
            disabled={!formData.industry}
            className={`
              w-full px-4 py-3 rounded-xl transition-all
              ${isDark 
                ? 'bg-slate-800 text-white border border-slate-700 focus:border-blue-500' 
                : 'bg-gray-50 text-gray-900 border border-gray-200 focus:border-blue-500'}
              focus:outline-none focus:ring-2 focus:ring-blue-500/20
              ${!formData.industry ? 'opacity-50 cursor-not-allowed' : ''}
              ${errors.subIndustry && touched.subIndustry ? 'border-red-500' : ''}
            `}
          >
            <option value="">请选择细分行业</option>
            {formData.industry && industries
              .find(ind => ind.value === formData.industry)
              ?.subIndustries.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
          </select>
          {errors.subIndustry && touched.subIndustry && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.subIndustry}
            </p>
          )}
        </div>
      </div>

      {/* 品牌官网 */}
      <div>
        {renderLabel(Globe, '品牌官网', false)}
        {renderInput('brandWebsite', 'url', 'https://www.example.com')}
      </div>

      {/* 成立时间 */}
      <div>
        {renderLabel(Building2, '成立时间', false)}
        <input
          type="date"
          value={formData.establishedDate}
          onChange={(e) => updateField('establishedDate', e.target.value)}
          className={`
            w-full px-4 py-3 rounded-xl transition-all
            ${isDark 
              ? 'bg-slate-800 text-white border border-slate-700 focus:border-blue-500' 
              : 'bg-gray-50 text-gray-900 border border-gray-200 focus:border-blue-500'}
            focus:outline-none focus:ring-2 focus:ring-blue-500/20
          `}
        />
      </div>
    </div>
  );

  // 渲染步骤2：资质认证
  const renderStep2 = () => (
    <div className="space-y-6">
      {/* 营业执照 */}
      <div>
        {renderLabel(FileCheck, '营业执照', true, '请上传最新版营业执照原件照片或加盖公章的扫描件')}
        {renderFileUpload(
          'businessLicenseFile',
          '营业执照',
          '支持格式：JPG、PNG、PDF\n最大大小：5MB\n请确保营业执照完整清晰',
          'image/jpeg,image/png,application/pdf',
          true
        )}
        <p className={`mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <Eye className="w-3 h-3 inline mr-1" />
          <a href="#" className="text-blue-500 hover:underline">查看示例</a>
          <span className="mx-2">|</span>
          <a href="#" className="text-blue-500 hover:underline">下载模板</a>
        </p>
      </div>

      {/* 统一社会信用代码 */}
      <div>
        {renderLabel(CreditCard, '统一社会信用代码', true, '请输入营业执照上的18位统一社会信用代码')}
        {renderInput('creditCode', 'text', '请输入18位统一社会信用代码', { maxLength: 18 })}
      </div>

      {/* 企业全称 */}
      <div>
        {renderLabel(Building2, '企业全称', true, '请填写与营业执照完全一致的企业全称')}
        {renderInput('companyName', 'text', '请输入企业全称')}
      </div>

      {/* 法人信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {renderLabel(User, '法人姓名', true)}
          {renderInput('legalPersonName', 'text', '请输入法人姓名')}
        </div>
        <div>
          {renderLabel(CreditCard, '法人身份证号', true)}
          {renderInput('legalPersonIdCard', 'text', '请输入法人身份证号', { maxLength: 18 })}
        </div>
      </div>

      {/* 授权公函 */}
      <div>
        {renderLabel(FileText, '机构认证申请公函', false, '如运营者与法人不一致，需上传加盖公章的授权公函')}
        {renderFileUpload(
          'authorizationLetter',
          '授权公函',
          '支持格式：JPG、PNG、PDF\n最大大小：5MB\n需加盖公章',
          'image/jpeg,image/png,application/pdf',
          false
        )}
        <p className={`mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <a href="#" className="text-blue-500 hover:underline">下载授权公函模板</a>
        </p>
      </div>
    </div>
  );

  // 渲染步骤3：联系方式
  const renderStep3 = () => (
    <div className="space-y-6">
      {/* 联系人姓名 */}
      <div>
        {renderLabel(User, '联系人姓名', true, '请填写实际运营人员的真实姓名')}
        {renderInput('contactName', 'text', '请输入联系人姓名')}
      </div>

      {/* 联系人手机号 */}
      <div>
        {renderLabel(Phone, '联系人手机号', true, '用于接收验证码和重要通知')}
        <div className="flex gap-3">
          <div className="flex-1">
            {renderInput('contactPhone', 'tel', '请输入11位手机号')}
          </div>
          <button
            type="button"
            onClick={handleSendVerifyCode}
            disabled={verifyCodeCountdown > 0}
            className={`
              px-4 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all
              ${verifyCodeCountdown > 0
                ? (isDark ? 'bg-slate-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
                : 'bg-blue-500 text-white hover:bg-blue-600'
              }
            `}
          >
            {verifyCodeCountdown > 0 ? `${verifyCodeCountdown}s后重试` : '获取验证码'}
          </button>
        </div>
      </div>

      {/* 验证码 */}
      <div>
        {renderLabel(FileText, '验证码', true)}
        {renderInput('verifyCode', 'text', '请输入6位验证码', { maxLength: 6 })}
      </div>

      {/* 联系邮箱 */}
      <div>
        {renderLabel(Mail, '联系邮箱', false, '用于接收审核结果和重要通知')}
        {renderInput('contactEmail', 'email', '请输入联系邮箱（选填）')}
      </div>

      {/* 联系地址 */}
      <div>
        {renderLabel(MapPin, '联系地址', false)}
        {renderTextarea('contactAddress', '请输入联系地址（选填）', 3)}
      </div>
    </div>
  );

  // 渲染步骤4：确认提交
  const renderStep4 = () => (
    <div className="space-y-6">
      {/* 信息确认 */}
      <div className={`
        p-6 rounded-2xl
        ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-gray-50 border border-gray-200'}
      `}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          申请信息确认
        </h3>
        
        <div className="space-y-4">
          <div>
            <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>品牌信息</h4>
            <div className={`text-sm space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <p><span className="font-medium">品牌名称：</span>{formData.brandName}</p>
              {formData.brandShortName && <p><span className="font-medium">品牌简称：</span>{formData.brandShortName}</p>}
              <p><span className="font-medium">所属行业：</span>{industries.find(i => i.value === formData.industry)?.label} - {formData.subIndustry}</p>
            </div>
          </div>
          
          <div className={`border-t ${isDark ? 'border-slate-700' : 'border-gray-200'} pt-4`}>
            <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>企业资质</h4>
            <div className={`text-sm space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <p><span className="font-medium">企业全称：</span>{formData.companyName}</p>
              <p><span className="font-medium">信用代码：</span>{formData.creditCode}</p>
              <p><span className="font-medium">法人姓名：</span>{formData.legalPersonName}</p>
            </div>
          </div>
          
          <div className={`border-t ${isDark ? 'border-slate-700' : 'border-gray-200'} pt-4`}>
            <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>联系方式</h4>
            <div className={`text-sm space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <p><span className="font-medium">联系人：</span>{formData.contactName}</p>
              <p><span className="font-medium">手机号：</span>{formData.contactPhone}</p>
              {formData.contactEmail && <p><span className="font-medium">邮箱：</span>{formData.contactEmail}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* 服务协议 */}
      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.agreedToTerms}
            onChange={(e) => updateField('agreedToTerms', e.target.checked)}
            onBlur={() => markTouched('agreedToTerms')}
            className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
          />
          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            我已阅读并同意
            <Link 
              to="/brand-service-agreement" 
              target="_blank"
              className="text-blue-500 hover:underline mx-1 inline-flex items-center gap-0.5"
            >
              《品牌入驻服务协议》
              <ExternalLink className="w-3 h-3" />
            </Link>
            和
            <Link 
              to="/privacy" 
              target="_blank"
              className="text-blue-500 hover:underline mx-1 inline-flex items-center gap-0.5"
            >
              《隐私政策》
              <ExternalLink className="w-3 h-3" />
            </Link>
          </span>
        </label>
        {errors.agreedToTerms && touched.agreedToTerms && (
          <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.agreedToTerms}
          </p>
        )}
      </div>

      {/* 提示信息 */}
      <div className={`
        p-4 rounded-xl text-sm
        ${isDark ? 'bg-blue-900/20 border border-blue-500/30 text-blue-300' : 'bg-blue-50 border border-blue-200 text-blue-700'}
      `}>
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium mb-1">提交前请确认</p>
            <ul className="space-y-1 text-xs opacity-90">
              <li>• 所有信息真实有效，与营业执照一致</li>
              <li>• 上传的资质文件清晰完整，在有效期内</li>
              <li>• 审核时间为1-3个工作日，结果将通过短信和邮件通知</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="mb-16">
      {/* 标题 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-4">
          <Building2 className="w-4 h-4 text-blue-500" />
          <span className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            品牌入驻申请
          </span>
        </div>
        <h2 className={`text-3xl md:text-4xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          提交品牌入驻申请
        </h2>
        <p className={`text-base max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          填写品牌信息，我们将在1-3个工作日内完成审核
        </p>
        <div className="mt-3">
          <a href="#" className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'} hover:underline`}>
            查看入驻须知
          </a>
          <span className={`mx-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>|</span>
          <a href="#" className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'} hover:underline`}>
            入驻规则说明
          </a>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className={`
          max-w-3xl mx-auto p-8 rounded-3xl
          ${isDark 
            ? 'bg-slate-800/50 border border-slate-700' 
            : 'bg-white border border-gray-200'}
        `}
      >
        {/* 步骤指示器 */}
        {renderStepIndicator()}

        {/* 表单内容 */}
        <div className="min-h-[400px]">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        {/* 按钮区域 */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`
              px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all
              ${currentStep === 1
                ? 'opacity-0 cursor-default'
                : (isDark 
                    ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
              }
            `}
          >
            <ChevronLeft className="w-5 h-5" />
            上一步
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="
                px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-all
                bg-gradient-to-r from-blue-500 to-purple-600 text-white
                shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02]
              "
            >
              下一步
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`
                px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-all
                ${isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02]'
                }
                text-white
              `}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  提交入驻申请
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default BrandApplicationForm;
