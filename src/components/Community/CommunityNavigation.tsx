import React from 'react';
import { motion } from 'framer-motion';

interface CommunityNavigationProps {
  isDark: boolean;
  mode: 'discovery' | 'community';
  communityName?: string;
  activeChannel: string;
  onSelectChannel: (channel: string) => void;
  // Discovery props
  selectedTag?: string;
  onSelectTag?: (tag: string) => void;
  tags?: string[];
}

export const CommunityNavigation: React.FC<CommunityNavigationProps> = ({
  isDark,
  mode,
  communityName,
  activeChannel,
  onSelectChannel,
  selectedTag,
  onSelectTag,
  tags = []
}) => {
  const discoveryChannels = [
    { id: 'communities', icon: 'fas fa-th-large', label: '社群广场' }, // 新增
    { id: 'feed', icon: 'fas fa-stream', label: '综合动态' },
    { id: 'hot', icon: 'fas fa-fire', label: '热门话题' },
    { id: 'fresh', icon: 'fas fa-clock', label: '最新发布' },
  ];

  const communityChannels = [
    { id: 'general', icon: 'fas fa-hashtag', label: '综合讨论' },
    { id: 'announcements', icon: 'fas fa-bullhorn', label: '社群公告' },
    { id: 'works', icon: 'fas fa-image', label: '作品分享' },
    { id: 'questions', icon: 'fas fa-question-circle', label: '问答求助' },
    { id: 'offtopic', icon: 'fas fa-coffee', label: '闲聊灌水' },
  ];

  return (
    <div className={`w-60 flex-shrink-0 flex flex-col h-full lg:h-screen ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border-r ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* Header */}
      <div className={`h-12 flex items-center px-4 font-bold text-lg shadow-sm ${isDark ? 'text-white shadow-gray-900/20' : 'text-gray-900 shadow-gray-200'}`}>
        {mode === 'discovery' ? '发现社群' : communityName || '社群详情'}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-6">
        {/* Main Channels */}
        <div>
            {mode === 'discovery' && (
                <div className={`px-2 mb-2 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    浏览
                </div>
            )}
            <div className="space-y-0.5">
            {(mode === 'discovery' ? discoveryChannels : communityChannels).map(channel => (
                <button
                key={channel.id}
                onClick={() => onSelectChannel(channel.id)}
                className={`w-full flex items-center px-2 py-1.5 rounded-md transition-colors group ${
                    activeChannel === channel.id
                    ? (isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900')
                    : (isDark ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900')
                }`}
                >
                <i className={`${channel.icon} w-5 text-center mr-2 opacity-70`}></i>
                <span className="font-medium text-sm">{channel.label}</span>
                </button>
            ))}
            </div>
        </div>

        {/* Tags / Categories (Discovery Only) */}
        {mode === 'discovery' && tags.length > 0 && (
          <div>
            <div className={`px-2 mb-2 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              热门分类
            </div>
            <div className="space-y-0.5">
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => onSelectTag?.(tag)}
                  className={`w-full flex items-center px-2 py-1.5 rounded-md transition-colors ${
                    selectedTag === tag
                      ? (isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900')
                      : (isDark ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900')
                  }`}
                >
                  <span className="w-5 text-center mr-2 opacity-50">#</span>
                  <span className="font-medium text-sm truncate">{tag}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Community Specific Sections (Community Only) */}
        {mode === 'community' && (
             <div>
             <div className={`px-2 mb-2 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
               语音频道
             </div>
             <div className="space-y-0.5">
                 <button className={`w-full flex items-center px-2 py-1.5 rounded-md transition-colors ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}>
                    <i className="fas fa-volume-up w-5 text-center mr-2 opacity-70"></i>
                    <span className="font-medium text-sm">闲聊室</span>
                 </button>
                 <button className={`w-full flex items-center px-2 py-1.5 rounded-md transition-colors ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}>
                    <i className="fas fa-volume-up w-5 text-center mr-2 opacity-70"></i>
                    <span className="font-medium text-sm">创作交流</span>
                 </button>
             </div>
           </div>
        )}
      </div>

      {/* User Mini Profile at Bottom */}
      <div className={`p-2 ${isDark ? 'bg-gray-900/50' : 'bg-gray-100/50'}`}>
         {/* Placeholder for user profile strip */}
      </div>
    </div>
  );
};
