import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import postsApi, { Post, Comment, followUser, unfollowUser, checkUserFollowing, addComment } from '@/services/postService';
import { TianjinAvatar } from '@/components/TianjinStyleComponents';
import LazyImage from './LazyImage';
import LazyVideo from './LazyVideo';
import { toast } from 'sonner';
import WaterfallGallery, { GalleryItem } from './WaterfallGallery/WaterfallGallery';
import styles from './WaterfallGallery/WaterfallGallery.module.scss';
import type { UserProfile } from '@/lib/supabase';
import type { User as AuthUser } from '@/contexts/authContext';

// 常用表情列表
const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
  '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
  '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
  '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
  '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
  '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕',
  '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯',
  '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁',
  '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧',
  '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣',
  '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠',
  '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹',
  '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹',
  '😻', '😼', '😽', '🙀', '😿', '😾', '❤️', '🧡',
  '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
  '👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏',
  '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
  '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👌',
  '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👍', '👎',
  '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲',
  '🤝', '🙏', '💪', '🦾', '🦵', '🦿', '🦶', '👣',
  '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️',
  '👅', '👄', '💋', '🩸', '🎉', '🎊', '🎁', '🎈',
  '🌟', '⭐', '✨', '⚡', '🔥', '💥', '☄️', '☀️',
  '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️',
  '🌨️', '❄️', '🌬️', '💨', '🌪️', '🌫️', '🌈', '☔',
  '💧', '💦', '🌊', '🌑', '🌒', '🌓', '🌔', '🌕',
  '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '🌡️',
  '☀️', '🌝', '🌞', '🪐', '⭐', '🌟', '🌠', '🌌',
  '☁️', '⛅', '⛈️', '🌤️', '🌥️', '🌦️', '🌧️', '🌨️',
  '❄️', '🌬️', '💨', '🌪️', '🌫️', '🌈', '☔', '💧',
  '💦', '🌊', '🌍', '🌎', '🌏', '🌐', '🗺️', '🧭',
  '⛰️', '🏔️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️',
  '🏞️', '🏟️', '🏛️', '🏗️', '🧱', '🪨', '🪵', '🛖',
  '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥',
  '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯',
  '🏰', '💒', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍',
  '⛩️', '🕋', '⛲', '⛺', '🌁', '🌃', '🏙️', '🌄',
  '🌅', '🌆', '🌇', '🌉', '♨️', '🎠', '🎡', '🎢',
  '💈', '🎪', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇',
  '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍',
  '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖',
  '🚗', '🚘', '🚙', '🛻', '🚚', '🚛', '🚜', '🏎️',
  '🏍️', '🛵', '🦽', '🦼', '🛺', '🚲', '🛴', '🛹',
  '🛼', '🚏', '🛣️', '🛤️', '🛢️', '⛽', '🚨', '🚥',
  '🚦', '🛑', '🚧', '⚓', '⛵', '🛶', '🚤', '🛳️',
  '⛴️', '🚢', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺',
  '🚁', '🚟', '🚠', '🚡', '🛰️', '🚀', '🛸', '🛎️',
  '🧳', '⌚', '⏰', '⏱️', '⏲️', '🕰️', '🕛', '🕧',
  '🕐', '🕜', '🕑', '🕝', '🕒', '🕞', '🕓', '🕟',
  '🕔', '🕠', '🕕', '🕡', '🕖', '🕢', '🕗', '🕣',
  '🕘', '🕤', '🕙', '🕥', '🕚', '🕦', '🌑', '🌒',
  '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚',
  '🌛', '🌜', '🌡️', '☀️', '🌝', '🌞', '🪐', '⭐',
  '🌟', '🌠', '🌌', '☁️', '⛅', '⛈️', '🌤️', '🌥️',
  '🌦️', '🌧️', '🌨️', '❄️', '🌬️', '💨', '🌪️', '🌫️',
  '🌈', '☔', '💧', '💦', '🌊'
];

