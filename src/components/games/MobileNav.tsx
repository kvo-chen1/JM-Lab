import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { 
  Home, 
  Gamepad2, 
  Trophy, 
  User,
  BookOpen,
  Target
} from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const { isDark } = useTheme();

  const tabs = [
    { id: 'home', icon: Home, label: '首页' },
    { id: 'games', icon: Gamepad2, label: '游戏' },
    { id: 'leaderboard', icon: Trophy, label: '排行' },
    { id: 'achievements', icon: Target, label: '成就' },
    { id: 'profile', icon: User, label: '我的' },
  ];

  return (
    <motion.div
      className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      } border-t shadow-lg`}
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'text-red-500' 
                  : isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
              whileTap={{ scale: 0.9 }}
            >
              <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform duration-300`}>
                <Icon className="w-5 h-5" />
                {isActive && (
                  <motion.div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-500"
                    layoutId="mobileNavIndicator"
                  />
                )}
              </div>
              <span className="text-xs font-medium">{tab.label}</span>
            </motion.button>
          );
        })}
      </div>
      {/* 安全区域 */}
      <div className="h-safe-area-inset-bottom" />
    </motion.div>
  );
}
