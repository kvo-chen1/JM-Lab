import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { adminService } from '@/services/adminService';
import { supabaseAdmin } from '@/lib/supabaseClient';

interface Community {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  cover_image: string | null;
  member_count: number;
  posts_count: number;
  status: 'active' | 'inactive' | 'banned';
  created_at: string;
  updated_at: string;
  creator_id: string;
  creator_name?: string;
  category?: string;
}

interface CommunityMember {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
}

export default function CommunityManagement() {
  const { isDark } = useTheme();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'banned'>('all');
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // 获取社群列表
  const fetchCommunities = async () => {
    setLoading(true);
    try {
      // 先获取社群列表
      let query = supabaseAdmin
        .from('communities')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (statusFilter !== 'all') {
        const isActive = statusFilter === 'active';
        query = query.eq('is_active', isActive);
      }

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // 获取创建者信息
      const creatorIds = (data || []).map((item: any) => item.creator_id).filter(Boolean);
      let creatorMap: Record<string, any> = {};
      
      if (creatorIds.length > 0) {
        const { data: usersData, error: usersError } = await supabaseAdmin
          .from('users')
          .select('id, username, avatar_url')
          .in('id', creatorIds);
        
        if (!usersError && usersData) {
          creatorMap = usersData.reduce((acc: Record<string, any>, user: any) => {
            acc[user.id] = user;
            return acc;
          }, {});
        }
      }

      const formattedCommunities: Community[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        avatar_url: item.avatar,
        cover_image: item.cover_image,
        member_count: item.member_count || 0,
        posts_count: item.posts_count || 0,
        status: item.is_active ? 'active' : 'inactive',
        created_at: item.created_at,
        updated_at: item.updated_at,
        creator_id: item.creator_id,
        creator_name: creatorMap[item.creator_id]?.username || '未知用户',
        category: item.topic || '其他'
      }));

      setCommunities(formattedCommunities);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('获取社群列表失败:', error);
      toast.error('获取社群列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取社群成员
  const fetchCommunityMembers = async (communityId: string) => {
    setMembersLoading(true);
    try {
      const { data, error } = await supabaseAdmin
        .from('community_members')
        .select('*')
        .eq('community_id', communityId)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      // 获取用户信息
      const userIds = (data || []).map((item: any) => item.user_id).filter(Boolean);
      let userMap: Record<string, any> = {};
      
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabaseAdmin
          .from('users')
          .select('id, username, avatar_url')
          .in('id', userIds);
        
        if (!usersError && usersData) {
          userMap = usersData.reduce((acc: Record<string, any>, user: any) => {
            acc[user.id] = user;
            return acc;
          }, {});
        }
      }

      const formattedMembers: CommunityMember[] = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        username: userMap[item.user_id]?.username || '未知用户',
        avatar_url: userMap[item.user_id]?.avatar_url,
        role: item.role || 'member',
        joined_at: item.joined_at
      }));

      setMembers(formattedMembers);
    } catch (error) {
      console.error('获取社群成员失败:', error);
      toast.error('获取社群成员失败');
    } finally {
      setMembersLoading(false);
    }
  };

  // 更新社群状态
  const updateCommunityStatus = async (communityId: string, status: 'active' | 'inactive' | 'banned') => {
    try {
      const isActive = status === 'active';
      const { error } = await supabaseAdmin
        .from('communities')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', communityId);

      if (error) throw error;

      toast.success(`社群已${status === 'active' ? '启用' : '禁用'}`);
      fetchCommunities();
      
      if (selectedCommunity && selectedCommunity.id === communityId) {
        setSelectedCommunity({ ...selectedCommunity, status });
      }
    } catch (error) {
      console.error('更新社群状态失败:', error);
      toast.error('更新社群状态失败');
    }
  };

  // 删除社群
  const deleteCommunity = async (communityId: string) => {
    if (!confirm('确定要删除这个社群吗？此操作不可恢复！')) return;

    try {
      const { error } = await supabaseAdmin
        .from('communities')
        .delete()
        .eq('id', communityId);

      if (error) throw error;

      toast.success('社群已删除');
      fetchCommunities();
      setShowDetailModal(false);
    } catch (error) {
      console.error('删除社群失败:', error);
      toast.error('删除社群失败');
    }
  };

  // 移除成员
  const removeMember = async (memberId: string) => {
    if (!confirm('确定要移除这个成员吗？')) return;

    try {
      const { error } = await supabaseAdmin
        .from('community_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('成员已移除');
      if (selectedCommunity) {
        fetchCommunityMembers(selectedCommunity.id);
      }
    } catch (error) {
      console.error('移除成员失败:', error);
      toast.error('移除成员失败');
    }
  };

  // 查看社群详情
  const viewCommunityDetail = (community: Community) => {
    setSelectedCommunity(community);
    setShowDetailModal(true);
    fetchCommunityMembers(community.id);
  };

  useEffect(() => {
    fetchCommunities();
  }, [currentPage, statusFilter, searchQuery]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: '社群总数', value: totalCount, icon: 'users', color: 'blue' },
          { title: '活跃社群', value: communities.filter(c => c.status === 'active').length, icon: 'check-circle', color: 'green' },
          { title: '禁用社群', value: communities.filter(c => c.status === 'inactive').length, icon: 'pause-circle', color: 'yellow' },
          { title: '封禁社群', value: communities.filter(c => c.status === 'banned').length, icon: 'ban', color: 'red' }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.title}</p>
                <p className="text-2xl font-bold">{loading ? '-' : stat.value}</p>
              </div>
              <div className={`p-3 rounded-full bg-${stat.color}-100 text-${stat.color}-600`}>
                <i className={`fas fa-${stat.icon} text-xl`}></i>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 筛选和搜索 */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
              <input
                type="text"
                placeholder="搜索社群名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full px-4 py-2 pl-10 rounded-lg bg-transparent border-none outline-none ${isDark ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="all">全部状态</option>
            <option value="active">活跃</option>
            <option value="inactive">禁用</option>
            <option value="banned">封禁</option>
          </select>

          <button
            onClick={fetchCommunities}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            刷新
          </button>
        </div>
      </div>

      {/* 社群列表 */}
      <div className={`rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center">
            <i className="fas fa-spinner fa-spin text-2xl text-red-600"></i>
            <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>加载中...</p>
          </div>
        ) : communities.length === 0 ? (
          <div className="p-8 text-center">
            <i className="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>暂无社群数据</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">社群信息</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">创建者</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">成员数</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">帖子数</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">状态</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">创建时间</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {communities.map((community) => (
                    <tr key={community.id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={community.avatar_url || 'https://via.placeholder.com/40'}
                            alt={community.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium">{community.name}</p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate max-w-[200px]`}>
                              {community.description || '暂无描述'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{community.creator_name}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-medium">{community.member_count}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-medium">{community.posts_count}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          community.status === 'active' ? 'bg-green-100 text-green-700' :
                          community.status === 'inactive' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {community.status === 'active' ? '活跃' :
                           community.status === 'inactive' ? '禁用' : '封禁'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                          {new Date(community.created_at).toLocaleDateString('zh-CN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => viewCommunityDetail(community)}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                            title="查看详情"
                          >
                            <i className="fas fa-eye text-blue-500"></i>
                          </button>
                          {community.status === 'active' ? (
                            <button
                              onClick={() => updateCommunityStatus(community.id, 'inactive')}
                              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                              title="禁用"
                            >
                              <i className="fas fa-pause text-yellow-500"></i>
                            </button>
                          ) : (
                            <button
                              onClick={() => updateCommunityStatus(community.id, 'active')}
                              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                              title="启用"
                            >
                              <i className="fas fa-play text-green-500"></i>
                            </button>
                          )}
                          <button
                            onClick={() => deleteCommunity(community.id)}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                            title="删除"
                          >
                            <i className="fas fa-trash text-red-500"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  共 {totalCount} 条记录，第 {currentPage}/{totalPages} 页
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === 1
                        ? 'opacity-50 cursor-not-allowed'
                        : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === totalPages
                        ? 'opacity-50 cursor-not-allowed'
                        : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 社群详情弹窗 */}
      <AnimatePresence>
        {showDetailModal && selectedCommunity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
              onClick={e => e.stopPropagation()}
            >
              {/* 弹窗头部 */}
              <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={selectedCommunity.avatar_url || 'https://via.placeholder.com/80'}
                      alt={selectedCommunity.name}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    <div>
                      <h2 className="text-2xl font-bold">{selectedCommunity.name}</h2>
                      <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {selectedCommunity.description || '暂无描述'}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedCommunity.status === 'active' ? 'bg-green-100 text-green-700' :
                          selectedCommunity.status === 'inactive' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {selectedCommunity.status === 'active' ? '活跃' :
                           selectedCommunity.status === 'inactive' ? '禁用' : '封禁'}
                        </span>
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                          <i className="fas fa-users mr-1"></i>
                          {selectedCommunity.member_count} 成员
                        </span>
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                          <i className="fas fa-file-alt mr-1"></i>
                          {selectedCommunity.posts_count} 帖子
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>
              </div>

              {/* 弹窗内容 */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <h3 className="text-lg font-semibold mb-4">成员列表 ({members.length})</h3>
                
                {membersLoading ? (
                  <div className="text-center py-8">
                    <i className="fas fa-spinner fa-spin text-2xl text-red-600"></i>
                  </div>
                ) : members.length === 0 ? (
                  <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    暂无成员
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} flex items-center justify-between`}
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={member.avatar_url || 'https://via.placeholder.com/40'}
                            alt={member.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium">{member.username}</p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {member.role === 'admin' ? '管理员' :
                               member.role === 'moderator' ? '版主' : '成员'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            member.role === 'admin' ? 'bg-red-100 text-red-700' :
                            member.role === 'moderator' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {member.role === 'admin' ? '管理员' :
                             member.role === 'moderator' ? '版主' : '成员'}
                          </span>
                          <button
                            onClick={() => removeMember(member.id)}
                            className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                            title="移除成员"
                          >
                            <i className="fas fa-user-minus"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 弹窗底部 */}
              <div className={`p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3`}>
                {selectedCommunity.status === 'active' ? (
                  <button
                    onClick={() => updateCommunityStatus(selectedCommunity.id, 'inactive')}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                  >
                    <i className="fas fa-pause mr-2"></i>
                    禁用社群
                  </button>
                ) : (
                  <button
                    onClick={() => updateCommunityStatus(selectedCommunity.id, 'active')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <i className="fas fa-play mr-2"></i>
                    启用社群
                  </button>
                )}
                <button
                  onClick={() => deleteCommunity(selectedCommunity.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <i className="fas fa-trash mr-2"></i>
                  删除社群
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
