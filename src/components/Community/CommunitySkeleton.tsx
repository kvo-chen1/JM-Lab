import React from 'react';
import { SkeletonCard, SkeletonListItem, SkeletonBox } from '@/components/Skeleton';
import { useTheme } from '@/hooks/useTheme';

export const CommunitySkeleton: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className={`flex flex-col h-full w-full ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-4`}>
      {/* 顶部横幅骨架 */}
      <div className="w-full h-48 mb-6 rounded-xl overflow-hidden relative">
        <SkeletonBox width="100%" height="100%" />
      </div>

      <div className="flex gap-6">
        {/* 左侧内容流骨架 */}
        <div className="flex-1 space-y-4">
          {/* 发帖框骨架 */}
          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm mb-6`}>
            <div className="flex gap-3 mb-3">
              <SkeletonBox width={40} height={40} circle />
              <SkeletonBox width="100%" height={40} rounded />
            </div>
            <div className="flex justify-between mt-2">
              <div className="flex gap-2">
                <SkeletonBox width={24} height={24} rounded />
                <SkeletonBox width={24} height={24} rounded />
              </div>
              <SkeletonBox width={80} height={32} rounded />
            </div>
          </div>

          {/* 帖子列表骨架 */}
          <SkeletonCard className="mb-4" />
          <SkeletonCard className="mb-4" />
          <SkeletonCard className="mb-4" />
        </div>

        {/* 右侧边栏骨架 (仅在大屏显示) */}
        <div className="hidden lg:block w-72 space-y-6">
          {/* 社区信息骨架 */}
          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <div className="flex items-center gap-3 mb-4">
              <SkeletonBox width={48} height={48} rounded />
              <div>
                <SkeletonBox width={120} height={20} rounded className="mb-2" />
                <SkeletonBox width={80} height={16} rounded />
              </div>
            </div>
            <SkeletonBox width="100%" height={60} rounded className="mb-4" />
            <div className="flex justify-between">
               <SkeletonBox width={60} height={40} rounded />
               <SkeletonBox width={60} height={40} rounded />
               <SkeletonBox width={60} height={40} rounded />
            </div>
          </div>

          {/* 活跃成员骨架 */}
          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
             <SkeletonBox width={100} height={20} rounded className="mb-4" />
             <div className="space-y-3">
                <SkeletonListItem />
                <SkeletonListItem />
                <SkeletonListItem />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
