import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronDown, Loader2, CheckCircle2, AlertCircle, Sparkles, FileText, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { eventService, type Event as EventServiceEvent } from '@/services/eventService';
import { eventParticipationService } from '@/services/eventParticipationService';
import { eventSubmissionService } from '@/services/eventSubmissionService';

interface SubmitToEventButtonProps {
  content: string;
  title?: string;
  historyItemId?: string;
  onSuccess?: () => void;
  disabled?: boolean;
}

// 内部使用的活动类型
interface EventDisplay {
  id: string;
  title: string;
  description: string;
  endTime: Date;
  thumbnailUrl?: string;
  status: string;
  eventType?: string;
  isActive: boolean;
}

export default function SubmitToEventButton({
  content,
  title,
  historyItemId,
  onSuccess,
  disabled = false,
}: SubmitToEventButtonProps) {
  const { isDark } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<EventDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [participationStatus, setParticipationStatus] = useState<Record<string, { isParticipated: boolean; status?: string; participationId?: string }>>({});

  // 加载可参加的活动
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    const loadEvents = async () => {
      setLoading(true);
      try {
        const publishedEvents = await eventService.getPublishedEvents();
        const now = Date.now();

        // 筛选文档型活动
        const documentEvents = publishedEvents.filter(
          (event) => event.eventType === 'document' || !event.eventType
        );

        // 转换数据格式
        const formattedEvents: EventDisplay[] = documentEvents.map(event => {
          const isActive = event.endDate > now && event.status === 'published';
          return {
            id: event.id,
            title: event.title,
            description: event.description,
            endTime: new Date(event.endDate),
            thumbnailUrl: event.imageUrl,
            status: event.status,
            eventType: event.eventType,
            isActive,
          };
        });

        // 排序：先显示进行中的
        formattedEvents.sort((a, b) => {
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          return b.endTime.getTime() - a.endTime.getTime();
        });

        setEvents(formattedEvents);

        // 检查参与状态
        if (user?.id) {
          const statusMap: Record<string, { isParticipated: boolean; status?: string; participationId?: string }> = {};
          for (const event of formattedEvents) {
            const status = await eventParticipationService.checkParticipation(event.id, user.id);
            statusMap[event.id] = status;
          }
          setParticipationStatus(statusMap);
        }
      } catch (error) {
        console.error('加载活动失败:', error);
        toast.error('加载活动列表失败');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [isOpen, isAuthenticated, user?.id]);

  // 处理报名
  const handleRegister = async (eventId: string) => {
    if (!user?.id) {
      toast.error('请先登录');
      return;
    }

    try {
      const result = await eventParticipationService.registerForEvent(eventId, user.id);
      if (result.success) {
        toast.success('报名成功');
        setParticipationStatus((prev) => ({
          ...prev,
          [eventId]: {
            isParticipated: true,
            status: 'registered',
            participationId: result.participationId,
          },
        }));
      } else {
        toast.error(result.error || '报名失败');
      }
    } catch (error) {
      toast.error('报名失败，请重试');
    }
  };

  // 处理提交
  const handleSubmit = async (eventId: string) => {
    if (!user?.id || !content) {
      toast.error('内容不能为空');
      return;
    }

    const status = participationStatus[eventId];
    if (!status?.isParticipated || !status.participationId) {
      toast.error('请先报名参加活动');
      return;
    }

    setSubmitting(eventId);
    try {
      const result = await eventSubmissionService.submitWorkFromAIWriter({
        eventId,
        userId: user.id,
        participationId: status.participationId,
        title: title || 'AI写作作品',
        description: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
        aiWriterContent: content,
        aiWriterHistoryId: historyItemId,
      });

      if (result.success) {
        toast.success('作品提交成功！');
        setIsOpen(false);
        onSuccess?.();
      } else {
        toast.error(result.error || '提交失败');
      }
    } catch (error) {
      toast.error('提交失败，请重试');
    } finally {
      setSubmitting(null);
    }
  };

  // 格式化日期
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return '已结束';
    if (diffDays === 0) return '今天截止';
    if (diffDays === 1) return '明天截止';
    if (diffDays <= 7) return `${diffDays}天后截止`;
    return `${date.getMonth() + 1}月${date.getDate()}日截止`;
  };

  // 未登录状态
  if (!isAuthenticated) {
    return (
      <button
        onClick={() => toast.error('请先登录后再参赛')}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed transition-all"
      >
        <Trophy className="w-4 h-4" />
        <span>一键参赛</span>
      </button>
    );
  }

  return (
    <div className="relative">
      {/* 主按钮 - 玻璃拟态风格 */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || !content}
        whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
        whileTap={disabled ? {} : { scale: 0.98 }}
        className={`
          group relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm
          transition-all duration-300 overflow-hidden
          ${disabled || !content
            ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400'
            : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40'
          }
        `}
      >
        {/* 背景光效 */}
        {!disabled && content && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        )}
        
        <Sparkles className="w-4 h-4 relative z-10" />
        <span className="relative z-10">一键参赛</span>
        <ChevronDown className={`w-4 h-4 relative z-10 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {/* 下拉菜单 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 遮罩层 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* 活动列表面板 */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`
                absolute right-0 top-full mt-3 w-[420px] max-h-[560px] overflow-hidden
                rounded-2xl shadow-2xl z-50
                ${isDark 
                  ? 'bg-gray-900/95 border border-gray-700/50' 
                  : 'bg-white/95 border border-gray-200/50'
                }
                backdrop-blur-xl
              `}
            >
              {/* 头部 - 渐变背景 */}
              <div className={`
                relative px-5 py-4 border-b overflow-hidden
                ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'}
              `}>
                {/* 背景装饰 */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-orange-500/30">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                      选择活动参赛
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      AI写作内容一键提交到文档型活动
                    </p>
                  </div>
                </div>
              </div>

              {/* 活动列表 */}
              <div className="p-3 overflow-y-auto max-h-[400px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-700 border-t-amber-500 animate-spin" />
                      <Sparkles className="w-4 h-4 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">加载活动中...</p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6">
                    <div className={`
                      w-16 h-16 rounded-2xl flex items-center justify-center mb-4
                      ${isDark ? 'bg-gray-800' : 'bg-gray-100'}
                    `}>
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium text-center">
                      暂无可参赛的文档型活动
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
                      AI写作内容适合提交到文档型活动比赛
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {events.map((event, index) => {
                      const status = participationStatus[event.id];
                      const isParticipated = status?.isParticipated;
                      const isSubmitted = status?.status === 'submitted';
                      const isSubmittingEvent = submitting === event.id;

                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`
                            group relative p-4 rounded-xl transition-all duration-300
                            ${isDark 
                              ? 'hover:bg-gray-800/80' 
                              : 'hover:bg-gray-50/80'
                            }
                            ${!event.isActive ? 'opacity-50' : ''}
                          `}
                        >
                          {/* 选中指示器 */}
                          <div className={`
                            absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full
                            transition-all duration-300
                            ${isSubmitted 
                              ? 'bg-green-500' 
                              : isParticipated 
                                ? 'bg-amber-500' 
                                : event.isActive 
                                  ? 'bg-gradient-to-b from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100' 
                                  : 'bg-gray-400'
                            }
                          `} />

                          <div className="flex items-start gap-4 pl-2">
                            {/* 封面图 */}
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                              {event.thumbnailUrl ? (
                                <img
                                  src={event.thumbnailUrl}
                                  alt={event.title}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                              ) : (
                                <div className={`
                                  w-full h-full flex items-center justify-center
                                  ${isDark ? 'bg-gray-800' : 'bg-gradient-to-br from-gray-100 to-gray-200'}
                                `}>
                                  <FileText className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                              
                              {/* 状态遮罩 */}
                              {!event.isActive && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                                  <span className="text-white text-[10px] font-medium px-2 py-1 rounded-full bg-black/40">
                                    已结束
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* 信息 */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                {event.title}
                              </h4>
                              
                              <div className="flex items-center gap-2 mt-1.5">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span className={`
                                  text-xs font-medium
                                  ${event.isActive 
                                    ? new Date(event.endTime).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000
                                      ? 'text-red-500'
                                      : 'text-gray-500 dark:text-gray-400'
                                    : 'text-gray-400'
                                  }
                                `}>
                                  {formatDate(event.endTime)}
                                </span>
                              </div>

                              {/* 标签组 */}
                              <div className="flex items-center gap-1.5 mt-2">
                                {/* 文档类型标签 */}
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                  <FileText className="w-3 h-3" />
                                  文档
                                </span>
                                
                                {/* 状态标签 */}
                                {isSubmitted ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400">
                                    <CheckCircle2 className="w-3 h-3" />
                                    已提交
                                  </span>
                                ) : isParticipated ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <CheckCircle2 className="w-3 h-3" />
                                    已报名
                                  </span>
                                ) : event.isActive && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    进行中
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* 操作按钮 */}
                            <div className="flex-shrink-0 self-center">
                              {isSubmitted ? (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span className="text-xs font-medium">已完成</span>
                                </div>
                              ) : !event.isActive ? (
                                <span className="px-3 py-1.5 text-xs font-medium text-gray-400">
                                  已截止
                                </span>
                              ) : isParticipated ? (
                                <motion.button
                                  onClick={() => handleSubmit(event.id)}
                                  disabled={isSubmittingEvent}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all disabled:opacity-50"
                                >
                                  {isSubmittingEvent ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <>
                                      <span>提交</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </>
                                  )}
                                </motion.button>
                              ) : (
                                <motion.button
                                  onClick={() => handleRegister(event.id)}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className={`
                                    px-4 py-2 rounded-xl text-xs font-semibold transition-all
                                    ${isDark 
                                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700' 
                                      : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm'
                                    }
                                  `}
                                >
                                  立即报名
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 底部 */}
              <div className={`
                px-5 py-3 border-t text-center
                ${isDark ? 'border-gray-700/50 bg-gray-900/50' : 'border-gray-200/50 bg-gray-50/50'}
              `}>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  提交后可在"我的活动"中查看作品评审状态
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
