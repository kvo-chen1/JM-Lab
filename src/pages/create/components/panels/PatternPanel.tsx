import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import patternService, { UserPattern } from '@/services/patternService';
import { TRADITIONAL_PATTERNS, TraditionalPattern } from '@/constants/creativeData';
import { AuthContext } from '@/contexts/authContext';

interface PatternPanelProps {
  onSelectPattern?: (pattern: TraditionalPattern | UserPattern) => void;
}

const PatternPanel: React.FC<PatternPanelProps> = ({ onSelectPattern }) => {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<'traditional' | 'custom'>('traditional');
  const [userPatterns, setUserPatterns] = useState<UserPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<TraditionalPattern | UserPattern | null>(null);

  // 加载用户收藏的纹样
  const loadUserPatterns = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data, error } = await patternService.getUserPatterns();
    if (error) {
      console.error('加载纹样失败:', error.message);
    } else {
      setUserPatterns(data || []);
      // 更新收藏状态
      const favIds = (data || [])
        .filter(p => p.pattern_id && !p.is_custom)
        .map(p => p.pattern_id!);
      setFavorites(favIds);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadUserPatterns();
  }, [loadUserPatterns]);

  // 切换收藏状态
  const toggleFavorite = async (patternId: number) => {
    const { isFavorited, error } = await patternService.togglePatternFavorite(patternId);
    if (error) {
      toast.error(error.message);
    } else {
      if (isFavorited) {
        setFavorites(prev => [...prev, patternId]);
        toast.success('已添加到收藏');
      } else {
        setFavorites(prev => prev.filter(id => id !== patternId));
        toast.success('已取消收藏');
      }
      // 刷新用户纹样列表
      loadUserPatterns();
    }
  };

  // 上传自定义纹样
  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('只支持 JPG、PNG、WebP 格式的图片');
      return;
    }

    setIsUploading(true);
    const { data, error } = await patternService.addCustomPattern(file, file.name, '自定义纹样');
    if (error) {
      toast.error('上传失败: ' + error.message);
    } else {
      toast.success('上传成功！');
      setUserPatterns(prev => [data!, ...prev]);
      setActiveTab('custom');
    }
    setIsUploading(false);
  };

  // 删除自定义纹样
  const handleDeleteCustom = async (id: string) => {
    if (!confirm('确定要删除这个纹样吗？')) return;

    const { success, error } = await patternService.deletePattern(id);
    if (error) {
      toast.error('删除失败: ' + error.message);
    } else {
      toast.success('删除成功！');
      setUserPatterns(prev => prev.filter(p => p.id !== id));
    }
  };

  // 获取传统纹样的收藏状态
  const isFavorited = (patternId: number) => favorites.includes(patternId);

  // 未登录提示 - 只在"我的纹样"标签显示
  if (!user && activeTab === 'custom') {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
            <i className="fas fa-th text-[#C02C38]"></i>
            纹样嵌入
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            选择传统纹样或上传自定义纹样
          </p>
        </div>

        {/* 标签切换 */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('traditional')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'traditional'
                ? 'text-[#C02C38] border-b-2 border-[#C02C38]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            传统纹样
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'custom'
                ? 'text-[#C02C38] border-b-2 border-[#C02C38]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            我的纹样
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <i className="fas fa-lock text-3xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-semibold mb-2">请先登录</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            登录后即可收藏和上传自定义纹样
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-2 bg-[#C02C38] text-white rounded-lg text-sm font-medium hover:bg-[#A0232F] transition-colors"
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
          <i className="fas fa-th text-[#C02C38]"></i>
          纹样嵌入
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          选择传统纹样或上传自定义纹样
        </p>
      </div>

      {/* 标签切换 */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('traditional')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'traditional'
              ? 'text-[#C02C38] border-b-2 border-[#C02C38]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          传统纹样
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'custom'
              ? 'text-[#C02C38] border-b-2 border-[#C02C38]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          我的纹样
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'traditional' ? (
          <div className="grid grid-cols-2 gap-3">
            {TRADITIONAL_PATTERNS.map((pattern, index) => (
              <motion.div
                key={pattern.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative rounded-xl overflow-hidden border cursor-pointer ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  setSelectedPattern(pattern);
                  onSelectPattern?.(pattern);
                }}
              >
                <div className="aspect-square relative">
                  <img
                    src={pattern.thumbnail}
                    alt={pattern.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://via.placeholder.com/300?text=Pattern';
                    }}
                  />
                  {/* 收藏按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(pattern.id);
                    }}
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isFavorited(pattern.id)
                        ? 'bg-yellow-400 text-white'
                        : 'bg-white/80 text-gray-600 hover:bg-white'
                    }`}
                  >
                    <i
                      className={`fas ${
                        isFavorited(pattern.id) ? 'fa-star' : 'fa-star-o'
                      }`}
                    ></i>
                  </button>
                </div>
                <div className="p-3">
                  <h4 className="font-medium text-sm">{pattern.name}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {pattern.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div>
            {/* 上传按钮 */}
            <label className="block mb-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleCustomUpload}
                className="hidden"
                disabled={isUploading}
              />
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer ${
                  isDark
                    ? 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                }`}
              >
                {isUploading ? (
                  <>
                    <i className="fas fa-spinner fa-spin text-2xl text-[#C02C38] mb-2"></i>
                    <span className="text-sm text-gray-500">上传中...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-cloud-upload-alt text-2xl text-gray-400 mb-2"></i>
                    <span className="text-sm text-gray-500">上传自定义纹样</span>
                  </>
                )}
              </motion.div>
            </label>

            {/* 自定义纹样列表 */}
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <i className="fas fa-spinner fa-spin text-xl text-[#C02C38]"></i>
              </div>
            ) : userPatterns.filter((p) => p.is_custom).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  暂无自定义纹样
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  上传您的第一个自定义纹样
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {userPatterns
                  .filter((p) => p.is_custom)
                  .map((pattern, index) => (
                    <motion.div
                      key={pattern.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group relative rounded-xl overflow-hidden border ${
                        isDark
                          ? 'bg-gray-800 border-gray-700'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="aspect-square relative">
                        <img
                          src={pattern.custom_pattern_url}
                          alt={pattern.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://via.placeholder.com/300?text=Pattern';
                          }}
                        />
                        {/* 删除按钮 */}
                        <button
                          onClick={() => handleDeleteCustom(pattern.id)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <i className="fas fa-trash text-xs"></i>
                        </button>
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-sm truncate">
                          {pattern.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {pattern.category}
                        </p>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}

            {/* 收藏的纹样 */}
            {userPatterns.filter((p) => !p.is_custom).length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">收藏的传统纹样</h4>
                <div className="grid grid-cols-2 gap-3">
                  {userPatterns
                    .filter((p) => !p.is_custom)
                    .map((pattern, index) => (
                      <motion.div
                        key={pattern.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`rounded-xl overflow-hidden border ${
                          isDark
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="p-3">
                          <h4 className="font-medium text-sm">{pattern.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {pattern.category}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatternPanel;
