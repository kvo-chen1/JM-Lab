import { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import postsApi, { Post, Comment, addComment, getWorkComments, checkUserFollowing, followUser, unfollowUser, getPostById, likePost, unlikePost, bookmarkPost, unbookmarkPost } from '@/services/postService';
import MobileWorksGallery, { ArtworkItem } from './MobileWorksGallery';
import { toast } from 'sonner';
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  Share2,
  X,
  Bookmark,
  Send,
  Image as ImageIcon,
  MoreHorizontal,
  Users,
  Link,
  ChevronRight,
} from 'lucide-react';

// 品牌色彩
const brandColors = {
  primary: '#E53935',
  primaryLight: '#FF6F60',
  primaryDark: '#AB000D',
};

export default function MobilePostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);

  // 状态
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [showCommentDrawer, setShowCommentDrawer] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);



  // 加载帖子详情
  useEffect(() => {
    if (!id) return;

    const loadPost = async () => {
      setIsLoading(true);
      try {
        // 首先尝试从后端 API 获取（类似 WorkDetail 的方式）
        const allPosts = await postsApi.getPosts(undefined, user?.id);
        const postData = allPosts.find(p => p.id === id);
        
        if (postData) {
          setPost(postData);
          setIsLiked(postData.isLiked || false);
          setIsBookmarked(postData.isBookmarked || false);
          setLikeCount(postData.likes || 0);
          
          // 加载评论
          loadComments(id);
          
          // 检查关注状态
          const authorId = typeof postData.author === 'object' ? postData.author?.id : postData.author;
          if (authorId && user?.id) {
            const following = await checkUserFollowing(user.id, authorId);
            setIsFollowing(following);
          }
        } else {
          // 如果找不到，尝试使用 getPostById
          const data = await getPostById(id, user?.id);
          if (data) {
            setPost(data);
            setIsLiked(data.isLiked || false);
            setIsBookmarked(data.isBookmarked || false);
            setLikeCount(data.likes || 0);
            loadComments(id);
          }
        }
      } catch (error) {
        console.error('加载帖子详情失败:', error);
        toast.error('加载帖子详情失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadPost();
  }, [id, user?.id]);

  // 加载相关推荐
  useEffect(() => {
    const loadRelated = async () => {
      if (post) {
        try {
          const all = await postsApi.getPosts();
          const related = all
            .filter((p: Post) => p.id !== post.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 10);
          setRelatedPosts(related);
        } catch (e) {
          console.error('加载相关推荐失败:', e);
        }
      }
    };
    loadRelated();
  }, [post]);

  // 加载评论
  const loadComments = async (postId: string) => {
    setCommentsLoading(true);
    try {
      const workComments = await getWorkComments(postId);
      setComments(workComments);
    } catch (error) {
      console.error('加载评论失败:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  // 处理点赞
  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      return;
    }
    if (!id) return;

    try {
      if (isLiked) {
        await unlikePost(id, user!.id);
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
        toast.success('已取消点赞');
      } else {
        await likePost(id, user!.id);
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        toast.success('点赞成功');
      }
    } catch (error: any) {
      toast.error(error.message || '点赞失败');
    }
  };

  // 处理收藏
  const handleBookmark = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      return;
    }
    if (!id) return;

    try {
      if (isBookmarked) {
        await unbookmarkPost(id, user!.id);
        setIsBookmarked(false);
        toast.success('已取消收藏');
      } else {
        await bookmarkPost(id, user!.id);
        setIsBookmarked(true);
        toast.success('收藏成功');
      }
    } catch (error: any) {
      toast.error(error.message || '操作失败');
    }
  };

  // 处理关注
  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      return;
    }
    
    const authorId = typeof post?.author === 'object' ? post?.author?.id : post?.author;
    if (!user?.id || !authorId) {
      toast.error('无法获取作者信息');
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(user.id, authorId);
        setIsFollowing(false);
        toast.success('已取消关注');
      } else {
        await followUser(user.id, authorId);
        setIsFollowing(true);
        toast.success('已关注');
      }
    } catch (error: any) {
      toast.error(error.message || '操作失败');
    } finally {
      setFollowLoading(false);
    }
  };

  // 处理分享
  const handleShare = async (type: 'copy' | 'wechat' | 'weibo') => {
    if (type === 'copy') {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('链接已复制');
      } catch {
        toast.error('复制失败');
      }
    } else {
      toast.info('功能开发中');
    }
    setShowShareSheet(false);
  };

  // 处理发送评论
  const handleSendComment = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      return;
    }
    if (!id || !commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await addComment(id, commentText, undefined, user as any);
      toast.success('评论发送成功');
      setCommentText('');
      // 刷新评论列表
      loadComments(id);
    } catch (error: any) {
      toast.error(error.message || '评论发送失败');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // 处理作者点击
  const handleAuthorClick = () => {
    const authorId = typeof post?.author === 'object' ? post?.author?.id : post?.author;
    if (authorId) {
      navigate(`/author/${authorId}`);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>加载中...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center px-4">
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>作品不存在</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-xl"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  const isVideo = post.type === 'video' || post.category === 'video' || post.videoUrl;
  const authorName = typeof post.author === 'object' ? post.author?.username : (post.author || '创作者');
  const authorAvatar = typeof post.author === 'object' ? post.author?.avatar : null;
  const authorId = typeof post.author === 'object' ? post.author?.id : post.author;
  const isAuthor = authorId && user?.id && authorId === user.id;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} pb-40`}>
      {/* 作品封面/媒体展示 */}
      <div className="relative w-full">
        {post.thumbnail ? (
          <div
            className="relative w-full bg-gray-50 dark:bg-black"
            onClick={() => setShowFullImage(true)}
          >
            {/* 移动端返回按钮 */}
            <button
                onClick={() => navigate(-1)}
                className="md:hidden absolute top-4 left-4 z-20 w-14 h-14 flex items-center justify-center rounded-full bg-white/95 dark:bg-black/70 text-gray-900 dark:text-white shadow-xl border border-gray-100 dark:border-gray-700"
              >
              <ChevronLeft className="w-8 h-8" strokeWidth={2.5} />
            </button>
            
            {isVideo && post.videoUrl ? (
              <div className="w-full aspect-[4/5] flex items-center justify-center">
                <video
                  src={post.videoUrl}
                  poster={post.thumbnail}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              </div>
            ) : (
              <div className="w-full aspect-[4/5] cursor-zoom-in flex items-center justify-center overflow-hidden">
                <img
                  src={post.thumbnail}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        ) : (
          <div className={`aspect-[4/5] flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <ImageIcon className="w-20 h-20 text-gray-300 dark:text-gray-600" />
          </div>
        )}
      </div>

      {/* Pinterest风格顶部操作栏 */}
      <div className="px-4 py-4 flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            className="flex items-center gap-2 text-gray-800 dark:text-gray-200"
          >
            <Heart className={`w-8 h-8 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-800 dark:text-gray-200'} transition-colors`} strokeWidth={1.5} />
            <span className={`text-base font-semibold ${isLiked ? 'text-red-500' : ''}`}>{likeCount}</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-2 text-gray-800 dark:text-gray-200"
            onClick={() => setShowCommentDrawer(true)}
          >
            <MessageCircle className="w-8 h-8" strokeWidth={1.5} />
            <span className="text-base font-semibold">{comments.length || post.commentCount || 0}</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowShareSheet(true);
            }}
            className="text-gray-800 dark:text-gray-200"
          >
            <Share2 className="w-7 h-7" strokeWidth={1.5} />
          </button>
          <button type="button" className="text-gray-800 dark:text-gray-200">
            <MoreHorizontal className="w-7 h-7" strokeWidth={1.5} />
          </button>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleBookmark();
          }}
          className={`px-6 py-2.5 rounded-full font-semibold text-base transition-all ${
            isBookmarked
              ? 'bg-amber-500 text-white'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {isBookmarked ? '已收藏' : '收藏'}
        </button>
      </div>

      {/* 作品信息 */}
      <div className="px-4 mt-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-lg`}
        >
          {/* 标题 */}
          <h1 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {post.title}
          </h1>

          {/* 作品描述 */}
          {post.description && (
            <p className={`text-sm leading-relaxed whitespace-pre-wrap mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {post.description}
            </p>
          )}

          {/* 作者信息 */}
          <div className="flex items-center gap-3">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-medium">
                {authorName?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <div className="flex-1" onClick={handleAuthorClick}>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {authorName}
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {post.views || 0} 浏览
              </p>
            </div>
            {isAuthor ? (
              <span className="px-4 py-2 rounded-full bg-red-50 text-red-600 text-xs font-bold">
                我的作品
              </span>
            ) : (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                  isFollowing
                    ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
                }`}
              >
                {followLoading ? '...' : (isFollowing ? '已关注' : '关注')}
              </button>
            )}
          </div>

        </motion.div>
      </div>

      {/* 相关推荐 - 使用 MobileWorksGallery 组件 */}
      {relatedPosts.length > 0 && (
        <div className="mt-4">
          <MobileWorksGallery
            artworks={relatedPosts.map(post => ({
              id: post.id,
              title: post.title,
              imageUrl: post.thumbnail || '',
              aspectRatio: post.thumbnail ? 1.2 : 1, // 默认宽高比
              author: {
                id: typeof post.author === 'object' ? post.author?.id || '' : post.author || '',
                name: typeof post.author === 'object' ? post.author?.username || '创作者' : post.author || '创作者',
                avatar: typeof post.author === 'object' ? post.author?.avatar || '' : '',
              },
              likes: post.likes || 0,
              views: post.views || 0,
              tags: post.tags || [],
              createdAt: post.date || new Date().toISOString(),
              isLiked: post.isLiked,
              isBookmarked: post.isBookmarked,
              isVideo: post.type === 'video' || !!post.videoUrl,
              videoUrl: post.videoUrl,
            }))}
            onArtworkClick={(artwork) => navigate(`/square/${artwork.id}`)}
            onLike={async (artworkId) => {
              if (!user?.id) {
                toast.error('请先登录');
                return;
              }
              try {
                await likePost(artworkId, user.id);
                toast.success('点赞成功');
              } catch (error) {
                toast.error('点赞失败');
              }
            }}
            onBookmark={async (artworkId) => {
              if (!user?.id) {
                toast.error('请先登录');
                return;
              }
              try {
                await bookmarkPost(artworkId, user.id);
                toast.success('收藏成功');
              } catch (error) {
                toast.error('收藏失败');
              }
            }}
            onShare={(artwork) => {
              setShowShareSheet(true);
            }}
            loading={false}
            hasMore={false}
          />
        </div>
      )}

      {/* 分享弹窗 */}
      <AnimatePresence>
        {showShareSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareSheet(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl max-h-[85vh] overflow-hidden ${
                isDark ? 'bg-gray-900' : 'bg-white'
              }`}
            >
              {/* 头部 */}
              <div className={`p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    分享
                  </h3>
                  <button
                    onClick={() => setShowShareSheet(false)}
                    className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                  >
                    <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  </button>
                </div>
              </div>

              {/* 作品信息 */}
              <div className={`p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                <div className="flex gap-3">
                  {post.thumbnail && (
                    <img
                      src={post.thumbnail}
                      alt={post.title}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs mb-1 ${
                      isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
                    }`}>
                      作品
                    </span>
                    <h4 className={`font-semibold text-base truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {post.title}
                    </h4>
                    <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {post.description || '暂无描述'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 分享方式 */}
              <div className="p-4">
                <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>选择分享方式</p>

                {/* 分享到社群 */}
                <button
                  onClick={() => handleShare('community')}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl mb-3 ${
                    isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>分享到社群</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>分享到你加入的社群</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                </button>

                {/* 私信分享 */}
                <button
                  onClick={() => handleShare('private')}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl mb-3 ${
                    isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>私信分享</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>发送给好友的私信</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                </button>

                {/* 复制链接 */}
                <button
                  onClick={() => handleShare('copy')}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl ${
                    isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gray-500 flex items-center justify-center flex-shrink-0">
                    <Link className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>复制链接</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>复制链接分享给其他人</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 评论抽屉 */}
      <AnimatePresence>
        {showCommentDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCommentDrawer(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl h-[90vh] flex flex-col ${
                isDark ? 'bg-gray-900' : 'bg-white'
              }`}
            >
              {/* 抽屉头部 */}
              <div className={`p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    评论 ({comments.length || post.commentCount || 0})
                  </h3>
                  <button
                    onClick={() => setShowCommentDrawer(false)}
                    className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                  >
                    <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  </button>
                </div>
              </div>

              {/* 评论列表 */}
              <div className="flex-1 overflow-y-auto p-4">
                {commentsLoading ? (
                  <div className="py-8 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full mx-auto"
                    />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="py-8 text-center">
                    <MessageCircle className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>暂无评论</p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>来抢沙发，发表你的看法吧</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        {comment.authorAvatar ? (
                          <img
                            src={comment.authorAvatar}
                            alt={comment.author || '用户'}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                            {(comment.author || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {comment.author || '匿名用户'}
                            </span>
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {comment.date ? new Date(comment.date).toLocaleDateString('zh-CN') : ''}
                            </span>
                          </div>
                          <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 评论输入区域 */}
              <div className={`p-4 border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-full ${
                    isDark ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="写下你的评论..."
                      className={`flex-1 bg-transparent text-sm outline-none ${
                        isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                      }`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendComment();
                          setShowCommentDrawer(false);
                        }
                      }}
                      autoFocus
                    />
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      handleSendComment();
                      setShowCommentDrawer(false);
                    }}
                    disabled={!commentText.trim() || isSubmittingComment}
                    className="w-11 h-11 rounded-full bg-red-500 flex items-center justify-center text-white disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" strokeWidth={1.5} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 全屏图片查看 */}
      <AnimatePresence>
        {showFullImage && post.thumbnail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
            onClick={() => setShowFullImage(false)}
          >
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
              onClick={() => setShowFullImage(false)}
            >
              <X className="w-6 h-6" />
            </motion.button>
            <img
              src={post.thumbnail}
              alt={post.title}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
