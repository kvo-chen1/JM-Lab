import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Gamepad2, Trophy, Users, Clock } from 'lucide-react';

interface GameHeroProps {
  title?: string;
  subtitle?: string;
}

export default function GameHero({ 
  title = "文化知识游戏", 
  subtitle = "通过游戏学习天津地方文化和中国传统文化" 
}: GameHeroProps) {
  const { isDark } = useTheme();

  const stats = [
    { icon: Gamepad2, label: '游戏类型', value: '多样化' },
    { icon: Trophy, label: '难度级别', value: '分关卡' },
    { icon: Users, label: '学习方式', value: '互动式' },
    { icon: Clock, label: '挑战模式', value: '计时赛' }
  ];

  return (
    <section 
      className="relative overflow-hidden rounded-3xl text-white"
      style={{
        minHeight: '320px',
        background: 'linear-gradient(135deg, #c21807 0%, #dc2626 50%, #ea580c 100%)'
      }}
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 网格图案 */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
        {/* 光晕效果 */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-yellow-400/10 blur-3xl" />
        {/* 装饰圆圈 */}
        <div className="absolute top-10 right-10 w-32 h-32 rounded-full border-2 border-white/20" />
        <div className="absolute bottom-10 left-10 w-24 h-24 rounded-full border-2 border-white/10" />
      </div>

      <div className="relative z-10 h-full flex flex-col justify-center px-8 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* 标题区域 */}
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Gamepad2 className="w-6 h-6" />
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
                  Beta
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 drop-shadow-lg">
                {title}
              </h1>
              <p className={`${isDark ? 'text-gray-200' : 'text-white/90'} text-base md:text-lg font-light tracking-wide max-w-xl`}>
                {subtitle}
              </p>
            </motion.div>
          </div>
        </div>

        {/* 统计卡片 */}
        <motion.div 
          className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              className="bg-black/20 backdrop-blur-md rounded-2xl px-5 py-4 ring-1 ring-white/20 hover:bg-black/30 transition-all duration-300 group cursor-pointer"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/10">
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs opacity-70 mb-0.5 tracking-wider uppercase">{stat.label}</div>
                  <div className="text-lg font-bold tracking-tight group-hover:scale-105 transition-transform origin-left">
                    {stat.value}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
