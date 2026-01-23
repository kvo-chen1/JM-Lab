import React, { useMemo, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsive } from '@/utils/responsiveDesign';
import { TianjinImage } from '@/components/TianjinStyleComponents';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
// 异步导入CreatePostModal组件
const CreatePostModal = React.lazy(() => import('@/components/Community/Modals/CreatePostModal').then(module => ({ default: module.CreatePostModal })));
import { mockCommunities, getUserCommunities } from '@/mock/communities';

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
}

export const MobileWaterfallWorks: React.FC<MobileWaterfallWorksProps> = ({
  items,
  onClick
}) => {
  const { width } = useResponsive();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // 分享相关状态
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isShareToCommunityOpen, setIsShareToCommunityOpen] = useState(false);
  const [selectedWork, setSelectedWork] = useState<WorkItem | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);

  const columnsCount = useMemo(() => {
    if (width < 480) return 2;
    if (width < 768) return 3;
    return 4;
  }, [width]);

  // 手动计算瀑布流列数据
  const columns = useMemo(() => {
    const cols: WorkItem[][] = Array.from({ length: columnsCount }, () => []);
    items.forEach((item, i) => {
      cols[i % columnsCount].push(item);
    });
    return cols;
  }, [items, columnsCount]);
  
  // 处理分享功能
  const handleShare = (work: WorkItem) => {
    setSelectedWork(work);
    setIsShareDialogOpen(true);
  }

  // 分享到具体平台
  const shareToPlatform = (platform: string) => {
    if (!selectedWork) return;
    
    const shareUrl = `${window.location.origin}/explore/${selectedWork.id}`;
    const shareTitle = selectedWork.title;
    const shareDesc = `${selectedWork.title} - 来自津脉智坊的精彩作品`;
    const shareImage = selectedWork.thumbnail;
    
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
  }
  
  // 分享到社群
  const handleShareToCommunity = (data: { title: string; content: string; topic: string; contentType: string; images?: string[]; communityIds: string[] }) => {
    if (!selectedWork) return;
    
    // 使用社群服务创建帖子
    import('@/services/communityService').then(({ createPost }) => {
      createPost({
        title: data.title,
        content: data.content,
        topic: data.topic,
        communityIds: data.communityIds,
        workId: selectedWork.id.toString()
      }).then(() => {
        toast.success('分享成功！');
      }).catch((error) => {
        console.error('分享失败:', error);
        toast.error('分享失败，请重试');
      });
    });
    setIsShareToCommunityOpen(false);
  }

  return (
    <div className="flex gap-2 px-2 pb-20">
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
              key={work.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden cursor-pointer group"
              onClick={() => onClick?.(work.id)}
              whileHover={{ 
                scale: 1.02, 
                boxShadow: isDark 
                  ? '0 8px 24px rgba(0, 0, 0, 0.3)' 
                  : '0 8px 24px rgba(0, 0, 0, 0.15)'
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="relative overflow-hidden">
                <motion.div
                  className="w-full"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <TianjinImage
                    src={work.thumbnail}
                    alt={work.title}
                    className="w-full object-cover align-bottom"
                    rounded="lg"
                    imageTag={work.imageTag}
                    disableFallback={false}
                    loading={isTopItem ? "eager" : "lazy"} // 只有前几行急加载
                    quality="medium"
                    priority={isTopItem} // 高优先级
                    fetchPriority={isTopItem && ci === 0 ? "high" : "auto"} // 第一列的顶部元素最高优先级
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
                  {work.tags.slice(0, 2).map((tag, ti) => (
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
              
              <motion.div 
                className="p-2.5"
                initial={{ y: 0 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <motion.h3 
                  className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug mb-2 line-clamp-2"
                  whileHover={{ color: isDark ? '#ffffff' : '#1f2937' }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {work.title}
                </motion.h3>
                <motion.div 
                  className="flex items-center justify-between"
                  initial={{ opacity: 0.8 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <motion.div 
                      className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-700"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <TianjinImage
                        src={work.creatorAvatar}
                        alt={work.creator}
                        disableFallback={false}
                        quality="low"
                      />
                    </motion.div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {work.creator}
                    </span>
                  </div>
                  <motion.button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(work);
                    }}
                    className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} text-gray-500 hover:text-gray-800 dark:hover:text-gray-100`}
                    title="分享作品"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <i className="fas fa-share-alt text-xs"></i>
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )})}
        </div>
      ))}
      
      {/* 分享对话框 */}
      {isShareDialogOpen && selectedWork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
          <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-xl p-6 w-full max-w-md`}>
            <h2 className="text-xl font-bold mb-4">分享作品</h2>
            
            <div className="space-y-4">
              {/* 分享链接预览 */}
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                <p className="text-sm opacity-70 mb-1">分享链接</p>
                <p className="text-sm font-medium break-all">{window.location.origin}/explore/{selectedWork.id}</p>
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
                  <span className="text-xs">创作者社群</span>
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
      
      {/* 分享到创作者社群对话框 */}
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
                joinedCommunities={mockCommunities.slice(0, 10)} // 只传递前10个社群进行测试
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileWaterfallWorks;
