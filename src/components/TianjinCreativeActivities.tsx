import { useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

import { toast } from 'sonner';
import { TianjinImage } from './TianjinStyleComponents';
import { tianjinActivityService, TianjinTemplate } from '@/services/tianjinActivityService';

interface TianjinCreativeActivitiesProps {
  search?: string;
}

export default memo(function TianjinCreativeActivities({}: TianjinCreativeActivitiesProps) {
  const { isDark } = useTheme();
  
  // 数据状态
  const [templates, setTemplates] = useState<TianjinTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 中文注释：津脉作品详情弹层状态
  const [selectedTemplate, setSelectedTemplate] = useState<TianjinTemplate | null>(null);
  const openTemplateDetail = useCallback((t: TianjinTemplate) => setSelectedTemplate(t), []);
  const closeTemplateDetail = useCallback(() => setSelectedTemplate(null), []);
  
  const handleApplyTemplate = useCallback((templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      // 导航到创作中心页面，传递模板参数
      window.location.href = `/create?template=${encodeURIComponent(template.name)}&prompt=${encodeURIComponent(template.description)}`;
      toast.success('已应用模板到创作中心');
    }
  }, [templates]);
  
  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const templatesData = await tianjinActivityService.getTemplates();
        setTemplates(templatesData);
      } catch (error) {
        console.error('Failed to fetch tianjin templates:', error);
        toast.error('加载数据失败，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  
  // 骨架屏加载状态
  if (isLoading) {
    return (
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3">
                <div className={`h-40 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                <div className={`h-4 w-3/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                <div className={`h-3 w-1/2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div
      className={`p-0 md:p-0 rounded-none ${isDark ? 'bg-transparent' : 'bg-transparent'} shadow-none flex-1 flex flex-col gap-6`}
    >
      {/* 左侧主内容区 */}
      <div className="w-full">
        {/* 津脉作品内容 */}
        <div className="columns-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 md:gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`break-inside-avoid mb-3 md:mb-4 rounded-xl overflow-hidden shadow-md border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
              }`}
            >
              <div className="relative group">
                <TianjinImage 
                  src={template.thumbnail} 
                  alt={template.name} 
                  className="cursor-pointer"
                  ratio="auto"
                  rounded="none"
                  onClick={() => openTemplateDetail(template)}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>
              {/* 移动端专属修改：p-2 (原p-4) 减少内边距 */}
              <div className={`p-2 md:p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-sm md:text-lg leading-tight line-clamp-1">{template.name}</h4>
                </div>
                <div className="flex flex-wrap gap-1 md:gap-2 mb-2 md:mb-3">
                  <span className={`text-[10px] md:text-xs px-1.5 py-0.5 rounded-full border ${
                    isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-red-50 border-red-100 text-red-600'
                  }`}>
                    {template.category}
                  </span>
                </div>
                <p className={`text-xs md:text-sm mb-2 md:mb-4 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {template.description}
                </p>
                <div className="flex justify-between items-center text-[10px] md:text-xs mb-2 md:mb-4">
                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center`}>
                    <i className="fas fa-fire-alt mr-1 text-red-500"></i>
                    {template.usageCount}
                  </span>
                </div>
                {/* 移动端专属修改：Flex布局水平排列按钮，更紧凑 */}
                <div className="flex md:grid md:grid-cols-2 gap-1 md:gap-2">
                  <button 
                    onClick={() => handleApplyTemplate(template.id)}
                    className="flex-1 py-1.5 md:py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] md:text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
                  >
                    应用
                  </button>
                  <button 
                    onClick={() => openTemplateDetail(template)}
                    className={`flex-1 py-1.5 md:py-2 rounded-lg text-[10px] md:text-sm font-medium transition-colors border whitespace-nowrap ${
                      isDark ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    详情
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 模板详情弹层 */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeTemplateDetail}></div>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-10 p-6`}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{selectedTemplate.name}</h2>
              <button
                onClick={closeTemplateDetail}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img
                  src={selectedTemplate.thumbnail}
                  alt={selectedTemplate.name}
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
              <div>
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-sm mb-2">{selectedTemplate.category}</span>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{selectedTemplate.description}</p>
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <i className="fas fa-fire-alt mr-2 text-red-500"></i>
                    <span>{selectedTemplate.usageCount}次使用</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      handleApplyTemplate(selectedTemplate.id);
                      closeTemplateDetail();
                    }}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    立即应用
                  </button>
                  <button
                    onClick={closeTemplateDetail}
                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
});
