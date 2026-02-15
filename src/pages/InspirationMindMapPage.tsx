import React, { useState, useCallback, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Save,
  Download,
  Upload,
  Share2,
  BookOpen,
  Sparkles,
  Layout,
  ChevronLeft,
  ChevronRight,
  Lock,
  Edit3,
  Check,
  X,
  History,
  Lightbulb,
  Wand2,
  Clock,
  TrendingUp,
  Palette,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 导入津脉脉络组件
import {
  MindMapCanvas,
  NodeEditor,
  BrandInspirationPanel,
  StoryGenerator,
  useMindMap,
} from '@/components/InspirationMindMap';
import { MindNode, AISuggestion, CreationStory } from '@/components/InspirationMindMap/types';
import { AuthContext } from '@/contexts/authContext';
import { inspirationMindMapService } from '@/services/inspirationMindMapService';

// 天津风格装饰组件
const TianjinDecoration = () => (
  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D4A574] via-[#E8C9A0] to-[#D4A574]" />
);

// 保存状态指示器
const SaveStatus = ({ lastSaved }: { lastSaved?: Date }) => (
  <div className="flex items-center gap-1.5 text-xs text-gray-400">
    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
    <span>{lastSaved ? `已保存 ${format(lastSaved, 'HH:mm')}` : '自动保存中'}</span>
  </div>
);

const InspirationMindMapPage: React.FC = () => {
  // 获取当前用户
  const { user } = useContext(AuthContext);
  
  // 使用 mind map hook
  const {
    mindMap,
    nodes,
    nodePositions,
    selectedNodeId,
    aiSuggestions,
    isLoading,
    error,
    createMindMap,
    loadMindMap,
    updateMindMap,
    addNode,
    updateNode,
    deleteNode,
    duplicateNode,
    selectNode,
    requestAISuggestion,
    changeLayout,
    generateStory,
    exportMindMap,
    importMindMap,
  } = useMindMap();

  // 本地状态
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [showBrandPanel, setShowBrandPanel] = useState(false);
  const [showStoryGenerator, setShowStoryGenerator] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<CreationStory | null>(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [lastSaved, setLastSaved] = useState<Date>();
  const [nodeFilter, setNodeFilter] = useState<'all' | 'inspiration' | 'culture' | 'ai'>('all');
  
  // 脉络列表状态
  const [showMindMapList, setShowMindMapList] = useState(false);
  const [userMindMaps, setUserMindMaps] = useState<any[]>([]);
  const [isLoadingMindMaps, setIsLoadingMindMaps] = useState(false);

  // 获取选中的节点
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) || null : null;

  // 初始化：加载或创建脉络
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!mindMap && user && !isLoading && !hasInitialized.current) {
      hasInitialized.current = true;
      // 加载用户最近更新的脉络（不一定是"我的创作脉络"）
      (async () => {
        try {
          const mindMaps = await inspirationMindMapService.getUserMindMaps(user.id);
          console.log('[InspirationMindMapPage] Found', mindMaps.length, 'mind maps');
          
          // 优先找"我的创作脉络"，如果没有则找最近更新的脉络
          let targetMap = mindMaps.find(m => m.title === '我的创作脉络');
          if (!targetMap && mindMaps.length > 0) {
            targetMap = mindMaps[0]; // 最近更新的脉络
          }
          
          if (targetMap) {
            // 加载现有的脉络
            console.log('[InspirationMindMapPage] Loading mind map:', targetMap.id, 'title:', targetMap.title);
            await loadMindMap(targetMap.id);
          } else {
            // 创建新的脉络
            console.log('[InspirationMindMapPage] Creating new mind map');
            await createMindMap(user.id, '我的创作脉络');
          }
        } catch (err) {
          console.error('[InspirationMindMapPage] Error initializing mind map:', err);
          // 出错时创建新的脉络
          await createMindMap(user.id, '我的创作脉络');
        }
      })();
    }
  }, [mindMap, user, createMindMap, loadMindMap, isLoading]);

  // 更新保存时间
  useEffect(() => {
    if (mindMap?.updatedAt) {
      setLastSaved(new Date(mindMap.updatedAt));
    }
  }, [mindMap?.updatedAt]);

  // 处理添加节点
  const handleAddNode = useCallback(async (category: 'inspiration' | 'culture' | 'ai_generate' = 'inspiration') => {
    const newNode: Partial<MindNode> = {
      title: '新节点',
      description: '',
      category,
    };
    await addNode(newNode, selectedNodeId || undefined);
    toast.success('节点已添加');
  }, [addNode, selectedNodeId]);

  // 处理节点点击
  const handleNodeClick = useCallback((nodeId: string) => {
    selectNode(nodeId);
    setShowNodeEditor(true);
  }, [selectNode]);

  // 处理保存节点
  const handleSaveNode = useCallback(async (nodeId: string, updates: Partial<MindNode>) => {
    await updateNode(nodeId, updates);
    setShowNodeEditor(false);
    toast.success('节点已保存');
  }, [updateNode]);

  // 处理删除节点
  const handleDeleteNode = useCallback(async (nodeId: string) => {
    await deleteNode(nodeId);
    setShowNodeEditor(false);
    toast.success('节点已删除');
  }, [deleteNode]);

  // 处理复制节点
  const handleDuplicateNode = useCallback(async (nodeId: string) => {
    await duplicateNode(nodeId);
    toast.success('节点已复制');
  }, [duplicateNode]);

  // 处理请求AI建议
  const handleRequestAISuggestion = useCallback(async (
    nodeId: string,
    type: 'continue' | 'branch' | 'optimize' | 'culture'
  ) => {
    await requestAISuggestion(nodeId, type);
    toast.success('AI建议已生成');
  }, [requestAISuggestion]);

  // 处理生成故事
  const handleGenerateStory = useCallback(async () => {
    setIsGeneratingStory(true);
    const story = await generateStory();
    if (story) {
      setGeneratedStory(story);
      toast.success('创作故事已生成');
    }
    setIsGeneratingStory(false);
  }, [generateStory]);

  // 处理导出
  const handleExport = useCallback(() => {
    const json = exportMindMap();
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `津脉脉络_${mindMap?.title || '未命名'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('脉络已导出');
    }
  }, [exportMindMap, mindMap]);

  // 处理导入
  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        try {
          await importMindMap(content);
          toast.success('脉络已导入');
        } catch (err) {
          toast.error('导入失败：无效的文件格式');
        }
      };
      reader.readAsText(file);
    }
  }, [importMindMap]);

  // 处理从品牌面板添加文化元素
  const handleAddCulturalElement = useCallback(async (element: { name: string; description: string }) => {
    const newNode: Partial<MindNode> = {
      title: element.name,
      description: element.description,
      category: 'culture',
      tags: ['天津文化', '老字号'],
    };
    await addNode(newNode, selectedNodeId || undefined);
    toast.success(`已添加文化元素：${element.name}`);
  }, [addNode, selectedNodeId]);

  // 加载脉络列表（包含节点预览）
  const loadMindMapList = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingMindMaps(true);
    try {
      const mindMaps = await inspirationMindMapService.getUserMindMaps(user.id);
      
      // 为每个脉络加载节点预览（最多3个）
      const mindMapsWithNodes = await Promise.all(
        mindMaps.map(async (map) => {
          try {
            const fullMap = await inspirationMindMapService.getMindMap(map.id);
            return {
              ...map,
              previewNodes: fullMap.nodes?.slice(0, 3) || []
            };
          } catch (e) {
            return { ...map, previewNodes: [] };
          }
        })
      );
      
      setUserMindMaps(mindMapsWithNodes);
      console.log('[InspirationMindMapPage] Loaded mind maps with nodes:', mindMapsWithNodes.length);
    } catch (err) {
      console.error('[InspirationMindMapPage] Failed to load mind maps:', err);
      toast.error('加载脉络列表失败');
    } finally {
      setIsLoadingMindMaps(false);
    }
  }, [user?.id]);

  // 打开脉络列表
  const handleOpenMindMapList = () => {
    setShowMindMapList(true);
    loadMindMapList();
  };

  // 切换到指定脉络
  const handleSwitchMindMap = async (mapId: string) => {
    try {
      await loadMindMap(mapId);
      setShowMindMapList(false);
      toast.success('已切换脉络');
    } catch (err) {
      toast.error('切换脉络失败');
    }
  };

  // 处理标题编辑
  const handleStartEditTitle = () => {
    setTitleInput(mindMap?.title || '');
    setIsEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    if (mindMap && titleInput.trim() && titleInput !== mindMap.title) {
      try {
        await updateMindMap({ title: titleInput.trim() });
        toast.success('标题已更新');
      } catch (err) {
        toast.error('更新标题失败');
      }
    }
    setIsEditingTitle(false);
  };

  // 过滤节点
  const filteredNodes = nodes.filter(node => {
    if (nodeFilter === 'all') return true;
    if (nodeFilter === 'inspiration') return node.category === 'inspiration';
    if (nodeFilter === 'culture') return node.category === 'culture';
    if (nodeFilter === 'ai') return node.category === 'ai_generate';
    return true;
  });

  // 统计信息
  const stats = {
    total: nodes.length,
    inspiration: nodes.filter(n => n.category === 'inspiration').length,
    culture: nodes.filter(n => n.category === 'culture').length,
    ai: nodes.filter(n => n.category === 'ai_generate').length,
    manual: nodes.filter(n => n.category === 'manual_edit').length,
  };

  // 未登录提示
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <TianjinDecoration />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md border border-amber-200 rounded-2xl p-8 shadow-xl max-w-md text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-[#D4A574] to-[#E8C9A0] rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">请先登录</h2>
          <p className="text-gray-600 mb-6">
            津脉脉络功能需要登录后才能使用，您的创作数据将被安全保存到云端。
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-3 bg-gradient-to-r from-[#D4A574] to-[#E8C9A0] text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            去登录
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <TianjinDecoration />
      
      {/* 顶部工具栏 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-amber-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          {/* 左侧：标题和基本信息 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#D4A574] to-[#E8C9A0] rounded-xl flex items-center justify-center shadow-lg">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <div>
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      className="text-lg font-bold text-gray-900 bg-transparent border-b-2 border-[#D4A574] focus:outline-none px-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitle();
                        if (e.key === 'Escape') setIsEditingTitle(false);
                      }}
                    />
                    <button
                      onClick={handleSaveTitle}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsEditingTitle(false)}
                      className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 
                      className="text-lg font-bold text-gray-900 cursor-pointer hover:text-[#D4A574] transition-colors"
                      onClick={handleStartEditTitle}
                    >
                      {mindMap?.title || '未命名脉络'}
                    </h1>
                    <button
                      onClick={handleStartEditTitle}
                      className="p-1 text-gray-400 hover:text-[#D4A574] hover:bg-amber-50 rounded transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <p className="text-xs text-gray-500">
                    {stats.total} 个节点 · {stats.culture} 文化元素 · {stats.ai} AI生成
                  </p>
                  <SaveStatus lastSaved={lastSaved} />
                </div>
              </div>
            </div>
          </div>

          {/* 中间：布局显示 */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100/80 backdrop-blur-sm rounded-xl">
            <Clock className="w-4 h-4 text-[#D4A574]" />
            <span className="text-sm font-medium text-gray-700">时间线</span>
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenMindMapList}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all"
            >
              <Layout className="w-4 h-4" />
              <span className="font-medium">我的脉络</span>
            </button>
            
            <button
              onClick={() => setShowBrandPanel(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:shadow-lg hover:shadow-red-200 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span className="font-medium">天津灵感</span>
            </button>
            
            <button
              onClick={() => handleAddNode('inspiration')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#D4A574] to-[#E8C9A0] text-white rounded-xl hover:shadow-lg hover:shadow-amber-200 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">添加节点</span>
            </button>

            <div className="h-6 w-px bg-gray-300 mx-1" />

            <button
              onClick={handleExport}
              className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              title="导出脉络"
            >
              <Download className="w-5 h-5" />
            </button>

            <label className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer" title="导入脉络">
              <Upload className="w-5 h-5" />
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setShowStoryGenerator(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-200 transition-all"
            >
              <Wand2 className="w-4 h-4" />
              <span className="font-medium">创作故事</span>
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* 左侧边栏 */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarCollapsed ? 60 : 300 }}
          className="bg-white/80 backdrop-blur-md border-r border-amber-200 flex flex-col overflow-hidden"
        >
          {/* 折叠按钮 */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-4 w-6 h-6 bg-white border border-amber-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-3 h-3 text-gray-600" />
            ) : (
              <ChevronLeft className="w-3 h-3 text-gray-600" />
            )}
          </button>

          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-full"
              >
                {/* 统计卡片 */}
                <div className="p-4 border-b border-amber-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#D4A574]" />
                    脉络统计
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-100">
                      <p className="text-xl font-bold text-[#D4A574]">{stats.total}</p>
                      <p className="text-xs text-gray-600">总节点</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-3 border border-red-100">
                      <p className="text-xl font-bold text-red-500">{stats.culture}</p>
                      <p className="text-xs text-gray-600">文化元素</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-3 border border-purple-100">
                      <p className="text-xl font-bold text-purple-500">{stats.ai}</p>
                      <p className="text-xs text-gray-600">AI生成</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-100">
                      <p className="text-xl font-bold text-blue-500">{stats.manual}</p>
                      <p className="text-xs text-gray-600">手动编辑</p>
                    </div>
                  </div>
                </div>

                {/* 节点筛选 */}
                <div className="p-4 border-b border-amber-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">筛选节点</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'all', label: '全部', color: 'bg-gray-500' },
                      { id: 'inspiration', label: '灵感', color: 'bg-amber-500' },
                      { id: 'culture', label: '文化', color: 'bg-red-500' },
                      { id: 'ai', label: 'AI', color: 'bg-purple-500' },
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setNodeFilter(filter.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          nodeFilter === filter.id
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${filter.color}`} />
                        {filter.label}
                        <span className="text-gray-400">
                          {filter.id === 'all' ? stats.total :
                           filter.id === 'inspiration' ? stats.inspiration :
                           filter.id === 'culture' ? stats.culture :
                           filter.id === 'ai' ? stats.ai : 0}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 节点列表 */}
                <div className="flex-1 overflow-y-auto p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-[#D4A574]" />
                    节点列表
                  </h3>
                  <div className="space-y-2">
                    {filteredNodes.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <p className="text-sm">暂无节点</p>
                        <p className="text-xs mt-1">点击"添加节点"开始创作</p>
                      </div>
                    ) : (
                      filteredNodes.map((node, index) => (
                        <motion.button
                          key={node.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleNodeClick(node.id)}
                          className={`w-full text-left p-3 rounded-xl transition-all group ${
                            selectedNodeId === node.id
                              ? 'bg-gradient-to-r from-[#D4A574]/20 to-[#E8C9A0]/20 border-2 border-[#D4A574] shadow-md'
                              : 'bg-white/50 hover:bg-white border-2 border-transparent hover:border-amber-200 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                              node.category === 'inspiration' ? 'bg-amber-500' :
                              node.category === 'culture' ? 'bg-red-500' :
                              node.category === 'ai_generate' ? 'bg-purple-500' :
                              node.category === 'manual_edit' ? 'bg-blue-500' :
                              node.category === 'reference' ? 'bg-green-500' :
                              'bg-emerald-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-gray-900 truncate block">
                                {node.title}
                              </span>
                              {node.description && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                  {node.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1.5">
                                {node.tags && node.tags.length > 0 && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                                    {node.tags[0]}
                                    {node.tags.length > 1 && ` +${node.tags.length - 1}`}
                                  </span>
                                )}
                                {node.aiGeneratedContent && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded flex items-center gap-0.5">
                                    <Wand2 className="w-2.5 h-2.5" />
                                    AI
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      ))
                    )}
                  </div>
                </div>

                {/* 底部提示 */}
                <div className="p-4 border-t border-amber-100 bg-amber-50/50">
                  <p className="text-xs text-gray-500 text-center">
                    💡 提示：点击节点可编辑，拖拽可调整位置
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 折叠状态图标 */}
          {sidebarCollapsed && (
            <div className="flex flex-col items-center pt-4 gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#D4A574] to-[#E8C9A0] rounded-xl flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-xs font-bold text-[#D4A574]">
                {stats.total}
              </div>
            </div>
          )}
        </motion.aside>

        {/* 画布区域 */}
        <main className="flex-1 relative overflow-hidden">
          <MindMapCanvas
            nodes={nodes}
            nodePositions={nodePositions}
            selectedNodeId={selectedNodeId}
            onNodeClick={handleNodeClick}
            onCanvasClick={() => selectNode(null)}
            onAddNode={handleAddNode}
            onOpenBrandPanel={() => setShowBrandPanel(true)}
          />
        </main>
      </div>

      {/* 节点编辑器 */}
      <NodeEditor
        node={selectedNode}
        isOpen={showNodeEditor}
        onClose={() => setShowNodeEditor(false)}
        onSave={handleSaveNode}
        onDelete={handleDeleteNode}
        onDuplicate={handleDuplicateNode}
        onRequestAISuggestion={handleRequestAISuggestion}
        aiSuggestions={aiSuggestions}
      />

      {/* 品牌灵感面板 */}
      <BrandInspirationPanel
        isOpen={showBrandPanel}
        onClose={() => setShowBrandPanel(false)}
        onAddElement={handleAddCulturalElement}
        onRequestAIAdvice={(brandId, elementIds) => {
          toast.success(`已获取 ${elementIds.length} 个元素的AI建议`);
        }}
      />

      {/* 故事生成器 */}
      <StoryGenerator
        mindMap={mindMap}
        story={generatedStory}
        isOpen={showStoryGenerator}
        isGenerating={isGeneratingStory}
        onClose={() => setShowStoryGenerator(false)}
        onGenerate={handleGenerateStory}
      />

      {/* 脉络列表弹窗 */}
      <AnimatePresence>
        {showMindMapList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowMindMapList(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">我的创作脉络</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    共 {userMindMaps.length} 个脉络
                  </p>
                </div>
                <button
                  onClick={() => setShowMindMapList(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {isLoadingMindMaps ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-[#D4A574] border-t-transparent rounded-full animate-spin" />
                    <span className="ml-3 text-gray-600">加载中...</span>
                  </div>
                ) : userMindMaps.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Layout className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>暂无脉络</p>
                    <p className="text-sm mt-2">开始创作，自动生成您的第一个脉络</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {userMindMaps.map((map) => (
                      <motion.div
                        key={map.id}
                        whileHover={{ scale: 1.01 }}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          mindMap?.id === map.id
                            ? 'border-[#D4A574] bg-amber-50'
                            : 'border-gray-200 hover:border-[#D4A574] hover:bg-gray-50'
                        }`}
                        onClick={() => handleSwitchMindMap(map.id)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{map.title}</h3>
                            {map.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                {map.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                              <span>节点: {map.stats?.totalNodes || 0}</span>
                              <span>AI生成: {map.stats?.aiGeneratedNodes || 0}</span>
                              <span>文化: {map.stats?.cultureNodes || 0}</span>
                              <span>
                                更新: {map.updatedAt
                                  ? new Date(map.updatedAt).toLocaleDateString('zh-CN')
                                  : '未知'
                                }
                              </span>
                            </div>
                          </div>
                          {mindMap?.id === map.id && (
                            <div className="px-2 py-1 bg-[#D4A574] text-white text-xs rounded-full">
                              当前
                            </div>
                          )}
                        </div>
                        
                        {/* 节点预览 */}
                        {map.previewNodes && map.previewNodes.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            {map.previewNodes.map((node: any) => (
                              <div
                                key={node.id}
                                className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                    node.category === 'ai_generate' ? 'bg-purple-100 text-purple-600' :
                                    node.category === 'culture' ? 'bg-amber-100 text-amber-600' :
                                    node.category === 'inspiration' ? 'bg-blue-100 text-blue-600' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {node.category === 'ai_generate' && <Sparkles className="w-3 h-3" />}
                                    {node.category === 'culture' && <BookOpen className="w-3 h-3" />}
                                    {node.category === 'inspiration' && <Lightbulb className="w-3 h-3" />}
                                    {node.category === 'manual_edit' && <Edit3 className="w-3 h-3" />}
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {node.category === 'ai_generate' && 'AI生成'}
                                    {node.category === 'culture' && '文化'}
                                    {node.category === 'inspiration' && '灵感'}
                                    {node.category === 'manual_edit' && '手动'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-700 line-clamp-2 font-medium">
                                  {node.title}
                                </p>
                                {node.content?.thumbnail && (
                                  <div className="mt-2 aspect-video rounded overflow-hidden bg-gray-100">
                                    <img
                                      src={node.content.thumbnail}
                                      alt={node.title}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 加载状态 */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[#D4A574] border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-700">处理中...</span>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default InspirationMindMapPage;
