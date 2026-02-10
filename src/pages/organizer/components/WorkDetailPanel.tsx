import { motion } from 'framer-motion';
import {
  User,
  Clock,
  Star,
  FileText,
  Send,
  Eye,
  EyeOff,
  History,
  ChevronLeft,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { WorkDetail, ScoreRecord } from '@/services/workScoringService';
import { useState, useEffect } from 'react';

interface WorkDetailPanelProps {
  workDetail: WorkDetail | null;
  isLoading: boolean;
  onScoreSubmit: (score: number, comment: string) => Promise<void>;
  onPublish: (publish: boolean) => Promise<void>;
  onViewAuditLog: () => void;
  currentUserId?: string;
  isDark: boolean;
}

export function WorkDetailPanel({
  workDetail,
  isLoading,
  onScoreSubmit,
  onPublish,
  onViewAuditLog,
  currentUserId,
  isDark,
}: WorkDetailPanelProps) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'scores'>('details');

  // 当作品详情变化时，重置评分表单
  useEffect(() => {
    if (workDetail && currentUserId) {
      const myScore = workDetail.scores.find(s => s.judgeId === currentUserId);
      if (myScore) {
        setScore(myScore.score);
        setComment(myScore.comment || '');
      } else {
        setScore(0);
        setComment('');
      }
    }
  }, [workDetail, currentUserId]);

  const handleSubmit = async () => {
    if (score === 0) return;
    setIsSubmitting(true);
    try {
      await onScoreSubmit(score, comment);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async (publish: boolean) => {
    setIsPublishing(true);
    try {
      await onPublish(publish);
    } finally {
      setIsPublishing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 空状态
  if (!workDetail) {
    return (
      <div className={`w-96 flex-shrink-0 border-l ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'} flex items-center justify-center`}>
        <div className="text-center p-8">
          <FileText className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            选择作品查看详情
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            从左侧列表选择一个作品进行评分
          </p>
        </div>
      </div>
    );
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className={`w-96 flex-shrink-0 border-l ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'} flex items-center justify-center`}>
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  const thumbnailUrl = workDetail.files?.[0]?.thumbnailUrl || workDetail.files?.[0]?.url;
  const myScore = workDetail.scores.find(s => s.judgeId === currentUserId);

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`w-96 flex-shrink-0 border-l flex flex-col ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}
    >
      {/* 标签切换 */}
      <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'details'
              ? 'text-red-500'
              : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          作品详情
          {activeTab === 'details' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('scores')}
          className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'scores'
              ? 'text-red-500'
              : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          评分记录 ({workDetail.scores.length})
          {activeTab === 'scores' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"
            />
          )}
        </button>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'details' ? (
          <div className="p-4 space-y-4">
            {/* 作品预览 */}
            <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={workDetail.title}
                  className="w-full aspect-video object-cover"
                />
              ) : (
                <div className="w-full aspect-video flex items-center justify-center">
                  <ImageIcon className={`w-16 h-16 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                </div>
              )}
            </div>

            {/* 作品信息 */}
            <div>
              <h2 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {workDetail.title}
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                {workDetail.description || '暂无描述'}
              </p>
            </div>

            {/* 创作者信息 */}
            <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                {workDetail.creatorAvatar ? (
                  <img
                    src={workDetail.creatorAvatar}
                    alt={workDetail.creatorName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div>
                  <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {workDetail.creatorName}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    创作者
                  </div>
                </div>
              </div>
            </div>

            {/* 提交信息 */}
            <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <Clock className="w-4 h-4" />
              <span>提交于 {formatDate(workDetail.submittedAt)}</span>
            </div>

            {/* 评分统计 */}
            {workDetail.scoreStats.scoreCount > 0 && (
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  评分统计
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-white'}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {workDetail.scoreStats.avgScore.toFixed(1)}
                      </span>
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>平均分</div>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-white'}`}>
                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {workDetail.scoreStats.scoreCount}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>评分次数</div>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-white'}`}>
                    <div className={`text-2xl font-bold text-emerald-500`}>
                      {workDetail.scoreStats.maxScore.toFixed(1)}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>最高分</div>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-white'}`}>
                    <div className={`text-2xl font-bold text-red-500`}>
                      {workDetail.scoreStats.minScore.toFixed(1)}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>最低分</div>
                  </div>
                </div>
              </div>
            )}

            {/* 评分表单 */}
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {myScore ? '更新评分' : '提交评分'}
              </h3>
              
              {/* 分数选择 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>评分 (1-10)</span>
                  <span className={`text-lg font-bold ${score > 0 ? 'text-red-500' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {score > 0 ? score : '-'}
                  </span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => setScore(num)}
                      className={`flex-1 h-8 rounded-md text-sm font-medium transition-all ${
                        num <= score
                          ? 'bg-red-500 text-white'
                          : isDark
                          ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* 评语输入 */}
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="请输入评语（可选）..."
                rows={3}
                className={`w-full p-3 rounded-lg text-sm resize-none border outline-none transition-colors mb-3 ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-red-500'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500'
                }`}
              />

              {/* 提交按钮 */}
              <button
                onClick={handleSubmit}
                disabled={score === 0 || isSubmitting}
                className={`w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                  score === 0 || isSubmitting
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                } ${
                  isDark
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{isSubmitting ? '提交中...' : myScore ? '更新评分' : '提交评分'}</span>
              </button>
            </div>

            {/* 发布操作 */}
            <div className="flex gap-2">
              <button
                onClick={() => handlePublish(!workDetail.isPublished)}
                disabled={isPublishing || workDetail.scores.length === 0}
                className={`flex-1 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                  workDetail.isPublished
                    ? isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                } ${(isPublishing || workDetail.scores.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isPublishing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : workDetail.isPublished ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span>取消发布</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>发布结果</span>
                  </>
                )}
              </button>
              
              <button
                onClick={onViewAuditLog}
                className={`px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <History className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* 评分记录标签 */
          <div className="p-4">
            {workDetail.scores.length === 0 ? (
              <div className="text-center py-8">
                <Star className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  暂无评分记录
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {workDetail.scores.map((scoreRecord) => (
                  <ScoreRecordItem
                    key={scoreRecord.id}
                    record={scoreRecord}
                    isCurrentUser={scoreRecord.judgeId === currentUserId}
                    isDark={isDark}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// 评分记录项组件
function ScoreRecordItem({
  record,
  isCurrentUser,
  isDark,
}: {
  record: ScoreRecord;
  isCurrentUser: boolean;
  isDark: boolean;
}) {
  return (
    <div className={`p-3 rounded-xl border ${
      isCurrentUser
        ? isDark
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-red-50 border-red-200'
        : isDark
        ? 'bg-gray-700/50 border-gray-600'
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {record.judgeAvatar ? (
            <img
              src={record.judgeAvatar}
              alt={record.judgeName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
              <User className="w-4 h-4 text-gray-400" />
            </div>
          )}
          <div>
            <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {record.judgeName || '未知评委'}
              {isCurrentUser && (
                <span className="ml-2 text-xs text-red-500">(我)</span>
              )}
            </div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {new Date(record.createdAt).toLocaleString('zh-CN')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {record.score}
          </span>
        </div>
      </div>
      {record.comment && (
        <p className={`text-sm mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {record.comment}
        </p>
      )}
    </div>
  );
}
