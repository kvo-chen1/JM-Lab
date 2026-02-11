import { useState, useCallback, useEffect, useRef } from 'react';
import { CreationMindMap, MindNode, NodePosition, AISuggestion, CreationStory } from '../types';
import { InspirationMindMapService } from '@/services/inspirationMindMapService';

const service = new InspirationMindMapService();

export interface UseMindMapReturn {
  // 状态
  mindMap: CreationMindMap | null;
  nodes: MindNode[];
  nodePositions: NodePosition[];
  selectedNodeId: string | null;
  aiSuggestions: AISuggestion[];
  isLoading: boolean;
  error: string | null;
  
  // 操作方法
  createMindMap: (userId: string, title: string, brandId?: string) => Promise<void>;
  loadMindMap: (mapId: string) => Promise<void>;
  addNode: (nodeData: Partial<MindNode>, parentId?: string) => Promise<void>;
  updateNode: (nodeId: string, updates: Partial<MindNode>) => Promise<void>;
  deleteNode: (nodeId: string) => Promise<void>;
  duplicateNode: (nodeId: string) => Promise<void>;
  selectNode: (nodeId: string | null) => void;
  
  // AI功能
  requestAISuggestion: (nodeId: string, type: 'continue' | 'branch' | 'optimize' | 'culture') => Promise<void>;
  applyAISuggestion: (suggestion: AISuggestion) => Promise<void>;
  
  // 布局
  changeLayout: (layoutType: 'tree' | 'radial' | 'timeline') => void;
  
  // 故事生成
  generateStory: () => Promise<CreationStory | null>;
  
  // 导入导出
  exportMindMap: () => string;
  importMindMap: (json: string) => Promise<void>;
}

