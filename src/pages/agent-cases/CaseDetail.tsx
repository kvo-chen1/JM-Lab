// 案例详情页

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCaseDetail } from './hooks/useCaseDetail';
import { ImageCarousel } from './components/ImageCarousel';
import { ConversationPanel } from './components/ConversationPanel';
import { CaseActions } from './components/CaseActions';
import {
  ChevronLeft,
  Calendar,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const {
    caseDetail,
    loading,
    error,
    currentImageIndex,
    isLiked,
    isCreatingSimilar,
    setCurrentImageIndex,
    handleLike,
    handleShare,
    handleViewReplay,
    handleCreateSimilar,
  } = useCaseDetail(id || '');

  // 处理创建同款
  const onCreateSimilar = async () => {
    const result = await handleCreateSimilar();
    if (result) {
      navigate(result.redirectUrl, {
        state: { prefillData: result.prefillData },
      });
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 加载中
  if (loading) {
    return (
      <div className={`
        min-h-screen flex items-center justify-center
        ${isDark ? 'bg-[#0a0f0a]' : 'bg-gray-50'}
      `}>
        <div className="flex items-center gap-3">
          <Loader2 className={`w-6 h-6 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>加载中...</span>
        </div>
      </div>
    );
  }

  // 错误
  if (error || !caseDetail) {
    return (
      <div className={`
        min-h-screen flex flex-col items-center justify-center px-4
        ${isDark ? 'bg-[#0a0f0a]' : 'bg-gray-50'}
      `}>
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          加载失败
        </h2>
        <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {error || '案例不存在或已被删除'}
        </p>
        <button
          onClick={() => navigate('/agent-cases')}
          className="
            px-6 py-2 rounded-xl
            bg-gradient-to-r from-[#C02C38] to-[#E85D75]
            text-white font-medium
          "
        >
          返回案例列表
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0f0a]' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`
        sticky top-0 z-30 px-4 sm:px-6 py-4
        border-b backdrop-blur-md
        ${isDark 
          ? 'bg-[#0a0f0a]/80 border-[#2a2f2a]' 
          : 'bg-white/80 border-gray-200'
        }
      `}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className={`
                p-2 rounded-lg transition-colors
                ${isDark 
                  ? 'hover:bg-[#2a2f2a] text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-600'
                }
              `}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <h1 className={`
              text-lg font-semibold truncate
              ${isDark ? 'text-white' : 'text-gray-900'}
            `}>
              {caseDetail.title}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 左侧：图片展示 */}
            <div className="space-y-6">
              <ImageCarousel
                images={caseDetail.images.length > 0 ? caseDetail.images : [{
                  id: 'cover',
                  url: caseDetail.coverImage,
                  thumbnailUrl: caseDetail.coverImage,
                  order: 0,
                }]}
                currentIndex={currentImageIndex}
                onIndexChange={setCurrentImageIndex}
              />
            </div>

            {/* 右侧：信息和对话 */}
            <div className="space-y-6">
              {/* 作者信息 */}
              <div className={`
                p-4 rounded-2xl
                ${isDark ? 'bg-[#1a1f1a]' : 'bg-white'}
              `}>
                <div className="flex items-center gap-3">
                  {caseDetail.author.avatar ? (
                    <img
                      src={caseDetail.author.avatar}
                      alt={caseDetail.author.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium
                      ${isDark 
                        ? 'bg-gradient-to-br from-gray-700 to-gray-600 text-gray-300' 
                        : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600'
                      }
                    `}>
                      {caseDetail.author.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {caseDetail.author.name}
                    </h3>
                    <div className={`flex items-center gap-1 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(caseDetail.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 生成过程标签 */}
              <div className={`
                p-4 rounded-2xl
                ${isDark ? 'bg-[#1a1f1a]' : 'bg-white'}
              `}>
                <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  生成过程
                </h3>
                <div className={`
                  max-h-[400px] overflow-y-auto pr-2
                  ${isDark ? 'scrollbar-dark' : 'scrollbar-light'}
                `}>
                  <ConversationPanel messages={caseDetail.conversation} />
                </div>
              </div>

              {/* 操作栏 */}
              <div className={`
                p-4 rounded-2xl
                ${isDark ? 'bg-[#1a1f1a]' : 'bg-white'}
              `}>
                <CaseActions
                  likes={caseDetail.likes}
                  isLiked={isLiked}
                  onLike={handleLike}
                  onShare={handleShare}
                  onViewReplay={handleViewReplay}
                  onCreateSimilar={onCreateSimilar}
                  loading={isCreatingSimilar}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CaseDetailPage;
