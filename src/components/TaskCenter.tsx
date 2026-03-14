import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import taskService, { Task } from '@/services/taskService';
import pointsService from '@/services/pointsService';
import { CheckCircle, Clock, Trophy, Gift, Target, Calendar, Star } from 'lucide-react';

type TaskType = 'all' | 'daily' | 'weekly' | 'monthly' | 'event' | 'achievement';

interface TaskWithProgress extends Task {
  userProgress: number;
  isCompleted: boolean;
  completedAt?: number;
}

const TaskCenter: React.FC = () => {
  const { isDark } = useTheme();
  const [selectedType, setSelectedType] = useState<TaskType>('all');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskWithProgress[]>([]);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const userId = 'current-user'; // 实际项目中应从认证上下文获取

  // 加载任务列表
  const loadTasks = useCallback(() => {
    try {
      setIsLoading(true);
      const allTasks = taskService.getAllTasks();
      const userProgressList = taskService.getTaskProgress(userId);

      const tasksWithProgress: TaskWithProgress[] = allTasks.map(task => {
        const progress = userProgressList.find(p => p.taskId === task.id);
        const userProgress = progress?.progress || 0;
        const isCompleted = userProgress >= task.requirements.count;

        return {
          ...task,
          userProgress,
          isCompleted,
          completedAt: progress?.completedAt
        };
      });

      setTasks(tasksWithProgress);
      setTotalPoints(pointsService.getCurrentPoints());
      setCompletedCount(tasksWithProgress.filter(t => t.isCompleted).length);
    } catch (error) {
      console.error('加载任务失败:', error);
      toast.error('加载任务失败');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 初始加载
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // 监听积分更新事件
  useEffect(() => {
    const handlePointsUpdate = () => {
      setTotalPoints(pointsService.getCurrentPoints());
    };

    window.addEventListener('pointsUpdated', handlePointsUpdate);
    return () => window.removeEventListener('pointsUpdated', handlePointsUpdate);
  }, []);

  // 过滤任务
  const filteredTasks = tasks.filter(task => {
    return selectedType === 'all' || task.type === selectedType;
  });

  // 处理任务完成
  const handleCompleteTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task || task.isCompleted) return;

      // 更新任务进度到完成
      taskService.updateTaskProgress(userId, taskId, task.requirements.count);

      // 重新加载任务列表
      loadTasks();

      // 显示成功消息
      toast.success(
        <div>
          <div className="font-bold">🎉 任务完成！</div>
          <div>{task.title}</div>
          <div className="text-yellow-400">+{task.reward.points} 积分</div>
          {task.reward.badge && (
            <div className="text-purple-400">获得徽章：{task.reward.badge}</div>
          )}
        </div>
      );

      // 触发积分更新事件
      window.dispatchEvent(new CustomEvent('pointsUpdated', { 
        detail: { 
          newBalance: pointsService.getCurrentPoints(),
          change: task.reward.points,
          type: 'earned'
        }
      }));
    } catch (error: any) {
      console.error('完成任务失败:', error);
      toast.error(error.message || '完成任务失败');
    }
  };

  // 模拟任务进度增加（用于测试）
  const handleProgressTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task || task.isCompleted) return;

      const newProgress = Math.min(task.userProgress + 1, task.requirements.count);
      taskService.updateTaskProgress(userId, taskId, newProgress);

      // 重新加载任务列表
      loadTasks();

      if (newProgress >= task.requirements.count) {
        toast.success(
          <div>
            <div className="font-bold">🎉 任务完成！</div>
            <div>{task.title}</div>
            <div className="text-yellow-400">+{task.reward.points} 积分</div>
          </div>
        );

        // 触发积分更新事件
        window.dispatchEvent(new CustomEvent('pointsUpdated', { 
          detail: { 
            newBalance: pointsService.getCurrentPoints(),
            change: task.reward.points,
            type: 'earned'
          }
        }));
      } else {
        toast.info(
          <div>
            <div>任务进度更新</div>
            <div>{task.title}</div>
            <div>{newProgress} / {task.requirements.count}</div>
          </div>
        );
      }
    } catch (error: any) {
      console.error('更新任务进度失败:', error);
      toast.error(error.message || '更新任务进度失败');
    }
  };

  // 切换任务展开状态
  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  // 获取任务类型图标
  const getTaskTypeIcon = (type: Task['type']) => {
    switch (type) {
      case 'daily':
        return <Calendar className="w-4 h-4" />;
      case 'weekly':
        return <Clock className="w-4 h-4" />;
      case 'monthly':
        return <Target className="w-4 h-4" />;
      case 'event':
        return <Star className="w-4 h-4" />;
      case 'achievement':
        return <Trophy className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  // 获取任务类型标签
  const getTaskTypeLabel = (type: Task['type']) => {
    switch (type) {
      case 'daily':
        return '每日';
      case 'weekly':
        return '每周';
      case 'monthly':
        return '每月';
      case 'event':
        return '活动';
      case 'achievement':
        return '成就';
      default:
        return '其他';
    }
  };

  // 获取任务类型颜色
  const getTaskTypeColor = (type: Task['type']) => {
    switch (type) {
      case 'daily':
        return 'bg-blue-500';
      case 'weekly':
        return 'bg-purple-500';
      case 'monthly':
        return 'bg-orange-500';
      case 'event':
        return 'bg-pink-500';
      case 'achievement':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  // 格式化日期
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 计算剩余时间
  const getRemainingTime = (endDate?: number) => {
    if (!endDate) return null;
    const now = Date.now();
    const diff = endDate - now;
    if (diff <= 0) return '已过期';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `剩余 ${days} 天`;
    } else {
      return `剩余 ${hours} 小时`;
    }
  };

  return (
    <div className={`min-h-screen p-4 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* 头部统计 */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">任务中心</h1>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                完成任务获取积分奖励
              </p>
            </div>
            <div className="flex gap-4">
              <div className={`px-4 py-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>当前积分</div>
                <div className="text-2xl font-bold text-yellow-500">{totalPoints}</div>
              </div>
              <div className={`px-4 py-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>已完成</div>
                <div className="text-2xl font-bold text-green-500">{completedCount}/{tasks.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 任务类型筛选 */}
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { value: 'all', label: '全部任务' },
            { value: 'daily', label: '每日任务' },
            { value: 'weekly', label: '每周任务' },
            { value: 'monthly', label: '每月任务' },
            { value: 'event', label: '活动任务' },
            { value: 'achievement', label: '成就任务' }
          ].map(type => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value as TaskType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedType === type.value 
                ? isDark ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                : isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} shadow-sm`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* 加载状态 */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-red-500' : 'border-red-600'}`}></div>
          </div>
        )}

        {/* 任务列表 */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`rounded-xl overflow-hidden shadow-lg transition-shadow hover:shadow-xl ${
                    isDark ? 'bg-gray-800' : 'bg-white'
                  } ${task.isCompleted ? 'ring-2 ring-green-500' : ''}`}
                >
                  {/* 任务头部 */}
                  <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white ${getTaskTypeColor(task.type)}`}>
                            {getTaskTypeIcon(task.type)}
                            <span>{getTaskTypeLabel(task.type)}</span>
                          </span>
                          {task.isCompleted && (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500 text-white">
                              <CheckCircle className="w-3 h-3" />
                              已完成
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold">{task.title}</h3>
                      </div>
                    </div>
                  </div>

                  {/* 任务内容 */}
                  <div className="p-4">
                    <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {task.description}
                    </p>

                    {/* 进度条 */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>进度</span>
                        <span className="font-medium">{task.userProgress}/{task.requirements.count}</span>
                      </div>
                      <div className={`w-full rounded-full h-2.5 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(task.userProgress / task.requirements.count) * 100}%` }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          className={`h-2.5 rounded-full transition-all duration-300 ${
                            task.isCompleted 
                              ? 'bg-gradient-to-r from-green-500 to-green-400' 
                              : 'bg-gradient-to-r from-red-500 to-red-400'
                          }`}
                        />
                      </div>
                    </div>

                    {/* 奖励信息 */}
                    <div className={`flex items-center gap-3 p-3 rounded-lg mb-4 ${
                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Trophy className="w-5 h-5" />
                        <span className="font-bold">{task.reward.points}</span>
                        <span className="text-sm">积分</span>
                      </div>
                      {task.reward.badge && (
                        <div className="flex items-center gap-1 text-purple-500">
                          <span className="text-sm">+</span>
                          <span className="text-sm font-medium">{task.reward.badge}</span>
                        </div>
                      )}
                    </div>

                    {/* 截止日期 */}
                    {task.endDate && (
                      <div className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <span className="opacity-70">截止时间: </span>
                        <span>{formatDate(task.endDate)}</span>
                        <span className={`ml-2 text-xs ${
                          getRemainingTime(task.endDate)?.includes('已过期') 
                            ? 'text-red-500' 
                            : 'text-orange-500'
                        }`}>
                          ({getRemainingTime(task.endDate)})
                        </span>
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      {!task.isCompleted ? (
                        <>
                          <button
                            onClick={() => handleProgressTask(task.id)}
                            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              isDark 
                                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20' 
                                : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                            }`}
                          >
                            {task.userProgress > 0 ? '继续任务' : '开始任务'}
                          </button>
                          {/* 测试用：直接完成任务按钮 */}
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              isDark 
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                            }`}
                            title="测试用：直接完成任务"
                          >
                            完成
                          </button>
                        </>
                      ) : (
                        <button
                          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isDark ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
                          } cursor-default`}
                          disabled
                        >
                          <span className="flex items-center justify-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            已完成
                            {task.completedAt && (
                              <span className="text-xs opacity-80">
                                {formatDate(task.completedAt)}
                              </span>
                            )}
                          </span>
                        </button>
                      )}
                      <button
                        onClick={() => toggleTaskExpanded(task.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {expandedTask === task.id ? '收起' : '详情'}
                      </button>
                    </div>

                    {/* 展开的任务详情 */}
                    <AnimatePresence>
                      {expandedTask === task.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                        >
                          <h4 className="font-medium mb-3">任务详情</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>任务ID:</span>
                              <span className="font-mono text-xs">{task.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>任务类型:</span>
                              <span>{getTaskTypeLabel(task.type)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>要求:</span>
                              <span>{task.requirements.count} 次{task.requirements.type === 'create' ? '创作' : task.requirements.type === 'share' ? '分享' : task.requirements.type === 'comment' ? '评论' : '互动'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>奖励:</span>
                              <span className="text-yellow-500">{task.reward.points} 积分</span>
                            </div>
                            {task.reward.badge && (
                              <div className="flex justify-between">
                                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>徽章:</span>
                                <span className="text-purple-500">{task.reward.badge}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>开始时间:</span>
                              <span>{formatDate(task.startDate)}</span>
                            </div>
                            {task.endDate && (
                              <div className="flex justify-between">
                                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>结束时间:</span>
                                <span>{formatDate(task.endDate)}</span>
                              </div>
                            )}
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex justify-between items-start">
                                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>标签:</span>
                                <div className="flex flex-wrap gap-1 justify-end">
                                  {task.tags.map((tag, i) => (
                                    <span 
                                      key={i} 
                                      className={`px-2 py-0.5 rounded text-xs ${
                                        isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                                      }`}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* 无任务提示 */}
        {!isLoading && filteredTasks.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <Target className={`w-10 h-10 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
            <h3 className="text-lg font-medium mb-2">暂无任务</h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              该分类下暂时没有任务，请尝试其他分类
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TaskCenter;
