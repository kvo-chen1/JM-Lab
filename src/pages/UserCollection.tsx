import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { useContext } from 'react';
import { toast } from 'sonner';

import postsApi from '@/services/postService';
import { Post } from '@/services/postService';
import { templateInteractionService } from '@/services/templateInteractionService';
import { tianjinActivityService, TianjinTemplate } from '@/services/tianjinActivityService';

// 统一的收藏/点赞项目类型
type CollectionItem = {
  id: number;
  title: string;
  thumbnail: string;
  category: string;
  date: string;
  views: number;
  likes: number;
  comments: number;
  isBookmarked: boolean;
  isLiked: boolean;
  type: 'post' | 'template';
  link: string;
};

export default function UserCollection() {
  const { isDark } = useTheme();
  const { isAuthenticated, user, isLoading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'likes'>('bookmarks');
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [bookmarkedTemplates, setBookmarkedTemplates] = useState<TianjinTemplate[]>([]);
  const [likedTemplates, setLikedTemplates] = useState<TianjinTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 检查是否已登录
  useEffect(() => {
    console.log('[UserCollection] Auth state:', { isAuthenticated, user: !!user, authLoading });
    
    if (!authLoading) {
      if (!isAuthenticated || !user) {
        console.log('[UserCollection] Not authenticated, redirecting to login');
        navigate('/login');
      } else {
        console.log('[UserCollection] Authenticated, loading collections');
        loadUserCollections();
      }
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  // 加载用户收藏和点赞作品
  const loadUserCollections = async () => {
    console.log('[UserCollection] Starting to load collections...');
    setIsLoading(true);
    try {
      // 加载广场作品
      const [bookmarks, likes] = await Promise.all([
        postsApi.getBookmarkedPosts(),
        postsApi.getLikedPosts()
      ]);
      console.log('[UserCollection] Loaded post collections:', { bookmarks: bookmarks.length, likes: likes.length });
      setBookmarkedPosts(bookmarks);
      setLikedPosts(likes);
      
      // 加载津脉模板收藏和点赞
      const [favoritedTemplateIds, likedTemplateIds] = await Promise.all([
        templateInteractionService.getUserFavoritedTemplateIds(),
        templateInteractionService.getUserLikedTemplateIds()
      ]);
      
      console.log('[UserCollection] Loaded template IDs:', { 
        favorited: favoritedTemplateIds.length, 
        liked: likedTemplateIds.length 
      });
      
      // 获取所有模板详情
      if (favoritedTemplateIds.length > 0 || likedTemplateIds.length > 0) {
        const allTemplates = await tianjinActivityService.getTemplates();
        
        const bookmarkedTemps = allTemplates.filter(t => favoritedTemplateIds.includes(t.id));
        const likedTemps = allTemplates.filter(t => likedTemplateIds.includes(t.id));
        
        console.log('[UserCollection] Loaded template details:', { 
          bookmarked: bookmarkedTemps.length, 
          liked: likedTemps.length 
        });
        
        setBookmarkedTemplates(bookmarkedTemps);
        setLikedTemplates(likedTemps);
      }
    } catch (error) {
      console.error('加载用户收藏失败:', error);
      toast.error('加载收藏数据失败，请稍后重试');
    } finally {
      console.log('[UserCollection] Finished loading collections');
      setIsLoading(false);
    }
  };

  // 获取当前展示的作品（合并广场作品和津脉模板）
  const getCurrentItems = (): CollectionItem[] => {
    const posts = activeTab === 'bookmarks' ? bookmarkedPosts : likedPosts;
    const templates = activeTab === 'bookmarks' ? bookmarkedTemplates : likedTemplates;
    
    // 转换广场作品
    const postItems: CollectionItem[] = posts.map(post => ({
      id: post.id,
      title: post.title,
      thumbnail: post.thumbnail,
      category: post.category,
      date: post.date,
      views: post.views,
      likes: post.likes,
      comments: post.comments.length,
      isBookmarked: post.isBookmarked,
      isLiked: post.isLiked,
      type: 'post',
      link: `/explore/${post.id}`
    }));
    
    // 转换津脉模板
    const templateItems: CollectionItem[] = templates.map(template => ({
      id: template.id,
      title: template.name,
      thumbnail: template.thumbnail,
      category: template.category,
      date: new Date().toISOString().split('T')[0], // 使用当前日期
      views: template.usageCount,
      likes: template.likes || 0,
      comments: 0,
      isBookmarked: activeTab === 'bookmarks',
      isLiked: activeTab === 'likes',
      type: 'template',
      link: `/tianjin/template/${template.id}`
    }));
    
    return [...postItems, ...templateItems];
  };
  
  const currentItems = getCurrentItems();

  // 如果认证状态还在加载，显示加载中
  if (authLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <div className="text-5xl text-gray-400 mb-4"><i className="fas fa-spinner fa-spin"></i></div>
          <h2 className="text-xl font-semibold mb-2">加载中...</h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>正在检查登录状态</p>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <div className="text-5xl text-gray-400 mb-4"><i className="fas fa-spinner fa-spin"></i></div>
          <h2 className="text-xl font-semibold mb-2">加载中...</h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>正在获取您的收藏和点赞作品</p>
        </div>
      </main>
    );
  }

  return (
      <main className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-2">我的收藏</h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            查看和管理您收藏与点赞的作品
          </p>
        </motion.div>

        {/* 标签切换 */}
        <motion.div 
          className={`mb-8 p-1 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`flex-1 py-3 px-6 rounded-lg text-sm font-medium transition-all ${activeTab === 'bookmarks' ? 
                `${isDark ? 'bg-gray-700 text-white' : 'bg-white text-red-600 shadow-md'}` : 
                `${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`
              }`}
            >
              <i className={`far fa-bookmark mr-2 ${activeTab === 'bookmarks' ? 'text-red-500' : ''}`}></i>
              我的收藏
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                {bookmarkedPosts.length + bookmarkedTemplates.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('likes')}
              className={`flex-1 py-3 px-6 rounded-lg text-sm font-medium transition-all ${activeTab === 'likes' ? 
                `${isDark ? 'bg-gray-700 text-white' : 'bg-white text-red-600 shadow-md'}` : 
                `${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`
              }`}
            >
              <i className={`far fa-heart mr-2 ${activeTab === 'likes' ? 'text-red-500' : ''}`}></i>
              我的点赞
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                {likedPosts.length + likedTemplates.length}
              </span>
            </button>
          </div>
        </motion.div>

        {/* 作品列表 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {currentItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {currentItems.map((item) => (
                <motion.div
                  key={`${item.type}-${item.id}`}
                  className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} shadow-md transition-all hover:shadow-lg`}
                  whileHover={{ y: -5 }}
                  onClick={() => navigate(item.link)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(item.link);
                    }
                  }}
                >
                  <div className="relative">
                    <img 
                      src={item.thumbnail} 
                      alt={item.title} 
                      className="w-full h-48 object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute top-2 right-2 flex space-x-2">
                      {item.type === 'template' && (
                        <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                          <i className="fas fa-layer-group mr-1"></i>
                          模板
                        </div>
                      )}
                      {item.isBookmarked && (
                        <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                          <i className="far fa-bookmark mr-1"></i>
                          已收藏
                        </div>
                      )}
                      {item.isLiked && (
                        <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                          <i className="far fa-heart mr-1"></i>
                          已点赞
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium mb-2 line-clamp-2">{item.title}</h3>
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className={`px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        {item.category}
                      </span>
                      <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {item.date}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <i className="far fa-eye mr-1"></i>
                          {item.views}
                        </span>
                        <span className="flex items-center">
                          <i className="far fa-thumbs-up mr-1"></i>
                          {item.likes}
                        </span>
                        <span className="flex items-center">
                          <i className="far fa-comment mr-1"></i>
                          {item.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className={`rounded-xl p-12 text-center ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
              <div className="text-5xl text-gray-400 mb-4">
                {activeTab === 'bookmarks' ? (
                  <i className="far fa-bookmark"></i>
                ) : (
                  <i className="far fa-heart"></i>
                )}
              </div>
              <h2 className="text-xl font-semibold mb-2">暂无{activeTab === 'bookmarks' ? '收藏' : '点赞'}作品</h2>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                去津脉广场或津脉作品页面{activeTab === 'bookmarks' ? '收藏' : '点赞'}一些作品吧
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => navigate('/square')}
                  className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  去津脉广场
                </button>
                <button
                  onClick={() => navigate('/tianjin')}
                  className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  去津脉作品
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </main>
  );
}
