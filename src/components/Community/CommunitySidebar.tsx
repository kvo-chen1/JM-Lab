import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Community } from '@/services/communityService';

// Simple Tooltip component
const Tooltip = ({ text, children, isDark }: { text: string, children: React.ReactNode, isDark: boolean }) => {
    return (
        <div className="relative group flex items-center">
            {children}
            <div className={`hidden md:block absolute left-14 px-3 py-1.5 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none ${isDark ? 'bg-black text-white' : 'bg-gray-900 text-white'}`}>
                {text}
                {/* Arrow */}
                <div className={`absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rotate-45 ${isDark ? 'bg-black' : 'bg-gray-900'}`}></div>
            </div>
        </div>
    )
}

// 社群头像组件 - 带懒加载和占位符
const CommunityAvatar: React.FC<{
    src: string;
    alt: string;
    isActive: boolean;
    isDark: boolean;
}> = ({ src, alt, isActive, isDark }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    // 生成缩略图URL（如果原图支持）
    const thumbnailSrc = React.useMemo(() => {
        if (!src) return '';
        // 如果是 Unsplash 图片，添加尺寸参数
        if (src.includes('unsplash.com') || src.includes('images.unsplash.com')) {
            return src.replace(/\?.*$/, '') + '?w=100&h=100&fit=crop&q=60';
        }
        // 如果是 UI Avatars，使用较小尺寸
        if (src.includes('ui-avatars.com')) {
            return src.replace(/size=\d+/, 'size=64');
        }
        return src;
    }, [src]);

    // 首字母作为回退显示
    const initial = alt ? alt.charAt(0).toUpperCase() : '?';

    return (
        <div className={`absolute inset-0 rounded-inherit overflow-hidden border-2 transition-all ${isActive ? 'border-blue-600' : 'border-transparent group-hover:border-blue-400'}`}>
            {!loaded && !error && (
                <div className={`w-full h-full animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
            )}
            {error ? (
                <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'} text-lg font-bold`}>
                    {initial}
                </div>
            ) : (
                <img
                    src={thumbnailSrc}
                    alt={alt}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                    loading="lazy"
                    onLoad={() => setLoaded(true)}
                    onError={() => setError(true)}
                />
            )}
        </div>
    );
};

// 骨架屏组件
const CommunitySidebarSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => {
    return (
        <div className={`md:w-[72px] md:flex-col md:items-center md:py-4 md:gap-2 md:h-full lg:h-screen md:${isDark ? 'bg-gray-900' : 'bg-gray-100'} md:border-r md:${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex md:flex-col gap-4 md:w-full md:items-center md:overflow-y-auto md:no-scrollbar md:pb-4">
                {/* 发现社群按钮骨架 */}
                <div className={`w-12 h-12 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-gray-200'} animate-pulse`} />

                <div className={`hidden md:block w-8 h-[2px] rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-300'}`} />

                {/* 社群列表骨架 - 显示3个占位 */}
                {[1, 2, 3].map((i) => (
                    <div key={i} className={`w-12 h-12 rounded-[24px] ${isDark ? 'bg-gray-800' : 'bg-gray-200'} animate-pulse`} />
                ))}

                {/* 创建按钮骨架 */}
                <div className={`w-12 h-12 rounded-[24px] ${isDark ? 'bg-gray-800' : 'bg-gray-200'} animate-pulse`} />
            </div>
        </div>
    );
};

interface CommunitySidebarProps {
    isDark: boolean;
    joinedCommunities: Community[];
    activeCommunityId: string | null;
    onSelectCommunity: (id: string | null) => void;
    onCreateCommunity: () => void;
    loading?: boolean;
}

export const CommunitySidebar: React.FC<CommunitySidebarProps> = React.memo(({
    isDark,
    joinedCommunities,
    activeCommunityId,
    onSelectCommunity,
    onCreateCommunity,
    loading = false,
}) => {
    console.log('[CommunitySidebar] Render - joinedCommunities:', joinedCommunities?.length, joinedCommunities?.map(c => ({ id: c.id, name: c.name, avatar: c.avatar })), 'loading:', loading);
    
    // 如果正在加载，显示骨架屏
    if (loading) {
        return <CommunitySidebarSkeleton isDark={isDark} />;
    }

    return (
        <div className={`md:w-[72px] md:flex-col md:items-center md:py-4 md:gap-2 md:h-full lg:h-screen md:${isDark ? 'bg-gray-900' : 'bg-gray-100'} md:border-r md:${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            {/* Community List */}
            <div className="flex md:flex-col gap-4 md:w-full md:items-center md:overflow-y-auto md:no-scrollbar md:pb-4">
                {/* Home / Discovery Button */}
                <Tooltip text="发现社群" isDark={isDark}>
                    <motion.button
                        onClick={() => onSelectCommunity(null)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative ${activeCommunityId === null
                                ? 'bg-blue-600 text-white rounded-2xl'
                                : `${isDark ? 'bg-gray-800 text-gray-400 hover:bg-blue-600 hover:text-white' : 'bg-white text-gray-600 hover:bg-blue-600 hover:text-white'} rounded-[24px] hover:rounded-2xl`
                            }`}
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <i className="fas fa-compass text-xl"></i>
                        {activeCommunityId === null && (
                            <div className={`hidden md:block absolute -left-4 w-1 h-8 bg-white rounded-r-full`}></div>
                        )}
                    </motion.button>
                </Tooltip>

                <div className={`hidden md:block w-8 h-[2px] rounded-full my-1 ${isDark ? 'bg-gray-800' : 'bg-gray-300'}`}></div>

                {/* Joined Communities List */}
                {joinedCommunities.map((community) => (
                    <Tooltip key={community.id} text={community.name} isDark={isDark}>
                        <motion.button
                            onClick={() => onSelectCommunity(community.id)}
                            className={`relative w-12 h-12 transition-all duration-200 group ${activeCommunityId === community.id ? 'rounded-2xl' : 'rounded-[24px] hover:rounded-2xl'}`}
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.05 }}
                        >
                            <CommunityAvatar
                                src={community.avatar}
                                alt={community.name}
                                isActive={activeCommunityId === community.id}
                                isDark={isDark}
                            />

                            {/* Active Indicator */}
                            <div className={`hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full transition-all duration-200 ${activeCommunityId === community.id ? 'h-8' : 'h-2 opacity-0 group-hover:opacity-100 group-hover:h-5'}`}></div>
                        </motion.button>
                    </Tooltip>
                ))}

                {/* Add Server Button */}
                <Tooltip text="创建新社群" isDark={isDark}>
                    <motion.button
                        onClick={onCreateCommunity}
                        className={`w-12 h-12 flex items-center justify-center transition-all duration-200 group ${isDark ? 'bg-gray-800 text-green-500 hover:bg-green-600 hover:text-white' : 'bg-white text-green-600 hover:bg-green-600 hover:text-white'}
                            rounded-[24px] hover:rounded-2xl`}
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <i className="fas fa-plus text-xl"></i>
                    </motion.button>
                </Tooltip>
            </div>
        </div>
    );
});

// 添加displayName便于调试
CommunitySidebar.displayName = 'CommunitySidebar';

export default CommunitySidebar;
