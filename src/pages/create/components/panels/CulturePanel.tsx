import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { culturalExpertService, CulturalElement } from '@/services/culturalExpertService';
import { useCreateStore } from '../../hooks/useCreateStore';
import { Loader2, Sparkles, BookOpen, Palette, Search, Eye } from 'lucide-react';
import { llmService } from '@/services/llmService';

// 面板模式
type CultureMode = 'trace' | 'mockup' | 'story' | 'learn';

// 模型预览场景
const MOCKUP_SCENES = [
  { id: 'tshirt', name: 'T恤', icon: '👕', category: '服装', prompt: 'T-shirt mockup with traditional Chinese pattern printed on it, front view, white background, product photography' },
  { id: 'bag', name: '帆布袋', icon: '🛍️', category: '配饰', prompt: 'Canvas tote bag mockup with traditional Chinese pattern, natural lighting, lifestyle photography' },
  { id: 'mug', name: '马克杯', icon: '☕', category: '家居', prompt: 'White ceramic mug mockup with traditional Chinese pattern, coffee cup, studio lighting' },
  { id: 'pillow', name: '抱枕', icon: '🛋️', category: '家居', prompt: 'Throw pillow mockup with traditional Chinese pattern, sofa setting, home decor' },
  { id: 'phone', name: '手机壳', icon: '📱', category: '数码', prompt: 'Phone case mockup with traditional Chinese pattern, iPhone case, product shot' },
  { id: 'poster', name: '海报', icon: '🖼️', category: '印刷', prompt: 'Wall poster mockup with traditional Chinese artwork, frame on wall, interior setting' },
  { id: 'card', name: '名片', icon: '🪪', category: '印刷', prompt: 'Business card mockup with traditional Chinese design, professional layout, print quality' },
  { id: 'notebook', name: '笔记本', icon: '📓', category: '文具', prompt: 'Notebook cover mockup with traditional Chinese pattern, stationery product' },
];

// 颜色主题
const COLOR_THEMES = [
  { id: 'classic', name: '经典红', colors: ['#C02C38', '#8B0000', '#FFD700'], description: '传统中国红', culturalOrigin: '象征喜庆、吉祥' },
  { id: 'ink', name: '水墨灰', colors: ['#2D3748', '#4A5568', '#E2E8F0'], description: '文人水墨风', culturalOrigin: '代表文人雅士的审美' },
  { id: 'qinghua', name: '青花蓝', colors: ['#1E3A5F', '#4A90A4', '#E8F4F8'], description: '青花瓷配色', culturalOrigin: '源自元代青花瓷' },
  { id: 'imperial', name: '宫廷黄', colors: ['#D4A574', '#B8860B', '#8B6914'], description: '皇家御用色', culturalOrigin: '明清皇家专用' },
  { id: 'jade', name: '翡翠绿', colors: ['#2D5A4A', '#5A8F5A', '#E8F5E9'], description: '玉石温润色', culturalOrigin: '象征君子之德' },
  { id: 'wood', name: '原木棕', colors: ['#8B4513', '#A0522D', '#DEB887'], description: '传统木作色', culturalOrigin: '传统家具工艺' },
];

// 文化故事
interface CultureStory {
  id: string;
  title: string;
  summary: string;
  content: string;
  readTime: string;
  tags: string[];
  image?: string;
}

