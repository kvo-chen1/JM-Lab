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
  const [generatedItems, setGeneratedItems] = useState<Array<{ image: string; video: string; isGeneratingVideo: boolean }>>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'explore'>('generate');
  const [showPlanLibrary, setShowPlanLibrary] = useState(false);
  const [savedPlans, setSavedPlans] = useState<Array<{ id: string; title: string; query: string; aiText: string; ts: number }>>([]);

  // Load saved plans from local storage
  useEffect(() => {
    try {
      const plansRaw = localStorage.getItem('TOOLS_SAVED_PLANS');
      if (plansRaw) {
        const plans = JSON.parse(plansRaw);
        setSavedPlans(plans);
      }
    } catch (error) {
      console.error('加载方案库失败:', error);
    }
  }, []);

  // Apply plan to prompt
  const applyPlan = (planId: string) => {
    const plan = savedPlans.find(x => x.id === planId);
    if (plan) {
      setPrompt(plan.aiText || plan.query);
      setShowPlanLibrary(false);
      toast.success('已应用方案');
    }
  };
  
  // 保存到方案库
  const saveToPlanLibrary = () => {
    if (!prompt.trim()) {
      toast.warning('暂无内容可保存');
      return;
    }
    
    // 从本地存储加载现有方案
    const existingPlans = JSON.parse(localStorage.getItem('TOOLS_SAVED_PLANS') || '[]');
    
    // 创建新方案
    const newPlan = {
      id: String(Date.now()),
      title: prompt.split('\n')[0] || '未命名方案',
      query: prompt,
      aiText: '',
      ts: Date.now()
    };
    
    // 添加到方案库并限制数量
    const updatedPlans = [newPlan, ...existingPlans].slice(0, 20);
    setSavedPlans(updatedPlans);
    
    try {
      localStorage.setItem('TOOLS_SAVED_PLANS', JSON.stringify(updatedPlans));
      toast.success('已保存到方案库');
    } catch (error) {
      console.error('保存方案库失败:', error);
      toast.error('保存失败，请稍后再试');
    }
  };
  
  // 从方案库中删除方案
  const removePlan = (planId: string) => {
    const nextPlans = savedPlans.filter(x => x.id !== planId);
    setSavedPlans(nextPlans);
    try {
      localStorage.setItem('TOOLS_SAVED_PLANS', JSON.stringify(nextPlans));
      toast.success('已从方案库中删除');
    } catch (error) {
      console.error('保存方案库失败:', error);
    }
  };
  
  // 清空方案库
  const clearPlans = () => {
    setSavedPlans([]);
    try {
      localStorage.removeItem('TOOLS_SAVED_PLANS');
      toast.success('已清空方案库');
    } catch (error) {
      console.error('清空方案库失败:', error);
    }
  };

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
      const urls = list.map((d: any) => d?.url).filter(Boolean) as string[];

      if (urls.length > 0) {
        const newItems = urls.map((url: string) => ({ image: url, video: '', isGeneratingVideo: false }));
        setGeneratedItems(prev => [...newItems, ...prev]);
        // 检查是否是 Unsplash 的图片，以此判断是否触发了 Mock 模式
        const isMock = urls.some((u: string) => u.includes('unsplash.com'));
        if (isMock) {
          toast.success('已生成演示预览图 (API未配置)');
        } else {
          toast.success('灵感生成成功');
        }
      } else {
        // 如果没有生成图片，使用后备占位图（理论上 llmService 已经处理了，这里是双重保险）
        const fallbackUrl = `https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&h=600&fit=crop&prompt=${encodeURIComponent(basePrompt)}`;
        setGeneratedItems(prev => [{ image: fallbackUrl, video: '', isGeneratingVideo: false }, ...prev]);
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
                  {/* Plan Library Button */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button 
                      onClick={() => {
                        saveToPlanLibrary();
                        // 保存后自动打开方案库
                        setTimeout(() => setShowPlanLibrary(true), 300);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                               bg-blue-50 text-blue-600 hover:bg-blue-100
                            "
                    >
                      <i className="fas fa-bookmark"></i>方案库
                    </button>
                  </div>
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
                {generatedItems.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">生成结果</h3>
                      <button 
                        onClick={() => setGeneratedItems([])}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        清空
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {generatedItems.map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className="relative group rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                          <TianjinImage src={item.image} alt={`Result ${idx}`} ratio="square" rounded="xl" />
                          
                          {/* Hover Actions Overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                            {onApply && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onApply({ prompt: prompt || 'Generated Image', image: item.image, type: 'image' })}
                                className="px-3 py-1.5 bg-blue-600 rounded-full text-white text-xs font-medium shadow-lg flex items-center gap-1"
                              >
                                <i className="fas fa-plus"></i> 应用
                              </motion.button>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                navigator.clipboard.writeText(item.image);
                                toast.success('图片链接已复制');
                              }}
                              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white text-xs font-medium border border-white/30 flex items-center gap-1"
                            >
                              <i className="fas fa-link"></i> 复制图片
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={async () => {
                                setGeneratedItems(prev => 
                                  prev.map((it, i) => i === idx ? { ...it, isGeneratingVideo: true, video: '生成中...' } : it)
                                );
                                
                                try {
                                  // 如果图片是本地 base64，先上传到云存储获取公网 URL
                                  let publicImageUrl = item.image;
                                  if (item.image.startsWith('data:')) {
                                    toast.info('正在上传图片到云存储...');
                                    const { getPublicImageUrl } = await import('@/services/imageService');
                                    try {
                                      publicImageUrl = await getPublicImageUrl(item.image);
                                      console.log('[InspirationPanel] Image uploaded to:', publicImageUrl);
                                      toast.success('图片上传成功，开始生成视频...');
                                    } catch (uploadError: any) {
                                      console.error('[InspirationPanel] Failed to upload image:', uploadError);
                                      toast.error('图片上传失败: ' + (uploadError.message || '请重试'));
                                      setGeneratedItems(prev => 
                                        prev.map((it, i) => i === idx ? { ...it, isGeneratingVideo: false, video: '图片上传失败' } : it)
                                      );
                                      return;
                                    }
                                  }
                                  
                                  const basePrompt = `${prompt}  --resolution 720p  --duration 5 --camerafixed false`;
                                  const result = await llmService.generateVideo({
                                    prompt: basePrompt,
                                    imageUrl: publicImageUrl,
                                    resolution: '720p',
                                    duration: 5
                                  });
                                  
                                  if (!result.ok || !result.data?.video_url) {
                                    const error = result.error || '视频生成失败';
                                    toast.error(error);
                                    setGeneratedItems(prev => 
                                      prev.map((it, i) => i === idx ? { ...it, isGeneratingVideo: false, video: `视频生成失败：${error}` } : it)
                                    );
                                    return;
                                  }
                                  
                                  const videoUrl = result.data.video_url;
                                  setGeneratedItems(prev => 
                                    prev.map((it, i) => i === idx ? { ...it, isGeneratingVideo: false, video: videoUrl } : it)
                                  );
                                  toast.success('视频生成完成');
                                } catch (e: any) {
                                  toast.error(e?.message || '视频生成异常');
                                  setGeneratedItems(prev => 
                                    prev.map((it, i) => i === idx ? { ...it, isGeneratingVideo: false, video: '视频生成失败' } : it)
                                  );
                                }
                              }}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 backdrop-blur-sm rounded-full text-white text-xs font-medium border border-white/30 flex items-center gap-1"
                              disabled={item.isGeneratingVideo}
                            >
                              <i className="fas fa-video"></i> {item.isGeneratingVideo ? '生成中...' : '生成视频'}
                            </motion.button>
                          </div>
                          
                          {/* Video Result */}
                          {item.video && (
                            <div className={`absolute bottom-2 left-2 right-2 p-2 rounded-lg ${isDark ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur-sm text-xs`}>
                              {item.video.startsWith('http') ? (
                                <div className="flex items-center justify-between gap-2">
                                  <a href={item.video} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 truncate">
                                    打开视频
                                  </a>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.video);
                                      toast.success('视频链接已复制');
                                    }}
                                    className="text-gray-300 hover:text-white"
                                  >
                                    <i className="fas fa-copy"></i>
                                  </button>
                                </div>
                              ) : (
                                <div className="text-red-400 truncate">{item.video}</div>
                              )}
                            </div>
                          )}
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

      {/* Plan Library Modal */}
      <AnimatePresence>
        {showPlanLibrary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowPlanLibrary(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`w-full max-w-md rounded-2xl p-6 max-h-[80vh] overflow-y-auto ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} border shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">我的方案库 ({savedPlans.length})</h3>
                <div className="flex items-center gap-2">
                  {savedPlans.length > 0 && (
                    <button 
                      onClick={clearPlans} 
                      className="text-xs text-red-500 hover:underline"
                    >
                      清空全部
                    </button>
                  )}
                  <button 
                    onClick={() => setShowPlanLibrary(false)}
                    className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800`}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
              
              {savedPlans.length > 0 ? (
                <div className="space-y-3">
                  {savedPlans.map(plan => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm line-clamp-1">{plan.title}</h4>
                        <span className="text-xs opacity-60">{new Date(plan.ts).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs opacity-70 line-clamp-2 mb-3">{plan.aiText || plan.query}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => removePlan(plan.id)} 
                            className="text-gray-400 hover:text-red-500 text-xs"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                        <button 
                          onClick={() => applyPlan(plan.id)}
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          应用到输入框
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 opacity-50">
                  <i className="fas fa-bookmark text-4xl mb-3 text-gray-300 dark:text-gray-700"></i>
                  <p className="text-sm">暂无保存的方案</p>
                  <p className="text-xs mt-2 opacity-70">点击「方案库」按钮保存当前内容到方案库</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
