import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { TianjinAvatar, TianjinButton } from '@/components/TianjinStyleComponents';

interface CommunitySpotlightProps {
  tags: string[];
  featuredCommunities: Array<{
    name: string;
    members: number;
    path: string;
    official?: boolean;
    description?: string;
    cover?: string;
  }>;
  onTagClick?: (tag: string) => void;
  loading?: boolean;
}

const getCommunityImage = (name: string) => {
  if (name.includes('国潮')) return 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=200&h=200&fit=crop&q=80';
  if (name.includes('非遗')) return 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=200&h=200&fit=crop&q=80';
  if (name.includes('品牌') || name.includes('联名')) return 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=200&h=200&fit=crop&q=80';
  if (name.includes('AI')) return 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200&h=200&fit=crop&q=80';
  
  // Fallback to UI Avatars
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=200`;
}

const CommunitySpotlight: React.FC<CommunitySpotlightProps> = ({ tags, featuredCommunities, onTagClick, loading }) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const containerBg = isDark ? 'bg-gray-800/40' : 'bg-white/60';
  const borderColor = isDark ? 'border-gray-700/50' : 'border-gray-200/50';
  const glassEffect = 'backdrop-blur-md';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`rounded-3xl ${containerBg} ${glassEffect} border ${borderColor} p-6 mb-8 overflow-hidden relative shadow-xl`}
    >
      {/* Background decoration */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <i className="fas fa-globe-asia text-blue-500"></i>
              共创社区 · 灵感枢纽
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              汇聚 {tags.length}+ 热门话题，连接 {featuredCommunities.reduce((acc, c) => acc + c.members, 0)}+ 创作者
            </p>
          </div>
          <TianjinButton
            onClick={() => navigate('/community')}
            variant="primary"
            rightIcon={<i className="fas fa-arrow-right"></i>}
            className="self-start md:self-center shadow-lg shadow-blue-500/20"
          >
            探索更多社群
          </TianjinButton>
        </div>

        {/* Trending Tags - Marquee Effect */}
        <div className="mb-8 overflow-hidden relative group">
          <div className={`absolute inset-y-0 left-0 w-12 z-10 bg-gradient-to-r ${isDark ? 'from-gray-900/0' : 'from-white/0'}`}></div>
          <div className={`absolute inset-y-0 right-0 w-12 z-10 bg-gradient-to-l ${isDark ? 'from-gray-900/0' : 'from-white/0'}`}></div>
          
          <motion.div 
            className="flex gap-3 w-max"
            animate={{ x: [0, -1000] }}
            transition={{ 
              repeat: Infinity, 
              ease: "linear", 
              duration: 30,
              repeatType: "loop"
            }}
          >
            {[...tags, ...tags, ...tags].map((tag, i) => (
              <motion.button
                key={`${tag}-${i}`}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (onTagClick) onTagClick(tag);
                  navigate(`/community?tag=${encodeURIComponent(tag)}`);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300
                  ${isDark 
                    ? 'bg-gray-700/50 hover:bg-gray-600 text-gray-200 border border-gray-600/50' 
                    : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm'
                  } flex items-center gap-2 group/tag`}
              >
                <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-400 to-purple-400 flex items-center justify-center text-[10px] text-white">
                  #
                </span>
                {tag}
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Featured Communities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredCommunities.map((community, index) => (
            <motion.div
              key={community.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              onClick={() => navigate(community.path)}
              className={`group cursor-pointer rounded-2xl p-4 transition-all duration-300 relative overflow-hidden
                ${isDark 
                  ? 'bg-gray-800/80 hover:bg-gray-700 border border-gray-700' 
                  : 'bg-white hover:shadow-lg border border-gray-100 shadow-sm'
                }`}
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <i className="fas fa-users text-6xl"></i>
              </div>
              
              <div className="flex items-start gap-4 relative z-10">
                <div className="relative">
                  <TianjinAvatar
                    src={community.avatar || getCommunityImage(community.name)}
                    alt={community.name}
                    size="lg"
                    variant="gradient"
                    className="shadow-md"
                  />
                  {community.official && (
                    <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full border-2 border-white dark:border-gray-800 flex items-center gap-0.5">
                      <i className="fas fa-check-circle text-[8px]"></i> 官方
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-lg truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {community.name}
                  </h3>
                  <div className={`flex items-center gap-3 text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span className="flex items-center gap-1">
                      <i className="fas fa-user-friends text-xs"></i>
                      {community.members} 成员
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    <span className="text-green-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      活跃中
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                 <div className="flex -space-x-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className={`w-6 h-6 rounded-full border-2 ${isDark ? 'border-gray-800' : 'border-white'} bg-gray-300 overflow-hidden`}>
                         <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${community.name}${i}`} alt="User" className="w-full h-full" />
                      </div>
                    ))}
                    <div className={`w-6 h-6 rounded-full border-2 ${isDark ? 'border-gray-800' : 'border-white'} ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'} flex items-center justify-center text-[10px]`}>
                      +
                    </div>
                 </div>
                 <span className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                   isDark 
                     ? 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white' 
                     : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                 }`}>
                   立即加入
                 </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default CommunitySpotlight;
