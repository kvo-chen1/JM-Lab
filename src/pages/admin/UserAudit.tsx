import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  is_new_user?: boolean;
  membership_level: string;
  membership_status: string;
  created_at: number;
  posts_count: number;
  likes_count: number;
  followers_count: number;
  following_count: number;
  tags?: string[];
  status?: 'active' | 'banned' | 'pending';
}

interface UserActivity {
  id: string;
  user_id: string;
  action_type: string;
  entity_type?: string;
  entity_id?: string;
  content?: string;
  created_at: number;
}

export default function UserAudit() {
  const { isDark } = useTheme();
  const { user: currentUser } = useContext(AuthContext);
  
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // 获取用户数据
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // 模拟API调用，实际项目中替换为真实API
        const response = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
        } else {
          // 模拟数据
          setUsers([
            {
              id: '1',
              username: 'user1',
              email: 'user1@example.com',
              avatar_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=User%20avatar%201',
              is_new_user: false,
              membership_level: 'free',
              membership_status: 'active',
              created_at: Date.now() - 86400000 * 7,
              posts_count: 15,
              likes_count: 89,
              followers_count: 23,
              following_count: 18,
              tags: ['设计', '国潮', '插画'],
              status: 'active'
            },
            {
              id: '2',
              username: 'user2',
              email: 'user2@example.com',
              avatar_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=User%20avatar%202',
              is_new_user: true,
              membership_level: 'premium',
              membership_status: 'active',
              created_at: Date.now() - 86400000 * 3,
              posts_count: 3,
              likes_count: 12,
              followers_count: 5,
              following_count: 10,
              tags: ['摄影', '传统文化'],
              status: 'pending'
            },
            {
              id: '3',
              username: 'user3',
              email: 'user3@example.com',
              avatar_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=User%20avatar%203',
              is_new_user: false,
              membership_level: 'vip',
              membership_status: 'active',
              created_at: Date.now() - 86400000 * 30,
              posts_count: 45,
              likes_count: 320,
              followers_count: 120,
              following_count: 80,
              tags: ['设计', 'UI', '国潮', '品牌'],
              status: 'active'
            },
            {
              id: '4',
              username: 'user4',
              email: 'user4@example.com',
              avatar_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=User%20avatar%204',
              is_new_user: false,
              membership_level: 'free',
              membership_status: 'expired',
              created_at: Date.now() - 86400000 * 15,
              posts_count: 8,
              likes_count: 45,
              followers_count: 12,
              following_count: 15,
              tags: ['插画', '传统纹样'],
              status: 'banned'
            }
          ]);
        }
      } catch (error) {
        console.error('获取用户数据失败:', error);
        toast.error('获取用户数据失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  // 获取用户活动
  const fetchUserActivities = async (userId: string) => {
    setActivitiesLoading(true);
    try {
      // 模拟API调用
      const response = await fetch(`/api/admin/users/${userId}/activities`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      } else {
        // 模拟数据
        setActivities([
          {
            id: '1',
            user_id: userId,
            action_type: 'register',
            created_at: Date.now() - 86400000 * 7
          },
          {
            id: '2',
            user_id: userId,
            action_type: 'create_post',
            entity_type: 'post',
            entity_id: 'post1',
            content: '发布了新作品：国潮插画设计',
            created_at: Date.now() - 86400000 * 6
          },
          {
            id: '3',
            user_id: userId,
            action_type: 'like_post',
            entity_type: 'post',
            entity_id: 'post2',
            content: '点赞了作品：传统纹样再创造',
            created_at: Date.now() - 86400000 * 5
          },
          {
            id: '4',
            user_id: userId,
            action_type: 'comment',
            entity_type: 'post',
            entity_id: 'post3',
            content: '评论：这个设计很有创意！',
            created_at: Date.now() - 86400000 * 4
          },
          {
            id: '5',
            user_id: userId,
            action_type: 'follow_user',
            entity_type: 'user',
            entity_id: 'user5',
            content: '关注了用户：设计师小明',
            created_at: Date.now() - 86400000 * 3
          }
        ]);
      }
    } catch (error) {
      console.error('获取用户活动失败:', error);
      toast.error('获取用户活动失败');
    } finally {
      setActivitiesLoading(false);
    }
  };
  
  // 处理用户状态变更
  const handleUserStatusChange = async (userId: string, status: 'active' | 'banned' | 'pending') => {
    try {
      // 模拟API调用
      await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      // 更新本地状态
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status } : user
      ));
      
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, status });
      }
      
      toast.success(`用户状态已更新为${status === 'active' ? '活跃' : status === 'banned' ? '禁用' : '待审核'}`);
    } catch (error) {
      console.error('更新用户状态失败:', error);
      toast.error('更新用户状态失败');
    }
  };
  
  // 处理用户选择
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    fetchUserActivities(user.id);
  };
  
  // 筛选和排序用户
  const filteredAndSortedUsers = users
    .filter(user => {
      if (filter !== 'all' && user.status !== filter) return false;
      if (searchTerm && !user.username.toLowerCase().includes(searchTerm.toLowerCase()) && !user.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let aValue = a[sortBy as keyof User];
      let bValue = b[sortBy as keyof User];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  
  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 获取活动类型的中文名称
  const getActivityTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      register: '注册',
      create_post: '发布作品',
      like_post: '点赞作品',
      comment: '发表评论',
      follow_user: '关注用户',
      update_profile: '更新资料',
      join_activity: '参加活动',
      create_activity: '创建活动'
    };
    return typeMap[type] || type;
  };
  
  // 获取状态标签样式
  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-600';
      case 'banned':
        return 'bg-red-100 text-red-600';
      case 'pending':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };
  
  // 获取状态中文名称
  const getStatusName = (status?: string) => {
    switch (status) {
      case 'active':
        return '活跃';
      case 'banned':
        return '禁用';
      case 'pending':
        return '待审核';
      default:
        return '未知';
    }
  };
  
  // 获取会员等级中文名称
  const getMembershipLevelName = (level: string) => {
    switch (level) {
      case 'free':
        return '免费会员';
      case 'premium':
        return '高级会员';
      case 'vip':
        return 'VIP会员';
      default:
        return level;
    }
  };
  
  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className={`w-12 h-12 border-4 ${isDark ? 'border-gray-600 border-t-red-600' : 'border-gray-200 border-t-red-600'} border-t-transparent rounded-full animate-spin`}></div>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>正在加载用户数据...</p>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
    >
      <div className="flex flex-col md:flex-row gap-6">
        {/* 左侧用户列表 */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold">用户审核</h2>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full px-4 py-2 flex-1 sm:flex-none sm:w-64`}>
                <input
                  type="text"
                  placeholder="搜索用户..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-sm"
                />
                <i className={`fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}></i>
              </div>
              
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className={`px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border`}
              >
                <option value="all">全部状态</option>
                <option value="active">活跃</option>
                <option value="banned">禁用</option>
                <option value="pending">待审核</option>
              </select>
            </div>
          </div>
          
          {/* 排序选项 */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-500">共 {filteredAndSortedUsers.length} 个用户</div>
            <div className="flex items-center gap-2">
              <span className="text-sm">排序：</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border`}
              >
                <option value="created_at">注册时间</option>
                <option value="username">用户名</option>
                <option value="posts_count">作品数</option>
                <option value="followers_count">粉丝数</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className={`p-1 rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              >
                <i className={`fas ${sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
              </button>
            </div>
          </div>
          
          {/* 用户列表 */}
          <div className={`overflow-y-auto max-h-[calc(100vh-300px)] rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <table className="min-w-full">
              <thead>
                <tr className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
                  <th className="px-4 py-3 text-left text-sm font-medium">用户信息</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">会员等级</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">注册时间</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredAndSortedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center">
                      <div className="text-gray-400">
                        <i className="fas fa-users text-4xl mb-2"></i>
                        <p>暂无符合条件的用户</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedUsers.map((user) => (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-gray-700/50 cursor-pointer ${selectedUser?.id === user.id ? (isDark ? 'bg-gray-700/30' : 'bg-gray-50') : ''}`}
                      onClick={() => handleUserSelect(user)}
                    >
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center">
                          <img 
                            src={user.avatar_url || `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=User%20avatar%20${user.username}`} 
                            alt={user.username} 
                            className="w-10 h-10 rounded-full mr-3" 
                          />
                          <div>
                            <div className="font-medium">{user.username}</div>
                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${user.membership_level === 'free' ? 'bg-gray-100 text-gray-600' : user.membership_level === 'premium' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                          {getMembershipLevelName(user.membership_level)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(user.status)}`}>
                          {getStatusName(user.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUserStatusChange(user.id, user.status === 'active' ? 'banned' : 'active');
                          }}
                          className={`px-2 py-1 rounded text-xs ${user.status === 'active' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'} transition-colors`}
                        >
                          {user.status === 'active' ? '禁用' : '启用'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* 右侧用户详情 */}
        <div className="w-full md:w-1/3 min-w-0">
          <h3 className="text-lg font-bold mb-4">用户详情</h3>
          
          {selectedUser ? (
            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 h-full flex flex-col`}>
              {/* 用户基本信息 */}
              <div className="flex flex-col items-center mb-6">
                <img 
                  src={selectedUser.avatar_url || `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=User%20avatar%20${selectedUser.username}`} 
                  alt={selectedUser.username} 
                  className="w-24 h-24 rounded-full mb-4" 
                />
                <h4 className="text-xl font-bold">{selectedUser.username}</h4>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>{selectedUser.email}</p>
                
                <div className="flex gap-2 mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(selectedUser.status)}`}>
                    {getStatusName(selectedUser.status)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${selectedUser.membership_level === 'free' ? 'bg-gray-100 text-gray-600' : selectedUser.membership_level === 'premium' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                    {getMembershipLevelName(selectedUser.membership_level)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full text-center">
                  <div>
                    <div className="text-2xl font-bold">{selectedUser.posts_count}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>作品数</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{selectedUser.likes_count}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>获赞数</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{selectedUser.followers_count}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>粉丝数</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{selectedUser.following_count}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>关注数</div>
                  </div>
                </div>
              </div>
              
              {/* 用户标签 */}
              {selectedUser.tags && selectedUser.tags.length > 0 && (
                <div className="mb-6">
                  <h5 className="font-medium mb-2">兴趣标签</h5>
                  <div className="flex flex-wrap gap-1">
                    {selectedUser.tags.map((tag, index) => (
                      <span key={index} className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 用户状态管理 */}
              <div className="mb-6">
                <h5 className="font-medium mb-2">状态管理</h5>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleUserStatusChange(selectedUser.id, 'active')}
                    className={`flex-1 px-3 py-2 rounded text-sm bg-green-100 text-green-600 hover:bg-green-200 transition-colors`}
                  >
                    设为活跃
                  </button>
                  <button 
                    onClick={() => handleUserStatusChange(selectedUser.id, 'banned')}
                    className={`flex-1 px-3 py-2 rounded text-sm bg-red-100 text-red-600 hover:bg-red-200 transition-colors`}
                  >
                    禁用用户
                  </button>
                </div>
              </div>
              
              {/* 用户活动 */}
              <div className="flex-1 min-h-0">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="font-medium">近期活动</h5>
                  {activitiesLoading && (
                    <div className={`w-4 h-4 border-2 ${isDark ? 'border-gray-500 border-t-red-600' : 'border-gray-300 border-t-red-600'} border-t-transparent rounded-full animate-spin`}></div>
                  )}
                </div>
                
                <div className={`overflow-y-auto max-h-60 ${isDark ? 'bg-gray-600' : 'bg-gray-100'} rounded-lg p-3`}>
                  {activities.length === 0 ? (
                    <div className="text-center py-4">
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>暂无活动记录</p>
                    </div>
                  ) : (
                    activities.map((activity) => (
                      <div key={activity.id} className={`${isDark ? 'bg-gray-700' : 'bg-white'} rounded p-2 mb-2`}>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <i className={`fas fa-${getActivityIcon(activity.action_type)} mr-2 ${getActivityIconColor(activity.action_type)}`}></i>
                            <span className="font-medium">{getActivityTypeName(activity.action_type)}</span>
                          </div>
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {formatTime(activity.created_at)}
                          </span>
                        </div>
                        {activity.content && (
                          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {activity.content}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-12 text-center`}>
              <i className="fas fa-user-circle text-4xl mb-4 text-gray-400"></i>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>请选择一个用户查看详情</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// 辅助函数：获取活动图标
function getActivityIcon(actionType: string): string {
  const iconMap: Record<string, string> = {
    register: 'user-plus',
    create_post: 'file-image',
    like_post: 'thumbs-up',
    comment: 'comment',
    follow_user: 'user-friends',
    update_profile: 'user-edit',
    join_activity: 'calendar-plus',
    create_activity: 'calendar-plus'
  };
  return iconMap[actionType] || 'circle';
}

// 辅助函数：获取活动图标颜色
function getActivityIconColor(actionType: string): string {
  const colorMap: Record<string, string> = {
    register: 'text-green-500',
    create_post: 'text-blue-500',
    like_post: 'text-yellow-500',
    comment: 'text-purple-500',
    follow_user: 'text-pink-500',
    update_profile: 'text-orange-500',
    join_activity: 'text-red-500',
    create_activity: 'text-red-500'
  };
  return colorMap[actionType] || 'text-gray-500';
}