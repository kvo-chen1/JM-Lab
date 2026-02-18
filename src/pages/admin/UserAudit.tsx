import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { supabaseAdmin } from '@/lib/supabaseClient';
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
  last_login_at?: number;
  login_count?: number;
  ip_address?: string;
  location?: string;
  device_info?: string;
}

interface UserActivity {
  id: string;
  user_id: string;
  action_type: string;
  entity_type?: string;
  entity_id?: string;
  content?: string;
  created_at: number;
  ip_address?: string;
  user_agent?: string;
  risk_level?: 'low' | 'medium' | 'high';
}

interface LoginHistory {
  id: string;
  user_id: string;
  login_at: number;
  ip_address: string;
  location: string;
  device: string;
  browser: string;
  os: string;
  status: 'success' | 'failed';
  failure_reason?: string;
}

interface AnomalyEvent {
  id: string;
  user_id: string;
  type: 'rapid_login' | 'unusual_location' | 'suspicious_activity' | 'multiple_devices' | 'brute_force';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected_at: number;
  resolved: boolean;
}

export default function UserAudit() {
  const { isDark } = useTheme();
  const { user: currentUser } = useContext(AuthContext);
  
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'activities' | 'login' | 'anomalies'>('activities');
  const [showAnomalyModal, setShowAnomalyModal] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyEvent | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    bannedUsers: 0,
    anomaliesToday: 0
  });
  
  // 获取用户数据
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // 从 Supabase 获取真实用户数据
        const { data: usersData, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('获取用户数据失败:', error);
          toast.error('获取用户数据失败');
          return;
        }
        
        // 获取用户的作品数量
        const { data: worksData } = await supabaseAdmin
          .from('works')
          .select('creator_id');
        
        // 获取用户的点赞数量
        const { data: likesData } = await supabaseAdmin
          .from('likes')
          .select('user_id');
        
        // 获取用户的关注关系
        const { data: followsData } = await supabaseAdmin
          .from('follows')
          .select('follower_id, following_id');
        
        // 计算今日开始时间
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = today.getTime();
        
        // 转换数据格式
        const formattedUsers: User[] = usersData?.map((user: any) => {
          const userWorks = worksData?.filter(w => w.creator_id === user.id) || [];
          const userLikes = likesData?.filter(l => l.user_id === user.id) || [];
          const userFollowers = followsData?.filter(f => f.following_id === user.id) || [];
          const userFollowing = followsData?.filter(f => f.follower_id === user.id) || [];
          
          return {
            id: user.id,
            username: user.username || user.name || '未命名用户',
            email: user.email || '',
            avatar_url: user.avatar_url,
            is_new_user: user.created_at > Date.now() - 86400000 * 7, // 7天内注册为新用户
            membership_level: user.membership_level || 'free',
            membership_status: user.membership_status || 'active',
            created_at: user.created_at,
            posts_count: userWorks.length,
            likes_count: userLikes.length,
            followers_count: userFollowers.length,
            following_count: userFollowing.length,
            tags: user.tags || [],
            status: user.status || 'active',
            last_login_at: user.last_login_at,
            login_count: user.login_count || 0,
            ip_address: user.last_ip_address,
            location: user.location,
            device_info: user.last_device_info
          };
        }) || [];
        
        setUsers(formattedUsers);
        
        // 计算统计数据
        setStats({
          totalUsers: formattedUsers.length,
          activeUsers: formattedUsers.filter(u => u.status === 'active').length,
          newUsersToday: formattedUsers.filter(u => u.created_at >= todayTimestamp).length,
          bannedUsers: formattedUsers.filter(u => u.status === 'banned').length,
          anomaliesToday: 0 // 后续计算
        });
        
        // 检测异常事件
        detectAnomalies(formattedUsers);
        
      } catch (error) {
        console.error('获取用户数据失败:', error);
        toast.error('获取用户数据失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  // 检测异常事件
  const detectAnomalies = (userList: User[]) => {
    const detectedAnomalies: AnomalyEvent[] = [];
    
    userList.forEach(user => {
      // 检测短时间内多次登录
      if (user.login_count && user.login_count > 50 && user.created_at > Date.now() - 86400000 * 7) {
        detectedAnomalies.push({
          id: `anomaly_${user.id}_rapid`,
          user_id: user.id,
          type: 'rapid_login',
          description: `用户 ${user.username} 在短时间内有 ${user.login_count} 次登录记录`,
          severity: 'medium',
          detected_at: Date.now(),
          resolved: false
        });
      }
      
      // 检测异常关注行为
      if (user.following_count > 500 && user.posts_count < 5) {
        detectedAnomalies.push({
          id: `anomaly_${user.id}_follow`,
          user_id: user.id,
          type: 'suspicious_activity',
          description: `用户 ${user.username} 关注数(${user.following_count})远大于作品数(${user.posts_count})`,
          severity: 'high',
          detected_at: Date.now(),
          resolved: false
        });
      }
      
      // 检测未知地区登录
      if (user.location && user.location.includes('未知')) {
        detectedAnomalies.push({
          id: `anomaly_${user.id}_location`,
          user_id: user.id,
          type: 'unusual_location',
          description: `用户 ${user.username} 从未知地区登录`,
          severity: 'medium',
          detected_at: Date.now(),
          resolved: false
        });
      }
    });
    
    setAnomalies(detectedAnomalies);
    setStats(prev => ({ ...prev, anomaliesToday: detectedAnomalies.length }));
  };
  
  // 获取用户活动
  const fetchUserActivities = async (userId: string) => {
    setActivitiesLoading(true);
    try {
      // 从审计日志获取用户活动
      const { data: auditLogs, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('获取用户活动失败:', error);
        setActivities([]);
        return;
      }
      
      // 转换数据格式
      const formattedActivities: UserActivity[] = auditLogs?.map((log: any) => ({
        id: log.id,
        user_id: userId,
        action_type: log.operation_type?.toLowerCase() || 'unknown',
        entity_type: log.table_name,
        entity_id: log.record_id,
        content: log.details || `${log.operation_type} 操作`,
        created_at: log.created_at,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        risk_level: log.is_sensitive ? 'high' : 'low'
      })) || [];
      
      setActivities(formattedActivities);
    } catch (error) {
      console.error('获取用户活动失败:', error);
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };
  
  // 获取登录历史
  const fetchLoginHistory = async (userId: string) => {
    setActivitiesLoading(true);
    try {
      // 从登录日志表获取（如果存在）
      const { data: loginLogs, error } = await supabaseAdmin
        .from('login_logs')
        .select('*')
        .eq('user_id', userId)
        .order('login_at', { ascending: false })
        .limit(20);
      
      if (error) {
        // 如果表不存在，使用用户表中的最后登录信息
        const user = users.find(u => u.id === userId);
        if (user && user.last_login_at) {
          setLoginHistory([{
            id: `login_${userId}`,
            user_id: userId,
            login_at: user.last_login_at,
            ip_address: user.ip_address || '未知',
            location: user.location || '未知',
            device: user.device_info?.split('/')[0]?.trim() || '未知',
            browser: user.device_info?.split('/')[1]?.trim() || '未知',
            os: '未知',
            status: 'success'
          }]);
        } else {
          setLoginHistory([]);
        }
        return;
      }
      
      const formattedHistory: LoginHistory[] = loginLogs?.map((log: any) => ({
        id: log.id,
        user_id: userId,
        login_at: log.login_at,
        ip_address: log.ip_address || '未知',
        location: log.location || '未知',
        device: log.device || '未知',
        browser: log.browser || '未知',
        os: log.os || '未知',
        status: log.status || 'success',
        failure_reason: log.failure_reason
      })) || [];
      
      setLoginHistory(formattedHistory);
    } catch (error) {
      console.error('获取登录历史失败:', error);
      setLoginHistory([]);
    } finally {
      setActivitiesLoading(false);
    }
  };
  
  // 获取异常事件
  const fetchAnomalies = async (userId: string) => {
    // 从已检测的异常中筛选
    const userAnomalies = anomalies.filter(a => a.user_id === userId);
    setAnomalies(userAnomalies);
  };
  
  // 处理用户状态变更
  const handleUserStatusChange = async (userId: string, status: 'active' | 'banned' | 'pending') => {
    try {
      // 更新 Supabase 中的用户状态
      const { error } = await supabaseAdmin
        .from('users')
        .update({ status })
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
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
    fetchLoginHistory(user.id);
    fetchAnomalies(user.id);
  };
  
  // 处理异常事件解决
  const handleResolveAnomaly = async (anomalyId: string) => {
    try {
      setAnomalies(prev => prev.map(a => 
        a.id === anomalyId ? { ...a, resolved: true } : a
      ));
      
      toast.success('异常事件已标记为已解决');
      setShowAnomalyModal(false);
    } catch (error) {
      console.error('解决异常事件失败:', error);
      toast.error('解决异常事件失败');
    }
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
  
  // 格式化相对时间
  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;
    return formatTime(timestamp);
  };
  
  // 获取风险等级颜色
  const getRiskLevelColor = (level?: string) => {
    switch (level) {
      case 'high': return 'text-red-500 bg-red-50';
      case 'medium': return 'text-yellow-500 bg-yellow-50';
      case 'low': return 'text-green-500 bg-green-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };
  
  // 获取风险等级标签
  const getRiskLevelLabel = (level?: string) => {
    switch (level) {
      case 'high': return '高风险';
      case 'medium': return '中风险';
      case 'low': return '低风险';
      default: return '正常';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: '总用户数', value: stats.totalUsers, icon: 'users', color: 'blue' },
          { label: '活跃用户', value: stats.activeUsers, icon: 'user-check', color: 'green' },
          { label: '今日新用户', value: stats.newUsersToday, icon: 'user-plus', color: 'yellow' },
          { label: '禁用用户', value: stats.bannedUsers, icon: 'user-slash', color: 'red' },
          { label: '今日异常', value: stats.anomaliesToday, icon: 'exclamation-triangle', color: 'purple' }
        ].map((stat, index) => (
          <div key={index} className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full bg-${stat.color}-100 text-${stat.color}-600`}>
                <i className={`fas fa-${stat.icon} text-lg`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 筛选和搜索 */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
              <input
                type="text"
                placeholder="搜索用户名或邮箱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-transparent border-none outline-none text-sm"
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border`}
          >
            <option value="all">所有状态</option>
            <option value="active">活跃</option>
            <option value="pending">待审核</option>
            <option value="banned">禁用</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border`}
          >
            <option value="created_at">注册时间</option>
            <option value="last_login_at">最后登录</option>
            <option value="posts_count">作品数</option>
            <option value="followers_count">粉丝数</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
          >
            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
          </button>
        </div>
      </div>
      
      {/* 用户列表 */}
      <div className={`rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm overflow-hidden`}>
        <table className="min-w-full">
          <thead>
            <tr className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <th className="px-4 py-3 text-left text-sm font-medium">用户</th>
              <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium">会员</th>
              <th className="px-4 py-3 text-left text-sm font-medium">作品</th>
              <th className="px-4 py-3 text-left text-sm font-medium">粉丝</th>
              <th className="px-4 py-3 text-left text-sm font-medium">注册时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium">最后登录</th>
              <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center">
                  <i className="fas fa-spinner fa-spin text-2xl text-red-600"></i>
                </td>
              </tr>
            ) : filteredAndSortedUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center">
                  <div className="text-gray-400">
                    <i className="fas fa-inbox text-4xl mb-2"></i>
                    <p>暂无用户数据</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedUsers.map((user) => (
                <tr 
                  key={user.id} 
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${selectedUser?.id === user.id ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
                  onClick={() => handleUserSelect(user)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.avatar_url || '/default-avatar.png'} 
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-sm">{user.username}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.status === 'active' ? 'bg-green-100 text-green-600' :
                      user.status === 'banned' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {user.status === 'active' ? '活跃' : user.status === 'banned' ? '禁用' : '待审核'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.membership_level === 'vip' ? 'bg-purple-100 text-purple-600' :
                      user.membership_level === 'premium' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {user.membership_level === 'vip' ? 'VIP' : user.membership_level === 'premium' ? '高级' : '免费'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{user.posts_count}</td>
                  <td className="px-4 py-3 text-sm">{user.followers_count}</td>
                  <td className="px-4 py-3 text-sm">{formatRelativeTime(user.created_at)}</td>
                  <td className="px-4 py-3 text-sm">{user.last_login_at ? formatRelativeTime(user.last_login_at) : '从未'}</td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                      {user.status !== 'active' && (
                        <button
                          onClick={() => handleUserStatusChange(user.id, 'active')}
                          className="p-1.5 rounded bg-green-100 text-green-600 hover:bg-green-200"
                          title="启用"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      )}
                      {user.status !== 'banned' && (
                        <button
                          onClick={() => handleUserStatusChange(user.id, 'banned')}
                          className="p-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200"
                          title="禁用"
                        >
                          <i className="fas fa-ban"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* 用户详情弹窗 */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
            >
              {/* 弹窗头部 */}
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                  <img 
                    src={selectedUser.avatar_url || '/default-avatar.png'} 
                    alt={selectedUser.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-bold">{selectedUser.username}</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              {/* 标签切换 */}
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex space-x-4">
                  {[
                    { id: 'activities', label: '活动记录', icon: 'history' },
                    { id: 'login', label: '登录历史', icon: 'sign-in-alt' },
                    { id: 'anomalies', label: '异常事件', icon: 'exclamation-triangle' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`pb-2 px-2 text-sm font-medium transition-colors relative ${
                        activeTab === tab.id
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                      }`}
                    >
                      <i className={`fas fa-${tab.icon} mr-2`}></i>
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="userAuditTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 内容区域 */}
              <div className="p-6">
                {activitiesLoading ? (
                  <div className="text-center py-8">
                    <i className="fas fa-spinner fa-spin text-2xl text-red-600"></i>
                  </div>
                ) : (
                  <>
                    {/* 活动记录 */}
                    {activeTab === 'activities' && (
                      <div className="space-y-4">
                        {activities.length === 0 ? (
                          <p className="text-center text-gray-400 py-8">暂无活动记录</p>
                        ) : (
                          activities.map((activity) => (
                            <div key={activity.id} className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{activity.content}</span>
                                <span className={`px-2 py-1 rounded-full text-xs ${getRiskLevelColor(activity.risk_level)}`}>
                                  {getRiskLevelLabel(activity.risk_level)}
                                </span>
                              </div>
                              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <span>{formatTime(activity.created_at)}</span>
                                {activity.ip_address && <span className="ml-4">IP: {activity.ip_address}</span>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    
                    {/* 登录历史 */}
                    {activeTab === 'login' && (
                      <div className="space-y-4">
                        {loginHistory.length === 0 ? (
                          <p className="text-center text-gray-400 py-8">暂无登录记录</p>
                        ) : (
                          loginHistory.map((login) => (
                            <div key={login.id} className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{login.location}</span>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  login.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                }`}>
                                  {login.status === 'success' ? '成功' : '失败'}
                                </span>
                              </div>
                              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <p>{login.browser} / {login.os}</p>
                                <p>{login.device} • IP: {login.ip_address}</p>
                                <p>{formatTime(login.login_at)}</p>
                                {login.failure_reason && <p className="text-red-500">失败原因: {login.failure_reason}</p>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    
                    {/* 异常事件 */}
                    {activeTab === 'anomalies' && (
                      <div className="space-y-4">
                        {anomalies.filter(a => a.user_id === selectedUser.id).length === 0 ? (
                          <p className="text-center text-gray-400 py-8">暂无异常事件</p>
                        ) : (
                          anomalies.filter(a => a.user_id === selectedUser.id).map((anomaly) => (
                            <div key={anomaly.id} className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{anomaly.description}</span>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  anomaly.severity === 'critical' ? 'bg-red-100 text-red-600' :
                                  anomaly.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                                  anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                  'bg-blue-100 text-blue-600'
                                }`}>
                                  {anomaly.severity === 'critical' ? '严重' : anomaly.severity === 'high' ? '高' : anomaly.severity === 'medium' ? '中' : '低'}
                                </span>
                              </div>
                              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <p>检测时间: {formatTime(anomaly.detected_at)}</p>
                                <p>状态: {anomaly.resolved ? '已解决' : '未解决'}</p>
                              </div>
                              {!anomaly.resolved && (
                                <button
                                  onClick={() => handleResolveAnomaly(anomaly.id)}
                                  className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                >
                                  标记为已解决
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
