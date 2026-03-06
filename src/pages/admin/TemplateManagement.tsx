import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { Upload, X, Plus, Search, Edit2, Trash2, Eye, Image as ImageIcon, Tag, Save, AlertCircle, Layout, Star, Copy } from 'lucide-react';
import templateService, { Template, TEMPLATE_CATEGORIES } from '@/services/templateService';
import { uploadImage } from '@/services/storageServiceNew';

// 模板分类配置
const CATEGORY_CONFIG: Record<string, { name: string; color: string; bgColor: string }> = {
  '国潮设计': { name: '国潮设计', color: '#DC2626', bgColor: 'rgba(220, 38, 38, 0.1)' },
  '天津特色': { name: '天津特色', color: '#C02C38', bgColor: 'rgba(192, 44, 56, 0.1)' },
  '节日主题': { name: '节日主题', color: '#EA580C', bgColor: 'rgba(234, 88, 12, 0.1)' },
  '品牌包装': { name: '品牌包装', color: '#7C3AED', bgColor: 'rgba(124, 58, 237, 0.1)' },
  '插画设计': { name: '插画设计', color: '#0891B2', bgColor: 'rgba(8, 145, 178, 0.1)' },
  'IP设计': { name: 'IP设计', color: '#DB2777', bgColor: 'rgba(219, 39, 119, 0.1)' },
  '数字艺术': { name: '数字艺术', color: '#4F46E5', bgColor: 'rgba(79, 70, 229, 0.1)' },
  '其他': { name: '其他', color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.1)' },
};

// 适用场景选项
const USE_CASE_OPTIONS = [
  '包装设计', '海报设计', '文创产品', '品牌推广', 
  '社交媒体', 'IP设计', '插画创作', '节日宣传',
  '产品包装', '礼盒设计', '绘本', '动画角色',
  '游戏角色', '活动宣传'
];

// 模型选项
const MODEL_OPTIONS = [
  { value: 'doubao-pro-32k', label: '豆包 Pro' },
  { value: 'kimi', label: 'Kimi' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'gpt-4', label: 'GPT-4' },
];

