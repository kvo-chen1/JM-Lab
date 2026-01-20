import { useState, useContext, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { EventCreateRequest, Media } from '@/types';
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

export default function CreateActivity() {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { createEvent, publishEvent } = useEventService();
  
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
  });
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // 表单验证错误
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 自动保存定时器
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 检查登录状态
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);
  
  // 自动保存草稿
  useEffect(() => {
    // 清除之前的定时器
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // 防抖：5秒后自动保存
    autoSaveTimerRef.current = setTimeout(async () => {
      // 只有当表单有数据时才保存
      if (formData.title || formData.description || formData.content) {
        try {
          await createEvent({
            ...formData,
            status: 'draft'
          });
        } catch (error) {
          console.log('自动保存失败:', error);
        }
      }
    }, 5000);
    
    // 清理函数
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData, createEvent]);
  
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
        if (!formData.title.trim()) {
          newErrors.title = '请输入活动名称';
        }
        if (!formData.description.trim()) {
          newErrors.description = '请输入活动描述';
        }
        if (formData.startTime >= formData.endTime) {
          newErrors.time = '开始时间必须早于结束时间';
        }
        if (formData.contactPhone && !/^1[3-9]\d{9}$/.test(formData.contactPhone)) {
          newErrors.contactPhone = '请输入有效的手机号码';
        }
        if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
          newErrors.contactEmail = '请输入有效的邮箱地址';
        }
        break;
        
      case 'content':
        if (!formData.content.trim()) {
          newErrors.content = '请输入活动内容';
        } else if (formData.content.length < 10) {
          newErrors.content = '活动内容至少需要10个字符';
        }
        break;
        
      case 'media':
        // 至少需要一张缩略图
        if (formData.media.length === 0) {
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
  const handleChange = (field: keyof EventCreateRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
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
      
      // 创建或更新草稿
      await createEvent({
        ...formData,
        status: 'draft'
      });
      
      toast.success('草稿已保存');
      navigate('/activities');
    } catch (error) {
      toast.error('保存失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 提交发布
  const handlePublish = async () => {
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
      
      // 创建活动
      const event = await createEvent(formData);
      
      // 提交发布审核
      await publishEvent(event.id);
      
      toast.success('活动已提交审核，我们会尽快处理');
      navigate('/activities');
    } catch (error) {
      toast.error('发布失败，请稍后重试');
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">创建活动</h1>
          <TianjinButton 
            onClick={handleSaveDraft}
            disabled={isLoading}
            className="mr-2"
          >
            <i className="fas fa-save mr-2"></i>
            保存草稿
          </TianjinButton>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* 左侧：步骤导航 */}
          <div className="md:col-span-3 lg:col-span-2">
            <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md sticky top-6`}>
              <h2 className="font-semibold mb-4">创建步骤</h2>
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
                            : isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-700 hover:text-red-600'}`}
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
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      error={errors.title}
                      required
                    />
                    
                    <Textarea
                      label="活动描述"
                      placeholder="请输入活动简要描述"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      error={errors.description}
                      rows={4}
                      required
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DatePicker
                        label="开始时间"
                        value={formData.startTime}
                        onChange={(date) => handleChange('startTime', date)}
                        required
                        showTime
                      />
                      
                      <DatePicker
                        label="结束时间"
                        value={formData.endTime}
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
                      value={formData.location || ''}
                      onChange={(e) => handleChange('location', e.target.value)}
                    />
                    
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label="联系人"
                        placeholder="请输入联系人姓名"
                        value={formData.contactName || ''}
                        onChange={(e) => handleChange('contactName', e.target.value)}
                      />
                      
                      <Input
                        label="联系电话"
                        placeholder="请输入联系电话"
                        value={formData.contactPhone || ''}
                        onChange={(e) => handleChange('contactPhone', e.target.value)}
                        error={errors.contactPhone}
                      />
                      
                      <Input
                        label="联系邮箱"
                        placeholder="请输入联系邮箱"
                        type="email"
                        value={formData.contactEmail || ''}
                        onChange={(e) => handleChange('contactEmail', e.target.value)}
                        error={errors.contactEmail}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* 活动内容步骤 */}
              {currentStep === 'content' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">活动内容</h2>
                  
                  <RichTextEditor
                    content={formData.content}
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
                      media={formData.media}
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
                        value={formData.maxParticipants || ''}
                        onChange={(e) => handleChange('maxParticipants', e.target.value ? parseInt(e.target.value) : undefined)}
                        min={1}
                      />
                      
                      <div className="flex items-center justify-center">
                        <Checkbox
                          label="公开活动"
                          checked={formData.isPublic}
                          onChange={(checked) => handleChange('isPublic', checked)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">活动标签</label>
                      <div className="mb-2">
                        <Input
                          placeholder="输入标签，按回车添加"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                              e.preventDefault();
                              const tag = e.target.value.trim();
                              if (!formData.tags?.includes(tag)) {
                                handleChange('tags', [...(formData.tags || []), tag]);
                                e.target.value = '';
                              }
                            }
                          }}
                        />
                      </div>
                      
                      {/* 预设标签 */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">预设标签：</p>
                        <div className="flex flex-wrap gap-2">
                          {['文化展览', '演出活动', '讲座论坛', '节日庆典', '亲子活动', '体育赛事', '公益活动', '艺术创作'].map((presetTag) => (
                            <button
                              key={presetTag}
                              onClick={() => {
                                if (!formData.tags?.includes(presetTag)) {
                                  handleChange('tags', [...(formData.tags || []), presetTag]);
                                }
                              }}
                              className={`px-3 py-1 rounded-full text-sm transition-colors duration-300 ${formData.tags?.includes(presetTag)
                                ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                : isDark
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                            >
                              {presetTag}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {formData.tags && formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map((tag, index) => (
                            <span 
                              key={index} 
                              className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-sm flex items-center"
                            >
                              {tag}
                              <button 
                                className="ml-2 hover:text-red-600 dark:hover:text-red-400"
                                onClick={() => handleChange('tags', formData.tags?.filter((t, i) => i !== index))}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </span>
                          ))}
                          
                          {/* 清空标签按钮 */}
                          <button
                            onClick={() => handleChange('tags', [])}
                            className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            <i className="fas fa-trash mr-1"></i>
                            清空
                          </button>
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
                        <i className={`fas mr-2 ${formData.title ? 'fa-check text-green-500' : 'fa-times text-red-500'}`}></i>
                        <span>活动名称已填写</span>
                      </li>
                      <li className="flex items-center">
                        <i className={`fas mr-2 ${formData.description ? 'fa-check text-green-500' : 'fa-times text-red-500'}`}></i>
                        <span>活动描述已填写</span>
                      </li>
                      <li className="flex items-center">
                        <i className={`fas mr-2 ${formData.content ? 'fa-check text-green-500' : 'fa-times text-red-500'}`}></i>
                        <span>活动内容已填写</span>
                      </li>
                      <li className="flex items-center">
                        <i className={`fas mr-2 ${formData.media.length > 0 ? 'fa-check text-green-500' : 'fa-times text-red-500'}`}></i>
                        <span>多媒体资源已上传</span>
                      </li>
                      <li className="flex items-center">
                        <i className={`fas mr-2 ${formData.startTime < formData.endTime ? 'fa-check text-green-500' : 'fa-times text-red-500'}`}></i>
                        <span>活动时间设置正确</span>
                      </li>
                      {formData.contactPhone && (
                        <li className="flex items-center">
                          <i className="fas fa-check mr-2 text-green-500"></i>
                          <span>联系电话：{formData.contactPhone}</span>
                        </li>
                      )}
                      {formData.contactEmail && (
                        <li className="flex items-center">
                          <i className="fas fa-check mr-2 text-green-500"></i>
                          <span>联系邮箱：{formData.contactEmail}</span>
                        </li>
                      )}
                      {formData.contactName && (
                        <li className="flex items-center">
                          <i className="fas fa-check mr-2 text-green-500"></i>
                          <span>联系人：{formData.contactName}</span>
                        </li>
                      )}
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
          
          {/* 右侧：实时预览 */}
          <div className="md:col-span-12 lg:col-span-3">
            <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md sticky top-6`}>
              <h2 className="font-semibold mb-4">实时预览</h2>
              <EventPreview event={formData} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
