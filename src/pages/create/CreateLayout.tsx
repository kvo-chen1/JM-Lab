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
import { uploadImage, downloadAndUploadVideo } from '@/services/imageService';

export default function CreateLayout() {
  const { isDark, theme } = useTheme();
  const location = useLocation();
  const { t } = useTranslation();
  const shareDesign = useCreateStore((state) => state.shareDesign);
  const selectedResult = useCreateStore((state) => state.selectedResult);
  const generatedResults = useCreateStore((state) => state.generatedResults);
  const [showHistory, setShowHistory] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const { user } = useContext(AuthContext);

  // 获取当前选中结果的缩略图或视频URL
  const getSelectedResultUrls = () => {
    if (!selectedResult) return [];
    const result = generatedResults.find(r => r.id === selectedResult);
    if (!result) return [];
    // 如果是视频，返回视频URL；否则返回缩略图
    return result.video ? [result.video] : [result.thumbnail];
  };

  // 辅助函数：将远程图片上传到存储服务
  const uploadRemoteImage = async (imageUrl: string): Promise<string> => {
    try {
      // 如果已经是本地存储的 URL（以 /uploads 开头），直接返回
      if (imageUrl.startsWith('/uploads/')) {
        return imageUrl;
      }
      
      // 如果是 Supabase Storage 的 URL（旧的，已无法访问），需要重新上传
      if (imageUrl.includes('supabase.co/storage')) {
        console.warn('[CreateLayout] Old Supabase URL detected, will upload to new storage:', imageUrl);
        // 继续执行上传逻辑
      }
      
      // 如果是 data URL，转换为文件并上传
      if (imageUrl.startsWith('data:')) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `image-${Date.now()}.png`, { type: blob.type || 'image/png' });
        return await uploadImage(file);
      }
      
      // 下载远程图片并上传
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const blob = await response.blob();
      const file = new File([blob], `image-${Date.now()}.png`, { type: blob.type || 'image/png' });
      return await uploadImage(file);
    } catch (error) {
      console.error('[CreateLayout] Failed to upload remote image:', error);
      // 上传失败时返回原始 URL
      return imageUrl;
    }
  };

  const handlePublish = async (data: any) => {
    console.log('[CreateLayout] handlePublish called with:', data);
    console.log('[CreateLayout] Current user:', user);
    
    // 获取当前选中的结果，判断是否为视频
    const selectedItem = generatedResults.find(r => r.id === selectedResult);
    const isVideo = selectedItem?.type === 'video' || selectedItem?.video;
    
    try {
      // 上传缩略图到存储服务（如果不是视频）
      let thumbnailUrl = selectedItem?.thumbnail || data.images?.[0] || 'https://images.unsplash.com/photo-1558655146-d09347e0c766?q=80&w=2560&auto=format&fit=crop';
      
      if (!isVideo && thumbnailUrl) {
        // 如果已经是本地存储 URL，跳过上传
        if (thumbnailUrl.startsWith('/uploads/')) {
          console.log('[CreateLayout] Thumbnail is already local URL:', thumbnailUrl);
        } else {
          console.log('[CreateLayout] Uploading thumbnail to storage...');
          thumbnailUrl = await uploadRemoteImage(thumbnailUrl);
          console.log('[CreateLayout] Thumbnail uploaded:', thumbnailUrl);
        }
      }
      
      // 处理视频 URL：如果不是本地存储的 URL，需要上传
      let videoUrl = isVideo ? selectedItem?.video : undefined;
      if (isVideo && videoUrl) {
        if (videoUrl.startsWith('/uploads/')) {
          console.log('[CreateLayout] Video is already local URL:', videoUrl);
        } else {
          console.log('[CreateLayout] Video URL is not from local storage, uploading...');
          console.log('[CreateLayout] Original video URL:', videoUrl);
          try {
            videoUrl = await downloadAndUploadVideo(videoUrl);
            console.log('[CreateLayout] Video uploaded to storage:', videoUrl);
          } catch (videoError) {
            console.error('[CreateLayout] Failed to upload video:', videoError);
            toast.error('视频上传失败，请重试');
            return;
          }
        }
      }
      
      const newPost: Partial<Post> = {
        title: data.title,
        description: data.content,
        thumbnail: thumbnailUrl,
        category: isVideo ? 'video' : 'design',
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
        videoUrl: videoUrl
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

  return (
    <div className={`flex flex-col h-[calc(100vh-64px)] ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Content Area */}
      <div className="flex-1 relative pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">
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
        initialImages={getSelectedResultUrls()}
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
