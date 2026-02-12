import { useState, useContext, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { EventCreateRequest, Media } from '@/types';
import { eventService } from '@/services/eventService';
import { brandPartnershipService, BrandPartnership } from '@/services/brandPartnershipService';
import { uploadImage, uploadVideo } from '@/services/imageService';
import { StepIndicator } from '@/components/StepIndicator';
import { InfoCard } from '@/components/InfoCard';
import { EventPreview } from '@/components/EventPreview';

import {
  Save,
  Share2,
  History,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Info,
  Calendar,
  MapPin,
  Users,
  Tag,
  Image as ImageIcon,
  Video,
  FileText,
  Settings,
  Eye,
  ChevronRight,
  ChevronLeft,
  Send,
  Loader2,
  Building2,
  Shield
} from 'lucide-react';

// 活动创建步骤类型
type StepType = 'basic' | 'content' | 'media' | 'settings' | 'preview';

// 步骤配置
const steps = [
  { id: 'basic' as StepType, name: '基本信息', description: '填写活动名称、时间地点' },
  { id: 'content' as StepType, name: '活动内容', description: '详细描述活动流程' },
  { id: 'media' as StepType, name: '多媒体', description: '上传图片和视频' },
  { id: 'settings' as StepType, name: '设置', description: '参与规则和标签' },
  { id: 'preview' as StepType, name: '预览发布', description: '检查并发布活动' },
];

// 预设标签列表
const presetTags = ['文化展览', '演出活动', '讲座论坛', '节日庆典', '亲子活动', '体育赛事', '公益活动', '艺术创作', '非遗传承', '文创设计', '历史文化', '民俗文化', '红色文化', '天津特色'];

export default function CreateActivity() {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // 品牌验证状态
  const [verifiedBrand, setVerifiedBrand] = useState<BrandPartnership | null>(null);
  const [isCheckingBrand, setIsCheckingBrand] = useState(true);

  // 当前步骤
  const [currentStep, setCurrentStep] = useState<StepType>('basic');

  // 表单数据
  const [formData, setFormData] = useState<EventCreateRequest>({
    title: '',
    description: '',
    content: '',
    startTime: new Date(),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    location: '',
    type: 'offline',
    tags: [],
    media: [],
    isPublic: true,
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    pushToCommunity: false,
    applyForRecommendation: false,
  });

  // 发布选项
  const [publishOptions, setPublishOptions] = useState({
    publishToJinmaiPlatform: true,
    notifyFollowers: false,
  });

  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // 保存状态
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  // 表单验证错误
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 表单触摸状态
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // 自动保存定时器
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 活动ID（用于断点续创）
  const [eventId, setEventId] = useState<string | null>(null);

  // 标签管理相关状态
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  // 检查品牌验证状态
  useEffect(() => {
    const checkBrandVerification = async () => {
      if (!isAuthenticated || !user) {
        navigate('/login');
        return;
      }

      setIsCheckingBrand(true);
      try {
        // 获取当前用户已审核通过的品牌
        const myPartnerships = await brandPartnershipService.getMyPartnerships();
        const approvedBrand = myPartnerships.find(p => p.status === 'approved');
        
        if (approvedBrand) {
          setVerifiedBrand(approvedBrand);
        }
      } catch (error) {
        console.error('检查品牌验证状态失败:', error);
      } finally {
        setIsCheckingBrand(false);
      }
    };

    checkBrandVerification();
  }, [isAuthenticated, user, navigate]);

  // 加载草稿
  useEffect(() => {
    if (!isAuthenticated || !user || !verifiedBrand) return;

    const loadDraft = async () => {
      try {
        setIsLoading(true);
        const userEvents = await eventService.getUserEvents(user.id, {
          status: 'draft',
          limit: 1,
        });

        if (userEvents.length > 0) {
          const draft = userEvents[0];
          setFormData({
            title: draft.title,
            description: draft.description,
            content: draft.content,
            startTime: new Date(draft.start_time),
            endTime: new Date(draft.end_time),
            location: draft.location || '',
            type: draft.type,
            tags: draft.tags || [],
            media: draft.media || [],
            isPublic: draft.is_public,
            contactName: draft.contact_name || '',
            contactPhone: draft.contact_phone || '',
            contactEmail: draft.contact_email || '',
          });
          setEventId(draft.id);
          setLastSavedTime(new Date(draft.updated_at));
          toast.success('已加载最近的草稿');
        }
      } catch (error) {
        console.error('加载草稿失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDraft();
  }, [isAuthenticated, user, verifiedBrand]);

  // 自动保存草稿
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setSaveStatus('unsaved');

    autoSaveTimerRef.current = setTimeout(async () => {
      if (formData.title || formData.description || formData.content) {
        try {
          setSaveStatus('saving');

          const eventData = {
            title: formData.title,
            description: formData.description,
            content: formData.content,
            start_time: formData.startTime.toISOString(),
            end_time: formData.endTime.toISOString(),
            location: formData.location,
            type: formData.type,
            tags: formData.tags,
            media: formData.media,
            is_public: formData.isPublic,
            contact_name: formData.contactName,
            contact_phone: formData.contactPhone,
            contact_email: formData.contactEmail,
            max_participants: formData.maxParticipants,
            status: 'draft' as const,
          };

          if (eventId) {
            await eventService.updateEvent(eventId, eventData);
          } else {
            const newEvent = await eventService.createEvent(eventData);
            if (newEvent) {
              setEventId(newEvent.id);
            }
          }

          setSaveStatus('saved');
          setLastSavedTime(new Date());
        } catch (error) {
          console.error('自动保存失败:', error);
          setSaveStatus('unsaved');
        }
      }
    }, 5000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData, eventId]);

  // 处理步骤切换
  const handleStepChange = (step: StepType, skipValidation = false) => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    const targetIndex = steps.findIndex(s => s.id === step);

    // 只有向前跳转（到后面的步骤）时才需要验证，返回上一步不需要验证
    if (!skipValidation && targetIndex > currentIndex) {
      if (!validateCurrentStep()) return;
    }
    setCurrentStep(step);
  };

  // 验证当前步骤
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 'basic':
        if (!formData.title.trim()) newErrors.title = '请输入活动名称';
        else if (formData.title.length < 2) newErrors.title = '活动名称至少需要2个字符';
        else if (formData.title.length > 50) newErrors.title = '活动名称不能超过50个字符';

        if (!formData.description.trim()) newErrors.description = '请输入活动描述';
        else if (formData.description.length < 5) newErrors.description = '活动描述至少需要5个字符';

        if (formData.startTime && formData.endTime) {
          if (formData.startTime >= formData.endTime) newErrors.time = '结束时间必须晚于开始时间';
          else if (formData.endTime.getTime() - formData.startTime.getTime() < 30 * 60 * 1000) {
            newErrors.time = '活动时长至少需要30分钟';
          }
        }

        if (formData.contactPhone && !/^1[3-9]\d{9}$/.test(formData.contactPhone)) {
          newErrors.contactPhone = '请输入有效的11位手机号码';
        }
        if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
          newErrors.contactEmail = '请输入有效的邮箱地址';
        }
        break;

      case 'content':
        if (!formData.content.trim() || formData.content === '<p><br></p>') {
          newErrors.content = '请输入活动内容';
        } else if (formData.content.replace(/<[^>]*>/g, '').length < 10) {
          newErrors.content = '活动内容详情至少需要10个字符';
        }
        break;

      case 'media':
        if (formData.media.length === 0) newErrors.media = '请上传至少一张图片作为封面';
        break;

      case 'settings':
        if (formData.maxParticipants !== undefined && formData.maxParticipants <= 0) {
          newErrors.maxParticipants = '最大参与人数必须大于0';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单字段变化
  const handleChange = (field: keyof EventCreateRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (!touched[field]) setTouched(prev => ({ ...prev, [field]: true }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        if (field === 'startTime' || field === 'endTime') delete newErrors.time;
        return newErrors;
      });
    }
  };

  // 处理媒体上传
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isDraggingMedia, setIsDraggingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const handleMediaUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploadingMedia(true);
    const uploadedMedia: Media[] = [];

    try {
      for (const file of Array.from(files)) {
        // 验证文件类型 (图片或视频)
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) {
          toast.error(`文件 "${file.name}" 格式不支持，请上传图片或视频`);
          continue;
        }

        // 验证文件大小
        const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 视频100MB，图片10MB
        if (file.size > maxSize) {
          toast.error(`文件 "${file.name}" 超过 ${isVideo ? '100MB' : '10MB'} 限制`);
          continue;
        }

        // 上传文件
        let url: string;
        if (isImage) {
          url = await uploadImage(file, 'events');
          uploadedMedia.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'image',
            url,
            name: file.name,
            size: file.size,
            uploadDate: new Date(),
            order: formData.media.length + uploadedMedia.length,
          });
        } else {
          toast.info(`开始上传视频 "${file.name}"，请稍候...`);
          url = await uploadVideo(file);
          uploadedMedia.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'video',
            url,
            name: file.name,
            size: file.size,
            uploadDate: new Date(),
            order: formData.media.length + uploadedMedia.length,
          });
        }
      }

      if (uploadedMedia.length > 0) {
        handleChange('media', [...formData.media, ...uploadedMedia]);
        toast.success(`成功上传 ${uploadedMedia.length} 个文件`);
      }
    } catch (error) {
      console.error('上传失败:', error);
      toast.error('文件上传失败: ' + (error instanceof Error ? error.message : '请稍后重试'));
    } finally {
      setIsUploadingMedia(false);
      setUploadProgress({});
    }
  };

  // 保存草稿
  const handleSaveDraft = async () => {
    try {
      setIsLoading(true);
      setSaveStatus('saving');

      const eventData = {
        title: formData.title,
        description: formData.description,
        content: formData.content,
        start_time: formData.startTime.toISOString(),
        end_time: formData.endTime.toISOString(),
        location: formData.location,
        type: formData.type,
        tags: formData.tags,
        media: formData.media,
        is_public: formData.isPublic,
        contact_name: formData.contactName,
        contact_phone: formData.contactPhone,
        contact_email: formData.contactEmail,
        max_participants: formData.maxParticipants,
        status: 'draft' as const,
        organizer_id: user?.id,
      };

      if (eventId) {
        await eventService.updateEvent(eventId, eventData);
      } else {
        const newEvent = await eventService.createEvent(eventData);
        if (newEvent) {
          setEventId(newEvent.id);
        }
      }

      setSaveStatus('saved');
      setLastSavedTime(new Date());
      toast.success('草稿已保存');
      navigate('/activities');
    } catch (error) {
      toast.error('保存失败，请稍后重试');
      setSaveStatus('unsaved');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理标签选择
  const selectTag = (tag: string) => {
    if (!formData.tags?.includes(tag)) {
      handleChange('tags', [...(formData.tags || []), tag]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  // 处理标签删除
  const removeTag = (tagToRemove: string) => {
    handleChange('tags', formData.tags?.filter(tag => tag !== tagToRemove) || []);
  };

  // 提交发布
  const handlePublish = async () => {
    try {
      const originalStep = currentStep;

      for (const step of steps) {
        setCurrentStep(step.id as StepType);
        if (!validateCurrentStep()) {
          toast.error('请完善所有必填信息');
          return;
        }
      }

      setCurrentStep(originalStep);
      setIsPublishing(true);

      const eventData = {
        title: formData.title,
        description: formData.description,
        content: formData.content,
        start_time: formData.startTime.toISOString(),
        end_time: formData.endTime.toISOString(),
        location: formData.location,
        type: formData.type,
        tags: formData.tags,
        media: formData.media,
        is_public: formData.isPublic,
        contact_name: formData.contactName,
        contact_phone: formData.contactPhone,
        contact_email: formData.contactEmail,
        max_participants: formData.maxParticipants,
        status: 'pending' as const, // 提交审核状态
        // 关联品牌信息
        brand_id: verifiedBrand?.id,
        brand_name: verifiedBrand?.brand_name,
        // 设置组织者
        organizer_id: user?.id,
      };

      let event;
      if (eventId) {
        event = await eventService.updateEvent(eventId, eventData);
      } else {
        event = await eventService.createEvent(eventData);
      }

      if (!event || !event.id) throw new Error('活动创建失败');

      if (!eventId) setEventId(event.id);

      // 提交审核
      const publishSuccess = await eventService.publishEvent(event.id);
      
      if (publishSuccess) {
        toast.success('活动已提交审核，审核通过后将发布到津脉活动平台');
      } else {
        toast.error('提交审核失败');
      }

      navigate('/activities');
    } catch (error) {
      console.error('发布活动失败:', error);
      toast.error('发布失败：' + (error instanceof Error ? error.message : '请稍后重试'));
    } finally {
      setIsPublishing(false);
    }
  };

  // 下一步
  const handleNext = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1].id as StepType;
      handleStepChange(nextStep);
    }
  };

  // 上一步
  const handlePrevious = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1].id as StepType;
      handleStepChange(prevStep, true); // 返回上一步跳过验证
    }
  };

  // 获取保存状态显示
  const getSaveStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>保存中...</span>
          </div>
        );
      case 'saved':
        return lastSavedTime && (
          <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>已保存 {lastSavedTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-4 h-4" />
            <span>未保存</span>
          </div>
        );
    }
  };

  // 如果正在检查品牌状态，显示加载中
  if (isCheckingBrand) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-500">正在检查品牌验证状态...</p>
        </div>
      </div>
    );
  }

  // 如果没有通过品牌验证，显示提示
  if (!verifiedBrand) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Shield className="w-10 h-10 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              需要品牌认证
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              只有经过平台审核认证的品牌才能创建活动。<br />
              请先申请品牌入驻，审核通过后即可创建活动。
            </p>
            <div className="flex gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/business')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                申请品牌入驻
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/activities')}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                返回活动列表
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">创建活动</h1>
              {verifiedBrand && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm">
                  <Building2 className="w-4 h-4" />
                  <span>{verifiedBrand.brand_name}</span>
                  <span className="text-xs opacity-75">(已认证)</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <p className="text-gray-500 dark:text-gray-400">创建并发布您的文化活动</p>
              {getSaveStatusDisplay()}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveDraft}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              <Save className="w-4 h-4" />
              保存草稿
            </motion.button>
          </div>
        </motion.div>

        {/* 三栏布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左栏：步骤导航 (2列) */}
          <div className="lg:col-span-3 xl:col-span-2">
            <div className="sticky top-8">
              <InfoCard title="创建步骤" icon={<Sparkles className="w-5 h-5" />} variant="primary">
                <StepIndicator
                  steps={steps}
                  currentStep={currentStep}
                  onStepChange={(stepId) => handleStepChange(stepId as StepType)}
                  orientation="vertical"
                />
              </InfoCard>

              {/* 帮助提示 */}
              <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-300 text-sm">创建提示</h4>
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                      带 <span className="text-red-500">*</span> 的字段为必填项。填写完成后可预览效果再发布。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 中栏：表单内容 (6列) */}
          <div className="lg:col-span-6 xl:col-span-6">
            {/* 移动端步骤指示器 */}
            <div className="lg:hidden mb-6">
              <StepIndicator
                steps={steps}
                currentStep={currentStep}
                orientation="horizontal"
              />
            </div>

            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-card`}
            >
              {/* 步骤标题 */}
              <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {steps.find(s => s.id === currentStep)?.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {steps.find(s => s.id === currentStep)?.description}
                </p>
              </div>

              {/* 基本信息步骤 */}
              {currentStep === 'basic' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      活动名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      placeholder="给你的活动起个吸引人的名字"
                      className={`w-full px-4 py-3 rounded-xl border text-sm transition-all ${
                        errors.title ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500/20'
                      } ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} focus:outline-none focus:ring-4`}
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                    <p className="mt-1 text-xs text-gray-400">{formData.title.length}/50 字符</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      活动描述 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="简要描述活动内容和亮点"
                      rows={4}
                      className={`w-full px-4 py-3 rounded-xl border text-sm transition-all resize-none ${
                        errors.description ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500/20'
                      } ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} focus:outline-none focus:ring-4`}
                    />
                    {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        开始时间 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.startTime ? new Date(formData.startTime.getTime() - formData.startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                        onChange={(e) => handleChange('startTime', new Date(e.target.value))}
                        className={`w-full px-4 py-3 rounded-xl border text-sm ${
                          isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-200'
                        } focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        结束时间 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.endTime ? new Date(formData.endTime.getTime() - formData.endTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                        onChange={(e) => handleChange('endTime', new Date(e.target.value))}
                        className={`w-full px-4 py-3 rounded-xl border text-sm ${
                          isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-200'
                        } focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20`}
                      />
                    </div>
                  </div>
                  {errors.time && <p className="text-sm text-red-500">{errors.time}</p>}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      活动地点
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                        placeholder="输入活动地点或线上链接"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm ${
                          isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-200'
                        } focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      活动类型
                    </label>
                    <div className="flex gap-3">
                      {['offline', 'online'].map((type) => (
                        <button
                          key={type}
                          onClick={() => handleChange('type', type)}
                          className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                            formData.type === type
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                              : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                          }`}
                        >
                          {type === 'offline' ? '📍 线下活动' : '💻 线上活动'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">联系人</label>
                      <input
                        type="text"
                        value={formData.contactName}
                        onChange={(e) => handleChange('contactName', e.target.value)}
                        placeholder="姓名"
                        className={`w-full px-4 py-3 rounded-xl border text-sm ${
                          isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-200'
                        } focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">联系电话</label>
                      <input
                        type="tel"
                        value={formData.contactPhone}
                        onChange={(e) => handleChange('contactPhone', e.target.value)}
                        placeholder="手机号"
                        className={`w-full px-4 py-3 rounded-xl border text-sm ${
                          errors.contactPhone ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                        } ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20`}
                      />
                      {errors.contactPhone && <p className="mt-1 text-xs text-red-500">{errors.contactPhone}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">联系邮箱</label>
                      <input
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => handleChange('contactEmail', e.target.value)}
                        placeholder="邮箱地址"
                        className={`w-full px-4 py-3 rounded-xl border text-sm ${
                          errors.contactEmail ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                        } ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20`}
                      />
                      {errors.contactEmail && <p className="mt-1 text-xs text-red-500">{errors.contactEmail}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* 活动内容步骤 */}
              {currentStep === 'content' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      活动详情 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => handleChange('content', e.target.value)}
                      placeholder="详细描述活动流程、参与方式、注意事项等..."
                      rows={12}
                      className={`w-full px-4 py-3 rounded-xl border text-sm transition-all resize-none ${
                        errors.content ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500/20'
                      } ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} focus:outline-none focus:ring-4`}
                    />
                    {errors.content && <p className="mt-1 text-sm text-red-500">{errors.content}</p>}
                    <p className="mt-2 text-xs text-gray-500">
                      提示：详细的描述有助于吸引更多参与者。建议包含活动流程、报名方式、注意事项等信息。
                    </p>
                  </div>
                </div>
              )}

              {/* 多媒体步骤 */}
              {currentStep === 'media' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      活动封面 <span className="text-red-500">*</span>
                    </label>
                    <div
                      onClick={() => !isUploadingMedia && document.getElementById('media-upload')?.click()}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isUploadingMedia) setIsDraggingMedia(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingMedia(false);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingMedia(false);
                        if (!isUploadingMedia) {
                          handleMediaUpload(e.dataTransfer.files);
                        }
                      }}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                        errors.media ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 
                        isDraggingMedia ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' :
                        'border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10'
                      } ${isUploadingMedia ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {isUploadingMedia ? (
                        <>
                          <Loader2 className="w-12 h-12 mx-auto text-primary-500 mb-3 animate-spin" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">正在上传...</p>
                        </>
                      ) : isDraggingMedia ? (
                        <>
                          <ImageIcon className="w-12 h-12 mx-auto text-primary-500 mb-3" />
                          <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">释放以上传文件</p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-center gap-4 mb-3">
                            <ImageIcon className="w-10 h-10 text-gray-400" />
                            <span className="text-gray-300">|</span>
                            <Video className="w-10 h-10 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">点击或拖拽上传图片/视频</p>
                          <p className="text-xs text-gray-400 mt-1">图片: JPG、PNG (≤10MB) | 视频: MP4、MOV (≤100MB)</p>
                        </>
                      )}
                      <input
                        id="media-upload"
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        disabled={isUploadingMedia}
                        onChange={(e) => handleMediaUpload(e.target.files)}
                      />
                    </div>
                    {errors.media && <p className="mt-1 text-sm text-red-500">{errors.media}</p>}
                    <p className="mt-2 text-xs text-gray-500">
                      💡 提示：第一张图片将作为活动封面，建议尺寸 1200x630
                    </p>
                  </div>

                  {formData.media.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {formData.media.map((media, index) => (
                        <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          {media.type === 'video' ? (
                            <video
                              src={media.url}
                              className="w-full h-full object-cover"
                              controls
                              preload="metadata"
                            />
                          ) : (
                            <img src={media.url} alt="" className="w-full h-full object-cover" />
                          )}
                          <button
                            onClick={() => handleChange('media', formData.media.filter((_, i) => i !== index))}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 z-10"
                          >
                            ×
                          </button>
                          {media.type === 'video' && (
                            <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                              视频
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 设置步骤 */}
              {currentStep === 'settings' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        最大参与人数
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          value={formData.maxParticipants || ''}
                          onChange={(e) => handleChange('maxParticipants', e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="不限制请留空"
                          min={1}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm ${
                            isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-200'
                          } focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20`}
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isPublic}
                          onChange={(e) => handleChange('isPublic', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">公开活动</span>
                          <p className="text-xs text-gray-500">所有人都可以查看和参与</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.pushToCommunity}
                          onChange={(e) => handleChange('pushToCommunity', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500 mt-0.5"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">同步发布至社群</span>
                          <p className="text-xs text-gray-500 mt-1">将活动推送到相关社群，吸引更多用户参与</p>
                        </div>
                      </label>
                    </div>
                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.applyForRecommendation}
                          onChange={(e) => handleChange('applyForRecommendation', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500 mt-0.5"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">申请平台推荐</span>
                          <p className="text-xs text-gray-500 mt-1">优质活动可申请平台推荐位，获取更多流量</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      活动标签
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => {
                          setTagInput(e.target.value);
                          if (e.target.value.trim()) {
                            const suggestions = presetTags
                              .filter(tag => tag.toLowerCase().includes(e.target.value.toLowerCase()) && !formData.tags?.includes(tag))
                              .slice(0, 5);
                            setTagSuggestions(suggestions);
                            setShowTagSuggestions(suggestions.length > 0);
                          } else {
                            setShowTagSuggestions(false);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && tagInput.trim()) {
                            e.preventDefault();
                            selectTag(tagInput.trim());
                          }
                        }}
                        placeholder="输入标签，按回车添加"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm ${
                          isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-200'
                        } focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20`}
                      />
                      {showTagSuggestions && (
                        <div className={`absolute z-10 mt-1 w-full rounded-xl shadow-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                          {tagSuggestions.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => selectTag(tag)}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {formData.tags && formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                          >
                            {tag}
                            <button
                              onClick={() => removeTag(tag)}
                              className="hover:text-red-500"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">推荐标签：</p>
                      <div className="flex flex-wrap gap-2">
                        {presetTags.filter(tag => !formData.tags?.includes(tag)).slice(0, 8).map((tag) => (
                          <button
                            key={tag}
                            onClick={() => selectTag(tag)}
                            className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                              isDark
                                ? 'border-gray-600 text-gray-400 hover:border-primary-500 hover:text-primary-400'
                                : 'border-gray-300 text-gray-600 hover:border-primary-500 hover:text-primary-600'
                            }`}
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 预览发布步骤 */}
              {currentStep === 'preview' && (
                <div className="space-y-6">
                  <InfoCard variant="success" icon={<CheckCircle2 className="w-5 h-5" />}>
                    <h3 className="font-medium text-emerald-800 dark:text-emerald-300 mb-3">发布前检查</h3>
                    <ul className="space-y-2">
                      {[
                        { condition: formData.title, text: '活动名称已填写' },
                        { condition: formData.description, text: '活动描述已填写' },
                        { condition: formData.content, text: '活动内容已填写' },
                        { condition: formData.media.length > 0, text: '多媒体资源已上传' },
                        { condition: formData.startTime < formData.endTime, text: '活动时间设置正确' },
                      ].map((item, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          {item.condition ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={item.condition ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                            {item.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </InfoCard>

                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">发布选项</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={publishOptions.publishToJinmaiPlatform}
                          onChange={(e) => setPublishOptions(prev => ({ ...prev, publishToJinmaiPlatform: e.target.checked }))}
                          className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">直接发布到津脉活动平台</span>
                          <p className="text-xs text-gray-500">无需等待审核，立即发布</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={publishOptions.notifyFollowers}
                          onChange={(e) => setPublishOptions(prev => ({ ...prev, notifyFollowers: e.target.checked }))}
                          className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">通知我的关注者</span>
                          <p className="text-xs text-gray-500">发布后将通知关注您的用户</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-amber-900/10 border-amber-800' : 'bg-amber-50 border-amber-200'}`}>
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      {publishOptions.publishToJinmaiPlatform
                        ? '提交发布后，活动将直接发布到津脉活动平台，无需等待审核。'
                        : '提交发布后，我们将对活动内容进行审核，审核通过后活动将自动发布。审核通常需要1-2个工作日。'}
                    </p>
                  </div>
                </div>
              )}

              {/* 步骤导航按钮 */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === steps[0].id}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                    currentStep === steps[0].id
                      ? 'opacity-50 cursor-not-allowed text-gray-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                  上一步
                </button>

                {currentStep === steps[steps.length - 1].id ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="flex items-center gap-2 px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl shadow-primary transition-all disabled:opacity-70"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        发布中...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        提交发布
                      </>
                    )}
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNext}
                    className="flex items-center gap-2 px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl shadow-primary transition-all"
                  >
                    下一步
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>

          {/* 右栏：实时预览 (4列) */}
          <div className="lg:col-span-3 xl:col-span-4">
            <div className="sticky top-8">
              <InfoCard title="实时预览" icon={<Eye className="w-5 h-5" />}>
                <div className="relative mx-auto border-8 border-gray-800 dark:border-gray-700 rounded-[2rem] overflow-hidden bg-white dark:bg-gray-900 shadow-2xl" style={{ maxWidth: '280px' }}>
                  {/* 手机刘海 */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-800 dark:bg-gray-700 rounded-b-2xl z-10" />
                  {/* 状态栏 */}
                  <div className="h-8 bg-gray-100 dark:bg-gray-800 flex items-center justify-between px-4 text-xs">
                    <span>9:41</span>
                    <div className="flex gap-1">
                      <span>📶</span>
                      <span>🔋</span>
                    </div>
                  </div>
                  {/* 预览内容 */}
                  <div className="h-[480px] overflow-y-auto scrollbar-hide">
                    <EventPreview event={formData as any} />
                  </div>
                </div>
                <p className="text-center text-xs text-gray-500 mt-4">手机端预览效果</p>
              </InfoCard>

              {/* 快捷帮助 */}
              <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 text-sm mb-2">💡 创建小贴士</h4>
                <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-400">
                  <li>• 吸引人的标题能增加点击率</li>
                  <li>• 详细的描述有助于用户了解活动</li>
                  <li>• 精美的封面图能提升视觉效果</li>
                  <li>• 合适的标签有助于搜索发现</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
