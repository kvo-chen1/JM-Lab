import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import uploadService, { UserUpload } from '@/services/uploadService';
import { AuthContext } from '@/contexts/authContext';
import { useCreateStore } from '../../hooks/useCreateStore';

interface UploadPanelProps {
  onSelectUpload?: (upload: UserUpload) => void;
}

const UploadPanel: React.FC<UploadPanelProps> = ({ onSelectUpload }) => {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  const [uploads, setUploads] = useState<UserUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUpload, setSelectedUpload] = useState<UserUpload | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingUpload, setEditingUpload] = useState<UserUpload | null>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedUploads, setSelectedUploads] = useState<Set<string>>(new Set());
  const [showBatchPreview, setShowBatchPreview] = useState(false);

  // 获取 create store 的方法
  const generatedResults = useCreateStore((state) => state.generatedResults);
  const setGeneratedResults = useCreateStore((state) => state.setGeneratedResults);
  const setSelectedResult = useCreateStore((state) => state.setSelectedResult);
  const updateState = useCreateStore((state) => state.updateState);

  // 加载用户上传的作品
  const loadUploads = useCallback(async () => {
    console.log('[UploadPanel] 开始加载上传作品，用户:', user?.id);
    if (!user?.id) {
      console.log('[UploadPanel] 用户未登录，清空作品列表');
      setIsLoading(false);
      setUploads([]);
      return;
    }
    setIsLoading(true);
    try {
      // 传递 user.id 避免 supabase auth session 不同步问题
      console.log('[UploadPanel] 调用 uploadService.getUserUploads，用户ID:', user.id);
      const { data, error } = await uploadService.getUserUploads(user.id);
      if (error) {
        console.error('[UploadPanel] 加载作品失败:', error);
        // 静默处理未登录错误，不显示在控制台
        if (error.message !== '用户未登录') {
          console.error('加载作品失败:', error.message);
        }
        setUploads([]);
      } else {
        console.log('[UploadPanel] 加载作品成功，数量:', data?.length || 0);
        setUploads(data || []);
      }
    } catch (err: any) {
      console.error('[UploadPanel] 加载作品异常:', err);
      setUploads([]);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadUploads();
  }, [loadUploads]);

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查用户是否登录
    if (!user) {
      toast.error('上传失败: 用户未登录');
      return;
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('只支持 JPG、PNG、WebP、GIF 格式的图片');
      return;
    }

    // 验证文件大小 (最大 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('文件大小不能超过 10MB');
      return;
    }

    setIsUploading(true);
    try {
      console.log('[UploadPanel] 开始上传文件:', file.name, '用户ID:', user?.id);
      
      const { data, error } = await uploadService.createUpload({
        file,
        title: file.name
      }, user?.id);

      if (error) {
        console.error('[UploadPanel] 上传失败:', error);
        toast.error('上传失败: ' + error.message);
      } else if (data) {
        console.log('[UploadPanel] 上传成功:', data);
        toast.success('上传成功！');
        setUploads(prev => [data, ...prev]);
      } else {
        console.error('[UploadPanel] 上传返回空数据');
        toast.error('上传失败: 返回数据为空');
      }
    } catch (err: any) {
      console.error('[UploadPanel] 上传过程中出现错误:', err);
      toast.error('上传过程中出现错误: ' + (err.message || '未知错误'));
    } finally {
      setIsUploading(false);
    }
  };

  // 删除作品
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个作品吗？')) return;

    const { success, error } = await uploadService.deleteUpload(id, user?.id);
    if (error) {
      toast.error('删除失败: ' + error.message);
    } else {
      toast.success('删除成功！');
      setUploads(prev => prev.filter(u => u.id !== id));
      if (selectedUpload?.id === id) {
        setSelectedUpload(null);
        setShowDetailModal(false);
      }
    }
  };

  // 更新作品信息
  const handleUpdate = async () => {
    if (!editingUpload) return;

    const { data, error } = await uploadService.updateUpload(editingUpload.id, {
      title: editingUpload.title,
      description: editingUpload.description,
      tags: editingUpload.tags
    }, user?.id);

    if (error) {
      toast.error('更新失败: ' + error.message);
    } else {
      toast.success('更新成功！');
      setUploads(prev => prev.map(u => u.id === data?.id ? data : u));
      setEditingUpload(null);
    }
  };

  // 搜索作品
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadUploads();
      return;
    }

    setIsLoading(true);
    const { data, error } = await uploadService.searchUploads(searchQuery, user?.id);
    if (error) {
      toast.error('搜索失败: ' + error.message);
    } else {
      setUploads(data || []);
    }
    setIsLoading(false);
  };

  // 格式化文件大小
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '未知';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 将上传作品添加到左侧预览
  const handlePreviewInCanvas = (upload: UserUpload) => {
    // 生成新的 ID（避免与现有作品冲突）
    const newId = Date.now();
    
    // 创建新的作品对象
    const newResult = {
      id: newId,
      thumbnail: upload.file_url,
      type: 'image' as const,
      prompt: upload.description || upload.title || '上传的作品',
    };
    
    // 添加到 generatedResults
    const updatedResults = [...generatedResults, newResult];
    setGeneratedResults(updatedResults);
    
    // 选中新添加的作品
    setSelectedResult(newId);
    
    toast.success('作品已添加到左侧预览区，可以进行二创加工了！');
  };

  // 发布作品到广场
  const handlePublish = (upload: UserUpload) => {
    // 先将作品添加到预览区
    handlePreviewInCanvas(upload);

    // 打开发布弹窗
    updateState({ showPublishModal: true });

    toast.success('作品已加载，请填写发布信息');
  };

  // 切换批量管理模式
  const toggleBatchMode = () => {
    setIsBatchMode(!isBatchMode);
    setSelectedUploads(new Set());
  };

  // 切换选中状态
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedUploads);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUploads(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedUploads.size === uploads.length) {
      setSelectedUploads(new Set());
    } else {
      setSelectedUploads(new Set(uploads.map(u => u.id)));
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedUploads.size === 0) {
      toast.error('请先选择要删除的作品');
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedUploads.size} 个作品吗？此操作不可恢复。`)) return;

    let successCount = 0;
    let failCount = 0;

    for (const id of selectedUploads) {
      try {
        const { success } = await uploadService.deleteUpload(id, user?.id);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    // 更新列表
    setUploads(prev => prev.filter(u => !selectedUploads.has(u.id)));
    setSelectedUploads(new Set());

    if (successCount > 0) {
      toast.success(`成功删除 ${successCount} 个作品`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} 个作品删除失败`);
    }
  };

  // 批量预览 - 添加到画布
  const handleBatchPreview = () => {
    if (selectedUploads.size === 0) {
      toast.error('请先选择要预览的作品');
      return;
    }

    const selectedItems = uploads.filter(u => selectedUploads.has(u.id));
    let addedCount = 0;

    selectedItems.forEach((upload, index) => {
      setTimeout(() => {
        handlePreviewInCanvas(upload);
        addedCount++;
        if (addedCount === selectedItems.length) {
          toast.success(`已将 ${selectedItems.length} 个作品添加到预览区`);
          setIsBatchMode(false);
          setSelectedUploads(new Set());
        }
      }, index * 100);
    });
  };

  // 未登录提示
  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`w-24 h-24 rounded-2xl flex items-center justify-center mb-6 ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}
        >
          <i className="fas fa-lock text-4xl text-gray-400"></i>
        </motion.div>
        <h3 className="text-xl font-semibold mb-2">请先登录</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          登录后即可上传和管理您的作品
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.href = '/login'}
          className="px-8 py-2.5 bg-gradient-to-r from-[#C02C38] to-[#D64552] text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-[#C02C38]/20 transition-all"
        >
          去登录
        </motion.button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 头部 */}
      <div className="p-5 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C02C38] to-[#D64552] flex items-center justify-center">
                <i className="fas fa-cloud-upload-alt text-white text-sm"></i>
              </div>
              <span>上传作品</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 ml-10.5">
              管理您上传的设计作品
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* 批量管理按钮 */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleBatchMode}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                isBatchMode
                  ? 'bg-[#C02C38] text-white shadow-lg shadow-[#C02C38]/20'
                  : isDark
                    ? 'bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
              }`}
            >
              <i className={`fas ${isBatchMode ? 'fa-check' : 'fa-tasks'}`}></i>
              {isBatchMode ? '完成' : '批量管理'}
            </motion.button>

            <label className={`cursor-pointer ${isUploading ? 'pointer-events-none' : ''}`}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
              <motion.div
                whileHover={isUploading ? undefined : { scale: 1.02 }}
                whileTap={isUploading ? undefined : { scale: 0.98 }}
                className={`px-4 py-2 bg-gradient-to-r from-[#C02C38] to-[#D64552] text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-[#C02C38]/20 ${isUploading ? 'opacity-70' : ''}`}
              >
                {isUploading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    上传中...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus"></i>
                    上传新作品
                  </>
                )}
              </motion.div>
            </label>
          </div>
        </div>

        {/* 批量操作工具栏 */}
        <AnimatePresence>
          {isBatchMode && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className={`flex items-center justify-between p-3 mb-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/80 border-gray-200'}`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className={`text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                    isDark
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <i className={`fas ${selectedUploads.size === uploads.length ? 'fa-check-square' : 'fa-square'} text-[#C02C38]`}></i>
                  {selectedUploads.size === uploads.length ? '取消全选' : '全选'}
                </button>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  已选择 <span className="font-medium text-[#C02C38]">{selectedUploads.size}</span> 个作品
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBatchPreview}
                  disabled={selectedUploads.size === 0}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                    selectedUploads.size === 0
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:shadow-md'
                  } ${isDark
                    ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  }`}
                >
                  <i className="fas fa-eye"></i>
                  批量预览
                </button>
                <button
                  onClick={handleBatchDelete}
                  disabled={selectedUploads.size === 0}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                    selectedUploads.size === 0
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:shadow-md'
                  } ${isDark
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                >
                  <i className="fas fa-trash"></i>
                  批量删除
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 搜索框 */}
        <div className="relative">
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <i className="fas fa-search text-gray-400 text-sm"></i>
          </div>
          <input
            type="text"
            placeholder="搜索作品..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className={`w-full pl-14 pr-10 py-2.5 rounded-xl text-sm border transition-all ${isDark
              ? 'bg-gray-900 border-gray-800 text-white focus:border-gray-600'
              : 'bg-white border-gray-200 text-gray-900 focus:border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-[#C02C38]/10`}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); loadUploads(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          )}
        </div>
      </div>

      {/* 作品列表 */}
      <div className="flex-1 overflow-y-auto p-5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-800"></div>
              <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-t-[#C02C38] border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            </div>
            <p className="text-sm text-gray-500">加载中...</p>
          </div>
        ) : uploads.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-80 text-center"
          >
            <div className={`w-28 h-28 rounded-2xl flex items-center justify-center mb-6 ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}>
              <i className="fas fa-cloud-upload-alt text-4xl text-gray-400"></i>
            </div>
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">暂无上传的作品</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
              点击右上角"上传新作品"按钮，开始上传您的第一个设计作品
            </p>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2.5 bg-gradient-to-r from-[#C02C38] to-[#D64552] text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-[#C02C38]/20"
              >
                <i className="fas fa-plus"></i>
                立即上传
              </motion.div>
            </label>
          </motion.div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {uploads.map((upload, index) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative rounded-xl overflow-hidden border transition-all duration-300 ${isBatchMode ? 'cursor-pointer' : 'cursor-pointer'} ${isDark
                  ? 'bg-gray-900 border-gray-800 hover:border-gray-700 hover:shadow-lg hover:shadow-black/20'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-200/50'
                } ${selectedUploads.has(upload.id) ? 'ring-2 ring-[#C02C38] ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-900' : ''}`}
                onClick={() => {
                  if (isBatchMode) {
                    toggleSelect(upload.id);
                  } else {
                    setSelectedUpload(upload);
                    setShowDetailModal(true);
                    onSelectUpload?.(upload);
                  }
                }}
              >
                {/* 批量选择框 */}
                {isBatchMode && (
                  <div className="absolute top-3 left-3 z-10">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      selectedUploads.has(upload.id)
                        ? 'bg-[#C02C38] border-[#C02C38] shadow-md shadow-[#C02C38]/30'
                        : isDark ? 'border-gray-600 bg-gray-800/90' : 'border-gray-400 bg-white/90'
                    }`}>
                      {selectedUploads.has(upload.id) && (
                        <i className="fas fa-check text-white text-xs"></i>
                      )}
                    </div>
                  </div>
                )}

                {/* 图片预览 */}
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={upload.thumbnail_url || upload.file_url}
                    alt={upload.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image';
                    }}
                  />
                  {/* 悬停遮罩 - 仅在非批量模式下显示 */}
                  {!isBatchMode && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-end pb-4 gap-2">
                      {/* 主要操作按钮 */}
                      <div className="flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewInCanvas(upload);
                          }}
                          className="px-3 py-1.5 bg-white rounded-lg text-gray-900 text-xs font-medium hover:bg-gray-100 flex items-center gap-1.5 shadow-lg"
                          title="在左侧预览区打开，进行二创加工"
                        >
                          <i className="fas fa-eye text-xs"></i>
                          预览
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePublish(upload);
                          }}
                          className="px-3 py-1.5 bg-[#C02C38] rounded-lg text-white text-xs font-medium hover:bg-[#A0232F] flex items-center gap-1.5 shadow-lg shadow-[#C02C38]/30"
                          title="发布到广场"
                        >
                          <i className="fas fa-globe text-xs"></i>
                          发布
                        </button>
                      </div>
                      {/* 次要操作按钮 */}
                      <div className="flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingUpload(upload);
                          }}
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                          title="编辑信息"
                        >
                          <i className="fas fa-edit text-xs"></i>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(upload.id);
                          }}
                          className="p-2 bg-red-500/80 backdrop-blur-sm rounded-lg text-white hover:bg-red-500 transition-colors"
                          title="删除"
                        >
                          <i className="fas fa-trash text-xs"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 信息 */}
                <div className="p-3">
                  <h4 className="font-medium text-sm truncate text-gray-800 dark:text-gray-200">{upload.title}</h4>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(upload.file_size)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(upload.created_at)}
                    </p>
                  </div>
                  {upload.tags && upload.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {upload.tags.slice(0, 2).map((tag, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-[#C02C38]/10 text-[#C02C38] font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                      {upload.tags.length > 2 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                          +{upload.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 编辑弹窗 */}
      <AnimatePresence>
        {editingUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
            onClick={() => setEditingUpload(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C02C38] to-[#D64552] flex items-center justify-center">
                  <i className="fas fa-edit text-white"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">编辑作品信息</h3>
                  <p className="text-xs text-gray-500">修改作品的标题、描述和标签</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">标题</label>
                  <input
                    type="text"
                    value={editingUpload.title || ''}
                    onChange={(e) => setEditingUpload({ ...editingUpload, title: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl border transition-all ${isDark
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-gray-600'
                      : 'bg-gray-50 border-gray-200 focus:border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-[#C02C38]/10`}
                    placeholder="输入作品标题"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">描述</label>
                  <textarea
                    value={editingUpload.description || ''}
                    onChange={(e) => setEditingUpload({ ...editingUpload, description: e.target.value })}
                    rows={3}
                    className={`w-full px-4 py-2.5 rounded-xl border transition-all resize-none ${isDark
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-gray-600'
                      : 'bg-gray-50 border-gray-200 focus:border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-[#C02C38]/10`}
                    placeholder="输入作品描述"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">标签（用逗号分隔）</label>
                  <input
                    type="text"
                    value={editingUpload.tags?.join(', ') || ''}
                    onChange={(e) => setEditingUpload({
                      ...editingUpload,
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    })}
                    placeholder="例如: 国潮, 海报, 设计"
                    className={`w-full px-4 py-2.5 rounded-xl border transition-all ${isDark
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-gray-600'
                      : 'bg-gray-50 border-gray-200 focus:border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-[#C02C38]/10`}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingUpload(null)}
                  className={`flex-1 py-2.5 rounded-xl border font-medium transition-all ${isDark
                    ? 'border-gray-700 hover:bg-gray-800 text-gray-300'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  取消
                </button>
                <button
                  onClick={handleUpdate}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#C02C38] to-[#D64552] text-white font-medium hover:shadow-lg hover:shadow-[#C02C38]/20 transition-all"
                >
                  保存
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadPanel;
