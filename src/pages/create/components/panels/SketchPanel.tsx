import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useCreateStore } from '../../hooks/useCreateStore';
import { useTheme } from '@/hooks/useTheme';
import { llmService } from '@/services/llmService';
import { promptTemplates } from '@/data/promptTemplates';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// 生成模式类型
type GenerationMode = 'text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video';

// 模式配置
const modeConfig = {
  'text-to-image': {
    id: 'text-to-image',
    label: '文生图',
    icon: 'fa-font',
    description: '输入文字描述，AI生成图片',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    activeColor: 'text-blue-600 dark:text-blue-400',
  },
  'image-to-image': {
    id: 'image-to-image',
    label: '图生图',
    icon: 'fa-image',
    description: '上传图片，AI进行风格转换',
    color: 'from-purple-500 to-pink-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    activeColor: 'text-purple-600 dark:text-purple-400',
  },
  'text-to-video': {
    id: 'text-to-video',
    label: '文生视频',
    icon: 'fa-file-video',
    description: '输入文字描述，AI生成视频',
    color: 'from-orange-500 to-red-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    activeColor: 'text-orange-600 dark:text-orange-400',
  },
  'image-to-video': {
    id: 'image-to-video',
    label: '图生视频',
    icon: 'fa-photo-video',
    description: '上传图片，AI生成动态视频',
    color: 'from-green-500 to-teal-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    activeColor: 'text-green-600 dark:text-green-400',
  },
};

// 风格预设选项
const stylePresets = [
  { value: '', label: '默认风格', icon: 'fa-magic' },
  { value: '国潮', label: '国潮风', icon: 'fa-dragon' },
  { value: '极简', label: '极简主义', icon: 'fa-minus' },
  { value: '复古', label: '复古风', icon: 'fa-history' },
  { value: '赛博朋克', label: '赛博朋克', icon: 'fa-robot' },
  { value: '水墨', label: '水墨画', icon: 'fa-brush' },
  { value: '油画', label: '油画风', icon: 'fa-palette' },
  { value: '二次元', label: '二次元', icon: 'fa-star' },
];

// 视频比例选项
const videoAspectRatios = [
  { value: '16:9', label: '16:9 宽屏', icon: 'fa-desktop' },
  { value: '9:16', label: '9:16 竖屏', icon: 'fa-mobile-alt' },
  { value: '1:1', label: '1:1 方形', icon: 'fa-square' },
  { value: '4:3', label: '4:3 标准', icon: 'fa-tv' },
];

// 视频时长选项
const videoDurations = [
  { value: 5, label: '5秒', desc: '短视频' },
  { value: 10, label: '10秒', desc: '标准' },
  { value: 15, label: '15秒', desc: '长视频' },
];

