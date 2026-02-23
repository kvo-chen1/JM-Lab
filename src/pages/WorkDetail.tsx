// 作品详情页面 - Pinterest风格两栏布局
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import postsApi, { Post, Comment, followUser, unfollowUser, checkUserFollowing, addComment } from '@/services/postService';
import { TianjinAvatar } from '@/components/TianjinStyleComponents';
import LazyImage from '@/components/LazyImage';
import LazyVideo from '@/components/LazyVideo';
import { toast } from 'sonner';
import { useCommunityStore } from '@/stores/communityStore';
import { AuthContext } from '@/contexts/authContext';
import { communityService } from '@/services/communityService';
import type { UserProfile } from '@/lib/supabase';
import styles from './WorkDetail.module.scss';
import WorkShareModal from '@/components/share/WorkShareModal';
import { Users, MessageCircle, Link2, X } from 'lucide-react';

// 常用表情列表
const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
  '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
  '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕',
  '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁',
  '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣',
  '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹',
  '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '❤️', '🧡',
  '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
  '👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
  '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✊', '👊', '🤛', '🤜', '💪', '🎉', '🎊',
  '✨', '⭐', '🌟', '💫', '🔥', '💥', '💢', '💦', '💧', '💤', '💨', '👂', '👃', '🧠', '👀', '👁️',
  '👅', '👄', '👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👩‍🦱', '🧑‍🦱', '👨‍🦱', '👩‍🦰', '🧑‍🦰', '👨‍🦰', '👱‍♀️',
  '👱', '👱‍♂️', '👩‍🦳', '🧑‍🦳', '👨‍🦳', '👩‍🦲', '🧑‍🦲', '👨‍🦲', '🧔‍♀️', '🧔', '🧔‍♂️', '👵', '🧓', '👴', '👲', '👳‍♀️',
  '👳', '👳‍♂️', '🧕', '👮‍♀️', '👮', '👮‍♂️', '👷‍♀️', '👷', '👷‍♂️', '💂‍♀️', '💂', '💂‍♂️', '🕵️‍♀️', '🕵️', '🕵️‍♂️',
  '👩‍⚕️', '🧑‍⚕️', '👨‍⚕️', '👩‍🌾', '🧑‍🌾', '👨‍🌾', '👩‍🍳', '🧑‍🍳', '👨‍🍳', '👩‍🎓', '🧑‍🎓', '👨‍🎓', '👩‍🎤', '🧑‍🎤', '👨‍🎤',
  '👩‍🏫', '🧑‍🏫', '👨‍🏫', '👩‍🏭', '🧑‍🏭', '👨‍🏭', '👩‍💻', '🧑‍💻', '👨‍💻', '👩‍💼', '🧑‍💼', '👨‍💼', '👩‍🔧', '🧑‍🔧', '👨‍🔧',
  '👩‍🔬', '🧑‍🔬', '👨‍🔬', '👩‍🎨', '🧑‍🎨', '👨‍🎨', '👩‍🚒', '🧑‍🚒', '👨‍🚒', '👩‍✈️', '🧑‍✈️', '👨‍✈️', '👩‍🚀', '🧑‍🚀', '👨‍🚀',
  '👩‍⚖️', '🧑‍⚖️', '👨‍⚖️', '👰‍♀️', '👰', '👰‍♂️', '🤵‍♀️', '🤵', '🤵‍♂️', '👸', '🤴', '🦸‍♀️', '🦸', '🦸‍♂️',
  '🦹‍♀️', '🦹', '🦹‍♂️', '🤶', '🧑‍🎄', '🎅', '🧙‍♀️', '🧙', '🧙‍♂️', '🧝‍♀️', '🧝', '🧝‍♂️', '🧛‍♀️', '🧛', '🧛‍♂️',
  '🧜‍♀️', '🧜', '🧜‍♂️', '🧚‍♀️', '🧚', '🧚‍♂️', '👼', '🤰', '🤱', '👩‍🍼', '🧑‍🍼', '👨‍🍼', '🙇‍♀️', '🙇', '🙇‍♂️',
  '💁‍♀️', '💁', '💁‍♂️', '🙅‍♀️', '🙅', '🙅‍♂️', '🙆‍♀️', '🙆', '🙆‍♂️', '🙋‍♀️', '🙋', '🙋‍♂️', '🧏‍♀️', '🧏', '🧏‍♂️',
  '🤦‍♀️', '🤦', '🤦‍♂️', '🤷‍♀️', '🤷', '🤷‍♂️', '🙎‍♀️', '🙎', '🙎‍♂️', '🙍‍♀️', '🙍', '🙍‍♂️', '💇‍♀️', '💇', '💇‍♂️',
  '💆‍♀️', '💆', '💆‍♂️', '🧖‍♀️', '🧖', '🧖‍♂️', '💅', '🤳', '💃', '🕺', '👯‍♀️', '👯', '👯‍♂️', '🕴️', '👩‍🦽',
  '🧑‍🦽', '👨‍🦽', '👩‍🦼', '🧑‍🦼', '👨‍🦼', '🚶‍♀️', '🚶', '🚶‍♂️', '👩‍🦯', '🧑‍🦯', '👨‍🦯', '🧎‍♀️', '🧎', '🧎‍♂️',
  '🏃‍♀️', '🏃', '🏃‍♂️', '🧍‍♀️', '🧍', '🧍‍♂️', '👭', '🧑‍🤝‍🧑', '👬', '👫', '👩‍❤️‍👩', '💑', '👨‍❤️‍👨',
  '👩‍❤️‍👨', '👩‍❤️‍💋‍👩', '💏', '👨‍❤️‍💋‍👨', '👩‍❤️‍💋‍👨', '👪', '👨‍👩‍👦', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦',
  '👨‍👩‍👧‍👧', '👨‍👦', '👨‍👦‍👦', '👨‍👧', '👨‍👧‍👦', '👨‍👧‍👧', '👩‍👦', '👩‍👦‍👦', '👩‍👧', '👩‍👧‍👦', '👩‍👧‍👧',
  '🗣️', '👤', '👥', '🫂', '👣', '🐵', '🐒', '🦍', '🦧', '🐶', '🐕', '🦮', '🐕‍🦺', '🐩', '🐺', '🦊',
  '🦝', '🐱', '🐈', '🐈‍⬛', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🦬', '🐮', '🐂',
  '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦣', '🦏',
  '🦛', '🐭', '🐁', '🐀', '🐹', '🐰', '🐇', '🐿️', '🦫', '🦔', '🦇', '🐻', '🐻‍❄️', '🐨', '🐼', '🦥',
  '🦦', '🦨', '🦘', '🦡', '🐾', '🦃', '🐔', '🐓', '🐣', '🐤', '🐥', '🐦', '🐧', '🕊️', '🦅', '🦆',
  '🦢', '🦉', '🦤', '🪶', '🦩', '🦚', '🦜', '🐸', '🐊', '🐢', '🦎', '🐍', '🐲', '🐉', '🦕', '🦖',
  '🐳', '🐋', '🐬', '🦭', '🐟', '🐠', '🐡', '🦈', '🐙', '🐚', '🐌', '🦋', '🐛', '🐜', '🐝', '🪲',
  '🐞', '🦗', '🪳', '🕷️', '🕸️', '🦂', '🦟', '🪰', '🪱', '🦠', '💐', '🌸', '💮', '🏵️', '🌹', '🥀',
  '🌺', '🌻', '🌼', '🌷', '🌱', '🪴', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂',
  '🍃', '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🫐',
  '🥝', '🍅', '🫒', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦', '🧄', '🧅',
  '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🫓', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓',
  '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🫕', '🥣',
  '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤',
  '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🦀', '🦞', '🦐', '🦑', '🦪', '🍦', '🍧', '🍨', '🍩', '🍪',
  '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', '🫖', '🍵', '🍶', '🍾',
  '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤', '🧋', '🧃', '🧉', '🧊', '🥢', '🍽️', '🍴', '🥄',
  '🔪', '🏺', '🌍', '🌎', '🌏', '🌐', '🗺️', '🧭', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️',
  '🏞️', '🏟️', '🏛️', '🏗️', '🧱', '🪨', '🪵', '🛖', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥',
  '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍',
  '⛩️', '🕋', '⛲', '⛺', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '♨️', '🎠', '🎡', '🎢',
  '💈', '🎪', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍',
  '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🛻', '🚚', '🚛', '🚜', '🏎️',
  '🏍️', '🛵', '🦽', '🦼', '🛺', '🚲', '🛴', '🛹', '🛼', '🚏', '🛣️', '🛤️', '🛢️', '⛽', '🚨', '🚥',
  '🚦', '🛑', '🚧', '⚓', '⛵', '🛶', '🚤', '🛳️', '⛴️', '🚢', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺',
  '🚁', '🚟', '🚠', '🚡', '🛰️', '🚀', '🛸', '🛎️', '🧳', '⌚', '⏰', '⏱️', '⏲️', '🕰️', '🕛', '🕧',
  '🕐', '🕜', '🕑', '🕝', '🕒', '🕞', '🕓', '🕟', '🕔', '🕠', '🕕', '🕡', '🕖', '🕢', '🕗', '🕣',
  '🕘', '🕤', '🕙', '🕥', '🕚', '🕦', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚',
  '🌛', '🌜', '🌡️', '☀️', '🌝', '🌞', '🪐', '⭐', '🌟', '🌠', '🌌', '☁️', '⛅', '⛈️', '🌤️', '🌥️',
  '🌦️', '🌧️', '🌨️', '❄️', '🌬️', '💨', '🌪️', '🌫️', '🌈', '☔', '💧', '💦', '🌊'
];

