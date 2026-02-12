import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';

// 面板模式
type CultureMode = 'trace' | 'mockup' | 'story' | 'learn';

// 文化溯源数据库
const CULTURAL_PATTERNS = [
  {
    id: 'yunwen',
    name: '云纹',
    dynasty: '商周',
    category: '纹样',
    description: '象征高升和如意，是中国传统吉祥图案',
    meaning: '步步高升、吉祥如意',
    usage: '常用于服饰、建筑、器物装饰',
    image: '☁️',
    color: '#4A90A4',
  },
  {
    id: 'huilong',
    name: '回龙纹',
    dynasty: '明清',
    category: '纹样',
    description: '龙形回环，象征皇权与祥瑞',
    meaning: '权势、尊贵、祥瑞',
    usage: '皇家服饰、宫殿装饰',
    image: '🐉',
    color: '#C02C38',
  },
  {
    id: 'chanzhi',
    name: '缠枝纹',
    dynasty: '唐宋',
    category: '纹样',
    description: '花枝缠绕，生生不息',
    meaning: '连绵不断、生生不息',
    usage: '瓷器、织锦、建筑装饰',
    image: '🌿',
    color: '#5A8F5A',
  },
  {
    id: 'baxian',
    name: '暗八仙',
    dynasty: '明清',
    category: '纹样',
    description: '八仙法器，寓意吉祥',
    meaning: '福寿安康、驱邪避凶',
    usage: '民间工艺品、建筑装饰',
    image: '🎋',
    color: '#8B6914',
  },
  {
    id: 'shou',
    name: '寿字纹',
    dynasty: '秦汉',
    category: '文字',
    description: '百寿图，祝福长寿',
    meaning: '健康长寿、福寿双全',
    usage: '祝寿礼品、服饰刺绣',
    image: '🧧',
    color: '#D4A574',
  },
  {
    id: 'fudie',
    name: '福蝶纹',
    dynasty: '明清',
    category: '纹样',
    description: '蝙蝠与蝴蝶，谐音福迭',
    meaning: '福气迭至、幸福美满',
    usage: '年画、刺绣、剪纸',
    image: '🦋',
    color: '#E07B39',
  },
];

// 文化故事
const CULTURE_STORIES = [
  {
    id: 'silk',
    title: '丝绸之路的纹样之旅',
    summary: '从长安到罗马，中国纹样如何影响世界',
    readTime: '5分钟',
    tags: ['历史', '交流'],
  },
  {
    id: 'porcelain',
    title: '青花瓷的蓝色密码',
    summary: '揭秘青花瓷纹饰背后的文化寓意',
    readTime: '8分钟',
    tags: ['工艺', '美学'],
  },
  {
    id: 'dragon',
    title: '龙纹的千年演变',
    summary: '从红山文化到明清皇家，龙纹的变迁史',
    readTime: '10分钟',
    tags: ['图腾', '皇室'],
  },
  {
    id: 'phoenix',
    title: '凤纹与女性之美',
    summary: '凤凰纹饰如何成为中国女性的象征',
    readTime: '6分钟',
    tags: ['女性', '美学'],
  },
];

// 模型预览场景
const MOCKUP_SCENES = [
  { id: 'tshirt', name: 'T恤', icon: 'tshirt', category: '服装' },
  { id: 'bag', name: '帆布袋', icon: 'shopping-bag', category: '配饰' },
  { id: 'mug', name: '马克杯', icon: 'coffee', category: '家居' },
  { id: 'pillow', name: '抱枕', icon: 'couch', category: '家居' },
  { id: 'phone', name: '手机壳', icon: 'mobile-alt', category: '数码' },
  { id: 'poster', name: '海报', icon: 'image', category: '印刷' },
  { id: 'card', name: '名片', icon: 'id-card', category: '印刷' },
  { id: 'notebook', name: '笔记本', icon: 'book', category: '文具' },
];

