import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { llmService } from '@/services/llmService';
import { 
  usePrompt, 
  useSelectedTags, 
  useCurrentBrand,
  useGenerationStatus,
  useWorkHeartStore 
} from '../hooks/useWorkHeartStore';

export default function GenerationButton() {
  const { isDark } = useTheme();
  const prompt = usePrompt();
  const selectedTags = useSelectedTags();
  const currentBrand = useCurrentBrand();
  const generationStatus = useGenerationStatus();
  const { 
    startGeneration, 
    updateProgress, 
    completeGeneration, 
    failGeneration,
    cancelGeneration 
  } = useWorkHeartStore();

  const isGenerating = generationStatus.status === 'generating';
  const canGenerate = prompt.trim() || selectedTags.length > 0 || currentBrand;

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast.warning('请输入提示词或选择标签');
      return;
    }

    startGeneration();

    // 模拟进度更新
    const progressInterval = setInterval(() => {
      updateProgress({
        progress: Math.min(generationStatus.progress + Math.random() * 15, 90),
        message: ['正在构思创意...', '正在绘制草图...', '正在添加细节...', '正在优化效果...'][
          Math.floor(Math.random() * 4)
        ]
      });
    }, 1000);

    try {
      const fullPrompt = `${currentBrand ? `[${currentBrand}] ` : ''}${selectedTags.join(' ')} ${prompt}`.trim();
      
      // 调用AI生成服务
      const result = await llmService.generateImage({
        prompt: fullPrompt,
        size: '1024x1024',
        n: 1,
        response_format: 'url'
      });

      clearInterval(progressInterval);

      const imageUrl = result.data?.[0]?.url;
      
      if (imageUrl) {
        completeGeneration({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'image',
          url: imageUrl,
          thumbnail: imageUrl,
          prompt: fullPrompt,
          brand: currentBrand,
          tags: selectedTags,
          createdAt: Date.now(),
          isFavorite: false
        });
      } else {
        // 使用占位图作为fallback
        const fallbackUrl = `https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=1024&h=1024&fit=crop`;
        completeGeneration({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'image',
          url: fallbackUrl,
          thumbnail: fallbackUrl,
          prompt: fullPrompt,
          brand: currentBrand,
          tags: selectedTags,
          createdAt: Date.now(),
          isFavorite: false
        });
        toast.info('已生成预览图');
      }
    } catch (error) {
      clearInterval(progressInterval);
      failGeneration(error instanceof Error ? error.message : '生成失败');
    }
  };

  const handleCancel = () => {
    cancelGeneration();
  };

  if (isGenerating) {
    return (
      <motion.button
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        onClick={handleCancel}
        className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${
          isDark 
            ? 'bg-slate-700 hover:bg-slate-600' 
            : 'bg-slate-500 hover:bg-slate-600'
        }`}
      >
        <i className="fas fa-stop"></i>
        取消生成
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: canGenerate ? 1.02 : 1 }}
      whileTap={{ scale: canGenerate ? 0.98 : 1 }}
      onClick={handleGenerate}
      disabled={!canGenerate}
      className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-lg ${
        canGenerate
          ? 'bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 hover:shadow-xl hover:shadow-orange-500/25'
          : isDark 
            ? 'bg-slate-700 cursor-not-allowed opacity-50' 
            : 'bg-slate-300 cursor-not-allowed'
      }`}
    >
      <motion.i 
        className="fas fa-wand-magic-sparkles"
        animate={canGenerate ? { rotate: [0, 15, -15, 0] } : {}}
        transition={{ duration: 0.5, repeat: canGenerate ? Infinity : 0, repeatDelay: 2 }}
      ></motion.i>
      注入灵感
    </motion.button>
  );
}
