/**
 * 动态发布框组件
 * 支持文本、图片、视频、专栏文章发布
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import type { CreateFeedRequest, FeedMedia, FeedContentType } from '@/types/feed';
import type { User } from '@/types/index';
import feedService from '@/services/feedService';
import {
  ImagePlus,
  Video,
  Smile,
  MapPin,
  Hash,
  X,
  Send,
  Loader2,
  FileText,
  Type,
  ImageIcon,
  VideoIcon,
} from 'lucide-react';

interface FeedPublisherProps {
  onPublish: (data: CreateFeedRequest) => Promise<boolean>;
  user?: User | null;
}

type PublishMode = 'dynamic' | 'article';

export function FeedPublisher({ onPublish, user }: FeedPublisherProps) {
  const { isDark } = useTheme();
  const [publishMode, setPublishMode] = useState<PublishMode>('dynamic');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<FeedMedia[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // 自动调整文本框高度
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  // 处理内容变化
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    adjustTextareaHeight();
  };

  // 处理标题变化
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  // 切换发布模式
  const handleModeChange = (mode: PublishMode) => {
    setPublishMode(mode);
    if (mode === 'article') {
      setIsExpanded(true);
    }
  };

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 检查文件数量限制
    if (mediaFiles.length + files.length > 9) {
      toast.error('最多只能上传9个文件');
      return;
    }

    setIsUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(file => feedService.uploadMedia(file));
      const uploadedMedia = await Promise.all(uploadPromises);
      
      setMediaFiles(prev => [...prev, ...uploadedMedia]);
      toast.success('上传成功');
    } catch (error) {
      toast.error('上传失败，请重试');
    } finally {
      setIsUploading(false);
      // 清空input值，允许重复选择相同文件
      if (type === 'image' && fileInputRef.current) {
        fileInputRef.current.value = '';
      } else if (type === 'video' && videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  // 移除媒体文件
  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 发布动态
  const handleSubmit = async () => {
    // 专栏模式需要标题
    if (publishMode === 'article' && !title.trim()) {
      toast.error('请输入专栏标题');
      return;
    }

    if (!content.trim() && mediaFiles.length === 0) {
      toast.error(publishMode === 'article' ? '请输入专栏内容' : '请输入内容或上传图片/视频');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let contentType: FeedContentType;
      
      if (publishMode === 'article') {
        contentType = 'article';
      } else {
        contentType = mediaFiles.length > 0 
          ? mediaFiles[0].type === 'video' ? 'video' : 'image'
          : 'text';
      }

      const request: CreateFeedRequest = {
        contentType,
        title: publishMode === 'article' ? title.trim() : undefined,
        content: content.trim(),
        media: mediaFiles,
      };

      const success = await onPublish(request);
      
      if (success) {
        setContent('');
        setTitle('');
        setMediaFiles([]);
        setIsExpanded(false);
        setPublishMode('dynamic');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 取消发布
  const handleCancel = () => {
    setContent('');
    setTitle('');
    setMediaFiles([]);
    setIsExpanded(false);
    setPublishMode('dynamic');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl overflow-hidden ${
        isDark 
          ? 'bg-gray-900 border border-gray-800' 
          : 'bg-white border border-gray-100 shadow-sm'
      }`}
    >
      <div className="p-4">
        {/* 发布模式切换 - 仅在展开时显示 */}
        <AnimatePresence>
          {(isExpanded || publishMode === 'article') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className={`flex items-center gap-2 p-1 rounded-xl ${
                isDark ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <button
                  onClick={() => handleModeChange('dynamic')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    publishMode === 'dynamic'
                      ? isDark
                        ? 'bg-gray-700 text-white shadow-sm'
                        : 'bg-white text-gray-900 shadow-sm'
                      : isDark
                        ? 'text-gray-400 hover:text-gray-200'
                        : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Type className="w-4 h-4" />
                  动态
                </button>
                <button
                  onClick={() => handleModeChange('article')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    publishMode === 'article'
                      ? isDark
                        ? 'bg-gray-700 text-white shadow-sm'
                        : 'bg-white text-gray-900 shadow-sm'
                      : isDark
                        ? 'text-gray-400 hover:text-gray-200'
                        : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  专栏
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 用户头像和输入框 */}
        <div className="flex gap-4">
          <img
            src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
            alt={user?.username || '用户'}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0 space-y-3">
            {/* 专栏标题输入 */}
            <AnimatePresence>
              {publishMode === 'article' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="请输入专栏标题"
                    className={`w-full text-lg font-semibold bg-transparent outline-none placeholder:text-gray-400 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* 内容输入 */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onFocus={() => setIsExpanded(true)}
              placeholder={publishMode === 'article' 
                ? '请输入专栏内容...' 
                : '有什么想和大家分享的？'}
              rows={isExpanded ? (publishMode === 'article' ? 8 : 3) : 1}
              className={`w-full resize-none outline-none text-base ${
                isDark 
                  ? 'bg-transparent text-white placeholder-gray-500' 
                  : 'bg-transparent text-gray-900 placeholder-gray-400'
              }`}
              style={{ minHeight: isExpanded ? (publishMode === 'article' ? '200px' : '80px') : '24px' }}
            />
          </div>
        </div>

        {/* 媒体预览 */}
        <AnimatePresence>
          {mediaFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <div className={`grid gap-2 ${
                mediaFiles.length === 1 ? 'grid-cols-1' :
                mediaFiles.length === 2 ? 'grid-cols-2' :
                mediaFiles.length <= 4 ? 'grid-cols-2' :
                'grid-cols-3'
              }`}>
                {mediaFiles.map((media, index) => (
                  <motion.div
                    key={media.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative aspect-square rounded-xl overflow-hidden group"
                  >
                    {media.type === 'video' ? (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                        <Video className="w-8 h-8 text-gray-400" />
                      </div>
                    ) : (
                      <img
                        src={media.url}
                        alt={`上传的图片 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <button
                      onClick={() => removeMedia(index)}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 工具栏 */}
        <AnimatePresence>
          {(isExpanded || mediaFiles.length > 0 || content.length > 0 || title.length > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center justify-between">
                {/* 左侧工具按钮 */}
                <div className="flex items-center gap-2">
                  {/* 图片上传 */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || mediaFiles.length >= 9}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark 
                        ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' 
                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title="上传图片"
                  >
                    <ImagePlus className="w-5 h-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileUpload(e, 'image')}
                    className="hidden"
                  />

                  {/* 视频上传 - 仅在动态模式下显示 */}
                  {publishMode === 'dynamic' && (
                    <>
                      <button
                        onClick={() => videoInputRef.current?.click()}
                        disabled={isUploading || mediaFiles.length >= 9}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark 
                            ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' 
                            : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="上传视频"
                      >
                        <Video className="w-5 h-5" />
                      </button>
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleFileUpload(e, 'video')}
                        className="hidden"
                      />
                    </>
                  )}

                  {/* 表情 */}
                  <button
                    className={`p-2 rounded-lg transition-colors ${
                      isDark 
                        ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' 
                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    }`}
                    title="添加表情"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  {/* 位置 */}
                  <button
                    className={`p-2 rounded-lg transition-colors ${
                      isDark 
                        ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' 
                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    }`}
                    title="添加位置"
                  >
                    <MapPin className="w-5 h-5" />
                  </button>

                  {/* 话题 */}
                  <button
                    className={`p-2 rounded-lg transition-colors ${
                      isDark 
                        ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' 
                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    }`}
                    title="添加话题"
                    onClick={() => setContent(prev => prev + '#')}
                  >
                    <Hash className="w-5 h-5" />
                  </button>
                </div>

                {/* 右侧发布按钮 */}
                <div className="flex items-center gap-3">
                  {/* 取消按钮 */}
                  <button
                    onClick={handleCancel}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      isDark
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    取消
                  </button>
                  
                  {/* 字数统计 */}
                  <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {content.length}/{publishMode === 'article' ? '5000' : '500'}
                  </span>
                  
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || (!content.trim() && mediaFiles.length === 0) || isUploading || (publishMode === 'article' && !title.trim())}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-all ${
                      isSubmitting || (!content.trim() && mediaFiles.length === 0) || isUploading || (publishMode === 'article' && !title.trim())
                        ? isDark 
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : publishMode === 'article'
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25'
                          : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        发布中...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {publishMode === 'article' ? '发布专栏' : '发布'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
