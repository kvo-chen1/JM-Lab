import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import type { ParticipationDetail } from '@/services/eventParticipationService';
import { TianjinButton } from '@/components/TianjinStyleComponents';

interface ActivityCardProps {
  participation: ParticipationDetail;
  onCancel?: (participationId: string) => void;
  onRefresh?: () => void;
}

const steps = [
  { title: '报名成功', icon: 'fa-check-circle', description: '您已成功报名活动' },
  { title: '作品提交', icon: 'fa-upload', description: '提交您的作品' },
  { title: '评审中', icon: 'fa-search', description: '专家评审中' },
  { title: '结果公布', icon: 'fa-trophy', description: '查看评审结果' },
];

export const ActivityCard: React.FC<ActivityCardProps> = ({
  participation,
  onCancel,
  onRefresh,
}) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);


  // 跳转到最终排名页面
  const goToFinalRanking = () => {
    navigate(`/ranking/${participation.eventId}`);
  };

  const getStepStatus = (currentStep: number, stepIndex: number) => {
    if (currentStep > stepIndex) return 'completed';
    if (currentStep === stepIndex) return 'current';
    return 'pending';
  };

  const getStatusConfig = (status: string, isEventEnded: boolean) => {
    // 如果活动已结束，显示已结束状态
    if (isEventEnded && status !== 'awarded') {
      return { label: '已结束', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-700' };
    }
    
    const configs: Record<string, { label: string; color: string; bgColor: string }> = {
      registered: { label: '已报名', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
      submitted: { label: '已提交', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
      reviewing: { label: '评审中', color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
      completed: { label: '已结束', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-700' },
      awarded: { label: '已获奖', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
      cancelled: { label: '已取消', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
    };
    return configs[status] || { label: '未知', color: 'text-gray-600', bgColor: 'bg-gray-100' };
  };

  const getTypeLabel = (type: string) => {
    return type === 'online' ? '线上' : '线下';
  };

  const getTypeColor = (type: string) => {
    return type === 'online'
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
  };

  const handleCancel = () => {
    if (window.confirm('确定要取消报名吗？取消后需要重新报名。')) {
      onCancel?.(participation.id);
    }
  };

  const handleSubmitWork = () => {
    navigate(`/create?eventId=${participation.eventId}&participationId=${participation.id}`);
  };

  const handleViewDetails = () => {
    // 只存储 eventId 到 sessionStorage，然后跳转到津脉作品页面
    sessionStorage.setItem('openEventModal', participation.eventId);
    navigate('/cultural-events');
  };

  // 判断活动是否已结束
  const isEventEnded = new Date(participation.event.endTime) < new Date();
  
  const statusConfig = getStatusConfig(participation.participationStatus, isEventEnded);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl shadow-sm overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} transition-shadow hover:shadow-md`}
    >
      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左侧：活动信息 */}
          <div className="flex-1">
            {/* 标题和标签 */}
            <div className="flex flex-wrap items-start gap-2 mb-3">
              <span className={`px-2 py-0.5 text-xs rounded-full ${getTypeColor(participation.event.type)}`}>
                {getTypeLabel(participation.event.type)}
              </span>
              <span className={`px-2 py-0.5 text-xs rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              {participation.award && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                  <i className="fas fa-trophy mr-1"></i>
                  {participation.award}
                </span>
              )}
            </div>

            {/* 活动标题 */}
            <h3
              className="text-xl font-bold mb-2 hover:text-red-600 cursor-pointer transition-colors"
              onClick={handleViewDetails}
            >
              {participation.event.title}
            </h3>

            {/* 活动描述 */}
            <p className={`text-sm mb-4 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {participation.event.description}
            </p>

            {/* 活动信息 */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <i className="far fa-calendar"></i>
                {new Date(participation.event.startTime).toLocaleDateString('zh-CN')} -
                {new Date(participation.event.endTime).toLocaleDateString('zh-CN')}
              </span>
              <span className="flex items-center gap-1">
                <i className="far fa-user"></i>
                {participation.event.participants} 人参与
              </span>
              {participation.event.location && (
                <span className="flex items-center gap-1">
                  <i className="fas fa-map-marker-alt"></i>
                  {participation.event.location}
                </span>
              )}
            </div>

            {/* 进度条 */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-2">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>参与进度</span>
                <span className="font-medium">{isEventEnded ? 100 : participation.progress}%</span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${isEventEnded ? 100 : participation.progress}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full rounded-full ${isEventEnded ? 'bg-gradient-to-r from-gray-500 to-gray-400' : 'bg-gradient-to-r from-red-500 to-red-400'}`}
                />
              </div>
            </div>

            {/* 步骤指示器 */}
            <div className="relative">
              <div className="flex justify-between">
                {steps.map((step, idx) => {
                  // 如果活动已结束，所有步骤都显示为已完成
                  const stepStatus = isEventEnded ? 'completed' : getStepStatus(participation.currentStep, idx + 1);
                  const isResultStep = idx === 3; // 结果公布步骤
                  const canViewResult = isResultStep && (stepStatus === 'completed' || stepStatus === 'current');
                  
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 relative">
                      {/* 连接线 */}
                      {idx < steps.length - 1 && (
                        <div
                          className={`absolute top-4 left-1/2 w-full h-0.5 ${
                            stepStatus === 'completed'
                              ? isEventEnded ? 'bg-gray-400' : 'bg-red-500'
                              : isDark
                              ? 'bg-gray-700'
                              : 'bg-gray-200'
                          }`}
                          style={{ transform: 'translateX(50%)' }}
                        />
                      )}
                      {/* 步骤图标 */}
                      <button
                        onClick={() => canViewResult && goToFinalRanking()}
                        disabled={!canViewResult}
                        className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                          stepStatus === 'completed'
                            ? isEventEnded ? 'bg-gray-500 text-white' : 'bg-red-500 text-white'
                            : stepStatus === 'current'
                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 ring-2 ring-red-500'
                            : isDark
                            ? 'bg-gray-700 text-gray-500'
                            : 'bg-gray-100 text-gray-400'
                        } ${canViewResult ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
                      >
                        <i className={`fas ${step.icon} text-xs`}></i>
                      </button>
                      {/* 步骤标题 */}
                      <button
                        onClick={() => canViewResult && goToFinalRanking()}
                        disabled={!canViewResult}
                        className={`text-xs mt-2 font-medium transition-colors ${
                          stepStatus === 'current'
                            ? 'text-red-600 dark:text-red-400'
                            : stepStatus === 'completed'
                            ? 'text-gray-700 dark:text-gray-300'
                            : isDark
                            ? 'text-gray-500'
                            : 'text-gray-400'
                        } ${canViewResult ? 'cursor-pointer hover:text-red-500' : 'cursor-default'}`}
                      >
                        {step.title}
                        {canViewResult && <span className="block text-[10px] opacity-70">(点击查看)</span>}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 右侧：操作区 */}
          <div className="lg:w-64 flex flex-col gap-3 justify-center lg:border-l lg:pl-6 lg:border-gray-100 dark:lg:border-gray-700">
            {/* 根据状态显示不同操作 */}
            {participation.participationStatus === 'registered' && (
              <TianjinButton onClick={handleSubmitWork} className="w-full justify-center">
                <i className="fas fa-upload mr-2"></i>
                提交作品
              </TianjinButton>
            )}

            {/* 注意：'submitted' 不是有效的 ParticipationStatus，使用 'reviewing' 替代 */}
            {participation.participationStatus === 'reviewing' && participation.submittedWorkId && (
              <div className={`p-4 rounded-lg text-center ${isEventEnded ? (isDark ? 'bg-gray-900/20' : 'bg-gray-50') : (isDark ? 'bg-purple-900/20' : 'bg-purple-50')}`}>
                <i className={`fas fa-check-circle ${isEventEnded ? 'text-gray-500' : 'text-purple-500'} text-2xl mb-2`}></i>
                <p className={`text-sm font-medium ${isEventEnded ? (isDark ? 'text-gray-400' : 'text-gray-600') : 'text-purple-700 dark:text-purple-400'}`}>
                  {isEventEnded ? '活动已结束' : '作品已提交'}
                </p>
                <p className={`text-xs mt-1 ${isEventEnded ? (isDark ? 'text-gray-500' : 'text-gray-400') : 'text-purple-600 dark:text-purple-500'}`}>
                  {isEventEnded ? '等待结果公布' : '等待评审中...'}
                </p>
              </div>
            )}

            {participation.participationStatus === 'reviewing' && (
              <div className={`p-4 rounded-lg text-center ${isEventEnded ? (isDark ? 'bg-gray-900/20' : 'bg-gray-50') : (isDark ? 'bg-indigo-900/20' : 'bg-indigo-50')}`}>
                <i className={`fas ${isEventEnded ? 'fa-clock' : 'fa-search'} ${isEventEnded ? 'text-gray-500' : 'text-indigo-500'} text-2xl mb-2`}></i>
                <p className={`text-sm font-medium ${isEventEnded ? (isDark ? 'text-gray-400' : 'text-gray-600') : 'text-indigo-700 dark:text-indigo-400'}`}>
                  {isEventEnded ? '活动已结束' : '评审进行中'}
                </p>
                <p className={`text-xs mt-1 ${isEventEnded ? (isDark ? 'text-gray-500' : 'text-gray-400') : 'text-indigo-600 dark:text-indigo-500'}`}>
                  {isEventEnded ? '等待结果公布' : '专家正在评审...'}
                </p>
              </div>
            )}

            {participation.participationStatus === 'awarded' && (
              <div className={`p-4 rounded-lg text-center border-2 border-yellow-200 dark:border-yellow-800 ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
                <i className="fas fa-trophy text-yellow-500 text-3xl mb-2"></i>
                <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{participation.award}</p>
                {participation.ranking && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-500">第 {participation.ranking} 名</p>
                )}
              </div>
            )}

            {/* 通用操作按钮 */}
            <button
              onClick={handleViewDetails}
              className={`w-full py-2.5 px-4 rounded-lg border transition-colors text-sm font-medium ${
                isDark
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              活动详情
            </button>

            {/* 展开/收起详情 */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`w-full py-2 px-4 rounded-lg text-xs transition-colors ${
                isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {isExpanded ? '收起详情' : '查看更多'}
              <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} ml-1`}></i>
            </button>

            {/* 取消报名 */}
            {participation.participationStatus === 'registered' && (
              <button
                onClick={handleCancel}
                className={`text-xs text-center py-2 transition-colors ${
                  isDark ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'
                }`}
              >
                取消报名
              </button>
            )}
          </div>
        </div>

        {/* 展开的详情区域 */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mt-6 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 报名信息 */}
              <div>
                <h4 className="text-sm font-semibold mb-3">报名信息</h4>
                <div className={`text-sm space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p>报名时间: {new Date(participation.registrationDate).toLocaleString('zh-CN')}</p>
                  <p>当前状态: {statusConfig.label}</p>
                  <p>参与进度: {participation.progress}%</p>
                </div>
              </div>

              {/* 提交信息 */}
              {participation.submission && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">提交信息</h4>
                  <div className={`text-sm space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p>作品标题: {participation.submission.title}</p>
                    <p>提交状态: {participation.submission.status}</p>
                    {participation.submissionDate && (
                      <p>提交时间: {new Date(participation.submissionDate).toLocaleString('zh-CN')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* 评审信息 */}
              {participation.submission?.score && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">评审结果</h4>
                  <div className={`text-sm space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p>得分: <span className="text-red-500 font-bold">{participation.submission.score}</span></p>
                    {participation.submission.reviewNotes && (
                      <p>评语: {participation.submission.reviewNotes}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>


    </motion.div>
  );
};

export default ActivityCard;
