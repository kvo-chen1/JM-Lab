import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Square,
  X,
  Trash2,
  Copy,
  Scissors,
  ArrowUp,
  ArrowDown,
  FolderInput,
  Layers,
  Tag,
  AlignLeft,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Filter,
  Search,
  Wand2,
  RefreshCw,
  Download,
  Archive,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { OutlineSection } from './types';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BatchOperationsProps {
  sections: OutlineSection[];
  onUpdateSections: (sections: OutlineSection[]) => void;
  onClose: () => void;
}

interface FlattenedSection extends OutlineSection {
  path: string[];
  depth: number;
  parentId: string | null;
}

interface BatchAction {
  type: 'delete' | 'copy' | 'move' | 'levelUp' | 'levelDown' | 'addTag' | 'removeTag' | 'clearContent';
  label: string;
  icon: React.ReactNode;
  color: string;
}

const flattenSections = (
  sections: OutlineSection[],
  path: string[] = [],
  depth: number = 0,
  parentId: string | null = null
): FlattenedSection[] => {
  const result: FlattenedSection[] = [];
  
  sections.forEach((section, index) => {
    const currentPath = [...path, `${index + 1}`];
    const flatSection: FlattenedSection = {
      ...section,
      path: currentPath,
      depth,
      parentId
    };
    result.push(flatSection);
    
    if (section.children?.length) {
      result.push(...flattenSections(section.children, currentPath, depth + 1, section.id));
    }
  });
  
  return result;
};

const findSectionById = (sections: OutlineSection[], id: string): OutlineSection | null => {
  for (const section of sections) {
    if (section.id === id) return section;
    if (section.children?.length) {
      const found = findSectionById(section.children, id);
      if (found) return found;
    }
  }
  return null;
};

const removeSectionById = (sections: OutlineSection[], id: string): OutlineSection[] => {
  return sections.filter(section => {
    if (section.id === id) return false;
    if (section.children?.length) {
      section.children = removeSectionById(section.children, id);
    }
    return true;
  });
};

const duplicateSection = (section: OutlineSection, newId: string): OutlineSection => ({
  ...section,
  id: newId,
  title: `${section.title} (副本)`,
  children: section.children?.map(child => duplicateSection(child, `${newId}-${child.id}`))
});

const updateSectionLevel = (section: OutlineSection, delta: number): OutlineSection => {
  const newLevel = Math.max(1, Math.min(5, section.level + delta));
  return {
    ...section,
    level: newLevel,
    children: section.children?.map(child => updateSectionLevel(child, delta))
  };
};

const batchActions: BatchAction[] = [
  { type: 'delete', label: '删除', icon: <Trash2 className="w-4 h-4" />, color: 'text-red-600' },
  { type: 'copy', label: '复制', icon: <Copy className="w-4 h-4" />, color: 'text-blue-600' },
  { type: 'levelUp', label: '提升层级', icon: <ArrowUp className="w-4 h-4" />, color: 'text-green-600' },
  { type: 'levelDown', label: '降低层级', icon: <ArrowDown className="w-4 h-4" />, color: 'text-amber-600' },
  { type: 'clearContent', label: '清空内容', icon: <AlignLeft className="w-4 h-4" />, color: 'text-purple-600' },
];

