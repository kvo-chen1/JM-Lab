import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Community } from '@/mock/communities';
import { TianjinImage } from '@/components/TianjinStyleComponents';

interface DiscoverySectionProps {
  isDark: boolean;
  communities: Community[];
  joinedIds: string[];
  onJoin: (id: string) => void;
  onOpen: (community: Community) => void;
  userTags?: string[]; // 用户兴趣标签
}

// 社群分类
const COMMUNITY_CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: 'popular', name: '热门' },
  { id: 'new', name: '最新' },
  { id: 'recommended', name: '推荐' },
  { id: 'creative', name: '创意设计' },
  { id: 'cultural', name: '文化艺术' },
  { id: 'tech', name: '科技前沿' }
];

export const DiscoverySection: React.FC<DiscoverySectionProps> = ({
  isDark,
  communities,
  joinedIds,
  onJoin,
  onOpen,
  userTags = []
}) => {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'members' | 'name' | 'newest' | 'recommended'>('members');
  const [category, setCategory] = useState<string>('all');

  // 增强的推荐算法
  const filteredCommunities = useMemo(() => {
    // 1. 基本筛选：搜索关键词
    let result = communities.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    );

    // 2. 分类筛选
    if (category === 'popular') {
      result = result.filter(c => c.members > 1000);
    } else if (category === 'new') {
      // 模拟最新社群（实际项目中应该使用createdAt字段）
      result = result.slice(-5);
    } else if (category === 'creative') {
      result = result.filter(c => 
        c.tags.some(tag => ['设计', '创意', '插画', 'UI', 'UX'].includes(tag))
      );
    } else if (category === 'cultural') {
      result = result.filter(c => 
        c.tags.some(tag => ['文化', '艺术', '非遗', '国潮', '传统'].includes(tag))
      );
    } else if (category === 'tech') {
      result = result.filter(c => 
        c.tags.some(tag => ['科技', 'AI', '编程', '3D', 'VR'].includes(tag))
      );
    }

    // 3. 排序和推荐算法
    if (sort === 'recommended') {
      // 基于用户兴趣标签的推荐算法
      result = [...result].sort((a, b) => {
        // 计算社群与用户兴趣的匹配度
        const calculateMatchScore = (community: Community) => {
          if (userTags.length === 0) return community.members;
          
          // 标签匹配度
          const tagMatches = userTags.filter(tag => 
            community.tags.includes(tag)
          ).length;
          
          // 活跃度权重
          const activityScore = community.members / 1000;
          
          // 综合得分：标签匹配度 * 2 + 活跃度得分
          return (tagMatches * 2) + activityScore;
        };
        
        const scoreA = calculateMatchScore(a);
        const scoreB = calculateMatchScore(b);
        
        return scoreB - scoreA;
      });
    } else if (sort === 'members') {
      result.sort((a, b) => b.members - a.members);
    } else if (sort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'newest') {
      // 模拟最新排序（实际项目中应该使用createdAt字段）
      result.sort((a, b) => b.members - a.members); // 临时使用members作为替代
    }

    return result;
  }, [communities, search, sort, category, userTags]);

  return (
    <div className="max-w-6xl mx-auto py-3 md:py-8 px-3 md:px-4">
      <div className="mb-3 md:mb-8">
        <h2 className={`text-lg md:text-2xl font-bold mb-3 md:mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>社群</h2>
        
        <div className="flex flex-col gap-3">
          <div className="relative">
            <i className={`fas fa-search absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索社群关键词..."
              className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 shadow-sm'}`}
            />
          </div>
          
          {/* 分类筛选 */}
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex gap-2 py-1 min-w-max">
              {COMMUNITY_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-full transition-all ${category === cat.id ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600') : (isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* 排序选项 */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-wrap">
            <button
              onClick={() => setSort('members')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${sort === 'members' ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              按人数
            </button>
            <div className={`w-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            <button
              onClick={() => setSort('recommended')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${sort === 'recommended' ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              推荐
            </button>
            <div className={`w-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            <button
              onClick={() => setSort('newest')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${sort === 'newest' ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              最新
            </button>
            <div className={`w-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            <button
              onClick={() => setSort('name')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${sort === 'name' ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              按名称
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCommunities.map((community) => (
          <motion.div
            key={community.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`group rounded-xl overflow-hidden border transition-all duration-300 cursor-pointer ${isDark ? 'bg-gray-800 border-gray-700 hover:shadow-lg hover:shadow-black/10' : 'bg-white border-gray-200 hover:shadow-lg hover:shadow-gray-200/50'}`}
            onClick={() => onOpen(community)}
          >
            {/* Cover Image */}
            <div className="relative h-36 md:h-48 overflow-hidden">
              <TianjinImage 
                src={community.cover} 
                alt={community.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                ratio="landscape"
              />
              <div className="absolute top-2 right-2">
                 <span className="bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-md text-gray-800 shadow-sm">
                   官方
                 </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className={`text-base md:text-lg font-bold mb-1 line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {community.name}
              </h3>
              <p className={`text-xs md:text-sm mb-3 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {community.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {community.tags.slice(0, 3).map(tag => (
                  <span 
                    key={tag}
                    className={`text-xs px-2 py-0.5 rounded-md ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/50">
                <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {community.members} 人加入
                </span>
                
                <div className="flex gap-2">
                   {joinedIds.includes(community.id) ? (
                       <button
                        onClick={(e) => { e.stopPropagation(); onJoin(community.id); }}
                        className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                       >
                         已加入
                       </button>
                   ) : (
                       <button
                        onClick={(e) => { e.stopPropagation(); onJoin(community.id); }}
                        className="text-xs px-3 py-1 rounded-full font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                       >
                         加入
                       </button>
                   )}
                   
                   <button 
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                   >
                     查看详情
                   </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {filteredCommunities.length === 0 && (
          <div className="text-center py-16 md:py-20 opacity-60">
              <i className="fas fa-search text-3xl md:text-4xl mb-4 text-gray-400"></i>
              <p className="text-sm md:text-base">没有找到相关社群</p>
          </div>
      )}
    </div>
  );
};
