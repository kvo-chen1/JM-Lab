import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { TianjinButton, TianjinImage, TianjinEmptyState } from '@/components/TianjinStyleComponents';
import { llmService } from '@/services/llmService';
import { toast } from 'sonner';

interface InspirationPanelProps {
  onClose?: () => void;
  onApply?: (content: { prompt: string; image?: string; type: 'text' | 'image' }) => void;
  className?: string;
}

const BRAND_STORIES: Record<string, string> = {
  mahua: '始于清末，以多褶形态与香酥口感著称，传统工艺要求条条分明，不含水分。',
  baozi: '创始于光绪年间，皮薄馅大、鲜香味美，传承天津传统小吃的经典风味。',
  niuren: '以细腻彩塑著称，人物生动传神，见证天津手艺与美学传承。',
  erduoyan: '创建于清光绪年间的耳朵眼炸糕，外酥里糯、香甜不腻，是天津特色小吃代表。',
};

const TAGS = ['国潮', '杨柳青年画', '传统纹样', '红蓝配色', '泥人张风格', '风筝魏', '海河风光'];

export default function InspirationPanel({ onClose, onApply, className = '' }: InspirationPanelProps) {
  const { isDark } = useTheme();
  const [brand, setBrand] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'explore'>('generate');

  // Load random suggestions on mount
  useEffect(() => {
    const suggestions = [
      '杨柳青风格的现代包装设计',
      '天津之眼与赛博朋克融合',
      '泥人张风格的3D角色建模',
      '海河夜景的国潮插画'
    ];
    setAiSuggestions(suggestions);
  }, []);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const generateInspiration = async () => {
    if (!prompt && !brand && selectedTags.length === 0) {
      toast.warning('请输入提示词或选择标签');
      return;
    }

    setIsGenerating(true);
    try {
      const basePrompt = `${brand} ${selectedTags.join(' ')} ${prompt}`.trim();
      
      // 调用真实 llmService 生成图片
      const res = await llmService.generateImage({
        prompt: basePrompt,
        size: '1024x1024',
        n: 1,
        response_format: 'url'
      });
      
      const list = (res as any)?.data?.data || [];
      const urls = list.map((d: any) => d?.url).filter(Boolean);

      if (urls.length > 0) {
        setGeneratedImages(prev => [...urls, ...prev]);
        // 检查是否是 Unsplash 的图片，以此判断是否触发了 Mock 模式
        const isMock = urls.some(u => u.includes('unsplash.com'));
        if (isMock) {
          toast.success('已生成演示预览图 (API未配置)');
        } else {
          toast.success('灵感生成成功');
        }
      } else {
        // 如果没有生成图片，使用后备占位图（理论上 llmService 已经处理了，这里是双重保险）
        const fallbackUrl = `https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&h=600&fit=crop&prompt=${encodeURIComponent(basePrompt)}`;
        setGeneratedImages(prev => [fallbackUrl, ...prev]);
        toast.info('AI服务暂不可用，已生成预览图');
      }
      
      // 尝试获取更多文本建议
      try {
        const directions = llmService.generateCreativeDirections(basePrompt);
        setAiSuggestions(directions);
      } catch (e) {
        console.error('Failed to get suggestions', e);
      }
      
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error('生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} ${className}`}>
      {/* Header - Glassmorphism */}
      <div className={`flex items-center justify-between px-6 py-4 border-b backdrop-blur-md bg-opacity-80 sticky top-0 z-10 ${isDark ? 'border-gray-800 bg-gray-900/80' : 'border-gray-100 bg-white/80'}`}>
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ rotate: -15, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-red-500 flex items-center justify-center text-white shadow-lg"
          >
            <i className="fas fa-bolt text-sm"></i>
          </motion.div>
          <h2 className="font-bold text-lg tracking-tight">灵感引擎</h2>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Tabs */}
        <div className="px-6 pt-6">
          <div className={`flex p-1 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100/50'}`}>
            {(['generate', 'explore'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 z-0 ${
                  activeTab === tab 
                    ? (isDark ? 'text-white' : 'text-gray-900') 
                    : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute inset-0 rounded-lg shadow-sm ${isDark ? 'bg-gray-700' : 'bg-white'}`}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{tab === 'generate' ? '灵感生成' : '探索库'}</span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'generate' ? (
            <motion.div
              key="generate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6 space-y-8"
            >
              {/* Brand Selection */}
              <section className="space-y-3">
                <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">品牌设定</label>
                <div className="relative">
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className={`w-full p-3 pl-4 pr-10 rounded-xl appearance-none border transition-all duration-200 ${
                      isDark 
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                        : 'bg-white border-gray-200 text-gray-900 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    }`}
                  >
                    <option value="">不指定品牌</option>
                    {Object.keys(BRAND_STORIES).map(key => (
                      <option key={key} value={key}>{key === 'mahua' ? '桂发祥十八街麻花' : key === 'baozi' ? '狗不理包子' : key === 'niuren' ? '泥人张彩塑' : '耳朵眼炸糕'}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                    <i className="fas fa-chevron-down text-xs"></i>
                  </div>
                </div>
              </section>

              {/* Tags - Capsule Style */}
              <section className="space-y-3">
                <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">风格标签</label>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <motion.button
                        key={tag}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleTagToggle(tag)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                          isSelected
                            ? 'bg-red-600 border-red-600 text-white shadow-md shadow-red-500/20'
                            : (isDark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50')
                        }`}
                      >
                        {tag}
                      </motion.button>
                    );
                  })}
                </div>
              </section>

              {/* Prompt Input */}
              <section className="space-y-3">
                <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">创意描述</label>
                <div className={`relative rounded-xl border transition-all duration-200 ${isDark ? 'bg-gray-800 border-gray-700 focus-within:border-red-500' : 'bg-white border-gray-200 focus-within:border-red-500'}`}>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="描述你想要的画面，例如：一只拿着糖葫芦的赛博朋克风格醒狮..."
                    className="w-full h-32 p-4 rounded-xl bg-transparent border-none resize-none focus:ring-0 text-sm leading-relaxed"
                  />
                  {/* Suggestions Pills */}
                  {aiSuggestions.length > 0 && (
                    <div className="px-3 pb-3 flex overflow-x-auto gap-2 scrollbar-hide">
                      {aiSuggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => setPrompt(s)}
                          className={`flex-shrink-0 text-xs px-2 py-1 rounded bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 text-purple-500 truncate max-w-[150px] border ${isDark ? 'border-purple-500/20' : 'border-purple-200'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Generate Button */}
              <TianjinButton
                fullWidth
                primary
                size="lg"
                loading={isGenerating}
                onClick={generateInspiration}
                className="shadow-lg shadow-red-500/20"
                rightIcon={<i className="fas fa-wand-magic-sparkles"></i>}
              >
                注入灵感
              </TianjinButton>

              {/* Results - Waterfall Grid */}
              <AnimatePresence>
                {generatedImages.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">生成结果</h3>
                      <button 
                        onClick={() => setGeneratedImages([])}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        清空
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {generatedImages.map((img, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className="relative group rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                          <TianjinImage src={img} alt={`Result ${idx}`} ratio="square" rounded="xl" />
                          
                          {/* Hover Actions Overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                            {onApply && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onApply({ prompt: prompt || 'Generated Image', image: img, type: 'image' })}
                                className="px-3 py-1.5 bg-blue-600 rounded-full text-white text-xs font-medium shadow-lg flex items-center gap-1"
                              >
                                <i className="fas fa-plus"></i> 应用
                              </motion.button>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                navigator.clipboard.writeText(img);
                                toast.success('链接已复制');
                              }}
                              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white text-xs font-medium border border-white/30 flex items-center gap-1"
                            >
                              <i className="fas fa-link"></i> 复制
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="explore"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-6 flex flex-col items-center justify-center h-64 text-center space-y-4"
            >
              <TianjinEmptyState />
              <p className="text-sm opacity-60">探索库功能开发中...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