export const BatchOperations: React.FC<BatchOperationsProps> = ({
  sections,
  onUpdateSections,
  onClose
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<BatchAction | null>(null);
  const [actionProgress, setActionProgress] = useState<{ current: number; total: number } | null>(null);
  
  const flattenedSections = useMemo(() => flattenSections(sections), [sections]);
  
  const filteredSections = useMemo(() => {
    return flattenedSections.filter(section => {
      const matchesSearch = !searchQuery || 
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (section.content && section.content.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesLevel = filterLevel === null || section.level === filterLevel;
      return matchesSearch && matchesLevel;
    });
  }, [flattenedSections, searchQuery, filterLevel]);
  
  const hasChildren = useCallback((sectionId: string): boolean => {
    const section = flattenedSections.find(s => s.id === sectionId);
    return !!(section?.children && section.children.length > 0);
  }, [flattenedSections]);
  
  const getAllDescendantIds = useCallback((sectionId: string): string[] => {
    const section = flattenedSections.find(s => s.id === sectionId);
    if (!section?.children) return [];
    
    const descendantIds: string[] = [];
    const collectIds = (sections: OutlineSection[]) => {
      sections.forEach(s => {
        descendantIds.push(s.id);
        if (s.children?.length) {
          collectIds(s.children);
        }
      });
    };
    collectIds(section.children);
    return descendantIds;
  }, [flattenedSections]);
  
  const toggleSelection = (sectionId: string, includeChildren: boolean = false) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
        if (includeChildren) {
          getAllDescendantIds(sectionId).forEach(id => next.delete(id));
        }
      } else {
        next.add(sectionId);
        if (includeChildren) {
          getAllDescendantIds(sectionId).forEach(id => next.add(id));
        }
      }
      return next;
    });
  };
  
  const selectAll = () => {
    setSelectedIds(new Set(filteredSections.map(s => s.id)));
  };
  
  const deselectAll = () => {
    setSelectedIds(new Set());
  };
  
  const invertSelection = () => {
    setSelectedIds(prev => {
      const next = new Set<string>();
      filteredSections.forEach(s => {
        if (!prev.has(s.id)) {
          next.add(s.id);
        }
      });
      return next;
    });
  };
  
  const toggleExpanded = (sectionId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };
  
  const executeBatchAction = async (action: BatchAction) => {
    if (selectedIds.size === 0) return;
    
    if (action.type === 'delete') {
      setPendingAction(action);
      setShowConfirmDialog(true);
      return;
    }
    
    await performAction(action);
  };
  
  const performAction = async (action: BatchAction) => {
    setActionProgress({ current: 0, total: selectedIds.size });
    
    let newSections = [...sections];
    const idsArray = Array.from(selectedIds);
    
    for (let i = 0; i < idsArray.length; i++) {
      const id = idsArray[i];
      setActionProgress({ current: i + 1, total: idsArray.length });
      
      switch (action.type) {
        case 'delete':
          newSections = removeSectionById(newSections, id);
          break;
          
        case 'copy': {
          const sectionToCopy = findSectionById(newSections, id);
          if (sectionToCopy) {
            const newId = `${id}-copy-${Date.now()}`;
            const copiedSection = duplicateSection(sectionToCopy, newId);
            // Add to the same parent or at root level
            newSections.push(copiedSection);
          }
          break;
        }
        
        case 'levelUp':
        case 'levelDown': {
          const delta = action.type === 'levelUp' ? -1 : 1;
          const updateLevelRecursive = (sections: OutlineSection[]): OutlineSection[] => {
            return sections.map(section => {
              if (section.id === id) {
                return updateSectionLevel(section, delta);
              }
              if (section.children?.length) {
                return { ...section, children: updateLevelRecursive(section.children) };
              }
              return section;
            });
          };
          newSections = updateLevelRecursive(newSections);
          break;
        }
        
        case 'clearContent': {
          const clearContentRecursive = (sections: OutlineSection[]): OutlineSection[] => {
            return sections.map(section => {
              if (section.id === id) {
                return { ...section, content: '' };
              }
              if (section.children?.length) {
                return { ...section, children: clearContentRecursive(section.children) };
              }
              return section;
            });
          };
          newSections = clearContentRecursive(newSections);
          break;
        }
      }
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    onUpdateSections(newSections);
    setActionProgress(null);
    setSelectedIds(new Set());
  };
  
  const confirmDelete = () => {
    if (pendingAction) {
      performAction(pendingAction);
      setShowConfirmDialog(false);
      setPendingAction(null);
    }
  };
  
  const getLevelColor = (level: number): string => {
    const colors = [
      'bg-blue-500',
      'bg-emerald-500',
      'bg-amber-500',
      'bg-purple-500',
      'bg-pink-500'
    ];
    return colors[level - 1] || 'bg-gray-500';
  };
  
  const getLevelName = (level: number): string => {
    const names = ['一级标题', '二级标题', '三级标题', '四级标题', '五级标题'];
    return names[level - 1] || `层级 ${level}`;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">批量操作</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                已选择 {selectedIds.size} 个章节
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={deselectAll}
                className="gap-2"
              >
                <Square className="w-4 h-4" />
                取消选择
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 space-y-3">
          {/* Search and Filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索章节标题或内容..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  {filterLevel ? getLevelName(filterLevel) : '全部层级'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterLevel(null)}>
                  全部层级
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {[1, 2, 3, 4, 5].map(level => (
                  <DropdownMenuItem key={level} onClick={() => setFilterLevel(level)}>
                    <div className={`w-3 h-3 rounded-full ${getLevelColor(level)} mr-2`} />
                    {getLevelName(level)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Selection Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                className="gap-2"
              >
                <CheckSquare className="w-4 h-4" />
                全选
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={invertSelection}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                反选
              </Button>
            </div>
            
            {/* Batch Actions */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">批量操作:</span>
              {batchActions.map(action => (
                <TooltipProvider key={action.type}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executeBatchAction(action)}
                        disabled={selectedIds.size === 0 || !!actionProgress}
                        className={`gap-2 ${action.color}`}
                      >
                        {action.icon}
                        {action.label}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{action.label}选中的 {selectedIds.size} 个章节</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        {actionProgress && (
          <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-700 dark:text-blue-300">
                正在执行操作...
              </span>
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {actionProgress.current} / {actionProgress.total}
              </span>
            </div>
            <div className="h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${(actionProgress.current / actionProgress.total) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
        
        {/* Section List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-1">
            {filteredSections.map((section) => (
              <motion.div
                key={section.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`group flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  selectedIds.has(section.id)
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                style={{ paddingLeft: `${16 + section.depth * 24}px` }}
              >
                {/* Checkbox */}
                <Checkbox
                  checked={selectedIds.has(section.id)}
                  onCheckedChange={() => toggleSelection(section.id)}
                  className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                />
                
                {/* Expand/Collapse */}
                {hasChildren(section.id) ? (
                  <button
                    onClick={() => toggleExpanded(section.id)}
                    className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600"
                  >
                    {expandedIds.has(section.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                ) : (
                  <div className="w-5" />
                )}
                
                {/* Level Indicator */}
                <div className={`w-3 h-3 rounded-full ${getLevelColor(section.level)}`} />
                
                {/* Path */}
                <span className="text-xs text-gray-400 font-mono w-12">
                  {section.path.join('.')}
                </span>
                
                {/* Title */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {section.title}
                  </div>
                  {section.content && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {section.content.slice(0, 100)}
                    </div>
                  )}
                </div>
                
                {/* Tags */}
                {section.tags && section.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    {section.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {section.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{section.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleSelection(section.id, true)}
                        >
                          {selectedIds.has(section.id) ? (
                            <CheckSquare className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{selectedIds.has(section.id) ? '取消选择' : '选择'}包含子章节</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </motion.div>
            ))}
            
            {filteredSections.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">没有找到匹配的章节</p>
                <p className="text-xs mt-1">尝试调整搜索条件</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              共 {flattenedSections.length} 个章节，已选择 {selectedIds.size} 个
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                关闭
              </Button>
              {selectedIds.size > 0 && (
                <Button
                  variant="default"
                  onClick={deselectAll}
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  完成
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              确认删除
            </DialogTitle>
            <DialogDescription>
              您即将删除 {selectedIds.size} 个章节及其所有子章节。此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete} className="gap-2">
              <Trash2 className="w-4 h-4" />
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default BatchOperations;
