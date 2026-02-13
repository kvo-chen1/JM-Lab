import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// 海河波浪装饰
export function HaiheWaveDecoration({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute overflow-hidden pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <path
          d="M0,60 C150,120 350,0 600,60 C850,120 1050,0 1200,60 L1200,120 L0,120 Z"
          fill="currentColor"
          className="text-[#1E5F8E]/10"
        >
          <animate
            attributeName="d"
            dur="8s"
            repeatCount="indefinite"
            values="
              M0,60 C150,120 350,0 600,60 C850,120 1050,0 1200,60 L1200,120 L0,120 Z;
              M0,60 C150,0 350,120 600,60 C850,0 1050,120 1200,60 L1200,120 L0,120 Z;
              M0,60 C150,120 350,0 600,60 C850,120 1050,0 1200,60 L1200,120 L0,120 Z
            "
          />
        </path>
        <path
          d="M0,80 C200,140 400,20 600,80 C800,140 1000,20 1200,80 L1200,120 L0,120 Z"
          fill="currentColor"
          className="text-[#1E5F8E]/5"
        >
          <animate
            attributeName="d"
            dur="6s"
            repeatCount="indefinite"
            values="
              M0,80 C200,140 400,20 600,80 C800,140 1000,20 1200,80 L1200,120 L0,120 Z;
              M0,80 C200,20 400,140 600,80 C800,20 1000,140 1200,80 L1200,120 L0,120 Z;
              M0,80 C200,140 400,20 600,80 C800,140 1000,20 1200,80 L1200,120 L0,120 Z
            "
          />
        </path>
      </svg>
    </div>
  );
}

// 砖墙纹理装饰
export function BrickPatternDecoration({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`absolute inset-0 pointer-events-none opacity-5 ${className}`}
      style={{
        backgroundImage: `
          linear-gradient(90deg, #A0522D 1px, transparent 1px),
          linear-gradient(#A0522D 1px, transparent 1px)
        `,
        backgroundSize: '40px 20px'
      }}
    />
  );
}

// 天津之眼摩天轮装饰
export function TianjinEyeDecoration({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute pointer-events-none ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="relative w-32 h-32"
      >
        {/* 外圈 */}
        <div className="absolute inset-0 rounded-full border-4 border-dashed border-[#C0C5CE]/30" />
        
        {/* 辐条 */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-1/2 h-0.5 bg-[#C0C5CE]/20 origin-left"
            style={{ transform: `rotate(${i * 45}deg)` }}
          />
        ))}
        
        {/* 中心 */}
        <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-[#C0C5CE]/40 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
      </motion.div>
    </div>
  );
}

// 杨柳青年画风格装饰边框
export function YangliuqingBorder({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* 四角装饰 */}
      <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-[#228B22]/30 rounded-tl-lg" />
      <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-[#228B22]/30 rounded-tr-lg" />
      <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-[#228B22]/30 rounded-bl-lg" />
      <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-[#228B22]/30 rounded-br-lg" />
      
      {/* 内容 */}
      <div className="relative bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
        {children}
      </div>
    </div>
  );
}

// 泥人张风格装饰点
export function NirenzhangDots({ className = '' }: { className?: string }) {
  const dots = [
    { x: '10%', y: '20%', size: 'w-2 h-2', delay: 0 },
    { x: '85%', y: '15%', size: 'w-3 h-3', delay: 0.2 },
    { x: '75%', y: '80%', size: 'w-2 h-2', delay: 0.4 },
    { x: '15%', y: '75%', size: 'w-4 h-4', delay: 0.6 },
    { x: '50%', y: '10%', size: 'w-2 h-2', delay: 0.8 },
  ];

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {dots.map((dot, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full bg-[#C21807]/20 ${dot.size}`}
          style={{ left: dot.x, top: dot.y }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: dot.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

// 桂发祥麻花装饰线
export function GuifaxiangLines({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <svg className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C68E17" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#E6B84D" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#C68E17" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* 螺旋线 */}
        {[...Array(3)].map((_, i) => (
          <motion.path
            key={i}
            d={`M0,${30 + i * 20} Q300,${10 + i * 20} 600,${30 + i * 20} T1200,${30 + i * 20}`}
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, delay: i * 0.3 }}
          />
        ))}
      </svg>
    </div>
  );
}

// 风筝魏风格装饰
export function FengzhengweiKite({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      animate={{
        y: [0, -10, 0],
        rotate: [-5, 5, -5],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <svg width="60" height="80" viewBox="0 0 60 80" className="opacity-20">
        {/* 风筝主体 */}
        <path
          d="M30 0 L60 30 L30 80 L0 30 Z"
          fill="#87CEEB"
          fillOpacity="0.3"
        />
        {/* 风筝线 */}
        <line x1="30" y1="80" x2="30" y2="120" stroke="#87CEEB" strokeOpacity="0.3" strokeWidth="1" />
        {/* 装饰 */}
        <circle cx="30" cy="30" r="5" fill="#5DADE2" fillOpacity="0.5" />
      </svg>
    </motion.div>
  );
}

// 综合装饰组件
export function TianjinCultureDecorations() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* 背景装饰 */}
      <HaiheWaveDecoration className="bottom-0 left-0 right-0 h-24" />
      <BrickPatternDecoration />
      
      {/* 角落装饰 */}
      <TianjinEyeDecoration className="top-20 right-10 opacity-30" />
      <FengzhengweiKite className="top-40 left-10" />
      
      {/* 装饰点 */}
      <NirenzhangDots />
      
      {/* 装饰线 */}
      <GuifaxiangLines className="top-0 left-0 right-0 h-20" />
    </>
  );
}

export default TianjinCultureDecorations;
