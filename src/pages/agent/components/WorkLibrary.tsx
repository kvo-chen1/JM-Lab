import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Search, X, Library, ImageIcon, Check, AtSign, Edit3, Clock } from 'lucide-react';
import { useAgentStore } from '../hooks/useAgentStore';
import { createDraftService, CreateDraft } from '@/services/createDraftService';
import { GeneratedOutput } from '../types/agent';
import { toast } from 'sonner';

interface WorkLibraryProps {
  onClose: () => void;
  selectedWork?: string;
}

// 草稿卡片组件
interface DraftCardProps {
  draft: CreateDraft;
  index: number;
  isSelected: boolean;
  isHovered: boolean;
  isDark: boolean;
  onMention: (draft: CreateDraft) => void;
  onEdit: (draft: CreateDraft) => void;
  onHover: (id: string | null) => void;
}

const DraftCard = React.memo(function DraftCard({
  draft,
  index,
  isSelected,
  isHovered,
  isDark,
  onMention,
  onEdit,
  onHover
}: DraftCardProps) {
  const handleMentionClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onMention(draft);
  }, [onMention, draft]);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(draft);
  }, [onEdit, draft]);

  // 获取草稿的缩略图
  const thumbnail = useMemo(() => {
    if (draft.generatedResults && draft.generatedResults.length > 0) {
      const selected = draft.generatedResults.find(r => r.id === draft.selectedResult);
      if (selected) {
        return selected.thumbnail;
      }
      return draft.generatedResults[0].thumbnail;
    }
    return null;
  }, [draft.generatedResults, draft.selectedResult]);

  // 获取工具类型标签
  const getToolLabel = (tool?: string) => {
    const labels: Record<string, string> = {
      'sketch': 'AI绘画',
      'pattern': '纹样嵌入',
      'layout': '智能排版',
      'trace': '文化溯源',
      'mockup': '样机预览',
      'tile': '图案平铺',
      'enhance': '图片完善',
      'style': '风格实验室',
      'filter': '滤镜效果',
      'remix': '创意融合',
      'culture': '文化元素',
      'upload': '上传参考'
    };
    return labels[tool || ''] || 'AI创作';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
        isSelected
          ? 'ring-2 ring-[#C02C38] ring-offset-2 ring-offset-gray-900'
          : 'hover:ring-2 hover:ring-gray-600'
      }`}
      onMouseEnter={() => onHover(draft.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* 图片区域 */}
      <div className="aspect-[4/3] overflow-hidden bg-gray-800 relative">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={draft.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop';
            }}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
            <ImageIcon className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          </div>
        )}

        {/* 选中标记 */}
        {isSelected && (
          <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#C02C38] flex items-center justify-center shadow-lg">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}

        {/* 悬停遮罩和操作按钮 */}
        <motion.div
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none"
        />

        {/* 操作按钮组 */}
        <motion.div
          initial={false}
          animate={{ 
            opacity: isHovered ? 1 : 0, 
            y: isHovered ? 0 : -10 
          }}
          transition={{ duration: 0.2 }}
          className="absolute top-3 right-3 flex flex-col gap-2"
        >
          {/* 引用按钮 */}
          <button
            onClick={handleMentionClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C02C38] text-white text-xs font-medium shadow-lg hover:bg-[#a82530] transition-colors pointer-events-auto"
            title="引用到输入框"
          >
            <AtSign className="w-3.5 h-3.5" />
            引用
          </button>
          {/* 编辑按钮 */}
          <button
            onClick={handleEditClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium shadow-lg hover:bg-indigo-700 transition-colors pointer-events-auto"
            title="在画布上编辑"
          >
            <Edit3 className="w-3.5 h-3.5" />
            编辑
          </button>
        </motion.div>

        {/* 作品数量标记 */}
        {draft.generatedResults && draft.generatedResults.length > 1 && (
          <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-md">
            {draft.generatedResults.length} 个作品
          </div>
        )}
      </div>

      {/* 信息区域 */}
      <div className={`p-3 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
        <h4 className={`font-semibold text-sm mb-1 truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {draft.name || '未命名草稿'}
        </h4>
        <p className={`text-xs line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {draft.prompt || draft.description || '暂无描述'}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
            {getToolLabel(draft.activeTool)}
          </span>
          <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <Clock className="w-3 h-3" />
            {new Date(draft.updatedAt).toLocaleDateString('zh-CN')}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default function WorkLibrary({ onClose, selectedWork }: WorkLibraryProps) {
  const { isDark } = useTheme();
  const { setPendingMention, setGeneratedContent, selectOutput, createTask, updateTask } = useAgentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelectedWork, setLocalSelectedWork] = useState<string | undefined>(selectedWork);
  const [drafts, setDrafts] = useState<CreateDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredDraftId, setHoveredDraftId] = useState<string | null>(null);

  // 加载用户草稿
  useEffect(() => {
    let isMounted = true;
    
    const loadDrafts = async () => {
      try {
        setIsLoading(true);
        
        // 首先尝试从 localStorage 获取
        const localDrafts = localStorage.getItem('CREATE_DRAFTS');
        let allDrafts: CreateDraft[] = [];
        
        if (localDrafts) {
          try {
            const parsed = JSON.parse(localDrafts);
            if (Array.isArray(parsed)) {
              allDrafts = parsed.map((d: any) => ({
                id: d.id,
                userId: d.userId || '',
                name: d.name || '未命名草稿',
                description: d.description,
                prompt: d.prompt,
                selectedResult: d.selectedResult,
                generatedResults: d.generatedResults || [],
                activeTool: d.activeTool || 'sketch',
                stylePreset: d.stylePreset,
                currentStep: d.currentStep || 1,
                aiExplanation: d.aiExplanation,
                selectedPatternId: d.selectedPatternId,
                patternOpacity: d.patternOpacity,
                patternScale: d.patternScale,
                patternRotation: d.patternRotation,
                patternBlendMode: d.patternBlendMode,
                patternTileMode: d.patternTileMode,
                patternPositionX: d.patternPositionX,
                patternPositionY: d.patternPositionY,
                tilePatternId: d.tilePatternId,
                tileMode: d.tileMode,
                tileSize: d.tileSize,
                tileSpacing: d.tileSpacing,
                tileRotation: d.tileRotation,
                tileOpacity: d.tileOpacity,
                mockupSelectedTemplateId: d.mockupSelectedTemplateId,
                mockupShowWireframe: d.mockupShowWireframe,
                traceSelectedKnowledgeId: d.traceSelectedKnowledgeId,
                culturalInfoText: d.culturalInfoText,
                createdAt: d.createdAt || Date.now(),
                updatedAt: d.updatedAt || Date.now(),
                isSynced: false
              }));
            }
          } catch (e) {
            console.error('解析本地草稿失败:', e);
          }
        }
        
        // 然后尝试从云端获取
        try {
          const cloudDrafts = await createDraftService.getUserDrafts(100);
          // 合并云端和本地草稿，以云端为准
          const cloudIds = new Set(cloudDrafts.map(d => d.id));
          const localOnlyDrafts = allDrafts.filter(d => !cloudIds.has(d.id));
          allDrafts = [...cloudDrafts, ...localOnlyDrafts];
        } catch (e) {
          console.log('获取云端草稿失败，使用本地草稿:', e);
        }
        
        if (isMounted) {
          // 按更新时间排序
          allDrafts.sort((a, b) => b.updatedAt - a.updatedAt);
          setDrafts(allDrafts);
        }
      } catch (error) {
        console.error('加载草稿失败:', error);
        if (isMounted) {
          toast.error('加载草稿失败');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDrafts();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // 过滤草稿
  const filteredDrafts = useMemo(() => {
    if (!searchQuery) return drafts;
    const query = searchQuery.toLowerCase();
    return drafts.filter(draft =>
      (draft.name || '').toLowerCase().includes(query) ||
      (draft.prompt || '').toLowerCase().includes(query) ||
      (draft.description || '').toLowerCase().includes(query)
    );
  }, [drafts, searchQuery]);

  // 处理草稿引用
  const handleMentionDraft = useCallback((draft: CreateDraft) => {
    setPendingMention({
      type: 'work',
      name: draft.name || '未命名草稿',
      id: draft.id
    });
    setLocalSelectedWork(draft.id);
    toast.success(`已引用草稿：${draft.name || '未命名草稿'}，请在输入框中描述您的需求`);
    onClose();
  }, [setPendingMention, onClose]);

  // 处理草稿编辑 - 将草稿中选中的作品加载到 Agent 画布上
  const handleEditDraft = useCallback((draft: CreateDraft) => {
    // 只加载选中的作品，如果没有选中则加载第一个
    const selectedResult = draft.generatedResults?.find((r: any) => r.id === draft.selectedResult);
    const targetResult = selectedResult || draft.generatedResults?.[0];
    
    if (!targetResult) {
      toast.error('该草稿没有可加载的作品');
      return;
    }

    // 将选中的作品转换为 Agent 的 GeneratedOutput 格式
    const generatedOutput: GeneratedOutput = {
      id: `draft-${draft.id}-output`,
      type: targetResult.type === 'video' ? 'video' : 'image',
      url: targetResult.thumbnail || targetResult.url || '',
      thumbnail: targetResult.thumbnail || targetResult.url || '',
      prompt: targetResult.prompt || draft.prompt || '',
      style: draft.stylePreset,
      createdAt: targetResult.createdAt || Date.now(),
      metadata: {
        draftId: draft.id,
        draftName: draft.name,
        originalResultId: targetResult.id,
        tool: draft.activeTool,
        patternId: draft.selectedPatternId,
        patternOpacity: draft.patternOpacity,
        patternScale: draft.patternScale,
        patternRotation: draft.patternRotation,
      }
    };

    // 设置生成内容到 Agent Store（只加载一个）
    setGeneratedContent([generatedOutput]);
    
    // 选中该输出
    selectOutput(generatedOutput.id);

    // 创建或更新当前任务
    if (draft.prompt) {
      createTask(
        'custom',
        draft.name || '草稿编辑',
        draft.prompt
      );
      
      // 更新任务需求
      updateTask({
        requirements: {
          description: draft.prompt,
          style: draft.stylePreset,
        }
      });
    }
    
    setLocalSelectedWork(draft.id);
    toast.success(`已加载作品到画布：${draft.name || '未命名草稿'}`);
    onClose();
  }, [setGeneratedContent, selectOutput, createTask, updateTask, onClose]);

  // 处理悬停
  const handleHover = useCallback((id: string | null) => {
    setHoveredDraftId(id);
  }, []);

  return (
    <div className={`h-full flex flex-col ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* 头部 */}
      <div className={`p-5 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center">
              <Library className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                我的草稿箱
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {isLoading ? '加载中...' : `${filteredDrafts.length} 个草稿`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 搜索框 */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`} />
          <input
            type="text"
            placeholder="搜索草稿..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            } focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent`}
          />
        </div>
      </div>

      {/* 草稿网格 */}
      <div className="flex-1 overflow-y-auto p-5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
            <p className={`mt-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              加载草稿中...
            </p>
          </div>
        ) : filteredDrafts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrafts.map((draft, index) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                index={index}
                isSelected={localSelectedWork === draft.id}
                isHovered={hoveredDraftId === draft.id}
                isDark={isDark}
                onMention={handleMentionDraft}
                onEdit={handleEditDraft}
                onHover={handleHover}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Library className={`w-12 h-12 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {searchQuery ? '没有找到相关草稿' : '暂无草稿，快去创作吧'}
            </p>
          </div>
        )}
      </div>

      {/* 底部 */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {localSelectedWork
              ? `已选择: ${drafts.find(d => d.id === localSelectedWork)?.name || '未命名草稿'}`
              : '悬浮草稿卡片点击"引用"或"编辑"按钮'}
          </p>
        </div>
      </div>
    </div>
  );
}
