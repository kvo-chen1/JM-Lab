import { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { EventHeader } from './components/EventHeader';
import { EventInfo } from './components/EventInfo';
import { EventContent } from './components/EventContent';
import { EventSidebar } from './components/EventSidebar';
import { WorkGallery } from './components/WorkGallery';
import { useEventDetail } from './hooks/useEventDetail';
import { ShareModal } from '@/components/ShareModal';
import { HamsterWheelLoader } from '@/components/ui';
import { useNavigate, useParams } from 'react-router-dom';

export default function EventDetail() {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const { event, loading, error, viewCount, participantCount } = useEventDetail();
  
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // 检查登录状态
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // 处理分享
  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  // 处理收藏
  const handleBookmark = async () => {
    if (!event) return;

    try {
      // TODO: 实现收藏逻辑
      setIsBookmarked(!isBookmarked);
      toast.success(isBookmarked ? '已取消收藏' : '收藏成功');
    } catch (error) {
      toast.error('操作失败');
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center min-h-screen">
          <HamsterWheelLoader />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md px-4">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">活动不存在</h2>
            <p className="text-gray-500 mb-6">
              {error || '该活动可能已被删除或不存在'}
            </p>
            <button
              onClick={() => navigate('/activities')}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回活动列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
      {/* 页面头部 */}
      <EventHeader
        title={event.title}
        onShare={handleShare}
        onBookmark={handleBookmark}
        isBookmarked={isBookmarked}
      />

      {/* 主要内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* 左侧内容区 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 活动信息 */}
            <EventInfo
              event={event}
              viewCount={viewCount}
              participantCount={participantCount}
            />

            {/* 活动内容 */}
            <EventContent event={event} />

            {/* 作品展示 */}
            <WorkGallery eventId={event.id} />
          </div>

          {/* 右侧操作栏 */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <EventSidebar
                event={event}
                onShare={handleShare}
                isBookmarked={isBookmarked}
                onBookmark={handleBookmark}
              />
            </div>
          </div>
        </div>
      </main>

      {/* 分享弹窗 */}
      {isShareModalOpen && (
        <ShareModal
          open={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          title={event.title}
          description={event.description || ''}
          url={window.location.href}
          imageUrl={event.image_url || ''}
        />
      )}
    </div>
  );
}
