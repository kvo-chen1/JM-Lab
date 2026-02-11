import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '@/pages/create/hooks/useCreateStore';
import postsApi from '@/services/postService';
import { toast } from 'sonner';
import { AuthContext } from '@/contexts/authContext';
import { X, Plus, Hash, Image as ImageIcon, Video, Type, AlignLeft, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

interface PublishToSquareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 预设标签
const PRESET_TAGS = [
  '国潮', '纹样设计', '传统文化', '青花瓷', '山水画',
  '民俗', '剪纸', '刺绣', '书法', '篆刻',
  '敦煌', '壁画', '唐三彩', '景泰蓝', '漆器',
  '汉服', '旗袍', '茶道', '香道', '花道',
  'AI创作', '数字艺术', '概念设计', '插画', '海报'
];

export default function PublishToSquareModal({ isOpen, onClose }: PublishToSquareModalProps) {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentType, setContentType] = useState<'image' | 'video'>('image');
  const [videoUrl, setVideoUrl] = useState('');
  const [showPresetTags, setShowPresetTags] = useState(false);

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

  // 添加标签
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
    }
    setTagInput('');
  };

  // 移除标签
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // 处理标签输入
  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === ',' || e.key === '，') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

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
        tags: tags,
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
      
      const post = await postsApi.addPost(postData, user as import('@/services/postService').User | undefined);
      
      if (post) {
        toast.success('作品发布成功！');
        onClose();

        // 重置表单
        setTitle('');
        setDescription('');
        setTags([]);
        setTagInput('');
        setVideoUrl('');
        setContentType('image');
        setShowPresetTags(false);
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
            <div className={`p-6 border-b ${isDark ? 'border-gray-800/50' : 'border-gray-200'} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-[#C02C38]/20' : 'bg-[#C02C38]/10'
                }`}>
                  <Sparkles className="w-5 h-5 text-[#C02C38]" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    发布到津脉广场
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    分享你的AI创作作品
                  </p>
                </div>
              </div>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2.5 rounded-xl transition-colors ${
                  isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
            
            {/* 内容 */}
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                {/* 内容类型选择 */}
                <div className={`mb-6 p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                  <h4 className={`text-sm font-medium mb-3 flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Sparkles className="w-4 h-4 text-[#C02C38]" />
                    内容类型
                  </h4>
                  <div className="flex gap-3">
                    <motion.button
                      type="button"
                      onClick={() => setContentType('image')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                        contentType === 'image'
                          ? (isDark ? 'bg-gradient-to-r from-[#C02C38] to-[#D04550] text-white shadow-lg shadow-[#C02C38]/25' : 'bg-gradient-to-r from-[#C02C38] to-[#D04550] text-white shadow-lg shadow-[#C02C38]/25')
                          : (isDark ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200')
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span className="font-medium">图片</span>
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => setContentType('video')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                        contentType === 'video'
                          ? (isDark ? 'bg-gradient-to-r from-[#C02C38] to-[#D04550] text-white shadow-lg shadow-[#C02C38]/25' : 'bg-gradient-to-r from-[#C02C38] to-[#D04550] text-white shadow-lg shadow-[#C02C38]/25')
                          : (isDark ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200')
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      <span className="font-medium">视频</span>
                    </motion.button>
                  </div>
                </div>
                
                {/* 预览 */}
                <div className="mb-6">
                  <h4 className={`text-sm font-medium mb-3 flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <ImageIcon className="w-4 h-4 text-[#C02C38]" />
                    作品预览
                  </h4>
                  <motion.div
                    layout
                    className={`aspect-video rounded-2xl overflow-hidden border-2 ${
                      isDark ? 'border-gray-700/50 bg-gray-800/30' : 'border-gray-200 bg-gray-50'
                    } flex items-center justify-center relative group`}
                  >
                    {contentType === 'image' && thumbnail ? (
                      <>
                        <img
                          src={thumbnail}
                          alt="预览"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <ImageIcon className="w-3 h-3 inline mr-1" />
                          图片作品
                        </div>
                      </>
                    ) : contentType === 'video' && videoUrl ? (
                      <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors"
                        >
                          <Video className="w-6 h-6 text-white" />
                        </motion.div>
                        <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
                          <Video className="w-3 h-3 inline mr-1" />
                          视频作品
                        </div>
                      </div>
                    ) : (
                      <div className={`flex flex-col items-center justify-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                          {contentType === 'image' ? (
                            <ImageIcon className="w-8 h-8" />
                          ) : (
                            <Video className="w-8 h-8" />
                          )}
                        </div>
                        <span className="text-sm font-medium">{contentType === 'image' ? '图片预览' : '视频预览'}</span>
                        <span className="text-xs mt-1 opacity-60">请先生成内容</span>
                      </div>
                    )}
                  </motion.div>
                </div>
                
                {/* 视频链接输入 */}
                {contentType === 'video' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                  >
                    <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Video className="w-4 h-4 text-[#C02C38]" />
                      视频链接
                      {aiVideoUrl && (
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${isDark ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                          <CheckCircle2 className="w-3 h-3" />
                          已自动填充
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder={aiVideoUrl ? "AI生成视频已自动填充" : "输入视频链接（支持 YouTube、Vimeo 等）"}
                        className={`w-full px-4 py-3 pl-11 rounded-xl border-2 transition-all duration-200 ${
                          isDark
                            ? 'bg-gray-800/50 border-gray-700 text-white focus:border-[#C02C38]/50 focus:bg-gray-800'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-[#C02C38]/30 focus:bg-white'
                        } ${aiVideoUrl ? 'border-green-500/50' : ''} outline-none`}
                        disabled={isSubmitting}
                      />
                      <Video className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${aiVideoUrl ? 'text-green-500' : isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    </div>
                    {aiVideoUrl && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`text-xs mt-2 flex items-center gap-1 ${isDark ? 'text-green-400/80' : 'text-green-600'}`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        视频已上传到永久存储，可直接发布
                      </motion.p>
                    )}
                  </motion.div>
                )}
                
                {/* 标题 */}
                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Type className="w-4 h-4 text-[#C02C38]" />
                    作品标题
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="给你的作品起个吸引人的标题"
                      className={`w-full px-4 py-3 pl-11 rounded-xl border-2 transition-all duration-200 ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700 text-white focus:border-[#C02C38]/50 focus:bg-gray-800'
                          : 'bg-white border-gray-200 text-gray-900 focus:border-[#C02C38]/30 focus:bg-white'
                      } outline-none placeholder:text-gray-400`}
                      maxLength={50}
                      disabled={isSubmitting}
                    />
                    <Type className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${title ? 'text-[#C02C38]' : isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      好的标题能让作品获得更多关注
                    </p>
                    <div className="flex items-center gap-1">
                      <div className={`h-1 rounded-full transition-all duration-300 ${
                        title.length === 0 ? 'w-0' :
                        title.length < 20 ? 'w-4 bg-gray-300' :
                        title.length < 40 ? 'w-8 bg-yellow-400' :
                        'w-12 bg-green-500'
                      }`} />
                      <span className={`text-xs font-medium ${
                        title.length >= 40 ? 'text-green-500' :
                        title.length >= 20 ? 'text-yellow-500' :
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {title.length}/50
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* 描述 */}
                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <AlignLeft className="w-4 h-4 text-[#C02C38]" />
                    作品描述
                  </label>
                  <div className="relative">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="描述一下你的创作灵感、使用的AI工具或想要表达的文化内涵..."
                      rows={4}
                      className={`w-full px-4 py-3 pl-11 rounded-xl border-2 transition-all duration-200 resize-none ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700 text-white focus:border-[#C02C38]/50 focus:bg-gray-800'
                          : 'bg-white border-gray-200 text-gray-900 focus:border-[#C02C38]/30 focus:bg-white'
                      } outline-none placeholder:text-gray-400`}
                      maxLength={200}
                      disabled={isSubmitting}
                    />
                    <AlignLeft className={`absolute left-3.5 top-3.5 w-4 h-4 ${description ? 'text-[#C02C38]' : isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      详细的描述有助于其他创作者理解你的作品
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            description.length === 0 ? 'w-0' :
                            description.length < 50 ? 'bg-gray-400' :
                            description.length < 100 ? 'bg-blue-400' :
                            description.length < 150 ? 'bg-yellow-400' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((description.length / 200) * 100, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        description.length >= 150 ? 'text-green-500' :
                        description.length >= 100 ? 'text-yellow-500' :
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {description.length}/200
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* 标签 */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <label className={`block text-sm font-medium flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Hash className="w-4 h-4 text-[#C02C38]" />
                      标签
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              i < tags.length
                                ? 'bg-[#C02C38] scale-100'
                                : isDark ? 'bg-gray-700 scale-75' : 'bg-gray-200 scale-75'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-xs font-medium ${
                        tags.length >= 5 ? 'text-[#C02C38]' : isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {tags.length}/5
                      </span>
                    </div>
                  </div>

                  {/* 已选标签展示 */}
                  <AnimatePresence mode="popLayout">
                    {tags.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-2 mb-3"
                      >
                        {tags.map((tag, index) => (
                          <motion.span
                            key={tag}
                            layout
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                              isDark
                                ? 'bg-gradient-to-r from-[#C02C38]/20 to-[#C02C38]/10 text-[#C02C38] border border-[#C02C38]/30'
                                : 'bg-gradient-to-r from-[#C02C38]/10 to-[#C02C38]/5 text-[#C02C38] border border-[#C02C38]/20'
                            }`}
                          >
                            <Hash className="w-3 h-3 opacity-70" />
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className={`ml-0.5 rounded-full p-0.5 transition-all hover:scale-110 ${
                                isDark ? 'hover:bg-[#C02C38]/20' : 'hover:bg-[#C02C38]/10'
                              }`}
                              disabled={isSubmitting}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </motion.span>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 标签输入 */}
                  <div className="relative">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      placeholder={tags.length >= 5 ? "已达到最大标签数量" : "输入标签后按回车或逗号添加"}
                      className={`w-full px-4 py-3 pl-11 rounded-xl border-2 transition-all duration-200 ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700 text-white focus:border-[#C02C38]/50 focus:bg-gray-800'
                          : 'bg-white border-gray-200 text-gray-900 focus:border-[#C02C38]/30 focus:bg-white'
                      } outline-none placeholder:text-gray-400 disabled:opacity-50`}
                      disabled={isSubmitting || tags.length >= 5}
                    />
                    <Hash className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      tags.length >= 5 ? 'text-[#C02C38]' : isDark ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                    {tagInput.trim() && tags.length < 5 && (
                      <motion.button
                        type="button"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={() => addTag(tagInput)}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                          isDark ? 'hover:bg-[#C02C38]/20 text-[#C02C38]' : 'hover:bg-[#C02C38]/10 text-[#C02C38]'
                        }`}
                        disabled={isSubmitting}
                      >
                        <Plus className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>

                  {/* 预设标签 */}
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowPresetTags(!showPresetTags)}
                      className={`text-xs flex items-center gap-1.5 transition-colors px-2 py-1 rounded-lg ${
                        isDark ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <motion.i
                        animate={{ rotate: showPresetTags ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="fas fa-chevron-down"
                      />
                      推荐标签
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {PRESET_TAGS.filter(tag => !tags.includes(tag)).length}
                      </span>
                    </button>

                    <AnimatePresence>
                      {showPresetTags && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-dashed border-gray-300 dark:border-gray-700">
                            {PRESET_TAGS.filter(tag => !tags.includes(tag)).map((tag, index) => (
                              <motion.button
                                key={tag}
                                type="button"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.02 }}
                                onClick={() => addTag(tag)}
                                disabled={tags.length >= 5 || isSubmitting}
                                className={`px-3 py-1.5 rounded-full text-xs transition-all hover:scale-105 ${
                                  isDark
                                    ? 'bg-gray-800/80 text-gray-400 hover:bg-gray-700 hover:text-gray-300 border border-gray-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 border border-gray-200'
                                } disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100`}
                              >
                                + {tag}
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                
                {/* 提交按钮 */}
                <div className="flex gap-3 pt-2">
                  <motion.button
                    type="button"
                    onClick={onClose}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 px-6 py-3.5 rounded-xl border-2 font-medium transition-all ${
                      isDark
                        ? 'bg-gray-800/50 hover:bg-gray-800 border-gray-700 text-gray-300 hover:text-white'
                        : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-900'
                    }`}
                    disabled={isSubmitting}
                  >
                    取消
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    className={`flex-1 px-6 py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      isDark
                        ? 'bg-gradient-to-r from-[#C02C38] to-[#D04550] hover:from-[#A02430] hover:to-[#B83540] text-white shadow-lg shadow-[#C02C38]/25'
                        : 'bg-gradient-to-r from-[#C02C38] to-[#D04550] hover:from-[#A02430] hover:to-[#B83540] text-white shadow-lg shadow-[#C02C38]/25'
                    } disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none`}
                    disabled={isSubmitting || !title.trim()}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>发布中...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>发布作品</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
