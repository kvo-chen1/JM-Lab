import { useState, useContext, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { EventUpdateRequest, Media } from '@/types';
import { useEventService } from '@/hooks/useEventService';
import { supabase } from '@/lib/supabase';
import { StepIndicator } from '@/components/StepIndicator';
import { InfoCard } from '@/components/InfoCard';
import { EventPreview } from '@/components/EventPreview';
import { uploadImage } from '@/services/imageService';
import EventTypeSelector from '@/components/events/EventTypeSelector';
import SubmissionGuide from '@/components/submit/SubmissionGuide';
import { PrizeManager } from '@/components/prize';
import { Prize, PrizeCreateRequest } from '@/types/prize';
import { prizeService } from '@/services/prizeService';

import {
  Save,
  AlertCircle,
  CheckCircle2,
  Info,
  MapPin,
  Users,
  Tag,
  Image as ImageIcon,
  Eye,
  ChevronRight,
  ChevronLeft,
  Send,
  Loader2,
  ArrowLeft,
  RotateCcw,
  Gift
} from 'lucide-react';



// 步骤配置
const steps = [
  { id: 'basic' as StepType, name: '基本信息', description: '修改活动名称、时间地点' },
  { id: 'type' as StepType, name: '活动类型', description: '选择活动作品类型' },
  { id: 'content' as StepType, name: '活动内容', description: '编辑活动详细内容' },
  { id: 'media' as StepType, name: '多媒体', description: '更新图片和视频' },
  { id: 'prizes' as StepType, name: '奖品设置', description: '配置活动奖品和奖励' },
  { id: 'settings' as StepType, name: '设置', description: '修改参与规则和标签' },
  { id: 'preview' as StepType, name: '预览发布', description: '确认并更新活动' },
];

// 活动类型步骤类型
type StepType = 'basic' | 'type' | 'content' | 'media' | 'prizes' | 'settings' | 'preview';

// 预设标签列表
const presetTags = ['文化展览', '演出活动', '讲座论坛', '节日庆典', '亲子活动', '体育赛事', '公益活动', '艺术创作', '非遗传承', '文创设计', '历史文化', '民俗文化', '红色文化', '天津特色'];

export default function EditActivity() {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id: eventId } = useParams<{ id: string }>();
  const { getEvent, updateEvent, publishEvent } = useEventService();

  // 活动原始状态
  const [originalStatus, setOriginalStatus] = useState<string>('');
  const [canEdit, setCanEdit] = useState(true);

  // 当前步骤
  const [currentStep, setCurrentStep] = useState<StepType>('basic');

  // 活动数据
  const [eventData, setEventData] = useState<EventUpdateRequest>({
    title: '',
    description: '',
    content: '',
    startTime: new Date(),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    type: 'offline',
    tags: [],
    media: [],
    isPublic: true,
    eventType: 'document',
    submissionRequirements: undefined,
    submissionTemplates: [],
  });

  // 原始数据（用于比较变化）
  const [originalData, setOriginalData] = useState<EventUpdateRequest | null>(null);

  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // 表单验证错误
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 标签管理相关状态
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  // 奖品相关状态
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [isLoadingPrizes, setIsLoadingPrizes] = useState(false);

  // 检查登录状态并加载活动数据
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    if (!eventId) {
      toast.error('活动ID不存在');
      navigate('/activities');
      return;
    }

    loadEventData();
  }, [isAuthenticated, user, navigate, eventId]);

  // 加载活动数据
  const loadEventData = async () => {
    if (!eventId) return;

    try {
      setIsLoading(true);
      const event = await getEvent(eventId);

      // 检查编辑权限
      if (user?.id) {
        try {
          // 使用 RPC 函数查询活动的 organizer_id 和状态（绕过 RLS）
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_events_simple', {
            p_user_id: user.id
          });
          
          // 从 RPC 返回的数据中找到当前活动
          const eventCheck = rpcData?.find((e: any) => e.id === eventId);
          
          console.log('权限检查调试:', {
            eventId,
            userId: user.id,
            organizerId: eventCheck?.organizer_id,
            status: eventCheck?.status,
            match: eventCheck?.organizer_id === user.id,
            rpcError: rpcError?.message
          });
          
          if (rpcError) {
            console.error('RPC 查询活动失败:', rpcError);
          }
          
          // 检查权限：用户是组织者
          const canEditEvent = eventCheck?.organizer_id === user.id;
          
          setCanEdit(canEditEvent);
          if (!canEditEvent) {
            const errorMsg = eventCheck?.organizer_id 
              ? `您没有权限编辑此活动。活动组织者ID: ${eventCheck.organizer_id}, 您的ID: ${user.id}`
              : '您没有权限编辑此活动（活动无组织者信息）';
            toast.error(errorMsg);
            navigate('/organizer');
            return;
          }
        } catch (error) {
          console.error('权限检查失败:', error);
          toast.error('权限检查失败');
          navigate('/organizer');
          return;
        }
      }

      // 保存原始状态
      setOriginalStatus(event.status || 'draft');

      // 确保 startTime 和 endTime 是 Date 对象
      const startTime = event.startTime instanceof Date 
        ? event.startTime 
        : event.startTime 
          ? new Date(event.startTime) 
          : new Date();
      
      const endTime = event.endTime instanceof Date 
        ? event.endTime 
        : event.endTime 
          ? new Date(event.endTime) 
          : new Date(Date.now() + 24 * 60 * 60 * 1000);

      const data = {
        title: event.title,
        description: event.description,
        content: event.content || '',
        startTime,
        endTime,
        location: event.location || '',
        type: event.type || 'offline',
        tags: event.tags || [],
        media: event.media || [],
        isPublic: event.isPublic ?? true,
        maxParticipants: event.maxParticipants,
      };

      setEventData(data);
      setOriginalData(data);

      // 加载奖品数据
      await loadPrizes(eventId);

      setIsLoading(false);
    } catch (error) {
      toast.error('加载活动数据失败，请稍后重试');
      navigate('/activities');
    }
  };

  // 加载奖品数据
  const loadPrizes = async (eventId: string) => {
    setIsLoadingPrizes(true);
    try {
      const prizeData = await prizeService.getPrizesByEventId(eventId);
      setPrizes(prizeData);
    } catch (error) {
      console.error('加载奖品数据失败:', error);
    } finally {
      setIsLoadingPrizes(false);
    }
  };

  // 处理步骤切换
  const handleStepChange = (step: StepType) => {
    if (!validateCurrentStep()) return;
    setCurrentStep(step);
  };

  // 验证当前步骤
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 'basic':
        if (!eventData.title?.trim()) newErrors.title = '请输入活动名称';
        if (!eventData.description?.trim()) newErrors.description = '请输入活动描述';
        if (eventData.startTime && eventData.endTime && eventData.startTime >= eventData.endTime) {
          newErrors.time = '开始时间必须早于结束时间';
        }
        break;

      case 'content':
        if (!eventData.content?.trim()) newErrors.content = '请输入活动内容';
        break;

      case 'media':
        if (!eventData.media || eventData.media.length === 0) newErrors.media = '请上传至少一张图片';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单字段变化
  const handleChange = (field: keyof EventUpdateRequest, value: any) => {
    setEventData(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  // 处理媒体上传
  const handleMediaUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const url = await uploadImage(file, 'event-media');
        return { url, type: file.type.startsWith('video/') ? 'video' : 'image' } as Media;
      });

      const uploadedMedia = await Promise.all(uploadPromises);
      const currentMedia = eventData.media || [];
      handleChange('media', [...currentMedia, ...uploadedMedia]);
      toast.success(`成功上传 ${uploadedMedia.length} 个文件`);
    } catch (error: any) {
      console.error('上传失败:', error);
      toast.error('上传失败: ' + (error.message || '未知错误'));
    }
  };

  // 处理标签选择
  const selectTag = (tag: string) => {
    if (!eventData.tags?.includes(tag)) {
      handleChange('tags', [...(eventData.tags || []), tag]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  // 处理标签删除
  const removeTag = (tagToRemove: string) => {
    handleChange('tags', eventData.tags?.filter(tag => tag !== tagToRemove) || []);
  };

  // 更新活动
  const handleUpdate = async () => {
    if (!eventId || !user?.id) return;

    try {
      for (const step of steps) {
        setCurrentStep(step.id as StepType);
        if (!validateCurrentStep()) {
          toast.error('请完善所有必填信息');
          return;
        }
      }

      setIsUpdating(true);

      // 根据原始状态决定更新方式
      if (originalStatus === 'published' || originalStatus === 'rejected') {
        // 已发布或已拒绝的活动需要重新提交审核
        await updateEvent(eventId, eventData);
        // 保存奖品信息
        await savePrizes(eventId);
        // 重新提交审核
        await publishEvent(eventId);
        toast.success('活动已更新并重新提交审核');
        navigate('/organizer');
      } else {
        // 草稿或审核中的活动直接更新
        await updateEvent(eventId, eventData);
        // 保存奖品信息
        await savePrizes(eventId);
        toast.success('活动已更新');
        navigate('/organizer');
      }
    } catch (error) {
      toast.error('更新活动失败，请稍后重试');
    } finally {
      setIsUpdating(false);
    }
  };

  // 保存奖品信息
  const savePrizes = async (eventId: string) => {
    if (prizes.length === 0) return;

    try {
      // 删除旧的奖品
      await prizeService.deletePrizesByEventId(eventId);
      // 创建新奖品
      const prizeRequests: PrizeCreateRequest[] = prizes.map(p => ({
        level: p.level,
        rankName: p.rankName,
        combinationType: p.combinationType,
        singlePrize: p.singlePrize,
        subPrizes: p.subPrizes,
        displayOrder: p.displayOrder,
        isHighlight: p.isHighlight,
        highlightColor: p.highlightColor,
      }));
      await prizeService.createPrizes(eventId, prizeRequests);
    } catch (error) {
      console.error('保存奖品失败:', error);
      toast.error('保存奖品信息失败');
    }
  };

  // 提交发布/重新审核
  const handlePublish = async () => {
    if (!eventId || !user?.id) return;

    try {
      for (const step of steps) {
        setCurrentStep(step.id as StepType);
        if (!validateCurrentStep()) {
          toast.error('请完善所有必填信息');
          return;
        }
      }

      setIsPublishing(true);

      // 根据原始状态决定操作
      if (originalStatus === 'published' || originalStatus === 'rejected') {
        // 已发布或已拒绝的活动：更新并重新提交审核
        await updateEvent(eventId, eventData);
        // 保存奖品信息
        await savePrizes(eventId);
        // 重新提交审核
        await publishEvent(eventId);
        toast.success('活动已更新并重新提交审核');
        navigate('/organizer');
      } else if (originalStatus === 'draft') {
        // 草稿状态：先更新再提交审核
        await updateEvent(eventId, eventData);
        // 保存奖品信息
        await savePrizes(eventId);
        await publishEvent(eventId);
        toast.success('活动已提交审核，请等待管理员审批');
        navigate('/organizer');
      } else {
        // 审核中状态：直接更新
        await updateEvent(eventId, eventData);
        // 保存奖品信息
        await savePrizes(eventId);
        toast.success('活动已更新');
        navigate('/organizer');
      }
    } catch (error) {
      toast.error('发布活动失败，请稍后重试');
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
      handleStepChange(prevStep);
    }
  };

  // 检查是否有修改
  const hasChanges = () => {
    if (!originalData) return false;
    return JSON.stringify(eventData) !== JSON.stringify(originalData);
  };

  // 重置修改
  const handleReset = () => {
    if (originalData) {
      setEventData(originalData);
      toast.success('已重置为原始数据');
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <motion.div
            className="inline-block"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full" />
          </motion.div>
          <p className="mt-4 text-gray-500">加载中...</p>
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/organizer')}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">编辑活动</h1>
              <div className="mt-2 flex items-center gap-4">
                <p className="text-gray-500 dark:text-gray-400">修改活动信息</p>
                {hasChanges() && (
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    有未保存的修改
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges() && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                重置
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* 三栏布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左栏：步骤导航 (2列) */}
          <div className="lg:col-span-3 xl:col-span-2">
            <div className="sticky top-8">
              <InfoCard title="编辑步骤" icon={<Info className="w-5 h-5" />} variant="primary">
                <StepIndicator
                  steps={steps}
                  currentStep={currentStep}
                  onStepChange={(stepId) => handleStepChange(stepId as StepType)}
                  orientation="vertical"
                />
              </InfoCard>

              {/* 修改提示 */}
              <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-300 text-sm">编辑提示</h4>
                    <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
                      修改已发布的活动需要重新审核。草稿状态的活动修改后会自动保存。
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
                      value={eventData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      placeholder="给你的活动起个吸引人的名字"
                      className={`w-full px-4 py-3 rounded-xl border text-sm transition-all ${
                        errors.title ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500/20'
                      } ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} focus:outline-none focus:ring-4`}
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      活动描述 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={eventData.description}
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
                        value={eventData.startTime instanceof Date 
                          ? new Date(eventData.startTime.getTime() - eventData.startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) 
                          : ''}
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
                        value={eventData.endTime instanceof Date 
                          ? new Date(eventData.endTime.getTime() - eventData.endTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) 
                          : ''}
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
                        value={eventData.location || ''}
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
                            eventData.type === type
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                              : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                          }`}
                        >
                          {type === 'offline' ? '📍 线下活动' : '💻 线上活动'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 活动类型步骤 */}
              {currentStep === 'type' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      选择活动作品类型 <span className="text-red-500">*</span>
                    </label>
                    <EventTypeSelector
                      value={eventData.eventType || 'document'}
                      onChange={(type) => handleChange('eventType', type)}
                    />
                  </div>

                  <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                      参赛者将看到的上传指引
                    </h4>
                    <SubmissionGuide
                      eventType={eventData.eventType || 'document'}
                      requirements={eventData.submissionRequirements}
                      templates={eventData.submissionTemplates}
                    />
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
                      value={eventData.content}
                      onChange={(e) => handleChange('content', e.target.value)}
                      placeholder="详细描述活动流程、参与方式、注意事项等..."
                      rows={12}
                      className={`w-full px-4 py-3 rounded-xl border text-sm transition-all resize-none ${
                        errors.content ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500/20'
                      } ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} focus:outline-none focus:ring-4`}
                    />
                    {errors.content && <p className="mt-1 text-sm text-red-500">{errors.content}</p>}
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
                      onClick={() => document.getElementById('media-upload')?.click()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                        errors.media ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10'
                      }`}
                    >
                      <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">点击或拖拽上传图片或视频</p>
                      <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG、MP4 格式</p>
                      <input
                        id="media-upload"
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleMediaUpload(e.target.files)}
                      />
                    </div>
                    {errors.media && <p className="mt-1 text-sm text-red-500">{errors.media}</p>}
                  </div>

                  {eventData.media && eventData.media.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {eventData.media.map((media, index) => (
                        <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                          {media.type === 'video' ? (
                            <video src={media.url} className="w-full h-full object-cover" controls />
                          ) : (
                            <img src={media.url} alt="" className="w-full h-full object-cover" />
                          )}
                          <button
                            onClick={() => handleChange('media', eventData.media?.filter((_, i) => i !== index) || [])}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 奖品设置步骤 */}
              {currentStep === 'prizes' && (
                <div className="space-y-6">
                  {isLoadingPrizes ? (
                    <div className="flex items-center justify-center py-12">
                      <motion.div
                        className="inline-block"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <div className="w-8 h-8 border-4 border-yellow-200 border-t-yellow-500 rounded-full" />
                      </motion.div>
                      <span className="ml-3 text-gray-500">加载奖品信息...</span>
                    </div>
                  ) : (
                    <PrizeManager
                      eventId={eventId || 'temp'}
                      initialPrizes={prizes}
                      onPrizesChange={(newPrizes) => setPrizes(newPrizes)}
                    />
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
                          value={eventData.maxParticipants || ''}
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
                          checked={eventData.isPublic}
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
                              .filter(tag => tag.toLowerCase().includes(e.target.value.toLowerCase()) && !eventData.tags?.includes(tag))
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

                    {eventData.tags && eventData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {eventData.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                          >
                            {tag}
                            <button onClick={() => removeTag(tag)} className="hover:text-red-500">×</button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">推荐标签：</p>
                      <div className="flex flex-wrap gap-2">
                        {presetTags.filter(tag => !eventData.tags?.includes(tag)).slice(0, 8).map((tag) => (
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
                  <InfoCard variant={hasChanges() ? 'warning' : 'success'} icon={hasChanges() ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}>
                    <h3 className="font-medium mb-3">{hasChanges() ? '修改确认' : '无修改'}</h3>
                    <ul className="space-y-2">
                      {[
                        { condition: eventData.title, text: '活动名称已填写' },
                        { condition: eventData.description, text: '活动描述已填写' },
                        { condition: eventData.content, text: '活动内容已填写' },
                        { condition: (eventData.media?.length || 0) > 0, text: '多媒体资源已上传' },
                        { condition: eventData.startTime && eventData.endTime && eventData.startTime < eventData.endTime, text: '活动时间设置正确' },
                        { condition: prizes.length > 0, text: `已设置 ${prizes.length} 个奖品` },
                      ].map((item, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          {item.condition ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                          )}
                          <span className={item.condition ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                            {item.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </InfoCard>

                  {/* 奖品预览 */}
                  {prizes.length > 0 && (
                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        奖品设置预览
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {prizes.slice(0, 6).map((prize, index) => (
                          <div key={prize.id} className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-gray-800">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: prize.highlightColor }}
                            >
                              {prize.level}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{prize.rankName}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {prize.combinationType === 'compound'
                                  ? `${prize.subPrizes?.length || 0} 项组合`
                                  : prize.singlePrize?.name}
                              </p>
                            </div>
                          </div>
                        ))}
                        {prizes.length > 6 && (
                          <div className="flex items-center justify-center p-2 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-500">
                            +{prizes.length - 6} 更多
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {hasChanges() && (
                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-amber-900/10 border-amber-800' : 'bg-amber-50 border-amber-200'}`}>
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        {originalStatus === 'published'
                          ? '⚠️ 您正在编辑已发布的活动。保存后活动将重新提交审核，审核通过后才能再次发布。'
                          : originalStatus === 'rejected'
                          ? '⚠️ 您正在编辑已拒绝的活动。保存后将重新提交审核。'
                          : '您已对活动进行了修改。保存后将提交审核。'}
                      </p>
                    </div>
                  )}
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
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUpdate}
                      disabled={isUpdating || !hasChanges()}
                      className="flex items-center gap-2 px-6 py-3 border border-primary-500 text-primary-600 dark:text-primary-400 font-medium rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all disabled:opacity-50"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          {originalStatus === 'published' ? '保存并重新审核' : 
                           originalStatus === 'rejected' ? '保存并重新提交' : '保存修改'}
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePublish}
                      disabled={isPublishing || !hasChanges()}
                      className="flex items-center gap-2 px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl shadow-primary transition-all disabled:opacity-70"
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {originalStatus === 'published' ? '重新提交中...' : '提交中...'}
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          {originalStatus === 'published' ? '保存并重新发布' : 
                           originalStatus === 'rejected' ? '重新提交审核' : 
                           originalStatus === 'draft' ? '提交审核' : '保存修改'}
                        </>
                      )}
                    </motion.button>
                  </div>
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
                    <EventPreview event={eventData as any} />
                  </div>
                </div>
                <p className="text-center text-xs text-gray-500 mt-4">手机端预览效果</p>
              </InfoCard>

              {/* 修改对比 */}
              {hasChanges() && originalData && (
                <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                  <h4 className="font-medium text-amber-800 dark:text-amber-300 text-sm mb-2">📝 修改内容</h4>
                  <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-400">
                    {eventData.title !== originalData.title && <li>• 活动名称已修改</li>}
                    {eventData.description !== originalData.description && <li>• 活动描述已修改</li>}
                    {eventData.content !== originalData.content && <li>• 活动内容已修改</li>}
                    {JSON.stringify(eventData.tags) !== JSON.stringify(originalData.tags) && <li>• 活动标签已修改</li>}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
