import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '@/contexts/authContext';
import { brandPartnershipService, BrandPartnership } from '@/services/brandPartnershipService';
import { uploadImage, uploadAvatar } from '@/services/imageService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Camera, 
  Save, 
  ArrowLeft, 
  Loader2,
  CheckCircle2,
  Upload,
  X,
  AlertCircle,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';

// 表单数据类型
interface FormData {
  brand_name: string;
  brand_logo: string;
  description: string;
}

// 表单错误类型
interface FormErrors {
  brand_name?: string;
  brand_logo?: string;
  description?: string;
}

export default function BrandProfileEdit() {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [brand, setBrand] = useState<BrandPartnership | null>(null);
  const [formData, setFormData] = useState<FormData>({
    brand_name: '',
    brand_logo: '',
    description: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // 加载品牌数据
  const loadBrandData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const partnerships = await brandPartnershipService.getMyPartnerships({
        id: user.id,
        email: user.email,
      });
      
      const approvedBrand = partnerships.find(p => p.status === 'approved');
      
      if (!approvedBrand) {
        toast.error('未找到已认证的品牌');
        navigate('/organizer');
        return;
      }

      setBrand(approvedBrand);
      setFormData({
        brand_name: approvedBrand.brand_name || '',
        brand_logo: approvedBrand.brand_logo || '',
        description: approvedBrand.description || ''
      });
    } catch (err) {
      console.error('加载品牌数据失败:', err);
      toast.error('加载品牌数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [user, navigate]);

  useEffect(() => {
    loadBrandData();
  }, [loadBrandData]);

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.brand_name.trim()) {
      newErrors.brand_name = '品牌名称不能为空';
    } else if (formData.brand_name.trim().length < 2) {
      newErrors.brand_name = '品牌名称至少需要2个字符';
    } else if (formData.brand_name.trim().length > 50) {
      newErrors.brand_name = '品牌名称不能超过50个字符';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = '品牌简介不能超过500个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单变更
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('请上传 JPG、PNG、WebP 或 GIF 格式的图片');
      return;
    }

    // 验证文件大小 (最大 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('图片大小不能超过 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await uploadAvatar(file);
      setFormData(prev => ({ ...prev, brand_logo: imageUrl }));
      setHasChanges(true);
      toast.success('头像上传成功');
    } catch (err) {
      console.error('上传头像失败:', err);
      toast.error('上传头像失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // 处理拖拽事件
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // 移除头像
  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, brand_logo: '' }));
    setHasChanges(true);
  };

  // 保存更改
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('请检查表单填写是否正确');
      return;
    }

    if (!brand) {
      toast.error('品牌信息不存在');
      return;
    }

    setIsSaving(true);
    try {
      const success = await brandPartnershipService.updateBrandProfile(brand.id, {
        brand_name: formData.brand_name.trim(),
        brand_logo: formData.brand_logo,
        description: formData.description.trim()
      });

      if (success) {
        toast.success('品牌信息更新成功');
        setHasChanges(false);
        // 延迟返回
        setTimeout(() => {
          navigate('/organizer');
        }, 1000);
      } else {
        toast.error('更新失败，请重试');
      }
    } catch (err) {
      console.error('保存品牌信息失败:', err);
      toast.error('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 取消编辑
  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm('您有未保存的更改，确定要放弃吗？');
      if (!confirmed) return;
    }
    navigate('/organizer');
  };

  // 获取首字母作为占位符
  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '品';
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={`w-10 h-10 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* 顶部导航栏 */}
      <div className={`sticky top-0 z-10 border-b ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200'} backdrop-blur-sm`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancel}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                品牌信息编辑
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                } disabled:opacity-50`}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white disabled:bg-gray-700' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white disabled:bg-gray-300'
                } disabled:cursor-not-allowed`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    保存更改
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`rounded-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}
        >
          {/* 头像上传区域 */}
          <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <h2 className={`text-base font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              品牌头像
            </h2>
            
            <div className="flex items-start gap-6">
              {/* 头像预览 */}
              <div className="relative">
                <div 
                  className={`w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center ${
                    formData.brand_logo 
                      ? '' 
                      : isDark ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-purple-500'
                  }`}
                >
                  {formData.brand_logo ? (
                    <img 
                      src={formData.brand_logo} 
                      alt="品牌头像" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-white">
                      {getInitial(formData.brand_name)}
                    </span>
                  )}
                </div>
                
                {/* 上传中遮罩 */}
                <AnimatePresence>
                  {isUploading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center"
                    >
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 上传操作区 */}
              <div className="flex-1">
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${
                    dragActive 
                      ? isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-50'
                      : isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className={`p-3 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <Upload className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      点击或拖拽上传头像
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      支持 JPG、PNG、WebP，最大 5MB
                    </p>
                  </div>
                </div>

                {/* 移除头像按钮 */}
                {formData.brand_logo && (
                  <button
                    onClick={handleRemoveLogo}
                    className={`mt-3 flex items-center gap-2 text-sm transition-colors ${
                      isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    移除头像
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 表单区域 */}
          <div className="p-6 space-y-6">
            {/* 品牌名称 */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                品牌名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.brand_name}
                onChange={(e) => handleChange('brand_name', e.target.value)}
                placeholder="请输入品牌名称"
                maxLength={50}
                className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors ${
                  errors.brand_name 
                    ? isDark ? 'border-red-500 bg-red-500/10' : 'border-red-500 bg-red-50'
                    : isDark 
                      ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                      : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.brand_name ? (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.brand_name}
                  </p>
                ) : (
                  <span />
                )}
                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {formData.brand_name.length}/50
                </span>
              </div>
            </div>

            {/* 品牌简介 */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                品牌简介
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="请输入品牌简介，让用户更好地了解您的品牌..."
                rows={4}
                maxLength={500}
                className={`w-full px-4 py-3 rounded-xl border text-sm resize-none transition-colors ${
                  errors.description 
                    ? isDark ? 'border-red-500 bg-red-500/10' : 'border-red-500 bg-red-50'
                    : isDark 
                      ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                      : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.description ? (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.description}
                  </p>
                ) : (
                  <span />
                )}
                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {formData.description.length}/500
                </span>
              </div>
            </div>
          </div>

          {/* 底部提示 */}
          <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/50'} rounded-b-2xl`}>
            <div className={`flex items-start gap-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <Building2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>
                品牌信息将展示在您的活动页面和品牌展示区域。请确保信息真实准确，有助于提升用户信任度。
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
