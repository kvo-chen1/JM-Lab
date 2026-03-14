import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitCompare,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Edit3,
  ArrowRight,
  Clock,
  Save,
  Trash2,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { OutlineSection } from './types';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';

interface OutlineVersion {
  id: string;
  name: string;
  timestamp: number;
  sections: OutlineSection[];
  description?: string;
  author?: string;
}

interface ComparisonResult {
  added: OutlineSection[];
  removed: OutlineSection[];
  modified: {
    before: OutlineSection;
    after: OutlineSection;
    changes: string[];
  }[];
  unchanged: OutlineSection[];
  stats: {
    totalBefore: number;
    totalAfter: number;
    addedCount: number;
    removedCount: number;
    modifiedCount: number;
  };
}

interface OutlineComparisonProps {
  currentSections: OutlineSection[];
  savedVersions: OutlineVersion[];
  onLoadVersion: (version: OutlineVersion) => void;
  onSaveVersion: (name: string, description?: string) => void;
  onDeleteVersion: (versionId: string) => void;
  onClose: () => void;
}

const flattenSections = (sections: OutlineSection[]): OutlineSection[] => {
  const result: OutlineSection[] = [];
  const traverse = (items: OutlineSection[]) => {
    items.forEach(item => {
      result.push(item);
      if (item.children?.length) {
        traverse(item.children);
      }
    });
  };
  traverse(sections);
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

const compareSections = (before: OutlineSection[], after: OutlineSection[]): ComparisonResult => {
  const flatBefore = flattenSections(before);
  const flatAfter = flattenSections(after);
  
  const beforeMap = new Map(flatBefore.map(s => [s.id, s]));
  const afterMap = new Map(flatAfter.map(s => [s.id, s]));
  
  const added: OutlineSection[] = [];
  const removed: OutlineSection[] = [];
  const modified: ComparisonResult['modified'] = [];
  const unchanged: OutlineSection[] = [];
  
  // Find added and modified
  flatAfter.forEach(afterSection => {
    const beforeSection = beforeMap.get(afterSection.id);
    if (!beforeSection) {
      added.push(afterSection);
    } else {
      const changes: string[] = [];
      if (beforeSection.title !== afterSection.title) {
        changes.push(`标题: "${beforeSection.title}" → "${afterSection.title}"`);
      }
      if (beforeSection.content !== afterSection.content) {
        changes.push('内容已更新');
      }
      if (beforeSection.level !== afterSection.level) {
        changes.push(`层级: ${beforeSection.level} → ${afterSection.level}`);
      }
      
      if (changes.length > 0) {
        modified.push({ before: beforeSection, after: afterSection, changes });
      } else {
        unchanged.push(afterSection);
      }
    }
  });
  
  // Find removed
  flatBefore.forEach(beforeSection => {
    if (!afterMap.has(beforeSection.id)) {
      removed.push(beforeSection);
    }
  });
  
  return {
    added,
    removed,
    modified,
    unchanged,
    stats: {
      totalBefore: flatBefore.length,
      totalAfter: flatAfter.length,
      addedCount: added.length,
      removedCount: removed.length,
      modifiedCount: modified.length
    }
  };
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const OutlineComparison: React.FC<OutlineComparisonProps> = ({
  currentSections,
  savedVersions,
  onLoadVersion,
  onSaveVersion,
  onDeleteVersion,
  onClose
}) => {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [versionDescription, setVersionDescription] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'added' | 'removed' | 'modified'>('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  const selectedVersion = useMemo(() => 
    savedVersions.find(v => v.id === selectedVersionId),
    [savedVersions, selectedVersionId]
  );
  
  const comparisonResult = useMemo(() => {
    if (!selectedVersion) return null;
    return compareSections(selectedVersion.sections, currentSections);
  }, [selectedVersion, currentSections]);
  
  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  const handleSaveVersion = () => {
    if (versionName.trim()) {
      onSaveVersion(versionName.trim(), versionDescription.trim() || undefined);
      setVersionName('');
      setVersionDescription('');
      setSaveDialogOpen(false);
    }
  };
  
  const getChangeTypeColor = (type: 'added' | 'removed' | 'modified') => {
    switch (type) {
      case 'added': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'removed': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'modified': return 'bg-amber-500/10 text-amber-600 border-amber-200';
    }
  };
  
  const getChangeTypeIcon = (type: 'added' | 'removed' | 'modified') => {
    switch (type) {
      case 'added': return <Plus className="w-4 h-4" />;
      case 'removed': return <Minus className="w-4 h-4" />;
      case 'modified': return <Edit3 className="w-4 h-4" />;
    }
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
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <GitCompare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">大纲版本对比</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                比较不同版本的大纲，查看变更历史
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(true)}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              保存当前版本
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Sidebar - Version List */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">历史版本</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                共 {savedVersions.length} 个已保存版本
              </p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {/* Current Version */}
                <div
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedVersionId === null
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedVersionId(null)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default" className="bg-green-500">当前</Badge>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      当前编辑版本
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentSections.length} 个章节
                  </p>
                </div>
                
                {/* Saved Versions */}
                {savedVersions.map((version) => (
                  <motion.div
                    key={version.id}
                    layout
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all group ${
                      selectedVersionId === version.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => setSelectedVersionId(version.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {version.name}
                        </span>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteVersion(version.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>删除版本</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    {version.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                        {version.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{formatTime(version.timestamp)}</span>
                      <span>{flattenSections(version.sections).length} 章节</span>
                    </div>
                    {version.author && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                        <span>by {version.author}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {savedVersions.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">暂无保存的版本</p>
                    <p className="text-xs mt-1">点击上方按钮保存当前版本</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          
          {/* Right Content - Comparison */}
          <div className="flex-1 flex flex-col">
            {selectedVersion && comparisonResult ? (
              <>
                {/* Stats Bar */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        对比: <strong className="text-gray-900 dark:text-white">{selectedVersion.name}</strong>
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        当前: <strong className="text-gray-900 dark:text-white">当前编辑版本</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onLoadVersion(selectedVersion)}
                        className="gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        恢复此版本
                      </Button>
                    </div>
                  </div>
                  
                  {/* Statistics */}
                  <div className="grid grid-cols-5 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {comparisonResult.stats.totalBefore}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">原版本章节</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="text-2xl font-bold text-green-600">
                        +{comparisonResult.stats.addedCount}
                      </div>
                      <div className="text-xs text-green-600/70">新增章节</div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="text-2xl font-bold text-red-600">
                        -{comparisonResult.stats.removedCount}
                      </div>
                      <div className="text-xs text-red-600/70">删除章节</div>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="text-2xl font-bold text-amber-600">
                        ~{comparisonResult.stats.modifiedCount}
                      </div>
                      <div className="text-xs text-amber-600/70">修改章节</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-2xl font-bold text-blue-600">
                        {comparisonResult.stats.totalAfter}
                      </div>
                      <div className="text-xs text-blue-600/70">当前章节</div>
                    </div>
                  </div>
                </div>
                
                {/* Filter Tabs */}
                <div className="px-4 pt-4">
                  <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="all" className="gap-2">
                        <BarChart3 className="w-4 h-4" />
                        全部变更
                        <Badge variant="secondary" className="ml-1">
                          {comparisonResult.added.length + comparisonResult.removed.length + comparisonResult.modified.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="added" className="gap-2 text-green-600">
                        <Plus className="w-4 h-4" />
                        新增
                        <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700">
                          {comparisonResult.added.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="removed" className="gap-2 text-red-600">
                        <Minus className="w-4 h-4" />
                        删除
                        <Badge variant="secondary" className="ml-1 bg-red-100 text-red-700">
                          {comparisonResult.removed.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="modified" className="gap-2 text-amber-600">
                        <Edit3 className="w-4 h-4" />
                        修改
                        <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-700">
                          {comparisonResult.modified.length}
                        </Badge>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                {/* Comparison List */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {/* Added Sections */}
                    {(filterType === 'all' || filterType === 'added') && comparisonResult.added.map((section) => (
                      <motion.div
                        key={`added-${section.id}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <Plus className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-green-500 text-white">新增</Badge>
                              <span className="text-sm text-gray-500">层级 {section.level}</span>
                            </div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                              {section.title}
                            </h4>
                            {section.content && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {section.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Removed Sections */}
                    {(filterType === 'all' || filterType === 'removed') && comparisonResult.removed.map((section) => (
                      <motion.div
                        key={`removed-${section.id}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                            <Minus className="w-4 h-4 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-red-500 text-white">删除</Badge>
                              <span className="text-sm text-gray-500">层级 {section.level}</span>
                            </div>
                            <h4 className="font-medium text-gray-500 line-through mb-1">
                              {section.title}
                            </h4>
                            {section.content && (
                              <p className="text-sm text-gray-400 line-clamp-2 line-through">
                                {section.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Modified Sections */}
                    {(filterType === 'all' || filterType === 'modified') && comparisonResult.modified.map(({ before, after, changes }) => (
                      <motion.div
                        key={`modified-${after.id}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <Edit3 className="w-4 h-4 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-amber-500 text-white">修改</Badge>
                              <span className="text-sm text-gray-500">层级 {after.level}</span>
                            </div>
                            
                            {/* Changes List */}
                            <div className="space-y-2 mb-3">
                              {changes.map((change, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                  <span className="text-gray-700 dark:text-gray-300">{change}</span>
                                </div>
                              ))}
                            </div>
                            
                            {/* Expandable Details */}
                            <button
                              onClick={() => toggleSection(after.id)}
                              className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 transition-colors"
                            >
                              {expandedSections.has(after.id) ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  收起详情
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  查看详情
                                </>
                              )}
                            </button>
                            
                            <AnimatePresence>
                              {expandedSections.has(after.id) && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="mt-3 space-y-3 overflow-hidden"
                                >
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-red-100/50 dark:bg-red-900/20 p-3 rounded-lg">
                                      <div className="text-xs text-red-600 mb-1">修改前</div>
                                      <div className="text-sm text-gray-700 dark:text-gray-300">
                                        <div className="font-medium line-through">{before.title}</div>
                                        {before.content && (
                                          <div className="mt-1 text-gray-500 line-through line-clamp-3">
                                            {before.content}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="bg-green-100/50 dark:bg-green-900/20 p-3 rounded-lg">
                                      <div className="text-xs text-green-600 mb-1">修改后</div>
                                      <div className="text-sm text-gray-700 dark:text-gray-300">
                                        <div className="font-medium">{after.title}</div>
                                        {after.content && (
                                          <div className="mt-1 text-gray-500 line-clamp-3">
                                            {after.content}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {comparisonResult.added.length === 0 && 
                     comparisonResult.removed.length === 0 && 
                     comparisonResult.modified.length === 0 && (
                      <div className="text-center py-12 text-gray-400">
                        <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium text-gray-600 dark:text-gray-400">没有变更</p>
                        <p className="text-sm mt-1">两个版本完全相同</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <GitCompare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-400">选择版本进行对比</p>
                  <p className="text-sm mt-1">从左侧列表选择一个历史版本</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Save Dialog Overlay */}
        <AnimatePresence>
          {saveDialogOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4"
              >
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  保存当前版本
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      版本名称 *
                    </label>
                    <input
                      type="text"
                      value={versionName}
                      onChange={(e) => setVersionName(e.target.value)}
                      placeholder="例如：第一版、修订版"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      版本描述
                    </label>
                    <textarea
                      value={versionDescription}
                      onChange={(e) => setVersionDescription(e.target.value)}
                      placeholder="描述这个版本的主要变更..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                    取消
                  </Button>
                  <Button
                    onClick={handleSaveVersion}
                    disabled={!versionName.trim()}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    保存
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default OutlineComparison;