const CULTURE_STORIES: CultureStory[] = [
  {
    id: 'silk',
    title: '丝绸之路的纹样之旅',
    summary: '从长安到罗马，中国纹样如何影响世界',
    content: '丝绸之路不仅是商品贸易的通道，更是文化交流的桥梁。中国的云纹、龙纹、凤纹等传统纹样通过丝绸之路传播到中亚、西亚乃至欧洲，对当地的艺术风格产生了深远影响。同时，西域的葡萄纹、忍冬纹等也传入中国，丰富了中华纹样的宝库。',
    readTime: '5分钟',
    tags: ['历史', '交流'],
    image: 'https://images.unsplash.com/photo-1523527927032-4f256b3fde71?w=600&h=400&fit=crop',
  },
  {
    id: 'porcelain',
    title: '青花瓷的蓝色密码',
    summary: '揭秘青花瓷纹饰背后的文化寓意',
    content: '青花瓷是中国瓷器的代表，其蓝色纹饰蕴含着丰富的文化内涵。青花料来自西域，经丝绸之路传入中国。青花瓷上的图案多取材于自然，如莲花象征纯洁，牡丹代表富贵，鱼纹寓意年年有余。这些图案不仅美观，更承载着人们对美好生活的向往。',
    readTime: '8分钟',
    tags: ['工艺', '美学'],
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop',
  },
  {
    id: 'dragon',
    title: '龙纹的千年演变',
    summary: '从红山文化到明清皇家，龙纹的变迁史',
    content: '龙是中华民族的图腾，龙纹的演变见证了中华文明的发展。从红山文化的玉龙，到商周时期的夔龙，再到秦汉的应龙、唐宋的云龙，直至明清的坐龙，龙纹的形态不断丰富。龙纹的使用也有严格的等级制度，五爪金龙为皇家专用。',
    readTime: '10分钟',
    tags: ['图腾', '皇室'],
    image: 'https://images.unsplash.com/photo-1515405295579-ba7b45403062?w=600&h=400&fit=crop',
  },
  {
    id: 'phoenix',
    title: '凤纹与女性之美',
    summary: '凤凰纹饰如何成为中国女性的象征',
    content: '凤凰是中国传统文化中的神鸟，象征着美好、祥瑞和高贵。凤纹常用于女性服饰和首饰，尤其是皇后的礼服。凤凰与龙相配，寓意阴阳和谐、婚姻美满。凤纹的造型优美，线条流畅，体现了中国传统美学中对女性美的理解。',
    readTime: '6分钟',
    tags: ['女性', '美学'],
    image: 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=600&h=400&fit=crop',
  },
];

