import React from 'react';
import TrendingCard from '@/components/TrendingCard';
import TrendingCardV2 from '@/components/TrendingCardV2';
import { TrendingTopic } from '@/services/trendingService';

// 模拟数据
const mockTopics: TrendingTopic[] = [
  {
    id: '1',
    rank: 1,
    title: '狗不理包子制作技艺',
    description: '传承百年的天津味道，探索非遗美食的制作工艺',
    coverImage: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=200&h=200&fit=crop',
    viewCount: 2380000,
    videoCount: 15600,
    likeCount: 450000,
    heatValue: 285000000,
    growthRate: 15.5,
    trend: 'rising',
    relatedTags: ['狗不理', '包子', '传统美食', '老字号'],
    suggestedAngles: [
      '拍摄包子制作的16个细节',
      '采访老字号传承人讲述历史',
      '对比现代与传统制作工艺',
    ],
    category: 'food',
    timeRange: '24h',
  },
  {
    id: '2',
    rank: 2,
    title: '天津之眼夜景航拍',
    description: '海河两岸灯火璀璨，展现现代天津的璀璨夜景',
    coverImage: 'https://images.unsplash.com/photo-1513415564515-763d91423bdd?w=200&h=200&fit=crop',
    viewCount: 1820000,
    videoCount: 9200,
    likeCount: 320000,
    heatValue: 156000000,
    growthRate: 12.3,
    trend: 'rising',
    relatedTags: ['天津之眼', '夜景', '航拍', '旅游'],
    suggestedAngles: [
      '无人机航拍天津之眼全景',
      '结合海河游船视角',
    ],
    category: 'travel',
    timeRange: '24h',
  },
  {
    id: '3',
    rank: 3,
    title: '天津话方言教学',
    description: '听相声学天津话，地道方言趣味教学',
    coverImage: 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=200&h=200&fit=crop',
    viewCount: 1250000,
    videoCount: 8500,
    likeCount: 280000,
    heatValue: 142000000,
    growthRate: 8.9,
    trend: 'stable',
    relatedTags: ['天津话', '方言', '相声', '教学'],
    suggestedAngles: [
      '相声演员教经典天津话',
      '外地人学天津话的趣事',
    ],
    category: 'culture',
    timeRange: '24h',
  },
  {
    id: '4',
    rank: 4,
    title: '泥人张非遗技艺',
    description: '一双手捏出万千世界，传统手工艺术的匠心传承',
    coverImage: 'https://images.unsplash.com/photo-1459908676235-d5f02a50184b?w=200&h=200&fit=crop',
    viewCount: 980000,
    videoCount: 5400,
    likeCount: 210000,
    heatValue: 98000000,
    growthRate: -2.5,
    trend: 'falling',
    relatedTags: ['泥人张', '非遗', '手工艺', '传承'],
    suggestedAngles: [
      '记录泥人张制作全过程',
      '展示经典作品背后的故事',
    ],
    category: 'culture',
    timeRange: '24h',
  },
];

const TrendingCardDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          TrendingCard 设计对比
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          左侧：原版设计 | 右侧：改进版设计
        </p>

        {/* 并排对比 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* 原版设计 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                原版设计 (V1)
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                问题：配色杂乱、信息密度高
              </span>
            </div>
            <div className="space-y-4">
              {mockTopics.slice(0, 2).map((topic) => (
                <TrendingCard
                  key={topic.id}
                  topic={topic}
                  onParticipate={() => console.log('Participate:', topic.title)}
                  onBookmark={() => console.log('Bookmark:', topic.title)}
                  onShare={() => console.log('Share:', topic.title)}
                />
              ))}
            </div>
          </div>

          {/* 改进版设计 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                改进版设计 (V2)
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                优化：简洁配色、清晰层次
              </span>
            </div>
            <div className="space-y-4">
              {mockTopics.slice(0, 2).map((topic) => (
                <TrendingCardV2
                  key={topic.id}
                  topic={topic}
                  onParticipate={() => console.log('Participate:', topic.title)}
                  onBookmark={() => console.log('Bookmark:', topic.title)}
                  onShare={() => console.log('Share:', topic.title)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Compact 模式展示 */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
            Compact 紧凑模式
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockTopics.map((topic) => (
              <TrendingCardV2
                key={topic.id}
                topic={topic}
                layout="compact"
                onParticipate={() => console.log('Participate:', topic.title)}
              />
            ))}
          </div>
        </div>

        {/* 设计改进点说明 */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
            设计改进说明
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                🎨 配色方案
              </h3>
              <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>• 原版：橙色主色调，对比过于强烈</li>
                <li>• 改进：蓝色系主色调，更专业稳重</li>
                <li>• 排名徽章：金银铜三色区分前三名</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                📐 布局优化
              </h3>
              <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>• 封面图与数据并排，节省空间</li>
                <li>• 创作建议可折叠，减少视觉干扰</li>
                <li>• 标签样式更 subtle</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                ✨ 交互体验
              </h3>
              <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>• 按钮添加微动效，更有质感</li>
                <li>• 卡片悬浮效果更细腻</li>
                <li>• 支持 Compact 紧凑模式</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                🎯 信息层次
              </h3>
              <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>• 热度标签分级显示（爆火/热门/上升）</li>
                <li>• 统计数据更紧凑</li>
                <li>• 描述文字限制为一行</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendingCardDemo;
