import React, { useContext, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { componentPreloader } from '@/utils/performanceOptimization.tsx';
import { useCreateStore } from '@/pages/create/hooks/useCreateStore';
import HistoryPanel from '@/pages/create/components/HistoryPanel';
import { CreatePostModal } from '@/components/Community/Modals/CreatePostModal';
import postsApi, { Post } from '@/services/postService';
import { toast } from 'sonner';
import { AuthContext } from '@/contexts/authContext';

export default function CreateLayout() {
  const { isDark, theme } = useTheme();
  const location = useLocation();
  const { t } = useTranslation();
  const shareDesign = useCreateStore((state) => state.shareDesign);
  const selectedResult = useCreateStore((state) => state.selectedResult);
  const [showHistory, setShowHistory] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const { user } = useContext(AuthContext);

  const handlePublish = async (data: any) => {
    console.log('[CreateLayout] handlePublish called with:', data);
    console.log('[CreateLayout] Current user:', user);
    
    try {
      const newPost: Partial<Post> = {
        title: data.title,
        description: data.content,
        thumbnail: data.images?.[0] || 'https://images.unsplash.com/photo-1558655146-d09347e0c766?q=80&w=2560&auto=format&fit=crop',
        category: data.contentType === 'video' ? 'video' : 'design',
        tags: [data.topic],
        date: new Date().toISOString().split('T')[0],
        likes: 0,
        views: 0,
        comments: [],
        shares: 0,
        // author: user?.name || '当前用户',
        // authorAvatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
        isLiked: false,
        isBookmarked: false,
        videoUrl: data.contentType === 'video' && data.images?.[0] ? data.images[0] : undefined
      };

      console.log('[CreateLayout] Creating post:', newPost);
      
      // 传入当前用户对象
      const result = await postsApi.addPost(newPost as Post, user || undefined);
      console.log('[CreateLayout] Post created:', result);
      
      // 触发更新事件，通知广场页面刷新
      window.dispatchEvent(new Event('square-posts-updated'));
      
      toast.success('发布成功！已发布到广场');
      setIsPublishModalOpen(false);
    } catch (error) {
      toast.error('发布失败');
      console.error('[CreateLayout] Publish error:', error);
    }
  };

  // 预取路由
  const prefetchRoute = (id: string) => {
    componentPreloader.preloadComponents([id]);
  };

  const navItems = [
    { path: '/create', label: '设计工坊', icon: 'layer-group', exact: true },
    { path: '/create/ai-writer', label: 'AI 智作文案', icon: 'pen-nib' },
    { path: '/create/inspiration', label: '作品之心', icon: 'bolt' },
    { path: '/create/wizard', label: '品牌向导', icon: 'hat-wizard' },
    { path: '/create/activity', label: '创建活动', icon: 'calendar-plus', exact: true },
  ];

  // Determine if we are in the main studio (no scroll) or sub-pages (scrollable)
  const isStudio = location.pathname === '/create';

  return (
    <div className={`flex flex-col h-[calc(100vh-64px)] ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Top Navigation Bar - 顶部导航栏 */}
      <div className={`flex items-center justify-between px-3 md:px-6 py-3 border-b flex-shrink-0 z-30 transition-colors duration-300 ${isDark ? 'border-gray-800 bg-gray-900/95 backdrop-blur-sm' : 'border-gray-200 bg-white/95 backdrop-blur-sm'}`}>
        {/* 导航 Tab - 响应式显示 */}
        <div id="guide-step-create-nav" className={`flex flex-1 overflow-x-auto no-scrollbar space-x-1 p-1 rounded-xl border mr-2 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-100/80 border-gray-200'}`}>
          {navItems.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={`
                  px-3 md:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center space-x-2 flex-shrink-0
                  ${isActive 
                    ? (isDark 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                        : 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5') 
                    : (isDark 
                        ? 'text-gray-400 hover:text-gray-100 hover:bg-gray-700/50' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50')
                  }`}
              >
                <i className={`fas fa-${item.icon} ${isActive ? 'animate-pulse-slow' : ''} text-xs`}></i>
                {/* 移动端隐藏文字，仅显示图标，以节省空间 */}
                <span className="lg:inline hidden">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
        
        {/* Optional: Add some actions on the right if needed, strictly purely layout optimization */}
        {/* 手机端分享按钮 - 位于顶部右侧 */}
        <div className="md:hidden flex-shrink-0 flex items-center gap-2">
          <button 
            onClick={() => {
              console.log('History button clicked');
              setShowHistory(true);
            }}
            className={`p-2.5 rounded-full transition-colors shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
             <i className="fas fa-history"></i>
          </button>
          
          <button 
            onClick={() => {
              console.log('Share button clicked');
              if (!selectedResult) {
                // 如果没有选择作品，给用户一个提示
                const toast = document.createElement('div');
                toast.className = 'fixed top-20 right-6 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 ease-in-out';
                toast.textContent = '请先生成或选择一个设计作品';
                document.body.appendChild(toast);
                
                setTimeout(() => {
                  toast.style.opacity = '0';
                  setTimeout(() => {
                    document.body.removeChild(toast);
                  }, 300);
                }, 2000);
                return;
              }
              shareDesign();
            }}
            className={`p-2.5 rounded-full transition-colors shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'} ${!selectedResult ? 'opacity-50' : ''}`}
          >
             <i className="fas fa-share-alt"></i>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className={`flex-1 relative ${isStudio ? '' : 'overflow-y-auto'} pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0`}>
        <Outlet />
      </div>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
      </AnimatePresence>

      <CreatePostModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onSubmit={handlePublish}
        isDark={isDark}
        topics={['国潮', '非遗', '极简', '赛博朋克']}
        initialImages={selectedResult ? [String(selectedResult)] : []}
      />

      {/* 移动端底部导航栏 */}
      <div className={clsx(
        'fixed bottom-0 inset-x-0 md:hidden z-20 transition-all duration-300 ease-in-out',
        'translate-y-0'
      )}>
        <div className={clsx(
          'backdrop-blur-xl border-t shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]',
          isDark 
            ? 'bg-gray-900/85 border-gray-800/50' 
            : theme === 'pink' ? 'bg-white/85 border-pink-200/50' : 'bg-white/85 border-gray-200/50'
        )}>
          <ul className="grid grid-cols-5 py-1 px-2">
            {[
              { to: '/', icon: 'home', label: t('common.home'), prefetch: 'home' },
              { to: '/explore', icon: 'compass', label: t('common.explore'), prefetch: 'explore' },
              { to: '/create', icon: 'plus', label: t('common.create'), prefetch: 'create', isSpecial: true },
              { to: '/community?context=cocreation&tab=joined', icon: 'comments', label: t('common.community'), prefetch: 'community' },
              { to: '/tianjin', icon: 'landmark', label: '天津', prefetch: 'tianjin' }
            ].map((item) => (
              <li key={item.to} className="flex items-center justify-center">
                <NavLink 
                  to={item.to} 
                  onTouchStart={() => prefetchRoute(item.prefetch)}
                  className={({ isActive }) => clsx(
                    'flex flex-col items-center justify-center w-full h-[56px] rounded-xl transition-all duration-300 relative',
                    item.isSpecial ? '' : 'active:scale-90'
                  )}
                  end={item.to === '/'}
                >
                  {({ isActive }) => {
                    // 特殊处理创作按钮
                    if (item.isSpecial) {
                      return (
                        <div className="relative -mt-6">
                          <div className={clsx(
                            'w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300',
                            isDark ? 'bg-blue-600 text-white' : theme === 'pink' ? 'bg-pink-500 text-white' : 'bg-orange-500 text-white',
                            isActive ? 'scale-110 ring-4 ring-opacity-30' : 'scale-100',
                            isActive ? (isDark ? 'ring-blue-500' : theme === 'pink' ? 'ring-pink-500' : 'ring-orange-500') : ''
                          )}>
                            <i className={clsx("fas fa-plus text-xl transition-transform duration-300", isActive ? "rotate-90" : "")}></i>
                          </div>
                          <span className={clsx(
                            'text-[10px] font-medium mt-1 block text-center transition-colors',
                            isActive 
                              ? (isDark ? 'text-blue-400' : theme === 'pink' ? 'text-pink-600' : 'text-orange-600') 
                              : (isDark ? 'text-gray-400' : 'text-gray-500')
                          )}>{item.label}</span>
                        </div>
                      );
                    }

                    const activeColor = isDark ? 'text-blue-400' : theme === 'pink' ? 'text-pink-600' : 'text-orange-600';
                    const inactiveColor = isDark ? 'text-gray-400' : 'text-gray-500';
                    
                    return (
                      <>
                        <div className={clsx(
                          'relative transition-all duration-300',
                          isActive ? '-translate-y-1' : 'translate-y-0'
                        )}>
                          <i className={clsx(
                            `fas fa-${item.icon} text-xl transition-colors duration-300`,
                            isActive ? activeColor : inactiveColor
                          )}></i>
                          {isActive && (
                            <span className={clsx(
                              'absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                              isDark ? 'bg-blue-400' : theme === 'pink' ? 'bg-pink-500' : 'bg-orange-500'
                            )}></span>
                          )}
                        </div>
                        <span className={clsx(
                          'text-[10px] font-medium mt-1 transition-all duration-300',
                          isActive ? clsx(activeColor, 'scale-105') : inactiveColor
                        )}>{item.label}</span>
                      </>
                    );
                  }}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
