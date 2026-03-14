import React, { useState, useCallback, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import type { Template } from '../TemplatePreview';
import type { OutlineSection, OutlineTemplate, OutlineValidationResult } from './types';
import {
  convertTemplateToOutline,
  flattenSections,
  addSectionAtIndex,
  removeSectionById,
  updateSectionById,
  moveSection,
  reorderSections,
  validateOutline,
  createEmptySection,
  exportOutlineToMarkdown,
  exportOutlineToJSON,
} from './utils';
import { OutlineSectionItem } from './OutlineSectionItem';
import { OutlineToolbar } from './OutlineToolbar';
import { OutlinePreview } from './OutlinePreview';
import { OutlineValidationPanel } from './OutlineValidationPanel';
import { OutlineTemplateManager } from './OutlineTemplateManager';
import {
  ChevronLeft,
  Layout,
  Eye,
  Save,
  Download,
  CheckCircle,
  AlertCircle,
  Undo,
  Redo,
  Sparkles,
  FileText,
} from 'lucide-react';

interface OutlineEditorProps {
  template: Template;
  onClose: () => void;
  onGenerate: (outline: OutlineTemplate, formData: Record<string, string>) => void;
  initialFormData?: Record<string, string>;
}

interface HistoryState {
  sections: OutlineSection[];
  action: string;
}

export const OutlineEditor: React.FC<OutlineEditorProps> = ({
  template,
  onClose,
  onGenerate,
  initialFormData = {},
}) => {
  const { isDark } = useTheme();
  const [outline, setOutline] = useState<OutlineTemplate>(() =>
    convertTemplateToOutline(template)
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<string>>(() => {
    const allIds = new Set<string>();
    const collectIds = (sections: OutlineSection[]) => {
      sections.forEach((section) => {
        allIds.add(section.id);
        if (section.children) collectIds(section.children);
      });
    };
    collectIds(convertTemplateToOutline(template).sections);
    return allIds;
  });
  const [validationResult, setValidationResult] = useState<OutlineValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
  });
  const [isDirty, setIsDirty] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [activePanel, setActivePanel] = useState<'editor' | 'preview' | 'validation'>('editor');
  const [formData, setFormData] = useState<Record<string, string>>(initialFormData);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [history, setHistory] = useState<HistoryState[]>([
    { sections: convertTemplateToOutline(template).sections, action: '初始状态' },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const flatSections = flattenSections(outline.sections);

  useEffect(() => {
    const result = validateOutline(outline);
    setValidationResult(result);
  }, [outline]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if ((e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
          e.preventDefault();
          handleRedo();
        } else if (e.key === 's') {
          e.preventDefault();
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyIndex]);

  const addToHistory = useCallback((sections: OutlineSection[], action: string) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ sections: JSON.parse(JSON.stringify(sections)), action });
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
    setIsDirty(true);
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setOutline((prev) => ({
        ...prev,
        sections: JSON.parse(JSON.stringify(history[newIndex].sections)),
      }));
      toast.success(`已撤销: ${history[historyIndex].action}`);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setOutline((prev) => ({
        ...prev,
        sections: JSON.parse(JSON.stringify(history[newIndex].sections)),
      }));
      toast.success(`已重做: ${history[newIndex].action}`);
    }
  }, [history, historyIndex]);

  const handleAddSection = useCallback(
    (parentId?: string, index?: number) => {
      const parent = parentId ? flatSections.find((s) => s.id === parentId) : null;
      const level = parent ? parent.level + 1 : 1;
      const newSection = createEmptySection(level, index ?? 0);

      const newSections = addSectionAtIndex(outline.sections, newSection, parentId, index);
      setOutline((prev) => ({ ...prev, sections: newSections }));
      addToHistory(newSections, '添加章节');
      setSelectedSectionId(newSection.id);
      setExpandedSectionIds((prev) => new Set([...prev, newSection.id]));
    },
    [outline.sections, flatSections, addToHistory]
  );

  const handleRemoveSection = useCallback(
    (sectionId: string) => {
      const section = flatSections.find((s) => s.id === sectionId);
      if (!section) return;

      if (flatSections.length <= 1) {
        toast.error('至少保留一个章节');
        return;
      }

      const newSections = removeSectionById(outline.sections, sectionId);
      setOutline((prev) => ({ ...prev, sections: newSections }));
      addToHistory(newSections, '删除章节');

      if (selectedSectionId === sectionId) {
        setSelectedSectionId(null);
      }

      toast.success('章节已删除');
    },
    [outline.sections, flatSections, selectedSectionId, addToHistory]
  );

  const handleUpdateSection = useCallback(
    (sectionId: string, updates: Partial<OutlineSection>) => {
      const newSections = updateSectionById(outline.sections, sectionId, updates);
      setOutline((prev) => ({ ...prev, sections: newSections }));
      setIsDirty(true);
    },
    [outline.sections]
  );

  const handleMoveSection = useCallback(
    (sectionId: string, direction: 'up' | 'down' | 'left' | 'right') => {
      const newSections = moveSection(outline.sections, sectionId, direction);
      setOutline((prev) => ({ ...prev, sections: newSections }));
      addToHistory(newSections, `移动章节 ${direction}`);
    },
    [outline.sections, addToHistory]
  );

  const handleReorderSections = useCallback(
    (sourceIndex: number, targetIndex: number) => {
      const newSections = reorderSections(outline.sections, sourceIndex, targetIndex);
      setOutline((prev) => ({ ...prev, sections: newSections }));
      addToHistory(newSections, '重新排序');
    },
    [outline.sections, addToHistory]
  );

  const handleToggleExpand = useCallback((sectionId: string) => {
    setExpandedSectionIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    const allIds = new Set<string>();
    const collectIds = (sections: OutlineSection[]) => {
      sections.forEach((section) => {
        allIds.add(section.id);
        if (section.children) collectIds(section.children);
      });
    };
    collectIds(outline.sections);
    setExpandedSectionIds(allIds);
  }, [outline.sections]);

  const handleCollapseAll = useCallback(() => {
    setExpandedSectionIds(new Set());
  }, []);

  const handleSave = useCallback(() => {
    const outlineToSave = {
      ...outline,
      updatedAt: Date.now(),
      isCustom: true,
    };

    const savedOutlines = JSON.parse(localStorage.getItem('custom_outlines') || '[]');
    const existingIndex = savedOutlines.findIndex((o: OutlineTemplate) => o.id === outline.id);

    if (existingIndex >= 0) {
      savedOutlines[existingIndex] = outlineToSave;
    } else {
      savedOutlines.push(outlineToSave);
    }

    localStorage.setItem('custom_outlines', JSON.stringify(savedOutlines));
    setIsDirty(false);
    toast.success('大纲已保存');
  }, [outline]);

  const handleExport = useCallback(
    (format: 'markdown' | 'json') => {
      let content = '';
      let filename = '';
      let mimeType = '';

      switch (format) {
        case 'markdown':
          content = exportOutlineToMarkdown(outline);
          filename = `${outline.name}.md`;
          mimeType = 'text/markdown';
          break;
        case 'json':
          content = exportOutlineToJSON(outline);
          filename = `${outline.name}.json`;
          mimeType = 'application/json';
          break;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`已导出为 ${format.toUpperCase()}`);
      setShowExportMenu(false);
    },
    [outline]
  );

  const handleLoadTemplate = useCallback((loadedOutline: OutlineTemplate) => {
    setOutline(loadedOutline);
    setHistory([{ sections: loadedOutline.sections, action: '加载模板' }]);
    setHistoryIndex(0);
    setIsDirty(false);
    setSelectedSectionId(null);

    const allIds = new Set<string>();
    const collectIds = (sections: OutlineSection[]) => {
      sections.forEach((section) => {
        allIds.add(section.id);
        if (section.children) collectIds(section.children);
      });
    };
    collectIds(loadedOutline.sections);
    setExpandedSectionIds(allIds);

    toast.success('模板已加载');
    setShowTemplateManager(false);
  }, []);

  const handleGenerate = useCallback(() => {
    if (!validationResult.isValid) {
      toast.error('请修复验证错误后再生成');
      setActivePanel('validation');
      return;
    }

    onGenerate(outline, formData);
  }, [outline, formData, validationResult, onGenerate]);

  const renderSectionTree = (sections: OutlineSection[], depth: number = 0) => {
    return sections.map((section, index) => (
      <div key={section.id}>
        <OutlineSectionItem
          section={section}
          depth={depth}
          isSelected={selectedSectionId === section.id}
          isExpanded={expandedSectionIds.has(section.id)}
          canMoveUp={index > 0 || depth > 0}
          canMoveDown={index < sections.length - 1 || section.children !== undefined}
          canIndent={depth < 5}
          canOutdent={depth > 0}
          onSelect={() => setSelectedSectionId(section.id)}
          onToggleExpand={() => handleToggleExpand(section.id)}
          onUpdate={(updates) => handleUpdateSection(section.id, updates)}
          onRemove={() => handleRemoveSection(section.id)}
          onMove={(direction) => handleMoveSection(section.id, direction)}
          onAddChild={() => handleAddSection(section.id)}
        />
        {section.children &&
          expandedSectionIds.has(section.id) &&
          renderSectionTree(section.children, depth + 1)}
      </div>
    ));
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <header
        className={`flex items-center justify-between px-4 h-14 border-b ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-blue-500/20' : 'bg-blue-100'
              }`}
            >
              <Layout className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h1
                className={`font-semibold text-sm ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                大纲编辑器
              </h1>
              <p
                className={`text-xs ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {outline.name}
                {isDirty && (
                  <span className="ml-1 text-amber-500">•</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center rounded-lg p-1 ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}
          >
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={`p-1.5 rounded transition-colors ${
                historyIndex <= 0
                  ? 'opacity-50 cursor-not-allowed'
                  : isDark
                  ? 'hover:bg-gray-600'
                  : 'hover:bg-gray-200'
              }`}
              title="撤销 (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className={`p-1.5 rounded transition-colors ${
                historyIndex >= history.length - 1
                  ? 'opacity-50 cursor-not-allowed'
                  : isDark
                  ? 'hover:bg-gray-600'
                  : 'hover:bg-gray-200'
              }`}
              title="重做 (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

          <button
            onClick={() => setActivePanel('editor')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activePanel === 'editor'
                ? isDark
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-blue-100 text-blue-700'
                : isDark
                ? 'text-gray-400 hover:bg-gray-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Layout className="w-4 h-4 inline mr-1" />
            编辑
          </button>
          <button
            onClick={() => setActivePanel('preview')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activePanel === 'preview'
                ? isDark
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-blue-100 text-blue-700'
                : isDark
                ? 'text-gray-400 hover:bg-gray-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-1" />
            预览
          </button>
          <button
            onClick={() => setActivePanel('validation')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              activePanel === 'validation'
                ? isDark
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-blue-100 text-blue-700'
                : isDark
                ? 'text-gray-400 hover:bg-gray-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {validationResult.isValid ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            验证
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

          <button
            onClick={handleSave}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="保存 (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'hover:bg-gray-700 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="导出"
            >
              <Download className="w-4 h-4" />
            </button>
            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowExportMenu(false)}
                />
                <div
                  className={`absolute right-0 top-full mt-1 w-40 rounded-lg shadow-lg border py-1 z-50 ${
                    isDark
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <button
                    onClick={() => handleExport('markdown')}
                    className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                      isDark
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="w-4 h-4 inline mr-2" />
                    导出 Markdown
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                      isDark
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-mono text-xs mr-2">{'{}'}</span>
                    导出 JSON
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setShowTemplateManager(true)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            模板库
          </button>

          <button
            onClick={handleGenerate}
            disabled={!validationResult.isValid}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              validationResult.isValid
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI生成文案
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {activePanel === 'editor' && (
          <>
            <div
              className={`flex-1 overflow-auto ${
                isDark ? 'bg-gray-900' : 'bg-gray-50'
              }`}
            >
              <div className="max-w-3xl mx-auto p-6">
                <OutlineToolbar
                  onAddSection={() => handleAddSection()}
                  onExpandAll={handleExpandAll}
                  onCollapseAll={handleCollapseAll}
                  sectionCount={flatSections.length}
                />

                <div
                  className={`mt-4 rounded-xl border ${
                    isDark
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {renderSectionTree(outline.sections)}
                </div>

                {validationResult.warnings.length > 0 && (
                  <div
                    className={`mt-4 p-4 rounded-xl ${
                      isDark
                        ? 'bg-amber-500/10 border border-amber-500/20'
                        : 'bg-amber-50 border border-amber-200'
                    }`}
                  >
                    <h4
                      className={`text-sm font-medium mb-2 ${
                        isDark ? 'text-amber-400' : 'text-amber-700'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      优化建议
                    </h4>
                    <ul
                      className={`text-xs space-y-1 ${
                        isDark ? 'text-amber-300' : 'text-amber-600'
                      }`}
                    >
                      {validationResult.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`w-80 border-l overflow-auto ${
                isDark
                  ? 'border-gray-700 bg-gray-800'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="p-4">
                <h3
                  className={`font-semibold mb-4 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  大纲信息
                </h3>

                <div className="space-y-4">
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      模板名称
                    </label>
                    <input
                      type="text"
                      value={outline.name}
                      onChange={(e) =>
                        setOutline((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className={`w-full px-3 py-2 rounded-lg text-sm border ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      描述
                    </label>
                    <textarea
                      value={outline.description}
                      onChange={(e) =>
                        setOutline((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg text-sm border resize-none ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4
                      className={`text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      统计信息
                    </h4>
                    <div
                      className={`text-sm space-y-1 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      <p>总章节数: {flatSections.length}</p>
                      <p>
                        一级章节:{' '}
                        {outline.sections.length}
                      </p>
                      <p>
                        最大层级:{' '}
                        {Math.max(...flatSections.map((s) => s.level), 1)}
                      </p>
                    </div>
                  </div>

                  {selectedSectionId && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4
                        className={`text-sm font-medium mb-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        选中章节
                      </h4>
                      {(() => {
                        const section = flatSections.find(
                          (s) => s.id === selectedSectionId
                        );
                        if (!section) return null;
                        return (
                          <div
                            className={`text-sm ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}
                          >
                            <p className="font-medium text-gray-900 dark:text-white">
                              {section.name}
                            </p>
                            <p>层级: {section.level}</p>
                            <p>顺序: {section.order + 1}</p>
                            {section.description && (
                              <p className="mt-1 text-xs">
                                {section.description}
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activePanel === 'preview' && (
          <div className="flex-1 overflow-auto">
            <OutlinePreview outline={outline} />
          </div>
        )}

        {activePanel === 'validation' && (
          <div className="flex-1 overflow-auto">
            <OutlineValidationPanel validationResult={validationResult} />
          </div>
        )}
      </div>

      {showTemplateManager && (
        <OutlineTemplateManager
          onClose={() => setShowTemplateManager(false)}
          onLoad={handleLoadTemplate}
          currentOutline={outline}
        />
      )}
    </div>
  );
};

export default OutlineEditor;
