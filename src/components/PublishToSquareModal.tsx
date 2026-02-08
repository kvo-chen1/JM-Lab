import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '@/pages/create/hooks/useCreateStore';
import postsApi from '@/services/postService';
import { toast } from 'sonner';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';

interface PublishToSquareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PublishToSquareModal({ isOpen, onClose }: PublishToSquareModalProps) {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentType, setContentType] = useState<'image' | 'video'>('image');
  const [videoUrl, setVideoUrl] = useState('');
  
  const selectedResult = useCreateStore((state) => state.selectedResult);
  const generatedResults = useCreateStore((state) => state.generatedResults);
  
  const selectedImage = generatedResults.find(r => r.id === selectedResult);
  const thumbnail = selectedImage?.thumbnail;
  const aiVideoUrl = selectedImage?.video;
  const aiContentType = selectedImage?.type || 'image';

  // 自动检测内容类型并设置视频URL
  useEffect(() => {
    if (isOpen && selectedImage) {
      console.log('[PublishModal] Selected image:', {
        type: selectedImage.type,
        hasVideo: !!selectedImage.video,
        videoUrl: selectedImage.video?.substring(0, 50),
        thumbnail: selectedImage.thumbnail?.substring(0, 50)
      });
      
      // 如果AI生成的是视频，自动设置为视频类型并填充视频URL
      if (selectedImage.type === 'video' && selectedImage.video) {
        setContentType('video');
        setVideoUrl(selectedImage.video);
        console.log('[PublishModal] Auto-set video type and URL from AI generation');
      } else {
        setContentType('image');
        setVideoUrl('');
      }
    }
  }, [isOpen, selectedImage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('请先登录后再发布作品');
      return;
    }
    
    if (!title.trim()) {
      toast.error('请输入作品标题');
      return;
    }
    
    if (!thumbnail && contentType === 'image') {
      toast.error('请选择要发布的图片');
      return;
    }
    
    if (contentType === 'video' && !videoUrl.trim()) {
      toast.error('请输入视频链接');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 确定最终使用的视频URL
      const finalVideoUrl = contentType === 'video' 
        ? (videoUrl || aiVideoUrl || '') 
        : '';
      
      console.log('[PublishModal] Submitting post:', {
        contentType,
        hasThumbnail: !!thumbnail,
        hasVideoUrl: !!finalVideoUrl,
        videoUrl: finalVideoUrl?.substring(0, 50)
      });
      
      // 创建作品
      const postData = {
        title: title.trim(),
        thumbnail: thumbnail || '',
        videoUrl: finalVideoUrl,
        type: contentType,
        category: contentType === 'image' ? 'design' : 'video' as any,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        description: description.trim(),
        creativeDirection: '',
        culturalElements: [],
        colorScheme: [],
        toolsUsed: [],
        publishType: 'explore' as const,
        communityId: null,
        visibility: 'public' as const,
        scheduledPublishDate: null
      };
      
      const post = await postsApi.addPost(postData, user || undefined);
      
      if (post) {
        toast.success('作品发布成功！');
        onClose();
        
        // 重置表单
        setTitle('');
        setDescription('');
        setTags('');
        setVideoUrl('');
        setContentType('image');
      } else {
        toast.error('发布失败，请重试');
      }
    } catch (error) {
      console.error('发布作品失败:', error);
      toast.error('发布失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`max-w-md w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border`}
          >
            {/* 头部 */}
            <div className={`p-6 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between`}>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                发布到津脉广场
              </h3>
              <button
                onClick={onClose}
                className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-500'}`}
                disabled={isSubmitting}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            {/* 内容 */}
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                {/* 内容类型选择 */}
                <div className={`mb-6 p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>内容类型</h4>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setContentType('image')}
                      className={`flex-1 py-2.5 rounded-lg transition-all ${contentType === 'image' ? (isDark ? 'bg-[#C02C38] text-white' : 'bg-[#C02C38] text-white') : (isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200')}`}
                    >
                      <i className="fas fa-image mr-2"></i>
                      图片
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentType('video')}
                      className={`flex-1 py-2.5 rounded-lg transition-all ${contentType === 'video' ? (isDark ? 'bg-[#C02C38] text-white' : 'bg-[#C02C38] text-white') : (isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200')}`}
                    >
                      <i className="fas fa-video mr-2"></i>
                      视频
                    </button>
                  </div>
                </div>
                
                {/* 预览 */}
                <div className="mb-6">
                  <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>作品预览</h4>
                  <div className={`aspect-video rounded-xl overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-center`}>
                    {contentType === 'image' && thumbnail ? (
                      <img 
                        src={thumbnail} 
                        alt="预览" 
                        className="w-full h-full object-cover"
                      />
                    ) : contentType === 'video' && videoUrl ? (
                      <div className="relative w-full h-full flex items-center justify-center bg-black/10">
                        <i className="fas fa-play-circle text-4xl text-gray-400"></i>
                        <span className={`text-xs absolute bottom-2 right-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          视频预览
                        </span>
                      </div>
                    ) : (
                      <div className={`flex flex-col items-center justify-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <i className="fas fa-image text-4xl mb-2"></i>
                        <span className="text-sm">{contentType === 'image' ? '图片预览' : '视频预览'}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 视频链接输入 */}
                {contentType === 'video' && (
                  <div className="mb-6">
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      视频链接
                      {aiVideoUrl && (
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>
                          <i className="fas fa-check-circle mr-1"></i>
                          已自动填充AI生成视频
                        </span>
                      )}
                    </label>
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder={aiVideoUrl ? "AI生成视频已自动填充" : "输入视频链接（支持 YouTube、Vimeo 等）"}
                      className={`w-full px-4 py-2.5 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} ${aiVideoUrl ? 'border-green-500' : ''}`}
                      disabled={isSubmitting}
                    />
                    {aiVideoUrl && (
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        视频已上传到永久存储，可直接发布
                      </p>
                    )}
                  </div>
                )}
                
                {/* 标题 */}
                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    作品标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="请输入作品标题"
                    className={`w-full px-4 py-2.5 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    maxLength={50}
                    disabled={isSubmitting}
                  />
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {title.length}/50
                  </p>
                </div>
                
                {/* 描述 */}
                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    作品描述
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="请输入作品描述"
                    rows={4}
                    className={`w-full px-4 py-2.5 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    maxLength={200}
                    disabled={isSubmitting}
                  />
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {description.length}/200
                  </p>
                </div>
                
                {/* 标签 */}
                <div className="mb-8">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    标签
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="请输入标签，用逗号分隔"
                    className={`w-full px-4 py-2.5 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    disabled={isSubmitting}
                  />
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    示例：国潮, 纹样设计, 传统文化
                  </p>
                </div>
                
                {/* 提交按钮 */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`flex-1 px-6 py-3 rounded-lg border transition-all ${isDark ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-white' : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-900'}`}
                    disabled={isSubmitting}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 px-6 py-3 rounded-lg transition-all ${isDark ? 'bg-[#C02C38] hover:bg-[#A02430] text-white' : 'bg-[#C02C38] hover:bg-[#A02430] text-white'}`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        发布中...
                      </>
                    ) : (
                      '发布'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
