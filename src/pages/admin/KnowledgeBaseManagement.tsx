import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { Upload, X, Plus, Search, Edit2, Trash2, Eye, Image as ImageIcon, Tag, Save, AlertCircle, Database, RefreshCw } from 'lucide-react';
import tianjinCultureService from '@/services/tianjinCultureService';
import { knowledgeBaseService } from '@/services/knowledgeBaseService';
import { getPicsumUrl } from '@/utils/templateImageGenerator';

// 知识库条目类型定义
interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  content: string;
  imageUrl?: string;
  tags: string[];
  relatedItems?: string[];
  sources?: string[];
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// 分类配置
const CATEGORY_CONFIG: Record<string, { name: string; color: string; bgColor: string; icon: string }> = {
  '非遗传承': { name: '非遗传承', color: '#DC2626', bgColor: 'rgba(220, 38, 38, 0.1)', icon: 'award' },
  '民间艺术': { name: '民间艺术', color: '#7C3AED', bgColor: 'rgba(124, 58, 237, 0.1)', icon: 'palette' },
  '传统工艺': { name: '传统工艺', color: '#059669', bgColor: 'rgba(5, 150, 105, 0.1)', icon: 'hammer' },
  '传统美食': { name: '传统美食', color: '#EA580C', bgColor: 'rgba(234, 88, 12, 0.1)', icon: 'utensils' },
  '中药文化': { name: '中药文化', color: '#0891B2', bgColor: 'rgba(8, 145, 178, 0.1)', icon: 'leaf' },
  '陶瓷文化': { name: '陶瓷文化', color: '#DB2777', bgColor: 'rgba(219, 39, 119, 0.1)', icon: 'wine-bottle' },
  '酒文化': { name: '酒文化', color: '#9333EA', bgColor: 'rgba(147, 51, 234, 0.1)', icon: 'wine-glass' },
  '曲艺文化': { name: '曲艺文化', color: '#4F46E5', bgColor: 'rgba(79, 70, 229, 0.1)', icon: 'music' },
  '历史建筑': { name: '历史建筑', color: '#2563EB', bgColor: 'rgba(37, 99, 235, 0.1)', icon: 'building' },
  '城市文化': { name: '城市文化', color: '#C02C38', bgColor: 'rgba(192, 44, 56, 0.1)', icon: 'city' },
  '服饰文化': { name: '服饰文化', color: '#E11D48', bgColor: 'rgba(225, 29, 72, 0.1)', icon: 'tshirt' },
  '文房四宝': { name: '文房四宝', color: '#374151', bgColor: 'rgba(55, 65, 81, 0.1)', icon: 'pen-fancy' },
  '民族文化': { name: '民族文化', color: '#D97706', bgColor: 'rgba(217, 119, 6, 0.1)', icon: 'users' },
  // 旧分类映射
  '历史人物': { name: '历史人物', color: '#C02C38', bgColor: 'rgba(192, 44, 56, 0.1)', icon: 'user-tie' },
  '历史事件': { name: '历史事件', color: '#2563EB', bgColor: 'rgba(37, 99, 235, 0.1)', icon: 'calendar-alt' },
  '文化遗产': { name: '文化遗产', color: '#059669', bgColor: 'rgba(5, 150, 105, 0.1)', icon: 'landmark' },
  '传统技艺': { name: '传统技艺', color: '#059669', bgColor: 'rgba(5, 150, 105, 0.1)', icon: 'hammer' },
  '民俗文化': { name: '民俗文化', color: '#DC2626', bgColor: 'rgba(220, 38, 38, 0.1)', icon: 'users' },
  '建筑风格': { name: '建筑风格', color: '#0891B2', bgColor: 'rgba(8, 145, 178, 0.1)', icon: 'building' },
  '地方小吃': { name: '传统美食', color: '#EA580C', bgColor: 'rgba(234, 88, 12, 0.1)', icon: 'utensils' },
  '方言文化': { name: '城市文化', color: '#C02C38', bgColor: 'rgba(192, 44, 56, 0.1)', icon: 'comment-dots' },
  '文学艺术': { name: '民间艺术', color: '#7C3AED', bgColor: 'rgba(124, 58, 237, 0.1)', icon: 'palette' },
  '宗教信仰': { name: '民族文化', color: '#D97706', bgColor: 'rgba(217, 119, 6, 0.1)', icon: 'place-of-worship' },
  'platform': { name: '平台知识', color: '#4F46E5', bgColor: 'rgba(79, 70, 229, 0.1)', icon: 'cog' },
  'culture': { name: '文化知识', color: '#059669', bgColor: 'rgba(5, 150, 105, 0.1)', icon: 'book' },
};