interface WorkDetailProps {
  currentUser?: UserProfile;
}

// 推荐作品接口
interface RecommendedWork {
  id: string;
  thumbnail: string;
  title: string;
  author: string;
  authorAvatar?: string;
  aspectRatio: number;
  type?: 'image' | 'video';
  likes?: number;
  videoUrl?: string;
}

const WorkDetail: React.FC<WorkDetailProps> = ({ currentUser: propUser }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser: storeUser } = useCommunityStore();
  const { user: authUser } = React.useContext(AuthContext);
  const { isDark } = useTheme();
  
  const currentUser = propUser || storeUser || authUser;
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [recommendedWorks, setRecommendedWorks] = useState<RecommendedWork[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isImageFull, setIsImageFull] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentImages, setCommentImages] = useState<File[]>([]);
  const [commentImagePreviews, setCommentImagePreviews] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [replyToComment, setReplyToComment] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState('');
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [activeCommentMenu, setActiveCommentMenu] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isWorkShareModalOpen, setIsWorkShareModalOpen] = useState(false);

  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 生成错落有致的推荐作品
  const generateRecommendedWorks = useCallback((): RecommendedWork[] => {
    const titles = [
      '梦幻星空下的城市', '极简主义建筑', '自然光影艺术', '抽象色彩碰撞',
      '复古胶片风格', '未来科技感', '东方美学意境', '街头人文纪实',
      '微距世界探索', '建筑几何之美', '光影交错瞬间', '色彩情绪表达',
      '极简黑白摄影', '自然风光大片', '城市夜景霓虹', '人文情感记录',
      '创意设计灵感', '艺术装置展示', '时尚摄影大片', '生活美学记录'
    ];
    
    const authors = ['创意达人', '视觉艺术家', '摄影师小王', '设计师阿明', '艺术创作者'];
    
    return Array.from({ length: 20 }, (_, i) => {
      // 生成 0.75 - 1.5 之间的随机宽高比，创造错落感
      const aspectRatio = 0.75 + Math.random() * 0.75;
      const width = 400;
      const height = Math.round(width / aspectRatio);
      
      return {
        id: `rec-${i}`,
        thumbnail: `https://picsum.photos/seed/${id}-${i}/${width}/${height}`,
        title: titles[i % titles.length],
        author: authors[i % authors.length],
        authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=author${i}`,
        aspectRatio,
        type: Math.random() > 0.8 ? 'video' : 'image',
        likes: Math.floor(Math.random() * 1000) + 50
      };
    });
  }, [id]);

  // 加载帖子详情
  useEffect(() => {
    const loadPost = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        
        const allPosts = await postsApi.getPosts(undefined, currentUser?.id);
        const postData = allPosts.find(p => p.id === id);

        if (postData) {
          setPost(postData);
        } else {
          try {
            const thread = await communityService.getThread(id);
            if (thread) {
              setPost(convertThreadToPost(thread));
            } else {
              setError('未找到该作品');
            }
          } catch (threadError) {
            console.error('从社区服务获取作品失败:', threadError);
            setError('未找到该作品');
          }
        }
        
        // 使用真实作品数据作为推荐作品（排除当前作品）
        const otherPosts = allPosts.filter(p => p.id !== id);
        const realRecommendedWorks: RecommendedWork[] = otherPosts.map((post, index) => {
          // 计算宽高比：优先使用原始数据，如果没有则基于ID生成一个固定的错落有致的宽高比
          let aspectRatio = post.aspectRatio || (post.width && post.height ? post.width / post.height : 0);
          if (!aspectRatio || aspectRatio === 1) {
            // 基于作品ID生成一个固定的宽高比（0.75 - 1.5之间），确保同一作品每次显示一致
            const idHash = post.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            aspectRatio = 0.75 + (idHash % 75) / 100; // 0.75 - 1.5
          }
          
          return {
            id: post.id,
            thumbnail: post.thumbnail || '',
            title: post.title || '无标题',
            author: typeof post.author === 'object' ? post.author?.username || '未知作者' : post.author || '未知作者',
            authorAvatar: typeof post.author === 'object' ? post.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.id || index}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${index}`,
            aspectRatio,
            type: post.type || 'image',
            likes: post.likes || 0,
            videoUrl: post.videoUrl || (post.type === 'video' ? post.thumbnail : undefined)
          };
        });
        
        setRecommendedWorks(realRecommendedWorks);
      } catch (error) {
        console.error('加载作品详情失败:', error);
        setError('加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [id, currentUser?.id]);

  // 加载评论
  useEffect(() => {
    const loadComments = async () => {
      if (post?.id) {
        setCommentsLoading(true);
        try {
          const workComments = await postsApi.getWorkComments(post.id);
          setComments(workComments);
        } catch (error) {
          console.error('加载评论失败:', error);
        } finally {
          setCommentsLoading(false);
        }
      }
    };
    loadComments();
  }, [post?.id]);

  // 检查关注状态
  useEffect(() => {
    const checkFollowStatus = async () => {
      const authorId = typeof post?.author === 'object' ? post?.author?.id : post?.author;
      if (authorId && currentUser?.id) {
        try {
          const following = await checkUserFollowing(currentUser.id, authorId);
          setIsFollowing(following);
        } catch (error) {
          console.error('检查关注状态失败:', error);
        }
      }
    };
    checkFollowStatus();
  }, [post?.author, currentUser?.id]);

  // 将社区帖子转换为 Post 格式
  const convertThreadToPost = (thread: any): Post => {
    return {
      id: thread.id,
      title: thread.title || '无标题',
      thumbnail: thread.images?.[0] || '',
      type: thread.images?.length > 0 ? 'image' : 'text',
      likes: thread.upvotes || 0,
      comments: (thread.comments || []).map((c: any) => ({
        id: c.id,
        content: c.content,
        date: c.created_at || new Date(c.createdAt).toISOString(),
        author: c.author || c.user || '未知用户',
        authorAvatar: c.authorAvatar || c.userAvatar || c.avatar || '',
        likes: c.likes || 0,
      })),
      date: new Date(thread.createdAt).toISOString(),
      author: thread.author ? {
        id: thread.authorId || '',
        username: thread.author,
        email: '',
        avatar: thread.authorAvatar || '',
      } : undefined,
      isLiked: false,
      isBookmarked: false,
      category: 'other',
      tags: thread.topic ? [thread.topic] : [],
      description: thread.content || '',
      views: 0,
      shares: 0,
      isFeatured: false,
      isDraft: false,
      completionStatus: 'published',
      creativeDirection: '',
      culturalElements: [],
      colorScheme: [],
      toolsUsed: [],
      publishType: 'community',
      communityId: thread.communityId || null,
      moderationStatus: 'approved',
      rejectionReason: null,
      scheduledPublishDate: null,
      visibility: 'public',
      commentCount: thread.comments?.length || 0,
      engagementRate: 0,
      trendingScore: 0,
      reach: 0,
      moderator: null,
      reviewedAt: null,
      recommendationScore: 0,
      recommendedFor: [],
    };
  };

  // 处理点赞
  const handleLike = async () => {
    if (!post?.id) return;
    try {
      const postId = post.id;
      if (post.isLiked) {
        await postsApi.unlikePost(postId, currentUser?.id);
      } else {
        await postsApi.likePost(postId, currentUser?.id);
      }
      const updatedPost = await postsApi.getPosts().then(posts => posts.find(p => p.id === postId));
      if (updatedPost) setPost(updatedPost);
    } catch (error) {
      console.error('点赞操作失败:', error);
    }
  };

  // 处理收藏
  const handleBookmark = async () => {
    if (!post?.id || !currentUser?.id) {
      toast.error('请先登录');
      return;
    }
    try {
      if (post.isBookmarked) {
        await postsApi.unbookmarkPost(post.id, currentUser.id);
        toast.success('已取消收藏');
      } else {
        await postsApi.bookmarkPost(post.id, currentUser.id);
        toast.success('已添加到收藏');
      }
      setPost({ ...post, isBookmarked: !post.isBookmarked });
    } catch (error) {
      toast.error('收藏失败');
    }
  };

  // 处理分享
  const handleShare = async () => {
    setIsShareModalOpen(true);
  };

  // 处理复制链接
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('链接已复制到剪贴板');
    } catch (error) {
      toast.error('复制失败，请手动复制');
    }
  };

  // 处理私信分享
  const handlePrivateShare = () => {
    setIsShareModalOpen(false);
    setIsWorkShareModalOpen(true);
  };

  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 4 - commentImages.length);
    if (newFiles.length === 0) {
      toast.error('最多只能上传4张图片');
      return;
    }
    setCommentImages(prev => [...prev, ...newFiles]);
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

  // 发送评论
  const handleSendComment = async () => {
    if (!post?.id) return;
    if (!commentText.trim() && commentImages.length === 0) {
      toast.error('请输入评论内容或上传图片');
      return;
    }
    setIsUploading(true);
    try {
      await addComment(post.id, commentText, undefined, currentUser as any, commentImages);
      setCommentText('');
      setCommentImages([]);
      setCommentImagePreviews([]);
      toast.success('评论发送成功！');
      const updatedComments = await postsApi.getWorkComments(post.id);
      setComments(updatedComments);
    } catch (error: any) {
      toast.error(error.message || '评论发送失败');
    } finally {
      setIsUploading(false);
    }
  };

  // 点赞评论
  const handleLikeComment = async (comment: Comment) => {
    if (!currentUser?.id) {
      toast.error('请先登录');
      return;
    }
    try {
      await postsApi.likeComment(post?.id || '', comment.id, currentUser.id);
      const updatedComments = comments.map(c => 
        c.id === comment.id ? { ...c, likes: (c.likes || 0) + 1 } : c
      );
      setComments(updatedComments);
    } catch (error) {
      toast.error('点赞失败');
    }
  };

  // 删除评论
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？')) return;
    try {
      await postsApi.deleteWorkComment(commentId);
      if (post?.id) {
        const updatedComments = await postsApi.getWorkComments(post.id);
        setComments(updatedComments);
      }
      toast.success('评论已删除');
    } catch (error) {
      toast.error('删除评论失败');
    }
  };

  // 回复评论
  const handleReplyToComment = (comment: Comment) => {
    setReplyToComment(comment);
    setReplyText('');
    setTimeout(() => replyInputRef.current?.focus(), 100);
  };

  // 发送回复
  const handleSendReply = async () => {
    if (!post?.id || !replyToComment || !replyText.trim() || !currentUser?.id) return;
    try {
      await postsApi.replyToComment(post.id, replyToComment.id, replyText, currentUser.id);
      setReplyText('');
      setReplyToComment(null);
      toast.success('回复发送成功！');
      const updatedComments = await postsApi.getWorkComments(post.id);
      setComments(updatedComments);
    } catch (error) {
      toast.error('回复发送失败');
    }
  };

  // 处理关注
  const handleFollow = async (e: React.MouseEvent) => {
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
    } catch (error) {
      toast.error('操作失败');
    } finally {
      setFollowLoading(false);
    }
  };

  // 跳转到作者主页
  const handleAuthorClick = () => {
    const authorId = typeof post?.author === 'object' ? post?.author?.id : post?.author;
    if (authorId && authorId !== 'current-user') {
      navigate(`/author/${authorId}`);
    } else {
      navigate('/profile');
    }
  };

  // 渲染瀑布流推荐作品
  const renderMasonryGrid = (works: RecommendedWork[] = recommendedWorks, columnCount: number = 3) => {
    // 将作品分成指定列数
    const columns: RecommendedWork[][] = Array.from({ length: columnCount }, () => []);
    works.forEach((work, index) => {
      columns[index % columnCount].push(work);
    });

    return (
      <div className={styles.masonryContainer}>
        {columns.map((column, colIndex) => (
          <div key={colIndex} className={styles.masonryColumn}>
            {column.map((work) => (
              <motion.div
                key={work.id}
                className={styles.masonryItem}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                onClick={() => {
                  if (work.id === id) {
                    // 如果点击的是当前作品，不执行任何操作
                    return;
                  }
                  navigate(`/post/${work.id}`);
                }}
              >
                <div className={styles.masonryImageWrapper} style={{ paddingBottom: `${(1 / work.aspectRatio) * 100}%` }}>
                  {work.type === 'video' && work.videoUrl ? (
                    <video
                      src={work.videoUrl}
                      className={styles.masonryImage}
                      muted
                      playsInline
                      loop
                      autoPlay
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={work.thumbnail}
                      alt={work.title}
                      className={styles.masonryImage}
                      loading="lazy"
                      onError={(e) => {
                        // 图片加载失败时显示占位图
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                      }}
                    />
                  )}
                  {work.type === 'video' && (
                    <div className={styles.videoBadge}>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      <span>视频</span>
                    </div>
                  )}
                </div>
                <div className={styles.masonryInfo}>
                  <h4 className={styles.masonryTitle}>{work.title}</h4>
                  <div className={styles.masonryMeta}>
                    <div className={styles.masonryAuthor}>
                      <img src={work.authorAvatar} alt={work.author} />
                      <span>{work.author}</span>
                    </div>
                    <div className={styles.masonryLikes}>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      <span>{work.likes}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className={styles.errorContainer}>
        <p>{error || '作品不存在'}</p>
        <button onClick={() => navigate(-1)}>返回</button>
      </div>
    );
  }

  const isAuthor = currentUser?.id === (typeof post.author === 'object' ? post.author?.id : post.author);

  return (
    <div className={`${styles.workDetailPage} ${isDark ? styles.dark : ''}`}>
      {/* 主内容区 - 两栏布局 */}
      <main className={styles.mainContent}>
        {/* 左侧空白区域 */}
        <div className={styles.leftSpacer}>
          <button className={styles.spacerBackButton} onClick={() => navigate(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <button 
            className={styles.scrollToBottomButton} 
            onClick={() => {
              const bottomRecommended = document.getElementById('bottom-recommended');
              if (bottomRecommended) {
                bottomRecommended.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } else {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
              }
            }}
            title="滑动到底部"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M19 12l-7 7-7-7"/>
            </svg>
          </button>
        </div>

        {/* 左侧：作品详情 */}
        <div className={styles.leftColumn} ref={contentRef}>
          <div className={styles.contentCard}>
            {/* 卡片内顶部导航 */}
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderActions}>
                <button className={`${styles.cardIconButton} ${post.isLiked ? styles.liked : ''}`} onClick={handleLike}>
                  <svg viewBox="0 0 24 24" fill={post.isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                  <span className={post.isLiked ? styles.likedText : ''}>{post.likes || 0}</span>
                </button>
                <button className={styles.cardIconButton} onClick={() => {
                  // 滚动到评论区
                  const commentsSection = document.getElementById('comments-section');
                  if (commentsSection) {
                    commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                  </svg>
                </button>
                <button className={styles.cardIconButton} onClick={handleShare}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                    <polyline points="16,6 12,2 8,6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                </button>
                <button className={styles.cardIconButton}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="1"/>
                    <circle cx="19" cy="12" r="1"/>
                    <circle cx="5" cy="12" r="1"/>
                  </svg>
                </button>
              </div>
              <button
                className={`${styles.cardSaveButton} ${post.isBookmarked ? styles.saved : ''}`}
                onClick={handleBookmark}
              >
                {post.isBookmarked ? '已收藏' : '收藏'}
              </button>
            </div>
            {/* 作品媒体展示 */}
            <div className={styles.mediaSection}>
              {(post.type === 'video' || post.videoUrl) ? (
                <LazyVideo
                  src={post.videoUrl || ''}
                  poster={post.thumbnail}
                  alt={post.title}
                  className={styles.mediaContent}
                  controls={true}
                  autoPlay={false}
                  muted={true}
                  loop={true}
                  playsInline={true}
                />
              ) : (
                <div className={styles.imageWrapper} onClick={() => setIsImageFull(true)}>
                  <LazyImage
                    src={post.thumbnail}
                    alt={post.title}
                    className={styles.mediaContent}
                    priority={true}
                  />
                  <div className={styles.zoomHint}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* 作品信息 */}
            <div className={styles.workInfo}>
              <h1 className={styles.workTitle}>{post.title}</h1>
              <p className={styles.workDescription}>{post.description || '暂无描述'}</p>
            
              {/* 作者信息 */}
              <div className={styles.authorSection}>
                <div className={styles.authorInfo} onClick={handleAuthorClick}>
                  <TianjinAvatar
                    src={typeof post.author === 'object' ? (post.author?.avatar || '') : `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author || post.id}`}
                    alt="Author"
                    size="md"
                  />
                  <div className={styles.authorMeta}>
                    <span className={styles.authorName}>
                      {typeof post.author === 'object' ? post.author?.username : (post.author || '创作者')}
                    </span>
                    <span className={styles.viewCount}>{post.views || 0} 浏览</span>
                  </div>
                </div>
                {isAuthor ? (
                  <span className={styles.myWorkBadge}>我的作品</span>
                ) : (
                  <button 
                    className={`${styles.followButton} ${isFollowing ? styles.following : ''}`}
                    onClick={handleFollow}
                    disabled={followLoading}
                  >
                    {followLoading ? '...' : (isFollowing ? '已关注' : '关注')}
                  </button>
                )}
              </div>

              {/* 标签 */}
              {post.tags && post.tags.length > 0 && (
                <div className={styles.tagsSection}>
                  {post.tags.map((tag, index) => (
                    <span key={index} className={styles.tag}>#{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* 评论区 */}
            <div id="comments-section" className={styles.commentsSection}>
              <h3 
                className={styles.commentsTitle}
                onClick={() => setCommentsExpanded(!commentsExpanded)}
                aria-expanded={commentsExpanded}
              >
                {comments.length || post.commentCount || 0}条评论
              </h3>

              {/* 回复输入框 */}
              {replyToComment && (
                <div className={styles.replyBox}>
                  <div className={styles.replyHeader}>
                    <span>回复 @{replyToComment.author || '用户'}</span>
                    <button onClick={() => setReplyToComment(null)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                  <div className={styles.replyInputRow}>
                    <input
                      ref={replyInputRef}
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`回复 @${replyToComment.author || '用户'}...`}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                    />
                    <button onClick={handleSendReply} disabled={!replyText.trim()}>
                      发送
                    </button>
                  </div>
                </div>
              )}

              {/* 评论列表 */}
              <div className={`${styles.commentsList} ${commentsExpanded ? styles.expanded : styles.collapsed}`}>
                {commentsLoading ? (
                  <div className={styles.commentsLoading}>
                    <div className={styles.spinnerSmall} />
                    <span>加载评论中...</span>
                  </div>
                ) : comments.length > 0 ? (
                  comments.filter(c => !c.parentId).map(comment => {
                    const replies = comments.filter(r => r.parentId === comment.id);
                    return (
                      <div key={comment.id} className={styles.commentItem}>
                        <div className={styles.commentMain}>
                          <TianjinAvatar
                            src={comment.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userId || comment.id}`}
                            alt="User"
                            size="sm"
                          />
                          <div className={styles.commentContent}>
                            <div className={styles.commentHeader}>
                              <span className={styles.commentAuthor}>{comment.author || '用户'}</span>
                              <span className={styles.commentDate}>
                                {new Date(comment.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className={styles.commentText}>{comment.content}</p>
                            {comment.images && comment.images.length > 0 && (
                              <div className={styles.commentImages}>
                                {comment.images.map((img, idx) => (
                                  <img key={idx} src={img} alt={`评论图片 ${idx + 1}`} />
                                ))}
                              </div>
                            )}
                            <div className={styles.commentActions}>
                              <span className={styles.commentTime}>刚刚</span>
                              <button onClick={() => handleReplyToComment(comment)}>
                                回复
                              </button>
                              <button onClick={() => handleLikeComment(comment)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                                </svg>
                              </button>
                              <div className={styles.commentMenuWrapper}>
                                <button
                                  className={styles.moreBtn}
                                  onClick={() => setActiveCommentMenu(activeCommentMenu === comment.id ? null : comment.id)}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="1"/>
                                    <circle cx="19" cy="12" r="1"/>
                                    <circle cx="5" cy="12" r="1"/>
                                  </svg>
                                </button>
                                {activeCommentMenu === comment.id && (
                                  <>
                                    <div className={styles.menuOverlay} onClick={() => setActiveCommentMenu(null)} />
                                    <div className={styles.commentMenu}>
                                      <button onClick={() => { setActiveCommentMenu(null); }}>
                                        编辑
                                      </button>
                                      {currentUser && comment.userId === currentUser.id && (
                                        <button
                                          className={styles.deleteMenuItem}
                                          onClick={() => { setActiveCommentMenu(null); handleDeleteComment(comment.id); }}
                                        >
                                          删除
                                        </button>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* 回复列表 */}
                        {replies.length > 0 && (
                          <div className={styles.repliesList}>
                            {replies.map(reply => (
                              <div key={reply.id} className={styles.replyItem}>
                                <TianjinAvatar
                                  src={reply.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.userId || reply.id}`}
                                  alt="User"
                                  size="xs"
                                />
                                <div className={styles.replyContent}>
                                  <div className={styles.replyHeader}>
                                    <span>{reply.author || '用户'}</span>
                                    <span>{new Date(reply.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
                                  </div>
                                  <p>{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.emptyComments}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                    <p>暂无评论</p>
                    <span>来抢沙发，发表你的看法吧</span>
                  </div>
                )}
              </div>
            </div>

            {/* 评论输入框 */}
            <div className={styles.commentInputSection}>
              {commentImagePreviews.length > 0 && (
                <div className={styles.imagePreviews}>
                  {commentImagePreviews.map((preview, index) => (
                    <div key={index} className={styles.previewItem}>
                      <img src={preview} alt={`预览 ${index + 1}`} />
                      <button onClick={() => handleRemoveImage(index)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className={styles.commentInputWrapper}>
                <TianjinAvatar
                  src={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=current`}
                  alt="Me"
                  size="sm"
                />
                <div className={styles.inputArea}>
                  <textarea
                    ref={commentInputRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="写下你的评论..."
                    rows={1}
                  />
                  <div className={styles.inputActions}>
                    <div className={styles.inputTools}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        multiple
                        className={styles.hiddenInput}
                      />
                      <button 
                        className={styles.toolButton}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={commentImages.length >= 4}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21,15 16,10 5,21"/>
                        </svg>
                        <span>图片{commentImages.length > 0 && `(${commentImages.length}/4)`}</span>
                      </button>
                      <div className={styles.emojiWrapper}>
                        <button 
                          className={styles.toolButton}
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                            <line x1="9" y1="9" x2="9.01" y2="9"/>
                            <line x1="15" y1="9" x2="15.01" y2="9"/>
                          </svg>
                          <span>表情</span>
                        </button>
                        {showEmojiPicker && (
                          <>
                            <div className={styles.emojiOverlay} onClick={() => setShowEmojiPicker(false)} />
                            <div className={styles.emojiPicker}>
                              {EMOJI_LIST.map((emoji, index) => (
                                <button key={index} onClick={() => handleEmojiSelect(emoji)}>
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <button 
                      className={styles.sendButton}
                      onClick={handleSendComment}
                      disabled={(!commentText.trim() && commentImages.length === 0) || isUploading}
                    >
                      {isUploading ? (
                        <div className={styles.spinnerTiny} />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="22" y1="2" x2="11" y2="13"/>
                          <polygon points="22,2 15,22 11,13 2,9"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部推荐作品（两列布局） */}
            <div className={styles.bottomRecommended}>
              <h3 className={styles.bottomRecommendedTitle}>更多精彩推荐</h3>
              {renderMasonryGrid(recommendedWorks.slice(0, Math.ceil(recommendedWorks.length / 2)), 2)}
            </div>
          </div>
        </div>

        {/* 右侧：推荐作品（右半部分） */}
        <aside className={styles.rightColumn}>
          <div className={styles.stickyWrapper}>
            {renderMasonryGrid(recommendedWorks.slice(Math.ceil(recommendedWorks.length / 2)))}
          </div>
        </aside>
      </main>

      {/* 全屏图片预览 */}
      <AnimatePresence>
        {isImageFull && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.fullscreenOverlay}
            onClick={() => setIsImageFull(false)}
          >
            <img src={post.thumbnail} alt={post.title} />
            <button className={styles.closeFullscreen} onClick={() => setIsImageFull(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && post && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150]"
            />

            {/* 分享弹窗 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`fixed inset-0 m-auto w-full max-w-md h-fit max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl z-[151] ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border`}
            >
              {/* 头部 */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">分享</h3>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 作品预览 */}
              <div className="p-6">
                <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex gap-3">
                    {post.thumbnail && (
                      <img
                        src={post.thumbnail}
                        alt={post.title}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full mb-1">
                        作品
                      </span>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-1">{post.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{post.description || '暂无描述'}</p>
                    </div>
                  </div>
                </div>

                {/* 选择分享方式 */}
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">选择分享方式</p>

                {/* 分享选项 */}
                <div className="space-y-3">
                  {/* 分享到社群 */}
                  <button
                    onClick={() => toast.info('分享到社群功能开发中')}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${
                      isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 dark:text-white">分享到社群</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">分享到你加入的社群</p>
                    </div>
                    <i className="fas fa-chevron-right text-gray-400"></i>
                  </button>

                  {/* 私信分享 */}
                  <button
                    onClick={handlePrivateShare}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${
                      isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 dark:text-white">私信分享</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">发送给好友的私信</p>
                    </div>
                    <i className="fas fa-chevron-right text-gray-400"></i>
                  </button>

                  {/* 复制链接 */}
                  <button
                    onClick={handleCopyLink}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${
                      isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-500 flex items-center justify-center flex-shrink-0">
                      <Link2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 dark:text-white">复制链接</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">复制链接分享给其他人</p>
                    </div>
                    <i className="fas fa-chevron-right text-gray-400"></i>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Work Share Modal (Private Message) */}
      <WorkShareModal
        isOpen={isWorkShareModalOpen}
        onClose={() => setIsWorkShareModalOpen(false)}
        preselectedWork={post ? {
          id: post.id,
          title: post.title,
          thumbnail: post.thumbnail || '',
          type: (post.type as any) || 'image',
        } : null}
      />
    </div>
  );
};

export default WorkDetail;
