import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Coins, Gift, Sparkles, History, X } from 'lucide-react';

interface WheelSegment {
  id: string;
  name: string;
  productName: string;
  points: number;
  probability: number;
  color: string;
  textColor: string;
  imageUrl?: string;
}

interface LuckyWheelProps {
  segments: WheelSegment[];
  onSpin: (segment: WheelSegment) => Promise<void>;
  currentPoints: number;
  spinCost: number;
  isSpinning: boolean;
  disabled?: boolean;
}

const LuckyWheel: React.FC<LuckyWheelProps> = ({
  segments,
  onSpin,
  currentPoints,
  spinCost,
  isSpinning,
  disabled = false,
}) => {
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [resultSegment, setResultSegment] = useState<WheelSegment | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const numSegments = segments.length;
  const segmentAngle = (2 * Math.PI) / numSegments;
  const wheelRadius = 200;

  // 绘制转盘
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    segments.forEach((segment, index) => {
      const startAngle = index * segmentAngle - Math.PI / 2;
      const endAngle = startAngle + segmentAngle;

      // 绘制扇形
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, wheelRadius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();

      // 绘制分隔线
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 绘制文字
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = segment.textColor;
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.fillText(segment.name, wheelRadius - 15, 5);
      
      // 绘制积分（商品价值）
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${segment.points}积分`, wheelRadius - 15, 18);
      ctx.restore();
    });
  }, [segments, segmentAngle]);

  // 初始化转盘
  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  // 处理抽奖
  const handleSpin = async () => {
    if (isSpinning || disabled || currentPoints < spinCost) return;

    setIsAnimating(true);

    // 根据概率随机选择结果
    const random = Math.random();
    let cumulative = 0;
    let selectedIndex = 0;

    for (let i = 0; i < segments.length; i++) {
      cumulative += segments[i].probability;
      if (random <= cumulative) {
        selectedIndex = i;
        break;
      }
    }

    // 计算旋转角度（至少旋转 5 圈）
    const extraSpins = 5 + Math.random() * 3;
    const targetAngle = (selectedIndex * segmentAngle) + (segmentAngle / 2);
    const totalRotation = (extraSpins * 2 * Math.PI) - targetAngle;
    
    const finalRotation = rotation + totalRotation;

    // 动画旋转
    const duration = 4000;
    const startTime = Date.now();
    const startRotation = rotation;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 缓动函数（ease-out-cubic）
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const currentRotation = startRotation + (totalRotation * eased);
      setRotation(currentRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setResultSegment(segments[selectedIndex]);
        setShowResult(true);
        
        // 调用父组件的抽奖回调
        onSpin(segments[selectedIndex]);
      }
    };

    requestAnimationFrame(animate);
  };

  const canAfford = currentPoints >= spinCost;

  return (
    <div className="relative">
      {/* 转盘容器 */}
      <div className="relative">
        {/* 转盘外框光晕 */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-500 via-red-500 to-purple-500 blur-xl opacity-60 animate-pulse" />
        
        {/* 转盘外框 */}
        <div className="relative rounded-full p-3 bg-gradient-to-r from-yellow-500 via-red-500 to-purple-500 shadow-2xl">
          <div className={`rounded-full p-2 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            {/* 旋转的转盘 */}
            <motion.div
              style={{ rotate: (rotation * 180) / Math.PI }}
              transition={{ ease: 'easeOut', duration: 0 }}
            >
              <canvas
                ref={canvasRef}
                width={wheelRadius * 2 + 20}
                height={wheelRadius * 2 + 20}
                className="block"
              />
            </motion.div>

            {/* 顶部指针 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-10">
              <div className="w-8 h-10">
                <div className="w-0 h-0 border-l-8 border-r-8 border-b-[40px] border-l-transparent border-r-transparent border-b-red-500 filter drop-shadow-lg" />
              </div>
            </div>

            {/* 中心装饰 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <motion.div
                className="relative"
                animate={isAnimating ? { rotate: 360 } : {}}
                transition={{ duration: 0.5, repeat: isAnimating ? Infinity : 0, ease: 'linear' }}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg flex items-center justify-center border-4 border-white">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* 抽奖按钮 */}
      <motion.button
        onClick={handleSpin}
        disabled={isSpinning || disabled || !canAfford}
        whileHover={{ scale: canAfford && !isSpinning ? 1.05 : 1 }}
        whileTap={{ scale: canAfford && !isSpinning ? 0.95 : 1 }}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 px-8 py-4 rounded-full font-bold text-lg shadow-xl transition-all ${
          canAfford && !isSpinning
            ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-red-500/50'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isSpinning ? (
          <span className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            抽奖中...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            {spinCost}积分抽奖
          </span>
        )}
      </motion.button>

      {/* 结果弹窗 */}
      <AnimatePresence>
        {showResult && resultSegment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowResult(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{ type: 'spring', damping: 15 }}
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-8 max-w-md w-full shadow-2xl text-center`}
              onClick={e => e.stopPropagation()}
            >
              {/* 庆祝动画 */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      opacity: 1, 
                      y: 0, 
                      x: Math.random() * 400 - 200,
                      scale: 0 
                    }}
                    animate={{ 
                      opacity: 0, 
                      y: -200, 
                      x: Math.random() * 400 - 200,
                      scale: Math.random() * 1.5 + 0.5
                    }}
                    transition={{ 
                      duration: 1.5, 
                      delay: i * 0.05,
                      ease: 'easeOut' 
                    }}
                    className={`absolute top-1/2 left-1/2 w-3 h-3 rounded-full ${
                      ['bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-pink-500', 'bg-blue-500'][i % 5]
                    }`}
                  />
                ))}
              </div>

              {/* 图标 */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg overflow-hidden"
              >
                {resultSegment.imageUrl ? (
                  <img 
                    src={resultSegment.imageUrl} 
                    alt={resultSegment.productName}
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/placeholder-image.svg';
                    }}
                  />
                ) : (
                  <Gift className="w-12 h-12 text-white" />
                )}
              </motion.div>

              {/* 结果文字 */}
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold mb-2"
              >
                🎉 恭喜中奖！
              </motion.h3>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-2xl p-6 mb-6`}
              >
                <div className="text-lg font-medium mb-2">{resultSegment.productName}</div>
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">
                  价值 {resultSegment.points} 积分
                </div>
              </motion.div>

              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowResult(false)}
                className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg"
              >
                开心收下
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LuckyWheel;
