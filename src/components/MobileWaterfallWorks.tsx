import React, { useMemo, useState, Suspense, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsive } from '@/utils/responsiveDesign';
import { TianjinImage } from '@/components/TianjinStyleComponents';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
// 异步导入CreatePostModal组件
const CreatePostModal = React.lazy(() => import('@/components/Community/Modals/CreatePostModal').then(module => ({ default: module.CreatePostModal })));
import { communityService, type Community } from '@/services/communityService';

export interface WorkItem {
  id: number;
  title: string;
  thumbnail: string;
  creator: string;
  creatorAvatar: string;
  tags: string[];
  category: string;
  imageTag?: string;
  aspectRatio?: number; // Optional: Allows pre-defining aspect ratio if known
}

// Generate random aspect ratio for demo purposes if not provided
// In a real app, this should come from the image metadata
const getRandomAspectRatio = (id: number) => {
  // Deterministic random based on ID to avoid hydration mismatch
  const ratios = [3/4, 1, 4/3, 9/16, 16/9]; 
  return ratios[id % ratios.length];
};

interface MobileWaterfallWorksProps {
  items: WorkItem[];
  onClick?: (id: number) => void;
  onLoadMore?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
  hasMore?: boolean;
  showNewWorkIndicator?: boolean;
}

export const MobileWaterfallWorks: React.FC<MobileWaterfallWorksProps> = ({
  items,
  onClick,
  onLoadMore,
  onRefresh,
  isLoading = false,
  isRefreshing = false,
  hasMore = true,
  showNewWorkIndicator = false
}) => {
  const { width } = useResponsive();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  // 分享相关状态
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isShareToCommunityOpen, setIsShareToCommunityOpen] = useState(false);
  const [selectedWork, setSelectedWork] = useState<WorkItem | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
  
  // 无限滚动相关状态
  const observerRef = useRef<HTMLDivElement>(null);
  const [newWorkVisible, setNewWorkVisible] = useState(true);
  
  // 下拉刷新相关状态
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef<number>(0);
  const isRefreshingRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 加载用户加入的社群
  useEffect(() => {
    const loadCommunities = async () => {
      try {
        const communities = await communityService.getCommunities();
        setJoinedCommunities(communities.slice(0, 10));
      } catch (err) {
        console.error('Failed to load communities:', err);
      }
    };
    loadCommunities();
  }, []);

  // 处理创作者头像点击
  const handleCreatorClick = (e: React.MouseEvent, creatorName: string) => {
    e.stopPropagation();
    // 这里假设我们有一个基于创作者名称的路由
    // 在实际应用中，应该使用创作者的唯一ID
    navigate(`/user/${encodeURIComponent(creatorName)}`);
  };

  // 无限滚动逻辑
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && onLoadMore) {
          onLoadMore();
        }
      },
      {
        threshold: 0.1,
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  // 处理新作品指示器的隐藏
  const handleNewWorkIndicatorClick = () => {
    setNewWorkVisible(false);
  };

  // 下拉刷新相关事件处理
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isRefreshing || isRefreshingRef.current) return;
    
    // 只有当页面滚动到顶部时才允许下拉刷新
    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isRefreshing || isRefreshingRef.current || startYRef.current === 0) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - startYRef.current;
    
    // 只有向下拉才触发刷新
    if (distance > 0) {
      e.preventDefault(); // 阻止默认滚动行为
      setIsPulling(true);
      // 限制下拉距离，最大80px
      const limitedDistance = Math.min(distance * 0.5, 80);
      setPullDistance(limitedDistance);
    }
  };

  const handleTouchEnd = () => {
    if (isRefreshing || isRefreshingRef.current) return;
    
    if (isPulling && pullDistance > 40) {
      // 触发刷新
      if (onRefresh) {
        isRefreshingRef.current = true;
        onRefresh();
      }
    }
    
    // 重置状态
    setIsPulling(false);
    setPullDistance(0);
    startYRef.current = 0;
  };

  // 监听刷新状态变化
  useEffect(() => {
    if (!isRefreshing) {
      isRefreshingRef.current = false;
    }
  }, [isRefreshing]);

  // 为容器添加触摸事件监听
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart as any, { passive: false });
      container.addEventListener('touchmove', handleTouchMove as any, { passive: false });
      container.addEventListener('touchend', handleTouchEnd as any);
      
      return () => {
        container.removeEventListener('touchstart', handleTouchStart as any);
        container.removeEventListener('touchmove', handleTouchMove as any);
        container.removeEventListener('touchend', handleTouchEnd as any);
      };
    }
  }, [isRefreshing, pullDistance, isPulling, onRefresh]);

  // 固定为2列瀑布流布局（移动端）
  const columnsCount = useMemo(() => {
    return 2;
  }, []);

  // 手动计算瀑布流列数据
  const columns = useMemo(() => {
    const cols: WorkItem[][] = Array.from({ length: columnsCount }, () => []);
    (items || []).forEach((item, i) => {
      cols[i % columnsCount].push(item);
    });
    return cols;
  }, [items, columnsCount]);
  
  // 处理分享功能
  const handleShare = (work: WorkItem) => {
    setSelectedWork(work);
    setIsShareDialogOpen(true);
  };

  // 分享到具体平台
  const shareToPlatform = (platform: string) => {
    if (!selectedWork) return;
    
    const shareUrl = `${window.location.origin}/explore/${selectedWork.id || ''}`;
    const shareTitle = selectedWork.title || '作品';
    const shareDesc = `${selectedWork.title || '作品'} - 来自津脉智坊的精彩作品`;
    const shareImage = selectedWork.thumbnail || '';
    
    let shareLink = '';
    
    switch (platform) {
      case 'weixin':
        // 微信分享通常需要专门的SDK，这里只是示例
        toast.info('请使用微信扫一扫分享');
        break;
      case 'weibo':
        shareLink = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}&pic=${encodeURIComponent(shareImage)}`;
        window.open(shareLink, '_blank');
        break;
      case 'qq':
        shareLink = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}&pics=${encodeURIComponent(shareImage)}&summary=${encodeURIComponent(shareDesc)}`;
        window.open(shareLink, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl)
          .then(() => {
            setShareSuccess(true);
            setTimeout(() => {
              setShareSuccess(false);
              setIsShareDialogOpen(false);
            }, 2000);
          })
          .catch(() => {
            toast.error('复制链接失败，请手动复制');
          });
        break;
      case 'community':
        // 打开分享到社群的模态框
        setIsShareDialogOpen(false);
        setIsShareToCommunityOpen(true);
        break;
      default:
        break;
    }
  };
  
  // 分享到社群
  const handleShareToCommunity = (data: { title: string; content: string; topic: string; contentType: string; images?: string[]; communityIds: string[] }) => {
    if (!selectedWork) return;
    
    // 使用社群服务创建帖子
    import('@/services/communityService').then(({ communityService }) => {
      communityService.createPost({
        title: data.title,
        content: data.content,
        topic: data.topic,
        communityIds: data.communityIds,
        workId: selectedWork.id?.toString() || ''
      }).then(() => {
        toast.success('分享成功！');
      }).catch((error: any) => {
        console.error('分享失败:', error);
        toast.error('分享失败，请重试');
      });
    });
    setIsShareToCommunityOpen(false);
  };

  return (
    <div className="relative" ref={containerRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {/* 下拉刷新指示器 */}
      {(isPulling || isRefreshing) && (
        <motion.div
          style={{ height: pullDistance || 60 }}
          className="flex justify-center items-center bg-gray-50 dark:bg-gray-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {isRefreshing ? (
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${isDark ? 'border-blue-500' : 'border-blue-600'}`}></div>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>刷新中...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: pullDistance > 40 ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <i className={`fas fa-chevron-down ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
              </motion.div>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {pullDistance > 40 ? '释放刷新' : '下拉刷新'}
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* 新作品指示器 */}
      {showNewWorkIndicator && newWorkVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40"
        >
          <motion.div
            className={`px-4 py-2 rounded-full shadow-lg flex items-center gap-2 cursor-pointer ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNewWorkIndicatorClick}
          >
            <i className="fas fa-bell"></i>
            <span className="text-sm font-medium">有新作品发布</span>
            <i className="fas fa-chevron-down text-xs"></i>
          </motion.div>
        </motion.div>
      )}

      {/* 瀑布流布局 - 2列，紧凑间距 */}
      <div className="flex gap-2 pb-20 px-2">
        {columns.map((col, ci) => (
          <div key={ci} className="flex-1 flex flex-col gap-2">
            {col.map((work, wi) => {
              const ratio = work.aspectRatio || getRandomAspectRatio(work.id);
              // Calculate global index for priority loading logic
              // This is an approximation as we don't have the original index easily here without extra logic
              // But for eager loading, checking if it's in the first few rows is enough.
              const isTopItem = wi < 2; 
              
              return (
                <motion.div
                  key={work?.id || wi}
                  className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-lg transition-shadow"
                  onClick={() => work?.id && onClick?.(work.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: wi * 0.1, ease: "easeOut" }}
                  whileHover={{ 
                    scale: 1.03, 
                    boxShadow: isDark 
                      ? '0 12px 32px rgba(0, 0, 0, 0.4)' 
                      : '0 12px 32px rgba(0, 0, 0, 0.18)'
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative overflow-hidden">
                    <motion.div
                      className="w-full"
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      <TianjinImage
                        src={work?.thumbnail || ''}
                        alt={work?.title || '作品'}
                        className="w-full object-cover align-bottom"
                        rounded="xl"
                        imageTag={work?.imageTag}
                        disableFallback={false}
                        loading={isTopItem ? "eager" : "lazy"} // 只有前几行急加载
                        quality="medium"
                        priority={isTopItem} // 高优先级
                        style={{ aspectRatio: `${ratio}` }}
                      />
                    </motion.div>
                    
                    {/* 悬停时显示的标签 */}
                    <motion.div
                      className="absolute top-2 left-2 right-2 flex flex-wrap gap-1.5 opacity-0 group-hover:opacity-100"
                      initial={{ opacity: 0, y: -10 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
                    >
                      {(work?.tags || []).slice(0, 2).map((tag, ti) => (
                        <motion.span
                          key={ti}
                          className={`px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-xs rounded-full ${isDark ? 'bg-white/20' : 'bg-black/60'}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileHover={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: 0.1 + ti * 0.05, ease: "easeOut" }}
                        >
                          {tag}
                        </motion.span>
                      ))}
                    </motion.div>
                  </div>
                  
                  {/* 卡片信息区 - 更紧凑 */}
                  <motion.div 
                    className="p-2"
                    initial={{ y: 0 }}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <motion.h3 
                      className="text-xs font-semibold text-gray-900 dark:text-gray-100 leading-snug mb-1.5 line-clamp-2"
                      whileHover={{ color: isDark ? '#ffffff' : '#1f2937' }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      {work?.title || '未命名作品'}
                    </motion.h3>
                    <motion.div 
                      className="flex items-center justify-between"
                      initial={{ opacity: 0.8 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <motion.div 
                          className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-white dark:border-gray-700 shadow-sm cursor-pointer"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          onClick={(e) => work?.creator && handleCreatorClick(e, work.creator)}
                        >
                          <TianjinImage
                            src={work?.creatorAvatar || ''}
                            alt={work?.creator || '创作者'}
                            disableFallback={false}
                            quality="low"
                          />
                        </motion.div>
                        <motion.span 
                          className="text-[10px] text-gray-500 dark:text-gray-400 truncate cursor-pointer"
                          onClick={(e) => work?.creator && handleCreatorClick(e, work.creator)}
                        >
                          {work?.creator || '未知创作者'}
                        </motion.span>
                      </div>
                      <motion.button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(work);
                        }}
                        className={`w-6 h-6 flex items-center justify-center rounded-full transition-all ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} text-gray-500 hover:text-gray-800 dark:hover:text-gray-100`}
                        title="分享作品"
                        whileHover={{ scale: 1.15, rotate: 15, backgroundColor: isDark ? '#4b5563' : '#f3f4f6' }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <i className="fas fa-share-alt text-[10px]"></i>
                      </motion.button>
                    </motion.div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* 分享对话框 */}
      {isShareDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
          <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-xl p-6 w-full max-w-md`}>
            <h2 className="text-xl font-bold mb-4">分享作品</h2>
            
            <div className="space-y-4">
              {/* 分享链接预览 */}
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                <p className="text-sm opacity-70 mb-1">分享链接</p>
                <p className="text-sm font-medium break-all">{window.location.origin}/explore/{selectedWork?.id || ''}</p>
              </div>
              
              {/* 分享平台选择 */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <button 
                  onClick={() => shareToPlatform('weixin')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all hover:shadow-md ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <i className="fab fa-weixin text-2xl text-green-500 mb-1"></i>
                  <span className="text-xs">微信</span>
                </button>
                <button 
                  onClick={() => shareToPlatform('weibo')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all hover:shadow-md ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <i className="fab fa-weibo text-2xl text-red-500 mb-1"></i>
                  <span className="text-xs">微博</span>
                </button>
                <button 
                  onClick={() => shareToPlatform('qq')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all hover:shadow-md ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <i className="fab fa-qq text-2xl text-blue-500 mb-1"></i>
                  <span className="text-xs">QQ</span>
                </button>
                <button 
                  onClick={() => shareToPlatform('community')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all hover:shadow-md ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <i className="fas fa-users text-2xl text-orange-500 mb-1"></i>
                  <span className="text-xs">津脉社区</span>
                </button>
                <button 
                  onClick={() => shareToPlatform('copy')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all hover:shadow-md ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {shareSuccess ? (
                    <>
                      <i className="fas fa-check-circle text-2xl text-green-500 mb-1"></i>
                      <span className="text-xs">已复制</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-link text-2xl text-purple-500 mb-1"></i>
                      <span className="text-xs">复制链接</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 按钮组 */}
            <div className="flex justify-end mt-6">
              <button 
                onClick={() => setIsShareDialogOpen(false)}
                className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 分享到津脉社区对话框 */}
      {isShareToCommunityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
          <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-xl p-6 w-full max-w-md`}>
            <Suspense fallback={
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            }>
              <CreatePostModal
                isOpen={isShareToCommunityOpen}
                onClose={() => setIsShareToCommunityOpen(false)}
                onSubmit={handleShareToCommunity}
                isDark={isDark}
                topics={selectedWork?.tags || []}
                joinedCommunities={joinedCommunities} // 使用从API加载的社群
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* 加载更多指示器 */}
      <div className="mt-6 flex justify-center items-center">
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${isDark ? 'border-blue-500' : 'border-blue-600'}`}></div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>加载中...</p>
          </div>
        ) : !hasMore ? (
          <div className="py-8 text-center">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>没有更多作品了</p>
          </div>
        ) : (
          <div ref={observerRef} className="h-20 w-full"></div>
        )}
      </div>
    </div>
  );
};

// 为 MobileWaterfallWorks 组件添加比较函数
const areEqual = (prevProps: MobileWaterfallWorksProps, nextProps: MobileWaterfallWorksProps) => {
  // 比较基本属性
  if (prevProps.onClick !== nextProps.onClick) return false;
  if (prevProps.onLoadMore !== nextProps.onLoadMore) return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.hasMore !== nextProps.hasMore) return false;
  if (prevProps.showNewWorkIndicator !== nextProps.showNewWorkIndicator) return false;
  
  // 比较作品数量
  if (prevProps.items.length !== nextProps.items.length) return false;
  
  // 比较作品内容（只比较id，避免深层比较影响性能）
  for (let i = 0; i < prevProps.items.length; i++) {
    if (prevProps.items[i].id !== nextProps.items[i].id) {
      return false;
    }
  }
  
  return true;
};

// 使用比较函数包装组件
export default React.memo(MobileWaterfallWorks, areEqual);