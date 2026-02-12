import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Trophy, FileCheck, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Event } from '@/types';

interface ExtendedEvent extends Event {
  coverImage?: string;
  currentParticipants?: number;
  submissionRequirements?: string[];
  rules?: string[];
  prizes?: string[];
}

interface SubmitSidebarLeftProps {
  event: ExtendedEvent | null;
}

const containerVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export function SubmitSidebarLeft({ event }: SubmitSidebarLeftProps) {
  if (!event) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-2xl h-48" />
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-2xl h-32" />
      </div>
    );
  }

  const getEventStatus = () => {
    if (!event.endTime) return null;
    const endDate = new Date(event.endTime);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { text: '已结束', color: 'text-gray-500 bg-gray-100 dark:bg-gray-800' };
    if (daysLeft <= 3) return { text: `剩 ${daysLeft} 天`, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' };
    if (daysLeft <= 7) return { text: `剩 ${daysLeft} 天`, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' };
    return { text: `剩 ${daysLeft} 天`, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' };
  };

  const status = getEventStatus();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* 活动信息卡片 */}
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {/* 封面图 */}
        <div className="relative h-32 bg-gradient-to-br from-red-500 to-orange-500">
          {event.coverImage ? (
            <img
              src={event.coverImage}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Trophy className="w-12 h-12 text-white/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* 状态标签 */}
          {status && (
            <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
              {status.text}
            </div>
          )}

          {/* 活动标题 */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-semibold text-lg line-clamp-2">{event.title}</h3>
          </div>
        </div>

        {/* 活动信息 */}
        <div className="p-4 space-y-3">
          {event.startTime && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">开始时间</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {format(new Date(event.startTime), 'MM月dd日 HH:mm', { locale: zhCN })}
                </p>
              </div>
            </div>
          )}

          {event.endTime && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">截止时间</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {format(new Date(event.endTime), 'MM月dd日 HH:mm', { locale: zhCN })}
                </p>
              </div>
            </div>
          )}

          {event.maxParticipants && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">参与人数</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {event.currentParticipants || 0} / {event.maxParticipants} 人
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* 提交要求 */}
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <FileCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white">提交要求</h4>
        </div>

        <ul className="space-y-3">
          {(event.submissionRequirements || [
            '作品需为原创，严禁抄袭',
            '图片格式：JPG、PNG、GIF',
            '视频格式：MP4、WebM',
            '单个文件不超过 100MB',
            '最多上传 10 个文件'
          ]).map((req, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
              <ChevronRight className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{req}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* 活动规则 */}
      {event.rules && event.rules.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">活动规则</h4>
          </div>

          <ul className="space-y-3">
            {event.rules.map((rule, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-500">
                  {index + 1}
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* 奖品信息 */}
      {event.prizes && event.prizes.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-600" />
            </div>
            <h4 className="font-semibold text-amber-900 dark:text-amber-100">活动奖品</h4>
          </div>

          <ul className="space-y-2">
            {event.prizes.map((prize, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-700 flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <span>{prize}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* 帮助提示 */}
      <motion.div
        variants={itemVariants}
        className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-4"
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">需要帮助？</h5>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              如果在提交过程中遇到任何问题，请联系活动组织者或查看帮助文档。
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default SubmitSidebarLeft;