export default function SketchPanel() {
  const { isDark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 本地状态
  const [activeMode, setActiveMode] = useState<GenerationMode>('text-to-image');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState('16:9');
  const [videoDuration, setVideoDuration] = useState(5);
  const [imageStrength, setImageStrength] = useState(70);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [videoGenerationProgress, setVideoGenerationProgress] = useState(0);
  const [videoGenerationStatus, setVideoGenerationStatus] = useState('');
  
  // Store 状态
  const { 
    prompt, setPrompt, 
    isGenerating, setIsGenerating, 
    stylePreset, updateState,
    generateCount,
    setGeneratedResults,
    setSelectedResult,
    setCurrentStep,
    streamStatus,
    autoGenerate,
    setAutoGenerate
  } = useCreateStore();

  // 处理模式切换
  const handleModeChange = (mode: GenerationMode) => {
    setActiveMode(mode);
    // 清空上传的图片当切换到非图片模式时
    if (mode === 'text-to-image' || mode === 'text-to-video') {
      setUploadedImage(null);
      setUploadedFile(null);
    }
  };

  // 处理文件上传
  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('图片大小不能超过10MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setUploadedFile(file);
      toast.success('图片上传成功');
    };
    reader.readAsDataURL(file);
  }, []);

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  // 处理拖拽
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  // 自动生成功能 - 当从首页跳转过来时自动触发
  useEffect(() => {
    if (autoGenerate && prompt.trim() && !isGenerating) {
      // 重置标志并触发生成
      setAutoGenerate(false);
      handleGenerate();
    }
  }, [autoGenerate, prompt, isGenerating]);

  // 生成处理
  const handleGenerate = async () => {
    // 验证输入
    if (!prompt.trim()) {
      toast.error('请输入创意描述');
      return;
    }
    
    // 图片模式需要上传图片
    if ((activeMode === 'image-to-image' || activeMode === 'image-to-video') && !uploadedImage) {
      toast.error('请先上传图片');
      return;
    }
    
    setIsGenerating(true);
    updateState({ streamStatus: 'running' });
    
    try {
      // 根据模式调用不同的生成接口
      switch (activeMode) {
        case 'text-to-image':
          await generateTextToImage();
          break;
        case 'image-to-image':
          await generateImageToImage();
          break;
        case 'text-to-video':
          await generateTextToVideo();
          break;
        case 'image-to-video':
          await generateImageToVideo();
          break;
      }
    } catch (e) {
      console.error(e);
      toast.error('生成失败，请重试');
    } finally {
      setIsGenerating(false);
      updateState({ streamStatus: 'completed' });
    }
  };

  // 文生图
  const generateTextToImage = async () => {
    llmService.setCurrentModel('qwen');
    
    const inputBase = (prompt || '天津文化设计灵感').trim();
    const input = stylePreset ? `${inputBase}；风格：${stylePreset}` : inputBase;
    const currentModel = llmService.getCurrentModel();
    
    const r = await llmService.generateImage({ 
      prompt: input, 
      size: '1024x1024', 
      n: Math.min(Math.max(generateCount, 1), 6), 
      response_format: 'url', 
      watermark: true 
    });

    const dataArray = (r as any)?.data?.data || (r as any)?.data || [];
    const urls = dataArray.map((d: any) => d.url || (d.b64_json ? `data:image/png;base64,${d.b64_json}` : '')).filter(Boolean);

    if (urls.length) {
      const mapped = urls.map((u: string, idx: number) => ({ 
        id: Date.now() + idx, 
        thumbnail: u, 
        score: 80,
        type: 'image'
      }));
      setGeneratedResults(mapped);
      setSelectedResult(mapped[0]?.id ?? null);
      setCurrentStep(2);
      toast.success(`${currentModel.name}已生成${urls.length}张图片方案`);
    } else {
      useFallbackData('image');
    }
  };

  // 图生图
  const generateImageToImage = async () => {
    if (!uploadedImage) {
      toast.error('请先上传参考图片');
      return;
    }
    
    try {
      llmService.setCurrentModel('qwen');
      const currentModel = llmService.getCurrentModel();
      
      // 准备提示词
      const inputBase = (prompt || '保持原图主体，转换风格').trim();
      const input = stylePreset ? `${inputBase}；风格：${stylePreset}` : inputBase;
      
      // 如果图片是本地 base64，先上传到云存储获取公网 URL
      let publicImageUrl = uploadedImage;
      if (uploadedImage.startsWith('data:')) {
        toast.info('正在上传图片到云存储...');
        const { getPublicImageUrl } = await import('@/services/imageService');
        try {
          publicImageUrl = await getPublicImageUrl(uploadedImage);
          console.log('[ImageToImage] Image uploaded to:', publicImageUrl);
        } catch (uploadError: any) {
          console.error('[ImageToImage] Failed to upload image:', uploadError);
          toast.error('图片上传失败: ' + (uploadError.message || '请重试'));
          return;
        }
      }
      
      toast.info('正在进行风格转换...');
      
      // 调用图生图API
      const r = await llmService.generateImage({ 
        prompt: input, 
        size: '1024x1024', 
        n: Math.min(Math.max(generateCount, 1), 6), 
        response_format: 'url', 
        watermark: true,
        reference_image: publicImageUrl,
        reference_strength: imageStrength / 100 // 转换为0-1范围
      });

      const dataArray = (r as any)?.data?.data || (r as any)?.data || [];
      const urls = dataArray.map((d: any) => d.url || (d.b64_json ? `data:image/png;base64,${d.b64_json}` : '')).filter(Boolean);

      if (urls.length) {
        const mapped = urls.map((u: string, idx: number) => ({ 
          id: Date.now() + idx, 
          thumbnail: u, 
          score: 80 + Math.floor(Math.random() * 15),
          type: 'image'
        }));
        setGeneratedResults(mapped);
        setSelectedResult(mapped[0]?.id ?? null);
        setCurrentStep(2);
        toast.success(`${currentModel.name}风格转换完成，生成${urls.length}张图片`);
      } else {
        throw new Error('未获取到生成结果');
      }
    } catch (e: any) {
      console.error('[ImageToImage] Generation failed:', e);
      toast.error(e?.message || '风格转换失败，请重试');
      // 使用备用数据
      useFallbackData('image');
    }
  };

  // 文生视频
  const generateTextToVideo = async () => {
    try {
      setIsGenerating(true);
      setVideoGenerationProgress(0);
      setVideoGenerationStatus('正在提交视频生成任务...');
      toast.info('视频生成开始，预计需要 1-3 分钟，请耐心等待...');
      
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setVideoGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          const newProgress = prev + Math.random() * 15;
          if (newProgress > 20 && newProgress < 40) {
            setVideoGenerationStatus('AI 正在分析您的创意描述...');
          } else if (newProgress > 40 && newProgress < 60) {
            setVideoGenerationStatus('正在生成视频帧...');
          } else if (newProgress > 60 && newProgress < 80) {
            setVideoGenerationStatus('正在渲染视频...');
          } else if (newProgress > 80) {
            setVideoGenerationStatus('正在完成最终处理...');
          }
          return Math.min(newProgress, 90);
        });
      }, 3000);
      
      const result = await llmService.generateVideo({
        prompt: prompt,
        duration: videoDuration,
        aspectRatio: videoAspectRatio
      });
      
      clearInterval(progressInterval);
      
      console.log('[TextToVideo] Result:', result);
      console.log('[TextToVideo] Result data:', result.data);
      
      const videoUrl = result.data?.video_url || result.data?.url;
      
      console.log('[TextToVideo] Video URL:', videoUrl);
      
      if (!result.ok || !videoUrl) {
        console.error('[TextToVideo] Generation failed:', result);
        toast.error(result.error || '视频生成失败，请检查API配置');
        setGeneratedResults([]);
        setVideoGenerationProgress(0);
        setVideoGenerationStatus('');
      } else {
        setVideoGenerationProgress(100);
        setVideoGenerationStatus('视频生成完成！正在保存视频...');
        
        // 下载视频并上传到永久存储
        let permanentVideoUrl: string;
        try {
          const { downloadAndUploadVideo } = await import('@/services/imageService');
          permanentVideoUrl = await downloadAndUploadVideo(videoUrl);
          console.log('[TextToVideo] Video uploaded to permanent storage:', permanentVideoUrl);
          toast.success('视频已保存到永久存储');
        } catch (uploadError: any) {
          console.error('[TextToVideo] Failed to upload video to permanent storage:', uploadError);
          toast.error('视频生成成功但上传到永久存储失败，请检查 Supabase 配置');
          setIsGenerating(false);
          setVideoGenerationProgress(0);
          setVideoGenerationStatus('');
          return; // 上传失败，不保存结果
        }
        
        // 使用视频占位图作为缩略图 - 使用可靠的图片服务
        const videoThumbnail = `https://picsum.photos/seed/video-${Date.now()}/800/600`;
        
        const results = [
          { 
            id: Date.now(), 
            thumbnail: videoThumbnail,
            url: videoThumbnail, // 添加url字段用于发布
            score: 90, 
            type: 'video',
            video: permanentVideoUrl
          },
        ];
        setGeneratedResults(results);
        setSelectedResult(results[0].id);
        setCurrentStep(2);
        toast.success('视频生成成功！');
        
        // 延迟重置进度
        setTimeout(() => {
          setVideoGenerationProgress(0);
          setVideoGenerationStatus('');
        }, 2000);
      }
    } catch (e: any) {
      console.error('[TextToVideo] Exception:', e);
      toast.error(e?.message || '视频生成失败');
      setGeneratedResults([]);
      setVideoGenerationProgress(0);
      setVideoGenerationStatus('');
    } finally {
      setIsGenerating(false);
    }
  };

  // 图生视频
  const generateImageToVideo = async () => {
    if (!uploadedImage) {
      toast.error('请先上传参考图片');
      return;
    }
    
    try {
      setIsGenerating(true);
      setVideoGenerationProgress(0);
      setVideoGenerationStatus('正在准备图片...');
      toast.info('视频生成开始，预计需要 1-3 分钟，请耐心等待...');
      
      // 如果图片是本地 base64，先上传到云存储获取公网 URL
      let publicImageUrl = uploadedImage;
      if (uploadedImage.startsWith('data:')) {
        setVideoGenerationStatus('正在上传图片到云存储...');
        const { getPublicImageUrl } = await import('@/services/imageService');
        try {
          publicImageUrl = await getPublicImageUrl(uploadedImage);
          console.log('[ImageToVideo] Image uploaded to:', publicImageUrl);
          toast.success('图片上传成功，开始生成视频...');
        } catch (uploadError: any) {
          console.error('[ImageToVideo] Failed to upload image:', uploadError);
          toast.error('图片上传失败: ' + (uploadError.message || '请重试'));
          setIsGenerating(false);
          setVideoGenerationProgress(0);
          setVideoGenerationStatus('');
          return;
        }
      }
      
      setVideoGenerationStatus('正在提交视频生成任务...');
      
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setVideoGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          const newProgress = prev + Math.random() * 15;
          if (newProgress > 20 && newProgress < 40) {
            setVideoGenerationStatus('AI 正在分析您的参考图片...');
          } else if (newProgress > 40 && newProgress < 60) {
            setVideoGenerationStatus('正在生成视频帧...');
          } else if (newProgress > 60 && newProgress < 80) {
            setVideoGenerationStatus('正在渲染视频...');
          } else if (newProgress > 80) {
            setVideoGenerationStatus('正在完成最终处理...');
          }
          return Math.min(newProgress, 90);
        });
      }, 3000);
      
      const result = await llmService.generateVideo({
        prompt: prompt,
        imageUrl: publicImageUrl,
        duration: videoDuration,
        aspectRatio: videoAspectRatio
      });
      
      clearInterval(progressInterval);
      
      const videoUrl = result.data?.video_url || result.data?.url;
      
      if (!result.ok || !videoUrl) {
        console.error('[ImageToVideo] Generation failed:', result);
        toast.error(result.error || '视频生成失败，请检查API配置');
        setGeneratedResults([]);
        setVideoGenerationProgress(0);
        setVideoGenerationStatus('');
      } else {
        setVideoGenerationProgress(100);
        setVideoGenerationStatus('视频生成完成！正在保存视频...');
        
        // 下载视频并上传到永久存储
        let permanentVideoUrl: string;
        try {
          const { downloadAndUploadVideo } = await import('@/services/imageService');
          permanentVideoUrl = await downloadAndUploadVideo(videoUrl);
          console.log('[ImageToVideo] Video uploaded to permanent storage:', permanentVideoUrl);
          toast.success('视频已保存到永久存储');
        } catch (uploadError: any) {
          console.error('[ImageToVideo] Failed to upload video to permanent storage:', uploadError);
          toast.error('视频生成成功但上传到永久存储失败，请检查 Supabase 配置');
          setIsGenerating(false);
          setVideoGenerationProgress(0);
          setVideoGenerationStatus('');
          return; // 上传失败，不保存结果
        }
        
        // 使用上传的图片作为缩略图，如果没有则使用视频占位图 - 使用可靠的图片服务
        const videoThumbnail = uploadedImage && !uploadedImage.startsWith('data:') ? 
          uploadedImage : 
          `https://picsum.photos/seed/video-${Date.now()}/800/600`;
        
        const results = [
          { 
            id: Date.now(), 
            thumbnail: videoThumbnail,
            url: videoThumbnail, // 添加url字段用于发布
            score: 88, 
            type: 'video',
            video: permanentVideoUrl
          },
        ];
        setGeneratedResults(results);
        setSelectedResult(results[0].id);
        setCurrentStep(2);
        toast.success('视频生成成功！');
        
        // 延迟重置进度
        setTimeout(() => {
          setVideoGenerationProgress(0);
          setVideoGenerationStatus('');
        }, 2000);
      }
    } catch (e: any) {
      console.error('[ImageToVideo] Exception:', e);
      toast.error(e?.message || '视频生成失败');
      setGeneratedResults([]);
      setVideoGenerationProgress(0);
      setVideoGenerationStatus('');
    } finally {
      setIsGenerating(false);
    }
  };

  // 备用数据
  const useFallbackData = (type: 'image' | 'video') => {
    toast.info('未返回结果，使用模拟数据');
    const fallback = type === 'image' ? [
      { id: Date.now(), thumbnail: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&h=400&fit=crop', score: 85, type: 'image' },
      { id: Date.now()+1, thumbnail: 'https://images.unsplash.com/photo-1558981806-ec527fa84f3d?w=600&h=400&fit=crop', score: 82, type: 'image' },
    ] : [
      { id: Date.now(), thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&h=400&fit=crop', score: 90, type: 'video', video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    ];
    setGeneratedResults(fallback);
    setSelectedResult(fallback[0].id);
    setCurrentStep(2);
  };

  // 优化提示词
  const handlePolishPrompt = async () => {
    if (!prompt.trim()) return;
    
    try {
      llmService.setCurrentModel('qwen');
      const instruction = `请将下面的创作提示优化为更清晰的中文指令，保留原意，突出关键元素（主题、风格、色彩、素材）。用1-3个短句表达，避免礼貌语或解释，只输出优化后的文本：

${prompt}`;
      const result = await llmService.generateResponse(instruction);
      const polished = String(result || '').trim();
      if (polished) {
        setPrompt(polished);
        toast.success('提示词优化完成');
      }
    } catch (e) {
      toast.error('优化失败，请稍后重试');
    }
  };

  // 随机灵感
  const handleRandomInspiration = () => {
    const randomPrompt = promptTemplates[Math.floor(Math.random() * promptTemplates.length)];
    setPrompt(randomPrompt.text);
    toast.success('已获取随机灵感');
  };

  const currentMode = modeConfig[activeMode];
  const isVideoMode = activeMode.includes('video');
  const isImageInputMode = activeMode === 'image-to-image' || activeMode === 'image-to-video';

  return (
    <div className="space-y-6">
      {/* 智能助手卡片 */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-2xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'}`}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${currentMode.color} text-white shadow-lg`}>
            <i className={`fas ${currentMode.icon} text-sm`}></i>
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              智能创作助手
            </h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {currentMode.description}。AI 将结合天津文化元素为您生成专业的设计方案。
            </p>
          </div>
        </div>
      </motion.div>

      {/* 生成模式选择 */}
      <div className="space-y-3">
        <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          选择生成模式
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(modeConfig) as GenerationMode[]).map((mode) => {
            const config = modeConfig[mode];
            const isActive = activeMode === mode;
            
            return (
              <motion.button
                key={mode}
                onClick={() => handleModeChange(mode)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-3 rounded-xl border-2 transition-all duration-300 ${
                  isActive 
                    ? `${config.bgColor} ${config.borderColor} border-opacity-100` 
                    : `${isDark ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300'}`
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive 
                      ? `bg-gradient-to-br ${config.color} text-white` 
                      : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <i className={`fas ${config.icon} text-xs`}></i>
                  </div>
                  <div className="text-left">
                    <div className={`text-xs font-semibold ${isActive ? config.activeColor : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {config.label}
                    </div>
                    <div className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {mode === 'text-to-image' ? '文字生成' : mode === 'image-to-image' ? '风格转换' : mode === 'text-to-video' ? '文字生成' : '图片生成'}
                    </div>
                  </div>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="activeModeIndicator"
                    className={`absolute inset-0 rounded-xl border-2 ${config.borderColor}`}
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 图片上传区域 - 仅在图生图/图生视频模式显示 */}
      <AnimatePresence>
        {isImageInputMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              上传参考图片
            </label>
            
            {uploadedImage ? (
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="relative rounded-xl overflow-hidden border-2 border-dashed border-green-400 bg-green-50 dark:bg-green-900/20"
              >
                <img 
                  src={uploadedImage} 
                  alt="Uploaded" 
                  className="w-full h-40 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-white text-xs font-medium">
                    <i className="fas fa-check-circle mr-1 text-green-400"></i>
                    已上传
                  </span>
                  <button
                    onClick={() => {
                      setUploadedImage(null);
                      setUploadedFile(null);
                    }}
                    className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <i className="fas fa-trash-alt mr-1"></i>删除
                  </button>
                </div>
              </motion.div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative p-6 rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : isDark 
                      ? 'border-gray-600 bg-gray-800/30 hover:border-gray-500 hover:bg-gray-800/50' 
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="text-center">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-gray-700 text-gray-400' : 'bg-white text-gray-400 shadow-sm'
                  }`}>
                    <i className="fas fa-cloud-upload-alt text-xl"></i>
                  </div>
                  <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    点击或拖拽上传图片
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    支持 JPG、PNG、WebP，最大 10MB
                  </p>
                </div>
              </div>
            )}

            {/* 图生图强度调节 */}
            {activeMode === 'image-to-image' && uploadedImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <i className="fas fa-sliders-h mr-1 text-purple-500"></i>
                    风格转换强度
                  </label>
                  <span className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {imageStrength}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={imageStrength}
                  onChange={(e) => setImageStrength(parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
                  style={{
                    background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${imageStrength}%, ${isDark ? '#374151' : '#E5E7EB'} ${imageStrength}%, ${isDark ? '#374151' : '#E5E7EB'} 100%)`
                  }}
                />
                <div className="flex justify-between mt-1">
                  <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>保留原图</span>
                  <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>完全转换</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 创意描述输入 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            创意描述
          </label>
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {prompt.length}/500
          </span>
        </div>
        
        <div className="relative group">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={isVideoMode 
              ? "描述您想要生成的视频内容，例如：天津海河夜景，灯光璀璨，船只缓缓驶过..."
              : "描述您想要创作的画面，例如：具有中国传统元素的现代包装设计，融入杨柳青年画风格..."
            }
            maxLength={500}
            className={`w-full p-4 rounded-2xl h-32 text-sm focus:outline-none focus:ring-2 focus:ring-[#C02C38]/50 transition-all resize-none ${
              isDark 
                ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 border' 
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 border shadow-sm'
            }`}
          />
          <div className="absolute bottom-3 right-3 flex gap-2">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePolishPrompt}
              disabled={!prompt.trim() || isGenerating}
              className={`p-2 rounded-lg text-xs transition-colors ${(
                isDark 
                  ? 'hover:bg-gray-700 text-gray-500 disabled:text-gray-700' 
                  : 'hover:bg-gray-100 text-gray-400 hover:text-blue-600 disabled:text-gray-300'
              )}`}
              title="AI优化提示词"
            >
              <i className="fas fa-magic"></i>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPrompt('')}
              className={`p-2 rounded-lg text-xs transition-colors ${(
                isDark 
                  ? 'hover:bg-gray-700 text-gray-500' 
                  : 'hover:bg-gray-100 text-gray-400 hover:text-red-600'
              )}`}
              title="清空"
            >
              <i className="fas fa-trash-alt"></i>
            </motion.button>
          </div>
        </div>
        
        {/* 快捷模板标签 */}
        <div className="flex flex-wrap gap-2">
          {promptTemplates?.slice(0, 4).map((t: any) => (
            <motion.button
              key={t.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPrompt(t.text)}
              className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${
                isDark 
                  ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600 text-gray-300' 
                  : 'bg-white border-gray-200 hover:border-blue-300 hover:text-blue-600 text-gray-600 shadow-sm'
              }`}
            >
              {t.name}
            </motion.button>
          ))}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRandomInspiration}
            className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${
              isDark 
                ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700/50 hover:border-blue-500 text-blue-300' 
                : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:border-blue-400 text-blue-700 shadow-sm'
            }`}
          >
            <i className="fas fa-random mr-1"></i>随机灵感
          </motion.button>
        </div>
      </div>

      {/* 分割线 */}
      <div className={`h-px w-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}></div>

      {/* 基础设置 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 风格预设 */}
        <div className="space-y-2">
          <label className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <i className="fas fa-palette mr-1"></i>风格预设
          </label>
          <div className="relative">
            <select
              value={stylePreset}
              onChange={(e) => updateState({ stylePreset: e.target.value })}
              className={`w-full p-2.5 pl-9 pr-8 rounded-xl text-xs appearance-none cursor-pointer transition-colors ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white hover:border-gray-600' 
                  : 'bg-white border-gray-200 text-gray-900 hover:border-blue-300 shadow-sm'
              } border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            >
              {stylePresets.map((style) => (
                <option key={style.value} value={style.value}>{style.label}</option>
              ))}
            </select>
            <div className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <i className="fas fa-paint-brush text-xs"></i>
            </div>
            <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <i className="fas fa-chevron-down text-xs"></i>
            </div>
          </div>
        </div>

        {/* 生成数量 */}
        <div className="space-y-2">
          <label className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <i className="fas fa-layer-group mr-1"></i>生成数量
          </label>
          <div className={`flex items-center justify-between p-1 rounded-xl border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => updateState({ generateCount: Math.max(1, generateCount - 1) })}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <i className="fas fa-minus text-xs"></i>
            </motion.button>
            <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {generateCount}
            </span>
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => updateState({ generateCount: Math.min(isVideoMode ? 3 : 6, generateCount + 1) })}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <i className="fas fa-plus text-xs"></i>
            </motion.button>
          </div>
        </div>
      </div>

      {/* 视频专属设置 */}
      <AnimatePresence>
        {isVideoMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* 视频比例 */}
            <div className="space-y-2">
              <label className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <i className="fas fa-expand mr-1"></i>视频比例
              </label>
              <div className="grid grid-cols-4 gap-2">
                {videoAspectRatios.map((ratio) => (
                  <motion.button
                    key={ratio.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setVideoAspectRatio(ratio.value)}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      videoAspectRatio === ratio.value
                        ? 'bg-orange-50 border-orange-300 text-orange-600 dark:bg-orange-900/30 dark:border-orange-700'
                        : isDark 
                          ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <i className={`fas ${ratio.icon} text-xs mb-1 block`}></i>
                    <span className="text-[10px]">{ratio.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* 视频时长 */}
            <div className="space-y-2">
              <label className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <i className="fas fa-clock mr-1"></i>视频时长
              </label>
              <div className="grid grid-cols-3 gap-2">
                {videoDurations.map((duration) => (
                  <motion.button
                    key={duration.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setVideoDuration(duration.value)}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      videoDuration === duration.value
                        ? 'bg-orange-50 border-orange-300 text-orange-600 dark:bg-orange-900/30 dark:border-orange-700'
                        : isDark 
                          ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xs font-semibold">{duration.label}</div>
                    <div className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{duration.desc}</div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 高级设置折叠面板 */}
      <div className="space-y-3">
        <motion.button
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${
            isDark 
              ? 'bg-gray-800/30 border-gray-700 hover:bg-gray-800/50' 
              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          }`}
        >
          <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <i className="fas fa-cog mr-2"></i>高级设置
          </span>
          <motion.i 
            animate={{ rotate: showAdvancedSettings ? 180 : 0 }}
            className={`fas fa-chevron-down text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
          />
        </motion.button>

        <AnimatePresence>
          {showAdvancedSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700"
            >
              {/* 负面提示词 */}
              <div className="space-y-2">
                <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  负面提示词（不想出现的内容）
                </label>
                <input
                  type="text"
                  placeholder="例如：模糊、变形、低质量..."
                  className={`w-full p-2.5 rounded-lg text-xs ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
              </div>

              {/* 种子值 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    随机种子
                  </label>
                  <button className={`text-[10px] ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    <i className="fas fa-random mr-1"></i>随机
                  </button>
                </div>
                <input
                  type="number"
                  placeholder="-1"
                  className={`w-full p-2.5 rounded-lg text-xs ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 生成按钮 */}
      <div className="pt-2 space-y-3">
        <motion.button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim() || (isImageInputMode && !uploadedImage)}
          whileHover={{ scale: isGenerating ? 1 : 1.02 }}
          whileTap={{ scale: isGenerating ? 1 : 0.98 }}
          className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all relative overflow-hidden group ${
            isGenerating 
              ? 'bg-gray-400 cursor-not-allowed' 
              : `bg-gradient-to-r ${currentMode.color} hover:shadow-2xl`
          }`}
        >
          {/* 光泽动画效果 */}
          <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
          
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <i className="fas fa-circle-notch fa-spin"></i>
              <span>
                {isVideoMode ? '正在生成视频...' : '正在生成图片...'}
              </span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <i className={`fas ${currentMode.icon}`}></i>
              <span>
                {activeMode === 'text-to-image' && '立即生成图片'}
                {activeMode === 'image-to-image' && '开始风格转换'}
                {activeMode === 'text-to-video' && '立即生成视频'}
                {activeMode === 'image-to-video' && '生成动态视频'}
              </span>
            </span>
          )}
        </motion.button>
        
        {/* 算力提示 */}
        <p className={`text-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <i className="fas fa-bolt mr-1 text-yellow-500"></i>
          每次生成消耗 {isVideoMode ? '10' : '2'} 点算力
          {isVideoMode && <span className="ml-2 text-orange-500">视频生成时间较长，请耐心等待</span>}
        </p>
      </div>

      {/* 视频生成加载状态 - 全屏覆盖 */}
      <AnimatePresence>
        {isVideoMode && isGenerating && videoGenerationProgress > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md mx-4 p-8 rounded-3xl shadow-2xl ${
                isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}
            >
              {/* 图标和标题 */}
              <div className="text-center mb-6">
                <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                  isDark ? 'bg-gradient-to-br from-orange-500/20 to-red-600/20' : 'bg-gradient-to-br from-orange-100 to-red-100'
                }`}>
                  <i className="fas fa-film text-3xl text-orange-500 animate-pulse"></i>
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  正在生成视频
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  预计需要 1-3 分钟，请耐心等待
                </p>
              </div>

              {/* 进度条 */}
              <div className="mb-6">
                <div className={`h-3 rounded-full overflow-hidden ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <motion.div
                    className="h-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${videoGenerationProgress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {videoGenerationStatus}
                  </span>
                  <span className={`text-xs font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                    {Math.round(videoGenerationProgress)}%
                  </span>
                </div>
              </div>

              {/* 状态步骤 */}
              <div className="space-y-3">
                {[
                  { label: '提交任务', threshold: 5, icon: 'fa-paper-plane' },
                  { label: 'AI 分析创意', threshold: 25, icon: 'fa-brain' },
                  { label: '生成视频帧', threshold: 50, icon: 'fa-images' },
                  { label: '渲染视频', threshold: 75, icon: 'fa-video' },
                  { label: '完成处理', threshold: 95, icon: 'fa-check-circle' },
                ].map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${
                      videoGenerationProgress >= step.threshold
                        ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white'
                        : isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                    }`}>
                      <i className={`fas ${videoGenerationProgress >= step.threshold ? 'fa-check' : step.icon}`}></i>
                    </div>
                    <span className={`text-sm transition-all duration-300 ${
                      videoGenerationProgress >= step.threshold
                        ? isDark ? 'text-white font-medium' : 'text-gray-900 font-medium'
                        : isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                    {videoGenerationProgress >= step.threshold && videoGenerationProgress < step.threshold + 20 && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-orange-500 ml-auto"
                      >
                        进行中...
                      </motion.span>
                    )}
                  </div>
                ))}
              </div>

              {/* 提示信息 */}
              <div className={`mt-6 p-4 rounded-xl text-xs leading-relaxed ${
                isDark ? 'bg-gray-700/50 text-gray-300' : 'bg-orange-50 text-gray-600'
              }`}>
                <i className="fas fa-info-circle mr-2 text-orange-500"></i>
                视频生成过程中请勿关闭页面或刷新，否则可能导致生成失败。
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
