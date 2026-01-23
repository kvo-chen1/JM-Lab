import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface NeoRightSidebarProps {
  brand: string;
  story: string;
  aiDirections: string[];
  isGenerating: boolean;
  generationStatus: string;
  progress: number;
  showOutput: boolean;
}

const NeoRightSidebar: React.FC<NeoRightSidebarProps> = ({
  brand,
  story,
  aiDirections,
  isGenerating,
  generationStatus,
  progress,
  showOutput
}) => {
  const { isDark } = useTheme();

  // 品牌故事数据
  const BRAND_STORIES = {
    mahua: '始于清末，以多褶形态与香酥口感著称，传统工艺要求条条分明，不含水分。',
    baozi: '创始于光绪年间，皮薄馅大、鲜香味美，传承天津传统小吃的经典风味。',
    niuren: '以细腻彩塑著称，人物生动传神，见证天津手艺与美学传承。',
    erduoyan: '创建于清光绪年间的耳朵眼炸糕，外酥里糯、香甜不腻，是天津特色小吃代表。',
    laomeihua: '老美华鞋店始于民国时期，保留传统手工缝制技艺与“舒适耐穿”的品牌口碑。',
    dafulai: '大福来锅巴菜以糊辣香浓著称，讲究火候与调和，口感层次丰富。',
    guorenzhang: '果仁张为百年坚果老字号，以糖炒栗子闻名，香甜适口、粒粒饱满。',
    chatangli: '茶汤李源自清末，茶汤细腻柔滑、甘香回甜，是老天津的温暖记忆。'
  };

  // 创作技巧提示
  const creativeTips = [
    '使用具体的形容词描述您想要的效果，例如："一只拿着糖葫芦的赛博朋克风格醒狮"',
    '结合天津文化元素，如："杨柳青年画风格"、"传统纹样"、"红蓝配色"',
    '尝试不同的品牌故事，获取多样化的创作灵感',
    '使用AI创意建议，扩展您的创作思路',
    '利用预设管理功能，保存您常用的创作组合'
  ];

  // 相关资源推荐
  const resources = [
    { id: 'tianjin-culture', title: '天津文化知识库', icon: 'book-open', color: 'blue' },
    { id: 'design-templates', title: '设计模板库', icon: 'palette', color: 'purple' },
    { id: 'tutorials', title: '创作教程', icon: 'graduation-cap', color: 'green' },
    { id: 'community', title: '创作者社区', icon: 'users', color: 'orange' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <aside 
      className={`h-full w-80 flex flex-col border-l z-20 transition-colors duration-300 shadow-xl
        ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
    >
      {/* 顶部标题区域 */}
      <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <h2 className={`text-lg font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          辅助面板
        </h2>
        <div className={`px-2 py-1 rounded-md text-xs font-medium ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
          AI Assistant
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* 实时生成状态 - 置顶显示 */}
          <motion.div variants={itemVariants}>
            <div className={`rounded-xl overflow-hidden border shadow-sm transition-all
              ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`px-4 py-3 border-b flex items-center justify-between
                ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
                <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <i className={`fas fa-spinner ${isGenerating ? 'animate-spin text-blue-500' : 'text-slate-400'}`}></i>
                  生成状态
                </h3>
                {isGenerating && (
                  <span className="text-xs font-mono text-blue-500">{progress}%</span>
                )}
              </div>
              
              <div className="p-4">
                {isGenerating ? (
                  <div className="space-y-3">
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "spring", stiffness: 50 }}
                      />
                    </div>
                    <p className="text-xs text-center text-slate-500 dark:text-slate-400 animate-pulse">
                      {generationStatus || '正在构思创意...'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-2 text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2
                      ${showOutput 
                        ? (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600')
                        : (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')
                      }`}>
                      <i className={`fas ${showOutput ? 'fa-check' : 'fa-magic'}`}></i>
                    </div>
                    <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {showOutput ? '生成完成' : 'AI 助手就绪'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* 品牌故事展示 */}
          <motion.div variants={itemVariants}>
            <div className={`rounded-xl border shadow-sm overflow-hidden
              ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`px-4 py-3 border-b flex items-center gap-2
                ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
                <i className="fas fa-book-open text-amber-500"></i>
                <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  品牌故事
                </h3>
              </div>
              <div className="p-4">
                <h4 className={`text-sm font-bold mb-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                  {brand === 'mahua' ? '桂发祥十八街麻花' : brand}
                </h4>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {BRAND_STORIES[brand as keyof typeof BRAND_STORIES] || story || '选择一个品牌查看其背后的文化故事。'}
                </p>
                <button 
                  className={`text-xs mt-3 hover:underline flex items-center gap-1 font-medium transition-colors
                    ${isDark ? 'text-amber-500 hover:text-amber-400' : 'text-amber-600 hover:text-amber-700'}`}
                  onClick={() => toast.info('更多品牌故事开发中')}
                >
                  <span>阅读完整故事</span>
                  <i className="fas fa-arrow-right text-[10px]"></i>
                </button>
              </div>
            </div>
          </motion.div>

          {/* AI创意建议 */}
          <motion.div variants={itemVariants}>
            <div className={`rounded-xl border shadow-sm overflow-hidden
              ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`px-4 py-3 border-b flex items-center gap-2
                ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
                <i className="fas fa-lightbulb text-yellow-500"></i>
                <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  AI 创意建议
                </h3>
              </div>
              <div className="p-2">
                {aiDirections.length > 0 ? (
                  <div className="space-y-1">
                    {aiDirections.slice(0, 3).map((direction, index) => (
                      <button
                        key={index}
                        className={`w-full text-left p-3 rounded-lg transition-all text-xs flex gap-3 group
                          ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}
                        onClick={() => toast.info(`已应用创意：${direction}`)}
                      >
                        <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5
                          ${isDark ? 'bg-slate-800 text-slate-400 group-hover:bg-yellow-500/20 group-hover:text-yellow-400' : 'bg-slate-100 text-slate-500 group-hover:bg-yellow-100 group-hover:text-yellow-600'}`}>
                          {index + 1}
                        </span>
                        <span className="leading-relaxed group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          {direction}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      暂无建议，请输入提示词
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* 创作技巧 */}
          <motion.div variants={itemVariants}>
            <div className={`rounded-xl border shadow-sm overflow-hidden
              ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`px-4 py-3 border-b flex items-center gap-2
                ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
                <i className="fas fa-wand-magic-sparkles text-purple-500"></i>
                <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  创作技巧
                </h3>
              </div>
              <div className="p-4">
                <ul className="space-y-3">
                  {creativeTips.slice(0, 2).map((tip, index) => (
                    <li key={index} className="flex gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${isDark ? 'bg-purple-500' : 'bg-purple-600'}`}></div>
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {tip}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          {/* 资源链接 */}
          <motion.div variants={itemVariants}>
             <div className="grid grid-cols-2 gap-2">
                {resources.map((res) => (
                  <button
                    key={res.id}
                    className={`p-3 rounded-xl border text-center transition-all hover:scale-105 active:scale-95
                      ${isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                    onClick={() => toast.info(`${res.title} 即将上线`)}
                  >
                    <i className={`fas fa-${res.icon} text-lg mb-2 text-${res.color}-500`}></i>
                    <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {res.title}
                    </p>
                  </button>
                ))}
             </div>
          </motion.div>

        </motion.div>
      </div>
    </aside>
  );
};

export default NeoRightSidebar;
