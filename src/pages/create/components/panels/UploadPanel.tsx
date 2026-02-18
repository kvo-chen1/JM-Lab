import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import uploadService, { UserUpload } from '@/services/uploadService';
import { uploadImage } from '@/services/imageService';
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

  // 未登录提示
  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <i className="fas fa-lock text-3xl text-gray-400"></i>
        </div>
        <h3 className="text-lg font-semibold mb-2">请先登录</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          登录后即可上传和管理您的作品
        </p>
        <button
          onClick={() => window.location.href = '/login'}
          className="px-6 py-2 bg-[#C02C38] text-white rounded-lg text-sm font-medium hover:bg-[#A0232F] transition-colors"
        >
          去登录
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <i className="fas fa-cloud-upload-alt text-[#C02C38]"></i>
              上传作品
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              管理您上传的设计作品
            </p>
          </div>
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
              className={`px-4 py-2 bg-[#C02C38] text-white rounded-lg text-sm font-medium flex items-center gap-2 ${isUploading ? 'opacity-50' : ''}`}
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

        {/* 搜索框 */}
        <div className="relative">
          <input
            type="text"
            placeholder="搜索作品..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm border ${isDark
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-200 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-[#C02C38]/30`}
          />
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); loadUploads(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* 作品列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <i className="fas fa-spinner fa-spin text-2xl text-[#C02C38]"></i>
          </div>
        ) : uploads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <i className="fas fa-image text-3xl text-gray-400"></i>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-2">暂无上传的作品</p>
            <p className="text-xs text-gray-400">点击上方按钮上传您的第一个作品</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {uploads.map((upload, index) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative rounded-lg overflow-hidden border cursor-pointer ${isDark
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  setSelectedUpload(upload);
                  setShowDetailModal(true);
                  onSelectUpload?.(upload);
                }}
              >
                {/* 图片预览 */}
                <div className="aspect-square relative">
                  <img
                    src={upload.thumbnail_url || upload.file_url}
                    alt={upload.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image';
                    }}
                  />
                  {/* 悬停遮罩 */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                    {/* 主要操作按钮 */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewInCanvas(upload);
                        }}
                        className="px-2 py-1.5 bg-[#C02C38] rounded text-white text-[10px] font-medium hover:bg-[#A0232F] flex items-center gap-1"
                        title="在左侧预览区打开，进行二创加工"
                      >
                        <i className="fas fa-eye text-[10px]"></i>
                        预览
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePublish(upload);
                        }}
                        className="px-2 py-1.5 bg-indigo-600 rounded text-white text-[10px] font-medium hover:bg-indigo-700 flex items-center gap-1"
                        title="发布到广场"
                      >
                        <i className="fas fa-globe text-[10px]"></i>
                        发布
                      </button>
                    </div>
                    {/* 次要操作按钮 */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingUpload(upload);
                        }}
                        className="p-1.5 bg-white/90 rounded-full text-gray-800 hover:bg-white"
                        title="编辑信息"
                      >
                        <i className="fas fa-edit text-[10px]"></i>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(upload.id);
                        }}
                        className="p-1.5 bg-red-500/90 rounded-full text-white hover:bg-red-500"
                        title="删除"
                      >
                        <i className="fas fa-trash text-[10px]"></i>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 信息 */}
                <div className="p-2">
                  <h4 className="font-medium text-xs truncate">{upload.title}</h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatFileSize(upload.file_size)} · {formatDate(upload.created_at)}
                  </p>
                  {upload.tags && upload.tags.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {upload.tags.slice(0, 2).map((tag, i) => (
                        <span
                          key={i}
                          className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#C02C38]/10 text-[#C02C38]"
                        >
                          {tag}
                        </span>
                      ))}
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
            onClick={() => setEditingUpload(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">编辑作品信息</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">标题</label>
                  <input
                    type="text"
                    value={editingUpload.title || ''}
                    onChange={(e) => setEditingUpload({ ...editingUpload, title: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">描述</label>
                  <textarea
                    value={editingUpload.description || ''}
                    onChange={(e) => setEditingUpload({ ...editingUpload, description: e.target.value })}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">标签（用逗号分隔）</label>
                  <input
                    type="text"
                    value={editingUpload.tags?.join(', ') || ''}
                    onChange={(e) => setEditingUpload({
                      ...editingUpload,
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    })}
                    placeholder="例如: 国潮, 海报, 设计"
                    className={`w-full px-3 py-2 rounded-lg border ${isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-200'
                    }`}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingUpload(null)}
                  className={`flex-1 py-2 rounded-lg border ${isDark
                    ? 'border-gray-600 hover:bg-gray-700'
                    : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  取消
                </button>
                <button
                  onClick={handleUpdate}
                  className="flex-1 py-2 rounded-lg bg-[#C02C38] text-white hover:bg-[#A0232F]"
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
