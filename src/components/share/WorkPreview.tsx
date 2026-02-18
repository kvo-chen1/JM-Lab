import { useTheme } from '@/hooks/useTheme';
import { Image, Eye, Heart, FileText, Video, FileAudio, MoreHorizontal } from 'lucide-react';
import type { Work } from '@/types/work';

interface WorkPreviewProps {
  work: Work;
  compact?: boolean;
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

export function WorkPreview({ work, compact = false }: WorkPreviewProps) {
  const { isDark } = useTheme();
  const MediaIcon = mediaTypeIcons[work.type] || Image;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-xl border ${
          isDark
            ? 'bg-gray-700/50 border-gray-600'
            : 'bg-gray-50 border-gray-200'
        }`}
      >
        {/* 缩略图 */}
        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          {work.thumbnail ? (
            <img
              src={work.thumbnail}
              alt={work.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center ${
                isDark ? 'bg-gray-600' : 'bg-gray-200'
              }`}
            >
              <MediaIcon
                className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              />
            </div>
          )}
          {/* 类型标签 */}
          <div
            className={`absolute bottom-0 left-0 right-0 px-1 py-0.5 text-[10px] text-center text-white ${
              work.type === 'video'
                ? 'bg-purple-500'
                : work.type === 'audio'
                ? 'bg-blue-500'
                : 'bg-gray-800/80'
            }`}
          >
            {mediaTypeLabels[work.type]}
          </div>
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <h4
            className={`font-medium truncate ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            {work.title}
          </h4>
          <div
            className={`flex items-center gap-3 mt-1 text-xs ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {work.views}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {work.likes}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl overflow-hidden border ${
        isDark
          ? 'bg-gray-700/50 border-gray-600'
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      {/* 缩略图 */}
      <div className="relative aspect-video">
        {work.thumbnail ? (
          <img
            src={work.thumbnail}
            alt={work.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center ${
              isDark ? 'bg-gray-600' : 'bg-gray-200'
            }`}
          >
            <MediaIcon
              className={`w-12 h-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
            />
          </div>
        )}
        {/* 类型标签 */}
        <div
          className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-medium text-white ${
            work.type === 'video'
              ? 'bg-purple-500'
              : work.type === 'audio'
              ? 'bg-blue-500'
              : 'bg-gray-800/80'
          }`}
        >
          {mediaTypeLabels[work.type]}
        </div>
        {/* 状态标签 */}
        <div
          className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-medium ${
            work.status === '已发布'
              ? 'bg-green-500 text-white'
              : 'bg-yellow-500 text-white'
          }`}
        >
          {work.status}
        </div>
      </div>

      {/* 信息 */}
      <div className="p-4">
        <h4
          className={`font-semibold text-lg ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          {work.title}
        </h4>
        {work.description && (
          <p
            className={`mt-2 text-sm line-clamp-2 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            {work.description}
          </p>
        )}
        <div
          className={`flex items-center gap-4 mt-3 text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {work.views} 浏览
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            {work.likes} 点赞
          </span>
        </div>
      </div>
    </div>
  );
}

export default WorkPreview;
