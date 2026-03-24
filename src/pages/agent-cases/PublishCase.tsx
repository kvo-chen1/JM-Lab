// 发布案例页面

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { publishCase } from './services/agentCaseService';
import {
  ChevronLeft,
  Upload,
  X,
  Loader2,
  Sparkles,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

interface PublishData {
  title: string;
  description: string;
  coverImage: string;
  images: string[];
  conversationId: string;
}

const PublishCasePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();

  const [publishData, setPublishData] = useState<PublishData | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCover, setSelectedCover] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 从location state获取发布数据
  useEffect(() => {
    const data = location.state?.publishData as PublishData;
    if (data) {
      setPublishData(data);
      setTitle(data.title);
      setDescription(data.description);
    } else {
      // 如果没有数据，返回案例列表
      toast.error('没有可发布的案例数据');
      navigate('/agent-cases');
    }
  }, [location.state, navigate]);

  // 添加标签
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // 删除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // 处理标签输入回车
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // 发布案例
  const handlePublish = async () => {
    if (!publishData) return;

    if (!title.trim()) {
      toast.error('请输入标题');
      return;
    }

    setIsPublishing(true);

    try {
      await publishCase({
        title: title.trim(),
        description: description.trim(),
        coverImage: publishData.images[selectedCover],
        images: publishData.images,
        conversationId: publishData.conversationId,
        tags,
      });

      setIsSuccess(true);
      toast.success('案例发布成功！');

      // 2秒后跳转到案例列表
      setTimeout(() => {
        navigate('/agent-cases');
      }, 2000);
    } catch (error) {
      console.error('发布案例失败:', error);
      toast.error('发布失败，请稍后重试');
    } finally {
      setIsPublishing(false);
    }
  };

  if (!publishData) {
    return (
      <div className={`
        min-h-screen flex items-center justify-center
        ${isDark ? 'bg-[#0a0f0a]' : 'bg-gray-50'}
      `}>
        <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
      </div>
    );
  }

  // 发布成功状态
  if (isSuccess) {
    return (
      <div className={`
        min-h-screen flex flex-col items-center justify-center px-4
        ${isDark ? 'bg-[#0a0f0a]' : 'bg-gray-50'}
      `}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="
            w-20 h-20 rounded-full flex items-center justify-center mb-6
            bg-gradient-to-br from-green-400 to-emerald-500
          "
        >
          <Check className="w-10 h-10 text-white" />
        </motion.div>
        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          发布成功！
        </h2>
        <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          你的案例已成功发布到Agent案例库
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/agent-cases')}
          className="
            px-6 py-2.5 rounded-xl
            bg-gradient-to-r from-[#C02C38] to-[#E85D75]
            text-white font-medium
          "
        >
          查看案例
        </motion.button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0f0a]' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`
        sticky top-0 z-30 px-4 sm:px-6 py-4
        border-b backdrop-blur-md
        ${isDark 
          ? 'bg-[#0a0f0a]/80 border-[#2a2f2a]' 
          : 'bg-white/80 border-gray-200'
        }
      `}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(-1)}
                className={`
                  p-2 rounded-lg transition-colors
                  ${isDark 
                    ? 'hover:bg-[#2a2f2a] text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-600'
                  }
                `}
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
              <h1 className={`
                text-lg font-bold
                ${isDark ? 'text-white' : 'text-gray-900'}
              `}>
                发布案例
              </h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePublish}
              disabled={isPublishing || !title.trim()}
              className="
                flex items-center gap-2 px-5 py-2 rounded-xl
                bg-gradient-to-r from-[#C02C38] to-[#E85D75]
                text-white text-sm font-medium
                shadow-lg shadow-red-500/20
                hover:shadow-xl hover:shadow-red-500/30
                transition-shadow
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>发布中...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>发布</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* 标题输入 */}
          <div className={`
            p-4 rounded-2xl
            ${isDark ? 'bg-[#1a1f1a]' : 'bg-white'}
          `}>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给你的作品起个名字"
              maxLength={50}
              className={`
                w-full px-4 py-3 rounded-xl
                text-base
                border-2 transition-colors
                focus:outline-none
                ${isDark 
                  ? 'bg-[#0a0f0a] border-[#2a2f2a] text-white placeholder-gray-600 focus:border-[#C02C38]' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#C02C38]'
                }
              `}
            />
            <div className={`text-right text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {title.length}/50
            </div>
          </div>

          {/* 描述输入 */}
          <div className={`
            p-4 rounded-2xl
            ${isDark ? 'bg-[#1a1f1a]' : 'bg-white'}
          `}>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述一下你的创作思路..."
              rows={4}
              maxLength={500}
              className={`
                w-full px-4 py-3 rounded-xl resize-none
                text-sm leading-relaxed
                border-2 transition-colors
                focus:outline-none
                ${isDark 
                  ? 'bg-[#0a0f0a] border-[#2a2f2a] text-white placeholder-gray-600 focus:border-[#C02C38]' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#C02C38]'
                }
              `}
            />
            <div className={`text-right text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {description.length}/500
            </div>
          </div>

          {/* 封面选择 */}
          <div className={`
            p-4 rounded-2xl
            ${isDark ? 'bg-[#1a1f1a]' : 'bg-white'}
          `}>
            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              选择封面 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {publishData.images.map((image, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCover(index)}
                  className={`
                    relative aspect-square rounded-xl overflow-hidden
                    ${selectedCover === index
                      ? 'ring-2 ring-[#C02C38] ring-offset-2 ring-offset-transparent'
                      : ''
                    }
                  `}
                >
                  <img
                    src={image}
                    alt={`图片 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {selectedCover === index && (
                    <div className="
                      absolute inset-0 bg-[#C02C38]/20
                      flex items-center justify-center
                    ">
                      <div className="
                        w-6 h-6 rounded-full bg-[#C02C38]
                        flex items-center justify-center
                      ">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* 标签输入 */}
          <div className={`
            p-4 rounded-2xl
            ${isDark ? 'bg-[#1a1f1a]' : 'bg-white'}
          `}>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              标签 <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>(最多5个)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={`
                    flex items-center gap-1 px-3 py-1.5 rounded-full text-sm
                    ${isDark ? 'bg-[#2a2f2a] text-gray-300' : 'bg-gray-100 text-gray-700'}
                  `}
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            {tags.length < 5 && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="添加标签，按回车确认"
                  className={`
                    flex-1 px-4 py-2 rounded-xl
                    text-sm
                    border-2 transition-colors
                    focus:outline-none
                    ${isDark 
                      ? 'bg-[#0a0f0a] border-[#2a2f2a] text-white placeholder-gray-600 focus:border-[#C02C38]' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#C02C38]'
                    }
                  `}
                />
                <button
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                  className="
                    px-4 py-2 rounded-xl
                    bg-gradient-to-r from-[#C02C38] to-[#E85D75]
                    text-white text-sm font-medium
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  添加
                </button>
              </div>
            )}
          </div>

          {/* 提示信息 */}
          <div className={`
            p-4 rounded-xl flex items-start gap-3
            ${isDark ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-100'}
          `}>
            <Sparkles className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                发布提示
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                发布成功后，你的案例将展示在Agent案例库中，其他用户可以查看、点赞和创作同款。
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublishCasePage;
