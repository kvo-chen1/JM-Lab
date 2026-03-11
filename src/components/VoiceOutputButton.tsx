import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useJinbi } from '@/hooks/useJinbi';
import { synthesize } from '@/services/voiceService';
import { toast } from 'sonner';
import { Coins } from 'lucide-react';
import JinbiInsufficientModal from '@/components/jinbi/JinbiInsufficientModal';

interface VoiceOutputButtonProps {
  text: string;
  className?: string;
}

// 语音合成消耗津币数
const VOICE_SYNTHESIS_COST = 100;

export const VoiceOutputButton: React.FC<VoiceOutputButtonProps> = ({ text, className = '' }) => {
  const { isDark } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showJinbiModal, setShowJinbiModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    balance: jinbiBalance,
    consumeJinbi,
    checkBalance,
  } = useJinbi();

  const handlePlay = useCallback(async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    if (!text.trim()) {
      toast.error('没有可朗读的内容');
      return;
    }

    // 检查津币余额
    const balanceCheck = await checkBalance(VOICE_SYNTHESIS_COST);
    if (!balanceCheck.sufficient) {
      setShowJinbiModal(true);
      return;
    }

    setIsLoading(true);
    try {
      // 消费津币
      const consumeResult = await consumeJinbi(
        VOICE_SYNTHESIS_COST,
        'audio_gen',
        '语音合成消费',
        { serviceParams: { textLength: text.length } }
      );

      if (!consumeResult.success) {
        toast.error('津币扣除失败：' + consumeResult.error);
        setIsLoading(false);
        return;
      }

      toast.success(`已消耗 ${VOICE_SYNTHESIS_COST} 津币`, { duration: 2000 });

      // 截取前200个字符进行语音合成，避免过长
      const textToSynthesize = text.slice(0, 200);
      const result = await synthesize(textToSynthesize, {
        speed: 1.0,
        pitch: 1.0,
        voice: 'zh-CN-XiaoxiaoNeural'
      });

      if (result.audioUrl) {
        audioRef.current = new Audio(result.audioUrl);
        audioRef.current.onended = () => {
          setIsPlaying(false);
        };
        audioRef.current.onerror = () => {
          setIsPlaying(false);
          toast.error('语音播放失败');
        };

        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('语音合成失败:', error);
      // 使用浏览器内置语音合成作为备选
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text.slice(0, 200));
        utterance.lang = 'zh-CN';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => {
          setIsPlaying(false);
          toast.error('语音播放失败');
        };

        speechSynthesis.speak(utterance);
      } else {
        toast.error('语音功能暂不可用');
      }
    } finally {
      setIsLoading(false);
    }
  }, [text, isPlaying, checkBalance, consumeJinbi]);

  return (
    <>
      <motion.button
        onClick={handlePlay}
        disabled={isLoading}
        className={`p-2 rounded-lg transition-all duration-200 ${
          isPlaying
            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
            : isDark
            ? 'text-gray-400 hover:text-indigo-400 hover:bg-gray-700/50'
            : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-100'
        } ${className}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title={isPlaying ? '停止朗读' : `朗读消息（消耗${VOICE_SYNTHESIS_COST}津币）`}
      >
        {isLoading ? (
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        ) : isPlaying ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <Coins className="w-3 h-3 text-amber-500" />
          </div>
        )}
      </motion.button>

      {/* 津币不足弹窗 */}
      <JinbiInsufficientModal
        isOpen={showJinbiModal}
        onClose={() => setShowJinbiModal(false)}
        requiredAmount={VOICE_SYNTHESIS_COST}
        currentBalance={jinbiBalance?.availableBalance || 0}
        serviceName="语音合成"
      />
    </>
  );
};

export default VoiceOutputButton;
