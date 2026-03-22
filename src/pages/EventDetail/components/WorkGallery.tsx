import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Grid3X3, 
  List, 
  Filter, 
  SortAsc, 
  Image, 
  Video, 
  Music, 
  FileText,
  Eye,
  Heart,
  MessageCircle,
  Star
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Work {
  id: string;
  title: string;
  description?: string;
  cover_url?: string;
  user_id: string;
  creator?: {
    username: string;
    avatar_url?: string;
  };
  likes_count: number;
  views_count: number;
  comments_count: number;
  avg_score?: number;
  created_at: string;
}

interface WorkGalleryProps {
  eventId: string;
}

type MediaType = 'all' | 'image' | 'video' | 'audio' | 'document';
type SortType = 'newest' | 'popular' | 'score';

export function WorkGallery({ eventId }: WorkGalleryProps) {
  const navigate = useNavigate();
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaType, setMediaType] = useState<MediaType>('all');
  const [sortType, setSortType] = useState<SortType>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadWorks();
  }, [eventId, mediaType, sortType]);

  const loadWorks = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('event_submissions')
        .select(`
          id,
          title,
          description,
          cover_url,
          user_id,
          likes_count,
          views_count,
          comments_count,
          avg_score,
          created_at,
          creator:users(username, avatar_url)
        `)
        .eq('event_id', eventId)
        .eq('status', 'submitted');

      // 排序
      switch (sortType) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'popular':
          query = query.order('likes_count', { ascending: false });
          break;
        case 'score':
          query = query.order('avg_score', { ascending: false });
          break;
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;

      setWorks(data || []);
    } catch (error) {
      console.error('加载作品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const mediaTypes = [
    { key: 'all' as MediaType, label: '全部', icon: Grid3X3 },
    { key: 'image' as MediaType, label: '图片', icon: Image },
    { key: 'video' as MediaType, label: '视频', icon: Video },
    { key: 'audio' as MediaType, label: '音频', icon: Music },
    { key: 'document' as MediaType, label: '文档', icon: FileText },
  ];

  const sortOptions = [
    { key: 'newest' as SortType, label: '最新' },
    { key: 'popular' as SortType, label: '最热' },
    { key: 'score' as SortType, label: '评分最高' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden"
    >
      {/* 顶部筛选栏 */}
      <div className="p-4 border-b border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* 媒体类型筛选 */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0">
            {mediaTypes.map((type) => (
              <button
                key={type.key}
                onClick={() => setMediaType(type.key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  mediaType === type.key
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <type.icon className="w-4 h-4" />
                {type.label}
              </button>
            ))}
          </div>

          {/* 排序和视图 */}
          <div className="flex items-center gap-2">
            {/* 排序选择 */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              {sortOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setSortType(option.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    sortType === option.key
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* 视图切换 */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 作品列表 */}
      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : works.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <Image className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-500">暂无作品</p>
            <p className="text-sm text-gray-600 mt-1">快来提交第一个作品吧！</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {works.map((work, index) => (
              <motion.div
                key={work.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/events/${eventId}/works/${work.id}`)}
                className="group cursor-pointer"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-white/5">
                  {work.cover_url ? (
                    <img
                      src={work.cover_url}
                      alt={work.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                  
                  {/* 悬浮遮罩 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h4 className="text-white font-medium text-sm truncate">{work.title}</h4>
                      <p className="text-gray-400 text-xs truncate">{work.creator?.username || '匿名用户'}</p>
                    </div>
                  </div>

                  {/* 统计信息 */}
                  <div className="absolute top-2 right-2 flex gap-2">
                    {work.avg_score !== null && work.avg_score !== undefined && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-xs">
                        <Star className="w-3 h-3 fill-yellow-500" />
                        {work.avg_score.toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {works.map((work, index) => (
              <motion.div
                key={work.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/events/${eventId}/works/${work.id}`)}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
              >
                {/* 封面 */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                  {work.cover_url ? (
                    <img src={work.cover_url} alt={work.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate">{work.title}</h4>
                  <p className="text-gray-500 text-sm truncate">{work.creator?.username || '匿名用户'}</p>
                </div>

                {/* 统计 */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{work.views_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>{work.likes_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{work.comments_count || 0}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
