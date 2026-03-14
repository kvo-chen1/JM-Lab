import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { uploadImage } from '@/services/imageService';



// 社群分类数据
const COMMUNITY_CATEGORIES = [
  { id: 'design', name: '设计创意', icon: 'fa-palette', color: '#8B5CF6', description: 'UI/UX、平面设计、3D建模' },
  { id: 'tech', name: '技术开发', icon: 'fa-code', color: '#3B82F6', description: '前端、后端、AI技术' },
  { id: 'culture', name: '文化传承', icon: 'fa-landmark', color: '#F59E0B', description: '非遗、历史、传统工艺' },
  { id: 'lifestyle', name: '生活方式', icon: 'fa-coffee', color: '#10B981', description: '美食、旅行、日常' },
  { id: 'art', name: '艺术创作', icon: 'fa-paint-brush', color: '#EC4899', description: '绘画、摄影、音乐' },
  { id: 'business', name: '商业创业', icon: 'fa-briefcase', color: '#6366F1', description: '创业、投资、职场' },
  { id: 'education', name: '学习教育', icon: 'fa-graduation-cap', color: '#14B8A6', description: '知识分享、技能提升' },
  { id: 'entertainment', name: '娱乐休闲', icon: 'fa-gamepad', color: '#F97316', description: '游戏、影视、动漫' },
];

// 布局类型选项
const LAYOUT_TYPES = [
  { value: 'standard', name: '标准布局', description: '经典三栏布局，信息展示完整', icon: 'fa-columns' },
  { value: 'compact', name: '紧凑布局', description: '适合内容密集的社群', icon: 'fa-th' },
  { value: 'expanded', name: '扩展布局', description: '大图展示，视觉冲击力强', icon: 'fa-expand' },
];

// 可见性选项
const VISIBILITY_OPTIONS = [
  { value: 'public', name: '公开社群', description: '任何人都可以发现和加入', icon: 'fa-globe' },
  { value: 'private', name: '私密社群', description: '可被发现，但需要申请加入', icon: 'fa-lock' },
  { value: 'invite-only', name: '邀请制', description: '仅被邀请的人才能加入', icon: 'fa-envelope' },
];

// 功能模块
const MODULES = [
  { key: 'posts', name: '帖子讨论', description: '发布和讨论内容', icon: 'fa-comments' },
  { key: 'chat', name: '实时聊天', description: '即时消息交流', icon: 'fa-message' },
  { key: 'members', name: '成员管理', description: '查看和管理成员', icon: 'fa-users' },
  { key: 'announcements', name: '社群公告', description: '发布重要通知', icon: 'fa-bullhorn' },
];

// 预设主题色
const PRESET_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', 
  '#10B981', '#14B8A6', '#6366F1', '#F97316',
  '#EF4444', '#84CC16', '#06B6D4', '#8B5A2B'
];

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CommunityFormData) => void;
  isDark: boolean;
}

interface CommunityFormData {
  name: string;
  description: string;
  category: string;
  tags: string[];
  avatar?: string;
  coverImage?: string;
  primaryColor: string;
  layoutType: 'standard' | 'compact' | 'expanded';
  visibility: 'public' | 'private' | 'invite-only';
  enabledModules: {
    posts: boolean;
    chat: boolean;
    members: boolean;
    announcements: boolean;
  };
  guidelines: string[];
}

