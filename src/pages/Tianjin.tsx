import { useTheme } from '@/hooks/useTheme';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import TianjinCreativeActivities from '@/components/TianjinCreativeActivities';
import TemplateShowcaseGrid from '@/components/templates/TemplateShowcaseGrid';
import ErrorBoundary from '@/components/ErrorBoundary';
import { tianjinActivityService, TianjinTemplate } from '@/services/tianjinActivityService';
import { templateInteractionService } from '@/services/templateInteractionService';
import { generateTemplatePrompt } from '@/utils/templatePromptGenerator';
import { templateUsageService } from '@/services/templateUsageService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// 分类配置
const CATEGORIES = [
  { id: 'all', name: '全部', icon: '✨', color: 'from-red-500 to-pink-500' },
  { id: '节日主题', name: '节日主题', icon: '🎉', color: 'from-orange-500 to-red-500' },
  { id: '美食宣传', name: '美食宣传', icon: '🍜', color: 'from-yellow-500 to-orange-500' },
  { id: '城市风光', name: '城市风光', icon: '🌆', color: 'from-blue-500 to-cyan-500' },
  { id: '历史风情', name: '历史风情', icon: '🏛️', color: 'from-amber-600 to-yellow-500' },
];

export default function Tianjin() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    templateCount: 0,
    totalUsage: 0,
    totalLikes: 0,
    totalFavorites: 0,
  });
  const [hotTemplates, setHotTemplates] = useState<TianjinTemplate[]>([]);
  const [allTemplates, setAllTemplates] = useState<TianjinTemplate[]>([]);
  
  // 加载统计数据和热门模板
  useEffect(() => {
    const loadStats = async () => {
      try {
        const templates = await tianjinActivityService.getTemplates();
        setAllTemplates(templates);
        
        // 计算统计数据
        const templateCount = templates.length;
        
        // 从 Supabase 获取真实的总使用次数和总点赞数
        // 使用 Promise.allSettled 确保即使某个请求失败也能继续
        const [usageResult, likesResult, favoritesResult] = await Promise.allSettled([
          templateInteractionService.getTotalUsageCount(),
          templateInteractionService.getTotalLikesCount(),
          templateInteractionService.getUserFavoritesCount(),
        ]);
        
        const totalUsage = usageResult.status === 'fulfilled' ? usageResult.value : 0;
        const totalLikes = likesResult.status === 'fulfilled' ? likesResult.value : 0;
        const favoritesCount = favoritesResult.status === 'fulfilled' ? favoritesResult.value : 0;
        
        // 按使用次数排序获取热门模板（前4个）
        const sortedTemplates = [...templates]
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, 4);
        
        setStats({
          templateCount,
          totalUsage,
          totalLikes,
          totalFavorites: favoritesCount,
        });
        setHotTemplates(sortedTemplates);
      } catch (error) {
        console.error('加载统计数据失败:', error);
      }
    };
    
    loadStats();
  }, []);

  // 处理使用模板（做同款）
  const handleUseTemplate = useCallback(async (template: TianjinTemplate) => {
    // 生成提示词
    const prompt = generateTemplatePrompt(template);
    
    // 保存使用记录
    if (user?.id) {
      try {
        await templateUsageService.saveTemplateUsage(user.id, template, prompt);
      } catch (error) {
        console.error('保存模板使用记录失败:', error);
      }
    }
    
    // 增加模板使用次数
    try {
      await tianjinActivityService.incrementTemplateUsage(template.id);
    } catch (error) {
      console.error('增加使用次数失败:', error);
    }
    
    // 跳转到创作页面
    navigate('/create', {
      state: {
        templatePrompt: prompt,
        templateId: template.id,
        templateName: template.name,
        templateStyle: template.style,
        templateCategory: template.category
      }
    });
    
    toast.success(`正在使用"${template.name}"模板创建作品...`);
  }, [navigate, user]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* 主内容区 - 三栏布局 */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* 页面标题区 - 简洁版 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                津脉作品
              </h1>
              <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                探索天津特色文化模板，一键创作属于你的津门故事
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="font-bold text-lg">{stats.templateCount}+</div>
                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>模板</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{stats.totalUsage}+</div>
                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>使用</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{stats.totalLikes}+</div>
                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>点赞</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 三栏式内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 左侧边栏 - 精简版 */}
          <aside className="lg:col-span-2 space-y-4">
            {/* 分类导航 - 简化版 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'} shadow-sm`}
            >
              <div className="p-4">
                <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  模板分类
                </h3>
                <div className="space-y-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                        selectedCategory === cat.id
                          ? `bg-gradient-to-r ${cat.color} text-white shadow-md`
                          : isDark 
                            ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' 
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span className="font-medium">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* 热门标签 - 精简版 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'} shadow-sm`}
            >
              <div className="p-4">
                <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  热门标签
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['传统文化', '五大道', '海河', '美食', '夜景'].map((tag) => (
                    <span
                      key={tag}
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-colors ${
                        isDark 
                          ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </aside>
          
          {/* 中间主内容区 - 模板列表 */}
          <section className="lg:col-span-8 space-y-8">
            {/* 做同款模板展示区 */}
            <ErrorBoundary>
              <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'} shadow-sm`}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🎨</span>
                      <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        做同款
                      </h2>
                      <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        选择喜欢的模板，一键生成同款作品
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <TemplateShowcaseGrid
                    templates={allTemplates}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                  />
                </div>
              </div>
            </ErrorBoundary>

            {/* 原有模板列表 */}
            <ErrorBoundary>
              <TianjinCreativeActivities 
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                search={searchQuery}
              />
            </ErrorBoundary>
          </section>
          
          {/* 右侧边栏 - 精简版 */}
          <aside className="lg:col-span-2 space-y-4">
            {/* 我的收藏 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'} shadow-sm`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    我的收藏
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    {stats.totalFavorites}
                  </span>
                </div>
                
                {stats.totalFavorites === 0 && (
                  <div className={`text-center py-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <svg className="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <p className="text-xs">暂无收藏模板</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* 热门排行 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'} shadow-sm`}
            >
              <div className="p-4">
                <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  🔥 热门模板
                </h3>
                <div className="space-y-3">
                  {hotTemplates.length > 0 ? (
                    hotTemplates.map((template, index) => (
                      <div key={template.id} className="flex items-center gap-3 group cursor-pointer">
                        <span className={`w-5 h-5 flex items-center justify-center rounded-md text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-400 text-white' :
                          isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate group-hover:text-red-500 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {template.name}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {template.usageCount} 次使用
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`text-center py-4 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      加载中...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* 活动推广 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className={`rounded-2xl overflow-hidden bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-lg`}
            >
              <div className="p-4">
                <h3 className="text-sm font-semibold mb-2">🎉 创作大赛</h3>
                <p className="text-xs text-white/80 mb-3">
                  参与津脉创作大赛，展示你的创意作品，赢取精美奖品！
                </p>
                <button 
                  onClick={() => navigate('/events')}
                  className="w-full py-2 px-3 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-medium transition-colors"
                >
                  立即参与 →
                </button>
              </div>
            </motion.div>
          </aside>
        </div>
      </main>
    </div>
  );
}
