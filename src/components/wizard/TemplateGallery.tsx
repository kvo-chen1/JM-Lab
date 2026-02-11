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

export default function TemplateGallery({ templates, selectedTemplate, isDark, onSelect }: TemplateGalleryProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const filteredTemplates = activeCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <motion.button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat.id
                ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white shadow-lg shadow-red-500/20'
                : (isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200')
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <i className={`fas ${cat.icon} mr-2`}></i>
            {cat.name}
          </motion.button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`relative group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all ${
                selectedTemplate === template.id
                  ? 'border-red-500 shadow-lg shadow-red-500/20'
                  : (isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300')
              }`}
              onClick={() => onSelect(template.id)}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                  src={template.thumbnail} 
                  alt={template.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  {template.popular && (
                    <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                      <i className="fas fa-fire mr-1"></i>热门
                    </span>
                  )}
                  {template.new && (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                      <i className="fas fa-sparkles mr-1"></i>新
                    </span>
                  )}
                </div>

                {/* Selection Indicator */}
                {selectedTemplate === template.id && (
                  <motion.div
                    className="absolute top-3 right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  >
                    <i className="fas fa-check"></i>
                  </motion.div>
                )}

                {/* Info on Hover */}
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 p-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: hoveredTemplate === template.id ? 1 : 0.9, y: 0 }}
                >
                  <h4 className="font-bold text-white mb-1">{template.name}</h4>
                  <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-200'} line-clamp-2`}>
                    {template.description}
                  </p>
                </motion.div>
              </div>

              {/* Features */}
              <div className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex flex-wrap gap-2">
                  {template.features.slice(0, 3).map((feature, i) => (
                    <span 
                      key={i}
                      className={`text-xs px-2 py-1 rounded-full ${
                        isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <i className="fas fa-search text-gray-400 text-2xl"></i>
          </div>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            该分类下暂无模板
          </p>
        </div>
      )}
    </div>
  );
}