interface PostDetailModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onLike: (id: string) => void;
  onComment: (id: string, content: string) => Promise<void>;
  onShare?: (id: string) => void;
  loading?: boolean;
  error?: string | null;
  currentUser?: UserProfile | AuthUser | null;
  onPostChange?: (post: Post) => void;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  isOpen,
  onClose,
  onLike,
  onComment,
  onShare,
  loading = false,
  error = null,
  currentUser,
  onPostChange,
}) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyToComment, setReplyToComment] = useState<Comment | null>(null);
  const [isImageFull, setIsImageFull] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isSwitchingPost, setIsSwitchingPost] = useState(false);
  // 评论图片和表情相关状态
  const [commentImages, setCommentImages] = useState<File[]>([]);
  const [commentImagePreviews, setCommentImagePreviews] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load comments when post changes
  useEffect(() => {
    console.log('[PostDetailModal] post changed:', post?.id, post);
    const loadComments = async () => {
      if (post?.id) {
        console.log('[PostDetailModal] Loading comments for post:', post.id);
        setCommentsLoading(true);
        try {
          const workComments = await postsApi.getWorkComments(post.id);
          console.log('[PostDetailModal] Comments loaded:', workComments);
          setComments(workComments);
        } catch (error) {
          console.error('[PostDetailModal] Failed to load comments:', error);
        } finally {
          setCommentsLoading(false);
        }
      } else {
        console.log('[PostDetailModal] No post.id, skipping comment load');
      }
    };
    loadComments();
  }, [post?.id]);

  // Check follow status
  useEffect(() => {
    const checkFollowStatus = async () => {
      const authorId = typeof post?.author === 'object' ? post?.author?.id : post?.author;
      if (authorId && currentUser?.id) {
        try {
          const following = await checkUserFollowing(currentUser.id, authorId);
          setIsFollowing(following);
        } catch (error) {
          console.error('Failed to check follow status:', error);
        }
      }
    };
    checkFollowStatus();
  }, [post?.author, currentUser?.id]);

  // Load related posts
  useEffect(() => {
    const loadRelated = async () => {
      if (post) {
        try {
          const all = await postsApi.getPosts();
          const related = all
            .filter(p => p.id !== post.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 12);
          setRelatedPosts(related);
        } catch (e) {
          console.error('Failed to load related posts', e);
        }
      }
    };
    loadRelated();
  }, [post]);

  // Reset state
  useEffect(() => {
    if (!isOpen) {
      setCommentText('');
      setReplyText('');
      setReplyToComment(null);
      setIsImageFull(false);
      setIsSwitchingPost(false);
      setCommentImages([]);
      setCommentImagePreviews([]);
      setShowEmojiPicker(false);
    }
  }, [isOpen, post]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 键盘无障碍支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isImageFull) setIsImageFull(false);
        else onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus();
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isImageFull, onClose]);

  // 点击遮罩关闭 (注意不要点击到内容)
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 4 - commentImages.length); // 最多4张图片
    if (newFiles.length === 0) {
      toast.error('最多只能上传4张图片');
      return;
    }

    setCommentImages(prev => [...prev, ...newFiles]);

    // 生成预览
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCommentImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // 删除已选择的图片
  const handleRemoveImage = (index: number) => {
    setCommentImages(prev => prev.filter((_, i) => i !== index));
    setCommentImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // 插入表情
  const handleEmojiSelect = (emoji: string) => {
    setCommentText(prev => prev + emoji);
    setShowEmojiPicker(false);
    commentInputRef.current?.focus();
  };

  const handleSendComment = async () => {
    if (!post) return;
    if (!commentText.trim() && commentImages.length === 0) {
      toast.error('请输入评论内容或上传图片');
      return;
    }

    setIsUploading(true);
    try {
      // 使用新的 addComment 函数，支持图片上传
      await addComment(post.id, commentText, undefined, currentUser as any, commentImages);
      setCommentText('');
      setCommentImages([]);
      setCommentImagePreviews([]);
      toast.success('评论发送成功！');
      // 刷新评论列表
      const updatedComments = await postsApi.getWorkComments(post.id);
      setComments(updatedComments);
    } catch (error: any) {
      console.error('发送评论失败:', error);
      toast.error(error.message || '评论发送失败，请稍后重试');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  // 删除评论
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？')) return;
    
    try {
      await postsApi.deleteWorkComment(commentId);
      // 刷新评论列表
      if (post?.id) {
        const updatedComments = await postsApi.getWorkComments(post.id);
        setComments(updatedComments);
      }
      toast.success('评论已删除');
    } catch (error: any) {
      console.error('删除评论失败:', error);
      toast.error(error.message || '删除评论失败');
    }
  };

  // 点赞评论
  const handleLikeComment = async (comment: Comment) => {
    if (!currentUser?.id) {
      toast.error('请先登录后再点赞');
      return;
    }
    
    try {
      const success = await postsApi.likeComment(post?.id || '', comment.id, currentUser.id);
      if (success) {
        // 更新本地评论列表
        const updatedComments = comments.map(c => 
          c.id === comment.id 
            ? { ...c, likes: (c.likes || 0) + 1 }
            : c
        );
        setComments(updatedComments);
        toast.success('点赞成功！');
      }
    } catch (error: any) {
      console.error('点赞评论失败:', error);
      toast.error(error.message || '点赞失败，请稍后重试');
    }
  };

  // 回复评论
  const handleReplyToComment = (comment: Comment) => {
    setReplyToComment(comment);
    setReplyText('');
    setTimeout(() => {
      replyInputRef.current?.focus();
    }, 100);
  };

  // 发送回复
  const handleSendReply = async () => {
    if (!post || !replyToComment || !replyText.trim() || !currentUser?.id) return;
    
    try {
      const success = await postsApi.replyToComment(post.id, replyToComment.id, replyText, currentUser.id);
      if (success) {
        setReplyText('');
        setReplyToComment(null);
        toast.success('回复发送成功！');
        // 刷新评论列表
        const updatedComments = await postsApi.getWorkComments(post.id);
        setComments(updatedComments);
      }
    } catch (error: any) {
      console.error('发送回复失败:', error);
      toast.error(error.message || '回复发送失败，请稍后重试');
    }
  };

  // 分享功能
  const handleShare = async () => {
    if (!post) return;

    try {
      if (!currentUser?.id) {
        toast.error('请先登录');
        return;
      }
      if (post.isBookmarked) {
        await postsApi.unbookmarkPost(post.id, currentUser.id);
        toast.success('已取消收藏');
      } else {
        await postsApi.bookmarkPost(post.id, currentUser.id);
        toast.success('已添加到收藏');
      }
    } catch (error: any) {
      console.error('收藏失败:', error);
      toast.error('收藏失败');
    }
  };

  // 跳转到作者主页
  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post?.author) {
      const authorId = typeof post.author === 'object' ? post.author.id : post.author;
      // 简单判断是否是ID字符串
      if (authorId && authorId !== 'current-user') {
        navigate(`/author/${authorId}`);
      } else {
        // 如果没有ID或者是当前用户演示数据，可以跳到个人中心或提示
        navigate('/profile');
      }
    }
  };

  if (!isOpen) return null;

  // 转换相关作品为 GalleryItem
  const galleryItems: GalleryItem[] = relatedPosts.map(p => ({
    id: p.id,
    thumbnail: p.thumbnail,
    videoUrl: p.videoUrl,
    type: p.type,
    title: p.title,
    author: p.author,
    aspectRatio: Math.random() * (1.5 - 0.75) + 0.75
  }));

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[100] overflow-y-auto custom-scrollbar bg-black/65 backdrop-blur-sm"
          onClick={handleOverlayClick} 
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.8, 0.25, 1] }}
        >
          {/* Close Button - Fixed Position */}
          <motion.button 
            className="fixed top-6 right-6 z-[110] w-12 h-12 flex items-center justify-center rounded-full bg-transparent hover:bg-white/10 text-white transition-colors cursor-pointer"
            onClick={onClose}
            aria-label="关闭详情页"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <i className="fas fa-times text-2xl drop-shadow-md"></i>
          </motion.button>

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 60 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 60 }}
            transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
            className="w-full min-h-screen flex flex-col items-center py-8 px-4 md:py-12 pointer-events-none"
          >
            {/* Card Content */}
            <motion.div 
              className={`pointer-events-auto relative w-full max-w-[1000px] bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row mb-12 transition-colors duration-300`}
              ref={modalRef}
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: isSwitchingPost ? 0.6 : 1,
                scale: isSwitchingPost ? 0.98 : 1,
              }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.25, 0.8, 0.25, 1] }}
            >
              {loading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white dark:bg-gray-900">
                  <div className={styles.loader}><div className={styles.spinner}></div></div>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white dark:bg-gray-900 gap-4">
                  <p className="text-red-500">{error}</p>
                  <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-full">关闭</button>
                </div>
              )}

              {post && !loading && !error && (
                <motion.div
                  ref={contentRef}
                  className="contents"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: isSwitchingPost ? 0 : 1, 
                    y: isSwitchingPost ? -10 : 0 
                  }}
                  transition={{ duration: 0.3, ease: [0.25, 0.8, 0.25, 1] }}
                >
                  {/* Left: Media Section (50-60% width) */}
                  <div className="w-full md:w-[55%] bg-gray-50 dark:bg-black relative group">
                    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center">
                       {/* Image/Video */}
                       {(post.type === 'video' || post.category === 'video' || post.videoUrl) ? (
                         <div className="w-full h-full flex items-center justify-center">
                           {(() => {
                             console.log('Rendering video in PostDetailModal:', { 
                               videoUrl: post.videoUrl, 
                               thumbnail: post.thumbnail, 
                               category: post.category,
                               postId: post.id
                             });
                             
                             // 检查 videoUrl 是否有效
                             const videoUrl = post.videoUrl || '';
                             const hasValidVideoUrl = videoUrl && (
                               videoUrl.startsWith('http') || 
                               videoUrl.startsWith('/') ||
                               videoUrl.startsWith('data:')
                             );
                             
                             if (!hasValidVideoUrl) {
                               console.error('videoUrl is empty or invalid:', videoUrl);
                               return (
                                 <div className="flex flex-col items-center justify-center p-8 text-center">
                                   <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                     <i className="fas fa-video-slash text-gray-400 text-2xl"></i>
                                   </div>
                                   <p className="text-gray-500 dark:text-gray-400">视频链接无效或已失效</p>
                                   <p className="text-xs text-gray-400 mt-2">请联系管理员检查视频资源</p>
                                 </div>
                               );
                             }
                             return null;
                           })()}
                           {(() => {
                             const videoUrl = post.videoUrl || '';
                             const hasValidVideoUrl = videoUrl && (
                               videoUrl.startsWith('http') || 
                               videoUrl.startsWith('/') ||
                               videoUrl.startsWith('data:')
                             );
                             
                             if (!hasValidVideoUrl) return null;
                             
                             // 检查 thumbnail 是否是有效的图片 URL
                             const thumbnailUrl = post.thumbnail || '';
                             const isImageUrl = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i.test(thumbnailUrl);
                             const isVideoUrl = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(thumbnailUrl);
                             
                             // 如果 thumbnail 是视频URL，不使用它作为 poster
                             const posterUrl = isImageUrl && !isVideoUrl && thumbnailUrl.startsWith('http') 
                               ? thumbnailUrl 
                               : 'https://via.placeholder.com/800x600/3b82f6/ffffff?text=Video';
                             
                             return (
                               <LazyVideo 
                                 ref={videoRef}
                                 src={videoUrl}
                                 poster={posterUrl}
                                 alt={post.title}
                                 className="w-full h-full object-contain"
                                 controls={true}
                                 autoPlay={true}
                                 muted={true}
                                 loop={true}
                                 playsInline={true}
                                 priority={true}
                                 onError={(e) => console.error('Video load error:', { videoUrl, error: e })}
                               />
                             );
                           })()}
                         </div>
                       ) : (
                         <div 
                          className="w-full h-full cursor-zoom-in bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                          onClick={() => setIsImageFull(true)}
                        >
                          {post.thumbnail ? (
                            <LazyImage
                             src={post.thumbnail}
                             alt={post.title}
                             className="w-full h-full object-cover md:rounded-l-[32px]"
                             priority={true}
                             quality="high"
                             bare
                             disableFallback={true}
                             onError={(e) => {
                               console.error('[PostDetailModal] Image failed to load:', post.thumbnail);
                               // 显示占位图
                               const target = e.target as HTMLImageElement;
                               target.src = 'https://placehold.co/600x400/e5e7eb/9ca3af?text=图片已过期';
                               target.style.objectFit = 'contain';
                             }}
                           />
                          ) : (
                            <div className="text-center p-8">
                              <i className="fas fa-image text-4xl text-gray-400 mb-4"></i>
                              <p className="text-gray-500">暂无图片</p>
                            </div>
                          )}
                        </div>
                       )}

                       {/* View Fullscreen Button Overlay */}
                       <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button 
                            className="w-10 h-10 bg-white/90 dark:bg-black/70 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsImageFull(true);
                            }}
                          >
                            <i className="fas fa-expand text-gray-800 dark:text-white text-sm"></i>
                          </button>
                       </div>
                    </div>
                  </div>

                  {/* Right: Info Section */}
                  <div className="w-full md:w-[45%] flex flex-col max-h-[800px] md:h-auto">
                    {/* Header Actions */}
                    <div className="px-6 py-6 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10">
                      <div className="flex gap-2">
                        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          <i className="fas fa-ellipsis-h text-gray-700 dark:text-gray-300"></i>
                        </button>
                        <button
                          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          onClick={handleShare}
                          title="分享"
                        >
                          <i className="fas fa-share-alt text-gray-700 dark:hover:text-gray-300"></i>
                        </button>
                      </div>
                      <div className="flex gap-3">
                         <button
                           onClick={() => onLike(post.id)}
                           className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
                             post.isLiked
                               ? 'bg-red-500 text-white hover:bg-red-600'
                               : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white'
                           }`}
                         >
                           {post.isLiked ? '已赞' : '点赞'}
                         </button>
                         <button
                           onClick={handleShare}
                           className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-colors shadow-sm ${
                             post.isBookmarked
                               ? 'bg-gray-600 text-white hover:bg-gray-700'
                               : 'bg-red-600 text-white hover:bg-red-700'
                           }`}
                         >
                           {post.isBookmarked ? '已收藏' : '收藏'}
                         </button>
                      </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-4 custom-scrollbar">
                      {/* Title & Desc */}
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                        {post.title}
                      </h1>
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 whitespace-pre-wrap">
                        {post.description || "暂无描述。"}
                      </p>

                      {/* Author */}
                      <div 
                        className="flex items-center gap-3 mb-6 cursor-pointer group/author"
                        onClick={handleAuthorClick}
                      >
                         <TianjinAvatar 
                           src={typeof post.author === 'object' ? (post.author?.avatar || '') : `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author || post.id}`}
                           alt="Author" 
                           size="md" 
                           className="group-hover/author:opacity-90 transition-opacity"
                         />
                         <div className="flex-1 min-w-0">
                           <div className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover/author:text-red-600 transition-colors">
                              {typeof post.author === 'object' ? post.author?.username : (post.author || '创作者')}
                           </div>
                           <div className="text-xs text-gray-500">
                              {post.views || 0} 浏览
                           </div>
                         </div>
                         {(() => {
                           // 判断是否是作者本人
                           const authorId = typeof post.author === 'object' ? post.author?.id : post.author;
                           const currentUserId = currentUser?.id;
                           const isAuthor = authorId && currentUserId && authorId === currentUserId;
                           
                           if (isAuthor) {
                             // 作者本人显示"我的作品"标签
                             return (
                               <span className="px-4 py-2 rounded-full bg-red-50 text-red-600 text-xs font-bold">
                                 我的作品
                               </span>
                             );
                           }
                           
                           // 非作者显示关注按钮
                           return (
                             <button 
                               className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                                 isFollowing
                                   ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                   : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
                               }`}
                               disabled={followLoading}
                               onClick={async (e) => {
                                 e.stopPropagation();
                                 const authorId = typeof post?.author === 'object' ? post?.author?.id : post?.author;
                                 if (!currentUser?.id || !authorId) {
                                   toast.error('请先登录');
                                   return;
                                 }
                                 
                                 setFollowLoading(true);
                                 try {
                                   if (isFollowing) {
                                     await unfollowUser(currentUser.id, authorId);
                                     setIsFollowing(false);
                                     toast.success('已取消关注');
                                   } else {
                                     await followUser(currentUser.id, authorId);
                                     setIsFollowing(true);
                                     toast.success('已关注');
                                   }
                                 } catch (error: any) {
                                   toast.error(error.message || '操作失败');
                                 } finally {
                                   setFollowLoading(false);
                                 }
                               }}
                             >
                               {followLoading ? '...' : (isFollowing ? '已关注' : '关注')}
                             </button>
                           );
                         })()}
                      </div>

                      {/* Comments Header */}
                      <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          评论 <span className="text-sm font-normal text-gray-500">{comments.length || post.commentCount || 0}</span>
                        </h3>

                        {/* 回复输入框 */}
                        {replyToComment && (
                          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <i className="fas fa-reply text-blue-600 dark:text-blue-400"></i>
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                回复 @{replyToComment.author || '用户'}
                              </span>
                              <button 
                                className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                onClick={() => setReplyToComment(null)}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <input
                                  ref={replyInputRef}
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder={`回复 @${replyToComment.author || '用户'}...`}
                                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSendReply();
                                    }
                                  }}
                                />
                              </div>
                              <button
                                onClick={handleSendReply}
                                disabled={!replyText.trim()}
                                className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                发送
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Comments List */}
                        <div className="space-y-6 mb-24">
                          {commentsLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-3">
                              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-gray-400 text-sm">加载评论中...</span>
                            </div>
                          ) : comments.length > 0 ? (
                            (() => {
                              // 将评论分为主评论和回复
                              const mainComments = comments.filter(c => !c.parentId);
                              const replies = comments.filter(c => c.parentId);
                              
                              return mainComments.map(comment => (
                                <div key={comment.id} className="group">
                                  {/* 主评论 */}
                                  <div className="flex gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800/30 dark:to-transparent hover:from-gray-100/50 dark:hover:from-gray-800/50 transition-all duration-300">
                                    <div className="flex-shrink-0">
                                      <div 
                                        className="relative cursor-pointer"
                                        onClick={() => comment.userId && navigate(`/author/${comment.userId}`)}
                                      >
                                        <TianjinAvatar
                                          src={comment.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userId || comment.id}`}
                                          alt="User"
                                          size="sm"
                                          className="ring-2 ring-white dark:ring-gray-700 shadow-lg hover:ring-blue-400 transition-all"
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span 
                                          className="font-bold text-gray-900 dark:text-white text-base cursor-pointer hover:text-blue-600 transition-colors"
                                          onClick={() => comment.userId && navigate(`/author/${comment.userId}`)}
                                        >{comment.author || '用户'}</span>
                                        <span className="text-xs text-gray-400">·</span>
                                        <span className="text-xs text-gray-400">{new Date(comment.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                      <div className="text-gray-700 dark:text-gray-200 text-base leading-relaxed mb-3">
                                        {comment.content}
                                      </div>
                                      {/* 评论图片 */}
                                      {comment.images && comment.images.length > 0 && (
                                        <div className="flex gap-2 mb-3 flex-wrap">
                                          {comment.images.map((imageUrl, imgIndex) => (
                                            <a 
                                              key={imgIndex} 
                                              href={imageUrl} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="block"
                                            >
                                              <img
                                                src={imageUrl}
                                                alt={`评论图片 ${imgIndex + 1}`}
                                                className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700 hover:opacity-90 transition-opacity cursor-pointer"
                                              />
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-4">
                                        <button 
                                          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group/btn"
                                          onClick={() => handleLikeComment(comment)}
                                        >
                                          <div className="p-1.5 rounded-full group-hover/btn:bg-red-50 dark:group-hover/btn:bg-red-900/20 transition-colors">
                                            <i className="far fa-heart text-base"></i>
                                          </div>
                                          <span className="font-medium">{comment.likes || 0}</span>
                                        </button>
                                        <button 
                                          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group/btn"
                                          onClick={() => handleReplyToComment(comment)}
                                        >
                                          <div className="p-1.5 rounded-full group-hover/btn:bg-blue-50 dark:group-hover/btn:bg-blue-900/20 transition-colors">
                                            <i className="far fa-comment-dots text-base"></i>
                                          </div>
                                          <span className="font-medium">回复</span>
                                        </button>
                                        {currentUser && comment.userId === currentUser.id && (
                                          <button 
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors ml-auto opacity-0 group-hover:opacity-100"
                                          >
                                            <i className="far fa-trash-alt"></i>
                                            <span>删除</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* 回复列表 */}
                                  {replies.filter(r => r.parentId === comment.id).length > 0 && (
                                    <div className="ml-12 mt-3 space-y-3">
                                      {replies.filter(r => r.parentId === comment.id).map(reply => (
                                        <div key={reply.id} className="flex gap-3 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 transition-all duration-200">
                                          <div 
                                            className="cursor-pointer"
                                            onClick={() => reply.userId && navigate(`/author/${reply.userId}`)}
                                          >
                                            <TianjinAvatar
                                              src={reply.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.userId || reply.id}`}
                                              alt="User"
                                              size="xs"
                                              className="ring-2 ring-white dark:ring-gray-700 hover:ring-blue-400 transition-all"
                                            />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span 
                                                className="font-semibold text-gray-900 dark:text-white text-sm cursor-pointer hover:text-blue-600 transition-colors"
                                                onClick={() => reply.userId && navigate(`/author/${reply.userId}`)}
                                              >{reply.author || '用户'}</span>
                                              <span className="text-xs text-gray-400">{new Date(reply.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                            <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-2">
                                              {reply.content}
                                            </div>
                                            {/* 回复图片 */}
                                            {reply.images && reply.images.length > 0 && (
                                              <div className="flex gap-2 mb-2 flex-wrap">
                                                {reply.images.map((imageUrl, imgIndex) => (
                                                  <a 
                                                    key={imgIndex} 
                                                    href={imageUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="block"
                                                  >
                                                    <img
                                                      src={imageUrl}
                                                      alt={`回复图片 ${imgIndex + 1}`}
                                                      className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700 hover:opacity-90 transition-opacity cursor-pointer"
                                                    />
                                                  </a>
                                                ))}
                                              </div>
                                            )}
                                            <div className="flex items-center gap-3">
                                              <button 
                                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                                                onClick={() => handleLikeComment(reply)}
                                              >
                                                <i className="far fa-heart"></i>
                                                <span>{reply.likes || 0}</span>
                                              </button>
                                              <button 
                                                className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                                                onClick={() => handleReplyToComment(reply)}
                                              >
                                                回复
                                              </button>
                                              {currentUser && reply.userId === currentUser.id && (
                                                <button 
                                                  onClick={() => handleDeleteComment(reply.id)}
                                                  className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-auto"
                                                >
                                                  删除
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ));
                            })()
                          ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                              <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                                <i className="far fa-comments text-3xl text-gray-400"></i>
                              </div>
                              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-1">暂无评论</p>
                              <p className="text-gray-400 dark:text-gray-500 text-sm">来抢沙发，发表你的看法吧</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Sticky Comment Input */}
                    <div className="p-4 md:p-6 border-t border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl sticky bottom-0 z-10">
                      {/* 图片预览 */}
                      {commentImagePreviews.length > 0 && (
                        <div className="flex gap-2 mb-3 flex-wrap">
                          {commentImagePreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={preview}
                                alt={`预览 ${index + 1}`}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                              />
                              <button
                                onClick={() => handleRemoveImage(index)}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-start gap-3 bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-300 focus-within:shadow-xl focus-within:border-blue-300 dark:focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100/50 dark:focus-within:ring-blue-900/30">
                        <TianjinAvatar 
                          src={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=current`} 
                          alt="Me" 
                          size="sm"
                          className="mt-0.5 ring-2 ring-gray-100 dark:ring-gray-700"
                        />
                        <div className="flex-1 min-w-0">
                          <textarea
                            ref={commentInputRef}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={handleCommentKeyDown}
                            placeholder="写下你的评论..."
                            rows={1}
                            className="w-full bg-transparent border-none outline-none text-base text-gray-900 dark:text-white placeholder-gray-400 resize-none overflow-hidden"
                            style={{ minHeight: '24px', maxHeight: '120px' }}
                          />
                        </div>
                        <button 
                          onClick={handleSendComment}
                          disabled={(!commentText.trim() && commentImages.length === 0) || isUploading}
                          className={`
                            flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300
                            ${(commentText.trim() || commentImages.length > 0) && !isUploading
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                            }
                          `}
                        >
                          {isUploading ? (
                            <i className="fas fa-spinner fa-spin text-sm"></i>
                          ) : (
                            <i className="fas fa-paper-plane text-sm"></i>
                          )}
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2 px-1">
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          {/* 图片上传按钮 */}
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                            accept="image/*"
                            multiple
                            className="hidden"
                          />
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={commentImages.length >= 4}
                            className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <i className="far fa-image"></i>
                            <span>图片{commentImages.length > 0 && `(${commentImages.length}/4)`}</span>
                          </button>
                          
                          {/* 表情选择按钮 */}
                          <div className="relative">
                            <button 
                              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                              className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-1"
                            >
                              <i className="far fa-smile"></i>
                              <span>表情</span>
                            </button>
                            
                            {/* 表情选择器弹窗 */}
                            {showEmojiPicker && (
                              <>
                                <div 
                                  className="fixed inset-0 z-40"
                                  onClick={() => setShowEmojiPicker(false)}
                                />
                                <div className="absolute bottom-full left-0 mb-2 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 w-72">
                                  <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                                    {EMOJI_LIST.map((emoji, index) => (
                                      <button
                                        key={index}
                                        onClick={() => handleEmojiSelect(emoji)}
                                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-lg"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {commentText.length > 0 && `${commentText.length} 字`}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Related Works (Outside the card, white text on dark overlay) */}
            {post && !loading && !error && (
              <div className="w-full max-w-[1400px] pointer-events-auto px-4">
                <h3 className="text-xl font-bold text-white mb-6 text-center">更多精彩推荐</h3>
                <WaterfallGallery 
                  items={galleryItems}
                  onItemClick={async (item) => {
                    const targetPost = relatedPosts.find(p => p.id === item.id);
                    if (!targetPost) {
                      window.location.href = `/square/${item.id}`;
                      return;
                    }
                    
                    // 平滑切换作品
                    setIsSwitchingPost(true);
                    
                    // 滚动到顶部
                    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    
                    // 短暂延迟后切换内容
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    if (onPostChange) {
                      onPostChange(targetPost);
                    } else {
                      window.location.href = `/square/${item.id}`;
                    }
                    
                    setIsSwitchingPost(false);
                  }}
                  isLoading={false}
                />
              </div>
            )}
          </motion.div>

          {/* Fullscreen Preview Overlay */}
          <AnimatePresence>
            {isImageFull && post && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[120] bg-black flex items-center justify-center p-4 cursor-zoom-out"
                onClick={() => setIsImageFull(false)}
              >
                <img 
                  src={post.thumbnail} 
                  alt={post.title}
                  className="max-w-full max-h-full object-contain"
                  onClick={(e) => e.stopPropagation()} 
                />
                <button 
                  className="absolute top-6 right-6 text-white/80 hover:text-white p-2"
                  onClick={() => setIsImageFull(false)}
                >
                  <i className="fas fa-times text-3xl"></i>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PostDetailModal;