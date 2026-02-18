import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Medal,
  Award,
  Star,
  Users,
  Bell,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Crown,
  X,
  ChevronRight,
  BarChart3,
  Target,
} from 'lucide-react';
import { workScoringService, WorkScoringData } from '@/services/workScoringService';
import { supabase } from '@/lib/supabase';

// 排名数据接口
interface RankingItem {
  submission_id: string;
  rank: number;
  title: string;
  creator_id: string;
  creator_name: string;
  creator_avatar?: string;
  avg_score: number;
  score_count: number;
  judge_count: number;
  submitted_at: string;
}

interface FinalRankingPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  works: WorkScoringData[];
  isDark: boolean;
  onPublished?: () => void;
  currentUserId?: string;
}

export function FinalRankingPublishModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  works,
  isDark,
  onPublished,
  currentUserId,
}: FinalRankingPublishModalProps) {
  const [step, setStep] = useState<'preview' | 'confirm' | 'publishing' | 'success'>('preview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rankingData, setRankingData] = useState<RankingItem[]>([]);
  const [sendNotification, setSendNotification] = useState(true);
  const [publishedData, setPublishedData] = useState<any>(null);

  // 计算排名数据
  useEffect(() => {
    if (!isOpen) return;

    // 如果已经发布成功或正在确认/发布中，不再重置状态
    if (step === 'success' || step === 'confirm' || step === 'publishing') return;

    const scoredWorks = works
      .filter((w) => w.avgScore !== undefined && w.avgScore > 0 && w.scoreCount > 0)
      .sort((a, b) => {
        const scoreA = a.avgScore || 0;
        const scoreB = b.avgScore || 0;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        return (b.scoreCount || 0) - (a.scoreCount || 0);
      });

    const ranked: RankingItem[] = scoredWorks.map((work, index) => ({
      submission_id: work.id,
      rank: index + 1,
      title: work.title || '未命名作品',
      creator_id: work.userId,
      creator_name: work.creatorName,
      creator_avatar: work.creatorAvatar,
      avg_score: work.avgScore || 0,
      score_count: work.scoreCount || 0,
      judge_count: work.judgeCount || 0,
      submitted_at: work.submittedAt,
    }));

    setRankingData(ranked);
    setStep('preview');
    setError(null);
  }, [isOpen, works]);

  // 统计数据
  const stats = useMemo(() => {
    const scores = rankingData.map((r) => r.avg_score);
    return {
      totalWorks: works.length,
      scoredWorks: rankingData.length,
      unscoredWorks: works.length - rankingData.length,
      avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      maxScore: scores.length > 0 ? Math.max(...scores) : 0,
      minScore: scores.length > 0 ? Math.min(...scores) : 0,
      topScoreGap: scores.length >= 2 ? scores[0] - scores[1] : 0,
    };
  }, [rankingData, works.length]);

  // 获取排名图标
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return null;
    }
  };

  // 获取排名样式
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white';
      default:
        return isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600';
    }
  };

  // 处理发布
  const handlePublish = async () => {
    setIsLoading(true);
    setError(null);
    setStep('publishing');

    try {
      // 使用传入的 currentUserId 或尝试获取当前用户
      let userId = currentUserId;
      
      if (!userId) {
        const { data: userData } = await supabase.auth.getUser();
        userId = userData.user?.id;
      }

      if (!userId) {
        throw new Error('用户未登录，请重新登录后再试');
      }

      // 调用 RPC 发布最终排名
      const { data, error: rpcError } = await supabase.rpc('publish_final_ranking', {
        p_event_id: eventId,
        p_published_by: userId,
      });

      if (rpcError) {
        console.error('RPC Error:', rpcError);
        // 如果是函数不存在错误，给出更友好的提示
        if (rpcError.message?.includes('Could not find the function')) {
          throw new Error('数据库函数未找到，请确保已在 Supabase 控制台执行 SQL 迁移文件');
        }
        throw rpcError;
      }

      const result = data as any;
      if (!result || !result.success) {
        throw new Error(result?.error || '发布失败');
      }

      setPublishedData(result);

      // 如果需要发送通知
      if (sendNotification) {
        try {
          const { data: notifyData, error: notifyError } = await supabase.rpc(
            'notify_ranking_participants',
            {
              p_event_id: eventId,
            }
          );

          if (notifyError) {
            console.warn('通知发送失败:', notifyError);
          }
        } catch (notifyErr) {
          console.warn('通知发送失败:', notifyErr);
        }
      }

      setStep('success');
      onPublished?.();
    } catch (err: any) {
      console.error('Publish Error:', err);
      setError(err.message || '发布失败，请稍后重试');
      setStep('confirm');
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化分数
  const formatScore = (score: number) => score.toFixed(1);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          {/* 头部 */}
          <div
            className={`flex items-center justify-between p-6 border-b ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2
                  className={`text-lg font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  发布最终排名
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {eventTitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'hover:bg-gray-700 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 内容区 */}
          <div className="flex-1 overflow-y-auto p-6">
            {step === 'preview' && (
              <div className="space-y-6">
                {/* 统计概览 */}
                <div className="grid grid-cols-4 gap-4">
                  <div
                    className={`p-4 rounded-xl ${
                      isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      <span
                        className={`text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        平均分
                      </span>
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {formatScore(stats.avgScore)}
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-xl ${
                      isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span
                        className={`text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        最高分
                      </span>
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {formatScore(stats.maxScore)}
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-xl ${
                      isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span
                        className={`text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        已评分
                      </span>
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {stats.scoredWorks}
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-xl ${
                      isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-emerald-500" />
                      <span
                        className={`text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        未评分
                      </span>
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {stats.unscoredWorks}
                    </div>
                  </div>
                </div>

                {/* 排名列表 */}
                <div>
                  <h3
                    className={`text-sm font-medium mb-3 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    最终排名预览
                  </h3>

                  {rankingData.length === 0 ? (
                    <div
                      className={`text-center py-12 rounded-xl ${
                        isDark ? 'bg-gray-700/30' : 'bg-gray-50'
                      }`}
                    >
                      <Trophy
                        className={`w-16 h-16 mx-auto mb-4 ${
                          isDark ? 'text-gray-600' : 'text-gray-300'
                        }`}
                      />
                      <p
                        className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        暂无评分数据
                      </p>
                      <p
                        className={`text-xs mt-2 ${
                          isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      >
                        请确保已有作品被评分后再发布排名
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {rankingData.slice(0, 10).map((item) => (
                        <div
                          key={item.submission_id}
                          className={`flex items-center gap-4 p-4 rounded-xl ${
                            isDark ? 'bg-gray-700/30' : 'bg-gray-50'
                          }`}
                        >
                          {/* 排名 */}
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                              getRankStyle(item.rank)
                            }`}
                          >
                            {getRankIcon(item.rank) || item.rank}
                          </div>

                          {/* 创作者头像 */}
                          {item.creator_avatar ? (
                            <img
                              src={item.creator_avatar}
                              alt={item.creator_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                isDark ? 'bg-gray-600' : 'bg-gray-200'
                              }`}
                            >
                              <Users className="w-5 h-5 text-gray-400" />
                            </div>
                          )}

                          {/* 作品信息 */}
                          <div className="flex-1 min-w-0">
                            <h4
                              className={`font-medium truncate ${
                                isDark ? 'text-white' : 'text-gray-900'
                              }`}
                            >
                              {item.title}
                            </h4>
                            <p
                              className={`text-sm ${
                                isDark ? 'text-gray-400' : 'text-gray-500'
                              }`}
                            >
                              {item.creator_name}
                            </p>
                          </div>

                          {/* 评分信息 */}
                          <div className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span
                                className={`font-bold text-lg ${
                                  item.rank <= 3
                                    ? 'text-yellow-500'
                                    : isDark
                                    ? 'text-white'
                                    : 'text-gray-900'
                                }`}
                              >
                                {formatScore(item.avg_score)}
                              </span>
                            </div>
                            <p
                              className={`text-xs ${
                                isDark ? 'text-gray-400' : 'text-gray-500'
                              }`}
                            >
                              {item.judge_count}人评分
                            </p>
                          </div>
                        </div>
                      ))}

                      {rankingData.length > 10 && (
                        <p
                          className={`text-center text-sm py-2 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          还有 {rankingData.length - 10} 个作品...
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 警告提示 */}
                {stats.unscoredWorks > 0 && (
                  <div
                    className={`flex items-start gap-3 p-4 rounded-xl ${
                      isDark
                        ? 'bg-amber-500/10 border border-amber-500/30'
                        : 'bg-amber-50 border border-amber-200'
                    }`}
                  >
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          isDark ? 'text-amber-400' : 'text-amber-700'
                        }`}
                      >
                        有 {stats.unscoredWorks} 个作品尚未评分
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isDark ? 'text-amber-400/70' : 'text-amber-600'
                        }`}
                      >
                        未评分的作品将不会出现在最终排名中。建议先完成所有评分再发布。
                      </p>
                    </div>
                  </div>
                )}

                {/* 通知选项 */}
                <div
                  className={`flex items-center gap-3 p-4 rounded-xl ${
                    isDark ? 'bg-gray-700/30' : 'bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    id="sendNotification"
                    checked={sendNotification}
                    onChange={(e) => setSendNotification(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
                  />
                  <label
                    htmlFor="sendNotification"
                    className={`flex items-center gap-2 cursor-pointer ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                    <span>发布后立即通知所有参与者</span>
                  </label>
                </div>
              </div>
            )}

            {step === 'confirm' && (
              <div className="text-center py-12">
                <div
                  className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-yellow-500/20' : 'bg-yellow-100'
                  }`}
                >
                  <AlertCircle
                    className={`w-10 h-10 ${
                      isDark ? 'text-yellow-400' : 'text-yellow-600'
                    }`}
                  />
                </div>
                <h3
                  className={`text-xl font-bold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  确认发布最终排名？
                </h3>
                <p
                  className={`text-sm max-w-md mx-auto ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  发布后，所有参与者将能够看到最终排名结果。此操作不可撤销。
                </p>

                {error && (
                  <div
                    className={`mt-6 p-4 rounded-xl ${
                      isDark
                        ? 'bg-red-500/10 border border-red-500/30'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <p className="text-sm text-red-500">{error}</p>
                  </div>
                )}
              </div>
            )}

            {step === 'publishing' && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-red-500 mx-auto mb-4" />
                <h3
                  className={`text-lg font-medium ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  正在发布最终排名...
                </h3>
                <p
                  className={`text-sm mt-2 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {sendNotification ? '正在通知所有参与者...' : '请稍候...'}
                </p>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h3
                  className={`text-xl font-bold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  发布成功！
                </h3>
                <p
                  className={`text-sm max-w-md mx-auto ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  最终排名已发布，{sendNotification && '所有参与者已收到通知。'}
                  参与者现在可以查看完整的排名结果。
                </p>

                {/* 发布统计 */}
                <div className={`mt-6 grid grid-cols-2 gap-3 max-w-md mx-auto`}>
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {publishedData?.ranking_data?.length || 0}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      排名作品数
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {publishedData?.published_works_count || 0}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      已发布作品
                    </div>
                  </div>
                </div>

                {publishedData?.ranking_data && (
                  <div
                    className={`mt-4 p-4 rounded-xl text-left max-w-md mx-auto ${
                      isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}
                  >
                    <h4
                      className={`text-sm font-medium mb-3 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      TOP 3 排名
                    </h4>
                    <div className="space-y-2">
                      {(publishedData.ranking_data as RankingItem[])
                        .slice(0, 3)
                        .map((item) => (
                          <div key={item.submission_id} className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                                getRankStyle(item.rank)
                              }`}
                            >
                              {item.rank}
                            </span>
                            <span
                              className={`flex-1 text-sm truncate ${
                                isDark ? 'text-gray-300' : 'text-gray-700'
                              }`}
                            >
                              {item.title}
                            </span>
                            <span className="text-sm font-medium text-yellow-500">
                              {formatScore(item.avg_score)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div
            className={`flex items-center justify-end gap-3 p-6 border-t ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            {step === 'preview' && (
              <>
                <button
                  onClick={onClose}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  取消
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  disabled={rankingData.length === 0}
                  className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                    rankingData.length === 0
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  } ${
                    isDark
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  确认发布
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {step === 'confirm' && (
              <>
                <button
                  onClick={() => setStep('preview')}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  返回预览
                </button>
                <button
                  onClick={handlePublish}
                  disabled={isLoading}
                  className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                    isDark
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  确认发布
                </button>
              </>
            )}

            {step === 'success' && (
              <button
                onClick={onClose}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isDark
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                完成
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default FinalRankingPublishModal;
