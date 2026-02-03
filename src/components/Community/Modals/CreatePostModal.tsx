import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import UploadBox from '@/components/UploadBox';
import { motion } from 'framer-motion';
import type { Community } from '@/mock/communities';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; content: string; topic: string; contentType: string; images?: Array<string>; communityIds: string[] }) => void;
  isDark: boolean;
  topics?: string[];
  joinedCommunities?: Community[];
  activeCommunityId?: string | null;
  initialImages?: string[];
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isDark,
  topics = ['国潮', '非遗', '极简', '赛博朋克'],
  joinedCommunities = [],
  activeCommunityId = null,
  initialImages = []
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  // 内容类型选项
  const contentTypes = [
    { id: 'text', name: '文字', icon: 'fas fa-file-alt' },
    { id: 'image', name: '图片', icon: 'fas fa-image' },
    { id: 'video', name: '视频', icon: 'fas fa-video' },
    { id: 'audio', name: '语音', icon: 'fas fa-microphone' },
    { id: 'link', name: '链接', icon: 'fas fa-link' }
  ];
  
  // 初始化话题为第一个可用话题
  const initialTopic = topics.length > 0 ? topics[0] : '未分类';
  const [selectedTopic, setSelectedTopic] = useState(initialTopic);
  const [selectedContentType, setSelectedContentType] = useState(contentTypes[0].id);
  const [selectedImages, setSelectedImages] = useState<Array<string>>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<Array<string>>([]);
  const [selectedVideos, setSelectedVideos] = useState<Array<string>>([]);
  const [videoPreviewUrls, setVideoPreviewUrls] = useState<Array<string>>([]);
  const [selectedAudios, setSelectedAudios] = useState<Array<string>>([]);
  const [audioPreviewUrls, setAudioPreviewUrls] = useState<Array<string>>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (initialImages && initialImages.length > 0) {
      setSelectedImages(initialImages);
      setImagePreviewUrls(initialImages);
      setSelectedContentType('image');
    }
  }, [initialImages, isOpen]);

  // 合并内置话题和用户创建的话题
  const allTopics = [...(topics || [])];
  if (newTopic.trim() && !allTopics.includes(newTopic.trim())) {
    allTopics.push(newTopic.trim());
  }
  
  // 当活跃社群变化或模态框打开时，自动选择当前活跃社群
  useEffect(() => {
    if (isOpen && activeCommunityId) {
      setSelectedCommunities([activeCommunityId]);
    } else if (!isOpen) {
      // 模态框关闭时重置选择
      setSelectedCommunities([]);
    }
  }, [isOpen, activeCommunityId]);
  
  // 过滤社群列表，只显示用户已加入的社群
  const filteredCommunities = joinedCommunities;
  console.log('joinedCommunities:', joinedCommunities);
  console.log('filteredCommunities:', filteredCommunities);

  // 处理图片选择
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImageUrls: Array<string> = [];
    const newPreviewUrls: Array<string> = [];

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        // 生成预览URL
        const reader = new FileReader();
        reader.onload = (event) => {
          const previewUrl = event.target?.result as string;
          newPreviewUrls.push(previewUrl);
          newImageUrls.push(previewUrl); // 在实际应用中，这里应该上传到服务器并获取URL
          
          setSelectedImages(prev => [...prev, previewUrl]);
          setImagePreviewUrls(prev => [...prev, previewUrl]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  // 移除选中的图片
  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };
  
  // 处理社群选择
  const handleCommunityToggle = (communityId: string) => {
    setSelectedCommunities(prev => {
      if (prev.includes(communityId)) {
        return prev.filter(id => id !== communityId);
      } else {
        return [...prev, communityId];
      }
    });
  };

  // 处理图片选择
  const handleImageSelect = (file: File | File[]) => {
    const files = Array.isArray(file) ? file : [file];
    
    setSelectedImageFiles(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const previewUrl = event.target?.result as string;
        setImagePreviewUrls(prev => [...prev, previewUrl]);
        // 预览URL暂存，不放入selectedImages，避免混淆
      };
      reader.readAsDataURL(file);
    });
  };

  // 处理视频选择
  const handleVideoSelect = (file: File | File[]) => {
    const files = Array.isArray(file) ? file : [file];
    
    setSelectedVideoFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const previewUrl = event.target?.result as string;
        setVideoPreviewUrls(prev => [...prev, previewUrl]);
      };
      reader.readAsDataURL(file);
    });
  };

  // 处理音频选择
  const handleAudioSelect = (file: File | File[]) => {
    const files = Array.isArray(file) ? file : [file];
    
    setSelectedAudioFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const previewUrl = event.target?.result as string;
        setAudioPreviewUrls(prev => [...prev, previewUrl]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // 动态导入 uploadImage
      const { uploadImage } = await import('@/services/imageService');

      const postData: any = {
        title,
        content,
        topic: selectedTopic,
        contentType: selectedContentType,
        communityIds: selectedCommunities
      };
      
      // 根据内容类型添加相应的媒体数据
      if (selectedContentType === 'image') {
        let imageUrls: string[] = [];
        // 保留初始图片
        if (selectedImages.length > 0) {
          imageUrls = [...selectedImages];
        }
        // 上传新图片
        if (selectedImageFiles.length > 0) {
           const uploadPromises = selectedImageFiles.map(file => uploadImage(file));
           const uploadedUrls = await Promise.all(uploadPromises);
           imageUrls = [...imageUrls, ...uploadedUrls];
        }
        
        if (imageUrls.length > 0) {
           postData.images = imageUrls;
        }
      } else if (selectedContentType === 'video') {
         // 视频处理逻辑 (暂未实现上传，仅作示例)
         if (selectedVideos.length > 0) postData.videos = selectedVideos;
      } else if (selectedContentType === 'audio') {
         if (selectedAudios.length > 0) postData.audios = selectedAudios;
      } else if (selectedContentType === 'link' && linkUrl.trim()) {
        postData.link = linkUrl.trim();
      }
      
      onSubmit(postData);
      onClose();
      
      // 重置所有状态
      setTitle('');
      setContent('');
      setSelectedTopic(initialTopic);
      setSelectedContentType(contentTypes[0].id);
      setSelectedImages([]);
      setImagePreviewUrls([]);
      setSelectedImageFiles([]);
      setSelectedVideos([]);
      setVideoPreviewUrls([]);
      setSelectedVideoFiles([]);
      setSelectedAudios([]);
      setAudioPreviewUrls([]);
      setSelectedAudioFiles([]);
      setLinkUrl('');
      setUploadError(''); // 重置上传错误
      setNewTopic('');
      setIsCreatingTopic(false);
    } catch (error) {
      console.error('提交失败:', error);
      setUploadError('发布失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="发布新帖"
      className={isDark ? 'dark' : ''}
      footer={
        <>
          <Button 
            variant="ghost" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!title.trim() || !content.trim() || isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? '发布中...' : '发布帖子'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            标题
          </label>
          <motion.input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:outline-none transition-all duration-300 ${
              isDark ? 'bg-gray-800 border-gray-700 text-white hover:border-gray-600' : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300'
            }`}
            placeholder="请输入标题..."
            whileFocus={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          />
        </motion.div>

        {/* 话题选择 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            话题
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {allTopics.map((topicName, index) => (
              <motion.button
                key={topicName}
                onClick={() => {
                  setSelectedTopic(topicName);
                  // 切换话题时清空已选社群
                  setSelectedCommunities([]);
                }}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm border transition-all duration-300 transform hover:scale-105 ${
                  selectedTopic === topicName
                    ? 'bg-red-600 text-white border-red-600 shadow-md'
                    : isDark
                    ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 hover:border-gray-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="mr-1">#</span>
                {topicName}
              </motion.button>
            ))}
          </div>
          
          {/* 创建新话题 */}
          <motion.div 
            className="flex gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            {isCreatingTopic ? (
              <div className="flex-1 flex gap-2">
                <motion.input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value.trim())}
                  placeholder="输入新话题..."
                  className={`flex-1 px-3 py-2 rounded-full text-sm border focus:ring-2 focus:ring-red-500 ${
                    isDark
                      ? 'bg-gray-800 text-gray-300 border-gray-700'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                  autoFocus
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                />
                <motion.button
                  onClick={() => {
                    if (newTopic.trim()) {
                      setSelectedTopic(newTopic.trim());
                      setIsCreatingTopic(false);
                      // 切换话题时清空已选社群
                      setSelectedCommunities([]);
                    }
                  }}
                  className={`px-3 py-2 rounded-full text-sm border bg-red-600 text-white border-red-600 hover:bg-red-700 transition-colors`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  确认
                </motion.button>
                <motion.button
                  onClick={() => {
                    setIsCreatingTopic(false);
                    setNewTopic('');
                  }}
                  className={`px-3 py-2 rounded-full text-sm border transition-colors ${
                    isDark
                      ? 'bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  取消
                </motion.button>
              </div>
            ) : (
              <motion.button
                onClick={() => setIsCreatingTopic(true)}
                className={`px-3 py-2 rounded-full text-sm border transition-colors ${
                  isDark
                    ? 'bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-600 hover:bg-gray-700'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="mr-1">+</span>
                创建新话题
              </motion.button>
            )}
          </motion.div>
        </motion.div>

        {/* 内容类型选择 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            内容类型
          </label>
          <div className="flex flex-wrap gap-2">
            {contentTypes.map((type, index) => (
              <motion.button
                key={type.id}
                onClick={() => {
                  setSelectedContentType(type.id);
                  setUploadError(''); // 切换内容类型时重置错误
                }}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  selectedContentType === type.id
                    ? 'bg-green-600 text-white shadow-lg'
                    : isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                    : 'bg-white text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-200'
                }`}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className={type.icon}></i>
                <span>{type.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
        
        {/* 上传错误信息 */}
        {uploadError && (
          <motion.div 
            className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <i className="fas fa-exclamation-circle mr-1"></i>
            {uploadError}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            选择社群 ({selectedCommunities.length} 个已选)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
            {filteredCommunities.map((community, index) => (
              <motion.div
                key={community.id}
                onClick={() => handleCommunityToggle(community.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-sm ${
                  selectedCommunities.includes(community.id)
                    ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700'
                    : isDark
                    ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * index }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={community.avatar}
                      alt={community.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                    />
                    <div>
                      <div className="text-sm font-medium">{community.name}</div>
                      <div className="text-xs opacity-70">{community.memberCount} 成员</div>
                    </div>
                  </div>
                  <motion.div 
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                      selectedCommunities.includes(community.id)
                        ? 'bg-red-600 border-red-600 text-white'
                        : isDark
                        ? 'border-gray-600 hover:border-gray-500'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    animate={{ 
                      scale: selectedCommunities.includes(community.id) ? [1, 1.2, 1] : 1 
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {selectedCommunities.includes(community.id) && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
          {filteredCommunities.length === 0 && (
            <motion.div 
              className="text-center py-4 text-sm opacity-70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              暂无相关社群
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            内容
          </label>
          <motion.textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:outline-none resize-none transition-all duration-300 ${isDark ? 'bg-gray-800 border-gray-700 text-white hover:border-gray-600' : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300'}`}
            placeholder="分享你的想法..."
            whileFocus={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          />
        </motion.div>

        {/* 媒体上传部分 - 根据内容类型动态显示 */}
        {(selectedContentType === 'image' || selectedContentType === 'video' || selectedContentType === 'audio' || selectedContentType === 'link') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {selectedContentType === 'image' && '添加图片'}
              {selectedContentType === 'video' && '添加视频'}
              {selectedContentType === 'audio' && '添加语音'}
              {selectedContentType === 'link' && '添加链接'}
            </label>
            
            {/* 链接输入 */}
            {selectedContentType === 'link' && (
              <motion.div 
                className="mb-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value.trim())}
                  placeholder="输入链接地址..."
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 focus:outline-none transition-all duration-300 ${isDark ? 'bg-gray-800 border-gray-700 text-white hover:border-gray-600' : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300'}`}
                  whileFocus={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                />
              </motion.div>
            )}
            
            {/* 图片上传 */}
            {selectedContentType === 'image' && (
              <motion.div 
                className="mb-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* 图片预览 */}
                {imagePreviewUrls.length > 0 && (
                  <motion.div 
                    className="flex gap-3 mb-3 overflow-x-auto pb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {imagePreviewUrls.map((url, index) => (
                      <motion.div 
                        key={index} 
                        className="relative w-24 h-24 rounded-xl overflow-hidden border shadow-sm"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: 0.1 * index }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <img 
                          src={url} 
                          alt={`Preview ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                        <motion.button
                          onClick={() => {
                            setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
                            setSelectedImages(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <i className="fas fa-times text-xs"></i>
                        </motion.button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
                
                {/* 图片上传组件 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <UploadBox
                    accept="image/*"
                    onFile={handleImageSelect}
                    title="上传图片"
                    description="拖拽图片到此，或点击选择"
                    variant="image"
                    multiple={true}
                    maxSize={10 * 1024 * 1024} // 10MB
                    onError={(error) => setUploadError(error)}
                  />
                </motion.div>
              </motion.div>
            )}
            
            {/* 视频上传 */}
            {selectedContentType === 'video' && (
              <motion.div 
                className="mb-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* 视频预览 */}
                {videoPreviewUrls.length > 0 && (
                  <motion.div 
                    className="flex gap-3 mb-3 overflow-x-auto pb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {videoPreviewUrls.map((url, index) => (
                      <motion.div 
                        key={index} 
                        className="relative w-24 h-24 rounded-xl overflow-hidden border shadow-sm"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: 0.1 * index }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <video 
                          src={url} 
                          className="w-full h-full object-cover"
                          controls
                        />
                        <motion.button
                          onClick={() => {
                            setVideoPreviewUrls(prev => prev.filter((_, i) => i !== index));
                            setSelectedVideos(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <i className="fas fa-times text-xs"></i>
                        </motion.button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
                
                {/* 视频上传组件 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <UploadBox
                    accept="video/*"
                    onFile={handleVideoSelect}
                    title="上传视频"
                    description="拖拽视频到此，或点击选择"
                    variant="file"
                    multiple={true}
                    maxSize={50 * 1024 * 1024} // 50MB
                    onError={(error) => setUploadError(error)}
                  />
                </motion.div>
              </motion.div>
            )}
            
            {/* 音频上传 */}
            {selectedContentType === 'audio' && (
              <motion.div 
                className="mb-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* 音频预览 */}
                {audioPreviewUrls.length > 0 && (
                  <motion.div 
                    className="space-y-3 mb-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {audioPreviewUrls.map((url, index) => (
                      <motion.div 
                        key={index} 
                        className="relative p-3 rounded-xl border flex items-center shadow-sm"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: 0.1 * index }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <audio 
                          src={url} 
                          className="flex-1"
                          controls
                        />
                        <motion.button
                          onClick={() => {
                            setAudioPreviewUrls(prev => prev.filter((_, i) => i !== index));
                            setSelectedAudios(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="ml-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <i className="fas fa-times text-sm"></i>
                        </motion.button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
                
                {/* 音频上传组件 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <UploadBox
                    accept="audio/*"
                    onFile={handleAudioSelect}
                    title="上传语音"
                    description="拖拽音频文件到此，或点击选择"
                    variant="audio"
                    multiple={true}
                    maxSize={10 * 1024 * 1024} // 10MB
                    onError={(error) => setUploadError(error)}
                  />
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </Modal>
  );
};
