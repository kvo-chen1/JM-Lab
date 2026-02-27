import React, { useState, useRef, useCallback, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import {
  Upload, X, Image as ImageIcon, Sparkles, ArrowRight,
  CheckCircle2, Gem, Shield, FileText, Tag, Loader2,
  ChevronLeft, Info, Lightbulb, Save, AlertCircle,
  Link2, Search, Check
} from 'lucide-react';
import { TianjinButton } from '@/components/TianjinStyleComponents';
import ipService from '@/services/ipService';
import workService, { Work } from '@/services/workService';
import { AuthContext } from '@/contexts/authContext';

// 作品类型选项
const WORK_TYPES = [
  { id: 'illustration', name: '插画', icon: '🎨', description: '原创插画作品' },
  { id: 'pattern', name: '纹样', icon: '🌸', description: '传统或创新纹样设计' },
  { id: 'design', name: '设计', icon: '✏️', description: '平面设计作品' },
  { id: '3d_model', name: '3D模型', icon: '🎭', description: '三维模型作品' },
  { id: 'digital_collectible', name: '数字藏品', icon: '💎', description: '数字艺术藏品' },
];

// 孵化阶段选项
const INCUBATION_STAGES = [
  { id: 'design', name: '创意设计', description: '完成原创作品设计' },
  { id: 'copyright', name: '版权存证', description: '进行版权登记存证' },
  { id: 'incubation', name: 'IP孵化', description: '转化为可商业化IP' },
  { id: 'cooperation', name: '商业合作', description: '对接品牌方合作' },
  { id: 'revenue', name: '收益分成', description: '获得持续收益' },
];

interface WorkFormData {
  title: string;
  description: string;
  type: string;
  tags: string[];
  currentStage: string;
  commercialValue: number;
  originalWorkId: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  type?: string;
  images?: string;
}

const DRAFT_KEY = 'ip_incubation_draft';

export default function IPIncubationSubmit() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useContext(AuthContext);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [formData, setFormData] = useState<WorkFormData>({
    title: '',
    description: '',
    type: '',
    tags: [],
    currentStage: 'design',
    commercialValue: 5000,
    originalWorkId: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // 作品关联相关状态
  const [userWorks, setUserWorks] = useState<Work[]>([]);
  const [isLoadingWorks, setIsLoadingWorks] = useState(false);
  const [showWorkSelector, setShowWorkSelector] = useState(false);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const hasShownRestoreToast = useRef(false);

  // 处理图片上传
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error('请上传图片文件');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('图片大小不能超过10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImages(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // 移除上传的图片
  const removeImage = useCallback((index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 添加标签
  const addTag = useCallback(() => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  }, [tagInput, formData.tags]);

  // 移除标签
  const removeTag = useCallback((tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  }, []);

  // 处理标签输入回车
  const handleTagKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  }, [addTag]);

  // 验证表单字段
  const validateField = useCallback((name: keyof WorkFormData, value: any): string | undefined => {
    switch (name) {
      case 'title':
        if (!value || value.trim().length === 0) return '请输入作品标题';
        if (value.trim().length < 2) return '标题至少需要2个字符';
        if (value.trim().length > 50) return '标题不能超过50个字符';
        return undefined;
      case 'description':
        if (!value || value.trim().length === 0) return '请输入作品描述';
        if (value.trim().length < 10) return '描述至少需要10个字符';
        if (value.trim().length > 500) return '描述不能超过500个字符';
        return undefined;
      case 'type':
        if (!value) return '请选择作品类型';
        return undefined;
      default:
        return undefined;
    }
  }, []);

  // 验证整个表单
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    const titleError = validateField('title', formData.title);
    if (titleError) newErrors.title = titleError;
    
    const descriptionError = validateField('description', formData.description);
    if (descriptionError) newErrors.description = descriptionError;
    
    const typeError = validateField('type', formData.type);
    if (typeError) newErrors.type = typeError;
    
    if (uploadedImages.length === 0) {
      newErrors.images = '请至少上传一张作品图片';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, uploadedImages, validateField]);

  // 处理字段失焦
  const handleBlur = useCallback((fieldName: keyof WorkFormData) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    const error = validateField(fieldName, formData[fieldName]);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, [formData, validateField]);

  // 保存草稿到本地存储
  const saveDraft = useCallback(async () => {
    setIsSavingDraft(true);
    try {
      const draftData = {
        formData,
        uploadedImages,
        currentStep,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      setLastSavedAt(new Date());
      toast.success('草稿已保存', { duration: 1500 });
    } catch (error) {
      console.error('保存草稿失败:', error);
      toast.error('保存草稿失败');
    } finally {
      setIsSavingDraft(false);
    }
  }, [formData, uploadedImages, currentStep]);

  // 自动保存草稿（防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.title || formData.description || uploadedImages.length > 0) {
        const draftData = {
          formData,
          uploadedImages,
          currentStep,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
        setLastSavedAt(new Date());
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [formData, uploadedImages, currentStep]);

  // 恢复草稿
  const restoreDraft = useCallback((showToast = true) => {
    try {
      const draftJson = localStorage.getItem(DRAFT_KEY);
      if (draftJson) {
        const draft = JSON.parse(draftJson);
        setFormData(draft.formData);
        setUploadedImages(draft.uploadedImages || []);
        setCurrentStep(draft.currentStep || 1);
        setLastSavedAt(new Date(draft.savedAt));
        // 只在需要时显示恢复提示，且确保只显示一次
        if (showToast && !hasShownRestoreToast.current) {
          hasShownRestoreToast.current = true;
          toast.success('已恢复上次草稿');
        }
        return true;
      }
    } catch (error) {
      console.error('恢复草稿失败:', error);
    }
    return false;
  }, []);

  // 清除草稿
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setLastSavedAt(null);
  }, []);

  // 加载用户作品列表
  const loadUserWorks = useCallback(async () => {
    if (!user?.id) {
      toast.error('请先登录');
      return;
    }
    setIsLoadingWorks(true);
    try {
      const works = await workService.getUserWorks(user.id);
      setUserWorks(works.filter(w => w.status === 'published'));
    } catch (error) {
      console.error('加载作品列表失败:', error);
      toast.error('加载作品列表失败');
    } finally {
      setIsLoadingWorks(false);
    }
  }, [user?.id]);

  // 选择关联作品
  const handleSelectWork = useCallback((work: Work) => {
    setSelectedWork(work);
    setFormData(prev => ({
      ...prev,
      originalWorkId: work.id,
      title: prev.title || work.title,
      description: prev.description || work.description,
      type: prev.type || work.category,
    }));
    setShowWorkSelector(false);
    toast.success(`已关联作品: ${work.title}`);
  }, []);

  // 取消关联作品
  const handleClearWork = useCallback(() => {
    setSelectedWork(null);
    setFormData(prev => ({ ...prev, originalWorkId: '' }));
  }, []);

  // 页面加载时检查是否有草稿
  useEffect(() => {
    // 检查是否已经显示过恢复提示
    const restorePromptShown = sessionStorage.getItem('ip_draft_restore_prompt_shown');
    if (restorePromptShown) return;

    const draftJson = localStorage.getItem(DRAFT_KEY);
    if (draftJson) {
      const draft = JSON.parse(draftJson);
      const savedTime = new Date(draft.savedAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60);
      
      // 如果草稿是24小时内的，询问是否恢复
      if (hoursDiff < 24) {
        // 标记已经显示过提示
        sessionStorage.setItem('ip_draft_restore_prompt_shown', 'true');
        
        toast.info(
          `发现${Math.floor(hoursDiff)}小时前的草稿，是否恢复？`,
          {
            duration: 10000,
            action: {
              label: '恢复',
              onClick: () => restoreDraft(true),
            },
            cancel: {
              label: '丢弃',
              onClick: () => clearDraft(),
            },
          }
        );
      } else {
        clearDraft();
      }
    }
  }, [restoreDraft, clearDraft]);

  // 提交作品
  const handleSubmit = useCallback(async () => {
    // 检查用户是否登录
    if (!user?.id) {
      toast.error('请先登录后再提交作品');
      return;
    }

    // 调试：检查用户ID格式
    console.log('[IPIncubationSubmit] 当前用户ID:', user.id);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user.id)) {
      console.error('[IPIncubationSubmit] 用户ID不是有效的UUID格式:', user.id);
      toast.error('用户ID格式无效，请重新登录');
      return;
    }

    // 标记所有字段为已触摸
    setTouched({ title: true, description: true, type: true });
    
    if (!validateForm()) {
      toast.error('请完善表单信息');
      return;
    }

    setIsSubmitting(true);

    try {
      // 创建IP资产，传入 userId
      // 状态设置为 pending_review，需要管理员审核后才能发布
      const result = await ipService.createIPAsset({
        name: formData.title,
        description: formData.description,
        type: formData.type as any,
        thumbnail: uploadedImages[0],
        commercialValue: formData.commercialValue,
        originalWorkId: formData.originalWorkId || '',
        status: 'pending_review',
      }, user.id);

      if (result) {
        // 提交成功后清除草稿
        clearDraft();
        toast.success('作品提交成功！已创建IP资产');
        navigate('/ip-incubation');
      } else {
        toast.error('作品提交失败，请重试');
      }
    } catch (error: any) {
      console.error('提交作品失败:', error);
      if (error.message === '用户未登录') {
        toast.error('请先登录后再提交作品');
      } else {
        toast.error(error.message || '提交失败，请稍后重试');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, uploadedImages, navigate, validateForm, clearDraft, user?.id]);

  // 步骤内容渲染
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* 关联现有作品 */}
            <div>
              <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary-500" />
                关联现有作品
                <span className="text-xs text-gray-500 font-normal">(可选)</span>
              </label>
              
              {selectedWork ? (
                <div className={`p-4 rounded-xl border-2 border-primary-500 ${isDark ? 'bg-primary-900/20' : 'bg-primary-50'} flex items-center gap-4`}>
                  {selectedWork.thumbnail && (
                    <img src={selectedWork.thumbnail} alt={selectedWork.title} className="w-16 h-16 rounded-lg object-cover" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{selectedWork.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{selectedWork.category}</div>
                  </div>
                  <button
                    onClick={handleClearWork}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowWorkSelector(true);
                      loadUserWorks();
                    }}
                    className={`w-full p-4 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 ${
                      isDark
                        ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <Search className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-500">从已有作品中选择关联</span>
                  </button>
                  
                  {/* 作品选择弹窗 */}
                  <AnimatePresence>
                    {showWorkSelector && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`absolute top-full left-0 right-0 mt-2 p-4 rounded-xl shadow-lg border z-20 ${
                          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium">选择作品</span>
                          <button onClick={() => setShowWorkSelector(false)}>
                            <X className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                        
                        {isLoadingWorks ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                          </div>
                        ) : userWorks.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p>暂无已发布的作品</p>
                            <p className="text-xs mt-1">请先发布作品后再来关联</p>
                          </div>
                        ) : (
                          <div className="max-h-64 overflow-y-auto space-y-2">
                            {userWorks.map((work) => (
                              <button
                                key={work.id}
                                onClick={() => handleSelectWork(work)}
                                className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors text-left ${
                                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                }`}
                              >
                                {work.thumbnail ? (
                                  <img src={work.thumbnail} alt={work.title} className="w-12 h-12 rounded-lg object-cover" />
                                ) : (
                                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                    isDark ? 'bg-gray-700' : 'bg-gray-200'
                                  }`}>
                                    <ImageIcon className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{work.title}</div>
                                  <div className="text-xs text-gray-500">{work.category}</div>
                                </div>
                                <Check className={`w-4 h-4 text-primary-500 ${selectedWork?.id === work.id ? 'opacity-100' : 'opacity-0'}`} />
                              </button>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* 作品标题 */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-500" />
                作品标题
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, title: e.target.value }));
                  if (touched.title) {
                    const error = validateField('title', e.target.value);
                    setErrors(prev => ({ ...prev, title: error }));
                  }
                }}
                onBlur={() => handleBlur('title')}
                placeholder="给你的作品起个名字"
                className={`w-full px-4 py-3 rounded-xl border transition-all ${
                  errors.title && touched.title
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                    : isDark
                      ? 'bg-gray-800 border-gray-700 focus:ring-2 focus:ring-primary-500'
                      : 'bg-white border-gray-200 focus:ring-2 focus:ring-primary-500'
                } focus:outline-none`}
              />
              {errors.title && touched.title && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  {errors.title}
                </div>
              )}
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">2-50个字符</span>
                <span className={`text-xs ${formData.title.length > 50 ? 'text-red-500' : 'text-gray-400'}`}>
                  {formData.title.length}/50
                </span>
              </div>
            </div>

            {/* 作品描述 */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary-500" />
                作品描述
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, description: e.target.value }));
                  if (touched.description) {
                    const error = validateField('description', e.target.value);
                    setErrors(prev => ({ ...prev, description: error }));
                  }
                }}
                onBlur={() => handleBlur('description')}
                placeholder="描述你的作品创意、灵感来源、设计理念等"
                rows={4}
                className={`w-full px-4 py-3 rounded-xl border transition-all resize-none ${
                  errors.description && touched.description
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                    : isDark
                      ? 'bg-gray-800 border-gray-700 focus:ring-2 focus:ring-primary-500'
                      : 'bg-white border-gray-200 focus:ring-2 focus:ring-primary-500'
                } focus:outline-none`}
              />
              {errors.description && touched.description && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  {errors.description}
                </div>
              )}
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">10-500个字符</span>
                <span className={`text-xs ${formData.description.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>
                  {formData.description.length}/500
                </span>
              </div>
            </div>

            {/* 作品类型 */}
            <div>
              <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                <Gem className="w-4 h-4 text-primary-500" />
                作品类型
                <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {WORK_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, type: type.id }));
                      if (touched.type) {
                        const error = validateField('type', type.id);
                        setErrors(prev => ({ ...prev, type: error }));
                      }
                    }}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      formData.type === type.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : errors.type && touched.type
                          ? 'border-red-500 hover:border-red-400'
                          : isDark
                            ? 'border-gray-700 hover:border-gray-600'
                            : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <div className="font-medium text-sm">{type.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                  </button>
                ))}
              </div>
              {errors.type && touched.type && (
                <div className="flex items-center gap-1 mt-2 text-red-500 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  {errors.type}
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* 图片上传 */}
            <div>
              <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary-500" />
                作品图片
                <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 font-normal">(支持多张，首张为封面)</span>
              </label>

              {/* 已上传图片预览 */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img
                        src={image}
                        alt={`作品图片 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-primary-500 text-white text-xs py-1 text-center">
                          封面
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 上传按钮 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${
                  errors.images && uploadedImages.length === 0
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                    : isDark
                      ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-500">点击上传图片</span>
                <span className="text-xs text-gray-400">支持 JPG、PNG 格式，单张不超过 10MB</span>
              </button>
              {errors.images && uploadedImages.length === 0 && (
                <div className="flex items-center gap-1 mt-2 text-red-500 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  {errors.images}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* 标签 */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary-500" />
                标签
                <span className="text-xs text-gray-500 font-normal">(可选，帮助作品被更多人发现)</span>
              </label>
              <div className={`flex flex-wrap gap-2 mb-2 ${formData.tags.length > 0 ? 'mb-3' : ''}`}>
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="输入标签，按回车添加"
                  className={`flex-1 px-4 py-2 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-primary-500`}
                />
                <button
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white rounded-xl transition-colors"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* 当前孵化阶段 */}
            <div>
              <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary-500" />
                当前孵化阶段
              </label>
              <div className="space-y-3">
                {INCUBATION_STAGES.map((stage, index) => (
                  <button
                    key={stage.id}
                    onClick={() => setFormData(prev => ({ ...prev, currentStage: stage.id }))}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                      formData.currentStage === stage.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : isDark
                          ? 'border-gray-700 hover:border-gray-600'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      formData.currentStage === stage.id
                        ? 'bg-primary-500 text-white'
                        : isDark
                          ? 'bg-gray-700 text-gray-400'
                          : 'bg-gray-200 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{stage.name}</div>
                      <div className="text-xs text-gray-500">{stage.description}</div>
                    </div>
                    {formData.currentStage === stage.id && (
                      <CheckCircle2 className="w-5 h-5 text-primary-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 预估商业价值 */}
            <div>
              <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary-500" />
                预估商业价值
              </label>
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500">预估价值</span>
                  <span className="text-2xl font-bold text-primary-600">
                    ¥{formData.commercialValue.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={formData.commercialValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, commercialValue: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>¥1,000</span>
                  <span>¥100,000</span>
                </div>
              </div>
            </div>

            {/* 提交预览 */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                提交预览
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">作品标题</span>
                  <span className="font-medium">{formData.title || '未填写'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">作品类型</span>
                  <span className="font-medium">
                    {WORK_TYPES.find(t => t.id === formData.type)?.name || '未选择'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">图片数量</span>
                  <span className="font-medium">{uploadedImages.length} 张</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">当前阶段</span>
                  <span className="font-medium">
                    {INCUBATION_STAGES.find(s => s.id === formData.currentStage)?.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-full ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* 头部导航 */}
      <div className={`sticky top-0 z-10 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/ip-incubation')}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>返回</span>
            </button>
            <h1 className="text-lg font-bold">提交IP作品</h1>
            <div className="flex items-center gap-2">
              {/* 草稿保存按钮 */}
              <button
                onClick={saveDraft}
                disabled={isSavingDraft}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                title="保存草稿"
              >
                {isSavingDraft ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">保存</span>
              </button>
            </div>
          </div>
          
          {/* 草稿状态提示 */}
          {lastSavedAt && (
            <div className="text-center mt-2">
              <span className="text-xs text-gray-400">
                草稿已保存 {lastSavedAt.toLocaleTimeString()}
              </span>
            </div>
          )}

          {/* 步骤指示器 */}
          <div className="flex items-center justify-center gap-4 mt-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  currentStep >= step
                    ? 'bg-primary-500 text-white'
                    : isDark
                      ? 'bg-gray-700 text-gray-400'
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step ? <CheckCircle2 className="w-5 h-5" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-0.5 transition-colors ${
                    currentStep > step ? 'bg-primary-500' : isDark ? 'bg-gray-700' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-12 mt-2 text-xs text-gray-500">
            <span>基本信息</span>
            <span>作品素材</span>
            <span>孵化设置</span>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card`}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* 底部按钮 */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            上一步
          </button>

          {currentStep < 3 ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              下一步
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <TianjinButton
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  提交作品
                </>
              )}
            </TianjinButton>
          )}
        </div>
      </div>
    </div>
  );
}
