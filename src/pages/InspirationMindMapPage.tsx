import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Save,
  Download,
  Upload,
  Share2,
  BookOpen,
  Sparkles,
  Layout,
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

// 导入灵感脉络组件
import {
  MindMapCanvas,
  NodeEditor,
  BrandInspirationPanel,
  StoryGenerator,
  useMindMap,
} from '@/components/InspirationMindMap';
import { MindNode, AISuggestion, CreationStory } from '@/components/InspirationMindMap/types';

// 天津风格装饰组件
const TianjinDecoration = () => (
  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D4A574] via-[#E8C9A0] to-[#D4A574]" />
);

const InspirationMindMapPage: React.FC = () => {
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

  // 获取选中的节点
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) || null : null;

  // 初始化创建一个新的脉络
  useEffect(() => {
    if (!mindMap) {
      createMindMap('current-user', '我的创作脉络');
    }
  }, [mindMap, createMindMap]);

  // 处理添加节点
  const handleAddNode = useCallback(async (category: MindNode['category'] = 'inspiration') => {
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
      a.download = `灵感脉络_${mindMap?.title || '未命名'}.json`;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <TianjinDecoration />
      
      {/* 顶部工具栏 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-amber-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          {/* 左侧：标题和基本信息 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#D4A574] to-[#E8C9A0] rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">灵感脉络</h1>
                <p className="text-xs text-gray-500">
                  {mindMap?.title || '未命名脉络'} · {nodes.length}个节点
                </p>
              </div>
            </div>
          </div>

          {/* 中间：布局切换 */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'tree', label: '树形', icon: Layout },
              { id: 'radial', label: '放射', icon: Sparkles },
              { id: 'timeline', label: '时间', icon: BookOpen },
            ].map((layout) => (
              <button
                key={layout.id}
                onClick={() => changeLayout(layout.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
                  mindMap?.layoutType === layout.id
                    ? 'bg-white text-[#D4A574] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <layout.icon className="w-4 h-4" />
                {layout.label}
              </button>
            ))}
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBrandPanel(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              天津灵感
            </button>
            
            <button
              onClick={() => handleAddNode('inspiration')}
              className="flex items-center gap-2 px-4 py-2 bg-[#D4A574] text-white rounded-lg hover:bg-[#C49464] transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              添加节点
            </button>

            <div className="h-6 w-px bg-gray-300 mx-1" />

            <button
              onClick={handleExport}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="导出脉络"
            >
              <Download className="w-5 h-5" />
            </button>

            <label className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer" title="导入脉络">
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
              className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              创作故事
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* 左侧边栏 */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarCollapsed ? 60 : 280 }}
          className="bg-white/80 backdrop-blur-md border-r border-amber-200 flex flex-col"
        >
          {/* 折叠按钮 */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-4 w-6 h-6 bg-white border border-amber-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-3 h-3 text-gray-600" />
            ) : (
              <ChevronLeft className="w-3 h-3 text-gray-600" />
            )}
          </button>

          {!sidebarCollapsed && (
            <>
              {/* 节点列表 */}
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">节点列表</h3>
                <div className="space-y-2">
                  {nodes.map((node) => (
                    <button
                      key={node.id}
                      onClick={() => handleNodeClick(node.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedNodeId === node.id
                          ? 'bg-[#D4A574]/20 border border-[#D4A574]'
                          : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          node.category === 'inspiration' ? 'bg-amber-500' :
                          node.category === 'culture' ? 'bg-red-500' :
                          node.category === 'ai_generate' ? 'bg-purple-500' :
                          node.category === 'manual_edit' ? 'bg-blue-500' :
                          node.category === 'reference' ? 'bg-green-500' :
                          'bg-emerald-500'
                        }`} />
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {node.title}
                        </span>
                      </div>
                      {node.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {node.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 底部统计 */}
              <div className="p-4 border-t border-amber-200">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-amber-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-[#D4A574]">{nodes.length}</p>
                    <p className="text-xs text-gray-600">总节点</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-purple-600">
                      {nodes.filter(n => n.category === 'ai_generate').length}
                    </p>
                    <p className="text-xs text-gray-600">AI生成</p>
                  </div>
                </div>
              </div>
            </>
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

      {/* 加载状态 */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 shadow-2xl flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[#D4A574] border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-700">处理中...</span>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default InspirationMindMapPage;
