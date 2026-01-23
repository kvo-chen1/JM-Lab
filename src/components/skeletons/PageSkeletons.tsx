import React from 'react';
import { SkeletonBox, SkeletonText, SkeletonCard, SkeletonAvatar, SkeletonButton } from '../Skeleton';

/**
 * 通用加载骨架屏 - 轻量级版本
 */
export const SimpleLoadingSkeleton = React.memo(() => (
  <div className="w-full max-w-md p-4">
    <div className="space-y-4">
      {/* 简化的标题和内容骨架 */}
      <div className="space-y-2">
        <SkeletonText width="60%" variant="h4" />
        <SkeletonText width="90%" />
        <SkeletonText width="75%" />
      </div>
      
      {/* 简化的卡片骨架 */}
      <div className="space-y-3">
        <SkeletonBox height="48px" rounded />
        <SkeletonBox height="48px" rounded />
        <SkeletonBox height="48px" rounded />
      </div>
    </div>
  </div>
));

SimpleLoadingSkeleton.displayName = 'SimpleLoadingSkeleton';

/**
 * 仪表盘骨架屏
 */
export const DashboardSkeleton = () => (
  <div className="p-4 space-y-6">
    {/* 顶部统计卡片 */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <SkeletonBox width="40px" height="40px" rounded className="mb-3" />
          <SkeletonText variant="h4" width="60%" className="mb-2" />
          <SkeletonText variant="h2" width="80%" />
        </div>
      ))}
    </div>

    {/* 图表区域 */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <SkeletonText variant="h3" width="120px" />
          <SkeletonBox width="80px" height="32px" rounded />
        </div>
        <SkeletonBox width="100%" height="250px" rounded />
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <SkeletonText variant="h3" width="120px" />
          <SkeletonBox width="80px" height="32px" rounded />
        </div>
        <SkeletonBox width="100%" height="250px" rounded />
      </div>
    </div>

    {/* 最近活动列表 */}
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <SkeletonText variant="h3" width="100px" />
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <SkeletonAvatar size={40} />
            <div className="flex-1">
              <SkeletonText variant="h5" width="40%" className="mb-1" />
              <SkeletonText variant="p" width="70%" />
            </div>
            <SkeletonText variant="span" width="50px" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * 作品详情页骨架屏
 */
export const WorkDetailSkeleton = () => (
  <div className="min-h-screen bg-white dark:bg-gray-900 pb-20">
    {/* 顶部大图 */}
    <SkeletonBox width="100%" height="300px" className="md:h-[400px]" />
    
    <div className="max-w-4xl mx-auto px-4 py-6 -mt-10 relative z-10">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
        {/* 标题和作者 */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <SkeletonText variant="h1" width="80%" className="mb-2" />
            <div className="flex items-center gap-2 mt-3">
              <SkeletonAvatar size={32} />
              <SkeletonText variant="span" width="100px" />
              <SkeletonBox width="4px" height="4px" circle className="mx-2" />
              <SkeletonText variant="span" width="80px" />
            </div>
          </div>
          <div className="flex gap-2">
            <SkeletonBox width="40px" height="40px" rounded />
            <SkeletonBox width="40px" height="40px" rounded />
          </div>
        </div>

        {/* 标签 */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBox key={i} width="60px" height="24px" rounded />
          ))}
        </div>

        {/* 描述内容 */}
        <div className="space-y-4">
          <SkeletonText lines={3} />
          <SkeletonBox width="100%" height="200px" rounded className="my-4" />
          <SkeletonText lines={2} />
        </div>
      </div>

      {/* 评论区骨架 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <SkeletonText variant="h3" width="100px" className="mb-6" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 mb-6 last:mb-0">
            <SkeletonAvatar size={40} />
            <div className="flex-1">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg rounded-tl-none">
                <SkeletonText variant="h5" width="120px" className="mb-2" />
                <SkeletonText lines={2} width="90%" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * 个人主页骨架屏
 */
export const ProfileSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    {/* 封面图 */}
    <SkeletonBox width="100%" height="200px" className="md:h-[280px]" />
    
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-12 mb-6">
          <SkeletonAvatar size={120} className="ring-4 ring-white dark:ring-gray-800" />
          <div className="flex-1 text-center md:text-left mb-2">
            <SkeletonText variant="h1" width="200px" className="mx-auto md:mx-0 mb-2" />
            <SkeletonText variant="p" width="300px" className="mx-auto md:mx-0" />
          </div>
          <div className="flex gap-3 mb-4 md:mb-2">
            <SkeletonButton width="100px" />
            <SkeletonButton width="100px" />
          </div>
        </div>
        
        <div className="flex justify-center md:justify-start gap-8 border-t border-gray-100 dark:border-gray-700 pt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <SkeletonText variant="h3" width="40px" className="mx-auto mb-1" />
              <SkeletonText variant="span" width="60px" />
            </div>
          ))}
        </div>
      </div>
      
      {/* 内容Tabs */}
      <div className="mb-6">
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-1">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBox key={i} width="80px" height="40px" />
          ))}
        </div>
      </div>
      
      {/* 作品网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <SkeletonCard key={i} footer={false} description={false} />
        ))}
      </div>
    </div>
  </div>
);
