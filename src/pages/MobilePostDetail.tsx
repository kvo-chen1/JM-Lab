import { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import postsApi, { Post, Comment, addComment, getWorkComments, checkUserFollowing, followUser, unfollowUser, getPostById, likePost, unlikePost, bookmarkPost, unbookmarkPost } from '@/services/postService';
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
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);

  // 滚动相关
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 200], [0, 1]);
  const imageScale = useTransform(scrollY, [0, 200], [1, 0.9]);
  const imageOpacity = useTransform(scrollY, [0, 200], [1, 0.5]);

  // 加载帖子详情
  useEffect(() => {
    if (!id) return;

    const loadPost = async () => {
      setIsLoading(true);
      try {
        const data = await getPostById(id, user?.id);
        if (data) {
          setPost(data);
          setIsLiked(data.isLiked || false);
          setIsBookmarked(data.isBookmarked || false);
          setLikeCount(data.likes || 0);
          
          // 加载评论
          loadComments(id);
          
          // 检查关注状态
          const authorId = typeof data.author === 'object' ? data.author?.id : data.author;
          if (authorId && user?.id) {
            const following = await checkUserFollowing(user.id, authorId);
            setIsFollowing(following);
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
            .filter(p => p.id !== post.id)
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
      {/* 顶部导航栏 */}
      <motion.header
        style={{ opacity: headerOpacity }}
        className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-xl border-b ${
          isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'
        }`}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className={`flex items-center justify-center w-10 h-10 rounded-xl ${
                isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <h1 className={`text-base font-bold truncate max-w-[200px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {post.title}
            </h1>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowShareSheet(true)}
              className={`flex items-center justify-center w-10 h-10 rounded-xl ${
                isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* 作品封面/媒体展示 */}
      <motion.div
        style={{ scale: imageScale, opacity: imageOpacity }}
        className="relative"
      >
        {post.thumbnail ? (
          <div
            className="relative aspect-square bg-gray-100 dark:bg-gray-800"
            onClick={() => setShowFullImage(true)}
          >
            {isVideo && post.videoUrl ? (
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
            ) : (
              <img
                src={post.thumbnail}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            )}
            {/* 渐变遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            {/* 返回按钮（浮动） */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(-1);
              }}
              className="absolute top-4 left-4 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white"
            >
              <ChevronLeft className="w-7 h-7" />
            </motion.button>
            {/* 分享按钮（浮动） */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowShareSheet(true);
              }}
              className="absolute top-4 right-4 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white"
            >
              <Share2 className="w-6 h-6" />
            </motion.button>
          </div>
        ) : (
          <div className={`aspect-square flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <ImageIcon className="w-20 h-20 text-gray-300 dark:text-gray-600" />
          </div>
        )}
      </motion.div>

      {/* 作品信息 */}
      <div className="px-4 -mt-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-lg`}
        >
          {/* 标题 */}
          <h1 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {post.title}
          </h1>

          {/* 作者信息 */}
          <div className="flex items-center gap-3 mb-4">
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

          {/* 统计信息 */}
          <div className={`grid grid-cols-3 gap-4 p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className="text-center">
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {likeCount}
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>点赞</p>
            </div>
            <div className="text-center">
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {comments.length || post.commentCount || 0}
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>评论</p>
            </div>
            <div className="text-center">
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {post.shares || 0}
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>分享</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 作品描述 */}
      {post.description && (
        <div className="px-4 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}
          >
            <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              作品描述
            </h3>
            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {post.description}
            </p>
          </motion.div>
        </div>
      )}

      {/* 评论区域 */}
      <div className="px-4 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}
        >
          <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            评论 ({comments.length || post.commentCount || 0})
          </h3>
          
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
              {comments.slice(0, 5).map((comment) => (
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
              {comments.length > 5 && (
                <button className="w-full py-2 text-sm text-red-500 font-medium">
                  查看全部 {comments.length} 条评论
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* 相关推荐 - 两列瀑布流（自然交错） */}
      {relatedPosts.length > 0 && (
        <div className="px-4 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* 使用CSS columns实现真正的瀑布流效果 */}
            <div className="columns-2 gap-3">
              {relatedPosts.map((relatedPost, index) => (
                <motion.div
                  key={relatedPost.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-sm break-inside-avoid mb-3`}
                  onClick={() => navigate(`/square/${relatedPost.id}`)}
                >
                  {/* 图片容器 - 保持原始比例 */}
                  <div className="relative overflow-hidden">
                    {relatedPost.thumbnail ? (
                      <img
                        src={relatedPost.thumbnail}
                        alt={relatedPost.title}
                        className="w-full h-auto object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className={`w-full aspect-square flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    {/* 视频标识 */}
                    {(relatedPost.type === 'video' || relatedPost.videoUrl) && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded-full flex items-center gap-1">
                        <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent" />
                        <span className="text-white text-xs">视频</span>
                      </div>
                    )}
                  </div>
                  {/* 标题 */}
                  <div className="p-2">
                    <h4 className={`text-sm font-medium line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {relatedPost.title}
                    </h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {typeof relatedPost.author === 'object' 
                          ? relatedPost.author?.username 
                          : (relatedPost.author || '创作者')}
                      </span>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">{relatedPost.likes || 0}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* 底部操作栏 - 在MobileLayout的底部导航栏上方显示 */}
      <div className={`fixed bottom-[64px] left-0 right-0 p-4 z-40 ${
        isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'
      } backdrop-blur-xl border-t`}>
        <div className="flex items-center gap-3">
          {/* 评论输入框 */}
          <div className={`flex-1 flex items-center gap-2 px-4 py-2 rounded-full ${
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
                }
              }}
            />
          </div>
          
          {/* 发送按钮 */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSendComment}
            disabled={!commentText.trim() || isSubmittingComment}
            className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </motion.button>
          
          {/* 点赞按钮 */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleLike}
            className={`flex items-center justify-center gap-1 px-3 py-2 rounded-full ${
              isLiked
                ? 'bg-red-50 text-red-500'
                : isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{likeCount}</span>
          </motion.button>
          
          {/* 收藏按钮 */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBookmark}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isBookmarked
                ? 'bg-amber-50 text-amber-500'
                : isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
          </motion.button>
        </div>
      </div>

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
              className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl ${
                isDark ? 'bg-gray-900' : 'bg-white'
              }`}
            >
              <div className={`p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                <h3 className={`text-base font-semibold text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  分享作品
                </h3>
              </div>
              <div className="p-6 grid grid-cols-4 gap-4">
                <button
                  onClick={() => handleShare('copy')}
                  className="flex flex-col items-center gap-2"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    isDark ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    <Share2 className="w-6 h-6 text-gray-600" />
                  </div>
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>复制链接</span>
                </button>
                <button
                  onClick={() => handleShare('wechat')}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-green-500">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>微信</span>
                </button>
                <button
                  onClick={() => handleShare('weibo')}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-500">
                    <Share2 className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>微博</span>
                </button>
              </div>
              <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                <button
                  onClick={() => setShowShareSheet(false)}
                  className={`w-full py-3 rounded-xl text-sm font-medium ${
                    isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  取消
                </button>
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
