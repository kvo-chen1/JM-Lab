import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { X, Upload, Image as ImageIcon, Trash2, MessageSquare, History } from 'lucide-react';
import { toast } from 'sonner';
import {
  FeedbackFormData,
  FeedbackItem,
  FEEDBACK_TYPE_OPTIONS,
  getFeedbackTypeLabel,
  getFeedbackTypeColor
} from '@/types/feedback';
import { feedbackService } from '@/services/feedbackService';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/services/imageService';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'submit' | 'history';

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('submit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // 获取当前用户ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    getUser();
  }, []);
  
  // 表单状态
  const [formData, setFormData] = useState<FeedbackFormData>({
    type: 'bug',
    description: '',
    images: [],
    contact: ''
  });
  const [uploadingImages, setUploadingImages] = useState<string[]>([]);

  // 加载历史反馈
  const loadFeedbacks = useCallback(async () => {
    if (!userId) {
      // 如果用户未登录，从 localStorage 加载
      const stored = localStorage.getItem('user_feedbacks_local');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setFeedbacks(data);
        } catch (e) {
          console.error('解析本地反馈数据失败:', e);
        }
      }
      return;
    }

    setIsLoading(true);
    try {
      const data = await feedbackService.getUserFeedbacks(userId);
      setFeedbacks(data);
    } catch (error) {
      console.error('加载反馈历史失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 切换标签时加载历史
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'history') {
      loadFeedbacks();
    }
  };

  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      const tempId = `temp_${Date.now()}_${Math.random()}`;
      setUploadingImages(prev => [...prev, tempId]);

      try {
        const imageUrl = await uploadImage(file, 'feedback-images');
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, imageUrl]
        }));
      } catch (error) {
        toast.error(`上传图片失败: ${file.name}`);
      } finally {
        setUploadingImages(prev => prev.filter(id => id !== tempId));
      }
    }
  };

  // 删除已上传图片
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // 提交反馈
  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      toast.error('请填写问题描述');
      return;
    }

    setIsSubmitting(true);
    try {
      // 将 FeedbackFormData 转换为 feedbackService 期望的格式
      await feedbackService.submitFeedback({
        type: formData.type,
        content: formData.description,  // 将 description 映射为 content
        screenshots: formData.images,    // 将 images 映射为 screenshots
        contact_info: formData.contact,  // 将 contact 映射为 contact_info
        contact_type: formData.contact ? 'email' : undefined,
        user_id: userId || undefined,
        page_url: window.location.href
      });
      toast.success('反馈提交成功！我们会尽快处理');

      // 重置表单
      setFormData({
        type: 'bug',
        description: '',
        images: [],
        contact: ''
      });

      // 切换到历史记录
      handleTabChange('history');
    } catch (error) {
      toast.error('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={e => e.stopPropagation()}
          className={`w-full max-w-lg rounded-2xl overflow-hidden ${
            isDark ? 'bg-gray-900' : 'bg-white'
          } shadow-2xl`}
        >
          {/* 头部 */}
          <div className={`flex items-center justify-between p-5 border-b ${
            isDark ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              产品反馈
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 标签页切换 */}
          <div className={`flex border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <button
              onClick={() => handleTabChange('submit')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === 'submit'
                  ? 'text-[#C02C38] border-b-2 border-[#C02C38]'
                  : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              提交反馈
            </button>
            <button
              onClick={() => handleTabChange('history')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'text-[#C02C38] border-b-2 border-[#C02C38]'
                  : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <History className="w-4 h-4" />
              历史记录
            </button>
          </div>

          {/* 内容区域 */}
          <div className="p-5 max-h-[70vh] overflow-y-auto">
            {activeTab === 'submit' ? (
              // 提交反馈表单
              <div className="space-y-5">
                {/* 问题类型 */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    问题类型
                  </label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                      isDark
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-[#C02C38]`}
                  >
                    {FEEDBACK_TYPE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 问题描述 */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    问题描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="请详细描述你遇到的问题，包括具体的操作步骤、错误信息、期望结果等..."
                    rows={5}
                    className={`w-full px-4 py-3 rounded-xl border text-sm resize-none ${
                      isDark
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-[#C02C38]`}
                  />
                </div>

                {/* 反馈图片 */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    反馈图片（可上传或粘贴）
                  </label>
                  
                  {/* 图片预览 */}
                  {(formData.images.length > 0 || uploadingImages.length > 0) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.images.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`反馈图片 ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {uploadingImages.map(id => (
                        <div
                          key={id}
                          className={`w-20 h-20 rounded-lg flex items-center justify-center ${
                            isDark ? 'bg-gray-800' : 'bg-gray-100'
                          }`}
                        >
                          <div className="w-5 h-5 border-2 border-[#C02C38] border-t-transparent rounded-full animate-spin" />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* 上传按钮 */}
                  <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}>
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">选择图片</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 联系方式 */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    联系方式（选填）
                  </label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={e => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                    placeholder="邮箱或手机号，方便我们联系您"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                      isDark
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-[#C02C38]`}
                  />
                </div>
              </div>
            ) : (
              // 历史记录
              <div className="space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-6 h-6 border-2 border-[#C02C38] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : feedbacks.length === 0 ? (
                  <div className={`text-center py-10 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">暂无反馈记录</p>
                  </div>
                ) : (
                  feedbacks.map(feedback => (
                    <div
                      key={feedback.id}
                      className={`p-4 rounded-xl border ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: `${getFeedbackTypeColor(feedback.type)}20`,
                            color: getFeedbackTypeColor(feedback.type)
                          }}
                        >
                          {getFeedbackTypeLabel(feedback.type)}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {new Date(feedback.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {/* @ts-ignore - API 返回的是 content 字段 */}
                        {feedback.content || feedback.description}
                      </p>
                      {/* @ts-ignore - API 返回的是 screenshots 字段 */}
                      {(feedback.screenshots?.length > 0 || feedback.images?.length > 0) && (
                        <div className="flex gap-1 mt-2">
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {/* @ts-ignore */}
                            {(feedback.screenshots?.length || feedback.images?.length || 0)} 张图片
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          {activeTab === 'submit' && (
            <div className={`p-5 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.description.trim()}
                className={`w-full py-3 rounded-xl font-medium text-white transition-all ${
                  isSubmitting || !formData.description.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#C02C38] to-[#E85D75] hover:shadow-lg hover:shadow-[#C02C38]/25'
                }`}
              >
                {isSubmitting ? '提交中...' : '提交反馈'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
