import { useTheme } from '@/hooks/useTheme';
import { useState, useCallback } from 'react';
import { Smile, Paperclip, Send } from 'lucide-react';

interface MessageEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export function MessageEditor({
  value,
  onChange,
  placeholder = '写点什么...',
  maxLength = 500,
}: MessageEditorProps) {
  const { isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (newValue.length <= maxLength) {
        onChange(newValue);
      }
    },
    [onChange, maxLength]
  );

  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.9;

  return (
    <div
      className={`relative rounded-xl border-2 transition-all ${
        isFocused
          ? 'border-red-500 ring-4 ring-red-500/10'
          : isDark
          ? 'border-gray-600'
          : 'border-gray-200'
      } ${isDark ? 'bg-gray-700/50' : 'bg-white'}`}
    >
      {/* 文本输入区 */}
      <textarea
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        rows={4}
        className={`w-full p-4 bg-transparent resize-none outline-none text-sm ${
          isDark
            ? 'text-white placeholder-gray-500'
            : 'text-gray-900 placeholder-gray-400'
        }`}
        style={{ minHeight: '100px' }}
      />

      {/* 底部工具栏 */}
      <div
        className={`flex items-center justify-between px-4 py-2 border-t ${
          isDark ? 'border-gray-600' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center gap-2">
          {/* 表情按钮 */}
          <button
            type="button"
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="添加表情"
          >
            <Smile className="w-4 h-4" />
          </button>

          {/* 附件按钮 */}
          <button
            type="button"
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="添加附件"
          >
            <Paperclip className="w-4 h-4" />
          </button>
        </div>

        {/* 字符计数 */}
        <div className="flex items-center gap-2">
          <span
            className={`text-xs ${
              isNearLimit
                ? 'text-red-500 font-medium'
                : isDark
                ? 'text-gray-500'
                : 'text-gray-400'
            }`}
          >
            {charCount}/{maxLength}
          </span>
        </div>
      </div>

      {/* 快捷提示 */}
      {isFocused && (
        <div
          className={`absolute -top-8 left-0 px-2 py-1 rounded text-xs ${
            isDark
              ? 'bg-gray-800 text-gray-400 border border-gray-700'
              : 'bg-white text-gray-500 border border-gray-200 shadow-sm'
          }`}
        >
          支持 Markdown 格式
        </div>
      )}
    </div>
  );
}

export default MessageEditor;
