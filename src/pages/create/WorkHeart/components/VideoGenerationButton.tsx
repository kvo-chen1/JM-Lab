import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

export default function VideoGenerationButton() {
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

  const [showOptions, setShowOptions] = useState(false);
  const [videoOptions, setVideoOptions] = useState({
    duration: 5,
    resolution: '720p' as '720p' | '1080p',
    useImage: false
  });

  const isGenerating = generationStatus.status === 'generating';
  const canGenerate = prompt.trim() || selectedTags.length > 0 || currentBrand;

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast.warning('请输入提示词或选择标签');
      return;
    }

    setShowOptions(false);
    startGeneration();

    // 模拟进度更新
    const progressInterval = setInterval(() => {
      updateProgress({
        progress: Math.min(generationStatus.progress + Math.random() * 10, 90),
        message: ['正在构思创意...', '正在生成视频帧...', '正在渲染视频...', '正在优化效果...'][
          Math.floor(Math.random() * 4)
        ],
        estimatedTime: 60
      });
    }, 2000);

    try {
      const fullPrompt = `${currentBrand ? `[${currentBrand}] ` : ''}${selectedTags.join(' ')} ${prompt}`.trim();
      
      // 调用视频生成服务
      const result = await llmService.generateVideo({
        prompt: fullPrompt,
        duration: videoOptions.duration,
        resolution: videoOptions.resolution,
        aspectRatio: '16:9'
      });

      clearInterval(progressInterval);

      if (result.ok && result.data?.video_url) {
        completeGeneration({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'video',
          url: result.data.video_url,
          thumbnail: result.data.thumbnail_url || result.data.video_url,
          prompt: fullPrompt,
          brand: currentBrand,
          tags: selectedTags,
          createdAt: Date.now(),
          isFavorite: false,
          metadata: {
            duration: videoOptions.duration
          }
        });
        toast.success('视频生成成功！');
      } else {
        throw new Error(result.error || '视频生成失败');
      }
    } catch (error) {
      clearInterval(progressInterval);
      failGeneration(error instanceof Error ? error.message : '生成失败');
      toast.error('视频生成失败，请重试');
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
    <div className="relative">
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: canGenerate ? 1.02 : 1 }}
          whileTap={{ scale: canGenerate ? 0.98 : 1 }}
          onClick={() => setShowOptions(!showOptions)}
          disabled={!canGenerate}
          className={`flex-1 py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-lg ${
            canGenerate
              ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:shadow-xl hover:shadow-pink-500/25'
              : isDark 
                ? 'bg-slate-700 cursor-not-allowed opacity-50' 
                : 'bg-slate-300 cursor-not-allowed'
          }`}
        >
          <motion.i 
            className="fas fa-video"
            animate={canGenerate ? { rotate: [0, 15, -15, 0] } : {}}
            transition={{ duration: 0.5, repeat: canGenerate ? Infinity : 0, repeatDelay: 2 }}
          ></motion.i>
          生成视频
        </motion.button>
        
        <motion.button
          whileHover={{ scale: canGenerate ? 1.05 : 1 }}
          whileTap={{ scale: canGenerate ? 0.95 : 1 }}
          onClick={() => setShowOptions(!showOptions)}
          disabled={!canGenerate}
          className={`px-4 rounded-xl transition-all ${
            canGenerate
              ? isDark 
                ? 'bg-slate-800 text-white hover:bg-slate-700' 
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              : isDark 
                ? 'bg-slate-800 cursor-not-allowed opacity-50' 
                : 'bg-slate-200 cursor-not-allowed'
          }`}
        >
          <i className={`fas fa-cog transition-transform ${showOptions ? 'rotate-180' : ''}`}></i>
        </motion.button>
      </div>

      {/* 视频选项面板 */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`absolute bottom-full left-0 right-0 mb-2 p-4 rounded-xl border shadow-xl ${
              isDark 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-white border-slate-200'
            }`}
          >
            <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              视频设置
            </h4>
            
            {/* 时长选择 */}
            <div className="mb-3">
              <label className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                时长
              </label>
              <div className="flex gap-2">
                {[5, 10].map((duration) => (
                  <button
                    key={duration}
                    onClick={() => setVideoOptions(prev => ({ ...prev, duration }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      videoOptions.duration === duration
                        ? isDark 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-purple-500 text-white'
                        : isDark 
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {duration} 秒
                  </button>
                ))}
              </div>
            </div>

            {/* 分辨率选择 */}
            <div className="mb-3">
              <label className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                分辨率
              </label>
              <div className="flex gap-2">
                {[
                  { id: '720p', label: '720p' },
                  { id: '1080p', label: '1080p' }
                ].map((res) => (
                  <button
                    key={res.id}
                    onClick={() => setVideoOptions(prev => ({ ...prev, resolution: res.id as any }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      videoOptions.resolution === res.id
                        ? isDark 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-purple-500 text-white'
                        : isDark 
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {res.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 生成按钮 */}
            <button
              onClick={handleGenerate}
              className="w-full py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
            >
              开始生成
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
