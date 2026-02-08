import { useState, useContext, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { EventCreateRequest, Media } from '@/types';
import { useEventService } from '@/hooks/useEventService';

// 导入UI组件
import { TianjinButton, TianjinImage } from '@/components/TianjinStyleComponents';
import { Input, Textarea, Select, DatePicker, Checkbox, FileUpload } from '@/components/ui/Form';
import { RichTextEditor } from '@/components/RichTextEditor';
import { MediaGallery } from '@/components/MediaGallery';
import { EventPreview } from '@/components/EventPreview';

// 活动创建步骤类型
type StepType = 'basic' | 'content' | 'media' | 'settings' | 'preview';

// 步骤配置
const steps: Array<{
  id: StepType;
  name: string;
  icon: string;
}> = [
  { id: 'basic', name: '基本信息', icon: 'info-circle' },
  { id: 'content', name: '活动内容', icon: 'file-alt' },
  { id: 'media', name: '多媒体', icon: 'images' },
  { id: 'settings', name: '设置', icon: 'cog' },
  { id: 'preview', name: '预览发布', icon: 'eye' },
];

export default function CreateActivity() {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { createEvent, publishEvent, publishToJinmaiPlatform, updateEvent, getUserEvents } = useEventService();
  
  // 当前步骤
  const [currentStep, setCurrentStep] = useState<StepType>('basic');
  
  // 表单数据
  const [formData, setFormData] = useState<EventCreateRequest>({
    title: '',
    description: '',
    content: '',
    startTime: new Date(),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 默认24小时后结束
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
    maxParticipants: undefined,
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
  
  // 版本管理相关状态
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versions, setVersions] = useState<Array<{
    id: string;
    createdAt: Date;
    title: string;
    description: string;
  }>>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  
  // 分享相关状态
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  
  // 标签管理相关状态
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [selectedTagIndex, setSelectedTagIndex] = useState(-1);
  
  // 预设标签列表
  const presetTags = ['文化展览', '演出活动', '讲座论坛', '节日庆典', '亲子活动', '体育赛事', '公益活动', '艺术创作', '非遗传承', '文创设计', '历史文化', '民俗文化', '红色文化', '天津特色'];
  
  // 天津特色配色方案
  const tianjinColors = {
    primary: '#0066CC', // 天津蓝 - 主色调
    secondary: '#FF6B35', // 天津橙 - 辅助色
    accent: '#F7931E', // 天津金 - 强调色
    success: '#22C55E', // 成功色
    warning: '#EAB308', // 警告色
    error: '#EF4444', // 错误色
  };
  
  // 检查登录状态和加载草稿
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    
    // 加载最近的草稿
    const loadDraft = async () => {
      try {
        setIsLoading(true);
        // 获取用户最近的草稿活动
        const userEvents = await getUserEvents(user.id, {
          status: 'draft',
          limit: 1,
          sort: 'updated_at',
          order: 'desc'
        });
        
        if (userEvents.length > 0) {
          const draft = userEvents[0];
          setFormData({
            title: draft.title,
            description: draft.description,
            content: draft.content,
            startTime: new Date(draft.startTime),
            endTime: new Date(draft.endTime),
            location: draft.location,
            type: draft.type,
            tags: draft.tags,
            media: draft.media,
            isPublic: draft.isPublic,
            contactName: draft.contactName,
            contactPhone: draft.contactPhone,
            contactEmail: draft.contactEmail,
          });
          setEventId(draft.id);
          setLastSavedTime(new Date(draft.updatedAt));
          toast.success('已加载最近的草稿');
        }
      } catch (error) {
        console.error('加载草稿失败:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDraft();
  }, [isAuthenticated, user, navigate, getUserEvents]);
  
  // 自动保存草稿
  useEffect(() => {
    // 清除之前的定时器
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // 设置为未保存状态
    setSaveStatus('unsaved');
    
    // 防抖：5秒后自动保存
    autoSaveTimerRef.current = setTimeout(async () => {
      // 只有当表单有数据时才保存
      if (formData.title || formData.description || formData.content) {
        try {
          setSaveStatus('saving');
          
          if (eventId) {
            // 更新现有草稿
            await updateEvent(eventId, {
              ...formData,
              status: 'draft'
            });
          } else {
            // 创建新草稿
            const newEvent = await createEvent({
              ...formData,
              status: 'draft'
            });
            setEventId(newEvent.id);
          }
          
          setSaveStatus('saved');
          setLastSavedTime(new Date());
        } catch (error) {
            console.error('自动保存失败:', error);
            setSaveStatus('unsaved');
          }
      }
    }, 5000);
    
    // 清理函数
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData, createEvent, updateEvent, eventId]);
  
  // 处理步骤切换
  const handleStepChange = (step: StepType) => {
    // 验证当前步骤
    if (!validateCurrentStep()) {
      return;
    }
    setCurrentStep(step);
  };
  
  // 验证当前步骤
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    const now = new Date();
    
    switch (currentStep) {
      case 'basic':
        if (!formData.title.trim()) {
          newErrors.title = '请输入活动名称';
        } else if (formData.title.length < 2) {
          newErrors.title = '活动名称至少需要2个字符';
        } else if (formData.title.length > 50) {
          newErrors.title = '活动名称不能超过50个字符';
        }

        if (!formData.description.trim()) {
          newErrors.description = '请输入活动描述';
        } else if (formData.description.length < 5) {
          newErrors.description = '活动描述至少需要5个字符';
        }

        // 时间验证
        if (formData.startTime) {
           // 允许稍微过去一点的时间（比如几分钟前），避免操作过程中的时间流逝导致校验失败
           // 这里暂时不强制校验“必须是未来时间”，但结束时间必须晚于开始时间
           if (isNaN(formData.startTime.getTime())) {
             newErrors.startTime = '无效的开始时间';
           }
        }
        
        if (formData.endTime) {
           if (isNaN(formData.endTime.getTime())) {
             newErrors.endTime = '无效的结束时间';
           }
        }

        if (formData.startTime && formData.endTime) {
          if (formData.startTime >= formData.endTime) {
            newErrors.time = '结束时间必须晚于开始时间';
          } else if (formData.endTime.getTime() - formData.startTime.getTime() < 30 * 60 * 1000) {
            // 活动时长至少30分钟
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
        // 至少需要一张缩略图
        if (formData.media.length === 0) {
          newErrors.media = '请上传至少一张图片作为封面';
        }
        break;
        
      case 'settings':
         if (formData.maxParticipants !== undefined && formData.maxParticipants <= 0) {
           newErrors.maxParticipants = '最大参与人数必须大于0';
         }
         break;

      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单字段变化
  const handleChange = (field: keyof EventCreateRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 标记为已触摸
    if (!touched[field]) {
        setTouched(prev => ({ ...prev, [field]: true }));
    }
    
    // 实时验证（仅清除当前字段的错误，或者如果已触摸则重新验证该字段）
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        // 如果是时间相关的，可能需要同时清除 time 错误
        if (field === 'startTime' || field === 'endTime') {
            delete newErrors.time;
        }
        return newErrors;
      });
    }
  };

  // 处理字段Blur事件
  const handleBlur = (field: string) => {
      setTouched(prev => ({ ...prev, [field]: true }));
      // 可以在这里触发单个字段的验证逻辑，但为了简化，我们依赖提交时的完整验证或实时的输入反馈
  };
  
  // 处理媒体上传
  const handleMediaUpload = (newMedia: Media[]) => {
    setFormData(prev => ({
      ...prev,
      media: newMedia
    }));
    
    if (errors.media) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.media;
        return newErrors;
      });
    }
  };
  
  // 保存草稿
  const handleSaveDraft = async () => {
    try {
      setIsLoading(true);
      setSaveStatus('saving');
      
      if (eventId) {
        // 更新现有草稿
        await updateEvent(eventId, {
          ...formData,
          status: 'draft'
        });
      } else {
        // 创建新草稿
        const newEvent = await createEvent({
          ...formData,
          status: 'draft'
        });
        setEventId(newEvent.id);
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
  
  // 获取版本历史
  const fetchVersions = async () => {
    if (!eventId) return;
    
    try {
      setIsLoadingVersions(true);
      // 实际实现中，这里应该调用API获取版本历史
      // 暂时返回空数组，避免显示模拟数据
      setVersions([]);
    } catch (error) {
      toast.error('获取版本历史失败');
      console.error('获取版本历史失败:', error);
    } finally {
      setIsLoadingVersions(false);
    }
  };
  
  // 恢复到特定版本
  const restoreVersion = async (versionId: string) => {
    try {
      setIsLoading(true);
      // 模拟恢复版本
      // 实际实现中，这里应该调用API获取特定版本的详细信息
      toast.success('已恢复到选定版本');
      setShowVersionHistory(false);
    } catch (error) {
      toast.error('恢复版本失败');
      console.error('恢复版本失败:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 打开版本历史
  const openVersionHistory = () => {
    fetchVersions();
    setShowVersionHistory(true);
  };
  
  // 生成分享链接
  const generateShareUrl = () => {
    if (eventId) {
      const url = `${window.location.origin}/events/${eventId}`;
      setShareUrl(url);
      return url;
    }
    setShareUrl('');
    return '';
  };
  
  // 复制分享链接到剪贴板
  const copyShareUrl = async () => {
    const url = generateShareUrl();
    if (url) {
      try {
        await navigator.clipboard.writeText(url);
        setCopiedToClipboard(true);
        toast.success('链接已复制到剪贴板');
        setTimeout(() => setCopiedToClipboard(false), 2000);
      } catch (error) {
        toast.error('复制链接失败，请手动复制');
        console.error('复制链接失败:', error);
      }
    }
  };
  
  // 社交媒体分享
  const shareToSocialMedia = (platform: 'wechat' | 'weibo' | 'qq') => {
    const url = generateShareUrl();
    const title = formData.title || '天津文化活动';
    const description = formData.description || '欢迎参加我们的活动';
    
    let shareUrl = '';
    
    switch (platform) {
      case 'weibo':
        shareUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`;
        break;
      case 'qq':
        shareUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(description)}`;
        break;
      case 'wechat':
        // 微信分享需要特殊处理，这里只显示提示
        toast.info('请使用微信扫描二维码分享');
        return;
    }
    
    // 打开分享窗口
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };
  
  // 打开分享选项
  const openShareOptions = () => {
    generateShareUrl();
    setShowShareOptions(true);
  };
  
  // 生成标签建议
  const generateTagSuggestions = (input: string) => {
    if (!input.trim()) {
      return [];
    }
    
    const lowerInput = input.toLowerCase();
    const usedTags = formData.tags || [];
    
    // 从预设标签中过滤匹配的建议
    const matchingTags = presetTags
      .filter(tag => tag.toLowerCase().includes(lowerInput) && !usedTags.includes(tag))
      .slice(0, 5);
    
    return matchingTags;
  };
  
  // 处理标签输入变化
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    
    if (value.trim()) {
      const suggestions = generateTagSuggestions(value);
      setTagSuggestions(suggestions);
      setShowTagSuggestions(suggestions.length > 0);
      setSelectedTagIndex(-1);
    } else {
      setShowTagSuggestions(false);
      setTagSuggestions([]);
      setSelectedTagIndex(-1);
    }
  };
  
  // 处理标签选择
  const selectTag = (tag: string) => {
    if (!formData.tags?.includes(tag)) {
      handleChange('tags', [...(formData.tags || []), tag]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
    setTagSuggestions([]);
    setSelectedTagIndex(-1);
  };
  
  // 处理标签输入键盘事件
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 回车键处理
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedTagIndex >= 0 && tagSuggestions.length > 0) {
        // 选择当前高亮的建议标签
        selectTag(tagSuggestions[selectedTagIndex]);
      } else if (tagInput.trim()) {
        // 添加自定义标签
        selectTag(tagInput.trim());
      }
      return;
    }
    
    // 上下箭头处理
    if (showTagSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedTagIndex(prev => {
          if (prev < tagSuggestions.length - 1) {
            return prev + 1;
          }
          return prev;
        });
        return;
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedTagIndex(prev => {
          if (prev > 0) {
            return prev - 1;
          }
          return -1;
        });
        return;
      }
      
      // Escape键关闭建议
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowTagSuggestions(false);
        setSelectedTagIndex(-1);
        return;
      }
    }
  };
  
  // 处理标签删除
  const removeTag = (tagToRemove: string) => {
    handleChange('tags', formData.tags?.filter(tag => tag !== tagToRemove) || []);
  };
  
  // 提交发布
  const handlePublish = async () => {
    try {
      // 保存原始步骤
      const originalStep = currentStep;
      
      // 验证所有步骤
      for (const step of steps) {
        setCurrentStep(step.id as StepType);
        if (!validateCurrentStep()) {
          toast.error('请完善所有必填信息');
          return;
        }
      }
      
      // 恢复原始步骤
      setCurrentStep(originalStep);
      
      setIsPublishing(true);

      let event;
      if (eventId) {
        // 更新现有活动
        event = await updateEvent(eventId, {
          ...formData,
          status: 'published'
        });
      } else {
        // 创建新活动
        event = await createEvent({
          ...formData,
          status: 'published'
        });
      }

      // 检查活动是否创建/更新成功
      if (!event || !event.id) {
        throw new Error('活动创建失败：服务器返回数据无效');
      }

      // 保存活动ID
      if (!eventId) {
        setEventId(event.id);
      }

      // 根据选择发布到相应平台
      if (publishOptions.publishToJinmaiPlatform) {
        // 直接发布到津脉活动平台
        // 构造符合接口要求的参数
        const publishData = {
          title: formData.title,
          description: formData.description,
          startDate: formData.startTime.toISOString(),
          endDate: formData.endTime.toISOString(),
          requirements: '无', // 默认值
          rewards: '无', // 默认值
          visibility: formData.isPublic ? 'public' : 'private' as 'public' | 'private',
          notifyFollowers: publishOptions.notifyFollowers
        };

        await publishToJinmaiPlatform(event.id, publishData);
        toast.success('活动已成功发布到津脉活动平台');
      } else {
        // 提交发布审核
        await publishEvent(event.id, {
          eventId: event.id,
          notifyFollowers: publishOptions.notifyFollowers
        });
        toast.success('活动已提交审核，我们会尽快处理');
      }

      // 跳转到活动列表页面
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
      handleStepChange(prevStep);
    }
  };
  
  return (
    <main className="container mx-auto px-4 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">创建活动</h1>
            {/* 保存状态指示器 */}
            <div className="flex items-center mt-2.5">
              {saveStatus === 'saving' && (
                <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full shadow-sm">
                  <i className="fas fa-spinner fa-spin mr-1.5"></i>
                  <span>保存中...</span>
                </div>
              )}
              {saveStatus === 'saved' && lastSavedTime && (
                <div className="flex items-center text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full shadow-sm">
                  <i className="fas fa-check-circle mr-1.5"></i>
                  <span>已保存</span>
                  <span className="ml-2 text-gray-500 dark:text-gray-400">
                    {lastSavedTime.toLocaleTimeString('zh-CN')}
                  </span>
                </div>
              )}
              {saveStatus === 'unsaved' && (
                <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-3 py-1 rounded-full shadow-sm">
                  <i className="fas fa-exclamation-triangle mr-1.5"></i>
                  <span>未保存</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-3 sm:mt-0">
            {/* 分享按钮 */}
            <button
              onClick={openShareOptions}
              disabled={!eventId}
              className={`px-5 py-2.5 rounded-lg transition-all duration-300 flex items-center gap-2 font-medium shadow-md ${!eventId 
                ? 'opacity-50 cursor-not-allowed' 
                : isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-white hover:shadow-lg hover:-translate-y-0.5' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800 hover:shadow-lg hover:-translate-y-0.5'}`}
            >
              <i className="fas fa-share-alt"></i>
              分享
            </button>
            {/* 版本历史按钮 */}
            <button
              onClick={openVersionHistory}
              disabled={!eventId}
              className={`px-5 py-2.5 rounded-lg transition-all duration-300 flex items-center gap-2 font-medium shadow-md ${!eventId 
                ? 'opacity-50 cursor-not-allowed' 
                : isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-white hover:shadow-lg hover:-translate-y-0.5' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800 hover:shadow-lg hover:-translate-y-0.5'}`}
            >
              <i className="fas fa-history"></i>
              版本历史
            </button>
            {/* 保存草稿按钮 */}
            <TianjinButton 
              onClick={handleSaveDraft}
              disabled={isLoading || saveStatus === 'saving'}
              className="px-5 py-2.5 flex items-center gap-2 font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <i className="fas fa-save"></i>
              保存草稿
            </TianjinButton>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-6">
          {/* 左侧：步骤导航 (垂直时间轴样式) */}
          <div className="md:col-span-3 lg:col-span-2 xl:col-span-2 hidden md:block">
            <div className="sticky top-6">
              <div className="relative pl-4">
                {/* 垂直连接线 */}
                <div className={`absolute left-[23px] top-4 bottom-4 w-0.5 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                
                <div className="space-y-8 relative">
                  {steps.map((step, index) => {
                    const isActive = currentStep === step.id;
                    const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
                    const isPending = steps.findIndex(s => s.id === currentStep) < index;
                    
                    return (
                      <div key={step.id} className="relative flex items-center group">
                         {/* 步骤点 */}
                        <button
                          onClick={() => handleStepChange(step.id as StepType)}
                          disabled={isPending && !isCompleted}
                          className={`
                            relative z-10 flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all duration-300
                            ${isActive 
                              ? 'bg-white border-blue-600 scale-125 shadow-[0_0_0_4px_rgba(37,99,235,0.2)]' 
                              : isCompleted
                                ? 'bg-blue-600 border-blue-600' 
                                : isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}
                          `}
                        >
                          {isActive && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                          {isCompleted && <i className="fas fa-check text-[10px] text-white"></i>}
                        </button>
                        
                        {/* 步骤文字 */}
                        <button
                          onClick={() => handleStepChange(step.id as StepType)}
                          disabled={isPending && !isCompleted}
                          className={`ml-4 text-left transition-all duration-300 ${isActive ? 'translate-x-1' : ''}`}
                        >
                          <span className={`block text-sm font-bold ${
                            isActive 
                              ? 'text-blue-600 dark:text-blue-400' 
                              : isCompleted 
                                ? isDark ? 'text-gray-300' : 'text-gray-700'
                                : 'text-gray-400'
                          }`}>
                            {step.name}
                          </span>
                          <span className={`text-xs mt-0.5 block max-w-[120px] ${isActive ? 'text-gray-500 dark:text-gray-400' : 'hidden'}`}>
                            {step.id === 'basic' && '基本信息'}
                            {step.id === 'content' && '详细内容'}
                            {step.id === 'media' && '图片视频'}
                            {step.id === 'settings' && '规则设置'}
                            {step.id === 'preview' && '确认发布'}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* 中间：表单内容 - 调整列宽以适配三栏布局 (2+6+4=12) */}
          <div className="md:col-span-9 lg:col-span-6 xl:col-span-6">
            {/* 移动端进度条 */}
            <div className="md:hidden mb-6 px-1">
              <div className="flex justify-between text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
                  <span>步骤 {steps.findIndex(s => s.id === currentStep) + 1} / {steps.length}</span>
                  <span className="text-blue-600">{steps.find(s => s.id === currentStep)?.name}</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
                    style={{ width: `${((steps.findIndex(s => s.id === currentStep) + 1) / steps.length) * 100}%` }}
                  ></div>
              </div>
            </div>

            <div className={`rounded-2xl p-8 ${isDark ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur-xl shadow-2xl border ${isDark ? 'border-gray-700/50' : 'border-white/50'} transition-all duration-300`}>
              {/* 当前步骤标题和描述 */}
              <div className={`mb-8 pb-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className="text-2xl font-bold mb-2.5">
                  {steps.find(step => step.id === currentStep)?.name}
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} leading-relaxed`}>
                  {currentStep === 'basic' && '填写活动的基本信息，包括活动名称、描述、时间和地点等'}
                  {currentStep === 'content' && '详细描述活动内容，包括活动流程、参与方式、注意事项等'}
                  {currentStep === 'media' && '上传活动相关的图片和视频，第一张图片将作为活动封面'}
                  {currentStep === 'settings' && '配置活动的参与人数、隐私设置和标签等'}
                  {currentStep === 'preview' && '预览活动效果，检查所有信息是否正确，确认无误后发布'}
                </p>
              </div>
              {/* 基本信息步骤 */}
              {currentStep === 'basic' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Input
                        label="活动名称"
                        placeholder="请输入活动名称"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        onBlur={() => handleBlur('title')}
                        error={errors.title}
                        required
                      />
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Textarea
                        label="活动描述"
                        placeholder="请输入活动简要描述"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        onBlur={() => handleBlur('description')}
                        error={errors.description}
                        rows={4}
                        required
                      />
                    </motion.div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <DatePicker
                          label="开始时间"
                          value={formData.startTime}
                          onChange={(date) => handleChange('startTime', date)}
                          onBlur={() => handleBlur('startTime')}
                          required
                          showTime
                        />
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <DatePicker
                          label="结束时间"
                          value={formData.endTime}
                          onChange={(date) => handleChange('endTime', date)}
                          onBlur={() => handleBlur('endTime')}
                          required
                          showTime
                        />
                      </motion.div>
                    </div>
                    {errors.time && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.35 }}
                        className="text-red-500 text-sm mt-1 mb-4"
                      >
                        {errors.time}
                      </motion.p>
                    )}
                    
                    <div className="space-y-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Input
                          label="活动地点"
                          placeholder="请输入活动地点或线上链接"
                          value={formData.location || ''}
                          onChange={(e) => handleChange('location', e.target.value)}
                        />
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <Select
                          label="活动类型"
                          value={formData.type}
                          onChange={(e) => handleChange('type', e.target.value as 'online' | 'offline')}
                          options={[
                            { value: 'offline', label: '线下活动' },
                            { value: 'online', label: '线上活动' }
                          ]}
                          required
                        />
                      </motion.div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                      >
                        <Input
                          label="联系人"
                          placeholder="请输入联系人姓名"
                          value={formData.contactName || ''}
                          onChange={(e) => handleChange('contactName', e.target.value)}
                          onBlur={() => handleBlur('contactName')}
                        />
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                      >
                        <Input
                          label="联系电话"
                          placeholder="请输入联系电话"
                          value={formData.contactPhone || ''}
                          onChange={(e) => handleChange('contactPhone', e.target.value)}
                          onBlur={() => handleBlur('contactPhone')}
                          error={errors.contactPhone}
                        />
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="sm:col-span-2 lg:col-span-1"
                      >
                        <Input
                          label="联系邮箱"
                          placeholder="请输入联系邮箱"
                          type="email"
                          value={formData.contactEmail || ''}
                          onChange={(e) => handleChange('contactEmail', e.target.value)}
                          onBlur={() => handleBlur('contactEmail')}
                          error={errors.contactEmail}
                        />
                      </motion.div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 活动内容步骤 */}
              {currentStep === 'content' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-6"
                >
                  <RichTextEditor
                    content={formData.content}
                    onChange={(content) => handleChange('content', content)}
                    error={errors.content}
                    placeholder="请输入活动详细内容，支持富文本格式"
                  />
                </motion.div>
              )}
              
              {/* 多媒体步骤 */}
              {currentStep === 'media' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-sm text-gray-500 dark:text-gray-400"
                    >
                      上传活动图片和视频，第一张图片将作为活动封面
                    </motion.p>
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <MediaGallery
                        media={formData.media}
                        onChange={handleMediaUpload}
                        error={errors.media}
                        allowMultiple
                        allowVideos
                      />
                    </motion.div>
                  </div>
                </motion.div>
              )}
              
              {/* 设置步骤 */}
              {currentStep === 'settings' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Input
                          label="最大参与人数"
                          type="number"
                          placeholder="不填则不限制"
                          value={formData.maxParticipants || ''}
                          onChange={(e) => handleChange('maxParticipants', e.target.value ? parseInt(e.target.value) : undefined)}
                          min={1}
                        />
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center justify-center"
                      >
                        <Checkbox
                          label="公开活动"
                          checked={formData.isPublic}
                          onChange={(checked) => handleChange('isPublic', checked)}
                        />
                      </motion.div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="flex items-center justify-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50"
                      >
                        <Checkbox
                          label="同步发布至社群"
                          description="将活动推送到相关社群，吸引更多用户参与"
                          checked={formData.pushToCommunity || false}
                          onChange={(checked) => handleChange('pushToCommunity', checked)}
                        />
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center justify-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50"
                      >
                        <Checkbox
                          label="申请平台推荐"
                          description="优质活动可申请平台推荐位，获取更多流量"
                          checked={formData.applyForRecommendation || false}
                          onChange={(checked) => handleChange('applyForRecommendation', checked)}
                        />
                      </motion.div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">活动标签</label>
                      
                      {/* 标签输入框和建议列表 */}
                      <div className="mb-3 relative">
                        <Input
                          value={tagInput}
                          onChange={handleTagInputChange}
                          onKeyDown={handleTagKeyDown}
                          placeholder="输入标签，按回车添加或选择建议标签"
                          onBlur={() => {
                            // 延迟关闭建议，以便点击建议时能触发点击事件
                            setTimeout(() => setShowTagSuggestions(false), 200);
                          }}
                          onFocus={() => {
                            if (tagInput.trim()) {
                              const suggestions = generateTagSuggestions(tagInput);
                              setTagSuggestions(suggestions);
                              setShowTagSuggestions(suggestions.length > 0);
                            }
                          }}
                        />
                        
                        {/* 标签建议列表 */}
                        {showTagSuggestions && tagSuggestions.length > 0 && (
                          <div className={`absolute z-10 mt-1 w-full rounded-lg shadow-lg overflow-hidden ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                            {tagSuggestions.map((suggestion, index) => (
                              <button
                                key={suggestion}
                                onClick={() => selectTag(suggestion)}
                                className={`w-full text-left px-3 py-2 text-sm transition-colors duration-300 ${index === selectedTagIndex 
                                  ? isDark 
                                    ? 'bg-blue-700 text-white' 
                                    : 'bg-blue-100 text-blue-800' 
                                  : isDark 
                                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                                    : 'bg-white hover:bg-gray-100 text-gray-800'}`}
                              >
                                <i className="fas fa-tag mr-2"></i>
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                        
                      {/* 已选标签 */}
                      {formData.tags && formData.tags.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                            <i className="fas fa-tags mr-1"></i>
                            已选标签：
                          </p>
                          <div className="flex flex-wrap gap-2.5">
                            {formData.tags.map((tag, index) => (
                              <span 
                                key={index} 
                                className={`px-4 py-1.5 rounded-full text-sm flex items-center transition-all duration-300 hover:shadow-md ${isDark 
                                  ? 'bg-blue-900 text-blue-300 hover:bg-blue-800' 
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                              >
                                <i className="fas fa-tag mr-1.5 text-xs"></i>
                                {tag}
                                <button 
                                  className="ml-2 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-300 hover:scale-110"
                                  onClick={() => removeTag(tag)}
                                >
                                  <i className="fas fa-times text-xs"></i>
                                </button>
                              </span>
                            ))}
                            
                            {/* 清空标签按钮 */}
                            <button
                              onClick={() => handleChange('tags', [])}
                              className={`px-4 py-1.5 rounded-full text-sm flex items-center transition-all duration-300 hover:shadow-md ${isDark 
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                            >
                              <i className="fas fa-trash mr-1.5"></i>
                              清空
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* 预设标签 */}
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                          <i className="fas fa-lightbulb mr-1"></i>
                          预设标签：
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                          {presetTags.map((presetTag) => (
                            <button
                              key={presetTag}
                              onClick={() => selectTag(presetTag)}
                              className={`px-4 py-1.5 rounded-full text-sm transition-all duration-300 hover:shadow-md transform hover:-translate-y-0.5 ${formData.tags?.includes(presetTag)
                                ? isDark 
                                  ? 'bg-red-900 text-red-300 hover:bg-red-800' 
                                  : 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : isDark 
                                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                            >
                              {presetTag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* 预览发布步骤 */}
              {currentStep === 'preview' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-6"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 border rounded-lg"
                  >
                    <h3 className="font-medium mb-3">发布前检查</h3>
                    <ul className="space-y-2">
                      {[
                        { condition: formData.title, text: '活动名称已填写' },
                        { condition: formData.description, text: '活动描述已填写' },
                        { condition: formData.content, text: '活动内容已填写' },
                        { condition: formData.media.length > 0, text: '多媒体资源已上传' },
                        { condition: formData.startTime < formData.endTime, text: '活动时间设置正确' },
                        ...(formData.contactPhone ? [{ condition: true, text: `联系电话：${formData.contactPhone}` }] : []),
                        ...(formData.contactEmail ? [{ condition: true, text: `联系邮箱：${formData.contactEmail}` }] : []),
                        ...(formData.contactName ? [{ condition: true, text: `联系人：${formData.contactName}` }] : [])
                      ].map((item, index) => (
                        <motion.li 
                          key={index} 
                          className="flex items-center"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + (index * 0.1) }}
                        >
                          <i className={`fas mr-2 ${item.condition ? 'fa-check text-green-500' : 'fa-times text-red-500'}`}></i>
                          <span>{item.text}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-6"
                  >
                    <h3 className="font-medium mb-3">发布选项</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="publishToJinmaiPlatform"
                          checked={publishOptions.publishToJinmaiPlatform}
                          onChange={(e) => setPublishOptions({ ...publishOptions, publishToJinmaiPlatform: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="publishToJinmaiPlatform" className="ml-2 text-sm">
                          直接发布到津脉活动平台
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="notifyFollowers"
                          checked={publishOptions.notifyFollowers}
                          onChange={(e) => setPublishOptions({ ...publishOptions, notifyFollowers: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="notifyFollowers" className="ml-2 text-sm">
                          通知我的关注者
                        </label>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-6"
                  >
                    <h3 className="font-medium mb-3">发布说明</h3>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        {publishOptions.publishToJinmaiPlatform 
                          ? '提交发布后，活动将直接发布到津脉活动平台，无需等待审核。' 
                          : '提交发布后，我们将对活动内容进行审核，审核通过后活动将自动发布。'}
                        {!publishOptions.publishToJinmaiPlatform && ' 审核通常需要1-2个工作日，请耐心等待。'}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
              
              {/* 步骤导航按钮 */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8 pt-6 border-t">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === steps[0].id}
                  className={`px-4 py-2 rounded-lg transition-colors duration-300 ${currentStep === steps[0].id 
                    ? 'opacity-50 cursor-not-allowed' 
                    : isDark 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  上一步
                </button>
                
                {currentStep === steps[steps.length - 1].id ? (
                  <TianjinButton
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600"
                  >
                    {isPublishing ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        发布中...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane mr-2"></i>
                        提交发布
                      </>
                    )}
                  </TianjinButton>
                ) : (
                  <TianjinButton
                    onClick={handleNext}
                    disabled={isLoading}
                  >
                    下一步
                    <i className="fas fa-arrow-right ml-2"></i>
                  </TianjinButton>
                )}
              </div>
            </div>
          </div>
          
          {/* 右侧：实时预览 (手机模型) - 占据4列，保持水平对齐 */}
           <div className="md:col-span-12 lg:col-span-4 xl:col-span-4 hidden lg:block min-w-0">
             <div className="sticky top-6">
                <h2 className="font-bold text-lg mb-4 text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">实时预览</h2>
                
                {/* 手机外框 */}
                <div className="relative mx-auto border-gray-800 dark:border-gray-700 bg-gray-800 border-[10px] rounded-[2.5rem] h-[640px] w-full max-w-[340px] shadow-2xl">
                 <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[13px] top-[72px] rounded-l-lg"></div>
                 <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[13px] top-[124px] rounded-l-lg"></div>
                 <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[13px] top-[178px] rounded-l-lg"></div>
                 <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[13px] top-[142px] rounded-r-lg"></div>
                 <div className="rounded-[2rem] overflow-hidden w-full h-full bg-gray-50 dark:bg-gray-900 relative">
                    {/* 顶部刘海/状态栏模拟 */}
                    <div className="absolute top-0 inset-x-0 h-7 bg-black/90 z-20 flex justify-between px-5 items-center text-[10px] text-white font-medium">
                        <span>9:41</span>
                        <div className="flex gap-1.5">
                            <i className="fas fa-signal"></i>
                            <i className="fas fa-wifi"></i>
                            <i className="fas fa-battery-full"></i>
                        </div>
                    </div>

                    {/* 内容区域 */}
                    <div className="h-full overflow-y-auto scrollbar-hide pt-8 pb-4 bg-white dark:bg-gray-900">
                        <EventPreview 
                            event={formData} 
                            onEditSection={(section) => {
                              switch (section) {
                                case 'title':
                                case 'description':
                                  setCurrentStep('basic');
                                  break;
                                case 'content':
                                  setCurrentStep('content');
                                  break;
                                case 'media':
                                  setCurrentStep('media');
                                  break;
                                case 'settings':
                                  setCurrentStep('settings');
                                  break;
                              }
                            }} 
                        />
                    </div>
                 </div>
               </div>

              {/* 预览操作 */}
              <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      const previewUrl = generateShareUrl();
                      if (previewUrl) {
                        window.open(previewUrl, '_blank');
                      }
                    }}
                    disabled={!eventId}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${!eventId 
                      ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500' 
                      : 'bg-white dark:bg-gray-800 text-blue-600 hover:scale-105'}`}
                  >
                    <i className="fas fa-external-link-alt"></i>
                    新窗口打开
                  </button>
              </div>
            </div>
          </div>
        </div>
        


        {/* 版本历史面板 */}
        <AnimatePresence>
          {showVersionHistory && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center p-4 ${isDark ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur-sm`}
            >
              <div className={`w-full max-w-3xl rounded-t-2xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} overflow-hidden max-h-[80vh] flex flex-col`}>
                {/* 面板头部 */}
                <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                  <h2 className="text-xl font-bold">版本历史</h2>
                  <button
                    onClick={() => setShowVersionHistory(false)}
                    className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                
                {/* 面板内容 */}
                <div className="flex-1 overflow-auto p-4">
                  {isLoadingVersions ? (
                    <div className="flex justify-center items-center py-10">
                      <div className="flex flex-col items-center">
                        <i className="fas fa-spinner fa-spin text-2xl text-blue-600 mb-2"></i>
                        <span>加载版本历史...</span>
                      </div>
                    </div>
                  ) : versions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <i className="fas fa-history text-4xl text-gray-400 mb-3"></i>
                      <h3 className="text-lg font-medium mb-1">暂无版本历史</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        保存活动后将自动创建版本
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {versions.map((version, index) => (
                        <motion.div
                          key={version.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-4 rounded-lg border ${isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'} transition-colors duration-300 cursor-pointer hover:shadow-md`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{version.title}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {version.description}
                              </p>
                            </div>
                            <button
                              onClick={() => restoreVersion(version.id)}
                              className={`px-3 py-1 rounded text-sm ${isDark ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors duration-300`}
                            >
                              恢复此版本
                            </button>
                          </div>
                          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <i className="fas fa-clock mr-1"></i>
                              <span>{version.createdAt.toLocaleString('zh-CN')}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <i className="fas fa-code-branch mr-1"></i>
                              <span>版本 {versions.length - index}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 分享选项面板 */}
        <AnimatePresence>
          {showShareOptions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center p-4 ${isDark ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur-sm`}
            >
              <div className={`w-full max-w-md rounded-t-2xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
                {/* 面板头部 */}
                <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                  <h2 className="text-xl font-bold">分享活动</h2>
                  <button
                    onClick={() => setShowShareOptions(false)}
                    className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                
                {/* 面板内容 */}
                <div className="p-4">
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">分享链接</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className={`flex-1 px-3 py-2 rounded-l-lg border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-white'} text-sm`}
                      />
                      <button
                        onClick={copyShareUrl}
                        className={`px-4 py-2 rounded-r-lg ${isDark ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors duration-300`}
                      >
                        {copiedToClipboard ? (
                          <>
                            <i className="fas fa-check mr-2"></i>
                            已复制
                          </>
                        ) : (
                          <>
                            <i className="fas fa-copy mr-2"></i>
                            复制
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-3">分享到社交媒体</h3>
                    <div className="flex gap-4">
                      <button
                        onClick={() => shareToSocialMedia('wechat')}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors duration-300 ${isDark ? 'bg-green-800 hover:bg-green-700' : 'bg-green-100 hover:bg-green-200'} text-green-600 dark:text-green-300`}
                      >
                        <i className="fab fa-weixin text-2xl mb-1"></i>
                        <span className="text-xs">微信</span>
                      </button>
                      <button
                        onClick={() => shareToSocialMedia('weibo')}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors duration-300 ${isDark ? 'bg-red-800 hover:bg-red-700' : 'bg-red-100 hover:bg-red-200'} text-red-600 dark:text-red-300`}
                      >
                        <i className="fab fa-weibo text-2xl mb-1"></i>
                        <span className="text-xs">微博</span>
                      </button>
                      <button
                        onClick={() => shareToSocialMedia('qq')}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors duration-300 ${isDark ? 'bg-blue-800 hover:bg-blue-700' : 'bg-blue-100 hover:bg-blue-200'} text-blue-600 dark:text-blue-300`}
                      >
                        <i className="fab fa-qq text-2xl mb-1"></i>
                        <span className="text-xs">QQ</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