export const CulturePanel: React.FC = () => {
  const { isDark } = useTheme();
  const { generatedResults, selectedResult, updateState, prompt, setPrompt, addGeneratedResult } = useCreateStore();
  const [mode, setMode] = useState<CultureMode>('trace');
  const [selectedElement, setSelectedElement] = useState<CulturalElement | null>(null);
  const [selectedScene, setSelectedScene] = useState<string>('tshirt');
  const [selectedTheme, setSelectedTheme] = useState<string>('classic');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showStoryDetail, setShowStoryDetail] = useState<CultureStory | null>(null);
  const [culturalElements, setCulturalElements] = useState<CulturalElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedMockup, setGeneratedMockup] = useState<string | null>(null);
  const [showEnlargedImage, setShowEnlargedImage] = useState<string | null>(null);

  // 加载文化元素
  useEffect(() => {
    const loadElements = async () => {
      setIsLoading(true);
      try {
        const elements = culturalExpertService.getAllCulturalElements();
        setCulturalElements(elements);
      } catch (error) {
        console.error('加载文化元素失败:', error);
        toast.error('加载文化元素失败');
      } finally {
        setIsLoading(false);
      }
    };
    loadElements();
  }, []);

  // 过滤文化元素
  const filteredElements = culturalElements.filter(e =>
    e.name.includes(searchQuery) ||
    e.description.includes(searchQuery) ||
    e.tags.some(tag => tag.includes(searchQuery))
  );

  // 处理文化元素应用 - 将文化元素信息添加到提示词
  const handleApplyElement = useCallback((element: CulturalElement) => {
    const currentPrompt = prompt || '';
    const culturalPrompt = `，融入${element.name}元素，${element.characteristics[0]}，配色参考${element.color_palette.slice(0, 3).join('、')}`;

    // 如果当前提示词为空，生成一个基础提示词
    if (!currentPrompt.trim()) {
      setPrompt(`基于${element.name}的创意设计${culturalPrompt}`);
    } else {
      // 否则追加文化元素信息
      setPrompt(currentPrompt + culturalPrompt);
    }

    // 更新状态中的文化信息
    updateState({
      culturalInfoText: `${element.name}：${element.description}\n\n文化价值：${element.cultural_significance}\n\n应用建议：${element.application_suggestions.join('；')}`,
    });

    toast.success(`已将「${element.name}」元素添加到创作提示词中`);
    setShowDetail(false);
  }, [prompt, setPrompt, updateState]);

  // 处理配色方案应用
  const handleApplyTheme = useCallback((themeId: string) => {
    const theme = COLOR_THEMES.find(t => t.id === themeId);
    if (theme) {
      const currentPrompt = prompt || '';
      const colorPrompt = `，使用${theme.name}配色方案(${theme.colors.join('、')})，${theme.culturalOrigin}`;

      if (!currentPrompt.trim()) {
        setPrompt(`传统风格设计${colorPrompt}`);
      } else {
        setPrompt(currentPrompt + colorPrompt);
      }

      toast.success(`已将「${theme.name}」配色方案添加到提示词中`);
    }
  }, [prompt, setPrompt]);

  // 生成模型预览
  const handleGenerateMockup = useCallback(async () => {
    const currentWork = selectedResult
      ? generatedResults.find(r => r.id === selectedResult)
      : generatedResults[0];

    if (!currentWork) {
      toast.error('请先生成或上传作品');
      return;
    }

    const scene = MOCKUP_SCENES.find(s => s.id === selectedScene);
    if (!scene) return;

    setIsGenerating(true);
    setGeneratedMockup(null);

    const loadingToast = toast.loading('正在生成场景预览...');

    try {
      // 调用 AI 生成产品场景图
      // 使用当前作品的描述或提示词来生成相关场景
      const artworkDescription = currentWork.prompt || 'traditional Chinese pattern design';
      const result = await llmService.generateImage({
        prompt: `${scene.prompt}, the design features: ${artworkDescription.substring(0, 100)}, high quality product photography, professional lighting`,
        size: '1024x1024',
      });

      toast.dismiss(loadingToast);

      if (result.ok && result.data?.data?.[0]?.url) {
        setGeneratedMockup(result.data.data[0].url);
        toast.success('场景预览生成成功！');
      } else {
        throw new Error(result.error || '生成失败');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('生成预览失败:', error);
      toast.error('生成预览失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedScene, selectedResult, generatedResults]);

  const panelBg = isDark ? 'bg-gray-900' : 'bg-white';
  const sectionBg = isDark ? 'bg-gray-800' : 'bg-gray-50';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const subTextColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className={`h-full overflow-y-auto ${panelBg}`}>
      {/* 模式切换 */}
      <div className={`sticky top-0 z-10 ${panelBg} border-b ${borderColor} p-4`}>
        <div className="flex gap-2">
          {[
            { id: 'trace', name: '文化溯源', icon: Search },
            { id: 'mockup', name: '效果预览', icon: Eye },
            { id: 'story', name: '文化故事', icon: BookOpen },
            { id: 'learn', name: '配色方案', icon: Palette },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id as CultureMode)}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                mode === m.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                  : `${sectionBg} ${textColor} hover:opacity-80`
              }`}
            >
              <m.icon className="w-3 h-3" />
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        <AnimatePresence mode="wait">
          {/* 文化溯源模式 */}
          {mode === 'trace' && (
            <motion.div
              key="trace"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索文化元素、非遗技艺、老字号..."
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border ${borderColor} ${panelBg} ${textColor} text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                />
              </div>

              {/* 加载状态 */}
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                </div>
              ) : (
                <>
                  {/* 文化元素列表 */}
                  <div className="grid grid-cols-1 gap-3">
                    {filteredElements.map((element) => (
                      <motion.button
                        key={element.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          setSelectedElement(element);
                          setShowDetail(true);
                        }}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          selectedElement?.id === element.id
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                            : `border-transparent ${sectionBg}`
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                            {element.type === 'intangible_heritage' && '🎭'}
                            {element.type === 'time_honored_brand' && '🏪'}
                            {element.type === 'architecture' && '🏛️'}
                            {element.type === 'cuisine' && '🍜'}
                            {element.type === 'folk_art' && '🎨'}
                            {element.type === 'history' && '📜'}
                            {element.type === 'custom' && '🎊'}
                            {element.type === 'pattern' && '🔷'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-semibold ${textColor}`}>{element.name}</h4>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} ${subTextColor}`}>
                                {element.type === 'intangible_heritage' && '非遗'}
                                {element.type === 'time_honored_brand' && '老字号'}
                                {element.type === 'architecture' && '建筑'}
                                {element.type === 'cuisine' && '美食'}
                                {element.type === 'folk_art' && '民间艺术'}
                                {element.type === 'history' && '历史'}
                                {element.type === 'custom' && '民俗'}
                                {element.type === 'pattern' && '纹样'}
                              </span>
                            </div>
                            <p className={`text-xs ${subTextColor} line-clamp-2`}>{element.description}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {element.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'} ${subTextColor}`}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {filteredElements.length === 0 && (
                    <div className="text-center py-8">
                      <p className={`text-sm ${subTextColor}`}>未找到相关文化元素</p>
                    </div>
                  )}
                </>
              )}

              {/* 文化元素详情弹窗 */}
              <AnimatePresence>
                {showDetail && selectedElement && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50"
                    onClick={() => setShowDetail(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className={`w-full max-w-md max-h-[80vh] overflow-y-auto p-6 rounded-2xl ${panelBg} shadow-2xl`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className={`text-xl font-bold ${textColor}`}>{selectedElement.name}</h3>
                          <span className={`text-sm ${subTextColor}`}>
                            {selectedElement.type === 'intangible_heritage' && '非物质文化遗产'}
                            {selectedElement.type === 'time_honored_brand' && '中华老字号'}
                            {selectedElement.type === 'architecture' && '建筑文化'}
                            {selectedElement.type === 'cuisine' && '美食文化'}
                            {selectedElement.type === 'folk_art' && '民间艺术'}
                            {selectedElement.type === 'history' && '历史文化'}
                            {selectedElement.type === 'custom' && '民俗风情'}
                            {selectedElement.type === 'pattern' && '传统纹样'}
                          </span>
                        </div>
                        <button
                          onClick={() => setShowDetail(false)}
                          className={`p-2 rounded-lg ${sectionBg}`}
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className={`font-medium ${textColor} mb-1`}>简介</h4>
                          <p className={`text-sm ${subTextColor}`}>{selectedElement.description}</p>
                        </div>

                        <div>
                          <h4 className={`font-medium ${textColor} mb-1`}>历史渊源</h4>
                          <p className={`text-sm ${subTextColor}`}>{selectedElement.history}</p>
                        </div>

                        <div>
                          <h4 className={`font-medium ${textColor} mb-1`}>核心特征</h4>
                          <ul className={`text-sm ${subTextColor} space-y-1`}>
                            {selectedElement.characteristics.map((char, idx) => (
                              <li key={idx}>• {char}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className={`font-medium ${textColor} mb-1`}>文化价值</h4>
                          <p className={`text-sm ${subTextColor}`}>{selectedElement.cultural_significance}</p>
                        </div>

                        <div>
                          <h4 className={`font-medium ${textColor} mb-1`}>应用建议</h4>
                          <ul className={`text-sm ${subTextColor} space-y-1`}>
                            {selectedElement.application_suggestions.map((suggestion, idx) => (
                              <li key={idx}>• {suggestion}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className={`font-medium ${textColor} mb-1`}>推荐配色</h4>
                          <div className="flex gap-2 flex-wrap">
                            {selectedElement.color_palette.map((color, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                <div
                                  className="w-8 h-8 rounded-lg shadow-sm"
                                  style={{ backgroundColor: color }}
                                />
                                <span className={`text-xs ${subTextColor}`}>{color}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className={`font-medium ${textColor} mb-1`}>视觉元素</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedElement.visual_elements.map((element, idx) => (
                              <span key={idx} className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'} ${subTextColor}`}>
                                {element}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                          <button
                            onClick={() => handleApplyElement(selectedElement)}
                            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            应用到创作
                          </button>
                          <button
                            onClick={() => setShowDetail(false)}
                            className={`px-4 py-3 rounded-xl border ${borderColor} ${textColor}`}
                          >
                            关闭
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* 效果预览模式 */}
          {mode === 'mockup' && (
            <motion.div
              key="mockup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* 预览画布 */}
              <div className={`${sectionBg} rounded-xl p-6 text-center`}>
                {generatedMockup ? (
                  <div className="relative">
                    <img
                      src={generatedMockup}
                      alt="生成的预览"
                      className="w-full max-w-xs mx-auto rounded-xl shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setShowEnlargedImage(generatedMockup)}
                    />
                    <button
                      onClick={() => setGeneratedMockup(null)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                    >
                      ✕
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-white bg-black/50 px-2 py-1 rounded-full">
                      点击查看大图
                    </div>
                    {/* 操作按钮 */}
                    <div className="absolute top-2 left-2 flex flex-col gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const link = document.createElement('a');
                          link.href = generatedMockup;
                          link.download = `mockup-${selectedScene}-${Date.now()}.jpg`;
                          link.click();
                          toast.success('图片已保存');
                        }}
                        className="w-8 h-8 rounded-full bg-white/90 text-gray-700 flex items-center justify-center hover:bg-white shadow-lg"
                        title="下载图片"
                      >
                        💾
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newResult = {
                            id: Date.now(),
                            thumbnail: generatedMockup,
                            prompt: `${MOCKUP_SCENES.find(s => s.id === selectedScene)?.name}场景预览`,
                            style: 'mockup',
                            timestamp: Date.now(),
                            score: 85
                          };
                          addGeneratedResult(newResult);
                          toast.success('已添加到作品预览');
                        }}
                        className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 shadow-lg"
                        title="添加到作品"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`w-48 h-48 mx-auto rounded-xl ${isDark ? 'bg-gray-700' : 'bg-white'} shadow-lg flex flex-col items-center justify-center mb-4`}>
                    <span className="text-6xl mb-2">{MOCKUP_SCENES.find(s => s.id === selectedScene)?.icon}</span>
                    <p className={`text-sm ${subTextColor}`}>
                      {MOCKUP_SCENES.find(s => s.id === selectedScene)?.name}
                    </p>
                  </div>
                )}
                <p className={`text-xs ${subTextColor} mt-2`}>
                  将您的作品应用到{MOCKUP_SCENES.find(s => s.id === selectedScene)?.name}场景
                </p>
              </div>

              {/* 场景选择 */}
              <div>
                <h3 className={`font-semibold ${textColor} mb-3`}>选择应用场景</h3>
                <div className="grid grid-cols-4 gap-2">
                  {MOCKUP_SCENES.map((scene) => (
                    <button
                      key={scene.id}
                      onClick={() => setSelectedScene(scene.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        selectedScene === scene.id
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                          : `border-transparent ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`
                      }`}
                    >
                      <span className="text-2xl mb-1 block">{scene.icon}</span>
                      <div className={`text-xs ${textColor}`}>{scene.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 生成按钮 */}
              <button
                onClick={handleGenerateMockup}
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    生成场景预览
                  </>
                )}
              </button>

              {/* 提示 */}
              <div className={`p-3 rounded-xl text-xs ${isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-600'}`}>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5">💡</span>
                  <p>AI 将自动将您的作品融合到所选场景中，生成逼真的产品效果图。</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* 文化故事模式 */}
          {mode === 'story' && (
            <motion.div
              key="story"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className={`${sectionBg} rounded-xl p-4`}>
                <h3 className={`font-semibold ${textColor} mb-2 flex items-center gap-2`}>
                  <BookOpen className="w-5 h-5 text-amber-500" />
                  每日文化故事
                </h3>
                <p className={`text-sm ${subTextColor}`}>
                  探索中国传统文化背后的历史与美学
                </p>
              </div>

              <div className="space-y-3">
                {CULTURE_STORIES.map((story) => (
                  <motion.div
                    key={story.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setShowStoryDetail(story)}
                    className={`p-4 rounded-xl border ${borderColor} cursor-pointer transition-colors hover:border-amber-500`}
                  >
                    {story.image && (
                      <img
                        src={story.image}
                        alt={story.title}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    <div className="flex items-start justify-between mb-2">
                      <h4 className={`font-semibold ${textColor}`}>{story.title}</h4>
                      <span className={`text-xs ${subTextColor}`}>{story.readTime}</span>
                    </div>
                    <p className={`text-sm ${subTextColor} mb-3`}>{story.summary}</p>
                    <div className="flex gap-2">
                      {story.tags.map((tag) => (
                        <span key={tag} className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'} ${subTextColor}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 故事详情弹窗 */}
              <AnimatePresence>
                {showStoryDetail && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50"
                    onClick={() => setShowStoryDetail(null)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className={`w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 rounded-2xl ${panelBg} shadow-2xl`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {showStoryDetail.image && (
                        <img
                          src={showStoryDetail.image}
                          alt={showStoryDetail.title}
                          className="w-full h-48 object-cover rounded-xl mb-4"
                        />
                      )}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className={`text-xl font-bold ${textColor}`}>{showStoryDetail.title}</h3>
                          <span className={`text-sm ${subTextColor}`}>阅读时间：{showStoryDetail.readTime}</span>
                        </div>
                        <button
                          onClick={() => setShowStoryDetail(null)}
                          className={`p-2 rounded-lg ${sectionBg}`}
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-4">
                        <p className={`text-sm ${subTextColor} leading-relaxed`}>{showStoryDetail.content}</p>

                        <div className="flex gap-2 pt-4">
                          {showStoryDetail.tags.map((tag) => (
                            <span key={tag} className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'} ${subTextColor}`}>
                              {tag}
                            </span>
                          ))}
                        </div>

                        <button
                          onClick={() => setShowStoryDetail(null)}
                          className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium"
                        >
                          关闭
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* 配色方案模式 */}
          {mode === 'learn' && (
            <motion.div
              key="learn"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className={`${sectionBg} rounded-xl p-4`}>
                <h3 className={`font-semibold ${textColor} mb-2 flex items-center gap-2`}>
                  <Palette className="w-5 h-5 text-amber-500" />
                  传统配色方案
                </h3>
                <p className={`text-sm ${subTextColor}`}>
                  汲取中国传统色彩的搭配智慧，应用于您的创作
                </p>
              </div>

              <div className="space-y-3">
                {COLOR_THEMES.map((theme) => (
                  <motion.button
                    key={theme.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedTheme === theme.id
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                        : `border-transparent ${sectionBg}`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className={`font-semibold ${textColor}`}>{theme.name}</h4>
                        <p className={`text-xs ${subTextColor}`}>{theme.description}</p>
                      </div>
                      {selectedTheme === theme.id && (
                        <span className="text-amber-500">✓</span>
                      )}
                    </div>
                    <div className="flex gap-2 mb-2">
                      {theme.colors.map((color, idx) => (
                        <div
                          key={idx}
                          className="w-12 h-12 rounded-lg shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <p className={`text-xs ${subTextColor}`}>{theme.culturalOrigin}</p>
                  </motion.button>
                ))}
              </div>

              <button
                onClick={() => handleApplyTheme(selectedTheme)}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Palette className="w-4 h-4" />
                应用配色方案
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 放大图片弹窗 */}
        <AnimatePresence>
          {showEnlargedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80"
              onClick={() => setShowEnlargedImage(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-4xl max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={showEnlargedImage}
                  alt="放大预览"
                  className="max-w-full max-h-[85vh] rounded-xl shadow-2xl"
                />
                <button
                  onClick={() => setShowEnlargedImage(null)}
                  className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white text-gray-800 flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
                >
                  ✕
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = showEnlargedImage;
                      link.download = `mockup-${Date.now()}.jpg`;
                      link.click();
                    }}
                    className="px-4 py-2 bg-white/90 text-gray-800 rounded-full text-sm font-medium hover:bg-white transition-colors flex items-center gap-1"
                  >
                    <span>💾</span> 保存图片
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CulturePanel;
