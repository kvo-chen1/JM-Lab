import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { 
  useGenerationStatus, 
  useCurrentBrand,
  useGenerationResults,
  useWorkHeartStore 
} from './hooks/useWorkHeartStore';
import { BRAND_STORIES, CREATIVE_TIPS } from './types/workheart';
import { toast } from 'sonner';

// AI创意建议模拟数据
const AI_DIRECTIONS = [
  { id: '1', text: '基于传统文化元素的创新设计', category: 'style', confidence: 0.92 },
  { id: '2', text: '结合现代科技的创意表现', category: 'element', confidence: 0.88 },
  { id: '3', text: '跨文化融合的设计思路', category: 'composition', confidence: 0.85 },
  { id: '4', text: '注重可持续发展的设计理念', category: 'style', confidence: 0.80 },
  { id: '5', text: '以用户为中心的交互设计', category: 'composition', confidence: 0.78 }
];

// 资源推荐
const RESOURCES = [
  { id: 'tianjin-culture', title: '文化知识库', icon: 'book-open', color: 'blue', path: '/tianjin' },
  { id: 'design-templates', title: '设计模板库', icon: 'palette', color: 'purple', path: '#' },
  { id: 'tutorials', title: '创作教程', icon: 'graduation-cap', color: 'green', path: '/help' },
  { id: 'community', title: '津脉社区', icon: 'users', color: 'orange', path: '/community' }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0 }
};

