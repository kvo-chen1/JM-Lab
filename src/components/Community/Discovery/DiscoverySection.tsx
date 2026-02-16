import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Community } from '@/services/communityService';
import { TianjinImage } from '@/components/TianjinStyleComponents';

interface DiscoverySectionProps {
  isDark: boolean;
  communities: Community[];
  joinedIds: string[];
  onJoin: (id: string) => void;
  onOpen: (communityId: string) => void;
  userTags?: string[];
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
  const [sort, setSort] = useState<'members' | 'name' | 'newest' | 'recommended'>('recommended');
  const [category, setCategory] = useState<string>('all');

  const filteredCommunities = useMemo(() => {
    const hasCategoryFilter = userTags.some(tag => tag.startsWith('category:'));
    const categoryFilter = hasCategoryFilter ? userTags.find(tag => tag.startsWith('category:'))?.replace('category:', '') : '';
    
    let result = communities.filter(c => 
      (c.name || '').toLowerCase().includes(search.toLowerCase()) || 
      (c.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.topic || '').toLowerCase().includes(search.toLowerCase())
    );

    let effectiveCategory = category;
    if (categoryFilter) {
      if (categoryFilter === '设计相关') effectiveCategory = 'creative';
      else if (categoryFilter === '艺术文化') effectiveCategory = 'cultural';
      else if (categoryFilter === '科技数码') effectiveCategory = 'tech';
      else if (categoryFilter === '热门') effectiveCategory = 'popular';
    }
    
    if (effectiveCategory === 'popular') {
      result = result.filter(c => (c.memberCount || 0) > 1000);
    } else if (effectiveCategory === 'creative') {
      result = result.filter(c => 
        ['设计', '创意', '插画', 'UI', 'UX', 'UI设计', '数字艺术', '工艺创新', '极简', '国潮', '非遗', '赛博朋克', '3D'].includes(c.topic || '')
      );
    } else if (effectiveCategory === 'cultural') {
      result = result.filter(c => 
        ['文化', '艺术', '非遗', '国潮', '传统', '传统文化', '音乐', '摄影', '写作'].includes(c.topic || '')
      );
    } else if (effectiveCategory === 'tech') {
      result = result.filter(c => 
        ['科技', 'AI', '编程', '3D', 'VR', '3D艺术', '赛博朋克', '数码', '互联网'].includes(c.topic || '')
      );
    }

    if (sort === 'recommended') {
      result = [...result].sort((a, b) => {
        const calculateMatchScore = (community: Community) => {
          if (userTags.length === 0) return (community.memberCount || 0);
          const actualTags = userTags.filter(tag => !tag.startsWith('category:'));
          let tagMatches = 0;
          if (actualTags.length > 0) {
            tagMatches = actualTags.filter(tag => community.topic?.includes(tag)).length;
          }
          const activityScore = (community.memberCount || 0) / 1000;
          return (tagMatches * 3) + activityScore;
        };
        return calculateMatchScore(b) - calculateMatchScore(a);
      });
    } else if (sort === 'members') {
      result.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
    } else if (sort === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return result;
  }, [communities, search, sort, category, userTags]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* 移动端布局 */}
      <div className="md:hidden">
        <div className="max-w-6xl mx-auto pt-2 pb-4 px-4">
          {/* 搜索框 */}
          <div className="mb-3">
            <div className={`relative flex items-center px-3 py-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <i className={`fas fa-search text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}></i>
              <input
                type="text"
                placeholder="搜索社群"
                value={search}
                onChange={(e) => setSearch?.(e.target.value)}
                className={`flex-1 ml-2 bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
              />
              {search && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setSearch?.('')}
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}
                >
                  <i className="fas fa-times text-[10px]"></i>
                </motion.button>
              )}
            </div>
          </div>

          {/* 分类标签 */}
          <div className="mb-4 overflow-x-auto no-scrollbar -mx-4 px-4">
            <div className="flex gap-2 min-w-max">
              {COMMUNITY_CATEGORIES.map((cat) => (
                <motion.button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap ${
                    category === cat.id
                      ? (isDark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white')
                      : (isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200')
                  }`}
                >
                  {cat.name}
                </motion.button>
              ))}
            </div>
          </div>

          {/* 移动端列表 */}
          <div className="space-y-2">
            {filteredCommunities.map((community, index) => (
              <motion.div
                key={community.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOpen(community.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                  isDark 
                    ? 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50' 
                    : 'bg-white hover:bg-gray-50 border border-gray-100 shadow-sm'
                }`}
              >
                {/* 头像 */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                    {community.avatar ? (
                      <TianjinImage 
                        src={community.avatar} 
                        alt={community.name}
                        className="w-full h-full object-cover"
                        fit="cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fas fa-users text-lg text-gray-400"></i>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                    <i className="fas fa-check text-[8px] text-white"></i>
                  </div>
                </div>

                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {community.name || '未命名社群'}
                    </h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      (community.topic || '') === '设计' || (community.topic || '') === '创意' ? 'bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400' :
                      (community.topic || '') === '科技' || (community.topic || '') === 'AI' ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400' :
                      (community.topic || '') === '艺术' || (community.topic || '') === '文化' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                      'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400'
                    }`}>
                      {community.topic || '综合'}
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {community.description || '暂无描述'}
                  </p>
                  <div className={`flex items-center gap-2 mt-1 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <span className="flex items-center gap-1">
                      <i className="fas fa-user-friends text-[8px]"></i>
                      {(community.memberCount || 0) > 999 
                        ? `${((community.memberCount || 0) / 1000).toFixed(1)}k` 
                        : (community.memberCount || 0)}
                    </span>
                    <span>·</span>
                    <span>刚刚活跃</span>
                  </div>
                </div>

                {/* 按钮 */}
                <div className="flex-shrink-0">
                  {joinedIds.includes(community.id) ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); onJoin(community.id); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isDark 
                          ? 'bg-gray-700 text-gray-300' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      已加入
                    </button>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => { e.stopPropagation(); onJoin(community.id); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isDark 
                          ? 'bg-white text-gray-900 hover:bg-gray-100' 
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      加入
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* 空状态 */}
          {filteredCommunities.length === 0 && (
            <div className="text-center py-16">
              <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <i className="fas fa-search text-xl text-gray-400"></i>
              </div>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>没有找到相关社群</p>
            </div>
          )}
        </div>
      </div>

      {/* 桌面端布局 */}
      <div className="hidden md:block max-w-6xl mx-auto py-8 px-6">
        {/* 桌面端头部 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            发现社群
          </h2>
          <div className="flex gap-2">
            {[
              { id: 'recommended', label: '推荐' },
              { id: 'members', label: '按人数' },
              { id: 'name', label: '按名称' }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSort(opt.id as any)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  sort === opt.id 
                    ? (isDark ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-50 text-blue-700 shadow-sm') 
                    : (isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 分类标签 */}
        <div className="mb-6 overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            {COMMUNITY_CATEGORIES.map((cat) => (
              <motion.button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                whileTap={{ scale: 0.95 }}
                className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
                  category === cat.id
                    ? (isDark ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/25')
                    : (isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 shadow-sm')
                }`}
              >
                {cat.name}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 桌面端卡片网格 */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCommunities.map((community, index) => (
            <motion.div
              key={community.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              className={`relative rounded-2xl overflow-hidden cursor-pointer group ${
                isDark 
                  ? 'shadow-lg shadow-black/30 hover:shadow-xl hover:shadow-black/40' 
                  : 'shadow-lg shadow-gray-200/60 hover:shadow-xl hover:shadow-gray-300/60'
              } transition-all duration-300 ${isDark ? 'bg-gray-800' : 'bg-white'} aspect-square`}
              onClick={() => onOpen(community.id)}
            >
              {/* Image */}
              <div className="absolute inset-0 overflow-hidden">
                <TianjinImage 
                  src={community.avatar} 
                  alt={community.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  fit="cover"
                />
              </div>
              
              {/* Top gradient */}
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 via-black/20 to-transparent" />
              
              {/* Content container */}
              <div className="absolute inset-0 flex flex-col">
                {/* Gradient Overlay */}
                <div className="mt-auto h-36 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
                
                {/* Official Badge */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="absolute top-4 right-4 bg-white/15 backdrop-blur-xl border border-white/25 text-white text-[10px] px-2.5 py-1 rounded-full font-medium shadow-lg"
                >
                  <span className="flex items-center gap-1">
                    <i className="fas fa-check-circle text-[9px]"></i>
                    官方
                  </span>
                </motion.div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 w-full p-5">
                  <div className="transform translate-y-0 transition-transform duration-300">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium backdrop-blur-xl ${
                        (community.topic || '') === '设计' || (community.topic || '') === '创意' ? 'bg-gradient-to-r from-pink-500/80 to-rose-500/80 text-white' :
                        (community.topic || '') === '科技' || (community.topic || '') === 'AI' ? 'bg-gradient-to-r from-cyan-500/80 to-blue-500/80 text-white' :
                        (community.topic || '') === '艺术' || (community.topic || '') === '文化' ? 'bg-gradient-to-r from-amber-500/80 to-orange-500/80 text-white' :
                        'bg-gradient-to-r from-violet-500/80 to-purple-500/80 text-white'
                      }`}>
                        #{community.topic || '社群'}
                      </span>
                    </div>
                    
                    {/* Title */}
                    <h3 className="font-bold text-white mb-1.5 text-lg leading-tight line-clamp-1 drop-shadow-lg">{community.name || '未命名社群'}</h3>
                    
                    {/* Description */}
                    <p className="hidden md:block text-white/75 text-xs mb-3 line-clamp-1 font-light">{community.description || ''}</p>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/15">
                      <span className="text-white/60 text-xs flex items-center gap-1.5 font-medium">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-white/20'}`}>
                          <i className="fas fa-users text-[10px]"></i>
                        </div>
                        {(community.memberCount || 0).toLocaleString()}
                      </span>
                      
                      {/* 加入按钮 */}
                      <div className="flex gap-2">
                        {joinedIds.includes(community.id) ? (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); onJoin(community.id); }}
                            className="bg-white/15 backdrop-blur-xl text-white text-xs px-3.5 py-1.5 rounded-full font-semibold border border-white/20 transition-all duration-300 hover:bg-white/25"
                          >
                            <span className="flex items-center gap-1">
                              <i className="fas fa-check text-[8px]"></i>
                              已加入
                            </span>
                          </motion.button>
                        ) : (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); onJoin(community.id); }}
                            className="bg-gradient-to-r from-white to-gray-100 text-gray-900 text-xs px-3.5 py-1.5 rounded-full font-semibold shadow-lg shadow-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-white/30"
                          >
                            <span className="flex items-center gap-1">
                              <i className="fas fa-plus text-[8px]"></i>
                              加入
                            </span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* 空状态 */}
        {filteredCommunities.length === 0 && (
          <div className="text-center py-20">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <i className="fas fa-search text-2xl text-gray-400"></i>
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>没有找到相关社群</p>
          </div>
        )}
      </div>
    </div>
  );
};
