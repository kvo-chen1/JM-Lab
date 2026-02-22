import { useState, useContext, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { eventWorkService } from '@/services/eventWorkService';
import { toast } from 'sonner';
import {
  ChevronLeft,
  Heart,
  ThumbsUp,
  Star,
  Share2,
  MoreHorizontal,
  X,
  MessageCircle,
  Send,
  Image as ImageIcon,
  Video,
  FileAudio,
  FileText,
  Download,
  ExternalLink,
  ChevronRight,
  Loader2,
} from 'lucide-react';

// 品牌色彩
const brandColors = {
  primary: '#E53935',
  primaryLight: '#FF6F60',
  primaryDark: '#AB000D',
};

// 媒体类型图标映射
const mediaTypeIcons = {
  image: ImageIcon,
  video: Video,
  audio: FileAudio,
  document: FileText,
  other: MoreHorizontal,
};

export default function MobileWorkDetail() {
  const { eventId, workId } = useParams<{ eventId: string; workId: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);

  // 状态
  const [submission, setSubmission] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [interaction, setInteraction] = useState<any>(null);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 滚动相关
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 200], [0, 1]);
  const imageScale = useTransform(scrollY, [0, 200], [1, 0.9]);
  const imageOpacity = useTransform(scrollY, [0, 200], [1, 0.5]);

  // 加载作品详情
  useEffect(() => {
    if (!workId) return;

    const loadSubmission = async () => {
      setIsLoading(true);
      try {
        const data = await eventWorkService.getSubmissionDetail(workId);
        if (data) {
          setSubmission(data);
          // 加载用户交互状态
          if (user?.id) {
            const interactions = await eventWorkService.getUserInteractions(user.id, [workId]);
            setInteraction(interactions.get(workId));
          }
        }
      } catch (error) {
        console.error('加载作品详情失败:', error);
        toast.error('加载作品详情失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadSubmission();
  }, [workId, user?.id]);

  // 处理投票
  const handleVote = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      return;
    }
    if (!workId || !user?.id) return;

    try {
      const result = await eventWorkService.submitVote(workId, user.id);
      setInteraction((prev: any) => ({
        ...prev,
        hasVoted: result.action === 'added',
      }));
      setSubmission((prev: any) => ({
        ...prev,
        voteCount: result.action === 'added' ? prev.voteCount + 1 : Math.max(0, prev.voteCount - 1),
      }));
      toast.success(result.message);
    } catch (error: any) {
      toast.error(error.message || '投票失败');
    }
  };

  // 处理点赞
  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      return;
    }
    if (!workId || !user?.id) return;

    try {
      const result = await eventWorkService.submitLike(workId, user.id);
      setInteraction((prev: any) => ({
        ...prev,
        hasLiked: result.action === 'added',
      }));
      setSubmission((prev: any) => ({
        ...prev,
        likeCount: result.action === 'added' ? prev.likeCount + 1 : Math.max(0, prev.likeCount - 1),
      }));
      toast.success(result.message);
    } catch (error: any) {
      toast.error(error.message || '点赞失败');
    }
  };

  // 处理评分
  const handleRate = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      return;
    }
    if (!workId || !user?.id || userRating === 0) return;

    setIsSubmittingRating(true);
    try {
      const result = await eventWorkService.submitRating(workId, user.id, userRating, ratingComment);
      // 重新加载作品详情获取最新评分
      const updatedSubmission = await eventWorkService.getSubmissionDetail(workId);
      if (updatedSubmission) {
        setSubmission(updatedSubmission);
      }
      setInteraction((prev: any) => ({
        ...prev,
        userRating,
      }));
      setShowRatingModal(false);
      toast.success(result.message);
    } catch (error: any) {
      toast.error(error.message || '评分失败');
    } finally {
      setIsSubmittingRating(false);
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

  // 获取媒体文件列表
  const mediaFiles = submission?.files?.filter((f: any) =>
    f.type?.startsWith('image/') || f.type?.startsWith('video/')
  ) || [];

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

  if (!submission) {
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

  const mediaType = submission.mediaType || 'image';
  const MediaIcon = mediaTypeIcons[mediaType as keyof typeof mediaTypeIcons] || ImageIcon;
  const coverImage = submission.coverImage || submission.workThumbnail ||
    (submission.files && submission.files.length > 0 ? submission.files[0].url : null);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} pb-24`}>
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
              {submission.title}
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
        {coverImage ? (
          <div
            className="relative aspect-square bg-gray-100 dark:bg-gray-800"
            onClick={() => setShowFullImage(true)}
          >
            <img
              src={coverImage}
              alt={submission.title}
              className="w-full h-full object-cover"
            />
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
              className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white"
            >
              <ChevronLeft className="w-5 h-5" />
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
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white"
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
          </div>
        ) : (
          <div className={`aspect-square flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <MediaIcon className="w-20 h-20 text-gray-300 dark:text-gray-600" />
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
            {submission.title}
          </h1>

          {/* 作者信息 */}
          <div className="flex items-center gap-3 mb-4">
            {submission.creatorAvatar ? (
              <img
                src={submission.creatorAvatar}
                alt={submission.creatorName || '用户'}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-medium">
                {submission.creatorName?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <div className="flex-1">
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {submission.creatorName || '匿名用户'}
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString('zh-CN') : ''}
              </p>
            </div>
          </div>

          {/* 统计信息 */}
          <div className={`grid grid-cols-3 gap-4 p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className="text-center">
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {submission.voteCount}
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>投票</p>
            </div>
            <div className="text-center">
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {submission.likeCount}
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>点赞</p>
            </div>
            <div className="text-center">
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {submission.avgRating.toFixed(1)}
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>评分</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 作品描述 */}
      {submission.description && (
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
              {submission.description}
            </p>
          </motion.div>
        </div>
      )}

      {/* 附件列表 */}
      {submission.files && submission.files.length > 0 && (
        <div className="px-4 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}
          >
            <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              附件 ({submission.files.length})
            </h3>
            <div className="space-y-2">
              {submission.files.map((file: any, index: number) => (
                <a
                  key={index}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    {file.type?.startsWith('image/') ? (
                      <ImageIcon className="w-4 h-4 text-blue-500" />
                    ) : file.type?.startsWith('video/') ? (
                      <Video className="w-4 h-4 text-red-500" />
                    ) : file.type?.startsWith('audio/') ? (
                      <FileAudio className="w-4 h-4 text-green-500" />
                    ) : (
                      <FileText className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <span className={`text-sm flex-1 truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {file.name || `附件 ${index + 1}`}
                  </span>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* 评分区域 */}
      <div className="px-4 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              作品评分
            </h3>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= submission.avgRating
                      ? 'text-amber-400 fill-current'
                      : isDark ? 'text-gray-600' : 'text-gray-300'
                  }`}
                />
              ))}
              <span className={`text-xs ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                ({submission.ratingCount})
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowRatingModal(true)}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ backgroundColor: brandColors.primary }}
          >
            {interaction?.userRating ? '修改评分' : '我要评分'}
          </button>
        </motion.div>
      </div>

      {/* 底部操作栏 */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 z-40 ${
        isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'
      } backdrop-blur-xl border-t`}>
        <div className="flex items-center gap-3">
          {/* 投票按钮 */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleVote}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
              interaction?.hasVoted
                ? 'text-white'
                : isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}
            style={interaction?.hasVoted ? { backgroundColor: brandColors.primary } : {}}
          >
            <ThumbsUp className={`w-5 h-5 ${interaction?.hasVoted ? 'fill-current' : ''}`} />
            <span>{interaction?.hasVoted ? '已投票' : '投票'}</span>
          </motion.button>

          {/* 点赞按钮 */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleLike}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
              interaction?.hasLiked
                ? 'text-white'
                : isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}
            style={interaction?.hasLiked ? { backgroundColor: brandColors.primary } : {}}
          >
            <Heart className={`w-5 h-5 ${interaction?.hasLiked ? 'fill-current' : ''}`} />
            <span>{interaction?.hasLiked ? '已点赞' : '点赞'}</span>
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

      {/* 评分弹窗 */}
      <AnimatePresence>
        {showRatingModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRatingModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`fixed inset-0 m-auto w-[90%] max-w-sm h-fit rounded-2xl z-50 ${
                isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
              } border p-6`}
            >
              <h3 className={`text-lg font-bold text-center mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                为作品评分
              </h3>
              {/* 星级评分 */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setUserRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        star <= userRating
                          ? 'text-amber-400 fill-current'
                          : isDark ? 'text-gray-600' : 'text-gray-300'
                      }`}
                    />
                  </motion.button>
                ))}
              </div>
              {/* 评分评论 */}
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="写下你的评价（可选）"
                className={`w-full p-3 rounded-xl text-sm resize-none mb-4 ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                } border focus:outline-none focus:ring-2 focus:ring-red-500/20`}
                rows={3}
              />
              {/* 按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRatingModal(false)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium ${
                    isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  取消
                </button>
                <button
                  onClick={handleRate}
                  disabled={userRating === 0 || isSubmittingRating}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: brandColors.primary }}
                >
                  {isSubmittingRating ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    '提交评分'
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 全屏图片查看 */}
      <AnimatePresence>
        {showFullImage && coverImage && (
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
              src={coverImage}
              alt={submission.title}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
