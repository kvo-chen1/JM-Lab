import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Community } from '@/mock/communities';
import { TianjinAvatar } from '@/components/TianjinStyleComponents';

interface CommunityInfoSidebarProps {
  isDark: boolean;
  community?: Community;
  members?: string[]; // Simplified for now
  onlineCount?: number;
  isJoined?: boolean;
  onJoinCommunity?: (id: string) => void;
  admins?: string[];
  memberCount?: number;
  weeklyVisitors?: number;
  weeklyInteractions?: number;
  createdDate?: string;
  creator?: string;
}

// 版规类型
interface Rule {
  id: number;
  title: string;
  content: string;
}

// 热门帖子类型
interface HotPost {
  id: string;
  title: string;
  comments: number;
  upvotes: number;
}

export const CommunityInfoSidebar: React.FC<CommunityInfoSidebarProps> = ({
  isDark,
  community,
  members = [],
  onlineCount = 0,
  isJoined = false,
  onJoinCommunity,
  admins = [],
  memberCount = 0,
  weeklyVisitors = 0,
  weeklyInteractions = 0,
  createdDate = '',
  creator = '',
}) => {
  if (!community) return null;

  const navigate = useNavigate();
  
  // 模拟当前用户是社群管理员
  const isAdmin = true;
  
  // 状态管理
  const [expandedRules, setExpandedRules] = useState<number[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // 处理用户点击事件
  const handleUserClick = (username: string) => {
    // 导航到用户个人资料页，这里使用用户名作为ID示例
    navigate(`/author/${encodeURIComponent(username)}`);
  };
  
  // 使用社群真实数据
  const communityTags = community.tags || [];
  const communityBookmarks = community.bookmarks || [];
  const communityGuidelines = community.guidelines || [];
  
  // 切换板块展开/折叠
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  // 板块配置
  const sections = [
    { id: 'stats', title: '社群统计', alwaysExpanded: true },
    { id: 'admins', title: '社群管理员', alwaysExpanded: true },
    { id: 'tags', title: '社群标签', alwaysExpanded: true },
    { id: 'bookmarks', title: '社区书签' },
    { id: 'hot-posts', title: '热门帖子' },
    { id: 'guidelines', title: `${community.name} 版规` },
    { id: 'active-members', title: '活跃成员' },
    { id: 'events', title: '近期活动' }
  ];
  
  // 模拟版规数据
  const rules: Rule[] = communityGuidelines.length > 0 ? 
    communityGuidelines.map((content, index) => ({
      id: index + 1,
      title: `规则 ${index + 1}`,
      content
    })) : [
    { id: 1, title: '仅限表情包', content: '本社群仅允许发布与《Apex英雄》相关的表情包，请勿发布其他类型的内容。' },
    { id: 2, title: '一般准则', content: '请遵守基本的网络礼仪，尊重他人，不得发布攻击性、歧视性或违法内容。' },
    { id: 3, title: '帖子内容必须与《Apex英雄》相关', content: '所有帖子内容必须与《Apex英雄》游戏相关，无关内容将被删除。' },
    { id: 4, title: '无重复帖子', content: '请勿发布重复内容，相同或相似的帖子将被合并或删除。' },
    { id: 5, title: '泄露和剧透', content: '请勿发布游戏未正式发布的内容或剧透信息，违者将被警告或封禁。' },
    { id: 6, title: '文明交流', content: '请使用文明用语，不得进行人身攻击或辱骂他人。' },
    { id: 7, title: '禁止广告', content: '请勿在社群内发布任何形式的广告或推广内容。' }
  ];
  
  // 模拟热门帖子数据
  const hotPosts: HotPost[] = [
    { id: '1', title: '这个表情包太搞笑了，哈哈哈哈', comments: 234, upvotes: 1567 },
    { id: '2', title: '有没有一起组队玩的？', comments: 89, upvotes: 456 },
    { id: '3', title: '新赛季的更新内容大家怎么看？', comments: 156, upvotes: 892 },
    { id: '4', title: '分享一个我做的Apex表情包', comments: 67, upvotes: 345 },
    { id: '5', title: '这个英雄的新皮肤太帅了！', comments: 123, upvotes: 789 }
  ];
  
  // 切换版规展开/折叠状态
  const toggleRuleExpansion = (id: number) => {
    setExpandedRules(prev => 
      prev.includes(id) 
        ? prev.filter(ruleId => ruleId !== id) 
        : [...prev, id]
    );
  };

  return (
    <div className={`flex-shrink-0 flex flex-col h-full ${isDark ? 'bg-gray-900' : 'bg-gray-50'} border-l ${isDark ? 'border-gray-800' : 'border-gray-200'} p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 lg:w-72 xl:w-80 md:sticky md:top-0 md:h-screen`}>
      {/* 社群基本信息 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{community.name}</h3>
          {/* 加入/关注按钮 */}
          <button 
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${isJoined ? (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300') : (isDark ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600')}`}
            onClick={() => onJoinCommunity?.(community.id)}
          >
            {isJoined ? '已加入' : '加入'}
          </button>
        </div>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>{community.description}</p>
        
        {/* 社群创建者信息 */}
        <div className="flex items-center gap-3 mb-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md p-1.5 transition-colors" onClick={() => handleUserClick(creator || '@社区管理员')}>
          <div className="relative">
            <TianjinAvatar size="sm" src="" alt="社区创建者" className="w-8 h-8 cursor-pointer" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-gray-800 rounded-full"></div>
          </div>
          <div>
            <div className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} cursor-pointer`}>由 {creator || '@社区管理员'} 创建</div>
            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>创建于 {createdDate || '2019 年 2 月 7 日'}</div>
          </div>
        </div>
        
        {/* 响应式板块容器 */}
        <div className="space-y-4">
          {/* 社群统计数据 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{memberCount > 0 ? memberCount.toLocaleString() : community.memberCount?.toLocaleString() || '0'}</div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>成员</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{onlineCount}</div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>在线</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{weeklyVisitors > 0 ? weeklyVisitors.toLocaleString() : '7.6K'}</div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>每周访客</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{weeklyInteractions > 0 ? weeklyInteractions.toLocaleString() : '148'}</div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>每周互动</div>
            </div>
          </div>

          {/* 管理员列表 */}
          {admins.length > 0 && (
            <div className="mb-4">
              <h4 className={`font-bold text-sm uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  社群管理员
              </h4>
              <div className="space-y-2">
                {admins.map((admin, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md p-1 transition-colors"
                    onClick={() => handleUserClick(admin)}
                  >
                    <div className="relative">
                      <TianjinAvatar 
                        size="sm" 
                        src="" 
                        alt={admin} 
                        className="w-6 h-6 cursor-pointer" 
                      />
                      <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                    </div>
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} cursor-pointer`}>{admin}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 社群标签 */}
          <div>
            <h4 className={`font-bold text-sm uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                社群标签
            </h4>
            <div className="flex flex-wrap gap-2">
              {communityTags.map((tag, index) => (
                <span 
                  key={index}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          
          {/* 响应式板块：社区书签 */}
          <div className="rounded-lg overflow-hidden">
            <button 
              className={`w-full flex items-center justify-between text-left px-4 py-3 transition-all duration-200 ${isDark ? 'text-gray-300' : 'text-gray-900'}`} 
              onClick={() => toggleSection('bookmarks')}
            >
              <h4 className={`font-bold text-sm uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                社区书签
              </h4>
              <i className={`fas fa-chevron-down transition-transform duration-200 ${expandedSection === 'bookmarks' ? 'transform rotate-180' : ''}`}></i>
            </button>
            {expandedSection === 'bookmarks' && (
              <div className="space-y-2 p-3">
                {communityBookmarks.length === 0 ? (
                  <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    暂无书签
                  </div>
                ) : (
                  communityBookmarks.map((bookmark) => (
                    <button 
                      key={bookmark.id}
                      className={`w-full px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      <i className={bookmark.icon}></i>
                      {bookmark.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          
          {/* 响应式板块：热门帖子 */}
          <div className="rounded-lg overflow-hidden">
            <button 
              className="w-full flex items-center justify-between px-4 py-3 transition-all duration-200" 
              onClick={() => toggleSection('hot-posts')}
            >
              <h4 className={`font-bold text-sm uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  热门帖子
              </h4>
              <i className={`fas fa-chevron-down transition-transform duration-200 ${expandedSection === 'hot-posts' ? 'transform rotate-180' : ''}`}></i>
            </button>
            {expandedSection === 'hot-posts' && (
              <div className="space-y-3 p-3">
                {hotPosts.map((post, index) => (
                  <div key={index} className={`p-3 rounded-lg transition-colors cursor-pointer ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}>
                    <div className={`text-sm font-medium mb-2 line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {post.title}
                    </div>
                    <div className="flex items-center gap-4 text-xs opacity-80">
                      <span className="flex items-center gap-1">
                        <i className="fas fa-comment"></i>
                        <span>{post.comments}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="fas fa-arrow-up"></i>
                        <span>{post.upvotes}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 响应式板块：社群版规 */}
          <div className="rounded-lg overflow-hidden">
            <button 
              className="w-full flex items-center justify-between px-4 py-3 transition-all duration-200" 
              onClick={() => toggleSection('guidelines')}
            >
              <h4 className={`font-bold text-sm uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {community.name} 版规
              </h4>
              <i className={`fas fa-chevron-down transition-transform duration-200 ${expandedSection === 'guidelines' ? 'transform rotate-180' : ''}`}></i>
            </button>
            {expandedSection === 'guidelines' && (
              <div className="space-y-3 p-3">
                {rules.map(rule => (
                  <div key={rule.id} className={`rounded-lg overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <button 
                      className="w-full px-4 py-3 flex items-center justify-between text-left ${isDark ? 'text-gray-300' : 'text-gray-700'}" 
                      onClick={() => toggleRuleExpansion(rule.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-900'}`}>{rule.id}</span>
                        <span className="text-sm font-medium">{rule.title}</span>
                      </div>
                      <i className={`fas fa-chevron-down transition-transform duration-200 ${expandedRules.includes(rule.id) ? 'transform rotate-180' : ''}`}></i>
                    </button>
                    {expandedRules.includes(rule.id) && (
                      <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-600'}`}>
                        <p className="text-sm leading-relaxed">{rule.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 响应式板块：活跃成员 */}
          <div className="rounded-lg overflow-hidden">
            <button 
              className="w-full flex items-center justify-between px-4 py-3 transition-all duration-200" 
              onClick={() => toggleSection('active-members')}
            >
              <h4 className={`font-bold text-sm uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  活跃成员
              </h4>
              <i className={`fas fa-chevron-down transition-transform duration-200 ${expandedSection === 'active-members' ? 'transform rotate-180' : ''}`}></i>
            </button>
            {expandedSection === 'active-members' && (
              <div className="space-y-3 p-3">
                {['设计师小明', '插画师小陈', '数字艺术家小张', '品牌设计师老王', '策展人李四', '游戏爱好者王五'].map((name, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 opacity-90 hover:opacity-100 cursor-pointer transition-colors hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md p-1.5"
                    onClick={() => handleUserClick(name)}
                  >
                      <div className="relative">
                        <TianjinAvatar 
                          size="sm" 
                          src="" 
                          alt={name} 
                          className="w-8 h-8 cursor-pointer" 
                        />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                      </div>
                      <span 
                        className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} cursor-pointer`}
                      >
                        {name}
                      </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 响应式板块：近期活动 */}
          <div className="rounded-lg overflow-hidden">
            <button 
              className="w-full flex items-center justify-between px-4 py-3 transition-all duration-200" 
              onClick={() => toggleSection('events')}
            >
              <h4 className={`font-bold text-sm uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  近期活动
              </h4>
              <i className={`fas fa-chevron-down transition-transform duration-200 ${expandedSection === 'events' ? 'transform rotate-180' : ''}`}></i>
            </button>
            {expandedSection === 'events' && (
              <div className="space-y-3 p-3">
                {[
                  { title: 'Apex表情包创作大赛', date: '2026-01-25' },
                  { title: '新赛季组队活动', date: '2026-01-30' },
                  { title: '社群周年庆典', date: '2026-02-07' }
                ].map((event, index) => (
                  <div key={index} className={`p-3 rounded-lg transition-colors cursor-pointer ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}>
                    <div className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {event.title}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {event.date}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 管理员功能区 - 响应式设计 */}
      {isAdmin && (
        <div className={`mt-auto mb-6 p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`font-bold text-sm uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              管理功能
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
              <i className="fas fa-users text-xs"></i>
              <span>管理成员</span>
            </button>
            <button className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
              <i className="fas fa-bullhorn text-xs"></i>
              <span>发布公告</span>
            </button>
            <button className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-900'}`}>
              <i className="fas fa-shield-alt text-xs"></i>
              <span>审核管理</span>
            </button>
            <button className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
              <i className="fas fa-cog text-xs"></i>
              <span>社群设置</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
