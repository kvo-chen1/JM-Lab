import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import OperationHistory from './OperationHistory';

// 作品统计接口
interface WorkStats {
  totalWorks: number;
  totalLikes: number;
  totalViews: number;
  totalComments: number;
  draftCount: number;
}

// 近期活动接口
interface RecentActivity {
  id: string;
  type: 'like' | 'comment' | 'message' | 'follow';
  user: string;
  userAvatar: string;
  content: string;
  timestamp: Date;
  workId?: string;
  workTitle?: string;
}

// 社群消息接口
interface CommunityMessage {
  id: string;
 社群名称: string;
  sender: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
}

const CreatorDashboard: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [workStats, setWorkStats] = useState<WorkStats>({
    totalWorks: 0,
    totalLikes: 0,
    totalViews: 0,
    totalComments: 0,
    draftCount: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [communityMessages, setCommunityMessages] = useState<CommunityMessage[]>([]);
  
  // 引用面板和切换按钮元素
  const dashboardRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  // 模拟数据 - 实际项目中应从API获取
  useEffect(() => {
    // 初始化为空数据，等待真实数据接入
    const emptyWorkStats: WorkStats = {
      totalWorks: 0,
      totalLikes: 0,
      totalViews: 0,
      totalComments: 0,
      draftCount: 0
    };

    const emptyActivities: RecentActivity[] = [];
    const emptyMessages: CommunityMessage[] = [];

    // 更新状态
    setWorkStats(emptyWorkStats);
    setRecentActivities(emptyActivities);
    setCommunityMessages(emptyMessages);
  }, []);
  
  // 添加点击外部关闭面板的功能
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 如果面板可见，且点击位置不在面板内，也不在切换按钮内，则关闭面板
      if (
        isVisible &&
        dashboardRef.current &&
        !dashboardRef.current.contains(event.target as Node) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };
    
    // 添加事件监听器
    document.addEventListener('mousedown', handleClickOutside);
    
    // 清理事件监听器
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);

  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else {
      return `${days}天前`;
    }
  };

  // 获取活动图标
  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'like':
        return 'fas fa-heart text-red-500';
      case 'comment':
        return 'fas fa-comment text-blue-500';
      case 'message':
        return 'fas fa-envelope text-green-500';
      case 'follow':
        return 'fas fa-user-plus text-purple-500';
      default:
        return 'fas fa-info-circle text-gray-500';
    }
  };

  // 获取活动图标颜色
  const getActivityIconColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'like':
        return 'bg-red-500';
      case 'comment':
        return 'bg-blue-500';
      case 'message':
        return 'bg-green-500';
      case 'follow':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="relative">
      {/* 切换按钮 */}
      <button
        ref={toggleBtnRef}
        onClick={() => setIsVisible(!isVisible)}
        className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${isDark ? 'hover:bg-gray-800 ring-1 ring-gray-700 text-gray-300 hover:text-white' : 'hover:bg-primary/5 ring-1 ring-gray-200 hover:ring-primary/20 text-gray-600 hover:text-primary'}`}
        title="查看创作者仪表盘"
      >
        <i className="fas fa-chart-line"></i>
      </button>

      {/* 创作者仪表盘面板 */}
      {isVisible && (
        <div 
          ref={dashboardRef}
          className={`absolute right-0 mt-2 p-4 ${isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700 dark:border-gray-600 shadow-primary/10' : 'bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 shadow-primary/5'} rounded-xl shadow-2xl w-full sm:w-80 md:w-96 z-50 overflow-hidden`}
          style={{ 
            animation: 'slideInRight 0.3s ease-out forwards',
            opacity: 0,
            transform: 'translateX(20px)',
            maxWidth: 'calc(100vw - 1rem)' // 确保在小屏幕上不超出视口
          }}
        >
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white flex items-center">
            <i className="fas fa-rocket mr-2 text-purple-500"></i>
            创作者仪表盘
          </h3>
          
          {/* 作品概览 */}
          <div className="mb-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-300">作品概览</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 transform hover:-translate-y-0.5 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">总作品</p>
                  <i className="fas fa-image text-purple-500 text-xs"></i>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{workStats.totalWorks}</p>
                  <span className="text-xs text-green-500 flex items-center">
                    <i className="fas fa-arrow-up mr-0.5"></i>
                    12.5%
                  </span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 transform hover:-translate-y-0.5 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">总点赞</p>
                  <i className="fas fa-heart text-red-500 text-xs"></i>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{workStats.totalLikes}</p>
                  <span className="text-xs text-green-500 flex items-center">
                    <i className="fas fa-arrow-up mr-0.5"></i>
                    8.2%
                  </span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 transform hover:-translate-y-0.5 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">总浏览</p>
                  <i className="fas fa-eye text-blue-500 text-xs"></i>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{workStats.totalViews.toLocaleString()}</p>
                  <span className="text-xs text-green-500 flex items-center">
                    <i className="fas fa-arrow-up mr-0.5"></i>
                    15.7%
                  </span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 transform hover:-translate-y-0.5 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">总评论</p>
                  <i className="fas fa-comment text-yellow-500 text-xs"></i>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{workStats.totalComments}</p>
                  <span className="text-xs text-red-500 flex items-center">
                    <i className="fas fa-arrow-down mr-0.5"></i>
                    2.1%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 创作进度 */}
          <div className="mb-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300">创作进度</h4>
              <span className="text-xs text-purple-600 dark:text-purple-400 flex items-center">
                <i className="fas fa-file-alt mr-1"></i>
                {workStats.draftCount} 个草稿
              </span>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3.5 overflow-hidden shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 h-3.5 rounded-full transition-all duration-1500 ease-out shadow-lg relative"
                    style={{ width: `${Math.min((workStats.totalWorks / 20) * 100, 100)}%` }}
                  >
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white dark:bg-gray-900 rounded-full border-2 border-purple-500 shadow-md animate-pulse"></div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 transform translate-y-1/2 translate-x-1/2 bg-white dark:bg-gray-900 px-2 py-0.5 rounded-full text-xs font-medium text-purple-600 dark:text-purple-400 shadow-md">
                  {Math.min(Math.round((workStats.totalWorks / 20) * 100), 100)}%
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  已完成 <span className="font-semibold text-gray-700 dark:text-gray-200">{workStats.totalWorks}</span> 个作品
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  目标 <span className="font-semibold text-gray-700 dark:text-gray-200">20</span> 个作品
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-gray-600 dark:text-gray-300">本周新增 2 个</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-gray-600 dark:text-gray-300">进度提升 10%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 操作历史 */}
          <div className="mb-4">
            <OperationHistory />
          </div>

          {/* 近期活动 */}
          <div className="mb-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-300 flex items-center">
              <i className="fas fa-bell text-purple-500 mr-2"></i>
              近期活动
            </h4>
            <div className="space-y-3 max-h-36 sm:max-h-44 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent scroll-smooth">
              {recentActivities.map(activity => (
                <div 
                  key={activity.id} 
                  className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 cursor-pointer transform hover:translate-x-1 border border-gray-100 dark:border-gray-700"
                  onClick={() => {
                    if (activity.workId) {
                      navigate(`/explore/${activity.workId}`);
                      setIsVisible(false); // 关闭面板
                    } else if (activity.type === 'follow') {
                      navigate('/dashboard/followers'); // 跳转到关注者页面
                      setIsVisible(false); // 关闭面板
                    }
                  }}
                >
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <img 
                        src={activity.userAvatar} 
                        alt={activity.user} 
                        className="w-7 h-7 rounded-full object-cover ring-2 ring-purple-100 dark:ring-purple-900"
                      />
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${getActivityIconColor(activity.type)}`}></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed">
                      <span className="font-medium">{activity.user}</span> 
                      <span className="text-gray-600 dark:text-gray-400">{activity.content}</span>
                      {activity.workTitle && (
                        <span className="text-purple-600 dark:text-purple-400 ml-1 hover:underline font-medium">{activity.workTitle}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center">
                      <i className="far fa-clock mr-1"></i>
                      {formatTime(activity.timestamp)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <i className={`${getActivityIcon(activity.type)} text-sm flex-shrink-0 mt-0.5 opacity-80`}></i>
                  </div>
                </div>
              ))}
              {recentActivities.length === 0 && (
                <div className="text-center py-6 text-xs text-gray-500 dark:text-gray-400">
                  <i className="fas fa-inbox mb-2 text-2xl opacity-50"></i>
                  <p>暂无近期活动</p>
                </div>
              )}
            </div>
          </div>

          {/* 社群消息 */}
          <div className="mb-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-300 flex items-center">
              <i className="fas fa-comments text-blue-500 mr-2"></i>
              社群消息
            </h4>
            <div className="space-y-3 max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent scroll-smooth">
              {communityMessages.map(message => (
                <div 
                  key={message.id} 
                  className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 cursor-pointer transform hover:translate-x-1 border border-gray-100 dark:border-gray-700"
                  onClick={() => {
                    navigate('/community');
                    setIsVisible(false); // 关闭面板
                  }}
                >
                  <div className="flex-shrink-0">
                    <img 
                      src={message.senderAvatar} 
                      alt={message.sender} 
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-100 dark:ring-blue-900"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium truncate">
                        {message.社群名称}
                      </p>
                      <span className="text-xs text-green-500">
                        <i className="fas fa-circle text-[6px]"></i>
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate leading-relaxed mb-1">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{message.sender}:</span> {message.content}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center">
                      <i className="far fa-clock mr-1"></i>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              {communityMessages.length === 0 && (
                <div className="text-center py-6 text-xs text-gray-500 dark:text-gray-400">
                  <i className="fas fa-comments-slash mb-2 text-2xl opacity-50"></i>
                  <p>暂无社群消息</p>
                </div>
              )}
            </div>
          </div>

          {/* 快速操作 */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-300">快速操作</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  navigate('/create');
                  setIsVisible(false); // 关闭面板
                }}
                className="group px-3 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-1 hover:shadow-xl hover:shadow-purple/20 transform hover:-translate-y-0.5 active:scale-95"
                title="创建新作品"
              >
                <i className="fas fa-plus text-sm group-hover:rotate-90 transition-transform duration-300"></i>
                <span className="text-xs sm:text-sm">创作</span>
              </button>
              <button
                onClick={() => {
                  navigate('/dashboard'); // 跳转到仪表盘
                  setIsVisible(false); // 关闭面板
                }}
                className="group px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-1 hover:shadow-xl hover:shadow-primary/10 transform hover:-translate-y-0.5 active:scale-95 border border-gray-100 dark:border-gray-700"
                title="查看作品管理"
              >
                <i className="fas fa-images text-sm text-purple-500 group-hover:scale-125 transition-transform duration-300"></i>
                <span className="text-xs sm:text-sm">作品</span>
              </button>
              <button
                onClick={() => {
                  navigate('/dashboard/stats'); // 跳转到统计页面
                  setIsVisible(false); // 关闭面板
                }}
                className="group px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-1 hover:shadow-xl hover:shadow-primary/10 transform hover:-translate-y-0.5 active:scale-95 border border-gray-100 dark:border-gray-700"
                title="查看数据分析"
              >
                <i className="fas fa-chart-line text-sm text-blue-500 group-hover:scale-125 transition-transform duration-300"></i>
                <span className="text-xs sm:text-sm">数据</span>
              </button>
              <button
                onClick={() => {
                  navigate('/community');
                  setIsVisible(false); // 关闭面板
                }}
                className="group px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-1 hover:shadow-xl hover:shadow-primary/10 transform hover:-translate-y-0.5 active:scale-95 border border-gray-100 dark:border-gray-700"
                title="查看社群消息"
              >
                <i className="fas fa-comments text-sm text-green-500 group-hover:scale-125 transition-transform duration-300"></i>
                <span className="text-xs sm:text-sm">社群</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 动画样式 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes slideInRight {
              from {
                opacity: 0;
                transform: translateX(20px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
            
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            .animate-fadeIn {
              animation: fadeIn 0.3s ease-out forwards;
            }
            
            /* 自定义滚动条 */
            ::-webkit-scrollbar {
              width: 4px;
            }
            
            ::-webkit-scrollbar-track {
              background: transparent;
            }
            
            ::-webkit-scrollbar-thumb {
              background-color: rgba(156, 163, 175, 0.5);
              border-radius: 20px;
            }
            
            ::-webkit-scrollbar-thumb:hover {
              background-color: rgba(156, 163, 175, 0.8);
            }
            
            /* 深色模式滚动条 */
            .dark ::-webkit-scrollbar-thumb {
              background-color: rgba(75, 85, 99, 0.5);
            }
            
            .dark ::-webkit-scrollbar-thumb:hover {
              background-color: rgba(75, 85, 99, 0.8);
            }
          `
        }}
      />
    </div>
  );
};

export default CreatorDashboard;