export default function WorkHeartRightSidebar() {
  const { isDark } = useTheme();
  const generationStatus = useGenerationStatus();
  const currentBrand = useCurrentBrand();
  const results = useGenerationResults();
  const { toggleRightSidebar } = useWorkHeartStore();

  const brandStory = currentBrand ? BRAND_STORIES[currentBrand] : null;
  const hasResults = results.length > 0;

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`h-full flex flex-col border-l z-10 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      {/* 头部 */}
      <div className={`flex items-center justify-between p-4 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <i className="fas fa-robot text-blue-500"></i>
          <h2 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            辅助面板
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${
            isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
          }`}>
            AI Assistant
          </span>
          <button
            onClick={toggleRightSidebar}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark 
                ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        {/* 生成状态 */}
        <motion.div variants={itemVariants}>
          <div className={`rounded-xl border overflow-hidden ${
            isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className={`px-4 py-3 border-b flex items-center justify-between ${
              isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-100 bg-slate-50/50'
            }`}>
              <h3 className={`text-sm font-semibold flex items-center gap-2 ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}>
                <i className={`fas fa-spinner ${
                  generationStatus.status === 'generating' ? 'animate-spin text-blue-500' : 'text-slate-400'
                }`}></i>
                生成状态
              </h3>
              {generationStatus.status === 'generating' && (
                <span className="text-xs font-mono text-blue-500">
                  {generationStatus.progress}%
                </span>
              )}
            </div>
            <div className="p-4">
              {generationStatus.status === 'generating' ? (
                <div className="space-y-3">
                  <div className={`h-2 w-full rounded-full overflow-hidden ${
                    isDark ? 'bg-slate-700' : 'bg-slate-200'
                  }`}>
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${generationStatus.progress}%` }}
                      transition={{ type: 'spring', stiffness: 50 }}
                    />
                  </div>
                  <p className={`text-xs text-center animate-pulse ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {generationStatus.message}
                  </p>
                  {generationStatus.estimatedTime && (
                    <p className={`text-xs text-center ${
                      isDark ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      预计还需 {generationStatus.estimatedTime} 秒
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-2 text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    hasResults
                      ? isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                      : isDark ? 'bg-slate-700 text-slate-500' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <i className={`fas ${hasResults ? 'fa-check' : 'fa-magic'}`}></i>
                  </div>
                  <p className={`text-sm font-medium ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {hasResults ? `已生成 ${results.length} 个作品` : 'AI 助手就绪'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* 品牌故事 */}
        <motion.div variants={itemVariants}>
          <div className={`rounded-xl border overflow-hidden ${
            isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className={`px-4 py-3 border-b flex items-center gap-2 ${
              isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-100 bg-slate-50/50'
            }`}>
              <i className="fas fa-book-open text-amber-500"></i>
              <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                品牌故事
              </h3>
            </div>
            <div className="p-4">
              {brandStory ? (
                <>
                  <h4 className={`text-sm font-bold mb-2 ${
                    isDark ? 'text-amber-400' : 'text-amber-700'
                  }`}>
                    {brandStory.name}
                  </h4>
                  <p className={`text-xs leading-relaxed mb-3 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {brandStory.shortDesc}
                  </p>
                  <div className="flex items-center gap-2 text-xs mb-3">
                    <span className={`px-2 py-1 rounded ${
                      isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}>
                      创立于 {brandStory.founded}
                    </span>
                    <span className={`px-2 py-1 rounded ${
                      isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {brandStory.heritage}
                    </span>
                  </div>
                  <button
                    className={`text-xs hover:underline flex items-center gap-1 font-medium transition-colors ${
                      isDark ? 'text-amber-500 hover:text-amber-400' : 'text-amber-600 hover:text-amber-700'
                    }`}
                    onClick={() => toast.info('完整品牌故事即将上线')}
                  >
                    <span>阅读完整故事</span>
                    <i className="fas fa-arrow-right text-[10px]"></i>
                  </button>
                </>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-store text-3xl mb-2 text-slate-300"></i>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    选择一个品牌查看其背后的文化故事
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* AI创意建议 */}
        <motion.div variants={itemVariants}>
          <div className={`rounded-xl border overflow-hidden ${
            isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className={`px-4 py-3 border-b flex items-center gap-2 ${
              isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-100 bg-slate-50/50'
            }`}>
              <i className="fas fa-lightbulb text-yellow-500"></i>
              <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                AI 创意建议
              </h3>
            </div>
            <div className="p-2">
              <div className="space-y-1">
                {AI_DIRECTIONS.slice(0, 3).map((direction, index) => (
                  <button
                    key={direction.id}
                    className={`w-full text-left p-3 rounded-lg transition-all text-xs flex gap-3 group ${
                      isDark 
                        ? 'hover:bg-slate-700 text-slate-300' 
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                    onClick={() => toast.success(`已应用创意：${direction.text}`)}
                  >
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                      isDark 
                        ? 'bg-slate-700 text-slate-400 group-hover:bg-yellow-500/20 group-hover:text-yellow-400' 
                        : 'bg-slate-100 text-slate-500 group-hover:bg-yellow-100 group-hover:text-yellow-600'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <span className="leading-relaxed group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {direction.text}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {direction.category === 'style' ? '风格' : 
                           direction.category === 'element' ? '元素' : 
                           direction.category === 'composition' ? '构图' : '色彩'}
                        </span>
                        <div className={`flex-1 h-1 rounded-full overflow-hidden ${
                          isDark ? 'bg-slate-700' : 'bg-slate-200'
                        }`}>
                          <div 
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                            style={{ width: `${direction.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 创作技巧 */}
        <motion.div variants={itemVariants}>
          <div className={`rounded-xl border overflow-hidden ${
            isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className={`px-4 py-3 border-b flex items-center gap-2 ${
              isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-100 bg-slate-50/50'
            }`}>
              <i className="fas fa-wand-magic-sparkles text-purple-500"></i>
              <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                创作技巧
              </h3>
            </div>
            <div className="p-4">
              <ul className="space-y-3">
                {CREATIVE_TIPS.slice(0, 2).map((tip) => (
                  <li key={tip.id} className="flex gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                      isDark ? 'bg-purple-500' : 'bg-purple-600'
                    }`}></div>
                    <div>
                      <p className={`text-xs font-medium mb-0.5 ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        {tip.title}
                      </p>
                      <p className={`text-xs leading-relaxed ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {tip.content}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* 资源推荐 */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-2 gap-2">
            {RESOURCES.map((res) => (
              <button
                key={res.id}
                className={`p-3 rounded-xl border text-center transition-all hover:scale-105 active:scale-95 ${
                  isDark 
                    ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' 
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => {
                  if (res.path !== '#') {
                    window.location.href = res.path;
                  } else {
                    toast.info(`${res.title} 即将上线`);
                  }
                }}
              >
                <i className={`fas fa-${res.icon} text-lg mb-2 text-${res.color}-500`}></i>
                <p className={`text-xs font-medium ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {res.title}
                </p>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.aside>
  );
}
