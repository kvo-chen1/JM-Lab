import React, { useState, useEffect, useCallback } from 'react';
import { Post, PostCategory } from '@/services/postService';
import { offlineService } from '@/services/offlineService';
import { toast } from 'sonner';

interface OfflineCreatorProps {
  onSave?: (post: Post) => void;
  onPublish?: (post: Post) => void;
  initialData?: Partial<Post>;
}

const OfflineCreator: React.FC<OfflineCreatorProps> = ({ 
  onSave, 
  onPublish, 
  initialData 
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<PostCategory>(initialData?.category || 'design');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [currentTag, setCurrentTag] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // 检查网络状态
  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    offlineService.addNetworkListener((online) => {
      setIsOnline(online);
      if (online) {
        toast.success('网络已连接，可以同步数据');
      } else {
        toast.warning('网络已断开，正在使用离线模式');
      }
    });
  }, []);

  // 自动保存草稿
  useEffect(() => {
    const autoSaveTimer = setTimeout(async () => {
      if (title.trim() || description.trim()) {
        await handleSaveDraft();
      }
    }, 5000);

    return () => clearTimeout(autoSaveTimer);
  }, [title, description, category, tags]);

  // 添加标签
  const handleAddTag = useCallback(() => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags(prev => [...prev, currentTag.trim()]);
      setCurrentTag('');
    }
  }, [currentTag, tags]);

  // 删除标签
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);

  // 保存草稿
  const handleSaveDraft = useCallback(async () => {
    if (!title.trim() && !description.trim()) return;

    setIsSaving(true);
    
    try {
      const draft: Post = {
        id: initialData?.id || `draft-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        category,
        tags,
        thumbnail: initialData?.thumbnail || '/assets/placeholder-image.jpg',
        likes: initialData?.likes || 0,
        comments: initialData?.comments || [],
        date: new Date().toISOString(),
        views: initialData?.views || 0,
        shares: initialData?.shares || 0,
        isFeatured: false,
        isDraft: true,
        completionStatus: 'draft',
        creativeDirection: '',
        culturalElements: [],
        colorScheme: [],
        toolsUsed: [],
        isLiked: false,
        isBookmarked: false,
        publishType: 'explore',
        communityId: null,
        moderationStatus: 'pending',
        rejectionReason: null,
        scheduledPublishDate: null,
        visibility: 'private',
        commentCount: 0,
        engagementRate: 0,
        trendingScore: 0,
        reach: 0,
        moderator: null,
        reviewedAt: null,
        recommendationScore: 0,
        recommendedFor: []
      };

      await offlineService.saveDraft(draft);
      setLastSaved(new Date());
      
      onSave?.(draft);
      
      toast.success('草稿已保存到本地');
    } catch (error) {
      console.error('保存草稿失败:', error);
      toast.error('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  }, [title, description, category, tags, initialData, onSave]);

  // 发布作品
  const handlePublish = useCallback(async () => {
    if (!title.trim()) {
      toast.error('请输入作品标题');
      return;
    }

    if (!description.trim()) {
      toast.error('请输入作品描述');
      return;
    }

    setIsSaving(true);

    try {
      const post: Post = {
        id: initialData?.id || `post-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        category,
        tags,
        thumbnail: initialData?.thumbnail || '/assets/placeholder-image.jpg',
        likes: 0,
        comments: [],
        date: new Date().toISOString(),
        views: 0,
        shares: 0,
        isFeatured: false,
        isDraft: false,
        completionStatus: 'published',
        creativeDirection: '',
        culturalElements: [],
        colorScheme: [],
        toolsUsed: [],
        isLiked: false,
        isBookmarked: false,
        publishType: 'explore',
        communityId: null,
        moderationStatus: 'pending',
        rejectionReason: null,
        scheduledPublishDate: null,
        visibility: 'public',
        commentCount: 0,
        engagementRate: 0,
        trendingScore: 0,
        reach: 0,
        moderator: null,
        reviewedAt: null,
        recommendationScore: 0,
        recommendedFor: []
      };

      if (isOnline) {
        // 在线发布
        onPublish?.(post);
        toast.success('作品发布成功');
      } else {
        // 离线发布 - 添加到同步队列
        await offlineService.addToSyncQueue({
          type: 'create',
          entity: 'post',
          data: post
        });
        
        toast.success('作品已保存，将在网络恢复后自动发布');
      }

      // 清除草稿
      if (initialData?.id) {
        await offlineService.deleteDraft(initialData.id);
      }

      // 重置表单
      setTitle('');
      setDescription('');
      setCategory('design');
      setTags([]);
      setLastSaved(null);

    } catch (error) {
      console.error('发布失败:', error);
      toast.error('发布失败，请重试');
    } finally {
      setIsSaving(false);
    }
  }, [title, description, category, tags, initialData, isOnline, onPublish]);

  // 处理键盘事件
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handlePublish();
    }
    
    if (e.key === 'Enter' && e.shiftKey) {
      handleSaveDraft();
    }
  }, [handlePublish, handleSaveDraft]);

  return (
    <div className="p-4 max-w-2xl mx-auto" onKeyDown={handleKeyPress}>
      {/* 网络状态指示器 */}
      <div className={`mb-4 p-3 rounded-lg flex items-center justify-between ${
        isOnline ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      }`}>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            isOnline ? 'bg-green-500' : 'bg-yellow-500'
          }`} />
          <span className="text-sm font-medium">
            {isOnline ? '在线模式' : '离线模式'}
          </span>
        </div>
        {lastSaved && (
          <span className="text-xs opacity-75">
            最后保存: {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* 标题输入 */}
      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          作品标题 *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="请输入作品标题"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          maxLength={100}
        />
        <div className="text-xs text-gray-500 text-right mt-1">
          {title.length}/100
        </div>
      </div>

      {/* 分类选择 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          作品分类
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['design', 'text', 'audio', 'video', 'other'] as PostCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat === 'design' && '设计'}
              {cat === 'text' && '文字'}
              {cat === 'audio' && '音频'}
              {cat === 'video' && '视频'}
              {cat === 'other' && '其他'}
            </button>
          ))}
        </div>
      </div>

      {/* 标签输入 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          标签
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={currentTag}
            onChange={(e) => setCurrentTag(e.target.value)}
            placeholder="输入标签后按回车"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddTag();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            添加
          </button>
        </div>
        
        {/* 标签显示 */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 描述输入 */}
      <div className="mb-6">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          作品描述 *
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="请输入作品描述..."
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          maxLength={1000}
        />
        <div className="text-xs text-gray-500 text-right mt-1">
          {description.length}/1000
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isSaving || (!title.trim() && !description.trim())}
          className="flex-1 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? '保存中...' : '保存草稿'}
        </button>
        
        <button
          type="button"
          onClick={handlePublish}
          disabled={isSaving || !title.trim() || !description.trim()}
          className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? '发布中...' : isOnline ? '立即发布' : '离线发布'}
        </button>
      </div>

      {/* 快捷键提示 */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>快捷键: Ctrl+Enter 发布 | Shift+Enter 保存草稿</p>
      </div>
    </div>
  );
};

export default OfflineCreator;