import React from 'react';
import type { Community } from '@/data/mockCommunities';
import { TianjinAvatar } from '@/components/TianjinStyleComponents';

interface CommunityInfoSidebarProps {
  isDark: boolean;
  community?: Community;
  members?: string[]; // Simplified for now
  onlineCount?: number;
}

export const CommunityInfoSidebar: React.FC<CommunityInfoSidebarProps> = ({
  isDark,
  community,
  members = [],
  onlineCount = 0,
}) => {
  if (!community) return null;

  return (
    <div className={`w-60 flex-shrink-0 hidden lg:flex flex-col h-screen fixed right-0 top-0 z-40 ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border-l ${isDark ? 'border-gray-700' : 'border-gray-200'} p-4 overflow-y-auto`}>
      <div className="mb-6">
        <h3 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>关于社群</h3>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{community.description}</p>
        <div className="flex flex-wrap gap-2 mt-3">
            {community.tags.map(tag => (
                <span key={tag} className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                    #{tag}
                </span>
            ))}
        </div>
      </div>

      <div className="mb-6">
          <h3 className={`font-bold text-sm uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              在线成员 — {onlineCount}
          </h3>
          <div className="space-y-3">
              {/* Mock Online Members */}
              {['设计师小明', '插画师小陈', '数字艺术家小张'].map((name, i) => (
                  <div key={i} className="flex items-center gap-3 opacity-90 hover:opacity-100 cursor-pointer">
                      <div className="relative">
                        <TianjinAvatar size="sm" src="" alt={name} className="w-8 h-8" />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                      </div>
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{name}</span>
                  </div>
              ))}
          </div>
      </div>

      <div>
          <h3 className={`font-bold text-sm uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              离线成员 — {community.members}
          </h3>
          <div className="space-y-3 opacity-60">
               {/* Mock Offline Members */}
               {['品牌设计师老王', '策展人李四'].map((name, i) => (
                  <div key={i} className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <TianjinAvatar size="sm" src="" alt={name} className="w-8 h-8 grayscale" />
                      </div>
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{name}</span>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};
