import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Eye, Code, Maximize2, Minimize2, Bold, Italic, Underline, Strikethrough, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heading3, Quote, Link, Undo, Redo } from 'lucide-react';

interface SimpleHtmlEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  height?: number | string;
}

type ViewMode = 'split' | 'preview' | 'code';

export const SimpleHtmlEditor: React.FC<SimpleHtmlEditorProps> = ({
  content,
  onChange,
  placeholder = '请输入内容...',
  disabled = false,
  height = 400,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);

  // 处理 HTML 内容，确保在预览中安全渲染
  const sanitizeHtml = (html: string): string => {
    const sanitized = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    return sanitized;
  };

  // 将 HTML 内容转换为可编辑的格式
  const processContentForEditing = (html: string): string => {
    return sanitizeHtml(html);
  };

  // 处理预览区域的输入事件
  const handlePreviewInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    if (disabled || isUpdatingRef.current) return;
    
    const newContent = e.currentTarget.innerHTML;
    if (newContent !== content) {
      onChange(newContent);
    }
  }, [content, onChange, disabled]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '  ');
    }
  }, []);

  // 处理粘贴事件，只保留纯文本和基本格式
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
    document.execCommand('insertHTML', false, sanitizeHtml(text));
  }, []);

  // 执行编辑命令
  const execCommand = useCallback((command: string, value: string = '') => {
    if (previewRef.current && !disabled) {
      previewRef.current.focus();
      document.execCommand(command, false, value);
      // 触发 onChange 更新内容
      const newContent = previewRef.current.innerHTML;
      onChange(newContent);
    }
  }, [onChange, disabled]);

  // 同步外部 content 变化到预览区域
  useEffect(() => {
    if (previewRef.current && !isUpdatingRef.current) {
      const currentHtml = previewRef.current.innerHTML;
      const newHtml = processContentForEditing(content);
      if (currentHtml !== newHtml) {
        isUpdatingRef.current = true;
        previewRef.current.innerHTML = newHtml;
        isUpdatingRef.current = false;
      }
    }
  }, [content]);

  const containerHeight = isFullscreen ? 'calc(100vh - 200px)' : height;

  const renderToolbar = () => (
    <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">HTML 编辑器</span>
        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-2" />
        <div className="flex items-center gap-1 bg-white dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('code')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded transition-colors ${
              viewMode === 'code'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
            title="源代码模式"
          >
            <Code className="w-3.5 h-3.5" />
            代码
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded transition-colors ${
              viewMode === 'split'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
            title="分屏模式"
          >
            <span className="w-3.5 h-3.5 flex items-center justify-center">◫</span>
            分屏
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded transition-colors ${
              viewMode === 'preview'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
            title="预览编辑模式"
          >
            <Eye className="w-3.5 h-3.5" />
            预览编辑
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title={isFullscreen ? '退出全屏' : '全屏编辑'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  // 格式化工具栏
  const renderFormatToolbar = () => (
    <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex-wrap">
      <div className="flex items-center gap-0.5">
        <button onClick={() => execCommand('undo')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="撤销"><Undo className="w-4 h-4" /></button>
        <button onClick={() => execCommand('redo')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="重做"><Redo className="w-4 h-4" /></button>
      </div>
      <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
      <div className="flex items-center gap-0.5">
        <button onClick={() => execCommand('formatBlock', 'H1')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="标题 1"><Heading1 className="w-4 h-4" /></button>
        <button onClick={() => execCommand('formatBlock', 'H2')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="标题 2"><Heading2 className="w-4 h-4" /></button>
        <button onClick={() => execCommand('formatBlock', 'H3')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="标题 3"><Heading3 className="w-4 h-4" /></button>
      </div>
      <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
      <div className="flex items-center gap-0.5">
        <button onClick={() => execCommand('bold')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="加粗"><Bold className="w-4 h-4" /></button>
        <button onClick={() => execCommand('italic')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="斜体"><Italic className="w-4 h-4" /></button>
        <button onClick={() => execCommand('underline')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="下划线"><Underline className="w-4 h-4" /></button>
        <button onClick={() => execCommand('strikeThrough')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="删除线"><Strikethrough className="w-4 h-4" /></button>
      </div>
      <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
      <div className="flex items-center gap-0.5">
        <button onClick={() => execCommand('justifyLeft')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="左对齐"><AlignLeft className="w-4 h-4" /></button>
        <button onClick={() => execCommand('justifyCenter')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="居中"><AlignCenter className="w-4 h-4" /></button>
        <button onClick={() => execCommand('justifyRight')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="右对齐"><AlignRight className="w-4 h-4" /></button>
      </div>
      <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
      <div className="flex items-center gap-0.5">
        <button onClick={() => execCommand('insertUnorderedList')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="无序列表"><List className="w-4 h-4" /></button>
        <button onClick={() => execCommand('insertOrderedList')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="有序列表"><ListOrdered className="w-4 h-4" /></button>
        <button onClick={() => execCommand('formatBlock', 'BLOCKQUOTE')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="引用"><Quote className="w-4 h-4" /></button>
      </div>
      <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
      <div className="flex items-center gap-0.5">
        <button onClick={() => {
          const url = prompt('请输入链接地址:');
          if (url) execCommand('createLink', url);
        }} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="插入链接"><Link className="w-4 h-4" /></button>
      </div>
    </div>
  );

  const renderCodeEditor = () => (
    <div className="relative flex-1 min-h-0">
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full h-full px-4 py-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-sm resize-none focus:outline-none"
        spellCheck={false}
      />
      {content === '' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-gray-400 dark:text-gray-600 text-sm">{placeholder}</span>
        </div>
      )}
    </div>
  );

  const renderEditablePreview = () => (
    <div className="flex-1 min-h-0 bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
      {renderFormatToolbar()}
      <div className="flex-1 overflow-auto">
        <div
          ref={previewRef}
          className="p-4 prose prose-sm max-w-none dark:prose-invert focus:outline-none min-h-full"
          contentEditable={!disabled}
          onInput={handlePreviewInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          dangerouslySetInnerHTML={{ __html: processContentForEditing(content) || '<p><br></p>' }}
        />
      </div>
    </div>
  );

  const renderReadonlyPreview = () => (
    <div className="flex-1 min-h-0 overflow-auto bg-white dark:bg-gray-900">
      <div 
        className="prose prose-sm max-w-none dark:prose-invert p-4"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) || '<p class="text-gray-400 italic">暂无内容</p>' }}
      />
    </div>
  );

  const renderContent = () => {
    switch (viewMode) {
      case 'code':
        return (
          <div className="flex flex-col h-full border border-gray-200 dark:border-gray-700 rounded-b-lg">
            {renderCodeEditor()}
          </div>
        );
      case 'preview':
        return (
          <div className="flex flex-col h-full border border-gray-200 dark:border-gray-700 rounded-b-lg">
            {renderEditablePreview()}
          </div>
        );
      case 'split':
      default:
        return (
          <div className="flex h-full border border-gray-200 dark:border-gray-700 rounded-b-lg overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200 dark:border-gray-700">
              <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">源代码</span>
              </div>
              {renderCodeEditor()}
            </div>
            <div className="flex-1 flex flex-col min-w-0">
              <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">实时预览（可编辑）</span>
              </div>
              {renderEditablePreview()}
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`space-y-2 ${isFullscreen ? 'fixed inset-0 z-[70] bg-white dark:bg-gray-900 p-4' : ''}`}>
      {renderToolbar()}
      <div style={{ height: containerHeight }}>
        {renderContent()}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            富文本编辑器加载失败，已切换为 HTML 编辑器
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>{content.length} 字符</span>
        </div>
      </div>
    </div>
  );
};
