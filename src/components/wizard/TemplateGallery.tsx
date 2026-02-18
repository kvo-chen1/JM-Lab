import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  description: string;
  features: string[];
  popular?: boolean;
  new?: boolean;
}

interface TemplateGalleryProps {
  templates: Template[];
  selectedTemplate: string | null;
  isDark: boolean;
  onSelect: (templateId: string) => void;
}

const categories = [
  { id: 'all', name: '全部', icon: 'fa-th-large' },
  { id: 'festival', name: '节日主题', icon: 'fa-calendar-alt' },
  { id: 'industry', name: '行业模板', icon: 'fa-briefcase' },
  { id: 'style', name: '风格模板', icon: 'fa-palette' },
  { id: 'scene', name: '场景模板', icon: 'fa-image' },
];

// 分类颜色映射
const categoryColors: Record<string, { bg: string; text: string; gradient: string }> = {
  festival: { bg: 'bg-red-50', text: 'text-red-600', gradient: 'from-red-500 to-pink-500' },
  industry: { bg: 'bg-blue-50', text: 'text-blue-600', gradient: 'from-blue-500 to-cyan-500' },
  style: { bg: 'bg-purple-50', text: 'text-purple-600', gradient: 'from-purple-500 to-violet-500' },
  scene: { bg: 'bg-amber-50', text: 'text-amber-600', gradient: 'from-amber-500 to-orange-500' },
};

export default function TemplateGallery({ templates, selectedTemplate, isDark, onSelect }: TemplateGalleryProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const filteredTemplates = activeCategory === 'all'
    ? templates
    : templates.filter(t => t.category === activeCategory);

  return (
    <div className="space-y-8">
      {/* 分类筛选器 - 优化设计 */}
      <div className="flex flex-wrap gap-3">
        {categories.map((cat, index) => (
          <motion.button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`
              relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300
              ${activeCategory === cat.id
                ? 'text-white shadow-lg'
                : (isDark
                    ? 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm')
              }
            `}
            style={activeCategory === cat.id ? {
              background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.35)'
            } : {}}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <i className={`fas ${cat.icon} mr-2 ${activeCategory === cat.id ? 'text-white' : ''}`}></i>
            {cat.name}
            {activeCategory === cat.id && (
              <motion.div
                layoutId="activeCategory"
                className="absolute inset-0 rounded-full"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* 模板网格 - 优化卡片设计 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredTemplates.map((template, index) => {
            const colors = categoryColors[template.category] || categoryColors.scene;
            const isHovered = hoveredTemplate === template.id;
            const isSelected = selectedTemplate === template.id;

            return (
              <motion.div
                key={template.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.05,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                className={`
                  group relative cursor-pointer rounded-2xl overflow-hidden
                  transition-all duration-500 ease-out
                  ${isDark
                    ? 'bg-gray-800/60 border border-gray-700/50'
                    : 'bg-white border border-gray-100'
                  }
                  ${isSelected
                    ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-transparent shadow-2xl shadow-red-500/20'
                    : 'shadow-lg shadow-black/5 hover:shadow-2xl hover:shadow-black/10'
                  }
                `}
                onClick={() => onSelect(template.id)}
                onMouseEnter={() => setHoveredTemplate(template.id)}
                onMouseLeave={() => setHoveredTemplate(null)}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* 图片区域 */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <motion.img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover"
                    animate={{
                      scale: isHovered ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                  />

                  {/* 渐变遮罩 */}
                  <div className={`
                    absolute inset-0 bg-gradient-to-t transition-opacity duration-500
                    ${isDark
                      ? 'from-gray-900 via-gray-900/60 to-transparent'
                      : 'from-gray-900/90 via-gray-900/40 to-transparent'
                    }
                    ${isHovered ? 'opacity-90' : 'opacity-70'}
                  `} />

                  {/* 顶部徽章区域 */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <div className="flex flex-wrap gap-2">
                      {template.popular && (
                        <motion.span
                          initial={{ scale: 0, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5"
                        >
                          <i className="fas fa-fire"></i>
                          热门
                        </motion.span>
                      )}
                      {template.new && (
                        <motion.span
                          initial={{ scale: 0, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.1 }}
                          className="px-3 py-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5"
                        >
                          <i className="fas fa-sparkles"></i>
                          新
                        </motion.span>
                      )}
                    </div>

                    {/* 选中指示器 */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                          className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white shadow-xl"
                        >
                          <i className="fas fa-check text-sm"></i>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 底部信息 */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <motion.div
                      animate={{ y: isHovered ? 0 : 5, opacity: isHovered ? 1 : 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* 分类标签 */}
                      <span className={`
                        inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium mb-3
                        ${isDark ? 'bg-white/10 text-white/80' : 'bg-white/20 text-white backdrop-blur-sm'}
                      `}>
                        <i className={`fas ${categories.find(c => c.id === template.category)?.icon || 'fa-tag'} text-xs`}></i>
                        {categories.find(c => c.id === template.category)?.name || '模板'}
                      </span>

                      <h4 className="font-bold text-white text-lg mb-2 leading-tight">
                        {template.name}
                      </h4>
                      <p className={`
                        text-sm line-clamp-2 transition-all duration-300
                        ${isDark ? 'text-gray-300' : 'text-gray-200'}
                        ${isHovered ? 'opacity-100' : 'opacity-80'}
                      `}>
                        {template.description}
                      </p>
                    </motion.div>
                  </div>

                  {/* 悬停时的操作提示 */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered && !isSelected ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 py-3 bg-white/20 backdrop-blur-md rounded-full text-white font-medium text-sm border border-white/30 shadow-xl">
                      <i className="fas fa-hand-pointer mr-2"></i>
                      点击选择
                    </div>
                  </motion.div>
                </div>

                {/* 底部特性标签 */}
                <div className={`
                  p-4 border-t transition-colors duration-300
                  ${isDark ? 'border-gray-700/50 bg-gray-800/40' : 'border-gray-100 bg-gray-50/50'}
                `}>
                  <div className="flex flex-wrap gap-2">
                    {template.features.slice(0, 3).map((feature, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 + i * 0.05 }}
                        className={`
                          text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-300
                          ${isDark
                            ? 'bg-gray-700/60 text-gray-300 hover:bg-gray-600/60'
                            : 'bg-white text-gray-600 shadow-sm border border-gray-100 hover:border-gray-200'
                          }
                        `}
                      >
                        {feature}
                      </motion.span>
                    ))}
                  </div>
                </div>

                {/* 选中时的边框光效 */}
                {isSelected && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(249,115,22,0.3))',
                      filter: 'blur(8px)',
                      zIndex: -1,
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 空状态 - 优化设计 */}
      {filteredTemplates.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className={`
            w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center
            ${isDark ? 'bg-gray-800' : 'bg-gray-100'}
          `}>
            <i className="fas fa-search text-3xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            该分类下暂无模板
          </h3>
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
            试试其他分类，或者稍后再来看看
          </p>
        </motion.div>
      )}
    </div>
  );
}
