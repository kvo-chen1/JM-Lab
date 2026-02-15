import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../../hooks/useCreateStore';
import { llmService } from '@/services/llmService';
import { toast } from 'sonner';
import { 
  ImagePlus, Expand, Paintbrush, Wand2, 
  Upload, X, Check, ArrowRight, ArrowLeft,
  ArrowUp, ArrowDown, Maximize, Loader2
} from 'lucide-react';

// 图生图风格预设
const IMAGE_TO_IMAGE_STYLES = [
  { id: 'similar', name: '相似生成', description: '保持相似度，重新生成' },
  { id: 'creative', name: '创意变化', description: '在基础上创意发挥' },
  { id: 'enhance', name: '细节增强', description: '增强细节和质感' },
  { id: 'simplify', name: '简化风格', description: '简化画面元素' },
];

// 扩图方向选项
const EXPAND_DIRECTIONS = [
  { id: 'all', name: '四周', icon: Maximize },
  { id: 'left', name: '向左', icon: ArrowLeft },
  { id: 'right', name: '向右', icon: ArrowRight },
  { id: 'top', name: '向上', icon: ArrowUp },
  { id: 'bottom', name: '向下', icon: ArrowDown },
];

export const RefinementPanel: React.FC = () => {
  const { isDark } = useTheme();
  const { 
    currentImage: rawCurrentImage,
    refinementMode,
    setRefinementMode,
    refinementPrompt,
    setRefinementPrompt,
    expandRatio,
    setExpandRatio,
    setGeneratedResults,
    setIsGenerating
  } = useCreateStore();
  
  // 确保 currentImage 安全
  const currentImage = rawCurrentImage || null;

  const [activeTab, setActiveTab] = useState<'image2image' | 'expand' | 'inpaint'>('image2image');
  const [selectedStyle, setSelectedStyle] = useState('similar');
  const [selectedDirection, setSelectedDirection] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // 处理图片上传
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        toast.success('图片上传成功');
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // 获取当前使用的图片
  const getCurrentImage = useCallback(() => {
    return uploadedImage || currentImage;
  }, [uploadedImage, currentImage]);

  // 图生图处理
  const handleImageToImage = useCallback(async () => {
    const imageUrl = getCurrentImage();
    if (!imageUrl) {
      toast.warning('请先上传或选择一张图片');
      return;
    }

    setIsProcessing(true);
    setIsGenerating(true);

    try {
      // 构建提示词
      let prompt = refinementPrompt;
      if (!prompt) {
        const styleMap: Record<string, string> = {
          'similar': 'Generate a similar image with slight variations',
          'creative': 'Create a creative variation of this image',
          'enhance': 'Enhance details and quality of this image',
          'simplify': 'Simplify the composition while keeping main elements'
        };
        prompt = styleMap[selectedStyle] || styleMap['similar'];
      }

      // 调用图生图API
      const result = await llmService.generateImage({
        prompt: prompt,
        size: '1024x1024',
        n: 1
      });

      if (result.ok && result.data?.data && result.data.data.length > 0) {
        toast.info('正在保存图片到云存储...');
        
        // 上传图片到 Supabase Storage
        let permanentUrl = result.data.data[0].url;
        try {
          const { downloadAndUploadImage } = await import('@/services/imageService');
          permanentUrl = await downloadAndUploadImage(result.data.data[0].url, 'works');
          console.log('[RefinementPanel] Image uploaded to:', permanentUrl);
        } catch (uploadError) {
          console.error('[RefinementPanel] Failed to upload image:', uploadError);
          toast.warning('图片生成成功，但上传到永久存储失败');
        }
        
        const newResult = {
          id: Date.now(),
          thumbnail: permanentUrl,
          prompt: prompt,
          timestamp: new Date().toISOString()
        };
        setGeneratedResults([newResult]);
        toast.success('图生图完成并保存到云存储！');
      } else {
        toast.error(result.error || '生成失败');
      }
    } catch (error) {
      toast.error('处理过程出错');
    } finally {
      setIsProcessing(false);
      setIsGenerating(false);
    }
  }, [getCurrentImage, refinementPrompt, selectedStyle, setGeneratedResults, setIsGenerating]);

  // 智能扩图处理
  const handleExpand = useCallback(async () => {
    const imageUrl = getCurrentImage();
    if (!imageUrl) {
      toast.warning('请先上传或选择一张图片');
      return;
    }

    setIsProcessing(true);
    setIsGenerating(true);

    try {
      const result = await llmService.expandImage(imageUrl, expandRatio, selectedDirection);

      if (result.success && result.imageUrl) {
        toast.info('正在保存图片到云存储...');
        
        // 上传图片到 Supabase Storage
        let permanentUrl = result.imageUrl;
        try {
          const { downloadAndUploadImage } = await import('@/services/imageService');
          permanentUrl = await downloadAndUploadImage(result.imageUrl, 'works');
          console.log('[RefinementPanel] Expanded image uploaded to:', permanentUrl);
        } catch (uploadError) {
          console.error('[RefinementPanel] Failed to upload expanded image:', uploadError);
          toast.warning('扩图成功，但上传到永久存储失败');
        }
        
        const newResult = {
          id: Date.now(),
          thumbnail: permanentUrl,
          prompt: `扩图 ${expandRatio}x ${selectedDirection}`,
          timestamp: new Date().toISOString()
        };
        setGeneratedResults([newResult]);
        toast.success('扩图完成并保存到云存储！');
      } else {
        toast.error(result.error || '扩图失败');
      }
    } catch (error) {
      toast.error('处理过程出错');
    } finally {
      setIsProcessing(false);
      setIsGenerating(false);
    }
  }, [getCurrentImage, expandRatio, selectedDirection, setGeneratedResults, setIsGenerating]);

  // 局部重绘处理
  const handleInpaint = useCallback(async () => {
    const imageUrl = getCurrentImage();
    if (!imageUrl) {
      toast.warning('请先上传或选择一张图片');
      return;
    }

    if (!refinementPrompt.trim()) {
      toast.warning('请输入要修改的内容描述');
      return;
    }

    setIsProcessing(true);
    setIsGenerating(true);

    try {
      const result = await llmService.inpaintImage(imageUrl, refinementPrompt);

      if (result.success && result.imageUrl) {
        toast.info('正在保存图片到云存储...');
        
        // 上传图片到 Supabase Storage
        let permanentUrl = result.imageUrl;
        try {
          const { downloadAndUploadImage } = await import('@/services/imageService');
          permanentUrl = await downloadAndUploadImage(result.imageUrl, 'works');
          console.log('[RefinementPanel] Inpainted image uploaded to:', permanentUrl);
        } catch (uploadError) {
          console.error('[RefinementPanel] Failed to upload inpainted image:', uploadError);
          toast.warning('局部重绘成功，但上传到永久存储失败');
        }
        
        const newResult = {
          id: Date.now(),
          thumbnail: permanentUrl,
          prompt: `局部重绘: ${refinementPrompt}`,
          timestamp: new Date().toISOString()
        };
        setGeneratedResults([newResult]);
        toast.success('局部重绘完成并保存到云存储！');
      } else {
        toast.error(result.error || '重绘失败');
      }
    } catch (error) {
      toast.error('处理过程出错');
    } finally {
      setIsProcessing(false);
      setIsGenerating(false);
    }
  }, [getCurrentImage, refinementPrompt, setGeneratedResults, setIsGenerating]);

  // 清除上传的图片
  const clearUploadedImage = useCallback(() => {
    setUploadedImage(null);
    toast.success('已清除上传的图片');
  }, []);

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* 标签切换 */}
      <div className="flex p-2 gap-1">
        {[
          { id: 'image2image', name: '图生图', icon: ImagePlus },
          { id: 'expand', name: '智能扩图', icon: Expand },
          { id: 'inpaint', name: '局部重绘', icon: Paintbrush },
        ].map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1 ${
              activeTab === tab.id
                ? 'bg-violet-500 text-white shadow-md'
                : isDark
                  ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.name}</span>
          </motion.button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 p-4">
        <AnimatePresence mode="wait">
          {/* 图生图 */}
          {activeTab === 'image2image' && (
            <motion.div
              key="image2image"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* 图片上传/预览 */}
              <div className={`p-4 rounded-xl border-2 border-dashed ${
                isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-300'
              }`}>
                {getCurrentImage() ? (
                  <div className="relative">
                    <img 
                      src={getCurrentImage()!} 
                      alt="参考图" 
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    {uploadedImage && (
                      <button
                        onClick={clearUploadedImage}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                    <Upload className="w-10 h-10 mb-2 text-gray-400" />
                    <span className="text-sm text-gray-500">点击上传参考图片</span>
                    <span className="text-xs text-gray-400 mt-1">或从画布选择图片</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>

              {/* 风格选择 */}
              <div>
                <div className="text-sm font-medium mb-2">生成风格</div>
                <div className="grid grid-cols-2 gap-2">
                  {IMAGE_TO_IMAGE_STYLES.map((style) => (
                    <motion.button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      whileTap={{ scale: 0.95 }}
                      className={`p-3 rounded-xl text-left transition-all border ${
                        selectedStyle === style.id
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                          : isDark 
                            ? 'bg-gray-800 border-gray-700 hover:border-violet-500' 
                            : 'bg-white border-gray-200 hover:border-violet-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{style.name}</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {style.description}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* 提示词输入 */}
              <div>
                <div className="text-sm font-medium mb-2">补充描述（可选）</div>
                <textarea
                  value={refinementPrompt}
                  onChange={(e) => setRefinementPrompt(e.target.value)}
                  placeholder="描述你想要的修改或效果..."
                  className={`w-full p-3 rounded-xl resize-none h-20 text-sm ${
                    isDark 
                      ? 'bg-gray-800 text-white placeholder-gray-500 border-gray-700' 
                      : 'bg-white text-gray-900 placeholder-gray-400 border-gray-200'
                  } border focus:outline-none focus:ring-2 focus:ring-violet-500`}
                />
              </div>

              {/* 生成按钮 */}
              <motion.button
                onClick={handleImageToImage}
                disabled={isProcessing || !getCurrentImage()}
                whileTap={{ scale: 0.95 }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    开始生成
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* 智能扩图 */}
          {activeTab === 'expand' && (
            <motion.div
              key="expand"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* 图片预览 */}
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                {getCurrentImage() ? (
                  <img 
                    src={getCurrentImage()!} 
                    alt="原图" 
                    className="w-full h-40 object-contain rounded-lg"
                  />
                ) : (
                  <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                    <Upload className="w-10 h-10 mb-2 text-gray-400" />
                    <span className="text-sm text-gray-500">点击上传图片</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>

              {/* 扩图比例 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">扩展比例</span>
                  <span className="text-xs text-violet-500 font-medium">{expandRatio.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1.2"
                  max="2.0"
                  step="0.1"
                  value={expandRatio}
                  onChange={(e) => setExpandRatio(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1.2x</span>
                  <span>2.0x</span>
                </div>
              </div>

              {/* 扩展方向 */}
              <div>
                <div className="text-sm font-medium mb-2">扩展方向</div>
                <div className="grid grid-cols-5 gap-2">
                  {EXPAND_DIRECTIONS.map((dir) => (
                    <motion.button
                      key={dir.id}
                      onClick={() => setSelectedDirection(dir.id)}
                      whileTap={{ scale: 0.95 }}
                      className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                        selectedDirection === dir.id
                          ? 'bg-violet-500 text-white'
                          : isDark 
                            ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <dir.icon className="w-5 h-5" />
                      <span className="text-xs">{dir.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* 说明 */}
              <div className={`p-3 rounded-xl text-xs ${isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-600'}`}>
                <div className="flex items-start gap-2">
                  <Maximize className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>智能扩图会根据原图内容自动扩展画布，保持风格一致性。扩展后的图片可在预览区查看。</p>
                </div>
              </div>

              {/* 生成按钮 */}
              <motion.button
                onClick={handleExpand}
                disabled={isProcessing || !getCurrentImage()}
                whileTap={{ scale: 0.95 }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    扩图中...
                  </>
                ) : (
                  <>
                    <Expand className="w-4 h-4" />
                    开始扩图
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* 局部重绘 */}
          {activeTab === 'inpaint' && (
            <motion.div
              key="inpaint"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* 图片预览 */}
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                {getCurrentImage() ? (
                  <div className="relative">
                    <img 
                      src={getCurrentImage()!} 
                      alt="原图" 
                      className="w-full h-40 object-contain rounded-lg"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                      <p className="text-white text-sm text-center px-4">
                        在画布上框选要修改的区域<br/>
                        <span className="text-xs text-white/70">然后输入修改描述</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                    <Upload className="w-10 h-10 mb-2 text-gray-400" />
                    <span className="text-sm text-gray-500">点击上传图片</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>

              {/* 修改描述 */}
              <div>
                <div className="text-sm font-medium mb-2">修改描述</div>
                <textarea
                  value={refinementPrompt}
                  onChange={(e) => setRefinementPrompt(e.target.value)}
                  placeholder="描述你想要添加或修改的内容，例如：添加一只蝴蝶、将背景换成森林..."
                  className={`w-full p-3 rounded-xl resize-none h-24 text-sm ${
                    isDark 
                      ? 'bg-gray-800 text-white placeholder-gray-500 border-gray-700' 
                      : 'bg-white text-gray-900 placeholder-gray-400 border-gray-200'
                  } border focus:outline-none focus:ring-2 focus:ring-violet-500`}
                />
              </div>

              {/* 提示 */}
              <div className={`p-3 rounded-xl text-xs ${isDark ? 'bg-amber-900/20 text-amber-300' : 'bg-amber-50 text-amber-600'}`}>
                <div className="flex items-start gap-2">
                  <Paintbrush className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">使用提示：</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>描述越具体，效果越好</li>
                      <li>可以添加、删除或替换元素</li>
                      <li>支持风格转换和细节调整</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 生成按钮 */}
              <motion.button
                onClick={handleInpaint}
                disabled={isProcessing || !getCurrentImage() || !refinementPrompt.trim()}
                whileTap={{ scale: 0.95 }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    重绘中...
                  </>
                ) : (
                  <>
                    <Paintbrush className="w-4 h-4" />
                    开始重绘
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
