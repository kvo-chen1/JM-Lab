import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { getVoiceService, STTResult } from '../services/voiceService';
import { Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  onCommand?: (command: string, action: string) => void;
}

export default function VoiceInputButton({ onTranscript, onCommand }: VoiceInputButtonProps) {
  const { isDark } = useTheme();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const voiceService = getVoiceService();

  const startListening = useCallback(async () => {
    try {
      const success = await voiceService.startListening({
        onResult: (result: STTResult) => {
          setTranscript(result.transcript);
          if (result.isFinal) {
            onTranscript(result.transcript);
            setTranscript('');
            setIsListening(false);
          }
        },
        onCommand: (command) => {
          if (onCommand) {
            onCommand(command.command, command.action);
          }
          toast.success(`识别到命令: ${command.command}`);
        },
        onEnd: () => {
          setIsListening(false);
          setTranscript('');
        },
        onError: (error) => {
          console.error('[VoiceInput] Error:', error);
          toast.error('语音识别失败: ' + error.message);
          setIsListening(false);
        }
      });

      if (success) {
        setIsListening(true);
        toast.info('正在聆听...');
      }
    } catch (error) {
      console.error('[VoiceInput] Start failed:', error);
      toast.error('无法启动语音识别');
    }
  }, [onTranscript, onCommand, voiceService]);

  const stopListening = useCallback(() => {
    voiceService.stopListening();
    setIsListening(false);
    setTranscript('');
  }, [voiceService]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleListening}
        className={`p-2 rounded-lg transition-colors ${
          isListening
            ? 'bg-red-500 text-white'
            : isDark
              ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title={isListening ? '停止录音' : '语音输入'}
      >
        <AnimatePresence mode="wait">
          {isListening ? (
            <motion.div
              key="listening"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="relative"
            >
              <MicOff className="w-5 h-5" />
              {/* 录音动画 */}
              <motion.div
                className="absolute inset-0 rounded-full bg-red-500/30"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Mic className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* 实时转录显示 */}
      <AnimatePresence>
        {isListening && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
              isDark
                ? 'bg-gray-800 text-gray-200 border border-gray-700'
                : 'bg-white text-gray-700 border border-gray-200 shadow-lg'
            }`}
          >
            {transcript}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