export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isDark
}) => {
  // 表单状态
  const [formData, setFormData] = useState<CommunityFormData>({
    name: '',
    description: '',
    category: '',
    tags: [],
    avatar: '',
    coverImage: '',
    primaryColor: '#3B82F6',
    layoutType: 'standard',
    visibility: 'public',
    enabledModules: {
      posts: true,
      chat: true,
      members: true,
      announcements: true
    },
    guidelines: []
  });

  // 标签输入
  const [tagInput, setTagInput] = useState('');
  // 版规输入
  const [guidelineInput, setGuidelineInput] = useState('');
  // 当前步骤
  const [activeSection, setActiveSection] = useState('basic');
  // 上传状态
  const [isUploading, setIsUploading] = useState({ avatar: false, cover: false });

  // 更新表单数据
  const updateFormData = useCallback(<K extends keyof CommunityFormData>(
    key: K, 
    value: CommunityFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  // 处理头像上传
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(prev => ({ ...prev, avatar: true }));
    try {
      const url = await uploadImage(file);
      updateFormData('avatar', url);
      toast.success('头像上传成功');
    } catch (error) {
      toast.error('上传头像失败');
    } finally {
      setIsUploading(prev => ({ ...prev, avatar: false }));
    }
  };

  // 处理封面上传
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(prev => ({ ...prev, cover: true }));
    try {
      const url = await uploadImage(file);
      updateFormData('coverImage', url);
      toast.success('封面上传成功');
    } catch (error) {
      toast.error('上传封面失败');
    } finally {
      setIsUploading(prev => ({ ...prev, cover: false }));
    }
  };

  // 添加标签
  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed || formData.tags.includes(trimmed)) return;
    if (formData.tags.length >= 5) {
      toast.error('最多添加5个标签');
      return;
    }
    updateFormData('tags', [...formData.tags, trimmed]);
    setTagInput('');
  };

  // 删除标签
  const handleRemoveTag = (tag: string) => {
    updateFormData('tags', formData.tags.filter(t => t !== tag));
  };

  // 添加版规
  const handleAddGuideline = () => {
    const trimmed = guidelineInput.trim();
    if (!trimmed) return;
    if (formData.guidelines.length >= 10) {
      toast.error('最多添加10条版规');
      return;
    }
    updateFormData('guidelines', [...formData.guidelines, trimmed]);
    setGuidelineInput('');
  };

  // 删除版规
  const handleRemoveGuideline = (index: number) => {
    updateFormData('guidelines', formData.guidelines.filter((_, i) => i !== index));
  };

  // 切换功能模块
  const toggleModule = (module: keyof typeof formData.enabledModules) => {
    updateFormData('enabledModules', {
      ...formData.enabledModules,
      [module]: !formData.enabledModules[module]
    });
  };

  // 提交表单
  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.description.trim() || !formData.category) {
      toast.error('请填写完整的基本信息');
      return;
    }
    onSubmit(formData);
    resetForm();
    onClose();
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      tags: [],
      avatar: '',
      coverImage: '',
      primaryColor: '#3B82F6',
      layoutType: 'standard',
      visibility: 'public',
      enabledModules: {
        posts: true,
        chat: true,
        members: true,
        announcements: true
      },
      guidelines: []
    });
    setTagInput('');
    setGuidelineInput('');
    setActiveSection('basic');
  };

  // 表单完成度
  const completionRate = useMemo(() => {
    let score = 0;
    if (formData.name) score += 20;
    if (formData.description) score += 20;
    if (formData.category) score += 20;
    if (formData.avatar) score += 15;
    if (formData.tags.length > 0) score += 15;
    if (formData.guidelines.length > 0) score += 10;
    return score;
  }, [formData]);

  // 选中的分类
  const selectedCategory = COMMUNITY_CATEGORIES.find(c => c.id === formData.category);

  // 移动端侧边栏状态
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-0 sm:p-4"
      >
        {/* 背景遮罩 */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-black/70' : 'bg-black/40'}`}
          onClick={onClose}
        />

        {/* 主容器 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }}
          className={`relative w-full h-full sm:h-[85vh] sm:max-w-7xl sm:rounded-2xl overflow-hidden shadow-2xl ${
            isDark 
              ? 'bg-gray-900 shadow-black/50' 
              : 'bg-white shadow-gray-300/50'
          }`}
        >
          {/* 头部 */}
          <div className={`flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b ${
            isDark ? 'border-gray-800 bg-gray-900/95' : 'border-gray-100 bg-white/95'
          } backdrop-blur-xl`}>
            <div className="flex items-center gap-3 sm:gap-4">
              {/* 移动端菜单按钮 */}
              <button
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                className={`lg:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isDark 
                    ? 'hover:bg-gray-800 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <i className="fas fa-bars"></i>
              </button>
              <div 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-lg"
                style={{ backgroundColor: formData.primaryColor }}
              >
                <i className="fas fa-plus"></i>
              </div>
              <div>
                <h2 className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  创建新社群
                </h2>
                <p className={`hidden sm:block text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  打造属于你的专属社区空间
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {/* 移动端预览按钮 */}
              <button
                onClick={() => setShowMobilePreview(!showMobilePreview)}
                className={`lg:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  showMobilePreview
                    ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                    : isDark 
                      ? 'hover:bg-gray-800 text-gray-400' 
                      : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <i className="fas fa-eye"></i>
              </button>
              {/* 完成度指示器 */}
              <div className="hidden sm:flex items-center gap-2">
                <div className={`w-24 lg:w-32 h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <motion.div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${completionRate}%`,
                      backgroundColor: formData.primaryColor 
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                  />
                </div>
                <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {completionRate}%
                </span>
              </div>
              <button
                onClick={onClose}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isDark 
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>
          </div>

          {/* 三栏布局 */}
          <div className="flex h-[calc(100vh-57px)] sm:h-[calc(85vh-73px)] relative">
            {/* 移动端遮罩 */}
            {(showMobileSidebar || showMobilePreview) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/20 z-10 lg:hidden"
                onClick={() => {
                  setShowMobileSidebar(false);
                  setShowMobilePreview(false);
                }}
              />
            )}

            {/* 左侧栏 - 导航与分类 */}
            <div className={`absolute lg:relative z-20 w-64 flex-shrink-0 border-r overflow-y-auto transition-transform duration-300 lg:translate-x-0 ${
              showMobileSidebar ? 'translate-x-0' : '-translate-x-full'
            } ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-gray-50'}`}>
              <div className="p-4 space-y-6">
                {/* 步骤导航 */}
                <div>
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    创建步骤
                  </h3>
                  <nav className="space-y-1">
                    {[
                      { id: 'basic', name: '基本信息', icon: 'fa-info-circle' },
                      { id: 'appearance', name: '外观设置', icon: 'fa-palette' },
                      { id: 'features', name: '功能模块', icon: 'fa-cube' },
                      { id: 'guidelines', name: '社群版规', icon: 'fa-shield-alt' },
                    ].map((item, index) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          activeSection === item.id
                            ? isDark 
                              ? 'bg-gray-800 text-white' 
                              : 'bg-white text-gray-900 shadow-sm'
                            : isDark
                              ? 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                          activeSection === item.id
                            ? 'text-white'
                            : isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-500'
                        }`}
                        style={{ 
                          backgroundColor: activeSection === item.id ? formData.primaryColor : undefined 
                        }}
                        >
                          {index + 1}
                        </span>
                        <i className={`fas ${item.icon} w-4`}></i>
                        {item.name}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* 分类选择 */}
                <div>
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    选择分类
                  </h3>
                  <div className="space-y-1">
                    {COMMUNITY_CATEGORIES.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => updateFormData('category', category.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                          formData.category === category.id
                            ? isDark 
                              ? 'bg-gray-800' 
                              : 'bg-white shadow-sm'
                            : isDark
                              ? 'hover:bg-gray-800/50'
                              : 'hover:bg-gray-100'
                        }`}
                      >
                        <div 
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            formData.category === category.id ? 'scale-110' : ''
                          }`}
                          style={{ 
                            backgroundColor: formData.category === category.id 
                              ? category.color 
                              : isDark ? '#374151' : '#E5E7EB',
                            color: formData.category === category.id ? 'white' : isDark ? '#9CA3AF' : '#6B7280'
                          }}
                        >
                          <i className={`fas ${category.icon}`}></i>
                        </div>
                        <div className="text-left flex-1">
                          <div className={`font-medium ${
                            formData.category === category.id
                              ? isDark ? 'text-white' : 'text-gray-900'
                              : isDark ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {category.name}
                          </div>
                        </div>
                        {formData.category === category.id && (
                          <motion.i 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="fas fa-check text-xs"
                            style={{ color: category.color }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 中间栏 - 表单主体 */}
            <div className={`flex-1 overflow-y-auto ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
              <div className="max-w-2xl mx-auto p-6 space-y-8">
                <AnimatePresence mode="wait">
                  {/* 基本信息 */}
                  {activeSection === 'basic' && (
                    <motion.div
                      key="basic"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div>
                        <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          基本信息
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          填写社群的基本资料，让更多人了解你的社群
                        </p>
                      </div>

                      {/* 社群名称 */}
                      <div className="space-y-2">
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          社群名称 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => updateFormData('name', e.target.value)}
                          placeholder="给你的社群起个响亮的名字"
                          maxLength={30}
                          className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none ${
                            isDark 
                              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                              : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                          }`}
                        />
                        <div className={`text-xs text-right ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formData.name.length}/30
                        </div>
                      </div>

                      {/* 社群简介 */}
                      <div className="space-y-2">
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          社群简介 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => updateFormData('description', e.target.value)}
                          placeholder="简要描述社群的主题、宗旨和特色..."
                          rows={4}
                          maxLength={200}
                          className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none resize-none ${
                            isDark 
                              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                              : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                          }`}
                        />
                        <div className={`text-xs text-right ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formData.description.length}/200
                        </div>
                      </div>

                      {/* 标签 */}
                      <div className="space-y-2">
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          标签
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                            placeholder="添加标签，按回车确认"
                            className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all outline-none ${
                              isDark 
                                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                            }`}
                          />
                          <button
                            onClick={handleAddTag}
                            disabled={!tagInput.trim()}
                            className="px-4 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                            style={{ backgroundColor: formData.primaryColor }}
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <AnimatePresence>
                            {formData.tags.map((tag) => (
                              <motion.span
                                key={tag}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                                  isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {tag}
                                <button
                                  onClick={() => handleRemoveTag(tag)}
                                  className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                                >
                                  <i className="fas fa-times text-xs"></i>
                                </button>
                              </motion.span>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* 可见性 */}
                      <div className="space-y-3">
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          可见性设置
                        </label>
                        <div className="grid grid-cols-1 gap-3">
                          {VISIBILITY_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => updateFormData('visibility', option.value as any)}
                              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                                formData.visibility === option.value
                                  ? isDark
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-blue-500 bg-blue-50'
                                  : isDark
                                    ? 'border-gray-700 hover:border-gray-600'
                                    : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                                formData.visibility === option.value
                                  ? 'text-white'
                                  : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                              }`}
                              style={{ 
                                backgroundColor: formData.visibility === option.value 
                                  ? formData.primaryColor 
                                  : undefined 
                              }}
                              >
                                <i className={`fas ${option.icon}`}></i>
                              </div>
                              <div className="flex-1">
                                <div className={`font-semibold ${
                                  formData.visibility === option.value
                                    ? isDark ? 'text-white' : 'text-gray-900'
                                    : isDark ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  {option.name}
                                </div>
                                <div className={`text-sm ${
                                  formData.visibility === option.value
                                    ? isDark ? 'text-gray-400' : 'text-gray-600'
                                    : isDark ? 'text-gray-500' : 'text-gray-500'
                                }`}>
                                  {option.description}
                                </div>
                              </div>
                              {formData.visibility === option.value && (
                                <i className="fas fa-check-circle text-xl" style={{ color: formData.primaryColor }}></i>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* 外观设置 */}
                  {activeSection === 'appearance' && (
                    <motion.div
                      key="appearance"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div>
                        <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          外观设置
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          自定义社群的视觉风格和品牌标识
                        </p>
                      </div>

                      {/* 头像上传 */}
                      <div className="space-y-3">
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          社群头像
                        </label>
                        <div className="flex items-center gap-4">
                          <div 
                            className={`w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all ${
                              isDark ? 'border-gray-700' : 'border-gray-200'
                            }`}
                            style={{ borderColor: formData.avatar ? formData.primaryColor : undefined }}
                          >
                            {formData.avatar ? (
                              <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center ${
                                isDark ? 'bg-gray-800' : 'bg-gray-100'
                              }`}>
                                <i className={`fas fa-camera text-2xl ${isDark ? 'text-gray-600' : 'text-gray-400'}`}></i>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              className="hidden"
                              id="avatar-upload"
                            />
                            <label
                              htmlFor="avatar-upload"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white cursor-pointer transition-all hover:opacity-90"
                              style={{ backgroundColor: formData.primaryColor }}
                            >
                              {isUploading.avatar ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : (
                                <i className="fas fa-upload"></i>
                              )}
                              {formData.avatar ? '更换头像' : '上传头像'}
                            </label>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              建议尺寸 400x400px，支持 JPG、PNG 格式
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 封面上传 */}
                      <div className="space-y-3">
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          社群封面
                        </label>
                        <div 
                          className={`w-full h-40 rounded-2xl overflow-hidden border-2 transition-all ${
                            isDark ? 'border-gray-700' : 'border-gray-200'
                          }`}
                          style={{ borderColor: formData.coverImage ? formData.primaryColor : undefined }}
                        >
                          {formData.coverImage ? (
                            <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full flex flex-col items-center justify-center gap-2 ${
                              isDark ? 'bg-gray-800' : 'bg-gray-100'
                            }`}>
                              <i className={`fas fa-image text-3xl ${isDark ? 'text-gray-600' : 'text-gray-400'}`}></i>
                              <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                点击上传封面图
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverUpload}
                            className="hidden"
                            id="cover-upload"
                          />
                          <label
                            htmlFor="cover-upload"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white cursor-pointer transition-all hover:opacity-90"
                            style={{ backgroundColor: formData.primaryColor }}
                          >
                            {isUploading.cover ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              <i className="fas fa-upload"></i>
                            )}
                            {formData.coverImage ? '更换封面' : '上传封面'}
                          </label>
                          {formData.coverImage && (
                            <button
                              onClick={() => updateFormData('coverImage', '')}
                              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                                isDark 
                                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              移除
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 主题色选择 */}
                      <div className="space-y-3">
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          主题色
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => updateFormData('primaryColor', color)}
                              className={`w-full aspect-square rounded-xl transition-all ${
                                formData.primaryColor === color 
                                  ? 'ring-2 ring-offset-2 scale-110' 
                                  : 'hover:scale-105'
                              }`}
                              style={{ 
                                backgroundColor: color,
                                ringColor: color
                              }}
                            >
                              {formData.primaryColor === color && (
                                <i className="fas fa-check text-white"></i>
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={formData.primaryColor}
                            onChange={(e) => updateFormData('primaryColor', e.target.value)}
                            className="w-12 h-12 rounded-xl cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={formData.primaryColor}
                            onChange={(e) => updateFormData('primaryColor', e.target.value)}
                            className={`flex-1 px-4 py-2 rounded-xl border-2 font-mono text-sm ${
                              isDark 
                                ? 'bg-gray-800 border-gray-700 text-white' 
                                : 'bg-white border-gray-200 text-gray-900'
                            }`}
                          />
                        </div>
                      </div>

                      {/* 布局类型 */}
                      <div className="space-y-3">
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          布局类型
                        </label>
                        <div className="grid grid-cols-1 gap-3">
                          {LAYOUT_TYPES.map((layout) => (
                            <button
                              key={layout.value}
                              onClick={() => updateFormData('layoutType', layout.value as any)}
                              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                                formData.layoutType === layout.value
                                  ? isDark
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-blue-500 bg-blue-50'
                                  : isDark
                                    ? 'border-gray-700 hover:border-gray-600'
                                    : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                                formData.layoutType === layout.value
                                  ? 'text-white'
                                  : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                              }`}
                              style={{ 
                                backgroundColor: formData.layoutType === layout.value 
                                  ? formData.primaryColor 
                                  : undefined 
                              }}
                              >
                                <i className={`fas ${layout.icon}`}></i>
                              </div>
                              <div className="flex-1">
                                <div className={`font-semibold ${
                                  formData.layoutType === layout.value
                                    ? isDark ? 'text-white' : 'text-gray-900'
                                    : isDark ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  {layout.name}
                                </div>
                                <div className={`text-sm ${
                                  formData.layoutType === layout.value
                                    ? isDark ? 'text-gray-400' : 'text-gray-600'
                                    : isDark ? 'text-gray-500' : 'text-gray-500'
                                }`}>
                                  {layout.description}
                                </div>
                              </div>
                              {formData.layoutType === layout.value && (
                                <i className="fas fa-check-circle text-xl" style={{ color: formData.primaryColor }}></i>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* 功能模块 */}
                  {activeSection === 'features' && (
                    <motion.div
                      key="features"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div>
                        <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          功能模块
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          选择社群需要启用的功能模块
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {MODULES.map((module) => (
                          <div
                            key={module.key}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                              formData.enabledModules[module.key as keyof typeof formData.enabledModules]
                                ? isDark
                                  ? 'border-blue-500/50 bg-blue-500/5'
                                  : 'border-blue-200 bg-blue-50/50'
                                : isDark
                                  ? 'border-gray-700'
                                  : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div 
                                className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${
                                  formData.enabledModules[module.key as keyof typeof formData.enabledModules]
                                    ? 'text-white'
                                    : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                                }`}
                                style={{
                                  backgroundColor: formData.enabledModules[module.key as keyof typeof formData.enabledModules]
                                    ? formData.primaryColor
                                    : undefined
                                }}
                              >
                                <i className={`fas ${module.icon}`}></i>
                              </div>
                              <div>
                                <div className={`font-semibold ${
                                  isDark ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {module.name}
                                </div>
                                <div className={`text-sm ${
                                  isDark ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {module.description}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => toggleModule(module.key as keyof typeof formData.enabledModules)}
                              className={`relative w-14 h-8 rounded-full transition-all ${
                                formData.enabledModules[module.key as keyof typeof formData.enabledModules]
                                  ? ''
                                  : isDark ? 'bg-gray-700' : 'bg-gray-300'
                              }`}
                              style={{
                                backgroundColor: formData.enabledModules[module.key as keyof typeof formData.enabledModules]
                                  ? formData.primaryColor
                                  : undefined
                              }}
                            >
                              <motion.div
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                                animate={{
                                  left: formData.enabledModules[module.key as keyof typeof formData.enabledModules] ? '29px' : '3px'
                                }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* 社群版规 */}
                  {activeSection === 'guidelines' && (
                    <motion.div
                      key="guidelines"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div>
                        <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          社群版规
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          制定清晰的版规，维护良好的社区氛围
                        </p>
                      </div>

                      {/* 添加版规 */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={guidelineInput}
                          onChange={(e) => setGuidelineInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGuideline())}
                          placeholder="输入版规内容，例如：禁止发布广告"
                          className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all outline-none ${
                            isDark 
                              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                              : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                          }`}
                        />
                        <button
                          onClick={handleAddGuideline}
                          disabled={!guidelineInput.trim()}
                          className="px-4 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                          style={{ backgroundColor: formData.primaryColor }}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>

                      {/* 版规列表 */}
                      <div className="space-y-2">
                        <AnimatePresence>
                          {formData.guidelines.map((guideline, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className={`flex items-center gap-3 p-4 rounded-xl ${
                                isDark ? 'bg-gray-800' : 'bg-gray-50'
                              }`}
                            >
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                                style={{ backgroundColor: formData.primaryColor }}
                              >
                                {index + 1}
                              </div>
                              <span className={`flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {guideline}
                              </span>
                              <button
                                onClick={() => handleRemoveGuideline(index)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                  isDark 
                                    ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10' 
                                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                }`}
                              >
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {formData.guidelines.length === 0 && (
                          <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <i className="fas fa-clipboard-list text-4xl mb-3 opacity-50"></i>
                            <p>暂无版规，点击上方按钮添加</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 右侧栏 - 预览与帮助 */}
            <div className={`absolute lg:relative right-0 z-20 w-80 flex-shrink-0 border-l overflow-y-auto transition-transform duration-300 lg:translate-x-0 ${
              showMobilePreview ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
            } ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-gray-50'}`}>
              <div className="p-4 space-y-6">
                {/* 实时预览卡片 */}
                <div>
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    实时预览
                  </h3>
                  <div className={`rounded-2xl overflow-hidden shadow-lg ${
                    isDark ? 'bg-gray-800 shadow-black/30' : 'bg-white shadow-gray-200'
                  }`}>
                    {/* 封面预览 */}
                    <div 
                      className="h-24 relative"
                      style={{ 
                        backgroundColor: formData.primaryColor,
                        backgroundImage: formData.coverImage ? `url(${formData.coverImage})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {!formData.coverImage && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                          <i className="fas fa-image text-4xl text-white"></i>
                        </div>
                      )}
                    </div>
                    
                    {/* 头像与信息 */}
                    <div className="px-4 pb-4">
                      <div className="relative -mt-10 mb-3">
                        <div 
                          className="w-20 h-20 rounded-2xl border-4 overflow-hidden shadow-md"
                          style={{ borderColor: isDark ? '#1F2937' : '#FFFFFF' }}
                        >
                          {formData.avatar ? (
                            <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <div 
                              className="w-full h-full flex items-center justify-center"
                              style={{ backgroundColor: formData.primaryColor }}
                            >
                              <span className="text-white text-2xl font-bold">
                                {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <h4 className={`font-bold text-lg mb-1 truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formData.name || '社群名称'}
                      </h4>
                      
                      {selectedCategory && (
                        <div 
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-2"
                          style={{ 
                            backgroundColor: `${selectedCategory.color}20`,
                            color: selectedCategory.color
                          }}
                        >
                          <i className={`fas ${selectedCategory.icon}`}></i>
                          {selectedCategory.name}
                        </div>
                      )}
                      
                      <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formData.description || '社群简介将显示在这里...'}
                      </p>
                      
                      {/* 标签预览 */}
                      {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {formData.tags.slice(0, 3).map((tag) => (
                            <span 
                              key={tag}
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              #{tag}
                            </span>
                          ))}
                          {formData.tags.length > 3 && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                            }`}>
                              +{formData.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* 成员数预览 */}
                      <div className={`flex items-center gap-4 mt-4 pt-4 border-t ${
                        isDark ? 'border-gray-700' : 'border-gray-100'
                      }`}>
                        <div className="text-center">
                          <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>1</div>
                          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>成员</div>
                        </div>
                        <div className="text-center">
                          <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>0</div>
                          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>帖子</div>
                        </div>
                        <div className="flex-1"></div>
                        <button 
                          className="px-4 py-1.5 rounded-full text-sm font-medium text-white"
                          style={{ backgroundColor: formData.primaryColor }}
                        >
                          加入
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 功能模块预览 */}
                <div>
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    已启用功能
                  </h3>
                  <div className="space-y-2">
                    {MODULES.map((module) => {
                      const isEnabled = formData.enabledModules[module.key as keyof typeof formData.enabledModules];
                      return (
                        <div 
                          key={module.key}
                          className={`flex items-center gap-3 p-3 rounded-xl ${
                            isDark 
                              ? isEnabled ? 'bg-gray-800' : 'bg-gray-800/50 opacity-50' 
                              : isEnabled ? 'bg-white' : 'bg-gray-100/50 opacity-50'
                          }`}
                        >
                          <div 
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isEnabled ? 'text-white' : isDark ? 'text-gray-600' : 'text-gray-400'
                            }`}
                            style={{ backgroundColor: isEnabled ? formData.primaryColor : undefined }}
                          >
                            <i className={`fas ${module.icon} text-sm`}></i>
                          </div>
                          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {module.name}
                          </span>
                          {isEnabled && (
                            <i className={`fas fa-check-circle ml-auto text-sm`} style={{ color: formData.primaryColor }}></i>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 帮助提示 */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${formData.primaryColor}20` }}
                    >
                      <i className="fas fa-lightbulb text-blue-500"></i>
                    </div>
                    <div>
                      <h4 className={`font-semibold text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        创建建议
                      </h4>
                      <ul className={`text-xs space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <li>• 选择一个清晰的社群名称</li>
                        <li>• 上传高质量的封面和头像</li>
                        <li>• 制定明确的版规</li>
                        <li>• 选择合适的分类便于发现</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 创建按钮 */}
                <div className="pt-4 border-t border-dashed" style={{ borderColor: isDark ? '#374151' : '#E5E7EB' }}>
                  <button
                    onClick={handleSubmit}
                    disabled={!formData.name.trim() || !formData.description.trim() || !formData.category}
                    className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 flex items-center justify-center gap-2"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    <i className="fas fa-check"></i>
                    创建社群
                  </button>
                  <button
                    onClick={onClose}
                    className={`w-full py-3 mt-2 rounded-xl font-medium transition-all ${
                      isDark 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateCommunityModal;
