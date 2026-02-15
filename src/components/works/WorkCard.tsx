import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { SubmissionWithStats } from '@/services/eventWorkService';
import { UserInteraction } from '@/types';
import { Heart, ThumbsUp, Star, Image, Video, FileAudio, FileText, MoreHorizontal } from 'lucide-react';
import { useState, useRef } from 'react';

interface WorkCardProps {
  submission: SubmissionWithStats;
  interaction?: UserInteraction;
  isSelected?: boolean;
  onClick?: () => void;
  index?: number;
}

const mediaTypeIcons = {
  image: Image,
  video: Video,
  audio: FileAudio,
  document: FileText,
  other: MoreHorizontal,
};

const mediaTypeLabels = {
  image: '图片',
  video: '视频',
  audio: '音频',
  document: '文档',
  other: '其他',
};

export function WorkCard({ submission, interaction, isSelected = false, onClick, index = 0 }: WorkCardProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const MediaIcon = mediaTypeIcons[submission.mediaType] || Image;
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isVideoError, setIsVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 获取封面图或视频URL（支持 work_thumbnail 和 files 中的 URL）
  const coverImage = submission.coverImage || submission.workThumbnail ||
    (submission.files && submission.files.length > 0 ? submission.files[0].url : null);
  
  // 调试日志
  console.log('[WorkCard] 视频URL检查:', {
    coverImage: coverImage,
    workThumbnail: submission.workThumbnail,
    files: submission.files,
    mediaType: submission.mediaType
  });
  
  // 判断是否是视频
  const isVideo = submission.mediaType === 'video' || 
    (coverImage && (coverImage.endsWith('.mp4') || coverImage.endsWith('.webm') || coverImage.endsWith('.mov')));

  // 调试日志
  console.log('[WorkCard] 作品信息:', {
    title: submission.title,
    mediaType: submission.mediaType,
    coverImage: coverImage,
    isVideo: isVideo,
    files: submission.files
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300
        ${isSelected 
          ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/20' 
          : 'hover:shadow-xl'
        }
        ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        border
      `}
    >
      {/* 封面图/视频区域 */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
        {coverImage ? (
          isVideo ? (
            // 视频类型
            <>
              <video
                ref={videoRef}
                src={coverImage}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
                onLoadedData={() => setIsVideoLoaded(true)}
                onError={() => setIsVideoError(true)}
              />
              {!isVideoLoaded && !isVideoError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {isVideoError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <MediaIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" />
                </div>
              )}
            </>
          ) : (
            // 图片类型
            <img
              src={coverImage}
              alt={submission.title}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              loading="lazy"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MediaIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" />
          </div>
        )}

        {/* 媒体类型标签 */}
        <div className="absolute top-3 left-3">
          <span className={`
            px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm
            ${isDark 
              ? 'bg-gray-900/70 text-gray-200' 
              : 'bg-white/70 text-gray-700'
            }
          `}>
            {mediaTypeLabels[submission.mediaType]}
          </span>
        </div>

        {/* 评分标签 */}
        {submission.avgRating > 0 && (
          <div className="absolute top-3 right-3">
            <span className={`
              px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm flex items-center gap-1
              ${isDark 
                ? 'bg-amber-500/90 text-white' 
                : 'bg-amber-400 text-white'
              }
            `}>
              <Star className="w-3 h-3 fill-current" />
              {submission.avgRating.toFixed(1)}
            </span>
          </div>
        )}

        {/* 悬停遮罩 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-4"
        >
          <div className="flex items-center gap-4 text-white">
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-4 h-4" />
              <span className="text-sm font-medium">{submission.voteCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className={`w-4 h-4 ${interaction?.hasLiked ? 'fill-current text-red-400' : ''}`} />
              <span className="text-sm font-medium">{submission.likeCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              <span className="text-sm font-medium">{submission.ratingCount}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        {/* 标题 */}
        <h3 className={`
          font-semibold text-base mb-2 line-clamp-2
          ${isDark ? 'text-gray-100' : 'text-gray-900'}
        `}>
          {submission.title}
        </h3>

        {/* 作者信息 */}
        <div className="flex items-center gap-2 mb-3">
          {submission.creatorAvatar ? (
            <img 
              src={submission.creatorAvatar} 
              alt={submission.creatorName || '用户'}
              className="w-6 h-6 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-primary-400 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                if (submission.userId) {
                  navigate(`/author/${submission.userId}`);
                }
              }}
            />
          ) : (
            <div 
              className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:ring-2 hover:ring-primary-400 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                if (submission.userId) {
                  navigate(`/author/${submission.userId}`);
                }
              }}
            >
              {submission.creatorName?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <span 
            className={`text-sm truncate cursor-pointer hover:text-primary-500 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            onClick={(e) => {
              e.stopPropagation();
              if (submission.userId) {
                navigate(`/author/${submission.userId}`);
              }
            }}
          >
            {submission.creatorName || '匿名用户'}
          </span>
        </div>

        {/* 统计信息 */}
        <div className={`flex items-center justify-between text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ThumbsUp className={`w-3.5 h-3.5 ${interaction?.hasVoted ? 'text-primary-500' : ''}`} />
              {submission.voteCount}
            </span>
            <span className="flex items-center gap-1">
              <Heart className={`w-3.5 h-3.5 ${interaction?.hasLiked ? 'text-red-500 fill-current' : ''}`} />
              {submission.likeCount}
            </span>
          </div>
          <span>
            {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : ''}
          </span>
        </div>
      </div>

      {/* 选中指示器 */}
      {isSelected && (
        <motion.div
          layoutId="selectedIndicator"
          className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-500"
        />
      )}
    </motion.div>
  );
}

export default WorkCard;
