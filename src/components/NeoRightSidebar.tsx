import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion } from 'framer-motion';
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
    { id: 'tianjin-culture', title: '天津文化知识库', icon: 'book-open', path: '#culture' },
    { id: 'design-templates', title: '设计模板库', icon: 'palette', path: '#templates' },
    { id: 'tutorials', title: '创作教程', icon: 'graduation-cap', path: '#tutorials' },
    { id: 'community', title: '创作者社区', icon: 'users', path: '#community' }
  ];

  return (
    <aside 
      className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-l transition-all duration-300 h-full w-64 overflow-y-auto shadow-lg`}
    >
      {/* 顶部标题区域 */}
      <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <motion.h2 
          className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          辅助面板
        </motion.h2>
        <button 
          className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
          onClick={() => toast.info('右侧面板功能开发中')}
          aria-label="关闭侧边栏"
        >
          <i className="fas fa-xmark"></i>
        </button>
      </div>

      {/* 内容区域 */}
      <div className="p-3 space-y-4">
        {/* 品牌故事展示 */}
        <motion.div 
          className={`rounded-lg p-3 shadow-sm ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h3 className={`text-xs font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <i className="fas fa-book-open text-red-500"></i>
            品牌故事
          </h3>
          <div className={`rounded-md p-2 ${isDark ? 'bg-gray-900/50' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h4 className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
              {brand === 'mahua' ? '桂发祥十八街麻花' : brand}
            </h4>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-3`}>
              {BRAND_STORIES[brand as keyof typeof BRAND_STORIES] || story}
            </p>
            <button 
              className={`text-xs text-red-600 mt-1 hover:underline flex items-center gap-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}
              onClick={() => toast.info('更多品牌故事开发中')}
            >
              <span>查看更多</span>
              <i className="fas fa-chevron-right text-xs"></i>
            </button>
          </div>
        </motion.div>

        {/* AI创意建议 */}
        <motion.div 
          className={`rounded-lg p-3 shadow-sm ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h3 className={`text-xs font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <i className="fas fa-lightbulb text-yellow-500"></i>
            AI创意建议
          </h3>
          {aiDirections.length > 0 ? (
            <div className="space-y-2">
              {aiDirections.slice(0, 3).map((direction, index) => (
                <motion.button
                  key={index}
                  className={`w-full text-left p-2 rounded-md transition-all duration-200 text-xs
                    ${isDark ? 'bg-gray-900/50 hover:bg-gray-800 border border-gray-700' : 'bg-white hover:bg-gray-100 border border-gray-200'}`}
                  whileHover={{ scale: 1.02, x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toast.info(`创意建议：${direction}`)}
                >
                  <div className="flex items-start gap-2">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 
                      ${isDark ? 'bg-blue-900/50 text-blue-400 border border-blue-800' : 'bg-blue-100 text-blue-600 border border-blue-200'}`}
                    >
                      {index + 1}
                    </div>
                    <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {direction}
                    </p>
                  </div>
                </motion.button>
              ))}
              {aiDirections.length > 3 && (
                <button 
                  className={`w-full text-center py-1.5 text-xs rounded-md transition-colors 
                    ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                  onClick={() => toast.info('更多创意建议开发中')}
                >
                  查看全部 {aiDirections.length} 条建议
                </button>
              )}
            </div>
          ) : (
            <div className={`rounded-md p-3 text-center ${isDark ? 'bg-gray-900/50 border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <i className="fas fa-lightbulb text-xl mb-1 opacity-50 ${isDark ? 'text-gray-600' : 'text-gray-400'}"></i>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                输入提示词，获取AI创意建议
              </p>
            </div>
          )}
        </motion.div>

        {/* 实时生成状态 */}
        <motion.div 
          className={`rounded-xl p-4 shadow-sm ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <i className="fas fa-spinner text-blue-500"></i>
            生成状态
          </h3>
          <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-900/50 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            {isGenerating ? (
              <>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>生成进度</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{progress}%</span>
                  </div>
                  <div className={`rounded-full h-2 overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <motion.div 
                      className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    ></motion.div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-circle text-xs animate-pulse text-red-500"></i>
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {generationStatus || '正在生成中...'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <i className="fas fa-check-circle text-2xl mb-2 ${isDark ? 'text-green-500' : 'text-green-600'}"></i>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {showOutput ? '生成完成' : '就绪，可以开始生成'}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* 创作技巧提示 */}
        <motion.div 
          className={`rounded-xl p-4 shadow-sm ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <i className="fas fa-lightbulb text-purple-500"></i>
            创作技巧
          </h3>
          <div className={`rounded-lg p-3 ${isDark ? 'bg-gray-900/50 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <ul className="space-y-3">
              {creativeTips.slice(0, 3).map((tip, index) => (
                <li key={index} className="flex gap-2">
                  <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${isDark ? 'bg-purple-500' : 'bg-purple-600'}`}></span>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {tip}
                  </p>
                </li>
              ))}
            </ul>
            <button 
              className={`text-xs text-purple-600 mt-2 hover:underline flex items-center gap-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}
              onClick={() => toast.info('更多创作技巧开发中')}
            >
              <span>查看更多技巧</span>
              <i className="fas fa-chevron-right text-xs"></i>
            </button>
          </div>
        </motion.div>

        {/* 相关资源推荐 */}
        <motion.div 
          className={`rounded-xl p-4 shadow-sm ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <i className="fas fa-compass text-green-500"></i>
            相关资源
          </h3>
          <div className="space-y-2">
            {resources.map((resource) => (
              <motion.button
                key={resource.id}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 
                  ${isDark ? 'bg-gray-900/50 hover:bg-gray-800 border border-gray-700' : 'bg-white hover:bg-gray-100 border border-gray-200'}`}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toast.info(`${resource.title} 开发中`)}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center 
                    ${isDark ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-green-100 text-green-600 border border-green-200'}`}
                  >
                    <i className={`fas fa-${resource.icon}`}></i>
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                      {resource.title}
                    </h4>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      探索相关资源，提升创作水平
                    </p>
                  </div>
                  <i className="fas fa-chevron-right text-xs opacity-50 ${isDark ? 'text-gray-500' : 'text-gray-400'}"></i>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 底部装饰 */}
      <div className="h-12 bg-gradient-to-t from-red-500/10 to-transparent opacity-50"></div>
    </aside>
  );
};

export default NeoRightSidebar;