export const useMindMap = (initialMapId?: string): UseMindMapReturn => {
  const [mindMap, setMindMap] = useState<CreationMindMap | null>(null);
  const [nodes, setNodes] = useState<MindNode[]>([]);
  const [nodePositions, setNodePositions] = useState<NodePosition[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 使用 ref 存储最新的 mindMap 和 nodes，避免循环依赖
  const mindMapRef = useRef(mindMap);
  const nodesRef = useRef(nodes);
  
  useEffect(() => {
    mindMapRef.current = mindMap;
  }, [mindMap]);
  
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // 计算节点位置
  const calculatePositions = useCallback((currentNodes: MindNode[], layoutType: 'tree' | 'radial' | 'timeline' = 'tree') => {
    const positions = service.calculateLayout(currentNodes, layoutType);
    setNodePositions(positions);
  }, []);

  // 加载脉络
  const loadMindMap = useCallback(async (mapId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const loadedMap = await service.getMindMap(mapId);
      if (loadedMap) {
        setMindMap(loadedMap);
        setNodes(loadedMap.nodes);
        calculatePositions(loadedMap.nodes, loadedMap.layoutType);
      } else {
        setError('脉络不存在');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setIsLoading(false);
    }
  }, [calculatePositions]);

  // 初始化加载
  useEffect(() => {
    if (initialMapId) {
      loadMindMap(initialMapId);
    }
  }, [initialMapId, loadMindMap]);

  // 创建新脉络
  const createMindMap = useCallback(async (userId: string, title: string, brandId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const newMap = await service.createMindMap(userId, title, brandId);
      setMindMap(newMap);
      setNodes(newMap.nodes);
      calculatePositions(newMap.nodes, newMap.layoutType);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setIsLoading(false);
    }
  }, [calculatePositions]);

  // 添加节点
  const addNode = useCallback(async (nodeData: Partial<MindNode>, parentId?: string) => {
    const currentMindMap = mindMapRef.current;
    if (!currentMindMap) return;
    
    setIsLoading(true);
    try {
      const newNode = await service.addNode(currentMindMap.id, nodeData, parentId);
      const updatedNodes = [...nodesRef.current, newNode];
      setNodes(updatedNodes);
      calculatePositions(updatedNodes, currentMindMap.layoutType);
      
      // 更新脉络
      setMindMap(prev => prev ? { ...prev, nodes: updatedNodes, updatedAt: Date.now() } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加节点失败');
    } finally {
      setIsLoading(false);
    }
  }, [calculatePositions]);

  // 更新节点
  const updateNode = useCallback(async (nodeId: string, updates: Partial<MindNode>) => {
    const currentMindMap = mindMapRef.current;
    if (!currentMindMap) return;
    
    setIsLoading(true);
    try {
      const updatedNode = await service.updateNode(nodeId, updates);
      const updatedNodes = nodesRef.current.map(n => n.id === nodeId ? updatedNode : n);
      setNodes(updatedNodes);
      calculatePositions(updatedNodes, currentMindMap.layoutType);
      
      setMindMap(prev => prev ? { ...prev, nodes: updatedNodes, updatedAt: Date.now() } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新节点失败');
    } finally {
      setIsLoading(false);
    }
  }, [calculatePositions]);

  // 删除节点
  const deleteNode = useCallback(async (nodeId: string) => {
    const currentMindMap = mindMapRef.current;
    if (!currentMindMap) return;
    
    setIsLoading(true);
    try {
      await service.deleteNode(nodeId);
      const updatedNodes = nodesRef.current.filter(n => n.id !== nodeId && n.parentId !== nodeId);
      setNodes(updatedNodes);
      calculatePositions(updatedNodes, currentMindMap.layoutType);
      
      setSelectedNodeId(prev => prev === nodeId ? null : prev);
      
      setMindMap(prev => prev ? { ...prev, nodes: updatedNodes, updatedAt: Date.now() } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除节点失败');
    } finally {
      setIsLoading(false);
    }
  }, [calculatePositions]);

  // 复制节点
  const duplicateNode = useCallback(async (nodeId: string) => {
    const sourceNode = nodesRef.current.find(n => n.id === nodeId);
    const currentMindMap = mindMapRef.current;
    if (!sourceNode || !currentMindMap) return;
    
    const duplicatedData: Partial<MindNode> = {
      title: `${sourceNode.title} (复制)`,
      description: sourceNode.description,
      category: sourceNode.category,
      aiPrompt: sourceNode.aiPrompt,
      aiGeneratedContent: sourceNode.aiGeneratedContent,
      userNote: sourceNode.userNote,
      tags: sourceNode.tags,
      style: sourceNode.style,
    };
    
    await addNode(duplicatedData, sourceNode.parentId);
  }, [addNode]);

  // 选择节点
  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    if (nodeId) {
      // 清空之前的AI建议
      setAiSuggestions([]);
    }
  }, []);

  // 请求AI建议
  const requestAISuggestion = useCallback(async (
    nodeId: string,
    type: 'continue' | 'branch' | 'optimize' | 'culture'
  ) => {
    setIsLoading(true);
    try {
      const suggestion = await service.generateAISuggestion(nodeId, type);
      setAiSuggestions(prev => [suggestion, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取AI建议失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 应用AI建议
  const applyAISuggestion = useCallback(async (suggestion: AISuggestion) => {
    const currentSelectedNodeId = selectedNodeId;
    if (!currentSelectedNodeId) return;
    
    await updateNode(currentSelectedNodeId, {
      aiPrompt: suggestion.prompt,
      aiGeneratedContent: suggestion.content,
    });
  }, [selectedNodeId, updateNode]);

  // 更改布局
  const changeLayout = useCallback((layoutType: 'tree' | 'radial' | 'timeline') => {
    const currentMindMap = mindMapRef.current;
    if (!currentMindMap) return;
    
    calculatePositions(nodesRef.current, layoutType);
    setMindMap(prev => prev ? { ...prev, layoutType } : null);
  }, [calculatePositions]);

  // 生成创作故事
  const generateStory = useCallback(async (): Promise<CreationStory | null> => {
    const currentMindMap = mindMapRef.current;
    if (!currentMindMap) return null;
    
    setIsLoading(true);
    try {
      const story = await service.generateCreationStory(currentMindMap.id);
      return story;
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成故事失败');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 导出脉络
  const exportMindMap = useCallback((): string => {
    const currentMindMap = mindMapRef.current;
    if (!currentMindMap) return '';
    
    const exportData = {
      ...currentMindMap,
      exportTime: new Date().toISOString(),
      version: '1.0',
    };
    
    return JSON.stringify(exportData, null, 2);
  }, []);

  // 导入脉络
  const importMindMap = useCallback(async (json: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const importedData = JSON.parse(json);
      
      // 验证数据格式
      if (!importedData.id || !importedData.nodes) {
        throw new Error('无效的脉络数据格式');
      }
      
      // 创建新的脉络ID
      const newMap = await service.createMindMap(
        importedData.userId || 'imported',
        `${importedData.title} (导入)`,
        importedData.brandId
      );
      
      // 导入节点
      for (const node of importedData.nodes) {
        const { id, ...nodeData } = node;
        await service.addNode(newMap.id, nodeData, node.parentId);
      }
      
      // 重新加载
      await loadMindMap(newMap.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setIsLoading(false);
    }
  }, [loadMindMap]);

  return {
    mindMap,
    nodes,
    nodePositions,
    selectedNodeId,
    aiSuggestions,
    isLoading,
    error,
    createMindMap,
    loadMindMap,
    addNode,
    updateNode,
    deleteNode,
    duplicateNode,
    selectNode,
    requestAISuggestion,
    applyAISuggestion,
    changeLayout,
    generateStory,
    exportMindMap,
    importMindMap,
  };
};

export default useMindMap;