export default function TemplateManagement() {
  const { isDark } = useTheme();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 10;

  // 表单状态
  const [formData, setFormData] = useState<Partial<Template>>({
    name: '',
    description: '',
    content: '',
    category: '',
    tags: [],
    isOfficial: true,
    isFeatured: false,
    version: '1.0.0',
    useCases: [],
    language: 'zh-CN',
    author: '官方模板',
    config: {
      model: 'doubao-pro-32k',
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 2000,
      style: 'traditional'
    }
  });
  const [newTag, setNewTag] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 获取模板列表
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      // 从本地服务获取模板数据
      let allTemplates = templateService.getAllTemplates();
      
      // 应用筛选
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        allTemplates = allTemplates.filter(t => 
          t.name.toLowerCase().includes(lowerQuery) ||
          t.description.toLowerCase().includes(lowerQuery) ||
          t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      }

      if (categoryFilter !== 'all') {
        allTemplates = allTemplates.filter(t => t.category === categoryFilter);
      }

      if (typeFilter !== 'all') {
        if (typeFilter === 'official') {
          allTemplates = allTemplates.filter(t => t.isOfficial);
        } else if (typeFilter === 'featured') {
          allTemplates = allTemplates.filter(t => t.isFeatured);
        } else if (typeFilter === 'user') {
          allTemplates = allTemplates.filter(t => !t.isOfficial);
        }
      }

      // 分页
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      const paginatedTemplates = allTemplates.slice(start, end);

      setTemplates(paginatedTemplates);
      setTotalCount(allTemplates.length);
    } catch (error) {
      console.error('获取模板列表失败:', error);
      toast.error('获取模板列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchTemplates();
  }, [currentPage, categoryFilter, typeFilter, searchQuery]);

  // 验证表单
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      errors.name = '请输入模板名称';
    }
    if (!formData.category) {
      errors.category = '请选择分类';
    }
    if (!formData.description?.trim()) {
      errors.description = '请输入模板描述';
    }
    if (!formData.content?.trim()) {
      errors.content = '请输入模板内容';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 保存模板
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('请完善表单信息');
      return;
    }

    setIsSubmitting(true);
    try {
      const templateData: Omit<Template, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name!,
        description: formData.description!,
        content: formData.content!,
        category: formData.category!,
        tags: formData.tags || [],
        isOfficial: formData.isOfficial ?? true,
        isFeatured: formData.isFeatured ?? false,
        version: formData.version || '1.0.0',
        useCases: formData.useCases || [],
        language: formData.language || 'zh-CN',
        author: formData.author || '官方模板',
        usageCount: 0,
        thumbnail: formData.thumbnail,
        config: formData.config || {
          model: 'doubao-pro-32k',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'traditional'
        }
      };

      if (modalMode === 'create') {
        templateService.createTemplate(templateData);
        toast.success('模板创建成功');
      } else if (modalMode === 'edit' && selectedTemplate) {
        templateService.updateTemplate(selectedTemplate.id, templateData);
        toast.success('模板更新成功');
      }

      setShowModal(false);
      fetchTemplates();
    } catch (error) {
      console.error('保存模板失败:', error);
      toast.error('保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 删除模板
  const handleDelete = async (template: Template) => {
    if (!confirm(`确定要删除"${template.name}"吗？此操作不可恢复。`)) {
      return;
    }

    try {
      const success = templateService.deleteTemplate(template.id);
      if (success) {
        toast.success('模板已删除');
        fetchTemplates();
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      console.error('删除模板失败:', error);
      toast.error('删除失败，请重试');
    }
  };

  // 复制模板
  const handleDuplicate = (template: Template) => {
    setFormData({
      ...template,
      name: `${template.name} (副本)`,
      isOfficial: true,
      usageCount: 0,
    });
    setFormErrors({});
    setModalMode('create');
    setShowModal(true);
    toast.info('已加载模板内容，请修改后保存');
  };

  // 上传图片
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('请上传 JPG、PNG、GIF 或 WebP 格式的图片');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      // 使用新的存储服务上传图片
      const publicUrl = await uploadImage(file, 'templates');

      setFormData(prev => ({ ...prev, thumbnail: publicUrl }));
      toast.success('图片上传成功');
    } catch (error) {
      console.error('图片上传失败:', error);
      toast.error('图片上传失败，请重试');
    } finally {
      setUploadingImage(false);
    }
  };

  // 添加标签
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (formData.tags?.includes(newTag.trim())) {
      toast.error('标签已存在');
      return;
    }
    setFormData(prev => ({
      ...prev,
      tags: [...(prev.tags || []), newTag.trim()]
    }));
    setNewTag('');
  };

  // 移除标签
  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }));
  };

  // 切换适用场景
  const toggleUseCase = (useCase: string) => {
    setFormData(prev => {
      const current = prev.useCases || [];
      if (current.includes(useCase)) {
        return { ...prev, useCases: current.filter(u => u !== useCase) };
      } else {
        return { ...prev, useCases: [...current, useCase] };
      }
    });
  };

  // 打开创建弹窗
  const openCreateModal = () => {
    setFormData({
      name: '',
      description: '',
      content: '',
      category: '',
      tags: [],
      isOfficial: true,
      isFeatured: false,
      version: '1.0.0',
      useCases: [],
      language: 'zh-CN',
      author: '官方模板',
      config: {
        model: 'doubao-pro-32k',
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 2000,
        style: 'traditional'
      }
    });
    setFormErrors({});
    setModalMode('create');
    setShowModal(true);
  };

  // 打开编辑弹窗
  const openEditModal = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({ ...template });
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  // 打开查看弹窗
  const openViewModal = (template: Template) => {
    setSelectedTemplate(template);
    setModalMode('view');
    setShowModal(true);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* 页面标题和操作按钮 */}
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">津脉作品模板管理</h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              管理创作模板，包括新增、编辑、删除模板
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            新增模板
          </button>
        </div>
      </div>

      {/* 筛选和搜索 */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜索模板名称或标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full px-4 py-2 pl-10 rounded-lg bg-transparent border-none outline-none ${isDark ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
              />
            </div>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="all">全部分类</option>
            {TEMPLATE_CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="all">全部类型</option>
            <option value="official">官方模板</option>
            <option value="featured">推荐模板</option>
            <option value="user">用户模板</option>
          </select>

          <button
            onClick={fetchTemplates}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            刷新
          </button>
        </div>
      </div>

      {/* 模板列表 */}
      <div className={`rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>加载中...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="p-12 text-center">
            <Layout className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>暂无模板</p>
            <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>点击上方按钮创建第一个模板</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">模板信息</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">分类</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">标签</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">类型</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">使用次数</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {templates.map((template) => (
                    <tr key={template.id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          {template.thumbnail ? (
                            <img
                              src={template.thumbnail}
                              alt={template.name}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{template.name}</p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate max-w-[250px]`}>
                              {template.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: CATEGORY_CONFIG[template.category]?.bgColor || 'rgba(128, 128, 128, 0.1)',
                            color: CATEGORY_CONFIG[template.category]?.color || '#666'
                          }}
                        >
                          {template.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {template.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                            >
                              {tag}
                            </span>
                          ))}
                          {template.tags.length > 3 && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                              +{template.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {template.isOfficial && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">官方</span>
                          )}
                          {template.isFeatured && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              推荐
                            </span>
                          )}
                          {!template.isOfficial && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">用户</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {template.usageCount || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => openViewModal(template)}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                            title="查看"
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
                          </button>
                          <button
                            onClick={() => openEditModal(template)}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                            title="编辑"
                          >
                            <Edit2 className="w-4 h-4 text-green-500" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(template)}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                            title="复制"
                          >
                            <Copy className="w-4 h-4 text-purple-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(template)}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  共 {totalCount} 条记录，第 {currentPage}/{totalPages} 页
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === 1
                        ? 'opacity-50 cursor-not-allowed'
                        : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === totalPages
                        ? 'opacity-50 cursor-not-allowed'
                        : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 详情/编辑弹窗 */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4"
            onClick={() => !isSubmitting && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
              onClick={e => e.stopPropagation()}
            >
              {/* 弹窗头部 */}
              <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                <h3 className="text-xl font-bold">
                  {modalMode === 'create' ? '新增模板' :
                   modalMode === 'edit' ? '编辑模板' : '模板详情'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors disabled:opacity-50`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 弹窗内容 */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {modalMode === 'view' && selectedTemplate ? (
                  // 查看模式
                  <div className="space-y-6">
                    {selectedTemplate.thumbnail && (
                      <img
                        src={selectedTemplate.thumbnail}
                        alt={selectedTemplate.name}
                        className="w-full h-64 object-cover rounded-xl"
                      />
                    )}
                    <div>
                      <h4 className="text-2xl font-bold mb-2">{selectedTemplate.name}</h4>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span
                          className="px-3 py-1 rounded-full text-sm"
                          style={{
                            backgroundColor: CATEGORY_CONFIG[selectedTemplate.category]?.bgColor,
                            color: CATEGORY_CONFIG[selectedTemplate.category]?.color
                          }}
                        >
                          {selectedTemplate.category}
                        </span>
                        {selectedTemplate.isOfficial && (
                          <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">官方</span>
                        )}
                        {selectedTemplate.isFeatured && (
                          <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700 flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            推荐
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedTemplate.description}
                      </p>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">模板内容</h5>
                      <pre className={`p-4 rounded-xl text-sm overflow-x-auto ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        {selectedTemplate.content}
                      </pre>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2 flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        标签
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    {selectedTemplate.useCases && selectedTemplate.useCases.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">适用场景</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedTemplate.useCases.map((useCase, idx) => (
                            <span
                              key={idx}
                              className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                            >
                              {useCase}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedTemplate.config && (
                      <div>
                        <h5 className="font-medium mb-2">AI配置</h5>
                        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <p className="text-sm">模型: {selectedTemplate.config.model}</p>
                          <p className="text-sm">温度: {selectedTemplate.config.temperature}</p>
                          <p className="text-sm">Top P: {selectedTemplate.config.top_p}</p>
                          <p className="text-sm">最大Token: {selectedTemplate.config.max_tokens}</p>
                          <p className="text-sm">风格: {selectedTemplate.config.style}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // 编辑/创建模式
                  <div className="space-y-6">
                    {/* 图片上传 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        模板封面
                      </label>
                      <div className="flex items-center gap-4">
                        {formData.thumbnail ? (
                          <div className="relative">
                            <img
                              src={formData.thumbnail}
                              alt="Preview"
                              className="w-32 h-32 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => setFormData(prev => ({ ...prev, thumbnail: '' }))}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                            className={`w-32 h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
                              isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {uploadingImage ? (
                              <div className="animate-spin w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full"></div>
                            ) : (
                              <>
                                <Upload className="w-6 h-6 text-gray-400" />
                                <span className="text-xs text-gray-400">上传封面</span>
                              </>
                            )}
                          </button>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          <p>支持 JPG、PNG、GIF、WebP 格式</p>
                          <p>最大 5MB</p>
                        </div>
                      </div>
                    </div>

                    {/* 模板名称 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        模板名称 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="请输入模板名称"
                        className={`w-full px-4 py-2 rounded-lg border ${
                          formErrors.name ? 'border-red-500' : isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {formErrors.name}
                        </p>
                      )}
                    </div>

                    {/* 分类 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        分类 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          formErrors.category ? 'border-red-500' : isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="">请选择分类</option>
                        {TEMPLATE_CATEGORIES.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      {formErrors.category && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {formErrors.category}
                        </p>
                      )}
                    </div>

                    {/* 模板描述 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        模板描述 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="请输入模板描述"
                        rows={2}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          formErrors.description ? 'border-red-500' : isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                      {formErrors.description && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {formErrors.description}
                        </p>
                      )}
                    </div>

                    {/* 模板内容 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        模板内容 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="请输入模板内容（Prompt）"
                        rows={8}
                        className={`w-full px-4 py-2 rounded-lg border font-mono text-sm ${
                          formErrors.content ? 'border-red-500' : isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                      {formErrors.content && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {formErrors.content}
                        </p>
                      )}
                    </div>

                    {/* 标签 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        标签
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.tags?.map((tag, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                          >
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                          placeholder="输入标签后按回车"
                          className={`flex-1 px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        />
                        <button
                          onClick={handleAddTag}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          添加
                        </button>
                      </div>
                    </div>

                    {/* 适用场景 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        适用场景
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {USE_CASE_OPTIONS.map(useCase => (
                          <button
                            key={useCase}
                            onClick={() => toggleUseCase(useCase)}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${
                              formData.useCases?.includes(useCase)
                                ? 'bg-red-600 text-white'
                                : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {formData.useCases?.includes(useCase) ? '✓ ' : ''}{useCase}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* AI配置 */}
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <h4 className="font-medium mb-4">AI配置</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            模型
                          </label>
                          <select
                            value={formData.config?.model}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              config: { ...prev.config, model: e.target.value }
                            }))}
                            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                          >
                            {MODEL_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            风格
                          </label>
                          <input
                            type="text"
                            value={formData.config?.style}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              config: { ...prev.config, style: e.target.value }
                            }))}
                            placeholder="如：traditional, modern, cartoon"
                            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            温度 (0-1)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            value={formData.config?.temperature}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              config: { ...prev.config, temperature: parseFloat(e.target.value) }
                            }))}
                            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Top P (0-1)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            value={formData.config?.top_p}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              config: { ...prev.config, top_p: parseFloat(e.target.value) }
                            }))}
                            className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 模板属性 */}
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isOfficial}
                          onChange={(e) => setFormData(prev => ({ ...prev, isOfficial: e.target.checked }))}
                          className="w-4 h-4 text-red-600 rounded"
                        />
                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>官方模板</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isFeatured}
                          onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                          className="w-4 h-4 text-red-600 rounded"
                        />
                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>推荐模板</span>
                      </label>
                    </div>

                    {/* 版本号 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        版本号
                      </label>
                      <input
                        type="text"
                        value={formData.version}
                        onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                        placeholder="如：1.0.0"
                        className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 弹窗底部按钮 */}
              <div className={`p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-3`}>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className={`px-6 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors disabled:opacity-50`}
                >
                  {modalMode === 'view' ? '关闭' : '取消'}
                </button>
                {modalMode !== 'view' && (
                  <button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        保存
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
