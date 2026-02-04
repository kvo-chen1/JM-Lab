// src/components/chat/ChatInput.tsx

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

export interface ChatInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSend?: (message: string) => void;
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  maxLength?: number;
  showVoiceButton?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value: controlledValue,
  onChange,
  onSend,
  onVoiceStart,
  onVoiceEnd,
  placeholder = '输入你的创意想法，与AI进行多轮对话...',
  disabled = false,
  isLoading = false,
  className,
  maxLength = 2000,
  showVoiceButton = true,
}) => {
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  // 自动调整高度
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) return;
    
    if (onChange) {
      onChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  const handleSend = () => {
    if (!value.trim() || disabled || isLoading) return;
    onSend?.(value.trim());
    if (onChange) {
      onChange('');
    } else {
      setInternalValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      onVoiceEnd?.();
    } else {
      setIsRecording(true);
      onVoiceStart?.();
    }
  };

  const charCount = value.length;
  const isNearLimit = maxLength && charCount > maxLength * 0.9;

  return (
    <div className={clsx("relative", className)}>
      {/* 输入框容器 */}
      <motion.div
        className={clsx(
          "relative flex items-end gap-2 p-2 rounded-2xl transition-all duration-200",
          "bg-white border-2",
          isFocused 
            ? "border-indigo-500 shadow-lg shadow-indigo-500/10" 
            : "border-gray-200 shadow-md",
          disabled && "opacity-60 cursor-not-allowed bg-gray-50"
        )}
        animate={{
          scale: isFocused ? 1.01 : 1,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* 语音按钮 */}
        {showVoiceButton && (
          <motion.button
            type="button"
            onClick={handleVoiceToggle}
            disabled={disabled || isLoading}
            className={clsx(
              "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
              isRecording
                ? "bg-red-500 text-white animate-pulse"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800",
              (disabled || isLoading) && "opacity-50 cursor-not-allowed"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <i className={clsx(
              "fas",
              isRecording ? "fa-stop" : "fa-microphone"
            )}></i>
          </motion.button>
        )}

        {/* 文本输入区域 */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled || isLoading}
            placeholder={placeholder}
            rows={1}
            className={clsx(
              "w-full resize-none bg-transparent border-0 outline-none",
              "text-gray-800 placeholder-gray-400",
              "py-2.5 px-1",
              "min-h-[44px] max-h-[120px]",
              disabled && "cursor-not-allowed"
            )}
            style={{
              scrollbarWidth: 'thin',
            }}
          />
          
          {/* 字符计数 */}
          {maxLength && (
            <div className={clsx(
              "absolute -bottom-5 right-0 text-xs transition-colors",
              isNearLimit ? "text-red-500 font-medium" : "text-gray-400"
            )}>
              {charCount}/{maxLength}
            </div>
          )}
        </div>

        {/* 发送按钮 */}
        <motion.button
          type="button"
          onClick={handleSend}
          disabled={!value.trim() || disabled || isLoading}
          className={clsx(
            "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
            value.trim() && !disabled && !isLoading
              ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl"
              : "bg-gray-100 text-gray-400 cursor-not-allowed",
            isLoading && "cursor-wait"
          )}
          whileHover={value.trim() && !disabled && !isLoading ? { scale: 1.05 } : {}}
          whileTap={value.trim() && !disabled && !isLoading ? { scale: 0.95 } : {}}
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.i
                key="loading"
                className="fas fa-spinner fa-spin"
                initial={{ opacity: 0, rotate: -180 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 180 }}
              />
            ) : (
              <motion.i
                key="send"
                className="fas fa-paper-plane"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              />
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* 录音状态提示 */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-500 text-white rounded-full text-sm font-medium shadow-lg flex items-center gap-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            正在录音...
          </motion.div>
        )}
      </AnimatePresence>

      {/* 快捷提示 */}
      <div className="flex items-center justify-between mt-2 px-1">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <i className="fas fa-keyboard"></i>
            Enter 发送
          </span>
          <span className="flex items-center gap-1">
            <i className="fas fa-level-down-alt rotate-90"></i>
            Shift + Enter 换行
          </span>
        </div>
        
        {/* 模型选择提示 */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <i className="fas fa-robot"></i>
          <span>通义千问</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
