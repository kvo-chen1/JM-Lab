import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string; 
    description: string; 
    tags: string[];
    bookmarks: Array<{
      id: string;
      name: string;
      icon: string;
    }>;
    theme?: {
      primaryColor?: string;
      secondaryColor?: string;
    };
    layoutType?: 'standard' | 'compact' | 'expanded';
    enabledModules?: {
      posts?: boolean;
      chat?: boolean;
      members?: boolean;
      announcements?: boolean;
    };
    visibility?: 'public' | 'private' | 'invite-only';
    avatar?: string;
    coverImage?: string;
    guidelines?: string[];
  }) => void;
  isDark: boolean;
}

export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isDark
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  // 新增自定义风格设置状态
  const [primaryColor, setPrimaryColor] = useState('#3B82F6'); // 默认蓝色
  const [layoutType, setLayoutType] = useState<'standard' | 'compact' | 'expanded'>('standard');
  // 功能模块开关状态
  const [enabledModules, setEnabledModules] = useState({
    posts: true,
    chat: true,
    members: true,
    announcements: true
  });
  // 可见性设置
  const [visibility, setVisibility] = useState<'public' | 'private' | 'invite-only'>('public');
  // 媒体上传状态
  const [avatar, setAvatar] = useState<string>('');
  const [coverImage, setCoverImage] = useState<string>('');
  // 版规状态
  const [guidelines, setGuidelines] = useState<string[]>([]);
  const [guidelineInput, setGuidelineInput] = useState('');
  // 书签状态管理
  const [bookmarks, setBookmarks] = useState<Array<{
    id: string;
    name: string;
    icon: string;
  }>>([]);
  const [newBookmarkName, setNewBookmarkName] = useState('');
  const [newBookmarkIcon, setNewBookmarkIcon] = useState('fas fa-book'); // 默认图标

  // 添加新书签
  const addBookmark = () => {
    if (!newBookmarkName.trim()) return;
    
    const newBookmark = {
      id: `bookmark-${Date.now()}`,
      name: newBookmarkName.trim(),
      icon: newBookmarkIcon
    };
    
    setBookmarks([...bookmarks, newBookmark]);
    setNewBookmarkName('');
    setNewBookmarkIcon('fas fa-book');
  };
  
  // 删除书签
  const removeBookmark = (id: string) => {
    setBookmarks(bookmarks.filter(bookmark => bookmark.id !== id));
  };
  
  // 添加版规
  const addGuideline = () => {
    if (!guidelineInput.trim()) return;
    setGuidelines([...guidelines, guidelineInput.trim()]);
    setGuidelineInput('');
  };
  
  // 删除版规
  const removeGuideline = (index: number) => {
    setGuidelines(guidelines.filter((_, i) => i !== index));
  };
  
  // 处理头像上传
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 这里应该实现文件上传逻辑，暂时使用模拟URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // 处理封面图上传
  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 这里应该实现文件上传逻辑，暂时使用模拟URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = () => {
    if (!name.trim() || !description.trim()) return;
    const tags = tagsInput.split(/[,，\s]+/).filter(Boolean);
    onSubmit({
      name, 
      description, 
      tags,
      bookmarks,
      theme: {
        primaryColor,
        secondaryColor: primaryColor
      },
      layoutType,
      enabledModules,
      visibility,
      avatar,
      coverImage,
      guidelines
    });
    onClose();
    // 重置表单
    setName('');
    setDescription('');
    setTagsInput('');
    setPrimaryColor('#3B82F6');
    setLayoutType('standard');
    setEnabledModules({
      posts: true,
      chat: true,
      members: true,
      announcements: true
    });
    setBookmarks([]);
    setNewBookmarkName('');
    setNewBookmarkIcon('fas fa-book');
    setVisibility('public');
    setAvatar('');
    setCoverImage('');
    setGuidelines([]);
    setGuidelineInput('');
  };

  // 切换功能模块开关
  const toggleModule = (module: keyof typeof enabledModules) => {
    setEnabledModules(prev => ({
      ...prev,
      [module]: !prev[module]
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="创建新社群"
      className={isDark ? 'dark' : ''}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !description.trim()}>
            创建
          </Button>
        </>
      }
      maxWidth="lg" // 增加模态框宽度以容纳更多内容
    >
      <div className="space-y-6">
        {/* 基本信息 */}
        <div>
          <h3 className={`text-md font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>基本信息</h3>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                社群名称
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                placeholder="例如：赛博朋克设计交流"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                简介
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                placeholder="简要描述社群的主题和宗旨..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                标签 (用逗号或空格分隔)
              </label>
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                placeholder="例如：设计, 赛博朋克, 3D"
              />
            </div>

            {/* 媒体上传 */}
            <div className="space-y-4">
              {/* 头像上传 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  社群头像
                </label>
                <div className="flex items-center gap-4">
                  <div className={`w-20 h-20 rounded-full overflow-hidden border-2 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    {avatar ? (
                      <img 
                        src={avatar} 
                        alt="社群头像" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        <i className="fas fa-camera text-2xl ${isDark ? 'text-gray-500' : 'text-gray-400'}"></i>
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className={`px-4 py-2 rounded-lg cursor-pointer text-sm ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                    >
                      {avatar ? '更换头像' : '上传头像'}
                    </label>
                  </div>
                </div>
              </div>

              {/* 封面图上传 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  社群封面图
                </label>
                <div className="flex flex-col gap-2">
                  <div className={`w-full h-32 rounded-lg overflow-hidden border-2 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    {coverImage ? (
                      <img 
                        src={coverImage} 
                        alt="社群封面" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        <i className="fas fa-image text-3xl ${isDark ? 'text-gray-500' : 'text-gray-400'}"></i>
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageUpload}
                      className="hidden"
                      id="cover-upload"
                    />
                    <label
                      htmlFor="cover-upload"
                      className={`px-4 py-2 rounded-lg cursor-pointer text-sm ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                    >
                      {coverImage ? '更换封面图' : '上传封面图'}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 可见性设置 */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                可见性
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'public', label: '公开', description: '任何人都可以查看和加入' },
                  { value: 'private', label: '私密', description: '任何人都可以查看，但需要申请加入' },
                  { value: 'invite-only', label: '仅邀请', description: '只有被邀请的人才能加入' }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVisibility(option.value as any)}
                    className={`p-3 rounded-lg border transition-all text-left ${visibility === option.value ? 
                      `${isDark ? 'bg-blue-700 border-blue-600 text-white' : 'bg-blue-100 border-blue-500 text-blue-700'}` : 
                      `${isDark ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`
                    }`}
                  >
                    <div className="font-medium mb-1">{option.label}</div>
                    <div className={`text-xs opacity-80 ${visibility === option.value ? 'opacity-100' : ''}`}>{option.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 版规设置 */}
        <div>
          <h3 className={`text-md font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>社群版规</h3>
          
          <div className="space-y-4">
            {/* 添加版规 */}
            <div className="flex items-center gap-2">
              <input
                value={guidelineInput}
                onChange={(e) => setGuidelineInput(e.target.value)}
                placeholder="添加一条版规"
                className={`flex-1 px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
              <button
                onClick={addGuideline}
                className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}
              >
                添加
              </button>
            </div>
            
            {/* 已添加的版规列表 */}
            <div className="space-y-2">
              {guidelines.length === 0 ? (
                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  暂无版规，点击上方按钮添加
                </div>
              ) : (
                guidelines.map((guideline, index) => (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm font-medium">{index + 1}.</span>
                      <span className="text-sm flex-1">{guideline}</span>
                    </div>
                    <button
                      onClick={() => removeGuideline(index)}
                      className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white'}`}
                    >
                      删除
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 自定义风格设置 */}
        <div>
          <h3 className={`text-md font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>自定义风格</h3>
          
          <div className="space-y-4">
            {/* 主题色选择 */}
            <div className="flex items-center gap-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} w-24`}>
                主题色
              </label>
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-full cursor-pointer border-2 border-gray-300"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className={`px-3 py-1 rounded border focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} w-32`}
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            {/* 布局类型选择 */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                布局类型
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'standard', label: '标准布局' },
                  { value: 'compact', label: '紧凑布局' },
                  { value: 'expanded', label: '扩展布局' }
                ].map((layout) => (
                  <button
                    key={layout.value}
                    type="button"
                    onClick={() => setLayoutType(layout.value as any)}
                    className={`px-4 py-2 rounded-lg border transition-all ${layoutType === layout.value ? 
                      `${isDark ? 'bg-blue-700 border-blue-600 text-white' : 'bg-blue-100 border-blue-500 text-blue-700'}` : 
                      `${isDark ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`
                    }`}
                  >
                    {layout.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 功能模块设置 */}
        <div>
          <h3 className={`text-md font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>功能模块</h3>
          
          <div className="space-y-3">
            {[
              { key: 'posts', label: '帖子功能' },
              { key: 'chat', label: '聊天功能' },
              { key: 'members', label: '成员列表' },
              { key: 'announcements', label: '社群公告' }
            ].map((module) => (
              <div key={module.key} className="flex items-center justify-between">
                <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {module.label}
                </label>
                <button
                  type="button"
                  onClick={() => toggleModule(module.key as keyof typeof enabledModules)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabledModules[module.key as keyof typeof enabledModules] ? 
                    `${isDark ? 'bg-blue-600' : 'bg-blue-500'}` : 
                    `${isDark ? 'bg-gray-700' : 'bg-gray-300'}`
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabledModules[module.key as keyof typeof enabledModules] ? 'translate-x-6' : 'translate-x-1'}`}></span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 社区书签设置 */}
        <div>
          <h3 className={`text-md font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>社区书签</h3>
          
          <div className="space-y-4">
            {/* 添加新书签 */}
            <div className="flex items-center gap-2">
              <input
                value={newBookmarkName}
                onChange={(e) => setNewBookmarkName(e.target.value)}
                placeholder="书签名称"
                className={`flex-1 px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
              <select
                value={newBookmarkIcon}
                onChange={(e) => setNewBookmarkIcon(e.target.value)}
                className={`px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="fas fa-book">📚 书</option>
                <option value="fas fa-layer-group">📁 分类</option>
                <option value="fas fa-users">👥 用户</option>
                <option value="fas fa-discord">💬 Discord</option>
                <option value="fas fa-globe">🌐 网站</option>
                <option value="fas fa-wikipedia-w">📖 维基</option>
                <option value="fas fa-cog">⚙️ 设置</option>
                <option value="fas fa-shield-alt">🛡️ 规则</option>
              </select>
              <button
                onClick={addBookmark}
                className={`px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}
              >
                添加
              </button>
            </div>
            
            {/* 已添加的书签列表 */}
            <div className="space-y-2">
              {bookmarks.length === 0 ? (
                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  暂无书签，点击上方按钮添加
                </div>
              ) : (
                bookmarks.map((bookmark) => (
                  <div key={bookmark.id} className={`flex items-center justify-between p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex items-center gap-2">
                      <i className={bookmark.icon}></i>
                      <span className="text-sm">{bookmark.name}</span>
                    </div>
                    <button
                      onClick={() => removeBookmark(bookmark.id)}
                      className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white'}`}
                    >
                      删除
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
