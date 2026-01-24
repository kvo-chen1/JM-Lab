import React from 'react';
import { motion } from 'framer-motion';
import { TianjinAvatar } from '@/components/TianjinStyleComponents';
import type { Community } from '@/mock/communities';

interface CommunitySidebarProps {
  isDark: boolean;
  joinedCommunities: Community[];
  activeCommunityId: string | null;
  onSelectCommunity: (id: string | null) => void;
  onCreateCommunity: () => void;
}

export const CommunitySidebar: React.FC<CommunitySidebarProps> = ({
  isDark,
  joinedCommunities,
  activeCommunityId,
  onSelectCommunity,
  onCreateCommunity,
}) => {
  return (
    <div className={`md:w-[72px] md:flex-col md:items-center md:py-4 md:gap-2 md:h-full lg:h-screen md:${isDark ? 'bg-gray-900' : 'bg-gray-100'} md:border-r md:${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
      {/* Community List */}
      <div className="flex md:flex-col gap-3 md:w-full md:items-center md:overflow-y-auto md:no-scrollbar md:pb-4">
        {/* Home / Discovery Button */}
        <Tooltip text="发现社群" isDark={isDark}>
          <button
            onClick={() => onSelectCommunity(null)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative ${
              activeCommunityId === null
                ? 'bg-blue-600 text-white rounded-2xl'
                : `${isDark ? 'bg-gray-800 text-gray-400 hover:bg-blue-600 hover:text-white' : 'bg-white text-gray-600 hover:bg-blue-600 hover:text-white'} rounded-[24px] hover:rounded-2xl`
            }`}
          >
            <i className="fas fa-compass text-xl"></i>
            {activeCommunityId === null && (
              <div className={`hidden md:block absolute -left-4 w-1 h-8 bg-white rounded-r-full`}></div>
            )}
          </button>
        </Tooltip>

        <div className={`hidden md:block w-8 h-[2px] rounded-full my-1 ${isDark ? 'bg-gray-800' : 'bg-gray-300'}`}></div>

        {/* Joined Communities List */}
        {joinedCommunities.map((community) => (
          <Tooltip key={community.id} text={community.name} isDark={isDark}>
            <button
              onClick={() => onSelectCommunity(community.id)}
              className={`relative w-12 h-12 transition-all duration-200 group ${
                activeCommunityId === community.id ? 'rounded-2xl' : 'rounded-[24px] hover:rounded-2xl'
              }`}
            >
              <div className={`absolute inset-0 rounded-inherit overflow-hidden border-2 transition-all ${activeCommunityId === community.id ? 'border-blue-600' : 'border-transparent group-hover:border-blue-400'}`}>
                <img 
                    src={community.avatar} 
                    alt={community.name} 
                    className="w-full h-full object-cover"
                />
              </div>
              
              {/* Active Indicator */}
              <div className={`hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full transition-all duration-200 ${
                activeCommunityId === community.id ? 'h-8' : 'h-2 opacity-0 group-hover:opacity-100 group-hover:h-5'
              }`}></div>
            </button>
          </Tooltip>
        ))}

        {/* Add Server Button */}
        <Tooltip text="创建新社群" isDark={isDark}>
            <button
            onClick={onCreateCommunity}
            className={`w-12 h-12 flex items-center justify-center transition-all duration-200 group ${
                isDark ? 'bg-gray-800 text-green-500 hover:bg-green-600 hover:text-white' : 'bg-white text-green-600 hover:bg-green-600 hover:text-white'
            } rounded-[24px] hover:rounded-2xl`}
            >
            <i className="fas fa-plus text-xl"></i>
            </button>
        </Tooltip>
      </div>
    </div>
  );
};

// Simple Tooltip component
const Tooltip = ({ text, children, isDark }: { text: string, children: React.ReactNode, isDark: boolean }) => {
    return (
        <div className="relative group flex items-center">
            {children}
            <div className={`absolute left-14 px-3 py-1.5 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none ${
                isDark ? 'bg-black text-white' : 'bg-gray-900 text-white'
            }`}>
                {text}
                {/* Arrow */}
                <div className={`absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rotate-45 ${
                     isDark ? 'bg-black' : 'bg-gray-900'
                }`}></div>
            </div>
        </div>
    )
}
