import { useState, useContext, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { EventUpdateRequest, Media } from '@/types';
import { useEventService } from '@/hooks/useEventService';

// 导入UI组件
import { TianjinButton } from '@/components/TianjinStyleComponents';
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

export default function EditActivity() {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const { getEvent, updateEvent, publishEvent } = useEventService();
  
  // 当前步骤
  const [currentStep, setCurrentStep] = useState<StepType>('basic');
  
  // 活动数据
  const [eventData, setEventData] = useState<EventUpdateRequest>({
    title: '',
    description: '',
    content: '',
    startTime: new Date(),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 默认24小时后结束
    type: 'offline',
    tags: [],
    media: [],
    isPublic: true,
  });
  
  // 初始媒体数据，用于比较是否有变化
  const [initialMedia, setInitialMedia] = useState<Media[]>([]);
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // 表单验证错误
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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
      
      // 设置活动数据
      setEventData({
        title: event.title,
        description: event.description,
        content: event.content,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        type: event.type,
        tags: event.tags || [],
        media: event.media,
        isPublic: event.isPublic,
        maxParticipants: event.maxParticipants,
      });
      
      // 保存初始媒体数据
      setInitialMedia(event.media);
      
      setIsLoading(false);
    } catch (error) {
      toast.error('加载活动数据失败，请稍后重试');
      navigate('/activities');
    }
  };
  
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
    
    switch (currentStep) {
      case 'basic':
        if (!eventData.title?.trim()) {
          newErrors.title = '请输入活动名称';
        }
        if (!eventData.description?.trim()) {
          newErrors.description = '请输入活动描述';
        }
        if (eventData.startTime && eventData.endTime && eventData.startTime >= eventData.endTime) {
          newErrors.time = '开始时间必须早于结束时间';
        }
        break;
        
      case 'content':
        if (!eventData.content?.trim()) {
          newErrors.content = '请输入活动内容';
        }
        break;
        
      case 'media':
        // 至少需要一张缩略图
        if (!eventData.media || eventData.media.length === 0) {
          newErrors.media = '请上传至少一张图片';
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // 处理表单字段变化
  const handleChange = (field: keyof EventUpdateRequest, value: any) => {
    setEventData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除对应字段的错误
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };
  
  // 处理媒体上传
  const handleMediaUpload = (newMedia: Media[]) => {
    setEventData(prev => ({
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
  
  // 更新活动
  const handleUpdate = async () => {
    if (!eventId) return;
    
    try {
      // 验证所有步骤
      for (const step of steps) {
        setCurrentStep(step.id as StepType);
        if (!validateCurrentStep()) {
          toast.error('请完善所有必填信息');
          return;
        }
      }
      
      setIsUpdating(true);
      await updateEvent(eventId, eventData);
      toast.success('活动已更新');
      navigate(`/activities/${eventId}`);
    } catch (error) {
      toast.error('更新活动失败，请稍后重试');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // 提交发布
  const handlePublish = async () => {
    if (!eventId) return;
    
    try {
      // 验证所有步骤
      for (const step of steps) {
        setCurrentStep(step.id as StepType);
        if (!validateCurrentStep()) {
          toast.error('请完善所有必填信息');
          return;
        }
      }
      
      setIsPublishing(true);
      
      // 先更新活动数据
      await updateEvent(eventId, eventData);
      
      // 然后提交发布
      await publishEvent(eventId);
      
      toast.success('活动已提交发布');
      navigate(`/activities/${eventId}`);
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
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
          <p>加载中...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">编辑活动</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* 左侧：步骤导航 */}
          <div className="md:col-span-3 lg:col-span-2">
            <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md sticky top-6`}>
              <h2 className="font-semibold mb-4">编辑步骤</h2>
              <div className="space-y-3">
                {steps.map((step, index) => {
                  const isActive = currentStep === step.id;
                  const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
                  
                  return (
                    <div key={step.id} className="flex items-center">
                      {/* 步骤指示器 */}
                      <div 
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-300 ${isActive 
                          ? 'bg-gradient-to-r from-red-600 to-red-500 text-white scale-110 shadow-lg' 
                          : isCompleted
                          ? 'bg-green-600 text-white' 
                          : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`}
                      >
                        {isCompleted ? (
                          <i className="fas fa-check"></i>
                        ) : (
                          <i className={`fas fa-${step.icon}`}></i>
                        )}
                      </div>
                      
                      {/* 步骤名称 */}
                      <div className="flex-1">
                        <button
                          onClick={() => handleStepChange(step.id as StepType)}
                          className={`text-left font-medium transition-colors duration-300 ${isActive 
                            ? 'text-red-600 dark:text-red-400' 
                            : isCompleted
                            ? 'text-green-600 dark:text-green-400' 
                            : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-red-600'}`}
                        >
                          {step.name}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* 中间：表单内容 */}
          <div className="md:col-span-9 lg:col-span-7">
            <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
              {/* 基本信息步骤 */}
              {currentStep === 'basic' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">基本信息</h2>
                  
                  <div className="space-y-4">
                    <Input
                      label="活动名称"
                      placeholder="请输入活动名称"
                      value={eventData.title || ''}
                      onChange={(e) => handleChange('title', e.target.value)}
                      error={errors.title}
                      required
                    />
                    
                    <Textarea
                      label="活动描述"
                      placeholder="请输入活动简要描述"
                      value={eventData.description || ''}
                      onChange={(e) => handleChange('description', e.target.value)}
                      error={errors.description}
                      rows={4}
                      required
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DatePicker
                        label="开始时间"
                        value={eventData.startTime || new Date()}
                        onChange={(date) => handleChange('startTime', date)}
                        required
                        showTime
                      />
                      
                      <DatePicker
                        label="结束时间"
                        value={eventData.endTime || new Date(Date.now() + 24 * 60 * 60 * 1000)}
                        onChange={(date) => handleChange('endTime', date)}
                        required
                        showTime
                      />
                    </div>
                    {errors.time && (
                      <p className="text-red-500 text-sm mt-1">{errors.time}</p>
                    )}
                    
                    <Input
                      label="活动地点"
                      placeholder="请输入活动地点或线上链接"
                      value={eventData.location || ''}
                      onChange={(e) => handleChange('location', e.target.value)}
                    />
                    
                    <Select
                      label="活动类型"
                      value={eventData.type || 'offline'}
                      onChange={(e) => handleChange('type', e.target.value as 'online' | 'offline')}
                      options={[
                        { value: 'offline', label: '线下活动' },
                        { value: 'online', label: '线上活动' }
                      ]}
                      required
                    />
                  </div>
                </div>
              )}
              
              {/* 活动内容步骤 */}
              {currentStep === 'content' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">活动内容</h2>
                  
                  <RichTextEditor
                    content={eventData.content || ''}
                    onChange={(content) => handleChange('content', content)}
                    error={errors.content}
                    placeholder="请输入活动详细内容，支持富文本格式"
                  />
                </div>
              )}
              
              {/* 多媒体步骤 */}
              {currentStep === 'media' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">多媒体资源</h2>
                  
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      上传活动图片和视频，第一张图片将作为活动封面
                    </p>
                    
                    <MediaGallery
                      media={eventData.media || []}
                      onChange={handleMediaUpload}
                      error={errors.media}
                      allowMultiple
                      allowVideos
                    />
                  </div>
                </div>
              )}
              
              {/* 设置步骤 */}
              {currentStep === 'settings' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">活动设置</h2>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="最大参与人数"
                        type="number"
                        placeholder="不填则不限制"
                        value={eventData.maxParticipants || ''}
                        onChange={(e) => handleChange('maxParticipants', e.target.value ? parseInt(e.target.value) : undefined)}
                        min={1}
                      />
                      
                      <div className="flex items-center justify-center">
                        <Checkbox
                          label="公开活动"
                          checked={eventData.isPublic || false}
                          onChange={(checked) => handleChange('isPublic', checked)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">活动标签</label>
                      <Input
                        placeholder="输入标签，按回车添加"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            e.preventDefault();
                            const tag = e.target.value.trim();
                            const tags = eventData.tags || [];
                            if (!tags.includes(tag)) {
                              handleChange('tags', [...tags, tag]);
                              e.target.value = '';
                            }
                          }
                        }}
                      />
                      
                      {eventData.tags && eventData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {eventData.tags.map((tag, index) => (
                            <span 
                              key={index} 
                              className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-sm flex items-center"
                            >
                              {tag}
                              <button 
                                className="ml-2 hover:text-red-600 dark:hover:text-red-400"
                                onClick={() => {
                                  const tags = eventData.tags || [];
                                  handleChange('tags', tags.filter((t, i) => i !== index));
                                }}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* 预览发布步骤 */}
              {currentStep === 'preview' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">预览发布</h2>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-3">发布前检查</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <i className={`fas mr-2 ${eventData.title ? 'fa-check text-green-500' : 'fa-times text-red-500'}`}></i>
                        <span>活动名称已填写</span>
                      </li>
                      <li className="flex items-center">
                        <i className={`fas mr-2 ${eventData.description ? 'fa-check text-green-500' : 'fa-times text-red-500'}`}></i>
                        <span>活动描述已填写</span>
                      </li>
                      <li className="flex items-center">
                        <i className={`fas mr-2 ${eventData.content ? 'fa-check text-green-500' : 'fa-times text-red-500'}`}></i>
                        <span>活动内容已填写</span>
                      </li>
                      <li className="flex items-center">
                        <i className={`fas mr-2 ${(eventData.media?.length || 0) > 0 ? 'fa-check text-green-500' : 'fa-times text-red-500'}`}></i>
                        <span>多媒体资源已上传</span>
                      </li>
                      <li className="flex items-center">
                        <i className={`fas mr-2 ${eventData.startTime && eventData.endTime && eventData.startTime < eventData.endTime ? 'fa-check text-green-500' : 'fa-times text-red-500'}`}></i>
                        <span>活动时间设置正确</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-medium mb-3">发布说明</h3>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        提交发布后，我们将对活动内容进行审核，审核通过后活动将自动发布到天津文化活动页面。
                        审核通常需要1-2个工作日，请耐心等待。
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 步骤导航按钮 */}
              <div className="flex justify-between mt-8 pt-6 border-t">
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
                  <div className="flex space-x-2">
                    <TianjinButton
                      onClick={handleUpdate}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          保存中...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save mr-2"></i>
                          保存修改
                        </>
                      )}
                    </TianjinButton>
                    
                    <TianjinButton
                      onClick={handlePublish}
                      disabled={isPublishing}
                      className="bg-red-600 hover:bg-red-700"
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
                  </div>
                ) : (
                  <TianjinButton
                    onClick={handleNext}
                    disabled={isUpdating}
                  >
                    下一步
                    <i className="fas fa-arrow-right ml-2"></i>
                  </TianjinButton>
                )}
              </div>
            </div>
          </div>
          
          {/* 右侧：实时预览 */}
          <div className="md:col-span-12 lg:col-span-3">
            <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md sticky top-6`}>
              <h2 className="font-semibold mb-4">实时预览</h2>
              <EventPreview event={eventData as any} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}