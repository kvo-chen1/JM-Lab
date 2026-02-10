import { motion } from 'framer-motion';
import {
  User,
  Clock,
  Star,
  CheckCircle2,
  Circle,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import { WorkScoringData } from '@/services/workScoringService';

interface WorkCardProps {
  work: WorkScoringData;
  isSelected: boolean;
  isChecked: boolean;
  isBatchMode: boolean;
  onSelect: () => void;
  onToggleCheck: () => void;
  viewMode: 'list' | 'grid';
  index: number;
  isDark: boolean;
}

export function WorkCard({
  work,
  isSelected,
  isChecked,
  isBatchMode,
  onSelect,
  onToggleCheck,
  viewMode,
  index,
  isDark,
}: WorkCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreStatus = () => {
    if (work.isPublished) {
      return {
        label: '已发布',
        color: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
        icon: CheckCircle2,
      };
    }
    if (work.scoreCount > 0) {
      return {
        label: `已评分 (${work.scoreCount})`,
        color: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
        icon: Star,
      };
    }
    return {
      label: '未评分',
      color: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
      icon: Circle,
    };
  };

  const scoreStatus = getScoreStatus();
  const StatusIcon = scoreStatus.icon;

  const thumbnailUrl = work.files?.[0]?.thumbnailUrl || work.files?.[0]?.url;

  if (viewMode === 'grid') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => isBatchMode ? onToggleCheck() : onSelect()}
        className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border-2 ${
          isSelected
            ? 'border-red-500 shadow-lg shadow-red-500/20'
            : isDark
            ? 'border-gray-700 hover:border-gray-600'
            : 'border-gray-200 hover:border-gray-300'
        } ${isDark ? 'bg-gray-800' : 'bg-white'}`}
      >
        {/* 批量选择复选框 */}
        {isBatchMode && (
          <div className="absolute top-2 left-2 z-10">
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                isChecked
                  ? 'bg-red-500 border-red-500'
                  : isDark
                  ? 'border-gray-500 bg-gray-800/80'
                  : 'border-gray-300 bg-white/80'
              }`}
            >
              {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </div>
          </div>
        )}

        {/* 缩略图 */}
        <div className={`aspect-video relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={work.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            </div>
          )}
          
          {/* 文件数量标记 */}
          {work.files && work.files.length > 1 && (
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/60 text-white text-xs">
              +{work.files.length - 1}
            </div>
          )}
        </div>

        {/* 内容区 */}
        <div className="p-3">
          <h3 className={`font-medium text-sm line-clamp-1 mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {work.title}
          </h3>

          {/* 创作者信息 */}
          <div className="flex items-center gap-2 mb-2">
            {work.creatorAvatar ? (
              <img
                src={work.creatorAvatar}
                alt={work.creatorName}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <User className="w-3 h-3 text-gray-400" />
              </div>
            )}
            <span className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {work.creatorName}
            </span>
          </div>

          {/* 底部信息 */}
          <div className="flex items-center justify-between">
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {formatDate(work.submittedAt)}
            </span>
            
            {/* 评分状态 */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${scoreStatus.color}`}>
              <StatusIcon className="w-3 h-3" />
              <span>{scoreStatus.label}</span>
            </div>
          </div>

          {/* 平均分显示 */}
          {work.avgScore !== undefined && work.avgScore > 0 && (
            <div className="mt-2 flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {work.avgScore.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // 列表视图
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => isBatchMode ? onToggleCheck() : onSelect()}
      className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
        isSelected
          ? isDark
            ? 'bg-red-500/10 border-red-500/50'
            : 'bg-red-50 border-red-200'
          : isDark
          ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* 批量选择复选框 */}
      {isBatchMode && (
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            isChecked
              ? 'bg-red-500 border-red-500'
              : isDark
              ? 'border-gray-500'
              : 'border-gray-300'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCheck();
          }}
        >
          {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
        </div>
      )}

      {/* 缩略图 */}
      <div className={`w-16 h-16 rounded-lg flex-shrink-0 overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={work.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className={`w-6 h-6 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          </div>
        )}
      </div>

      {/* 内容区 */}
      <div className="flex-1 min-w-0">
        <h3 className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {work.title}
        </h3>
        
        <div className="flex items-center gap-3 mt-1">
          {/* 创作者 */}
          <div className="flex items-center gap-1.5">
            {work.creatorAvatar ? (
              <img
                src={work.creatorAvatar}
                alt={work.creatorName}
                className="w-4 h-4 rounded-full object-cover"
              />
            ) : (
              <User className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            )}
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {work.creatorName}
            </span>
          </div>

          {/* 提交时间 */}
          <div className="flex items-center gap-1">
            <Clock className={`w-3.5 h-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {formatDate(work.submittedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* 评分信息 */}
      <div className="flex items-center gap-4">
        {/* 平均分 */}
        {work.avgScore !== undefined && work.avgScore > 0 ? (
          <div className="flex items-center gap-1.5">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {work.avgScore.toFixed(1)}
            </span>
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              /10
            </span>
          </div>
        ) : (
          <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            未评分
          </div>
        )}

        {/* 状态标签 */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border ${scoreStatus.color}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span>{scoreStatus.label}</span>
        </div>
      </div>
    </motion.div>
  );
}
