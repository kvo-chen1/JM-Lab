import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import patternService, { UserPattern } from '@/services/patternService';
import { TRADITIONAL_PATTERNS, TraditionalPattern } from '@/constants/creativeData';
import { AuthContext } from '@/contexts/authContext';
import { llmService } from '@/services/llmService';
import { useCreateStore } from '../../hooks/useCreateStore';
import { Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PatternPanelProps {
  onSelectPattern?: (pattern: TraditionalPattern | UserPattern) => void;
}

// 融合风格选项
const FUSION_STYLES = [
  { id: 'harmony', name: '和谐融合', description: '纹样与图片自然融合' },
  { id: 'border', name: '边框装饰', description: '纹样作为边框围绕内容' },
  { id: 'corner', name: '角落点缀', description: '纹样装饰在四角' },
  { id: 'frame', name: '画框效果', description: '创建精美画框' },
  { id: 'background', name: '背景纹理', description: '纹样作为背景' },
];

const PatternPanel: React.FC<PatternPanelProps> = ({ onSelectPattern }) => {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  const { generatedResults, selectedResult, updateState, currentImage } = useCreateStore();
  const [activeTab, setActiveTab] = useState<'traditional' | 'custom' | 'ai-fusion'>('traditional');
  const [userPatterns, setUserPatterns] = useState<UserPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<TraditionalPattern | UserPattern | null>(null);
  
  // AI 融合相关状态
  const [fusionStyle, setFusionStyle] = useState('harmony');
  const [fusionIntensity, setFusionIntensity] = useState(50);
  const [isFusing, setIsFusing] = useState(false);
  const [fusionProgress, setFusionProgress] = useState(0);
  const [fusionStage, setFusionStage] = useState('');
  const fusionProgressRef = useRef<NodeJS.Timeout | null>(null);

  // 加载用户收藏的纹样
  const loadUserPatterns = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data, error } = await patternService.getUserPatterns();
    if (error) {
      console.error('加载纹样失败:', error.message);
    } else {
      setUserPatterns(data || []);
      // 更新收藏状态
      const favIds = (data || [])
        .filter(p => p.pattern_id && !p.is_custom)
        .map(p => p.pattern_id!);
      setFavorites(favIds);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadUserPatterns();
  }, [loadUserPatterns]);

  // 切换收藏状态
  const toggleFavorite = async (patternId: number) => {
    const { isFavorited, error } = await patternService.togglePatternFavorite(patternId);
    if (error) {
      toast.error(error.message);
    } else {
      if (isFavorited) {
        setFavorites(prev => [...prev, patternId]);
        toast.success('已添加到收藏');
      } else {
        setFavorites(prev => prev.filter(id => id !== patternId));
        toast.success('已取消收藏');
      }
      // 刷新用户纹样列表
      loadUserPatterns();
    }
  };

  // 上传自定义纹样
  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('只支持 JPG、PNG、WebP 格式的图片');
      return;
    }

    setIsUploading(true);
    const { data, error } = await patternService.addCustomPattern(file, file.name, '自定义纹样');
    if (error) {
      toast.error('上传失败: ' + error.message);
    } else {
      toast.success('上传成功！');
      setUserPatterns(prev => [data!, ...prev]);
      setActiveTab('custom');
    }
    setIsUploading(false);
  };

  // 删除自定义纹样
  const handleDeleteCustom = async (id: string) => {
    if (!confirm('确定要删除这个纹样吗？')) return;

    const { success, error } = await patternService.deletePattern(id);
    if (error) {
      toast.error('删除失败: ' + error.message);
    } else {
      toast.success('删除成功！');
      setUserPatterns(prev => prev.filter(p => p.id !== id));
    }
  };

  // 获取传统纹样的收藏状态
  const isFavorited = (patternId: number) => favorites.includes(patternId);

  // 上传图片到 Supabase Storage 获取稳定 URL
  const uploadImageToStorage = async (imageUrl: string): Promise<string | null> => {
    try {
      console.log('[PatternPanel] Starting upload for image:', imageUrl.substring(0, 80));
      
      // 下载图片
      let response;
      try {
        response = await fetch(imageUrl);
      } catch (fetchError) {
        console.error('[PatternPanel] Fetch error:', fetchError);
        toast.error('无法下载图片，可能是跨域限制或网络问题');
        return null;
      }
      
      if (!response.ok) {
        console.error('[PatternPanel] Download failed:', response.status, response.statusText);
        toast.error(`下载图片失败: ${response.status}`);
        return null;
      }
      
      const blob = await response.blob();
      console.log('[PatternPanel] Image downloaded, size:', blob.size);
      
      if (blob.size === 0) {
        toast.error('图片数据为空');
        return null;
      }
      
      // 生成文件名
      const fileName = `ai-fusion/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      console.log('[PatternPanel] Uploading to:', fileName);
      
      // 上传到 Supabase
      const { data, error } = await supabase.storage
        .from('event-submissions')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });
      
      if (error) {
        console.error('[PatternPanel] Supabase upload error:', error);
        toast.error(`上传失败: ${error.message}`);
        return null;
      }
      
      // 获取公开 URL
      const { data: { publicUrl } } = supabase.storage
        .from('event-submissions')
        .getPublicUrl(fileName);
      
      console.log('[PatternPanel] Upload successful, public URL:', publicUrl.substring(0, 80));
      return publicUrl;
    } catch (error) {
      console.error('[PatternPanel] Failed to upload image:', error);
      toast.error('图片上传失败，请检查网络连接');
      return null;
    }
  };

  // 模拟进度增长
  const startFusionProgress = (stages: string[]) => {
    setFusionProgress(0);
    let currentStage = 0;
    let progress = 0;

    // 清除之前的定时器
    if (fusionProgressRef.current) {
      clearInterval(fusionProgressRef.current);
    }

    setFusionStage(stages[0]);

    fusionProgressRef.current = setInterval(() => {
      progress += Math.random() * 3 + 1; // 每次增加 1-4%

      // 根据进度切换阶段
      const stageIndex = Math.min(
        Math.floor((progress / 100) * stages.length),
        stages.length - 1
      );
      if (stageIndex !== currentStage) {
        currentStage = stageIndex;
        setFusionStage(stages[stageIndex]);
      }

      if (progress >= 95) {
        progress = 95; // 保持在95%，等待实际完成
        if (fusionProgressRef.current) {
          clearInterval(fusionProgressRef.current);
        }
      }
      setFusionProgress(Math.floor(progress));
    }, 200);
  };

  // 停止进度模拟
  const stopFusionProgress = (completed = true) => {
    if (fusionProgressRef.current) {
      clearInterval(fusionProgressRef.current);
      fusionProgressRef.current = null;
    }
    if (completed) {
      setFusionProgress(100);
      setTimeout(() => {
        setFusionProgress(0);
        setFusionStage('');
      }, 500);
    }
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (fusionProgressRef.current) {
        clearInterval(fusionProgressRef.current);
      }
    };
  }, []);

  // AI 智能融合处理
  const handleAIFusion = async () => {
    if (!selectedPattern) {
      toast.error('请先选择一个纹样');
      return;
    }

    // 获取当前图片 URL - 优先使用 currentImage，其次是 selectedResult
    let imageUrl = currentImage;
    let currentWork: typeof generatedResults[0] | undefined;

    if (!imageUrl) {
      currentWork = selectedResult
        ? generatedResults.find(r => r.id === selectedResult)
        : generatedResults[0];

      if (!currentWork) {
        toast.error('请先生成或上传作品');
        return;
      }

      imageUrl = currentWork.thumbnail;
    }

    if (!imageUrl) {
      toast.error('请先生成或上传作品');
      return;
    }

    // 检查图片URL是否是公开可访问的
    if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:') ||
        imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
      toast.error('请先保存作品到云端后再使用AI融合功能');
      return;
    }

    setIsFusing(true);

    // 启动进度模拟
    startFusionProgress([
      '正在准备图片...',
      '正在分析纹样特征...',
      'AI正在智能融合...',
      '正在优化融合效果...'
    ]);

    try {
      // 先将图片上传到云存储获取稳定 URL
      setFusionStage('正在准备图片...');
      const stableImageUrl = await uploadImageToStorage(imageUrl);

      if (!stableImageUrl) {
        stopFusionProgress(false);
        toast.error('图片上传失败，请重试');
        setIsFusing(false);
        return;
      }

      console.log('[PatternPanel] Image uploaded to:', stableImageUrl.substring(0, 80));

      const patternName = 'name' in selectedPattern
        ? selectedPattern.name
        : (selectedPattern as any).pattern_name || '传统纹样';

      // 获取纹样图片URL
      const patternUrl = 'thumbnail' in selectedPattern
        ? selectedPattern.thumbnail
        : (selectedPattern as any).custom_pattern_url || '';

      console.log('[PatternPanel] Using pattern:', patternName, 'patternUrl:', patternUrl ? 'provided' : 'not provided');

      setFusionStage('AI正在智能融合...');
      const result = await llmService.fusePattern(
        stableImageUrl,
        patternName,
        fusionStyle,
        fusionIntensity,
        patternUrl
      );

      if (result.success && result.imageUrl) {
        setFusionStage('正在保存结果...');
        const newResult = {
          id: Date.now(),
          thumbnail: result.imageUrl,
          prompt: currentWork?.prompt || '纹样融合作品',
          style: `${currentWork?.style || ''} + ${patternName}纹样融合`,
          timestamp: Date.now(),
          score: Math.min((currentWork?.score || 85) + 3, 100)
        };

        updateState({
          generatedResults: [...generatedResults, newResult],
          selectedResult: newResult.id,
          aiExplanation: `已使用AI将「${patternName}」纹样以「${FUSION_STYLES.find(s => s.id === fusionStyle)?.name}」风格融合到图片中`
        });

        stopFusionProgress(true);
        toast.success('纹样智能融合完成！');
      } else {
        stopFusionProgress(false);
        toast.error(result.error || '融合失败');
      }
    } catch (error) {
      stopFusionProgress(false);
      console.error('AI融合失败:', error);
      toast.error('融合失败，请确保图片已保存到云端');
    } finally {
      setIsFusing(false);
    }
  };

  // 未登录提示 - 只在"我的纹样"标签显示
  if (!user && activeTab === 'custom') {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
            <i className="fas fa-th text-[#C02C38]"></i>
            纹样嵌入
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            选择传统纹样或上传自定义纹样
          </p>
        </div>

        {/* 标签切换 */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('traditional')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'traditional'
                ? 'text-[#C02C38] border-b-2 border-[#C02C38]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            传统纹样
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'custom'
                ? 'text-[#C02C38] border-b-2 border-[#C02C38]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            我的纹样
          </button>
          <button
            onClick={() => setActiveTab('ai-fusion')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'ai-fusion'
                ? 'text-[#C02C38] border-b-2 border-[#C02C38]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            AI 融合
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <i className="fas fa-lock text-3xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-semibold mb-2">请先登录</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            登录后即可收藏和上传自定义纹样
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-2 bg-[#C02C38] text-white rounded-lg text-sm font-medium hover:bg-[#A0232F] transition-colors"
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
          <i className="fas fa-th text-[#C02C38]"></i>
          纹样嵌入
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          选择传统纹样或上传自定义纹样
        </p>
      </div>

      {/* 标签切换 */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('traditional')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'traditional'
              ? 'text-[#C02C38] border-b-2 border-[#C02C38]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          传统纹样
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'custom'
              ? 'text-[#C02C38] border-b-2 border-[#C02C38]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          我的纹样
        </button>
        <button
          onClick={() => setActiveTab('ai-fusion')}
          className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'ai-fusion'
              ? 'text-[#C02C38] border-b-2 border-[#C02C38]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          AI 融合
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'traditional' && (
          <div className="grid grid-cols-2 gap-3">
            {TRADITIONAL_PATTERNS.map((pattern, index) => (
              <motion.div
                key={pattern.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative rounded-xl overflow-hidden border cursor-pointer ${
                  selectedPattern?.id === pattern.id
                    ? 'ring-2 ring-[#C02C38] border-[#C02C38]'
                    : isDark
                      ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  setSelectedPattern(pattern);
                  onSelectPattern?.(pattern);
                }}
              >
                <div className="aspect-square relative">
                  <img
                    src={pattern.thumbnail}
                    alt={pattern.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://via.placeholder.com/300?text=Pattern';
                    }}
                  />
                  {/* 收藏按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(pattern.id);
                    }}
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isFavorited(pattern.id)
                        ? 'bg-yellow-400 text-white'
                        : 'bg-white/80 text-gray-600 hover:bg-white'
                    }`}
                  >
                    <i
                      className={`fas ${
                        isFavorited(pattern.id) ? 'fa-star' : 'fa-star-o'
                      }`}
                    ></i>
                  </button>
                  {/* 选中标记 */}
                  {selectedPattern?.id === pattern.id && (
                    <div className="absolute inset-0 bg-[#C02C38]/10 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-[#C02C38] text-white flex items-center justify-center">
                        <i className="fas fa-check"></i>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h4 className="font-medium text-sm">{pattern.name}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {pattern.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'ai-fusion' && (
          <div className="space-y-4">
            {/* 选择纹样 */}
            <div>
              <h4 className="text-sm font-medium mb-2">选择要融合的纹样</h4>
              <div className="grid grid-cols-4 gap-2">
                {TRADITIONAL_PATTERNS.slice(0, 8).map((pattern) => (
                  <motion.button
                    type="button"
                    key={pattern.id}
                    onClick={() => setSelectedPattern(pattern)}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      selectedPattern?.id === pattern.id
                        ? 'border-[#C02C38] bg-[#C02C38]/10'
                        : isDark
                          ? 'border-gray-700 hover:border-gray-600'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img
                      src={pattern.thumbnail}
                      alt={pattern.name}
                      className="w-full aspect-square object-cover rounded-md mb-1"
                    />
                    <p className="text-xs truncate">{pattern.name}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* 融合风格 */}
            <div>
              <h4 className="text-sm font-medium mb-2">融合风格</h4>
              <div className="grid grid-cols-2 gap-2">
                {FUSION_STYLES.map((style) => (
                  <motion.button
                    type="button"
                    key={style.id}
                    onClick={() => setFusionStyle(style.id)}
                    className={`p-3 rounded-xl text-left border-2 transition-all ${
                      fusionStyle === style.id
                        ? 'border-[#C02C38] bg-[#C02C38]/10'
                        : isDark
                          ? 'border-gray-700 hover:border-gray-600'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <p className="font-medium text-sm">{style.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {style.description}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* 融合强度 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">融合强度</h4>
                <span className="text-xs text-[#C02C38]">{fusionIntensity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={fusionIntensity}
                onChange={(e) => setFusionIntensity(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#C02C38]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>淡雅</span>
                <span>适中</span>
                <span>浓郁</span>
              </div>
            </div>

            {/* 说明 */}
            <div className={`p-3 rounded-xl text-xs ${isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-600'}`}>
              <div className="flex items-start gap-2">
                <i className="fas fa-magic mt-0.5 flex-shrink-0"></i>
                <p>AI 将智能分析图片内容，将纹样以自然的方式融合到画面中，保持原图主体不变。</p>
              </div>
            </div>

            {/* 融合进度条 */}
            <AnimatePresence>
              {isFusing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3 overflow-hidden"
                >
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {fusionStage}
                      </span>
                      <span className="text-xs font-bold text-[#C02C38]">
                        {fusionProgress}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#C02C38] to-[#D43A45] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${fusionProgress}%` }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 融合按钮 */}
            <motion.button
              type="button"
              onClick={handleAIFusion}
              disabled={isFusing || !selectedPattern}
              className="w-full py-3 bg-gradient-to-r from-[#C02C38] to-[#D43A45] text-white rounded-xl font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              whileTap={{ scale: 0.98 }}
            >
              {isFusing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI 融合中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  开始智能融合
                </>
              )}
            </motion.button>
          </div>
        )}

        {activeTab === 'custom' && (
          <div>
            {/* 上传按钮 */}
            <label className="block mb-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleCustomUpload}
                className="hidden"
                disabled={isUploading}
              />
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer ${
                  isDark
                    ? 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                }`}
              >
                {isUploading ? (
                  <>
                    <i className="fas fa-spinner fa-spin text-2xl text-[#C02C38] mb-2"></i>
                    <span className="text-sm text-gray-500">上传中...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-cloud-upload-alt text-2xl text-gray-400 mb-2"></i>
                    <span className="text-sm text-gray-500">上传自定义纹样</span>
                  </>
                )}
              </motion.div>
            </label>

            {/* 自定义纹样列表 */}
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <i className="fas fa-spinner fa-spin text-xl text-[#C02C38]"></i>
              </div>
            ) : userPatterns.filter((p) => p.is_custom).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  暂无自定义纹样
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  上传您的第一个自定义纹样
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {userPatterns
                  .filter((p) => p.is_custom)
                  .map((pattern, index) => (
                    <motion.div
                      key={pattern.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group relative rounded-xl overflow-hidden border ${
                        isDark
                          ? 'bg-gray-800 border-gray-700'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="aspect-square relative">
                        <img
                          src={pattern.custom_pattern_url}
                          alt={pattern.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://via.placeholder.com/300?text=Pattern';
                          }}
                        />
                        {/* 删除按钮 */}
                        <button
                          onClick={() => handleDeleteCustom(pattern.id)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <i className="fas fa-trash text-xs"></i>
                        </button>
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-sm truncate">
                          {pattern.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {pattern.category}
                        </p>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}

            {/* 收藏的纹样 */}
            {userPatterns.filter((p) => !p.is_custom).length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">收藏的传统纹样</h4>
                <div className="grid grid-cols-2 gap-3">
                  {userPatterns
                    .filter((p) => !p.is_custom)
                    .map((pattern, index) => (
                      <motion.div
                        key={pattern.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`rounded-xl overflow-hidden border ${
                          isDark
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="p-3">
                          <h4 className="font-medium text-sm">{pattern.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {pattern.category}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatternPanel;
