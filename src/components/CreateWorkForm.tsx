import React, { useState, useRef, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { Work } from '@/mock/works';
import postsApi from '@/services/postService';

// 分类数据
const categories = [
  '国潮设计', '纹样设计', '品牌设计', '非遗传承', '插画设计',
  '工艺创新', '老字号品牌', 'IP设计', '包装设计', '字体设计'
];

interface CreateWorkFormProps {
  onClose: () => void;
  onSuccess: (work: Work) => void;
  embedded?: boolean;
  initialImage?: string | null;
  initialTitle?: string;
  initialDescription?: string;
}

const CreateWorkForm: React.FC<CreateWorkFormProps> = ({ 
  onClose, 
  onSuccess, 
  embedded = false,
  initialImage = null,
  initialTitle = '',
  initialDescription = ''
}) => {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  
  // 表单状态
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [category, setCategory] = useState(categories[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImage);
  
  // 状态管理
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // 引用
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 处理拖放事件
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);
  
  // 处理文件选择
  const handleFileSelect = (file: File) => {
    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('仅支持 JPG、PNG 格式的图片');
      return;
    }
    
    // 验证文件大小
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB');
      return;
    }
    
    setImage(file);
    setErrors(prev => ({ ...prev, image: '' }));
    
    // 创建预览
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // 处理点击选择文件
  const handleClickSelect = () => {
    fileInputRef.current?.click();
  };
  
  // 处理文件输入变化
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };
  
  // 处理标签添加
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  // 处理标签删除
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // 处理表单验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = '请输入作品标题';
    }
    
    if (!description.trim()) {
      newErrors.description = '请输入作品描述';
    }
    
    if (!image && !imagePreview) {
      newErrors.image = '请上传作品图片';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    console.log('[CreateWorkForm] handleSubmit called');
    console.log('[CreateWorkForm] image:', image);
    console.log('[CreateWorkForm] imagePreview:', imagePreview);
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setUploadProgress(0);
    
    // 模拟上传进度
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          return 90; // 在上传完成前保持在90%
        }
        return prev + 10;
      });
    }, 200);
    
    try {
      // 创建新作品
      const newWork: Omit<Work, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'comments' | 'views' | 'userId' | 'isPublic' | 'type' | 'thumbnailUrl' | 'isFeatured'> = {
        title,
        description,
        categoryId: category,
        tags,
      };
      
      console.log('[CreateWorkForm] newWork:', newWork);
      
      let publishedWork;
      
      if (image) {
        // 如果有文件对象，直接使用
        console.log('[CreateWorkForm] Using createWork with image file');
        publishedWork = await postsApi.createWork(newWork, image, user?.id);
      } else if (imagePreview) {
        // 如果只有预览图（如来自草稿或URL）
        console.log('[CreateWorkForm] Using createWorkWithUrl with imagePreview');
        try {
          if (imagePreview.startsWith('data:')) {
             const res = await fetch(imagePreview);
             const blob = await res.blob();
             const file = new File([blob], "work.png", { type: "image/png" });
             publishedWork = await postsApi.createWork(newWork, file, user?.id);
          } else {
             // 远程URL或Blob URL
             // 尝试直接使用 createWorkWithUrl
             publishedWork = await postsApi.createWorkWithUrl(newWork, imagePreview, user?.id);
          }
        } catch (imgError) {
          console.error('处理图片失败:', imgError);
          // 如果图片处理失败，尝试直接用 createWorkWithUrl 作为最后的 fallback
          publishedWork = await postsApi.createWorkWithUrl(newWork, imagePreview, user?.id);
        }
      } else {
        // 没有图片，使用默认图片
        console.log('[CreateWorkForm] No image, using default image');
        const defaultImage = 'https://picsum.photos/seed/default/800/600';
        publishedWork = await postsApi.createWorkWithUrl(newWork, defaultImage, user?.id);
      }
      
      // 完成上传进度
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // 短暂延迟以显示100%
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 显示成功提示
      toast.success('作品发布成功！', {
        action: {
          label: '去广场看看',
          onClick: () => navigate('/square')
        }
      });
      
      // 触发更新事件，通知广场页面刷新
      window.dispatchEvent(new Event('square-posts-updated'));
      
      // 调用成功回调
      if (publishedWork) {
        onSuccess(publishedWork);
      }
      
      // 重置表单
      resetForm();
      
      // 关闭表单
      onClose();
    } catch (error) {
      console.error('发布作品失败:', error);
      clearInterval(progressInterval);
      // 保持进度条在90%并显示错误
      setUploadProgress(90); 
      setSubmitError('发布失败，请重试');
      toast.error('发布失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 重置表单
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory(categories[0]);
    setTags([]);
    setTagInput('');
    setImage(null);
    setImagePreview(null);
    setErrors({});
    setSubmitError(null);
    setUploadProgress(0);
  };
  
  return (
    <motion.div 
      className={embedded 
        ? `w-full overflow-hidden ${isDark ? 'text-white' : 'text-gray-900'}` 
        : `${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]`
      }
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      {/* 头部 */}
      {!embedded && (
        <div className={`flex justify-between items-center p-6 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            发布作品
          </h2>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'} transition-colors`}
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {/* 错误提示 Banner */}
        <AnimatePresence>
          {submitError && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 flex items-center gap-3 text-red-600 dark:text-red-400"
            >
              <i className="fas fa-exclamation-circle text-lg"></i>
              <span className="flex-1 font-medium text-sm">{submitError}</span>
              <button 
                onClick={() => setSubmitError(null)}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-800/40 rounded-full transition-colors"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          {/* 图片上传区域 */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-200">作品图片</label>
              {errors.image && <span className="text-xs text-red-500">{errors.image}</span>}
            </div>
            <div
              className={`relative border-2 border-dashed rounded-xl transition-all overflow-hidden
                ${isDragging 
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' 
                  : errors.image
                    ? 'border-red-300 bg-red-50/10'
                    : isDark ? 'border-gray-700 hover:border-gray-600 bg-gray-800/50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={!imagePreview ? handleClickSelect : undefined}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg,image/jpg,image/png" 
                onChange={handleFileInputChange}
              />
              
              {imagePreview ? (
                <div className="relative group">
                  <img 
                    src={imagePreview} 
                    alt="预览" 
                    className="w-full max-h-[300px] object-contain bg-gray-100 dark:bg-gray-900/50"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-start justify-end p-3">
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setImage(null);
                        setImagePreview(null);
                      }}
                      className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm transition-all transform hover:scale-110"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4 text-blue-500 dark:text-blue-400">
                    <i className="fas fa-cloud-upload-alt text-2xl"></i>
                  </div>
                  <p className="font-medium text-gray-700 dark:text-gray-200 mb-1">点击或拖拽上传图片</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">支持 JPG、PNG，最大 5MB</p>
                </div>
              )}
            </div>
          </div>
          
          {/* 作品标题 */}
          <div className="mb-5">
            <label htmlFor="title" className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">作品标题</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border transition-all
                ${errors.title 
                  ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                  : isDark 
                    ? 'bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10' 
                    : 'bg-white border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                } outline-none`}
              placeholder="给你的作品起个好听的名字"
            />
            {errors.title && <p className="mt-1 text-xs text-red-500 ml-1">{errors.title}</p>}
          </div>
          
          {/* 作品描述 */}
          <div className="mb-5">
            <label htmlFor="description" className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">作品描述</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={`w-full px-4 py-3 rounded-xl border transition-all resize-none
                ${errors.description 
                  ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                  : isDark 
                    ? 'bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10' 
                    : 'bg-white border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                } outline-none`}
              placeholder="描述创作灵感、使用的工具或背后的故事..."
            />
            {errors.description && <p className="mt-1 text-xs text-red-500 ml-1">{errors.description}</p>}
          </div>
          
          {/* 作品分类 */}
          <div className="mb-5">
            <label htmlFor="category" className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">作品分类</label>
            <div className="relative">
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border appearance-none cursor-pointer
                  ${isDark 
                    ? 'bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10' 
                    : 'bg-white border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                  } outline-none`}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <i className="fas fa-chevron-down text-xs"></i>
              </div>
            </div>
          </div>
          
          {/* 标签输入 */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">作品标签</label>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border mb-3 transition-all
              ${isDark 
                ? 'bg-gray-800 border-gray-700 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10' 
                : 'bg-white border-gray-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100'
              }`}>
              <i className="fas fa-hashtag text-gray-400"></i>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1 bg-transparent border-none focus:ring-0 outline-none h-8"
                placeholder="输入标签后按回车添加"
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                添加
              </button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`pl-3 pr-2 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5
                      ${isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors
                        ${isDark ? 'hover:bg-blue-500/20' : 'hover:bg-blue-200/50'}`}
                    >
                      <i className="fas fa-times text-[10px]"></i>
                    </button>
                  </motion.span>
                ))}
              </div>
            )}
          </div>
          
          {/* 上传进度 */}
          <AnimatePresence>
            {uploadProgress > 0 && (
              <motion.div 
                className="mb-6"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              >
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">上传进度</span>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{uploadProgress}%</span>
                </div>
                <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <motion.div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 底部按钮 */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-3.5 rounded-xl font-medium transition-all duration-200
                ${isDark 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-3.5 rounded-xl font-medium text-white shadow-lg shadow-blue-500/25 transition-all duration-200
                bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>发布中...</span>
                </div>
              ) : (
                '发布作品'
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default CreateWorkForm;
