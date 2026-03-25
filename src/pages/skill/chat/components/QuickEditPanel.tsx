import React, { useState, useRef, useCallback } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Send,
  RotateCcw,
  Pencil,
  MessageSquarePlus,
  X,
  Loader2,
  ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

export interface QuickEditPanelProps {
  imageUrl: string;
  workId: string;
  onEdit: (prompt: string, attachments?: File[]) => void;
  onOpenFullEditor: () => void;
  onAddToChat: (content: string, imageUrl?: string) => void;
  onReset: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

interface Attachment {
  id: string;
  file: File;
  preview: string;
}

export const QuickEditPanel: React.FC<QuickEditPanelProps> = ({
  imageUrl,
  workId,
  onEdit,
  onOpenFullEditor,
  onAddToChat,
  onReset,
  onCancel,
  isProcessing = false,
}) => {
  const { isDark } = useTheme();
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整文本框高度
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, []);

  // 处理文本变化
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    adjustTextareaHeight();
  };

  // 处理文件选择
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    const remainingSlots = 5 - attachments.length;

    if (remainingSlots <= 0) {
      toast.error('最多只能添加 5 张图片');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`文件 "${file.name}" 不是有效的图片格式`);
        return;
      }

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`图片 "${file.name}" 超过 10MB 限制`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        newAttachments.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          preview,
        });

        if (newAttachments.length === filesToProcess.length) {
          setAttachments((prev) => [...prev, ...newAttachments]);
        }
      };
      reader.readAsDataURL(file);
    });

    // 重置 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [attachments.length]);

  // 移除附件
  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  }, []);

  // 处理发送
  const handleSend = useCallback(() => {
    if (!prompt.trim() && attachments.length === 0) {
      toast.error('请输入编辑描述或添加参考图片');
      return;
    }

    const files = attachments.map((att) => att.file);
    onEdit(prompt.trim(), files.length > 0 ? files : undefined);

    // 清空输入
    setPrompt('');
    setAttachments([]);
  }, [prompt, attachments, onEdit]);

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 处理添加到对话
  const handleAddToChat = useCallback(() => {
    const content = prompt.trim() || '查看编辑后的图片';
    onAddToChat(content, imageUrl);
    toast.success('已添加到对话');
  }, [prompt, imageUrl, onAddToChat]);

  // 处理重置
  const handleReset = useCallback(() => {
    setPrompt('');
    setAttachments([]);
    onReset();
    toast.success('已重置编辑');
  }, [onReset]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`rounded-lg overflow-hidden ${
        isDark ? 'bg-gray-900/90' : 'bg-white'
      }`}
    >
      {/* 输入框区域 */}
      <div
        className={`relative flex items-start gap-2 p-3 rounded-t-lg border-2 transition-all duration-200 ${
          isFocused
            ? isDark
              ? 'border-purple-500 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
              : 'border-purple-400 shadow-[0_0_12px_rgba(139,92,246,0.2)]'
            : isDark
              ? 'border-gray-700'
              : 'border-gray-200'
        } ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}
      >
        {/* 添加附件按钮 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing || attachments.length >= 5}
          className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
            isDark
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-gray-200'
              : 'bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          } ${attachments.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="添加参考图片"
        >
          <Plus className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* 文本输入框 */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={handlePromptChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="描述你想要修改的内容"
            disabled={isProcessing}
            rows={1}
            className={`w-full resize-none bg-transparent border-0 outline-none py-2.5 px-1 min-h-[40px] max-h-[120px] text-sm ${
              isDark
                ? 'text-gray-100 placeholder-gray-500'
                : 'text-gray-900 placeholder-gray-400'
            } disabled:cursor-not-allowed`}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: isDark ? '#4b5563 #1f2937' : '#d1d5db #f3f4f6',
            }}
          />
        </div>

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={isProcessing || (!prompt.trim() && attachments.length === 0)}
          className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
            prompt.trim() || attachments.length > 0
              ? isDark
                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                : 'bg-purple-500 hover:bg-purple-600 text-white'
              : isDark
                ? 'bg-gray-700 text-gray-500'
                : 'bg-gray-200 text-gray-400'
          } ${isProcessing ? 'cursor-wait' : ''}`}
          title="发送编辑请求"
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* 附件预览区域 */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`px-3 pb-2 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}
          >
            <div className="flex flex-wrap gap-2">
              {attachments.map((att) => (
                <motion.div
                  key={att.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    isDark ? 'border-gray-600' : 'border-gray-300'
                  }`}
                >
                  <img
                    src={att.preview}
                    alt="附件"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 快捷操作按钮区域 */}
      <div
        className={`flex items-center justify-between px-3 py-2 rounded-b-lg border-t ${
          isDark
            ? 'bg-gray-800/30 border-gray-700'
            : 'bg-gray-50/50 border-gray-200'
        }`}
      >
        <div className="flex items-center gap-2">
          {/* 重置按钮 */}
          <button
            onClick={handleReset}
            disabled={isProcessing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
            } disabled:opacity-50`}
            title="重置编辑"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重置
          </button>

          {/* 编辑按钮 - 打开完整编辑器 */}
          <button
            onClick={onOpenFullEditor}
            disabled={isProcessing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
            } disabled:opacity-50`}
            title="打开完整编辑器"
          >
            <Pencil className="w-3.5 h-3.5" />
            编辑
          </button>

          {/* 快捷编辑 Tab */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
              isDark
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                : 'bg-purple-50 text-purple-600 border border-purple-200'
            }`}
          >
            <span>快捷编辑</span>
            <kbd
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                isDark ? 'bg-gray-700 text-gray-400' : 'bg-white text-gray-500'
              }`}
            >
              Tab
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 添加到对话按钮 */}
          <button
            onClick={handleAddToChat}
            disabled={isProcessing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
            } disabled:opacity-50`}
            title="添加到对话"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>添加到对话</span>
            <kbd
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                isDark ? 'bg-gray-700 text-gray-400' : 'bg-white text-gray-500'
              }`}
            >
              Ctrl
            </kbd>
          </button>

          {/* 取消按钮 */}
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              isDark
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-500'
            } disabled:opacity-50`}
          >
            <X className="w-3.5 h-3.5" />
            取消
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default QuickEditPanel;
