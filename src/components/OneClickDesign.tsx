import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { llmService } from '@/services/llmService';

interface OneClickDesignProps {
  onGenerate?: (mode: string) => void;
}

const OneClickDesign: React.FC<OneClickDesignProps> = ({ onGenerate }) => {
  const { isDark } = useTheme();
  
  // 生成模式
  const [generationMode, setGenerationMode] = useState<'text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video'>('text-to-image');
  
  // 处理生成模式切换
  const handleModeChange = useCallback((mode: 'text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video') => {
    setGenerationMode(mode);
    // 重置相关状态
    if (mode === 'text-to-image' || mode === 'text-to-video') {
      // 对于文生图和文生视频，不需要参考图片
      setUploadedImage('');
    }
    // 重置生成结果
    setImages([]);
    setVideos([]);
  }, []);
  
  // 图片上传状态
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  // 图生图参数
  const [similarity, setSimilarity] = useState<number>(70);
  const [selectedStyle, setSelectedStyle] = useState<string>('默认');
  
  // 视频参数
  const [videoParams, setVideoParams] = useState({
    duration: 5,
    resolution: '720p' as '720p' | '1080p' | '4k',
    cameraFixed: false
  });
  
  // 创意描述
  const [prompt, setPrompt] = useState<string>('');
  
  // 生成数量
  const [generationCount, setGenerationCount] = useState<number>(3);
  
  // 加载状态
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  
  // 生成结果
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  
  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件大小
      if (file.size > 5 * 1024 * 1024) {
        toast.error('图片大小不能超过 5MB');
        return;
      }
      
      // 验证文件格式
      const allowedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedFormats.includes(file.type)) {
        toast.error('只支持 JPG、PNG、WebP 和 GIF 格式的图片');
        return;
      }
      
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        toast.success('图片上传成功');
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast.error('图片读取失败，请重试');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // 优化提示词
  const handleOptimizePrompt = useCallback(async () => {
    if (!prompt.trim()) {
      toast.warning('请先输入创意描述');
      return;
    }

    setIsOptimizing(true);
    try {
      llmService.setCurrentModel('qwen');
      const instruction = `请将下面的创作提示优化为更清晰的中文指令，保留原意，突出关键元素（主题、风格、色彩、素材）。用1-3个短句表达，避免礼貌语或解释，只输出优化后的文本：

${prompt}`;
      const result = await llmService.generateResponse(instruction);
      const polished = String(result || '').trim();
      if (polished && !/接口不可用|未返回内容/.test(polished)) {
        setPrompt(polished);
        toast.success('提示词优化完成');
      } else {
        toast.error('优化失败，请稍后重试');
      }
    } catch (e) {
      toast.error('优化失败，请稍后重试');
    } finally {
      setIsOptimizing(false);
    }
  }, [prompt]);

  // 实际生成过程
  const generateContent = useCallback(async () => {
    // 输入验证
    if (!prompt.trim() && (generationMode === 'text-to-image' || generationMode === 'text-to-video')) {
      toast.warning('请输入创意描述');
      return;
    }
    
    if ((generationMode === 'image-to-image' || generationMode === 'image-to-video') && !uploadedImage) {
      toast.warning('请上传参考图片');
      return;
    }
    
    // 开始生成
    setIsGenerating(true);
    setProgress(0);
    setGenerationStatus('正在分析输入...');
    
    // 重置之前的结果
    setImages([]);
    setVideos([]);
    
    // 模拟进度更新
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        
        // 更新状态文本
        if (newProgress === 30) setGenerationStatus('正在生成创意方向...');
        if (newProgress === 50) setGenerationStatus('正在生成内容...');
        if (newProgress === 70) setGenerationStatus('正在优化结果...');
        if (newProgress === 90) setGenerationStatus('正在完成...');
        
        return newProgress;
      });
    }, 300);
    
    try {
      // 调用父组件的回调（如果提供）
      if (onGenerate) {
        onGenerate(generationMode);
      }
      
      if (generationMode === 'text-to-image') {
        // 文生图
        const resp = await llmService.generateImage({ 
          prompt: prompt, 
          n: generationCount, 
          size: '1024x1024', 
          response_format: 'url' 
        });
        
        if (!resp.ok) {
          toast.error('生成失败，已回退为占位图');
          // 使用占位图
          setImages([
            `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=${encodeURIComponent(prompt + ' variant 1')}`,
            `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=${encodeURIComponent(prompt + ' variant 2')}`,
            `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=${encodeURIComponent(prompt + ' variant 3')}`,
          ].slice(0, generationCount));
        } else {
          const data: any = resp.data;
          const items: any[] = (data && (data.data || data.images || [])) as any[];
          if (!items.length) {
            toast.info('接口无返回内容，已提供占位图');
            // 使用占位图
            setImages([
              `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=${encodeURIComponent(prompt + ' variant 1')}`,
              `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=${encodeURIComponent(prompt + ' variant 2')}`,
              `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=${encodeURIComponent(prompt + ' variant 3')}`,
            ].slice(0, generationCount));
          } else {
            const imgs = items.map((it: any) => {
              return it.url ? it.url : (it.b64_json ? `data:image/png;base64,${it.b64_json}` : '');
            }).filter(Boolean);
            setImages(imgs);
          }
        }
        setVideos([]);
      } else if (generationMode === 'image-to-image') {
        // 图生图
        if (uploadedImage.startsWith('data:')) {
          toast.error('参考图片为本地数据，需使用可公网访问的图片URL');
          setImages([
            `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=${encodeURIComponent(prompt + ' variant 1')}`,
            `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=${encodeURIComponent(prompt + ' variant 2')}`,
            `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=${encodeURIComponent(prompt + ' variant 3')}`,
          ].slice(0, generationCount));
        } else {
          // 这里可以集成实际的图生图API
          // 暂时使用占位图
          setImages([
            `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=${encodeURIComponent(prompt + ' variant 1')}`,
            `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=${encodeURIComponent(prompt + ' variant 2')}`,
            `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=${encodeURIComponent(prompt + ' variant 3')}`,
          ].slice(0, generationCount));
        }
        setVideos([]);
      } else if (generationMode === 'text-to-video') {
        // 文生视频
        try {
          const text = `${prompt}  --resolution ${videoParams.resolution}  --duration ${videoParams.duration} --camerafixed ${videoParams.cameraFixed}`;
          // 调用实际的文生视频API
          const result = await llmService.generateVideo({
            prompt: text,
            imageUrl: '', // 文生视频不需要图片
            duration: videoParams.duration,
            resolution: videoParams.resolution
          });
          const videoUrl = result.data?.video_url || result.data?.url;
          if (!result.ok || !videoUrl) {
            const msg = result.error || '视频生成失败，请检查API配置或稍后重试';
            toast.error(msg);
            console.error('[Video Generation] Failed:', result);
            setVideos([]);
          } else {
            // 由于API一次只生成一个视频，我们创建多个占位符
            const videos = Array(generationCount).fill(videoUrl);
            setVideos(videos);
            toast.success('视频生成成功！');
          }
        } catch (e: any) {
          toast.error(e?.message || '视频生成失败');
          console.error('[Video Generation] Exception:', e);
          setVideos([]);
        }
        setImages([]);
      } else if (generationMode === 'image-to-video') {
        // 图生视频
        try {
          // 如果图片是本地 base64，先上传到云存储获取公网 URL
          let publicImageUrl = uploadedImage;
          if (uploadedImage.startsWith('data:')) {
            toast.info('正在上传图片到云存储...');
            const { getPublicImageUrl } = await import('@/services/imageService');
            try {
              publicImageUrl = await getPublicImageUrl(uploadedImage);
              console.log('[OneClickDesign] Image uploaded to:', publicImageUrl);
              toast.success('图片上传成功，开始生成视频...');
            } catch (uploadError: any) {
              console.error('[OneClickDesign] Failed to upload image:', uploadError);
              toast.error('图片上传失败: ' + (uploadError.message || '请重试'));
              setVideos([]);
              setImages([]);
              return;
            }
          }
          
          const text = `${prompt}  --resolution ${videoParams.resolution}  --duration ${videoParams.duration} --camerafixed ${videoParams.cameraFixed}`;
          // 调用实际的图生视频API
          const result = await llmService.generateVideo({
            prompt: text,
            imageUrl: publicImageUrl,
            duration: videoParams.duration,
            resolution: videoParams.resolution
          });
          const videoUrl = result.data?.video_url || result.data?.url;
          if (!result.ok || !videoUrl) {
            const msg = result.error || '视频生成失败，请检查API配置或稍后重试';
            toast.error(msg);
            console.error('[Video Generation] Failed:', result);
            setVideos([]);
          } else {
            // 由于API一次只生成一个视频，我们创建多个占位符
            const videos = Array(generationCount).fill(videoUrl);
            setVideos(videos);
            toast.success('视频生成成功！');
          }
        } catch (e: any) {
          toast.error(e?.message || '视频生成失败');
          console.error('[Video Generation] Exception:', e);
          setVideos([]);
        }
        setImages([]);
      }
      
      // 生成完成反馈
      toast.success('生成完成！');
    } catch (e: any) {
      // 错误处理
      toast.error(e?.message || '生成异常，已回退为占位图');
      // 使用占位图
      if (generationMode === 'text-to-image' || generationMode === 'image-to-image') {
        setImages([
          `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=${encodeURIComponent(prompt + ' variant 1')}`,
          `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=${encodeURIComponent(prompt + ' variant 2')}`,
          `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=${encodeURIComponent(prompt + ' variant 3')}`,
        ].slice(0, generationCount));
        setVideos([]);
      } else {
        setVideos([
          'https://example.com/video1.mp4',
          'https://example.com/video2.mp4',
          'https://example.com/video3.mp4',
        ].slice(0, generationCount));
        setImages([]);
      }
    } finally {
      // 清理状态
      setIsGenerating(false);
      setGenerationStatus('');
      setProgress(100);
    }
  }, [prompt, generationMode, uploadedImage, videoParams, generationCount, onGenerate]);
  
  // 生成模式配置
  const generationModes = [
    { id: 'text-to-image', label: '文生图', icon: 'image' },
    { id: 'image-to-image', label: '图生图', icon: 'exchange-alt' },
    { id: 'text-to-video', label: '文生视频', icon: 'film' },
    { id: 'image-to-video', label: '图生视频', icon: 'video' },
  ];
  
  // 风格选项
  const styleOptions = ['默认', '国潮', '杨柳青年画', '泥人张彩塑', '天津卫民俗', '极简', '复古', '赛博朋克', '水墨', '非遗传承'];
  
  return (
    <div className="w-full min-h-[800px] flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 顶部标题 */}
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between border-b backdrop-blur-md flex-shrink-0 bg-white/95 border-gray-100 shadow-md">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 rounded-full relative overflow-hidden bg-gradient-to-br from-red-400/20 to-orange-600/10 shadow-sm">
            <div className="relative z-10 text-red-600">
              <i className="fas fa-magic text-lg"></i>
            </div>
          </span>
          <span className="font-bold text-gray-900 text-lg sm:text-xl">一键设计</span>
        </div>
        <div className="flex items-center gap-3">
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg transition-all hover:bg-gray-100 text-gray-600 hover:text-red-500" 
            aria-label="帮助"
          >
            <i className="fas fa-question-circle text-lg"></i>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg transition-all hover:bg-gray-100 text-gray-600 hover:text-red-500" 
            aria-label="保存"
          >
            <i className="fas fa-save text-lg"></i>
          </motion.button>
        </div>
      </div>
      
      {/* 主要内容区域 */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* 左侧预览区域 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
            {/* 智能设计助手卡片 */}
            <div className="p-6 rounded-2xl border bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-start gap-4">
                <div className="mt-1 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 shadow-sm">
                  <i className="fas fa-magic text-xl text-blue-600"></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold mb-2 text-gray-900">智能设计助手</h3>
                  <p className="text-sm leading-relaxed text-gray-600">
                    输入您的创意构想，AI 将结合天津文化元素为您生成专业的设计方案。支持多风格探索与快速迭代，助您轻松实现创意落地。
                  </p>
                </div>
              </div>
            </div>
            
            {/* 生成模式选择 */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-base font-semibold mb-5 text-gray-900 flex items-center gap-2">
                <i className="fas fa-th-large text-red-500"></i>
                选择生成模式
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                {generationModes.map((mode) => (
                  <motion.button
                    key={mode.id}
                    onClick={() => handleModeChange(mode.id as any)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-3
                      ${generationMode === mode.id
                        ? 'border-red-200 bg-gradient-to-br from-red-50 to-orange-50 text-red-600 shadow-md'
                        : 'border-gray-200 hover:border-red-100 hover:bg-gray-50 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300
                      ${generationMode === mode.id
                        ? 'bg-red-100 text-red-600 shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}>
                      <i className={`fas fa-${mode.icon} text-xl`}></i>
                    </div>
                    <span className="text-sm font-medium">{mode.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* 创意描述 */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-5">
              <div className="flex items-center justify-between">
                <label className="text-base font-semibold flex items-center gap-2 text-gray-900">
                  <i className="fas fa-pen-fancy text-red-500"></i>
                  创意描述
                </label>
                <span className="text-sm font-medium text-gray-400">{prompt.length}/200</span>
              </div>
              <div className="relative group">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, 200))}
                  placeholder="描述您想要创作的内容，例如：具有中国传统元素的现代包装设计，融入杨柳青年画风格..."
                  className="w-full p-6 rounded-2xl h-56 text-base focus:outline-none focus:ring-3 focus:ring-red-500/20 transition-all resize-none shadow-md bg-white border-gray-200 text-gray-900 placeholder-gray-400 border group-hover:border-red-200"
                />
                <div className="absolute bottom-5 right-5 flex gap-3">
                  <motion.button
                    onClick={handleOptimizePrompt}
                    disabled={!prompt.trim() || isOptimizing}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-3 rounded-lg text-sm transition-all hover:bg-gray-100 text-gray-400 hover:text-blue-600 disabled:text-gray-300 shadow-sm"
                    title="AI优化提示词"
                  >
                    {isOptimizing ? (
                      <i className="fas fa-spinner fa-spin text-lg"></i>
                    ) : (
                      <i className="fas fa-magic text-lg"></i>
                    )}
                  </motion.button>
                  <motion.button 
                    onClick={() => setPrompt('')}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-3 rounded-lg text-sm transition-all hover:bg-gray-100 text-gray-400 hover:text-red-600 shadow-sm"
                    title="清空"
                  >
                    <i className="fas fa-trash-alt text-lg"></i>
                  </motion.button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <motion.button
                  onClick={() => setPrompt('新中式国潮插画，传统纹样与现代几何融合，朱砂红与墨黑配色，金色描边，平面设计风格')}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm px-4 py-2 rounded-full border transition-all duration-300 bg-white border-gray-200 hover:border-red-200 hover:text-red-600 text-gray-700 shadow-sm"
                >
                  国潮风格
                </motion.button>
                <motion.button
                  onClick={() => setPrompt('非遗工艺视觉，剪纸/皮影/刺绣元素，手工质感，民俗图案，暖色调，文化传承主题')}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm px-4 py-2 rounded-full border transition-all duration-300 bg-white border-gray-200 hover:border-red-200 hover:text-red-600 text-gray-700 shadow-sm"
                >
                  非遗元素
                </motion.button>
                <motion.button
                  onClick={() => setPrompt('科技未来感设计，赛博朋克美学，霓虹光效，数字艺术，冷色调蓝紫渐变，智能交互视觉')}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm px-4 py-2 rounded-full border transition-all duration-300 bg-white border-gray-200 hover:border-red-200 hover:text-red-600 text-gray-700 shadow-sm"
                >
                  科创思维
                </motion.button>
                <motion.button
                  onClick={() => setPrompt('天津地域文化，海河/津门故里/五大道建筑，方言元素，码头文化，市井气息，本土特色视觉')}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm px-4 py-2 rounded-full border transition-all duration-300 bg-white border-gray-200 hover:border-red-200 hover:text-red-600 text-gray-700 shadow-sm"
                >
                  地域素材
                </motion.button>
                <motion.button
                  onClick={() => setPrompt('传统节日庆典，红灯笼/烟花/舞龙舞狮，喜庆氛围，中国红金色配色，团圆祝福主题')}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm px-4 py-2 rounded-full border transition-all duration-300 bg-white border-gray-200 hover:border-red-200 hover:text-red-600 text-gray-700 shadow-sm"
                >
                  节日庆典
                </motion.button>
                <motion.button
                  onClick={() => setPrompt('文创产品设计，博物馆联名/非遗IP/城市符号，实用美学，年轻潮流，包装/周边/礼品设计')}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm px-4 py-2 rounded-full border transition-all duration-300 bg-white border-gray-200 hover:border-red-200 hover:text-red-600 text-gray-700 shadow-sm"
                >
                  文创产品
                </motion.button>
              </div>
            </div>
            
            {/* 图片上传（针对图生图和图生视频） */}
            {(generationMode === 'image-to-image' || generationMode === 'image-to-video') && (
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="text-base font-semibold mb-4 text-gray-900">上传参考图片</h3>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div 
                    className={`w-32 sm:w-40 h-32 sm:h-40 rounded-xl border-2 border-dashed flex items-center justify-center relative overflow-hidden group cursor-pointer transition-all duration-300
                      ${isUploading ? 'opacity-70 cursor-not-allowed' : 'hover:border-red-300 hover:bg-red-50/30'}
                    `}
                    onClick={() => !isUploading && document.getElementById('image-upload')?.click()}
                  >
                    {isUploading ? (
                      <div className="text-center p-4 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-3 border-t-transparent border-blue-500 rounded-full animate-spin mb-3"></div>
                        <div className="text-sm opacity-70">上传中...</div>
                      </div>
                    ) : uploadedImage ? (
                      <img src={uploadedImage} alt="参考图片" className="w-full h-full object-cover rounded-lg transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="text-center p-4">
                        <i className="fas fa-cloud-upload-alt text-3xl mb-2 opacity-50"></i>
                        <div className="text-sm opacity-70">点击上传参考图片</div>
                      </div>
                    )}
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  <div className="flex-1 text-sm text-gray-600 space-y-2">
                    <p className="font-medium">支持 JPG、PNG、WebP 和 GIF 格式</p>
                    <p className="text-sm opacity-70">文件大小不超过 5MB</p>
                    <p className="text-sm opacity-70">建议上传清晰、主题明确的图片</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* 图生图参数 */}
            {generationMode === 'image-to-image' && (
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-6">
                <h3 className="text-base font-semibold text-gray-900">图生图参数</h3>
                
                {/* 相似度滑块 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">相似度</label>
                    <span className="text-sm font-medium text-gray-500">{similarity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={similarity}
                    onChange={(e) => setSimilarity(Number(e.target.value))}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <div className="flex justify-between text-sm mt-2 text-gray-400">
                    <span>创意化</span>
                    <span>参考原图</span>
                  </div>
                </div>
                
                {/* 风格选择 */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">风格预设</label>
                  <div className="flex flex-wrap gap-3">
                    {styleOptions.map((style) => (
                      <motion.button
                        key={style}
                        onClick={() => setSelectedStyle(style)}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                          ${selectedStyle === style
                            ? 'bg-red-50 text-red-600 border-red-200 shadow-sm'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }
                          border
                        `}
                      >
                        {style}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* 视频参数 */}
            {(generationMode === 'text-to-video' || generationMode === 'image-to-video') && (
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="text-base font-semibold mb-5 text-gray-900 flex items-center gap-2">
                  <i className="fas fa-video text-red-500"></i>
                  视频参数
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  {/* 时长 */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700">时长（秒）</label>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-red-200 transition-all duration-300 shadow-sm">
                      <motion.button
                        onClick={() => setVideoParams(prev => ({ ...prev, duration: Math.max(3, prev.duration - 1) }))}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-100 hover:text-red-600"
                      >
                        <i className="fas fa-minus"></i>
                      </motion.button>
                      <span className="text-base font-medium">{videoParams.duration}</span>
                      <motion.button
                        onClick={() => setVideoParams(prev => ({ ...prev, duration: Math.min(30, prev.duration + 1) }))}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-100 hover:text-red-600"
                      >
                        <i className="fas fa-plus"></i>
                      </motion.button>
                    </div>
                  </div>
                  
                  {/* 分辨率 */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700">分辨率</label>
                    <div className="relative">
                      <select
                        value={videoParams.resolution}
                        onChange={(e) => setVideoParams(prev => ({ ...prev, resolution: e.target.value as '720p' | '1080p' | '4k' }))}
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm appearance-none cursor-pointer transition-colors hover:border-red-200 shadow-sm focus:outline-none focus:ring-3 focus:ring-red-500/20"
                      >
                        <option value="720p">720p</option>
                        <option value="1080p">1080p</option>
                        <option value="4k">4K</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <i className="fas fa-chevron-down"></i>
                      </div>
                    </div>
                  </div>
                  
                  {/* 相机固定 */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700">相机固定</label>
                    <div className="relative">
                      <select
                        value={videoParams.cameraFixed ? 'true' : 'false'}
                        onChange={(e) => setVideoParams(prev => ({ ...prev, cameraFixed: e.target.value === 'true' }))}
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm appearance-none cursor-pointer transition-colors hover:border-red-200 shadow-sm focus:outline-none focus:ring-3 focus:ring-red-500/20"
                      >
                        <option value="false">跟随移动</option>
                        <option value="true">固定视角</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <i className="fas fa-chevron-down"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 生成设置 */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-base font-semibold mb-5 text-gray-900 flex items-center gap-2">
                <i className="fas fa-sliders-h text-red-500"></i>
                生成设置
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700">风格预设</label>
                  <div className="relative">
                    <select className="w-full p-3 pl-4 pr-10 rounded-xl text-sm appearance-none cursor-pointer transition-colors bg-white border-gray-200 text-gray-900 hover:border-red-200 shadow-sm border focus:outline-none focus:ring-3 focus:ring-[#C02C38]/20">
                      <option value="">默认风格</option>
                      <option value="国潮">国潮</option>
                      <option value="杨柳青年画">杨柳青年画</option>
                      <option value="泥人张彩塑">泥人张彩塑</option>
                      <option value="天津卫民俗">天津卫民俗</option>
                      <option value="极简">极简</option>
                      <option value="复古">复古</option>
                      <option value="赛博朋克">赛博朋克</option>
                      <option value="水墨">水墨</option>
                      <option value="非遗传承">非遗传承</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <i className="fas fa-chevron-down"></i>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700">生成数量</label>
                  <div className="flex items-center justify-between p-3 rounded-xl border bg-white border-gray-200 shadow-sm">
                    <motion.button
                      onClick={() => setGenerationCount(Math.max(1, generationCount - 1))}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-100 hover:text-red-600"
                    >
                      <i className="fas fa-minus"></i>
                    </motion.button>
                    <span className="text-base font-medium text-gray-900">{generationCount}</span>
                    <motion.button
                      onClick={() => setGenerationCount(Math.min(5, generationCount + 1))}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-100 hover:text-red-600"
                    >
                      <i className="fas fa-plus"></i>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 生成按钮 */}
            <div className="pt-4">
              <motion.button
                onClick={generateContent}
                disabled={isGenerating}
                whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(220, 38, 38, 0.1), 0 10px 10px -5px rgba(220, 38, 38, 0.04)" }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all relative overflow-hidden group bg-gradient-to-r from-[#C02C38] to-[#E60012] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isGenerating ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                      <span>{generationStatus || '生成中...'}</span>
                    </div>
                  ) : (
                    <>
                      <i className="fas fa-magic"></i>
                      <span>立即生成方案</span>
                    </>
                  )}
                </span>
                {/* 背景光效 */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
              </motion.button>
              <p className="text-center mt-3 text-xs text-gray-400">
                <i className="fas fa-info-circle mr-1"></i>每次生成消耗 2 点算力
              </p>
            </div>
            
            {/* 生成进度条 */}
            {isGenerating && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-100"
              >
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">生成进度</span>
                    <span className="text-sm font-semibold text-red-600">{progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${progress}%` }}
                    ></motion.div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  <i className="fas fa-spinner fa-spin mr-1"></i>{generationStatus || '正在生成创意内容...'}
                </p>
              </motion.div>
            )}
            
            {/* 生成结果 */}
            {(images.length > 0 || videos.length > 0) && (
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <i className="fas fa-images text-red-500"></i>
                    生成结果
                  </h3>
                  <div className="flex gap-2">
                    <motion.button 
                      whileHover={{ scale: 1.05 }} 
                      whileTap={{ scale: 0.95 }}
                      className="text-xs px-3 py-1.5 rounded-full border transition-colors bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                    >
                      <i className="fas fa-th-large mr-1"></i>网格视图
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }} 
                      whileTap={{ scale: 0.95 }}
                      className="text-xs px-3 py-1.5 rounded-full border transition-colors border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      <i className="fas fa-list mr-1"></i>列表视图
                    </motion.button>
                  </div>
                </div>
                {images.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {images.map((image, index) => (
                      <motion.div 
                        key={index} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="space-y-3 group"
                      >
                        <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-100 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:border-red-200">
                          <img src={image} alt={`生成结果 ${index + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                        <div className="flex gap-2">
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 p-2.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-300 shadow-sm">
                            <i className="fas fa-download mr-1"></i>下载
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 p-2.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all duration-300 shadow-sm">
                            <i className="fas fa-edit mr-1"></i>编辑
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : videos.length > 0 ? (
                  <div className="space-y-5">
                    {videos.map((video, index) => (
                      <motion.div 
                        key={index} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-gray-200 rounded-xl p-4 transition-all duration-300 hover:shadow-md hover:border-red-100"
                      >
                        <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200"></div>
                          <i className="fas fa-play-circle text-5xl text-red-500 opacity-80 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100 relative z-10"></i>
                        </div>
                        <div className="mt-4 flex gap-3">
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 p-2.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-300 shadow-sm">
                            <i className="fas fa-download mr-1"></i>下载
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 p-2.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all duration-300 shadow-sm">
                            <i className="fas fa-share-alt mr-1"></i>分享
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 p-2.5 rounded-lg text-xs font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-all duration-300 shadow-sm">
                            <i className="fas fa-edit mr-1"></i>编辑
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
        
        {/* 右侧辅助面板 */}
        <div className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-gray-200 p-4 sm:p-6 overflow-y-auto shadow-sm hidden md:block">
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-gray-800">创作助手</h2>
              <button className="p-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-500" aria-label="刷新">
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
            {/* 品牌故事 */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold mb-3 text-gray-900">品牌故事</h3>
              <p className="text-xs leading-relaxed text-gray-600 mb-3">
                天津作为历史文化名城，拥有丰富的传统工艺和文化遗产。AI 设计助手将这些元素融入现代设计，创造出兼具传统韵味与时尚感的作品。
              </p>
              <button className="text-xs text-red-600 hover:underline flex items-center gap-1">
                <span>了解更多</span>
                <i className="fas fa-arrow-right text-[10px]"></i>
              </button>
            </div>
            
            {/* 创作技巧 */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold mb-3 text-gray-900">创作技巧</h3>
              <ul className="space-y-3">
                <li className="flex gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-red-500"></div>
                  <p className="text-xs leading-relaxed text-gray-600">
                    使用具体的形容词描述您想要的效果，例如："一只拿着糖葫芦的赛博朋克风格醒狮"
                  </p>
                </li>
                <li className="flex gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-red-500"></div>
                  <p className="text-xs leading-relaxed text-gray-600">
                    结合天津文化元素，如："杨柳青年画风格"、"传统纹样"、"红蓝配色"
                  </p>
                </li>
                <li className="flex gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-red-500"></div>
                  <p className="text-xs leading-relaxed text-gray-600">
                    尝试不同的风格预设，获取多样化的创作灵感
                  </p>
                </li>
              </ul>
            </div>
            
            {/* 热门标签 */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold mb-3 text-gray-900">热门标签</h3>
              <div className="flex flex-wrap gap-2">
                {['杨柳青年画', '泥人张', '耳朵眼炸糕', '老美华', '大福来', '果仁张', '茶汤李', '国潮', '赛博朋克', '水墨', '复古', '极简', '节日限定', '非遗传承', '天津卫'].map((tag) => (
                  <motion.button
                    key={tag}
                    onClick={() => setPrompt(prev => prev + ' ' + tag)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-200 transition-all"
                  >
                    {tag}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OneClickDesign;