// 预设标签
const PRESET_TAGS = [
  '天津', '杨柳青', '泥人张', '风筝魏', '狗不理', '十八街麻花', '耳朵眼炸糕',
  '非遗', '传统', '民俗', '工艺', '美食', '建筑', '艺术', '历史', '文化'
];

export default function KnowledgeBaseManagement() {
  const { isDark } = useTheme();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 10;

  // 表单状态
  const [formData, setFormData] = useState<Partial<KnowledgeItem>>({
    title: '',
    category: '',
    subcategory: '',
    content: '',
    imageUrl: '',
    tags: [],
    sources: [],
    status: 'active'
  });
  const [newTag, setNewTag] = useState('');
  const [newSource, setNewSource] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 从本地服务加载现有知识库数据
  const loadLocalKnowledgeBase = () => {
    try {
      // 从天津文化服务获取数据
      const tianjinData = tianjinCultureService.getAllKnowledge();
      
      // 从知识库服务获取数据
      const kbData = knowledgeBaseService.getAllKnowledgeItems();
      
      // 转换数据格式
      const formattedTianjinItems: KnowledgeItem[] = tianjinData.map(item => ({
        id: item.id,
        title: item.title,
        category: item.category,
        subcategory: item.subcategory,
        content: item.content,
        imageUrl: item.imageUrl,
        tags: [],
        relatedItems: item.relatedItems,
        sources: item.sources,
        status: 'active' as const,
        createdAt: new Date(item.createdAt).toISOString(),
        updatedAt: new Date(item.updatedAt).toISOString(),
      }));

      const formattedKbItems: KnowledgeItem[] = kbData
        .filter(item => item.reviewStatus === 'published')
        .map(item => ({
          id: item.id,
          title: item.title,
          category: item.category,
          subcategory: '',
          content: item.content,
          imageUrl: item.imageUrl,
          tags: item.tags,
          relatedItems: [],
          sources: [],
          status: 'active' as const,
          createdAt: new Date(item.createdAt).toISOString(),
          updatedAt: new Date(item.updatedAt).toISOString(),
        }));

      // 合并数据并去重
      const merged = [...formattedTianjinItems, ...formattedKbItems];
      const unique = merged.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      );

      return unique;
    } catch (error) {
      console.error('加载本地知识库失败:', error);
      return [];
    }
  };

  // 获取知识库列表（从数据库或本地）
  const fetchItems = async () => {
    setLoading(true);
    try {
      // 首先尝试从数据库获取
      let query = supabaseAdmin
        .from('cultural_knowledge')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error, count } = await query;

      if (error) {
        // 如果数据库查询失败，使用本地数据
        console.log('数据库查询失败，使用本地数据:', error);
        const localItems = loadLocalKnowledgeBase();
        
        // 应用筛选
        let filtered = localItems;
        if (searchQuery) {
          const lowerQuery = searchQuery.toLowerCase();
          filtered = filtered.filter(item => 
            item.title.toLowerCase().includes(lowerQuery) ||
            item.content.toLowerCase().includes(lowerQuery)
          );
        }
        if (categoryFilter !== 'all') {
          filtered = filtered.filter(item => item.category === categoryFilter);
        }
        if (statusFilter !== 'all') {
          filtered = filtered.filter(item => item.status === statusFilter);
        }
        
        setItems(filtered);
        setTotalCount(filtered.length);
      } else {
        // 根据标题获取默认图片 - 使用 placehold.co 占位图服务
        const getDefaultImage = (title: string, category: string) => {
          // 知识库条目图片映射 - 使用彩色占位图
          const knowledgeImages: Record<string, string> = {
            // 天津文化
            '杨柳青年画': 'https://placehold.co/400x400/c02c38/ffffff?text=杨柳青年画',
            '泥人张彩塑': 'https://placehold.co/400x400/db2777/ffffff?text=泥人张彩塑',
            '天津风筝魏': 'https://placehold.co/400x400/0891b2/ffffff?text=天津风筝魏',
            '天津方言': 'https://placehold.co/400x400/7c3aed/ffffff?text=天津方言',
            '天津之眼': 'https://placehold.co/400x400/2563eb/ffffff?text=天津之眼',
            '狗不理包子': 'https://placehold.co/400x400/ea580c/ffffff?text=狗不理包子',
            '五大道建筑群': 'https://placehold.co/400x400/4f46e5/ffffff?text=五大道',
            '天津时调': 'https://placehold.co/400x400/9333ea/ffffff?text=天津时调',
            '天后宫': 'https://placehold.co/400x400/dc2626/ffffff?text=天后宫',
            '十八街麻花': 'https://placehold.co/400x400/d97706/ffffff?text=十八街麻花',
            '耳朵眼炸糕': 'https://placehold.co/400x400/e11d48/ffffff?text=耳朵眼炸糕',
            '海河': 'https://placehold.co/400x400/0ea5e9/ffffff?text=海河',
            '意式风情区': 'https://placehold.co/400x400/8b5cf6/ffffff?text=意式风情区',
            '天津相声': 'https://placehold.co/400x400/f59e0b/ffffff?text=天津相声',
            '天津快板': 'https://placehold.co/400x400/10b981/ffffff?text=天津快板',
            '古文化街': 'https://placehold.co/400x400/f97316/ffffff?text=古文化街',
          };
          
          // 查找匹配的图片
          for (const [key, value] of Object.entries(knowledgeImages)) {
            if (title?.includes(key)) {
              return value;
            }
          }
          
          // 根据分类生成默认占位图
          const categoryColors: Record<string, string> = {
            'platform': '6b7280',
            'culture': '059669',
            '非遗传承': 'dc2626',
            '民间艺术': '7c3aed',
            '传统工艺': '059669',
            '传统美食': 'ea580c',
            '中药文化': '0891b2',
            '陶瓷文化': 'db2777',
            '酒文化': '9333ea',
            '曲艺文化': '4f46e5',
            '历史建筑': '2563eb',
            '城市文化': 'c02c38',
            '服饰文化': 'e11d48',
            '文房四宝': '374151',
            '民族文化': 'd97706',
            '历史人物': 'c02c38',
            '历史事件': '2563eb',
            '文化遗产': '059669',
            '传统技艺': '059669',
            '民俗文化': 'dc2626',
            '建筑风格': '0891b2',
            '地方小吃': 'ea580c',
            '方言文化': 'c02c38',
            '文学艺术': '7c3aed',
            '宗教信仰': '4f46e5',
          };
          
          const color = categoryColors[category] || '6b7280';
          const text = encodeURIComponent(title?.slice(0, 4) || '文化');
          return `https://placehold.co/400x400/${color}/ffffff?text=${text}`;
        };

        const formattedItems: KnowledgeItem[] = (data || []).map((item: any) => ({
          id: item.id,
          title: item.title || '',
          category: item.category || '',
          subcategory: item.subcategory || '',
          content: item.content || '',
          imageUrl: item.image_url || getDefaultImage(item.title, item.category),
          tags: item.tags || [],
          relatedItems: item.related_items || [],
          sources: item.sources || [],
          status: item.status || 'active',
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          createdBy: item.created_by
        }));

        setItems(formattedItems);
        setTotalCount(count || 0);
      }
    } catch (error) {
      console.error('获取知识库列表失败:', error);
      // 出错时使用本地数据
      const localItems = loadLocalKnowledgeBase();
      setItems(localItems);
      setTotalCount(localItems.length);
    } finally {
      setLoading(false);
    }
  };

  // 同步本地数据到数据库
  const syncLocalToDatabase = async () => {
    if (!confirm('确定要将本地知识库数据同步到数据库吗？')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const localItems = loadLocalKnowledgeBase();
      
      if (localItems.length === 0) {
        toast.info('没有本地数据需要同步');
        return;
      }

      // 转换数据格式并插入数据库
      const itemsToInsert = localItems.map(item => ({
        title: item.title,
        category: item.category,
        subcategory: item.subcategory,
        content: item.content,
        image_url: item.imageUrl,
        tags: item.tags,
        related_items: item.relatedItems,
        sources: item.sources,
        status: 'active',
        created_at: item.createdAt,
        updated_at: item.updatedAt
      }));

      const { error } = await supabaseAdmin
        .from('cultural_knowledge')
        .insert(itemsToInsert);

      if (error) throw error;

      toast.success(`成功同步 ${localItems.length} 条知识库数据到数据库`);
      fetchItems();
    } catch (error) {
      console.error('同步数据失败:', error);
      toast.error('同步数据失败，请检查数据库连接');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchItems();
  }, [currentPage, categoryFilter, statusFilter, searchQuery]);

  // 验证表单
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      errors.title = '请输入标题';
    }
    if (!formData.category) {
      errors.category = '请选择分类';
    }
    if (!formData.content?.trim()) {
      errors.content = '请输入内容';
    }
    if (!formData.subcategory?.trim()) {
      errors.subcategory = '请输入子分类';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 保存知识库条目
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('请完善表单信息');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        category: formData.category,
        subcategory: formData.subcategory,
        content: formData.content,
        image_url: formData.imageUrl,
        tags: formData.tags,
        sources: formData.sources,
        status: formData.status,
        updated_at: new Date().toISOString()
      };

      if (modalMode === 'create') {
        const { error } = await supabaseAdmin
          .from('cultural_knowledge')
          .insert([{
            ...payload,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;
        toast.success('知识库条目创建成功');
      } else if (modalMode === 'edit' && selectedItem) {
        const { error } = await supabaseAdmin
          .from('cultural_knowledge')
          .update(payload)
          .eq('id', selectedItem.id);

        if (error) throw error;
        toast.success('知识库条目更新成功');
      }

      setShowModal(false);
      fetchItems();
    } catch (error) {
      console.error('保存知识库条目失败:', error);
      toast.error('保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 删除知识库条目
  const handleDelete = async (item: KnowledgeItem) => {
    if (!confirm(`确定要删除"${item.title}"吗？此操作不可恢复。`)) {
      return;
    }

    try {
      const { error } = await supabaseAdmin
        .from('cultural_knowledge')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      toast.success('知识库条目已删除');
      fetchItems();
    } catch (error) {
      console.error('删除知识库条目失败:', error);
      toast.error('删除失败，请重试');
    }
  };

  // 上传图片
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('请上传 JPG、PNG、GIF 或 WebP 格式的图片');
      return;
    }

    // 验证文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `knowledge-base/${fileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('cultural-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('cultural-assets')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
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

  // 添加来源
  const handleAddSource = () => {
    if (!newSource.trim()) return;
    setFormData(prev => ({
      ...prev,
      sources: [...(prev.sources || []), newSource.trim()]
    }));
    setNewSource('');
  };

  // 移除来源
  const handleRemoveSource = (source: string) => {
    setFormData(prev => ({
      ...prev,
      sources: prev.sources?.filter(s => s !== source) || []
    }));
  };

  // 打开创建弹窗
  const openCreateModal = () => {
    setFormData({
      title: '',
      category: '',
      subcategory: '',
      content: '',
      imageUrl: '',
      tags: [],
      sources: [],
      status: 'active'
    });
    setFormErrors({});
    setModalMode('create');
    setShowModal(true);
  };

  // 打开编辑弹窗
  const openEditModal = (item: KnowledgeItem) => {
    setSelectedItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      subcategory: item.subcategory,
      content: item.content,
      imageUrl: item.imageUrl,
      tags: item.tags,
      sources: item.sources,
      status: item.status
    });
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  // 打开查看弹窗
  const openViewModal = (item: KnowledgeItem) => {
    setSelectedItem(item);
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
            <h2 className="text-2xl font-bold mb-1">文化知识库管理</h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              管理文化知识库内容，包括新增、编辑、删除知识条目
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={syncLocalToDatabase}
              disabled={isSubmitting}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Database className="w-5 h-5" />
              同步现有数据
            </button>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              新增知识条目
            </button>
          </div>
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
                placeholder="搜索标题或内容..."
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
            {Array.from(new Set(Object.values(CATEGORY_CONFIG).map(c => c.name))).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="all">全部状态</option>
            <option value="active">已发布</option>
            <option value="inactive">已下架</option>
            <option value="pending">待审核</option>
          </select>

          <button
            onClick={fetchItems}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            刷新
          </button>
        </div>
      </div>

      {/* 知识库列表 */}
      <div className={`rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>加载中...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>暂无知识库条目</p>
            <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>点击上方按钮创建第一条知识</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">知识条目</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">分类</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">标签</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">状态</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">更新时间</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map((item) => (
                    <tr key={item.id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
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
                            <p className="font-medium truncate">{item.title}</p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate max-w-[250px]`}>
                              {item.content.substring(0, 50)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: CATEGORY_CONFIG[item.category]?.bgColor || 'rgba(128, 128, 128, 0.1)',
                            color: CATEGORY_CONFIG[item.category]?.color || '#666'
                          }}
                        >
                          {CATEGORY_CONFIG[item.category]?.name || item.category}
                        </span>
                        {item.subcategory && (
                          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.subcategory}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {item.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                            >
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                              +{item.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === 'active' ? 'bg-green-100 text-green-700' :
                          item.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.status === 'active' ? '已发布' :
                           item.status === 'inactive' ? '已下架' : '待审核'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(item.updatedAt).toLocaleDateString('zh-CN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => openViewModal(item)}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                            title="查看"
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                            title="编辑"
                          >
                            <Edit2 className="w-4 h-4 text-green-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
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
                  {modalMode === 'create' ? '新增知识条目' :
                   modalMode === 'edit' ? '编辑知识条目' : '知识条目详情'}
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
                {modalMode === 'view' && selectedItem ? (
                  // 查看模式
                  <div className="space-y-6">
                    {selectedItem.imageUrl && (
                      <img
                        src={selectedItem.imageUrl}
                        alt={selectedItem.title}
                        className="w-full h-64 object-cover rounded-xl"
                      />
                    )}
                    <div>
                      <h4 className="text-2xl font-bold mb-2">{selectedItem.title}</h4>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span
                          className="px-3 py-1 rounded-full text-sm"
                          style={{
                            backgroundColor: CATEGORY_CONFIG[selectedItem.category]?.bgColor,
                            color: CATEGORY_CONFIG[selectedItem.category]?.color
                          }}
                        >
                          {selectedItem.category}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                          {selectedItem.subcategory}
                        </span>
                      </div>
                    </div>
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedItem.content}
                      </p>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2 flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        标签
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    {selectedItem.sources && selectedItem.sources.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">参考来源</h5>
                        <ul className={`list-disc list-inside ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {selectedItem.sources.map((source, idx) => (
                            <li key={idx}>{source}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  // 编辑/创建模式
                  <div className="space-y-6">
                    {/* 图片上传 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        封面图片
                      </label>
                      <div className="flex items-center gap-4">
                        {formData.imageUrl ? (
                          <div className="relative">
                            <img
                              src={formData.imageUrl}
                              alt="Preview"
                              className="w-32 h-32 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
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
                                <span className="text-xs text-gray-400">上传图片</span>
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

                    {/* 标题 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        标题 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="请输入知识条目标题"
                        className={`w-full px-4 py-2 rounded-lg border ${
                          formErrors.title ? 'border-red-500' : isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                      {formErrors.title && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {formErrors.title}
                        </p>
                      )}
                    </div>

                    {/* 分类和子分类 */}
                    <div className="grid grid-cols-2 gap-4">
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
                          {Array.from(new Set(Object.values(CATEGORY_CONFIG).map(c => c.name))).map(category => (
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
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          子分类 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.subcategory}
                          onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                          placeholder="如：传统美术、雕塑艺术"
                          className={`w-full px-4 py-2 rounded-lg border ${
                            formErrors.subcategory ? 'border-red-500' : isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                          }`}
                        />
                        {formErrors.subcategory && (
                          <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {formErrors.subcategory}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 内容 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        内容 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="请输入知识条目详细内容"
                        rows={6}
                        className={`w-full px-4 py-2 rounded-lg border ${
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
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>推荐标签：</span>
                        {PRESET_TAGS.filter(tag => !formData.tags?.includes(tag)).slice(0, 8).map(tag => (
                          <button
                            key={tag}
                            onClick={() => setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tag] }))}
                            className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                          >
                            +{tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 参考来源 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        参考来源
                      </label>
                      <div className="space-y-2 mb-2">
                        {formData.sources?.map((source, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                          >
                            <span className="text-sm">{source}</span>
                            <button
                              onClick={() => handleRemoveSource(source)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSource}
                          onChange={(e) => setNewSource(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSource())}
                          placeholder="输入参考来源"
                          className={`flex-1 px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        />
                        <button
                          onClick={handleAddSource}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          添加
                        </button>
                      </div>
                    </div>

                    {/* 状态 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        状态
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' | 'pending' }))}
                        className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      >
                        <option value="active">已发布</option>
                        <option value="inactive">已下架</option>
                        <option value="pending">待审核</option>
                      </select>
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
