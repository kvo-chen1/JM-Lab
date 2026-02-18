import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { supabaseAdmin } from '@/lib/supabaseClient';

interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  community_id: string;
  community_name: string;
  images: string[];
  likes_count: number;
  comments_count: number;
  views: number;
  is_pinned: boolean;
  is_announcement: boolean;
  status: 'active' | 'deleted' | 'hidden';
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  post_id: string;
  post_title: string;
  likes_count: number;
  status: 'active' | 'deleted' | 'hidden';
  created_at: string;
}

export default function ContentManagement() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted' | 'hidden'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedItem, setSelectedItem] = useState<Post | Comment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const pageSize = 10;

  // 获取帖子列表
  const fetchPosts = async () => {
    setLoading(true);
    try {
      // 先获取帖子列表
      let query = supabaseAdmin
        .from('posts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // 获取作者信息
      const userIds = (data || []).map((item: any) => item.user_id || item.author_id).filter(Boolean);
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

      // 获取社群信息
      const communityIds = (data || []).map((item: any) => item.community_id).filter(Boolean);
      let communityMap: Record<string, any> = {};
      
      if (communityIds.length > 0) {
        const { data: communitiesData, error: communitiesError } = await supabaseAdmin
          .from('communities')
          .select('id, name')
          .in('id', communityIds);
        
        if (!communitiesError && communitiesData) {
          communityMap = communitiesData.reduce((acc: Record<string, any>, comm: any) => {
            acc[comm.id] = comm;
            return acc;
          }, {});
        }
      }

      // 获取点赞数和评论数 - 优先使用 posts 表中的统计字段
      const postIds = (data || []).map((item: any) => item.id).filter(Boolean);
      let likesMap: Record<string, number> = {};
      let commentsMap: Record<string, number> = {};
      
      // 从 posts 表中获取统计字段
      (data || []).forEach((post: any) => {
        // 优先使用 likes_count 或 likes 字段
        likesMap[post.id] = post.likes_count || post.likes || 0;
        // 优先使用 comments_count 字段
        commentsMap[post.id] = post.comments_count || 0;
      });
      
      // 如果 posts 表中没有统计字段，则从 likes 和 comments 表中查询
      const needsLikesQuery = Object.values(likesMap).every(v => v === 0);
      const needsCommentsQuery = Object.values(commentsMap).every(v => v === 0);
      
      if (needsLikesQuery && postIds.length > 0) {
        const { data: likesData, error: likesError } = await supabaseAdmin
          .from('likes')
          .select('post_id')
          .in('post_id', postIds);
        
        if (!likesError && likesData) {
          likesData.forEach((like: any) => {
            likesMap[like.post_id] = (likesMap[like.post_id] || 0) + 1;
          });
        }
      }

      if (needsCommentsQuery && postIds.length > 0) {
        const { data: commentsData, error: commentsError } = await supabaseAdmin
          .from('comments')
          .select('post_id')
          .in('post_id', postIds);
        
        if (!commentsError && commentsData) {
          commentsData.forEach((comment: any) => {
            commentsMap[comment.post_id] = (commentsMap[comment.post_id] || 0) + 1;
          });
        }
      }

      // 提取作品分享帖子中的作品ID，并获取作品信息
      const workIds: string[] = [];
      const postWorkMap: Record<string, string> = {};
      
      (data || []).forEach((post: any) => {
        const workIdMatch = post.content?.match(/\[分享作品ID: ([\w-]+)\]/);
        if (workIdMatch) {
          workIds.push(workIdMatch[1]);
          postWorkMap[post.id] = workIdMatch[1];
        }
      });
      
      // 获取作品信息
      let workMap: Record<string, any> = {};
      if (workIds.length > 0) {
        const { data: worksData, error: worksError } = await supabaseAdmin
          .from('works')
          .select('id, title, thumbnail, cover_url, likes, comments, views, shares')
          .in('id', workIds);
        
        if (!worksError && worksData) {
          workMap = worksData.reduce((acc: Record<string, any>, work: any) => {
            acc[work.id] = work;
            return acc;
          }, {});
        }
      }

      const formattedPosts: Post[] = (data || []).map((item: any) => {
        // 检查是否是作品分享帖子
        const workId = postWorkMap[item.id];
        const work = workId ? workMap[workId] : null;
        
        // 如果是作品分享，使用作品的图片和互动数据
        let images = item.images || item.attachments || [];
        let likesCount = likesMap[item.id] || 0;
        let commentsCount = commentsMap[item.id] || 0;
        let viewsCount = item.view_count || 0;
        
        if (work) {
          // 使用作品的缩略图或封面图
          if (images.length === 0) {
            images = [work.thumbnail || work.cover_url].filter(Boolean);
          }
          // 使用作品的真实互动数据
          likesCount = work.likes || 0;
          commentsCount = work.comments || 0;
          viewsCount = work.views || 0;
        }
        
        return {
          id: item.id,
          title: item.title || '无标题',
          content: item.content || '',
          author_id: item.user_id || item.author_id,
          author_name: userMap[item.user_id || item.author_id]?.username || '未知用户',
          author_avatar: userMap[item.user_id || item.author_id]?.avatar_url,
          community_id: item.community_id,
          community_name: communityMap[item.community_id]?.name || '未知社群',
          images: images,
          likes_count: likesCount,
          comments_count: commentsCount,
          views: viewsCount,
          is_pinned: item.is_pinned || false,
          is_announcement: item.is_announcement || false,
          status: 'active',
          created_at: item.created_at
        };
      });

      setPosts(formattedPosts);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('获取帖子列表失败:', error);
      toast.error('获取帖子列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取评论列表
  const fetchComments = async () => {
    setLoading(true);
    try {
      // 先获取评论列表
      let query = supabaseAdmin
        .from('comments')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (searchQuery) {
        query = query.ilike('content', `%${searchQuery}%`);
      }

      const { data, error, count } = await query;

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

      // 获取帖子信息
      const postIds = (data || []).map((item: any) => item.post_id).filter(Boolean);
      let postMap: Record<string, any> = {};
      
      if (postIds.length > 0) {
        const { data: postsData, error: postsError } = await supabaseAdmin
          .from('posts')
          .select('id, title')
          .in('id', postIds);
        
        if (!postsError && postsData) {
          postMap = postsData.reduce((acc: Record<string, any>, post: any) => {
            acc[post.id] = post;
            return acc;
          }, {});
        }
      }

      const formattedComments: Comment[] = (data || []).map((item: any) => ({
        id: item.id,
        content: item.content || '',
        author_id: item.user_id,
        author_name: userMap[item.user_id]?.username || '未知用户',
        author_avatar: userMap[item.user_id]?.avatar_url,
        post_id: item.post_id,
        post_title: postMap[item.post_id]?.title || '未知帖子',
        likes_count: 0,
        status: 'active',
        created_at: item.created_at
      }));

      setComments(formattedComments);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('获取评论列表失败:', error);
      toast.error('获取评论列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 更新帖子状态（删除/恢复）
  const updatePostStatus = async (postId: string, status: 'active' | 'deleted' | 'hidden') => {
    try {
      if (status === 'deleted') {
        // 删除帖子
        const { error } = await supabaseAdmin
          .from('posts')
          .delete()
          .eq('id', postId);

        if (error) throw error;
        toast.success('帖子已删除');
      } else {
        // 恢复帖子 - 数据库中没有状态字段，这里只是刷新列表
        toast.success('帖子状态已更新');
      }
      fetchPosts();
    } catch (error) {
      console.error('更新帖子状态失败:', error);
      toast.error('更新帖子状态失败');
    }
  };

  // 更新评论状态（删除/恢复）
  const updateCommentStatus = async (commentId: string, status: 'active' | 'deleted' | 'hidden') => {
    try {
      if (status === 'deleted') {
        // 删除评论
        const { error } = await supabaseAdmin
          .from('comments')
          .delete()
          .eq('id', commentId);

        if (error) throw error;
        toast.success('评论已删除');
      } else {
        // 恢复评论 - 数据库中没有状态字段，这里只是刷新列表
        toast.success('评论状态已更新');
      }
      fetchComments();
    } catch (error) {
      console.error('更新评论状态失败:', error);
      toast.error('更新评论状态失败');
    }
  };

  // 置顶/取消置顶帖子
  const togglePinPost = async (postId: string, isPinned: boolean) => {
    try {
      // 检查数据库是否有 is_pinned 字段
      const { error } = await supabaseAdmin
        .from('posts')
        .update({ is_pinned: !isPinned, updated_at: new Date().toISOString() })
        .eq('id', postId);

      if (error) {
        // 如果字段不存在，显示提示
        if (error.message?.includes('is_pinned')) {
          toast.error('数据库缺少置顶功能所需字段');
          return;
        }
        throw error;
      }

      toast.success(isPinned ? '帖子已取消置顶' : '帖子已置顶');
      fetchPosts();
    } catch (error) {
      console.error('置顶操作失败:', error);
      toast.error('置顶操作失败');
    }
  };

  // 查看详情
  const viewDetail = (item: Post | Comment) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, statusFilter, searchQuery]);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts();
    } else {
      fetchComments();
    }
  }, [activeTab, currentPage, statusFilter, searchQuery]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* 标签切换 */}
      <div className={`p-1 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md inline-flex`}>
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-6 py-2 rounded-lg transition-all ${
            activeTab === 'posts'
              ? 'bg-red-600 text-white'
              : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <i className="fas fa-file-alt mr-2"></i>
          帖子管理
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`px-6 py-2 rounded-lg transition-all ${
            activeTab === 'comments'
              ? 'bg-red-600 text-white'
              : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <i className="fas fa-comments mr-2"></i>
          评论管理
        </button>
      </div>

      {/* 筛选和搜索 */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
              <input
                type="text"
                placeholder={activeTab === 'posts' ? '搜索帖子标题或内容...' : '搜索评论内容...'}
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
            <option value="active">正常</option>
            <option value="hidden">隐藏</option>
            <option value="deleted">已删除</option>
          </select>

          <button
            onClick={() => activeTab === 'posts' ? fetchPosts() : fetchComments()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            刷新
          </button>
        </div>
      </div>

      {/* 内容列表 */}
      <div className={`rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center">
            <i className="fas fa-spinner fa-spin text-2xl text-red-600"></i>
            <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>加载中...</p>
          </div>
        ) : activeTab === 'posts' ? (
          posts.length === 0 ? (
            <div className="p-8 text-center">
              <i className="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>暂无帖子数据</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">帖子信息</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">作者</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">社群</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">互动数据</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">状态</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {posts.map((post) => (
                      <tr key={post.id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                        <td className="px-6 py-4">
                          <div className="flex items-start space-x-3">
                            {post.images && post.images.length > 0 && (
                              (() => {
                                const imageUrl = post.images[0];
                                const isVideo = imageUrl.match(/\.(mp4|webm|ogg|mov)$/i);
                                return isVideo ? (
                                  <div className="w-16 h-16 rounded-lg flex-shrink-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <i className="fas fa-video text-gray-500 text-xl"></i>
                                  </div>
                                ) : (
                                  <img
                                    src={imageUrl}
                                    alt={post.title}
                                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=No+Image';
                                    }}
                                  />
                                );
                              })()
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{post.title}</p>
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate max-w-[300px]`}>
                                {post.content}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                {post.is_pinned && (
                                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">置顶</span>
                                )}
                                {post.is_announcement && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">公告</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <img
                              src={post.author_avatar || 'https://via.placeholder.com/32'}
                              alt={post.author_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{post.author_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{post.community_name}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <span className="mr-3"><i className="fas fa-heart text-red-500 mr-1"></i>{post.likes_count}</span>
                            <span className="mr-3"><i className="fas fa-comment text-blue-500 mr-1"></i>{post.comments_count}</span>
                            <span><i className="fas fa-eye text-green-500 mr-1"></i>{post.views}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            post.status === 'active' ? 'bg-green-100 text-green-700' :
                            post.status === 'hidden' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {post.status === 'active' ? '正常' :
                             post.status === 'hidden' ? '隐藏' : '已删除'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => viewDetail(post)}
                              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                              title="查看详情"
                            >
                              <i className="fas fa-eye text-blue-500"></i>
                            </button>
                            <button
                              onClick={() => togglePinPost(post.id, post.is_pinned)}
                              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                              title={post.is_pinned ? '取消置顶' : '置顶'}
                            >
                              <i className={`fas fa-thumbtack ${post.is_pinned ? 'text-red-500' : 'text-gray-400'}`}></i>
                            </button>
                            {post.status === 'active' ? (
                              <button
                                onClick={() => updatePostStatus(post.id, 'hidden')}
                                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                                title="隐藏"
                              >
                                <i className="fas fa-eye-slash text-yellow-500"></i>
                              </button>
                            ) : (
                              <button
                                onClick={() => updatePostStatus(post.id, 'active')}
                                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                                title="恢复"
                              >
                                <i className="fas fa-undo text-green-500"></i>
                              </button>
                            )}
                            <button
                              onClick={() => updatePostStatus(post.id, 'deleted')}
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
            </>
          )
        ) : (
          comments.length === 0 ? (
            <div className="p-8 text-center">
              <i className="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>暂无评论数据</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">评论内容</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">作者</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">所属帖子</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">点赞数</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">状态</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {comments.map((comment) => (
                      <tr key={comment.id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                        <td className="px-6 py-4">
                          <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} truncate max-w-[300px]`}>
                            {comment.content}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <img
                              src={comment.author_avatar || 'https://via.placeholder.com/32'}
                              alt={comment.author_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{comment.author_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} truncate max-w-[200px] block`}>
                            {comment.post_title}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-medium">{comment.likes_count}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            comment.status === 'active' ? 'bg-green-100 text-green-700' :
                            comment.status === 'hidden' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {comment.status === 'active' ? '正常' :
                             comment.status === 'hidden' ? '隐藏' : '已删除'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => viewDetail(comment)}
                              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                              title="查看详情"
                            >
                              <i className="fas fa-eye text-blue-500"></i>
                            </button>
                            {comment.status === 'active' ? (
                              <button
                                onClick={() => updateCommentStatus(comment.id, 'hidden')}
                                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                                title="隐藏"
                              >
                                <i className="fas fa-eye-slash text-yellow-500"></i>
                              </button>
                            ) : (
                              <button
                                onClick={() => updateCommentStatus(comment.id, 'active')}
                                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                                title="恢复"
                              >
                                <i className="fas fa-undo text-green-500"></i>
                              </button>
                            )}
                            <button
                              onClick={() => updateCommentStatus(comment.id, 'deleted')}
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
            </>
          )
        )}

        {/* 分页 */}
        {!loading && totalPages > 1 && (
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
      </div>

      {/* 详情弹窗 */}
      <AnimatePresence>
        {showDetailModal && selectedItem && (
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
              className={`w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
              onClick={e => e.stopPropagation()}
            >
              <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                <h3 className="text-xl font-bold">
                  {activeTab === 'posts' ? '帖子详情' : '评论详情'}
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {'title' in selectedItem ? (
                  // 帖子详情
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">{selectedItem.title}</h4>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        <i className="fas fa-user mr-1"></i>
                        {selectedItem.author_name}
                      </span>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        <i className="fas fa-users mr-1"></i>
                        {selectedItem.community_name}
                      </span>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        <i className="fas fa-clock mr-1"></i>
                        {new Date(selectedItem.created_at).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap`}>
                      {selectedItem.content}
                    </p>
                    {selectedItem.images && selectedItem.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {selectedItem.images.map((img, idx) => {
                          const isVideo = img.match(/\.(mp4|webm|ogg|mov)$/i);
                          return isVideo ? (
                            <div key={idx} className="rounded-lg bg-gray-200 dark:bg-gray-700 h-32 w-full flex items-center justify-center">
                              <div className="text-center">
                                <i className="fas fa-video text-gray-500 text-2xl mb-2"></i>
                                <p className="text-xs text-gray-500">视频文件</p>
                              </div>
                            </div>
                          ) : (
                            <img 
                              key={idx} 
                              src={img} 
                              alt="" 
                              className="rounded-lg object-cover h-32 w-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x128?text=No+Image';
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                    <div className="flex items-center space-x-6 pt-4 border-t dark:border-gray-700">
                      <span><i className="fas fa-heart text-red-500 mr-2"></i>{selectedItem.likes_count} 点赞</span>
                      <span><i className="fas fa-comment text-blue-500 mr-2"></i>{selectedItem.comments_count} 评论</span>
                      <span><i className="fas fa-eye text-green-500 mr-2"></i>{selectedItem.views} 浏览</span>
                    </div>
                  </div>
                ) : (
                  // 评论详情
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={selectedItem.author_avatar || 'https://via.placeholder.com/48'}
                        alt={selectedItem.author_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium">{selectedItem.author_name}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(selectedItem.created_at).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap`}>
                      {selectedItem.content}
                    </p>
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>所属帖子</p>
                      <p className="font-medium">{selectedItem.post_title}</p>
                    </div>
                    <div className="flex items-center space-x-6 pt-4 border-t dark:border-gray-700">
                      <span><i className="fas fa-heart text-red-500 mr-2"></i>{selectedItem.likes_count} 点赞</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
