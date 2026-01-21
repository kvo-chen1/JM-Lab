import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import UploadBox from '@/components/UploadBox';
import type { Community } from '@/mock/communities';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; content: string; topic: string; contentType: string; images?: Array<string>; communityIds: string[] }) => void;
  isDark: boolean;
  topics?: string[];
  joinedCommunities?: Community[];
  activeCommunityId?: string | null;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isDark,
  topics = ['国潮', '非遗', '极简', '赛博朋克'],
  joinedCommunities = [],
  activeCommunityId = null
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
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const previewUrl = event.target?.result as string;
        setImagePreviewUrls(prev => [...prev, previewUrl]);
        setSelectedImages(prev => [...prev, previewUrl]); // 在实际应用中，这里应该上传到服务器并获取URL
      };
      reader.readAsDataURL(file);
    });
  };

  // 处理视频选择
  const handleVideoSelect = (file: File | File[]) => {
    const files = Array.isArray(file) ? file : [file];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const previewUrl = event.target?.result as string;
        setVideoPreviewUrls(prev => [...prev, previewUrl]);
        setSelectedVideos(prev => [...prev, previewUrl]); // 在实际应用中，这里应该上传到服务器并获取URL
      };
      reader.readAsDataURL(file);
    });
  };

  // 处理音频选择
  const handleAudioSelect = (file: File | File[]) => {
    const files = Array.isArray(file) ? file : [file];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const previewUrl = event.target?.result as string;
        setAudioPreviewUrls(prev => [...prev, previewUrl]);
        setSelectedAudios(prev => [...prev, previewUrl]); // 在实际应用中，这里应该上传到服务器并获取URL
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    
    const postData: any = {
      title,
      content,
      topic: selectedTopic,
      contentType: selectedContentType,
      communityIds: selectedCommunities
    };
    
    // 根据内容类型添加相应的媒体数据
    if (selectedContentType === 'image' && selectedImages.length > 0) {
      postData.images = selectedImages;
    } else if (selectedContentType === 'video' && selectedVideos.length > 0) {
      postData.videos = selectedVideos;
    } else if (selectedContentType === 'audio' && selectedAudios.length > 0) {
      postData.audios = selectedAudios;
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
    setSelectedVideos([]);
    setVideoPreviewUrls([]);
    setSelectedAudios([]);
    setAudioPreviewUrls([]);
    setLinkUrl('');
    setUploadError(''); // 重置上传错误
    setNewTopic('');
    setIsCreatingTopic(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="发布新帖"
      className={isDark ? 'dark' : ''}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!title.trim() || !content.trim()}
          >
            发布帖子
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            标题
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="请输入标题..."
          />
        </div>

        {/* 话题选择 */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            话题
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {allTopics.map((topicName) => (
              <button
                key={topicName}
                onClick={() => {
                  setSelectedTopic(topicName);
                  // 切换话题时清空已选社群
                  setSelectedCommunities([]);
                }}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  selectedTopic === topicName
                    ? 'bg-blue-600 text-white border-blue-600'
                    : isDark
                    ? 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                <span className="mr-1">#</span>
                {topicName}
              </button>
            ))}
          </div>
          
          {/* 创建新话题 */}
          <div className="flex gap-2">
            {isCreatingTopic ? (
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value.trim())}
                  placeholder="输入新话题..."
                  className={`flex-1 px-3 py-1 rounded-full text-sm border focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? 'bg-gray-700 text-gray-300 border-gray-600'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (newTopic.trim()) {
                      setSelectedTopic(newTopic.trim());
                      setIsCreatingTopic(false);
                      // 切换话题时清空已选社群
                      setSelectedCommunities([]);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm border bg-blue-600 text-white border-blue-600 hover:bg-blue-700 transition-colors`}
                >
                  确认
                </button>
                <button
                  onClick={() => {
                    setIsCreatingTopic(false);
                    setNewTopic('');
                  }}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    isDark
                      ? 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreatingTopic(true)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  isDark
                    ? 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-500 hover:bg-gray-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <span className="mr-1">+</span>
                创建新话题
              </button>
            )}
          </div>
        </div>

        {/* 内容类型选择 */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            内容类型
          </label>
          <div className="flex flex-wrap gap-2">
            {contentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setSelectedContentType(type.id);
                  setUploadError(''); // 切换内容类型时重置错误
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  selectedContentType === type.id
                    ? 'bg-green-600 text-white shadow-md transform scale-105'
                    : isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white border border-gray-600'
                    : 'bg-white text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-300'
                }`}
              >
                <i className={type.icon}></i>
                <span>{type.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* 上传错误信息 */}
        {uploadError && (
          <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            <i className="fas fa-exclamation-circle mr-1"></i>
            {uploadError}
          </div>
        )}

        <div>
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            选择社群 ({selectedCommunities.length} 个已选)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
            {filteredCommunities.map((community) => (
              <div
                key={community.id}
                onClick={() => handleCommunityToggle(community.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedCommunities.includes(community.id)
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600'
                    : isDark
                    ? 'bg-gray-700 border-gray-600 hover:border-gray-500'
                    : 'bg-white border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={community.avatar}
                      alt={community.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-sm font-medium">{community.name}</div>
                      <div className="text-xs opacity-70">{community.memberCount} 成员</div>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    selectedCommunities.includes(community.id)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : isDark
                      ? 'border-gray-500'
                      : 'border-gray-400'
                  }`}>
                    {selectedCommunities.includes(community.id) && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredCommunities.length === 0 && (
            <div className="text-center py-4 text-sm opacity-70">
              暂无相关社群
            </div>
          )}
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            内容
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            placeholder="分享你的想法..."
          />
        </div>

        {/* 媒体上传部分 - 根据内容类型动态显示 */}
        {(selectedContentType === 'image' || selectedContentType === 'video' || selectedContentType === 'audio' || selectedContentType === 'link') && (
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {selectedContentType === 'image' && '添加图片'}
              {selectedContentType === 'video' && '添加视频'}
              {selectedContentType === 'audio' && '添加语音'}
              {selectedContentType === 'link' && '添加链接'}
            </label>
            
            {/* 链接输入 */}
            {selectedContentType === 'link' && (
              <div className="mb-4">
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value.trim())}
                  placeholder="输入链接地址..."
                  className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
            )}
            
            {/* 图片上传 */}
            {selectedContentType === 'image' && (
              <div className="mb-4">
                {/* 图片预览 */}
                {imagePreviewUrls.length > 0 && (
                  <div className="flex gap-3 mb-3 overflow-x-auto pb-2">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                        <img 
                          src={url} 
                          alt={`Preview ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => {
                            setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
                            setSelectedImages(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <i className="fas fa-times text-xs"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 图片上传组件 */}
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
              </div>
            )}
            
            {/* 视频上传 */}
            {selectedContentType === 'video' && (
              <div className="mb-4">
                {/* 视频预览 */}
                {videoPreviewUrls.length > 0 && (
                  <div className="flex gap-3 mb-3 overflow-x-auto pb-2">
                    {videoPreviewUrls.map((url, index) => (
                      <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                        <video 
                          src={url} 
                          className="w-full h-full object-cover"
                          controls
                        />
                        <button
                          onClick={() => {
                            setVideoPreviewUrls(prev => prev.filter((_, i) => i !== index));
                            setSelectedVideos(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <i className="fas fa-times text-xs"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 视频上传组件 */}
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
              </div>
            )}
            
            {/* 音频上传 */}
            {selectedContentType === 'audio' && (
              <div className="mb-4">
                {/* 音频预览 */}
                {audioPreviewUrls.length > 0 && (
                  <div className="space-y-3 mb-3">
                    {audioPreviewUrls.map((url, index) => (
                      <div key={index} className="relative p-3 rounded-lg border flex items-center">
                        <audio 
                          src={url} 
                          className="flex-1"
                          controls
                        />
                        <button
                          onClick={() => {
                            setAudioPreviewUrls(prev => prev.filter((_, i) => i !== index));
                            setSelectedAudios(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="ml-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <i className="fas fa-times text-sm"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 音频上传组件 */}
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
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
