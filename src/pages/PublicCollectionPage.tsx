import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import {
  FolderOpen,
  Eye,
  Calendar,
  User,
  Image,
  MessageSquare,
  CalendarDays,
  Layers,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { collectionFolderService } from '@/services/collectionFolderService';
import { PublicFolderView } from '@/types/collectionFolder';
import { CollectionType } from '@/services/collectionService';

const typeConfig: Record<CollectionType, { label: string; icon: React.ElementType; color: string }> = {
  [CollectionType.SQUARE_WORK]: { label: '广场作品', icon: Image, color: '#ef4444' },
  [CollectionType.COMMUNITY_POST]: { label: '社区帖子', icon: MessageSquare, color: '#8b5cf6' },
  [CollectionType.ACTIVITY]: { label: '活动', icon: CalendarDays, color: '#f59e0b' },
  [CollectionType.TEMPLATE]: { label: '模板', icon: Layers, color: '#10b981' },
};

export default function PublicCollectionPage() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const { isDark } = useTheme();
  const [folder, setFolder] = useState<PublicFolderView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFolder = useCallback(async () => {
    if (!shareCode) return;

    setIsLoading(true);
    setError(null);

    const data = await collectionFolderService.getPublicFolder(shareCode);
    if (data) {
      setFolder(data);
    } else {
      setError('收藏夹不存在或未公开');
    }
    setIsLoading(false);
  }, [shareCode]);

  useEffect(() => {
    loadFolder();
  }, [loadFolder]);

  const getItemLink = (item: { item_id: string; item_type: CollectionType }) => {
    switch (item.item_type) {
      case CollectionType.SQUARE_WORK:
        return `/works/${item.item_id}`;
      case CollectionType.COMMUNITY_POST:
        return `/post/${item.item_id}`;
      case CollectionType.ACTIVITY:
        return `/events/${item.item_id}`;
      case CollectionType.TEMPLATE:
        return `/tianjin?template=${item.item_id}`;
      default:
        return '#';
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className={`w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-4 ${
            isDark ? 'border-blue-500' : 'border-blue-600'
          }`} />
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>加载中...</p>
        </div>
      </main>
    );
  }

  if (error || !folder) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isDark ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <Lock className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
          <h1 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {error || '收藏夹不存在'}
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            该收藏夹可能已被设为私有或已被删除
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className={`${isDark ? 'bg-gray-900/50' : 'bg-gray-50/50'} backdrop-blur-sm border-b ${
        isDark ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-start gap-6">
              {folder.cover_image ? (
                <img
                  src={folder.cover_image}
                  alt={folder.name}
                  className="w-24 h-24 rounded-xl object-cover shadow-lg"
                />
              ) : (
                <div className={`w-24 h-24 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-gray-800' : 'bg-white'
                } shadow-lg`}>
                  <FolderOpen className={`w-10 h-10 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                </div>
              )}

              <div className="flex-1">
                <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {folder.name}
                </h1>
                {folder.description && (
                  <p className={`text-lg mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {folder.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className={`flex items-center gap-2 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <User className="w-4 h-4" />
                    <span>{folder.owner.username}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <FolderOpen className="w-4 h-4" />
                    <span>{folder.item_count} 个作品</span>
                  </div>
                  <div className={`flex items-center gap-2 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <Eye className="w-4 h-4" />
                    <span>{folder.view_count} 次浏览</span>
                  </div>
                  <div className={`flex items-center gap-2 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <Calendar className="w-4 h-4" />
                    <span>创建于 {new Date(folder.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {folder.items.length === 0 ? (
          <div className={`text-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">收藏夹暂无内容</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {folder.items.map((item, index) => {
              const config = typeConfig[item.item_type];
              const Icon = config.icon;
              return (
                <motion.a
                  key={item.id}
                  href={getItemLink(item)}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group relative block rounded-xl overflow-hidden ${
                    isDark ? 'bg-gray-800' : 'bg-white'
                  } shadow-sm hover:shadow-lg transition-shadow`}
                >
                  <div className="aspect-square relative">
                    <div className={`absolute inset-0 flex items-center justify-center ${
                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <Icon className="w-12 h-12 opacity-30" style={{ color: config.color }} />
                    </div>
                    <div className="absolute top-2 left-2">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: config.color }}
                      >
                        {config.label}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <ExternalLink className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className={`text-sm font-medium truncate ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      作品 #{item.item_id}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </motion.a>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