// 颜色主题
const COLOR_THEMES = [
  { id: 'classic', name: '经典红', colors: ['#C02C38', '#8B0000', '#FFD700'], description: '传统中国红' },
  { id: 'ink', name: '水墨灰', colors: ['#2D3748', '#4A5568', '#E2E8F0'], description: '文人水墨风' },
  { id: 'qinghua', name: '青花蓝', colors: ['#1E3A5F', '#4A90A4', '#E8F4F8'], description: '青花瓷配色' },
  { id: 'imperial', name: '宫廷黄', colors: ['#D4A574', '#B8860B', '#8B6914'], description: '皇家御用色' },
  { id: 'jade', name: '翡翠绿', colors: ['#2D5A4A', '#5A8F5A', '#E8F5E9'], description: '玉石温润色' },
  { id: 'wood', name: '原木棕', colors: ['#8B4513', '#A0522D', '#DEB887'], description: '传统木作色' },
];

export const CulturePanel: React.FC = () => {
  const { isDark } = useTheme();
  const [mode, setMode] = useState<CultureMode>('trace');
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [selectedScene, setSelectedScene] = useState<string>('tshirt');
  const [selectedTheme, setSelectedTheme] = useState<string>('classic');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // 过滤纹样
  const filteredPatterns = CULTURAL_PATTERNS.filter(p => 
    p.name.includes(searchQuery) || 
    p.description.includes(searchQuery) ||
    p.category.includes(searchQuery)
  );

  // 处理纹样应用
  const handleApplyPattern = useCallback((patternId: string) => {
    const pattern = CULTURAL_PATTERNS.find(p => p.id === patternId);
    if (pattern) {
      toast.success(`已应用「${pattern.name}」纹样`);
    }
  }, []);

  // 处理模型预览生成
  const handleGenerateMockup = useCallback(() => {
    setIsGenerating(true);
    const scene = MOCKUP_SCENES.find(s => s.id === selectedScene);
    toast.loading(`正在生成${scene?.name}预览...`, { duration: 2000 });
    
    setTimeout(() => {
      setIsGenerating(false);
      toast.success('模型预览已生成！');
    }, 2000);
  }, [selectedScene]);

  // 处理颜色主题应用
  const handleApplyTheme = useCallback((themeId: string) => {
    const theme = COLOR_THEMES.find(t => t.id === themeId);
    if (theme) {
      toast.success(`已应用「${theme.name}」配色方案`);
    }
  }, []);

  const panelBg = isDark ? 'bg-gray-900' : 'bg-white';
  const sectionBg = isDark ? 'bg-gray-800' : 'bg-gray-50';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const subTextColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

  const selectedPatternData = CULTURAL_PATTERNS.find(p => p.id === selectedPattern);

  return (
    <div className={`h-full overflow-y-auto ${panelBg}`}>
      {/* 模式切换 */}
      <div className={`sticky top-0 z-10 ${panelBg} border-b ${borderColor} p-4`}>
        <div className="flex gap-2">
          {[
            { id: 'trace', name: '文化溯源', icon: 'search' },
            { id: 'mockup', name: '效果预览', icon: 'eye' },
            { id: 'story', name: '文化故事', icon: 'book' },
            { id: 'learn', name: '配色方案', icon: 'palette' },
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
              <i className={`fas fa-${m.icon}`} />
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
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索纹样、朝代、寓意..."
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border ${borderColor} ${panelBg} ${textColor} text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                />
              </div>

              {/* 纹样列表 */}
              <div className="grid grid-cols-2 gap-3">
                {filteredPatterns.map((pattern) => (
                  <motion.button
                    key={pattern.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedPattern(pattern.id);
                      setShowDetail(true);
                    }}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedPattern === pattern.id
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                        : `border-transparent ${sectionBg}`
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-3xl">{pattern.image}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                        {pattern.dynasty}
                      </span>
                    </div>
                    <h4 className={`font-semibold ${textColor} mb-1`}>{pattern.name}</h4>
                    <p className={`text-xs ${subTextColor} line-clamp-2`}>{pattern.description}</p>
                  </motion.button>
                ))}
              </div>

              {/* 纹样详情弹窗 */}
              <AnimatePresence>
                {showDetail && selectedPatternData && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                    onClick={() => setShowDetail(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className={`w-full max-w-md p-6 rounded-2xl ${panelBg} shadow-2xl`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-5xl">{selectedPatternData.image}</span>
                          <div>
                            <h3 className={`text-xl font-bold ${textColor}`}>{selectedPatternData.name}</h3>
                            <span className={`text-sm ${subTextColor}`}>{selectedPatternData.dynasty} · {selectedPatternData.category}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowDetail(false)}
                          className={`p-2 rounded-lg ${sectionBg}`}
                        >
                          <i className="fas fa-times" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className={`font-medium ${textColor} mb-1`}>文化寓意</h4>
                          <p className={`text-sm ${subTextColor}`}>{selectedPatternData.meaning}</p>
                        </div>
                        <div>
                          <h4 className={`font-medium ${textColor} mb-1`}>历史渊源</h4>
                          <p className={`text-sm ${subTextColor}`}>{selectedPatternData.description}</p>
                        </div>
                        <div>
                          <h4 className={`font-medium ${textColor} mb-1`}>应用场景</h4>
                          <p className={`text-sm ${subTextColor}`}>{selectedPatternData.usage}</p>
                        </div>

                        <div className="flex gap-2 pt-4">
                          <button
                            onClick={() => {
                              handleApplyPattern(selectedPatternData.id);
                              setShowDetail(false);
                            }}
                            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium"
                          >
                            <i className="fas fa-plus mr-2" />
                            应用纹样
                          </button>
                          <button
                            onClick={() => setShowDetail(false)}
                            className={`px-4 py-3 rounded-xl border ${borderColor} ${textColor}`}
                          >
                            <i className="fas fa-share-alt" />
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
              <div className={`${sectionBg} rounded-xl p-8 text-center`}>
                <div className={`w-48 h-48 mx-auto rounded-xl ${isDark ? 'bg-gray-700' : 'bg-white'} shadow-lg flex items-center justify-center mb-4`}>
                  <i className={`fas fa-${MOCKUP_SCENES.find(s => s.id === selectedScene)?.icon} text-6xl text-gray-300`} />
                </div>
                <p className={`text-sm ${subTextColor}`}>
                  当前预览: {MOCKUP_SCENES.find(s => s.id === selectedScene)?.name}
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
                      <i className={`fas fa-${scene.icon} text-lg mb-1 ${
                        selectedScene === scene.id ? 'text-amber-500' : subTextColor
                      }`} />
                      <div className={`text-xs ${textColor}`}>{scene.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 生成按钮 */}
              <button
                onClick={handleGenerateMockup}
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50"
              >
                <i className={`fas fa-${isGenerating ? 'spinner fa-spin' : 'cube'} mr-2`} />
                {isGenerating ? '生成中...' : '生成3D预览'}
              </button>
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
                  <i className="fas fa-book-open text-amber-500" />
                  每日文化故事
                </h3>
                <p className={`text-sm ${subTextColor}`}>
                  探索中国传统纹样背后的历史与文化
                </p>
              </div>

              <div className="space-y-3">
                {CULTURE_STORIES.map((story) => (
                  <motion.div
                    key={story.id}
                    whileHover={{ scale: 1.01 }}
                    className={`p-4 rounded-xl border ${borderColor} cursor-pointer transition-colors hover:border-amber-500`}
                  >
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
                  <i className="fas fa-palette text-amber-500" />
                  传统配色方案
                </h3>
                <p className={`text-sm ${subTextColor}`}>
                  汲取中国传统色彩的搭配智慧
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
                        <i className="fas fa-check-circle text-amber-500" />
                      )}
                    </div>
                    <div className="flex gap-2">
                      {theme.colors.map((color, idx) => (
                        <div
                          key={idx}
                          className="w-12 h-12 rounded-lg shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </motion.button>
                ))}
              </div>

              <button
                onClick={() => handleApplyTheme(selectedTheme)}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/30 transition-all"
              >
                <i className="fas fa-paint-brush mr-2" />
                应用配色方案
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
