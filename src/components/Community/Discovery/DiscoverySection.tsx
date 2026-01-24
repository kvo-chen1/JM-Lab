import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Community } from '@/mock/communities';
import { TianjinImage } from '@/components/TianjinStyleComponents';

interface DiscoverySectionProps {
  isDark: boolean;
  communities: Community[];
  joinedIds: string[];
  onJoin: (id: string) => void;
  onOpen: (communityId: string) => void;
  userTags?: string[]; // 用户兴趣标签
  search?: string;
  setSearch?: (value: string) => void;
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
  userTags = [],
  search = '',
  setSearch
}) => {
  const [sort, setSort] = useState<'members' | 'name' | 'newest' | 'recommended'>('members');
  const [category, setCategory] = useState<string>('all');

  // 增强的推荐算法
  const filteredCommunities = useMemo(() => {
    // 处理用户标签中的分类筛选
    const hasCategoryFilter = userTags.some(tag => tag.startsWith('category:'));
    const categoryFilter = hasCategoryFilter ? userTags.find(tag => tag.startsWith('category:'))?.replace('category:', '') : '';
    
    // 1. 基本筛选：搜索关键词
    let result = communities.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.topic.toLowerCase().includes(search.toLowerCase())
    );

    // 2. 分类筛选
    // 结合用户标签中的分类筛选
    let effectiveCategory = category;
    if (categoryFilter) {
      // 根据用户选择的分类自动映射到社群分类
      if (categoryFilter === '设计相关') {
        effectiveCategory = 'creative';
      } else if (categoryFilter === '艺术文化') {
        effectiveCategory = 'cultural';
      } else if (categoryFilter === '科技数码') {
        effectiveCategory = 'tech';
      } else if (categoryFilter === '热门') {
        effectiveCategory = 'popular';
      }
    }
    
    if (effectiveCategory === 'popular') {
      result = result.filter(c => c.memberCount > 1000);
    } else if (effectiveCategory === 'new') {
      // 模拟最新社群（实际项目中应该使用createdAt字段）
      result = result.slice(-5);
    } else if (effectiveCategory === 'creative') {
      result = result.filter(c => 
        ['设计', '创意', '插画', 'UI', 'UX', 'UI设计', '数字艺术', '工艺创新', '极简', '国潮', '非遗', '赛博朋克', '3D'].includes(c.topic)
      );
    } else if (effectiveCategory === 'cultural') {
      result = result.filter(c => 
        ['文化', '艺术', '非遗', '国潮', '传统', '传统文化', '音乐', '摄影', '写作'].includes(c.topic)
      );
    } else if (effectiveCategory === 'tech') {
      result = result.filter(c => 
        ['科技', 'AI', '编程', '3D', 'VR', '3D艺术', '赛博朋克', '数码', '互联网'].includes(c.topic)
      );
    } else if (effectiveCategory === 'recommended' || effectiveCategory === 'all') {
      // 推荐分类和全部分类不需要额外过滤，依赖排序算法
      result = result;
    }

    // 3. 排序和推荐算法
    if (sort === 'recommended') {
      // 基于用户兴趣标签的推荐算法
      result = [...result].sort((a, b) => {
        // 计算社群与用户兴趣的匹配度
        const calculateMatchScore = (community: Community) => {
          if (userTags.length === 0) return community.memberCount;
          
          // 提取实际的兴趣标签（去除分类前缀）
          const actualTags = userTags.filter(tag => !tag.startsWith('category:'));
          
          // 标签匹配度（使用topic进行匹配）
          let tagMatches = 0;
          if (actualTags.length > 0) {
            tagMatches = actualTags.filter(tag => 
              community.topic.includes(tag)
            ).length;
          } else if (categoryFilter) {
            // 如果只有分类筛选，根据分类匹配度加分
            if (categoryFilter === '设计相关' && ['设计', '创意', '插画', 'UI', 'UX', 'UI设计', '数字艺术', '工艺创新', '极简', '国潮', '非遗', '赛博朋克', '3D'].includes(community.topic)) {
              tagMatches = 2;
            } else if (categoryFilter === '艺术文化' && ['文化', '艺术', '非遗', '国潮', '传统', '传统文化', '音乐', '摄影', '写作'].includes(community.topic)) {
              tagMatches = 2;
            } else if (categoryFilter === '科技数码' && ['科技', 'AI', '编程', '3D', 'VR', '3D艺术', '赛博朋克', '数码', '互联网'].includes(community.topic)) {
              tagMatches = 2;
            }
          }
          
          // 活跃度权重
          const activityScore = community.memberCount / 1000;
          
          // 综合得分：标签匹配度 * 2 + 活跃度得分
          return (tagMatches * 3) + activityScore;
        };
        
        const scoreA = calculateMatchScore(a);
        const scoreB = calculateMatchScore(b);
        
        return scoreB - scoreA;
      });
    } else if (sort === 'members') {
      result.sort((a, b) => b.memberCount - a.memberCount);
    } else if (sort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'newest') {
      // 模拟最新排序（实际项目中应该使用createdAt字段）
      result.sort((a, b) => b.memberCount - a.memberCount); // 临时使用memberCount作为替代
    }

    return result;
  }, [communities, search, sort, category, userTags]);

  return (
    <div className="max-w-6xl mx-auto py-3 md:py-8 px-3 md:px-4">
      <div className="mb-3 md:mb-8">
        <h2 className={`hidden sm:block text-lg md:text-2xl font-bold mb-3 md:mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>社群</h2>
        
        <div className="flex flex-col gap-3">
          
          {/* 分类筛选 - 只在电脑端显示 */}
          <div className="hidden sm:block overflow-x-auto no-scrollbar">
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
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6">
        {filteredCommunities.map((community) => (
          <motion.div
            key={community.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`relative rounded-2xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300 ${isDark ? 'bg-gray-800' : 'bg-white'} aspect-square`}
            onClick={() => onOpen(community.id)}
          >
            {/* Image */}
            <TianjinImage 
              src={community.avatar} 
              alt={community.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              fit="cover"
              priority
              disableFallback={false}
            />
            
            {/* Content container */}
            <div className="absolute inset-0 flex flex-col">
              {/* Gradient Overlay */}
              <div className="mt-auto h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-90"></div>
              
              {/* Official Badge */}
              <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] px-2 py-0.5 rounded-full">
                官方认证
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 w-full p-3 md:p-5">
                <div className="transform translate-y-0 md:translate-y-2 md:group-hover:translate-y-0 transition-transform duration-300">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-1 md:mb-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white scale-90 origin-left">
                      #{community.topic}
                    </span>
                  </div>
                  
                  {/* Title */}
                  <h3 className="font-bold text-white mb-0.5 md:mb-1 text-sm md:text-lg leading-tight">{community.name}</h3>
                  
                  {/* Description */}
                  <p className="text-white/80 text-[10px] md:text-xs mb-1 md:mb-3 line-clamp-1">{community.description}</p>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-white/20 pt-1.5 md:pt-3">
                    <span className="text-white/70 text-[10px] md:text-xs flex items-center gap-1">
                      <i className="fas fa-user-friends text-[10px]"></i> {community.memberCount}
                    </span>
                    
                    <div className="flex gap-2">
                      {joinedIds.includes(community.id) ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); onJoin(community.id); }}
                          className="bg-white/20 text-white text-[10px] md:text-xs px-2 md:px-3 py-0.5 md:py-1 rounded-full font-bold opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 transform translate-x-0 md:translate-x-4 md:group-hover:translate-x-0"
                        >
                          已加入
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); onJoin(community.id); }}
                          className="bg-white text-black text-[10px] md:text-xs px-2 md:px-3 py-0.5 md:py-1 rounded-full font-bold opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 transform translate-x-0 md:translate-x-4 md:group-hover:translate-x-0"
                        >
                          加入
                        </button>
                      )}
                    </div>
                  </div>
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
